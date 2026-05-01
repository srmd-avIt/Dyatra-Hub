# Dyatra Hub — Claude Project Instructions

AV operations management portal for a spiritual/religious events organization.
Manages Events, Sessions, Music/Video logs, LED setups, rentals, checklists, and more.

## Quick Reference
@.claude/rules/tech-stack.md
@.claude/rules/architecture.md
@.claude/rules/data-model.md
@.claude/rules/frontend-patterns.md
@.claude/rules/api-patterns.md
@.claude/rules/ux-conventions.md

## Dev Commands
```bash
npm run dev          # starts both Vite (port 5173) and Express (port 3000) via concurrently
npm run dev:client   # Vite only
npm run dev:server   # Express (tsx api/server.ts) only
npm run build        # Vite production build
npx tsc --noEmit     # type-check without emitting
```

## Critical Rules
- **Never edit `node_modules/`**
- **All frontend logic lives in `src/App.tsx`** — do not split into separate files unless asked
- **All backend logic lives in `api/server.ts`** — single file Express server
- **Run `npx tsc --noEmit` after every edit** to catch type errors before reporting done
- **Do not commit `.env`** — it contains real credentials
