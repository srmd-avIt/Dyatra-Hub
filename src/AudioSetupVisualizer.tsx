import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic2, Speaker, Settings2, Info, Cable, 
  Layout, ClipboardCheck, ArrowRight,
  Zap, AlertTriangle, ListFilter,
  CheckCircle2, Music, ChevronRight, X, 
  Download, ShieldAlert, Radio, Terminal, 
  Box, Volume2, Monitor, Cpu, History, 
  CheckSquare, Activity, Eye, Play, List,
  ArrowUpRight, Gauge, Layers, Database,
  Calendar, Maximize2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// --- 1. GENERAL INSTRUCTIONS (FLAW ANALYSIS - TABLE FORMAT) ---
const FLAW_TABLE = [
  { id: 1, severity: 'CRITICAL', category: 'Gurudev Mic', wrong: 'Generic headset / No backup', correction: 'Mandatory DPA 4066/4088 + Matched backup on Ch 2.' },
  { id: 2, severity: 'HIGH', category: 'Speaker Placement', wrong: 'Speakers on floor / Insufficient count', correction: 'Min 6 speakers for >200 pax. Must be at ear level.' },
  { id: 3, severity: 'HIGH', category: 'Monitoring', wrong: 'Shared mix with Lead', correction: 'Dedicated separate Aux sends for Singers (Aux 2+).' },
  { id: 4, severity: 'MEDIUM', category: 'Playback', wrong: 'Mono Jack input', correction: '2x Isolated DI Boxes (Radial J48) for PB-L and PB-R.' },
  { id: 5, severity: 'MEDIUM', category: 'Recording', wrong: 'Ad-hoc tapping of outputs', correction: 'Dedicated Matrix/Aux "REC OUT" to Zoom F6/F8n.' },
  { id: 6, severity: 'HIGH', category: 'Power', wrong: 'No UPS on Mixer', correction: 'Dedicated Online UPS mandatory for all digital mixers.' }
];

// --- 2. EQUIPMENT REFERENCE DATA (Catalog) ---
const EQUIPMENT_CATALOG = {
  mixers: [
    { name: 'Yamaha MG12XU', type: 'Analog', specs: '12 inputs, 1-knob Comp, SPX FX', use: 'Small Rooms / Backup', img: 'https://usa.yamaha.com/files/mg12xu_900x900_394d21e8e4f5.jpg' },
    { name: 'Yamaha TF1', type: 'Digital', specs: '16-ch, 17 faders, Touchflow', use: 'Medium Halls / Banquet', img: 'https://usa.yamaha.com/files/TF1_900x900_e5b0b4b2b6b5.jpg' },
    { name: 'Yamaha CL3/QL5', type: 'Digital', specs: '32/64-ch, Dante Native', use: 'Large Convention / Professional', img: 'https://usa.yamaha.com/files/QL5_900x900_174d6d634d1b.jpg' },
    { name: 'Soundcraft Ui16', type: 'Digital / Tablet', specs: '16-ch, Built-in Wi-Fi', use: 'Medium / Portable', img: 'https://www.soundcraft.com/en/product_documents/ui16_top_high-jpg' }
  ],
  speakers: [
    { name: 'QSC K8.2', type: 'Point Source', specs: '2000W, 8" Woofer, 105° Coverage', use: 'Small Rooms / Monitor' },
    { name: 'QSC K12.2', type: 'Point Source', specs: '2000W, 12" Woofer, 75° Coverage', use: 'Main PA / Stage Wedge' },
    { name: 'L-Acoustics ARCS', type: 'Line Array', specs: 'Pro-Touring Grade', use: 'Large Scale Convention' }
  ],
  subwoofers: [
    { name: 'QSC KS112', type: 'Compact Sub', specs: '2000W, 12" Active', use: 'Medium Hall Low-end' },
    { name: 'QSC KS118', type: 'High-Output Sub', specs: '3600W, 18" Active', use: 'Outdoor / Large Hall' }
  ],
  wireless: [
    { name: 'Sennheiser EW G4', type: 'UHF Wireless', specs: 'Diversity Receiver', use: 'Vocal / GD Primary' },
    { name: 'Shure ULXD', type: 'Digital Wireless', specs: 'Dante Enabled, 256-bit Enc', use: 'Critical Pro Audio' }
  ]
};

// --- 3. THE 7 AUDIO SETUP TEMPLATES ---
const SETUP_TEMPLATES = [
  { id: 'small', title: 'Small Community Room', pax: '30-80', mixer: 'Yamaha MG12XU', mics: 'Hand-held / DPA 4066', pa: '2x QSC K8.2', monitors: '1x Wedge (Aux 1)', cable: '15m XLR Snake', rec: 'Field Recorder (Zoom)',
    patch: [ { ch: 1, label: 'GD MAIN', gear: 'DPA 4066' }, { ch: 7, label: 'PB-L', gear: 'Radial DI' } ] },
  { id: 'medium', title: 'Medium Hall / Banquet', pax: '80-200', mixer: 'Yamaha TF1', mics: 'DPA 4066 + Matched Backup', pa: '2x QSC K12.2 + KS112', monitors: '2x Wedges (Aux 1-2)', cable: '20m Multicore', rec: 'Mixer REC/Aux Out',
    patch: [ { ch: 1, label: 'GD MAIN', gear: 'DPA 4066' }, { ch: 2, label: 'GD BKUP', gear: 'Matched DPA' }, { ch: 3, label: 'Singer 1', gear: 'EW G4' } ] },
  { id: 'auditorium', title: 'School Auditorium', pax: '150-300', mixer: 'Yamaha TF3', mics: '2x DPA 4088 Matched', pa: '6x QSC K12.2 (3 per side)', monitors: '4x Wedges (Aux 1-4)', cable: 'Patch Panel / UPS', rec: 'Multi-track Recorder',
    patch: [ { ch: 1, label: 'GD MAIN', gear: 'DPA 4088' }, { ch: 2, label: 'GD BKUP', gear: 'DPA 4088' }, { ch: 10, label: 'Podium', gear: 'C411' } ] },
  { id: 'large-conv', title: 'Large Conv Hall', pax: '300-700', mixer: 'Yamaha CL3 / QL5', mics: 'Matched DPA Pair (Axient)', pa: 'Line Array (L-Acoustics)', monitors: '6x Wedges + IEM', cable: '3-Phase / Dante', rec: 'Matrix REC / Broadcast Feed',
    patch: [ { ch: 1, label: 'GD MAIN', gear: 'Axient+DPA' }, { ch: 2, label: 'GD BKUP', gear: 'Axient+DPA' } ] },
  { id: 'outdoor-small', title: 'Outdoor Ground (S)', pax: '200-500', mixer: 'Yamaha TF3', mics: 'DPA 4066 (WS)', pa: '6-8x QSC K12.2 on 3m Poles', monitors: '2x Wedges', cable: 'All-weather Gaffer', rec: 'Onboard Recorder / Live Mix',
    patch: [ { ch: 1, label: 'GD MAIN', gear: 'DPA' } ] },
  { id: 'large-outdoor', title: 'Large Outdoor', pax: '1000+', mixer: 'DiGiCo S31 / CL5', mics: 'Redundant Axient Mics', pa: 'Full Line Array + Delays', monitors: 'Monitor Desk + IEMs', cable: 'Fiber / Power Distro', rec: 'Broadcast/FOH Split',
    patch: [ { ch: 1, label: 'GD MAIN', gear: 'DPA' } ] },
  { id: 'vip-room', title: 'VIP Close Room', pax: '10-30', mixer: 'Yamaha MG10XU', mics: 'Table Boundary / DPA', pa: '2x QSC K8.2 (Low Vol)', monitors: 'None', cable: 'Standard XLR', rec: 'None',
    patch: [ { ch: 1, label: 'GD MAIN', gear: 'Boundary' } ] }
];

// --- 4. PRE-EVENT CHECKLIST ---
const AUDIT_STEPS = [
  { section: 'Day Before', tasks: ['Charge all wireless batteries', 'Label all snakes and DI boxes', 'Download scene to USB'] },
  { section: 'On-Site Setup', tasks: ['Frequency Scan (IMD Clean)', 'Phase Check Main PA', 'Neutral-Ground Voltage Check (<1V)'] },
  { section: 'Soundcheck', tasks: ['GD Main vs Backup EQ Match', 'Verify Stereo PB Field', 'Loop-check Matrix Rec Out'] }
];

export default function AudioSetupHub({ currentUser, onReportStored }: { currentUser?: any, onReportStored?: () => void } = {}) {
  const [activeTab, setActiveTab] = useState('templates');
  const [activeVenue, setActiveVenue] = useState('medium');
  const [inspectGear, setInspectGear] = useState<any>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkedTasks, setCheckedTasks] = useState<Record<string, boolean>>({});
  const [logs, setLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [selectedLog, setSelectedLog] = useState<any | null>(null);

  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await window.fetch('/api/audiosetup');
      if (res.ok) {
        const data = await res.json();
        setLogs(data.filter((item: any) => item.Name?.startsWith('Pre-Event Audit')).sort((a: any, b: any) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()));
      }
    } catch (e) {
      console.error('Failed to fetch logs', e);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'log') {
      fetchLogs();
    }
  }, [activeTab]);

  const logByDate = useMemo(() => {
    const groups: Record<string, any[]> = {};
    logs.forEach(m => {
      const raw = m.created_at ? String(m.created_at).split('T')[0] : '';
      const key = raw ? raw.split('T')[0] : 'Unknown date';
      if (!groups[key]) groups[key] = [];
      groups[key].push(m);
    });
    return Object.entries(groups).sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime());
  }, [logs]);

  const venue = SETUP_TEMPLATES.find(v => v.id === activeVenue)!;

  const allTasksCount = AUDIT_STEPS.reduce((acc, section) => acc + section.tasks.length, 0);
  const completedTasksCount = Object.values(checkedTasks).filter(Boolean).length;

  const submitAuditReport = async () => {
    setIsSubmitting(true);
    try {
      const userName = currentUser?.name || currentUser?.email || 'System';
      const passedTasks = Object.entries(checkedTasks).filter(([_, v]) => v).map(([k]) => k);
      
      const resAudio = await window.fetch('/api/audiosetup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          Name: `Pre-Event Audit: ${venue.title}`,
          Notes: `${completedTasksCount} out of ${allTasksCount} tasks verified.\n\nChecks:\n${passedTasks.length > 0 ? passedTasks.map(t => `• ${t}`).join('\n') : 'None'}`,
          Status: 'Done',
          Assignee: userName,
          _modifiedBy: userName
        })
      });

      if (resAudio.ok) {
        alert('Pre-Event Audit Report stored in database successfully!');
        setIsSubmitted(true);
        setCheckedTasks({}); // Automatically reset checkboxes
        if (onReportStored) onReportStored();
        
        // Reset the submit button state after 3 seconds so it can be used again
        setTimeout(() => {
          setIsSubmitted(false);
        }, 3000);
      } else {
        alert('Failed to store report in database. Please check your connection.');
      }
    } catch (error) {
      alert(`Network error while storing report: ${error}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#f1f5f9] overflow-hidden font-sans">
      
      {/* --- HEADER --- */}
      <header className="px-4 sm:px-8 py-4 bg-white border-b border-slate-200 flex flex-col lg:flex-row items-start lg:items-center justify-between shrink-0 gap-4 max-w-full">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="h-8 w-8 sm:h-10 sm:w-10 bg-brand-primary rounded-xl flex items-center justify-center shadow-lg shadow-brand-primary/20 shrink-0">
             <Settings2 className="text-white h-4 w-4 sm:h-[22px] sm:w-[22px]" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-none uppercase italic">AUDIO <span className="text-brand-primary">SetUp</span></h1>
            <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic">D'yatra Support System v2.2</p>
          </div>
        </div>

        <div className="w-full lg:w-auto overflow-x-auto scrollbar-hide -mx-4 px-4 lg:mx-0 lg:px-0">
          <nav className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200 w-max">
            {[
              { id: 'templates', label: 'Setup Templates', icon: Layout },
              { id: 'library', label: 'Equipment Library', icon: Database },
              { id: 'instructions', label: 'General Instructions', icon: List },
              { id: 'audit', label: 'Pre-Event Audit', icon: ShieldAlert },
              { id: 'log', label: 'Audit Log', icon: History }
            ].map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)} className={`shrink-0 px-3 sm:px-4 py-2 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 sm:gap-2 ${activeTab === t.id ? 'bg-white text-brand-primary shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-800'}`}>
                <t.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4"/> {t.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* --- MAIN CONTENT AREA --- */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 scrollbar-hide">
        <div className="max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}>
              
              {/* --- TAB: SETUP TEMPLATES --- */}
              {activeTab === 'templates' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Sidebar: Template Selector */}
                  <div className="lg:col-span-3 space-y-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 pl-2">Select Venue Type</p>
                    {SETUP_TEMPLATES.map(v => (
                      <button key={v.id} onClick={() => setActiveVenue(v.id)} className={`w-full p-4 rounded-2xl border transition-all text-left flex items-center justify-between group ${activeVenue === v.id ? 'bg-brand-primary border-brand-primary text-white shadow-xl shadow-brand-primary/20' : 'bg-white border-slate-200 text-slate-600 hover:border-brand-primary/40'}`}>
                        <div>
                          <p className="text-[12px] font-black uppercase tracking-tight">{v.title}</p>
                          <p className={`text-[10px] font-bold uppercase opacity-60 ${activeVenue === v.id ? 'text-white' : 'text-slate-400'}`}>{v.pax} Pax</p>
                        </div>
                        <ChevronRight size={18} className={activeVenue === v.id ? 'opacity-100' : 'opacity-20 group-hover:opacity-100'}/>
                      </button>
                    ))}
                  </div>

                  {/* Main: Template Blueprint */}
                  <div className="lg:col-span-9 space-y-6">
                    {/* Console hub */}
                    <div className="relative overflow-hidden rounded-[40px] bg-slate-900 p-10 text-white shadow-2xl">
                      <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none rotate-12"><Terminal size={300} /></div>
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-8">
                           <Badge className="bg-brand-primary/20 text-brand-primary border-none text-[10px] font-black px-3 py-1 tracking-widest">SYSTEM BLUEPRINT</Badge>
                           <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em]">{venue.title}</span>
                        </div>
                        <div className="flex items-center gap-4 mb-8">
                          <div className="h-12 w-12 bg-brand-primary rounded-2xl flex items-center justify-center shadow-lg"><Radio size={24}/></div>
                          <div>
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Primary Mixer</p>
                            <div className="flex items-center gap-3">
                              <h2 className="text-4xl font-black tracking-tighter leading-none uppercase">{venue.mixer}</h2>
                              {/* EYE ICON: Mixer Details */}
                              <button onClick={() => {
                                const gear = EQUIPMENT_CATALOG.mixers.find(m => venue.mixer.includes(m.name)) || EQUIPMENT_CATALOG.mixers[0];
                                setInspectGear(gear);
                              }} className="text-brand-primary hover:scale-125 transition-transform"><Eye size={28}/></button>
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-8 border-t border-white/10">
                          <div><p className="text-[9px] font-black text-slate-500 uppercase mb-2">Capture</p><p className="text-xs font-bold flex items-center gap-2">{venue.mics} <Mic2 size={14} className="text-blue-400"/></p></div>
                          <div><p className="text-[9px] font-black text-slate-500 uppercase mb-2">Main PA</p><p className="text-xs font-bold flex items-center gap-2">{venue.pa} <Speaker size={14} className="text-indigo-400"/></p></div>
                          <div><p className="text-[9px] font-black text-slate-500 uppercase mb-2">Monitors</p><p className="text-xs font-bold">{venue.monitors}</p></div>
                          <div><p className="text-[9px] font-black text-slate-500 uppercase mb-2">Recording</p><p className="text-xs font-bold">{venue.rec ?? 'N/A'}</p></div>
                        </div>
                      </div>
                    </div>

                    {/* Mixer Patch Map */}
                    <Card className="rounded-[32px] border-none shadow-xl ring-1 ring-slate-200 overflow-hidden bg-white">
                       <div className="px-8 py-5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                         <div className="flex items-center gap-2">
                           <ListFilter className="text-brand-primary" size={18}/>
                           <span className="text-[11px] font-black uppercase tracking-widest text-slate-500 font-mono">Standard Channel Map</span>
                         </div>
                       </div>
                       <table className="w-full text-left">
                         <thead>
                           <tr className="text-[9px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-50">
                             <th className="px-8 py-3 w-20">CH</th>
                             <th className="px-6 py-3">Label</th>
                             <th className="px-6 py-3">Hardware Source</th>
                           </tr>
                         </thead>
                         <tbody className="divide-y divide-slate-50">
                           {venue.patch.map((ch, i) => (
                             <tr key={i} className="hover:bg-slate-50 transition-colors">
                               <td className="px-8 py-4 font-mono font-black text-brand-primary text-base">{ch.ch.toString().padStart(2,'0')}</td>
                               <td className="px-6 py-4"><span className="px-3 py-1 bg-slate-900 text-white rounded-lg font-black text-[11px] tracking-tight">{ch.label}</span></td>
                               <td className="px-6 py-4 font-bold text-slate-700 text-[12px]">{ch.gear}</td>
                             </tr>
                           ))}
                         </tbody>
                       </table>
                    </Card>
                  </div>
                </div>
              )}

              {/* --- TAB: EQUIPMENT LIBRARY (Browse All) --- */}
              {activeTab === 'library' && (
                <div className="space-y-12">
                  {Object.entries(EQUIPMENT_CATALOG).map(([category, items]) => (
                    <div key={category}>
                       <h3 className="text-[11px] font-black text-brand-primary uppercase tracking-[0.4em] mb-6 flex items-center gap-4">
                         <div className="h-px flex-1 bg-slate-200"/>
                         {category}
                         <div className="h-px flex-1 bg-slate-200"/>
                       </h3>
                       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                         {items.map((item: any, i: number) => (
                           <Card key={i} onClick={() => setInspectGear(item)} className="rounded-[24px] border-none shadow-sm ring-1 ring-slate-200 hover:ring-brand-primary/50 hover:shadow-lg transition-all cursor-pointer bg-white group">
                             <CardContent className="p-5">
                               <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 mb-4 group-hover:bg-brand-primary/10 group-hover:text-brand-primary transition-colors">
                                 {category === 'mixers' ? <Activity size={20}/> : <Speaker size={20}/>}
                               </div>
                               <h4 className="font-black text-slate-900 uppercase text-xs mb-1 truncate">{item.name}</h4>
                               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-3">{item.type}</p>
                               <div className="pt-3 border-t border-slate-50">
                                 <p className="text-[10px] text-slate-600 font-semibold leading-relaxed line-clamp-2 italic">"{item.specs}"</p>
                               </div>
                             </CardContent>
                           </Card>
                         ))}
                       </div>
                    </div>
                  ))}
                </div>
              )}

              {/* --- TAB: GENERAL INSTRUCTIONS (FLAW TABLE) --- */}
              {activeTab === 'instructions' && (
                <Card className="rounded-[40px] border-none shadow-xl ring-1 ring-slate-200 overflow-hidden bg-white">
                   <div className="p-6 border-b border-slate-100 flex items-center gap-3 bg-red-50/30">
                     <AlertTriangle className="text-red-500" size={24}/>
                     <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Audio Setup</h2>
                   </div>
                   <div className="overflow-x-auto">
                     <table className="w-full text-left">
                       <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                         <tr>
                           <th className="px-6 py-4">Area</th>
                           <th className="px-6 py-4">Issue</th>
                           <th className="px-6 py-4 text-green-600">Fix</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-100">
                         {FLAW_TABLE.map(f => (
                           <tr key={f.id} className="hover:bg-red-50/10 transition-colors">
                             <td className="px-6 py-4 text-[13px] font-black text-slate-700">{f.category}</td>
                             <td className="px-6 py-4 text-[13px] text-slate-500">{f.wrong}</td>
                             <td className="px-6 py-4 text-[13px] font-semibold text-slate-900">{f.correction}</td>
                           </tr>
                         ))}
                       </tbody>
                     </table>
                   </div>
                </Card>
              )}

              {/* --- TAB: PRE-EVENT AUDIT CHECKLIST --- */}
              {activeTab === 'audit' && (
                <div className="space-y-4 sm:space-y-6">
                  {AUDIT_STEPS.map(section => (
                    <Card key={section.section} className="rounded-2xl sm:rounded-3xl border-none shadow-md ring-1 ring-slate-200 bg-white overflow-hidden">
                       <div className="px-4 py-3 sm:px-6 sm:py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                          <h3 className="text-[10px] sm:text-[11px] font-black text-brand-primary uppercase tracking-[0.2em] sm:tracking-[0.3em] font-mono italic">Phase: {section.section}</h3>
                       </div>
                       <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-x-4 sm:gap-x-6 gap-y-3 sm:gap-y-4">
                          {section.tasks.map((task, idx) => (
                            <div key={idx} className="p-3 sm:p-4 rounded-2xl border border-slate-100 bg-slate-50/20 flex items-center gap-3 sm:gap-4 group hover:bg-white hover:shadow-md transition-all">
                               <input 
                                 type="checkbox" 
                                 checked={!!checkedTasks[task]}
                                 onChange={() => setCheckedTasks(prev => ({ ...prev, [task]: !prev[task] }))}
                                 className="h-5 w-5 sm:h-6 sm:w-6 rounded-lg sm:rounded-xl border-slate-300 text-brand-primary focus:ring-brand-primary cursor-pointer transition-all shrink-0"
                               />
                               <div className="min-w-0 flex-1">
                                  <p className="text-[12px] sm:text-[13px] font-black text-slate-900 group-hover:text-brand-primary transition-colors italic leading-snug mb-0.5">{task}</p>
                                  <p className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-wider sm:tracking-widest">Verification Required</p>
                               </div>
                            </div>
                          ))}
                       </div>
                    </Card>
                  ))}
                  <div className="p-6 sm:p-8 border-2 border-dashed border-slate-300 rounded-[24px] sm:rounded-[32px] text-center bg-white/50 space-y-4 sm:space-y-5 shadow-inner">
                     <ShieldAlert className="mx-auto text-brand-primary h-8 w-8 sm:h-12 sm:w-12"/>
                     <div>
                       <h4 className="text-lg sm:text-xl font-black text-slate-900 uppercase italic">Quality Audit Submission</h4>
                       <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em] mt-1.5 sm:mt-2">Submit to log completed tests.</p>
                     </div>
                     <button 
                       onClick={submitAuditReport}
                       disabled={isSubmitted || isSubmitting}
                       className={`px-8 sm:px-12 py-3 sm:py-4 text-white rounded-xl sm:rounded-2xl text-[10px] sm:text-xs font-black uppercase tracking-widest shadow-lg transition-all w-full sm:w-auto ${isSubmitted ? 'bg-green-600' : isSubmitting ? 'bg-slate-400 cursor-not-allowed' : 'bg-slate-900 hover:bg-brand-primary active:scale-95'}`}
                     >
                       {isSubmitting ? 'Saving to Database...' : isSubmitted ? 'Report Stored ✓' : 'Finalize & Submit Report'}
                     </button>
                  </div>
                </div>
              )}
              
              {/* --- TAB: AUDIT LOG --- */}
              {activeTab === 'log' && (
                <div className="space-y-4 sm:space-y-6">
                  <div className="flex items-center justify-between px-2">
                    <h2 className="text-lg sm:text-xl font-black text-slate-900 uppercase italic">Audit Reports Log</h2>
                    <button onClick={fetchLogs} className="text-[10px] font-bold text-brand-primary uppercase tracking-widest hover:underline flex items-center gap-1">
                      <History className="h-3 w-3" /> Refresh
                    </button>
                  </div>
                  
                  {loadingLogs ? (
                    <div className="p-12 text-center text-slate-400 text-sm font-bold uppercase tracking-widest animate-pulse">Loading logs...</div>
                  ) : logs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4"><History className="h-8 w-8 text-slate-400" /></div>
                      <div className="text-[14px] font-black text-slate-600">No audit reports found</div>
                      <div className="text-[12px] text-slate-400 mt-1">Submit an audit report to see the log</div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {logByDate.map(([dateKey, entries]) => (
                        <div key={dateKey}>
                          {/* Date header */}
                          <div className="flex items-center gap-3 mb-3">
                            <div className="h-px flex-1 bg-slate-200" />
                            <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full border border-slate-200">
                              {(() => {
                                const d = new Date(dateKey + 'T12:00:00');
                                return isNaN(d.getTime()) ? dateKey : d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
                              })()}
                            </span>
                            <div className="h-px flex-1 bg-slate-200" />
                          </div>
                          {/* Entries for this date */}
                          <div className="space-y-2">
                            {entries.map((log: any, idx: number) => {
                              const logId = log._id || idx.toString();
                              return (
                              <div 
                                key={logId} 
                                onClick={() => setSelectedLog(log)}
                                className="flex items-start gap-3 p-3.5 bg-white rounded-2xl border border-slate-200 hover:border-slate-300 transition-colors cursor-pointer group"
                              >
                                <div className="h-2.5 w-2.5 rounded-full bg-brand-primary mt-1.5 shrink-0" />
                                <div className="flex-1 min-w-0">
                                <div className="flex items-start sm:items-center justify-between gap-2 mb-1">
                                    <div className="flex items-center flex-wrap gap-2">
                                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full border bg-green-50 border-green-100 text-green-800 uppercase tracking-wide">Stored</span>
                                    <span className="text-[13px] font-bold text-slate-900 line-clamp-2 sm:truncate">{(log.Name || '—').split(' - ')[0]}</span>
                                    </div>
                                  <div className="flex items-center gap-2 sm:gap-3 ml-auto shrink-0">
                                    <div className="text-[10px] font-bold text-slate-400 whitespace-nowrap">
                                      {log.created_at ? new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                    </div>
                                    <Maximize2 className="h-3.5 w-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </div>
                                  </div>
                                  <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500 mt-1 sm:mt-0">
                                    {log.Assignee && (
                                      <span className="flex items-center gap-1 font-bold text-slate-700">
                                        <ShieldAlert className="h-3 w-3 text-brand-primary shrink-0" />
                                        By {log.Assignee}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )})}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* --- GEAR INSPECTOR MODAL (The "Eye" functionality) --- */}
      <AnimatePresence>
        {inspectGear && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setInspectGear(null)} className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-lg bg-white rounded-[48px] overflow-hidden shadow-2xl">
              <div className="h-64 bg-slate-100 flex items-center justify-center relative p-12">
                {inspectGear.img ? (
                   <img src={inspectGear.img} className="max-h-full object-contain drop-shadow-2xl scale-110" alt={inspectGear.name}/>
                ) : (
                   <Database className="text-slate-200" size={100}/>
                )}
                <button onClick={() => setInspectGear(null)} className="absolute top-6 right-6 h-12 w-12 bg-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"><X size={24} className="text-slate-400"/></button>
              </div>
              <div className="p-12">
                <Badge className="bg-brand-primary/10 text-brand-primary border-none text-[10px] font-black px-4 mb-3 uppercase tracking-widest italic">{inspectGear.category || 'Gear'}</Badge>
                <h3 className="text-4xl font-black text-slate-900 mb-3 leading-none italic">{inspectGear.name}</h3>
                <p className="text-sm font-bold text-slate-400 mb-8 uppercase tracking-widest border-l-2 border-slate-200 pl-4">{inspectGear.use}</p>
                
                <div className="space-y-4">
                  <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Technical Specifications</p><p className="text-sm font-bold text-slate-700">{inspectGear.specs}</p></div>
                  <div className="p-6 bg-brand-primary/5 rounded-3xl border border-brand-primary/10 flex gap-4">
                    <Zap className="text-brand-primary shrink-0" size={24}/>
                    <p className="text-[13px] font-bold text-slate-700 italic leading-relaxed">
                      <span className="text-brand-primary uppercase text-[9px] block not-italic mb-1 tracking-widest font-black">Technical Advisory</span>
                      {inspectGear.tip || 'Follow standard operating procedure.'}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- AUDIT LOG DETAILS MODAL --- */}
      <AnimatePresence>
        {selectedLog && (
          <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 sm:p-6" onClick={() => setSelectedLog(null)}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.95, opacity: 0, y: 20 }} 
              onClick={e => e.stopPropagation()} 
              className="relative w-full max-w-lg bg-white rounded-3xl sm:rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="px-6 py-5 sm:px-8 sm:py-6 bg-slate-50 border-b border-slate-100 flex items-start justify-between gap-4 shrink-0">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-green-100 text-green-700 border-none text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5">Report Stored</Badge>
                    <span className="text-[11px] font-bold text-slate-400">
                      {selectedLog.created_at ? new Date(selectedLog.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Unknown Date'}
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-snug">
                    {(selectedLog.Name || 'Audit Report').split(' - ')[0]}
                  </h3>
                  {selectedLog.Assignee && (
                    <div className="flex items-center gap-1.5 text-[12px] font-bold text-slate-500 mt-2">
                      <ShieldAlert className="h-3.5 w-3.5 text-brand-primary" />
                      Submitted by <span className="text-slate-800">{selectedLog.Assignee}</span>
                    </div>
                  )}
                </div>
                <button onClick={() => setSelectedLog(null)} className="h-8 w-8 bg-slate-200 hover:bg-slate-300 rounded-full flex items-center justify-center transition-colors shrink-0">
                  <X size={16} className="text-slate-600"/>
                </button>
              </div>
              <div className="p-6 sm:p-8 overflow-y-auto flex-1 bg-white space-y-4">
                 <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Audit Details & Notes</h4>
                 <div className="text-[13px] text-slate-700 leading-relaxed">
                   {(() => {
                     if (!selectedLog.Notes) return <span className="italic text-slate-400">No additional notes provided.</span>;
                     const text = selectedLog.Notes.replace(/^\[.*?\]\n/, '');
                     
                     const match = text.match(/(.*?)\n*Checks:\s*(.*)/s);
                     if (match) {
                       const [_, summary, checksPart] = match;
                       let items: string[] = [];
                       
                       if (checksPart.includes('•')) {
                         items = checksPart.split('\n').filter((l: string) => l.trim().startsWith('•')).map((l: string) => l.replace(/^•\s*/, '').trim());
                       } else if (checksPart.trim() !== 'None') {
                         items = checksPart.split(',').map((s: string) => s.trim()).filter(Boolean);
                       }
                       
                       return (
                         <div className="space-y-4">
                           <div className="whitespace-pre-wrap font-medium">{summary.trim()}</div>
                           <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 sm:p-5">
                             <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Checks Passed</div>
                             {items.length > 0 ? (
                               <ul className="list-disc pl-4 space-y-1.5 text-slate-700 marker:text-brand-primary">
                                 {items.map((item, i) => <li key={i} className="pl-1 leading-snug">{item}</li>)}
                               </ul>
                             ) : <span className="italic text-slate-400 text-[12px]">None</span>}
                           </div>
                         </div>
                       );
                     }
                     return <div className="whitespace-pre-wrap">{text}</div>;
                   })()}
                 </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}