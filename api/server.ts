import express from 'express';
import { MongoClient, ServerApiVersion, ObjectId } from 'mongodb';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// Standard Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
const PORT = process.env.PORT || 3000;
const uri = process.env.MONGODB_URI;
let cachedDb: any = null;
let cachedClient: MongoClient | null = null;

/**
 * MONGODB CONNECTION HANDLER (Serverless Optimized)
 */
async function getDb() {
  if (cachedDb) return cachedDb;

  if (!uri) throw new Error('MONGODB_URI environment variable is missing');

  // Handle unencoded special characters in password (your logic)
  let processedUri = uri;
  if (uri.includes('://')) {
    const protocolEnd = uri.indexOf('://') + 3;
    const remaining = uri.substring(protocolEnd);
    const lastAtIndex = remaining.lastIndexOf('@');
    if (lastAtIndex !== -1) {
      const authPart = remaining.substring(0, lastAtIndex);
      const hostPart = remaining.substring(lastAtIndex + 1);
      const [username, password] = authPart.split(':');
      if (password && password.includes('@')) {
        processedUri = `${uri.substring(0, protocolEnd)}${username}:${encodeURIComponent(password)}@${hostPart}`;
      }
    }
  }

  const client = new MongoClient(processedUri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });

  await client.connect();
  cachedClient = client;
  cachedDb = client.db('dyatra_ops');
  return cachedDb;
}

/**
 * OAUTH HELPER
 */
const getRedirectUri = (req: any) => {
  const host = req.headers['host'] || '';

  // 1. If running on your computer (localhost)
  if (host.includes('localhost') || host.includes('127.0.0.1')) {
    // We MUST use http (not https) and we use port 5173 (Vite port)
    return `http://localhost:5173/api/auth/google/callback`;
  }

  // 2. If running on the internet (Vercel)
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  return `${protocol}://${host}/api/auth/google/callback`;
};

/**
 * API ROUTES
 */

// Health Check
app.get('/api/health', async (req, res) => {
  try {
    const db = await getDb();
    res.json({ 
      status: 'ok', 
      mongodb: !!db,
      env: process.env.NODE_ENV 
    });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Google Auth URL
app.get('/api/auth/google/url', (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) return res.status(500).json({ error: 'GOOGLE_CLIENT_ID not configured' });

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getRedirectUri(req),
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'select_account'
  });

  res.json({ url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}` });
});

// Google Callback
app.get(['/auth/google/callback', '/api/auth/google/callback'], async (req, res) => {
  const { code } = req.query;
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!code || !clientId || !clientSecret) return res.status(400).send('Missing config');

  try {
    const db = await getDb();
    
    // Exchange code for tokens
    const tokenParams = new URLSearchParams({
      code: code as string,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: getRedirectUri(req),
      grant_type: 'authorization_code',
    });

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenParams.toString(),
    });
    const tokens = await tokenRes.json();

    // Get User Info
    const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const googleUser = await userRes.json();

    // Sync User in DB
    let user = await db.collection('users').findOne({ email: googleUser.email });
    if (!user) {
      const newUser = {
        email: googleUser.email,
        name: googleUser.name,
        google_id: googleUser.sub,
        avatar_url: googleUser.picture,
        role: 'user',
        created_at: new Date()
      };
      const result = await db.collection('users').insertOne(newUser);
      user = { ...newUser, _id: result.insertedId };
    }

    // Return HTML to close popup or redirect
    res.send(`
      <script>
        const user = ${JSON.stringify(user)};
        if (window.opener) {
          window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', user }, '*');
          window.close();
        } else {
          localStorage.setItem('dyatra_user', JSON.stringify(user));
          window.location.href = '/';
        }
      </script>
    `);
  } catch (error: any) {
    res.status(500).send(`Auth Error: ${error.message}`);
  }
});

/**
 * DYNAMIC CRUD ROUTES
 */
const collections = ['events', 'sessions', 'musiclog', 'videolog', 'checklist', 'locations', 'led_details', 'rentals', 'guidance', 'media', 'videosetup', 'audiosetup'];

collections.forEach(col => {
  // GET ALL
  app.get(`/api/${col}`, async (req, res) => {
    try {
      const db = await getDb();
      const data = await db.collection(col).find({}).sort({ created_at: 1 }).toArray();
      res.json(data);
    } catch (e) { res.status(500).json({ error: 'Fetch failed' }); }
  });

  // CREATE
  app.post(`/api/${col}`, async (req, res) => {
    try {
      const db = await getDb();
      const newItem = { ...req.body, created_at: new Date() };
      const result = await db.collection(col).insertOne(newItem);
      res.status(201).json({ ...newItem, _id: result.insertedId });
    } catch (e) { res.status(500).json({ error: 'Create failed' }); }
  });

  // UPDATE
  app.put(`/api/${col}/:id`, async (req, res) => {
    try {
      const db = await getDb();
      const { id } = req.params;
      const updateData = { ...req.body };
      delete updateData._id;
      await db.collection(col).updateOne({ _id: new ObjectId(id) }, { $set: updateData });
      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'Update failed' }); }
  });

  // DELETE
  app.delete(`/api/${col}/:id`, async (req, res) => {
    try {
      const db = await getDb();
      await db.collection(col).deleteOne({ _id: new ObjectId(req.params.id) });
      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'Delete failed' }); }
  });
});

/**
 * APP SETTINGS
 */
app.get('/api/settings/columns', async (req, res) => {
  try {
    const db = await getDb();
    const settings = await db.collection('app_settings').findOne({ type: 'columns' });
    res.json(settings?.data || {});
  } catch (e) { res.status(500).json({ error: 'Settings fetch failed' }); }
});

app.post('/api/settings/columns', async (req, res) => {
  try {
    const db = await getDb();
    await db.collection('app_settings').updateOne(
      { type: 'columns' },
      { $set: { data: req.body, updated_at: new Date() } },
      { upsert: true }
    );
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: 'Settings save failed' }); }
});
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 Server actually running on http://localhost:${PORT}`);
    console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
  });
}
// Final export for Vercel
export default app;