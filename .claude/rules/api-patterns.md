# API Patterns

## Endpoints
All CRUD routes are generated dynamically for each collection:

```
GET    /api/:collection          → fetch all records (sorted by created_at asc)
POST   /api/:collection          → create record (auto-adds created_at)
PUT    /api/:collection/:id      → update record ($set with full body, _id excluded)
DELETE /api/:collection/:id      → delete by ObjectId
```

Special routes:
```
GET  /api/health                 → MongoDB connection status
GET  /api/auth/google/url        → returns OAuth redirect URL
GET  /api/auth/google/callback   → OAuth callback (handles popup + redirect flows)
GET  /api/settings/columns       → fetch custom column settings
POST /api/settings/columns       → save custom column settings
```

## Frontend Fetch Pattern
```typescript
// All fetches use window.fetch (not axios)
const res = await window.fetch(`/api/${collection}/${id}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});
if (res.ok) { ... }
```

## Collection Name Mapping (Frontend → MongoDB)
Always use this switch pattern when building the collection name from `activeTable`:
```typescript
let collection = '';
switch (activeTable) {
  case 'Events':              collection = 'events'; break;
  case 'Session':             collection = 'sessions'; break;
  case 'MusicLog':            collection = 'musiclog'; break;
  case 'VideoLog':            collection = 'videolog'; break;
  case 'Tracks':              collection = 'media'; break;
  case 'DyatraChecklist':     collection = 'checklist'; break;
  case 'Guidance & Learning': collection = 'guidance'; break;
  case 'LED':                 collection = 'led_details'; break;
  case 'DataSharing':         collection = 'locations'; break;
  case 'VideoSetup':          collection = 'videosetup'; break;
  case 'AudioSetup':          collection = 'audiosetup'; break;
}
```

## MongoDB Connection
- Uses a module-level `cachedClient` / `cachedDb` pattern (serverless-safe)
- `getDb()` returns the cached DB or creates a new connection
- Database name: `dyatra_ops`
- Connection string: `process.env.MONGODB_URI`
- Special URI handling: re-encodes `@` in passwords (legacy passwords with unencoded `@`)

## Auth Flow
1. Frontend calls `GET /api/auth/google/url` → gets redirect URL
2. Opens URL in popup window
3. Google redirects to `/api/auth/google/callback?code=...`
4. Server exchanges code for tokens, fetches user info, upserts user in `users` collection
5. Callback sends HTML that posts message to opener (`window.opener.postMessage(...)`)
6. Frontend receives message, sets `localStorage.dyatra_user`, updates React state

## Environment Variables
```
MONGODB_URI            MongoDB Atlas connection string
GOOGLE_CLIENT_ID       Google OAuth client ID
GOOGLE_CLIENT_SECRET   Google OAuth client secret
VITE_GEMINI_API_KEY    Gemini API key (must be prefixed VITE_ for Vite to expose to frontend)
```
Note: The Gemini key is named `VITE_GEMINI_API_KEY` in `.env` but accessed as
`process.env.GEMINI_API_KEY` in code via the `vite.config.ts` `define` block.
