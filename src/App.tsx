
import React, { useState, useEffect, useRef,useMemo } from 'react';
import { 
  Event, 
  MediaItem, 
  ChecklistItem, 
  LEDDetail, 
  RentalItem, 
  Guidance 
} from './types';
import { getGeminiResponse } from './lib/gemini';

// UI Components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Music, 
  Video, 
  FileText, 
  Monitor, 
  CheckSquare, 
  Truck, 
  MessageSquare, 
  Plus, 
  Search, 
  LogOut, 
  Calendar,
  MapPin,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Menu,
  X,
  Zap,
  PanelLeftClose,
  PanelLeftOpen,
  LucideWatch,
  Clock,
  LayoutGrid,
  Grid,
    ChevronLeft, 
  ChevronRight,
  Layers,
  ArrowUpDown,
  ChevronDown,
  ArrowDown,
  ArrowUp,
  ArrowUpRight,
  Check,
  Maximize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
const CardImageGallery = ({ imageString }: { imageString: string }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Extract all URLs from the Airtable string format
  const urlRegex = /\((https?:\/\/[^)]+)\)/g;
  const images: string[] = [];
  let match;
  while ((match = urlRegex.exec(imageString)) !== null) {
    images.push(match[1]);
  }

  if (images.length === 0) {
    return (
      <div className="h-44 w-full bg-[#07080d] flex flex-col items-center justify-center opacity-20">
        <Monitor className="h-10 w-10 text-slate-700" />
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">No Preview</span>
      </div>
    );
  }

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="h-44 w-full relative group/gallery overflow-hidden rounded-xl border border-slate-800 bg-black shadow-inner">
      <AnimatePresence mode="wait">
        <motion.img
          key={currentIndex}
          src={images[currentIndex]}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          className="w-full h-full object-cover"
          alt="LED Setup"
        />
      </AnimatePresence>

      {/* Navigation Arrows - Only show if more than 1 image */}
      {images.length > 1 && (
        <>
          <button 
            onClick={prevImage}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover/gallery:opacity-100 transition-opacity hover:bg-brand-primary"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button 
            onClick={nextImage}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover/gallery:opacity-100 transition-opacity hover:bg-brand-primary"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          
          {/* Image Counter Badge */}
          <div className="absolute bottom-2 right-2 bg-black/60 px-2 py-0.5 rounded text-[8px] font-black text-white uppercase tracking-widest border border-white/10">
            {currentIndex + 1} / {images.length}
          </div>
        </>
      )}
    </div>
  );
};

/** Airtable-style searchable dropdown with free-type "Create" option */
const CellDropdown = React.memo(function CellDropdown({
  value, options, onCommit, onCancel, placeholder = 'Select...', tagClass
}: {
  value: string; options: string[]; onCommit: (v: string) => void; onCancel: () => void; placeholder?: string; tagClass?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [inputHighlight, setInputHighlight] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const openRef = useRef(false);
  openRef.current = open;

  useEffect(() => { if (open) setTimeout(() => searchRef.current?.focus(), 0); }, [open]);
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (openRef.current && ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false); setSearch('');
      }
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const filtered = options.filter(o => o.toLowerCase().includes(search.toLowerCase()));
  const canCreate = !!search.trim() && !options.some(o => o.toLowerCase() === search.trim().toLowerCase());
  const pick = (val: string) => { setSearch(''); setOpen(false); onCommit(val); };
  const triggerAddNew = (e: React.MouseEvent) => {
    e.preventDefault();
    setSearch('');
    setInputHighlight(true);
    setTimeout(() => { searchRef.current?.focus(); }, 0);
    setTimeout(() => setInputHighlight(false), 800);
  };

  return (
    <div ref={ref} className="relative w-full">
      {/* Trigger — value centred, chevron pinned right */}
      <div className="w-full h-8 relative flex items-center justify-center px-6 bg-white border-2 border-blue-500 rounded-md cursor-pointer select-none" onClick={() => setOpen(v => !v)}>
        {value && tagClass
          ? <span className={`${tagClass} truncate max-w-full`}>{value}</span>
          : <span className={`text-[12px] font-medium truncate ${value ? 'text-slate-900' : 'text-slate-400'}`}>{value || placeholder}</span>
        }
        <ChevronDown className={`absolute right-2 h-3.5 w-3.5 text-slate-400 transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />
      </div>

      {open && (
        <div className="absolute z-[9999] top-full left-0 mt-1 w-full min-w-[220px] bg-white border border-slate-200 rounded-xl shadow-2xl" style={{ overflow: 'visible' }}>
          {/* Search input — always white */}
          <div className="p-2 border-b border-slate-100">
            <input
              ref={searchRef}
              className={`w-full text-[12px] px-2.5 py-1.5 rounded-lg border bg-white outline-none placeholder:text-slate-400 transition-all ${inputHighlight ? 'border-blue-400 ring-2 ring-blue-200' : 'border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100'}`}
              placeholder={inputHighlight ? 'Type name for new option…' : 'Search or type new value…'}
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Escape') { setOpen(false); onCancel(); }
                if (e.key === 'Enter') { canCreate ? pick(search.trim()) : filtered.length > 0 && pick(filtered[0]); }
              }}
            />
          </div>

          <div className="max-h-52 overflow-y-auto py-1">
            {/* Deselect row — only shown when a value is currently selected */}
            {value && !search.trim() && (
              <div className="px-3 py-2 text-[12px] cursor-pointer text-slate-400 hover:bg-red-50 hover:text-red-500 flex items-center gap-2.5 transition-colors border-b border-slate-100" onMouseDown={e => { e.preventDefault(); pick(''); }}>
                <X className="h-3.5 w-3.5 shrink-0" />
                <span>Clear selection</span>
              </div>
            )}
            {filtered.map(opt => (
              <div key={opt} className={`px-3 py-2 text-[12px] cursor-pointer flex items-center gap-2.5 transition-colors hover:bg-slate-50 ${value === opt ? 'bg-blue-50' : ''}`} onMouseDown={e => { e.preventDefault(); pick(opt); }}>
                <div className={`h-4 w-4 rounded border-2 flex items-center justify-center shrink-0 ${value === opt ? 'bg-blue-500 border-blue-500' : 'border-slate-200'}`}>
                  {value === opt && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
                </div>
                <span className={value === opt ? 'text-blue-700 font-semibold' : 'text-slate-700'}>{opt}</span>
              </div>
            ))}
            {filtered.length === 0 && !canCreate && !search.trim() && <div className="px-3 py-4 text-[12px] text-slate-400 text-center">No options yet</div>}
            {filtered.length === 0 && !canCreate && search.trim() && <div className="px-3 py-4 text-[12px] text-slate-400 text-center">No match</div>}
          </div>

          {/* Create / add-new footer */}
          <div className="border-t border-slate-100">
            {canCreate ? (
              <div className="px-3 py-2 text-[12px] cursor-pointer text-blue-600 font-semibold hover:bg-blue-50 flex items-center gap-1.5" onMouseDown={e => { e.preventDefault(); pick(search.trim()); }}>
                <Plus className="h-3.5 w-3.5" />Create &ldquo;{search.trim()}&rdquo;
              </div>
            ) : (
              <div className="px-3 py-2 text-[12px] cursor-pointer text-blue-600 font-medium hover:bg-blue-50 flex items-center gap-1.5 transition-colors" onMouseDown={triggerAddNew}>
                <Plus className="h-3.5 w-3.5" />Add new option…
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

/** Airtable-style multi-chip linked-record picker */
const SessionPicker = React.memo(function SessionPicker({
  value, allSessions, onCommit, onCancel
}: {
  value: string; allSessions: any[]; onCommit: (v: string) => void; onCancel: () => void;
}) {
  // Keep internal selection state so we always have the latest value in handlers
  const [localSel, setLocalSel] = useState<string[]>(() => value ? value.split(',').map(s => s.trim()).filter(Boolean) : []);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const latestRef = useRef(localSel);
  const openRef = useRef(false);
  latestRef.current = localSel;
  openRef.current = open;

  // Sync if parent value changes externally
  useEffect(() => {
    const next = value ? value.split(',').map(s => s.trim()).filter(Boolean) : [];
    setLocalSel(next);
  }, [value]);

  useEffect(() => { if (open) setTimeout(() => searchRef.current?.focus(), 0); }, [open]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (openRef.current && ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        onCommit(latestRef.current.join(', '));
      }
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [onCommit]);

  const toggle = (name: string) => {
    const next = localSel.includes(name) ? localSel.filter(s => s !== name) : [...localSel, name];
    setLocalSel(next);
    onCommit(next.join(', '));
  };

  const remove = (name: string, e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    const next = localSel.filter(s => s !== name);
    setLocalSel(next);
    onCommit(next.join(', '));
  };

  const filtered = allSessions.filter(s => s["Session Name"]?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div ref={ref} className="relative w-full">
      <div className="w-full min-h-8 flex flex-wrap gap-1 items-center px-1 py-1">
        {localSel.length > 0 ? localSel.map(name => (
          <span key={name} className="inline-flex items-center gap-0.5 bg-slate-100 text-slate-700 text-[11px] font-medium px-2 py-0.5 rounded border border-slate-200 leading-tight">
            {name}
            <button onMouseDown={e => remove(name, e)} className="ml-0.5 text-slate-400 hover:text-red-500 leading-none text-[13px] font-bold">&times;</button>
          </span>
        )) : <span className="text-[12px] text-slate-400">Link sessions…</span>}
        <button
          onMouseDown={e => { e.preventDefault(); setOpen(v => !v); }}
          className="inline-flex items-center justify-center h-5 w-5 rounded border border-slate-300 bg-white text-slate-500 hover:bg-slate-100 hover:border-slate-400 hover:text-brand-primary transition-colors ml-0.5 shrink-0"
          title="Add linked session"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>
      {open && (
        <div className="absolute z-[300] top-full left-0 mt-1 w-72 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden">
          <div className="p-2 border-b border-slate-100">
            <input ref={searchRef} className="w-full text-[12px] px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 placeholder:text-slate-400" placeholder="Search sessions…" value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => { if (e.key === 'Escape') { setOpen(false); onCancel(); } }} />
          </div>
          <div className="max-h-52 overflow-y-auto py-1">
            {filtered.map(s => {
              const name = s["Session Name"]; const sel = localSel.includes(name);
              return (
                <div key={name} className={`px-3 py-2 text-[12px] cursor-pointer flex items-center gap-2.5 transition-colors hover:bg-slate-50 ${sel ? 'bg-blue-50' : ''}`} onMouseDown={e => { e.preventDefault(); toggle(name); }}>
                  <div className={`h-4 w-4 rounded border-2 flex items-center justify-center shrink-0 ${sel ? 'bg-blue-500 border-blue-500' : 'border-slate-200'}`}>
                    {sel && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
                  </div>
                  <span className={sel ? 'text-blue-700 font-semibold' : 'text-slate-700'}>{name}</span>
                </div>
              );
            })}
            {filtered.length === 0 && <div className="px-3 py-4 text-[12px] text-slate-400 text-center">No sessions found</div>}
          </div>
        </div>
      )}
    </div>
  );
});

/** Airtable-style expanded record modal — desktop two-panel + mobile wizard */
const RecordExpandModal = React.memo(function RecordExpandModal({
  item, tableName, columns, sessions, events, onClose, onSave
}: {
  item: any; tableName: string; columns: string[]; sessions: any[];
  events: any[]; onClose: () => void; onSave: (draft: any) => void;
}) {
  const normalize = (raw: any) => {
    const d = { ...raw };
    ['DateFrom', 'DateTo', 'Date'].forEach(k => {
      if (!d[k]) return;
      const s = String(d[k]);
      if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return;
      if (s.includes('T')) { d[k] = s.split('T')[0]; return; }
      const p = new Date(s);
      if (!isNaN(p.getTime())) d[k] = `${p.getFullYear()}-${String(p.getMonth()+1).padStart(2,'0')}-${String(p.getDate()).padStart(2,'0')}`;
    });
    if (!d['Sessions'] && d['Imported table']) d['Sessions'] = d['Imported table'];
    return d;
  };

  const [draft, setDraft] = useState(() => normalize(item));
  const [step, setStep] = useState(0);
  const draftRef = useRef(draft);
  draftRef.current = draft;

  const isEv = tableName === 'Events';
  const isSe = tableName === 'Session';
  const isML = tableName === 'MusicLog';
  const isVL = tableName === 'VideoLog';
  const isLinked = isML || isVL;

  const commit = (col: string, val: string) => {
    const nd = { ...draftRef.current, [col]: val };
    setDraft(nd);
    onSave(nd);
  };

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose]);

  // Build wizard steps (mobile): group fields into logical sections
  const wizardSteps: { label: string; fields: string[] }[] = (() => {
    const makeGroups = (groups: { label: string; fields: string[] }[]) => {
      const filtered = groups
        .map(g => ({ ...g, fields: g.fields.filter(f => columns.includes(f)) }))
        .filter(g => g.fields.length > 0);
      const covered = new Set(filtered.flatMap(g => g.fields));
      const remaining = columns.filter(c => !covered.has(c));
      if (remaining.length > 0) filtered.push({ label: 'More Details', fields: remaining });
      return filtered;
    };
    if (isEv) return makeGroups([
      { label: 'Event Details', fields: ['Event Name', 'Venue'] },
      { label: 'Schedule', fields: ['DateFrom', 'DateTo'] },
      { label: 'Classification', fields: ['Occasion', 'City', 'Year'] },
      { label: 'Linked Sessions', fields: ['Sessions'] },
    ]);
    if (isSe) return makeGroups([
      { label: 'Session Info', fields: ['Session Name', 'Parent Event'] },
      { label: 'Schedule', fields: ['Date', 'Time Of Day'] },
      { label: 'Location', fields: ['City', 'Venue'] },
      { label: 'Type & Notes', fields: ['Occasion', 'SessionType', 'Notes'] },
    ]);
    if (isML) return makeGroups([
      { label: 'Session Context', fields: ['Session', 'Parent Event (from Session)', 'Date (from Session)'] },
      { label: 'Track Details', fields: ['Track', 'Order', 'PlayedAt', 'Theme', 'Relevance'] },
      { label: 'Notes & Remarks', fields: ['notes', 'ppgRemarks', 'topic', 'cue'] },
    ]);
    // Generic: chunk into groups of 3
    const chunks: { label: string; fields: string[] }[] = [];
    for (let i = 0; i < columns.length; i += 3)
      chunks.push({ label: `Step ${Math.floor(i / 3) + 1}`, fields: columns.slice(i, i + 3) });
    return chunks;
  })();

  const totalSteps = wizardSteps.length;
  const currentStepData = wizardSteps[Math.min(step, totalSteps - 1)] || { label: '', fields: [] };

  const linkedSessions = isEv
    ? sessions.filter((s: any) => {
        const val = draft['Sessions'] || '';
        return val.split(',').map((x: string) => x.trim()).includes(s["Session Name"]);
      })
    : [];

  const recordTitle = draft["Event Name"] || draft["Session Name"] || draft["Track"] || draft["Title"] || draft["VideoTitle"] || draft["Task"] || "Record";

  const inputCls = "w-full h-10 bg-white border border-slate-200 rounded-xl px-3.5 text-[13px] font-medium text-slate-900 placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all";
  const readonlyCls = "w-full h-10 bg-slate-50 border border-slate-100 rounded-xl px-3.5 text-[13px] text-slate-400 flex items-center italic";

  const renderField = (col: string) => {
    if (isLinked && col === 'Session') {
      return (
        <CellDropdown
          value={draft['Session'] || ''}
          options={sessions.map((s: any) => s["Session Name"])}
          onCommit={val => {
            const s = sessions.find((x: any) => x["Session Name"] === val);
            const patch: any = { Session: val };
            if (s) {
              if (isML) {
                patch["Parent Event (from Session)"] = s["Parent Event"];
                patch["Date (from Session)"] = s["Date"];
                patch["TimeOfDay (from Session)"] = s["TimeOfDay"];
                patch["Occasion (from Session)"] = s["Occasion"];
              } else {
                patch["Parent Event (from Session)"] = s["Parent Event"];
                patch["Date (from Session)"] = s["Date"];
                patch["City (from Session)"] = s["City"];
                patch["Venue (from Session)"] = s["Venue"];
                patch["TimeOfDay (from Session)"] = s["TimeOfDay"];
                patch["Occasion (from Session)"] = s["Occasion"];
                patch["SessionType (from Session)"] = s["SessionType"];
              }
            }
            const nd = { ...draftRef.current, ...patch };
            setDraft(nd); onSave(nd);
          }}
          onCancel={onClose}
          placeholder="Select session…"
          tagClass="bg-brand-primary/10 text-brand-primary text-[11px] font-semibold px-2 py-0.5 rounded-sm border border-brand-primary/20"
        />
      );
    }
    if (isLinked && col.includes('(from Session)')) {
      return <div className={readonlyCls}>{draft[col] || '—'}</div>;
    }
    if ((isEv && (col === 'DateFrom' || col === 'DateTo')) || (isSe && col === 'Date')) {
      return (
        <input type="date" className={inputCls}
          value={draft[col] || ''}
          onChange={e => { const nd = { ...draftRef.current, [col]: e.target.value }; setDraft(nd); }}
          onBlur={() => onSave(draftRef.current)}
        />
      );
    }
    if (isEv && col === 'Sessions') {
      return (
        <SessionPicker
          value={draft['Sessions'] || ''}
          allSessions={sessions}
          onCommit={val => commit('Sessions', val)}
          onCancel={onClose}
        />
      );
    }
    let opts: string[] = [];
    if (isEv && col === 'Occasion')
      opts = [...new Set(events.map((e: any) => e.Occasion).filter(Boolean).flatMap((o: string) => o.split(',').map((x: string) => x.trim())).filter(Boolean))].sort() as string[];
    else if ((isEv || isSe) && col === 'City')
      opts = [...new Set([...events.map((e: any) => e.City), ...sessions.map((s: any) => s.City)].filter(Boolean).flatMap((c: string) => c.split(',').map((x: string) => x.trim())).filter(Boolean))].sort() as string[];
    else if (isEv && col === 'Year') {
      const yr = new Date().getFullYear();
      opts = Array.from({ length: 11 }, (_, k) => String(yr + 2 - k));
    } else if (isSe && col === 'Occasion')
      opts = [...new Set(sessions.map((s: any) => s.Occasion).filter(Boolean).flatMap((o: string) => o.split(',').map((x: string) => x.trim())).filter(Boolean))].sort() as string[];
    else if (isSe && col === 'Time Of Day')
      opts = [...new Set(sessions.map((s: any) => s["Time Of Day"]).filter(Boolean))].sort() as string[];
    else if (isSe && col === 'SessionType')
      opts = [...new Set(sessions.map((s: any) => s.SessionType).filter(Boolean))].sort() as string[];
    else if (isSe && col === 'Parent Event')
      opts = events.map((e: any) => e["Event Name"]).filter(Boolean).sort() as string[];

    const tagClass =
      col === 'Occasion' ? 'bg-blue-600 text-white text-[12px] font-semibold px-2 py-0.5 rounded-sm' :
      col === 'City'     ? 'bg-orange-500 text-white text-[12px] font-semibold px-2 py-0.5 rounded-sm' :
      col === 'Year'     ? 'bg-brand-primary/10 text-brand-primary text-[12px] font-black px-3 py-0.5 rounded-sm border border-brand-primary/20' :
      undefined;

    if (opts.length > 0 || (isEv && (col === 'Occasion' || col === 'City' || col === 'Year')) || (isSe && (col === 'City' || col === 'Occasion' || col === 'Time Of Day' || col === 'SessionType' || col === 'Parent Event'))) {
      return (
        <CellDropdown
          value={draft[col] || ''}
          options={opts}
          onCommit={val => commit(col, val)}
          onCancel={onClose}
          placeholder={`Select ${col}…`}
          tagClass={tagClass}
        />
      );
    }
    if (col === 'Notes' || col === 'notes' || col === 'proposalsList' || col === 'Details' || col === 'guidanceLearning') {
      return (
        <textarea className={`${inputCls} h-28 resize-none py-2.5`}
          value={draft[col] || ''}
          onChange={e => { const nd = { ...draftRef.current, [col]: e.target.value }; setDraft(nd); }}
          onBlur={() => onSave(draftRef.current)}
          placeholder={`Enter ${col}…`}
        />
      );
    }
    return (
      <input className={inputCls}
        value={draft[col] || ''}
        onChange={e => { const nd = { ...draftRef.current, [col]: e.target.value }; setDraft(nd); }}
        onBlur={() => onSave(draftRef.current)}
        placeholder={`Enter ${col}…`}
      />
    );
  };

  const sidebarContent = (
    <>
      {isEv && (
        <div className="p-4 border-b border-slate-200">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-3">Linked Sessions</div>
          <div className="space-y-2">
            {linkedSessions.length > 0 ? linkedSessions.map((s: any) => (
              <div key={s["Session Name"]} className="p-2.5 bg-brand-primary/5 rounded-lg border border-brand-primary/10">
                <div className="text-[11px] font-bold text-brand-primary leading-tight">{s["Session Name"]}</div>
                {s["Date"] && <div className="text-[10px] text-slate-500 mt-0.5">{String(s["Date"]).split('T')[0]}</div>}
                {s["City"] && <div className="text-[10px] text-slate-500">{s["City"]}</div>}
              </div>
            )) : (
              <div className="text-[11px] text-slate-400 italic">No sessions linked yet</div>
            )}
          </div>
        </div>
      )}
      <div className="flex-1 p-4">
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-3">Activity</div>
        <div className="text-[11px] text-slate-400 italic mb-4">No comments yet.</div>
        <div className="border border-slate-200 rounded-xl p-3 bg-white shadow-sm">
          <textarea className="w-full text-[12px] bg-transparent outline-none resize-none text-slate-700 placeholder:text-slate-400" rows={3} placeholder="Start a conversation…" />
          <div className="flex justify-end mt-2">
            <button className="text-[10px] font-black text-brand-primary uppercase tracking-widest bg-brand-primary/10 px-3 py-1.5 rounded-lg hover:bg-brand-primary/20 transition-colors">Post</button>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div
      className="fixed inset-0 z-[500] flex items-end sm:items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(2px)' }}
      onClick={onClose}
    >
      {/* ── MOBILE: bottom-sheet wizard ─────────────────────────────────── */}
      <div
        className="sm:hidden w-full bg-white rounded-t-3xl shadow-2xl flex flex-col max-h-[92vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 bg-slate-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-5 pt-2 pb-3 flex items-start justify-between shrink-0">
          <div className="flex-1 min-w-0 pr-3">
            <div className="text-[9px] font-black text-brand-primary uppercase tracking-[0.2em] mb-0.5">{tableName}</div>
            <h2 className="text-[17px] font-black text-slate-900 tracking-tight leading-snug truncate">{recordTitle}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-slate-100 mt-0.5 shrink-0">
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        {/* Step progress bar */}
        <div className="px-5 pb-3 shrink-0">
          <div className="flex items-center gap-1 mb-2">
            {wizardSteps.map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full transition-all duration-300 ${
                  i === step ? 'bg-brand-primary flex-[2]' : i < step ? 'bg-brand-primary/40 flex-1' : 'bg-slate-200 flex-1'
                }`}
              />
            ))}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-brand-primary uppercase tracking-[0.15em]">
              {currentStepData.label}
            </span>
            <span className="text-[10px] font-bold text-slate-400">
              {step + 1} / {totalSteps}
            </span>
          </div>
        </div>

        {/* Fields for this step */}
        <div className="flex-1 overflow-y-auto px-5 pb-2 space-y-5 min-h-0">
          {currentStepData.fields.map(col => (
            <div key={col}>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] block mb-2">{col}</label>
              {renderField(col)}
            </div>
          ))}
        </div>

        {/* Footer nav */}
        <div className="px-5 py-4 border-t border-slate-100 shrink-0" style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setStep(s => Math.max(0, s - 1))}
              disabled={step === 0}
              className="flex-1 h-12 border border-slate-300 rounded-2xl text-[12px] font-black uppercase tracking-widest text-slate-600 disabled:opacity-25 hover:bg-slate-50 transition-colors"
            >
              Back
            </button>
            {step < totalSteps - 1 ? (
              <button
                onClick={() => setStep(s => s + 1)}
                className="flex-[2] h-12 bg-brand-primary text-white rounded-2xl text-[12px] font-black uppercase tracking-widest hover:bg-brand-primary/90 transition-colors shadow-lg shadow-brand-primary/25"
              >
                Next
              </button>
            ) : (
              <button
                onClick={() => { onSave(draftRef.current); onClose(); }}
                className="flex-[2] h-12 bg-green-600 text-white rounded-2xl text-[12px] font-black uppercase tracking-widest hover:bg-green-700 transition-colors shadow-lg shadow-green-600/25"
              >
                Save &amp; Close
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── DESKTOP: centered two-panel modal ───────────────────────────── */}
      <div
        className="hidden sm:flex flex-col bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 shrink-0">
          <div>
            <div className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5">{tableName}</div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight truncate max-w-[480px]">{recordTitle}</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-200 transition-colors ml-4">
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        {/* Body: fields + sidebar */}
        <div className="flex flex-1 overflow-hidden min-h-0">
          <div className="flex-1 overflow-y-auto p-6 space-y-4 thin-scrollbar">
            {columns.map(col => (
              <div key={col}>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] block mb-1.5">{col}</label>
                {renderField(col)}
              </div>
            ))}
          </div>
          <div className="w-64 border-l border-slate-200 flex flex-col shrink-0 overflow-y-auto thin-scrollbar bg-slate-50/50">
            {sidebarContent}
          </div>
        </div>
      </div>
    </div>
  );
});

const RecordDetailView = ({ item, columns, onBack, tableName, sessions = [], onSessionClick }: { item: any, columns: string[], onBack: () => void, tableName: string, sessions?: any[], onSessionClick?: (s: any) => void }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="w-full space-y-6 pb-20"
    >
      {/* 1. TOP NAVIGATION */}
      <div className="flex items-center gap-4 mb-8 px-4 md:px-8">
        <Button 
          variant="outline" 
          onClick={onBack}
          className="bg-white border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl px-4 shadow-sm"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to {tableName}
        </Button>
        <div className="h-6 w-px bg-slate-300 mx-2" />
        <h2 className="text-xl font-black uppercase tracking-tight flex gap-2">
          <span className="text-black">Record</span>
          <span className="text-brand-primary">Details</span>
        </h2>
      </div>

      {/* 2. CENTERED CONTAINER */}
      <div className="flex flex-col items-center w-full px-4">
        <div className="w-full max-w-4xl space-y-8">
          
          {/* Main Info Card */}
          <Card className="bg-white border-none shadow-2xl rounded-[32px] overflow-hidden ring-1 ring-slate-200">
            <CardHeader className="bg-slate-50 border-b border-slate-100 p-5 sm:p-8">
              <div className="text-[10px] font-black text-brand-primary uppercase tracking-[0.2em] mb-2">{tableName} Entry</div>
              <CardTitle className="text-xl sm:text-3xl font-black text-slate-900 uppercase tracking-tighter leading-tight">
                {item["Event Name"] || item["Session Name"] || item["Track"] || item["Title"] || item["VideoTitle"] || item["Task"] || "Detail View"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid grid-cols-1 sm:grid-cols-2">
                {columns.map((col, idx) => (
                  <div key={idx} className="p-4 sm:p-6 border-b border-r border-slate-50 flex flex-col gap-1 hover:bg-slate-50/50 transition-colors">
                    {/* UPDATED LABEL COLOR: Changed from slate-900 to slate-400 for better hierarchy */}
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] mb-0.5">
                      {col}
                    </span>
                    
                    {/* UPDATED VALUE COLOR: Changed from slate-800 to slate-900 to stand out */}
                    <div className="text-[15px] font-bold text-slate-900 break-words leading-relaxed">
                      {(() => {
                        const val = item[col];
                        
                        // Sessions column in Events detail view — clickable chips
                        if ((col === "Sessions" || col === "Imported table") && typeof val === 'string') {
                          return (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {val.split(',').map((tag, i) => {
                                const sName = tag.trim();
                                const linked = sessions.find((s: any) => s["Session Name"] === sName);
                                return (
                                  <Badge
                                    key={i}
                                    className={`text-[10px] px-2 py-0.5 uppercase ${linked ? 'bg-brand-primary/10 text-brand-primary border border-brand-primary/30 hover:bg-brand-primary/20 cursor-pointer' : 'bg-slate-100 text-slate-600 border border-slate-200 cursor-default'}`}
                                    onClick={() => { if (linked) onSessionClick?.(linked); }}
                                  >
                                    {sName}
                                  </Badge>
                                );
                              })}
                            </div>
                          );
                        }

                        // Special Rendering for "Occasion" or "City" Tags (Unchanged as requested)
                        if ((col === "Occasion" || col === "City") && typeof val === 'string') {
                          return (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {val.split(',').map((tag, i) => (
                                <Badge key={i} className={`${col === 'City' ? 'bg-orange-500' : 'bg-blue-600'} text-white text-[10px] px-2 py-0.5 uppercase border-none`}>
                                  {tag.trim()}
                                </Badge>
                              ))}
                            </div>
                          );
                        }

                        // Default rendering
                        if (!val || val === 'undefined') return <span className="text-slate-300 italic font-normal">—</span>;
                        return typeof val === 'object' ? JSON.stringify(val) : String(val);
                      })()}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Media Section */}
          {item["Images"] && (
             <Card className="bg-slate-900 border-none rounded-[32px] overflow-hidden shadow-xl">
                <CardHeader className="border-b border-white/5">
                  <CardTitle className="text-xs font-black text-white uppercase tracking-widest">Media Attachments</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                   <div className="max-w-md mx-auto">
                    <CardImageGallery imageString={item["Images"]} />
                   </div>
                </CardContent>
             </Card>
          )}
          
        </div>
      </div>
    </motion.div>
  );
};
export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
const [editDraft, setEditDraft] = useState<any>(null);
const [expandedRecord, setExpandedRecord] = useState<any>(null);
const [editingCell, setEditingCell] = useState<string | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [musicLogs, setMusicLogs] = useState<any[]>([]);
  const [videoLogs, setVideoLogs] = useState<any[]>([]);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [ledDetails, setLedDetails] = useState<LEDDetail[]>([]);
  const [rentals, setRentals] = useState<RentalItem[]>([]);
  const [guidance, setGuidance] = useState<Guidance[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [videoSetup, setVideoSetup] = useState<any[]>([]);
  const [audioSetup, setAudioSetup] = useState<any[]>([]);
  const [columnOrder, setColumnOrder] = useState<string[]>([]);
  const [groupByField, setGroupByField] = useState<string | null>(null);
const [sortBy, setSortBy] = useState<{ field: string; direction: 'asc' | 'desc' } | null>(null);
  // AI Chat State
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'ai', content: string }[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
const [viewingRecord, setViewingRecord] = useState<any>(null);
const [editingHeader, setEditingHeader] = useState<{ index: number, value: string } | null>(null);
  // UI Functionality State
  const [isGroupOpen, setIsGroupOpen] = useState(false);
const [isSortOpen, setIsSortOpen] = useState(false);
  const [activeTable, setActiveTable] = useState('Home');
  const [isAdding, setIsAdding] = useState(false);
  const [viewMode, setViewMode] = useState<'visual' | 'grid' | 'card'>('card');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [newRecord, setNewRecord] = useState<any>({});
  const [loginError, setLoginError] = useState<string | null>(null);
  const [health, setHealth] = useState<{ mongodb: boolean, mongodbError?: string } | null>(null);
const [colWidths, setColWidths] = useState<Record<string, number>>({});
const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
const handleMouseDown = (e: React.MouseEvent, columnName: string) => {
  // Prevent text selection while dragging
  e.preventDefault();
  
  const startX = e.pageX;
  const startWidth = colWidths[columnName] || 200;

  const onMouseMove = (moveEvent: MouseEvent) => {
    // Calculate new width
    const currentX = moveEvent.pageX;
    const newWidth = Math.max(80, startWidth + (currentX - startX));
    
    // Update state
    setColWidths((prev) => ({
      ...prev,
      [columnName]: newWidth
    }));
  };

  const onMouseUp = () => {
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
    document.body.style.cursor = 'default';
  };

  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
  document.body.style.cursor = 'col-resize';
};
  useEffect(() => {
    const savedUser = localStorage.getItem('dyatra_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('dyatra_user');
      }
    }
    setLoading(false);

    const checkHealth = async () => {
      try {
        const res = await window.fetch('/api/health');
        if (!res.ok) {
          console.warn('Health check returned non-OK status:', res.status);
          return;
        }
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await res.json();
          setHealth(data);
        } else {
          console.warn('Health check returned non-JSON content:', await res.text());
        }
      } catch (e) {
        console.error('Health check failed:', e);
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 5000);
    return () => clearInterval(interval);
  }, []);

  const isConfigured = health?.mongodb; // Only require MongoDB for general operation
// Add these to your existing useState hooks
const [imageManager, setImageManager] = useState<{ 
  item: any, 
  column: string, 
  isOpen: boolean 
} | null>(null);

const attachmentFileInputRef = useRef<HTMLInputElement>(null);

const handleImageUpdate = async (updatedString: string) => {
  if (!imageManager?.item) return;

  // Ensure we use the correct ID field for MongoDB
  const recordId = imageManager.item._id || imageManager.item.id;
  
  const updatedItem = { 
    ...imageManager.item, 
    ["Images"]: updatedString 
  };
  
  let collection = '';
  // Ensure "LED" matches your activeTable state exactly
  switch (activeTable) {
    case 'LED': collection = 'led_details'; break;
    case 'Session': collection = 'sessions'; break;
    case 'Events': collection = 'events'; break;
    case 'MusicLog': collection = 'musiclog'; break;
    case 'Tracks': collection = 'media'; break;
    default: collection = activeTable.toLowerCase();
  }

  try {
    const response = await window.fetch(`/api/${collection}/${recordId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedItem)
    });

    if (response.ok) {
      // 1. Update the local modal state so the user sees the new image immediately
      setImageManager(prev => prev ? { ...prev, item: updatedItem } : null);
      
      // 2. Refresh the main data grid
      await fetchAllData(); 
      console.log("Image updated successfully");
    } else {
      const errorData = await response.text();
      console.error("Server refused update:", errorData);
      alert("Failed to save image to database.");
    }
  } catch (error) {
    console.error("Upload Error:", error);
  }
};


const [selectedIds, setSelectedIds] = useState<string[]>([]);
const [isActionToolbarOpen, setIsActionToolbarOpen] = useState(false);

const toggleRowSelection = (id: string) => {
  setSelectedIds(prev => 
    prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
  );
};

const handleBulkDelete = async () => {
  if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} records?`)) return;
  
  let collection = '';
  switch (activeTable) {
    case 'Events': collection = 'events'; break;
    case 'Session': collection = 'sessions'; break;
    case 'MusicLog': collection = 'musiclog'; break;
    // ... add your other collection mappings ...
  }

  try {
    // Note: This assumes your API supports bulk delete or you loop through
    for (const id of selectedIds) {
      await window.fetch(`/api/${collection}/${id}`, { method: 'DELETE' });
    }
    setSelectedIds([]);
    fetchAllData();
  } catch (e) {
    console.error("Delete failed", e);
  }
};

const handleDeleteColumn = (colToDelete: string) => {
  // Confirm with user
  if (!window.confirm(`Are you sure you want to remove the column "${colToDelete}"? This will hide the data for this field.`)) {
    return;
  }

  const currentExtras = extraColumns[activeTable] || [];
  const updatedExtras = currentExtras.filter(col => col !== colToDelete);

  const newExtraObj = {
    ...extraColumns,
    [activeTable]: updatedExtras
  };

  // 1. Update Local State
  setExtraColumns(newExtraObj);
  
  // 2. Save to Backend
  saveExtraColumns(newExtraObj);
};
// Find getActiveData around line 185 and update the Tracks case:
const getActiveData = () => {
  switch (activeTable) {
    case 'Events': return events;
    case 'Session': return sessions;
    case 'MusicLog': return musicLogs;
    case 'VideoLog': return videoLogs;
    case 'Guidance & Learning': return guidance;
    case 'LED': return ledDetails;
    case 'DyatraChecklist': return checklist;
    case 'DataSharing': return locations;
    case 'VideoSetup': return videoSetup;
    case 'AudioSetup': return audioSetup;
    case 'Tracks': 
      // This more inclusive filter checks for type OR the existence of a Title
      return media.filter((m: any) => 
        m.type === 'track' || m.Type === 'track' || m["Title"]
      );
    default: return [];
  }
};

const AttachmentManagerDialog = ({ manager, onClose, onUpdate }: any) => {
  const [localImages, setLocalImages] = useState<string[]>([]);
  const internalFileRef = useRef<HTMLInputElement>(null);

  // Load images into local state when modal opens
  useEffect(() => {
    if (manager?.isOpen && manager?.item) {
      const urlRegex = /\((https?:\/\/[^)]+)\)/g;
      const images: string[] = [];
      let match;
      const rawValue = manager.item[manager.column] || "";
      while ((match = urlRegex.exec(rawValue)) !== null) {
        images.push(match[1]);
      }
      setLocalImages(images);
    }
  }, [manager?.isOpen, manager?.item]);

  if (!manager) return null;

  // 1. ADD IMAGE
const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  // Check file size (optional safety check)
  if (file.size > 10 * 1024 * 1024) {
    alert("File is too large (Max 10MB)");
    return;
  }

  const reader = new FileReader();
  reader.onloadend = () => {
    const base64String = reader.result as string;
    
    // 1. Update the local UI state
    const next = [...localImages, base64String];
    setLocalImages(next);
    
    // 2. Create the Airtable-style string: (url) (url)
    const updatedString = next.map(url => `(${url})`).join(' ');
    
    // 3. Call your handleImageUpdate function
    onUpdate(updatedString);
  };
  
  reader.readAsDataURL(file); // This triggers the conversion to string
};

  // 2. REMOVE IMAGE
  const handleRemove = (index: number) => {
    const next = [...localImages];
    next.splice(index, 1);
    setLocalImages(next);
    onUpdate(next.map(url => `(${url})`).join(' '));
  };

  // 3. DOWNLOAD
  const handleDownload = (url: string) => {
    window.open(url, '_blank');
  };

  // 4. RENAME (Simulated logic for filename)
  const handleRename = (index: number) => {
    const newName = prompt("Enter new name for this attachment:");
    if (newName) alert("Renamed to: " + newName + " (Note: Airtable strings only store URLs, naming is metadata)");
  };

  return (
    <Dialog open={manager.isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[750px] bg-white border-none rounded-[32px] p-0 overflow-hidden shadow-2xl z-[100]">
        <DialogHeader className="p-8 bg-slate-50 border-b border-slate-100">
          <div className="flex items-center gap-2 text-brand-primary mb-1">
             <Monitor className="h-4 w-4" />
             <span className="text-[10px] font-black uppercase tracking-widest">{manager.column} Manager</span>
          </div>
          <DialogTitle className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Manage Attachments</DialogTitle>
          
          <button 
            onClick={() => internalFileRef.current?.click()}
            className="mt-6 flex items-center gap-2 bg-brand-primary text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase hover:opacity-90 shadow-lg shadow-brand-primary/20 transition-all active:scale-95"
          >
            <Plus className="h-4 w-4" /> Attach file
          </button>
          <input type="file" ref={internalFileRef} className="hidden" onChange={handleUpload} />
        </DialogHeader>

        <ScrollArea className="h-[480px] p-8 bg-white">
          <div className="grid grid-cols-2 gap-6">
            {localImages.map((url, i) => (
              <div key={i} className="group/item relative space-y-2">
                <div className="relative aspect-video rounded-[20px] overflow-hidden border border-slate-200 bg-slate-100 shadow-sm transition-all hover:shadow-md">
                  <img src={url} className="w-full h-full object-cover" alt="Attachment" />
                  
                  {/* ACTIONS OVERLAY */}
                  <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover/item:opacity-100 transition-all duration-200 flex items-center justify-center gap-2 backdrop-blur-[2px]">
                    <button onClick={() => handleRename(i)} className="p-2.5 bg-white rounded-xl text-slate-700 hover:bg-brand-primary hover:text-white shadow-xl transition-all" title="Rename"><FileText className="h-4 w-4" /></button>
                    <button onClick={() => handleDownload(url)} className="p-2.5 bg-white rounded-xl text-slate-700 hover:bg-brand-primary hover:text-white shadow-xl transition-all" title="Download"><ArrowDown className="h-4 w-4" /></button>
                    <button onClick={() => handleRemove(i)} className="p-2.5 bg-white rounded-xl text-red-500 hover:bg-red-500 hover:text-white shadow-xl transition-all" title="Remove"><X className="h-4 w-4" /></button>
                  </div>
                </div>
                <p className="text-[10px] font-bold text-slate-400 px-2 truncate uppercase tracking-tighter">ATTACHMENT_{i+1}.JPG</p>
              </div>
            ))}
            {localImages.length === 0 && (
              <div className="col-span-2 py-32 text-center text-slate-300 italic font-medium uppercase text-xs tracking-widest opacity-50">No files attached</div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
const saveExtraColumns = async (updatedColumns: Record<string, string[]>) => {
  try {
    await window.fetch('/api/settings/columns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedColumns)
    });
  } catch (error) {
    console.error("Failed to save column settings:", error);
  }
};

useEffect(() => {
  const loadColumns = async () => {
    try {
      const response = await window.fetch('/api/settings/columns');
      if (response.ok) {
        const data = await response.json();
        setExtraColumns(data || {});
      }
    } catch (error) {
      console.error("Failed to load columns:", error);
    }
  };
  
  if (user) loadColumns();
}, [user]);
const filteredData = getActiveData().filter((item: any) => {
  // --- 1. FILTER BY ACTIVE EVENT ---
  if (selectedEventId) {
    const selectedName = selectedEventId.toLowerCase();
    
    if (activeTable === 'Events') {
      const name = (item["Event Name"] || item.EventName || item.name || "").toLowerCase();
      if (name !== selectedName) return false;
    } else {
      // For Sessions, MusicLog, VideoLog, etc. match the parent event field
      const parent = (item.parentEvent || item.event || "").toLowerCase();
      if (parent !== selectedName) return false;
    }
  }

  const searchStr = searchQuery.toLowerCase();
  if (!searchStr) return true;
  
  if (activeTable === 'Session') {
  return (
    item["Session Name"]?.toLowerCase().includes(searchStr) || 
    item["Parent Event"]?.toLowerCase().includes(searchStr) || 
    item["Venue"]?.toLowerCase().includes(searchStr) || 
    item["City"]?.toLowerCase().includes(searchStr) ||
    item["Occasion"]?.toLowerCase().includes(searchStr)
  );
}
  
 if (activeTable === 'MusicLog') {
  return (
    item["Track"]?.toLowerCase().includes(searchStr) || 
    item["Session"]?.toLowerCase().includes(searchStr) || 
    item["PlayID"]?.toString().includes(searchStr) ||
    item["Theme"]?.toLowerCase().includes(searchStr)
  );
}

  if (activeTable === 'Events') {
    return (
      item["Event Name"]?.toLowerCase().includes(searchStr) || 
      (item["Sessions"] || item["Imported table"])?.toLowerCase().includes(searchStr) ||
      item["Year"]?.toString().includes(searchStr)
    );
  }

if (activeTable === 'VideoLog') {
  return (
    item["VideoTitle"]?.toLowerCase().includes(searchStr) || 
    item["Session"]?.toLowerCase().includes(searchStr) || 
    item["VideoPlayId"]?.toString().includes(searchStr) ||
    item["Parent Event (from Session)"]?.toLowerCase().includes(searchStr)
  );
}

if (activeTable === 'Guidance & Learning') {
  return (
    item["Guidance/Learning"]?.toLowerCase().includes(searchStr) || 
    item["Event"]?.toLowerCase().includes(searchStr) || 
    item["Category"]?.toLowerCase().includes(searchStr) ||
    item["GuidanceFrom"]?.toLowerCase().includes(searchStr)
  );
}
if (activeTable === 'LED') {
  return (
    item["🕘 Session"]?.toLowerCase().includes(searchStr) || 
    item["Vendor"]?.toLowerCase().includes(searchStr) || 
    item["LedId"]?.toString().includes(searchStr) ||
    item["CentreLed"]?.toLowerCase().includes(searchStr)
  );
}

if (activeTable === 'DyatraChecklist') {
  return (
    item["Task"]?.toLowerCase().includes(searchStr) || 
    item["Category"]?.toLowerCase().includes(searchStr) || 
    item["TaskGroup"]?.toLowerCase().includes(searchStr) ||
    item["Details"]?.toLowerCase().includes(searchStr)
  );
}

if (activeTable === 'DataSharing') {
  return (
    item["Sevak"]?.toLowerCase().includes(searchStr) || 
    item["Dept"]?.toLowerCase().includes(searchStr) || 
    item["EmailId"]?.toLowerCase().includes(searchStr)
  );
}

if (activeTable === 'Tracks') {
  return (
    (item["Title"] || "").toLowerCase().includes(searchStr) || 
    (item["Artist"] || "").toLowerCase().includes(searchStr) || 
    (item["Album"] || "").toLowerCase().includes(searchStr) ||
    (item["Tags"] || "").toLowerCase().includes(searchStr)
  );
}
  return Object.values(item).some(val => 
    typeof val === 'string' && val.toLowerCase().includes(searchStr)
  );
});
const [extraColumns, setExtraColumns] = useState<Record<string, string[]>>({});

const getTableColumns = () => {
  let baseCols: string[] = []; // Initialize as an array of strings
  
  switch (activeTable) {
    case 'Events':
      baseCols = ['Event Name', 'DateFrom', 'DateTo', 'Occasion', 'City', 'Venue', 'Sessions', 'Year'];
      break;
    case 'Session': 
      baseCols = ['Session Name', 'Parent Event', 'Date', 'City', 'Venue', 'Time Of Day', 'Occasion', 'SessionType', 'Notes']; 
      break;
    case 'MusicLog': 
      baseCols = ['PlayID', 'Session', 'Parent Event (from Session)', 'Date (from Session)', 'TimeOfDay (from Session)', 'Occasion (from Session)', 'Order', 'PlayedAt', 'Track', 'Theme', 'Relevance', 'Patrank', 'Topic', 'Cue', 'Notes', 'PPG', 'TrackID'];
      break;
    case 'Tracks': 
      baseCols = ['Title', 'Artist', 'Album', 'Duration', 'DurationTime', 'BPM', 'Key', 'Source', 'FileLink', 'Tags', 'Lyrics', 'LexiconID', 'LastUpdated', 'Plays'];
      break;
    case 'VideoLog': 
      baseCols = ['VideoPlayId', 'Session', 'Date (from Session)', 'City (from Session)', 'Venue (from Session)', 'Parent Event (from Session)', 'TimeOfDay (from Session)', 'Occasion (from Session)', 'SessionType (from Session)', 'VideoTitle', 'Duration', 'ProposalsList'];
      break;
    case 'Guidance & Learning': 
      baseCols = ['LearningId', 'Event', 'DateFrom (from Event)', 'DateTo (from Event)', 'Year (from Event)', 'City', 'GuidanceFrom', 'Guidance/Learning', 'Category', 'Attachments'];
      break;
    case 'LED': 
      baseCols = ['LedId', '🕘 Session', 'Parent Event (from 🕘 Session)', 'Date (from 🕘 Session)', 'City (from 🕘 Session)', 'Venue (from 🕘 Session)', 'Indoor/Outdoor LED?', 'CentreLed', 'CntrPitch', 'CntrWdth', 'CntrHt', 'CntrRiser', 'Stageht', 'SideLed', 'SidePitch', 'SideWdth', 'SideHt', 'OtherLed1', 'OtherPitch', 'OtherWdth', 'OtherHt', 'OtherLed2', 'is Led Required?', 'Other2Wdth', 'Other2Ht', 'DGUseedKva', 'BackupPower', 'Vendor', 'Images'];
      break;
    case 'DyatraChecklist': 
      baseCols = ['Task', 'Details', 'TaskGroup', 'OrderId', 'People Involved', 'Typical Timeline', 'Category', 'Period', 'Attachment'];
      break;
    case 'DataSharing': 
      baseCols = ['Sevak', 'Dept', 'EmailId', 'ShareFacts?', 'ShareData'];
      break;
    case 'VideoSetup': 
      baseCols = ['Name', 'Notes', 'Assignee', 'Status', 'Attachments', 'Attachment Summary'];
      break;
    case 'AudioSetup': 
      baseCols = ['Name', 'Notes', 'Assignee', 'Status', 'Attachments', 'Attachment Summary'];
      break;
    default: 
      baseCols = [];
      break;
  }

  // Now this part is reachable!
  const added = extraColumns[activeTable] || [];
  return [...baseCols, ...added];
};

const renderRow = (item: any) => {
  const cols = getTableColumns();
  const getWidth = (name: string) => colWidths[name] || 200;

  // Shared cell style
  const cellStyle = (colName: string) => ({
    width: getWidth(colName),
    minWidth: getWidth(colName),
    maxWidth: getWidth(colName),
  });

// Inside renderRow function
const cellCls = "px-4 py-3 border-r border-b border-slate-200 text-slate-700 text-[13px] whitespace-nowrap overflow-hidden text-ellipsis text-center";
const titleCls = "px-4 py-3 border-r border-b border-slate-200 font-semibold text-slate-900 text-[13px] truncate text-center";
// Primary field — no longer sticky, inherits row hover background
const primaryCls = "px-4 py-3 border-r border-b border-slate-200 font-semibold text-slate-900 text-[13px] truncate bg-inherit";

  // HELPER: This renders the data for the columns added via the "+" button
  const renderExtraCells = () => {
    const extraKeys = extraColumns[activeTable] || [];
    return extraKeys.map((colName) => (
      <td key={colName} className={cellCls} style={cellStyle(colName)}>
        {item[colName] || <span className="text-slate-300 italic">—</span>}
      </td>
    ));
  };

  switch (activeTable) {
    case 'Events':
      return (
        <>
          <td className={primaryCls} style={cellStyle(cols[0])}>{item["Event Name"] || item.EventName || "Untitled Event"}</td>
          <td className={`${cellCls} font-mono`} style={cellStyle(cols[1])}>{item.DateFrom}</td>
          <td className={`${cellCls} font-mono`} style={cellStyle(cols[2])}>{item.DateTo}</td>
          <td className={cellCls} style={cellStyle(cols[3])}>
            <div className="flex flex-wrap gap-1">
              {item.Occasion && item.Occasion.split(',').map((tag: string, i: number) => (
                <Badge key={i} className="bg-blue-600 text-white border-none text-[12px] px-2 py-0.5 rounded-sm">{tag.trim()}</Badge>
              ))}
            </div>
          </td>
          <td className={cellCls} style={cellStyle(cols[4])}>
            <div className="flex flex-wrap gap-1">
              {item.City && item.City.split(',').map((tag: string, i: number) => (
                <Badge key={i} className="bg-orange-500 text-white border-none text-[12px] px-2 py-0.5 rounded-sm">{tag.trim()}</Badge>
              ))}
            </div>
          </td>
          <td className={cellCls} style={cellStyle(cols[5])}>{item.Venue}</td>
          <td className={cellCls} style={cellStyle(cols[6])}>
            <div className="flex flex-wrap gap-1.5 overflow-hidden">
              {(item["Sessions"] || item["Imported table"]) && (item["Sessions"] || item["Imported table"]).split(',').map((sessionName: string, i: number) => {
                const sName = sessionName.trim();
                const linked = sessions.find((s: any) => s["Session Name"] === sName);
                return (
                  <Badge
                    key={i}
                    className={`text-[12px] font-semibold px-2 py-0.5 rounded-sm shadow-sm transition-all ${linked ? 'bg-brand-primary/10 text-brand-primary border border-brand-primary/30 hover:bg-brand-primary/20 cursor-pointer' : 'bg-slate-100 text-slate-700 border border-slate-300 cursor-default'}`}
                    onClick={(e) => { e.stopPropagation(); if (linked) setLinkedSession(linked); }}
                  >
                    {sName}{linked && <ArrowUpRight className="inline h-3 w-3 ml-0.5 opacity-60" />}
                  </Badge>
                );
              })}
            </div>
          </td>
          <td className={`${cellCls} text-center`} style={cellStyle(cols[7])}>
            {item.Year && <Badge className="bg-brand-primary/10 text-brand-primary border border-brand-primary/20 font-black text-[12px] px-3 py-1 rounded-md shadow-sm tracking-tighter">{item.Year}</Badge>}
          </td>
          {renderExtraCells()}
        </>
      );
    case 'Session':
      return (
       <>
          <td className={primaryCls} style={cellStyle(cols[0])}>{item["Session Name"] || "Untitled Session"}</td>
          <td className={cellCls} style={cellStyle(cols[1])}>{item["Parent Event"] || '—'}</td>
          <td className={`${cellCls} font-mono`} style={cellStyle(cols[2])}>{item["Date"]}</td>
          <td className={cellCls} style={cellStyle(cols[3])}>{item["City"] ? <Badge className="bg-blue-50 text-blue-600 border border-blue-100 text-[11px] font-bold px-2 py-0.5 rounded uppercase">{item["City"]}</Badge> : '—'}</td>
          <td className={cellCls} style={cellStyle(cols[4])}>{item["Venue"]}</td>
          <td className={cellCls} style={cellStyle(cols[5])}>{item["TimeOfDay"] ? <Badge className={`${item["TimeOfDay"].toLowerCase().includes('morn') ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-blue-50 text-blue-600 border-blue-100'} text-[11px] font-bold px-2 py-0.5 rounded uppercase`}>{item["TimeOfDay"]}</Badge> : '—'}</td>
          <td className={cellCls} style={cellStyle(cols[6])}>{item["Occasion"]}</td>
          <td className={`${cellCls} italic`} style={cellStyle(cols[7])}>{item["SessionType"]}</td>
          <td className={`${cellCls} text-slate-500 italic`} style={cellStyle(cols[8])}>{item["Notes"]}</td>
          {renderExtraCells()}
        </>
      );
     case 'MusicLog':
      return (
        <>
          <td className={`${primaryCls} font-mono text-brand-primary`} style={cellStyle(cols[0])}>{item["PlayID"]}</td>
          <td
            className={`${titleCls} cursor-pointer hover:text-brand-primary hover:underline`}
            style={cellStyle(cols[1])}
            onClick={(e) => { e.stopPropagation(); const s = sessions.find(s => s["Session Name"] === item["Session"]); if (s) setLinkedSession(s); }}
          >
            <span className="flex items-center justify-center gap-1">{item["Session"]}<ArrowUpRight className="h-3 w-3 shrink-0 opacity-40" /></span>
          </td>
          <td className={cellCls} style={cellStyle(cols[2])}>{item["Parent Event (from Session)"]}</td>
          <td className={`${cellCls} font-mono`} style={cellStyle(cols[3])}>{item["Date (from Session)"]}</td>
          <td className={cellCls} style={cellStyle(cols[4])}>{item["TimeOfDay (from Session)"]}</td>
          <td className={cellCls} style={cellStyle(cols[5])}>{item["Occasion (from Session)"]}</td>
          <td className={cellCls} style={cellStyle(cols[6])}>{item["Order"]}</td>
          <td className={`${cellCls} font-mono`} style={cellStyle(cols[7])}>{item["PlayedAt"]}</td>
          <td className={`${cellCls} font-bold text-brand-accent`} style={cellStyle(cols[8])}>{item["Track"]}</td>
          <td className={cellCls} style={cellStyle(cols[9])}>{item["Theme"]}</td>
          <td className={cellCls} style={cellStyle(cols[10])}>{item["Relevance"]}</td>
          <td className={cellCls} style={cellStyle(cols[11])}>{item["Patrank"]}</td>
          <td className={cellCls} style={cellStyle(cols[12])}>{item["Topic"]}</td>
          <td className={cellCls} style={cellStyle(cols[13])}>{item["Cue"]}</td>
          <td className={cellCls} style={cellStyle(cols[14])}>{item["Notes"]}</td>
          <td className={cellCls} style={cellStyle(cols[15])}>{item["PPG Remarks"]}</td>
          <td className={`${cellCls} text-brand-primary underline`} style={cellStyle(cols[16])}>{item["TrackID (link)"]}</td>
          {renderExtraCells()}
        </>
      );
    case 'VideoLog':
      return (
        <>
          <td className={`${primaryCls} font-mono text-indigo-500`} style={cellStyle(cols[0])}>{item["VideoPlayId"]}</td>
          <td
            className={`${cellCls} cursor-pointer hover:text-brand-primary hover:underline font-semibold text-slate-900`}
            style={cellStyle(cols[1])}
            onClick={(e) => { e.stopPropagation(); const s = sessions.find(s => s["Session Name"] === item["Session"]); if (s) setLinkedSession(s); }}
          >
            <span className="flex items-center justify-center gap-1">{item["Session"]}<ArrowUpRight className="h-3 w-3 shrink-0 opacity-40" /></span>
          </td>
          <td className={`${cellCls} font-mono`} style={cellStyle(cols[2])}>{item["Date (from Session)"]}</td>
          <td className={cellCls} style={cellStyle(cols[3])}>{item["City (from Session)"]}</td>
          <td className={cellCls} style={cellStyle(cols[4])}>{item["Venue (from Session)"]}</td>
          <td className={cellCls} style={cellStyle(cols[5])}>{item["Parent Event (from Session)"]}</td>
          <td className={cellCls} style={cellStyle(cols[6])}>{item["TimeOfDay (from Session)"]}</td>
          <td className={cellCls} style={cellStyle(cols[7])}>{item["Occasion (from Session)"]}</td>
          <td className={`${cellCls} italic`} style={cellStyle(cols[8])}>{item["SessionType (from Session)"]}</td>
          <td className={titleCls} style={cellStyle(cols[9])}>{item["VideoTitle"]}</td>
          <td className={`${cellCls} font-mono`} style={cellStyle(cols[10])}>{item["Duration"]}</td>
          <td className={cellCls} style={cellStyle(cols[11])}>{item["ProposalsList"]}</td>
          {renderExtraCells()}
        </>
      );
    case 'Guidance & Learning':
      return (
        <>
          <td className={`${primaryCls} font-mono text-brand-primary`} style={cellStyle(cols[0])}>{item["LearningId"]}</td>
          <td className={titleCls} style={cellStyle(cols[1])}>{item["Event"]}</td>
          <td className={`${cellCls} font-mono`} style={cellStyle(cols[2])}>{item["DateFrom (from Event)"]}</td>
          <td className={`${cellCls} font-mono`} style={cellStyle(cols[3])}>{item["DateTo (from Event)"]}</td>
          <td className={`${cellCls} font-bold`} style={cellStyle(cols[4])}>{item["Year (from Event)"]}</td>
          <td className={cellCls} style={cellStyle(cols[5])}>{item["City"]}</td>
          <td className={cellCls} style={cellStyle(cols[6])}>{item["GuidanceFrom"]}</td>
          <td className={cellCls} style={cellStyle(cols[7])}>{item["Guidance/Learning"]}</td>
          <td className={cellCls} style={cellStyle(cols[8])}>{item["Category"] && <Badge className="bg-purple-600 text-white border-none text-[11px] px-2">{item["Category"]}</Badge>}</td>
          <td className={`${cellCls} text-brand-primary underline`} style={cellStyle(cols[9])}>{item["Attachments"]}</td>
          {renderExtraCells()}
        </>
      );
  case 'LED':
      return (
        <>
          <td className={`${primaryCls} font-mono text-brand-primary`} style={cellStyle(cols[0])}>{item["LedId"]}</td>
          <td className={titleCls} style={cellStyle(cols[1])}>{item["🕘 Session"]}</td>
          <td className={cellCls} style={cellStyle(cols[2])}>{item["Parent Event (from 🕘 Session)"]}</td>
          <td className={`${cellCls} font-mono`} style={cellStyle(cols[3])}>{item["Date (from 🕘 Session)"]}</td>
          <td className={cellCls} style={cellStyle(cols[4])}>{item["City (from 🕘 Session)"]}</td>
          <td className={cellCls} style={cellStyle(cols[5])}>{item["Venue (from 🕘 Session)"]}</td>
          <td className={cellCls} style={cellStyle(cols[6])}>{item["Indoor/Outdoor LED?"] && <Badge className="bg-slate-800 text-white border-none text-[11px]">{item["Indoor/Outdoor LED?"]}</Badge>}</td>
          <td className={cellCls} style={cellStyle(cols[7])}>{item["CentreLed"]}</td>
          <td className={cellCls} style={cellStyle(cols[8])}>{item["CntrPitch"]}</td>
          <td className={cellCls} style={cellStyle(cols[9])}>{item["CntrWdth"]}</td>
          <td className={cellCls} style={cellStyle(cols[10])}>{item["CntrHt"]}</td>
          <td className={cellCls} style={cellStyle(cols[11])}>{item["CntrRiser"]}</td>
          <td className={cellCls} style={cellStyle(cols[12])}>{item["Stageht"]}</td>
          <td className={cellCls} style={cellStyle(cols[13])}>{item["SideLed"]}</td>
          <td className={cellCls} style={cellStyle(cols[14])}>{item["SidePitch"]}</td>
          <td className={cellCls} style={cellStyle(cols[15])}>{item["SideWdth"]}</td>
          <td className={cellCls} style={cellStyle(cols[16])}>{item["SideHt"]}</td>
          <td className={cellCls} style={cellStyle(cols[17])}>{item["OtherLed1"]}</td>
          <td className={cellCls} style={cellStyle(cols[18])}>{item["OtherPitch"]}</td>
          <td className={cellCls} style={cellStyle(cols[19])}>{item["OtherWdth"]}</td>
          <td className={cellCls} style={cellStyle(cols[20])}>{item["OtherHt"]}</td>
          <td className={cellCls} style={cellStyle(cols[21])}>{item["OtherLed2"]}</td>
          <td className={cellCls} style={cellStyle(cols[22])}>{item["is Led Required?"]}</td>
          <td className={cellCls} style={cellStyle(cols[23])}>{item["Other2Wdth"]}</td>
          <td className={cellCls} style={cellStyle(cols[24])}>{item["Other2Ht"]}</td>
          <td className={cellCls} style={cellStyle(cols[25])}>{item["DGUseedKva"]}</td>
          <td className={cellCls} style={cellStyle(cols[26])}>{item["BackupPower"]}</td>
          <td className={titleCls} style={cellStyle(cols[27])}>{item["Vendor"]}</td>
          
          {/* CORRECTED IMAGE COLUMN */}
          <td 
            className={`${cellCls} relative group/cell`} 
            style={{...cellStyle(cols[28]), minWidth: '200px'}}
          >
            <div className="flex items-center gap-1.5 overflow-hidden">
              {(() => {
                const imageString = item["Images"] || "";
                const urlRegex = /\((https?:\/\/[^)]+)\)/g;
                const matches = [];
                let m;
                while ((m = urlRegex.exec(imageString)) !== null) matches.push(m[1]);

                if (matches.length === 0) return <span className="text-slate-300 italic text-[10px]">No Images</span>;

                return (
                  <>
                    {matches.slice(0, 3).map((url, i) => (
                      <img key={i} src={url} className="h-8 w-12 object-cover rounded border border-slate-300 shrink-0" alt="" />
                    ))}
                    {matches.length > 3 && <span className="text-[10px] font-black text-slate-400">+{matches.length - 3}</span>}
                  </>
                );
              })()}
            </div>

            {/* THE EXPAND ICON (Appears on Hover) */}
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setImageManager({ 
                  item: { ...item }, 
                  column: "Images", 
                  isOpen: true 
                });
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/cell:opacity-100 bg-white border border-slate-300 rounded shadow-lg p-1.5 text-slate-500 hover:text-brand-primary transition-all z-20"
            >
              <ArrowUpRight className="h-3.5 w-3.5" /> 
            </button>
          </td>
          {renderExtraCells()}
        </>
      );
    case 'DyatraChecklist':
      return (
        <>
          <td className={primaryCls} style={cellStyle(cols[0])}>{item["Task"]}</td>
          <td className={cellCls} style={cellStyle(cols[1])}>{item["Details"]}</td>
          <td className={cellCls} style={cellStyle(cols[2])}>{item["TaskGroup"] && <Badge className="bg-slate-100 text-slate-600 border-slate-300">{item["TaskGroup"]}</Badge>}</td>
          <td className={`${cellCls} font-mono`} style={cellStyle(cols[3])}>{item["OrderId"]}</td>
          <td className={cellCls} style={cellStyle(cols[4])}>{item["People Involved"]}</td>
          <td className={cellCls} style={cellStyle(cols[5])}>{item["Typical Timeline"]}</td>
          <td className={cellCls} style={cellStyle(cols[6])}>{item["Category"] && <Badge className="bg-brand-primary text-white border-none">{item["Category"]}</Badge>}</td>
          <td className={cellCls} style={cellStyle(cols[7])}>{item["Period"]}</td>
          <td className={`${cellCls} text-brand-primary underline`} style={cellStyle(cols[8])}>{item["Attachment"]}</td>
          {renderExtraCells()}
        </>
      );
    case 'DataSharing':
      return (
        <>
          <td className={primaryCls} style={cellStyle(cols[0])}>{item["Sevak"]}</td>
          <td className={cellCls} style={cellStyle(cols[1])}>{item["Dept"] && <Badge className="bg-blue-600 text-white border-none text-[11px]">{item["Dept"]}</Badge>}</td>
          <td className={cellCls} style={cellStyle(cols[2])}>{item["EmailId"]}</td>
          <td className={cellCls} style={cellStyle(cols[3])}><Badge className={`${item["ShareFacts?"] === 'Yes' ? 'bg-green-500/10 text-green-500' : 'bg-slate-100 text-slate-400'} border-none text-[10px]`}>{item["ShareFacts?"] || 'No'}</Badge></td>
          <td className={cellCls} style={cellStyle(cols[4])}>{item["ShareData"]}</td>
          {renderExtraCells()}
        </>
      );
    case 'Tracks':
      return (
        <>
          <td className={primaryCls} style={cellStyle(cols[0])}>{item["Title"] || item.title}</td>
          <td className={cellCls} style={cellStyle(cols[1])}>{item["Artist"] || item.artist }</td>
          <td className={cellCls} style={cellStyle(cols[2])}>{item["Album"] || item.album }</td>
          <td className={cellCls} style={cellStyle(cols[3])}>{item["Duration"] }</td>
          <td className={cellCls} style={cellStyle(cols[4])}>{item["DurationTime"] }</td>
          <td className={cellCls} style={cellStyle(cols[5])}>{item["BPM"] }</td>
          <td className={cellCls} style={cellStyle(cols[6])}>{item["Key"] }</td>
          <td className={cellCls} style={cellStyle(cols[7])}>{item["Source"] }</td>
          <td className={`${cellCls} text-brand-primary truncate`} style={cellStyle(cols[8])}>{item["FileLink"] ? <a href={item["FileLink"]} target="_blank" rel="noopener noreferrer" className="underline">Link</a>: '-'}</td>
          <td className={cellCls} style={cellStyle(cols[9])}><div className="flex gap-1">{item["Tags"] && String(item["Tags"]).split(',').map((tag: string, i: number) => (<Badge key={i} className="bg-purple-600 text-white border-none text-[10px]">{tag.trim()}</Badge>))}</div></td>
          <td className={cellCls} style={cellStyle(cols[10])}>{item["Lyrics"] ? String(item["Lyrics"]).substring(0, 20) + '...' : '-'}</td>
          <td className={cellCls} style={cellStyle(cols[11])}>{item["LexiconID"] }</td>
          <td className={`${cellCls} font-mono`} style={cellStyle(cols[12])}>{item["LastUpdated"] }</td>
          <td className={`${cellCls} font-mono`} style={cellStyle(cols[13])}>{item["Plays"] }</td>
          {renderExtraCells()}
        </>
      );
    case 'VideoSetup':
    return (
        <>
          <td className={primaryCls} style={cellStyle(cols[0])}>{item.name || item.item || '-'}</td>
          <td className={cellCls} style={cellStyle(cols[1])}>{item.notes || '-'}</td>
          <td className={cellCls} style={cellStyle(cols[2])}>{item.assignee || '-'}</td>
          <td className={cellCls} style={cellStyle(cols[3])}><Badge className={`${item.status === 'Ready' ? 'bg-green-600' : item.status === 'Pending' ? 'bg-yellow-600' : 'bg-red-600'} text-white`}>{item.status || 'Unknown'}</Badge></td>
          <td className={`${cellCls} text-brand-primary`} style={cellStyle(cols[4])}>{item.attachments ? <a href={item.attachments} target="_blank" rel="noopener noreferrer" className="underline">View</a> : '-'}</td>
          <td className={cellCls} style={cellStyle(cols[5])}>{item.attachmentSummary || '-'}</td>
          {renderExtraCells()}
        </>
      );
    case 'AudioSetup':
      return (
        <>
          <td className={primaryCls} style={cellStyle(cols[0])}>{item.name || item.item || '-'}</td>
          <td className={cellCls} style={cellStyle(cols[1])}>{item.notes || '-'}</td>
          <td className={cellCls} style={cellStyle(cols[2])}>{item.assignee || '-'}</td>
          <td className={cellCls} style={cellStyle(cols[3])}><Badge className={`${item.status === 'Ready' ? 'bg-green-600' : item.status === 'Pending' ? 'bg-yellow-600' : 'bg-red-600'} text-white`}>{item.status || 'Unknown'}</Badge></td>
          <td className={`${cellCls} text-brand-primary`} style={cellStyle(cols[4])}>{item.attachments ? <a href={item.attachments} target="_blank" rel="noopener noreferrer" className="underline">View</a> : '-'}</td>
          <td className={cellCls} style={cellStyle(cols[5])}>{item.attachmentSummary || '-'}</td>
          {renderExtraCells()}
        </>
      );
    default:
      return <td colSpan={10} className={cellCls}>No structure defined.</td>;
  }
};


const handleAddBlankRow = async () => {
  let collection = '';
  // Determine collection based on activeTable
  switch (activeTable) {
    case 'Events': collection = 'events'; break;
    case 'Session': collection = 'sessions'; break;
    case 'MusicLog': collection = 'musiclog'; break;
    case 'Tracks': collection = 'media'; break;
    case 'VideoLog': collection = 'videolog'; break;
    case 'LED': collection = 'led_details'; break;
    case 'DyatraChecklist': collection = 'checklist'; break;
    case 'DataSharing': collection = 'locations'; break;
    default: return;
  }

 try {
    const response = await window.fetch(`/api/${collection}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}) 
    });

    if (response.ok) {
      const newRecordFromServer = await response.json();
      await fetchAllData(); // This refreshes the list
      
      // Enter Edit Mode immediately
      setEditingId(newRecordFromServer._id || newRecordFromServer.id);
      setEditDraft(newRecordFromServer);

      // --- SCROLL TO BOTTOM ---
      // We use a small timeout to wait for the table to re-render with the new row
      setTimeout(() => {
        const scrollContainer = document.querySelector('.overflow-auto');
        if (scrollContainer) {
          scrollContainer.scrollTo({
            top: scrollContainer.scrollHeight,
            behavior: 'smooth'
          });
        }
      }, 150);
    }
  } catch (error) {
    console.error("Error adding row:", error);
  }
};
// 1. Create a function to fetch all data from MongoDB
const fetchAllData = async () => {
  try {
  const endpoints = [
      { key: 'events', setter: setEvents },
      { key: 'sessions', setter: setSessions },
      { key: 'musiclog', setter: setMusicLogs },
      { key: 'videolog', setter: setVideoLogs },
      { key: 'checklist', setter: setChecklist },
      { key: 'led_details', setter: setLedDetails },
      { key: 'rentals', setter: setRentals },
      { key: 'guidance', setter: setGuidance },
      { key: 'locations', setter: setLocations },
      { key: 'videosetup', setter: setVideoSetup },
      { key: 'audiosetup', setter: setAudioSetup },
      { key: 'media', setter: setMedia },
    ];

    for (const { key, setter } of endpoints) {
      const response = await window.fetch(`/api/${key}`);
      if (response.ok) {
        const data = await response.json();
        setter(data);
      }
    }
  } catch (error) {
    console.error("Failed to fetch data from MongoDB:", error);
  }
};

// 2. Trigger fetch on mount and every time user logs in
useEffect(() => {
  if (user) {
    fetchAllData();
    
    const interval = setInterval(() => {
      // STOP background refresh if the Image Manager is open
      if (!imageManager?.isOpen) {
        fetchAllData();
      }
    }, 10000);

    return () => clearInterval(interval);
  }
}, [user, imageManager?.isOpen]); // Add imageManager.isOpen as a dependency

 const handleAddRecord = async () => {
  // Determine which collection to save to
  let collection = '';
  const data = { ...newRecord };

  switch (activeTable) {
    case 'Events': collection = 'events'; break;
    case 'Session': collection = 'sessions'; break;
      case 'MusicLog': collection = 'musiclog'; break; // Targeted collection
    case 'VideoLog': collection = 'videolog'; break; // Targeted collection
    case 'Tracks': 
  collection = 'media'; 
  // We set both just to be safe so your filter always finds it
  data.type = 'track'; 
  data.Type = 'track'; 
  break;
    case 'DyatraChecklist': collection = 'checklist'; break;
    case 'Guidance & Learning': collection = 'guidance'; break;
    case 'LED': collection = 'led_details'; break;
    case 'DataSharing': collection = 'locations'; break;
    case 'VideoSetup': collection = 'videosetup'; break;
    case 'AudioSetup': collection = 'audiosetup'; break;
  }

  setIsAdding(true);
  try {
    const response = await window.fetch(`/api/${collection}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (response.ok) {
      setIsAddModalOpen(false);
      setNewRecord({});
      fetchAllData(); // Refresh list immediately after adding
    } else {
      alert("Failed to save record to database.");
    }
  } catch (error) {
    console.error("Add record error:", error);
  } finally {
    setIsAdding(false);
  }
};
const [isInlineAdding, setIsInlineAdding] = useState(false);
const [inlineRecord, setInlineRecord] = useState<any>({});
const groupColors = [
  { main: "#ffec90" }, // Bright Yellow
  { main: "#b3f7fd" }, // Electric Blue
  { main: "#FFADAD" }, // Soft Red/Pink
  { main: "#CAFFBF" }, // Light Green
  { main: "#BDB2FF" }, // Periwinkle
  { main: "#FFC6FF" }, // Orchid
];
const [collapsedGroups, setCollapsedGroups] = useState<string[]>([]);
const [linkedSession, setLinkedSession] = useState<any | null>(null);

// Update your toggle function as well:
const toggleGroup = (groupId: string) => {
  setCollapsedGroups(prev => 
    prev.includes(groupId) 
      ? prev.filter(id => id !== groupId) 
      : [...prev, groupId]
  );
};
  const openAddModal = () => {
    setNewRecord({});
    setIsAddModalOpen(true);
  };

  useEffect(() => {
     setGroupByField(null);
  setSortBy(null);
  setExpandedGroups([]);
  setSearchQuery('');
    setNewRecord({});
    
 
}, [activeTable]);

useEffect(() => {
  if (!user) return;

  const setupSubscription = (table: string, setter: (data: any) => void) => {
    // 1. Define the fetcher
    const fetchData = async () => {
      // Don't fetch if the user is busy managing images to prevent flickering
      if (imageManager?.isOpen) return; 

      try {
        const response = await window.fetch(`/api/${table}`);
        const data = await response.json();
        if (Array.isArray(data)) setter(data);
      } catch (error) {
        console.error(`Failed to fetch ${table}:`, error);
      }
    };
    
    fetchData();
    // 2. Only set the interval if the modal is CLOSED
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  };

  const eventsSub = setupSubscription('events', setEvents);
  const guidanceSub = setupSubscription('guidance', setGuidance);
  const sessionsSub = setupSubscription('sessions', setSessions);
  const locationsSub = setupSubscription('locations', setLocations);
  const mediaSub = setupSubscription('media', setMedia);
  const checklistSub = setupSubscription('checklist', setChecklist);
  const ledSub = setupSubscription('led_details', setLedDetails);
  const rentalsSub = setupSubscription('rentals', setRentals);
  const videoSetupSub = setupSubscription('videosetup', setVideoSetup);
  const audioSetupSub = setupSubscription('audiosetup', setAudioSetup);

  return () => {
    eventsSub(); guidanceSub(); sessionsSub(); locationsSub();
    mediaSub(); checklistSub(); ledSub(); rentalsSub();
    videoSetupSub(); audioSetupSub();
  };
  // ADD imageManager?.isOpen to the dependency array below
}, [user, selectedEventId, imageManager?.isOpen]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost')) {
        return;
      }
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        const userData = event.data.user;
        setUser(userData);
        localStorage.setItem('dyatra_user', JSON.stringify(userData));
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

const handleGoogleLogin = async () => {
  if (!isConfigured) return;
  setLoginError(null);
  try {
    const response = await window.fetch('/api/auth/google/url');
    if (!response.ok) throw new Error('Failed to get auth URL');
    const { url } = await response.json();

    // Detect if device is Mobile
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 768;

    if (isMobile) {
      // MOBILE: Redirect the entire page (Native-like behavior)
      window.location.href = url;
    } else {
      // WEB: Open in a popup
      const authWindow = window.open(url, 'google_oauth', 'width=600,height=700');
      if (!authWindow) {
        setLoginError('Popup blocked. Please allow popups for this site.');
      }
    }
  } catch (error) {
    setLoginError('Failed to initiate Google login');
  }
};

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('dyatra_user');
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
const [uploadingSessionId, setUploadingSessionId] = useState<string | null>(null);

const handleMediaUpload = async (event: React.ChangeEvent<HTMLInputElement>, sessionId: string) => {
  const file = event.target.files?.[0];
  if (!file) return;

  // In a real app, you would upload to S3/Cloudinary here.
  // For now, we create a local preview URL to simulate success.
  const imageUrl = URL.createObjectURL(file);
  
  // Here you would typically call window.fetch(`/api/sessions/${sessionId}/media`, ...)
  console.log(`Uploading ${file.name} to session ${sessionId}`);
  alert(`Simulated upload for: ${file.name}`);
};

// Inside App function at the top
const [sessionImages, setSessionImages] = useState<Record<string, string[]>>({});
const [activeUploadId, setActiveUploadId] = useState<string | null>(null);

const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (file && activeUploadId) {
    const imageUrl = URL.createObjectURL(file); // Creates a temporary link to your local file
    setSessionImages(prev => ({
      ...prev,
      [activeUploadId]: [...(prev[activeUploadId] || []), imageUrl]
    }));
  }
};


const getProcessedData = (): any[] => {
  let data = [...filteredData];

  // 1. Sort Data
  if (sortBy) {
    data.sort((a, b) => {
      const valA = (a[sortBy.field] ?? "").toString().toLowerCase();
      const valB = (b[sortBy.field] ?? "").toString().toLowerCase();
      if (valA < valB) return sortBy.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortBy.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }

  let finalResult: any[] = [];

  // 2. Specialized Nested Grouping for Session
  if (activeTable === 'Session' && !groupByField) {
    const eventYearMap: Record<string, string> = {};
    (events as any[]).forEach(ev => {
      const name = ev["Event Name"] || ev.EventName;
      const year = ev["Year"];
      if (name && year) eventYearMap[name] = String(year);
    });

    const nestedGroups: Record<string, Record<string, any[]>> = {};
    data.forEach(session => {
      let year = eventYearMap[session["Parent Event"]];
      if (!year && session["Date"]) {
        const match = session["Date"].match(/\d{4}/);
        if (match) year = match[0];
      }
      year = year || "(Empty)";
      const parent = session["Parent Event"] || "(Empty)";
      if (!nestedGroups[year]) nestedGroups[year] = {};
      if (!nestedGroups[year][parent]) nestedGroups[year][parent] = [];
      nestedGroups[year][parent].push(session);
    });

    const years = Object.keys(nestedGroups).sort().reverse();
    years.forEach((year, yIdx) => {
      const theme = groupColors[yIdx % groupColors.length];
      const yearId = `year-${year}`;
      finalResult.push({ type: 'header', level: 1, id: yearId, label: 'YEAR', value: year, count: Object.values(nestedGroups[year]).flat().length, color: theme.main });
      
      Object.keys(nestedGroups[year]).sort().forEach(parent => {
        const eventId = `${yearId}-event-${parent}`;
        finalResult.push({ type: 'header', level: 2, id: eventId, parentId: yearId, label: 'PARENT EVENT', value: parent, count: nestedGroups[year][parent].length, color: theme.main });
        nestedGroups[year][parent].forEach(item => {
          finalResult.push({ type: 'row', data: item, parentId: eventId, grandParentId: yearId, groupColor: theme.main });
        });
      });
    });
  } 
  // 3. Standard Grouping for Other Tables
  else if (groupByField || (activeTable === 'Events' && !groupByField)) {
    const activeGroupField = groupByField || 'Year';
    const groups: Record<string, any[]> = {};
    data.forEach(item => {
      const key = String(item[activeGroupField] || 'Unspecified');
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });

    Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0])).forEach(([name, items], gIdx) => {
      const theme = groupColors[gIdx % groupColors.length];
      const gid = `group-${name}`;
      finalResult.push({ type: 'header', level: 1, id: gid, label: activeGroupField, value: name, count: items.length, color: theme.main });
      items.forEach(item => finalResult.push({ type: 'row', data: item, parentId: gid, groupColor: theme.main }));
    });
  } 
  // 4. No Grouping
  else {
    finalResult = data.map(item => ({ type: 'row', data: item }));
  }

  // --- THE FIX: Add the edit-row to the VERY END of the list ---
  if (isInlineAdding) {
    finalResult.push({ 
      type: 'edit-row', 
      id: 'new-inline-row'
    });
  }

  return finalResult;
};
const exportToCSV = () => {
  const columns = getTableColumns();
  // Create Header row
  const header = columns.join(',');
  
  // Create Data rows
  const rows = filteredData.map(item => {
    return columns.map(col => {
      const cell = item[col] || "";
      // Escape quotes and wrap in quotes to handle commas within data
      return `"${cell.toString().replace(/"/g, '""')}"`;
    }).join(',');
  });

  const csvContent = [header, ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Dyatra_${activeTable}_${new Date().toISOString().split('T')[0]}.csv`);
  link.click();
};

const renderEditableRow = () => {
  const cols = getTableColumns();
  const getWidth = (name: string) => colWidths[name] || 200;
  const isSessionLinkedTable = activeTable === 'MusicLog' || activeTable === 'VideoLog';

  const handleInlineSessionSelect = (sessionName: string) => {
    const s = sessions.find(s => s["Session Name"] === sessionName);
    if (!s) { setInlineRecord({ ...inlineRecord, Session: sessionName }); return; }
    const patch: any = { Session: s["Session Name"] };
    if (activeTable === 'MusicLog') {
      patch["Parent Event (from Session)"] = s["Parent Event"];
      patch["Date (from Session)"] = s["Date"];
      patch["TimeOfDay (from Session)"] = s["TimeOfDay"];
      patch["Occasion (from Session)"] = s["Occasion"];
    } else {
      patch["Parent Event (from Session)"] = s["Parent Event"];
      patch["Date (from Session)"] = s["Date"];
      patch["City (from Session)"] = s["City"];
      patch["Venue (from Session)"] = s["Venue"];
      patch["TimeOfDay (from Session)"] = s["TimeOfDay"];
      patch["Occasion (from Session)"] = s["Occasion"];
      patch["SessionType (from Session)"] = s["SessionType"];
    }
    setInlineRecord({ ...inlineRecord, ...patch });
  };

  const isEventsTable = activeTable === 'Events';
  const selectCls = "w-full h-8 bg-white border border-blue-300 rounded px-2 text-[12px] font-bold text-black focus:ring-2 focus:ring-brand-primary outline-none shadow-sm";
  const inputCls = "w-full h-8 bg-white border border-blue-300 rounded px-2 text-[12px] font-bold text-black placeholder:text-slate-400 focus:ring-2 focus:ring-brand-primary outline-none shadow-sm";

  return (
    <>
      {cols.map((col, i) => (
        <td
          key={i}
          className="px-2 py-2 border-r border-b border-slate-400 bg-blue-50/50"
          style={{ width: getWidth(col), minWidth: getWidth(col), maxWidth: getWidth(col) }}
        >
          {(() => {
            if (isSessionLinkedTable && col === 'Session') {
              return (
                <select autoFocus className={selectCls} value={inlineRecord['Session'] || ''} onChange={(e) => handleInlineSessionSelect(e.target.value)}>
                  <option value="">Select session...</option>
                  {sessions.map((s: any, si: number) => <option key={si} value={s["Session Name"]}>{s["Session Name"]}</option>)}
                </select>
              );
            }
            if (isEventsTable && (col === 'DateFrom' || col === 'DateTo')) {
              return (
                <input autoFocus={i === 0} type="date" className={inputCls} value={inlineRecord[col] || ''} onChange={(e) => setInlineRecord({ ...inlineRecord, [col]: e.target.value })} />
              );
            }
            if (isEventsTable && col === 'Occasion') {
              const opts = [...new Set(events.map((e: any) => e.Occasion).filter(Boolean).flatMap((o: string) => o.split(',').map((x: string) => x.trim())).filter(Boolean))].sort() as string[];
              return (
                <select className={selectCls} value={inlineRecord[col] || ''} onChange={(e) => setInlineRecord({ ...inlineRecord, [col]: e.target.value })}>
                  <option value="">Select occasion...</option>
                  {opts.map((o, oi) => <option key={oi} value={o}>{o}</option>)}
                </select>
              );
            }
            if (isEventsTable && col === 'City') {
              const opts = [...new Set([...events.map((e: any) => e.City), ...sessions.map((s: any) => s.City)].filter(Boolean).flatMap((c: string) => c.split(',').map((x: string) => x.trim())).filter(Boolean))].sort() as string[];
              return (
                <select className={selectCls} value={inlineRecord[col] || ''} onChange={(e) => setInlineRecord({ ...inlineRecord, [col]: e.target.value })}>
                  <option value="">Select city...</option>
                  {opts.map((o, oi) => <option key={oi} value={o}>{o}</option>)}
                </select>
              );
            }
            if (isEventsTable && col === 'Year') {
              const yr = new Date().getFullYear();
              const yrs = Array.from({ length: 11 }, (_, k) => String(yr + 2 - k));
              return (
                <select className={selectCls} value={inlineRecord[col] || ''} onChange={(e) => setInlineRecord({ ...inlineRecord, [col]: e.target.value })}>
                  <option value="">Select year...</option>
                  {yrs.map((y, yi) => <option key={yi} value={y}>{y}</option>)}
                </select>
              );
            }
            if (isEventsTable && col === 'Sessions') {
              const existing = inlineRecord['Sessions'] ? inlineRecord['Sessions'].split(',').map((x: string) => x.trim()).filter(Boolean) : [];
              return (
                <div className="flex flex-col gap-1">
                  <select className={selectCls} value="" onChange={(e) => {
                    const picked = e.target.value;
                    if (!picked || existing.includes(picked)) return;
                    setInlineRecord({ ...inlineRecord, Sessions: [...existing, picked].join(', ') });
                  }}>
                    <option value="">Add session...</option>
                    {sessions.filter((s: any) => !existing.includes(s["Session Name"])).map((s: any, si: number) => <option key={si} value={s["Session Name"]}>{s["Session Name"]}</option>)}
                  </select>
                  {existing.length > 0 && (
                    <div className="flex flex-wrap gap-0.5">
                      {existing.map((name: string, ni: number) => (
                        <span key={ni} className="inline-flex items-center gap-0.5 bg-brand-primary/10 text-brand-primary text-[10px] font-bold px-1.5 py-0.5 rounded-sm border border-brand-primary/20">
                          {name}
                          <button onClick={() => setInlineRecord({ ...inlineRecord, Sessions: existing.filter((_: any, fi: number) => fi !== ni).join(', ') })} className="hover:text-red-500">×</button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            }
            return (
              <input
                autoFocus={i === 0 && !isSessionLinkedTable && !isEventsTable}
                className={inputCls}
                placeholder={`Enter ${col}...`}
                value={inlineRecord[col] || ''}
                onChange={(e) => setInlineRecord({ ...inlineRecord, [col]: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleInlineSave();
                  if (e.key === 'Escape') setIsInlineAdding(false);
                }}
              />
            );
          })()}
        </td>
      ))}
    </>
  );
};


const handleUpdateRecord = async (draftOverride?: any) => {
  const draft = draftOverride ?? editDraft;
  if (!editingId || !draft) return;

  let collection = '';
  switch (activeTable) {
    case 'Events': collection = 'events'; break;
    case 'Session': collection = 'sessions'; break;
    case 'MusicLog': collection = 'musiclog'; break;
    case 'VideoLog': collection = 'videolog'; break;
    case 'Tracks': collection = 'media'; break;
    case 'DyatraChecklist': collection = 'checklist'; break;
    case 'Guidance & Learning': collection = 'guidance'; break;
    case 'LED': collection = 'led_details'; break;
    case 'DataSharing': collection = 'locations'; break;
    case 'VideoSetup': collection = 'videosetup'; break;
    case 'AudioSetup': collection = 'audiosetup'; break;
  }

  try {
    const id = draft._id || draft.id;
    const response = await window.fetch(`/api/${collection}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draft)
    });

    if (response.ok) {
      setEditingId(null);
      setEditDraft(null);
      setEditingCell(null);
      fetchAllData();
    } else {
      alert("Failed to update record");
    }
  } catch (error) {
    console.error("Update Error:", error);
  }
};

const handleExpandedSave = async (newDraft: any) => {
  const id = newDraft._id || newDraft.id;
  if (!id) return;
  let collection = '';
  switch (activeTable) {
    case 'Events': collection = 'events'; break;
    case 'Session': collection = 'sessions'; break;
    case 'MusicLog': collection = 'musiclog'; break;
    case 'VideoLog': collection = 'videolog'; break;
    case 'Tracks': collection = 'media'; break;
    case 'DyatraChecklist': collection = 'checklist'; break;
    case 'Guidance & Learning': collection = 'guidance'; break;
    case 'LED': collection = 'led_details'; break;
    case 'DataSharing': collection = 'locations'; break;
    case 'VideoSetup': collection = 'videosetup'; break;
    case 'AudioSetup': collection = 'audiosetup'; break;
    default: collection = activeTable.toLowerCase();
  }
  const updateData = { ...newDraft };
  delete updateData._id;
  try {
    await window.fetch(`/api/${collection}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    });
    fetchAllData();
  } catch (e) {
    console.error("Expand save error", e);
  }
};

const renderEditInputs = (_item: any) => {
  const cols = getTableColumns();
  const gw   = (n: string) => colWidths[n] || 200;
  const isEv = activeTable === 'Events';
  const isSe = activeTable === 'Session';
  const isML = activeTable === 'MusicLog';
  const isVL = activeTable === 'VideoLog';
  const isLinked = isML || isVL;

  const inputCls    = (col: string) => `w-full h-8 bg-white border-2 border-blue-500 rounded-md px-2.5 text-[12px] font-medium text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-200 outline-none${editingCell === col ? ' text-center' : ''}`;
  const readonlyCls = "w-full h-8 bg-slate-50 border border-slate-200 rounded-md px-2.5 text-[12px] text-slate-400 flex items-center italic select-none cursor-not-allowed";
  const saveKeys    = (e: React.KeyboardEvent) => { if (e.key === 'Enter') handleUpdateRecord(); if (e.key === 'Escape') { setEditingId(null); setEditDraft(null); setEditingCell(null); } };

  // Commit a single-field change and save immediately (avoids React async state issue)
  const commitField = (col: string, val: string) => {
    const nd = { ...editDraft, [col]: val };
    setEditDraft(nd);
    handleUpdateRecord(nd);
  };

  // Compute session auto-fill patch and save
  const commitSession = (sessionName: string) => {
    const s = sessions.find((x: any) => x["Session Name"] === sessionName);
    const patch: any = { Session: sessionName };
    if (s) {
      if (isML) {
        patch["Parent Event (from Session)"] = s["Parent Event"];
        patch["Date (from Session)"]         = s["Date"];
        patch["TimeOfDay (from Session)"]    = s["TimeOfDay"];
        patch["Occasion (from Session)"]     = s["Occasion"];
      } else {
        patch["Parent Event (from Session)"] = s["Parent Event"];
        patch["Date (from Session)"]         = s["Date"];
        patch["City (from Session)"]         = s["City"];
        patch["Venue (from Session)"]        = s["Venue"];
        patch["TimeOfDay (from Session)"]    = s["TimeOfDay"];
        patch["Occasion (from Session)"]     = s["Occasion"];
        patch["SessionType (from Session)"]  = s["SessionType"];
      }
    }
    const nd = { ...editDraft, ...patch };
    setEditDraft(nd);
    handleUpdateRecord(nd);
  };

  const isActiveCell = (col: string) => editingCell === col;

  return (
    <>
      {cols.map((col, i) => (
        <td
          key={i}
          className={`border-r border-b bg-white cursor-text transition-colors ${isActiveCell(col) ? 'px-1.5 py-1 border-blue-400 ring-2 ring-inset ring-blue-300 overflow-visible' : `px-4 py-3 border-slate-200 hover:bg-slate-50/60 overflow-hidden${i > 0 ? ' text-center' : ''}`}`}
          style={{ width: gw(col), minWidth: gw(col), maxWidth: gw(col) }}
          onClick={() => setEditingCell(col)}
        >
          {(() => {
            // ── AUTO-FILLED "from Session" — always readonly ─────────────────
            if (isLinked && col.includes('(from Session)')) {
              return <div className={readonlyCls}>{editDraft[col] || 'auto'}</div>;
            }

            // ── INACTIVE CELL — mirror renderRow formatting exactly ──────────
            if (!isActiveCell(col)) {
              const v = editDraft[col];
              const empty = <span className="text-slate-300 italic text-[12px]">—</span>;

              // Events: Occasion → blue badges
              if (col === 'Occasion') return v
                ? <div className="flex flex-wrap gap-1">{v.split(',').map((t: string, i: number) => <Badge key={i} className="bg-blue-600 text-white border-none text-[12px] px-2 py-0.5 rounded-sm">{t.trim()}</Badge>)}</div>
                : empty;

              // Events: City → orange badges  |  Session: City → blue badge
              if (col === 'City') return v
                ? <div className="flex flex-wrap gap-1">{v.split(',').map((t: string, i: number) => (
                    isEv
                      ? <Badge key={i} className="bg-orange-500 text-white border-none text-[12px] px-2 py-0.5 rounded-sm">{t.trim()}</Badge>
                      : <Badge key={i} className="bg-blue-50 text-blue-600 border border-blue-100 text-[11px] font-bold px-2 py-0.5 rounded uppercase">{t.trim()}</Badge>
                  ))}</div>
                : empty;

              // Events: Year → brand-primary badge
              if (isEv && col === 'Year') return v
                ? <Badge className="bg-brand-primary/10 text-brand-primary border border-brand-primary/20 font-black text-[12px] px-3 py-1 rounded-md shadow-sm tracking-tighter">{v}</Badge>
                : empty;

              // Events: Sessions → linked chips
              if (isEv && col === 'Sessions') {
                const val = v || editDraft['Imported table'] || '';
                const names = val.split(',').map((s: string) => s.trim()).filter(Boolean);
                return names.length > 0
                  ? <div className="flex flex-wrap gap-1.5 overflow-hidden">{names.map((sName: string, i: number) => {
                      const linked = sessions.find((s: any) => s["Session Name"] === sName);
                      return <Badge key={i} className={`text-[12px] font-semibold px-2 py-0.5 rounded-sm ${linked ? 'bg-brand-primary/10 text-brand-primary border border-brand-primary/30' : 'bg-slate-100 text-slate-700 border border-slate-300'}`}>{sName}{linked && <ArrowUpRight className="inline h-3 w-3 ml-0.5 opacity-60" />}</Badge>;
                    })}</div>
                  : empty;
              }

              // Session: TimeOfDay → coloured badge
              if (isSe && col === 'Time Of Day') return v
                ? <Badge className={`${v.toLowerCase().includes('morn') ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-blue-50 text-blue-600 border-blue-100'} text-[11px] font-bold px-2 py-0.5 rounded uppercase`}>{v}</Badge>
                : empty;

              // Session: SessionType → italic
              if (isSe && col === 'SessionType') return <span className="text-[13px] text-slate-700 italic truncate block">{v || empty}</span>;

              // Session: Notes → muted italic
              if (isSe && col === 'Notes') return <span className="text-[13px] text-slate-500 italic truncate block">{v || empty}</span>;

              // MusicLog / VideoLog: Session field → link style
              if (isLinked && col === 'Session') return v
                ? <span className="flex items-center gap-1 text-[13px] font-semibold text-slate-900 cursor-pointer hover:text-brand-primary hover:underline">{v}<ArrowUpRight className="h-3 w-3 shrink-0 opacity-40" /></span>
                : empty;

              // MusicLog: Track → brand-accent bold
              if (isML && col === 'Track') return <span className="text-[13px] font-bold text-brand-accent truncate block">{v || empty}</span>;

              // MusicLog: PlayID / VideoLog: VideoPlayId → mono colored
              if ((isML && col === 'PlayID') || (isVL && col === 'VideoPlayId')) return <span className={`font-mono text-[13px] ${isVL ? 'text-indigo-500' : 'text-brand-primary'}`}>{v || empty}</span>;

              // Date-like columns → mono
              if (['DateFrom', 'DateTo', 'Date', 'PlayedAt', 'Duration'].includes(col) || col.startsWith('Date (')) return <span className="font-mono text-[13px] text-slate-700">{v || empty}</span>;

              // Default → plain text
              return <span className="text-[13px] text-slate-700 truncate block">{v || empty}</span>;
            }

            // ── ACTIVE CELL BELOW ────────────────────────────────────────────

            // ── LINKED SESSION (MusicLog / VideoLog) ─────────────────────────
            if (isLinked && col === 'Session') {
              return (
                <CellDropdown
                  value={editDraft['Session'] || ''}
                  options={sessions.map((s: any) => s["Session Name"])}
                  onCommit={commitSession}
                  onCancel={() => { setEditingId(null); setEditDraft(null); }}
                  placeholder="Select session…"
                  tagClass="bg-brand-primary/10 text-brand-primary text-[11px] font-semibold px-2 py-0.5 rounded-sm border border-brand-primary/20"
                />
              );
            }
            // ── DATE FIELDS ─────────────────────────────────────────────────
            if ((isEv && (col === 'DateFrom' || col === 'DateTo')) || (isSe && col === 'Date')) {
              return <input type="date" className={inputCls(col)} value={editDraft[col] || ''} onChange={e => setEditDraft({ ...editDraft, [col]: e.target.value })} onBlur={handleUpdateRecord} onKeyDown={saveKeys} autoFocus />;
            }
            // ── EVENTS: SESSIONS multi-chip ──────────────────────────────────
            if (isEv && col === 'Sessions') {
              return (
                <SessionPicker
                  value={editDraft['Sessions'] || ''}
                  allSessions={sessions}
                  onCommit={val => commitField('Sessions', val)}
                  onCancel={() => { setEditingId(null); setEditDraft(null); }}
                />
              );
            }
            // ── DROPDOWN FIELDS ──────────────────────────────────────────────
            let opts: string[] = [];
            if (isEv && col === 'Occasion')
              opts = [...new Set(events.map((e: any) => e.Occasion).filter(Boolean).flatMap((o: string) => o.split(',').map((x: string) => x.trim())).filter(Boolean))].sort() as string[];
            else if ((isEv || isSe) && col === 'City')
              opts = [...new Set([...events.map((e: any) => e.City), ...sessions.map((s: any) => s.City)].filter(Boolean).flatMap((c: string) => c.split(',').map((x: string) => x.trim())).filter(Boolean))].sort() as string[];
            else if (isEv && col === 'Year') {
              const yr = new Date().getFullYear();
              opts = Array.from({ length: 11 }, (_, k) => String(yr + 2 - k));
            } else if (isSe && col === 'Occasion')
              opts = [...new Set(sessions.map((s: any) => s.Occasion).filter(Boolean).flatMap((o: string) => o.split(',').map((x: string) => x.trim())).filter(Boolean))].sort() as string[];
            else if (isSe && col === 'Time Of Day')
              opts = [...new Set(sessions.map((s: any) => s["Time Of Day"]).filter(Boolean))].sort() as string[];
            else if (isSe && col === 'SessionType')
              opts = [...new Set(sessions.map((s: any) => s.SessionType).filter(Boolean))].sort() as string[];
            else if (isSe && col === 'Parent Event')
              opts = events.map((e: any) => e["Event Name"]).filter(Boolean).sort() as string[];

            const tagClass =
              col === 'Occasion' ? 'bg-blue-600 text-white text-[12px] font-semibold px-2 py-0.5 rounded-sm' :
              col === 'City'     ? 'bg-orange-500 text-white text-[12px] font-semibold px-2 py-0.5 rounded-sm' :
              col === 'Year'     ? 'bg-brand-primary/10 text-brand-primary text-[12px] font-black px-3 py-0.5 rounded-sm border border-brand-primary/20' :
              undefined;

            if (opts.length > 0 || ((isEv && (col === 'Occasion' || col === 'City' || col === 'Year')) || (isSe && (col === 'City' || col === 'Occasion' || col === 'Time Of Day' || col === 'SessionType' || col === 'Parent Event')))) {
              return (
                <CellDropdown
                  value={editDraft[col] || ''}
                  options={opts}
                  onCommit={val => commitField(col, val)}
                  onCancel={() => { setEditingId(null); setEditDraft(null); }}
                  placeholder={`Select ${col}…`}
                  tagClass={tagClass}
                />
              );
            }
            // ── DEFAULT TEXT INPUT ───────────────────────────────────────────
            return (
              <input
                autoFocus
                className={inputCls(col)}
                value={editDraft[col] || ''}
                onChange={e => setEditDraft({ ...editDraft, [col]: e.target.value })}
                onBlur={handleUpdateRecord}
                onKeyDown={saveKeys}
              />
            );
          })()}
        </td>
      ))}
    </>
  );
};

const startInlineAdd = () => {
  setInlineRecord({});
  setIsInlineAdding(true);
  // Auto-scroll to bottom
  setTimeout(() => {
    const tableContainer = document.querySelector('.overflow-auto');
    if (tableContainer) tableContainer.scrollTop = tableContainer.scrollHeight;
  }, 100);
};

const handleInlineSave = async () => {
  let collection = '';
  // Mapping table to MongoDB collection
  switch (activeTable) {
    case 'Events': collection = 'events'; break;
    case 'Session': collection = 'sessions'; break;
    case 'MusicLog': collection = 'musiclog'; break;
    case 'VideoLog': collection = 'videolog'; break;
    case 'Tracks': collection = 'media'; break;
    case 'DyatraChecklist': collection = 'checklist'; break;
    case 'Guidance & Learning': collection = 'guidance'; break;
    case 'LED': collection = 'led_details'; break;
    case 'DataSharing': collection = 'locations'; break;
  }

  // Optional: Add logic here to rename keys if database fields differ from column names
  // For example: if (activeTable === 'Events') data.name = inlineRecord["Event Name"];

  try {
    const response = await window.fetch(`/api/${collection}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(inlineRecord)
    });

    if (response.ok) {
      setIsInlineAdding(false);
      setInlineRecord({});
      fetchAllData();
    } else {
      alert("Error saving record");
    }
  } catch (error) {
    console.error("Inline Save Error:", error);
  }
};

const memoizedData = useMemo(() => getProcessedData(), [
  filteredData, 
  sortBy, 
  groupByField, 
  isInlineAdding,
  collapsedGroups
]);

const deleteImage = (sessionId: string, imageIndex: number) => {
  setSessionImages(prev => {
    const currentImages = [...(prev[sessionId] || [])];
    currentImages.splice(imageIndex, 1); // Remove the specific image
    return {
      ...prev,
      [sessionId]: currentImages
    };
  });
};
  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;

    const userMessage = chatInput;
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setChatInput('');
    setIsTyping(true);

    // Prepare context for Gemini
    const context = JSON.stringify({
      currentEvent: events.find(e => (e as any).id === selectedEventId),
      media,
      checklist,
      ledDetails,
      rentals,
      guidance
    });

    const aiResponse = await getGeminiResponse(userMessage, context);
   setChatMessages(prev => [
  ...prev,
  { role: 'ai', content: aiResponse ?? "" }
]);
    setIsTyping(false);
  };

// 1. FIRST PRIORITY: SHOW LOADING PULSE WHILE INITIALIZING
// 1. If we are still checking localStorage for an existing session, show a clean loader
if (loading) {
  return (
    <div className="flex h-screen bg-[#07080d] items-center justify-center">
      <motion.div 
        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} 
        transition={{ repeat: Infinity, duration: 2 }}
        className="h-10 w-10 bg-brand-primary rounded-xl"
      />
    </div>
  );
}

// 2. ABSOLUTE GATE: If no user is logged in, ONLY show the Login Page
if (!user) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#07080d] p-4 font-sans relative">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[480px] bg-white rounded-[32px] sm:rounded-[48px] p-8 sm:p-12 text-center shadow-[0_20px_60px_rgba(0,0,0,0.6)] relative z-10 overflow-hidden"
      >
        {/* Top blue accent bar */}
        <div className="absolute top-0 left-0 w-full h-2 bg-brand-primary" />
        
        {/* Logo */}
        <div className="flex justify-center mb-10">
          <div className="h-24 w-24 bg-brand-primary rounded-[32px] flex items-center justify-center shadow-2xl shadow-brand-primary/30">
            <Zap className="h-12 w-12 text-white fill-white" />
          </div>
        </div>

        {/* Heading */}
        <div className="space-y-3 mb-12">
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">
            DYATRA <span className="text-brand-primary">OPS</span>
          </h1>
          <div className="h-px w-12 bg-slate-100 mx-auto my-4" />
          <p className="text-brand-primary font-black uppercase tracking-[0.2em] text-[10px]">
            Authorized Portal Access Center
          </p>
        </div>

        {loginError && (
          <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl text-[11px] font-bold mb-8">
            {loginError}
          </div>
        )}

        {/* Google Login Button */}
        <div className="space-y-10">
          <Button 
            onClick={handleGoogleLogin}
            className="w-full bg-brand-primary hover:bg-brand-primary/95 text-white font-black py-9 text-base rounded-[24px] flex items-center justify-center gap-4 transition-all active:scale-[0.97] shadow-xl shadow-brand-primary/20 group"
          >
            <div className="bg-white p-1.5 rounded-lg group-hover:scale-110 transition-transform">
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            </div>
            <span className="uppercase tracking-widest text-[13px]">Sign in with Google</span>
          </Button>

          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest opacity-60">
            Enterprise AV Operations Management
          </p>
        </div>
      </motion.div>

      {/* Deep background glow */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] bg-brand-primary/10 blur-[140px] rounded-full" />
    </div>
  );
}

// 3. DATABASE HEALTH CHECK: Only show this if the user is authenticated but DB is down
if (!health?.mongodb) {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-[#07080d] text-white p-8 text-center font-sans">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-[40px] p-12 shadow-2xl">
        <Zap className="h-12 w-12 text-brand-primary mx-auto mb-6" />
        <h1 className="text-2xl font-black uppercase tracking-tighter mb-4">Connection Required</h1>
        <p className="text-slate-400 text-sm leading-relaxed mb-10">
          Authenticated as <strong>{user?.name}</strong>, but the operational database is currently unreachable.
        </p>
        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
          <motion.div animate={{ x: ['-100%', '100%'] }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }} className="h-full w-1/3 bg-brand-primary" />
        </div>
      </motion.div>
    </div>
  );
}
  return (
    <div className="flex h-screen bg-[#07080d] overflow-hidden text-slate-200 relative selection:bg-brand-primary/30">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}


<style dangerouslySetInnerHTML={{ __html: `
  .custom-sidebar-scrollbar::-webkit-scrollbar {
    width: 4px;
  }
  .custom-sidebar-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-sidebar-scrollbar::-webkit-scrollbar-thumb {
    background: #1e293b; /* Slate-800 */
    border-radius: 10px;
  }
  .custom-sidebar-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #3b82f6; /* Brand Blue */
  }
    .thin-scrollbar::-webkit-scrollbar {
    height: 6px; /* Horizontal height */
    width: 6px;  /* Vertical width */
  }
  .thin-scrollbar::-webkit-scrollbar-track {
    background: #f8fafc; /* Very light slate */
    border-radius: 10px;
  }
  .thin-scrollbar::-webkit-scrollbar-thumb {
    background: #cbd5e1; /* Slate-300 */
    border-radius: 10px;
    border: 1px solid #f8fafc; /* Adds padding look */
  }
  .thin-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #94a3b8; /* Slate-400 */
  }
`
}} />

<aside 
  className={`fixed inset-y-0 left-0 z-50 bg-[#0f111a] flex flex-col shrink-0 border-r border-slate-800/60 transition-all duration-300 ease-in-out lg:relative 
  /* Mobile: Hidden off-screen by default, slide in when open */
  ${isSidebarOpen ? 'translate-x-0 w-[280px] shadow-2xl' : '-translate-x-full lg:translate-x-0 w-[280px] lg:w-[80px]'} 
  /* Web: Handle expanded state */
  ${isSidebarOpen && 'lg:w-[260px]'}`}
>
  {/* Close button - Only visible on Mobile when sidebar is open */}
  <div className="lg:hidden absolute right-4 top-5">
    <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(false)} className="text-slate-400">
      <X className="h-6 w-6" />
    </Button>
  </div>
 {/* SIDEBAR HEADER: Logo + Professional Toggle */}
<div className={`flex border-b border-slate-800/40 transition-all duration-300 overflow-hidden ${
  isSidebarOpen 
    ? 'flex-row items-center justify-between px-6 h-20' 
    : 'flex-col items-center py-6 gap-6 h-auto'
}`}>
  
   {/* 1. THE TOGGLE BUTTON (Comes first when closed) */}
  <button 
    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
    className={`p-2 rounded-lg transition-all duration-200 group ${
      isSidebarOpen 
        ? 'text-slate-500 hover:text-white hover:bg-slate-800/60 order-2' 
        : 'text-brand-primary bg-brand-primary/10 border border-brand-primary/20 hover:bg-brand-primary hover:text-white order-1 scale-110 shadow-lg shadow-brand-primary/10'
    }`}
    title={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
  >
    {isSidebarOpen ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeftOpen className="h-5 w-5" />}
  </button>
  {/* 2. LOGO SECTION (Comes second when closed) */}
  <div className={`flex items-center gap-3 transition-all duration-300 ${
    isSidebarOpen ? 'order-1' : 'order-2'
  }`}>
    <div className="h-9 w-9 bg-brand-primary rounded-xl flex items-center justify-center shadow-lg shadow-brand-primary/20 shrink-0">
      <Zap className="h-5 w-5 text-white fill-white" />
    </div>
    
    {isSidebarOpen && (
      <motion.div 
        initial={{ opacity: 0, x: -10 }} 
        animate={{ opacity: 1, x: 0 }} 
        className="whitespace-nowrap"
      >
        <div className="text-sm font-black tracking-tighter text-white uppercase leading-none">Dyatra Hub</div>
        <div className="text-[9px] font-bold text-slate-500 tracking-[0.2em] uppercase mt-1">Ops Center</div>
      </motion.div>
    )}
  </div>
</div>
  
  {/* NAVIGATION AREA WITH VISIBLE SCROLLBAR */}
  <ScrollArea className="flex-1 custom-sidebar-scrollbar overflow-y-auto">
    <div className="px-3 py-6 space-y-8 overflow-hidden">
      
      {/* SECTION 1: MASTER DATA */}
      <div>
        {isSidebarOpen && (
          <motion.span 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 block mb-4 whitespace-nowrap"
          >
            Master Data
          </motion.span>
        )}
        
        <div className="space-y-1">
          {[
            { icon: LayoutGrid, label: 'Home' }, 
           { icon: Calendar, label: 'Events' },
          { icon: MessageSquare, label: 'Session' },
          { icon: Music, label: 'MusicLog' },
          { icon: Video, label: 'VideoLog' },
          { icon: FileText, label: 'Guidance & Learning' },
          { icon: Monitor, label: 'LED' },
          { icon: CheckSquare, label: 'DyatraChecklist' },
          { icon: Search, label: 'DataSharing' },
          { icon: Video, label: 'VideoSetup' },
          { icon: Zap, label: 'AudioSetup' },
          { icon: Play, label: 'Tracks' },
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => { setActiveTable(item.label); setViewingRecord(null); }}
              title={!isSidebarOpen ? item.label : ""}
              className={`w-full flex items-center rounded-xl transition-all duration-200 group
              ${isSidebarOpen ? 'px-4 py-3 gap-4' : 'p-3 justify-center'}
              ${activeTable === item.label 
                ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800/40'}`}
            >
              <item.icon className={`h-5 w-5 shrink-0 transition-transform ${activeTable === item.label ? '' : 'group-hover:scale-110'}`} />
              {isSidebarOpen && (
                <motion.span 
                  initial={{ opacity: 0, x: -10 }} 
                  animate={{ opacity: 1, x: 0 }}
                  className="text-sm font-bold whitespace-nowrap overflow-hidden text-ellipsis"
                >
                  {item.label}
                </motion.span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* SECTION 2: QUICK ACTIONS */}
      <div>
        {isSidebarOpen && (
          <motion.span 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 block mb-4 whitespace-nowrap"
          >
            Quick Actions
          </motion.span>
        )}
        
        <div className="space-y-1">
          {[
            { icon: Truck, label: 'Export Base' },
            { icon: Search, label: 'Airtable Sync' },
          ].map((item) => (
            <button
              key={item.label}
              title={!isSidebarOpen ? item.label : ""}
              className={`w-full flex items-center rounded-xl transition-all duration-200 group
              ${isSidebarOpen ? 'px-4 py-3 gap-4' : 'p-3 justify-center'}
              text-slate-400 hover:text-white hover:bg-slate-800/40`}
            >
              <item.icon className="h-5 w-5 shrink-0 group-hover:scale-110 transition-transform" />
              {isSidebarOpen && (
                <motion.span 
                  initial={{ opacity: 0, x: -10 }} 
                  animate={{ opacity: 1, x: 0 }}
                  className="text-sm font-medium whitespace-nowrap"
                >
                  {item.label}
                </motion.span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  </ScrollArea>

  {/* USER PROFILE SECTION */}
  <div className={`p-5 mt-auto border-t border-slate-800/60 bg-[#0d0f17] flex items-center transition-all duration-300 ${isSidebarOpen ? 'gap-3' : 'justify-center'}`}>
    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white font-black text-sm shrink-0 shadow-lg">
      {user?.name?.[0]?.toUpperCase() || 'G'}
    </div>
    
    {isSidebarOpen && (
      <motion.div 
        initial={{ opacity: 0, x: -10 }} 
        animate={{ opacity: 1, x: 0 }} 
        className="flex-1 min-w-0"
      >
        <div className="text-sm font-black text-white truncate uppercase">
          {user?.name || 'it_sevarpit'}
        </div>
        <div className="text-[9px] text-brand-primary font-black uppercase tracking-widest mt-0.5 opacity-80">
          ADMIN
        </div>
      </motion.div>
    )}

    {isSidebarOpen && (
      <button 
        onClick={() => setUser(null)}
        className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors"
      >
        <LogOut className="h-4 w-4" />
      </button>
    )}
  </div>
</aside>
{isSidebarOpen && (
  <div 
    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" 
    onClick={() => setIsSidebarOpen(false)}
  />
)}

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative bg-brand-bg overflow-hidden">
      <header className="sticky top-0 z-40 w-full h-auto min-h-[80px] bg-white border-b border-slate-200 flex flex-col md:flex-row items-center justify-between px-4 py-4 md:py-0 md:px-8 gap-4 shrink-0 shadow-sm">
  <div className="flex items-center justify-between w-full md:w-auto gap-4">
    {/* Hamburger for Mobile */}
    <Button 
      variant="ghost" 
      size="icon" 
      className="lg:hidden text-brand-text-muted"
      onClick={() => setIsSidebarOpen(true)}
    >
      <Menu className="h-6 w-6" />
    </Button>

    {/* Search Input (Placed on the far left) */}
    {activeTable !== 'Home' && (
    <div className="relative hidden sm:block">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-500" />
      <Input
        placeholder="Search..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="bg-brand-bg w-[120px] md:w-[180px] pl-8 h-9 text-xs"
      />
    </div>
    )}
  </div>

<div className="flex items-center justify-between w-full md:w-auto gap-1.5 md:gap-2">

    {/* 3. VIEW SWITCHER */}
  {activeTable !== 'Home' && <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-300 h-8 items-center">
   <Button 
  size="sm" 
  variant="ghost"
  onClick={() => setViewMode('visual')} 
  className={`h-8 px-3 flex items-center gap-1.5 rounded-lg transition-all ${
    viewMode === 'visual' 
      ? 'bg-white text-brand-primary shadow-sm' 
      : 'text-slate-400'
  }`}
>
  <LayoutGrid className="h-4 w-4" />
  <span className="text-xs font-semibold hidden sm:inline">Visual</span>
</Button>
    <Button 
  size="sm" 
  variant="ghost"
  onClick={() => setViewMode('grid')} 
  className={`h-8 px-3 flex items-center gap-1.5 rounded-lg transition-all ${
    viewMode === 'grid' 
      ? 'bg-white text-brand-primary shadow-sm' 
      : 'text-slate-400'
  }`}
>
  <Grid className="h-4 w-4" />
  <span className="text-xs font-semibold hidden sm:inline">Grid</span>
</Button>
  </div>}


  {/* 1. GROUP BY + SORT BY (hidden on Home) */}
  {activeTable !== 'Home' && <>
  <div className="relative hidden sm:block">
  <button
    onClick={() => { setIsGroupOpen(!isGroupOpen); setIsSortOpen(false); }}
    className="flex items-center bg-white border border-slate-300 rounded-xl px-4 h-10 shadow-sm hover:border-brand-primary/50 transition-all group min-w-[180px]"
  >
    <Layers className="h-4 w-4 text-slate-500 mr-2 shrink-0" />
    <span className="text-xs font-bold text-slate-800 uppercase tracking-wide truncate mr-6">
      {groupByField || "No Grouping"}
    </span>
    <ChevronDown className={`absolute right-3 h-4 w-4 text-slate-400 transition-transform ${isGroupOpen ? 'rotate-180' : ''}`} />
  </button>
  <AnimatePresence>
    {isGroupOpen && (
      <>
        <div className="fixed inset-0 z-40" onClick={() => setIsGroupOpen(false)} />
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 5 }}
          className="absolute top-full left-0 mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-y-auto max-h-80 scrollbar-hide py-2"
        >
          <button onClick={() => { setGroupByField(null); setIsGroupOpen(false); }} className="w-full text-left px-4 py-2.5 text-sm font-semibold text-slate-400 hover:bg-slate-50 uppercase">No Grouping</button>
          {getTableColumns().map(col => (
            <button key={col} onClick={() => { setGroupByField(col); setIsGroupOpen(false); }} className="w-full text-left px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-brand-primary hover:text-white uppercase transition-colors">{col}</button>
          ))}
        </motion.div>
      </>
    )}
  </AnimatePresence>
</div>

<div className="relative hidden sm:block">
  <button
    onClick={() => { setIsSortOpen(!isSortOpen); setIsGroupOpen(false); }}
    className="flex items-center bg-white border border-slate-300 rounded-xl px-4 h-10 shadow-sm hover:border-brand-primary/50 transition-all group min-w-[180px]"
  >
    <ArrowUpDown className="h-4 w-4 text-slate-500 mr-2 shrink-0" />
    <span className="text-xs font-bold text-slate-800 uppercase tracking-wide truncate mr-10">
      {sortBy ? `By ${sortBy.field}` : "No Sort"}
    </span>
    {sortBy && (
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSortBy({ ...sortBy, direction: sortBy.direction === 'asc' ? 'desc' : 'asc' }); }}
        className="absolute right-10 h-6 w-6 hover:bg-slate-100 rounded-md transition-colors flex items-center justify-center bg-white border border-slate-200 shadow-sm z-10"
      >
        <span className="text-xs text-brand-primary font-bold leading-none">{sortBy.direction === 'asc' ? '↑' : '↓'}</span>
      </button>
    )}
    <ChevronDown className={`absolute right-3 h-4 w-4 text-slate-400 transition-transform ${isSortOpen ? 'rotate-180' : ''}`} />
  </button>
  <AnimatePresence>
    {isSortOpen && (
      <>
        <div className="fixed inset-0 z-40" onClick={() => setIsSortOpen(false)} />
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 5 }}
          className="absolute top-full left-0 mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-y-auto max-h-80 scrollbar-hide py-2"
        >
          <button onClick={() => { setSortBy(null); setIsSortOpen(false); }} className="w-full text-left px-4 py-2.5 text-sm font-semibold text-slate-400 hover:bg-slate-50 uppercase">No Sort</button>
          {getTableColumns().map(col => (
            <button key={col} onClick={() => { setSortBy({ field: col, direction: 'asc' }); setIsSortOpen(false); }} className="w-full text-left px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-brand-primary hover:text-white uppercase transition-colors">{col}</button>
          ))}
        </motion.div>
      </>
    )}
  </AnimatePresence>
</div>
  </>}
  {/* 4. NEW RECORD BUTTON */}
  {activeTable !== 'Home' && <Button
    onClick={() => {
      setInlineRecord({});
      setIsInlineAdding(true);
      setTimeout(() => {
        const container = document.querySelector('.overflow-auto');
        if (container) container.scrollTop = container.scrollHeight;
      }, 100);
    }}
    className="bg-brand-primary hover:bg-brand-primary/90 text-white h-10 px-4 shadow-md flex items-center gap-2 transition-transform active:scale-95 ml-1"
  >
    <Plus className="h-4 w-4" />
    <span className="hidden md:inline uppercase text-xs font-bold tracking-wide">Add Record</span>
  </Button>}

</div>
</header>

      {/* Mobile-only active filter bar */}
      {activeTable !== 'Home' && (groupByField || sortBy) && (
        <div className="sm:hidden flex items-center gap-2 px-4 py-2 bg-white border-b border-slate-200 overflow-x-auto shrink-0">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest shrink-0">Active:</span>
          {groupByField && (
            <button
              onClick={() => setGroupByField(null)}
              className="flex items-center gap-1 bg-brand-primary/10 text-brand-primary text-[10px] font-black uppercase px-2 py-1 rounded-lg border border-brand-primary/20 shrink-0"
            >
              <Layers className="h-3 w-3" />
              {groupByField}
              <X className="h-3 w-3" />
            </button>
          )}
          {sortBy && (
            <button
              onClick={() => setSortBy(null)}
              className="flex items-center gap-1 bg-slate-100 text-slate-700 text-[10px] font-black uppercase px-2 py-1 rounded-lg border border-slate-200 shrink-0"
            >
              <ArrowUpDown className="h-3 w-3" />
              {sortBy.field} {sortBy.direction === 'asc' ? '↑' : '↓'}
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      )}

        <div className="flex-1 overflow-y-auto bg-brand-bg p-3 md:p-8">
          <div className="max-w-[1400px] mx-auto space-y-6 lg:space-y-8">
            
            {activeTable === 'Home' ? (
  /* --- HOME DASHBOARD --- */
  (() => {
    const now = new Date();
    const hr = now.getHours();
    const greeting = hr < 12 ? 'Good Morning' : hr < 17 ? 'Good Afternoon' : 'Good Evening';
    const recentEvents = [...events].sort((a: any, b: any) => new Date(b.DateFrom || 0).getTime() - new Date(a.DateFrom || 0).getTime()).slice(0, 4);
    const recentSessions = [...sessions].sort((a: any, b: any) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()).slice(0, 5);
    const pendingChecklist = checklist.filter((c: any) => !c.done).slice(0, 6);
    const navLinks = [
      { label: 'Events', table: 'Events', Icon: Calendar, count: events.length, color: 'bg-blue-500' },
      { label: 'Sessions', table: 'Session', Icon: MessageSquare, count: sessions.length, color: 'bg-violet-500' },
      { label: 'Music Log', table: 'MusicLog', Icon: Music, count: musicLogs.length, color: 'bg-pink-500' },
      { label: 'Video Log', table: 'VideoLog', Icon: Video, count: videoLogs.length, color: 'bg-orange-500' },
      { label: 'Checklist', table: 'DyatraChecklist', Icon: CheckSquare, count: checklist.length, color: 'bg-green-500' },
      { label: 'LED', table: 'LED', Icon: Monitor, count: ledDetails.length, color: 'bg-yellow-500' },
      { label: 'Guidance', table: 'Guidance & Learning', Icon: FileText, count: guidance.length, color: 'bg-teal-500' },
      { label: 'Tracks', table: 'Tracks', Icon: Play, count: media.length, color: 'bg-red-500' },
    ];
    return (
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full space-y-5">

        {/* GREETING ROW */}
        <div className="flex items-end justify-between flex-wrap gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">{greeting}</p>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tighter leading-none mt-0.5">
              {user?.name?.split(' ')[0] || 'Welcome'} <span className="text-brand-primary">—</span>
            </h1>
            <p className="text-xs text-slate-400 font-semibold mt-1 uppercase tracking-widest">
              {now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-sm">
            <div className="h-8 w-8 rounded-xl bg-brand-primary flex items-center justify-center">
              <Zap className="h-4 w-4 text-white fill-white" />
            </div>
            <div>
              <div className="text-[9px] font-black uppercase tracking-widest text-slate-400">Dyatra Ops</div>
              <div className="text-xs font-black text-slate-800">Management Portal</div>
            </div>
          </div>
        </div>

        {/* STAT PILLS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Events', value: events.length, sub: 'across all years', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
            { label: 'Sessions', value: sessions.length, sub: 'recorded', color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-100' },
            { label: 'Music Plays', value: musicLogs.length, sub: 'log entries', color: 'text-pink-600', bg: 'bg-pink-50', border: 'border-pink-100' },
            { label: 'Video Plays', value: videoLogs.length, sub: 'log entries', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100' },
          ].map(s => (
            <div key={s.label} className={`${s.bg} border ${s.border} rounded-2xl p-4`}>
              <div className={`text-3xl font-black ${s.color} leading-none`}>{s.value}</div>
              <div className="text-[11px] font-black text-slate-700 mt-1 uppercase tracking-wide">{s.label}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* MAIN GRID: NAV + CHECKLIST */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Quick Navigate</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {navLinks.map(n => (
                <button key={n.table} onClick={() => setActiveTable(n.table)}
                  className="flex flex-col items-start gap-2 p-3 rounded-xl border border-slate-100 hover:border-brand-primary/30 hover:bg-brand-primary/5 transition-all text-left">
                  <div className={`h-8 w-8 ${n.color} rounded-lg flex items-center justify-center`}>
                    <n.Icon className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <div className="text-[11px] font-black text-slate-800 uppercase tracking-wide leading-none">{n.label}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{n.count} records</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Checklist</p>
              <button onClick={() => setActiveTable('DyatraChecklist')} className="text-[10px] font-black text-brand-primary uppercase tracking-widest hover:underline">View All</button>
            </div>
            {pendingChecklist.length === 0
              ? <div className="flex-1 flex items-center justify-center text-slate-300 text-xs font-bold uppercase">All clear ✓</div>
              : <div className="space-y-2 flex-1">
                  {pendingChecklist.map((c: any, i: number) => (
                    <div key={i} className="flex items-start gap-2 p-2 rounded-lg hover:bg-slate-50">
                      <div className="h-4 w-4 rounded border-2 border-slate-300 mt-0.5 shrink-0" />
                      <div>
                        <div className="text-[12px] font-semibold text-slate-800 leading-tight">{c["Task"] || '—'}</div>
                        {c["TaskGroup"] && <div className="text-[10px] text-slate-400 uppercase">{c["TaskGroup"]}</div>}
                      </div>
                    </div>
                  ))}
                </div>
            }
          </div>
        </div>

        {/* BOTTOM GRID: RECENT EVENTS + SESSIONS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Recent Events</p>
              <button onClick={() => setActiveTable('Events')} className="text-[10px] font-black text-brand-primary uppercase tracking-widest hover:underline">View All</button>
            </div>
            <div className="space-y-1">
              {recentEvents.length === 0 && <div className="text-slate-300 text-xs font-bold uppercase py-6 text-center">No events yet</div>}
              {recentEvents.map((ev: any, i: number) => (
                <div key={i} onClick={() => setActiveTable('Events')} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 cursor-pointer">
                  <div className="h-9 w-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                    <Calendar className="h-4 w-4 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-bold text-slate-800 truncate">{ev["Event Name"] || ev.EventName || '—'}</div>
                    <div className="text-[10px] text-slate-400">{ev.DateFrom || '—'}{ev.City ? ` · ${ev.City}` : ''}</div>
                  </div>
                  {ev.Year && <Badge className="bg-slate-100 text-slate-500 border-none text-[10px] font-black shrink-0">{ev.Year}</Badge>}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Recent Sessions</p>
              <button onClick={() => setActiveTable('Session')} className="text-[10px] font-black text-brand-primary uppercase tracking-widest hover:underline">View All</button>
            </div>
            <div className="space-y-1">
              {recentSessions.length === 0 && <div className="text-slate-300 text-xs font-bold uppercase py-6 text-center">No sessions yet</div>}
              {recentSessions.map((s: any, i: number) => (
                <div key={i} onClick={() => setActiveTable('Session')} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 cursor-pointer">
                  <div className="h-9 w-9 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center shrink-0">
                    <MessageSquare className="h-4 w-4 text-violet-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-bold text-slate-800 truncate">{s["Session Name"] || '—'}</div>
                    <div className="text-[10px] text-slate-400">{s["Parent Event"] || ''}{s["Date"] ? ` · ${s["Date"]}` : ''}</div>
                  </div>
                  {s["SessionType"] && <Badge className="bg-violet-50 text-violet-500 border border-violet-100 text-[10px] font-black shrink-0">{s["SessionType"]}</Badge>}
                </div>
              ))}
            </div>
          </div>
        </div>

      </motion.div>
    );
  })()
    ) :viewingRecord ? (
              <RecordDetailView
                item={viewingRecord}
                columns={getTableColumns()}
                tableName={activeTable}
                onBack={() => setViewingRecord(null)}
                sessions={sessions}
                onSessionClick={(s) => setLinkedSession(s)}
              />
            ) : (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <h2 className="text-lg font-bold text-brand-text-main">{activeTable}</h2>
                    <div className="h-4 w-px bg-brand-border" />
                   <span className="text-sm font-medium text-brand-text-muted">
                    {viewMode === 'visual' ? 'Visual Cards' : 'Data Grid'}
                   </span>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-2 md:gap-4">
  
  {/* MOVED: Export Button now appears before Count */}
  <Button 
    variant="ghost" 
    size="sm" 
    onClick={exportToCSV}
    className="h-8 px-3 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 flex items-center gap-2 transition-all active:scale-95"
  >
    <FileText className="h-3.5 w-3.5 text-slate-400" />
    <span className="text-[10px] font-black uppercase tracking-widest">Export CSV</span>
  </Button>

  

 
  
 
</div>
                </div>

                {viewMode === 'visual' ? (
                  activeTable === 'Events' ? (
  /* --- RESPONSIVE EVENTS GALLERY (Airtable Style) --- */
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 py-6">
    {[...filteredData]
      .sort((a, b) => new Date(a.DateFrom).getTime() - new Date(b.DateFrom).getTime()) // Ascending by Date
      .map((item: any) => (
        <motion.div 
          key={item.id || item._id} 
          onClick={() => setViewingRecord(item)}
          whileHover={{ y: -4 }}
          className="bg-white border border-slate-200 rounded-[20px] p-6 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col min-h-[300px]"
        >
          {/* 1. EVENT NAME HEADER */}
          <div className="text-l font-black text-slate-900 mb-6 leading-tight line-clamp-2">
            {item["Event Name"] || item.EventName || "Untitled Event"}
          </div>

          {/* 2. FIELDS LIST (MATCHING SCREENSHOT) */}
          <div className="space-y-5 flex-1">
            {/* EventID Field */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                EventID
              </label>
              <div className="text-[13px] font-medium text-slate-600 pl-0.5">
                — {/* Replace with item.EventID if available in your data */}
              </div>
            </div>

            {/* DateFrom Field */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                DateFrom
              </label>
              <div className="text-[13px] font-bold text-slate-800 pl-0.5">
                {item.DateFrom || "—"}
              </div>
            </div>

            {/* DateTo Field */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                DateTo
              </label>
              <div className="text-[13px] font-bold text-slate-800 pl-0.5">
                {item.DateTo || "—"}
              </div>
            </div>
          </div>

         
         
        </motion.div>
      ))}

    {/* ADD EVENT CARD */}
    <motion.div 
      onClick={openAddModal} 
      className="border-2 border-dashed border-slate-200 rounded-[20px] flex flex-col items-center justify-center p-8 text-slate-400 cursor-pointer hover:text-brand-primary hover:border-brand-primary/50 transition-all bg-white/50 min-h-[300px]"
    >
      <Plus className="h-8 w-8 mb-2" />
      <span className="text-[11px] font-black uppercase tracking-widest">New Event</span>
    </motion.div>
  </div>
) : activeTable === 'Tracks' ? (
  /* --- TRACKS GALLERY VIEW (Airtable Style) --- */
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 py-6">
    {filteredData.map((item: any) => (
      <motion.div 
        key={item.id || item._id} 
        onClick={() => setViewingRecord(item)}
        whileHover={{ y: -2 }}
        className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col min-h-[220px]"
      >
        {/* 1. TRACK TITLE */}
        <div className="text-[14px] font-bold text-slate-900 mb-5 leading-tight line-clamp-2 border-b border-slate-50 pb-2">
          {item["Title"] || item.title || "Unknown Track"}
        </div>

        {/* 2. CARD FIELDS */}
        <div className="space-y-4 flex-1">
          {/* Artist Field */}
          <div className="space-y-0.5">
            <label className="text-[10px] font-medium text-slate-400 uppercase tracking-tight block">
              Artist
            </label>
            <div className="text-[12px] font-semibold text-slate-700 truncate">
              {item["Artist"] || item.artist || "—"}
            </div>
          </div>

          {/* Album Field */}
          <div className="space-y-0.5">
            <label className="text-[10px] font-medium text-slate-400 uppercase tracking-tight block">
              Album
            </label>
            <div className="text-[12px] font-semibold text-slate-500 truncate">
              {item["Album"] || item.album || "—"}
            </div>
          </div>

          {/* Duration Field */}
          <div className="space-y-0.5">
            <label className="text-[10px] font-medium text-slate-400 uppercase tracking-tight block">
              Duration
            </label>
            <div className="text-[12px] font-semibold text-slate-500 truncate">
              {item["Duration"] || item.duration || "—"}
            </div>
          </div>
        </div>
      </motion.div>
    ))}

    {/* ADD TRACK CARD */}
    <motion.div 
      onClick={openAddModal} 
      className="border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center p-8 text-slate-400 cursor-pointer hover:text-brand-primary hover:border-brand-primary/50 transition-all bg-white/50 min-h-[220px]"
    >
      <Plus className="h-6 w-6 mb-2" />
      <span className="text-[10px] font-black uppercase tracking-widest">Add track</span>
    </motion.div>
  </div>
) : activeTable === 'DataSharing' ? (
  /* --- DATA SHARING GALLERY VIEW (Airtable Style) --- */
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 py-6">
    {filteredData.map((item: any) => {
      // Helper to match colors from the screenshot
      const getDeptStyles = (dept: string) => {
        const d = dept?.toLowerCase() || "";
        if (d.includes("mgmt")) return "bg-amber-100 text-amber-700 border-amber-200";
        if (d.includes("qc")) return "bg-cyan-100 text-cyan-700 border-cyan-200";
        if (d.includes("mm")) return "bg-rose-100 text-rose-700 border-rose-200";
        if (d.includes("lrd")) return "bg-slate-100 text-slate-700 border-slate-200";
        if (d.includes("editing")) return "bg-blue-100 text-blue-700 border-blue-200";
        return "bg-slate-50 text-slate-500 border-slate-200";
      };

      return (
        <motion.div 
          key={item.id || item._id} 
          onClick={() => setViewingRecord(item)}
          whileHover={{ y: -2 }}
          className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col min-h-[240px]"
        >
          {/* 1. SEVAK NAME (HEADER) */}
          <div className="text-[15px] font-bold text-slate-900 mb-4 truncate">
            {item["Sevak"] || "Unknown Sevak"}
          </div>

          {/* 2. CARD FIELDS */}
          <div className="space-y-4 flex-1">
            {/* Dept Field */}
            <div className="space-y-1">
              <label className="text-[10px] font-medium text-slate-400 uppercase tracking-tight block">
                Dept
              </label>
              <Badge className={`px-2.5 py-0.5 text-[11px] font-bold rounded-full border shadow-sm ${getDeptStyles(item["Dept"])}`}>
                {item["Dept"] || "—"}
              </Badge>
            </div>

            {/* Email Field */}
            <div className="space-y-1">
              <label className="text-[10px] font-medium text-slate-400 uppercase tracking-tight block">
                EmailId
              </label>
              <div className="text-[12px] font-medium text-slate-600 truncate">
                {item["EmailId"] || "—"}
              </div>
            </div>

            {/* ShareFacts Field */}
            <div className="space-y-1">
              <label className="text-[10px] font-medium text-slate-400 uppercase tracking-tight block">
                ShareFacts?
              </label>
              <div className="pt-0.5">
                {item["ShareFacts?"] === 'Yes' ? (
                  <div className="flex items-center text-green-600">
                     <CheckSquare className="h-4 w-4 fill-green-50" strokeWidth={3} />
                  </div>
                ) : (
                  <span className="text-slate-300 italic text-[11px]">Yes</span>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      );
    })}

    {/* ADD RECORD CARD */}
    <motion.div 
      onClick={openAddModal} 
      className="border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center p-8 text-slate-400 cursor-pointer hover:text-brand-primary hover:border-brand-primary/50 transition-all bg-white/50 min-h-[240px]"
    >
      <Plus className="h-6 w-6 mb-2" />
      <span className="text-[10px] font-black uppercase tracking-widest">Add record</span>
    </motion.div>
  </div>
) : activeTable === 'Guidance & Learning' ? (
  /* --- GUIDANCE & LEARNING GALLERY VIEW --- */
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 py-6">
    {filteredData.map((item: any) => {
      // Logic to extract URL from Airtable format: (https://...)
      const attachmentString = item["Attachments"] || "";
      const match = attachmentString.match(/\((https?:\/\/[^)]+)\)/);
      const imageUrl = match ? match[1] : null;

      return (
        <motion.div 
          key={item.id || item._id} 
          onClick={() => setViewingRecord(item)}
          whileHover={{ y: -2 }}
          className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col min-h-[380px]"
        >
          {/* 1. IMAGE AREA (Correctly parsing the Airtable URL) */}
          <div className="h-48 w-full bg-slate-50 border-b border-slate-100 flex items-center justify-center overflow-hidden">
            {imageUrl ? (
              <img 
                src={imageUrl} 
                className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" 
                alt="Attachment" 
              />
            ) : (
              <div className="flex flex-col items-center gap-2 opacity-20">
                <Monitor className="h-12 w-12 text-slate-400" />
              </div>
            )}
          </div>

          {/* 2. CARD CONTENT */}
          <div className="p-5 flex-1 flex flex-col">
            {/* Learning ID (The Large Number Header) */}
            <div className="text-[22px] font-bold text-slate-900 mb-5">
              {item["LearningId"] || "—"}
            </div>

            <div className="space-y-4 flex-1">
              {/* Event Field */}
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-slate-400 uppercase tracking-tight block">
                  Event
                </label>
                <div className="inline-flex bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[12px] font-semibold border border-slate-200">
                  {item["Event"] || "—"}
                </div>
              </div>

              {/* DateFrom Field */}
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-slate-400 uppercase tracking-tight block">
                  DateFrom (from Event)
                </label>
                <div className="text-[13px] font-medium text-slate-700">
                  {item["DateFrom (from Event)"] || "—"}
                </div>
              </div>

              {/* DateTo Field */}
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-slate-400 uppercase tracking-tight block">
                  DateTo (from Event)
                </label>
                <div className="text-[13px] font-medium text-slate-700">
                  {item["DateTo (from Event)"] || "—"}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      );
    })}

    {/* ADD FEEDBACK CARD */}
    <motion.div 
      onClick={openAddModal} 
      className="border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center p-8 text-slate-400 cursor-pointer hover:text-brand-primary hover:border-brand-primary/50 transition-all bg-white/50 min-h-[380px]"
    >
      <Plus className="h-6 w-6 mb-2" />
      <span className="text-[10px] font-black uppercase tracking-widest">Add Guidance & Learning</span>
    </motion.div>
  </div>
) :
                  activeTable === 'Session' ? (
                    /* --- 1. SESSION TIMELINE VIEW --- */
                    <div className="max-w-6xl mx-auto md:ml-4 py-4 md:py-8 relative">
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                  
                  {/* The Vertical Line: Hidden on very small screens or moved left */}
                  <div className="absolute left-[15px] md:left-[19px] top-0 bottom-0 w-0.5 bg-slate-800/40" />
                      <div className="space-y-8 md:space-y-12">
                        {[...filteredData]
                          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                          .map((item: any, idx: number) => {
                            const sessionId = item.id || item._id;
                            const images = sessionImages[sessionId] || [];
                            return (
                              <motion.div key={sessionId} onClick={() => setViewingRecord(item)} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="relative flex items-start gap-4 md:gap-8 group cursor-pointer">
                                <div className="relative z-10 flex items-center justify-center mt-5 md:mt-6">
                            <div className="h-8 w-8 md:h-10 md:h-10 rounded-full border border-slate-700 bg-brand-bg flex items-center justify-center shrink-0">
                              <div className={`h-2 w-2 md:h-2.5 md:w-2.5 rounded-full ${idx === 0 ? 'bg-brand-primary animate-pulse' : 'bg-brand-primary/40'}`} />
                            </div>
                          </div>
                                <div className="flex-1 bg-brand-surface border border-slate-800/90 rounded-2xl md:rounded-3xl p-4 md:p-8 shadow-2xl transition-all">
                            <div className="flex flex-col sm:flex-row justify-between items-start mb-4 md:mb-6 gap-2">
                  <div className="space-y-1">
                    {/* 1. PARENT EVENT NAME */}
                    <div className="text-[9px] md:text-[11px] font-black text-brand-primary uppercase tracking-[0.2em]">
                                  {item["Parent Event"] || "MASTER EVENT"}
                                </div>
                                <h3 className="text-xl md:text-3xl font-black text-white uppercase tracking-tighter leading-tight">
                                  {item["Session Name"]}
                                </h3>
                    
                    {/* 3. METADATA ROW */}
                     <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 md:mt-4 text-[9px] md:text-[10px] font-bold text-slate-500 uppercase">
                                  <div className="flex items-center gap-1.5"><Calendar className="h-3 md:h-3.5 w-3 md:w-3.5" /> {item["Date"]}</div>
                                  <div className="flex items-center gap-1.5"><Clock className="h-3 md:h-3.5 w-3 md:w-3.5" /> {item["Time Of Day"]}</div>
                                  <div className="flex items-center gap-1.5"><MapPin className="h-3 md:h-3.5 w-3 md:w-3.5" /> {item["Venue"]}</div>
                                </div>
                              </div>
                              <Badge className="bg-brand-primary/10 text-brand-primary text-[8px] md:text-[9px] px-2 py-0.5">
                                {item["SessionType"]}
                              </Badge>
                            </div>
                                   <div className="flex overflow-x-auto md:flex-wrap gap-3 md:gap-4 items-center pb-2 md:pb-0 scrollbar-hide">
                              {images.map((imgSrc, imgIdx) => (
                                <div key={imgIdx} className="relative h-32 md:h-40 w-48 md:w-64 shrink-0 rounded-xl overflow-hidden border border-slate-800">
                                  <img src={imgSrc} className="h-full w-full object-cover" alt="Upload" />
                                </div>
                              ))}
                                    <button onClick={(e) => { e.stopPropagation(); setActiveUploadId(sessionId); fileInputRef.current?.click(); }} className="h-32 md:h-40 w-32 md:w-48 shrink-0 rounded-xl border-2 border-dashed border-slate-700 flex flex-col items-center justify-center gap-2 text-slate-500">
                                <Plus className="h-5 w-5" />
                                <span className="text-[8px] font-black uppercase">Add Media</span>
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                      </div>
                    </div>
                  ) :activeTable === 'MusicLog' ? (
  /* --- RESPONSIVE MUSIC LOG GALLERY --- */
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 py-6">
    {filteredData.map((item: any) => (
      <motion.div 
        key={item.id || item._id} 
        onClick={() => setViewingRecord(item)}
        whileHover={{ y: -4 }}
        className="bg-white border border-slate-200 rounded-[24px] p-6 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col min-h-[340px]"
      >
        {/* 1. PLAY ID HEADER */}
        <div className="text-4xl font-bold text-slate-900 mb-6">
          {item["PlayID"] || "0"}
        </div>

        {/* 2. FIELDS CONTENT */}
        <div className="space-y-5 flex-1">
          {/* Session Field */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
              Session
            </label>
            <div className="inline-flex bg-slate-100 text-slate-700 px-3 py-1 rounded-lg text-[12px] font-bold border border-slate-200/50">
              {item["Session"] || "—"}
            </div>
          </div>

          {/* Parent Event Field */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
              Parent Event (from Session)
            </label>
            <div className="inline-flex bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg text-[12px] font-bold border border-blue-100/60 leading-tight">
              {item["Parent Event (from Session)"] || "—"}
            </div>
          </div>

          {/* Date Field */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
              Date (from Session)
            </label>
            <div className="text-[13px] font-bold text-slate-600 pl-1">
              {item["Date (from Session)"] || "—"}
            </div>
          </div>
        </div>

       
      </motion.div>
    ))}
                      <Button onClick={openAddModal} className="w-full border-2 border-dashed border-slate-700 h-16 rounded-2xl text-slate-500 hover:text-brand-primary hover:border-brand-primary bg-slate-900/10 transition-all uppercase text-[10px] font-black tracking-widest"><Plus className="h-5 w-5 mr-2" /> New Music Entry</Button>
                    </div>
                  ) : activeTable === 'VideoLog' ? (
  /* --- RESPONSIVE VIDEOLOG GALLERY (Airtable Style) --- */
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 py-6">
    {filteredData.map((item: any) => {
      // Logic for City pill colors based on your screenshot
      const getCityColor = (city: string) => {
        const c = city?.toLowerCase() || "";
        if (c.includes("dharampur")) return "bg-purple-100 text-purple-600 border-purple-200";
        if (c.includes("ahmedabad")) return "bg-blue-100 text-blue-600 border-blue-200";
        if (c.includes("mumbai")) return "bg-orange-100 text-orange-600 border-orange-200";
        return "bg-slate-100 text-slate-600 border-slate-200";
      };

      return (
        <motion.div 
          key={item.id || item._id} 
          onClick={() => setViewingRecord(item)}
          whileHover={{ y: -4 }}
          className="bg-white border border-slate-200 rounded-[20px] p-6 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col min-h-[320px]"
        >
          {/* 1. VIDEOPLAY ID */}
          <div className="text-3xl font-bold text-slate-800 mb-6">
            {item["VideoPlayId"] || "0"}
          </div>

          {/* 2. LABELED CONTENT */}
          <div className="space-y-5 flex-1">
            {/* Session Field */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                Session
              </label>
              <div className="inline-flex bg-slate-50 text-slate-700 px-3 py-1 rounded-md text-[12px] font-bold border border-slate-200/60">
                {item["Session"] || "—"}
              </div>
            </div>

            {/* Date Field */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                Date (from Session)
              </label>
              <div className="text-[13px] font-bold text-slate-600 pl-1">
                {item["Date (from Session)"] || "—"}
              </div>
            </div>

            {/* City Field (Colored Pill) */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                City (from Session)
              </label>
              <div className={`inline-flex px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-tight border ${getCityColor(item["City (from Session)"])}`}>
                {item["City (from Session)"] || "—"}
              </div>
            </div>
          </div>

          {/* 3. VIDEO TITLE PILL (BOTTOM) */}
          
        </motion.div>
      );
    })}
                    <Button onClick={openAddModal} className="w-full border-2 border-dashed border-slate-700 h-16 rounded-2xl text-slate-500 hover:text-indigo-400 hover:border-indigo-400 bg-slate-900/10 transition-all uppercase text-[10px] font-black tracking-widest"><Plus className="h-5 w-5 mr-2" /> New Video Entry</Button>
                  </div>
                  ) : (
                    /* --- 2. STANDARD GRID VIEW (Darker Borders) --- */
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                  {filteredData.map((item: any) => (
                    <motion.div 
                      key={item.id || item._id} 
                      onClick={() => setViewingRecord(item)}
                      className="group relative bg-brand-surface border border-slate-800/90 rounded-2xl p-4 md:p-6 cursor-pointer hover:border-brand-primary/40 transition-all"
                    >
                          {/* Card Header: Icon + Status */}
                          <div className="flex items-start justify-between mb-5">
                           <div className="h-10 w-10 bg-brand-primary/10 rounded-xl flex items-center justify-center text-brand-primary mb-4">
                              {activeTable === 'Events' ? <Calendar className="h-5 w-5" /> : 
                               activeTable === 'Tracks' ? <Play className="h-5 w-5" /> : <LayoutGrid className="h-5 w-5" />}
                            </div>
                           
                          </div>

                          {/* Card Body: Dynamic Content */}
                          <div className="space-y-3">
                            
                             {activeTable === 'LED' && (
                              
                       <div className="h-36 md:h-44 w-full rounded-xl overflow-hidden bg-black mb-4">
                          {/* 1. IMAGE GALLERY (Flip Logic Integrated) */}
                   
                          {(() => {
                             
                            const match = item["Images"]?.match(/\((https?:\/\/[^)]+)\)/);
                            const firstImg = match ? match[1] : null;
                            return firstImg ? (
                              <CardImageGallery imageString={item["Images"] || ""} />
                            ) : (
                              <div className="flex flex-col items-center gap-2 opacity-20">
                                
                                <Monitor className="h-10 w-10 text-slate-700" />
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">No Preview</span>
                              </div>
                            );
                          })()}
                        </div>
                      )}
                        <div className="space-y-1">
                 
                <h3 className="text-sm md:text-base font-black text-brand-text-main uppercase leading-snug truncate">
                  {activeTable === 'Events' ? (item["Event Name"] || item.EventName) : 
                   activeTable === 'LED' ? (item["Parent Event (from 🕘 Session)"] || "Untitled LED") :
                   activeTable === 'Guidance & Learning' ? item["Event"] :
                   activeTable === 'DyatraChecklist' ? item["Task"] :
                   activeTable === 'Tracks' ? item["Title"] : // Add this line
                   (item.name || item.title || "Untitled Record")}
                </h3>
                  {activeTable === 'Tracks' && (
                    <p className="text-[11px] font-bold text-brand-primary uppercase tracking-widest mt-1">
                      {item["Artist"] || item.artist }
                    </p>
                  )}
                </div>
                 



                            {/* 2. SPECIFIC DETAILS FOR EVENTS */}
                           {activeTable === 'Events' ? (
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center gap-2.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <Calendar className="h-3.5 w-3.5 text-brand-primary/60" />
                      <span>{item.DateFrom}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <MapPin className="h-3.5 w-3.5 text-brand-primary/60" />
                      <span className="truncate">{item.Venue}</span>
                    </div>
                    <div className="mt-5 pt-4 border-t border-slate-800/40 flex justify-between items-center">
                  <span className="text-[9px] font-black text-slate-600 uppercase tracking-tighter">
                    Year: {item.Year || item["Year (from Event)"]}
                  </span>
                </div>
                  </div>
                ) : activeTable === 'Guidance & Learning' ? (
                  <div className="space-y-3 pt-1">
                    {/* Highlighted Guidance Box */}
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                       <p className="text-[13px] text-slate-700 leading-relaxed italic line-clamp-3">
                         "{item["Guidance/Learning"]}"
                       </p>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase">
                       <FileText className="h-3 w-3 text-brand-primary" />
                       <span>GuidanceFrom: {item["GuidanceFrom"]}</span>
                    </div>
                    <div className="mt-5 pt-4 border-t border-slate-800/40 flex justify-between items-center">
                  <span className="text-[9px] font-black text-slate-600 uppercase tracking-tighter">
                    Year: {item.Year || item["Year (from Event)"]}
                  </span>
                </div>
                  </div>
                ) : activeTable === 'LED' ? (
                  /* --- LED SPECIAL VISUAL CARD --- */
                  <div className="space-y-4 pt-1">
                   
                    {/* 1. IMAGE GALLERY (Flip Logic Integrated) */}
                    

                    <div className="space-y-3">
                      
                     

                      {/* 3. VENDOR & LOCATION DETAILS */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          <Truck className="h-3.5 w-3.5 text-brand-primary/60 shrink-0" />
                          <span className="truncate">Vendor: {item["Vendor"] || "N/A"}</span>
                        </div>
                        <div className="flex items-center gap-2.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          <MapPin className="h-3.5 w-3.5 text-brand-primary/60 shrink-0" />
                          <span className="truncate">{item["City (from 🕘 Session)"] || "Location Unknown"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Technical Mini-Badge for Pitch */}
                    <div className="pt-2">
                      <Badge className="bg-brand-primary/10 text-brand-primary border-none text-[9px] font-black px-2 py-0.5 rounded">
                        Date: {item["Date (from 🕘 Session)"] }
                      </Badge>
                    </div>
                    
                  </div>
                ) : activeTable === 'DyatraChecklist' ? (
                  <div className="space-y-4 pt-1">
                    {/* Task Header */}
                    <div className="flex flex-col gap-1">
                       <div className="flex items-center gap-2">
                         <CheckSquare className="h-4 w-4 text-brand-primary" />
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item["TaskGroup"] || "General Task"}</span>
                       </div>
                      
                    </div>

                    {/* Details Box */}
                    {item["Details"] && (
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                        <p className="text-[12px] text-slate-600 leading-relaxed italic line-clamp-3">
                          {item["Details"]}
                        </p>
                      </div>
                    )}

                    {/* Metadata */}
                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                      <div className="space-y-1">
                        <p className="text-[8px] font-black text-slate-400 uppercase">Timeline</p>
                        <p className="text-[11px] font-bold text-slate-700">{item["Typical Timeline"] || "N/A"}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[8px] font-black text-slate-400 uppercase">Category</p>
                        <Badge className="bg-brand-primary/10 text-brand-primary border-none text-[9px] px-2 py-0">
                          {item["Category"]}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ) : activeTable === 'DataSharing' ? (
                  <div className="space-y-4 pt-1">
                    {/* Profile Header */}
                    <div className="flex items-center gap-4">
                       <div className="h-12 w-12 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary font-black text-lg border border-brand-primary/20">
                         {item["Sevak"]?.[0]}
                       </div>
                       <div className="flex flex-col">
                          <h3 className="text-lg font-black text-brand-text-main uppercase tracking-tight leading-tight">
                            {item["Sevak"]}
                          </h3>
                          <span className="text-[10px] font-bold text-brand-primary uppercase tracking-widest">
                            {item["Dept"]}
                          </span>
                       </div>
                    </div>

                    {/* Contact Details Box */}
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                       <div className="flex items-center gap-2 text-[11px] text-slate-600 font-medium">
                          <Search className="h-3.5 w-3.5 text-slate-400" />
                          <span className="truncate">{item["EmailId"]}</span>
                       </div>
                       <div className="flex items-center gap-2 text-[11px] text-slate-600 font-medium">
                          <FileText className="h-3.5 w-3.5 text-slate-400" />
                          <span className="truncate">Data: {item["ShareData"] || "N/A"}</span>
                       </div>
                    </div>

                    {/* Permission Badge */}
                    <div className="pt-1">
                       <div className="flex items-center gap-2">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Facts Sharing:</span>
                          <Badge className={`${item["ShareFacts?"] === 'Yes' ? 'bg-green-600' : 'bg-slate-400'} text-white border-none text-[8px] px-2 py-0`}>
                            {item["ShareFacts?"] || 'DISABLED'}
                          </Badge>
                       </div>
                    </div>
                  </div>
                ) : activeTable === 'Tracks' ? (
                  /* --- TRACKS SPECIAL METADATA --- */
                  <div className="space-y-2 pt-2 border-t border-slate-800/40 mt-4">
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-slate-500">
                      <span className="truncate max-w-[120px]">
                        {item["Album"] }
                      </span>
                     
                    </div>
                    {item["Tags"] && (
                       <div className="flex gap-1 overflow-hidden">
                         {String(item["Tags"]).split(',').slice(0, 2).map((tag, i) => (
                           <Badge key={i} className="bg-slate-800 text-[8px] px-1 py-0 border-none">{tag.trim()}</Badge>
                         ))}
                       </div>
                    )}
                  </div>
                ) : (
                  /* Fallback subtitle for other tables */
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest truncate">
                    {item.city || item.artist || item.category}
                  </p>
                )}
                          </div>

                          {/* Subtle decoration line */}
                          
                        </motion.div>
                      ))}

                      {/* Add New Entry Box */}
                      <motion.div 
                        onClick={openAddModal} 
                        className="border-2 border-dashed border-slate-700 rounded-2xl flex flex-col items-center justify-center p-8 text-slate-500 cursor-pointer hover:text-brand-primary hover:border-brand-primary/50 transition-all bg-slate-900/10 min-h-[200px]"
                      >
                        <Plus className="h-6 w-6 mb-3" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">New {activeTable} Entry</span>
                      </motion.div>
                    </div>
                  )
                ) : (
                  /* --- 3. DATA GRID VIEW (Table) --- */
                  /* --- 3. WHITE EXCEL / AIRTABLE STYLE GRID VIEW --- */
               <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col h-[calc(100vh-200px)]">
                  <div className="md:hidden bg-blue-50 text-[10px] text-center py-1 text-blue-600 font-bold uppercase">
                    ← Scroll horizontally to see all columns →
                  </div>
                  <div className="overflow-auto thin-scrollbar flex-1 bg-white">
                    <table 
                      className="border-collapse text-left text-[11px] table-fixed" 
                      style={{ width: 'max-content' }} 
                    >
         <thead className="sticky top-0 z-30 bg-slate-50 border-b border-slate-200">
  <tr>
    <th className="w-12 border-r border-b border-slate-200 px-2 py-3 bg-slate-100 text-center sticky left-0 z-40">
      <span className="text-[10px] font-black text-slate-400">#</span>
    </th>
   {getTableColumns().map((col, i) => {
  const isSorted = sortBy?.field === col;
  const baseColsCount = getTableColumns().length - (extraColumns[activeTable]?.length || 0);
  
  // Identify if this column is one of the custom added ones
  const isExtraColumn = i >= baseColsCount;
  const extraIndex = i - baseColsCount;

  return (
  <th
  key={i}
  style={{ width: colWidths[col] || 200, minWidth: colWidths[col] || 200, position: 'relative' }}
  className={`border-r border-b border-slate-200 p-0 font-semibold tracking-tight overflow-hidden select-none transition-colors group/header ${isSorted ? 'bg-blue-50 text-brand-primary' : 'bg-slate-50 text-slate-600'}`}
>
      {editingHeader?.index === i ? (
        <input
          autoFocus
        className="w-full h-full px-4 py-3 bg-white text-brand-primary outline-none border-none font-black text-[11px]"
          value={editingHeader.value}
          onChange={(e) => setEditingHeader({ ...editingHeader, value: e.target.value })}
          onBlur={() => {
            if (editingHeader && editingHeader.value.trim() !== "") {
              const newExtras = [...(extraColumns[activeTable] || [])];
              newExtras[extraIndex] = editingHeader.value;
              const newExtraObj = { ...extraColumns, [activeTable]: newExtras };
              setExtraColumns(newExtraObj);
              saveExtraColumns(newExtraObj);
            }
            setEditingHeader(null);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.currentTarget.blur();
            if (e.key === 'Escape') setEditingHeader(null);
          }}
        />
      ) : (
        <div className="relative flex items-center h-full">
          {/* Main Sort/Label Area */}
          <div 
            onClick={() => setSortBy({ field: col, direction: sortBy?.field === col && sortBy.direction === 'asc' ? 'desc' : 'asc' })}
            onDoubleClick={() => isExtraColumn && setEditingHeader({ index: i, value: col })}
            className="flex items-center gap-2 px-4 py-3 h-full w-full cursor-pointer hover:bg-black/5 transition-colors truncate pr-10"
          >
            {isSorted ? (sortBy.direction === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <LayoutGrid className="h-3.5 w-3.5 text-slate-400" />}
            <span className="truncate">{col}</span>
          </div>

          {/* DELETE BUTTON - Only shows for custom columns on hover */}
          {isExtraColumn && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteColumn(col);
              }}
              className="absolute right-3 opacity-0 group-hover/header:opacity-100 p-1 hover:bg-red-100 text-slate-400 hover:text-red-600 rounded transition-all"
              title="Remove Column"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}
      {/* Resizer Handle */}
      <div onMouseDown={(e) => handleMouseDown(e, col)} className="absolute right-0 top-0 h-full w-[10px] cursor-col-resize hover:bg-brand-primary/50 z-20" />
    </th>
  );
})}

    {/* The Dynamic Column PLUS button */}
    <th className="w-12 border-b border-slate-400 bg-slate-50 hover:bg-slate-200 cursor-pointer flex items-center justify-center">
      <button 
  onClick={() => {
    const currentExtras = extraColumns[activeTable] || [];
    const newName = `Field ${currentExtras.length + 1}`;
    const totalColsBefore = getTableColumns().length;

    // 1. Prepare the new state object
    const newExtraObj = {
      ...extraColumns,
      [activeTable]: [...currentExtras, newName]
    };

    // 2. Update local state
    setExtraColumns(newExtraObj);
    
    // 3. Save to Backend
    saveExtraColumns(newExtraObj);

    setTimeout(() => setEditingHeader({ index: totalColsBefore, value: newName }), 10);
  }}
        className="text-slate-400 hover:text-brand-primary"
      >
        <Plus className="h-5 w-5" />
      </button>
    </th>
  </tr>
</thead>
                      
     <tbody className="bg-white">
     
  {getProcessedData().map((row, idx) => {
    
    // 1. Visibility logic (Keep this exactly as you had it)
    if (row.type === 'header' && row.parentId && collapsedGroups.includes(row.parentId)) return null;
    if (row.type === 'row' && (
      (row.parentId && collapsedGroups.includes(row.parentId)) || 
      (row.grandParentId && collapsedGroups.includes(row.grandParentId))
    )) return null;

    // 2. SAFETY CHECK: Check if this specific row is being edited
    // Use optional chaining (row.data?._id) to prevent the crash
    const isEditing = row.type === 'row' && editingId === (row.data?._id || row.data?.id);

    // --- A. RENDER INLINE EDITOR (ADD NEW) ---
    if (row.type === 'edit-row') {
      return (
        <tr key="inline-editor" className="bg-blue-50/50 shadow-inner border-y-2 border-blue-200">
          <td className="w-12 border-r border-b border-blue-300 text-center sticky left-0 z-20 bg-blue-100 flex items-center justify-center gap-1 py-3 px-1">
             <button onClick={handleInlineSave} className="p-1 text-green-600 hover:bg-green-100 rounded">
               <CheckSquare className="h-5 w-5" />
             </button>
             <button onClick={() => { setIsInlineAdding(false); setInlineRecord({}); }} className="p-1 text-red-500 hover:bg-red-100 rounded">
               <X className="h-5 w-5" />
             </button>
          </td>
          {renderEditableRow()}
        </tr>
      );
    }

    // B. RENDER GROUP HEADERS
    if (row.type === 'header') {
      const isCollapsed = collapsedGroups.includes(row.id);
      return (
        <tr key={row.id} className="bg-slate-50 border-b border-slate-200 sticky z-10 cursor-pointer" style={{ top: '37px' }} onClick={() => toggleGroup(row.id)}>
          <td className="border-r border-slate-200 text-center w-12 bg-slate-100">
             <div className="flex justify-center items-center h-full">
               {!isCollapsed ? <ChevronDown className="h-4 w-4 text-slate-900" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
             </div>
          </td>
          <td colSpan={getTableColumns().length} className="px-4 py-2.5">
           <div className="flex flex-col gap-0.5" style={{ paddingLeft: row.level === 2 ? '24px' : '0px' }}>
          
          {/* 1. FIELD NAME (TOP) */}
          <div className="flex items-center gap-1">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none">
              {row.label}
            </span>
          </div>
              <div className="flex items-center gap-2">
            <Badge 
              style={{ backgroundColor: row.color, color: 'black' }} 
              className="border-none  text-[13px] px-2.5 py-0.5 rounded shadow-sm" 
            >
              {row.value}
            </Badge>
              <span className="text-slate-400 font-bold text-[10px]">({row.count})</span>
            </div> 
            </div>
          </td>
        </tr>
      );
    }

    // C. RENDER DATA ROWS
 return (
  <tr
    key={row.data?._id || row.data?.id || idx}
    className={`group transition-colors border-b border-slate-200 ${
      selectedIds.includes(row.data?._id || row.data?.id) ? 'bg-blue-100/60' : !row.groupColor ? 'hover:bg-blue-50/40' : ''
    }`}
    style={!selectedIds.includes(row.data?._id || row.data?.id) && row.groupColor ? { backgroundColor: row.groupColor + '22' } : undefined}
  >
    {/* CHECKBOX + EXPAND COLUMN (Sticky Left) */}
    <td className="w-12 border-r border-slate-200 text-center sticky left-0 z-20 bg-inherit px-1 py-0">
      <div className="relative flex items-center justify-center h-full">
        {/* Row index — visible by default, fades on hover */}
        <span className={`absolute text-[10px] font-mono text-slate-400 transition-opacity duration-150 group-hover:opacity-0 ${
          selectedIds.includes(row.data?._id || row.data?.id) ? 'opacity-0' : 'opacity-100'
        }`}>
          {idx + 1}
        </span>
        {/* Controls — hidden by default, appear on hover / when selected */}
        <div className={`flex items-center gap-1 transition-opacity duration-150 ${
          selectedIds.includes(row.data?._id || row.data?.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}>
          <input
            type="checkbox"
            checked={selectedIds.includes(row.data?._id || row.data?.id)}
            onChange={() => {}}
            onClick={e => { e.stopPropagation(); toggleRowSelection(row.data?._id || row.data?.id); }}
            className="h-3.5 w-3.5 rounded border-slate-300 text-brand-primary focus:ring-brand-primary cursor-pointer"
          />
          <button
            onClick={e => { e.stopPropagation(); setExpandedRecord(row.data); }}
            className="p-0.5 rounded hover:bg-slate-200 text-slate-400 hover:text-brand-primary transition-colors"
            title="Expand record"
          >
            <Maximize2 className="h-3 w-3" />
          </button>
        </div>
      </div>
    </td>

        {isEditing ? (
          renderEditInputs(row.data)
        ) : (
          <div className="contents" onClick={(e) => {
            // Detect which column cell was clicked via DOM position
            const td = (e.target as HTMLElement).closest('td');
            const tr = td?.closest('tr');
            if (td && tr) {
              const tds = Array.from(tr.querySelectorAll('td'));
              const tdIdx = tds.indexOf(td as HTMLTableCellElement) - 1; // -1 for checkbox col
              const clickedCol = getTableColumns()[tdIdx];
              if (clickedCol) setEditingCell(clickedCol);
            }
            setEditingId(row.data?._id || row.data?.id);
            const d: any = { ...row.data };
            ['DateFrom', 'DateTo', 'Date'].forEach(k => {
              if (!d[k]) return;
              const raw: string = String(d[k]);
              if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return;
              if (raw.includes('T')) { d[k] = raw.split('T')[0]; return; }
              const parsed = new Date(raw);
              if (!isNaN(parsed.getTime())) d[k] = `${parsed.getFullYear()}-${String(parsed.getMonth()+1).padStart(2,'0')}-${String(parsed.getDate()).padStart(2,'0')}`;
            });
            if (!d['Sessions'] && d['Imported table']) d['Sessions'] = d['Imported table'];
            setEditDraft(d);
          }}>
            {renderRow(row.data)}
          </div>
        )}
      </tr>
    );
  })}

  {!isInlineAdding && (
    <tr 
  className="hover:bg-slate-50 cursor-pointer group border-b border-slate-200"
  onClick={handleAddBlankRow} // Change this line
>
  <td className="w-12 border-r border-slate-200 bg-slate-50/50 flex items-center justify-center py-3">
    <div className="h-6 w-6 rounded bg-yellow-400 flex items-center justify-center shadow-sm">
      <Plus className="h-4 w-4 text-white" />
    </div>
  </td>
  <td colSpan={getTableColumns().length} className="px-4 py-3 text-slate-300 text-[12px]">
    + Add new record
  </td>
</tr>
  )}
</tbody>

                    </table>
                  </div>
                  
                  {/* FOOTER BAR */}
                <div className="bg-slate-50 border-t border-slate-200 px-6 py-2 flex items-center justify-between text-[11px] text-slate-500 font-medium z-20">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1.5"><Grid className="h-3 w-3" /> {filteredData.length} records</span>
                      <div className="w-px h-3 bg-slate-400" />
                      <span>Sorted by Year (Default)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-500 shadow-sm animate-pulse" />
                      <span>Grouped View enabled</span>
                    </div>
                  </div>
                </div>
                )}
              </>
            )} 
            
            {/* THIS CLOSES THE viewingRecord TERNARY */}

            {selectedIds.length > 0 && (
  <motion.div 
    initial={{ y: 20, opacity: 0 }} 
    animate={{ y: 0, opacity: 1 }}
    className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] bg-slate-900 border border-slate-700 shadow-2xl rounded-2xl px-6 py-3 flex items-center gap-6"
  >
    <div className="flex items-center gap-2 border-r border-slate-700 pr-6">
      <div className="bg-brand-primary h-6 w-6 rounded-md flex items-center justify-center text-[10px] font-black text-white">
        {selectedIds.length}
      </div>
      <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Selected</span>
    </div>

    <div className="flex items-center gap-2">
      {/* Expand - Only show if 1 selected */}
      {selectedIds.length === 1 && (
        <Button 
          variant="ghost" size="sm" 
          className="text-slate-400 hover:text-black"
          onClick={() => {
            const item = getActiveData().find(d => (d._id || d.id) === selectedIds[0]);
            setViewingRecord(item);
          }}
        >
          <ArrowUpRight className="h-4 w-4 mr-2" /> Expand
        </Button>
      )}

      <Button 
        variant="ghost" size="sm" 
        className="text-red-400 hover:text-red-500 hover:bg-red-500/10"
        onClick={handleBulkDelete}
      >
        <X className="h-4 w-4 mr-2" /> Delete
      </Button>
      
      <Button 
        variant="ghost" size="sm" 
        className="text-slate-400"
        onClick={() => setSelectedIds([])}
      >
        Deselect
      </Button>
    </div>
  </motion.div>
)}
          </div>
        </div>
      </main>

      {/* Add Record Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="bg-white border-none p-0 overflow-hidden flex flex-col max-h-[90vh] sm:max-w-[600px] rounded-[24px] shadow-2xl">
        <DialogHeader className="p-5 border-b border-slate-800">
  <DialogTitle className="text-xl font-black tracking-tight">
    Add <span className="text-brand-primary">New {activeTable}</span>
  </DialogTitle>
  <DialogDescription className="text-brand-text-muted text-xs font-medium">
    Enter the operational details for the new {activeTable.toLowerCase()} record.
  </DialogDescription>
</DialogHeader>
          
          <div className="flex-1 overflow-y-auto p-4 sm:p-8 pt-4 sm:pt-6 space-y-8 thin-scrollbar">
  <div className="space-y-6">
    {/* EVENTS FIELDS */}
    {activeTable === 'Events' && (() => {
      const occasionOpts = [...new Set(events.map((e: any) => e.Occasion).filter(Boolean).flatMap((o: string) => o.split(',').map((x: string) => x.trim())).filter(Boolean))].sort() as string[];
      const cityOpts = [...new Set([...events.map((e: any) => e.City), ...sessions.map((s: any) => s.City)].filter(Boolean).flatMap((c: string) => c.split(',').map((x: string) => x.trim())).filter(Boolean))].sort() as string[];
      const yr = new Date().getFullYear();
      const yearOpts = Array.from({ length: 11 }, (_, k) => String(yr + 2 - k));
      const selectedSessions: string[] = newRecord.Sessions ? newRecord.Sessions.split(',').map((x: string) => x.trim()).filter(Boolean) : [];
      const selectCls = "w-full h-9 bg-brand-bg border border-brand-border rounded-md px-3 text-sm text-brand-text focus:ring-2 focus:ring-brand-primary outline-none";
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input value={newRecord["Event Name"] || ''} onChange={(e) => setNewRecord({...newRecord, "Event Name": e.target.value})} placeholder="Event Name" className="bg-brand-bg" />
            <Input value={newRecord.Venue || ''} onChange={(e) => setNewRecord({...newRecord, Venue: e.target.value})} placeholder="Venue" className="bg-brand-bg" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input type="date" value={newRecord.DateFrom || ''} onChange={(e) => setNewRecord({...newRecord, DateFrom: e.target.value})} className="bg-brand-bg" />
            <Input type="date" value={newRecord.DateTo || ''} onChange={(e) => setNewRecord({...newRecord, DateTo: e.target.value})} className="bg-brand-bg" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <select className={selectCls} value={newRecord.Occasion || ''} onChange={(e) => setNewRecord({...newRecord, Occasion: e.target.value})}>
              <option value="">Occasion...</option>
              {occasionOpts.map((o, i) => <option key={i} value={o}>{o}</option>)}
            </select>
            <select className={selectCls} value={newRecord.City || ''} onChange={(e) => setNewRecord({...newRecord, City: e.target.value})}>
              <option value="">City...</option>
              {cityOpts.map((o, i) => <option key={i} value={o}>{o}</option>)}
            </select>
            <select className={selectCls} value={newRecord.Year || ''} onChange={(e) => setNewRecord({...newRecord, Year: e.target.value})}>
              <option value="">Year...</option>
              {yearOpts.map((y, i) => <option key={i} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-text-muted">Linked Sessions</label>
            <select className={selectCls} value="" onChange={(e) => {
              const picked = e.target.value;
              if (!picked || selectedSessions.includes(picked)) return;
              setNewRecord({ ...newRecord, Sessions: [...selectedSessions, picked].join(', ') });
            }}>
              <option value="">Add session...</option>
              {sessions.filter((s: any) => !selectedSessions.includes(s["Session Name"])).map((s: any, i: number) => <option key={i} value={s["Session Name"]}>{s["Session Name"]}</option>)}
            </select>
            {selectedSessions.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-1">
                {selectedSessions.map((name: string, i: number) => (
                  <span key={i} className="inline-flex items-center gap-1 bg-brand-primary/10 text-brand-primary text-[11px] font-bold px-2 py-1 rounded-sm border border-brand-primary/20">
                    {name}
                    <button onClick={() => setNewRecord({ ...newRecord, Sessions: selectedSessions.filter((_: any, fi: number) => fi !== i).join(', ') })} className="hover:text-red-500 font-bold">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      );
    })()}
    {/* SESSION FIELDS */}
   {activeTable === 'Session' && (
  <>
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-text-muted">Session Name</label>
        <Input value={newRecord.name || ''} onChange={(e) => setNewRecord({...newRecord, name: e.target.value})} placeholder="Session Name" className="bg-brand-bg" />
      </div>
      <div className="space-y-2">
        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-text-muted">Parent Event</label>
        <Input value={newRecord.parentEvent || ''} onChange={(e) => setNewRecord({...newRecord, parentEvent: e.target.value})} placeholder="Main Event Name" className="bg-brand-bg" />
      </div>
    </div>

    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      <div className="space-y-2">
        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-text-muted">Date</label>
        <Input type="date" value={newRecord.date || ''} onChange={(e) => setNewRecord({...newRecord, date: e.target.value})} className="bg-brand-bg" />
      </div>
      <div className="space-y-2">
        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-text-muted">City</label>
        <Input value={newRecord.city || ''} onChange={(e) => setNewRecord({...newRecord, city: e.target.value})} placeholder="City" className="bg-brand-bg" />
      </div>
      <div className="space-y-2">
        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-text-muted">Venue</label>
        <Input value={newRecord.venue || ''} onChange={(e) => setNewRecord({...newRecord, venue: e.target.value})} placeholder="Venue" className="bg-brand-bg" />
      </div>
    </div>

    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      <div className="space-y-2">
        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-text-muted">Time Of Day</label>
        <Input value={newRecord.timeOfDay || ''} onChange={(e) => setNewRecord({...newRecord, timeOfDay: e.target.value})} placeholder="e.g. Morning" className="bg-brand-bg" />
      </div>
      <div className="space-y-2">
        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-text-muted">Occasion</label>
        <Input value={newRecord.occasion || ''} onChange={(e) => setNewRecord({...newRecord, occasion: e.target.value})} placeholder="Occasion" className="bg-brand-bg" />
      </div>
      <div className="space-y-2">
        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-text-muted">Session Type</label>
        <Input value={newRecord.sessionType || ''} onChange={(e) => setNewRecord({...newRecord, sessionType: e.target.value})} placeholder="Type" className="bg-brand-bg" />
      </div>
    </div>

    <div className="space-y-2">
      <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-text-muted">Notes</label>
      <Textarea value={newRecord.notes || ''} onChange={(e) => setNewRecord({...newRecord, notes: e.target.value})} placeholder="Additional details..." className="bg-brand-bg min-h-[80px]" />
    </div>
  </>
)}

{/* MUSIC LOG FIELDS - 17 Columns Compact View */}
{activeTable === 'MusicLog' && (
  <div className="space-y-6">
    <div className="p-3 bg-brand-primary/5 border border-brand-primary/10 rounded-lg">
      <p className="text-[9px] font-black uppercase tracking-widest text-brand-primary mb-3">Event & Session Context</p>
      <div className="grid grid-cols-2 gap-3">
        <Input value={newRecord.playId || ''} onChange={(e) => setNewRecord({...newRecord, playId: e.target.value})} placeholder="PlayID" className="bg-brand-bg h-9 text-xs" />
        <div className="col-span-2 space-y-1">
          <label className="text-[9px] font-black uppercase tracking-widest text-brand-primary">Session</label>
          <select
            className="w-full h-9 bg-white border border-slate-200 rounded-md px-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-brand-primary outline-none"
            value={newRecord.session || ''}
            onChange={(e) => {
              const s = sessions.find(s => s["Session Name"] === e.target.value);
              if (s) setNewRecord({ ...newRecord, session: s["Session Name"], parentEvent: s["Parent Event"], date: s["Date"], timeOfDay: s["TimeOfDay"], occasion: s["Occasion"] });
              else setNewRecord({ ...newRecord, session: e.target.value });
            }}
          >
            <option value="">Select session...</option>
            {sessions.map((s, i) => <option key={i} value={s["Session Name"]}>{s["Session Name"]}</option>)}
          </select>
        </div>
        <Input value={newRecord.parentEvent || ''} onChange={(e) => setNewRecord({...newRecord, parentEvent: e.target.value})} placeholder="Parent Event" className="bg-brand-bg h-9 text-xs" />
        <Input value={newRecord.date || ''} onChange={(e) => setNewRecord({...newRecord, date: e.target.value})} placeholder="Date" className="bg-brand-bg h-9 text-xs" />
        <Input value={newRecord.timeOfDay || ''} onChange={(e) => setNewRecord({...newRecord, timeOfDay: e.target.value})} placeholder="Time of Day" className="bg-brand-bg h-9 text-xs" />
        <Input value={newRecord.occasion || ''} onChange={(e) => setNewRecord({...newRecord, occasion: e.target.value})} placeholder="Occasion" className="bg-brand-bg h-9 text-xs" />
      </div>
    </div>

    <div className="p-3 bg-brand-accent/5 border border-brand-accent/10 rounded-lg">
      <p className="text-[9px] font-black uppercase tracking-widest text-brand-accent mb-3">Track & Performance Details</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Input value={newRecord.order || ''} onChange={(e) => setNewRecord({...newRecord, order: e.target.value})} placeholder="Order" className="bg-brand-bg h-9 text-xs" />
        <Input value={newRecord.playedAt || ''} onChange={(e) => setNewRecord({...newRecord, playedAt: e.target.value})} placeholder="PlayedAt" className="bg-brand-bg h-9 text-xs" />
        <Input value={newRecord.trackId || ''} onChange={(e) => setNewRecord({...newRecord, trackId: e.target.value})} placeholder="TrackID Link" className="bg-brand-bg h-9 text-xs" />
      </div>
      <div className="mt-3 space-y-3">
        <Input value={newRecord.track || ''} onChange={(e) => setNewRecord({...newRecord, track: e.target.value})} placeholder="Track Name" className="bg-brand-bg h-9 text-xs" />
        <div className="grid grid-cols-2 gap-3">
          <Input value={newRecord.theme || ''} onChange={(e) => setNewRecord({...newRecord, theme: e.target.value})} placeholder="Theme" className="bg-brand-bg h-9 text-xs" />
          <Input value={newRecord.relevance || ''} onChange={(e) => setNewRecord({...newRecord, relevance: e.target.value})} placeholder="Relevance" className="bg-brand-bg h-9 text-xs" />
          <Input value={newRecord.patrank || ''} onChange={(e) => setNewRecord({...newRecord, patrank: e.target.value})} placeholder="Patrank" className="bg-brand-bg h-9 text-xs" />
          <Input value={newRecord.cue || ''} onChange={(e) => setNewRecord({...newRecord, cue: e.target.value})} placeholder="Cue" className="bg-brand-bg h-9 text-xs" />
        </div>
        <Input value={newRecord.topic || ''} onChange={(e) => setNewRecord({...newRecord, topic: e.target.value})} placeholder="Pravachan Topic" className="bg-brand-bg h-9 text-xs" />
      </div>
    </div>

    <div className="space-y-3">
      <Textarea value={newRecord.notes || ''} onChange={(e) => setNewRecord({...newRecord, notes: e.target.value})} placeholder="Notes" className="bg-brand-bg min-h-[60px] text-xs" />
      <Input value={newRecord.ppgRemarks || ''} onChange={(e) => setNewRecord({...newRecord, ppgRemarks: e.target.value})} placeholder="PPG Remarks" className="bg-brand-bg h-9 text-xs" />
    </div>
  </div>
)}

{/* VIDEOLOG FIELDS */}
{activeTable === 'VideoLog' && (
  <div className="space-y-6">
    <div className="p-3 bg-brand-primary/5 border border-brand-primary/10 rounded-lg">
      <p className="text-[9px] font-black uppercase tracking-widest text-brand-primary mb-3">Session Context</p>
      <div className="grid grid-cols-2 gap-3">
        <Input value={newRecord.VideoPlayId || ''} onChange={(e) => setNewRecord({...newRecord, VideoPlayId: e.target.value})} placeholder="VideoPlayId" className="bg-brand-bg h-9 text-xs" />
        <div className="col-span-1 space-y-1">
          <label className="text-[9px] font-black uppercase tracking-widest text-brand-primary">Session</label>
          <select
            className="w-full h-9 bg-white border border-slate-200 rounded-md px-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-brand-primary outline-none"
            value={newRecord.session || ''}
            onChange={(e) => {
              const s = sessions.find(s => s["Session Name"] === e.target.value);
              if (s) setNewRecord({ ...newRecord, session: s["Session Name"], parentEvent: s["Parent Event"], date: s["Date"], city: s["City"], venue: s["Venue"], timeOfDay: s["TimeOfDay"], occasion: s["Occasion"], sessionType: s["SessionType"] });
              else setNewRecord({ ...newRecord, session: e.target.value });
            }}
          >
            <option value="">Select session...</option>
            {sessions.map((s, i) => <option key={i} value={s["Session Name"]}>{s["Session Name"]}</option>)}
          </select>
        </div>
        <Input value={newRecord.date || ''} onChange={(e) => setNewRecord({...newRecord, date: e.target.value})} placeholder="Date" className="bg-brand-bg h-9 text-xs" />
        <Input value={newRecord.city || ''} onChange={(e) => setNewRecord({...newRecord, city: e.target.value})} placeholder="City" className="bg-brand-bg h-9 text-xs" />
        <Input value={newRecord.venue || ''} onChange={(e) => setNewRecord({...newRecord, venue: e.target.value})} placeholder="Venue" className="bg-brand-bg h-9 text-xs" />
        <Input value={newRecord.parentEvent || ''} onChange={(e) => setNewRecord({...newRecord, parentEvent: e.target.value})} placeholder="Parent Event" className="bg-brand-bg h-9 text-xs" />
      </div>
    </div>
    <div className="p-3 bg-brand-accent/5 border border-brand-accent/10 rounded-lg">
      <p className="text-[9px] font-black uppercase tracking-widest text-brand-accent mb-3">Video Details</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Input value={newRecord.timeOfDay || ''} onChange={(e) => setNewRecord({...newRecord, timeOfDay: e.target.value})} placeholder="Time of Day" className="bg-brand-bg h-9 text-xs" />
        <Input value={newRecord.occasion || ''} onChange={(e) => setNewRecord({...newRecord, occasion: e.target.value})} placeholder="Occasion" className="bg-brand-bg h-9 text-xs" />
        <Input value={newRecord.sessionType || ''} onChange={(e) => setNewRecord({...newRecord, sessionType: e.target.value})} placeholder="Session Type" className="bg-brand-bg h-9 text-xs" />
      </div>
      <div className="mt-3 space-y-3">
        <Input value={newRecord.VideoTitle || ''} onChange={(e) => setNewRecord({...newRecord, VideoTitle: e.target.value})} placeholder="VideoTitle" className="bg-brand-bg h-9 text-xs" />
        <Input value={newRecord.duration || ''} onChange={(e) => setNewRecord({...newRecord, duration: e.target.value})} placeholder="Duration (MM:SS)" className="bg-brand-bg h-9 text-xs" />
        <Textarea value={newRecord.proposalsList || ''} onChange={(e) => setNewRecord({...newRecord, proposalsList: e.target.value})} placeholder="Proposals List" className="bg-brand-bg min-h-[60px] text-xs" />
      </div>
    </div>
  </div>
)}

{/* GUIDANCE AND LEARNING FIELDS */}
{activeTable === 'Guidance & Learning' && (
  <div className="space-y-4">
    <div className="grid grid-cols-2 gap-4">
      <Input value={newRecord.LearningId || ''} onChange={(e) => setNewRecord({...newRecord, LearningId: e.target.value})} placeholder="Learning Id" className="bg-brand-bg" />
      <Input value={newRecord.event || ''} onChange={(e) => setNewRecord({...newRecord, event: e.target.value})} placeholder="Event Name" className="bg-brand-bg" />
    </div>
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      <Input type="date" value={newRecord.dateFrom || ''} onChange={(e) => setNewRecord({...newRecord, dateFrom: e.target.value})} placeholder="Date From" className="bg-brand-bg text-xs" />
      <Input type="date" value={newRecord.dateTo || ''} onChange={(e) => setNewRecord({...newRecord, dateTo: e.target.value})} placeholder="Date To" className="bg-brand-bg text-xs" />
      <Input value={newRecord.year || ''} onChange={(e) => setNewRecord({...newRecord, year: e.target.value})} placeholder="Year" className="bg-brand-bg text-xs" />
    </div>
    <div className="grid grid-cols-2 gap-4">
      <Input value={newRecord.city || ''} onChange={(e) => setNewRecord({...newRecord, city: e.target.value})} placeholder="City" className="bg-brand-bg" />
      <Input value={newRecord.guidanceFrom || ''} onChange={(e) => setNewRecord({...newRecord, guidanceFrom: e.target.value})} placeholder="Guidance From" className="bg-brand-bg" />
    </div>
    <div className="space-y-2">
      <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-text-muted">Guidance / Learning content</label>
      <Textarea value={newRecord.guidanceLearning || ''} onChange={(e) => setNewRecord({...newRecord, guidanceLearning: e.target.value})} placeholder="Enter content..." className="bg-brand-bg min-h-[80px]" />
    </div>
    <div className="grid grid-cols-2 gap-4">
      <Input value={newRecord.category || ''} onChange={(e) => setNewRecord({...newRecord, category: e.target.value})} placeholder="Category" className="bg-brand-bg" />
      <Input value={newRecord.attachments || ''} onChange={(e) => setNewRecord({...newRecord, attachments: e.target.value})} placeholder="Attachment Link" className="bg-brand-bg" />
    </div>
  </div>
)}
    {/* MEDIA FIELDS (Tracks) */}
    {(  activeTable === 'Tracks') && (
      <>
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-text-muted">Title</label>
          <Input value={newRecord.title || ''} onChange={(e) => setNewRecord({...newRecord, title: e.target.value})} placeholder="Track Title" className="bg-brand-bg" />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-text-muted">Artist</label>
          <Input value={newRecord.artist || ''} onChange={(e) => setNewRecord({...newRecord, artist: e.target.value})} placeholder="Artist Name" className="bg-brand-bg" />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-text-muted">Album</label>
          <Input value={newRecord.album || ''} onChange={(e) => setNewRecord({...newRecord, album: e.target.value})} placeholder="Album Name" className="bg-brand-bg" />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-text-muted">Duration</label>
          <Input value={newRecord.duration || ''} onChange={(e) => setNewRecord({...newRecord, duration: e.target.value})} placeholder="Duration (e.g., 3:45)" className="bg-brand-bg" />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-text-muted">Duration Time</label>
          <Input value={newRecord.durationTime || ''} onChange={(e) => setNewRecord({...newRecord, durationTime: e.target.value})} placeholder="Duration in seconds" className="bg-brand-bg" />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-text-muted">BPM</label>
          <Input value={newRecord.bpm || ''} onChange={(e) => setNewRecord({...newRecord, bpm: e.target.value})} placeholder="Beats Per Minute" className="bg-brand-bg" />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-text-muted">Key</label>
          <Input value={newRecord.key || ''} onChange={(e) => setNewRecord({...newRecord, key: e.target.value})} placeholder="Musical Key" className="bg-brand-bg" />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-text-muted">Source</label>
          <Input value={newRecord.source || ''} onChange={(e) => setNewRecord({...newRecord, source: e.target.value})} placeholder="Track Source" className="bg-brand-bg" />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-text-muted">File Link</label>
          <Input value={newRecord.fileLink || ''} onChange={(e) => setNewRecord({...newRecord, fileLink: e.target.value})} placeholder="https://..." className="bg-brand-bg" />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-text-muted">Tags</label>
          <Input value={newRecord.tags || ''} onChange={(e) => setNewRecord({...newRecord, tags: e.target.value})} placeholder="Tags (comma separated)" className="bg-brand-bg" />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-text-muted">Lyrics</label>
          <Input value={newRecord.lyrics || ''} onChange={(e) => setNewRecord({...newRecord, lyrics: e.target.value})} placeholder="Lyrics" className="bg-brand-bg" />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-text-muted">Lexicon ID</label>
          <Input value={newRecord.lexiconID || ''} onChange={(e) => setNewRecord({...newRecord, lexiconID: e.target.value})} placeholder="Lexicon ID" className="bg-brand-bg" />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-text-muted">Last Updated</label>
          <Input value={newRecord.lastUpdated || ''} onChange={(e) => setNewRecord({...newRecord, lastUpdated: e.target.value})} placeholder="YYYY-MM-DD" type="date" className="bg-brand-bg" />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-text-muted">Plays</label>
          <Input value={newRecord.plays || ''} onChange={(e) => setNewRecord({...newRecord, plays: e.target.value})} placeholder="Number of Plays" type="number" className="bg-brand-bg" />
        </div>
      </>
    )}

    {/* CHECKLIST FIELDS */}
    {activeTable === 'DyatraChecklist' && (
      <>
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-text-muted">Task</label>
          <Input value={newRecord.task || ''} onChange={(e) => setNewRecord({...newRecord, task: e.target.value})} placeholder="Task details" className="bg-brand-bg" />
        </div>
        <Input value={newRecord.category || ''} onChange={(e) => setNewRecord({...newRecord, category: e.target.value})} placeholder="Category (e.g. Audio)" className="bg-brand-bg" />
      </>
    )}

    {/* LED FIELDS */}
   {/* LED FIELDS */}
{activeTable === 'LED' && (
  <div className="space-y-6">
    <div className="p-3 bg-brand-primary/5 border border-brand-primary/10 rounded-lg space-y-3">
      <p className="text-[9px] font-black uppercase text-brand-primary">Session & Location Context</p>
      <div className="grid grid-cols-2 gap-3">
        <Input value={newRecord["LedId"] || ''} onChange={(e) => setNewRecord({...newRecord, "LedId": e.target.value})} placeholder="LedId" className="bg-brand-bg h-9 text-xs" />
        <Input value={newRecord["🕘 Session"] || ''} onChange={(e) => setNewRecord({...newRecord, "🕘 Session": e.target.value})} placeholder="🕘 Session" className="bg-brand-bg h-9 text-xs" />
        <Input value={newRecord["Parent Event (from 🕘 Session)"] || ''} onChange={(e) => setNewRecord({...newRecord, "Parent Event (from 🕘 Session)": e.target.value})} placeholder="Parent Event" className="bg-brand-bg h-9 text-xs" />
        <Input type="date" value={newRecord["Date (from 🕘 Session)"] || ''} onChange={(e) => setNewRecord({...newRecord, "Date (from 🕘 Session)": e.target.value})} className="bg-brand-bg h-9 text-xs" />
        <Input value={newRecord["City (from 🕘 Session)"] || ''} onChange={(e) => setNewRecord({...newRecord, "City (from 🕘 Session)": e.target.value})} placeholder="City" className="bg-brand-bg h-9 text-xs" />
        <Input value={newRecord["Venue (from 🕘 Session)"] || ''} onChange={(e) => setNewRecord({...newRecord, "Venue (from 🕘 Session)": e.target.value})} placeholder="Venue" className="bg-brand-bg h-9 text-xs" />
      </div>
    </div>

    <div className="p-3 bg-slate-900/30 border border-slate-800 rounded-lg space-y-3">
      <p className="text-[9px] font-black uppercase text-slate-400">Core Setup</p>
      <div className="grid grid-cols-2 gap-3">
        <Input value={newRecord["Vendor"] || ''} onChange={(e) => setNewRecord({...newRecord, "Vendor": e.target.value})} placeholder="Vendor Name" className="bg-brand-bg h-9 text-xs" />
        <select className="bg-brand-bg border border-slate-700 rounded h-9 text-xs px-2" value={newRecord["Indoor/Outdoor LED?"] || ''} onChange={(e) => setNewRecord({...newRecord, "Indoor/Outdoor LED?": e.target.value})}>
           <option value="">Indoor/Outdoor?</option>
           <option value="Indoor">Indoor</option>
           <option value="Outdoor">Outdoor</option>
        </select>
        <Input value={newRecord["is Led Required?"] || ''} onChange={(e) => setNewRecord({...newRecord, "is Led Required?": e.target.value})} placeholder="is Led Required? (Yes/No)" className="bg-brand-bg h-9 text-xs" />
        <Input value={newRecord["Stageht"] || ''} onChange={(e) => setNewRecord({...newRecord, "Stageht": e.target.value})} placeholder="Stage Height" className="bg-brand-bg h-9 text-xs" />
      </div>
    </div>

    <div className="grid grid-cols-1 gap-4">
      {/* Centre LED */}
      <div className="p-3 border border-slate-800 rounded-lg space-y-2">
        <p className="text-[9px] font-black uppercase text-blue-400">Centre LED</p>
        <Input value={newRecord["CentreLed"] || ''} onChange={(e) => setNewRecord({...newRecord, "CentreLed": e.target.value})} placeholder="CentreLed Name" className="bg-brand-bg h-8 text-xs mb-2" />
        <div className="grid grid-cols-4 gap-2">
          <Input value={newRecord["CntrPitch"] || ''} onChange={(e) => setNewRecord({...newRecord, "CntrPitch": e.target.value})} placeholder="Pitch" className="h-8 text-[10px]" />
          <Input value={newRecord["CntrWdth"] || ''} onChange={(e) => setNewRecord({...newRecord, "CntrWdth": e.target.value})} placeholder="Width" className="h-8 text-[10px]" />
          <Input value={newRecord["CntrHt"] || ''} onChange={(e) => setNewRecord({...newRecord, "CntrHt": e.target.value})} placeholder="Height" className="h-8 text-[10px]" />
          <Input value={newRecord["CntrRiser"] || ''} onChange={(e) => setNewRecord({...newRecord, "CntrRiser": e.target.value})} placeholder="Riser" className="h-8 text-[10px]" />
        </div>
      </div>

      {/* Side LED */}
      <div className="p-3 border border-slate-800 rounded-lg space-y-2">
        <p className="text-[9px] font-black uppercase text-purple-400">Side LED</p>
        <Input value={newRecord["SideLed"] || ''} onChange={(e) => setNewRecord({...newRecord, "SideLed": e.target.value})} placeholder="SideLed Name" className="bg-brand-bg h-8 text-xs mb-2" />
        <div className="grid grid-cols-3 gap-2">
          <Input value={newRecord["SidePitch"] || ''} onChange={(e) => setNewRecord({...newRecord, "SidePitch": e.target.value})} placeholder="Pitch" className="h-8 text-[10px]" />
          <Input value={newRecord["SideWdth"] || ''} onChange={(e) => setNewRecord({...newRecord, "SideWdth": e.target.value})} placeholder="Width" className="h-8 text-[10px]" />
          <Input value={newRecord["SideHt"] || ''} onChange={(e) => setNewRecord({...newRecord, "SideHt": e.target.value})} placeholder="Height" className="h-8 text-[10px]" />
        </div>
      </div>

      {/* Other LED 1 & 2 */}
      <div className="p-3 border border-slate-800 rounded-lg space-y-2">
        <p className="text-[9px] font-black uppercase text-orange-400">Auxiliary LED (Other 1 & 2)</p>
        <div className="grid grid-cols-2 gap-2">
           <Input value={newRecord["OtherLed1"] || ''} onChange={(e) => setNewRecord({...newRecord, "OtherLed1": e.target.value})} placeholder="OtherLed1 Name" className="h-8 text-[10px]" />
           <Input value={newRecord["OtherLed2"] || ''} onChange={(e) => setNewRecord({...newRecord, "OtherLed2": e.target.value})} placeholder="OtherLed2 Name" className="h-8 text-[10px]" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Input value={newRecord["OtherPitch"] || ''} onChange={(e) => setNewRecord({...newRecord, "OtherPitch": e.target.value})} placeholder="Oth Pitch" className="h-8 text-[10px]" />
          <Input value={newRecord["OtherWdth"] || ''} onChange={(e) => setNewRecord({...newRecord, "OtherWdth": e.target.value})} placeholder="Oth Width" className="h-8 text-[10px]" />
          <Input value={newRecord["OtherHt"] || ''} onChange={(e) => setNewRecord({...newRecord, "OtherHt": e.target.value})} placeholder="Oth Height" className="h-8 text-[10px]" />
          <div className="col-span-1"></div>
          <Input value={newRecord["Other2Wdth"] || ''} onChange={(e) => setNewRecord({...newRecord, "Other2Wdth": e.target.value})} placeholder="Oth2 Width" className="h-8 text-[10px]" />
          <Input value={newRecord["Other2Ht"] || ''} onChange={(e) => setNewRecord({...newRecord, "Other2Ht": e.target.value})} placeholder="Oth2 Height" className="h-8 text-[10px]" />
        </div>
      </div>
    </div>

    <div className="p-3 bg-red-900/10 border border-red-900/20 rounded-lg space-y-3">
      <p className="text-[9px] font-black uppercase text-red-400">Power & Media</p>
      <div className="grid grid-cols-2 gap-3">
        <Input value={newRecord["DGUseedKva"] || ''} onChange={(e) => setNewRecord({...newRecord, "DGUseedKva": e.target.value})} placeholder="DG Use (KVA)" className="bg-brand-bg h-9 text-xs" />
        <Input value={newRecord["BackupPower"] || ''} onChange={(e) => setNewRecord({...newRecord, "BackupPower": e.target.value})} placeholder="Backup Power" className="bg-brand-bg h-9 text-xs" />
      </div>
      <Input value={newRecord["Images"] || ''} onChange={(e) => setNewRecord({...newRecord, "Images": e.target.value})} placeholder="Image URLs (https://...)" className="bg-brand-bg h-9 text-xs" />
    </div>
  </div>
)}

    {/* VIDEO SETUP */}
    {activeTable === 'VideoSetup' && (
      <>
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-text-muted">Name</label>
          <Input value={newRecord.name || ''} onChange={(e) => setNewRecord({...newRecord, name: e.target.value})} placeholder="Equipment/Setup Name" className="bg-brand-bg" />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-text-muted">Notes</label>
          <Input value={newRecord.notes || ''} onChange={(e) => setNewRecord({...newRecord, notes: e.target.value})} placeholder="Additional notes" className="bg-brand-bg" />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-text-muted">Assignee</label>
          <Input value={newRecord.assignee || ''} onChange={(e) => setNewRecord({...newRecord, assignee: e.target.value})} placeholder="Person assigned" className="bg-brand-bg" />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-text-muted">Status</label>
          <Input value={newRecord.status || ''} onChange={(e) => setNewRecord({...newRecord, status: e.target.value})} placeholder="Ready, Pending, etc." className="bg-brand-bg" />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-text-muted">Attachments Link</label>
          <Input value={newRecord.attachments || ''} onChange={(e) => setNewRecord({...newRecord, attachments: e.target.value})} placeholder="https://..." className="bg-brand-bg" />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-text-muted">Attachment Summary</label>
          <Input value={newRecord.attachmentSummary || ''} onChange={(e) => setNewRecord({...newRecord, attachmentSummary: e.target.value})} placeholder="Summary of attachments" className="bg-brand-bg" />
        </div>
      </>
    )}

    {/* AUDIO SETUP */}
    {activeTable === 'AudioSetup' && (
      <>
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-text-muted">Name</label>
          <Input value={newRecord.name || ''} onChange={(e) => setNewRecord({...newRecord, name: e.target.value})} placeholder="Equipment/Setup Name" className="bg-brand-bg" />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-text-muted">Notes</label>
          <Input value={newRecord.notes || ''} onChange={(e) => setNewRecord({...newRecord, notes: e.target.value})} placeholder="Additional notes" className="bg-brand-bg" />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-text-muted">Assignee</label>
          <Input value={newRecord.assignee || ''} onChange={(e) => setNewRecord({...newRecord, assignee: e.target.value})} placeholder="Person assigned" className="bg-brand-bg" />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-text-muted">Status</label>
          <Input value={newRecord.status || ''} onChange={(e) => setNewRecord({...newRecord, status: e.target.value})} placeholder="Ready, Pending, etc." className="bg-brand-bg" />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-text-muted">Attachments Link</label>
          <Input value={newRecord.attachments || ''} onChange={(e) => setNewRecord({...newRecord, attachments: e.target.value})} placeholder="https://..." className="bg-brand-bg" />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-text-muted">Attachment Summary</label>
          <Input value={newRecord.attachmentSummary || ''} onChange={(e) => setNewRecord({...newRecord, attachmentSummary: e.target.value})} placeholder="Summary of attachments" className="bg-brand-bg" />
        </div>
      </>
    )}

{/* CHECKLIST FIELDS */}
{activeTable === 'DyatraChecklist' && (
  <div className="space-y-4">
    <div className="space-y-1">
      <label className="text-[10px] font-bold uppercase text-slate-500">Task</label>
      <Input value={newRecord["Task"] || ''} onChange={(e) => setNewRecord({...newRecord, "Task": e.target.value})} placeholder="Task Name" className="bg-brand-bg" />
    </div>
    <div className="space-y-1">
      <label className="text-[10px] font-bold uppercase text-slate-500">Details</label>
      <Textarea value={newRecord["Details"] || ''} onChange={(e) => setNewRecord({...newRecord, "Details": e.target.value})} placeholder="Full details..." className="bg-brand-bg min-h-[80px]" />
    </div>
    <div className="grid grid-cols-2 gap-4">
      <Input value={newRecord["TaskGroup"] || ''} onChange={(e) => setNewRecord({...newRecord, "TaskGroup": e.target.value})} placeholder="TaskGroup" className="bg-brand-bg" />
      <Input value={newRecord["OrderId"] || ''} onChange={(e) => setNewRecord({...newRecord, "OrderId": e.target.value})} placeholder="OrderId" className="bg-brand-bg" />
      <Input value={newRecord["People Involved"] || ''} onChange={(e) => setNewRecord({...newRecord, "People Involved": e.target.value})} placeholder="People Involved" className="bg-brand-bg" />
      <Input value={newRecord["Typical Timeline"] || ''} onChange={(e) => setNewRecord({...newRecord, "Typical Timeline": e.target.value})} placeholder="Typical Timeline" className="bg-brand-bg" />
      <Input value={newRecord["Category"] || ''} onChange={(e) => setNewRecord({...newRecord, "Category": e.target.value})} placeholder="Category" className="bg-brand-bg" />
      <Input value={newRecord["Period"] || ''} onChange={(e) => setNewRecord({...newRecord, "Period": e.target.value})} placeholder="Period" className="bg-brand-bg" />
    </div>
    <Input value={newRecord["Attachment"] || ''} onChange={(e) => setNewRecord({...newRecord, "Attachment": e.target.value})} placeholder="Attachment Link (https://...)" className="bg-brand-bg" />
  </div>
)}
    {/* DATA SHARING (Mapped to Locations) */}
  {/* DATA SHARING FIELDS */}
{activeTable === 'DataSharing' && (
  <div className="space-y-4">
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-1">
        <label className="text-[10px] font-bold uppercase text-slate-500">Sevak</label>
        <Input value={newRecord["Sevak"] || ''} onChange={(e) => setNewRecord({...newRecord, "Sevak": e.target.value})} placeholder="Sevak Name" className="bg-brand-bg" />
      </div>
      <div className="space-y-1">
        <label className="text-[10px] font-bold uppercase text-slate-500">Dept</label>
        <Input value={newRecord["Dept"] || ''} onChange={(e) => setNewRecord({...newRecord, "Dept": e.target.value})} placeholder="Department" className="bg-brand-bg" />
      </div>
    </div>
    <div className="space-y-1">
      <label className="text-[10px] font-bold uppercase text-slate-500">EmailId</label>
      <Input value={newRecord["EmailId"] || ''} onChange={(e) => setNewRecord({...newRecord, "EmailId": e.target.value})} placeholder="Email Address" className="bg-brand-bg" />
    </div>
    <div className="space-y-1">
      <label className="text-[10px] font-bold uppercase text-slate-500">ShareFacts?</label>
      <select className="w-full bg-brand-bg border border-slate-700 rounded h-10 px-3 text-sm" value={newRecord["ShareFacts?"] || ''} onChange={(e) => setNewRecord({...newRecord, "ShareFacts?": e.target.value})}>
        <option value="No">No</option>
        <option value="Yes">Yes</option>
      </select>
    </div>
    <div className="space-y-1">
      <label className="text-[10px] font-bold uppercase text-slate-500">ShareData</label>
      <Textarea value={newRecord["ShareData"] || ''} onChange={(e) => setNewRecord({...newRecord, "ShareData": e.target.value})} placeholder="Describe data to share..." className="bg-brand-bg min-h-[60px]" />
    </div>
  </div>
)}
  </div>
</div>

           <DialogFooter className="p-6 px-8 border-t border-slate-100 bg-slate-50/50 flex flex-row items-center justify-end gap-3">
      <Button 
        variant="ghost" 
        onClick={() => setIsAddModalOpen(false)} 
       className="text-slate-500 font-bold uppercase text-[11px] tracking-widest hover:bg-slate-200 hover:text-slate-700 rounded-md border border-slate-300 px-4 py-2"
>
        Cancel
</Button>
      <Button 
        onClick={handleAddRecord} 
        className="bg-brand-primary hover:bg-brand-primary/90 text-white font-black uppercase text-[10px] tracking-widest px-8 h-9 rounded-xl shadow-lg shadow-brand-primary/20"
      >
        Create
      </Button>
    </DialogFooter>
        </DialogContent>
      </Dialog>

      <AttachmentManagerDialog
    manager={imageManager}
    onClose={() => setImageManager(null)}
    onUpdate={handleImageUpdate}
    activeTable={activeTable}
  />

      {expandedRecord && (
        <RecordExpandModal
          item={expandedRecord}
          tableName={activeTable}
          columns={getTableColumns()}
          sessions={sessions}
          events={events}
          onClose={() => setExpandedRecord(null)}
          onSave={handleExpandedSave}
        />
      )}

      {linkedSession && (
        <div
          className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4"
          onClick={() => setLinkedSession(null)}
        >
          <div
            className="bg-white rounded-[24px] shadow-2xl w-full max-w-lg overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex items-center justify-between">
              <div>
                <div className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5">Linked Session</div>
                <div className="text-lg font-black text-slate-900 tracking-tight">{linkedSession["Session Name"]}</div>
              </div>
              <button onClick={() => setLinkedSession(null)} className="p-2 rounded-xl hover:bg-slate-200 transition-colors">
                <X className="h-4 w-4 text-slate-500" />
              </button>
            </div>
            <div className="p-6 grid grid-cols-2 gap-x-6 gap-y-4">
              {(['Parent Event', 'Date', 'City', 'Venue', 'TimeOfDay', 'Occasion', 'SessionType', 'Notes'] as const).map(field =>
                linkedSession[field] ? (
                  <div key={field}>
                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{field}</div>
                    <div className="text-[13px] font-semibold text-slate-800">{linkedSession[field]}</div>
                  </div>
                ) : null
              )}
            </div>
            <div className="px-6 pb-5 border-t border-slate-100 pt-4">
              <button
                onClick={() => { setActiveTable('Session'); setLinkedSession(null); }}
                className="text-[11px] font-black text-brand-primary uppercase tracking-widest hover:underline flex items-center gap-1"
              >
                Open in Sessions table <ArrowUpRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>

  );
}