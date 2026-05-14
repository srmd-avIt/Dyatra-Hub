# Mobile Responsive Guidelines

## Breakpoint & Detection

The single breakpoint is **768px** — matches Tailwind's `sm:` prefix.

**Always use the reactive `isMobileView` state** for JS/JSX logic. Never use `window.innerWidth` inline in render or event handlers — it won't react to resizing.

```typescript
// State declaration (App.tsx:1095)
const [isMobileView, setIsMobileView] = useState(
  () => typeof window !== 'undefined' && window.innerWidth < 768
);

// Resize listener (App.tsx:1171)
useEffect(() => {
  const handleResize = () => setIsMobileView(window.innerWidth < 768);
  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);
```

**Use CSS-only** (`sm:` / `hidden sm:flex`) when the difference is purely visual (spacing, font size, column count).
**Use `isMobileView`** when the difference is behavioural (which component renders, which handler fires).

---

## Component Duality: Desktop vs Mobile

Many UI surfaces have two implementations. Keep them mutually exclusive:

| Surface | Desktop | Mobile |
|---|---|---|
| Add Record | `<Dialog>` modal | Bottom-sheet wizard |
| Row click | Inline cell edit | Opens `RecordExpandModal` |
| `RecordExpandModal` | Centered modal (`hidden sm:flex`) | Bottom sheet (`sm:hidden`) |
| Sidebar | Always visible | Collapses; closes on tab select |

```tsx
// Desktop Dialog — hidden on mobile
{!isMobileView && <Dialog open={isAddModalOpen} ...>...</Dialog>}

// Mobile wizard — only rendered on mobile
{isMobileView && isAddModalOpen && (() => { /* bottom-sheet JSX */ })()}
```

Always add `if (isMobileView) setIsSidebarOpen(false)` after tab navigation on mobile.

---

## Bottom-Sheet Anatomy

All bottom sheets must follow this exact structure:

```tsx
{/* Backdrop — click to dismiss */}
<div
  className="fixed inset-0 z-[600] flex items-end justify-center"
  style={{ backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(2px)' }}
  onClick={onClose}
>
  {/* Sheet — stop propagation */}
  <div
    className="w-full bg-white rounded-t-3xl shadow-2xl flex flex-col max-h-[92vh]"
    onClick={e => e.stopPropagation()}
  >
    {/* Drag handle */}
    <div className="flex justify-center pt-3 pb-1 shrink-0">
      <div className="w-10 h-1 bg-slate-300 rounded-full" />
    </div>

    {/* Sticky header */}
    <div className="px-5 pt-2 pb-3 flex items-start justify-between shrink-0">
      {/* title + close button */}
    </div>

    {/* Scrollable content */}
    <div className="flex-1 overflow-y-auto px-5 pb-2 min-h-0">
      {/* content */}
    </div>

    {/* Action bar — always visible, safe area aware */}
    <div
      className="px-5 py-4 border-t border-slate-100 shrink-0"
      style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}
    >
      {/* buttons */}
    </div>
  </div>
</div>
```

Key rules:
- Backdrop: `fixed inset-0` + rgba + `backdropFilter: blur(2px)`
- Sheet: `rounded-t-3xl max-h-[92vh] flex flex-col`
- Content: `flex-1 overflow-y-auto min-h-0` — the `min-h-0` is required for flex children to scroll
- Footer: always use `env(safe-area-inset-bottom)` for iPhone notch safety

---

## Add Wizard Pattern

The mobile add-record wizard is a step-based bottom sheet. Always reset to step 0 on open:

```typescript
const openAddModal = () => {
  setNewRecord({});
  setAddWizardStep(0);  // always reset — never open mid-wizard
  setIsAddModalOpen(true);
};
```

Progress dots must be **tappable** to jump to any step:
```tsx
<div
  key={i}
  onClick={() => setAddWizardStep(i)}
  className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
    i === addWizardStep ? 'bg-brand-primary flex-[2]' :
    i < addWizardStep  ? 'bg-brand-primary/40 flex-1' :
                         'bg-slate-200 flex-1'
  }`}
/>
```

Navigation buttons:
- Back/Cancel: `flex-1 h-12 border border-slate-300 rounded-2xl`
- Next/Submit: `flex-[2] h-12 bg-brand-primary text-white rounded-2xl`
- Font: `text-[12px] font-black uppercase tracking-widest`

---

## Touch Targets

Minimum tap target size: **44 × 44px** (Apple HIG / WCAG 2.5.5).

```tsx
// Too small — avoid
<button className="p-1 rounded text-xs">X</button>

// Correct
<button className="p-2.5 rounded-xl">X</button>  // 10px × 2 + icon = ~44px

// Inline icon buttons in dense tables — use invisible padding hit area
<button className="relative p-2 -m-2">...</button>
```

Close/dismiss buttons inside sheets: minimum `p-1.5 rounded-xl` (adds visual + touch area).

---

## Touch Events

Use `onTouchStart` / `onTouchMove` / `onTouchEnd` for drag/reorder interactions.
Add `touch-none select-none` to draggable elements to prevent scroll interference:

```tsx
<div
  onTouchStart={() => handleTouchStart(i)}
  onTouchMove={handleTouchMove}
  onTouchEnd={handleTouchEnd}
  className="touch-none select-none"
>
```

---

## Tailwind Responsive Conventions

| Use case | Approach |
|---|---|
| Show only on mobile | `sm:hidden` |
| Show only on desktop | `hidden sm:flex` (or `sm:block`) |
| Layout shift (1-col → 2-col) | `grid-cols-1 sm:grid-cols-2` |
| Size increase on desktop | `text-xl sm:text-3xl`, `p-4 sm:p-6` |
| Reposition on desktop | `left-3 right-3 sm:left-1/2 sm:right-auto sm:-translate-x-1/2` |

**Never use `md:` or `lg:` breakpoints** — this app is a two-state (mobile / desktop) design. Stick to `sm:` only.

**Never mix `isMobileView` and `sm:` for the same condition** — pick one. Use `sm:` for pure CSS, `isMobileView` when JS must branch.

---

## Typography & Spacing Scale

| Context | Mobile | Desktop |
|---|---|---|
| Page title | `text-xl font-black` | `sm:text-3xl font-black` |
| Card header | `p-4` | `sm:p-6` |
| Section label | `text-[9px] font-black uppercase tracking-[0.2em]` | same |
| Body text | `text-[14px]` | same |
| Table cell text | `text-[13px]` | same |
| Micro label / badge | `text-[10px]` or `text-[11px]` | same |

Wizard-specific:
- Step title: `text-[17px] font-black text-slate-900 tracking-tight leading-snug`
- Context label: `text-[9px] font-black text-brand-primary uppercase tracking-[0.2em]`

---

## Sidebar on Mobile

The sidebar must close after navigating to a tab on mobile:

```typescript
onClick={() => {
  setActiveTable(item.label);
  setViewingRecord(null);
  if (isMobileView) setIsSidebarOpen(false);
}}
```

---

## Mobile QA Checklist

Before marking any mobile-related change done, verify:

### Layout
- [ ] No horizontal scroll on pages that shouldn't scroll horizontally (check at 375px width)
- [ ] Content doesn't overflow or clip at `320px` minimum width
- [ ] No fixed `px` widths on containers that should be full-width on mobile

### Interactions
- [ ] Row click opens `RecordExpandModal` (not inline edit) when `isMobileView === true`
- [ ] "Add Record" opens the bottom-sheet wizard (not `<Dialog>`) on mobile
- [ ] Wizard always opens at step 0 (`addWizardStep === 0`)
- [ ] Progress dots are tappable to jump to any step
- [ ] Sidebar closes after tab selection on mobile
- [ ] Backdrop tap dismisses bottom sheets

### Touch
- [ ] All interactive elements have minimum 44×44px tap area
- [ ] Draggable elements use `touch-none select-none`
- [ ] No hover-only interactions (`:hover` should have a touch equivalent)

### Safe Areas
- [ ] Bottom action bars use `env(safe-area-inset-bottom)` padding
- [ ] No important UI is obscured by the iOS home indicator (bottom ~34px)

### Components
- [ ] `RecordExpandModal` renders as a bottom sheet (not centered modal) on mobile
- [ ] Dropdowns (`CellDropdown`) don't extend beyond viewport edges
- [ ] Toasts / notifications are anchored `left-3 right-3` (full-width) on mobile

### CSS / Tailwind
- [ ] Only `sm:` breakpoint used — no `md:` or `lg:`
- [ ] `isMobileView` used for JS branching; `sm:` used for visual-only differences
- [ ] No `window.innerWidth` inline in JSX or handlers
