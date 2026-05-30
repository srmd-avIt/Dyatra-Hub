import express from 'express';
import { MongoClient, ServerApiVersion, ObjectId } from 'mongodb';
import cors from 'cors';
import dotenv from 'dotenv';
import { google } from 'googleapis';
import stream from 'stream';
import crypto from 'crypto';

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
    const userCount = await db.collection('users').countDocuments();
    let user = await db.collection('users').findOne({ email: googleUser.email });
    
    if (!user) {
      if (userCount === 0) {
        // Failsafe: First user ever becomes the owner
        const newUser = {
          email: googleUser.email,
          name: googleUser.name,
          google_id: googleUser.sub,
          avatar_url: googleUser.picture,
          role: 'owner',
          created_at: new Date()
        };
        const result = await db.collection('users').insertOne(newUser);
        user = { ...newUser, _id: result.insertedId };
      } else {
        // Reject unregistered user
        res.send(`
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', error: 'Access denied. You must be added by an administrator.' }, '*');
              window.close();
            } else {
              window.location.href = '/?error=access_denied';
            }
          </script>
        `);
        return;
      }
    } else {
      await db.collection('users').updateOne({ _id: user._id }, { $set: { name: googleUser.name, avatar_url: googleUser.picture } });
      user = { ...user, name: googleUser.name, avatar_url: googleUser.picture };
    }

    // Return HTML to close popup or redirect
    res.send(`
      <script>
        const user = ${JSON.stringify(user)};
        if (window.opener) {
          window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', user }, '*');
          window.close();
        } else {
          sessionStorage.setItem('dyatra_user', JSON.stringify(user));
          window.location.href = '/';
        }
      </script>
    `);
  } catch (error: any) {
    res.status(500).send(`Auth Error: ${error.message}`);
  }
});

/**
 * GOOGLE DRIVE UPLOAD ROUTE
 */
app.post('/api/upload', async (req, res) => {
  try {
    const { imageBase64, name } = req.body;
    if (!imageBase64) return res.status(400).json({ error: 'No image provided' });

    if (!process.env.GOOGLE_REFRESH_TOKEN && (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY)) {
      return res.status(500).json({ error: 'Google Drive credentials not configured. Provide GOOGLE_REFRESH_TOKEN or Service Account details.' });
    }
    if (!process.env.GOOGLE_DRIVE_FOLDER_ID) {
      return res.status(500).json({ error: 'GOOGLE_DRIVE_FOLDER_ID not set — must be a Shared Drive folder ID' });
    }

    const matches = imageBase64.match(/^data:(.+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ error: 'Invalid base64 string' });
    }
    const mimeType = matches[1];
    const buffer = Buffer.from(matches[2], 'base64');
    const bufferStream = new stream.PassThrough();
    bufferStream.end(buffer);

    let auth;
    if (process.env.GOOGLE_REFRESH_TOKEN) {
      if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
        return res.status(500).json({ error: 'GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are required in .env when using GOOGLE_REFRESH_TOKEN' });
      }
      auth = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
      );
      auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
    } else {
      let pk = process.env.GOOGLE_PRIVATE_KEY || '';
      // Strip surrounding quotes, fix escaped newlines and carriage returns
      pk = pk.replace(/^["']|["']$/g, '').replace(/\\n/g, '\n').replace(/\r/g, '').trim();
      // Re-parse and re-export via Node crypto so OpenSSL 3.x gets a clean PKCS#8 PEM.
      // jwa@2 passes raw PEM strings to createSign().sign() which fails in Node 18+ when
      // the string has any formatting quirk. A KeyObject export is always clean.
      try {
        pk = crypto.createPrivateKey(pk).export({ type: 'pkcs8', format: 'pem' }).toString();
      } catch (keyErr: any) {
        console.error('GOOGLE_PRIVATE_KEY parse failed:', keyErr.message);
        return res.status(500).json({ error: 'GOOGLE_PRIVATE_KEY is malformed — check .env formatting' });
      }

      auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
          private_key: pk,
        },
        scopes: ['https://www.googleapis.com/auth/drive'],
      });
    }

    const drive = google.drive({ version: 'v3', auth });

    const file = await drive.files.create({
      supportsAllDrives: true,
      requestBody: {
        name: name || `upload_${Date.now()}`,
        parents: [process.env.GOOGLE_DRIVE_FOLDER_ID!],
      },
      media: { mimeType, body: bufferStream },
      fields: 'id',
    });

    if (file.data.id) {
      await drive.permissions.create({
        fileId: file.data.id,
        supportsAllDrives: true,
        requestBody: { role: 'reader', type: 'anyone' },
      });
    }

    res.json({ url: `https://drive.google.com/uc?export=view&id=${file.data.id}` });
  } catch (error: any) {
    console.error('Drive upload error:', error);
    const msg = error.message || String(error);
    const hint = msg.includes('DECODER') || msg.includes('unsupported')
      ? ' (Private key format error — check GOOGLE_PRIVATE_KEY in .env)'
      : '';
    res.status(500).json({ error: 'Failed to upload to Google Drive: ' + msg + hint });
  }
});

// crypto is imported earlier in the file; remove duplicate require to avoid conflict
// Add this to your backend file
app.get('/api/drive-proxy/:id', async (req, res) => {
  try {
    const fileId = req.params.id;

    let auth;
    if (process.env.GOOGLE_REFRESH_TOKEN) {
      auth = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID, 
        process.env.GOOGLE_CLIENT_SECRET
      );
      auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
    } else {
      // THE FIX: Use your robust key parsing logic from the upload route
      let pk = process.env.GOOGLE_PRIVATE_KEY || '';
      pk = pk.replace(/^["']|["']$/g, '').replace(/\\n/g, '\n').replace(/\r/g, '').trim();

      try {
        // This re-formats the key into a clean PKCS#8 PEM that Node 18/20 accepts
        pk = crypto.createPrivateKey(pk).export({ type: 'pkcs8', format: 'pem' }).toString();
      } catch (keyErr) {
        console.error('Private key parse failed in proxy:', (keyErr as Error).message);
        return res.status(500).send('Invalid Google Private Key formatting');
      }

      auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
          private_key: pk,
        },
        scopes: ['https://www.googleapis.com/auth/drive.readonly'],
      });
    }

    const drive = google.drive({ version: 'v3', auth });

    // Fetch metadata for mimeType
    const metadata = await drive.files.get({ 
      fileId, 
      fields: 'mimeType',
      supportsAllDrives: true 
    });
    
    // Fetch image content
    const response = await drive.files.get(
      { fileId, alt: 'media', supportsAllDrives: true },
      { responseType: 'stream' }
    );

    res.setHeader('Content-Type', metadata.data.mimeType || 'application/octet-stream');
    res.setHeader('Cache-Control', 'public, max-age=86400'); 
    response.data.pipe(res);

  } catch (error) {
    console.error('Drive Proxy Error:', (error as Error).message);
    res.status(500).send('Error loading image');
  }
});
/**
 * HELPER FUNCTIONS
 */
async function createAssignmentNotifications(db: any, collection: string, recordId: any, recordData: any, assignees: string, modifiedBy: string) {
  try {
    const assigneeList = assignees.split(',').map((s: string) => s.trim()).filter(Boolean);
    const allUsers = await db.collection('users').find({}).toArray();
    const notifs: any[] = [];
    
    for (const assignee of assigneeList) {
      const match = allUsers.find((u: any) => {
        const nameSlug = (u.name || '').replace(/\s+/g, '').toLowerCase();
        const emailSlug = (u.email || '').split('@')[0].toLowerCase();
        const assigneeLower = assignee.toLowerCase();
        return nameSlug === assigneeLower || emailSlug === assigneeLower;
      });
      
      if (match?.email) {
        notifs.push({
          recipientEmail: match.email,
          recipientName: match.name || assignee,
          type: 'assignment',
          text: `You were assigned to a record in ${collection}`,
          authorName: modifiedBy,
          recordId: recordId.toString(),
          recordTitle: recordData.title || recordData.name || 'a record',
          tableName: collection,
          collection,
          read: false,
          createdAt: new Date(),
        });
      }
    }
    
    if (notifs.length > 0) {
      await db.collection('notifications').insertMany(notifs);
    }
  } catch (err) {
    console.error('Error creating assignment notifications:', err);
  }
}

/**
 * DYNAMIC CRUD ROUTES
 */
/**
 * EQUIPMENT — atomic stock movement
 * POST /api/equipment-movement
 * Creates a movement record AND updates Available Qty + Status in one transaction.
 */
app.post('/api/equipment-movement', async (req, res) => {
  try {
    const db = await getDb();
    const { movement, equipmentId } = req.body as {
      movement: Record<string, any>;
      equipmentId: string;
    };

    if (!equipmentId || !movement) {
      return res.status(400).json({ error: 'equipmentId and movement are required' });
    }

    const movementType: string = movement['Movement Type'] || 'stock-in';
    const qty = Number(movement['Qty']) || 1;
    const isIn = movementType === 'stock-in';

    // Fetch current equipment to validate and compute new qty
    const equipment = await db.collection('equipment').findOne({ _id: new ObjectId(equipmentId) });
    if (!equipment) return res.status(404).json({ error: 'Equipment not found' });

    const currentAvail = Number(equipment['Available Qty'] ?? 0);
    if (!isIn && qty > currentAvail) {
      return res.status(400).json({ error: `Only ${currentAvail} unit(s) available for dispatch` });
    }

    const newAvail = isIn ? currentAvail + qty : currentAvail - qty;
    const reason: string = movement['Reason'] || '';
    let newStatus: string;
    if (!isIn && reason === 'Sent for Repair') {
      newStatus = 'in-repair';
    } else if (isIn && reason === 'Return from Repair') {
      newStatus = newAvail > 0 ? 'available' : 'checked-out';
    } else {
      newStatus = newAvail === 0 ? 'checked-out' : 'available';
    }

    // Insert movement record
    const movementDoc = { ...movement, created_at: new Date() };
    const mvResult = await db.collection('equipment_movements').insertOne(movementDoc);

    // Update equipment available qty + status atomically
    await db.collection('equipment').updateOne(
      { _id: new ObjectId(equipmentId) },
      { $set: { 'Available Qty': newAvail, Status: newStatus, updated_at: new Date() } }
    );

    res.status(201).json({
      movement: { ...movementDoc, _id: mvResult.insertedId },
      newAvailableQty: newAvail,
      newStatus,
    });
  } catch (e) {
    console.error('Stock movement error:', e);
    res.status(500).json({ error: 'Stock movement failed' });
  }
});

const collections = ['events', 'sessions', 'musiclog', 'videolog', 'checklist', 'locations', 'led_details', 'rentals', 'guidance', 'media', 'videosetup', 'audiosetup', 'equipment', 'equipment_movements'];

collections.forEach(col => {
  // GET ALL
  app.get(`/api/${col}`, async (req, res) => {
    try {
      const db = await getDb();
      const data = await db.collection(col).find({}).sort({ created_at: 1 }).toArray();
      res.json(data);
    } catch (e) { res.status(500).json({ error: 'Fetch failed' }); }
  });

  // GET ONE
  app.get(`/api/${col}/:id`, async (req, res) => {
    try {
      const db = await getDb();
      const item = await db.collection(col).findOne({ _id: new ObjectId(req.params.id) });
      if (!item) return res.status(404).json({ error: 'Not found' });
      res.json(item);
    } catch (e) { res.status(500).json({ error: 'Fetch failed' }); }
  });

  // CREATE
  app.post(`/api/${col}`, async (req, res) => {
    try {
      const db = await getDb();
      const modifiedBy = req.body._modifiedBy || 'Someone';
      const newItem = { ...req.body, created_at: new Date() };
      delete newItem._modifiedBy;
      const result = await db.collection(col).insertOne(newItem);
      
      const assignees = newItem.Assignee || newItem.assignee || newItem['People Involved'];
      if (assignees) {
        await createAssignmentNotifications(db, col, result.insertedId, newItem, assignees, modifiedBy);
      }

      res.status(201).json({ ...newItem, _id: result.insertedId });
    } catch (e) { res.status(500).json({ error: 'Create failed' }); }
  });

  // UPDATE
  app.put(`/api/${col}/:id`, async (req, res) => {
    try {
      const db = await getDb();
      const { id } = req.params;
      const updateData = { ...req.body };
      const modifiedBy = updateData._modifiedBy || 'Someone';
      delete updateData._id;
      delete updateData._modifiedBy;
      
      const oldItem = await db.collection(col).findOne({ _id: new ObjectId(id) });
      await db.collection(col).updateOne({ _id: new ObjectId(id) }, { $set: updateData });

      const oldAssignees = oldItem?.Assignee || oldItem?.assignee || oldItem?.['People Involved'] || '';
      const newAssignees = updateData.Assignee !== undefined ? updateData.Assignee : updateData.assignee !== undefined ? updateData.assignee : updateData['People Involved'] !== undefined ? updateData['People Involved'] : oldAssignees;

      if (newAssignees !== oldAssignees) {
        const oldList = oldAssignees.split(',').map((s: string)=>s.trim()).filter(Boolean);
        const newList = newAssignees.split(',').map((s: string)=>s.trim()).filter(Boolean);
        const added = newList.filter((a: string) => !oldList.includes(a));
        if (added.length > 0) {
          await createAssignmentNotifications(db, col, id, updateData, added.join(','), modifiedBy);
        }
      }

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
// USERS (for @mention dropdown)
app.get('/api/users', async (req, res) => {
  try {
    const db = await getDb();
    // Return full user objects so the frontend can check roles/permissions
    const users = await db.collection('users').find({}).sort({ created_at: -1 }).toArray();
    res.json(users);
  } catch (e) { res.status(500).json({ error: 'Users fetch failed' }); }
});

app.post('/api/users', async (req, res) => {
  try {
    const db = await getDb();
    const existing = await db.collection('users').findOne({ email: req.body.email });
    if (existing) {
      return res.status(400).json({ error: 'A user with this email already exists' });
    }
    const newUser = { ...req.body, created_at: new Date() };
    const result = await db.collection('users').insertOne(newUser);
    res.status(201).json({ ...newUser, _id: result.insertedId });
  } catch (e) { res.status(500).json({ error: 'User creation failed' }); }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const db = await getDb();
    const { id } = req.params;
    const updateData = { ...req.body };
    delete updateData._id;
    delete updateData.email; // Email is tied to Google OAuth, prevent overwriting
    await db.collection('users').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: 'User update failed' }); }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    const db = await getDb();
    await db.collection('users').deleteOne({ _id: new ObjectId(req.params.id) });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: 'User delete failed' }); }
});

// COMMENTS
app.get('/api/comments', async (req, res) => {
  try {
    const db = await getDb();
    const { collection, recordId } = req.query as { collection: string; recordId: string };
    if (!collection || !recordId) return res.status(400).json({ error: 'Missing params' });
    const comments = await db.collection('comments').find({ collection, recordId }).sort({ createdAt: 1 }).toArray();
    res.json(comments);
  } catch (e) { res.status(500).json({ error: 'Comments fetch failed' }); }
});

app.post('/api/comments', async (req, res) => {
  try {
    const db = await getDb();
    const { collection, recordId, text, authorId, authorName, mentions, recordTitle, tableName } = req.body;
    if (!collection || !recordId || !text) return res.status(400).json({ error: 'Missing required fields' });
    const comment = { collection, recordId, text, authorId: authorId || 'anonymous', authorName: authorName || authorId || 'Anonymous', mentions: mentions || [], createdAt: new Date() };
    const result = await db.collection('comments').insertOne(comment);

    // Respond immediately so the client isn't blocked by notification processing
    res.status(201).json({ ...comment, _id: result.insertedId });

    // Create inbox notifications for @mentioned users (fire-and-forget after response)
    if (Array.isArray(mentions) && mentions.length > 0) {
      try {
        const allUsers = await db.collection('users').find({}).toArray();
        const notifs: any[] = [];
        for (const token of mentions) {
          const match = allUsers.find((u: any) => {
            const nameSlug = (u.name || '').replace(/\s+/g, '').toLowerCase();
            const emailSlug = (u.email || '').split('@')[0].toLowerCase();
            const tokenLower = token.toLowerCase();
            return nameSlug === tokenLower || emailSlug === tokenLower;
          });
          if (match?.email) {
            notifs.push({
              recipientEmail: match.email,
              recipientName: match.name || token,
              type: 'mention',
              text,
              authorName: authorName || authorId || 'Anonymous',
              authorId: authorId || '',
              recordId,
              recordTitle: recordTitle || 'a record',
              tableName: tableName || collection,
              collection,
              read: false,
              createdAt: new Date(),
            });
          }
        }
        if (notifs.length > 0) await db.collection('notifications').insertMany(notifs);
      } catch (notifErr) {
        console.error('Notification insert failed (comment was saved):', notifErr);
      }
    }
  } catch (e) {
    console.error('Comment creation failed:', e);
    if (!res.headersSent) res.status(500).json({ error: 'Comment creation failed' });
  }
});

// NOTIFICATIONS
app.get('/api/notifications', async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    const db = await getDb();
    const { email } = req.query as { email: string };
    if (!email) return res.status(400).json({ error: 'Missing email' });
    const items = await db.collection('notifications').find({ recipientEmail: email }).sort({ createdAt: -1 }).limit(60).toArray();
    res.json(items);
  } catch (e) { res.status(500).json({ error: 'Fetch failed' }); }
});

app.patch('/api/notifications/read-all', async (req, res) => {
  try {
    const db = await getDb();
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Missing email' });
    await db.collection('notifications').updateMany({ recipientEmail: email }, { $set: { read: true } });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: 'Update failed' }); }
});

app.patch('/api/notifications/:id/read', async (req, res) => {
  try {
    const db = await getDb();
    await db.collection('notifications').updateOne({ _id: new ObjectId(req.params.id) }, { $set: { read: true } });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: 'Update failed' }); }
});

app.patch('/api/notifications/:id/clear', async (req, res) => {
  try {
    const db = await getDb();
    await db.collection('notifications').updateOne({ _id: new ObjectId(req.params.id) }, { $set: { cleared: true, read: true } });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: 'Update failed' }); }
});

app.patch('/api/notifications/clear-all', async (req, res) => {
  try {
    const db = await getDb();
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Missing email' });
    await db.collection('notifications').updateMany({ recipientEmail: email }, { $set: { cleared: true, read: true } });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: 'Update failed' }); }
});

app.delete('/api/notifications/clear-all', async (req, res) => {
  try {
    const db = await getDb();
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Missing email' });
    await db.collection('notifications').deleteMany({ recipientEmail: email });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: 'Delete failed' }); }
});

app.delete('/api/notifications/:id', async (req, res) => {
  try {
    const db = await getDb();
    await db.collection('notifications').deleteOne({ _id: new ObjectId(req.params.id) });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: 'Delete failed' }); }
});

app.delete('/api/comments/:id', async (req, res) => {
  try {
    const db = await getDb();
    await db.collection('comments').deleteOne({ _id: new ObjectId(req.params.id) });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: 'Delete failed' }); }
});

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 Server actually running on http://localhost:${PORT}`);
    console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
  });
}
// Final export for Vercel
export default app;