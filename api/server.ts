import express from 'express';
import { MongoClient, ServerApiVersion,ObjectId  } from 'mongodb';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(cors());
// Increase the limit to 50MB to handle large image strings
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const uri = process.env.MONGODB_URI;
let db: any = null;
let lastError: string | null = null;

async function connectDB() {
  if (!uri) {
    lastError = 'MONGODB_URI is not defined';
    console.warn(lastError);
    return;
  }

  // Masked URI for logging
  const maskedUri = uri.replace(/\/\/([^:]+):([^@]+)@/, '// $1:****@');
  console.log(`Attempting to connect to MongoDB: ${maskedUri}`);
  
  try {
    // Robust parsing for unencoded '@' in password
    let processedUri = uri;
    const protocolEnd = uri.indexOf('://');
    if (protocolEnd !== -1) {
      const remaining = uri.substring(protocolEnd + 3);
      const lastAtIndex = remaining.lastIndexOf('@');
      if (lastAtIndex !== -1) {
        const authPart = remaining.substring(0, lastAtIndex);
        const colonIndex = authPart.indexOf(':');
        if (colonIndex !== -1) {
          const password = authPart.substring(colonIndex + 1);
          if (password.includes('@')) {
            console.warn('Detected unencoded "@" in MongoDB password. Auto-encoding for connection...');
            const encodedPassword = encodeURIComponent(password);
            const username = authPart.substring(0, colonIndex);
            const hostPart = remaining.substring(lastAtIndex + 1);
            const protocol = uri.substring(0, protocolEnd + 3);
            processedUri = `${protocol}${username}:${encodedPassword}@${hostPart}`;
          }
        }
      }
    }

    // Masked processed URI for logging
    const maskedProcessedUri = processedUri.replace(/\/\/([^:]+):([^@]+)@/, '// $1:****@');
    console.log(`Final processed URI (masked): ${maskedProcessedUri}`);

    const client = new MongoClient(processedUri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
      connectTimeoutMS: 15000,
      serverSelectionTimeoutMS: 15000
    });
    
    await client.connect();
    db = client.db('dyatra_ops');
    lastError = null;
    console.log('Successfully connected to MongoDB Atlas');
    console.log(`Database name: ${db.databaseName}`);
  } catch (error) {
    lastError = error instanceof Error ? error.message : String(error);
    console.error('MongoDB connection error details:', error);
    
    if (lastError.includes('ENOTFOUND') || lastError.includes('querySrv')) {
      lastError += ' (Check your connection string and ensure special characters in password are encoded)';
    } else if (lastError.includes('authentication failed')) {
      lastError += ' (Check your Username/Password and ensure "Network Access" in Atlas allows 0.0.0.0/0)';
    }
  }
}

connectDB().catch(err => {
  lastError = err instanceof Error ? err.message : String(err);
  console.error('Failed to initiate DB connection:', err);
});

async function startServer() {

  const getRedirectUri = (req: any) => {
    const protocol = req.headers['x-forwarded-proto'] || (req.hostname === 'localhost' ? 'http' : 'https');
    const host = req.get('host');
    return `${protocol}://${host}/auth/google/callback`;
  };
  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      mongodb: !!db,
      mongodbError: lastError
    });
  });

  // Google OAuth Endpoints
   app.get('/api/auth/google/url', (req, res) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      return res.status(500).json({ error: 'GOOGLE_CLIENT_ID not configured' });
    }

    // USE THE HELPER
    const redirectUri = getRedirectUri(req);
    
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'select_account'
    });

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    res.json({ url: authUrl });
  })

   app.get(['/auth/google/callback', '/auth/google/callback/'], async (req, res) => {
    const { code } = req.query;
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!code || !clientId || !clientSecret) {
      return res.status(400).send('Missing code or configuration');
    }

    try {
      // USE THE SAME HELPER HERE - This was the bug!
      const redirectUri = getRedirectUri(req);
      
      // 1. Exchange code for tokens
      const tokenParams = new URLSearchParams({
        code: code as string,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      });

      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: tokenParams.toString(),
      });

      const tokens = await tokenResponse.json();
      if (!tokenResponse.ok) {
        console.error('Token Exchange Error:', tokens);
        throw new Error(tokens.error_description || 'Token exchange failed');
      }

      // 2. Get user info
      const userResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });

      const googleUser = await userResponse.json();
      if (!userResponse.ok) throw new Error('Failed to fetch user info');

      // 3. Sync with MongoDB
      if (!db) throw new Error('Database not connected');
      
      let user = await db.collection('users').findOne({ google_id: googleUser.sub });
      
      if (!user) {
        user = await db.collection('users').findOne({ email: googleUser.email });
        if (user) {
          await db.collection('users').updateOne(
            { _id: user._id },
            { $set: { google_id: googleUser.sub, avatar_url: googleUser.picture } }
          );
        } else {
          const newUser = {
            email: googleUser.email,
            name: googleUser.name,
            google_id: googleUser.sub,
            avatar_url: googleUser.picture,
            role: (await db.collection('users').countDocuments()) === 0 ? 'admin' : 'user',
            created_at: new Date()
          };
          const result = await db.collection('users').insertOne(newUser);
          user = { ...newUser, _id: result.insertedId };
        }
      }

     res.send(`
        <html>
          <head>
            <title>Authenticating...</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body { 
                background: #07080d; 
                color: white; 
                font-family: sans-serif; 
                display: flex; 
                flex-direction: column; 
                align-items: center; 
                justify-content: center; 
                height: 100vh; 
                margin: 0; 
              }
              .loader {
                border: 3px solid rgba(255,255,255,0.1);
                border-top: 3px solid #3b82f6;
                border-radius: 50%;
                width: 30px;
                height: 30px;
                animation: spin 1s linear infinite;
                margin-bottom: 20px;
              }
              @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            </style>
          </head>
          <body>
            <div class="loader"></div>
            <p>Completing login, please wait...</p>

            <script>
              const userData = ${JSON.stringify(user)};
              
              // 1. WEB/DESKTOP FLOW: Check if this is a popup window
              if (window.opener && window.opener !== window) {
                window.opener.postMessage({ 
                  type: 'OAUTH_AUTH_SUCCESS', 
                  user: userData 
                }, '*');
                window.close();
              } 
              // 2. MOBILE/REDIRECT FLOW: This is the main window
              else {
                // Save user data directly to localStorage so the App can read it on reload
                localStorage.setItem('dyatra_user', JSON.stringify(userData));
                // Redirect to the dashboard
                window.location.href = '/';
              }
            </script>
          </body>
        </html>
      `);
    } catch (error) {
      console.error('Google OAuth Error:', error);
      res.status(500).send(`Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });
const collections = [
  'events',
  'sessions',
  'musiclog',
  'videolog',
  'checklist',
  'locations',
  'led_details',
  'rentals',
  'guidance',
  'media',
  'videosetup',
  'audiosetup'
];

  collections.forEach(collectionName => {
    app.get(`/api/${collectionName}`, async (req, res) => {
      if (!db) return res.status(503).json({ error: 'Database not connected' });
       try {
      // CHANGE -1 TO 1 HERE
      const data = await db.collection(collectionName).find({}).sort({ created_at: 1 }).toArray();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch data' });
    }
    });

    // POST: Create new (supports blank rows)
    app.post(`/api/${collectionName}`, async (req, res) => {
      if (!db) return res.status(503).json({ error: 'Database not connected' });
      try {
        const newItem = { ...req.body, created_at: new Date() };
        const result = await db.collection(collectionName).insertOne(newItem);
        res.status(201).json({ ...newItem, _id: result.insertedId });
      } catch (error) {
        res.status(500).json({ error: 'Failed to create record' });
      }
    });

    // --- NEW: PUT (UPDATE RECORD) ---
    app.put(`/api/${collectionName}/:id`, async (req, res) => {
      if (!db) return res.status(503).json({ error: 'Database not connected' });
      try {
        const { id } = req.params;
        const updateData = { ...req.body };
        delete updateData._id; // Ensure we don't try to overwrite the immutable _id

        const result = await db.collection(collectionName).updateOne(
          { _id: new ObjectId(id) },
          { $set: updateData }
        );

        if (result.matchedCount === 0) return res.status(404).json({ error: 'Record not found' });
        res.json({ message: 'Update successful' });
      } catch (error) {
        res.status(500).json({ error: 'Failed to update record' });
      }
    });

    // --- NEW: DELETE (DELETE RECORD) ---
    app.delete(`/api/${collectionName}/:id`, async (req, res) => {
      if (!db) return res.status(503).json({ error: 'Database not connected' });
      try {
        const { id } = req.params;
        await db.collection(collectionName).deleteOne({ _id: new ObjectId(id) });
        res.json({ message: 'Deleted successfully' });
      } catch (error) {
        res.status(500).json({ error: 'Failed to delete record' });
      }
    });
  });

   // Get saved custom columns
  app.get('/api/settings/columns', async (req, res) => {
    if (!db) return res.status(503).json({ error: 'Database not connected' });
    try {
      const settings = await db.collection('app_settings').findOne({ type: 'columns' });
      res.json(settings?.data || {});
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch column settings' });
    }
  });

  // Save custom columns
  app.post('/api/settings/columns', async (req, res) => {
    if (!db) return res.status(503).json({ error: 'Database not connected' });
    try {
      await db.collection('app_settings').updateOne(
        { type: 'columns' },
        { $set: { data: req.body, updated_at: new Date() } },
        { upsert: true }
      );
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to save column settings' });
    }
  });

  // Catch-all for /api to prevent falling through to Vite/Static
  app.all('/api/*', (req, res) => {
    res.status(404).json({ error: `API route not found: ${req.method} ${req.url}` });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
