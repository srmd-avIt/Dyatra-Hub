# UX Conventions & Data Table Checklist

## Data Table — Basic Functionality Contract

Before reporting any table-related change as done, verify these behaviours manually or by code review:

### Row interactions
- [ ] Hovering a row shows a visible background tint (`hover:bg-blue-50/40`) — not white or invisible
- [ ] Row number fades out and checkbox + expand icon fade in on hover (opacity-0 → opacity-100 via `group-hover`)
- [ ] Clicking a cell enters edit mode for **that cell only** — other cells in the row stay read-only with full formatting
- [ ] Pressing `Escape` exits edit mode and discards uncommitted changes
- [ ] Pressing `Enter` on a text input saves and exits edit mode
- [ ] Clicking outside the active cell saves the current cell and deactivates edit mode

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

### Inactive-cell formatting (edit mode)
- [ ] Inactive cells in an editing row show the **same badges, colours, and formatting** as the read-only `renderRow` — not plain grey text
- [ ] Occasion → blue Badge chips
- [ ] City (Events) → orange Badge chips; City (Session) → blue outlined badge
- [ ] Year → brand-primary pill badge
- [ ] Sessions → linked chips with ArrowUpRight
- [ ] Time Of Day → coloured badge (orange morning / blue other)
- [ ] Date-like fields → monospace text

### General
- [ ] `overflow-hidden` on a `<td>` does **not** reliably clip absolutely-positioned children (dropdowns, tooltips). Always put `overflow-hidden` on an inner `<div>`, not the `<td>` itself for flex/badge content; use `overflow-visible` on cells that contain dropdowns
- [ ] Column widths are set via `style={{ width, minWidth, maxWidth }}` — never rely on content to size columns in `table-fixed` layout
- [ ] Run `npx tsc --noEmit` after every table-related change
