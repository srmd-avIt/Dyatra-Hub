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

## Mobile Detection Pattern
`isMobileView` is a React state (not a one-off check) so it stays reactive on resize:

```typescript
const [isMobileView, setIsMobileView] = useState(
  () => typeof window !== 'undefined' && window.innerWidth < 768
);

useEffect(() => {
  const handleResize = () => setIsMobileView(window.innerWidth < 768);
  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);
```

Use `isMobileView` (not `window.innerWidth` inline) in JSX and event handlers:
```typescript
// Row click — open wizard on mobile, inline edit on desktop
onClick={(e) => {
  if (isMobileView) { setExpandedRecord(row.data); return; }
  // ... inline edit logic
}}
```

## Mobile Add Wizard Pattern
`addWizardStep` controls which step is visible in the mobile bottom-sheet add wizard.
Always reset to 0 when opening:

```typescript
const [addWizardStep, setAddWizardStep] = useState(0);

const openAddModal = () => {
  setNewRecord({});
  setAddWizardStep(0);  // always start at step 0
  setIsAddModalOpen(true);
};
```

Desktop Dialog and mobile wizard are mutually exclusive:
```tsx
{/* Desktop only */}
{!isMobileView && <Dialog open={isAddModalOpen} ...>...</Dialog>}

{/* Mobile only */}
{isMobileView && isAddModalOpen && (() => { /* bottom-sheet wizard JSX */ })()}
```

## Date Normalization
Always normalize dates when initializing edit state. Use **local** date components —
`toISOString()` shifts the date back one day in timezones east of UTC:

```typescript
['DateFrom', 'DateTo', 'Date'].forEach(k => {
  if (!d[k]) return;
  const raw = String(d[k]);
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return; // already correct
  if (raw.includes('T')) { d[k] = raw.split('T')[0]; return; }
  const p = new Date(raw);
  if (!isNaN(p.getTime()))
    d[k] = `${p.getFullYear()}-${String(p.getMonth()+1).padStart(2,'0')}-${String(p.getDate()).padStart(2,'0')}`;
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
- **tagClass reference** (must match renderRow badge colours):
  - Occasion → `'bg-blue-600 text-white text-[12px] font-semibold px-2 py-0.5 rounded-sm'`
  - City (Events) → `'bg-orange-500 text-white text-[12px] font-semibold px-2 py-0.5 rounded-sm'`
  - City (Session) → `'bg-blue-50 text-blue-600 border border-blue-100 text-[11px] font-bold px-2 py-0.5 rounded uppercase'`
  - Year → `'bg-brand-primary/10 text-brand-primary text-[12px] font-black px-3 py-0.5 rounded-sm border border-brand-primary/20'`
  - Session link → `'bg-brand-primary/10 text-brand-primary text-[11px] font-semibold px-2 py-0.5 rounded-sm border border-brand-primary/20'`

## SessionPicker Usage
- Use for multi-select linked session fields (`Events["Sessions"]`)
- `onCommit(val)` fires on every toggle AND on outside-click (val = comma-separated names)
- Has its own internal selection state — sync is handled by `useEffect` on `value` prop

## RecordExpandModal Wizard (mobile editing)
- Bottom-sheet wizard triggered by `setExpandedRecord(row.data)` on mobile row click
- Steps are tappable (click progress dot to jump to any step)
- `draftRef.current` is used inside event handlers to avoid stale closure on `draft`
- `onSave(draft)` is called on every field blur / dropdown commit — modal stays open
- `onSave` + `onClose` together only on the final "Save & Close" button

## z-index Layers
| Layer                  | z-index  |
|------------------------|----------|
| Table headers          | z-10     |
| Sticky columns         | z-20     |
| Action toolbar         | z-100    |
| LinkedSession modal    | z-200    |
| Dropdowns              | z-300    |
| RecordExpandModal      | z-500    |
| Add Column modal       | z-[600]  |
| Mobile Add Wizard      | z-[600]  |
