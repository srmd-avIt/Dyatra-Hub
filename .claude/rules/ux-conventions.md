# UX Conventions & Data Table Checklist

## Data Table — Basic Functionality Contract

Before reporting any table-related change as done, verify these behaviours manually or by code review:

### Row interactions
- [ ] Hovering a row shows a visible background tint (`hover:bg-blue-50/40`) — not white or invisible
- [ ] Row number fades out and checkbox + expand icon fade in on hover (opacity-0 → opacity-100 via `group-hover`)
- [ ] **Desktop**: clicking a cell enters inline edit mode for that cell only — other cells stay read-only with full formatting
- [ ] **Mobile** (`isMobileView === true`): clicking a row opens `RecordExpandModal` (wizard) — never inline edit
- [ ] Pressing `Escape` exits edit mode and discards uncommitted changes
- [ ] Pressing `Enter` on a text input saves and exits edit mode
- [ ] Clicking outside the active cell saves the current cell and deactivates edit mode

### Add Record
- [ ] **Desktop**: "Add Record" opens the `<Dialog>` modal with all fields visible
- [ ] **Mobile**: "Add Record" opens a bottom-sheet wizard (`isMobileView && isAddModalOpen`) — the Dialog is hidden on mobile (`{!isMobileView && <Dialog>}`)
- [ ] Wizard always resets to step 0 when opened (`setAddWizardStep(0)` inside `openAddModal`)
- [ ] Step progress dots are tappable to jump directly to any step

### Dropdown cells (CellDropdown)
- [ ] Dropdown panel is **always visible** when open — never clipped. Active-cell `<td>` must use `overflow-visible`, never `overflow-hidden`
- [ ] Dropdown panel renders above other table content (`z-[9999]`)
- [ ] Selected value is **centred** in the trigger, matching the read-only cell alignment
- [ ] Search input has a **white background** — never grey (`bg-white`, not `bg-slate-50`)
- [ ] Typing a value not in the list shows a **Create "X"** option
- [ ] "Add new option…" focuses the search input with a clear visual pulse
- [ ] When a value is selected, a **Clear selection** row appears at the top of the list to blank the field
- [ ] Creating a new value via the dropdown saves it to the record; it appears in future dropdowns for that field (options are derived from all records)

### Linked-record cells (SessionPicker)
- [ ] Selected sessions render as chips with × to remove each one
- [ ] A **+** button at the end opens the session picker — no ChevronDown
- [ ] Removing a chip saves immediately
- [ ] Session chips do **not** overflow into the adjacent column (`overflow-hidden` on the inner flex div)

### Date cells
- [ ] Date inputs normalise using **local** date components (`getFullYear/getMonth/getDate`), never `toISOString().split('T')[0]` — that shifts dates backwards in timezones east of UTC
- [ ] Stored values like `"1/1/2026"` (M/D/YYYY) round-trip back to the same calendar date

### Sticky columns / layout
- [ ] No column header has both `position: sticky; left: Npx` in the class **and** `position: relative` in an inline style — the inline style wins and shifts the column, creating a phantom gap
- [ ] When sticky is removed from a column, remove **both** the class (`sticky left-*`) and any related shadow/z-index overrides

### Cell formatting standards (applies to both `renderRow` and inactive cells in `renderEditInputs`)

Every table must use this taxonomy — Events is the canonical reference:

| Field type | Formatting |
|---|---|
| ID / Reference (`*Id`, `*PlayId`) | `font-mono text-brand-primary` (VideoLog IDs → `text-indigo-500`) |
| Primary name / Title | `primaryCls` — `font-semibold text-slate-900`, fallback to "Untitled …" |
| Date / Timestamp | `font-mono text-slate-700` |
| Occasion | Blue multi-badge: `bg-blue-600 text-white rounded-sm px-2` |
| City (Events) | Orange multi-badge: `bg-orange-500 text-white rounded-sm px-2` |
| City (Session) | Blue outlined: `bg-blue-50 text-blue-600 border border-blue-100 uppercase font-bold` |
| Year | Brand pill: `bg-brand-primary/10 text-brand-primary border border-brand-primary/20 font-black` |
| Sessions (Events) | Linked chips — brand-primary if session found in DB, slate if not; click opens `setLinkedSession` |
| Time Of Day | Morning → `bg-orange-50 text-orange-600`; other → `bg-blue-50 text-blue-600`; uppercase |
| SessionType | `italic text-slate-700` |
| Track name (MusicLog) | `font-bold text-brand-accent` |
| Session link (MusicLog/VideoLog) | `cursor-pointer hover:text-brand-primary hover:underline` + `ArrowUpRight` icon |
| Category badge | `bg-purple-600 text-white text-[11px] px-2` |
| Indoor/Outdoor LED | `bg-slate-800 text-white` |
| Status Yes/No | Yes → `bg-green-100 text-green-700`; No → `bg-slate-100 text-slate-500` |
| URL / Link | `text-brand-primary underline` |
| Notes / long text | `text-slate-500 italic` |
| Numeric / measurement | `font-mono text-center` |
| Empty cell | `<span className="text-slate-300 italic text-[12px]">—</span>` — never blank |

- [ ] Inactive cells in an editing row show the **same badges, colours, and formatting** as the read-only `renderRow` — not plain grey text
- [ ] Empty cells always show `—` not empty whitespace

### General
- [ ] `overflow-hidden` on a `<td>` does **not** reliably clip absolutely-positioned children (dropdowns, tooltips). Always put `overflow-hidden` on an inner `<div>`, not the `<td>` itself for flex/badge content; use `overflow-visible` on cells that contain dropdowns
- [ ] Column widths are set via `style={{ width, minWidth, maxWidth }}` — never rely on content to size columns in `table-fixed` layout
- [ ] Run `npx tsc --noEmit` after every table-related change
