# Frontend Patterns

## The commitField / async-safe Save Pattern
React `setState` is async. Never read `editDraft` from the closure in a save handler —
it will be stale. Always build the new draft and pass it directly:

```typescript
// CORRECT — draft passed explicitly
const commitField = (col: string, val: string) => {
  const nd = { ...editDraft, [col]: val };
  setEditDraft(nd);
  handleUpdateRecord(nd); // nd passed in, not read from state
};

// WRONG — stale closure
const commitField = (col: string, val: string) => {
  setEditDraft(prev => ({ ...prev, [col]: val }));
  handleUpdateRecord(); // reads old editDraft from closure!
};
```

## The latestRef Pattern (outside-click handlers)
Event listeners added in `useEffect` close over the initial render's values.
Use a ref that's kept current to access latest state in those handlers:

```typescript
const latestRef = useRef(localSel);
latestRef.current = localSel; // updated every render

useEffect(() => {
  const h = (e: MouseEvent) => {
    // latestRef.current is always current, even though 'localSel' would be stale here
    onCommit(latestRef.current.join(', '));
  };
  document.addEventListener('mousedown', h);
  return () => document.removeEventListener('mousedown', h);
}, [onCommit]);
```

## Date Normalization
Always normalize dates when initializing edit state:
```typescript
['DateFrom', 'DateTo', 'Date'].forEach(k => {
  if (!d[k]) return;
  const raw = String(d[k]);
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return; // already correct
  if (raw.includes('T')) { d[k] = raw.split('T')[0]; return; }
  const parsed = new Date(raw);
  if (!isNaN(parsed.getTime())) d[k] = parsed.toISOString().split('T')[0];
});
```

## Sessions Field Backward Compatibility
```typescript
// Old records stored sessions as "Imported table", new records use "Sessions"
if (!d['Sessions'] && d['Imported table']) d['Sessions'] = d['Imported table'];
```

## Dropdown Options Pattern
Options are always derived fresh from the live data arrays (not hardcoded):
```typescript
const occasionOpts = [...new Set(
  events.map(e => e.Occasion).filter(Boolean)
    .flatMap(o => o.split(',').map(x => x.trim())).filter(Boolean)
)].sort();
```

## CellDropdown Usage
- Use for single-select fields: Occasion, City, Year, SessionType, Parent Event
- Pass `tagClass` to render the selected value as a styled badge in the trigger
- `onCommit(val)` is called on selection — call `commitField(col, val)` inside it
- Supports free-type "Create" option for adding new values

## SessionPicker Usage
- Use for multi-select linked session fields (`Events["Sessions"]`)
- `onCommit(val)` fires on every toggle AND on outside-click (val = comma-separated names)
- Has its own internal selection state — sync is handled by `useEffect` on `value` prop

## z-index Layers
| Layer          | z-index |
|----------------|---------|
| Table headers  | z-10    |
| Sticky columns | z-20    |
| Action toolbar | z-100   |
| LinkedSession modal | z-200 |
| Dropdowns      | z-300   |
| RecordExpandModal | z-500 |
