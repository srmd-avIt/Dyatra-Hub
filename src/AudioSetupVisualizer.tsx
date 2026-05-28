import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, MapPin, Calculator, Radio, Speaker, 
  HelpCircle, ShieldCheck, FileSpreadsheet, ArrowRight,
  Info, Sparkles, Volume2, Cable, Disc, AlertTriangle,
  Database, Sliders, Mic2, Activity, X, Zap, HardDrive, Wifi,
  CheckCircle2, Search, Filter, ShieldAlert, Sheet, RotateCcw, CheckSquare, ClipboardList,
  LayoutTemplate, Hourglass, Settings, ExternalLink, Calendar, ClipboardCheck, AlertOctagon,Share2 
} from 'lucide-react';

// ============================================================================
// 1. SHARED TYPES
// ============================================================================
type SeverityType = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW-MED';

interface Flaw {
  id: number;
  severity: SeverityType;
  category: string;
  scenariosAffected: string;
  wrong: string;
  riskImpact: string;
  correction: string;
  ref: string;
}

interface Equipment {
  category: string;
  specs: string;
  tip: string;
  img: string;
}

interface PatchChannel {
  ch: number;
  label: string;
  gear: string;
  processing: string;
  description: string;
}

interface VenueTemplate {
  id: string;
  title: string;
  pax: string;
  venue: string;
  mixer: string;
  mics: string;
  pa: string;
  monitors: string;
  cable: string;
  rec: string;
  patch: PatchChannel[];
}

interface AuditTask {
  id: string;
  text: string;
  subtext: string;
  completed: boolean;
}

interface AuditCategory {
  section: string;
  description: string;
  tasks: AuditTask[];
}

// ============================================================================
// 2. SHARED DATA (Formerly data.ts)
// ============================================================================
const FLAW_TABLE_DATA: Flaw[] = [
  {
    id: 1,
    severity: 'CRITICAL',
    category: 'Gurudev Mic — Type',
    scenariosAffected: 'ALL scenarios (Small → Very Large)',
    wrong: 'Generic "cordless headset" — no capsule type, brand or spec. DPA 4066/4088 (or Countryman E6/Shure TH53) are the professional standard for VIP speech mics: highest gain-before-feedback, minimal profile, superior off-axis rejection. Without specifying DPA-type, volunteers will use any random headset.',
    riskImpact: 'Wrong mic used on-site. Feedback risk. Poor intelligibility for Gurudev. Completely unsuitable sonic character for spiritual programs.',
    correction: 'Every scenario: 1× DPA 4066/4088 capsule (or Countryman E6 / Shure TH53 equivalent) on professional wireless bodypack (Sennheiser EW 300/500 G4 or Shure ULXD1). Dedicated Ch 1 labeled "GD MAIN". HPF 100Hz + Gate + Limiter on strip.',
    ref: 'Sheet 2, Col E'
  },
  {
    id: 2,
    severity: 'CRITICAL',
    category: 'Gurudev Mic — NO BACKUP',
    scenariosAffected: 'ALL scenarios (Small → Very Large)',
    wrong: 'ZERO backup mic for Gurudev in any scenario. Single point of failure for the most critical audio source at every event. Battery failure, RF interference, capsule fault — no recovery exists.',
    riskImpact: "Program stops cold when Gurudev's mic fails. No recovery path. Maximum embarrassment at highest-stakes moments. Volunteers have no fallback procedure.",
    correction: 'Every scenario: 1× DPA 4066/4088 BACKUP on matched bodypack — Ch 2 "GD BKUP", pre-EQ matched to main, MUTED at mixer. Ready to go live in < 10 seconds. Both channels pre-saved in show file. Operator briefed.',
    ref: 'Sheet 2, Col F'
  },
  {
    id: 3,
    severity: 'HIGH',
    category: 'Speaker Count — Auditorium (150–300 pax)',
    scenariosAffected: 'School Auditorium (150-300 attendees)',
    wrong: 'ONLY 4x QSC K12.2 for up to 300 people. Professional rule: crowds >200 need minimum 6–8 speakers. An auditorium has depth + tiered seating — 4 speakers cannot cover rear seats adequately without pushing to clip.',
    riskImpact: 'Rear rows receive insufficient SPL. Front rows get harsh sound. Engineer must overdrive speakers, causing distortion + increased feedback risk. SPL variation front-to-back >10 dB.',
    correction: 'Revised to 6× QSC K12.2 (3 per side) for 150–300 auditorium. Alternative: 4 mains + 2 delay fills (+25s delay) for venues with deep rake or balcony. Minimum 6-speaker rule enforced whenever crowd >200.',
    ref: 'Sheet 2, Col I'
  },
  {
    id: 4,
    severity: 'HIGH',
    category: 'Speaker Count — Outdoor (200–500 pax)',
    scenariosAffected: 'Outdoor Ground (Small)',
    wrong: 'ONLY 4× QSC K12.2 for 200–500 people outdoors. Critical flaw: outdoor SPL needs are 6–10 dB higher than indoor (no reflections, ambient noise). 4 speakers cannot serve 500 people in open field without severe distortion.',
    riskImpact: 'Severe SPL deficit at rear. Engineers push to thermal limit. Premature speaker failure. Event experience collapses beyond 200 seats.',
    correction: 'Revised to 6–8× QSC K12.2 (3–4 per side on 3m pole stands) for 200–500 outdoor. Or small line array. Rule: minimum 6–8 speakers whenever crowd exceeds 200 people — for ALL venues.',
    ref: 'Sheet 2, Col I'
  },
  {
    id: 5,
    severity: 'HIGH',
    category: 'Singer Monitors — Missing / Shared',
    scenariosAffected: 'Small venues, Medium Hall, Outdoor (Small)',
    wrong: 'Small venues: NO monitor for singers at all. Medium Hall: 2× wedges shared between Gurudev + ALL singers — no separation. Singers hearing Gurudev\'s monitor mix causes pitch drift, timing errors, and feedback from mis-aimed monitors.',
    riskImpact: 'Singers cannot hear themselves. Pitch and timing errors. Feedback from incorrectly aimed monitors. Gurudev\'s private monitor mix compromised.',
    correction: 'Dedicated singer monitors on SEPARATE aux send from Gurudev\'s monitor in every scenario. Small: 1× wedge Aux 2. Medium: 1 wedge per singer pair, Aux 2/3. Large: 4–6 wedge mixes + IEM on dedicated monitor console.',
    ref: 'Sheet 2, Col L'
  },
  {
    id: 6,
    severity: 'MEDIUM',
    category: 'Playback — Only 1 Channel (Mono)',
    scenariosAffected: 'ALL scenarios',
    wrong: '1× Jack/DI for laptop in value scenario. Stereo playback sources (music, bhajans, backing tracks) have L+R. One DI = mono only — loses stereo field, reduces level 3–6 dB, and critically: any split stems (click left / music right) will be broadcast to congregation.',
    riskImpact: 'Mono playback only. Loss of stereo music content. If backing tracks have click/guide on one channel, it broadcasts through PA to entire congregation.',
    correction: 'Every scenario: 2× DI boxes for playback (Radial J48): Stereo L on second-to-last ch "PB-L" and R on last ch "PB-R". Gain matched, phase-checked. 3.5mm TRS Y-split → 2× DI → 2× mixer channels.',
    ref: 'Sheet 2, Col H'
  },
  {
    id: 7,
    severity: 'MEDIUM',
    category: 'Video Audio Input to Mixer',
    scenariosAffected: 'Medium and above',
    wrong: 'Zero video input path specified anywhere. When video plays during Dyatra, audio MUST route through the FOH mixer for level control, EQ, and integration. Without this, video audio either bypasses PA or uses a separate uncontrolled path.',
    riskImpact: 'Video audio not under FOH control. Volume spikes between video and live program. Video audio bypasses room EQ and dynamics. Inconsistent experience.',
    correction: 'Medium and above: 2 dedicated stereo channels for video audio input (VID-L + VID-R). 2× DI from video laptop/server. Labeled "VIDEO IN". Separate gain from music playback. Routed to mains; pre-checked before power.',
    ref: 'Sheet 2, Col M'
  },
  {
    id: 8,
    severity: 'MEDIUM',
    category: 'No Recording Output / Video Team Feed',
    scenariosAffected: 'Medium and above',
    wrong: 'No recording output or video team audio feed in any scenario. Video team taps speaker outputs ad hoc — causing hum, distortion, and wrong levels. No professional archive exists for any Dyatra program.',
    riskImpact: 'No professional audio archive. Video recordings have camera-mic audio. Cannot distribute online. Video team ad hoc workarounds introduce noise and hum.',
    correction: 'Medium+: Dedicated Aux/Matrix "REC OUT" → XLR → Zoom F6/F8n or camera. Small: USB record from digital mixer. Very large: full DANTE multitrack. Every scenario now has a defined recording path.',
    ref: 'Sheet 2, Col N'
  },
  {
    id: 9,
    severity: 'HIGH',
    category: 'RF Coordination Plan Missing',
    scenariosAffected: 'Medium and above',
    wrong: 'No frequency coordination plan or methodology specified. 4+ wireless channels without coordination create intermodulation (IMD) products causing dropouts, squelch triggers, and cross-channel interference in UHF band.',
    riskImpact: 'Wireless mic dropouts during Gurudev\'s talk — worst possible failure moment. Sennheiser + Shure channels at same event create IMD interference if not scanned.',
    correction: 'Pre-Event Checklist: mandatory RF coordination using Shure Wireless Workbench or Sennheiser WSM. Gurudev main + backup get top-priority, protected frequencies. Antenna distribution added for medium+ events. Frequency plan saved to show file.',
    ref: 'Sheet 5'
  },
  {
    id: 10,
    severity: 'HIGH',
    category: 'Gurudev Monitor — Large Hall IEM "Optional"',
    scenariosAffected: 'Large Convention Hall (300-700 pax)',
    wrong: 'Original spec: "IEM optional" for Gurudev in large hall. Technically INCORRECT. IEM is the professional standard at this scale — a stage wedge creates serious feedback risk, stage bleed into DPA mic, and unacceptable SPL at mic capsule position.',
    riskImpact: 'Stage bleed from wedge into DPA mic → feedback at large hall volumes. Gurudev cannot hear himself. Engineer overdrive wedge → feedback loops.',
    correction: 'Large venues (300+ pax): IEM is PRIMARY (Sennheiser EW IEM G4 or Shure PSM300, stereo in-ear). 1× 15" wedge retained as BACKUP only. "Optional" removed — IEM is mandatory at this scale.',
    ref: 'Sheet 2, Col K'
  },
  {
    id: 11,
    severity: 'MEDIUM',
    category: 'No Channel Labeling or Allocation Standard',
    scenariosAffected: 'ALL scenarios',
    wrong: 'No channel allocation or labeling standard specified. Every event, volunteers patch inputs differently. Makes it impossible to save/recall digital mixer show files, hand over to another operator, or maintain consistent Gurudev mic routing.',
    riskImpact: 'Inconsistent setup event-to-event. Cannot use show file recall. Gurudev backup mic may not be pre-assigned. Operator confusion at handover.',
    correction: 'New Channel Allocation Template sheet: Gurudev Main = Ch 1 always; Backup = Ch 2 always. Singers from Ch 3. Playback = last 2 ch (PB-L/PB-R). Video In = second-to-last pair. Consistent across all event sizes.',
    ref: 'Sheet 4'
  },
  {
    id: 12,
    severity: 'LOW-MED',
    category: 'No Recording System Specified',
    scenariosAffected: 'ALL scenarios',
    wrong: 'No dedicated audio recording output, device, or method in any scenario. Recording done ad hoc or not at all — no professional archive of Dyatra programs.',
    riskImpact: 'No audio archive. Cannot produce content for online distribution. Historically significant programs unrecorded or at poor quality.',
    correction: 'Small: USB record on mixer / Zoom H6 on aux. Medium: Zoom F6 on matrix. Large: multitrack USB/DANTE. Very large: full DANTE stem recording. Device and output labeled and patched before soundcheck in every scenario.',
    ref: 'Sheet 2, Col N'
  }
];

const EQUIPMENT_CATALOG: Record<string, Equipment> = {
  'Yamaha MG12XU': {
    category: 'Analog Mixer',
    specs: '12-ch Analog Mixer, 6 Mic Preamps, SPX Digital Effects, 1-knob Compressors',
    tip: 'Keep Mic Compression (Channels 1-2) around 10-12 o’clock to stabilize speech levels without causing room rumble or stage bleed.',
    img: 'mg12xu'
  },
  'Yamaha TF1': {
    category: 'Digital Mixer',
    specs: '16-fader Digital Console, TouchFlow Operation, recallable D-PRE preamps',
    tip: 'Use the StageMix iPad app so you can stand next to Gurudev during soundcheck and adjust monitors directly in his position.',
    img: 'tf1'
  },
  'Yamaha CL3/QL5': {
    category: 'Pro Digital Mixer',
    specs: '32/64 Channel Digital Mixing Systems with Native Dante Network Audio Integration',
    tip: 'Always enable secondary Dante network connection as dynamic redundant fallback. Double patch the Gurudev main wireless receiver to separate input strips.',
    img: 'cl3'
  },
  'DPA 4066/4088': {
    category: 'Premium Headset Microphones',
    specs: 'Omnidirectional (4066) or Cardioid directional (4088) miniature condenser headsets',
    tip: 'Ensure the mic capsule is placed exactly two fingers width away from the corner of the mouth to eliminate popping breath noises and feed-back.',
    img: 'dpa4066'
  },
  'QSC K12.2': {
    category: 'Active Loudspeakers',
    specs: '2000W Class-D amplification peak power, 12-inch LF transducer with 75-degree coverage',
    tip: 'Change DSP Preset to "Live" or "Speech" mode depending on room echoes. Elevate on 3-meter safety pole stands to clear congregational heads.',
    img: 'qsc12'
  },
  'Radial J48': {
    category: 'Active Direct Box',
    specs: '48V Phantom powered high-headroom active direct-injection box with ground lift',
    tip: 'Essential for lap-top or video audio connection. Keeps FOH consoles safe from dynamic voltage changes and eliminates low-frequency power hum.',
    img: 'j48'
  },
  'Sennheiser EW G4 / Shure ULXD': {
    category: 'Professional Wireless Receiver & Transmitter',
    specs: 'UHF multi-band RF wireless system with pristine audio telemetry',
    tip: 'Always position antennas in direct line of sight with the stage. Keep transmitter batteries above 80% with visual monitoring on FOH screen.',
    img: 'g4'
  }
};

const SETUP_TEMPLATES: VenueTemplate[] = [
  {
    id: 'small',
    title: 'Small Room Setup',
    pax: '30-80 pax',
    venue: 'Community Center / Private Flat',
    mixer: 'Yamaha MG12XU',
    mics: '1x DPA 4066 Capsule on Sennheiser G4',
    pa: '2x QSC K8.2 / K10.2 Speakers',
    monitors: '1x Wedge Speaker (routed to Aux 1)',
    cable: '15m 8-Channel Analog Snake',
    rec: 'USB Out from MG12XU Stereo Bus',
    patch: [
      { ch: 1, label: 'GD MAIN', gear: 'DPA 4066', processing: 'HPF 100Hz, Gain +24dB', description: 'Gurudev head-worn mic. High gain, low profile.' },
      { ch: 2, label: 'GD BKUP', gear: 'Sennheiser Handheld', processing: 'Muted at Mixer', description: 'Emergency handover backup handheld on standby.' },
      { ch: 3, label: 'SINGER 1', gear: 'SM58 Wireless', processing: 'HPF 120Hz', description: 'Discourse bhajans vocalist main.' },
      { ch: 4, label: 'SINGER 2', gear: 'SM10 Headset', processing: 'HPF 120Hz', description: 'Supporting backing vocalist.' },
      { ch: 11, label: 'PB-L', gear: 'Radial J48 DI', processing: 'L Channel Playback', description: 'Primary laptop audio left channel.' },
      { ch: 12, label: 'PB-R', gear: 'Radial J48 DI', processing: 'R Channel Playback', description: 'Primary laptop audio right channel.' }
    ]
  },
  {
    id: 'medium',
    title: 'Medium Hall Standard',
    pax: '80-200 pax',
    venue: 'Spacious Banquet Hall / Temple Area',
    mixer: 'Yamaha TF1',
    mics: '2x Matched DPA 4066 headset capsules',
    pa: '2x QSC K12.2 Mains + 2x QSC K8.2 delays',
    monitors: '2x Wedges (Aux 1: Gurudev, Aux 2: Singers)',
    cable: '20m Stage Multicore + AES Ethersound',
    rec: 'Zoom F6 Matrix feed (FOH Rec)',
    patch: [
      { ch: 1, label: 'GD MAIN', gear: 'DPA 4066', processing: 'HPF 100Hz, Soft Gate, Comp 2:1', description: 'Gurudev Speech main wireless.' },
      { ch: 2, label: 'GD BKUP', gear: 'Matched DPA', processing: 'Muted, Match EQ, ready to cue', description: 'Gurudev emergency redundancy microphone.' },
      { ch: 3, label: 'SINGER 1', gear: 'Sennheiser EW300', processing: 'Reverb, EQ cut at 250Hz', description: 'Lead bhajan vocalist.' },
      { ch: 4, label: 'SINGER 2', gear: 'Shure Beta 58', processing: 'Reverb, Gain matched', description: 'Secondary backing vocalist.' },
      { ch: 13, label: 'VID-L', gear: 'Radial PRO AV2 DI', processing: 'Gain -10dB', description: 'Video playback laptop audio left.' },
      { ch: 14, label: 'VID-R', gear: 'Radial PRO AV2 DI', processing: 'Gain -10dB', description: 'Video playback laptop audio right.' },
      { ch: 15, label: 'PB-L', gear: 'Radial J48 DI', processing: 'Stereo Link Playback', description: 'Ambient bhajan/music playback left.' },
      { ch: 16, label: 'PB-R', gear: 'Radial J48 DI', processing: 'Stereo Link Playback', description: 'Ambient bhajan/music playback right.' }
    ]
  },
  {
    id: 'auditorium',
    title: 'Auditorium Standard',
    pax: '150-300 pax',
    venue: 'Theaters / Dedicated Auditorium',
    mixer: 'Yamaha TF3',
    mics: '2x Matched DPA 4088 (Directional) headsets',
    pa: '6x QSC K12.2 Loudspeakers (Mains + Overheads)',
    monitors: '4x Wedges (Aux 1-2: GD, Aux 3-4: Choir / Singers)',
    cable: 'Cat6 Shielded EtherCON Snake',
    rec: 'Zoom F8n Multitrack via Matrix/AES',
    patch: [
      { ch: 1, label: 'GD MAIN', gear: 'DPA 4088', processing: 'Parametric Sweep EQ, fast limiter', description: 'Directional headmic. Highly feedback resistant.' },
      { ch: 2, label: 'GD BKUP', gear: 'DPA 4088', processing: 'Muted at board', description: 'Exact backup on separate active frequency.' },
      { ch: 3, label: 'BH VIRT1', gear: 'Shure ULXD', processing: 'HPF 120Hz, Plate Reverb', description: 'Main bhajan singer.' },
      { ch: 4, label: 'BH VIRT2', gear: 'Shure ULXD', processing: 'Slight comp', description: 'Harmonium backup singer.' },
      { ch: 5, label: 'INSTR 1', gear: 'DI Box', processing: 'Instrument EQ', description: 'Acoustic bhajan instrument.' },
      { ch: 11, label: 'VID-L', gear: 'Radial DI', processing: 'Video Sound Left', description: 'Projector laptop left.' },
      { ch: 12, label: 'VID-R', gear: 'Radial DI', processing: 'Video Sound Right', description: 'Projector laptop right.' },
      { ch: 15, label: 'PB-L', gear: 'Radial J48 DI', processing: 'Stereo Left', description: 'Primary playback audio left.' },
      { ch: 16, label: 'PB-R', gear: 'Radial J48 DI', processing: 'Stereo Right', description: 'Primary playback audio right.' }
    ]
  },
  {
    id: 'large-conv',
    title: 'Large Convention Arena',
    pax: '300-700 pax',
    venue: 'Convention Center Halls',
    mixer: 'Yamaha CL3/QL5',
    mics: 'Redundant DPA Pair on Shure Axient Digital',
    pa: 'L-Acoustics ARCS or high-spec active system (min 8 fills)',
    monitors: 'GD Stereo IEM System + Wedges for backup/feedback',
    cable: 'Dante Primary & Secondary High-Speed Fiber Ring',
    rec: 'Dedicated Dante Virtual Soundcard Multitrack Capture',
    patch: [
      { ch: 1, label: 'GD MAIN', gear: 'Axient+DPA', processing: 'Dante primary digital connection, Dynamic EQ', description: 'Highest priority channel. Studio-grade digital path.' },
      { ch: 2, label: 'GD BKUP', gear: 'Axient+DPA', processing: 'Dante secondary digital connection, Muted', description: 'Hot standby channel. Pre-mixed.' },
      { ch: 3, label: 'SING 1', gear: 'Beta 58 Digital', processing: 'Aux 5 sending to IEM', description: 'Singer lead.' },
      { ch: 4, label: 'SING 2', gear: 'Beta 58 Digital', processing: 'Aux 5 sending to IEM', description: 'Singer supporting.' },
      { ch: 17, label: 'VID-L', gear: 'Dante Virtual Sound', processing: 'Digital path', description: 'Video team direct source left.' },
      { ch: 18, label: 'VID-R', gear: 'Dante Virtual Sound', processing: 'Digital path', description: 'Video team direct source right.' },
      { ch: 31, label: 'PB-L', gear: 'Radial J48', processing: 'Grounded input', description: 'Backup playback line left.' },
      { ch: 32, label: 'PB-R', gear: 'Radial J48', processing: 'Grounded input', description: 'Backup playback line right.' }
    ]
  }
];

const COMPLIANCE_STEPS: AuditCategory[] = [
  {
    section: 'Day Before - Preparation',
    description: 'Pre-flight planning and hardware checkouts before leaving for the site.',
    tasks: [
      { id: 'prep-1', text: 'Power Audit & Battery Check', subtext: 'Ensure all rechargeable batteries (L-On packs/AAs) are fully charged; pack fresh backups for all Sennheiser G4 and Shure receivers.', completed: false },
      { id: 'prep-2', text: 'Active DPA headset matching', subtext: 'Pack matched identical capsules for Main & Backup. Do NOT mix Omni & Directional on primary channels.', completed: false },
      { id: 'prep-3', text: 'Radial DI boxes selection', subtext: 'Count and test 4x active DI units (2x Playback, 2x Video In) with phantom power compliance checks.', completed: false },
      { id: 'prep-4', text: 'Online UPS assessment', subtext: 'Pack 1x Online Double-Conversion UPS (Uninterruptible Power Supply) for FOH digital mixer. Safeguard against voltage sags.', completed: false }
    ]
  },
  {
    section: 'On-Site Setup & RF Routing',
    description: 'Hardware installation, safety checks, and radio frequency scanning.',
    tasks: [
      { id: 'site-1', text: 'RF Environment Scan', subtext: 'Run Shure Wireless Workbench or Sennheiser WSM. Scan 470-608MHz. Allocate primary non-intermodulated frequencies to Gurudev MAIN & BKUP.', completed: false },
      { id: 'site-2', text: 'Earth-Bonding and Grid Protection', subtext: 'Verify voltage differential between neutral & ground lines at FOH distributions. Must read < 1V AC to prevent hum and equipment damage.', completed: false },
      { id: 'site-3', text: 'Loudspeaker Dispersion Test', subtext: 'Confirm mains are placed above congregation ear plane (high pole-stands). Match boundaries and avoid raw brick wall reflection points.', completed: false },
      { id: 'site-4', text: 'Channel Strip Naming Standard', subtext: 'Recall standardized show file. Channel 1 = "GD MAIN", Ch 2 = "GD BKUP" (Muted). Playback and Video on their corresponding dedicated stereo channels.', completed: false }
    ]
  },
  {
    section: 'Soundcheck & Show Operations',
    description: 'Dynamic testing, EQ tuning, and emergency protocol drill.',
    tasks: [
      { id: 'show-1', text: 'Gurudev Mic Gain & EQ Match', subtext: 'Run main mic to optimum peak level (-18dBFS). Copy settings to Channel 2 (GD BKUP). Apply 100Hz HPF to both.', completed: false },
      { id: 'show-2', text: 'Check Backup Mic Mute Standby', subtext: 'Confirm Ch 2 is active, gain-matched, EQ matched, but strictly MUTED. Check that the audio operator knows the emergency standby cue.', completed: false },
      { id: 'show-3', text: 'Stereo Playback Field Validation', subtext: 'Play high-fidelity backing track. Confirm presence of left and right separation. Verify that no split guide/click track is leaking to main PA.', completed: false },
      { id: 'show-4', text: 'Dedicated Recording & Video Matrix', subtext: 'Verify independent Aux/Matrix output is routing cleanly to Zoom recorder or video team console. Verify headroom and line level limits (-12 dB peak).', completed: false }
    ]
  }
];

// ============================================================================
// 3. SUBCOMPONENTS
// ============================================================================

// --- GearLibrary ---
function GearLibrary() {
  const [selectedGearName, setSelectedGearName] = useState<string | null>(null);

  const renderGearSilhouette = (name: string, category: string) => {
    switch (category) {
      case 'Analog Mixer':
      case 'Digital Mixer':
      case 'Pro Digital Mixer':
        return (
          <div className="w-full h-full bg-slate-900 rounded-2xl flex flex-col justify-between p-4 border border-slate-800 relative overflow-hidden text-left font-mono">
            <div className="absolute top-0 right-0 h-16 w-16 bg-indigo-500/10 rounded-full blur-xl"></div>
            <div className="flex justify-between items-center text-slate-500 text-[9px] font-bold">
              <span>FADER ENGINE</span>
              <Sliders size={12} className="text-indigo-400" />
            </div>
            <div className="flex gap-2.5 items-end justify-center flex-1 my-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex flex-col items-center flex-1 gap-1">
                  <div className="h-1.5 w-1.5 rounded-full bg-indigo-500/80"></div>
                  <div className="h-10 w-0.5 bg-slate-800 relative rounded-full">
                    <div className="absolute w-2 h-1 bg-indigo-400 rounded-sm left-1/2 -translate-x-1/2" style={{ bottom: `${15 + i * 12}%` }}></div>
                  </div>
                  <div className="w-2 py-0.5 bg-slate-800 text-[6px] text-slate-500 font-bold rounded-sm text-center">0{i+1}</div>
                </div>
              ))}
            </div>
            <div className="text-[9px] uppercase font-bold text-indigo-400 tracking-wider">
              {category}
            </div>
          </div>
        );
      case 'Premium Headset Microphones':
        return (
          <div className="w-full h-full bg-slate-950 rounded-2xl flex flex-col justify-between p-4 border border-slate-900 relative overflow-hidden text-left font-mono">
            <div className="absolute top-0 right-0 h-12 w-12 bg-blue-500/10 rounded-full blur-xl"></div>
            <div className="flex justify-between items-center text-slate-600 text-[9px] font-bold">
              <span>CONDENSER CAPSULE</span>
              <Mic2 size={12} className="text-blue-400 animate-pulse" />
            </div>
            <div className="flex-1 flex items-center justify-center relative my-3">
              <svg className="w-16 h-12 stroke-indigo-500 stroke-2 fill-none" viewBox="0 0 100 60">
                <path d="M10 20 Q 50 5, 90 20 T 50 50 Q 20 40, 10 30" />
                <circle cx="90" cy="20" r="5" className="fill-blue-400 stroke-none" />
              </svg>
            </div>
            <div className="text-[9px] uppercase font-bold text-blue-400 tracking-wider">
              DPA CONDENSER
            </div>
          </div>
        );
      case 'Active Loudspeakers':
        return (
          <div className="w-full h-full bg-slate-900 rounded-2xl flex flex-col justify-between p-4 border border-slate-800 relative overflow-hidden text-left font-mono">
            <div className="absolute top-0 right-0 h-16 w-16 bg-amber-500/10 rounded-full blur-xl"></div>
            <div className="flex justify-between items-center text-slate-500 text-[9px] font-bold">
              <span>ACTIVE CABINET</span>
              <Speaker size={12} className="text-amber-500" />
            </div>
            <div className="flex-1 flex flex-col items-center justify-center gap-2.5 my-3">
              <div className="w-10 h-10 rounded-full border-2 border-slate-800 bg-slate-950 flex items-center justify-center">
                <div className="w-5 h-5 rounded-full border border-slate-800 bg-slate-900 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-800"></div>
                </div>
              </div>
              <div className="w-6 h-3 rounded-full border border-slate-800 bg-slate-950"></div>
            </div>
            <div className="text-[9px] uppercase font-bold text-amber-400 tracking-wider">
              POWERED MAIN
            </div>
          </div>
        );
      case 'Active Direct Box':
        return (
          <div className="w-full h-full bg-indigo-950 rounded-2xl flex flex-col justify-between p-4 border border-indigo-900/50 relative overflow-hidden text-left font-mono">
            <div className="absolute top-0 right-0 h-12 w-12 bg-indigo-500/20 rounded-full blur-xl"></div>
            <div className="flex justify-between items-center text-indigo-400 text-[9px] font-bold">
              <span>BALANCED TRANSFORMER</span>
              <Cable size={12} className="text-indigo-300" />
            </div>
            <div className="flex-1 flex items-center justify-center gap-3 my-3">
              <div className="w-4 h-4 rounded-full border border-indigo-700 bg-indigo-900"></div>
              <div className="h-0.5 w-6 bg-indigo-700"></div>
              <div className="w-5 h-5 rounded-md border border-indigo-700 bg-indigo-900 flex items-center justify-center font-mono text-[7px] text-indigo-300 font-bold">DIR</div>
            </div>
            <div className="text-[9px] uppercase font-bold text-indigo-300 tracking-wider">
              RADIAL DI ISOLATED
            </div>
          </div>
        );
      case 'Professional Wireless Receiver & Transmitter':
        return (
          <div className="w-full h-full bg-slate-900 rounded-2xl flex flex-col justify-between p-4 border border-slate-800 relative overflow-hidden text-left font-mono">
            <div className="absolute top-0 right-0 h-16 w-16 bg-emerald-500/10 rounded-full blur-xl"></div>
            <div className="flex justify-between items-center text-slate-500 text-[9px] font-bold">
              <span>UHF DIVERSITY SCAN</span>
              <Wifi size={12} className="text-emerald-400" />
            </div>
            <div className="flex-1 flex flex-col items-center justify-center gap-1.5 my-3 text-[10px] text-emerald-400 font-black">
              <span className="animate-pulse">520.450 MHz</span>
              <div className="flex gap-0.5 h-3 items-end">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="w-1 bg-emerald-500 rounded-t-sm" style={{ height: `${20 + i * 15}%` }}></div>
                ))}
              </div>
            </div>
            <div className="text-[9px] uppercase font-bold text-emerald-400 tracking-wider">
              RF TRANSCEIVER
            </div>
          </div>
        );
      default:
        return (
          <div className="w-full h-full bg-slate-900 rounded-2xl flex flex-col justify-between p-4 border border-slate-800 relative overflow-hidden text-left font-mono">
            <div className="flex justify-between items-center text-slate-500 text-[9px] font-bold">
              <span>EQUIPMENT UNIT</span>
              <HardDrive size={12} className="text-slate-400" />
            </div>
            <div className="flex-1 flex items-center justify-center my-3 text-slate-600">
              <Activity size={28} />
            </div>
            <div className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">
              STANDARD RACK
            </div>
          </div>
        );
    }
  };

  const selectedGear = selectedGearName ? EQUIPMENT_CATALOG[selectedGearName] : null;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm text-left">
        <h2 className="text-2xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
          <Database className="text-indigo-600" size={22} />
          Mandatory Hardware Catalog
        </h2>
        <p className="text-slate-500 text-sm mt-1">
          Authorized sound inventory specs for spiritual programs. Standardizing specific hardware blocks prevents feed sags and eliminates acoustic hum.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(EQUIPMENT_CATALOG).map(([name, data]) => (
          <div 
            key={name}
            onClick={() => setSelectedGearName(name)}
            className="group bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all rounded-xl p-5 text-left cursor-pointer flex flex-col justify-between relative"
          >
            <div className="space-y-4">
              <div className="h-44 w-full">
                {renderGearSilhouette(name, data.category)}
              </div>
              <div>
                <span className="inline-flex items-center rounded-md bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-700 tracking-wide uppercase">
                  {data.category}
                </span>
                <h3 className="text-[17px] font-black text-slate-900 uppercase tracking-tight mt-2 italic group-hover:text-indigo-600 transition-colors">
                  {name}
                </h3>
                <p className="text-xs leading-relaxed font-semibold text-slate-500 mt-1.5">
                  {data.specs}
                </p>
              </div>
            </div>
            <div className="pt-4 mt-4 border-t border-slate-50 flex justify-between items-center text-[10px] font-mono">
              <span className="text-indigo-500 font-bold">TAP TO VIEW ADVISORY</span>
              <Info className="text-slate-400 group-hover:translate-x-1 transition-transform group-hover:text-indigo-500" size={14} />
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {selectedGear && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setSelectedGearName(null)} 
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" 
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 30 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.95, opacity: 0, y: 15 }} 
              className="relative w-full max-w-lg bg-white rounded-2xl overflow-hidden shadow-2xl text-left border border-slate-200"
            >
              <div className="h-64 bg-slate-950 p-8 flex items-center justify-center relative">
                <div className="w-full h-full max-w-sm">
                  {selectedGearName && renderGearSilhouette(selectedGearName, selectedGear.category)}
                </div>
                <button 
                  onClick={() => setSelectedGearName(null)} 
                  className="absolute top-5 right-5 h-10 w-10 bg-white hover:scale-105 active:scale-95 text-slate-400 hover:text-slate-700 rounded-full flex items-center justify-center shadow-md transition-all cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="p-8 space-y-5">
                <div>
                  <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 tracking-wide uppercase">
                    {selectedGear.category}
                  </span>
                  <h3 className="text-3xl font-black text-slate-900 mt-2 italic uppercase">
                    {selectedGearName}
                  </h3>
                  <p className="text-slate-500 text-sm font-semibold leading-relaxed mt-2.5">
                    {selectedGear.specs}
                  </p>
                </div>
                <div className="p-5 bg-indigo-50/50 border border-indigo-100 rounded-xl flex gap-3.5 items-start">
                  <span className="p-1 px-1.5 bg-indigo-100 text-indigo-700 rounded font-mono font-black text-[13px] uppercase">
                    SOP
                  </span>
                  <div>
                    <h4 className="text-[10px] font-mono font-bold text-indigo-800 uppercase tracking-widest leading-none">Technical Advisor Directive</h4>
                    <p className="text-slate-700 text-xs font-semibold leading-relaxed mt-1.5">
                      {selectedGear.tip}
                    </p>
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 font-mono flex justify-between pt-2 border-t border-slate-50">
                  <span>SRMD AV GUIDE REFERENCE v2.2</span>
                  <span>SYSTEM STANDARD</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- SetupBlueprints ---
function SetupBlueprints() {
  const [activeVenueId, setActiveVenueId] = useState<string>('medium');
  const [attendees, setAttendees] = useState<number>(150);
  const [envType, setEnvType] = useState<'indoor' | 'outdoor'>('indoor');

  const generatedSpecs = useMemo(() => {
    let grade: 'small' | 'medium' | 'auditorium' | 'large-conv' = 'medium';
    let minSpeakers = 4;
    let speakerReason = "";
    let warnings: string[] = [];

    if (attendees <= 80 && envType === 'indoor') {
      grade = 'small';
    } else if (attendees <= 200 && envType === 'indoor') {
      grade = 'medium';
    } else if (attendees <= 300 && envType === 'indoor') {
      grade = 'auditorium';
    } else {
      grade = 'large-conv';
    }

    if (envType === 'outdoor') {
      if (attendees > 200) {
        minSpeakers = 8;
        speakerReason = "CRITICAL: Outdoor crowd exceeds 200. Outdoor acoustic loss is severe. Minimum 8 active speakers (mains + delays) elevated on 3m stands mandatory to prevent feedback and output clipping.";
        warnings.push("Flaw #4 Violation Risk: 4 speakers will clip. 8 speakers are physically necessary.");
      } else {
        minSpeakers = 6;
        speakerReason = "HIGH: Outdoor settings require 6-10 dB higher SPL due to ambient bleed and lack of room boundary reflections. Enforce minimum 6 active speakers.";
      }
    } else {
      if (attendees > 200) {
        minSpeakers = 6;
        speakerReason = "HIGH: Standard auditorium depth for >200 pax requires minimum 6 active speakers (or 4 mains + 2 delays delayed by 25ms) to prevent front-row volume ear fatigue while maintaining intelligibility at the rear.";
        warnings.push("Flaw #3 Violation Risk: Minimum 6 speakers required for crowd > 200.");
      } else {
        minSpeakers = 4;
        speakerReason = "Standard: 4 active mains provide complete, balanced acoustic distribution for venues under 200 attendees.";
      }
    }

    let monitorSOP = "";
    if (attendees <= 80) {
      monitorSOP = "1x Dedicated wedge for Gurudev (Aux 1). 1x separate singer wedge (Aux 2). Never share the mix.";
    } else if (attendees <= 200) {
      monitorSOP = "1x Wedge for Gurudev (Aux 1). Min 2x dedicated singer wedges (Aux 2 + Aux 3) on separate aux sends to protect pitch tuning.";
    } else {
      monitorSOP = "Gurudev MAIN Stereo In-Ear Monitors (IEM) (Aux 1/2) with 1x fallback wedge (Aux 3). Dedicated console for singer mixes (Aux 4+). IEM is mandatory here.";
      warnings.push("Flaw #10 Warning: IEM is mandatory for large venues. Avoid wedge bleed into headworn mics.");
    }

    const playbackSpec = "Dual Active DI Boxes (Radial J48) connected to adjacent mixer channels (PB-L, PB-R) for verified stereo field. Link channels.";
    const videoSpec = attendees > 80 
      ? "2x Dedicated video audio channels with DI boxes (VID-L, VID-R) on mixer. Do NOT bypass FOH control rules."
      : "Standard stereo direct input, level controlled.";

    return {
      suggestedTemplateId: grade,
      minSpeakers,
      speakerReason,
      monitorSOP,
      playbackSpec,
      videoSpec,
      warnings
    };
  }, [attendees, envType]);

  const currentTemplate = useMemo(() => {
    return SETUP_TEMPLATES.find(v => v.id === activeVenueId) || SETUP_TEMPLATES[1];
  }, [activeVenueId]);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-12 xl:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between text-left">
          <header className="border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <Calculator size={18} />
              </span>
              <div>
                <h3 className="font-bold text-slate-900 text-[15px]">Setup Grade Evaluator</h3>
                <p className="text-slate-400 text-[11px] font-medium leading-none mt-1">Check minimum required gear standards based on event scale</p>
              </div>
            </div>
          </header>

          <div className="flex-1 py-6 space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <label className="font-bold text-slate-700 flex items-center gap-1.5">
                  <Users size={14} className="text-slate-400" />
                  Expected Attendance Size:
                </label>
                <span className="px-2 py-1 bg-indigo-50 text-indigo-700 font-extrabold rounded-lg font-mono text-sm shadow-inner ring-1 ring-indigo-100">
                  {attendees} Pax
                </span>
              </div>
              <input 
                type="range"
                min="10"
                max="1000"
                step="10"
                value={attendees}
                onChange={(e) => setAttendees(parseInt(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer h-2 bg-slate-100 rounded-lg appearance-none"
              />
              <div className="flex justify-between font-mono text-[9px] text-slate-400 font-bold">
                <span>10 (PAX)</span>
                <span>200 (LOW SPL THRESHOLD)</span>
                <span>500 (HIGH SPL)</span>
                <span>1000+ (ARENA)</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="font-semibold text-slate-700 text-xs block">
                Venue Environment:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setEnvType('indoor')}
                  className={`py-3 px-4 rounded-md border font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    envType === 'indoor'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <MapPin size={14} />
                  Indoor Venue
                </button>
                <button
                  type="button"
                  onClick={() => setEnvType('outdoor')}
                  className={`py-3 px-4 rounded-md border font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    envType === 'outdoor'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <MapPin size={14} />
                  Outdoor Venue
                </button>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-5 space-y-4">
              {generatedSpecs.warnings.length > 0 && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-4 space-y-2 text-red-800 text-xs">
                  <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px] text-red-700">
                    <AlertTriangle size={14} />
                    SOP Compliance Hazards Detected:
                  </div>
                  <ul className="list-disc pl-4 space-y-1 font-semibold">
                    {generatedSpecs.warnings.map((w, idx) => <li key={idx}>{w}</li>)}
                  </ul>
                </div>
              )}
              <div className="flex gap-4 items-start bg-slate-50 border border-slate-100 rounded-xl p-4">
                <Speaker className="text-indigo-600 shrink-0 mt-0.5" size={24} />
                <div>
                  <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">Speaker Count Minimum Enforced</h4>
                  <p className="text-base font-extrabold text-slate-900 mt-1">{generatedSpecs.minSpeakers}x Active Loudspeakers</p>
                  <p className="text-[11px] leading-relaxed mt-1 font-semibold text-slate-600">{generatedSpecs.speakerReason}</p>
                </div>
              </div>
              <div className="flex gap-4 items-start bg-slate-50 border border-slate-100 rounded-xl p-4">
                <Volume2 className="text-indigo-600 shrink-0 mt-0.5" size={24} />
                <div>
                  <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">Monitoring Split Routing</h4>
                  <p className="text-xs font-black text-slate-800 mt-1 leading-normal">{generatedSpecs.monitorSOP}</p>
                </div>
              </div>
            </div>
          </div>
          <footer className="text-[10.5px] text-indigo-600/80 bg-indigo-50/50 p-3 rounded-lg border border-indigo-100 font-bold flex gap-2">
            <Sparkles size={14} className="shrink-0 text-indigo-500" />
            <span>Smart Estimator auto-navigates standard spreadsheet thresholds.</span>
          </footer>
        </div>

        <div className="lg:col-span-12 xl:col-span-7 bg-slate-900 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden flex flex-col justify-between text-left border border-slate-800">
          <div className="relative z-10 space-y-6">
            <header className="flex justify-between items-center pb-4 border-b border-white/10">
              <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-indigo-400">
                RECOMMENDED BLUEPRINT GRADE: <span className="text-white font-extrabold">{generatedSpecs.suggestedTemplateId.toUpperCase()}</span>
              </span>
              <div className="flex bg-white/5 p-1 rounded-md border border-white/10">
                {SETUP_TEMPLATES.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setActiveVenueId(t.id)}
                    className={`px-3 py-1.5 rounded text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                      activeVenueId === t.id 
                        ? 'bg-white text-indigo-950 shadow-sm' 
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {t.title.split(' ')[0]}
                  </button>
                ))}
              </div>
            </header>
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1 px-2.5 bg-indigo-600 rounded text-[9px] font-mono font-bold tracking-widest uppercase">
                  {currentTemplate.pax} LEVEL
                </span>
                <span className="text-slate-400 text-xs font-mono">| {currentTemplate.venue}</span>
              </div>
              <h2 className="text-3xl font-black tracking-tight leading-none uppercase mt-3 text-white">
                {currentTemplate.title}
              </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 pt-6 border-t border-white/10 text-xs">
              <div>
                <p className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest">Digital Console Model</p>
                <p className="font-extrabold text-white mt-1">{currentTemplate.mixer}</p>
              </div>
              <div>
                <p className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest">Primary Speech Mics</p>
                <p className="font-extrabold text-white mt-1 ">{currentTemplate.mics}</p>
              </div>
              <div>
                <p className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest">Stage Monitors (SOP Split)</p>
                <p className="font-extrabold text-white mt-1">{currentTemplate.monitors}</p>
              </div>
              <div>
                <p className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest">Main PA Configuration</p>
                <p className="font-extrabold text-white mt-1">{currentTemplate.pa}</p>
              </div>
              <div>
                <p className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest">Cabling Standard</p>
                <p className="font-extrabold mt-1 text-slate-300">{currentTemplate.cable}</p>
              </div>
              <div>
                <p className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest">Recording & Archive Feed</p>
                <p className="font-extrabold text-white mt-1 text-indigo-300">{currentTemplate.rec}</p>
              </div>
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mt-8 flex justify-between items-center text-xs">
            <span className="font-mono text-slate-400 text-[10px]">OPERATIONAL DIRECTIVE SHEETS 2 & 4 COLS E-N</span>
            <button
              onClick={() => {
                const element = document.getElementById('compliance-tab-header');
                if (element) element.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-indigo-400 hover:text-indigo-300 font-bold transition-all flex items-center gap-1 cursor-pointer"
            >
              Verify Compliance
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm text-left">
        <header className="border-b border-slate-100 pb-5">
          <div className="flex items-center gap-2">
            <FileSpreadsheet size={18} className="text-indigo-600" />
            <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide">
              Standardized Mixer Patch Scheme - {currentTemplate.title}
            </h3>
          </div>
          <p className="text-slate-400 text-xs mt-1">
            Standardizing these strips protects main and backup feeds while locking stereo sound paths (Flaws #6, #7, #11).
          </p>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-5">
          {currentTemplate.patch.map((p, idx) => (
            <div 
              key={idx}
              className="p-4 border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all rounded-xl flex gap-3.5 items-start"
            >
              <span className="w-10 h-10 shrink-0 bg-indigo-600 text-white font-mono font-black text-sm flex items-center justify-center rounded-md shadow-sm">
                CH-{p.ch.toString().padStart(2, '0')}
              </span>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-black text-slate-900 text-xs uppercase bg-white px-1.5 py-0.5 rounded border border-slate-200">
                    {p.label}
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold">{p.gear}</span>
                </div>
                <p className="text-xs leading-relaxed font-semibold text-slate-500">{p.description}</p>
                <p className="text-[10px] font-mono text-emerald-600 font-bold bg-emerald-50/50 px-2 py-0.5 rounded inline-block border border-emerald-100">
                  EQ Set: {p.processing}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- FlawGuide ---
function FlawGuide() {
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [selectedFlaw, setSelectedFlaw] = useState<number | null>(null);

  const filteredFlaws = useMemo(() => {
    return FLAW_TABLE_DATA.filter(flaw => {
      const matchesSearch = 
        flaw.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        flaw.wrong.toLowerCase().includes(searchTerm.toLowerCase()) ||
        flaw.correction.toLowerCase().includes(searchTerm.toLowerCase()) ||
        flaw.scenariosAffected.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesSeverity = severityFilter === 'ALL' || flaw.severity === severityFilter;

      return matchesSearch && matchesSeverity;
    });
  }, [searchTerm, severityFilter]);

  const severityStats = useMemo(() => {
    const stats = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, 'LOW-MED': 0 };
    FLAW_TABLE_DATA.forEach(f => {
      if (f.severity in stats) {
        stats[f.severity as keyof typeof stats]++;
      }
    });
    return stats;
  }, []);

  const getSeverityBadgeClass = (severity: SeverityType) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-500 text-white border border-red-600';
      case 'HIGH': return 'bg-orange-500 text-white border border-orange-600';
      case 'MEDIUM': return 'bg-blue-500 text-white border border-blue-600';
      case 'LOW-MED': return 'bg-slate-600 text-white border border-slate-700';
      default: return 'bg-slate-500 text-white border border-slate-600';
    }
  };

  const getSeverityIcon = (severity: SeverityType) => {
    switch (severity) {
      case 'CRITICAL': return <ShieldAlert className="text-red-500 shrink-0" size={16} />;
      case 'HIGH': return <AlertTriangle className="text-orange-500 shrink-0" size={16} />;
      case 'MEDIUM': return <AlertTriangle className="text-amber-500 shrink-0" size={16} />;
      default: return <Info className="text-blue-500 shrink-0" size={16} />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
              <AlertTriangle className="text-red-500" size={22} />
              Expert Flaw Analysis & Correction SOPs
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              A comprehensive audits of the original equipment specifications and standard operating procedures (SOPs).
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="px-3 py-1.5 bg-slate-100 rounded-md text-slate-600 font-medium border border-slate-200">
              Total Audited Flaws: <span className="font-bold text-slate-900">{FLAW_TABLE_DATA.length}</span>
            </span>
            <span className="px-3 py-1.5 bg-red-50 text-red-700 rounded-md font-medium border border-red-100">
              Critical: <span className="font-bold">{severityStats.CRITICAL}</span>
            </span>
            <span className="px-3 py-1.5 bg-orange-50 text-orange-700 rounded-md font-medium border border-orange-100">
              High: <span className="font-bold">{severityStats.HIGH}</span>
            </span>
            <span className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-md font-medium border border-blue-100">
              Medium: <span className="font-bold">{severityStats.MEDIUM}</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-6">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
            <input
              type="text"
              placeholder="Search category, original specs, or corrections..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-slate-800 text-sm bg-slate-50/50 border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all placeholder:text-slate-400"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="w-full text-slate-800 text-sm bg-slate-50/50 border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all appearance-none cursor-pointer font-medium"
            >
              <option value="ALL">Severity: All Categories</option>
              <option value="CRITICAL">Severity: CRITICAL Only</option>
              <option value="HIGH">Severity: HIGH Only</option>
              <option value="MEDIUM">Severity: MEDIUM Only</option>
              <option value="LOW-MED">Severity: LOW-MED Only</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-3">
          {filteredFlaws.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
              <p className="text-slate-400 text-sm">No items match your filters.</p>
              <button 
                onClick={() => { setSearchTerm(''); setSeverityFilter('ALL'); }}
                className="text-xs text-indigo-600 font-bold mt-2 hover:underline"
              >
                Clear filters
              </button>
            </div>
          ) : (
            filteredFlaws.map((flaw) => {
              const isActive = selectedFlaw === flaw.id;
              return (
                <div 
                  id={`flaw-card-${flaw.id}`}
                  key={flaw.id}
                  onClick={() => setSelectedFlaw(flaw.id)}
                  className={`p-5 rounded-xl border text-left cursor-pointer transition-all ${
                    isActive 
                      ? 'bg-white border-indigo-500 ring-1 ring-indigo-500/20 shadow-md' 
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-black uppercase tracking-tight ${getSeverityBadgeClass(flaw.severity)}`}>
                          {getSeverityIcon(flaw.severity)}
                          {flaw.severity}
                        </span>
                        <span className="text-slate-400 text-xs font-mono">{flaw.ref}</span>
                      </div>
                      <h3 className="font-bold text-slate-800 text-[15px] pt-1">
                        {flaw.id}. {flaw.category}
                      </h3>
                      <p className="text-xs font-medium text-slate-500">
                        <span className="text-slate-400">Scenarios:</span> {flaw.scenariosAffected}
                      </p>
                    </div>
                    <ArrowRight className={`text-slate-400 shrink-0 transition-transform ${isActive ? 'translate-x-1.5 text-indigo-500' : ''}`} size={16} />
                  </div>
                  <p className="text-slate-500 text-xs line-clamp-2 mt-2 italic bg-slate-50/50 p-2 rounded-lg border border-slate-100">
                    "{flaw.wrong}"
                  </p>
                </div>
              );
            })
          )}
        </div>

        <div className="lg:col-span-5">
          <div className="sticky top-6">
            <AnimatePresence mode="wait">
              {selectedFlaw === null ? (
                <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center flex flex-col items-center justify-center h-96">
                  <div className="p-4 bg-slate-100 rounded-full text-slate-400 mb-3">
                    <HelpCircle size={32} />
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm">Select a flaw on the left</h4>
                  <p className="text-slate-400 text-xs mt-1 max-w-xs leading-relaxed">
                    Click any assessed technical deficiency to inspect the feedback risks, potential system failures, and the exact corrective layout standard.
                  </p>
                </div>
              ) : (
                (() => {
                  const flaw = FLAW_TABLE_DATA.find(f => f.id === selectedFlaw)!;
                  return (
                    <motion.div 
                      key={flaw.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5 text-left"
                    >
                      <div className="border-b border-slate-100 pb-4">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <span className={`inline-flex items-center gap-1 rounded px-2.5 py-0.5 text-[10px] font-black uppercase tracking-tight ${getSeverityBadgeClass(flaw.severity)}`}>
                            {getSeverityIcon(flaw.severity)}
                            {flaw.severity}
                          </span>
                          <span className="text-slate-400 text-xs font-mono flex items-center gap-1">
                            <Sheet size={13} className="text-slate-300" />
                            {flaw.ref}
                          </span>
                        </div>
                        <h3 className="text-lg font-black text-slate-900 mt-3 leading-tight uppercase tracking-tight">
                          {flaw.category}
                        </h3>
                        <p className="text-xs text-indigo-600 font-bold uppercase tracking-wider mt-1.5">
                          Affected: {flaw.scenariosAffected}
                        </p>
                      </div>
                      <div className="space-y-3.5">
                        <div className="bg-red-50/40 border border-red-100 rounded-xl p-4 space-y-1.5">
                          <div className="flex items-center gap-2 text-red-700 font-extrabold text-xs uppercase tracking-wider">
                            <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse"></span>
                            Original Spec (Critical Flaw)
                          </div>
                          <p className="text-slate-700 text-xs font-semibold leading-relaxed">
                            {flaw.wrong}
                          </p>
                        </div>
                        <div className="bg-[#fffbeb] border border-[#fef3c7] rounded-xl p-4 space-y-1.5">
                          <div className="flex items-center gap-2 text-amber-800 font-extrabold text-xs uppercase tracking-wider">
                            <span className="p-0.5 bg-amber-100 rounded text-amber-600">
                              <ShieldAlert size={11} />
                            </span>
                            Incident Risk & Sonic Impact
                          </div>
                          <p className="text-slate-600 text-xs font-semibold leading-relaxed">
                            {flaw.riskImpact}
                          </p>
                        </div>
                        <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4 space-y-2 shadow-inner ring-1 ring-emerald-500/10">
                          <div className="flex items-center gap-2 text-emerald-800 font-extrabold text-xs uppercase tracking-wider">
                            <span className="p-0.5 bg-emerald-100 rounded text-emerald-600">
                              <CheckCircle2 size={12} />
                            </span>
                            Mandatory Correction Plan (SOP)
                          </div>
                          <p className="text-slate-800 text-xs font-bold leading-relaxed underline decoration-indigo-200 underline-offset-4">
                            {flaw.correction}
                          </p>
                        </div>
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium pt-2 border-t border-slate-100 flex justify-between items-center">
                        <span>SRMD AV Reference Guidelines v2.2</span>
                        <span>Authorized Operational standard</span>
                      </div>
                    </motion.div>
                  );
                })()
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- ComplianceAudit ---
function ComplianceAudit() {
  const [categories, setCategories] = useState<AuditCategory[]>(COMPLIANCE_STEPS);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleToggleTask = (catSection: string, taskId: string) => {
    setCategories(prev => {
      return prev.map(cat => {
        if (cat.section === catSection) {
          return {
            ...cat,
            tasks: cat.tasks.map(task => 
              task.id === taskId ? { ...task, completed: !task.completed } : task
            )
          };
        }
        return cat;
      });
    });
  };

  const stats = React.useMemo(() => {
    let total = 0;
    let completed = 0;
    categories.forEach(c => {
      total += c.tasks.length;
      completed += c.tasks.filter(t => t.completed).length;
    });

    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, percent };
  }, [categories]);

  const handleReset = () => {
    setCategories(prev => {
      return prev.map(cat => ({
        ...cat,
        tasks: cat.tasks.map(task => ({ ...task, completed: false }))
      }));
    });
    showToast("Checklist reset successfully!");
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleCopyReport = () => {
    let textReport = `🔊 SRMD AV QUALITY COMPLIANCE REPORT 🔊\n`;
    textReport += `Progress: ${stats.percent}% Complete (${stats.completed}/${stats.total} Tasks Passed)\n`;
    textReport += `Checked Date: ${new Date().toLocaleDateString()}\n`;
    textReport += `-----------------------------------------------\n\n`;

    categories.forEach(cat => {
      textReport += `★ ${cat.section.toUpperCase()}\n`;
      cat.tasks.forEach(task => {
        const symbol = task.completed ? ` [✔] ` : ` [ ] `;
        textReport += `${symbol} ${task.text} - ${task.subtext}\n`;
      });
      textReport += `\n`;
    });

    textReport += `Processed via AV Audio Setup Hub (Operational Standard v2.2)`;

    navigator.clipboard.writeText(textReport).then(() => {
      showToast("Compliance report copied to clipboard!");
    }).catch(() => {
      showToast("Failed to copy clipboard. Please manually select.");
    });
  };

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="fixed bottom-6 right-6 z-[600] bg-slate-900 border border-slate-800 text-white text-xs font-bold px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2"
          >
            <ShieldCheck className="text-emerald-400" size={16} />
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="text-left">
            <h2 className="text-2xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
              <ClipboardCheck className="text-indigo-600" size={22} />
              Quality Compliance Checklist
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              Verify pre-flight, RF scanner, power safety, and backup microphone routing parameters.
            </p>
          </div>

          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 shrink-0 min-w-[280px]">
            <div className="flex-1 flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-xl p-3.5">
              <div className="relative h-12 w-12 flex items-center justify-center shrink-0">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="24" cy="24" r="20" stroke="#f1f5f9" strokeWidth="4" fill="transparent" />
                  <circle 
                    cx="24" 
                    cy="24" 
                    r="20" 
                    stroke="#4f46e5" 
                    strokeWidth="4" 
                    fill="transparent" 
                    strokeDasharray={2 * Math.PI * 20}
                    strokeDashoffset={2 * Math.PI * 20 * (1 - stats.percent / 100)}
                    className="transition-all duration-500 ease-out"
                  />
                </svg>
                <span className="absolute font-mono font-black text-xs text-slate-800">{stats.percent}%</span>
              </div>
              <div className="text-left">
                <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest leading-none">Passed Audits</p>
                <p className="text-base font-black text-slate-800 tracking-tight mt-1">{stats.completed} / {stats.total} checked</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCopyReport}
                className="px-4 py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs rounded-md flex items-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <Share2 size={13} />
                Copy Output Report
              </button>
              <button
                onClick={handleReset}
                className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-700 rounded-md transition-all cursor-pointer"
                title="Reset checkboxes"
              >
                <RotateCcw size={13} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {stats.percent === 100 && (
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 text-center space-y-2 text-emerald-900"
        >
          <div className="inline-flex p-3 bg-emerald-100 text-emerald-600 rounded-full mb-1">
            <Sparkles size={24} />
          </div>
          <h3 className="text-lg font-black tracking-tight leading-none text-emerald-800">100% SOP COMPLIANT!</h3>
          <p className="text-xs font-semibold text-emerald-700 max-w-lg mx-auto">
            All evaluated flaws and hardware deficiencies have been successfully checked. Double-conversion UPS values protect our mixing board, RF spectrum plans are mapped, and the matched headroom backup mic is active. Perfect sound awaits!
          </p>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
        {categories.map((cat, idx) => {
          const catChecked = cat.tasks.filter(t => t.completed).length;
          const catPercent = Math.round((catChecked / cat.tasks.length) * 100);

          return (
            <div key={cat.section} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
              <div className="space-y-4">
                <header className="border-b border-slate-100 pb-4">
                  <span className="text-[9px] font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                    PHASE 0{idx + 1}
                  </span>
                  <h3 className="text-base font-extrabold text-slate-900 mt-1.5">{cat.section}</h3>
                  <p className="text-slate-400 text-xs mt-1 font-semibold leading-relaxed">{cat.description}</p>
                </header>
                <div className="space-y-3.5 my-4">
                  {cat.tasks.map((task) => (
                    <div 
                      key={task.id}
                      onClick={() => handleToggleTask(cat.section, task.id)}
                      className={`p-4 rounded-xl border text-left cursor-pointer transition-all flex gap-3.5 items-start ${
                        task.completed 
                          ? 'bg-indigo-50/20 border-indigo-100/80 shadow-inner' 
                          : 'bg-slate-50/50 border-slate-100 hover:border-slate-200 hover:bg-white hover:shadow-sm'
                      }`}
                    >
                      <button 
                        type="button" 
                        className={`h-5 w-5 rounded-md shrink-0 border transition-all flex items-center justify-center cursor-pointer ${
                          task.completed 
                            ? 'bg-indigo-600 text-white border-indigo-600' 
                            : 'bg-white border-slate-300'
                        }`}
                      >
                        {task.completed && <CheckCircle2 size={13} className="text-white stroke-[3px]" />}
                      </button>
                      <div className="space-y-1">
                        <p className={`text-xs font-black leading-snug transition-colors ${task.completed ? 'text-indigo-900 line-through' : 'text-slate-800'}`}>
                          {task.text}
                        </p>
                        <p className="text-[10.5px] leading-relaxed text-slate-500 font-semibold">{task.subtext}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-4 border-t border-slate-100 pt-3 flex justify-between items-center text-[10px]">
                <span className="font-mono text-slate-400">PHASE SCORE</span>
                <span className="font-mono font-bold text-slate-700">{catChecked} / {cat.tasks.length} ({catPercent}%)</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --- ChannelBoard ---
interface MixerChannel extends PatchChannel {
  faderLevel: number; // 0 to 100
  isMuted: boolean;
  isSoloed: boolean;
  signalMultiplier: number;
}

const CONSTANT_CHANNELS: MixerChannel[] = [
  { ch: 1, label: 'GD MAIN', gear: 'DPA 4066 (Headset)', processing: 'HPF 100Hz, Gate, Soft Comp', faderLevel: 80, isMuted: false, isSoloed: false, signalMultiplier: 1.0, description: 'Primary Microphone for Gurudev. Set gain to peak at -18dBFS. Apply parametric sweep EQ.' },
  { ch: 2, label: 'GD BKUP', gear: 'DPA 4066 (Backup Headset)', processing: 'Matched gain & EQ, Muted', faderLevel: 80, isMuted: true, isSoloed: false, signalMultiplier: 0.1, description: 'Emergency Redundancy Mic. Stays MUTED on the mixer main. Pre-fader auxes are unmuted. Ready to hot-swap in < 10 seconds if Ch 1 fails.' },
  { ch: 3, label: 'SINGER 1', gear: 'Sennheiser Handheld', processing: 'HPF 120Hz, Reverb Send', faderLevel: 65, isMuted: false, isSoloed: false, signalMultiplier: 0.7, description: 'Lead bhajan vocalist. Route separate aux send to Singer Monitor (Aux 2).' },
  { ch: 4, label: 'SINGER 2', gear: 'Shure Vocal mic', processing: 'HPF 120Hz, Low-mid cut', faderLevel: 60, isMuted: false, isSoloed: false, signalMultiplier: 0.6, description: 'Backing harmonium vocalist. Route separate aux send to singer wedge.' },
  { ch: 13, label: 'VID_L', gear: 'Radial Pro AV2 (DI box)', processing: 'Gain matched, high headroom', faderLevel: 70, isMuted: false, isSoloed: false, signalMultiplier: 0.5, description: 'Video playback audio Left. Routed from presentation computer through isolated active DI.' },
  { ch: 14, label: 'VID_R', gear: 'Radial Pro AV2 (DI box)', processing: 'Gain matched, high headroom', faderLevel: 70, isMuted: false, isSoloed: false, signalMultiplier: 0.5, description: 'Video playback audio Right. Essential for rich video soundtrack.' },
  { ch: 15, label: 'PB_L', gear: 'Radial J48 DI Box', processing: 'Stereo Left, matched fader', faderLevel: 75, isMuted: false, isSoloed: false, signalMultiplier: 0.8, description: 'Ambient music or backup track playback Left. Split dual DI.' },
  { ch: 16, label: 'PB_R', gear: 'Radial J48 DI Box', processing: 'Stereo Right, matched fader', faderLevel: 75, isMuted: false, isSoloed: false, signalMultiplier: 0.8, description: 'Ambient music or backup track playback Right. Kept adjacent to Left.' }
];

function ChannelBoard() {
  const [channels, setChannels] = useState<MixerChannel[]>(CONSTANT_CHANNELS);
  const [selectedCh, setSelectedCh] = useState<number>(1);
  const [dbVU, setDbVU] = useState<number[]>([12, 12, 22, 18, 5, 5, 14, 14]);
  const [isBackupEmergencyFlash, setIsBackupEmergencyFlash] = useState<boolean>(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setDbVU(prev => {
        return channels.map((ch, idx) => {
          if (ch.isMuted) return Math.max(0, Math.floor(Math.random() * 4));
          const base = ch.faderLevel * 0.3 * ch.signalMultiplier;
          const variance = Math.random() * 12 - 5;
          return Math.max(2, Math.min(30, Math.floor(base + variance)));
        });
      });
    }, 150);
    return () => clearInterval(timer);
  }, [channels]);

  const handleFaderChange = (chNum: number, newVal: number) => {
    setChannels(prev => prev.map(c => c.ch === chNum ? { ...c, faderLevel: newVal } : c));
  };

  const syncStereoPairFader = (chNum: number, level: number) => {
    handleFaderChange(chNum, level);
    if (chNum === 13) handleFaderChange(14, level);
    if (chNum === 14) handleFaderChange(13, level);
    if (chNum === 15) handleFaderChange(16, level);
    if (chNum === 16) handleFaderChange(15, level);
  };

  const toggleMute = (chNum: number) => {
    setChannels(prev => prev.map(c => c.ch === chNum ? { ...c, isMuted: !c.isMuted } : c));
  };

  const triggerEmergencyHandover = () => {
    setIsBackupEmergencyFlash(true);
    setChannels(prev => prev.map(c => {
      if (c.ch === 1) return { ...c, isMuted: true };
      if (c.ch === 2) return { ...c, isMuted: false };
      return c;
    }));
    setSelectedCh(2);
    setTimeout(() => { setIsBackupEmergencyFlash(false); }, 1200);
  };

  const resetBoard = () => {
    setChannels(CONSTANT_CHANNELS);
    setSelectedCh(1);
  };

  const currentSelected = channels.find(c => c.ch === selectedCh) || channels[0];

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none rotate-45"><Activity size={180} /></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Sliders size={18} className="text-indigo-400" />
              Standard Channel Allocation Mixer Board
            </h2>
            <p className="text-slate-400 text-xs mt-1 max-w-xl">
              An interactive simulation of standard operating procedures. Click a channel tape below to inspect standard hardware specs, EQ gating, and mute behaviors (critical for hot standby).
            </p>
          </div>
          <div className="flex gap-2 flex-wrap md:flex-nowrap">
            <button 
              onClick={triggerEmergencyHandover}
              className="px-4 py-2.5 bg-red-600 hover:bg-red-700 active:scale-95 text-xs font-bold rounded-md flex items-center gap-2 shadow-sm text-white transition-all cursor-pointer"
            >
              <AlertOctagon size={13} />
              Simulate Emergency GD Mic Failure!
            </button>
            <button 
              onClick={resetBoard}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-xs font-bold text-slate-300 rounded-md border border-slate-700 transition-all cursor-pointer"
            >
              Reset Board
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 bg-slate-950 border border-slate-900 rounded-2xl p-6 shadow-xl relative">
          <div className="flex justify-between items-center px-4 pb-6 border-b border-slate-900">
            <span className="text-[10px] uppercase font-mono font-bold tracking-[0.2em] text-slate-500">DIGITAL MIXER CHANNEL SCHEME</span>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[9px] font-mono tracking-widest text-slate-400 uppercase">FOH ONLINE v2.2</span>
            </div>
          </div>
          <div className="overflow-x-auto py-6 scrollbar-hide">
            <div className="flex justify-between min-w-[700px] gap-2 px-1">
              {channels.map((chan, idx) => {
                const isSelected = selectedCh === chan.ch;
                const signalVal = dbVU[idx] || 0;
                return (
                  <div 
                    key={chan.ch}
                    onClick={() => setSelectedCh(chan.ch)}
                    className={`flex flex-col items-center flex-1 rounded-2xl py-4 transition-all cursor-pointer ${
                      isSelected ? 'bg-slate-900/80 ring-2 ring-indigo-500/20 border border-slate-800' : 'bg-slate-950 hover:bg-slate-900/30 border border-transparent'
                    }`}
                  >
                    <span className="text-[10px] font-mono font-black text-slate-500 tracking-wider">
                      CH-{chan.ch.toString().padStart(2, '0')}
                    </span>
                    <div className="h-16 w-3.5 bg-slate-950 rounded-md my-4 flex flex-col justify-end p-0.5 border border-slate-900 gap-0.5 overflow-hidden">
                      {Array.from({ length: 10 }).map((_, segmentIdx) => {
                        const score = (10 - segmentIdx) * 3;
                        const isGlowing = signalVal >= score && !chan.isMuted;
                        let colorClass = 'bg-slate-800';
                        if (isGlowing) {
                          if (score > 18) colorClass = 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]';
                          else if (score > 12) colorClass = 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]';
                          else colorClass = 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]';
                        }
                        return <div key={segmentIdx} className={`w-full flex-1 rounded-sm transition-all duration-100 ${colorClass}`}></div>;
                      })}
                    </div>
                    <div className="space-y-2 mb-4">
                      <div className="w-5 h-5 rounded-full border-2 border-slate-800 bg-slate-900 flex items-center justify-center relative">
                        <div className="w-0.5 h-2 bg-slate-400 absolute top-0 rounded-full origin-bottom rotate-[40deg]"></div>
                      </div>
                      <div className="w-5 h-5 rounded-full border-2 border-slate-800 bg-slate-900 flex items-center justify-center relative">
                        <div className="w-0.5 h-2 bg-indigo-500 absolute top-0 rounded-full origin-bottom -rotate-[25deg]"></div>
                      </div>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); toggleMute(chan.ch); }}
                      className={`h-7 w-8 rounded-lg font-mono text-[9px] font-black border transition-all flex items-center justify-center flex-col cursor-pointer ${
                        chan.isMuted ? 'bg-red-500/20 text-red-500 border-red-500/40 shadow-[0_0_10px_rgba(239,68,68,0.1)]' : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-400'
                      }`}
                    >
                      <span>MUTE</span>
                    </button>
                    <div className="h-44 my-5 relative w-8 flex justify-center">
                      <div className="w-1 h-full bg-slate-950 rounded-full border border-slate-900 absolute top-0"></div>
                      <div 
                        className="absolute w-7 h-5 rounded-md cursor-ns-resize shadow-md flex flex-col justify-center gap-0.5 border border-slate-700 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 select-none z-10 text-[7px] text-slate-400 font-mono text-center font-bold"
                        style={{ bottom: `${chan.faderLevel * 0.85}%` }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          const track = e.currentTarget.parentElement;
                          if (!track) return;
                          const handleMove = (moveEvent: MouseEvent) => {
                            const rect = track.getBoundingClientRect();
                            const pos = ((rect.bottom - moveEvent.clientY) / rect.height) * 100;
                            const clamped = Math.max(0, Math.min(100, Math.floor(pos)));
                            if ([13,14,15,16].includes(chan.ch)) syncStereoPairFader(chan.ch, clamped);
                            else handleFaderChange(chan.ch, clamped);
                          };
                          const handleMouseUp = () => {
                            window.removeEventListener('mousemove', handleMove);
                            window.removeEventListener('mouseup', handleMouseUp);
                          };
                          window.addEventListener('mousemove', handleMove);
                          window.addEventListener('mouseup', handleMouseUp);
                        }}
                        onTouchStart={(e) => {
                          const track = e.currentTarget.parentElement;
                          if (!track) return;
                          const handleMove = (moveEv: TouchEvent) => {
                            const rect = track.getBoundingClientRect();
                            const clientY = moveEv.touches[0].clientY;
                            const pos = ((rect.bottom - clientY) / rect.height) * 100;
                            const clamped = Math.max(0, Math.min(100, Math.floor(pos)));
                            if ([13,14,15,16].includes(chan.ch)) syncStereoPairFader(chan.ch, clamped);
                            else handleFaderChange(chan.ch, clamped);
                          };
                          const handleTouchEnd = () => {
                            window.removeEventListener('touchmove', handleMove);
                            window.removeEventListener('touchend', handleTouchEnd);
                          };
                          window.addEventListener('touchmove', handleMove);
                          window.addEventListener('touchend', handleTouchEnd);
                        }}
                      >
                        <div className="w-5 h-[2px] bg-indigo-500 mx-auto rounded-full"></div>
                        <span className="text-[7px] font-mono leading-none select-none">
                          {Math.floor(chan.faderLevel * 0.1 - 10)}
                        </span>
                      </div>
                    </div>
                    <div className="w-11/12 mt-2">
                      <div className={`px-1 py-1.5 rounded text-center whitespace-nowrap overflow-hidden text-ellipsis font-mono text-[9px] font-bold ${
                        isSelected ? 'bg-indigo-600 text-white shadow-[0_0_10px_rgba(79,70,229,0.3)]' : chan.isMuted ? 'bg-red-950/40 text-red-400/80 border border-red-950' : 'bg-slate-900 text-slate-300'
                      }`}>
                        {chan.label}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="border-t border-slate-900 pt-5 flex justify-between items-center px-4">
            <span className="text-[9px] font-mono font-bold text-slate-500">STEREO L/R OUT & MATRIX FEEDS</span>
            <div className="flex gap-4">
              <span className="bg-slate-900 border border-slate-800 text-[9px] px-2.5 py-1 text-slate-400 rounded-md font-mono">
                AUX 1: GD MONITOR (PRE-FADER)
              </span>
              <span className="bg-slate-900 border border-slate-800 text-[9px] px-2.5 py-1 text-indigo-400 rounded-md font-mono">
                MATRIX OUT: ZOOM F6 (REC OUT)
              </span>
            </div>
          </div>
        </div>
        <div className="lg:col-span-4 self-stretch">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm h-full flex flex-col justify-between">
            <header className="border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Settings size={18} /></span>
                <div>
                  <h3 className="font-bold text-slate-900 text-[15px]">Patch Inspector</h3>
                  <p className="text-slate-400 text-[11px] font-medium leading-none mt-1">Standardized channel allocations</p>
                </div>
              </div>
            </header>
            <main className="flex-1 py-6 space-y-5">
              {isBackupEmergencyFlash && (
                <div className="animate-bounce bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3 text-red-800">
                  <div className="text-red-500 shrink-0"><AlertOctagon size={20} /></div>
                  <div className="text-xs">
                    <p className="font-black">Backup Route Active!</p>
                    <p className="font-medium text-red-600 mt-1">
                      MAIN (Ch 1) Muted. Redundant mic (Ch 2) instantly unmuted. Transition completed under 10 seconds.
                    </p>
                  </div>
                </div>
              )}
              <div className="space-y-4 text-left">
                <div>
                  <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block mb-1">DESIGNATED CHANNEL</label>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 bg-slate-950 font-mono text-xs font-bold text-indigo-400 rounded">
                      CH-{currentSelected.ch.toString().padStart(2, '0')}
                    </span>
                    <span className="text-lg font-black text-slate-800">{currentSelected.label}</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3 pt-2">
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                    <p className="text-[9px] font-mono font-bold text-slate-400">HARDWARE SOURCE & DI SPEC</p>
                    <p className="font-bold text-slate-800 text-xs mt-1 flex items-center gap-1.5">
                      <Cable size={14} className="text-slate-500" />
                      {currentSelected.gear}
                    </p>
                  </div>
                  <div className="p-3 bg-amber-50/40 border border-amber-100 rounded-xl">
                    <p className="text-[9px] font-mono font-bold text-amber-500">MANDATORY HPF & EQ SETTINGS</p>
                    <p className="font-extrabold text-amber-900 text-xs mt-1">
                      {currentSelected.processing}
                    </p>
                  </div>
                </div>
                <div className="pt-2">
                  <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block mb-1">OPERATIONAL PROCEDURE</label>
                  <p className="text-slate-600 text-xs leading-relaxed font-semibold">
                    {currentSelected.description}
                  </p>
                </div>
                {currentSelected.ch === 2 && (
                  <div className="p-3.5 bg-red-50/40 border border-red-100 rounded-xl text-[11px] text-red-700 leading-normal font-medium">
                    <span className="font-black block text-red-800 mb-1">🚨 REDUNDANCY BLUEPRINT:</span>
                    Maintain exact duplicate DPA 4066 receiver. Tape-labeled "BKUP GR". In digital mixers, save the pre-EQ channel matching profile. Stays completely muted during discourse until critical main mic power surge or capsule failure.
                  </div>
                )}
              </div>
            </main>
            <footer className="border-t border-slate-100 pt-4 flex gap-1.5 text-slate-400 items-start text-left">
              <HelpCircle className="shrink-0 mt-0.5" size={14} />
              <p className="text-[10px] text-slate-500 leading-snug font-medium">
                Drag the faders in the mixer to adjust volumes. Standardizing the channel layout enables seamless show-file loads across different cities.
              </p>
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 4. MAIN EXPORT COMPONENT
// ============================================================================

type TabType = 'flaws' | 'mixer' | 'matcher' | 'gear' | 'audit';

export default function AudioSetupVisualizer() {
  const [activeTab, setActiveTab] = useState<TabType>('flaws');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'flaws': return <FlawGuide />;
      case 'mixer': return <ChannelBoard />;
      case 'matcher': return <SetupBlueprints />;
      case 'gear': return <GearLibrary />;
      case 'audit': return <ComplianceAudit />;
      default: return <FlawGuide />;
    }
  };

  const tabsInfo = [
    { id: 'flaws', label: 'Flaw Analysis SOPs', icon: AlertTriangle, description: '12 deficit points' },
    { id: 'mixer', label: 'Virtual Soundboard', icon: Sliders, description: 'Std layout patching' },
    { id: 'matcher', label: 'Setup Grade Matcher', icon: LayoutTemplate, description: 'Hardware calculator' },
    { id: 'gear', label: 'Hardware Inventory', icon: Database, description: 'DI & headset advisories' },
    { id: 'audit', label: 'Quality Audit Drill', icon: ClipboardCheck, description: 'Site deployment checklist' },
  ];

  return (
    <div className="w-full">
      <nav className="bg-slate-100 border-b border-slate-200 px-4 sm:px-8 py-0 scrollbar-hide overflow-x-auto text-left">
        <div className="max-w-7xl mx-auto flex items-center gap-2">
          {tabsInfo.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`py-4 px-4 border-b-2 transition-all flex flex-col items-start gap-1 cursor-pointer whitespace-nowrap group ${
                  isActive 
                    ? 'border-indigo-600 text-indigo-600 bg-white/50' 
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                <div className="flex items-center gap-2">
                  <tab.icon size={15} className={isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-500'} />
                  <span className="text-[11px] font-bold uppercase tracking-widest">{tab.label}</span>
                </div>
                <span className="text-[9px] text-slate-400 font-semibold tracking-wide lowercase italic leading-none pl-6">
                  {tab.description}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            {renderTabContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
