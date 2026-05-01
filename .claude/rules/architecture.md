# Architecture

## File Structure
```
src/
  App.tsx          ← entire frontend (~4500+ lines, single file by design)
  types.ts         ← TypeScript interfaces (Event, LEDDetail, ChecklistItem, etc.)
  lib/gemini.ts    ← Gemini AI helper
  main.tsx         ← React entry point
api/
  server.ts        ← entire Express backend (single file)
.env               ← secrets (never commit)
vite.config.ts     ← Vite config with /api proxy
```

## App.tsx Structure (top → bottom)
1. Imports
2. `CardImageGallery` component (outside App)
3. `CellDropdown` component (outside App) — searchable dropdown with free-type create
4. `SessionPicker` component (outside App) — multi-chip linked-record picker
5. `RecordExpandModal` component (outside App) — Airtable-style expand modal
6. `RecordDetailView` component (outside App) — full-page card detail view
7. `export default function App()` — all state, handlers, and render logic
8. State declarations
9. Data fetching (`fetchAllData`, per-collection fetches)
10. CRUD handlers (`handleAddRecord`, `handleUpdateRecord`, `handleExpandedSave`, `handleDeleteRecord`)
11. `renderEditInputs()` — inline table row editor
12. `renderRow()` — read-only table row renderer
13. `getTableColumns()` — returns column list for active table
14. `getActiveData()` — returns data array for active table
15. `getProcessedData()` — applies grouping/sorting
16. Main JSX return (sidebar, header, table grid, modals)

## Why Components Live Outside App
Components defined inside `App` re-mount on every render (new function identity = React unmounts+remounts).
`CellDropdown`, `SessionPicker`, `RecordExpandModal`, `RecordDetailView` are all defined with `React.memo`
outside `App` so they have stable identity and don't lose focus/state mid-interaction.

## State Flow for Inline Editing
1. User single-clicks a row → `setEditingId(id)` + `setEditDraft(normalizedRecord)`
2. Inline editors call `commitField(col, val)` which builds `newDraft` and calls `handleUpdateRecord(newDraft)`
3. `handleUpdateRecord(draftOverride?)` uses `draftOverride ?? editDraft` to avoid stale closures
4. On success: `setEditingId(null)` + `setEditDraft(null)` + `fetchAllData()`

## State Flow for Expand Modal
1. User clicks expand icon (Maximize2) on row → `setExpandedRecord(rowData)`
2. `RecordExpandModal` maintains its own `draft` state (normalized copy of item)
3. Fields save on blur / dropdown commit → calls `onSave(draft)` → `handleExpandedSave(newDraft)`
4. `handleExpandedSave` does a PUT and calls `fetchAllData()` (does NOT close the modal)
5. Closing modal: `setExpandedRecord(null)`
