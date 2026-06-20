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
  Calendar, Maximize2, User
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// --- 1. GENERAL INSTRUCTIONS (FLAW ANALYSIS - TABLE FORMAT) ---
const FLAW_TABLE = [
  {
    id: 1,
    category: 'Gurudev Mic — Type',
    scenarios: 'ALL scenarios (Small → Very Large)',
    originalSpec: 'Generic "cordless headset" — no capsule type, brand or spec. DPA 4066/4088 (or Countryman E6/Shure TH53) are the professional standard for VIP speech mics: highest gain-before-feedback, minimal profile, superior off-axis rejection. Without specifying DPA-type, volunteers will use any random headset.',
    risk: 'Wrong mic used on-site. Feedback risk. Poor intelligibility for Gurudev. Completely unsuitable sonic character for spiritual programs.',
    severity: 'CRITICAL',
    correction: 'Every scenario: 1× DPA 4066/4088 capsule (or Countryman E6 / Shure TH53 equivalent) on professional wireless bodypack (Sennheiser EW 300/500 G4 or Shure ULXD1). Dedicated Ch 1 labeled "GD MAIN". HPF 100Hz + Gate + Limiter on strip.',
  
  },
  {
    id: 2,
    category: 'Gurudev Mic — NO BACKUP',  
    scenarios: 'ALL scenarios (Small → Very Large)',
    originalSpec: 'ZERO backup mic for Gurudev in any scenario. Single point of failure for the most critical audio source at every event. Battery failure, RF interference, capsule fault — no recovery exists.',
    risk: 'Program stops cold when Gurudev\'s mic fails. No recovery path. Maximum embarrassment at highest-stakes moments. Volunteers have no fallback procedure.',
    severity: 'CRITICAL',
    correction: 'Every scenario: 1× DPA 4066/4088 BACKUP on matched bodypack — Ch 2 "GD BKUP", pre-EQ matched to main, MUTED at mixer. Ready to go live in < 10 seconds. Both channels pre-saved in show file. Operator briefed.',
   
  },
  {
    id: 3,
    category: 'Speaker Count — Auditorium (150–300 pax)',
    scenarios: 'School Auditorium',
    originalSpec: 'ONLY 4× QSC K12.2 for up to 300 people. Professional rule: crowds >200 need minimum 6–8 speakers. An auditorium has depth + tiered seating — 4 speakers cannot cover rear seats adequately without pushing to clip.',
    risk: 'Rear rows receive insufficient SPL. Front rows get harsh sound. Engineer must overdrive speakers, causing distortion + increased feedback risk. SPL variation front-to-back >10 dB.',
    severity: 'HIGH',
    correction: 'Revised to 6× QSC K12.2 (3 per side) for 150–300 auditorium. Alternative: 4 mains + 2 delay fills (+25ms) for venues with deep rake or balcony. Minimum 6-speaker rule enforced whenever crowd >200.',
    
  },
  {
    id: 4,
    category: 'Speaker Count — Outdoor (200–500 pax)',
    scenarios: 'Outdoor Ground (Small)',
    originalSpec: 'ONLY 4× QSC K12.2 for 200–500 people outdoors. Critical flaw: outdoor SPL needs are 6–10 dB higher than indoor (no reflections, ambient noise). 4 speakers cannot serve 500 people in open field without severe distortion.',
    risk: 'Severe SPL deficit at rear. Engineers push to thermal limit. Premature speaker failure. Event experience collapses beyond 200 seats.',
    severity: 'HIGH',
    correction: 'Revised to 6–8× QSC K12.2 (3–4 per side on 3m pole stands) for 200–500 outdoor. Or small line array. Rule: minimum 6–8 speakers whenever crowd exceeds 200 people — for ALL venues.',
   
  },
  {
    id: 5,
    category: 'Singer Monitors — Missing / Shared',
    scenarios: 'Small venues, Medium Hall, Outdoor (Small)',
    originalSpec: 'Small venues: NO monitor for singers at all. Medium Hall: 2× wedges shared between Gurudev + ALL singers — no separation. Singers hearing Gurudev\'s monitor mix causes pitch drift, timing errors, and feedback from mis-aimed monitors.',
    risk: 'Singers cannot hear themselves. Pitch and timing errors. Feedback from incorrectly aimed monitors. Gurudev\'s private monitor mix compromised.',
    severity: 'HIGH',
    correction: 'Dedicated singer monitors on SEPARATE aux send from Gurudev\'s monitor in every scenario. Small: 1× wedge Aux 2. Medium: 1 wedge per singer pair, Aux 2/3. Large: 4–6 wedge mixes + IEM on dedicated monitor console.',
    
  },
  {
    id: 6,
    category: 'Playback — Only 1 Channel (Mono)',
    scenarios: 'ALL scenarios',
    originalSpec: '1× Jack/DI for laptop in every scenario. Stereo playback sources (music, bhajans, backing tracks) have L+R. One DI = mono only — loses stereo field, reduces level 3–6 dB, and critically: any split stems (click left / music right) will be broadcast to congregation.',
    risk: 'Mono playback only. Loss of stereo music content. If backing tracks have click/guide on one channel, it broadcasts through PA to entire congregation.',
    severity: 'MEDIUM',
    correction: 'Every scenario: 2× DI boxes for playback (Radial J48): Stereo L on second-to-last ch "PB-L" and R on last ch "PB-R". Gain matched, phase-checked. 3.5mm TRS Y-split → 2× DI → 2× mixer channels.',
   
  },
  {
    id: 7,
    category: 'Video Audio Input to Mixer',
    scenarios: 'Medium and above',
    originalSpec: 'Zero video input path specified anywhere. When video plays during Dyatra, audio MUST route through the FOH mixer for level control, EQ, and integration. Without this, video audio either bypasses PA or uses a separate uncontrolled path.',
    risk: 'Video audio not under FOH control. Volume spikes between video and live program. Video audio bypasses room EQ and dynamics. Inconsistent experience.',
    severity: 'MEDIUM',
    correction: 'Medium and above: 2 dedicated stereo channels for video audio input (VID-L + VID-R). 2× DI from video laptop/server. Labeled "VIDEO IN". Separate gain from music playback. Routed to mains; pre-checked before program.',
    
  },
  {
    id: 8,
    category: 'No Recording Output / Video Team Feed',
    scenarios: 'Medium and above',
    originalSpec: 'No recording output or video team audio feed in any scenario. Video team taps speaker outputs ad hoc — causing hum, distortion, and wrong levels. No professional archive exists for any Dyatra program.',
    risk: 'No professional audio archive. Video recordings have camera-mic audio. Cannot distribute online. Video team ad hoc workarounds introduce noise and hum.',
    severity: 'MEDIUM',
    correction: 'Medium+: Dedicated Aux/Matrix "REC OUT" → XLR → Zoom F6/F8n or camera. Small: USB record from digital mixer. Very large: full DANTE multitrack. Every scenario now has a defined recording path.',
   
  },
  {
    id: 9,
    category: 'RF Coordination Plan Missing',
    scenarios: 'Medium and above',
    originalSpec: 'No frequency coordination plan or methodology specified. 4+ wireless channels without coordination create intermodulation (IMD) products causing dropouts, squelch triggers, and cross-channel interference in UHF band.',
    risk: 'Wireless mic dropouts during Gurudev\'s talk — worst possible failure moment. Sennheiser + Shure channels at same event create IMD interference if not scanned.',
    severity: 'HIGH',
    correction: 'Pre-Event Checklist: mandatory RF coordination using Shure Wireless Workbench or Sennheiser WSM. Gurudev main + backup get top-priority, protected frequencies. Antenna distribution added for medium+ events. Frequency plan saved to show file.',
   
  },
  {
    id: 10,
    category: 'Gurudev Monitor — Large Hall IEM Optional',
    scenarios: 'Large Convention Hall (300–700 pax)',
    originalSpec: 'Original spec: "IEM optional" for Gurudev in large hall. Technically INCORRECT. IEM is the professional standard at this scale — a stage wedge creates serious feedback risk, stage bleed into DPA mic, and unacceptable SPL at mic capsule position.',
    risk: 'Stage bleed from wedge into DPA mic → feedback at large hall volumes. Gurudev cannot hear himself. Engineer overdrive wedge → feedback loops.',
    severity: 'HIGH',
    correction: 'Large venues (300+ pax): IEM is PRIMARY (Sennheiser EW IEM G4 or Shure PSM300, stereo in-ear). 1× 15" wedge retained as BACKUP only. "Optional" removed — IEM is mandatory at this scale.',
    
  },
  {
    id: 11,
    category: 'No Channel Labeling or Allocation Standard',
    scenarios: 'ALL scenarios',
    originalSpec: 'No channel allocation or labeling standard specified. Every event, volunteers patch inputs differently. Makes it impossible to save/recall digital mixer show files, hand over to another operator, or maintain consistent Gurudev mic routing.',
    risk: 'Inconsistent setup event-to-event. Cannot use show file recall. Gurudev backup mic may not be pre-assigned. Operator confusion at handover.',
    severity: 'MEDIUM',
    correction: 'New Channel Allocation Template sheet: Gurudev Main = Ch 1 always; Backup = Ch 2 always. Singers from Ch 3. Playback = last 2 ch (PB-L/PB-R). Video In = second-to-last pair. Consistent across all event sizes.',
  
  },
  {
    id: 12,
    category: 'No Recording System Specified',
    scenarios: 'ALL scenarios',
    originalSpec: 'No dedicated audio recording output, device, or method in any scenario. Recording done ad hoc or not at all — no professional archive of Dyatra programs.',
    risk: 'No audio archive. Cannot produce content for online distribution. Historically significant programs unrecorded or at poor quality.',
    severity: 'LOW-MED',
    correction: 'Small: USB record on mixer / Zoom H6 on aux. Medium: Zoom F6 on matrix. Large: multitrack USB/DANTE. Very large: full DANTE stem recording. Device and output labeled and patched before soundcheck in every scenario.',
    
  }
];

// --- 2. EQUIPMENT REFERENCE DATA (Catalog) ---
const EQUIPMENT_CATALOG = {
  'GURUDEV MICS (DPA-TYPE) — MAIN & BACKUP': [
    {
      category: 'GURUDEV MICS',
      name: 'DPA-Type Headset Mic (Main + Backup for Gurudev)',
      models: `DPA 4066 Omni Headset
DPA 4088 Cardioid Headset
Countryman E6 (cardioid)
Shure TH53 (subminiature)`,
      specs: `4066: Omni — forgiving on head movement, warm
4088: Cardioid — better feedback rejection
E6: flexible boom, very discreet
TH53: Shure ecosystem`,
      use: `ALWAYS use DPA-type for Gurudev.
Two units required: Main (Ch 1 "GD MAIN")
+ Backup (Ch 2 "GD BKUP", MUTED).
Match capsule model on both for consistent sound if switched.
HPF 100Hz. Limiter on both channels.`,
      notes: `★ NEW — was missing in original template.
Gurudev must ALWAYS have DPA-type main + backup.
Never use standard headset.`
    },
    {
      category: 'GURUDEV MICS',
      name: 'Wireless Bodypack for Gurudev (MATCHED pair — main + backup)',
      models: `Sennheiser EW 300 G4
Sennheiser EW 500 G4
Shure ULXD1
Shure Axient ADX1 (flagship)`,
      specs: `EW300/EW500 G4: Professional grade, diverse receivers, frequency agile
ULXD1: Shure ecosystem, works with ULXD4 receiver
Axient ADX1: auto-switch, best for VIP critical use`,
      use: `Always buy matching pairs for Gurudev: same model, same frequency band.
Frequency-coordinate BEFORE event.
Gurudev's channels get priority slots.
Axient recommended for 500+ events (auto RF switch on dropout).`,
      notes: `★ NEW spec — backup bodypack not in original.`
    }
  ],
  'MIXERS': [
    {
      category: 'MIXERS',
      name: 'Small Mixer (≤80 pax)',
      models: `Yamaha MG10XU
Soundcraft Efx8
Allen & Heath ZED-12FX`,
      specs: `8–12 ch | Built-in FX
USB stereo record
Analog — no recall`,
      use: `Gain stage conservative.
HPF ~100Hz on all vocal ch.
Label faders with P-Touch.
Save a setup photo after each event for consistency.`,
      notes: ''
    },
    {
      category: 'MIXERS',
      name: 'Medium Mixer (≤300 pax)',
      models: `Yamaha TF1 / TF3
Behringer X32 Compact
Allen & Heath SQ-5
Soundcraft Ui16`,
      specs: `16–32 ch digital
Show file recall
USB multitrack (X32)
Remote app control`,
      use: `Save show file per venue.
Assign DCAs for quick control.
Label channels in show file.
Gurudev = Ch 1 always.
Playback = last 2 channels.
USB record for archive.`,
      notes: ''
    },
    {
      category: 'MIXERS',
      name: 'Large Mixer (300+ pax)',
      models: `Yamaha CL3 / CL5
DiGiCo SD9 / SD7
Avid S6L
Allen & Heath dLive`,
      specs: `32–64 ch | Dante I/O
Redundant I/O
Separate monitor desk`,
      use: `Dual SD-card backup.
Pre-assign all DCAs.
Dante for multitrack record.
Separate monitor console mandatory for 300+ events.
Full tech rehearsal day before.`,
      notes: ''
    }
  ],
  'SPEAKERS — TOPS': [
    {
      category: 'SPEAKERS',
      name: 'Small Active Top (≤80 pax)',
      models: `QSC K8.2
QSC CP8
Electro-Voice ZLX-8P`,
      specs: `8″ | 2000W peak
127dB SPL
Class-D amp built-in`,
      use: `Rooms ≤80 pax. Pole-mount above sub if added.
Angle at 30–40° inward toward congregation.`,
      notes: ''
    },
    {
      category: 'SPEAKERS',
      name: 'Medium Active Top (80–200 pax) [MIN 4 speakers for 200 pax]',
      models: `QSC K10.2 / K12.2
QSC CP10 / CP12
Electro-Voice ZLX-12P
Yamaha DXR12mkII`,
      specs: `10–12″ | 2000W peak
128–132dB SPL`,
      use: `Main workhorse for halls and banquets.
Need MINIMUM 4 speakers (2 per side) for 80–200 pax.
At 200 pax consider 6 with 2 delay fills at mid-hall.`,
      notes: `Rule: Min 4 speakers 80–200 pax.
Rule: Min 6–8 speakers >200 pax.`
    },
    {
      category: 'SPEAKERS',
      name: 'Large Top / Line Array (200–700 pax) [MIN 6–8 per side for 300+]',
      models: `QSC K12.2 (×6–8)
QSC KW153
L-Acoustics ARCS II
d&b Y-Series`,
      specs: `12–15″ or 3-way array
133–136dB SPL
Fly or ground-stack`,
      use: `★ MINIMUM 6–8 speakers whenever crowd >200 people.
DSP preset for site EQ.
Fly or ground-stack per rider.
Delay tops for halls >15m deep.`,
      notes: `★ NEW rule from flaw audit: original template had 4 speakers for 300–500 pax.
CORRECTED to 6–8 minimum.`
    }
  ],
  'SUBWOOFERS': [
    {
      category: 'SUBWOOFERS',
      name: 'Compact Sub (small venues)',
      models: `QSC KS112
Yamaha DXS12mkII
Electro-Voice ETX-12P`,
      specs: `12″ active sub
131dB SPL`,
      use: `Single sub centred under/between L+R for small venues.
X-over at 100Hz.`,
      notes: ''
    },
    {
      category: 'SUBWOOFERS',
      name: 'Full Sub (medium–large venues)',
      models: `QSC KS118
Electro-Voice ETX-18SP
Yamaha DXS18mkII`,
      specs: `18″ active sub
137dB SPL`,
      use: `Cardioid pair for medium+: 1 forward + 1 reversed, polarity flip on reverse unit.
Reduces sub energy on stage.
X-over: 80–100Hz.`,
      notes: ''
    }
  ],
  'WIRELESS SYSTEMS': [
    {
      category: 'WIRELESS SYSTEMS',
      name: 'Entry Wireless (small venues)',
      models: `Shure BLX24 / SM58
Sennheiser XSW 1-825
Audio-Technica ATW-1102`,
      specs: `Single channel
Fixed frequency
Fixed diversity`,
      use: `Good for small venues.
Scan frequency before event.
NOT recommended for Gurudev — use EW300 G4 or ULXD1.`,
      notes: ''
    },
    {
      category: 'WIRELESS SYSTEMS',
      name: 'Professional Wireless (medium–large)',
      models: `Shure QLXD / ULXD
Sennheiser EW 300 G4
Sennheiser EW 500 G4
Audio-Technica 3000 Series`,
      specs: `Multi-channel | Diversity
Frequency agile
Rechargeable option`,
      use: `Coordinate ALL channels in Wireless Workbench or Sennheiser WSM before event.
Gurudev channels: top-priority protected frequencies.
2× spare AA batteries.`,
      notes: ''
    },
    {
      category: 'WIRELESS SYSTEMS',
      name: 'Premium Wireless / VIP (large–very large)',
      models: `Shure Axient Digital
Sennheiser Digital 6000
Sennheiser Digital 9000`,
      specs: `1.8GHz / 2.4GHz
Auto RF switch
Encrypted audio`,
      use: `Axient: auto-detects RF dropout and switches to backup frequency silently.
Ideal for Gurudev at large events — zero-dropout.
Sennheiser D6000: pristine audio quality.`,
      notes: `★ Recommended for Gurudev at 500+ pax events for auto-switch protection.`
    }
  ],
  'MONITORS & IEM': [
    {
      category: 'MONITORS & IEM',
      name: 'Stage Wedge (Passive/Active)',
      models: `Yamaha CM12V (passive)
RCF Monitor 12-A (active)
d&b M2 (professional)
QSC K12.2 on angle bracket`,
      specs: `12–15″ passive or active
Wedge profile
1× or 2× HF horn`,
      use: `Place at 45° tilt facing performer at ear level.
Run DEDICATED aux mix per wedge — never share Gurudev's mix with singers.
Ring out individually.`,
      notes: `★ Each performer group gets their OWN aux send.
Gurudev: Aux 1 always.
Singers: Aux 2+ always.
NEVER shared.`
    },
    {
      category: 'MONITORS & IEM',
      name: 'In-Ear Monitor (IEM) [MANDATORY for Gurudev at 300+ pax events]',
      models: `Sennheiser EW IEM G4
Shure PSM300
Shure PSM1000
Sennheiser 2000 IEM`,
      specs: `Stereo belt-pack IEM
Frequency agile
1.8GHz option (PSM1000)`,
      use: `★ IEM MANDATORY for Gurudev at 300+ pax or loud stage env.
Stereo mix preferred.
ALWAYS have wedge backup.
Coordinate IEM frequencies with mic wireless channels.`,
      notes: `★ NEW — original said "optional". INCORRECT.
IEM is mandatory at large-event SPL levels.`
    }
  ],
  'VIDEO I/O — NEW': [
    {
      category: 'VIDEO I/O — NEW',
      name: 'Video Audio Input to Mixer [Medium+ events] [⚠ MISSING in original]',
      models: `2× Radial J48 Active DI
Radial ProD2 Stereo DI
Connected: video laptop or video server`,
      specs: `2ch stereo (VID-L + VID-R)
Balanced XLR to mixer`,
      use: `ALWAYS route video audio through main FOH mixer.
Ch labeled "VID-L" / "VID-R".
Separate gain from playback.
Route to mains only (not monitors unless needed).
Level check vs. live vocal.`,
      notes: `★ NEW — completely missing from original template.
Every medium+ event needs video audio through mixer.`
    },
    {
      category: 'VIDEO I/O — NEW',
      name: 'Recording / Video Team Feed [Medium+ events] [⚠ MISSING in original]',
      models: `Zoom F6 / F8n (portable)
Tascam DR-680 MKII
Sound Devices MixPre-6 II
X32 USB multitrack (built-in)`,
      specs: `Stereo or multitrack
XLR balanced input
From mixer Matrix/Aux out`,
      use: `Label output: "REC OUT".
Matrix or Aux send to recorder.
Never tap speaker terminals.
Test level before soundcheck.
Small: USB record on mixer.
Medium: Zoom F6 on Aux.
Large: multitrack DANTE.`,
      notes: `★ NEW — missing from original template.
Every event must have a defined recording path.`
    }
  ],
  'PLAYBACK DEVICES — 2-CHANNEL STEREO': [
    {
      category: 'PLAYBACK DEVICES — 2-CHANNEL STEREO',
      name: 'Playback DI Boxes [ALWAYS use 2 DI boxes — stereo L + R] [⚠ Original spec was 1ch]',
      models: `Radial J48 (active, phantom)
Radial ProDI (passive)
BSS AR-133 (active)
Rupert Neve RNDI`,
      specs: `Active DI, Jensen xfmr
XLR balanced output
Ground lift switch`,
      use: `ALWAYS 2× DI for playback:
  Ch (n-1): "PB-L"
  Ch (n): "PB-R"
3.5mm TRS Y-split from laptop → 2× DI → 2× mixer channels.
Gain match L+R.
Phase check between channels.
Never use 1× DI for stereo.`,
      notes: `★ FLAW FIXED — original had only 1 Jack/DI for laptop.
1 channel loses stereo, loses 3–6 dB,
and broadcasts click tracks.`
    }
  ],
  'ACCESSORIES & ESSENTIALS': [
    {
      category: 'ACCESSORIES & ESSENTIALS',
      name: 'DI Box',
      models: `Radial J48
BSS AR-133
Countryman Type 85`,
      specs: `Active DI
Jensen transformer
48V phantom powered`,
      use: `Use active DI for keyboard, laptop, guitar.
Ground lift if hum occurs.
Use 2× for stereo playback ALWAYS.`,
      notes: ''
    },
    {
      category: 'ACCESSORIES & ESSENTIALS',
      name: 'Cables — XLR',
      models: `Klotz MY206 bulk cable
Neutrik-terminated
3-pin balanced mic cable`,
      specs: `Balanced | 3-pin
10m, 15m, 20m, 30m lengths stocked`,
      use: `Label BOTH ends with P-Touch before event.
Loop & Velcro when storing.
Color-code by function (Gurudev mics in different colour from rest).`,
      notes: ''
    },
    {
      category: 'ACCESSORIES & ESSENTIALS',
      name: 'Power Conditioning',
      models: `Furman M-8Dx
Tripp Lite LC2400
Furman PL-8C`,
      specs: `8-outlet
Surge + EMI filter
15–20A`,
      use: `One per rack.
Never daisy-chain power strips.
Dedicated circuit for PA.
Separate circuit for lighting.`,
      notes: ''
    },
    {
      category: 'ACCESSORIES & ESSENTIALS',
      name: 'Gaffer Tape & Accessories',
      models: `Pro Gaff 2″ Black
P-Touch label printer
Velcro cable ties
Self-amalgam tape (outdoor)`,
      specs: `Professional cloth tape`,
      use: `Gaffer for cable floor runs, stage marks, temp fixes.
Never duct tape on AV gear.
Self-amalgam tape for ALL outdoor connector joints.`,
      notes: ''
    }
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
  {
    section: 'DAY BEFORE EVENT',
    tasks: [
      { task: 'Confirm venue dimensions, ceiling height, power supply (circuits, amperage) and layout', lead: 'Lead / Incharge' },
      { task: 'Select Audio Setup Template from Sheet 2 matching venue size and crowd', lead: 'Lead' },
      { task: 'Confirm DPA-type mic capsules (DPA 4066/4088 or equiv) are available — 2 units for Gurudev (MAIN + BACKUP)', lead: 'RF Sevak / Lead', isNew: true },
      { task: 'Confirm matched wireless bodypack transmitters for Gurudev MAIN + BACKUP (same brand, same model)', lead: 'RF Sevak', isNew: true },
      { task: 'Check all equipment against packing list. Count DI boxes — need 2x for playback + extras for instruments', lead: 'Gear Sevak' },
      { task: 'RF Coordinate ALL wireless channels using Wireless Workbench (Shure) or Sennheiser WSM software', lead: 'RF Sevak', isNew: true },
      { task: 'Charge all wireless batteries / transmitters. Fit fresh batteries immediately before event', lead: 'RF Sevak' },
      { task: 'Label ALL cables (both ends with P-Touch) before packing', lead: 'Cable Sevak' },
      { task: 'Confirm video playback source and audio output type. Prepare 2x DI boxes for video IN to mixer', lead: 'Video Sevak / Lead', isNew: true },
      { task: 'Confirm recording device (Zoom F6 / USB record) is available and functioning. Prepare output from mixer', lead: 'FOH Sevak', isNew: true },
      { task: 'Pack spare consumables: batteries (x12 minimum), gaffer tape, DI boxes, gaffer tape, wind screens', lead: 'Gear Sevak' }
    ]
  },
  {
    section: 'SETUP DAY — ARRIVAL (3-4 hours before program)',
    tasks: [
      { task: 'Walk venue and confirm speaker placement per template. Count required speakers — minimum 6–8 if crowd >200', lead: 'Lead / PA Sevak' },
      { task: 'Run multicore snake / cable paths before placing gear. Tape all floor runs with gaffer tape', lead: 'Cable Sevak' },
      { task: 'Position and secure speaker stands with safety cables. Verify speaker count vs crowd (min 6-8 for >200 pax)', lead: 'PA Sevak' },
      { task: 'Connect and power up PA in correct order: 1. Mixer -> 2. Amps/Processors -> 3. Speakers', lead: 'PA Sevak' },
      { task: 'Mount DPA 4066/4088 capsule on Gurudev MAIN bodypack. Mount BACKUP capsule', lead: 'RF Sevak / FOH Sevak', isNew: true },
      { task: 'Set up Gurudev BACKUP mic channel — EQ snapshot from main, same processing,', lead: 'FOH Sevak', isNew: true },
      { task: 'Set monitor positions: Gurudev monitor at 45° aimed at ear level. Singer monitors at', lead: 'Monitor Sevak' },
      { task: 'Connect stereo playback: 3.5mm TRS Y-split from laptop -> 2x DI -> Ch (n-1) PB-L', lead: 'FOH Sevak', isNew: true },
      { task: 'Connect video audio IN: stereo from video source -> 2x DI -> Ch VID-L and VID-R.', lead: 'Video Sevak / FOH', isNew: true },
      { task: 'Set up recording output: connect Aux/Matrix to recording device. Test and confirm', lead: 'FOH Sevak', isNew: true },
      { task: 'Patch ALL inputs and confirm signal flow on each channel (signal check: gain structure,', lead: 'FOH Sevak' },
      { task: 'Insert EQ, gate, compression, and limiter on all vocal channels. Set HPF at 100Hz on all', lead: 'FOH Sevak' },
      { task: 'Check all wireless: scan, confirm frequency plan, power on, belt-pack test. Verify both', lead: 'RF Sevak' }
    ]
  },
  {
    section: 'SOUNDCHECK',
    tasks: [
      { task: 'Soundcheck each mic and instrument one at a time. Start with Gurudev MAIN (Ch 1)', lead: 'FOH Sevak' },
      { task: 'Soundcheck Gurudev BACKUP (Ch 2) — confirm matching level and EQ vs Main.', lead: 'FOH Sevak / RF Sevak', isNew: true },
      { task: 'Build monitor mixes with each performer. Gurudev on Aux 1. Singers on Aux 2 (and', lead: 'Monitor Sevak / FOH' },
      { task: 'Ring out monitors and PA for feedback frequencies using 1/3 octave GEQ or parametric', lead: 'FOH Sevak' },
      { task: 'Test stereo playback (Ch PB-L + PB-R): play test track. Verify stereo image, level, no', lead: 'FOH Sevak', isNew: true },
      { task: 'Test video audio (Ch VID-L + VID-R): play video clip. Confirm audio level vs. live', lead: 'Video Sevak / FOH', isNew: true },
      { task: 'Test recording output: arm recorder, play test audio, verify recording is capturing', lead: 'FOH Sevak', isNew: true },
      { task: 'Set overall PA level appropriate for venue size. Walk the room and check back/side', lead: 'FOH Sevak' },
      { task: 'Save show file with event name and date (digital mixers)', lead: 'FOH Sevak' },
      { task: 'Confirm Gurudev monitor level and EQ with a sevak standing in Gurudev\'s position on', lead: 'Lead / Monitor Sevak' }
    ]
  },
  {
    section: 'DURING PROGRAM',
    tasks: [
      { task: 'Mute all unused channels. Only active channels unmuted during program', lead: 'FOH Sevak' },
      { task: 'Assign dedicated sevak to monitor RF status of both Gurudev mic channels', lead: 'RF Sevak', isNew: true },
      { task: 'Keep spare handheld mics charged and ready in wings for singers', lead: 'RF Sevak' },
      { task: 'Confirm recording is running — visually check recorder display every 30 minutes', lead: 'FOH Sevak / Video', isNew: true },
      { task: 'Maintain clear FOH position — no obstructions. Never leave FOH position unattended', lead: 'FOH Sevak' },
      { task: 'If video is played during program: FOH operator fades video audio IN smoothly,', lead: 'FOH Sevak / Video', isNew: true }
    ]
  },
  {
    section: 'TEARDOWN',
    tasks: [
      { task: 'Stop and save all recordings. Export/copy to archive storage (USB drive or cloud)', lead: 'FOH Sevak / Lead', isNew: true },
      { task: 'Power down in correct reverse order: 1. Speakers -> 2. Amps/Processors -> 3. Mixer', lead: 'PA Sevak' },
      { task: 'Remove DPA capsules from Gurudev bodypacks carefully. Store in padded case. Do', lead: 'RF Sevak' },
      { task: 'Coil all cables in loop-and-a-half method. Velcro tie. Never wrap around arm or elbow', lead: 'Cable Sevak' },
      { task: 'Remove gaffer tape from floor immediately while still warm', lead: 'Cable Sevak' },
      { task: 'Pack all gear. Check against packing list item by item', lead: 'Gear Sevak' },
      { task: 'Submit event report to SRMD AV archive: include show file, frequency plan,', lead: 'Lead', isNew: true }
    ]
  }
];

export default function AudioSetupHub({ currentUser, onReportStored, activeTab: externalActiveTab, setActiveTab: externalSetActiveTab }: { currentUser?: any, onReportStored?: () => void, activeTab?: string, setActiveTab?: (tab: string) => void } = {}) {
  const [localActiveTab, setLocalActiveTab] = useState('templates');
  const activeTab = externalActiveTab || localActiveTab;
  const setActiveTab = externalSetActiveTab || setLocalActiveTab;
  const [activeVenue, setActiveVenue] = useState('medium');
  const [inspectGear, setInspectGear] = useState<any>(null);
  const [selectedFlawId, setSelectedFlawId] = useState<number>(FLAW_TABLE[0]?.id ?? 1);
  const selectedFlaw = useMemo(() => FLAW_TABLE.find(f => f.id === selectedFlawId) ?? FLAW_TABLE[0], [selectedFlawId]);
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
                                const gear = EQUIPMENT_CATALOG.MIXERS.find((m: any) => m.models.includes(venue.mixer)) || EQUIPMENT_CATALOG.MIXERS[0];
                                setInspectGear({
                                  ...gear,
                                  use: gear.use || 'Standard event mixer recommendation.'
                                });
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
                                 {category === 'MIXERS' ? <Activity size={20}/> : <Speaker size={20}/>}
                               </div>
                               <h4 className="font-black text-slate-900 uppercase text-xs mb-2 truncate">{item.name}</h4>
                               <p className="text-[11px] text-slate-500 leading-snug whitespace-pre-wrap mb-4">{item.models}</p>
                               <div className="pt-3 border-t border-slate-50">
                                 <p className="text-[10px] text-slate-600 font-semibold leading-relaxed whitespace-pre-wrap">{item.specs}</p>
                               </div>
                             </CardContent>
                           </Card>
                         ))}
                       </div>
                    </div>
                  ))}
                </div>
              )}

              {/* --- TAB: GENERAL INSTRUCTIONS (FLAW ANALYSIS GUIDE) --- */}
              {activeTab === 'instructions' && (
                <Card className="rounded-[40px] border-none shadow-xl ring-1 ring-slate-200 overflow-hidden bg-white">
                   <div className="p-6 border-b border-slate-100 bg-slate-950/95">
                     <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                       <div className="flex items-center gap-3">
                         <AlertTriangle className="text-red-400" size={24}/>
                         <div>
                           <h2 className="text-xl font-black text-white uppercase tracking-tight">Flaw Analysis Guide</h2>
                         </div>
                       </div>
                     </div>
                   </div>
                   <div className="p-4 sm:p-6">
                     <div className="grid grid-cols-1 xl:grid-cols-[1fr_1.5fr] gap-5">
                       <div className="space-y-3">
                         {FLAW_TABLE.map(f => (
                           <button
                             key={f.id}
                             onClick={() => setSelectedFlawId(f.id)}
                             className={`w-full text-left rounded-[28px] border p-4 transition-all group ${selectedFlawId === f.id ? 'border-blue-600 bg-blue-600 text-white shadow-[0_20px_80px_-35px_rgba(37,99,235,0.45)]' : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'}`}>
                             <div className="flex items-center justify-between gap-3">
                               <div className="min-w-0 flex items-center gap-3">
                                 <span className={`h-10 w-1 rounded-full ${selectedFlawId === f.id ? 'bg-white' : 'bg-slate-200'}`}></span>
                                 <div>
                                   <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${selectedFlawId === f.id ? 'text-white/80' : 'text-slate-400'}`}>{f.category}</p>
                                   <p className={`mt-1 text-sm font-black leading-snug truncate ${selectedFlawId === f.id ? 'text-white' : 'text-slate-700'}`}>{f.scenarios}</p>
                                 </div>
                               </div>
                               <div className="flex items-center gap-2">
                                 <span className={`inline-flex shrink-0 items-center rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] ${f.severity === 'CRITICAL' ? (selectedFlawId === f.id ? 'bg-red-700 text-white' : 'bg-red-600/10 text-red-700') : f.severity === 'HIGH' ? (selectedFlawId === f.id ? 'bg-orange-600 text-white' : 'bg-orange-100 text-orange-700') : (selectedFlawId === f.id ? 'bg-amber-600 text-white' : 'bg-amber-100 text-amber-700')}`}>{f.severity}</span>
                                 <ChevronRight className={`${selectedFlawId === f.id ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'} h-4 w-4`} />
                               </div>
                             </div>
                           </button>
                         ))}
                       </div>
                       <div className="rounded-[32px] overflow-hidden bg-slate-950 text-white ring-1 ring-slate-200 shadow-xl">
                         <div className="p-6 bg-slate-900/95 border-b border-slate-800">
                           <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                             <div className="min-w-0">
                               <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Flaw Blueprint</p>
                               <h3 className="mt-2 text-3xl font-black text-white leading-tight tracking-tight">{selectedFlaw.category}</h3>
                               <p className="mt-2 text-sm font-bold uppercase tracking-[0.3em] text-slate-400">{selectedFlaw.scenarios}</p>
                             </div>
                             <span className={`inline-flex items-center rounded-full px-4 py-1 text-[10px] font-black uppercase tracking-[0.2em] ${selectedFlaw.severity === 'CRITICAL' ? 'bg-red-700 text-white border border-red-600/30' : selectedFlaw.severity === 'HIGH' ? 'bg-orange-600 text-white border border-orange-500/20' : 'bg-amber-600 text-white border border-amber-500/20'}`}>{selectedFlaw.severity}</span>
                           </div>
                         </div>
                         <div className="p-6 space-y-4 bg-slate-950">
                           <div className="rounded-[28px] bg-slate-900/95 p-5 border border-slate-700 shadow-sm">
                             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-200 mb-2">Original Spec — What Was Wrong</p>
                             <p className="text-sm text-slate-100 leading-6 whitespace-pre-wrap">{selectedFlaw.originalSpec}</p>
                           </div>
                           <div className="rounded-[28px] bg-slate-900/95 p-5 border border-red-600/20 shadow-sm">
                             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-red-200 mb-2">Risk / Impact if Left Unfixed</p>
                             <p className="text-sm text-slate-100 leading-6 whitespace-pre-wrap">{selectedFlaw.risk}</p>
                           </div>
                           <div className="rounded-[28px] bg-slate-900/95 p-5 border border-emerald-600/20 shadow-sm">
                             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-200 mb-2">Correction Applied in Revised Sheet</p>
                             <p className="text-sm text-slate-100 leading-6 whitespace-pre-wrap">{selectedFlaw.correction}</p>
                           </div>
                         </div>
                       </div>
                     </div>
                   </div>
                </Card>
              )}

              {/* --- TAB: PRE-EVENT AUDIT CHECKLIST --- */}
              {activeTab === 'audit' && (
                <div className="space-y-4 sm:space-y-6">
                  {AUDIT_STEPS.map(section => (
                    <div key={section.section} className="pt-2">
                       <h3 className="text-[11px] font-black text-brand-primary uppercase tracking-[0.4em] mb-6 flex items-center gap-4">
                         <div className="h-px flex-1 bg-slate-200"/>
                         {section.section}
                         <div className="h-px flex-1 bg-slate-200"/>
                       </h3>
                       <Card className="rounded-2xl sm:rounded-3xl border-none shadow-md ring-1 ring-slate-200 bg-white overflow-hidden">
                          <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-x-4 sm:gap-x-6 gap-y-3 sm:gap-y-4">
                          {section.tasks.map((taskObj, idx) => (
                            <div key={idx} className={`p-3 sm:p-4 rounded-2xl border ${taskObj.isNew ? 'border-green-200 bg-green-50/30 hover:border-green-300' : 'border-slate-100 bg-slate-50/20 hover:border-slate-200'} flex items-start gap-3 sm:gap-4 group transition-all`}>
                               <input 
                                 type="checkbox" 
                                 checked={!!checkedTasks[taskObj.task]}
                                 onChange={() => setCheckedTasks(prev => ({ ...prev, [taskObj.task]: !prev[taskObj.task] }))}
                                 className="h-5 w-5 sm:h-6 sm:w-6 mt-0.5 rounded-lg sm:rounded-xl border-slate-300 text-brand-primary focus:ring-brand-primary cursor-pointer transition-all shrink-0"
                               />
                               <div className="min-w-0 flex-1">
                                  <div className="flex items-start justify-between gap-2 mb-1.5">
                                     <p className="text-[12px] sm:text-[13px] font-black text-slate-900 group-hover:text-brand-primary transition-colors leading-snug">{taskObj.task}</p>
                                     {taskObj.isNew && <span className="px-2 py-0.5 rounded-full bg-green-600 text-white text-[9px] font-black uppercase tracking-widest shrink-0 mt-0.5 flex items-center gap-1"><Zap size={10} className="fill-white"/> NEW</span>}
                                  </div>
                                  <div className="flex items-center gap-2">
                                     <Badge variant="outline" className="text-[9px] font-bold text-slate-500 uppercase tracking-widest border-slate-200 bg-white"><User size={10} className="mr-1 opacity-50"/> {taskObj.lead}</Badge>
                                  </div>
                               </div>
                            </div>
                          ))}
                       </div>
                    </Card>
                  </div>
                  ))}
                  <div className="mt-8 relative overflow-hidden rounded-[32px] sm:rounded-[40px] bg-slate-900 p-8 sm:p-12 text-center shadow-2xl">
                     <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none rotate-12"><ShieldAlert size={200} /></div>
                     <div className="relative z-10 space-y-6">
                       <div className="mx-auto h-16 w-16 bg-brand-primary/20 rounded-2xl flex items-center justify-center mb-6">
                         <ShieldAlert className="text-brand-primary h-8 w-8"/>
                       </div>
                       <div>
                         <h4 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">Finalize Audit Report</h4>
                         <p className="text-[11px] sm:text-[12px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">Sign off and log completed verification tasks.</p>
                       </div>
                       <button 
                         onClick={submitAuditReport}
                         disabled={isSubmitted || isSubmitting}
                         className={`group relative inline-flex items-center justify-center gap-3 px-10 sm:px-14 py-4 sm:py-5 overflow-hidden rounded-2xl text-[11px] sm:text-xs font-black uppercase tracking-widest text-white shadow-xl transition-all w-full sm:w-auto ${isSubmitted ? 'bg-green-500 shadow-green-500/20' : isSubmitting ? 'bg-slate-700 text-slate-400 cursor-not-allowed' : 'bg-brand-primary shadow-brand-primary/30 hover:shadow-brand-primary/50 hover:-translate-y-1 active:scale-95'}`}
                       >
                         {isSubmitting ? (
                           'Saving to Database...'
                         ) : isSubmitted ? (
                           <><CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5"/> Report Stored</>
                         ) : (
                           <>Finalize & Submit <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform"/></>
                         )}
                       </button>
                     </div>
                  </div>
                </div>
              )}
              
              {/* --- TAB: AUDIT LOG --- */}
              {activeTab === 'log' && (
                <div className="space-y-4 sm:space-y-6">
                  <div className="flex items-center justify-between px-2">
                    <h2 className="text-lg sm:text-xl font-black text-slate-900 uppercase">Audit Reports Log</h2>
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

  {/* --- GEAR INSPECTOR MODAL (DATASHEET VIEW) --- */}
<AnimatePresence>
  {inspectGear && (
    <div className="fixed inset-0 z-[500] flex items-start sm:items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop with heavy blur */}
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        onClick={() => setInspectGear(null)} 
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-md" 
      />
      
      {/* The Datasheet Card */}
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }} 
        animate={{ scale: 1, opacity: 1, y: 0 }} 
        exit={{ scale: 0.9, opacity: 0, y: 20 }} 
        className="relative w-full max-w-3xl bg-white rounded-[40px] overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] flex flex-col max-h-[90vh]"
      >
        {/* RIGHT PANEL: Content & Specs */}
        <div className="flex-1 flex flex-col min-w-0 bg-white overflow-hidden">
          {/* Header */}
          <div className="p-6 xl:p-8 pb-4 flex justify-between items-start gap-4">
            <div className="min-w-0">
              <h3 className="text-2xl md:text-3xl font-black text-slate-900 leading-[1.1] tracking-tight uppercase italic mb-2">
                {inspectGear.name}
              </h3>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Standard Deployment Unit</p>
              </div>
            </div>
            <button onClick={() => setInspectGear(null)} className="h-11 w-11 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center transition-all group shrink-0">
              <X size={20} className="text-slate-400 group-hover:text-slate-900 group-hover:rotate-90 transition-all"/>
            </button>
          </div>

          {/* Scrollable Data Area */}
          <ScrollArea className="flex-1 overflow-y-auto px-6 md:px-8 pb-8">
            <div className="space-y-10 py-4 min-h-full">
              
              {/* Field Logic / Deployment Note */}
              <section className="space-y-3">
                <div className="flex items-center gap-3">
                   <Zap size={16} className="text-brand-primary" />
                   <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em]">Deployment Advisory</h4>
                </div>
                <div className="p-6 rounded-[24px] bg-slate-100 border border-slate-200 shadow-sm">
                  <p className="text-[13px] font-bold text-slate-700 leading-relaxed italic">
                    "{inspectGear.use || 'Ensure proper gain staging and signal-to-noise ratio check before going live.'}"
                  </p>
                </div>
              </section>

              {/* Specifications Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                
                {/* Tech Specs List */}
                <section className="space-y-4">
                  <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Engineering Specs</h4>
                  <div className="space-y-3">
                    {String(inspectGear.specs).split('\n').filter((t: string) => t.trim()).map((spec: string, i: number) => (
                      <div key={i} className="flex items-start gap-3">
                        <CheckCircle2 size={14} className="mt-0.5 text-brand-primary shrink-0" />
                        <span className="text-[12px] font-bold text-slate-700 leading-snug">{spec.trim()}</span>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Recommended Models */}
                <section className="space-y-4">
                  <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Industry Standards</h4>
                  <div className="flex flex-wrap gap-2">
                    {String(inspectGear.models).split('\n').filter((t: string) => t.trim()).map((model: string, i: number) => (
                      <span key={i} className="px-3 py-1.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-tight shadow-sm">
                        {model.trim()}
                      </span>
                    ))}
                  </div>
                </section>

              </div>

              {/* Critical Flaws Fixed Badge */}
              {inspectGear.notes && (
                <div className="w-full rounded-[32px] p-5 bg-slate-50 border border-slate-200 shadow-sm grid grid-cols-[auto_1fr] gap-4 border-l-4 border-amber-500">
                   <div className="h-12 w-12 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center shrink-0">
                     <ShieldAlert size={22} />
                   </div>
                   <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <p className="text-[11px] font-black uppercase tracking-[0.25em] text-amber-900">Configuration Warning</p>
                        <span className="inline-flex items-center rounded-full bg-amber-900/10 text-amber-900 px-3 py-1 text-[10px] font-black uppercase tracking-[0.15em]">Important</span>
                      </div>
                      <p className="text-sm font-bold text-slate-900 leading-relaxed whitespace-pre-wrap break-words">
                        {inspectGear.notes}
                      </p>
                   </div>
                </div>
              )}
            </div>
          </ScrollArea>
          
          {/* Action Footer */}
          <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-4">
             <div className="flex items-center gap-4 text-slate-400">
                <div className="flex -space-x-2">
                   {[1,2,3].map(i => <div key={i} className="h-6 w-6 rounded-full border-2 border-white bg-slate-200" />)}
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest">Verified by Audio Lead</span>
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
                  <X size={14} className="text-slate-600"/>
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