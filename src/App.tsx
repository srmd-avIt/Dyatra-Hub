
import React, { useState, useEffect, useRef } from 'react';
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
  ArrowUpRight
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

const RecordDetailView = ({ item, columns, onBack, tableName }: { item: any, columns: string[], onBack: () => void, tableName: string }) => {
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
            <CardHeader className="bg-slate-50 border-b border-slate-100 p-8">
              <div className="text-[10px] font-black text-brand-primary uppercase tracking-[0.2em] mb-2">{tableName} Entry</div>
              <CardTitle className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-tight">
                {item["Event Name"] || item["Session Name"] || item["Track"] || item["Title"] || item["VideoTitle"] || item["Task"] || "Detail View"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid grid-cols-1 md:grid-cols-2">
                {columns.map((col, idx) => (
                  <div key={idx} className="p-6 border-b border-r border-slate-50 flex flex-col gap-1 hover:bg-slate-50/50 transition-colors">
                    {/* UPDATED LABEL COLOR: Changed from slate-900 to slate-400 for better hierarchy */}
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] mb-0.5">
                      {col}
                    </span>
                    
                    {/* UPDATED VALUE COLOR: Changed from slate-800 to slate-900 to stand out */}
                    <div className="text-[15px] font-bold text-slate-900 break-words leading-relaxed">
                      {(() => {
                        const val = item[col];
                        
                        // Special Rendering for "Imported table" Tags (Unchanged as requested)
                        if (col === "Imported table" && typeof val === 'string') {
                          return (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {val.split(',').map((tag, i) => (
                                <Badge key={i} className="bg-slate-100 text-slate-600 border border-slate-200 text-[10px] px-2 py-0.5 uppercase">
                                  {tag.trim()}
                                </Badge>
                              ))}
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
  const [activeTable, setActiveTable] = useState('Master Events');
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
      item["Imported table"]?.toLowerCase().includes(searchStr) || 
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
      baseCols = ['Event Name', 'DateFrom', 'DateTo', 'Occasion', 'City', 'Venue', 'Imported table', 'Year'];
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
const cellCls = "px-4 py-3 border-r border-b border-slate-400 text-slate-700 text-[13px] whitespace-nowrap overflow-hidden text-ellipsis text-center";
const titleCls = "px-4 py-3 border-r border-b border-slate-400 font-bold text-slate-900 text-[13px] uppercase truncate text-center";

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
          <td className={titleCls} style={cellStyle(cols[0])}>{item["Event Name"] || item.EventName || "Untitled Event"}</td>
          <td className={`${cellCls} font-mono`} style={cellStyle(cols[1])}>{item.DateFrom}</td>
          <td className={`${cellCls} font-mono`} style={cellStyle(cols[2])}>{item.DateTo}</td>
          <td className={cellCls} style={cellStyle(cols[3])}>
            <div className="flex flex-wrap gap-1">
              {item.Occasion && item.Occasion.split(',').map((tag: string, i: number) => (
                <Badge key={i} className="bg-blue-600 text-white border-none text-[12px] uppercase px-2 py-0.5">{tag.trim()}</Badge>
              ))}
            </div>
          </td>
          <td className={cellCls} style={cellStyle(cols[4])}>
            <div className="flex flex-wrap gap-1">
              {item.City && item.City.split(',').map((tag: string, i: number) => (
                <Badge key={i} className="bg-orange-500 text-white border-none text-[12px] uppercase px-2 py-0.5">{tag.trim()}</Badge>
              ))}
            </div>
          </td>
          <td className={cellCls} style={cellStyle(cols[5])}>{item.Venue}</td>
          <td className={cellCls} style={cellStyle(cols[6])}>
            <div className="flex flex-wrap gap-1.5">
              {item["Imported table"] && item["Imported table"].split(',').map((tag: string, i: number) => (
                <Badge key={i} className="bg-slate-100 text-slate-700 border border-slate-300 font-bold text-[12px] uppercase px-2 py-0.5 rounded shadow-sm">{tag.trim()}</Badge>
              ))}
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
          <td className={titleCls} style={cellStyle(cols[0])}>{item["Session Name"] || "Untitled Session"}</td>
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
          <td className={`${cellCls} font-mono text-brand-primary`} style={cellStyle(cols[0])}>{item["PlayID"]}</td>
          <td className={titleCls} style={cellStyle(cols[1])}>{item["Session"]}</td>
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
          <td className={`${cellCls} font-mono text-indigo-500`} style={cellStyle(cols[0])}>{item["VideoPlayId"]}</td>
          <td className={cellCls} style={cellStyle(cols[1])}>{item["Session"]}</td>
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
          <td className={`${cellCls} font-mono text-brand-primary`} style={cellStyle(cols[0])}>{item["LearningId"]}</td>
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
          <td className={`${cellCls} font-mono text-brand-primary`} style={cellStyle(cols[0])}>{item["LedId"]}</td>
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
          <td className={titleCls} style={cellStyle(cols[0])}>{item["Task"]}</td>
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
          <td className={titleCls} style={cellStyle(cols[0])}>{item["Sevak"]}</td>
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
          <td className={titleCls} style={cellStyle(cols[0])}>{item["Title"] || item.title }</td>
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
          <td className={titleCls} style={cellStyle(cols[0])}>{item.name || item.item || '-'}</td>
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
          <td className={titleCls} style={cellStyle(cols[0])}>{item.name || item.item || '-'}</td>
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
      const fetchData = async () => {
        try {
          const response = await window.fetch(`/api/${table}`);
          const data = await response.json();
          if (Array.isArray(data)) setter(data);
        } catch (error) {
          console.error(`Failed to fetch ${table}:`, error);
        }
      };
      
      fetchData();
      const interval = setInterval(fetchData, 5000); // Polling as a fallback
      return () => clearInterval(interval);
    };

    const eventsSub = setupSubscription('events', (data) => {
  setEvents(data);
  // Remove the auto-selection logic so it stays closed when you close it
});

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
      eventsSub();
      guidanceSub();
      sessionsSub();
      locationsSub();
      mediaSub();
      checklistSub();
      ledSub();
      rentalsSub();
      videoSetupSub();
      audioSetupSub();
    };
  }, [user, selectedEventId]);

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
          finalResult.push({ type: 'row', data: item, parentId: eventId, grandParentId: yearId });
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
      items.forEach(item => finalResult.push({ type: 'row', data: item, parentId: gid }));
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

  return (
    <>
      {cols.map((col, i) => (
        <td 
          key={i} 
          className="px-2 py-2 border-r border-b border-slate-400 bg-blue-50/50" 
          style={{ width: getWidth(col), minWidth: getWidth(col), maxWidth: getWidth(col) }}
        >
          <input
            autoFocus={i === 0}
            className="w-full h-8 bg-white border border-blue-300 rounded px-2 text-[12px] font-bold text-black placeholder:text-slate-400 focus:ring-2 focus:ring-brand-primary outline-none shadow-sm"
            placeholder={`Enter ${col}...`}
            value={inlineRecord[col] || ''}
            onChange={(e) => setInlineRecord({ ...inlineRecord, [col]: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleInlineSave();
              if (e.key === 'Escape') setIsInlineAdding(false);
            }}
          />
        </td>
      ))}
    </>
  );
};


const handleUpdateRecord = async () => {
  if (!editingId || !editDraft) return;

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
    const id = editDraft._id || editDraft.id;
    const response = await window.fetch(`/api/${collection}/${id}`, {
      method: 'PUT', // or 'PATCH' depending on your API
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editDraft)
    });

    if (response.ok) {
      setEditingId(null);
      setEditDraft(null);
      fetchAllData(); // Refresh the list
    } else {
      alert("Failed to update record");
    }
  } catch (error) {
    console.error("Update Error:", error);
  }
};

const renderEditInputs = (item: any) => {
  const cols = getTableColumns();
  const getWidth = (name: string) => colWidths[name] || 200;

  return (
    <>
      {cols.map((col, i) => (
        <td 
          key={i} 
          className="px-2 py-2 border-r border-b border-slate-400 bg-yellow-50/50" 
          style={{ width: getWidth(col), minWidth: getWidth(col), maxWidth: getWidth(col) }}
        >
          <input
            className="w-full h-8 bg-white border border-yellow-300 rounded px-2 text-[12px] font-bold text-black placeholder:text-slate-400 focus:ring-2 focus:ring-brand-primary outline-none shadow-sm"
            value={editDraft[col] || ''}
            onChange={(e) => setEditDraft({ ...editDraft, [col]: e.target.value })}
            onBlur={handleUpdateRecord} 
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleUpdateRecord();
              if (e.key === 'Escape') setEditingId(null);
            }}
          />
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
        className="w-full max-w-[480px] bg-white rounded-[48px] p-12 text-center shadow-[0_20px_60px_rgba(0,0,0,0.6)] relative z-10 overflow-hidden"
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
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">
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
    <div className="relative hidden xs:block">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-500" />
      <Input 
        placeholder="Search..." 
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="bg-brand-bg w-[120px] md:w-[180px] pl-8 h-9 text-xs"
      />
    </div>
  </div>

<div className="flex items-center justify-between w-full md:w-auto gap-1.5 md:gap-2">

    {/* 3. VIEW SWITCHER */}
  <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-300 h-8 items-center">
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
  <span className="text-xs font-semibold">Visual</span>
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
  <span className="text-xs font-semibold">Grid</span>
</Button>
  </div>

  
  {/* 1. CUSTOM ROUNDED GROUP BY */}
  <div className="relative">
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
  // ADDED: max-h-80, overflow-y-auto, and scrollbar-hide
  className="absolute top-full left-0 mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-y-auto max-h-80 scrollbar-hide py-2"
>
  <button 
    onClick={() => { setGroupByField(null); setIsGroupOpen(false); }}
    className="w-full text-left px-4 py-2.5 text-sm font-semibold text-slate-400 hover:bg-slate-50 uppercase"
  >
    No Grouping
  </button>

  {getTableColumns().map(col => (
    <button 
      key={col}
      onClick={() => { setGroupByField(col); setIsGroupOpen(false); }}
      className="w-full text-left px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-brand-primary hover:text-white uppercase transition-colors"
    >
      {col}
    </button>
  ))}
</motion.div>
      </>
    )}
  </AnimatePresence>
</div>

<div className="relative">
  <button 
    onClick={() => { setIsSortOpen(!isSortOpen); setIsGroupOpen(false); }}
    className="flex items-center bg-white border border-slate-300 rounded-xl px-4 h-10 shadow-sm hover:border-brand-primary/50 transition-all group min-w-[180px]"
  >
    <ArrowUpDown className="h-4 w-4 text-slate-500 mr-2 shrink-0" />

    <span className="text-xs font-bold text-slate-800 uppercase tracking-wide truncate mr-10">
      {sortBy ? `By ${sortBy.field}` : "No Sort"}
    </span>

    {/* Direction Toggle (slightly smaller) */}
    {sortBy && (
      <button 
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setSortBy({
            ...sortBy,
            direction: sortBy.direction === 'asc' ? 'desc' : 'asc'
          });
        }}
        className="absolute right-10 h-6 w-6 hover:bg-slate-100 rounded-md transition-colors flex items-center justify-center bg-white border border-slate-200 shadow-sm z-10"
      >
        <span className="text-xs text-brand-primary font-bold leading-none">
          {sortBy.direction === 'asc' ? '↑' : '↓'}
        </span>
      </button>
    )}

    <ChevronDown 
      className={`absolute right-3 h-4 w-4 text-slate-400 transition-transform ${
        isSortOpen ? 'rotate-180' : ''
      }`} 
    />
  </button>

  <AnimatePresence>
    {isSortOpen && (
      <>
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsSortOpen(false)} 
        />

       <motion.div 
  initial={{ opacity: 0, y: 5 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: 5 }}
  // ADDED: max-h-80, overflow-y-auto, and scrollbar-hide
  className="absolute top-full left-0 mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-y-auto max-h-80 scrollbar-hide py-2"
>
  <button 
    onClick={() => { 
      setSortBy(null); 
      setIsSortOpen(false); 
    }}
    className="w-full text-left px-4 py-2.5 text-sm font-semibold text-slate-400 hover:bg-slate-50 uppercase"
  >
    No Sort
  </button>

  {getTableColumns().map(col => (
    <button 
      key={col}
      onClick={() => { 
        setSortBy({ field: col, direction: 'asc' }); 
        setIsSortOpen(false); 
      }}
      className="w-full text-left px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-brand-primary hover:text-white uppercase transition-colors"
    >
      {col}
    </button>
  ))}
</motion.div>
      </>
    )}
  </AnimatePresence>
</div>
  {/* 4. NEW RECORD BUTTON */}
 <Button 
  onClick={() => {
    setInlineRecord({});
    setIsInlineAdding(true);
    // Scroll to bottom after state update
    setTimeout(() => {
      const container = document.querySelector('.overflow-auto');
      if (container) container.scrollTop = container.scrollHeight;
    }, 100);
  }} 
  className="bg-brand-primary hover:bg-brand-primary/90 text-white h-10 px-4 shadow-md flex items-center gap-2 transition-transform active:scale-95 ml-1"
>
  <Plus className="h-4 w-4" />
  <span className="hidden md:inline uppercase text-xs font-bold tracking-wide">
    Add Record
  </span>
</Button>

</div>
</header>

        <div className="flex-1 overflow-y-auto bg-brand-bg p-3 md:p-8">
          <div className="max-w-[1400px] mx-auto space-y-6 lg:space-y-8">
            
            {/* NEW: DETAIL VIEW VS LIST VIEW LOGIC */}
            {viewingRecord ? (
              <RecordDetailView 
                item={viewingRecord} 
                columns={getTableColumns()} 
                tableName={activeTable}
                onBack={() => setViewingRecord(null)} 
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
                  <div className="max-w-5xl mx-auto space-y-3 md:space-y-4 py-4 md:py-6">
                    {filteredData.map((item: any) => (
                      <motion.div key={item.id || item._id} onClick={() => setViewingRecord(item)} className="flex items-center gap-3 md:gap-6 bg-brand-surface border border-slate-800/90 rounded-xl md:rounded-2xl p-3 md:p-5 shadow-xl cursor-pointer">
                        <div className="h-10 w-10 md:h-12 md:w-12 bg-brand-primary/10 rounded-lg md:rounded-xl flex items-center justify-center text-brand-primary shrink-0">
                        {activeTable === 'MusicLog' ? <Music className="h-5 md:h-6 w-5 md:w-6" /> : <Video className="h-5 md:h-6 w-5 md:w-6" />}
                      </div>
                       <div className="flex-1 min-w-0">
                        <h3 className="text-sm md:text-lg font-black text-brand-text-main uppercase truncate leading-tight">
                          {item["Track"] || item["VideoTitle"] || "Untitled"}
                        </h3>
                        {/* Metadata: Wraps nicely on small screens */}
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-[8px] md:text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                          <span className="truncate max-w-[80px] md:max-w-none">{item["Parent Event (from Session)"] || "UNASSIGNED"}</span>
                          <span className="opacity-30">•</span>
                          <span className="text-brand-primary/80">{item["Cue"] || item["Occasion (from Session)"]}</span>
                          <span className="opacity-30 hidden xs:inline">•</span>
                          <div className="flex items-center gap-1"><Clock className="h-2.5 w-2.5" /> {item["PlayedAt"] || item["TimeOfDay (from Session)"]}</div>
                        </div>
                      </div>
                        <div className="hidden xs:block bg-brand-bg border border-brand-border px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl shrink-0">
                        <span className="text-[9px] md:text-[10px] font-mono font-black text-brand-primary">#{item["PlayID"] || item["VideoPlayId"]}</span>
                      </div>
                      </motion.div>
                    ))}
                      <Button onClick={openAddModal} className="w-full border-2 border-dashed border-slate-700 h-16 rounded-2xl text-slate-500 hover:text-brand-primary hover:border-brand-primary bg-slate-900/10 transition-all uppercase text-[10px] font-black tracking-widest"><Plus className="h-5 w-5 mr-2" /> New Music Entry</Button>
                    </div>
                  ) :  activeTable === 'VideoLog' ? (
                  /* --- VIDEO LOG UNIQUE VIEW --- */
                  <div className="max-w-5xl mx-auto space-y-4 py-6">
                    {filteredData.map((item: any) => (
                      <motion.div key={item.id || item._id} onClick={() => setViewingRecord(item)} whileHover={{ scale: 1.005 }} className="flex items-center gap-6 bg-brand-surface border border-slate-800/90 rounded-2xl p-5 shadow-xl shadow-black/5 transition-all group cursor-pointer">
                        <div className="h-12 w-12 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 border border-indigo-500/20 shrink-0">
                          <Video className="h-6 w-6" />
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-center text-left">
                          {/* VIDEO TITLE */}
                          <h3 className="text-lg font-black text-brand-text-main uppercase tracking-tight truncate w-full leading-tight">
                            {item["VideoTitle"] || "Untitled Video"}
                          </h3>
                          <div className="flex items-center gap-2 mt-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest flex-wrap">
                            {/* PARENT EVENT NAME */}
                            <span className="text-slate-400">{item["Parent Event (from Session)"] || item["Session"] || "UNASSIGNED"}</span>
                            <span className="opacity-30 text-slate-600">•</span>
                            {/* OCCASION TAG */}
                            <span className="text-indigo-400 font-black">{item["Occasion (from Session)"] || "OPENING"}</span>
                            <span className="opacity-30 text-slate-600">•</span>
                            {/* TIME OF DAY */}
                            <div className="flex items-center gap-1.5 text-slate-400">
                              <Clock className="h-3 w-3" />
                              {item["TimeOfDay (from Session)"] || "00:00:00 AM"}
                            </div>
                          </div>
                        </div>
                        {/* PlayID Badge (Light) */}
                        <div className="bg-brand-bg border border-brand-border px-4 py-2 rounded-xl shadow-inner min-w-[50px] text-center shrink-0">
                          <span className="text-[10px] font-mono font-black text-indigo-500">#{item["VideoPlayId"] || "1"}</span>
                        </div>
                      </motion.div>
                    ))}
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
               <div className="bg-white border border-slate-400 rounded-xl overflow-hidden shadow-lg flex flex-col h-[calc(100vh-200px)]">
                  <div className="md:hidden bg-blue-50 text-[10px] text-center py-1 text-blue-600 font-bold uppercase">
                    ← Scroll horizontally to see all columns →
                  </div>
                  <div className="overflow-auto thin-scrollbar flex-1 bg-white">
                    <table 
                      className="border-collapse text-left text-[11px] table-fixed" 
                      style={{ width: 'max-content' }} 
                    >
         <thead className="sticky top-0 z-30 bg-slate-100 shadow-sm">
  <tr>
    <th className="w-12 border-r border-b border-slate-400 px-2 py-3 bg-slate-200/50 text-center sticky left-0 z-40">
      <span className="text-[10px] font-black text-slate-500">#</span>
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
      className={`border-r border-b border-slate-400 p-0 font-black uppercase tracking-wider overflow-hidden select-none transition-colors group/header ${isSorted ? 'bg-slate-200 text-brand-primary' : 'bg-slate-100 text-slate-700'}`}
    >
      {editingHeader?.index === i ? (
        <input
          autoFocus
          className="w-full h-full px-4 py-3 bg-white text-brand-primary outline-none border-none font-black uppercase text-[11px]"
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
        <tr key={row.id} className="bg-slate-50/80 border-b border-slate-300 sticky z-10 cursor-pointer" style={{ top: '37px' }} onClick={() => toggleGroup(row.id)}>
          <td className="border-r border-slate-300 text-center w-12 bg-slate-100">
             <div className="flex justify-center items-center h-full">
               {!isCollapsed ? <ChevronDown className="h-4 w-4 text-slate-900" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
             </div>
          </td>
          <td colSpan={getTableColumns().length} className="px-4 py-2.5">
            <div className="flex items-center gap-3" style={{ paddingLeft: row.level === 2 ? '24px' : '0px' }}>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{row.label}:</span>
              <Badge style={{ backgroundColor: row.color, color: 'black' }} className="border-none font-black text-[11px] px-3 py-1 rounded-md uppercase">
                {row.value}
              </Badge>
              <span className="text-slate-400 font-bold text-[10px]">({row.count})</span>
            </div>
          </td>
        </tr>
      );
    }

    // C. RENDER DATA ROWS
 return (
  <tr 
    key={row.data?._id || row.data?.id || idx} 
    className={`group transition-colors border-b border-slate-200 ${isEditing ? 'bg-yellow-50/30' : 'hover:bg-blue-50/40 cursor-pointer'}`}
    // Click anywhere on the row to start editing
    onClick={() => {
      if (!isEditing) {
        setEditingId(row.data?._id || row.data?.id);
        setEditDraft({...row.data});
      }
    }}
  >
    <td className="w-12 border-r border-slate-200 text-center text-slate-400 font-mono text-[10px] bg-slate-50/20 sticky left-0 z-20">
      {isEditing ? (
        <div className="flex flex-col gap-1 items-center py-1">
          <button onClick={(e) => { e.stopPropagation(); handleUpdateRecord(); }} className="text-green-600">
            <CheckSquare className="h-4 w-4" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); setEditingId(null); }} className="text-red-500">
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <span>{idx + 1}</span>
      )}
    </td>
        
        {isEditing ? (
          renderEditInputs(row.data)
        ) : (
          <div className="contents" onClick={() => {
            setEditingId(row.data?._id || row.data?.id);
            setEditDraft({...row.data});
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
                  <div className="bg-slate-100 border-t border-slate-400 px-6 py-2 flex items-center justify-between text-[10px] text-slate-600 font-black uppercase tracking-widest z-20">
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
            )} {/* THIS CLOSES THE viewingRecord TERNARY */}
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
          
          <div className="flex-1 overflow-y-auto p-8 pt-6 space-y-8 thin-scrollbar">
  <div className="space-y-6">
    {/* EVENTS FIELDS */}
    {activeTable === 'Events' && (
  <div className="space-y-4">
    <div className="grid grid-cols-2 gap-4">
      <Input value={newRecord.name || ''} onChange={(e) => setNewRecord({...newRecord, name: e.target.value})} placeholder="Event Name" className="bg-brand-bg" />
      <Input value={newRecord.occasion || ''} onChange={(e) => setNewRecord({...newRecord, occasion: e.target.value})} placeholder="Occasion" className="bg-brand-bg" />
    </div>
    <div className="grid grid-cols-2 gap-4">
      <Input type="date" value={newRecord.dateFrom || ''} onChange={(e) => setNewRecord({...newRecord, dateFrom: e.target.value})} placeholder="Date From" className="bg-brand-bg" />
      <Input type="date" value={newRecord.dateTo || ''} onChange={(e) => setNewRecord({...newRecord, dateTo: e.target.value})} placeholder="Date To" className="bg-brand-bg" />
    </div>
    <div className="grid grid-cols-2 gap-4">
      <Input value={newRecord.city || ''} onChange={(e) => setNewRecord({...newRecord, city: e.target.value})} placeholder="City" className="bg-brand-bg" />
      <Input value={newRecord.venue || ''} onChange={(e) => setNewRecord({...newRecord, venue: e.target.value})} placeholder="Venue" className="bg-brand-bg" />
    </div>
    <div className="grid grid-cols-2 gap-4">
      <Input value={newRecord.importedTable || ''} onChange={(e) => setNewRecord({...newRecord, importedTable: e.target.value})} placeholder="Imported Table Name" className="bg-brand-bg" />
      <Input value={newRecord.year || ''} onChange={(e) => setNewRecord({...newRecord, year: e.target.value})} placeholder="Year" className="bg-brand-bg" />
    </div>
  </div>
)}
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

    <div className="grid grid-cols-3 gap-4">
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

    <div className="grid grid-cols-3 gap-4">
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
        <Input value={newRecord.session || ''} onChange={(e) => setNewRecord({...newRecord, session: e.target.value})} placeholder="Session Name" className="bg-brand-bg h-9 text-xs" />
        <Input value={newRecord.parentEvent || ''} onChange={(e) => setNewRecord({...newRecord, parentEvent: e.target.value})} placeholder="Parent Event" className="bg-brand-bg h-9 text-xs" />
        <Input value={newRecord.date || ''} onChange={(e) => setNewRecord({...newRecord, date: e.target.value})} placeholder="Date" className="bg-brand-bg h-9 text-xs" />
        <Input value={newRecord.timeOfDay || ''} onChange={(e) => setNewRecord({...newRecord, timeOfDay: e.target.value})} placeholder="Time of Day" className="bg-brand-bg h-9 text-xs" />
        <Input value={newRecord.occasion || ''} onChange={(e) => setNewRecord({...newRecord, occasion: e.target.value})} placeholder="Occasion" className="bg-brand-bg h-9 text-xs" />
      </div>
    </div>

    <div className="p-3 bg-brand-accent/5 border border-brand-accent/10 rounded-lg">
      <p className="text-[9px] font-black uppercase tracking-widest text-brand-accent mb-3">Track & Performance Details</p>
      <div className="grid grid-cols-3 gap-3">
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
        <Input value={newRecord.session || ''} onChange={(e) => setNewRecord({...newRecord, session: e.target.value})} placeholder="Session Name" className="bg-brand-bg h-9 text-xs" />
        <Input value={newRecord.date || ''} onChange={(e) => setNewRecord({...newRecord, date: e.target.value})} placeholder="Date" className="bg-brand-bg h-9 text-xs" />
        <Input value={newRecord.city || ''} onChange={(e) => setNewRecord({...newRecord, city: e.target.value})} placeholder="City" className="bg-brand-bg h-9 text-xs" />
        <Input value={newRecord.venue || ''} onChange={(e) => setNewRecord({...newRecord, venue: e.target.value})} placeholder="Venue" className="bg-brand-bg h-9 text-xs" />
        <Input value={newRecord.parentEvent || ''} onChange={(e) => setNewRecord({...newRecord, parentEvent: e.target.value})} placeholder="Parent Event" className="bg-brand-bg h-9 text-xs" />
      </div>
    </div>
    <div className="p-3 bg-brand-accent/5 border border-brand-accent/10 rounded-lg">
      <p className="text-[9px] font-black uppercase tracking-widest text-brand-accent mb-3">Video Details</p>
      <div className="grid grid-cols-3 gap-3">
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
    <div className="grid grid-cols-3 gap-4">
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
    </div>

  );
}