# Tech Stack

## Frontend
- **React 19** + **TypeScript** (strict mode)
- **Vite 6** as dev server and bundler
- **Tailwind CSS v4** (via `@tailwindcss/vite` plugin — no `tailwind.config.js`)
- **shadcn/ui** components (Button, Card, Dialog, Badge, Input, Textarea, Tabs, ScrollArea, Separator)
- **lucide-react** for icons
- **motion/react** (Framer Motion) for animations
- **@google/genai** for Gemini AI chat

## Backend
- **Express 4** server (`api/server.ts`)
- **MongoDB 7** via official driver (no Mongoose)
- **Google OAuth 2.0** (manual token exchange, no Passport)
- **dotenv** for env vars

## Deployment
- **Vercel** (serverless — `export default app` at bottom of `api/server.ts`)
- The `if (process.env.NODE_ENV !== 'production') app.listen(...)` guard keeps it serverless-safe
- `vite.config.ts` proxies `/api/*` → `localhost:3000` in dev

## Key Versions
- React 19, TypeScript ~5.8, Vite 6, Tailwind 4, MongoDB driver 7, lucide-react 0.546
