
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
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
  Menu,
  X,
  Star,
  Zap,
  PanelLeftClose,
  PanelLeftOpen,
  Inbox,
  AtSign,
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
  Send,
  MessageCircle,
  Filter,
  Check,
  Maximize2,
  Eye,
  EyeOff,
  AlignLeft,
  Hash,
  List,
  Mail,
  Link2,
  Phone,
  Settings2,
  Download,
  Trash2,
  Pencil,
  GripVertical,
  Share2,
  Volume2,
  Film,
  Paperclip,
  Users,
  UserPlus,
  Shield,
  UserCog,
  UserCheck,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const TAG_COLORS = [
  "bg-indigo-500/20 text-indigo-900 border-indigo-500/30 dark:text-indigo-200",
  
  "bg-cyan-500/20 text-cyan-800 border-cyan-500/30 dark:text-cyan-200",
  "bg-teal-500/20 text-teal-800 border-teal-500/30 dark:text-teal-200",
  "bg-emerald-500/20 text-emerald-800 border-emerald-500/30 dark:text-emerald-200",
  "bg-green-500/20 text-green-800 border-green-500/30 dark:text-green-200",
  "bg-lime-500/20 text-lime-800 border-lime-500/30 dark:text-lime-200",
  "bg-yellow-500/20 text-yellow-800 border-yellow-500/30 dark:text-yellow-200",
  "bg-orange-500/20 text-orange-800 border-orange-500/30 dark:text-orange-200",
  "bg-red-500/20 text-red-800 border-red-500/30 dark:text-red-200",
  "bg-pink-500/20 text-pink-800 border-pink-500/30 dark:text-pink-200",
  "bg-fuchsia-500/20 text-fuchsia-800 border-fuchsia-500/30 dark:text-fuchsia-200",
  "bg-purple-500/20 text-purple-800 border-purple-500/30 dark:text-purple-200",
  "bg-violet-500/20 text-violet-800 border-violet-500/30 dark:text-violet-200",
  "bg-stone-500/20 text-stone-800 border-stone-500/30 dark:text-stone-200",
];
// Helper to consistently assign a color to a string
const STATUS_STYLE: Record<string, string> = {
  'Ready':       'bg-green-100 text-green-700 border-green-200',
  'Done':        'bg-green-100 text-green-700 border-green-200',
  'Complete':    'bg-green-100 text-green-700 border-green-200',
  'Completed':   'bg-green-100 text-green-700 border-green-200',
  'Pending':     'bg-yellow-100 text-yellow-700 border-yellow-200',
  'In Progress': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  'In Review':   'bg-yellow-100 text-yellow-700 border-yellow-200',
  'To Do':       'bg-slate-100 text-slate-600 border-slate-200',
  'Not Started': 'bg-slate-100 text-slate-600 border-slate-200',
  'Blocked':     'bg-red-100 text-red-700 border-red-200',
  'Cancelled':   'bg-red-100 text-red-700 border-red-200',
};

const getTagStyle = (val: any) => {
  if (val === null || val === undefined || val === '') {
    return "px-2.5 py-0.5 rounded-md border font-bold text-[12px] bg-slate-900 text-slate-500 border-slate-800 shadow-sm";
  }

  const str = String(val);
  const base = 'px-2.5 py-1 rounded-md border font-bold text-[12px] tracking-tight whitespace-nowrap inline-block shadow-sm';

  if (STATUS_STYLE[str]) return `${base} ${STATUS_STYLE[str]}`;

  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash;
  }
  const index = Math.abs(hash) % TAG_COLORS.length;
  return [base, TAG_COLORS[index]].join(' ');
};

const ALL_TABLES = ['Events', 'Session', 'MusicLog', 'VideoLog', 'Tracks', 'DyatraChecklist', 'Guidance & Learning', 'LED', 'DataSharing', 'VideoSetup', 'AudioSetup'];

// RBAC Permission Checker
const hasPerm = (user: any, table: string, action: 'view' | 'add' | 'edit' | 'delete') => {
  if (!user) return false;
  if (user.role === 'admin' || user.role === 'owner') return true;
  if (table === 'Home') return true; // All users can see the Home dashboard.
  if (table === 'UserManagement') return false; // Only admins/owners can see this, which is handled by the rule above.

  if (user.permissions && user.permissions[table]) {
    return !!user.permissions[table][action];
  }
  if (user.role === 'guest') return action === 'view'; // Guests view-only by default
  return false; // Deny by default. If no permissions are set for a user/table, they can't access it.
};

// Admin Dashboard Component
const UserManagement = React.memo(function UserManagement({ currentUser, onToast }: { currentUser: any, onToast: (m: string, t?: 'error'|'success') => void }) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editDraft, setEditDraft] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [userSortBy, setUserSortBy] = useState<{ field: string; direction: 'asc' | 'desc' } | null>(null);
  const [userGroupBy, setUserGroupBy] = useState<string | null>(null);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isGroupOpen, setIsGroupOpen] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<string[]>([]);

  const fetchUsers = async () => {
    try {
      const res = await window.fetch('/api/users');
      if (res.ok) setUsers(await res.json());
    } catch (e) {
      onToast('Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []); // eslint-disable-line

  const handleSave = async () => {
    if (!editDraft.email || !editDraft.name || !editDraft.role) {
      onToast('Please fill out all required fields', 'error');
      return;
    }
    setIsSubmitting(true);
    const isNew = !editDraft._id;
    try {
      const method = isNew ? 'POST' : 'PUT';
      const url = isNew ? '/api/users' : `/api/users/${editDraft._id}`;
      const res = await window.fetch(url, {
        method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editDraft)
      });
      if (res.ok) {
        onToast(`User ${isNew ? 'added' : 'updated'} successfully`, 'success');
        setIsModalOpen(false);
        fetchUsers();
      } else {
        const errData = await res.json().catch(() => ({}));
        onToast(errData.error || 'Failed to save user', 'error');
      }
    } catch (e) {
      onToast('Network error', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleGroup = (group: string) => {
    setCollapsedGroups(prev => prev.includes(group) ? prev.filter(g => g !== group) : [...prev, group]);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this user?")) return;
    try {
      const res = await window.fetch(`/api/users/${id}`, { method: 'DELETE' });
      if (res.ok) {
        onToast('User deleted', 'success');
        setUsers(prev => prev.filter(u => u._id !== id));
      }
    } catch (e) {
      onToast('Failed to delete user', 'error');
    }
  };

  const togglePermission = (table: string, action: 'view' | 'add' | 'edit' | 'delete') => {
    const perms = editDraft.permissions || {};
    const tablePerms = perms[table] || { view: false, add: false, edit: false, delete: false };
    setEditDraft({ ...editDraft, permissions: { ...perms, [table]: { ...tablePerms, [action]: !tablePerms[action] } } });
  };

  const admins = users.filter(u => ['admin', 'owner'].includes(u.role)).length;
  const standard = users.filter(u => u.role === 'user').length;
  const guests = users.filter(u => u.role === 'guest').length;

  const filteredUsers = useMemo(() => {
    const filtered = users.filter(u => 
      (u.name || '').toLowerCase().includes(userSearch.toLowerCase()) || 
      (u.email || '').toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.role || '').toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.department || '').toLowerCase().includes(userSearch.toLowerCase())
    );
    
    if (userSortBy) {
      filtered.sort((a, b) => {
        let valA = a[userSortBy.field] || '';
        let valB = b[userSortBy.field] || '';
        
        if (userSortBy.field === 'created_at') {
          valA = new Date(valA).getTime();
          valB = new Date(valB).getTime();
          return userSortBy.direction === 'asc' ? valA - valB : valB - valA;
        }
        
        const cmp = String(valA).localeCompare(String(valB));
        return userSortBy.direction === 'asc' ? cmp : -cmp;
      });
    } else {
      const rolePriority: Record<string, number> = { owner: 1, admin: 2, user: 3, guest: 4 };
      filtered.sort((a, b) => {
        const rankA = rolePriority[a.role] || 99;
        const rankB = rolePriority[b.role] || 99;
        if (rankA !== rankB) return rankA - rankB;
        return (a.name || '').localeCompare(b.name || '');
      });
    }
    return filtered;
  }, [users, userSearch, userSortBy]);

  const groupedUsers = useMemo(() => {
    if (!userGroupBy) return null;
    const groups: Record<string, any[]> = {};
    filteredUsers.forEach(u => {
      const key = u[userGroupBy] || 'unspecified';
      if (!groups[key]) groups[key] = [];
      groups[key].push(u);
    });
    return groups;
  }, [filteredUsers, userGroupBy]);

  const renderUserRow = (u: any) => (
    <tr key={u._id} className="hover:bg-slate-50/50 transition-colors">
      <td className="px-5 py-3">
        <div className="flex items-center gap-3"><div className="h-8 w-8 rounded-lg bg-gradient-to-br from-brand-primary to-brand-primary/60 flex items-center justify-center text-white font-black shrink-0">{(u.name || u.email || '?')[0].toUpperCase()}</div><div><div className="font-bold text-slate-900 text-[13px]">{u.name}</div><div className="text-slate-500 text-[11px]">{u.email}</div></div></div>
      </td>
      <td className="px-5 py-3">{u.department ? <span className="px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-widest bg-blue-100 text-blue-700">{u.department}</span> : <span className="font-semibold text-[12px] text-slate-400">—</span>}</td>
      <td className="px-5 py-3"><span className={`px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-widest ${u.role === 'admin' || u.role === 'owner' ? 'bg-violet-100 text-violet-700' : u.role === 'user' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>{u.role || 'user'}</span></td>
      <td className="px-5 py-3 font-mono text-slate-500">{u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}</td>
      <td className="px-5 py-3 text-right">
        <div className="flex justify-end gap-2"><button onClick={() => { setEditDraft(u); setIsModalOpen(true); }} className="p-1.5 rounded-lg text-slate-400 hover:text-brand-primary hover:bg-brand-primary/10 transition-colors"><Pencil className="h-4 w-4" /></button>{u.email !== currentUser?.email && <button onClick={() => handleDelete(u._id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"><Trash2 className="h-4 w-4" /></button>}</div>
      </td>
    </tr>
  );

  return (
    <div className="p-4 sm:p-8 max-w-[1400px] mx-auto space-y-6 w-full pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900">User <span className="text-brand-primary">Management</span></h2>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-1">Manage team access and roles</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* GROUP BY */}
          <div className="relative">
            <button onClick={() => { setIsGroupOpen(!isGroupOpen); setIsSortOpen(false); }} className="flex items-center bg-white border border-slate-200 rounded-xl px-3 h-10 shadow-sm hover:border-brand-primary/50 transition-all text-xs font-bold text-slate-700">
              <Layers className="h-4 w-4 sm:mr-2 text-slate-500 shrink-0" />
              <span className="hidden sm:inline">{userGroupBy ? `Group: ${userGroupBy}` : "No Grouping"}</span>
              <ChevronDown className={`ml-1 sm:ml-2 h-4 w-4 text-slate-400 transition-transform shrink-0 ${isGroupOpen ? 'rotate-180' : ''}`} />
            </button>
            {isGroupOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsGroupOpen(false)} />
                <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-2">
                  <button onClick={() => { setUserGroupBy(null); setIsGroupOpen(false); }} className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50">No Grouping</button>
                  <button onClick={() => { setUserGroupBy('role'); setIsGroupOpen(false); }} className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-brand-primary hover:text-white uppercase">Role</button>
                  <button onClick={() => { setUserGroupBy('department'); setIsGroupOpen(false); }} className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-brand-primary hover:text-white uppercase">Department</button>
                </div>
              </>
            )}
          </div>
          
          {/* SORT BY */}
          <div className="relative">
            <button onClick={() => { setIsSortOpen(!isSortOpen); setIsGroupOpen(false); }} className="flex items-center bg-white border border-slate-200 rounded-xl px-3 h-10 shadow-sm hover:border-brand-primary/50 transition-all text-xs font-bold text-slate-700">
              <ArrowUpDown className="h-4 w-4 sm:mr-2 text-slate-500 shrink-0" />
              <span className="hidden sm:inline">{userSortBy ? `Sort: ${userSortBy.field.replace('_', ' ')}` : "No Sort"}</span>
              <ChevronDown className={`ml-1 sm:ml-2 h-4 w-4 text-slate-400 transition-transform shrink-0 ${isSortOpen ? 'rotate-180' : ''}`} />
            </button>
            {isSortOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsSortOpen(false)} />
                <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-2">
                  <button onClick={() => { setUserSortBy(null); setIsSortOpen(false); }} className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50">No Sort</button>
                  {['name', 'email', 'department', 'role', 'created_at'].map(f => (
                    <button key={f} onClick={() => { setUserSortBy({ field: f, direction: userSortBy?.field === f && userSortBy.direction === 'asc' ? 'desc' : 'asc' }); setIsSortOpen(false); }} className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-brand-primary hover:text-white flex justify-between uppercase">
                      {f.replace('_', ' ')} {userSortBy?.field === f && <span className="opacity-70">{userSortBy.direction === 'asc' ? '↑' : '↓'}</span>}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search users..." 
              value={userSearch} 
              onChange={e => setUserSearch(e.target.value)} 
              className="pl-9 h-10 w-[200px] bg-white border-slate-200"
            />
          </div>
          <Button onClick={() => { 
            const defaultPerms: any = {};
            ALL_TABLES.forEach(t => { defaultPerms[t] = { view: true, add: true, edit: true, delete: false }; });
            setEditDraft({ role: 'user', permissions: defaultPerms }); 
            setIsModalOpen(true); 
          }} className="bg-brand-primary text-white hover:bg-brand-primary/90 font-bold uppercase text-[11px] tracking-widest rounded-xl h-10 px-5 shadow-lg shadow-brand-primary/20">
            <UserPlus className="h-4 w-4 mr-2" /> Add User
          </Button>
        </div>
      </div>

      <div className="sm:hidden relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input 
          placeholder="Search users..." 
          value={userSearch} 
          onChange={e => setUserSearch(e.target.value)} 
          className="pl-9 h-10 w-full bg-white border-slate-200"
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Users', value: users.length, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Admins', value: admins, icon: Shield, color: 'text-violet-600', bg: 'bg-violet-50' },
          { label: 'Standard', value: standard, icon: UserCog, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Guests', value: guests, icon: UserCheck, color: 'text-slate-600', bg: 'bg-slate-100' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-4 flex flex-col shadow-sm border border-slate-200/50`}>
            <s.icon className={`h-5 w-5 mb-2 ${s.color} opacity-80`} />
            <div className={`text-3xl font-black ${s.color} leading-none`}>{s.value}</div>
            <div className="text-[10px] font-black text-slate-700 mt-1.5 uppercase tracking-wider">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {loading ? <div className="p-8 text-center text-slate-400 text-sm font-bold uppercase tracking-widest animate-pulse">Loading users...</div> : (
          <div className="overflow-auto scrollbar-hide max-h-[65vh]"><table className="w-full text-left text-[12px]"><thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-widest text-[9px] sticky top-0 z-10 shadow-[0_1px_0_0_#e2e8f0]"><tr><th className="px-5 py-3 bg-slate-50">User</th><th className="px-5 py-3 bg-slate-50">Department</th><th className="px-5 py-3 bg-slate-50">Role</th><th className="px-5 py-3 bg-slate-50">Joined</th><th className="px-5 py-3 text-right bg-slate-50">Actions</th></tr></thead><tbody className="divide-y divide-slate-100">
            {filteredUsers.length === 0 ? <tr><td colSpan={5} className="px-5 py-8 text-center text-slate-400 italic">No users found</td></tr> : (
              groupedUsers ? (
                Object.entries(groupedUsers).map(([group, usersInGroup]) => {
                  const isCollapsed = collapsedGroups.includes(group);
                  return (
                    <React.Fragment key={group}>
                      <tr className="bg-slate-100/50 border-y border-slate-200 cursor-pointer hover:bg-slate-200/50 transition-colors" onClick={() => toggleGroup(group)}>
                        <td colSpan={5} className="px-5 py-2">
                          <div className="flex items-center gap-1.5 font-black text-[10px] text-slate-600 uppercase tracking-widest">
                            {isCollapsed ? <ChevronRight className="h-3.5 w-3.5 shrink-0" /> : <ChevronDown className="h-3.5 w-3.5 shrink-0" />}
                            {group} <span className="text-brand-primary">({usersInGroup.length})</span>
                          </div>
                        </td>
                      </tr>
                      {!isCollapsed && usersInGroup.map(renderUserRow)}
                    </React.Fragment>
                  );
                })
              ) : (
                filteredUsers.map(renderUserRow)
              )
            )}
          </tbody></table></div>
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-white border-none p-0 overflow-hidden flex flex-col max-h-[90vh] sm:max-w-[700px] rounded-[24px] shadow-2xl">
          <div className="p-5 sm:p-6 border-b border-slate-100 bg-slate-50 shrink-0"><h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">{editDraft._id ? 'Edit User' : 'Add User'}</h3></div>
          <div className="p-5 sm:p-6 flex-1 overflow-y-auto thin-scrollbar space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5"><label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Name</label><Input value={editDraft.name || ''} onChange={e => setEditDraft({...editDraft, name: e.target.value})} className="bg-slate-50 h-10" placeholder="Full name" /></div>
              <div className="space-y-1.5"><label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Email</label><Input value={editDraft.email || ''} onChange={e => setEditDraft({...editDraft, email: e.target.value})} className="bg-slate-50 h-10" placeholder="Email address" type="email" disabled={!!editDraft._id} /></div>
              <div className="space-y-1.5"><label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Department</label><Input value={editDraft.department || ''} onChange={e => setEditDraft({...editDraft, department: e.target.value})} className="bg-slate-50 h-10" placeholder="Department" /></div>
              <div className="space-y-1.5"><label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Role</label><select className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-[13px] font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-brand-primary/30" value={editDraft.role || 'user'} onChange={e => {
                const r = e.target.value;
                const perms = { ...(editDraft.permissions || {}) };
                if (r === 'user') {
                  ALL_TABLES.forEach(t => { perms[t] = { view: true, add: true, edit: true, delete: false }; });
                } else if (r === 'guest') {
                  ALL_TABLES.forEach(t => { perms[t] = { view: true, add: false, edit: false, delete: false }; });
                }
                setEditDraft({...editDraft, role: r, permissions: perms});
              }}><option value="user">Standard User</option><option value="guest">Guest (Read-only default)</option><option value="admin">Admin (Full Access)</option>{currentUser?.role === 'owner' && <option value="owner">Owner</option>}</select></div>
            </div>
            {(!['admin', 'owner'].includes(editDraft.role)) && (
              <div className="space-y-3"><div className="flex items-center justify-between"><label className="text-[10px] font-black uppercase tracking-[0.15em] text-brand-primary">Table Permissions</label><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Toggle access</p></div><div className="border border-slate-200 rounded-xl overflow-hidden text-[11px] font-semibold text-slate-700"><div className="grid grid-cols-5 bg-slate-50 border-b border-slate-200 p-3 font-black text-slate-500 uppercase tracking-widest text-[9px] text-center"><div className="text-left">Table</div><div>View</div><div>Add</div><div>Edit</div><div>Delete</div></div><div className="divide-y divide-slate-100">{ALL_TABLES.map(t => { const p = editDraft.permissions?.[t] || { view: false, add: false, edit: false, delete: false }; return (<div key={t} className="grid grid-cols-5 p-3 items-center text-center hover:bg-slate-50/50 transition-colors"><div className="text-left font-bold">{t}</div><div className="flex justify-center"><input type="checkbox" checked={p.view} onChange={() => togglePermission(t, 'view')} className="h-4 w-4 accent-brand-primary" /></div><div className="flex justify-center"><input type="checkbox" checked={p.add} onChange={() => togglePermission(t, 'add')} className="h-4 w-4 accent-brand-primary" /></div><div className="flex justify-center"><input type="checkbox" checked={p.edit} onChange={() => togglePermission(t, 'edit')} className="h-4 w-4 accent-brand-primary" /></div><div className="flex justify-center"><input type="checkbox" checked={p.delete} onChange={() => togglePermission(t, 'delete')} className="h-4 w-4 accent-brand-primary" /></div></div>); })}</div></div></div>
            )}
          </div>
          <div className="p-5 sm:p-6 border-t border-slate-100 bg-slate-50 shrink-0 flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="text-[11px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-200 rounded-lg">Cancel</Button>
            <Button onClick={handleSave} disabled={isSubmitting} className="bg-brand-primary text-white hover:bg-brand-primary/90 text-[11px] font-black uppercase tracking-widest rounded-lg px-6 shadow-lg shadow-brand-primary/20">{isSubmitting ? 'Saving...' : 'Save User'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
});

const UNIFORM_DROPDOWN_STYLE = "bg-brand-primary/10 text-brand-primary border border-brand-primary/20 font-semibold text-[13px] px-3 py-1.5 rounded-md shadow-sm tracking-tighter whitespace-nowrap inline-block";
const FROZEN_STYLE: React.CSSProperties = { backgroundColor: 'rgba(255, 255, 255, 0.72)', backdropFilter: 'blur(18px) saturate(1.8)', WebkitBackdropFilter: 'blur(18px) saturate(1.8)', boxShadow: 'inset -1px 0 0 #e2e8f0, inset 0 -1px 0 #e2e8f0' };

// Columns to show by default on mobile grid view (others are hidden until user unlocks via Fields)
const MOBILE_PRIORITY_COLS: Record<string, string[]> = {
  'Events':              ['Event Name', 'DateFrom', 'Occasion'],
  'Session':             ['Session Name', 'Parent Event', 'Date'],
  'MusicLog':            ['PlayID', 'Track', 'Session'],
  'Tracks':              ['Title', 'Artist', 'Duration'],
  'VideoLog':            ['VideoPlayId', 'VideoTitle', 'Session'],
  'Guidance & Learning': ['LearningId', 'Guidance/Learning', 'Category'],
  'LED':                 ['LedId', '🕘 Session', 'Indoor/Outdoor LED?'],
  'DyatraChecklist':     ['Task', 'TaskGroup', 'Category'],
  'DataSharing':         ['Sevak', 'Dept', 'EmailId'],
  'VideoSetup':          ['Name', 'Status', 'Assignee'],
  'AudioSetup':          ['Name', 'Status', 'Assignee'],
};


const CardImageGallery = ({ imageString }: { imageString: string }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dir, setDir] = useState(1);
  const touchStartX = useRef<number | null>(null);

  const urlRegex = /\((https?:\/\/[^)]+|data:image\/[^;]+;base64,[^)]+)\)/g;
  const images: string[] = [];
  let match;
  while ((match = urlRegex.exec(imageString)) !== null) images.push(match[1]);

  if (images.length === 0) {
    return (
      <div className="h-44 w-full bg-[#07080d] flex flex-col items-center justify-center opacity-20">
        <Monitor className="h-10 w-10 text-slate-700" />
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">No Preview</span>
      </div>
    );
  }

  const goTo = (idx: number, direction: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setDir(direction);
    setCurrentIndex((idx + images.length) % images.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < 40) return;
    delta < 0 ? goTo(currentIndex + 1, 1) : goTo(currentIndex - 1, -1);
  };

  const multi = images.length > 1;

  return (
    <div
      className="h-44 w-full relative group/gallery overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-[inset_0_2px_8px_rgba(0,0,0,0.05)]"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.img
          key={currentIndex}
          src={images[currentIndex].replace('export=download', 'export=view')}
          initial={{ opacity: 0, x: dir * 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: dir * -24 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="w-full h-full object-contain drop-shadow-lg"
          alt={`Image ${currentIndex + 1}`}
        />
      </AnimatePresence>

      {multi && (
        <>
          {/* Arrows — always visible on mobile, hover-only on desktop */}
          <button
            onClick={e => goTo(currentIndex - 1, -1, e)}
            className="absolute left-1.5 top-1/2 -translate-y-1/2 bg-black/40 text-white p-1.5 rounded-full transition-all hover:bg-brand-primary sm:opacity-0 sm:group-hover/gallery:opacity-100 active:scale-90 shadow-md"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={e => goTo(currentIndex + 1, 1, e)}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-black/40 text-white p-1.5 rounded-full transition-all hover:bg-brand-primary sm:opacity-0 sm:group-hover/gallery:opacity-100 active:scale-90 shadow-md"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>

          {/* Dot indicators — always visible, tap to jump */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={e => goTo(i, i > currentIndex ? 1 : -1, e)}
                className={`rounded-full transition-all ${
                  i === currentIndex
                    ? 'w-4 h-1.5 bg-white'
                    : 'w-1.5 h-1.5 bg-white/40 hover:bg-white/70'
                }`}
              />
            ))}
          </div>

          {/* Counter badge — top-right, small */}
          <div className="absolute top-1.5 right-1.5 bg-black/40 px-1.5 py-0.5 rounded-md text-[9px] font-black text-white/90 border border-white/10 tabular-nums shadow-sm">
            {currentIndex + 1}/{images.length}
          </div>
        </>
      )}
    </div>
  );
};

/** Attachment / image manager dialog — defined OUTSIDE App for stable component identity */
const AttachmentManagerDialog = React.memo(function AttachmentManagerDialog({
  manager,
  onSaved,
  onClose,
}: {
  manager: { item: any; column: string; collection: string; isOpen: boolean } | null;
  onSaved: (newValue: string) => void;
  onClose: () => void;
}) {
  type ImgEntry = { url: string; name: string; tempKey?: string; loading?: boolean };

  // Each entry has a stable tempKey used as React key; loading=true while Drive upload is in flight
  const [images, setImages] = useState<ImgEntry[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const imagesRef = useRef<ImgEntry[]>([]);
  const uploadingRef = useRef(false); // guard against double-trigger

  const parseImages = (raw: string): ImgEntry[] => {
    const result: ImgEntry[] = [];
    // Match both http(s) URLs and data: URIs so existing base64-stored images are shown
    const re = /(?:\[([^\]]*)\])?\(((?:https?:\/\/|data:image\/)[^)]+)\)/g;
    let m;
    while ((m = re.exec(raw)) !== null) result.push({ name: m[1] || '', url: m[2], tempKey: m[2] });
    return result;
  };

  const serialize = (entries: ImgEntry[]): string =>
    entries
      .filter(e => e.url && !e.loading) // never persist loading placeholders or empty URLs
      .map(e => e.name ? `[${e.name}](${e.url})` : `(${e.url})`)
      .join(' ');

  // Re-initialize only when a different record / column is opened
  useEffect(() => {
    if (!manager?.isOpen || !manager?.item) return;
    const parsed = parseImages(manager.item[manager.column] || '');
    setImages(parsed);
    imagesRef.current = parsed;
    setUploadError(null);
    uploadingRef.current = false;
  }, [manager?.isOpen, String(manager?.item?._id ?? manager?.item?.id ?? ''), manager?.column]);

  const persist = async (entries: ImgEntry[]) => {
    if (!manager?.item) return;
    const recordId = String(manager.item._id || manager.item.id || '');
    if (!recordId || recordId === 'undefined') return;
    const str = serialize(entries);
    try {
      const res = await window.fetch(`/api/${manager.collection}/${recordId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [manager.column]: str }),
      });
      if (res.ok) {
        onSaved(str);
      } else {
        const msg = await res.text().catch(() => '');
        setUploadError(`Save failed: ${msg || res.status}`);
      }
    } catch (err: any) {
      console.error('Image save error:', err);
      setUploadError('Network error — could not save image.');
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const files = Array.from(input.files || []);
    input.value = '';
    if (!files.length || uploadingRef.current) return;
    uploadingRef.current = true;
    setUploadError(null);

    for (const file of files) {
      const tempKey = `_t_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const name = file.name.replace(/\.[^.]+$/, '');

      // Show loading placeholder immediately so the user sees feedback
      const withPlaceholder: ImgEntry[] = [...imagesRef.current, { url: '', name, loading: true, tempKey }];
      imagesRef.current = withPlaceholder;
      setImages([...withPlaceholder]);

      try {
        // Compress to JPEG ≤ 1200px
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onerror = reject;
          reader.onload = ev => {
            const img = new Image();
            img.onerror = reject;
            img.onload = () => {
              const canvas = document.createElement('canvas');
              let { width, height } = img;
              const max = 1200;
              if (width > max || height > max) {
                if (width > height) { height = Math.round(height * max / width); width = max; }
                else { width = Math.round(width * max / height); height = max; }
              }
              canvas.width = width; canvas.height = height;
              canvas.getContext('2d')?.drawImage(img, 0, 0, width, height);
              resolve(canvas.toDataURL('image/jpeg', 0.7));
            };
            img.src = ev.target?.result as string;
          };
          reader.readAsDataURL(file);
        });

        // Upload to Google Drive — only commit Drive URL, never base64
        const res = await window.fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64, name: file.name }),
        });
        const data = await res.json();

        if (data.url) {
          // Replace loading placeholder with real Drive URL
          const realEntry: ImgEntry = { url: data.url, name, tempKey };
          const updated = imagesRef.current.map(e => e.tempKey === tempKey ? realEntry : e);
          imagesRef.current = updated;
          setImages([...updated]);
          await persist(updated);
        } else {
          // Remove placeholder and surface error
          const cleaned = imagesRef.current.filter(e => e.tempKey !== tempKey);
          imagesRef.current = cleaned;
          setImages([...cleaned]);
          setUploadError(data.error || 'Upload failed — check Google Drive credentials.');
        }
      } catch (err: any) {
        const cleaned = imagesRef.current.filter(e => e.tempKey !== tempKey);
        imagesRef.current = cleaned;
        setImages([...cleaned]);
        setUploadError('Upload error: ' + (err?.message || 'unknown'));
        console.error('Upload error for', file.name, err);
      }
    }
    uploadingRef.current = false;
  };

  const handleRemove = async (idx: number) => {
    const updated = imagesRef.current.filter((_, i) => i !== idx);
    imagesRef.current = updated;
    setImages([...updated]);
    await persist(updated);
  };

  const anyLoading = images.some(e => e.loading);

  if (!manager?.isOpen) return null;

  const realCount = images.filter(e => !e.loading).length;

  return (
    <div
      className="fixed inset-0 z-[600] flex items-end sm:items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(2px)' }}
      onClick={anyLoading ? undefined : onClose}
    >
      <div
        className="w-full sm:w-[580px] bg-white rounded-t-2xl sm:rounded-xl flex flex-col shadow-2xl max-h-[92vh] sm:max-h-[88vh] overflow-hidden border border-slate-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Mobile drag handle */}
        <div className="sm:hidden flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 bg-slate-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-3 pb-2.5 shrink-0 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Paperclip className="h-4 w-4 text-slate-400" />
            <span className="text-[13px] font-semibold text-slate-800">{manager.column}</span>
            {realCount > 0 && (
              <span className="text-[11px] text-slate-400">{realCount} file{realCount !== 1 ? 's' : ''}</span>
            )}
          </div>
          <button
            onClick={anyLoading ? undefined : onClose}
            disabled={anyLoading}
            className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Attach button */}
        <div className="px-4 py-2.5 shrink-0">
          <label className={`inline-flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-lg transition-colors border border-slate-200 w-full justify-center sm:w-auto sm:justify-start select-none ${anyLoading ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer'}`}>
            {anyLoading
              ? <div className="h-3.5 w-3.5 rounded-full border-2 border-slate-400 border-t-transparent animate-spin shrink-0" />
              : <Paperclip className="h-3.5 w-3.5" />
            }
            {anyLoading ? 'Uploading…' : 'Attach image'}
            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
              multiple
              className="sr-only"
              onChange={handleUpload}
              disabled={anyLoading}
            />
          </label>
        </div>

        {/* Error banner */}
        {uploadError && (
          <div className="mx-4 mb-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2 shrink-0">
            <X className="h-3.5 w-3.5 text-red-500 mt-0.5 shrink-0" />
            <span className="text-[11px] text-red-700 leading-snug">{uploadError}</span>
            <button onClick={() => setUploadError(null)} className="ml-auto shrink-0 text-red-400 hover:text-red-600">
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        <div className="h-px bg-slate-100 shrink-0" />

        {/* Image grid */}
        <div className="flex-1 overflow-y-auto min-h-0 p-4">
          {images.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <Paperclip className="h-8 w-8 text-slate-200 mx-auto" />
              <p className="text-[12px] text-slate-400">No attachments yet</p>
              <label className="text-[12px] font-medium text-blue-600 hover:text-blue-800 transition-colors cursor-pointer select-none">
                Attach a file
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                  multiple
                  className="sr-only"
                  onChange={handleUpload}
                />
              </label>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {images.map((entry, i) => (
                <div key={entry.tempKey || entry.url || i} className="group/card flex flex-col">
                  <div
                    className="relative rounded-lg overflow-hidden bg-slate-100 shadow-sm"
                    style={{ aspectRatio: '4/3' }}
                  >
                    {entry.loading ? (
                      /* Loading placeholder — shown immediately on file select */
                      <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 bg-slate-100">
                        <div className="h-5 w-5 rounded-full border-2 border-brand-primary border-t-transparent animate-spin" />
                        <span className="text-[10px] text-slate-400">Uploading…</span>
                      </div>
                    ) : (
                      <>
                        <img
                          src={entry.url.replace('export=download', 'export=view')}
                          loading="eager"
                          className="w-full h-full object-cover"
                          alt={entry.name || `Image ${i + 1}`}
                        />
                        <div className="absolute bottom-1.5 right-1.5 flex items-center gap-0.5 opacity-100 sm:opacity-0 sm:group-hover/card:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleRemove(i)}
                            className="p-1 bg-white/95 rounded text-slate-500 hover:text-red-600 shadow-sm transition-colors"
                            title="Remove"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                  <p className="mt-1.5 text-[11px] text-slate-500 truncate px-0.5 leading-snug">
                    {entry.name || `Image ${i + 1}`}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer — uploading indicator or safe-area spacer */}
        {anyLoading ? (
          <div className="px-4 py-2.5 border-t border-slate-100 flex items-center gap-2 shrink-0" style={{ paddingBottom: 'max(10px, env(safe-area-inset-bottom))' }}>
            <div className="h-3 w-3 rounded-full border-2 border-brand-primary border-t-transparent animate-spin shrink-0" />
            <span className="text-[11px] text-slate-400">Uploading to Google Drive…</span>
          </div>
        ) : (
          <div className="shrink-0" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }} />
        )}
      </div>
    </div>
  );
});

/** Airtable-style searchable dropdown with free-type "Create" option */
/** Airtable-style searchable dropdown with free-type "Create" option */
/** Airtable-style multi-select: Click cell to see tags, click Plus to see options */
/** Airtable-style multi-select vs Single-select UI */
/** Airtable-style multi-select vs Single-select UI with Create Option */
/** Airtable-style multi-select vs Single-select UI */
const CellDropdown = React.memo(function CellDropdown({
  value, options, onCommit, onCancel, onOutsideClick, 
  placeholder = 'Select...', tagClass, isMinimal = false,
  autoOpen = false, isMulti = false, onAddOption, removableOptions = [], onRemoveOption
}: {
  value: string | string[]; options: string[]; onCommit: (v: string) => void; 
  onCancel: () => void; onOutsideClick?: () => void;
  placeholder?: string; tagClass?: string; isMinimal?: boolean;
  autoOpen?: boolean; isMulti?: boolean; onAddOption?: (newOption: string) => void;
  removableOptions?: string[]; onRemoveOption?: (option: string) => any;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [panelPos, setPanelPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const [localAddedOptions, setLocalAddedOptions] = useState<string[]>([]);

  const openDropdown = () => {
    if (ref.current) {
      const r = ref.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - r.bottom;
      const top = spaceBelow < 300 ? Math.max(8, r.top - 304) : r.bottom + 4;
      setPanelPos({ top, left: r.left, width: Math.max(240, r.width) });
    }
    setOpen(true);
  };

  const selectedValues = useMemo(() => {
    if (Array.isArray(value)) return value;
    const strVal = (value !== null && value !== undefined) ? String(value) : '';
    return strVal.split(',').map(v => v.trim()).filter(Boolean);
  }, [value]);

  useEffect(() => { if (autoOpen) requestAnimationFrame(() => openDropdown()); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // Only auto-focus search on desktop — on mobile it triggers the keyboard which fires resize and closes the dropdown
  useEffect(() => { if (open && window.innerWidth >= 768) setTimeout(() => searchRef.current?.focus(), 0); }, [open]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      const inside = (ref.current && ref.current.contains(e.target as Node))
                  || (panelRef.current && panelRef.current.contains(e.target as Node));
      if (!inside) {
        if (open) {
          setOpen(false);
          setSearch('');
          if (onOutsideClick) onOutsideClick();
        }
      }
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open, onOutsideClick]);

  useEffect(() => {
    if (!open) return;
    // Only close on WIDTH change — mobile keyboard appearance changes height only, not width
    let prevWidth = window.innerWidth;
    const close = () => {
      if (window.innerWidth !== prevWidth) {
        setOpen(false); setSearch(''); if (onOutsideClick) onOutsideClick();
      }
      prevWidth = window.innerWidth;
    };
    window.addEventListener('resize', close);
    return () => window.removeEventListener('resize', close);
  }, [open, onOutsideClick]);

  const pick = (val: string) => {
    const trimmedVal = val.trim();
    if (!isMulti && trimmedVal === '') {
      onCommit('');
      setOpen(false);
      setSearch('');
      return;
    }
    if (!trimmedVal) return;

    if (!options.some(o => o.toLowerCase() === trimmedVal.toLowerCase()) && onAddOption) {
      onAddOption(trimmedVal);
    }

    setLocalAddedOptions(prev => prev.includes(trimmedVal) ? prev : [...prev, trimmedVal]);

    if (isMulti) {
      const isSelected = selectedValues.includes(trimmedVal);
      const nextArray = isSelected
        ? selectedValues.filter(v => v !== trimmedVal)
        : [...selectedValues, trimmedVal];
      
      // Update parent draft but don't close
      onCommit(nextArray.join(', '));
      setSearch('');
    } else {
      onCommit(trimmedVal);
      setOpen(false);
      setSearch('');
    }
  };

  const safeOptions = Array.from(new Set([...options.filter(o => o != null), ...selectedValues, ...localAddedOptions]));
  const filtered = safeOptions.filter(o => o.toLowerCase().includes(search.toLowerCase()));
  const canCreate = search.trim() !== '' && !safeOptions.some(o => o.toLowerCase() === search.toLowerCase().trim());

  return (
    <div ref={ref} className="relative w-full h-full flex items-center min-h-[36px]">
      
      {/* TRIGGER AREA */}
      {isMulti ? (
        <div className="w-full h-full flex items-center flex-wrap gap-1.5 px-2 py-1 cursor-text" onClick={() => { if (!open) openDropdown(); }}>
          {selectedValues.map((v, i) => (
            <span key={i} className={`${getTagStyle(v)} flex items-center gap-1 shadow-none border-slate-200`}>
              {v}
              <button onMouseDown={(e) => { e.stopPropagation(); pick(v); }} className="hover:bg-black/10 rounded-full p-0.5">
                <X className="h-2.5 w-2.5" />
              </button>
            </span>
          ))}
          <button 
            className={`flex items-center justify-center h-6 w-6 rounded-md border transition-all ${open ? 'bg-blue-600 border-blue-700 text-white' : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600'}`}
            onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); if (open) setOpen(false); else openDropdown(); }}
          >
            <Plus className={`h-3.5 w-3.5 ${open ? 'rotate-45' : ''}`} />
          </button>
          {selectedValues.length === 0 && !open && <span className="text-[11px] text-slate-300 italic ml-1">Select multiple...</span>}
        </div>
      ) : (
        <div className="w-full h-full flex items-center justify-between px-3 py-1 cursor-pointer" onClick={() => { if (open) setOpen(false); else openDropdown(); }}>
          <div className="flex-1 truncate">
            {selectedValues.length > 0 ? (
              <span className={getTagStyle(selectedValues[0])}>{selectedValues[0]}</span>
            ) : (
              <span className="text-[11px] text-slate-400 uppercase tracking-widest font-bold">{placeholder}</span>
            )}
          </div>
          <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      )}

      {/* DROPDOWN MENU — fixed-position so it escapes overflow:hidden ancestors */}
      {open && panelPos && typeof document !== 'undefined' ? createPortal(
        <div
          data-floating-panel
          ref={panelRef}
          className="fixed z-[9999] bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden flex flex-col"
          style={{ top: panelPos.top, left: panelPos.left, width: panelPos.width, minWidth: 240 }}
        >
          <div className="p-2 border-b border-slate-100 bg-slate-50/50">
            <input
              ref={searchRef}
              className="w-full text-[12px] text-black px-2.5 py-1.5 rounded-lg border border-slate-200 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-white"
              placeholder="Search options..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.stopPropagation();
                  if (canCreate) pick(search);
                }
                if (e.key === 'Escape') {
                  e.stopPropagation();
                  setOpen(false);
                }
              }}
            />
          </div>

          <div className="max-h-60 overflow-y-auto py-1 thin-scrollbar">
            {!isMulti && selectedValues.length > 0 && !search && (
              <div 
                className="px-3 py-2 text-[12px] cursor-pointer flex items-center gap-2 text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors border-b border-slate-100 mb-1" 
                onMouseDown={e => { e.preventDefault(); pick(''); }}
              >
                <X className="h-3.5 w-3.5" />
                <span className="italic font-medium">Clear selection</span>
              </div>
            )}
            {filtered.map(opt => {
              const isSelected = selectedValues.includes(opt);
              const isRemovable = removableOptions.includes(opt);
              return (
                <div 
                  key={opt} 
                  className={`px-3 py-2 text-[12px] cursor-pointer flex items-center justify-between hover:bg-slate-50 transition-colors ${isSelected ? 'bg-blue-50/50 font-bold text-blue-700' : 'text-slate-700'}`}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0" onMouseDown={e => { e.preventDefault(); pick(opt); }}>
                    {isMulti && (
                       <div className={`h-3.5 w-3.5 rounded border flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-300'}`}>
                         {isSelected && <Check className="h-2.5 w-2.5 text-white" strokeWidth={4} />}
                       </div>
                    )}
                    <span className={getTagStyle(opt)}>{opt}</span>
                  </div>
                  {isRemovable && onRemoveOption && (
                    <button
                      onMouseDown={async e => {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        const result = await onRemoveOption(opt);
                        if (result === false) return; // Stop if the user cancelled the prompt
                        
                        setLocalAddedOptions(prev => prev.filter(o => o !== opt));
                        
                        // Automatically deselect if it's currently selected
                        if (selectedValues.includes(opt)) {
                          if (isMulti) {
                            onCommit(selectedValues.filter(v => v !== opt).join(', '));
                          } else {
                            onCommit('');
                          }
                        }
                      }}
                      className="ml-2 text-slate-300 hover:text-red-500 transition-colors shrink-0"
                      title="Delete custom tag"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
            {filtered.length === 0 && !canCreate && <div className="px-4 py-8 text-center text-[11px] text-slate-400 italic">No matches found</div>}
          </div>

          <div className="border-t border-slate-100 bg-slate-50/80 p-1">
            <button 
              className={`w-full flex items-center gap-2 px-3 py-2 text-[12px] rounded-lg transition-colors ${canCreate ? 'text-blue-600 font-bold hover:bg-blue-100' : 'text-slate-400 cursor-not-allowed'}`}
              onMouseDown={e => { e.preventDefault(); if (canCreate) pick(search); }}
              disabled={!canCreate}
            >
              <Plus className="h-3.5 w-3.5" />
              {canCreate ? `Create "${search}"` : "Type to add new tag"}
            </button>
          </div>
        </div>
      , document.body) : null}
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
  const panelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const latestRef = useRef(localSel);
  const openRef = useRef(false);
  latestRef.current = localSel;
  openRef.current = open;
  const [panelPos, setPanelPos] = useState<{ top: number; left: number; width: number } | null>(null);

  // Sync if parent value changes externally
  useEffect(() => {
    const next = value ? value.split(',').map(s => s.trim()).filter(Boolean) : [];
    setLocalSel(next);
  }, [value]);

  useEffect(() => { if (open) setTimeout(() => searchRef.current?.focus(), 0); }, [open]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      const inside = (ref.current && ref.current.contains(e.target as Node)) ||
                     (panelRef.current && panelRef.current.contains(e.target as Node));
      if (openRef.current && !inside) {
        setOpen(false);
        onCommit(latestRef.current.join(', '));
      }
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [onCommit]);

  useEffect(() => {
    if (!open) return;
    let prevWidth = window.innerWidth;
    const close = () => {
      if (window.innerWidth !== prevWidth) {
        setOpen(false); onCommit(latestRef.current.join(', '));
      }
      prevWidth = window.innerWidth;
    };
    window.addEventListener('resize', close);
    return () => window.removeEventListener('resize', close);
  }, [open, onCommit]);

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

  const toggleOpen = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!open && ref.current) {
      const r = ref.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - r.bottom;
      const top = spaceBelow < 300 ? Math.max(8, r.top - 208) : r.bottom + 4;
      setPanelPos({ top, left: r.left, width: Math.max(288, r.width) });
    }
    setOpen(v => !v);
  };

  const filtered = allSessions.filter(s => s["Session Name"]?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div ref={ref} className="relative w-full">
      <div className="w-full min-h-8 flex flex-wrap gap-1 items-center px-1 py-1">
        {localSel.length > 0 ? localSel.map(name => (
          <span key={name} className="inline-flex items-center gap-0.5 bg-slate-100 text-slate-700 text-[11px] font-medium px-2 py-0.5 rounded border border-slate-200 leading-tight max-w-full min-w-0">
            <span className="truncate max-w-[220px]">{name}</span>
            <button onMouseDown={e => remove(name, e)} className="ml-0.5 text-slate-400 hover:text-red-500 leading-none text-[13px] font-bold shrink-0">&times;</button>
          </span>
        )) : <span className="text-[12px] text-slate-400">Link sessions…</span>}
        <button
          onMouseDown={toggleOpen}
          className="inline-flex items-center justify-center h-5 w-5 rounded border border-slate-300 bg-white text-slate-500 hover:bg-slate-100 hover:border-slate-400 hover:text-brand-primary transition-colors ml-0.5 shrink-0"
          title="Add linked session"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>
      {open && panelPos && typeof document !== 'undefined' ? createPortal(
        <div data-floating-panel ref={panelRef} className="fixed z-[9999] bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden" style={{ top: panelPos.top, left: panelPos.left, width: panelPos.width, minWidth: 288 }}>
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
      , document.body) : null}
    </div>
  );
});

// Generic linked-record picker — chip-based multi-select from any table's records
const LinkedRecordPicker = React.memo(function LinkedRecordPicker({
  value, records, nameField, displayField, linkedTable, onCommit, onCancel, onAddLookup
}: {
  value: string;
  records: any[];
  nameField: string;
  displayField?: string;
  linkedTable: string;
  onCommit: (v: string) => void;
  onCancel: () => void;
  onAddLookup?: (linkedTable: string) => void;
}) {
  const [localSel, setLocalSel] = useState<string[]>(() => value ? value.split(',').map(s => s.trim()).filter(Boolean) : []);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const latestRef = useRef(localSel);
  const openRef = useRef(false);
  latestRef.current = localSel;
  openRef.current = open;
  const [panelPos, setPanelPos] = useState<{ top: number; left: number; width: number } | null>(null);

  useEffect(() => {
    const next = value ? value.split(',').map(s => s.trim()).filter(Boolean) : [];
    setLocalSel(next);
  }, [value]);

  useEffect(() => { if (open) setTimeout(() => searchRef.current?.focus(), 0); }, [open]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      const inside = (ref.current && ref.current.contains(e.target as Node)) ||
                     (panelRef.current && panelRef.current.contains(e.target as Node));
      if (openRef.current && !inside) {
        setOpen(false);
        onCommit(latestRef.current.join(', '));
      }
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [onCommit]);

  useEffect(() => {
    if (!open) return;
    let prevWidth = window.innerWidth;
    const close = () => {
      if (window.innerWidth !== prevWidth) {
        setOpen(false); onCommit(latestRef.current.join(', '));
      }
      prevWidth = window.innerWidth;
    };
    window.addEventListener('resize', close);
    return () => window.removeEventListener('resize', close);
  }, [open, onCommit]);

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

  const toggleOpen = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!open && ref.current) {
      const r = ref.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - r.bottom;
      const top = spaceBelow < 300 ? Math.max(8, r.top - 240) : r.bottom + 4;
      setPanelPos({ top, left: r.left, width: Math.max(288, r.width) });
    }
    setOpen(v => !v);
  };

  const uniqueRecords = useMemo(() => {
    const map = new Map();
    records.forEach(r => {
      if (r[nameField] && !map.has(String(r[nameField]))) map.set(String(r[nameField]), r);
    });
    return Array.from(map.values());
  }, [records, nameField]);

  const filteredRecords = uniqueRecords.filter(r => {
    const searchStr = search.toLowerCase();
    const nameVal = String(r[nameField] || '').toLowerCase();
    const displayVal = displayField ? String(r[displayField] || '').toLowerCase() : '';
    return nameVal.includes(searchStr) || displayVal.includes(searchStr);
  });

  return (
    <div ref={ref} className="relative w-full">
      <div className="w-full min-h-8 flex flex-wrap gap-1 items-center px-1 py-1">
        {localSel.length > 0 ? localSel.map(name => {
          const rec = uniqueRecords.find(r => String(r[nameField]) === String(name));
          const displayLabel = rec && displayField && rec[displayField] ? `${rec[displayField]} (${name})` : name;
          return (
          <span key={name} className="inline-flex items-center gap-0.5 bg-brand-primary/10 text-brand-primary border border-brand-primary/20 text-[11px] font-semibold px-2 py-0.5 rounded-sm leading-tight max-w-full min-w-0">
            <Link2 className="h-2.5 w-2.5 shrink-0 opacity-60" />
            <span className="truncate max-w-[200px]">{displayLabel}</span>
            <button onMouseDown={e => remove(name, e)} className="ml-0.5 text-brand-primary/60 hover:text-red-500 leading-none text-[13px] font-bold shrink-0">&times;</button>
          </span>
        )}) : <span className="text-[12px] text-slate-400">Link {linkedTable} records…</span>}
        <button
          onMouseDown={toggleOpen}
          className="inline-flex items-center justify-center h-5 w-5 rounded border border-slate-300 bg-white text-slate-500 hover:bg-slate-100 hover:border-brand-primary hover:text-brand-primary transition-colors ml-0.5 shrink-0"
          title={`Add linked ${linkedTable} record`}
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>
      {open && panelPos && typeof document !== 'undefined' ? createPortal(
        <div data-floating-panel ref={panelRef} className="fixed z-[9999] bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden" style={{ top: panelPos.top, left: panelPos.left, width: panelPos.width, minWidth: 288 }}>
          <div className="p-2 border-b border-slate-100">
            <input
              ref={searchRef}
              className="w-full text-[12px] px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 placeholder:text-slate-400"
              placeholder={`Search ${linkedTable}…`}
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => { if (e.key === 'Escape') { setOpen(false); onCancel(); } }}
            />
          </div>
          <div className="max-h-52 overflow-y-auto py-1">
            {filteredRecords.map(r => {
              const name = String(r[nameField]);
              const sel = localSel.includes(name);
              const displayLabel = displayField && r[displayField] ? `${r[displayField]} (${name})` : name;
              return (
                <div
                  key={name}
                  className={`px-3 py-2 text-[12px] cursor-pointer flex items-center gap-2.5 transition-colors hover:bg-slate-50 ${sel ? 'bg-blue-50' : ''}`}
                  onMouseDown={e => { e.preventDefault(); toggle(name); }}
                >
                  <div className={`h-4 w-4 rounded border-2 flex items-center justify-center shrink-0 ${sel ? 'bg-blue-500 border-blue-500' : 'border-slate-200'}`}>
                    {sel && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
                  </div>
                  <span className={sel ? 'text-blue-700 font-semibold' : 'text-slate-700'}>{displayLabel}</span>
                </div>
              );
            })}
            {filteredRecords.length === 0 && <div className="px-3 py-4 text-[12px] text-slate-400 text-center">No records found</div>}
          </div>
          <div className="border-t border-slate-100">
            <div className="px-3 py-1.5 flex items-center justify-between bg-slate-50">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">→ {linkedTable}</span>
              {onAddLookup && (
                <button
                  onMouseDown={e => { e.preventDefault(); e.stopPropagation(); setOpen(false); onAddLookup(linkedTable); }}
                  className="flex items-center gap-1 text-[10px] font-bold text-brand-primary hover:text-brand-primary/80 uppercase tracking-wider transition-colors"
                >
                  <Plus className="h-2.5 w-2.5" />
                  Add lookup field
                </button>
              )}
            </div>
          </div>
        </div>
      , document.body) : null}
    </div>
  );
});

const COL_LABEL_MAP: Record<string, string> = {
  '🕘 Session': 'Session',
  'DateFrom': 'Start Date',
  'DateTo': 'End Date',
  'DateFrom (from Event)': 'Event Start',
  'DateTo (from Event)': 'Event End',
  'ShareFacts?': 'Sharing Facts',
  'is Led Required?': 'LED Required',
};
function colLabel(col: string): string {
  if (COL_LABEL_MAP[col]) return COL_LABEL_MAP[col];
  let label = col.replace(/\(from 🕘 Session\)/g, '(from Session)');
  if (label.endsWith('?')) {
    label = label.slice(0, -1);
  }
  return label;
}

/** Airtable-style expanded record modal — desktop two-panel + mobile wizard */
const RecordExpandModal = React.memo(function RecordExpandModal({
  item, tableName, columns, sessions, events, columnMeta, columnTypes, allData, onAddLookup, onClose, onSave, currentUser, setLinkedRecordPopup,
  customTags, onAddCustomTag, onRemoveTag, onImageManage
}: {
  item: any; tableName: string; columns: string[]; sessions: any[];
  events: any[];
  columnMeta: Record<string, Record<string, { linkedTable?: string; lookupField?: string }>>;
  columnTypes: Record<string, Record<string, string>>;
  allData: Record<string, any[]>;
  onAddLookup: (linkedTable: string) => void;
  onClose: () => void; onSave: (draft: any) => void; setLinkedRecordPopup: (p: any) => void;
  currentUser?: any;
  customTags: Record<string, Record<string, string[]>>;
  onAddCustomTag: (tableName: string, col: string, tag: string) => void;
  onRemoveTag: (tableName: string, col: string, tag: string) => any;
  onImageManage?: (col: string, currentItem: any) => void;
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

  useEffect(() => {
    const imageCols = ['Images', 'Attachments', 'Attachment', 'images', 'attachments'];
    let changed = false;
    const patch: any = {};
    for (const c of imageCols) {
      if (item[c] !== undefined && item[c] !== draftRef.current[c]) {
        patch[c] = item[c];
        changed = true;
      }
    }
    if (changed) {
      setDraft((prev: any) => ({ ...prev, ...patch }));
    }
  }, [item]);

  const isEv = tableName === 'Events';
  const isSe = tableName === 'Session';
  const isML = tableName === 'MusicLog';
  const isVL = tableName === 'VideoLog';
  const isLinked = isML || isVL;
  const isGuide = tableName === 'Guidance & Learning';
  const isTracks = tableName === 'Tracks';
  const isLED = tableName === 'LED';
  const isDS = tableName === 'DataSharing';
  const isVSetup = tableName === 'VideoSetup';
  const isASetup = tableName === 'AudioSetup';

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

  // Populate lookup fields from live session data whenever sessions load or record opens
  useEffect(() => {
    if (!sessions.length) return;
    const sessionName = draftRef.current['Session'] || draftRef.current['🕘 Session'];
    if (!sessionName) return;
    const s = sessions.find((x: any) => x["Session Name"] === sessionName);
    if (!s) return;
    const patch: Record<string, string> = {};
    if (isML || isVL) {
      const sDate = s["Date"] || s["date"] || '';
      const sTimeOfDay = s["Time Of Day"] || s["TimeOfDay"] || s["timeOfDay"] || '';
      const sOccasion = s["Occasion"] || s["occasion"] || '';
      patch["Parent Event (from Session)"] = s["Parent Event"] || '';
      patch["Date (from Session)"] = sDate ? String(sDate).split('T')[0] : '';
      patch["TimeOfDay (from Session)"] = sTimeOfDay;
      patch["Occasion (from Session)"] = sOccasion;
    }
    if (isVL) {
      patch["City (from Session)"] = s["City"] || '';
      patch["Venue (from Session)"] = s["Venue"] || '';
      patch["SessionType (from Session)"] = s["SessionType"] || '';
    }
    if (isLED) {
      patch["Parent Event (from 🕘 Session)"] = s["Parent Event"] || '';
      patch["Date (from 🕘 Session)"] = s["Date"] ? String(s["Date"]).split('T')[0] : '';
      patch["City (from 🕘 Session)"] = s["City"] || '';
      patch["Venue (from 🕘 Session)"] = s["Venue"] || '';
    }
    if (Object.keys(patch).length > 0) setDraft((prev: any) => ({ ...prev, ...patch }));
  }, [sessions]);

  // Build wizard steps (mobile): group fields into logical sections
  const wizardSteps: { label: string; fields: string[] }[] = ((): { label: string; fields: string[] }[] => {
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
      { label: 'Notes & Remarks', fields: ['Notes', 'PPG', 'Topic', 'Cue'] },
    ]);
    if (isVL) return makeGroups([
      { label: 'Session Context', fields: ['Session', 'VideoPlayId'] },
      { label: 'Auto-filled', fields: ['Date (from Session)', 'City (from Session)', 'Venue (from Session)', 'Parent Event (from Session)', 'TimeOfDay (from Session)', 'Occasion (from Session)', 'SessionType (from Session)'] },
      { label: 'Video Details', fields: ['VideoTitle', 'Duration', 'ProposalsList'] },
    ]);
    if (isGuide) return makeGroups([
      { label: 'Basic Info', fields: ['LearningId', 'Event', 'City'] },
      { label: 'Auto-filled', fields: ['DateFrom (from Event)', 'DateTo (from Event)', 'Year (from Event)'] },
      { label: 'Content', fields: ['GuidanceFrom', 'Guidance/Learning', 'Category', 'Attachments'] },
    ]);
    if (isTracks) return makeGroups([
      { label: 'Track Info', fields: ['Title', 'Artist', 'Album'] },
      { label: 'Specs', fields: ['Duration', 'DurationTime', 'BPM', 'Key'] },
      { label: 'Source & Tags', fields: ['Source', 'FileLink', 'Tags', 'LexiconID', 'Lyrics'] },
    ]);
    if (isLED) return makeGroups([
      { label: 'Session Link', fields: ['🕘 Session', 'LedId', 'Indoor/Outdoor LED?', 'is Led Required?'] },
      { label: 'Centre LED', fields: ['CentreLed', 'CntrPitch', 'CntrWdth', 'CntrHt', 'CntrRiser', 'Stageht'] },
      { label: 'Side LED', fields: ['SideLed', 'SidePitch', 'SideWdth', 'SideHt'] },
      { label: 'Aux LED', fields: ['OtherLed1', 'OtherPitch', 'OtherWdth', 'OtherHt', 'OtherLed2', 'Other2Wdth', 'Other2Ht'] },
      { label: 'Power & Vendor', fields: ['DGUseedKva', 'BackupPower', 'Vendor', 'Images'] },
    ]);
    if (isDS) return makeGroups([
      { label: 'Contact Info', fields: ['Sevak', 'Dept', 'EmailId'] },
      { label: 'Data Sharing', fields: ['ShareFacts?', 'ShareData'] },
    ]);
    if (isVSetup || isASetup) return makeGroups([
      { label: 'Setup Details', fields: ['Name', 'Assignee', 'Status'] },
      { label: 'Notes & Links', fields: ['Notes', 'Attachments', 'Attachment Summary'] },
    ]);
    // Generic: chunk into groups of 3
    const chunks: { label: string; fields: string[] }[] = [];
    for (let i = 0; i < columns.length; i += 3)
      chunks.push({ label: `Step ${Math.floor(i / 3) + 1}`, fields: columns.slice(i, i + 3) });
    return chunks;
  })().concat([{ label: 'Messages', fields: [] }]);

  const totalSteps = wizardSteps.length;
  const currentStepData = wizardSteps[Math.min(step, totalSteps - 1)] || { label: '', fields: [] };

  const linkedSessions = isEv
    ? sessions.filter((s: any) => {
        const val = draft['Sessions'] || '';
        return val.split(',').map((x: string) => x.trim()).includes(s["Session Name"]);
      })
    : [];

  // ── Comments ──────────────────────────────────────────────────────────────
  const recordId = String(item._id || item.id || '');
  const colName = (() => {
    switch (tableName) {
      case 'Events': return 'events'; case 'Session': return 'sessions';
      case 'MusicLog': return 'musiclog'; case 'VideoLog': return 'videolog';
      case 'Tracks': return 'media'; case 'DyatraChecklist': return 'checklist';
      case 'Guidance & Learning': return 'guidance'; case 'LED': return 'led_details';
      case 'DataSharing': return 'locations'; case 'VideoSetup': return 'videosetup';
      case 'AudioSetup': return 'audiosetup'; default: return tableName.toLowerCase();
    }
  })();
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionStart, setMentionStart] = useState(0);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!recordId) return;
    window.fetch(`/api/comments?collection=${colName}&recordId=${recordId}`)
      .then(r => r.ok ? r.json() : []).then(setComments).catch(() => {});
    window.fetch('/api/users')
      .then(r => r.ok ? r.json() : [])
      .then((rows: any[]) => setAllUsers(
        rows.map((r: any) => ({ name: r.name || '', email: r.email || '' }))
      ))
      .catch(() => {});
  }, [recordId]);

  const handleCommentInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setCommentText(val);
    const cursor = e.target.selectionStart ?? val.length;
    const before = val.slice(0, cursor);
    const m = before.match(/@(\w*)$/);
    if (m) { setMentionQuery(m[1]); setMentionStart(cursor - m[0].length); setMentionOpen(true); }
    else setMentionOpen(false);
  };

  const selectMention = (user: any) => {
    const name = (user.name || user.email || '').replace(/\s+/g, '');
    const before = commentText.slice(0, mentionStart);
    const after = commentText.slice(mentionStart + 1 + mentionQuery.length);
    setCommentText(`${before}@${name} ${after}`);
    setMentionOpen(false);
    setTimeout(() => commentInputRef.current?.focus(), 0);
  };

  const [commentPosting, setCommentPosting] = useState(false);

  const postComment = async () => {
    const text = commentText.trim();
    if (!text || !recordId || commentPosting) return;
    setCommentPosting(true);
    try {
      const mentions = [...text.matchAll(/@(\w+)/g)].map(m => m[1]);
      const body = { collection: colName, recordId, text, authorId: currentUser?.email || '', authorName: currentUser?.name || currentUser?.email || 'Anonymous', mentions, recordTitle, tableName };
      const res = await window.fetch('/api/comments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (res.ok) {
        const c = await res.json();
        setComments((prev: any[]) => [...prev, c]);
        setCommentText('');
        setMentionOpen(false);
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(`Failed to post comment (${res.status}): ${(errData as any).error || 'Unknown error'}`);
      }
    } catch (err) {
      alert(`Network error: ${err}`);
    } finally {
      setCommentPosting(false);
    }
  };

  const deleteComment = async (commentId: string) => {
    if (!window.confirm('Delete this comment?')) return;
    await window.fetch(`/api/comments/${commentId}`, { method: 'DELETE' });
    setComments(prev => prev.filter(c => String(c._id) !== commentId));
  };

  const filteredMentionUsers = allUsers.filter(u =>
    (u.name || u.email || '').toLowerCase().startsWith(mentionQuery.toLowerCase())
  ).slice(0, 6);

  const renderCommentText = (text: string) =>
    text.split(/(@\w+)/g).map((part, i) =>
      part.startsWith('@')
        ? <span key={i} className="text-brand-primary font-bold">{part}</span>
        : <React.Fragment key={i}>{part}</React.Fragment>
    );

  const formatCommentTime = (raw: any) => {
    const d = new Date(raw);
    if (isNaN(d.getTime())) return '';
    const diff = Date.now() - d.getTime();
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const inputCls = "w-full h-10 bg-white border border-slate-200 rounded-xl px-3.5 text-[13px] font-medium text-slate-900 placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all";
  const readonlyCls = "w-full h-10 bg-slate-50 border border-slate-100 rounded-xl px-3.5 text-[13px] text-slate-400 flex items-center italic";

 const getModalPrimaryField = (table: string): string => {
    switch (table) {
      case 'Events': return 'Event Name';
      case 'Session': return 'Session Name';
      case 'Tracks': return 'Title';
      case 'DyatraChecklist': return 'Task';
      case 'Guidance & Learning': return 'LearningId';
      case 'LED': return 'LedId';
      case 'DataSharing': return 'Sevak';
      case 'VideoSetup': case 'AudioSetup': return 'Name';
      default: return 'name';
    }
  };

  const recordTitle = draft[getModalPrimaryField(tableName)] || "Record";

 const renderField = (col: string) => {
  if (tableName === 'Tracks' && col === 'Plays') {
    return (
      <LinkedRecordPicker
        value={draft[col] || ''}
        records={allData['MusicLog'] || []}
        nameField="PlayID"
        displayField="Track"
        linkedTable="MusicLog"
        onCommit={val => commit(col, val)}
        onCancel={onClose}
        onAddLookup={onAddLookup}
      />
    );
  }
  if (tableName === 'Tracks' && col === 'PlayID') {
      const playId = draft[col];
      if (!playId) return <div className={readonlyCls}>—</div>;
      const musicLogRecord = (allData['MusicLog'] || []).find((ml: any) => String(ml.PlayID) === String(playId));
      const displayLabel = musicLogRecord?.Track ? `${musicLogRecord.Track} (${playId})` : playId;
      return (
        <div
          onClick={(e) => {
            e.stopPropagation();
            if (musicLogRecord) {
              const nameField = getModalPrimaryField('MusicLog');
              const fields = Object.keys(musicLogRecord).filter(k => !['_id', 'id', 'created_at', '__v'].includes(k) && k !== nameField).slice(0, 8);
              setLinkedRecordPopup({ record: musicLogRecord, tableName: 'MusicLog', nameField, fields });
            }
          }}
          className={`${readonlyCls} not-italic font-semibold !cursor-pointer hover:!bg-slate-100 justify-between`}
        >
          <span className="truncate">{displayLabel}</span>
          {musicLogRecord && <ArrowUpRight className="h-3.5 w-3.5 opacity-60 shrink-0" />}
        </div>
      );
  }

  // Check for ANY auto-filled columns (Session or Event)
  const isAutoFilled =
    col.includes('(from Session)') ||
    col.includes('(from 🕘 Session)') ||
    col.toLowerCase().includes('(from event)'); // <--- Added this

  if (isAutoFilled) {
    return (
      <div className="w-full h-10 bg-slate-100 border border-slate-200 rounded-xl px-3.5 text-[13px] font-semibold text-slate-500 flex items-center gap-2 group/readonly">
        <span className="truncate">{draft[col] || '—'}</span>
        <div className="ml-auto opacity-0 group-hover/readonly:opacity-100 transition-opacity">
          <Badge variant="outline" className="text-[10px] border-slate-300 text-slate-500 uppercase">
  Auto-Filled
</Badge> 
        </div>
      </div>
    );
  }

  // Custom field types: link_to_record and lookup
  const colTypeMeta = columnMeta[tableName]?.[col];
  if (colTypeMeta) {
    if (colTypeMeta.lookupField) {
      // Lookup: read-only, shows field name source
      return (
        <div className="w-full h-10 bg-slate-100 border border-slate-200 rounded-xl px-3.5 text-[13px] text-slate-500 flex items-center gap-2 group/readonly">
          <span className="truncate italic">{draft[col] || '—'}</span>
          <div className="ml-auto opacity-0 group-hover/readonly:opacity-100 transition-opacity shrink-0">
            <Badge variant="outline" className="text-[8px] border-slate-300 text-slate-400 uppercase tracking-tighter">
              {colTypeMeta.lookupField}{colTypeMeta.linkedTable ? ` from ${colTypeMeta.linkedTable}` : ''}
            </Badge>
          </div>
        </div>
      );
    }
    if (colTypeMeta.linkedTable) {
      // Link to record: chip-based picker with lookup auto-fill
      const linkedTable = colTypeMeta.linkedTable;
      const records = allData[linkedTable] || [];
      const nameField = getModalPrimaryField(linkedTable);
      return (
        <LinkedRecordPicker
          value={draft[col] || ''}
          records={records}
          nameField={nameField}
          displayField={linkedTable === 'MusicLog' ? 'Track' : undefined}
          linkedTable={linkedTable}
          onCommit={val => {
            // Auto-fill any lookup columns pointing to the same linkedTable
            const patch: Record<string, string> = { [col]: val };
            const names = val.split(',').map((s: string) => s.trim()).filter(Boolean);
            const linkedRecs = names.map((n: string) => records.find((r: any) => r[nameField] === n)).filter(Boolean);
            const tableMeta = columnMeta[tableName] || {};
            for (const c of columns) {
              const cm = tableMeta[c];
              if (cm?.linkedTable === linkedTable && cm?.lookupField && columnTypes[tableName]?.[c] === 'lookup') {
                patch[c] = linkedRecs.map((r: any) => r[cm.lookupField!] ?? '').filter(Boolean).join(', ');
              }
            }
            const nd = { ...draftRef.current, ...patch };
            setDraft(nd);
            onSave(nd);
          }}
          onCancel={onClose}
          onAddLookup={onAddLookup}
        />
      );
    }
  }

    if (isLinked && col === 'Session') {
      return (
        <CellDropdown
          value={draft['Session'] || ''}
          options={sessions.map((s: any) => s["Session Name"])}
          onCommit={val => {
            const s = sessions.find((x: any) => x["Session Name"] === val);
            const norm = (d: any) => d ? String(d).split('T')[0] : '';
            const patch: any = { Session: val };
            if (s) {
              const sDate = s["Date"] || s["date"] || '';
              const sTimeOfDay = s["Time Of Day"] || s["TimeOfDay"] || s["timeOfDay"] || '';
              const sOccasion = s["Occasion"] || s["occasion"] || '';
              if (isML) {
                patch["Parent Event (from Session)"] = s["Parent Event"] || '';
                patch["Date (from Session)"]         = norm(sDate);
                patch["TimeOfDay (from Session)"]    = sTimeOfDay;
                patch["Occasion (from Session)"]     = sOccasion;
              } else {
                patch["Parent Event (from Session)"] = s["Parent Event"] || '';
                patch["Date (from Session)"]         = norm(sDate);
                patch["City (from Session)"]         = s["City"] || '';
                patch["Venue (from Session)"]        = s["Venue"] || '';
                patch["TimeOfDay (from Session)"]    = sTimeOfDay;
                patch["Occasion (from Session)"]     = sOccasion;
                patch["SessionType (from Session)"]  = s["SessionType"] || '';
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
    if (isLED && col === '🕘 Session') {
      return (
        <CellDropdown
          value={draft['🕘 Session'] || ''}
          options={sessions.map((s: any) => s["Session Name"])}
          onCommit={val => commit('🕘 Session', val)}
          onCancel={onClose}
          placeholder="Select session…"
          tagClass="bg-brand-primary/10 text-brand-primary text-[11px] font-semibold px-2 py-0.5 rounded-sm border border-brand-primary/20"
        />
      );
    }
    if (col === 'Indoor/Outdoor LED?') {
      const curVal = draft[col];
      return (
        <div className="flex gap-2">
          {['Indoor', 'Outdoor'].map(opt => (
            <button key={opt} type="button" onClick={() => commit(col, opt)}
              className={`flex-1 h-11 rounded-xl border text-[12px] font-black uppercase tracking-widest transition-all ${
                curVal === opt ? 'bg-slate-800 text-white border-slate-800 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              }`}>{opt}</button>
          ))}
        </div>
      );
    }
    if (col.endsWith('?')) {
      const curVal = draft[col];
      return (
        <div className="flex gap-2">
          {['Yes', 'No'].map(opt => (
            <button key={opt} type="button" onClick={() => commit(col, opt)}
              className={`flex-1 h-11 rounded-xl border text-[12px] font-black uppercase tracking-widest transition-all ${
                curVal === opt ? 'bg-brand-primary text-white border-brand-primary shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              }`}>{opt}</button>
          ))}
        </div>
      );
    }
    if (col === 'Relevance' && isML) {
      const val = Number(draft[col]) || 0;
      return (
        <div className="flex gap-1.5 py-1">
          {[1,2,3,4,5].map(star => (
            <button key={star} type="button" onClick={() => commit(col, String(star))}
              className={`text-3xl transition-all active:scale-90 ${val >= star ? 'text-yellow-400' : 'text-slate-200'}`}
            >★</button>
          ))}
        </div>
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
    else if ((isVSetup || isASetup) && col === 'Status')
      opts = ['To Do', 'In Progress', 'Done'];
    else if ((isVSetup || isASetup) && col === 'Assignee')
      opts = [...new Set([currentUser?.name, ...(allData['VideoSetup'] || []).map((item: any) => item["Assignee"]), ...(allData['AudioSetup'] || []).map((item: any) => item["Assignee"])].filter(Boolean).map(String))].sort() as string[];
    else if (isML && col === 'Theme')
      opts = [...new Set(sessions.flatMap((s: any) => (s.Theme || '').split(',').map((x: string) => x.trim())).filter(Boolean))].sort() as string[];
    else if (isGuide && col === 'City')
      opts = [...new Set([...events.map((e: any) => e.City), ...sessions.map((s: any) => s.City)].filter(Boolean).flatMap((c: string) => c.split(',').map((x: string) => x.trim())).filter(Boolean))].sort() as string[];
    else if (isGuide && col === 'Category')
      opts = ['Satsang', 'Kirtan', 'Discourse', 'Meditation', 'Prayer', 'Other'];
    else if (isGuide && col === 'Event')
      opts = events.map((e: any) => e["Event Name"]).filter(Boolean).sort() as string[];

    opts = [...new Set([...opts, ...(customTags[tableName]?.[col] || [])])].sort();

  const tagClass = UNIFORM_DROPDOWN_STYLE;

const hasDropdown = opts.length > 0
  || (isEv && (col === 'Occasion' || col === 'City' || col === 'Year'))
  || (isSe && (col === 'City' || col === 'Occasion' || col === 'Time Of Day' || col === 'SessionType' || col === 'Parent Event'))
  || ((isVSetup || isASetup) && (col === 'Status' || col === 'Assignee'))
  || (isGuide && (col === 'City' || col === 'Category' || col === 'Event'));
if (hasDropdown) {
  const isMulti = col === 'Occasion' || col === 'City' || col === 'Tags' || columnTypes[tableName]?.[col] === 'badge_multi';
  return (
    <CellDropdown
      value={draft[col] || ''}
      options={opts}
      isMulti={isMulti}
      onCommit={val => commit(col, val)}
      onCancel={onClose}
      onAddOption={val => onAddCustomTag(tableName, col, val)}
      removableOptions={opts}
      onRemoveOption={val => onRemoveTag(tableName, col, val)}
      placeholder={`Select ${col}…`}
      tagClass={tagClass}
    />
  );
}
    // Image / attachment columns — render thumbnails + open image manager
    const imageColNames = new Set(['Images', 'Attachments', 'Attachment', 'images', 'attachments']);
    if (imageColNames.has(col) && onImageManage) {
      const urlRegex = /\((https?:\/\/[^)]+|data:image\/[^;]+;base64,[^)]+)\)/g;
      const thumbs: string[] = [];
      let m2;
      const rawStr = draft[col] || '';
      const re2 = new RegExp(urlRegex.source, 'g');
      while ((m2 = re2.exec(rawStr)) !== null) thumbs.push(m2[1]);
      return (
        <div className="space-y-2">
          {thumbs.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {thumbs.map((url, idx) => (
                <img key={idx} src={url.replace('export=view', 'export=download')} loading="lazy" className="h-14 w-20 object-cover rounded-xl border border-slate-200 shadow-sm drop-shadow-sm" alt="" />
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={() => onImageManage(col, draftRef.current)}
            className="w-full h-10 flex items-center justify-center gap-2 border-2 border-dashed border-slate-300 rounded-xl text-[12px] font-black uppercase tracking-widest text-slate-500 hover:text-brand-primary hover:border-brand-primary transition-colors bg-white"
          >
            <Plus className="h-4 w-4" />
            {thumbs.length > 0 ? `Manage Images (${thumbs.length})` : 'Add Images'}
          </button>
        </div>
      );
    }

    const longTextCols = new Set(['Notes', 'notes', 'proposalsList', 'Details', 'guidanceLearning', 'ShareData', 'Guidance/Learning', 'Lyrics', 'ProposalsList', 'Attachment Summary', 'attachmentSummary', 'Topic', 'Cue', 'PPG']);
    if (longTextCols.has(col)) {
      return (
        <textarea className={`${inputCls} h-28 resize-none py-2.5`}
          value={draft[col] || ''}
          onChange={e => { const nd = { ...draftRef.current, [col]: e.target.value }; setDraft(nd); }}
          onBlur={() => onSave(draftRef.current)}
          placeholder={`Enter ${col}…`}
        />
      );
    }
    if (col === 'EmailId') {
      return (
        <input
          type="text"
          className={inputCls}
          style={{ color: '#2563eb', WebkitTextFillColor: '#2563eb', textDecoration: 'underline' }}
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
      <div className="flex-1 flex flex-col p-4 min-h-0">
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-3">
          Activity {comments.length > 0 && <span className="text-brand-primary">({comments.length})</span>}
        </div>

        {/* Comment list */}
        <div className="flex-1 overflow-y-auto space-y-3 mb-3 min-h-0 pr-0.5">
          {comments.length === 0 && (
            <div className="text-[11px] text-slate-400 italic">No comments yet. Start the conversation!</div>
          )}
          {comments.map((c: any) => {
            const cid = String(c._id);
            const isOwn = (currentUser?.email && c.authorId === currentUser.email) || (currentUser?.name && c.authorName === currentUser.name);
            return (
              <div key={cid} className="group flex gap-2">
                <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-brand-primary to-brand-primary/60 flex items-center justify-center text-white text-[10px] font-black shrink-0 mt-0.5">
                  {(c.authorName || '?')[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-[11px] font-black text-slate-800">{c.authorName}</span>
                    <span className="text-[9px] text-slate-400">{formatCommentTime(c.createdAt)}</span>
                    {isOwn && (
                      <button onClick={() => deleteComment(cid)} className="ml-auto opacity-100 sm:opacity-0 sm:group-hover:opacity-100 text-[9px] text-red-400 hover:text-red-600 transition-all shrink-0">
                        delete
                      </button>
                    )}
                  </div>
                  <div className="text-[12px] text-slate-700 leading-snug mt-0.5 break-words">
                    {renderCommentText(c.text)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Compose box */}
        <div className="relative shrink-0">
          {/* @mention dropdown */}
          {mentionOpen && (
            <div className="absolute bottom-full left-0 right-0 mb-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden z-[9999]">
              {filteredMentionUsers.length === 0 ? (
                <div className="px-3 py-2.5 text-[11px] text-slate-400 italic">
                  {allUsers.length === 0 ? 'No team members found' : `No match for "@${mentionQuery}"`}
                </div>
              ) : filteredMentionUsers.map((u: any) => (
                <button
                  key={u._id || u.email}
                  onMouseDown={e => { e.preventDefault(); selectMention(u); }}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-brand-primary/5 transition-colors text-left"
                >
                  <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white text-[9px] font-black shrink-0">
                    {(u.name || u.email || '?')[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold text-slate-800 truncate">{u.name || u.email}</div>
                    {u.email && <div className="text-[9px] text-slate-400 truncate">{u.email}</div>}
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden focus-within:border-brand-primary/40 focus-within:ring-1 focus-within:ring-brand-primary/20 transition-all">
            <textarea
              ref={commentInputRef}
              value={commentText}
              onChange={handleCommentInput}
              onKeyDown={e => {
                if (e.key === 'Escape') { e.preventDefault(); setMentionOpen(false); }
                if (e.key === 'Enter' && !e.shiftKey && !mentionOpen) { e.preventDefault(); postComment(); }
              }}
              rows={2}
              placeholder="Comment… type @ to tag someone"
              className="w-full text-[12px] bg-transparent outline-none resize-none text-slate-700 placeholder:text-slate-400 px-3 pt-2.5 pb-1"
            />
            <div className="flex justify-end px-3 pb-2">
              <button
                onClick={postComment}
                disabled={!commentText.trim() || commentPosting}
                className="text-[10px] font-black text-white uppercase tracking-widest bg-brand-primary px-3 py-1.5 rounded-lg hover:bg-brand-primary/90 disabled:opacity-30 transition-colors"
              >
                {commentPosting ? '…' : 'Post'}
              </button>
            </div>
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
          <div className="flex items-center gap-1">
            {wizardSteps.map((_, i) => (
              <div
                key={i}
                onClick={() => setStep(i)}
                className={`${i === step ? 'flex-[2]' : 'flex-1'} py-3 flex items-center cursor-pointer`}
              >
                <div className={`h-1 w-full rounded-full transition-all duration-300 ${
                  i === step ? 'bg-brand-primary' : i < step ? 'bg-brand-primary/40' : 'bg-slate-200'
                }`} />
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-brand-primary uppercase tracking-[0.15em] flex items-center gap-1">
              {currentStepData.label === 'Messages' && <MessageCircle className="h-3 w-3" />}
              {currentStepData.label}
              {currentStepData.label === 'Messages' && comments.length > 0 && (
                <span className="bg-brand-primary text-white text-[8px] font-black px-1.5 py-0.5 rounded-full ml-1">{comments.length}</span>
              )}
            </span>
            <span className="text-[10px] font-bold text-slate-400">
              {step + 1} / {totalSteps}
            </span>
          </div>
        </div>

        {/* Fields / Messages for this step */}
        <div className="flex-1 overflow-y-auto px-5 pb-2 min-h-0">
          {currentStepData.label === 'Messages' ? (
            <div className="flex flex-col h-full gap-3">
              {/* Comment list */}
              <div className="flex-1 space-y-3 overflow-y-auto min-h-0">
                {comments.length === 0 && (
                  <div className="text-[11px] text-slate-400 italic pt-2">No messages yet. Start the conversation!</div>
                )}
                {comments.map((c: any) => {
                  const cid = String(c._id);
                  const isOwn = (currentUser?.email && c.authorId === currentUser.email) || (currentUser?.name && c.authorName === currentUser.name);
                  return (
                    <div key={cid} className="group flex gap-2 pt-1">
                      <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-brand-primary to-brand-primary/60 flex items-center justify-center text-white text-[10px] font-black shrink-0 mt-0.5">
                        {(c.authorName || '?')[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className="text-[11px] font-black text-slate-800">{c.authorName}</span>
                          <span className="text-[9px] text-slate-400">{formatCommentTime(c.createdAt)}</span>
                          {isOwn && (
                            <button onClick={() => deleteComment(cid)} className="ml-auto opacity-100 sm:opacity-0 sm:group-hover:opacity-100 text-[9px] text-red-400 hover:text-red-600 transition-all shrink-0">
                              delete
                            </button>
                          )}
                        </div>
                        <div className="text-[12px] text-slate-700 leading-snug mt-0.5 break-words">
                          {renderCommentText(c.text)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Compose box */}
              <div className="relative shrink-0 pb-1">
                {mentionOpen && (
                  <div className="absolute bottom-full left-0 right-0 mb-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden z-[9999]">
                    {filteredMentionUsers.length === 0 ? (
                      <div className="px-3 py-2.5 text-[11px] text-slate-400 italic">
                        {allUsers.length === 0 ? 'No team members found' : `No match for "@${mentionQuery}"`}
                      </div>
                    ) : filteredMentionUsers.map((u: any) => (
                      <button key={u._id || u.email} onMouseDown={e => { e.preventDefault(); selectMention(u); }}
                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-brand-primary/5 transition-colors text-left"
                      >
                        <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white text-[9px] font-black shrink-0">
                          {(u.name || u.email || '?')[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="text-[11px] font-bold text-slate-800 truncate">{u.name || u.email}</div>
                          {u.email && <div className="text-[9px] text-slate-400 truncate">{u.email}</div>}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                <div className="border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden focus-within:border-brand-primary/40 focus-within:ring-1 focus-within:ring-brand-primary/20 transition-all">
                  <textarea
                    ref={commentInputRef}
                    value={commentText}
                    onChange={handleCommentInput}
                    onKeyDown={e => {
                      if (e.key === 'Escape') { e.preventDefault(); setMentionOpen(false); }
                      if (e.key === 'Enter' && !e.shiftKey && !mentionOpen) { e.preventDefault(); postComment(); }
                    }}
                    rows={2}
                    placeholder="Comment… type @ to tag someone"
                    className="w-full text-[12px] bg-transparent outline-none resize-none text-slate-700 placeholder:text-slate-400 px-3 pt-2.5 pb-1"
                  />
                  <div className="flex justify-end px-3 pb-2">
                    <button onClick={postComment} disabled={!commentText.trim() || commentPosting}
                      className="text-[10px] font-black text-white uppercase tracking-widest bg-brand-primary px-3 py-1.5 rounded-lg hover:bg-brand-primary/90 disabled:opacity-30 transition-colors flex items-center gap-1"
                    >
                      {commentPosting ? '…' : <><Send className="h-3 w-3" />Post</>}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-5 py-2">
              {currentStepData.fields.map(col => (
                <div key={col}>
                  <label className="text-[11px] font-black text-slate-600 uppercase tracking-[0.15em] block mb-2">
                    {colLabel(col)}
                  </label>
                  {renderField(col)}
                </div>
              ))}
            </div>
          )}
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
                {step === totalSteps - 2 ? 'Messages' : 'Next'}
              </button>
            ) : (
              <button
                onClick={() => { onSave(draftRef.current); onClose(); }}
                className="flex-[2] h-12 bg-green-600 text-white rounded-2xl text-[12px] font-black uppercase tracking-widest hover:bg-green-700 transition-colors shadow-lg shadow-green-600/25"
              >
                Done
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
          <div className="min-w-0 flex-1">
            <div className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5">{tableName}</div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight truncate max-w-[480px]">{recordTitle}</h2>
          </div>
          <div className="flex items-center gap-2 ml-4 shrink-0">
            <button
              onClick={() => { onSave(draftRef.current); onClose(); }}
              className="h-9 px-4 flex items-center gap-1.5 bg-brand-primary text-white rounded-xl text-[12px] font-black uppercase tracking-widest shadow-sm hover:bg-brand-primary/90 transition-colors"
            >
              Save & Close
            </button>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-200 transition-colors">
              <X className="h-5 w-5 text-slate-500" />
            </button>
          </div>
        </div>

        {/* Body: fields + sidebar */}
        <div className="flex flex-1 overflow-hidden min-h-0">
          <div className="flex-1 overflow-y-auto p-6 space-y-4 thin-scrollbar">
            {columns.map(col => (
              <div key={col}>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] block mb-1.5">{colLabel(col)}</label>
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

// ── InboxPanel ────────────────────────────────────────────────────────────────
const InboxPanel = React.memo(function InboxPanel({ email, onClose, onOpenRecord, onUnreadChange, isMobileView, currentUser }: {
  email: string;
  onClose: () => void;
  onOpenRecord: (tableName: string, collection: string, recordId: string) => void;
  onUnreadChange?: (count: number) => void;
  isMobileView?: boolean;
  currentUser?: any;
}) {
  const [items, setItems] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showHistory, setShowHistory] = React.useState(false);
  const [replyingTo, setReplyingTo] = React.useState<string | null>(null);
  const [replyText, setReplyText] = React.useState('');
  const [replyPosting, setReplyPosting] = React.useState(false);
  const replyInputRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    if (!email) return;
    setLoading(true);
    window.fetch(`/api/notifications?email=${encodeURIComponent(email)}`)
      .then(r => r.ok ? r.json() : [])
      .then(d => { setItems(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [email]);

  React.useEffect(() => {
    onUnreadChange?.(items.filter(n => !n.read && !n.cleared).length);
  }, [items, onUnreadChange]);

  const markRead = async (id: string) => {
    setItems(prev => prev.map(n => String(n._id) === id ? { ...n, read: true } : n));
    await window.fetch(`/api/notifications/${id}/read`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
  };

  const markAllRead = async () => {
    setItems(prev => prev.map(n => ({ ...n, read: true })));
    await window.fetch('/api/notifications/read-all', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
  };

  const clearNotif = async (id: string) => {
    setItems(prev => prev.map(n => String(n._id) === id ? { ...n, cleared: true, read: true } : n));
    await window.fetch(`/api/notifications/${id}/clear`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
  };

  const deleteNotif = async (id: string) => {
    setItems(prev => prev.filter(n => String(n._id) !== id));
    await window.fetch(`/api/notifications/${id}`, { method: 'DELETE' });
  };

  const clearAll = async () => {
    if (showHistory) {
      setItems(prev => prev.filter(n => !n.cleared));
      await window.fetch('/api/notifications/clear-all', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
    } else {
      setItems(prev => prev.map(n => ({ ...n, cleared: true, read: true })));
      await window.fetch('/api/notifications/clear-all', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
    }
  };

  const openReply = (n: any) => {
    const nid = String(n._id);
    if (replyingTo === nid) { setReplyingTo(null); return; }
    markRead(nid);
    const firstName = (n.authorName || '').split(' ')[0];
    setReplyText(firstName ? `@${firstName} ` : '');
    setReplyingTo(nid);
    setTimeout(() => replyInputRef.current?.focus(), 80);
  };

  const postReply = async (n: any) => {
    const text = replyText.trim();
    if (!text || replyPosting) return;
    setReplyPosting(true);
    try {
      const mentions = [...text.matchAll(/@(\w+)/g)].map(m => m[1]);
      await window.fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collection: n.collection,
          recordId: n.recordId,
          text,
          authorId: currentUser?.email || '',
          authorName: currentUser?.name || currentUser?.email || 'Anonymous',
          mentions,
          recordTitle: n.recordTitle,
          tableName: n.tableName,
        }),
      });
      setReplyText('');
      setReplyingTo(null);
    } finally {
      setReplyPosting(false);
    }
  };

  const fmt = (raw: any) => {
    const d = new Date(raw);
    if (isNaN(d.getTime())) return '';
    const diff = Date.now() - d.getTime();
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const visibleItems = items.filter(n => showHistory ? n.cleared : !n.cleared);
  const unread = items.filter(n => !n.read && !n.cleared).length;

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[650]"
        style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)' }}
        onClick={onClose}
      />
      {/* Panel — bottom sheet on mobile, right side-panel on desktop */}
      <motion.div
        initial={isMobileView ? { y: '100%' } : { x: '100%' }}
        animate={isMobileView ? { y: 0 } : { x: 0 }}
        exit={isMobileView ? { y: '100%' } : { x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 280 }}
        className="fixed z-[660] bg-white shadow-2xl flex flex-col
        inset-x-0 bottom-0 rounded-t-3xl max-h-[92vh]
        sm:inset-y-0 sm:right-0 sm:left-auto sm:bottom-auto sm:rounded-none sm:max-h-none sm:w-[400px] sm:border-l sm:border-slate-200"
        style={{ paddingBottom: 'max(0px, env(safe-area-inset-bottom))' }}
      >
        {/* Mobile drag handle */}
        <div className="sm:hidden flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 bg-slate-300 rounded-full" />
        </div>
        {/* Header */}
        <div className="h-14 sm:h-16 px-5 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Inbox className="h-4 w-4 text-brand-primary" />
            <span className="text-[15px] font-black text-slate-900">{showHistory ? 'History' : 'Inbox'}</span>
            {unread > 0 && !showHistory && <span className="h-5 min-w-[20px] px-1.5 bg-brand-primary text-white text-[10px] font-black rounded-full flex items-center justify-center">{unread}</span>}
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setShowHistory(!showHistory)} className="text-[10px] font-black text-slate-500 hover:text-brand-primary uppercase tracking-widest transition-colors px-2 py-1 rounded-lg hover:bg-brand-primary/5">
              {showHistory ? 'Back to Inbox' : 'History'}
            </button>
            {!showHistory && unread > 0 && (
              <button onClick={markAllRead} className="text-[10px] font-black text-slate-500 hover:text-brand-primary uppercase tracking-widest transition-colors px-2 py-1 rounded-lg hover:bg-brand-primary/5">
                Mark all read
              </button>
            )}
            {items.length > 0 && (
              <button onClick={clearAll} className="text-[10px] font-black text-slate-500 hover:text-red-500 uppercase tracking-widest transition-colors px-2 py-1 rounded-lg hover:bg-red-50">
                Clear all
              </button>
            )}
            <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-slate-100 transition-colors">
              <X className="h-5 w-5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {loading && (
            <div className="flex items-center justify-center h-32 text-[12px] text-slate-400">Loading…</div>
          )}
          {!loading && visibleItems.length === 0 && (
            <div className="flex flex-col items-center justify-center h-48 gap-3 text-center px-8">
              <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center">
                <Inbox className="h-6 w-6 text-slate-300" />
              </div>
              <div className="text-[13px] font-bold text-slate-400">{showHistory ? 'No cleared notifications' : 'No notifications yet'}</div>
              <div className="text-[11px] text-slate-400">{showHistory ? 'Cleared notifications will appear here' : "You'll see mentions and comments here"}</div>
            </div>
          )}
          {!loading && visibleItems.map((n: any) => {
            const nid = String(n._id);
            const isExpanded = replyingTo === nid;
            return (
              <div key={nid} className={`border-b border-slate-100 transition-colors ${!n.read ? 'bg-brand-primary/[0.03]' : ''} ${isExpanded ? 'bg-slate-50' : ''}`}>
                {/* Notification row */}
                <div
                  onClick={() => openReply(n)}
                  className="group px-5 py-4 cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  <div className="flex gap-3">
                    {/* Avatar */}
                    <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-brand-primary to-brand-primary/60 flex items-center justify-center text-white text-[11px] font-black shrink-0 mt-0.5">
                      {(n.authorName || '?')[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      {/* Meta line */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[12px] font-black text-slate-800">{n.authorName}</span>
                        <span className="text-[11px] text-slate-400">mentioned you in</span>
                        <span className="text-[11px] font-bold text-brand-primary">{n.tableName}</span>
                      </div>
                      {/* Record title */}
                      <div className="text-[13px] font-semibold text-slate-800 mt-0.5 truncate">{n.recordTitle}</div>
                      {/* Comment preview */}
                      <div className="text-[12px] text-slate-500 mt-1 leading-snug line-clamp-2">{n.text}</div>
                      {/* Time + open link */}
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-[10px] text-slate-400">{fmt(n.createdAt)}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); markRead(nid); onOpenRecord(n.tableName, n.collection, n.recordId); onClose(); }}
                          className="text-[10px] font-bold text-brand-primary hover:underline flex items-center gap-0.5"
                        >
                          Open record <ArrowUpRight className="h-2.5 w-2.5" />
                        </button>
                      </div>
                    </div>
                    {/* Right side: done check + chevron */}
                    <div className="flex flex-col items-center gap-1 shrink-0 mt-0.5">
                      <button
                        onClick={(e) => { e.stopPropagation(); showHistory ? deleteNotif(nid) : clearNotif(nid); }}
                        className="h-6 w-6 rounded-full border-2 border-slate-200 group-hover:border-green-400 flex items-center justify-center text-transparent group-hover:text-green-400 hover:bg-green-50 hover:border-green-500 hover:text-green-500 transition-all"
                        title={showHistory ? 'Delete permanently' : 'Mark done'}
                      >
                        <Check className="h-3 w-3" />
                      </button>
                      <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform mt-1 ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                  </div>
                </div>

                {/* Inline reply box */}
                {isExpanded && (
                  <div className="px-5 pb-4 pt-1" onClick={(e) => e.stopPropagation()}>
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                      <textarea
                        ref={replyInputRef}
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); postReply(n); }
                          if (e.key === 'Escape') setReplyingTo(null);
                        }}
                        rows={2}
                        placeholder="Write a reply… Enter to send"
                        className="w-full text-[12px] bg-transparent outline-none resize-none text-slate-700 placeholder:text-slate-400 px-3 pt-2.5 pb-1"
                      />
                      <div className="flex items-center justify-end gap-2 px-3 pb-2.5">
                        <button
                          onClick={() => setReplyingTo(null)}
                          className="text-[10px] font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest px-2 py-1 rounded-lg transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => postReply(n)}
                          disabled={!replyText.trim() || replyPosting}
                          className="text-[10px] font-black text-white uppercase tracking-widest bg-brand-primary px-3 py-1.5 rounded-lg hover:bg-brand-primary/90 disabled:opacity-30 transition-colors flex items-center gap-1"
                        >
                          {replyPosting ? '…' : <><Send className="h-3 w-3" /> Reply</>}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </motion.div>
    </>
  );
});

const RecordDetailView = ({ item, columns, onBack, tableName, sessions = [], musicLogs = [], onSessionClick, onEdit, onDelete, getPrimaryField, setLinkedRecordPopup }: { item: any, columns: string[], onBack: () => void, tableName: string, sessions?: any[], musicLogs?: any[], onSessionClick?: (s: any) => void, onEdit?: () => void, onDelete?: () => void, getPrimaryField: (table: string) => string, setLinkedRecordPopup: (p: any) => void }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full space-y-6 pb-20"
    >
      {/* 1. TOP NAVIGATION */}
      <div className="flex items-center justify-between gap-2 mb-6 px-4 md:px-8 pt-2">
        <div className="flex flex-col gap-1">
          <Button
            variant="outline"
            onClick={onBack}
            className="self-start bg-white border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl px-3 py-2 h-auto text-[12px] font-semibold shadow-sm"
          >
            <ChevronLeft className="h-3.5 w-3.5 mr-1" />
            Back to {tableName}
          </Button>
          <h2 className="text-2xl font-black uppercase tracking-tight flex gap-2 mt-1">
            <span className="text-black">Record</span>
            <span className="text-brand-primary">Details</span>
          </h2>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {onEdit && (
            <button onClick={onEdit} className="h-9 px-4 flex items-center gap-1.5 bg-brand-primary text-white rounded-xl text-[12px] font-black uppercase tracking-widest shadow-sm hover:bg-brand-primary/90 transition-colors">
              <Pencil className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Edit</span>
            </button>
          )}
          {onDelete && (
            <button onClick={() => { if (window.confirm('Delete this record?')) onDelete?.(); }} className="h-9 px-4 flex items-center gap-1.5 bg-red-50 text-red-600 border border-red-200 rounded-xl text-[12px] font-black uppercase tracking-widest hover:bg-red-100 transition-colors">
              <Trash2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Delete</span>
            </button>
          )}
        </div>
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
                      {colLabel(col)}
                    </span>
                    
                    {/* UPDATED VALUE COLOR: Changed from slate-800 to slate-900 to stand out */}
                    <div className="text-[15px] font-bold text-slate-900 break-words leading-relaxed">
                      {(() => {
                       const val = item[col];

                       if (tableName === 'Tracks' && (col === 'Plays' || col === 'PlayID')) {
                         if (!val) return <span className="text-slate-300 italic font-normal">—</span>;
                         const vals = String(val).split(',').map(s => s.trim()).filter(Boolean);
                         return (
                           <div className="flex flex-wrap gap-1.5 mt-1">
                             {vals.map((playId, idx) => {
                               const musicLogRecord = musicLogs.find((ml: any) => String(ml.PlayID) === playId);
                               const displayLabel = musicLogRecord?.Track ? `${musicLogRecord.Track} (${playId})` : playId;
                               return (
                                 <span
                                   key={idx}
                                   onClick={(e) => {
                                     e.stopPropagation();
                                     if (musicLogRecord) {
                                       const nameField = getPrimaryField('MusicLog');
                                       const fields = Object.keys(musicLogRecord).filter(k => !['_id', 'id', 'created_at', '__v'].includes(k) && k !== nameField).slice(0, 8);
                                       setLinkedRecordPopup({ record: musicLogRecord, tableName: 'MusicLog', nameField, fields });
                                     }
                                   }}
                                   className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-sm border ${musicLogRecord ? 'bg-brand-primary/10 text-brand-primary border-brand-primary/30 cursor-pointer hover:bg-brand-primary/20' : 'bg-slate-100 text-slate-700 border-slate-200'}`}
                                 >
                                   {displayLabel}
                                   {musicLogRecord && <ArrowUpRight className="h-3 w-3 opacity-60 shrink-0" />}
                                 </span>
                               );
                             })}
                           </div>
                         );
                       }

// Change this line to include "Session" and "🕘 Session"
const sessionFieldNames = ["Sessions", "Imported table", "Session", "🕘 Session"];
if (sessionFieldNames.includes(col) && typeof val === 'string') {
  return (
    <div className="flex flex-col gap-1.5 mt-1">
      {val.split(',').map((tag, i) => {
        const sName = tag.trim();
        const linked = sessions.find((s: any) => s["Session Name"] === sName);
        return (
          <div
            key={i}
            onClick={() => { if (linked) onSessionClick?.(linked); }}
            className={`w-full px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold leading-snug flex items-start gap-1.5 ${
              linked
                ? 'bg-brand-primary/8 text-brand-primary border-brand-primary/25 hover:bg-brand-primary/15 cursor-pointer'
                : 'bg-slate-50 text-slate-600 border-slate-200 cursor-default'
            }`}
          >
            <span className="flex-1 break-words">{sName}</span>
            {linked && <ArrowUpRight className="h-3 w-3 shrink-0 mt-0.5 opacity-50" />}
          </div>
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
        <span key={i} className={getTagStyle(tag.trim())}>
          {tag.trim()}
        </span>
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
          {(item["Images"] || item["Attachments"] || item["Attachment"]) && (
             <Card className="bg-slate-900 border-none rounded-[32px] overflow-hidden shadow-xl">
                <CardHeader className="border-b border-white/5">
                  <CardTitle className="text-xs font-black text-white uppercase tracking-widest">Media Attachments</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                   <div className="max-w-md mx-auto">
                <CardImageGallery imageString={item["Images"] || item["Attachments"] || item["Attachment"]} />
                   </div>
                </CardContent>
             </Card>
          )}
          
        </div>
      </div>
    </motion.div>
  );
};
const FIELD_TYPES = [
  { id: 'text',        label: 'Text',        icon: AlignLeft,   desc: 'Plain single-line text' },
  { id: 'long_text',   label: 'Long Text',   icon: AlignLeft,   desc: 'Multiline, shown italic' },
  { id: 'number',      label: 'Number',      icon: Hash,        desc: 'Monospace numeric value' },
  { id: 'id',          label: 'ID / Code',   icon: Hash,        desc: 'Monospace ID in brand color' },
  { id: 'date',        label: 'Date',        icon: Calendar,    desc: 'Date, shown monospace' },
  { id: 'time',        label: 'Time',        icon: Clock,       desc: 'Time value (HH:MM)' },
  { id: 'year',        label: 'Year',        icon: Calendar,    desc: 'Year pill badge' },
  { id: 'checkbox',    label: 'Checkbox',    icon: CheckSquare, desc: 'True / false toggle' },
  { id: 'yes_no',      label: 'Yes / No',    icon: CheckSquare, desc: 'Yes or No colored badge' },
  { id: 'status',      label: 'Status',      icon: Zap,         desc: 'Ready / Pending / other' },
  { id: 'select',      label: 'Select',      icon: List,        desc: 'Dropdown single-select' },
  { id: 'badge',       label: 'Badge',       icon: List,        desc: 'Single blue outlined badge' },
  { id: 'badge_multi', label: 'Multi-Badge', icon: Layers,      desc: 'Comma-split blue badges' },
  { id: 'email',       label: 'Email',       icon: Mail,        desc: 'Email address link' },
  { id: 'url',         label: 'URL',         icon: Link2,       desc: 'Shows as "Link" anchor' },
  { id: 'phone',          label: 'Phone',            icon: Phone,        desc: 'Phone number' },
  { id: 'link_to_record', label: 'Link to Record',   icon: Link2,        desc: 'Links to another table' },
  { id: 'lookup',         label: 'Lookup',           icon: Search,       desc: 'Field pulled from linked table' },
] as const;
type FieldType = typeof FIELD_TYPES[number]['id'];

const EmptyState = React.memo(function EmptyState({
  searchQuery,
  onClearSearch,
  onAddFirst,
}: {
  searchQuery: string;
  onClearSearch: () => void;
  onAddFirst: () => void;
}) {
  if (searchQuery) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center col-span-full">
        <div className="h-14 w-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
          <Search className="h-6 w-6 text-slate-300" />
        </div>
        <div className="text-[15px] font-black text-slate-800 mb-1">No results for "{searchQuery}"</div>
        <div className="text-[12px] text-slate-400 mb-4">Try adjusting your search or clear it to see all records</div>
        <button
          onClick={onClearSearch}
          className="text-[11px] font-black text-brand-primary uppercase tracking-widest hover:underline flex items-center gap-1.5"
        >
          <X className="h-3 w-3" /> Clear search
        </button>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center col-span-full">
      <div className="h-14 w-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
        <Plus className="h-7 w-7 text-slate-300" />
      </div>
      <div className="text-[15px] font-black text-slate-800 mb-1">No records yet</div>
      <div className="text-[12px] text-slate-400 mb-4">Get started by adding the first record</div>
      <button
        onClick={onAddFirst}
        className="h-10 px-5 bg-brand-primary text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-brand-primary/90 transition-colors"
      >
        Add first record
      </button>
    </div>
  );
});

type FilterOperator = 'contains' | 'not_contains' | 'equals' | 'not_equals' | 'is_empty' | 'is_not_empty' | 'greater_than' | 'less_than';

interface FilterCondition {
  id: string;
  type: 'condition';
  field: string;
  operator: FilterOperator;
  value: string;
}

interface FilterGroup {
  id: string;
  type: 'group';
  logic: 'AND' | 'OR';
  conditions: (FilterCondition | FilterGroup)[];
}

const evaluateCondition = (item: any, cond: FilterCondition): boolean => {
  const val = String(item[cond.field] ?? '').toLowerCase();
  const target = String(cond.value ?? '').toLowerCase();
  switch (cond.operator) {
    case 'contains': return val.includes(target);
    case 'not_contains': return !val.includes(target);
    case 'equals': return val === target;
    case 'not_equals': return val !== target;
    case 'is_empty': return val === '';
    case 'is_not_empty': return val !== '';
    case 'greater_than': return Number(item[cond.field]) > Number(cond.value);
    case 'less_than': return Number(item[cond.field]) < Number(cond.value);
    default: return true;
  }
};

const evaluateGroup = (item: any, group: FilterGroup): boolean => {
  if (group.conditions.length === 0) return true;
  if (group.logic === 'AND') {
    return group.conditions.every(c => c.type === 'group' ? evaluateGroup(item, c) : evaluateCondition(item, c));
  } else {
    return group.conditions.some(c => c.type === 'group' ? evaluateGroup(item, c) : evaluateCondition(item, c));
  }
};

const FilterNodeUI = ({ node, onChange, onDelete, columns, getOptions }: { node: FilterGroup | FilterCondition, onChange: (node: FilterGroup | FilterCondition) => void, onDelete: () => void, columns: string[], getOptions: (col: string) => string[] }) => {
  if (node.type === 'group') {
    return (
      <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 space-y-3 w-full">
        <div className="flex items-center justify-between gap-2">
          <select value={node.logic} onChange={e => onChange({ ...node, logic: e.target.value as 'AND' | 'OR' })} className="h-8 bg-white border border-slate-300 rounded-lg px-2 text-xs font-bold text-brand-primary outline-none focus:border-brand-primary">
            <option value="AND">And</option>
            <option value="OR">Or</option>
          </select>
          {node.id !== 'root' && (
            <button onClick={onDelete} className="ml-auto p-1.5 text-slate-400 hover:text-red-500 rounded-md transition-colors"><X className="h-3.5 w-3.5" /></button>
          )}
        </div>
        <div className="pl-3 sm:pl-4 border-l-2 border-slate-200 space-y-2">
          {node.conditions.map((child, i) => (
            <FilterNodeUI 
              key={child.id} 
              node={child} 
              onChange={newChild => {
                const newConds = [...node.conditions];
                newConds[i] = newChild;
                onChange({ ...node, conditions: newConds });
              }} 
              onDelete={() => {
                const newConds = node.conditions.filter((_, idx) => idx !== i);
                onChange({ ...node, conditions: newConds });
              }} 
              columns={columns} 
              getOptions={getOptions}
            />
          ))}
          <div className="flex flex-wrap gap-2 pt-1">
            <button onClick={() => onChange({ ...node, conditions: [...node.conditions, { id: Math.random().toString(36).substring(2,9), type: 'condition', field: columns[0] || '', operator: 'contains', value: '' }] })} className="text-[11px] font-bold text-slate-500 hover:text-brand-primary flex items-center gap-1 bg-white border border-slate-200 px-2 py-1.5 rounded-md transition-colors shadow-sm"><Plus className="h-3 w-3" /> Add Rule</button>
            <button onClick={() => onChange({ ...node, conditions: [...node.conditions, { id: Math.random().toString(36).substring(2,9), type: 'group', logic: 'AND', conditions: [{ id: Math.random().toString(36).substring(2,9), type: 'condition', field: columns[0] || '', operator: 'contains', value: '' }] }] })} className="text-[11px] font-bold text-slate-500 hover:text-brand-primary flex items-center gap-1 bg-white border border-slate-200 px-2 py-1.5 rounded-md transition-colors shadow-sm"><Layers className="h-3 w-3" /> Add Group</button>
          </div>
        </div>
      </div>
    );
  } else {
    return (
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 bg-white p-2.5 sm:p-2 rounded-lg border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2">
          <select value={node.field} onChange={e => onChange({ ...node, field: e.target.value, value: '' })} className="h-8 bg-slate-50 border border-slate-200 rounded-md px-2 text-[11px] text-slate-700 outline-none flex-1 sm:flex-none sm:w-40 truncate focus:border-brand-primary">
            <option value="">Select field...</option>
            {columns.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button onClick={onDelete} className="sm:hidden p-1.5 text-slate-400 hover:text-red-500 rounded-md transition-colors shrink-0"><X className="h-3.5 w-3.5" /></button>
        </div>
        <select value={node.operator} onChange={e => onChange({ ...node, operator: e.target.value as FilterOperator })} className="h-8 bg-slate-50 border border-slate-200 rounded-md px-2 text-[11px] text-slate-700 outline-none w-full sm:w-32 focus:border-brand-primary">
          <option value="contains">Contains</option>
          <option value="not_contains">Does not contain</option>
          <option value="equals">Equals</option>
          <option value="not_equals">Does not equal</option>
          <option value="is_empty">Is empty</option>
          <option value="is_not_empty">Is not empty</option>
          <option value="greater_than">Greater than</option>
          <option value="less_than">Less than</option>
        </select>
        {!['is_empty', 'is_not_empty'].includes(node.operator) && (
          getOptions(node.field).length > 0 ? (
            <select value={node.value} onChange={e => onChange({ ...node, value: e.target.value })} className="h-8 bg-slate-50 border border-slate-200 rounded-md px-2 text-[11px] text-slate-700 outline-none w-full sm:flex-1 sm:min-w-[100px] focus:border-brand-primary">
              <option value="">Select value...</option>
              {getOptions(node.field).map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          ) : (
            <input value={node.value} onChange={e => onChange({ ...node, value: e.target.value })} className="h-8 bg-slate-50 border border-slate-200 rounded-md px-3 text-[11px] text-slate-700 outline-none w-full sm:flex-1 sm:min-w-[100px] focus:border-brand-primary" placeholder="Value..." />
          )
        )}
        <button onClick={onDelete} className="hidden sm:block p-1.5 text-slate-400 hover:text-red-500 rounded-md transition-colors shrink-0"><X className="h-3.5 w-3.5" /></button>
      </div>
    );
  }
};

export default function App() {
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
const [editDraft, setEditDraft] = useState<any>(null);
const [expandedRecord, setExpandedRecord] = useState<any>(null);
const [inboxOpen, setInboxOpen] = useState(false);
const [notifications, setNotifications] = useState<any[]>([]);
const [notificationsLoading, setNotificationsLoading] = useState(true);
const [editingCell, setEditingCell] = useState<string | null>(null);
// Tracks whether a mousedown happened inside the editing row — suppresses
// blur-triggered saves when the user is just clicking a different cell in the same row.
const clickingCellRef = useRef(false);
const [cellPreview, setCellPreview] = useState<{ label: string; value: string; record: any } | null>(null);
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
  const [columnOrder, setColumnOrder] = useState<Record<string, string[]>>({});
  const [frozenUpTo, setFrozenUpTo] = useState<Record<string, number>>({});
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const dragColRef = useRef<string | null>(null);
  const [groupByField, setGroupByField] = useState<string | null>(null);
  const [customTags, setCustomTags] = useState<Record<string, Record<string, string[]>>>({});
  const [advancedFilter, setAdvancedFilter] = useState<FilterGroup>({ id: 'root', type: 'group', logic: 'AND', conditions: [] });
  const [pendingFilter, setPendingFilter] = useState<FilterGroup>({ id: 'root', type: 'group', logic: 'AND', conditions: [] });
  const [isAdvancedFilterOpen, setIsAdvancedFilterOpen] = useState(false);
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
  const activeTableRef = useRef('Home');
  activeTableRef.current = activeTable;
  const [toast, setToast] = useState<{ msg: string; type: 'error' | 'success' } | null>(null);
  const showToast = (msg: string, type: 'error' | 'success' = 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };
  const [isAdding, setIsAdding] = useState(false);
  const mutationInFlight = useRef(0); // counts pending add/delete so poll is skipped
 const [viewMode, setViewMode] = useState<'visual' | 'grid' | 'card'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isMobileView, setIsMobileView] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);
  const [addWizardStep, setAddWizardStep] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [mobileGroupOpen, setMobileGroupOpen] = useState(false);
  const [mobileSortOpen, setMobileSortOpen] = useState(false);
  const [mobileFieldsOpen, setMobileFieldsOpen] = useState(false);
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
    const params = new URLSearchParams(window.location.search);
    if (params.get('error') === 'access_denied') {
      setLoginError('Access denied. You must be added by an administrator.');
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    const savedUser = sessionStorage.getItem('dyatra_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        sessionStorage.removeItem('dyatra_user');
      }
    }
    setLoading(false);

    const checkHealth = async () => {
      try {
        const res = await window.fetch('/api/health');
        if (!res.ok) {
          console.warn('Health check returned non-OK status:', res.status);
          try {
            const data = await res.json();
            setHealth({ mongodb: false, mongodbError: data.message || `Server error: ${res.status}` });
            console.error('Health check error details:', data);
          } catch {
            setHealth({ mongodb: false, mongodbError: `Server error: ${res.status}` });
          }
          return;
        }
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await res.json();
          setHealth(data);
        } else {
          console.warn('Health check returned non-JSON content:', await res.text());
        }
      } catch (e: any) {
        console.error('Health check failed:', e);
        setHealth({ mongodb: false, mongodbError: e.message || 'Connection failed' });
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobileView(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isConfigured = health?.mongodb; // Only require MongoDB for general operation

const [imageManager, setImageManager] = useState<{
  item: any;
  column: string;
  collection: string;
  isOpen: boolean;
} | null>(null);

// Resolve collection name for the current active table
const getImageCollection = () => {
  switch (activeTable) {
    case 'Events': return 'events';
    case 'Session': return 'sessions';
    case 'MusicLog': return 'musiclog';
    case 'VideoLog': return 'videolog';
    case 'Tracks': return 'media';
    case 'DyatraChecklist': return 'checklist';
    case 'Guidance & Learning': return 'guidance';
    case 'LED': return 'led_details';
    case 'DataSharing': return 'locations';
    case 'VideoSetup': return 'videosetup';
    case 'AudioSetup': return 'audiosetup';
    default: return activeTable.toLowerCase();
  }
};

// Called by AttachmentManagerDialog after each successful DB save
const handleImageSaved = (newValue: string) => {
  if (!imageManager?.item) return;
  const recordId = String(imageManager.item._id || imageManager.item.id || '');
  const col = imageManager.column;
  const coll = imageManager.collection;

  const setterMap: Record<string, React.Dispatch<React.SetStateAction<any[]>>> = {
    events: setEvents as any, sessions: setSessions as any,
    musiclog: setMusicLogs, videolog: setVideoLogs,
    media: setMedia as any, checklist: setChecklist as any,
    guidance: setGuidance as any, led_details: setLedDetails as any,
    locations: setLocations, videosetup: setVideoSetup, audiosetup: setAudioSetup,
  };
  const setter = setterMap[coll];
  if (setter) {
    setter((prev: any[]) => prev.map(r =>
      (String(r._id) === recordId || String(r.id) === recordId)
        ? { ...r, [col]: newValue }
        : r
    ));
  }
  setExpandedRecord((prev: any) =>
    prev && String(prev._id || prev.id) === recordId ? { ...prev, [col]: newValue } : prev
  );
  setEditDraft((prev: any) =>
    prev && String(prev._id || prev.id) === recordId ? { ...prev, [col]: newValue } : prev
  );
};

const _imgSavedRef = useRef(handleImageSaved);
_imgSavedRef.current = handleImageSaved;
const stableOnImageSaved = useCallback((v: string) => _imgSavedRef.current(v), []);
const stableOnImageClose = useCallback(() => setImageManager(null), []);


const [selectedIds, setSelectedIds] = useState<string[]>([]);
const [isActionToolbarOpen, setIsActionToolbarOpen] = useState(false);

const toggleRowSelection = (id: string) => {
  setSelectedIds(prev => 
    prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
  );
};

const handleBulkDelete = async () => {
  if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} record${selectedIds.length !== 1 ? 's' : ''}?`)) return;

  let collection = '';
  switch (activeTable) {
    case 'Events':              collection = 'events'; break;
    case 'Session':             collection = 'sessions'; break;
    case 'MusicLog':            collection = 'musiclog'; break;
    case 'VideoLog':            collection = 'videolog'; break;
    case 'Tracks':              collection = 'media'; break;
    case 'DyatraChecklist':     collection = 'checklist'; break;
    case 'Guidance & Learning': collection = 'guidance'; break;
    case 'LED':                 collection = 'led_details'; break;
    case 'DataSharing':         collection = 'locations'; break;
    case 'VideoSetup':          collection = 'videosetup'; break;
    case 'AudioSetup':          collection = 'audiosetup'; break;
    default: console.error('Unknown table for delete:', activeTable); return;
  }

  // Optimistic UI update
  const optimisticSetter: Record<string, React.Dispatch<React.SetStateAction<any[]>>> = {
    'events': setEvents as any, 'sessions': setSessions as any,
    'musiclog': setMusicLogs, 'videolog': setVideoLogs,
    'media': setMedia as any, 'checklist': setChecklist as any,
    'guidance': setGuidance as any, 'led_details': setLedDetails as any,
    'locations': setLocations, 'videosetup': setVideoSetup, 'audiosetup': setAudioSetup,
  };
  const setter = optimisticSetter[collection];
  if (setter) setter(prev => prev.filter(r => !selectedIds.includes(r._id || r.id)));

  const originalSelectedIds = [...selectedIds];
  setSelectedIds([]);

  mutationInFlight.current += 1;
  try {
    const promises = originalSelectedIds.map(id =>
      window.fetch(`/api/${collection}/${id}`, { method: 'DELETE' }).then(res => {
        if (!res.ok) throw new Error(`Failed to delete ${id}`);
      })
    );
    await Promise.all(promises);
    showToast(`${originalSelectedIds.length} record(s) deleted successfully.`, 'success');
    await fetchActiveTable();
  } catch (e) {
    console.error('Delete failed', e);
    showToast('Failed to delete some records. Reverting changes.');
    await fetchActiveTable();
  } finally {
    mutationInFlight.current -= 1;
  }
};

const handleDeleteRecord = async (record: any) => {
  const id = record._id || record.id;
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
    default: return;
  }

  // Optimistic UI update
  const optimisticSetter: Record<string, React.Dispatch<React.SetStateAction<any[]>>> = {
    'events': setEvents as any, 'sessions': setSessions as any,
    'musiclog': setMusicLogs, 'videolog': setVideoLogs,
    'media': setMedia as any, 'checklist': setChecklist as any,
    'guidance': setGuidance as any, 'led_details': setLedDetails as any,
    'locations': setLocations, 'videosetup': setVideoSetup, 'audiosetup': setAudioSetup,
  };
  const setter = optimisticSetter[collection];
  if (setter) setter(prev => prev.filter(r => r._id !== id && r.id !== id));

  mutationInFlight.current += 1;
  try {
    const res = await window.fetch(`/api/${collection}/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Server returned an error');
    showToast('Record deleted successfully.', 'success');
    await fetchActiveTable();
  } catch (e) {
    console.error('Delete failed', e);
    showToast('Failed to delete record. Reverting changes.');
    await fetchActiveTable();
  } finally {
    mutationInFlight.current -= 1;
  }
};

const handleDeleteColumn = (colToDelete: string) => {
  // Confirm with user
  if (!window.confirm(`Are you sure you want to remove the column "${colToDelete}"? This will hide the data for this field.`)) {
    return;
  }

  const currentExtras = extraColumns[activeTable] || [];
  const updatedExtras = currentExtras.filter(col => col !== colToDelete);
  const newCols = { ...extraColumns, [activeTable]: updatedExtras };

  const newTypes = { ...columnTypes };
  if (newTypes[activeTable]) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { [colToDelete]: _removed, ...rest } = newTypes[activeTable];
    newTypes[activeTable] = rest;
  }

  setExtraColumns(newCols);
  setColumnTypes(newTypes);
  saveSettings(newCols, newTypes, hiddenColumns);
};

const handleColDrop = (fromCol: string, toCol: string) => {
  if (fromCol === toCol) return;
  const cols = getTableColumns(true); // full ordered list including hidden
  const from = cols.indexOf(fromCol);
  const to   = cols.indexOf(toCol);
  if (from === -1 || to === -1) return;
  const reordered = [...cols];
  reordered.splice(from, 1);
  reordered.splice(to, 0, fromCol);
  const newOrder = { ...columnOrder, [activeTable]: reordered };
  setColumnOrder(newOrder);
  saveSettings(extraColumns, columnTypes, hiddenColumns, columnMeta, newOrder);
};

const toggleHideColumn = (col: string) => {
  const currentHidden = hiddenColumns[activeTable] || [];
  const newHidden = currentHidden.includes(col)
    ? currentHidden.filter(c => c !== col)
    : [...currentHidden, col];
  const newHiddenObj = { ...hiddenColumns, [activeTable]: newHidden };
  setHiddenColumns(newHiddenObj);
  saveSettings(extraColumns, columnTypes, newHiddenObj);
};

const confirmAddColumn = async () => {
  if (!addColumnModal || !addColumnModal.name.trim()) return;
  const name = addColumnModal.name.trim();
  const type = addColumnModal.type;
  const currentExtras = extraColumns[activeTable] || [];
  const newCols = { ...extraColumns, [activeTable]: [...currentExtras, name] };
  const newTypes = { ...columnTypes, [activeTable]: { ...(columnTypes[activeTable] || {}), [name]: type } };
  const metaEntry: { linkedTable?: string; lookupField?: string } = {};
  if (addColumnModal.linkedTable) metaEntry.linkedTable = addColumnModal.linkedTable;
  if (addColumnModal.lookupField) metaEntry.lookupField = addColumnModal.lookupField;
  const newMeta = { ...columnMeta, [activeTable]: { ...(columnMeta[activeTable] || {}), [name]: metaEntry } };
  setExtraColumns(newCols);
  setColumnTypes(newTypes);
  setColumnMeta(newMeta);
  saveSettings(newCols, newTypes, hiddenColumns, newMeta);
  setAddColumnModal(null);

  // Backfill existing records when a lookup column is added
  if (type === 'lookup' && metaEntry.linkedTable && metaEntry.lookupField) {
    const linkedTable = metaEntry.linkedTable;
    const lookupField = metaEntry.lookupField;
    const nameField = getPrimaryField(linkedTable);
    const linkedData = getDataForTable(linkedTable);

    // Find which column in the current table links to linkedTable
    const allTableMeta = { ...(columnMeta[activeTable] || {}), [name]: metaEntry };
    const linkCol = Object.keys(allTableMeta).find(c =>
      allTableMeta[c]?.linkedTable === linkedTable && !allTableMeta[c]?.lookupField &&
      (newTypes[activeTable]?.[c] === 'link_to_record' || columnTypes[activeTable]?.[c] === 'link_to_record')
    );

    if (linkCol) {
      const collection = (() => {
        switch (activeTable) {
          case 'Events': return 'events';
          case 'Session': return 'sessions';
          case 'MusicLog': return 'musiclog';
          case 'VideoLog': return 'videolog';
          case 'Tracks': return 'media';
          case 'DyatraChecklist': return 'checklist';
          case 'Guidance & Learning': return 'guidance';
          case 'LED': return 'led_details';
          case 'DataSharing': return 'locations';
          case 'VideoSetup': return 'videosetup';
          case 'AudioSetup': return 'audiosetup';
          default: return '';
        }
      })();
      if (collection) {
        const records = getActiveData();
        for (const record of records) {
          const linkedNames = (record[linkCol] || '').split(',').map((s: string) => s.trim()).filter(Boolean);
          if (!linkedNames.length) continue;
          const fillValue = linkedNames
            .map((n: string) => { const r = linkedData.find((lr: any) => lr[nameField] === n); return r ? (r[lookupField] ?? '') : ''; })
            .filter(Boolean).join(', ');
          const id = record._id || record.id;
          if (!id) continue;
          const body = { ...record, [name]: fillValue };
          delete body._id;
          await window.fetch(`/api/${collection}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });
        }
        fetchActiveTable();
      }
    }
  }
};

const confirmEditColumnType = () => {
  if (!editColumnModal) return;
  const { col, type, extraIndex } = editColumnModal;

  const newTypes = { ...columnTypes, [activeTable]: { ...(columnTypes[activeTable] || {}), [col]: type } };
  setColumnTypes(newTypes);

  const metaEntry: { linkedTable?: string; lookupField?: string } = {};
  if (editColumnModal.linkedTable) metaEntry.linkedTable = editColumnModal.linkedTable;
  if (editColumnModal.lookupField) metaEntry.lookupField = editColumnModal.lookupField;
  const newMeta = { ...columnMeta, [activeTable]: { ...(columnMeta[activeTable] || {}), [col]: metaEntry } };
  setColumnMeta(newMeta);

  if (extraIndex >= 0) {
    const newExtras = [...(extraColumns[activeTable] || [])];
    newExtras[extraIndex] = editColumnModal.col;
    const newCols = { ...extraColumns, [activeTable]: newExtras };
    setExtraColumns(newCols);
    saveSettings(newCols, newTypes, hiddenColumns, newMeta);
  } else {
    saveSettings(extraColumns, newTypes, hiddenColumns, newMeta);
  }
  setEditColumnModal(null);
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

// Returns the data array for a given table name (used by LinkedRecordPicker)
const getDataForTable = (table: string): any[] => {
  switch (table) {
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
    case 'Tracks': return media.filter((m: any) => m.type === 'track' || m.Type === 'track' || m["Title"]);
    default: return [];
  }
};

// Returns the display/primary name field for a given table
const getPrimaryField = (table: string): string => {
  switch (table) {
    case 'Events': return 'Event Name';
    case 'Session': return 'Session Name';
    case 'MusicLog': return 'PlayID';
    case 'VideoLog': return 'VideoPlayId';
    case 'Tracks': return 'Title';
    case 'DyatraChecklist': return 'Task';
    case 'Guidance & Learning': return 'LearningId';
    case 'LED': return 'LedId';
    case 'DataSharing': return 'Sevak';
    case 'VideoSetup': return 'Name';
    case 'AudioSetup': return 'Name';
    default: return 'name';
  }
};

// For a given link column and new linked-record names, auto-fill all lookup columns
// that point to the same linkedTable. Uses the first selected record for the values.
const buildLookupPatch = (
  linkCol: string,
  linkedNames: string, // comma-separated selected record names
  currentDraft: any
): Record<string, string> => {
  const meta = columnMeta[activeTable]?.[linkCol];
  if (!meta?.linkedTable) return {};

  const linkedTable = meta.linkedTable;
  const nameField = getPrimaryField(linkedTable);
  const linkedData = getDataForTable(linkedTable);

  const names = linkedNames.split(',').map(s => s.trim()).filter(Boolean);
  const linkedRecords = names.map(n => linkedData.find(r => r[nameField] === n)).filter(Boolean);

  const patch: Record<string, string> = {};
  const allCols = [
    ...(getTableColumns() as string[]),
    ...(extraColumns[activeTable] || []),
  ];
  for (const col of allCols) {
    const colMeta = columnMeta[activeTable]?.[col];
    if (colMeta?.linkedTable === linkedTable && colMeta?.lookupField && columnTypes[activeTable]?.[col] === 'lookup') {
      patch[col] = linkedRecords.map(r => r[colMeta.lookupField!] ?? '').filter(Boolean).join(', ');
    }
  }
  return patch;
};

const saveSettings = async (
  cols: Record<string, string[]>,
  types: Record<string, Record<string, FieldType>>,
  hidden: Record<string, string[]>,
  meta?: Record<string, Record<string, { linkedTable?: string; lookupField?: string }>>,
  order?: Record<string, string[]>,
  frozen?: Record<string, number>,
  tags?: Record<string, Record<string, string[]>>
) => {
  try {
    await window.fetch('/api/settings/columns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _v: 2, columns: cols, types, hidden, meta: meta ?? columnMeta, order: order ?? columnOrder, frozen: frozen ?? frozenUpTo, customTags: tags ?? customTags })
    });
  } catch (error) {
    console.error("Failed to save settings:", error);
  }
};

const handleAddCustomTag = (tableName: string, col: string, newTag: string) => {
  const currentTableTags = customTags[tableName] || {};
  const currentFieldTags = currentTableTags[col] || [];
  if (!currentFieldTags.includes(newTag)) {
    const newTags = {
      ...customTags,
      [tableName]: {
        ...currentTableTags,
        [col]: [...currentFieldTags, newTag]
      }
    };
    setCustomTags(newTags);
    saveSettings(extraColumns, columnTypes, hiddenColumns, columnMeta, columnOrder, frozenUpTo, newTags);
  }
};

const handleRemoveTagGlobally = async (tableName: string, col: string, tagToRemove: string) => {
  if (!window.confirm(`Are you sure you want to delete "${tagToRemove}" globally? This will remove it from all records.`)) return false;

  // 1. Remove from customTags
  const currentTableTags = customTags[tableName] || {};
  const currentFieldTags = currentTableTags[col] || [];
  if (currentFieldTags.includes(tagToRemove)) {
    const newTags = { ...customTags, [tableName]: { ...currentTableTags, [col]: currentFieldTags.filter(t => t !== tagToRemove) } };
    setCustomTags(newTags);
    saveSettings(extraColumns, columnTypes, hiddenColumns, columnMeta, columnOrder, frozenUpTo, newTags);
  }

  // 2. Scan and remove from DB records
  const processTable = async (tName: string, collName: string) => {
    const tableData = getDataForTable(tName);
    const isMulti = col === 'Occasion' || col === 'City' || col === 'Tags' || columnTypes[tName]?.[col] === 'badge_multi';

    const recordsToUpdate = tableData.filter((r: any) => {
      const val = r[col];
      if (!val) return false;
      return isMulti ? String(val).split(',').map(s => s.trim()).includes(tagToRemove) : String(val).trim() === tagToRemove;
    });

    if (recordsToUpdate.length > 0) {
      await Promise.all(recordsToUpdate.map(async (record: any) => {
        const newVal = isMulti ? String(record[col]).split(',').map(s => s.trim()).filter(t => t !== tagToRemove).join(', ') : '';
        const updatedRecord = { ...record, [col]: newVal };
        const id = record._id || record.id;
        const body = { ...updatedRecord };
        delete body._id;
        return window.fetch(`/api/${collName}/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      }));
    }
  };

  const collMap: Record<string, string> = {
    'Events': 'events', 'Session': 'sessions', 'MusicLog': 'musiclog', 'VideoLog': 'videolog',
    'Tracks': 'media', 'DyatraChecklist': 'checklist', 'Guidance & Learning': 'guidance',
    'LED': 'led_details', 'DataSharing': 'locations', 'VideoSetup': 'videosetup', 'AudioSetup': 'audiosetup'
  };
  const mainColl = collMap[tableName];
  if (mainColl) await processTable(tableName, mainColl);

  // Cross-reference tables if it's a shared column
  if (col === 'City' || col === 'Occasion') {
    if (tableName === 'Events') await processTable('Session', 'sessions');
    if (tableName === 'Session') await processTable('Events', 'events');
  }

  fetchAllData();
  return true;
};

useEffect(() => {
  const loadColumns = async () => {
    try {
      const response = await window.fetch('/api/settings/columns');
      if (response.ok) {
        const data = await response.json();
        if (data && data._v === 2) {
          setExtraColumns(data.columns || {});
          setColumnTypes(data.types || {});
          setHiddenColumns(data.hidden || {});
          setColumnMeta(data.meta || {});
          setColumnOrder(data.order || {});
          setFrozenUpTo(data.frozen || {});
          setCustomTags(data.customTags || {});
        } else {
          setExtraColumns(data || {});
        }
      }
    } catch (error) {
      console.error("Failed to load columns:", error);
    }
  };

  if (user) loadColumns();
}, [user]);
const filteredData: any[] = getActiveData().filter((item: any) => {
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
  if (searchStr) {
    const matchesSearch = Object.values(item).some(val =>
      val !== null && val !== undefined && String(val).toLowerCase().includes(searchStr)
    );
    if (!matchesSearch) return false;
  }

  if (advancedFilter.conditions.length > 0) {
    if (!evaluateGroup(item, advancedFilter)) return false;
  }

  return true;
});
// Sorted + grouped data for visual/card view (respects sortBy and groupByField)
const sortedVisualData: any[] = (() => {
  const d = [...filteredData];
  d.sort((a, b) => {
    // Primary: group field
    if (groupByField) {
      const ga = String(a[groupByField] ?? '');
      const gb = String(b[groupByField] ?? '');
      if (ga !== gb) return ga.localeCompare(gb);
    }
    // Secondary: explicit sort
    if (sortBy) {
      const va = String(a[sortBy.field] ?? '');
      const vb = String(b[sortBy.field] ?? '');
      return sortBy.direction === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
    }
    // Default for Events: chronological
    if (!groupByField && !sortBy && activeTable === 'Events') {
      const ta = a.DateFrom ? new Date(a.DateFrom).getTime() : Number.MAX_SAFE_INTEGER;
      const tb = b.DateFrom ? new Date(b.DateFrom).getTime() : Number.MAX_SAFE_INTEGER;
      const valA = isNaN(ta) ? Number.MAX_SAFE_INTEGER : ta;
      const valB = isNaN(tb) ? Number.MAX_SAFE_INTEGER : tb;
      return valA - valB;
    }
    return 0;
  });
  return d;
})();
const [extraColumns, setExtraColumns] = useState<Record<string, string[]>>({});
const [columnTypes, setColumnTypes] = useState<Record<string, Record<string, FieldType>>>({});
const [hiddenColumns, setHiddenColumns] = useState<Record<string, string[]>>({});
// meta stores extra config per column: linkedTable for link_to_record; linkedTable+lookupField for lookup
const [columnMeta, setColumnMeta] = useState<Record<string, Record<string, { linkedTable?: string; lookupField?: string }>>>({});
const [isFieldsOpen, setIsFieldsOpen] = useState(false);
const [addColumnModal, setAddColumnModal] = useState<{ name: string; type: FieldType; linkedTable: string; lookupField: string } | null>(null);
const [editColumnModal, setEditColumnModal] = useState<{ col: string; type: FieldType; extraIndex: number; linkedTable: string; lookupField: string } | null>(null);

const getColumnType = (col: string): FieldType => {
  // Explicitly stored type always wins
  if (columnTypes[activeTable]?.[col]) return columnTypes[activeTable][col] as FieldType;
  // Smart defaults by column name
  if (['PlayID', 'VideoPlayId', 'LedId', 'LearningId'].includes(col) || (col.toLowerCase().endsWith('id') && !col.includes(' '))) return 'id';
  if (['DateFrom', 'DateTo', 'Date', 'PlayedAt', 'LastUpdated'].includes(col) || col.startsWith('Date (') || col.startsWith('DateFrom (') || col.startsWith('DateTo (')) return 'date';
 if (['Year', 'Year (from Event)'].includes(col)) return 'year';
  if (['Occasion', 'Occasion (from Session)', 'Tags'].includes(col)) return 'badge_multi';
  if (['City', 'City (from Session)', 'City (from 🕘 Session)', 'Dept', 'TaskGroup', 'Indoor/Outdoor LED?'].includes(col)) return 'badge';
  if (['SessionType', 'SessionType (from Session)', 'Category', 'Time Of Day', 'TimeOfDay', 'TimeOfDay (from Session)'].includes(col)) return 'badge';
 if ([
    'SessionType', 'Category', 'Time Of Day', 'TimeOfDay', 
    'Typical Timeline', 'Period', 'PlayedAt', 'GuidanceFrom', 'City','People Involved',
    'Indoor/Outdoor LED?', 'CntrPitch', 'SidePitch', 'OtherLed1', 'OtherLed2', 'Vendor',
    'Dept', 'Status', 'Assignee',
    'Source', 'Plays' // <--- Added Tracks fields
  ].includes(col)) return 'badge';
if (['Status', 'status'].includes(col)) return 'status';
  if (['Notes', 'Details', 'Guidance/Learning', 'ShareData', 'ProposalsList', 'attachmentSummary', 'Lyrics', 'notes'].includes(col)) return 'long_text';
  if (['Attachments', 'Attachment', 'FileLink', 'TrackID (link)'].includes(col)) return 'url';
  if (['EmailId'].includes(col)) return 'email';
  if (['ShareFacts?', 'is Led Required?'].includes(col)) return 'yes_no';
  if (['Status', 'status'].includes(col)) return 'status';
  if (['BPM', 'DurationTime', 'Plays', 'Order', 'Patrank', 'OrderId', 'Duration', 'Stageht',
       'CntrPitch', 'CntrWdth', 'CntrHt', 'CntrRiser', 'SidePitch', 'SideWdth', 'SideHt',
       'OtherPitch', 'OtherWdth', 'OtherHt', 'Other2Wdth', 'Other2Ht', 'DGUseedKva', 'BackupPower'].includes(col)) return 'number';
  return 'text';
};

const getFilterOptions = (col: string): string[] => {
  const type = getColumnType(col);
  const isMulti = type === 'badge_multi' || col === 'Occasion' || col === 'City' || col === 'Tags';
  const isDropdown = ['select', 'badge', 'badge_multi', 'status', 'yes_no'].includes(type)
    || (activeTable === 'Events' && ['Occasion', 'City', 'Year'].includes(col))
    || (activeTable === 'Session' && ['City', 'Occasion', 'Time Of Day', 'SessionType', 'Parent Event'].includes(col))
    || (activeTable === 'Tracks' && ['Source', 'Plays'].includes(col))
    || ((activeTable === 'VideoSetup' || activeTable === 'AudioSetup') && ['Status', 'Assignee'].includes(col))
    || (activeTable === 'DataSharing' && col === 'Dept')
    || (activeTable === 'LED' && ['Indoor/Outdoor LED?', 'CntrPitch', 'SidePitch', 'OtherLed1', 'OtherLed2', 'Vendor'].includes(col))
    || (activeTable === 'Guidance & Learning' && ['City', 'GuidanceFrom', 'Category'].includes(col))
    || (activeTable === 'DyatraChecklist' && ['Typical Timeline', 'Category', 'Period', 'People Involved'].includes(col))
    || (activeTable === 'MusicLog' && col === 'PlayedAt')
    || (col === 'Session')
    || col.endsWith('?');

  if (!isDropdown) return [];
  if (type === 'yes_no' || col.endsWith('?')) return ['Yes', 'No'];
  
  const allData = getActiveData();
  const uniqueVals = new Set<string>();
  allData.forEach(item => {
    const val = item[col];
    if (val !== undefined && val !== null && val !== '') {
      if (isMulti) String(val).split(',').forEach(v => { if (v.trim()) uniqueVals.add(v.trim()); });
      else uniqueVals.add(String(val).trim());
    }
  });
  if (customTags[activeTable]?.[col]) customTags[activeTable][col].forEach(t => uniqueVals.add(t));
  return Array.from(uniqueVals).sort();
};

const renderCell = (col: string, item: any): React.ReactNode => {
  const val = item[col];
  const type = getColumnType(col);
  const empty = <span className="text-slate-400 italic text-[12px]">—</span>;

  switch (type) {
    case 'id':
      return <span className={`font-mono text-[13px] ${activeTable === 'VideoLog' ? 'text-indigo-500' : 'text-brand-primary'}`}>{val || empty}</span>;
    
    case 'date':
      return <span className="font-mono text-slate-700 text-[13px]">{val || empty}</span>;

    case 'time':
      return <span className="font-mono text-slate-700 text-[13px]">{val || empty}</span>;
    
    case 'number':
      return <span className="font-mono text-slate-700 text-[13px] block text-center">{val || empty}</span>;
case 'phone':
case 'text':

  return <span className="text-[13px] text-slate-700 truncate block">{val || empty}</span>;
    // --- UNIFIED DROPDOWN / BADGE / TEXT STYLE ---
    case 'year':
    case 'badge':
    case 'select':
      return val ? (
        <div className="flex justify-center">
          <span className={getTagStyle(String(val))}>{val}</span>
        </div>
      ) : empty;

    case 'badge_multi':
      return val ? (
        <div className="flex flex-wrap gap-1.5 justify-start">
          {String(val).split(',').map((t: string, i: number) => (
            <span key={i} className={getTagStyle(t.trim())} style={{ maxWidth: '100%', whiteSpace: 'normal', wordBreak: 'break-word', textAlign: 'left' }}>
              {t.trim()}
            </span>
          ))}
        </div>
      ) : empty;
    // ----------------------------------------------

   case 'yes_no':
  return (val === 'Yes' || val === true || val === 'true') ? (
    <Check className="h-4 w-4 text-green-600 mx-auto" strokeWidth={4} />
  ) : null;

    case 'status': {
      const statusCls = (() => {
        switch (val) {
          case 'Ready':
          case 'Done':
          case 'Complete':
          case 'Completed':    return 'bg-green-100 text-green-700 border-green-200';
          case 'Pending':
          case 'In Progress':
          case 'In Review':    return 'bg-yellow-100 text-yellow-700 border-yellow-200';
          case 'To Do':
          case 'Not Started':  return 'bg-slate-100 text-slate-600 border-slate-200';
          case 'Blocked':
          case 'Cancelled':    return 'bg-red-100 text-red-700 border-red-200';
          default:             return 'bg-blue-50 text-blue-600 border-blue-100';
        }
      })();
      return val ? <Badge className={`${statusCls} text-[11px] px-2`}>{val}</Badge> : empty;
    }
        
    case 'email':
      return val ? <span className="text-brand-primary underline text-[13px]">{val}</span> : empty;
    
    case 'url':
      return val
        ? <a href={val} target="_blank" rel="noopener noreferrer" className="text-brand-primary underline text-[13px]">{val}</a>
        : empty;
    
   case 'long_text':
  return val ? (
    <div className="text-[13px] text-slate-700 leading-normal whitespace-normal break-words px-1">
      {String(val)}
    </div>
  ) : empty;
    
    case 'checkbox':
      return (val === 'true' || val === true)
        ? <Check className="h-4 w-4 text-green-500 mx-auto" />
        : empty;

    case 'link_to_record': {
      if (!val) return empty;
      const names = String(val).split(',').map((s: string) => s.trim()).filter(Boolean);
      return (
        <div className="flex flex-wrap gap-1.5 justify-start">
          {names.map((n: string, i: number) => (
            <span key={i} className="inline-flex items-center gap-0.5 bg-brand-primary/10 text-brand-primary border border-brand-primary/20 text-[12px] font-semibold px-2.5 py-0.5 rounded-full cursor-pointer hover:bg-brand-primary/20 transition-colors" style={{ maxWidth: '100%', whiteSpace: 'normal', wordBreak: 'break-word', textAlign: 'left' }}
              onClick={(e) => {
                e.stopPropagation();
                const meta = columnMeta[activeTable]?.[col];
                if (meta?.linkedTable) {
                  const linkedTableData = getDataForTable(meta.linkedTable);
                  const nameField = getPrimaryField(meta.linkedTable);
                  const linkedRec = linkedTableData.find(r => r[nameField] === n);
                  if (linkedRec) {
                    const fields = Object.keys(linkedRec).filter(k => !['_id', 'id', 'created_at', '__v'].includes(k) && k !== nameField).slice(0, 8);
                    setLinkedRecordPopup({ record: linkedRec, tableName: meta.linkedTable, nameField, fields });
                  }
                }
              }}
            >
              {n}
              <ArrowUpRight className="h-3 w-3 opacity-60 shrink-0" />
            </span>
          ))}
        </div>
      );
    }

    case 'lookup': {
      if (!val) return empty;
      return <span className="text-[12px] text-slate-600">{String(val)}</span>;
    }

    default:
      return val ? (
        <div className="flex justify-center">
          <span className={UNIFORM_DROPDOWN_STYLE}>{val}</span>
        </div>
      ) : empty;
  }
};

const getTableColumns = (includeHidden = false) => {
  let baseCols: string[] = [];

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

  const added = extraColumns[activeTable] || [];
  const all = [...baseCols, ...added];
  // Apply saved column order (drag-and-drop reordering)
  const savedOrder = columnOrder[activeTable];
  const ordered = savedOrder && savedOrder.length
    ? [...savedOrder.filter(c => all.includes(c)), ...all.filter(c => !savedOrder.includes(c))]
    : all;
  if (includeHidden) return ordered;
  const hidden = hiddenColumns[activeTable] || [];
  return ordered.filter(col => !hidden.includes(col));
};
const handleToggleYesNo = async (item: any, col: string) => {
  const val = item[col];
  const isChecked = val === 'Yes' || val === true || val === 'true';
  const nextVal = isChecked ? 'No' : 'Yes';
  const id = item._id || item.id;
  const updatedItem = { ...item, [col]: nextVal };

  let collection = '';
  switch (activeTable) {
    case 'Events': collection = 'events'; break;
    case 'Session': collection = 'sessions'; break;
    case 'MusicLog': collection = 'musiclog'; break;
    case 'Tracks': collection = 'media'; break;
    case 'VideoLog': collection = 'videolog'; break;
    case 'LED': collection = 'led_details'; break;
    case 'DyatraChecklist': collection = 'checklist'; break;
    case 'DataSharing': collection = 'locations'; break;
    default: collection = activeTable.toLowerCase();
  }

  // Optimistic update — apply immediately so checkbox flips without waiting
  const applyOptimistic = (prev: any[]) => prev.map(r => (r._id === id || r.id === id) ? updatedItem : r);
  const setterMap: Record<string, React.Dispatch<React.SetStateAction<any[]>>> = {
    'events': setEvents as any, 'sessions': setSessions, 'musiclog': setMusicLogs,
    'media': setMedia as any, 'videolog': setVideoLogs, 'led_details': setLedDetails as any,
    'checklist': setChecklist as any, 'locations': setLocations,
  };
  const setter = setterMap[collection];
  if (setter) setter(applyOptimistic);

  try {
    const res = await window.fetch(`/api/${collection}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedItem)
    });
    if (!res.ok) throw new Error(`Server error ${res.status}`);
  } catch (error) {
    // Rollback optimistic update on failure
    if (setter) setter(prev => prev.map(r => (r._id === id || r.id === id) ? item : r));
    showToast('Failed to save — change was rolled back.');
    console.error("Toggle Error:", error);
  }
};

const handleToggleChecklist = async (item: any) => {
  const id = item._id || item.id;
  const isDone = item.done === true || item.done === 'Yes';
  const updatedItem = { ...item, done: !isDone };
  setChecklist((prev: any[]) => prev.map(r => (r._id === id || r.id === id) ? updatedItem : r));
  try {
    const res = await window.fetch(`/api/checklist/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedItem),
    });
    if (!res.ok) throw new Error(`Server error ${res.status}`);
  } catch {
    setChecklist((prev: any[]) => prev.map(r => (r._id === id || r.id === id) ? item : r));
    showToast('Failed to save — change was rolled back.');
  }
};

// 1. Database Update Helper for Ratings
// Helper to update ratings in the database
// 1. Rating Update Helper
const handleSetRating = async (item: any, col: string, newValue: number) => {
  const currentVal = Number(item[col]) || 0;
  const finalVal = currentVal === newValue ? 0 : newValue;
  const id = item._id || item.id;
  const updatedItem = { ...item, [col]: finalVal };

  // Optimistic update
  setMusicLogs(prev => prev.map(m => (m._id === id || m.id === id) ? updatedItem : m));

  try {
    const res = await window.fetch(`/api/musiclog/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedItem)
    });
    if (!res.ok) throw new Error(`Server error ${res.status}`);
  } catch (error) {
    // Rollback
    setMusicLogs(prev => prev.map(m => (m._id === id || m.id === id) ? item : m));
    showToast('Failed to save rating — change was rolled back.');
    console.error("Rating Update Error:", error);
  }
};

// 2. Exact Design Star Component
const StarRating = ({ value, onSave }: { value: any; onSave: (val: number) => void }) => {
  const [hoverIdx, setHoverIdx] = useState<number>(0);
  const currentRating = Number(value) || 0;

  return (
    <div 
      className="flex items-center justify-center gap-1 h-full w-full group/rating-box cursor-pointer"
      onMouseLeave={() => setHoverIdx(0)}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const isYellow = star <= (hoverIdx || currentRating);
        // "Ghost" stars appear when hovering the container, but not yet specific stars
        const isGhost = !isYellow; 

        return (
          <Star
            key={star}
            size={14}
            onMouseEnter={() => setHoverIdx(star)}
            onClick={(e) => {
              e.stopPropagation();
              onSave(star);
            }}
            // We use standard colors that are definitely visible
            className={`transition-all duration-75 ${
              isYellow 
                ? "text-yellow-400 fill-yellow-400 scale-110" 
                : "text-transparent fill-transparent group-hover/rating-box:text-slate-200 group-hover/rating-box:fill-slate-200"
            }`}
          />
        );
      })}
    </div>
  );
};

const renderRow = (item: any) => {
  const cols = getTableColumns();
  const getWidth = (name: string) => colWidths[name] || 200;
  const frozen = frozenUpTo[activeTable] ?? -1;
  const leftOffsets: number[] = [];
  let acc = 48;
  cols.forEach((c, idx) => { leftOffsets[idx] = acc; if (idx <= frozen) acc += getWidth(c); });
  const cellStyle = (colName: string, i: number) => {
    const base = { width: getWidth(colName), minWidth: getWidth(colName), maxWidth: getWidth(colName) };
    return i <= frozen ? { ...base, position: 'sticky' as const, left: leftOffsets[i], zIndex: 10, ...FROZEN_STYLE } : base;
  };
  const cellCls = "px-4 py-3 border-r border-b border-slate-200 text-slate-700 text-[13px] text-left overflow-hidden";
  const primaryCls = "px-4 py-3 border-r border-b border-slate-200 font-semibold text-slate-900 text-[13px] overflow-hidden";

  // renderExtraCells kept for backward compat but no longer called from renderRow
  const renderExtraCells = () => {
    const extraKeys = extraColumns[activeTable] || [];
    const hidden = hiddenColumns[activeTable] || [];
    return extraKeys.filter(colName => !hidden.includes(colName)).map((colName) => {
      return (
        <td key={colName} className={cellCls} style={cellStyle(colName, -1)}>
          {renderCell(colName, item)}
        </td>
      );
    });
  };
  void renderExtraCells; // suppress unused warning

  // Primary (name) column per table — first col is always primary
  const primaryColName: Record<string, string> = {
    'Events': 'Event Name', 'Session': 'Session Name', 'MusicLog': 'PlayID',
    'VideoLog': 'VideoPlayId', 'Guidance & Learning': 'LearningId', 'LED': 'LedId',
    'DyatraChecklist': 'Task', 'DataSharing': 'Sevak', 'Tracks': 'Title',
    'VideoSetup': 'Name', 'AudioSetup': 'Name',
  };
  const primaryFallbacks: Record<string, string> = {
    'Events': 'Untitled Event', 'Session': 'Untitled Session', 'Tracks': 'Untitled Track',
    'DyatraChecklist': 'Untitled Task', 'DataSharing': 'Untitled',
  };
  const primaryKey = primaryColName[activeTable];
  const primaryFallback = primaryFallbacks[activeTable] || '—';

  return (
  <>
    {cols.map((col, i) => {
      const isPrimary = col === primaryKey;
      const isFirstCol = i === 0;
      const isColFrozen = i <= frozen;
      const isFreezeEdge = i === frozen;
      const style = cellStyle(col, i);

      if (activeTable === 'Tracks' && (col === 'PlayID' || col === 'Plays')) {
        const rawVal = item[col];
        if (!rawVal) {
          return <td key={col} style={style} className={`${cellCls} ${isColFrozen ? (isFreezeEdge ? 'border-r-2 border-r-brand-primary/40' : '') : ''}`}><span className="text-slate-300 italic text-[12px]">—</span></td>;
        }
        const vals = String(rawVal).split(',').map(s => s.trim()).filter(Boolean);
        return (
          <td key={col} style={style} className={`${cellCls} ${isColFrozen ? (isFreezeEdge ? 'border-r-2 border-r-brand-primary/40' : '') : ''}`}>
            <div className="flex flex-wrap gap-1.5 justify-start">
              {vals.map((playId, idx) => {
                const musicLogRecord = musicLogs.find(ml => String(ml.PlayID) === playId);
                return (
                  <span
                    key={idx}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (musicLogRecord) {
                        const nameField = getPrimaryField('MusicLog');
                        const fields = Object.keys(musicLogRecord).filter(k => !['_id', 'id', 'created_at', '__v'].includes(k) && k !== nameField).slice(0, 8);
                        setLinkedRecordPopup({ record: musicLogRecord, tableName: 'MusicLog', nameField, fields });
                      }
                    }}
                    className={`inline-flex items-center gap-0.5 text-[12px] font-semibold px-2.5 py-0.5 rounded-full max-w-full min-w-0 transition-all ${
                      musicLogRecord
                        ? 'bg-brand-primary/10 text-brand-primary border border-brand-primary/20 cursor-pointer hover:bg-brand-primary/20'
                        : 'bg-slate-100 text-slate-700 border border-slate-200 cursor-default'
                    }`}
                  >
                    <span className="truncate">{musicLogRecord?.Track ? `${musicLogRecord.Track} (${playId})` : playId}</span>
                    {musicLogRecord && <ArrowUpRight className="shrink-0 h-3 w-3 opacity-60" />}
                  </span>
                );
              })}
            </div>
          </td>
        );
      }

      const val = item[col];
       const type = getColumnType(col);
      const isLongText = type === 'long_text';
      const stickyBg = isColFrozen
        ? (isFreezeEdge ? 'border-r-2 border-r-brand-primary/40' : '')
        : '';

      if (activeTable === 'MusicLog' && col === 'Relevance') {
  return (
    <td 
      key={col} 
      style={style} 
            className={`border-r border-b border-slate-200 text-center h-[40px] group/star-cell p-0 ${isColFrozen ? stickyBg : 'bg-white'}`}
    >
      <StarRating 
        value={val} 
        onSave={(newVal) => handleSetRating(item, col, newVal)} 
      />
    </td>
  );
}
      // ── 1. INTERACTIVE YES/NO CHECKBOX (NEW LOGIC) ──
        if (type === 'yes_no') {
          const isChecked = val === 'Yes' || val === true || val === 'true';
          return (
            <td
              key={col}
              style={style}
            className={`border-r border-b border-slate-200 text-center relative group/checkbox cursor-pointer transition-colors h-[40px] ${isColFrozen ? stickyBg : 'hover:bg-slate-50'}`}
              onClick={(e) => {
                e.stopPropagation();
                handleToggleYesNo(item, col); 
              }}
            >
              <div className="flex items-center justify-center h-full w-full">
                {isChecked ? (
                  <Check className="h-4 w-4 text-green-600" strokeWidth={4} />
                ) : (
                  <div className="h-3.5 w-3.5 rounded border border-slate-300 bg-white opacity-0 group-hover/checkbox:opacity-100 transition-opacity shadow-sm" />
                )}
              </div>
            </td>
          );
        }


      // ── UNIFIED SESSION LINK LOGIC (Covers all tables) ──
      const sessionFieldNames = ['Sessions', 'Session', 'Imported table', '🕘 Session'];
      if (sessionFieldNames.includes(col)) {
        const val = item[col] || '';
        const names = typeof val === 'string' ? val.split(',').map(s => s.trim()).filter(Boolean) : [];
        
        return (
          <td 
          key={col} 
          className={`px-4 py-3 border-r border-b border-slate-200 text-slate-700 text-[13px] text-left align-top whitespace-normal ${isColFrozen ? stickyBg : ''}`} 
          style={style}
        >
            <div className="flex flex-wrap gap-1.5 justify-start">
              {names.length > 0 ? names.map((sName, idx) => {
                const linked = sessions.find((s: any) => s["Session Name"] === sName);
                return (
                  <span
                    key={idx}
                    className={`inline-flex items-center gap-0.5 text-[12px] font-semibold px-2.5 py-0.5 rounded-full max-w-full min-w-0 transition-all ${
                      linked
                        ? 'bg-brand-primary/10 text-brand-primary border border-brand-primary/20 hover:bg-brand-primary/20 cursor-pointer'
                        : 'bg-slate-100 text-slate-700 border border-slate-200 cursor-default'
                    }`}
                    onClick={(e) => { e.stopPropagation(); if (linked) setLinkedSession(linked); }}
                  >
                    <span className="truncate">{sName}</span>
                    {linked && <ArrowUpRight className="shrink-0 h-3 w-3 opacity-60" />}
                  </span>
                );
              }) : <span className="text-slate-300 italic text-[12px]">—</span>}
            </div>
          </td>
        );
      }
        // MusicLog: Track — brand-accent bold
        if (activeTable === 'MusicLog' && col === 'Track') {
          return (
            <td key={col} className={`${cellCls} font-bold text-brand-accent ${isColFrozen ? stickyBg : ''}`} style={style}>
              {item["Track"] || <span className="text-slate-300 italic text-[12px]">—</span>}
            </td>
          );
        }

        // Images/Attachments — thumbnail gallery cell
        if (col === 'Images' || col === 'Attachments' || col === 'Attachment') {
          const imageString = item[col] || "";
          const urlRegex = /\((https?:\/\/[^)]+|data:image\/[^;]+;base64,[^)]+)\)/g;
          const matches: string[] = [];
          let m;
          const re = new RegExp(urlRegex.source, 'g');
          while ((m = re.exec(imageString)) !== null) matches.push(m[1]);
          const openMgr = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); setImageManager({ item: { ...item }, column: col, collection: getImageCollection(), isOpen: true }); };
          return (
            <td key={col} className={`${cellCls} relative group/cell ${isColFrozen ? stickyBg : ''}`} style={{ ...style, minWidth: '180px' }}>
              <div className="flex items-center gap-1.5 overflow-hidden w-full relative h-full">
                {matches.length > 0 ? (
                  <>
                    {matches.slice(0, 4).map((url, idx) => (
                      <img key={idx} src={url} loading="lazy" className="h-8 w-10 object-cover rounded-md border border-slate-200 shrink-0 cursor-pointer shadow-sm drop-shadow-sm" onClick={openMgr} alt="" />
                    ))}
                    {matches.length > 4 && (
                      <span className="text-[10px] font-semibold text-slate-400 shrink-0 cursor-pointer" onClick={openMgr}>
                        +{matches.length - 4}
                      </span>
                    )}
                    {/* Manage button — appears on hover */}
                    <button
                      onClick={openMgr}
                      className="h-7 w-7 shrink-0 rounded-md border border-slate-200 flex items-center justify-center text-slate-400 hover:text-brand-primary hover:border-brand-primary hover:bg-white transition-colors bg-slate-50 opacity-100 sm:opacity-0 sm:group-hover/cell:opacity-100 absolute right-1 z-20 shadow-sm"
                      title="Manage images"
                    >
                      <Paperclip className="h-3 w-3" />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={openMgr}
                    className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 hover:text-brand-primary transition-colors px-1"
                    title="Attach file"
                  >
                    <Paperclip className="h-3.5 w-3.5" />
                    <span>Attach file</span>
                  </button>
                )}
              </div>
            </td>
          );
        }

        // Tracks: FileLink — special link display
        if (activeTable === 'Tracks' && col === 'FileLink') {
          return (
            <td key={col} className={`${cellCls} ${isColFrozen ? stickyBg : ''}`} style={style}>
              {item["FileLink"]
                ? <a href={item["FileLink"]} target="_blank" rel="noopener noreferrer" className="text-brand-primary underline text-[13px]">Link</a>
                : <span className="text-slate-300 italic text-[12px]">—</span>}
            </td>
          );
        }

        // ── PRIMARY COLUMN ────────────────────────────────────────────────
       if (isPrimary) {
          const primaryVal = item[col] || item[col.toLowerCase()] || '';
          return (
            <td key={col} className={`${primaryCls} ${isColFrozen ? stickyBg : ''}`} style={style}>
              <div className="truncate">{primaryVal || primaryFallback}</div>
            </td>
          );
        }

        // ── TYPE-DRIVEN for all other columns ─────────────────────────────
        const needsWrap = type === 'long_text' || type === 'link_to_record' || type === 'badge_multi';
        return (
  <td 
    key={col} 
    className={`${
      needsWrap 
        ? 'px-4 py-3 border-r border-b border-slate-200 text-slate-700 text-[13px] whitespace-normal text-left align-top' 
        : cellCls
    } ${isColFrozen ? stickyBg : ''}`} 
    style={style}
  >
    {renderCell(col, item)}
  </td>
);
      })}
    </>
  );
};


const handleAddBlankRow = async (initialData: Record<string, any> = {}) => {
  let collection = '';
  const dataToSave = { ...initialData };
  switch (activeTable) {
    case 'Events': collection = 'events'; break;
    case 'Session': collection = 'sessions'; break;
    case 'MusicLog': collection = 'musiclog'; break;
    case 'Tracks':
      collection = 'media';
      dataToSave.type = 'track';
      dataToSave.Type = 'track';
      break;
    case 'VideoLog': collection = 'videolog'; break;
    case 'LED': collection = 'led_details'; break;
    case 'DyatraChecklist': collection = 'checklist'; break;
    case 'DataSharing': collection = 'locations'; break;
    case 'Guidance & Learning': collection = 'guidance'; break;
    case 'VideoSetup': collection = 'videosetup'; break;
    case 'AudioSetup': collection = 'audiosetup'; break;
    default: return;
  }

  const optimisticSetter: Record<string, React.Dispatch<React.SetStateAction<any[]>>> = {
    'events': setEvents as any, 'sessions': setSessions as any,
    'musiclog': setMusicLogs, 'videolog': setVideoLogs,
    'media': setMedia as any, 'checklist': setChecklist as any,
    'guidance': setGuidance as any, 'led_details': setLedDetails as any,
    'locations': setLocations, 'videosetup': setVideoSetup, 'audiosetup': setAudioSetup,
  };
  const setter = optimisticSetter[collection];

  // Show the row immediately as a placeholder (no edit mode yet — avoids PUT on temp ID)
  const tempId = `temp-${Date.now()}`;
  const tempRecord = { ...dataToSave, _id: tempId, _isTemp: true };
  if (setter) setter(prev => [...prev, tempRecord]);

  // Scroll to the placeholder row
  setTimeout(() => {
    const sc = document.querySelector('.overflow-auto');
    if (sc) sc.scrollTo({ top: sc.scrollHeight, behavior: 'smooth' });
  }, 60);

  mutationInFlight.current += 1;
  try {
    const response = await window.fetch(`/api/${collection}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dataToSave)
    });

    if (response.ok) {
      const newRecordFromServer = await response.json();
      const realId = newRecordFromServer?._id || newRecordFromServer?.id;
      // Replace placeholder with the real server record
      if (setter && realId) {
        setter(prev => prev.map(r => r._id === tempId ? newRecordFromServer : r));
      }
      // Now enter edit mode on the real record
      if (realId) {
        const d = { ...newRecordFromServer };
        setEditingId(realId);
        setEditDraft(d);
        const cols = getTableColumns();
        if (cols.length > 0) setEditingCell(cols[0]);
        setTimeout(() => {
          const rowEl = document.getElementById(`record-${realId}`);
          if (rowEl) rowEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 80);
      }
    } else {
      if (setter) setter(prev => prev.filter(r => r._id !== tempId));
      showToast('Failed to save record to database.');
    }
  } catch (error) {
    console.error('Error adding row:', error);
    if (setter) setter(prev => prev.filter(r => r._id !== tempId));
    showToast('Failed to save record. Check your connection.');
  } finally {
    mutationInFlight.current -= 1;
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

    // Fetch all endpoints concurrently instead of sequentially for much faster initial load
    await Promise.allSettled(
      endpoints.map(async ({ key, setter }) => {
        try {
          const response = await window.fetch(`/api/${key}`);
          if (response.ok) {
            const data = await response.json();
            setter(data);
          }
        } catch (err) {
          console.error(`Failed to fetch ${key}:`, err);
        }
      })
    );
  } catch (error) {
    console.error("Failed to fetch data from MongoDB:", error);
  } finally {
    setIsLoading(false);
  }
};
// Fetch only the active table's collection (plus sessions for linked-record tables) concurrently
const fetchActiveTable = async (table = activeTableRef.current) => {
  type E = { key: string; setter: (d: any[]) => void };
  const map: Record<string, E> = {
    'Events':              { key: 'events',      setter: d => setEvents(d) },
    'Session':             { key: 'sessions',    setter: d => setSessions(d) },
    'MusicLog':            { key: 'musiclog',    setter: d => setMusicLogs(d) },
    'VideoLog':            { key: 'videolog',    setter: d => setVideoLogs(d) },
    'Tracks':              { key: 'media',       setter: d => setMedia(d) },
    'DyatraChecklist':     { key: 'checklist',   setter: d => setChecklist(d) },
    'Guidance & Learning': { key: 'guidance',    setter: d => setGuidance(d) },
    'LED':                 { key: 'led_details', setter: d => setLedDetails(d) },
    'DataSharing':         { key: 'locations',   setter: d => setLocations(d) },
    'VideoSetup':          { key: 'videosetup',  setter: d => setVideoSetup(d) },
    'AudioSetup':          { key: 'audiosetup',  setter: d => setAudioSetup(d) },
  };
  const entry = map[table];
  if (!entry) return;
  try {
    const promises = [];
    
    promises.push(
      window.fetch(`/api/${entry.key}`)
        .then(r => r.ok ? r.json() : null)
        .then(d => { if (d) entry.setter(d); })
    );

    if (['Events', 'MusicLog', 'VideoLog'].includes(table)) {
      promises.push(
        window.fetch('/api/sessions')
          .then(r => r.ok ? r.json() : null)
          .then(d => { if (d) setSessions(d); })
      );
    }
    await Promise.allSettled(promises);
  } catch (e) {
    console.error('fetchActiveTable error', e);
  }
};

// 2. Trigger fetch on mount and every time user logs in
useEffect(() => {
  if (user) {
    fetchAllData();

    const interval = setInterval(() => {
      // Skip refresh if Image Manager is open or a mutation is in flight
      if (!imageManager?.isOpen && mutationInFlight.current === 0) {
        fetchActiveTable();
      }
    }, 10000);

    return () => clearInterval(interval);
  }
}, [user, imageManager?.isOpen]); // Add imageManager.isOpen as a dependency

// Dynamically fetch and poll notifications to keep the inbox badge and panel current
useEffect(() => {
  if (!user?.email) { 
    setNotifications([]);
    setNotificationsLoading(false);
    return; 
  }
  const fetchNotifs = () => {
    window.fetch(`/api/notifications?email=${encodeURIComponent(user.email)}&_t=${Date.now()}`)
      .then(r => r.ok ? r.json() : [])
      .then(d => { 
        setNotifications(prev => {
          // Preserve locally cleared/read state to prevent stale background fetches from un-clearing items
          const prevMap = new Map(prev.map(n => [String(n._id), n]));
          return d.map((n: any) => {
            const existing = prevMap.get(String(n._id));
            if (existing?.cleared) n.cleared = true;
            if (existing?.read) n.read = true;
            return n;
          });
        });
        setNotificationsLoading(false); 
      })
      .catch(() => setNotificationsLoading(false));
  };
  fetchNotifs();
  const t = setInterval(fetchNotifs, 15000); // 15s dynamic polling
  return () => clearInterval(t);
}, [user?.email]);

const [inboxUnread, setInboxUnread] = useState(0);
// Keep badge in sync with background poll when panel is closed
useEffect(() => {
  setInboxUnread(notifications.filter((n: any) => !n.read && !n.cleared).length);
}, [notifications]);

 const handleAddRecord = async () => {
  let collection = '';
  const data: Record<string, any> = { ...newRecord };

  // Remap camelCase form keys → exact MongoDB field names per table
  const remap = (from: string, to: string) => { if (from in data) { data[to] = data[from]; delete data[from]; } };

  switch (activeTable) {
    case 'Events': collection = 'events'; break;
    case 'Session':
      collection = 'sessions';
      remap('name', 'Session Name'); remap('parentEvent', 'Parent Event');
      remap('date', 'Date'); remap('city', 'City'); remap('venue', 'Venue');
      remap('timeOfDay', 'Time Of Day'); remap('occasion', 'Occasion');
      remap('sessionType', 'SessionType'); remap('notes', 'Notes');
      break;
    case 'MusicLog':
      collection = 'musiclog';
      remap('playId', 'PlayID'); remap('session', 'Session');
      remap('parentEvent', 'Parent Event (from Session)');
      remap('date', 'Date (from Session)'); remap('timeOfDay', 'TimeOfDay (from Session)');
      remap('occasion', 'Occasion (from Session)'); remap('notes', 'Notes');
      remap('order', 'Order'); remap('playedAt', 'PlayedAt'); remap('track', 'Track');
      remap('theme', 'Theme'); remap('relevance', 'Relevance'); remap('patrank', 'Patrank');
      remap('topic', 'Topic'); remap('cue', 'Cue'); remap('ppgRemarks', 'PPG'); remap('trackId', 'TrackID');
      break;
    case 'VideoLog':
      collection = 'videolog';
      remap('session', 'Session'); remap('parentEvent', 'Parent Event (from Session)');
      remap('date', 'Date (from Session)'); remap('city', 'City (from Session)');
      remap('venue', 'Venue (from Session)'); remap('timeOfDay', 'TimeOfDay (from Session)');
      remap('occasion', 'Occasion (from Session)'); remap('sessionType', 'SessionType (from Session)');
      remap('duration', 'Duration'); remap('proposalsList', 'ProposalsList');
      break;
    case 'Tracks':
      collection = 'media';
      data.type = 'track'; data.Type = 'track';
      remap('title', 'Title'); remap('artist', 'Artist'); remap('album', 'Album');
      remap('duration', 'Duration'); remap('durationTime', 'DurationTime');
      remap('bpm', 'BPM'); remap('key', 'Key'); remap('source', 'Source');
      remap('fileLink', 'FileLink'); remap('tags', 'Tags'); remap('lyrics', 'Lyrics');
      remap('lexiconID', 'LexiconID'); remap('lastUpdated', 'LastUpdated'); remap('plays', 'Plays');
      break;
    case 'DyatraChecklist':
      collection = 'checklist';
      remap('task', 'Task'); remap('category', 'Category');
      break;
    case 'Guidance & Learning':
      collection = 'guidance';
      remap('event', 'Event'); remap('city', 'City'); remap('guidanceFrom', 'GuidanceFrom');
      remap('guidanceLearning', 'Guidance/Learning'); remap('category', 'Category');
      remap('attachments', 'Attachments');
      break;
    case 'LED': collection = 'led_details'; break;
    case 'DataSharing': collection = 'locations'; break;
    case 'VideoSetup':
      collection = 'videosetup';
      remap('name', 'Name'); remap('notes', 'Notes'); remap('attachments', 'Attachments');
      break;
    case 'AudioSetup':
      collection = 'audiosetup';
      remap('name', 'Name'); remap('notes', 'Notes'); remap('attachments', 'Attachments');
      break;
  }

  setIsAddModalOpen(false);
  setNewRecord({});

  setIsAdding(true);
  mutationInFlight.current += 1;
  try {
    const response = await window.fetch(`/api/${collection}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (response.ok) {
      await fetchActiveTable();
    } else {
      showToast('Failed to save record to database.');
    }
  } catch (error) {
    console.error("Add record error:", error);
    showToast('Failed to save record. Check your connection.');
  } finally {
    setIsAdding(false);
    mutationInFlight.current -= 1;
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
const [linkedRecordPopup, setLinkedRecordPopup] = useState<{ record: any; tableName: string; nameField: string; fields: string[] } | null>(null);

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
    setAddWizardStep(0);
    setIsAddModalOpen(true);
  };

  const activeTableRefForSave = useRef(activeTable);

  useEffect(() => {
    activeTableRefForSave.current = activeTable;
    const saved = localStorage.getItem(`dyatra_table_settings_${activeTable}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setGroupByField(parsed.groupByField !== undefined ? parsed.groupByField : null);
        setSortBy(parsed.sortBy !== undefined ? parsed.sortBy : null);
        setViewMode(parsed.viewMode || 'grid');
        setCollapsedGroups(parsed.collapsedGroups || []);
        setSearchQuery(parsed.searchQuery || '');
        setAdvancedFilter(parsed.advancedFilter || { id: 'root', type: 'group', logic: 'AND', conditions: [] });
      } catch (e) {
        setGroupByField(null);
        setSortBy(null);
        setCollapsedGroups([]);
        setSearchQuery('');
        setViewMode('grid');
        setAdvancedFilter({ id: 'root', type: 'group', logic: 'AND', conditions: [] });
      }
    } else {
      setGroupByField(null);
      setSortBy(null);
      setCollapsedGroups([]);
      setSearchQuery('');
      setViewMode('grid');
      setAdvancedFilter({ id: 'root', type: 'group', logic: 'AND', conditions: [] });
    }
    setExpandedGroups([]);
    setNewRecord({});
  }, [activeTable]);

  useEffect(() => {
    if (activeTableRefForSave.current === activeTable) {
      const settings = {
        groupByField,
        sortBy,
        viewMode,
        collapsedGroups,
        searchQuery,
        advancedFilter
      };
      localStorage.setItem(`dyatra_table_settings_${activeTable}`, JSON.stringify(settings));
    }
  }, [groupByField, sortBy, viewMode, collapsedGroups, searchQuery, advancedFilter, activeTable]);

useEffect(() => {
  if (!editingId) setEditingCell(null);
}, [editingId]);

useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    // Only proceed if we are currently editing a row
    if (editingId) {
      // Check if the click was outside the grid container
      if (gridContainerRef.current && !gridContainerRef.current.contains(event.target as Node)) {
        // Option A: Save and Close (Recommended)
        handleUpdateRecord(); 
        
        // Option B: Just Close (Cancel changes)
        // setEditingId(null);
        // setEditDraft(null);
        // setEditingCell(null);
      }
    }
  };

  document.addEventListener('mousedown', handleClickOutside);
  return () => {
    document.removeEventListener('mousedown', handleClickOutside);
  };
}, [editingId, editDraft]);

  // Load col widths
  useEffect(() => {
    const savedWidths = localStorage.getItem('dyatra_col_widths');
    if (savedWidths) {
      try {
        setColWidths(JSON.parse(savedWidths));
      } catch (e) {}
    }
  }, []);

  // Save col widths
  useEffect(() => {
    if (Object.keys(colWidths).length > 0) {
      localStorage.setItem('dyatra_col_widths', JSON.stringify(colWidths));
    }
  }, [colWidths]);


// Removed aggressive background polling of all 10 tables every 5 seconds.
// This exhausted the browser's max concurrent connections limit.
// The 10-second fetchActiveTable interval handles keeping the visible data fresh.

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        const userData = event.data.user;
        setUser(userData);
        sessionStorage.setItem('dyatra_user', JSON.stringify(userData));
        } else if (event.data?.type === 'OAUTH_AUTH_ERROR') {
          setLoginError(event.data.error);
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
    setActiveTable('Home');
    setViewingRecord(null);
    sessionStorage.removeItem('dyatra_user');
  };

  useEffect(() => {
    if (user && activeTable && !hasPerm(user, activeTable, 'view')) {
      setActiveTable('Home');
      setViewingRecord(null);
    }
  }, [user, activeTable]);

const handleDirectImageUpload = (e: React.ChangeEvent<HTMLInputElement>, item: any, collectionName: string, setter: React.Dispatch<React.SetStateAction<any[]>>) => {
  e.stopPropagation();
  const file = e.target.files?.[0];
  if (!file) return;
  if (file.size > 10 * 1024 * 1024) { 
    alert('File too large (max 10 MB)'); 
    return; 
  }
  const reader = new FileReader();
  reader.onloadend = () => {
    const base64Url = reader.result as string;
    const currentImages = item["Images"] || "";
    const newImageStr = `${currentImages} (${base64Url})`.trim();
    const updatedItem = { ...item, ["Images"]: newImageStr };
    const id = item._id || item.id;
    
    setter(prev => prev.map(r => (r._id === id || r.id === id) ? updatedItem : r));
    
    window.fetch(`/api/${collectionName}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedItem)
    }).catch(err => {
      console.error(err);
      setter(prev => prev.map(r => (r._id === id || r.id === id) ? item : r));
      alert("Failed to upload image");
    });
  };
  reader.readAsDataURL(file);
  e.target.value = '';
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

  // 2. Standard Grouping
  if (groupByField) {
    const activeGroupField = groupByField;
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
    const norm = (d: any) => d ? String(d).split('T')[0] : '';
    const sDate = s["Date"] || s["date"] || '';
    const sTimeOfDay = s["Time Of Day"] || s["TimeOfDay"] || s["timeOfDay"] || '';
    const sOccasion = s["Occasion"] || s["occasion"] || '';
    const patch: any = { Session: s["Session Name"] };
    if (activeTable === 'MusicLog') {
      patch["Parent Event (from Session)"] = s["Parent Event"] || '';
      patch["Date (from Session)"]         = norm(sDate);
      patch["TimeOfDay (from Session)"]    = sTimeOfDay;
      patch["Occasion (from Session)"]     = sOccasion;
    } else {
      patch["Parent Event (from Session)"] = s["Parent Event"] || '';
      patch["Date (from Session)"]         = norm(sDate);
      patch["City (from Session)"]         = s["City"] || '';
      patch["Venue (from Session)"]        = s["Venue"] || '';
      patch["TimeOfDay (from Session)"]    = sTimeOfDay;
      patch["Occasion (from Session)"]     = sOccasion;
      patch["SessionType (from Session)"]  = s["SessionType"] || '';
    }
    setInlineRecord({ ...inlineRecord, ...patch });
  };

  const isEventsTable = activeTable === 'Events';
  const selectCls = "w-full h-8 bg-white border border-blue-300 rounded px-2 text-[12px] font-bold text-black focus:ring-2 focus:ring-brand-primary outline-none shadow-sm";
  const inputCls = "w-full h-8 bg-white border border-blue-300 rounded px-2 text-[12px] font-bold text-black placeholder:text-slate-400 focus:ring-2 focus:ring-brand-primary outline-none shadow-sm";
  return (
    <>
      {cols.map((col, i) => {
        const colType = getColumnType(col);
        return (
        <td
          key={i}
          className={`px-2 py-2 border-r border-b border-slate-400 ${i === 0 ? (isMobileView ? 'bg-blue-100' : 'bg-blue-100 sticky left-[48px] z-10') : 'bg-blue-50/50'}`}
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
                  // APPLY STYLE HERE
                  style={colType === 'email' ? { 
                    color: '#2563eb', 
                    WebkitTextFillColor: '#2563eb', 
                    textDecoration: 'underline' 
                  } : {}}
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
        );
      })}
    </>
  );
};


const handleUpdateRecord = async (draftOverride?: any) => {
  // If a cell mousedown is in-flight (user clicking a different cell in the same row),
  // skip the blur-triggered save — the click will handle saving when needed.
  if (clickingCellRef.current && draftOverride === undefined) return;
  const draft = draftOverride ?? editDraft;
    if (!editingId || !draft) {
    setEditingId(null);
    return;
  }

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

  // Optimistic update — apply immediately so the UI shows the new value
  // with no flash; background fetch reconciles any server-side transforms.
  const id = draft._id || draft.id;
  const optimisticSetter: Record<string, React.Dispatch<React.SetStateAction<any[]>>> = {
    'events': setEvents as any, 'sessions': setSessions as any,
    'musiclog': setMusicLogs, 'videolog': setVideoLogs,
    'media': setMedia as any, 'checklist': setChecklist as any,
    'guidance': setGuidance as any, 'led_details': setLedDetails as any,
    'locations': setLocations, 'videosetup': setVideoSetup, 'audiosetup': setAudioSetup,
  };
  const setter = optimisticSetter[collection];
  if (setter) setter((prev: any[]) => prev.map(r => (r._id === id || r.id === id) ? { ...r, ...draft } : r));

  clickingCellRef.current = false;
  setEditingId(null);
  setEditDraft(null);

  try {
    const response = await window.fetch(`/api/${collection}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draft)
    });

    if (response.ok) {
      fetchActiveTable();
    } else {
      alert("Failed to update record");
      fetchActiveTable(); // revert to server state on failure
    }
  } catch (error) {
    console.error("Update Error:", error);
    fetchActiveTable(); // revert to server state on error
  }
};

const openNotificationRecord = async (tableName: string, collection: string, recordId: string) => {
  setActiveTable(tableName);
  setViewingRecord(null);
  try {
    const res = await window.fetch(`/api/${collection}/${recordId}`);
    if (res.ok) { const record = await res.json(); setExpandedRecord(record); }
  } catch { /* silent */ }
};

const handleExpandedSave = async (newDraft: any) => {
  const id = newDraft._id || newDraft.id;
  if (!id) { showToast('Cannot save — record has no ID.'); return; }
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
    const res = await window.fetch(`/api/${collection}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    });
    if (!res.ok) { showToast('Save failed — please try again.'); return; }
    // Keep viewingRecord in sync so detail view shows updated data
    if (viewingRecord && (viewingRecord._id === id || viewingRecord.id === id)) {
      setViewingRecord({ ...newDraft, _id: id });
    }
    fetchActiveTable();
  } catch (e) {
    console.error("Expand save error", e);
    showToast('Save failed — please try again.');
  }
};

const renderEditInputs = (_item: any) => {
  const cols = getTableColumns();
  const gw   = (n: string) => colWidths[n] || 200;
  const frozen = frozenUpTo[activeTable] ?? -1;
  const leftOffsets: number[] = [];
  let accLeft = 48;
  cols.forEach((c, idx) => { leftOffsets[idx] = accLeft; if (idx <= frozen) accLeft += gw(c); });
  const isEv = activeTable === 'Events';
  const isSe = activeTable === 'Session';
  const isML = activeTable === 'MusicLog';
  const isVL = activeTable === 'VideoLog';
  const isLinked = isML || isVL;

  const inputCls = () =>
  `w-full h-full bg-transparent border-none focus:border-none focus:ring-0
   px-2 py-0 text-[13px] font-normal text-slate-700 outline-none shadow-none`;
  const saveKeys    = (e: React.KeyboardEvent) => { 
    if (e.key === 'Enter') handleUpdateRecord(); 
    if (e.key === 'Escape') { setEditingId(null); setEditDraft(null); setEditingCell(null); } 
  };

  const commitField = (col: string, val: string) => {
    const nd = { ...editDraft, [col]: val };
    setEditDraft(nd);
    handleUpdateRecord(nd);
  };
const updateDraftOnly = (col: string, val: string) => {
    setEditDraft({ ...editDraft, [col]: val }); // Only updates UI state, keeps edit mode open
  };
  const commitSession = (sessionName: string) => {
    const s = sessions.find((x: any) => x["Session Name"] === sessionName);
    const patch: any = { Session: sessionName };
    const norm = (d: any) => d ? String(d).split('T')[0] : '';
    if (s) {
      const sDate = s["Date"] || s["date"] || '';
      const sTimeOfDay = s["Time Of Day"] || s["TimeOfDay"] || s["timeOfDay"] || '';
      const sOccasion = s["Occasion"] || s["occasion"] || '';
      if (isML) {
        patch["Parent Event (from Session)"] = s["Parent Event"] || '';
        patch["Date (from Session)"]         = norm(sDate);
        patch["TimeOfDay (from Session)"]    = sTimeOfDay;
        patch["Occasion (from Session)"]     = sOccasion;
      } else {
        patch["Parent Event (from Session)"] = s["Parent Event"] || '';
        patch["Date (from Session)"]         = norm(sDate);
        patch["City (from Session)"]         = s["City"] || '';
        patch["Venue (from Session)"]        = s["Venue"] || '';
        patch["TimeOfDay (from Session)"]    = sTimeOfDay;
        patch["Occasion (from Session)"]     = sOccasion;
        patch["SessionType (from Session)"]  = s["SessionType"] || '';
      }
    }
    const nd = { ...editDraft, ...patch };
    setEditDraft(nd);
    handleUpdateRecord(nd);
  };

  return (
    <>
      {cols.map((col, i) => {

        if (activeTable === 'MusicLog' && col === 'Relevance') {
          return (
            <td key={col} style={{ width: gw(col) }} className="border-r border-b border-slate-200 text-center bg-white h-[40px]">
              <StarRating 
                value={editDraft[col]} 
                onSave={(newVal) => {
                  const nd = { ...editDraft, [col]: newVal };
                  setEditDraft(nd);
                  handleUpdateRecord(nd);
                }} 
              />
            </td>
          );
        }
        const isAutoFilled = col.includes('(from Session)') || col.includes('(from 🕘 Session)') || col.toLowerCase().includes('(from event)');
        const isActuallyActive = editingCell === col && !isAutoFilled;
        const colType = getColumnType(col);
        const isMulti = colType === 'badge_multi';
        const isSingleBadge = colType === 'status' || colType === 'select';
        const isLinkCol = colType === 'link_to_record';
        const isFreezeEdge = i === frozen;

        return (
          <td
            key={i}
            className={`border-b transition-colors ${isFreezeEdge ? 'border-r-2 border-r-brand-primary/40' : 'border-r'} ${
              isActuallyActive && isLinkCol
                ? 'px-1 py-0.5 border-blue-400 bg-white ring-2 ring-inset ring-blue-300 overflow-visible'
                : isActuallyActive
                  ? 'p-0 border-blue-400 bg-white ring-2 ring-inset ring-blue-300 overflow-visible'
                  : isAutoFilled
                    ? 'px-4 py-3 bg-slate-50/40 cursor-not-allowed overflow-hidden border-slate-200 text-slate-700 text-[13px]'
                    : 'px-4 py-3 border-slate-200 bg-white overflow-hidden cursor-pointer text-slate-700 text-[13px] text-left'
            } ${i === 0 && frozen >= 0 && !isMobileView ? `sticky left-[48px] ${!isActuallyActive ? 'z-10' : ''}` : ''}`}
            style={isActuallyActive
              ? { width: gw(col), minWidth: gw(col), height: '40px', ...(i <= frozen ? { position: 'sticky', left: leftOffsets[i], zIndex: 10, ...FROZEN_STYLE, backgroundColor: '#fff' } : {}) }
              : { width: gw(col), minWidth: gw(col), maxWidth: gw(col), height: '40px', ...(i <= frozen ? { position: 'sticky', left: leftOffsets[i], zIndex: 10, ...FROZEN_STYLE } : {}) }}
            onMouseDown={() => { if (!isAutoFilled && colType !== 'lookup') clickingCellRef.current = true; }}
            onClick={() => {
              clickingCellRef.current = false;
              if (!isAutoFilled && colType !== 'lookup') setEditingCell(col);
            }}
          >
            {(() => {
              if (activeTable === 'Tracks' && (col === 'PlayID' || col === 'Plays')) {
                if (isActuallyActive && col === 'Plays') {
                  return (
                    <LinkedRecordPicker
                      value={editDraft[col] || ''}
                      records={musicLogs}
                      nameField="PlayID"
                      displayField="Track"
                      linkedTable="MusicLog"
                      onCommit={val => {
                        commitField(col, val);
                      }}
                      onCancel={() => { setEditingId(null); setEditDraft(null); setEditingCell(null); }}
                    />
                  );
                }


                const rawVal = editDraft[col];
                if (!rawVal) {
                  return <span className="text-slate-300 italic text-[12px]">—</span>;
                }
                const vals = String(rawVal).split(',').map(s => s.trim()).filter(Boolean);
                return (
                  <div className="flex flex-wrap items-center gap-1.5 h-full py-1">
                    {vals.map((playId, idx) => {
                      const musicLogRecord = musicLogs.find(ml => String(ml.PlayID) === playId);
                      return (
                        <span
                          key={idx}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (musicLogRecord) {
                              const nameField = getPrimaryField('MusicLog');
                              const fields = Object.keys(musicLogRecord).filter(k => !['_id', 'id', 'created_at', '__v'].includes(k) && k !== nameField).slice(0, 8);
                              setLinkedRecordPopup({ record: musicLogRecord, tableName: 'MusicLog', nameField, fields });
                            }
                          }}
                          className={`inline-flex items-center gap-0.5 text-[12px] font-semibold px-2.5 py-0.5 rounded-full max-w-full min-w-0 transition-all ${
                            musicLogRecord ? 'bg-brand-primary/10 text-brand-primary border border-brand-primary/20 cursor-pointer hover:bg-brand-primary/20' : 'bg-slate-100 text-slate-700 border-slate-200 cursor-default'
                          }`}
                        >
                          <span className="truncate">{musicLogRecord?.Track ? `${musicLogRecord.Track} (${playId})` : playId}</span>
                          {musicLogRecord && <ArrowUpRight className="shrink-0 h-3 w-3 opacity-60" />}
                        </span>
                      );
                    })}
                  </div>
                );
              }

              if (isAutoFilled) {
                return (
                  <div className="flex items-center justify-center h-full opacity-60 italic select-none">
                    {renderCell(col, editDraft)}
                  </div>
                );
              }



              // link_to_record: show picker only when this cell is active
              if (colType === 'link_to_record') {
                if (!isActuallyActive) return renderCell(col, editDraft);
                const meta = columnMeta[activeTable]?.[col];
                const linkedTable = meta?.linkedTable || '';
                const linkedRecords = getDataForTable(linkedTable);
                const nameField = getPrimaryField(linkedTable);
                return (
                  <LinkedRecordPicker
                    value={editDraft[col] || ''}
                    records={linkedRecords}
                    nameField={nameField}
                    displayField={linkedTable === 'MusicLog' ? 'Track' : undefined}
                    linkedTable={linkedTable || col}
                    onCommit={val => {
                      const patch = buildLookupPatch(col, val, editDraft);
                      const nd = { ...editDraft, [col]: val, ...patch };
                      setEditDraft(nd);
                      handleUpdateRecord(nd);
                    }}
                    onCancel={() => { setEditingId(null); setEditDraft(null); setEditingCell(null); }}
                    onAddLookup={lt => {
                      const currentExtras = extraColumns[activeTable] || [];
                      setAddColumnModal({ name: '', type: 'lookup', linkedTable: lt, lookupField: '' });
                    }}
                  />
                );
              }

              // lookup: always read-only
              if (colType === 'lookup') {
                return (
                  <div className="flex items-center h-full opacity-60 italic select-none">
                    {renderCell(col, editDraft)}
                  </div>
                );
              }

              // Only show the input/editor if THIS specific cell is active
              if (!isActuallyActive) {
                const sessionFieldNames = ['Sessions', 'Session', 'Imported table', '🕘 Session'];
                if (sessionFieldNames.includes(col)) {
                  const val = editDraft[col] || '';
                  const names = typeof val === 'string' ? val.split(',').map((s: string) => s.trim()).filter(Boolean) : [];
                  return names.length > 0
                    ? <div className="flex flex-wrap gap-1.5 justify-start">
                        {names.map((sName: string, idx: number) => {
                          const linked = sessions.find((s: any) => s["Session Name"] === sName);
                          return (
                            <span key={idx} className={`inline-flex items-center gap-0.5 text-[12px] font-semibold px-2.5 py-0.5 rounded-full max-w-full min-w-0 transition-all ${linked ? 'bg-brand-primary/10 text-brand-primary border border-brand-primary/20 cursor-pointer hover:bg-brand-primary/20' : 'bg-slate-100 text-slate-700 border border-slate-200 cursor-default'}`} onClick={(e) => { e.stopPropagation(); if (linked) setLinkedSession(linked); }}>
                              <span className="truncate">{sName}</span>
                              {linked && <ArrowUpRight className="h-3 w-3 opacity-60 shrink-0" />}
                            </span>
                          );
                        })}
                      </div>
                    : <span className="text-slate-300 italic text-[12px]">—</span>;
                }
                return renderCell(col, editDraft);
              }

              // --- RENDER EDITORS (Only for isActuallyActive) ---

              // Handle Long Text (Moved inside the proper gate)
              if (colType === 'long_text') {
                return (
                  <textarea
                    autoFocus
                    className={`${inputCls()} h-24 py-2 resize-none whitespace-normal text-left align-top`}
                    value={editDraft[col] || ''}
                    onChange={e => setEditDraft({ ...editDraft, [col]: e.target.value })}
                    onBlur={() => handleUpdateRecord()}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) { 
                        e.preventDefault();
                        handleUpdateRecord();
                      }
                      if (e.key === 'Escape') { setEditingId(null); setEditingCell(null); }
                    }}
                  />
                );
              }

              let opts: string[] = [];
              // ... (Keep all your existing 'opts' logic exactly as it is)
              if (activeTable === 'Tracks' && ['Source', 'Plays'].includes(col)) {
                opts = [...new Set(media.filter((m: any) => m.type === 'track' || m.Type === 'track' || m["Title"]).map((item: any) => item[col]).filter(Boolean).map(String).flatMap(val => val.split(',').map(v => v.trim()).filter(Boolean)))].sort();
              }
              else if ((activeTable === 'VideoSetup' || activeTable === 'AudioSetup') && col === 'Status') {
                opts = ['To Do', 'In Progress', 'Done'];
              }
              else if ((activeTable === 'VideoSetup' || activeTable === 'AudioSetup') && col === 'Assignee') {
                opts = [...new Set(locations.map((item: any) => item["Sevak"]).filter(Boolean).map(String))].sort();
              }
              else if (activeTable === 'DataSharing' && col === 'Dept') {
                opts = [...new Set(locations.map((item: any) => item[col]).filter(Boolean).map(String).flatMap(val => val.split(',').map(v => v.trim()).filter(Boolean)))].sort();
              }
              else if (activeTable === 'LED' && ['Indoor/Outdoor LED?', 'CntrPitch', 'SidePitch', 'OtherLed1', 'OtherLed2', 'Vendor'].includes(col)) {
                opts = [...new Set(ledDetails.map((item: any) => item[col]).filter(Boolean).map(String).flatMap(val => val.split(',').map(v => v.trim()).filter(Boolean)))].sort();
              }
              else if (activeTable === 'Guidance & Learning' && ['City', 'GuidanceFrom', 'Category'].includes(col)) {
                opts = [...new Set(guidance.map((item: any) => item[col]).filter(Boolean).map(String).flatMap(val => val.split(',').map(v => v.trim()).filter(Boolean)))].sort();
              }
              else if (activeTable === 'DyatraChecklist' && ['Typical Timeline', 'Category', 'Period', 'People Involved'].includes(col)) {
                opts = [...new Set(checklist.map((item: any) => item[col]).filter(Boolean).map(String).flatMap(val => val.split(',').map(v => v.trim()).filter(Boolean)))].sort();
              }
              else if (activeTable === 'MusicLog' && col === 'PlayedAt') {
                opts = [...new Set(musicLogs.map((item: any) => item[col]).filter(Boolean).map(String).flatMap(val => val.split(',').map(v => v.trim()).filter(Boolean)))].sort();
              }
              else if (isEv && (col === 'Occasion' || col === 'City' || col === 'Year')) {
                 if (col === 'Year') {
                   const yr = new Date().getFullYear();
                   opts = Array.from({ length: 11 }, (_, k) => String(yr + 2 - k));
                 } else {
                   opts = [...new Set(events.map((e: any) => e[col]).filter(Boolean).flatMap((o: string) => o.split(',').map((x: string) => x.trim())).filter(Boolean))].sort();
                 }
              }
              else if (isSe && ['City', 'Occasion', 'Time Of Day', 'SessionType', 'Parent Event'].includes(col)) {
                 if (col === 'Parent Event') opts = events.map((e: any) => e["Event Name"]).filter(Boolean).sort();
                 else opts = [...new Set(sessions.map((s: any) => s[col]).filter(Boolean).flatMap((o: string) => o.split(',').map((x: string) => x.trim())).filter(Boolean))].sort();
              }
              else if (isLinked && col === 'Session') {
                opts = sessions.map((s: any) => s["Session Name"]).filter(Boolean).sort();
              }

              opts = [...new Set([...opts, ...(customTags[activeTable]?.[col] || [])])].sort();

              if (isMulti || isSingleBadge || (isLinked && col === 'Session')) {
                return (
                  <CellDropdown
                    value={editDraft[col] || ''}
                    options={opts}
                    isMulti={isMulti}
                    autoOpen={true}
                    onCommit={val => {
                      if (isMulti) updateDraftOnly(col, val);
                      else col === 'Session' ? commitSession(val) : commitField(col, val);
                    }}
                    onAddOption={val => handleAddCustomTag(activeTable, col, val)}
                    removableOptions={opts}
                    onRemoveOption={val => handleRemoveTagGlobally(activeTable, col, val)}
                    onCancel={() => { setEditingId(null); setEditDraft(null); setEditingCell(null); }}
                    onOutsideClick={() => handleUpdateRecord()}
                    placeholder={`Select ${col}…`}
                    isMinimal={true}
                  />
                );
              }

              if (colType === 'checkbox') {
                return <input type="checkbox" checked={editDraft[col] === 'true' || editDraft[col] === true} onChange={e => commitField(col, e.target.checked ? 'true' : 'false')} className="h-4 w-4 rounded accent-brand-primary cursor-pointer" />;
              }

              if (colType === 'date') {
                 return <input type="date" className={inputCls()} value={editDraft[col] || ''} onChange={e => setEditDraft({ ...editDraft, [col]: e.target.value })} onBlur={() => handleUpdateRecord()} onKeyDown={saveKeys} autoFocus />;
              }

              if (colType === 'time') {
                return <input type="time" step="1" className={inputCls()} value={editDraft[col] || ''} onChange={e => setEditDraft({ ...editDraft, [col]: e.target.value })} onBlur={() => handleUpdateRecord()} onKeyDown={saveKeys} autoFocus />;
              }

              return (
                <input
    autoFocus
    type="text"
    className={inputCls()}
    // This style ensures the blue format stays while typing in the cell
    style={colType === 'email' ? { 
      color: '#2563eb', 
      WebkitTextFillColor: '#2563eb', 
      textDecoration: 'underline',
      fontWeight: '500' // Matches your table's font weight
    } : undefined}
    value={editDraft[col] || ''}
    onChange={e => setEditDraft({ ...editDraft, [col]: e.target.value })}
    onBlur={() => handleUpdateRecord()}
    onKeyDown={saveKeys}
  />
              );
            })()}
          </td>
        );
      })}
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
  const data = { ...inlineRecord };
  // Mapping table to MongoDB collection
  switch (activeTable) {
    case 'Events': collection = 'events'; break;
    case 'Session': collection = 'sessions'; break;
    case 'MusicLog': collection = 'musiclog'; break;
    case 'VideoLog': collection = 'videolog'; break;
    case 'Tracks': 
      collection = 'media'; 
      data.type = 'track'; 
      data.Type = 'track'; 
      break;
    case 'DyatraChecklist': collection = 'checklist'; break;
    case 'Guidance & Learning': collection = 'guidance'; break;
    case 'LED': collection = 'led_details'; break;
    case 'DataSharing': collection = 'locations'; break;
    case 'VideoSetup': collection = 'videosetup'; break;
    case 'AudioSetup': collection = 'audiosetup'; break;
    default: return;
  }

  // Optional: Add logic here to rename keys if database fields differ from column names
  // For example: if (activeTable === 'Events') data.name = inlineRecord["Event Name"];

  try {
    const response = await window.fetch(`/api/${collection}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (response.ok) {
      const newRecordFromServer = await response.json();
      const optimisticSetter: Record<string, React.Dispatch<React.SetStateAction<any[]>>> = {
        'events': setEvents as any, 'sessions': setSessions as any,
        'musiclog': setMusicLogs, 'videolog': setVideoLogs,
        'media': setMedia as any, 'checklist': setChecklist as any,
        'guidance': setGuidance as any, 'led_details': setLedDetails as any,
        'locations': setLocations, 'videosetup': setVideoSetup, 'audiosetup': setAudioSetup,
      };
      const setter = optimisticSetter[collection];
      if (setter) setter(prev => [...prev, newRecordFromServer]);

      setIsInlineAdding(false);
      setInlineRecord({});
      fetchActiveTable();
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
        {health?.mongodbError && (
          <div className="bg-red-900/30 border border-red-500/50 rounded-xl p-4 mb-6">
            <p className="text-red-400 text-xs font-mono break-words">{health.mongodbError}</p>
          </div>
        )}
        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
          <motion.div animate={{ x: ['-100%', '100%'] }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }} className="h-full w-1/3 bg-brand-primary" />
        </div>
      </motion.div>
    </div>
  );
}
  return (
    <div className="flex h-screen bg-[#07080d] overflow-hidden text-slate-200 relative selection:bg-brand-primary/30">


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
  className={`fixed inset-y-0 left-0 z-50 bg-[#0f111a] flex flex-col shrink-0 border-r border-slate-800/60 transition-all duration-300 ease-in-out lg:relative ${
    isSidebarOpen
      ? 'translate-x-0 w-[260px] shadow-2xl lg:shadow-none'
      : '-translate-x-full lg:translate-x-0 lg:w-[72px]'
  }`}
>
  {/* Mobile close button */}
  <div className="lg:hidden absolute right-3 top-4 z-10">
    <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(false)} className="text-slate-400 hover:text-white h-10 w-10">
      <X className="h-5 w-5" />
    </Button>
  </div>

  {/* HEADER — fixed height so it never shifts layout */}
  <div className={`h-[64px] shrink-0 flex items-center border-b border-slate-800/40 ${
    isSidebarOpen ? 'px-4 justify-between' : 'justify-center'
  }`}>
    <div className="flex items-center gap-3 min-w-0">
      <div className="h-9 w-9 bg-brand-primary rounded-xl flex items-center justify-center shadow-lg shadow-brand-primary/20 shrink-0">
        <Zap className="h-5 w-5 text-white fill-white" />
      </div>
      {isSidebarOpen && (
        <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="min-w-0">
          <div className="text-[13px] font-black tracking-tight text-white uppercase leading-none">Dyatra Hub</div>
          <div className="text-[9px] font-bold text-slate-500 tracking-[0.2em] uppercase mt-0.5">Ops Center</div>
        </motion.div>
      )}
    </div>
    {isSidebarOpen && (
      <button
        onClick={() => setIsSidebarOpen(false)}
        className="hidden lg:flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:text-white hover:bg-slate-800/60 transition-all duration-200"
        title="Collapse"
      >
        <PanelLeftClose className="h-4 w-4" />
      </button>
    )}
  </div>

  {/* NAVIGATION */}
  <ScrollArea className="flex-1 overflow-y-auto">
    <div className="px-3 py-3">

      {/* Expand button — collapsed desktop only */}
      {!isSidebarOpen && (
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="hidden lg:flex w-full h-10 mb-3 items-center justify-center rounded-xl text-brand-primary bg-brand-primary/10 border border-brand-primary/20 hover:bg-brand-primary hover:text-white transition-all duration-200"
          title="Expand Sidebar"
        >
          <PanelLeftOpen className="h-4 w-4" />
        </button>
      )}

      {(() => {
        const navGroups: { groupLabel?: string; items: { icon: any; label: string; table: string }[] }[] = [
          {
            items: [
              { icon: LayoutGrid,    label: 'Home',               table: 'Home' },
              { icon: Calendar,      label: 'Events',              table: 'Events' },
              { icon: MessageSquare, label: 'Sessions',            table: 'Session' },
              { icon: FileText,      label: 'Guidance & Learning', table: 'Guidance & Learning' },
              { icon: Monitor,       label: 'LED',                 table: 'LED' },
              { icon: CheckSquare,   label: "D'yatra Checklist",   table: 'DyatraChecklist' },
              { icon: Search,        label: 'Data Sharing',        table: 'DataSharing' },
            ],
          },
          {
            groupLabel: 'Audio',
            items: [
              { icon: Music,   label: 'Music Log',  table: 'MusicLog' },
              { icon: Volume2, label: 'Audio Setup', table: 'AudioSetup' },
              { icon: Play,    label: 'Tracks',      table: 'Tracks' },
            ],
          },
          {
            groupLabel: 'Video',
            items: [
              { icon: Video, label: 'Video Log',   table: 'VideoLog' },
              { icon: Film,  label: 'Video Setup', table: 'VideoSetup' },
            ],
          },
        ];

        // Filter routes based on user permissions
        const filteredNavGroups = navGroups.map(group => ({
          ...group,
          items: group.items.filter(item => hasPerm(user, item.table, 'view'))
        })).filter(g => g.items.length > 0);

        return filteredNavGroups.map((group, gi) => (
          <div key={gi} className={gi > 0 ? 'mt-4' : ''}>
            {group.groupLabel && (
              isSidebarOpen ? (
                <div className="px-2 mb-1.5">
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-600">{group.groupLabel}</span>
                </div>
              ) : (
                <div className="flex justify-center mb-1.5">
                  <span className="text-[7px] font-black uppercase tracking-widest text-slate-600 bg-slate-800/80 rounded px-1.5 py-0.5 leading-none">{group.groupLabel[0]}</span>
                </div>
              )
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <button
                  key={item.table}
                  onClick={() => { setActiveTable(item.table); setViewingRecord(null); if (isMobileView) setIsSidebarOpen(false); }}
                  title={item.label}
                  className={`w-full flex items-center rounded-xl transition-all duration-200 group ${
                    isSidebarOpen ? 'px-3 py-2.5 gap-3' : 'h-11 justify-center'
                  } ${
                    activeTable === item.table
                      ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <item.icon className={`h-[18px] w-[18px] shrink-0 ${activeTable !== item.table ? 'group-hover:scale-110 transition-transform' : ''}`} />
                  {isSidebarOpen && (
                    <motion.span
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-[13px] font-bold whitespace-nowrap overflow-hidden text-ellipsis"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </button>
              ))}
            </div>
          </div>
        ));
      })()}

      {/* ADMIN SECTION */}
      {(user?.role === 'admin' || user?.role === 'owner') && (
        <div className="mt-4 pt-4 border-t border-slate-800/40">
          <div className="px-2 mb-1.5 flex justify-center lg:justify-start">
            <span className={`text-[9px] font-black uppercase tracking-[0.2em] text-slate-600 ${!isSidebarOpen && 'hidden lg:block'}`}>Admin</span>
            {!isSidebarOpen && <span className="lg:hidden text-[7px] font-black uppercase tracking-widest text-slate-600 bg-slate-800/80 rounded px-1.5 py-0.5 leading-none">A</span>}
          </div>
          <button
            onClick={() => { setActiveTable('UserManagement'); setViewingRecord(null); if (isMobileView) setIsSidebarOpen(false); }}
            title="User Management"
            className={`w-full flex items-center rounded-xl transition-all duration-200 group ${isSidebarOpen ? 'px-3 py-2.5 gap-3' : 'h-11 justify-center'} ${activeTable === 'UserManagement' ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
          >
            <Users className={`h-[18px] w-[18px] shrink-0 ${activeTable !== 'UserManagement' ? 'group-hover:scale-110 transition-transform' : ''}`} />
            {isSidebarOpen && <motion.span initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="text-[13px] font-bold whitespace-nowrap overflow-hidden text-ellipsis">User Management</motion.span>}
          </button>
        </div>
      )}

    </div>
  </ScrollArea>

  {/* USER PROFILE */}
  <div className={`shrink-0 border-t border-slate-800/60 bg-[#0d0f17] flex items-center transition-all duration-300 ${
    isSidebarOpen ? 'px-4 py-3 gap-3' : 'py-3 justify-center'
  }`}>
    <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white font-black text-sm shrink-0 shadow-lg">
      {user?.name?.[0]?.toUpperCase() || 'G'}
    </div>
    {isSidebarOpen && (
      <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="flex-1 min-w-0">
        <div className="text-[13px] font-black text-white truncate uppercase">{user?.name || 'it_sevarpit'}</div>
        <div className="text-[9px] text-brand-primary font-black uppercase tracking-widest mt-0.5">{user?.role || 'USER'}</div>
      </motion.div>
    )}
    {isSidebarOpen && (
      <button onClick={() => setUser(null)} className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors shrink-0">
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
      className="lg:hidden text-brand-text-muted h-11 w-11"
      onClick={() => setIsSidebarOpen(true)}
    >
      <Menu className="h-6 w-6" />
    </Button>

    {/* Search Input — desktop always visible, mobile toggle */}
    {activeTable !== 'Home' && activeTable !== 'UserManagement' && (
      <>
        {/* Desktop search */}
        <div className="relative hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-500" />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-brand-bg w-[120px] md:w-[180px] pl-8 h-9 text-xs text-black dark:text-white"
          />
        </div>
        {/* Mobile search icon toggle */}
        <button
          className="sm:hidden p-2 rounded-lg text-slate-500 hover:text-brand-primary hover:bg-brand-primary/10 transition-colors"
          onClick={() => setMobileSearchOpen(v => !v)}
        >
          {mobileSearchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
        </button>
      </>
    )}
  </div>

<div className="flex items-center justify-between w-full md:w-auto gap-1.5 md:gap-2">

    {/* 3. VIEW SWITCHER */}
  {activeTable !== 'Home' && activeTable !== 'UserManagement' && <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-300 h-11 items-center">
   <Button
  size="sm"
  variant="ghost"
  onClick={() => setViewMode('visual')}
  className={`h-10 px-3 flex items-center gap-1.5 rounded-lg transition-all ${
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
  className={`h-10 px-3 flex items-center gap-1.5 rounded-lg transition-all ${
    viewMode === 'grid'
      ? 'bg-white text-brand-primary shadow-sm'
      : 'text-slate-400'
  }`}
>
  <Grid className="h-4 w-4" />
  <span className="text-xs font-semibold hidden sm:inline">Grid</span>
</Button>
  </div>}

{activeTable !== 'Home' && activeTable !== 'UserManagement' && (
  <div className="relative hidden sm:block">
    <button
      onClick={() => {
        if (!isAdvancedFilterOpen) setPendingFilter(advancedFilter);
        setIsAdvancedFilterOpen(!isAdvancedFilterOpen);
      }}
      className={`flex items-center gap-2 h-11 px-4 rounded-xl border transition-all ${
        advancedFilter.conditions.length > 0 
          ? 'bg-brand-primary/10 border-brand-primary/50 text-brand-primary shadow-sm'
          : 'bg-white border-slate-300 text-slate-600 hover:border-brand-primary/50 shadow-sm'
      }`}
      title="Advanced Filter"
    >
      <Filter className="h-4 w-4 shrink-0" />
      <span className="text-xs font-bold uppercase tracking-wide hidden sm:inline">
        {advancedFilter.conditions.length > 0 ? 'Filtered' : 'Filter'}
      </span>
      {advancedFilter.conditions.length > 0 && (
        <span className="h-5 w-5 bg-brand-primary text-white rounded-full flex items-center justify-center text-[10px] font-black ml-1 sm:ml-0">
          {advancedFilter.conditions.length}
        </span>
      )}
    </button>
    <AnimatePresence>
      {isAdvancedFilterOpen && !isMobileView && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsAdvancedFilterOpen(false)} />
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute top-full right-0 mt-2 w-[calc(100vw-2rem)] sm:w-[500px] max-w-[500px] bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-y-auto max-h-[80vh] p-4"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Advanced Filter</h3>
              <button onClick={() => setPendingFilter({ id: 'root', type: 'group', logic: 'AND', conditions: [] })} className="text-[10px] font-bold text-red-500 hover:text-red-600 hover:underline uppercase tracking-wider transition-colors">Clear All</button>
            </div>
            <FilterNodeUI 
              node={pendingFilter} 
              onChange={(node) => setPendingFilter(node as FilterGroup)} 
              onDelete={() => setPendingFilter({ id: 'root', type: 'group', logic: 'AND', conditions: [] })} 
              columns={getTableColumns(true)} 
              getOptions={getFilterOptions}
            />
            <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-slate-100">
              <button onClick={() => setIsAdvancedFilterOpen(false)} className="px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
              <button onClick={() => { setAdvancedFilter(pendingFilter); setIsAdvancedFilterOpen(false); }} className="px-4 py-2 text-[11px] font-black uppercase tracking-widest text-white bg-brand-primary hover:bg-brand-primary/90 rounded-lg shadow-md transition-all">Apply</button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  </div>
)}

  {/* 1. GROUP BY + SORT BY */}
  {activeTable !== 'Home' && activeTable !== 'UserManagement' && (viewMode === 'grid' || viewMode === 'visual') && <>
  <div className="relative hidden sm:block">
  <button
    onClick={() => { setIsGroupOpen(!isGroupOpen); setIsSortOpen(false); }}
    className="flex items-center bg-white border border-slate-300 rounded-xl px-4 h-10 shadow-sm hover:border-brand-primary/50 transition-all group min-w-[180px]"
  >
    <Layers className="h-4 w-4 text-slate-500 mr-2 shrink-0" />
    <span className="text-xs font-bold text-slate-800 uppercase tracking-wide truncate mr-6">
      {groupByField ? colLabel(groupByField) : "No Grouping"}
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
            <button key={col} onClick={() => { setGroupByField(col); setIsGroupOpen(false); }} className="w-full text-left px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-brand-primary hover:text-white uppercase transition-colors">{colLabel(col)}</button>
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
      {sortBy ? `By ${colLabel(sortBy.field)}` : "No Sort"}
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
            <button key={col} onClick={() => { setSortBy({ field: col, direction: 'asc' }); setIsSortOpen(false); }} className="w-full text-left px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-brand-primary hover:text-white uppercase transition-colors">{colLabel(col)}</button>
          ))}
        </motion.div>
      </>
    )}
  </AnimatePresence>
</div>
  </>}

  {/* HIDE FIELDS */}
  {activeTable !== 'Home' && activeTable !== 'UserManagement' && viewMode === 'grid' && (
  <div className="relative hidden sm:block">
    <button
      onClick={() => { setIsFieldsOpen(!isFieldsOpen); setIsGroupOpen(false); setIsSortOpen(false); }}
      className={`flex items-center bg-white border rounded-xl px-4 h-10 shadow-sm hover:border-brand-primary/50 transition-all group min-w-[140px] relative ${(hiddenColumns[activeTable]?.length || 0) > 0 ? 'border-brand-primary/50 text-brand-primary' : 'border-slate-300'}`}
    >
      <Eye className="h-4 w-4 mr-2 shrink-0" />
      <span className="text-xs font-bold text-slate-800 uppercase tracking-wide truncate mr-6">
        {(hiddenColumns[activeTable]?.length || 0) > 0 ? `${hiddenColumns[activeTable].length} hidden` : 'Fields'}
      </span>
      <ChevronDown className={`absolute right-3 h-4 w-4 text-slate-400 transition-transform ${isFieldsOpen ? 'rotate-180' : ''}`} />
    </button>
    <AnimatePresence>
      {isFieldsOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsFieldsOpen(false)} />
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute top-full left-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-y-auto max-h-80 py-2"
          >
            <p className="px-4 py-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Toggle visibility</p>
            {getTableColumns(true).map(col => {
              const isHidden = (hiddenColumns[activeTable] || []).includes(col);
              return (
                <button
                  key={col}
                  onClick={() => toggleHideColumn(col)}
                  className="w-full flex items-center justify-between px-4 py-2 hover:bg-slate-50 transition-colors"
                >
                  <span className={`text-[12px] font-semibold truncate ${isHidden ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{colLabel(col)}</span>
                  {isHidden
                    ? <EyeOff className="h-3.5 w-3.5 text-slate-400 shrink-0 ml-2" />
                    : <Eye className="h-3.5 w-3.5 text-brand-primary shrink-0 ml-2" />}
                </button>
              );
            })}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  </div>
  )}

  {/* Mobile Group By + Sort By buttons */}
  {activeTable !== 'Home' && activeTable !== 'UserManagement' && (viewMode === 'grid' || viewMode === 'visual') && (
    <div className="sm:hidden flex flex-wrap items-center gap-1.5">
      <button
        onClick={() => setMobileGroupOpen(true)}
        className={`relative p-2 rounded-lg border bg-white transition-colors ${groupByField ? 'border-brand-primary/50 text-brand-primary' : 'border-slate-200 text-slate-500 hover:text-brand-primary hover:border-brand-primary/30'}`}
        title="Group By"
      >
        <Layers className="h-4 w-4" />
        {groupByField && <span className="absolute -top-1 -right-1 h-2 w-2 bg-brand-primary rounded-full" />}
      </button>
      <button
        onClick={() => setMobileSortOpen(true)}
        className={`relative p-2 rounded-lg border bg-white transition-colors ${sortBy ? 'border-brand-primary/50 text-brand-primary' : 'border-slate-200 text-slate-500 hover:text-brand-primary hover:border-brand-primary/30'}`}
        title="Sort By"
      >
        <ArrowUpDown className="h-4 w-4" />
        {sortBy && <span className="absolute -top-1 -right-1 h-2 w-2 bg-brand-primary rounded-full" />}
      </button>
      <button
        onClick={() => setMobileFieldsOpen(true)}
        className={`relative p-2 rounded-lg border bg-white transition-colors ${(hiddenColumns[activeTable]?.length || 0) > 0 ? 'border-brand-primary/50 text-brand-primary' : 'border-slate-200 text-slate-500 hover:text-brand-primary hover:border-brand-primary/30'}`}
        title="Hide Fields"
      >
        <Eye className="h-4 w-4" />
        {(hiddenColumns[activeTable]?.length || 0) > 0 && <span className="absolute -top-1 -right-1 h-2 w-2 bg-brand-primary rounded-full" />}
      </button>
      <button
        onClick={() => {
          if (!isAdvancedFilterOpen) setPendingFilter(advancedFilter);
          setIsAdvancedFilterOpen(true);
        }}
        className={`relative p-2 rounded-lg border bg-white transition-colors ${advancedFilter.conditions.length > 0 ? 'border-brand-primary/50 text-brand-primary' : 'border-slate-200 text-slate-500 hover:text-brand-primary hover:border-brand-primary/30'}`}
        title="Filter"
      >
        <Filter className="h-4 w-4" />
        {advancedFilter.conditions.length > 0 && <span className="absolute -top-1 -right-1 h-3 min-w-[12px] px-0.5 bg-brand-primary text-white rounded-full flex items-center justify-center text-[8px] font-black">{advancedFilter.conditions.length}</span>}
      </button>

    </div>
  )}

  {/* 4. NEW RECORD BUTTON */}
  {activeTable !== 'Home' && activeTable !== 'UserManagement' && hasPerm(user, activeTable, 'add') && (
  <Button
    onClick={openAddModal}
    className="bg-brand-primary hover:bg-brand-primary/90 text-white h-10 px-4 shadow-md flex items-center gap-2 transition-transform active:scale-95 ml-1"
  >
    <Plus className="h-4 w-4" />
    <span className="hidden md:inline uppercase text-xs font-bold tracking-wide">
      Add Record
    </span>
  </Button>
  )}

  {/* Inbox button — after primary actions */}
  {user && (
    <>
      <div className="w-px h-6 bg-slate-200 mx-0.5 shrink-0" />
      <button
        onClick={() => setInboxOpen(v => !v)}
        className={`relative flex h-10 w-10 items-center justify-center rounded-xl transition-all shrink-0 ${inboxOpen ? 'text-brand-primary bg-brand-primary/10' : 'text-slate-500 hover:text-brand-primary hover:bg-brand-primary/10'}`}
        title="Inbox"
      >
        <Inbox className="h-5 w-5" />
        {inboxUnread > 0 && !inboxOpen && (
          <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] px-0.5 bg-brand-primary text-white text-[9px] font-black rounded-full flex items-center justify-center leading-none">
            {inboxUnread > 9 ? '9+' : inboxUnread}
          </span>
        )}
      </button>
    </>
  )}

</div>
</header>

      {/* Mobile search bar (expands below header when toggled) */}
      {activeTable !== 'Home' && mobileSearchOpen && (
        <div className="sm:hidden px-4 py-2.5 bg-white border-b border-slate-200 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              autoFocus
              placeholder={`Search ${activeTable}…`}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-10 text-[13px] font-medium text-slate-900 placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      )}

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
              {colLabel(groupByField)}
              <X className="h-3 w-3" />
            </button>
          )}
          {sortBy && (
            <button
              onClick={() => setSortBy(null)}
              className="flex items-center gap-1 bg-slate-100 text-slate-700 text-[10px] font-black uppercase px-2 py-1 rounded-lg border border-slate-200 shrink-0"
            >
              <ArrowUpDown className="h-3 w-3" />
              {colLabel(sortBy.field)} {sortBy.direction === 'asc' ? '↑' : '↓'}
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      )}

      {/* GROUP BY bottom sheet */}
      {mobileGroupOpen && (
        <div className="fixed inset-0 z-[600] flex items-end" style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)' }} onClick={() => setMobileGroupOpen(false)}>
          <div className="w-full bg-white rounded-t-3xl shadow-2xl flex flex-col" onClick={e => e.stopPropagation()} style={{ maxHeight: '80vh' }}>
            <div className="flex justify-center pt-3 pb-1 shrink-0"><div className="w-10 h-1 bg-slate-200 rounded-full" /></div>
            <div className="px-5 pt-2 pb-3 flex items-center justify-between border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 bg-brand-primary/10 rounded-lg flex items-center justify-center text-brand-primary">
                  <Layers className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-[15px] font-black text-slate-900 tracking-tight">Group By</h2>
                  <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">{activeTable}</p>
                </div>
              </div>
              <button onClick={() => setMobileGroupOpen(false)} className="h-9 w-9 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors">
                <X className="h-4 w-4 text-slate-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4 space-y-2">
              <button
                onClick={() => setGroupByField(null)}
                className={`w-full h-11 rounded-xl text-[12px] font-black uppercase tracking-wide border transition-all flex items-center px-4 gap-3 ${!groupByField ? 'bg-brand-primary text-white border-brand-primary shadow-md shadow-brand-primary/20' : 'bg-slate-50 text-slate-600 border-slate-200'}`}
              >
                <span className={`h-4 w-4 rounded-full border-2 shrink-0 flex items-center justify-center ${!groupByField ? 'border-white bg-white' : 'border-slate-300'}`}>
                  {!groupByField && <span className="h-2 w-2 rounded-full bg-brand-primary block" />}
                </span>
                None
              </button>
              {getTableColumns().map(col => (
                <button key={col} onClick={() => setGroupByField(col)}
                  className={`w-full h-11 rounded-xl text-[12px] font-black uppercase tracking-wide border transition-all flex items-center px-4 gap-3 ${groupByField === col ? 'bg-brand-primary text-white border-brand-primary shadow-md shadow-brand-primary/20' : 'bg-slate-50 text-slate-600 border-slate-200'}`}
                >
                  <span className={`h-4 w-4 rounded-full border-2 shrink-0 flex items-center justify-center ${groupByField === col ? 'border-white bg-white' : 'border-slate-300'}`}>
                    {groupByField === col && <span className="h-2 w-2 rounded-full bg-brand-primary block" />}
                  </span>
                  <span className="truncate">{colLabel(col)}</span>
                </button>
              ))}
            </div>
            <div className="px-5 py-4 border-t border-slate-100 shrink-0" style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}>
              <button onClick={() => setMobileGroupOpen(false)} className="w-full py-3.5 bg-brand-primary text-white rounded-2xl text-[13px] font-black uppercase tracking-widest shadow-lg shadow-brand-primary/25 active:scale-95 transition-all">Apply</button>
            </div>
          </div>
        </div>
      )}

      {/* SORT BY bottom sheet */}
      {mobileSortOpen && (
        <div className="fixed inset-0 z-[600] flex items-end" style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)' }} onClick={() => setMobileSortOpen(false)}>
          <div className="w-full bg-white rounded-t-3xl shadow-2xl flex flex-col" onClick={e => e.stopPropagation()} style={{ maxHeight: '80vh' }}>
            <div className="flex justify-center pt-3 pb-1 shrink-0"><div className="w-10 h-1 bg-slate-200 rounded-full" /></div>
            <div className="px-5 pt-2 pb-3 flex items-center justify-between border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600">
                  <ArrowUpDown className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-[15px] font-black text-slate-900 tracking-tight">Sort By</h2>
                  <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">{activeTable}</p>
                </div>
              </div>
              <button onClick={() => setMobileSortOpen(false)} className="h-9 w-9 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors">
                <X className="h-4 w-4 text-slate-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4 space-y-2">
              <button
                onClick={() => setSortBy(null)}
                className={`w-full h-11 rounded-xl text-[12px] font-black uppercase tracking-wide border transition-all flex items-center px-4 gap-3 ${!sortBy ? 'bg-slate-800 text-white border-slate-800 shadow-md' : 'bg-slate-50 text-slate-600 border-slate-200'}`}
              >
                <span className={`h-4 w-4 rounded-full border-2 shrink-0 flex items-center justify-center ${!sortBy ? 'border-white bg-white' : 'border-slate-300'}`}>
                  {!sortBy && <span className="h-2 w-2 rounded-full bg-slate-800 block" />}
                </span>
                None
              </button>
              {getTableColumns().map(col => (
                <button key={col}
                  onClick={() => setSortBy(s => s?.field === col ? { field: col, direction: s.direction === 'asc' ? 'desc' : 'asc' } : { field: col, direction: 'asc' })}
                  className={`w-full h-11 rounded-xl text-[12px] font-black uppercase tracking-wide border transition-all flex items-center justify-between px-4 gap-3 ${sortBy?.field === col ? 'bg-slate-800 text-white border-slate-800 shadow-md' : 'bg-slate-50 text-slate-600 border-slate-200'}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`h-4 w-4 rounded-full border-2 shrink-0 flex items-center justify-center ${sortBy?.field === col ? 'border-white bg-white' : 'border-slate-300'}`}>
                      {sortBy?.field === col && <span className="h-2 w-2 rounded-full bg-slate-800 block" />}
                    </span>
                    <span className="truncate">{colLabel(col)}</span>
                  </div>
                  {sortBy?.field === col && (
                    <span className="shrink-0 text-[11px] font-black opacity-80">{sortBy.direction === 'asc' ? '↑ ASC' : '↓ DESC'}</span>
                  )}
                </button>
              ))}
            </div>
            <div className="px-5 py-4 border-t border-slate-100 shrink-0" style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}>
              <button onClick={() => setMobileSortOpen(false)} className="w-full py-3.5 bg-slate-800 text-white rounded-2xl text-[13px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all">Apply</button>
            </div>
          </div>
        </div>
      )}

      {/* HIDE FIELDS bottom sheet */}
      {mobileFieldsOpen && (
        <div className="fixed inset-0 z-[600] flex items-end" style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)' }} onClick={() => setMobileFieldsOpen(false)}>
          <div className="w-full bg-white rounded-t-3xl shadow-2xl flex flex-col" onClick={e => e.stopPropagation()} style={{ maxHeight: '80vh' }}>
            <div className="flex justify-center pt-3 pb-1 shrink-0"><div className="w-10 h-1 bg-slate-200 rounded-full" /></div>
            <div className="px-5 pt-2 pb-3 flex items-center justify-between border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 bg-brand-primary/10 rounded-lg flex items-center justify-center text-brand-primary">
                  <Eye className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-[15px] font-black text-slate-900 tracking-tight">Hide Fields</h2>
                  <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">{activeTable}</p>
                </div>
              </div>
              <button onClick={() => setMobileFieldsOpen(false)} className="h-9 w-9 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors">
                <X className="h-4 w-4 text-slate-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4 space-y-2">
              {getTableColumns(true).map(col => {
                const isHidden = (hiddenColumns[activeTable] || []).includes(col);
                return (
                  <button
                    key={col}
                    onClick={() => toggleHideColumn(col)}
                    className={`w-full h-11 rounded-xl text-[12px] font-black uppercase tracking-wide border transition-all flex items-center justify-between px-4 gap-3 ${isHidden ? 'bg-slate-50 text-slate-400 border-slate-200' : 'bg-white text-slate-700 border-slate-200'}`}
                  >
                    <span className="truncate">{colLabel(col)}</span>
                    {isHidden
                      ? <EyeOff className="h-4 w-4 text-slate-300 shrink-0" />
                      : <Eye className="h-4 w-4 text-brand-primary shrink-0" />}
                  </button>
                );
              })}
            </div>
            <div className="px-5 py-4 border-t border-slate-100 shrink-0" style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}>
              <button onClick={() => setMobileFieldsOpen(false)} className="w-full py-3.5 bg-brand-primary text-white rounded-2xl text-[13px] font-black uppercase tracking-widest shadow-lg shadow-brand-primary/25 active:scale-95 transition-all">Done</button>
            </div>
          </div>
        </div>
      )}

      {/* FILTER bottom sheet */}
      {isAdvancedFilterOpen && isMobileView && (
        <div className="fixed inset-0 z-[600] flex items-end" style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)' }} onClick={() => setIsAdvancedFilterOpen(false)}>
          <div className="w-full bg-white rounded-t-3xl shadow-2xl flex flex-col" onClick={e => e.stopPropagation()} style={{ maxHeight: '90vh' }}>
            <div className="flex justify-center pt-3 pb-1 shrink-0"><div className="w-10 h-1 bg-slate-200 rounded-full" /></div>
            <div className="px-5 pt-2 pb-3 flex items-center justify-between border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 bg-brand-primary/10 rounded-lg flex items-center justify-center text-brand-primary">
                  <Filter className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-[15px] font-black text-slate-900 tracking-tight">Filter</h2>
                  <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">{activeTable}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setPendingFilter({ id: 'root', type: 'group', logic: 'AND', conditions: [] })} className="text-[10px] font-bold text-red-500 hover:bg-red-50 px-2 py-1 rounded-lg uppercase tracking-wider transition-colors">Clear All</button>
                <button onClick={() => setIsAdvancedFilterOpen(false)} className="h-9 w-9 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors">
                  <X className="h-4 w-4 text-slate-500" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4 space-y-4">
              <FilterNodeUI 
                node={pendingFilter} 
                onChange={(node) => setPendingFilter(node as FilterGroup)} 
                onDelete={() => setPendingFilter({ id: 'root', type: 'group', logic: 'AND', conditions: [] })} 
                columns={getTableColumns(true)} 
                getOptions={getFilterOptions}
              />
            </div>
            <div className="px-5 py-4 border-t border-slate-100 shrink-0" style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}>
              <button onClick={() => { setAdvancedFilter(pendingFilter); setIsAdvancedFilterOpen(false); }} className="w-full py-3.5 bg-brand-primary text-white rounded-2xl text-[13px] font-black uppercase tracking-widest shadow-lg shadow-brand-primary/25 active:scale-95 transition-all">Apply Filter</button>
            </div>
          </div>
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
    const recentTasks = [...checklist].slice(0, 6);
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
            <p className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-500">{greeting}</p>
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
            { label: 'Total Events', table: 'Events', value: events.length, sub: 'across all years', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
            { label: 'Sessions', table: 'Session', value: sessions.length, sub: 'recorded', color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-100' },
            { label: 'Music Plays', table: 'MusicLog', value: musicLogs.length, sub: 'log entries', color: 'text-pink-600', bg: 'bg-pink-50', border: 'border-pink-100' },
            { label: 'Video Plays', table: 'VideoLog', value: videoLogs.length, sub: 'log entries', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100' },
          ].filter(s => hasPerm(user, s.table, 'view')).map(s => (
            <div key={s.label} className={`${s.bg} border ${s.border} rounded-2xl p-4`}>
              <div className={`text-3xl font-black ${s.color} leading-none`}>{s.value}</div>
              <div className="text-[11px] font-black text-slate-700 mt-1 uppercase tracking-wide">{s.label}</div>
<div className="text-[11px] text-slate-500 mt-0.5">{s.sub}</div> 
            </div>
          ))}
        </div>

        {/* MAIN GRID: NAV + CHECKLIST */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className={`${hasPerm(user, 'DyatraChecklist', 'view') ? 'lg:col-span-2' : 'lg:col-span-3'} bg-white border border-slate-200 rounded-2xl p-5 shadow-sm`}>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Quick Navigate</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {navLinks.filter(n => hasPerm(user, n.table, 'view')).map(n => (
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

          {hasPerm(user, 'DyatraChecklist', 'view') && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Recent Tasks</p>
              <button onClick={() => setActiveTable('DyatraChecklist')} className="text-[10px] font-black text-brand-primary uppercase tracking-widest hover:underline">View All</button>
            </div>
            {recentTasks.length === 0
              ? <div className="flex-1 flex items-center justify-center text-slate-300 text-xs font-bold uppercase">No tasks yet</div>
              : <div className="space-y-2 flex-1">
                  {recentTasks.map((c: any, i: number) => {
                    const isDone = c.done === true || c.done === 'Yes';
                    return (
                      <div key={i} className="flex items-start gap-2 p-2 rounded-lg hover:bg-slate-50">
                        <button
                          onClick={() => handleToggleChecklist(c)}
                          className={`h-4 w-4 rounded border-2 mt-0.5 shrink-0 flex items-center justify-center transition-colors ${
                            isDone ? 'bg-green-500 border-green-500' : 'border-slate-300 hover:border-brand-primary'
                          }`}
                        >
                          {isDone && <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 10 10" fill="none"><path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                        </button>
                        <div>
                          <div className={`text-[12px] font-semibold leading-tight ${isDone ? 'line-through text-slate-400' : 'text-slate-800'}`}>{c["Task"] || '—'}</div>
                          {c["TaskGroup"] && <div className="text-[10px] text-slate-400 uppercase">{c["TaskGroup"]}</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
            }
          </div>
          )}
        </div>

        {/* BOTTOM GRID: RECENT EVENTS + SESSIONS */}
        {(hasPerm(user, 'Events', 'view') || hasPerm(user, 'Session', 'view')) && (
        <div className={`grid grid-cols-1 ${hasPerm(user, 'Events', 'view') && hasPerm(user, 'Session', 'view') ? 'lg:grid-cols-2' : ''} gap-4`}>
          {hasPerm(user, 'Events', 'view') && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Recent Events</p>
              <button onClick={() => setActiveTable('Events')} className="text-[10px] font-black text-brand-primary uppercase tracking-widest hover:underline">View All</button>
            </div>
            <div className="space-y-1">
              {recentEvents.length === 0 && <div className="text-slate-300 text-xs font-bold uppercase py-6 text-center">No events yet</div>}
              {recentEvents.map((ev: any, i: number) => (
                <div key={i} onClick={() => { setActiveTable('Events'); setViewingRecord(ev); }} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 cursor-pointer">
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
          )}

          {hasPerm(user, 'Session', 'view') && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Recent Sessions</p>
              <button onClick={() => setActiveTable('Session')} className="text-[10px] font-black text-brand-primary uppercase tracking-widest hover:underline">View All</button>
            </div>
            <div className="space-y-1">
              {recentSessions.length === 0 && <div className="text-slate-300 text-xs font-bold uppercase py-6 text-center">No sessions yet</div>}
              {recentSessions.map((s: any, i: number) => (
                <div key={i} onClick={() => { setActiveTable('Session'); setViewingRecord(s); }} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 cursor-pointer">
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
          )}
        </div>
        )}

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
                musicLogs={musicLogs}
                onSessionClick={(s) => setLinkedSession(s)}
                onEdit={hasPerm(user, activeTable, 'edit') ? () => setExpandedRecord(viewingRecord) : undefined}
                onDelete={hasPerm(user, activeTable, 'delete') ? () => { handleDeleteRecord(viewingRecord); setViewingRecord(null); } : undefined}
                getPrimaryField={getPrimaryField}
                setLinkedRecordPopup={setLinkedRecordPopup}
              />
            ) : activeTable === 'UserManagement' ? (
              ['admin', 'owner'].includes(user?.role) ? <UserManagement currentUser={user} onToast={showToast} /> : null
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
  {activeTable !== 'UserManagement' && (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={exportToCSV}
      className="h-8 px-3 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 flex items-center gap-2 transition-all active:scale-95"
    >
      <FileText className="h-3.5 w-3.5 text-slate-400" />
      <span className="text-[10px] font-black uppercase tracking-widest">Export CSV</span>
    </Button>
  )}

  

 
  
 
</div>
                </div>

                {viewMode === 'visual' ? (
                  activeTable === 'Events' ? (
  /* --- RESPONSIVE EVENTS GALLERY (Airtable Style) --- */
  (() => {
    const renderEventCard = (item: any) => (
      <motion.div
        key={item.id || item._id}
        onClick={() => setViewingRecord(item)}
        whileHover={{ y: -4 }}
        className="bg-white border border-slate-200 rounded-[16px] sm:rounded-[20px] p-3 sm:p-5 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col sm:min-h-[280px] overflow-hidden"
      >
        <div className="text-[13px] sm:text-base font-black text-slate-900 mb-2 sm:mb-5 leading-tight">
          {item["Event Name"] || item.EventName || "Untitled Event"}
        </div>
        <div className="space-y-2 sm:space-y-4 flex-1">
          <div className="space-y-0.5">
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">{colLabel('DateFrom')}</label>
            <div className="text-[11px] sm:text-[13px] font-bold text-slate-800">{item.DateFrom || "—"}</div>
          </div>
          <div className="space-y-0.5">
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">{colLabel('DateTo')}</label>
            <div className="text-[11px] sm:text-[13px] font-bold text-slate-800">{item.DateTo || "—"}</div>
          </div>
          {(item.Sessions || item["Imported table"]) && (
            <div className="space-y-0.5">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Sessions</label>
              <div className="flex flex-wrap gap-1.5 overflow-hidden">
                {String(item.Sessions || item["Imported table"]).split(',').map((tag: string, idx: number) => {
                  const sName = tag.trim();
                  const linked = sessions.find((s: any) => s["Session Name"] === sName);
                  return (
                    <span key={idx} className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-sm border ${linked ? 'bg-brand-primary/10 text-brand-primary border-brand-primary/30 hover:bg-brand-primary/20 cursor-pointer' : 'bg-slate-100 text-slate-700 border-slate-300 cursor-default'}`} onClick={(e) => { e.stopPropagation(); if (linked) setLinkedSession(linked); }} style={{maxWidth:'100%',whiteSpace:'normal',wordBreak:'break-word'}}>
                      {sName}{linked && <ArrowUpRight className="h-3 w-3 shrink-0 opacity-60" />}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
          {item.Occasion && (
            <div className="space-y-0.5">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Occasion</label>
              <div className="flex flex-wrap gap-1 overflow-hidden">
                {String(item.Occasion).split(',').map((t: string, i: number) => (
                  <span key={i} className={getTagStyle(t.trim())} style={{maxWidth:'100%',whiteSpace:'normal',wordBreak:'break-word',display:'inline-block'}}>{t.trim()}</span>
                ))}
              </div>
            </div>
          )}
          {item.Venue && (<div className="hidden sm:block space-y-0.5"><label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Venue</label><div className="text-[11px] font-semibold text-slate-600 truncate">{item.Venue}</div></div>)}
          {item.City && (<div className="block sm:hidden text-[11px] font-semibold text-slate-500 truncate mt-1"><MapPin className="h-3 w-3 inline mr-1 opacity-50" />{item.City}</div>)}
        </div>
      </motion.div>
    );

    if (groupByField) {
      const grouped: Record<string, any[]> = {};
      sortedVisualData.forEach((item: any) => {
        const raw = String(item[groupByField] || '');
        const keys = raw.split(',').map((s: string) => s.trim()).filter(Boolean);
        (keys.length > 0 ? keys : ['—']).forEach(k => { if (!grouped[k]) grouped[k] = []; grouped[k].push(item); });
      });
      return (
        <div className="max-w-6xl mx-auto md:ml-4 py-4 md:py-8 relative">
          <div className="absolute left-[15px] md:left-[19px] top-0 bottom-0 w-0.5 bg-slate-800/40" />
          <div className="space-y-8 md:space-y-12">
            {sortedVisualData.length === 0 && <div className="pl-12"><EmptyState searchQuery={searchQuery} onClearSearch={() => setSearchQuery('')} onAddFirst={openAddModal} /></div>}
            {Object.entries(grouped).map(([groupValue, groupItems], groupIdx) => (
              <motion.div key={groupValue} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="relative flex items-start gap-4 md:gap-8">
                <div className="relative z-10 flex items-center justify-center mt-5 md:mt-6">
                  <div className="h-8 w-8 md:h-10 md:w-10 rounded-full border border-slate-700 bg-brand-bg flex items-center justify-center shrink-0">
                    <div className={`h-2 w-2 md:h-2.5 md:w-2.5 rounded-full ${groupIdx === 0 ? 'bg-brand-primary animate-pulse' : 'bg-brand-primary/40'}`} />
                  </div>
                </div>
                <div className="flex-1 mt-3 md:mt-4">
                  <h3 className="text-xl md:text-3xl font-black text-brand-primary uppercase tracking-tight mb-4 md:mb-6">{groupValue}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                    {groupItems.map((item: any) => renderEventCard(item))}
                  </div>
                </div>
              </motion.div>
            ))}
            {filteredData.length > 0 && !searchQuery && hasPerm(user, activeTable, 'add') && <motion.div onClick={openAddModal} className="ml-12 md:ml-16 border-2 border-dashed border-slate-200 rounded-[16px] sm:rounded-[20px] flex flex-col items-center justify-center p-4 sm:p-8 text-slate-400 cursor-pointer hover:text-brand-primary hover:border-brand-primary/50 transition-all bg-white/50 min-h-[180px] sm:min-h-[300px]"><Plus className="h-6 w-6 sm:h-8 sm:w-8 mb-1 sm:mb-2" /><span className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest">New Event</span></motion.div>}
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6 py-4 sm:py-6">
        {sortedVisualData.length === 0 && <EmptyState searchQuery={searchQuery} onClearSearch={() => setSearchQuery('')} onAddFirst={openAddModal} />}
        {sortedVisualData.map((item: any) => renderEventCard(item))}
        {filteredData.length > 0 && !searchQuery && hasPerm(user, activeTable, 'add') && <motion.div onClick={openAddModal} className="border-2 border-dashed border-slate-200 rounded-[16px] sm:rounded-[20px] flex flex-col items-center justify-center p-4 sm:p-8 text-slate-400 cursor-pointer hover:text-brand-primary hover:border-brand-primary/50 transition-all bg-white/50 min-h-[180px] sm:min-h-[300px]"><Plus className="h-6 w-6 sm:h-8 sm:w-8 mb-1 sm:mb-2" /><span className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest">New Event</span></motion.div>}
      </div>
    );
  })()
) : activeTable === 'Tracks' ? (
  /* --- TRACKS GALLERY VIEW (Airtable Style) --- */
  (() => {
    const renderTrackCard = (item: any) => (
      <motion.div
        key={item.id || item._id}
        onClick={() => setViewingRecord(item)}
        whileHover={{ y: -2 }}
        className="bg-white border border-slate-200 rounded-xl p-3 sm:p-5 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col min-h-[150px] sm:min-h-[220px] overflow-hidden"
      >
        <div className="text-[12px] sm:text-[14px] font-bold text-slate-900 mb-2 sm:mb-5 leading-tight border-b border-slate-50 pb-1 sm:pb-2">
          {item["Title"] || item.title || "Unknown Track"}
        </div>
        <div className="space-y-2 sm:space-y-4 flex-1">
          <div className="space-y-0.5">
            <label className="text-[9px] font-medium text-slate-400 uppercase tracking-tight block">Artist</label>
            <div className="text-[11px] sm:text-[12px] font-semibold text-slate-700 truncate">{item["Artist"] || item.artist || "—"}</div>
          </div>
          <div className="hidden sm:block space-y-0.5">
            <label className="text-[9px] font-medium text-slate-400 uppercase tracking-tight block">Album</label>
            <div className="text-[11px] font-semibold text-slate-500 truncate">{item["Album"] || item.album || "—"}</div>
          </div>
          <div className="space-y-0.5">
            <label className="text-[9px] font-medium text-slate-400 uppercase tracking-tight block">Duration</label>
            <div className="text-[11px] font-semibold text-slate-500 font-mono">{item["Duration"] || item.duration || "—"}</div>
          </div>
        </div>
      </motion.div>
    );

    if (groupByField) {
      const grouped: Record<string, any[]> = {};
      sortedVisualData.forEach((item: any) => {
        const raw = String(item[groupByField] || '');
        const keys = raw.split(',').map((s: string) => s.trim()).filter(Boolean);
        (keys.length > 0 ? keys : ['—']).forEach(k => { if (!grouped[k]) grouped[k] = []; grouped[k].push(item); });
      });
      return (
        <div className="max-w-6xl mx-auto md:ml-4 py-4 md:py-8 relative">
          <div className="absolute left-[15px] md:left-[19px] top-0 bottom-0 w-0.5 bg-slate-800/40" />
          <div className="space-y-8 md:space-y-12">
            {sortedVisualData.length === 0 && <div className="pl-12"><EmptyState searchQuery={searchQuery} onClearSearch={() => setSearchQuery('')} onAddFirst={openAddModal} /></div>}
            {Object.entries(grouped).map(([groupValue, groupItems], groupIdx) => (
              <motion.div key={groupValue} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="relative flex items-start gap-4 md:gap-8">
                <div className="relative z-10 flex items-center justify-center mt-5 md:mt-6">
                  <div className="h-8 w-8 md:h-10 md:w-10 rounded-full border border-slate-700 bg-brand-bg flex items-center justify-center shrink-0">
                    <div className={`h-2 w-2 md:h-2.5 md:w-2.5 rounded-full ${groupIdx === 0 ? 'bg-brand-primary animate-pulse' : 'bg-brand-primary/40'}`} />
                  </div>
                </div>
                <div className="flex-1 mt-3 md:mt-4">
                  <h3 className="text-xl md:text-3xl font-black text-brand-primary uppercase tracking-tight mb-4 md:mb-6">{groupValue}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                    {groupItems.map((item: any) => renderTrackCard(item))}
                  </div>
                </div>
              </motion.div>
            ))}
            {filteredData.length > 0 && !searchQuery && hasPerm(user, activeTable, 'add') && <motion.div onClick={openAddModal} className="ml-12 md:ml-16 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center p-4 sm:p-8 text-slate-400 cursor-pointer hover:text-brand-primary hover:border-brand-primary/50 transition-all bg-white/50 min-h-[150px]"><Plus className="h-5 w-5 sm:h-6 sm:w-6 mb-1 sm:mb-2" /><span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest">Add track</span></motion.div>}
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 py-4 sm:py-6">
        {sortedVisualData.length === 0 && <EmptyState searchQuery={searchQuery} onClearSearch={() => setSearchQuery('')} onAddFirst={openAddModal} />}
        {sortedVisualData.map((item: any) => renderTrackCard(item))}
        {filteredData.length > 0 && !searchQuery && hasPerm(user, activeTable, 'add') && <motion.div onClick={openAddModal} className="border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center p-4 sm:p-8 text-slate-400 cursor-pointer hover:text-brand-primary hover:border-brand-primary/50 transition-all bg-white/50 min-h-[150px] sm:min-h-[220px]"><Plus className="h-5 w-5 sm:h-6 sm:w-6 mb-1 sm:mb-2" /><span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest">Add track</span></motion.div>}
      </div>
    );
  })()
) : activeTable === 'DataSharing' ? (
  /* --- DATA SHARING GALLERY VIEW (Airtable Style) --- */
  (() => {
    const renderDataCard = (item: any) => (
      <motion.div
        key={item.id || item._id}
        onClick={() => setViewingRecord(item)}
        whileHover={{ y: -2 }}
        className="bg-white border border-slate-200 rounded-xl p-3 sm:p-5 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col min-h-[160px] sm:min-h-[240px] overflow-hidden"
      >
        <div className="text-[13px] sm:text-[15px] font-bold text-slate-900 mb-2 sm:mb-4">{item["Sevak"] || "Unknown Sevak"}</div>
        <div className="space-y-2 sm:space-y-4 flex-1">
          <div className="space-y-0.5 overflow-hidden">
            <label className="text-[9px] font-medium text-slate-400 uppercase tracking-tight block">Dept</label>
            {item["Dept"] ? <span className={getTagStyle(item["Dept"])} style={{maxWidth:'100%',whiteSpace:'normal',wordBreak:'break-word',display:'inline-block'}}>{item["Dept"]}</span> : <span className="text-slate-300 italic text-[10px]">—</span>}
          </div>
          <div className="space-y-0.5 hidden sm:block">
            <label className="text-[9px] font-medium text-slate-400 uppercase tracking-tight block">Email</label>
            <div className="text-[11px] font-medium text-slate-600 truncate">{item["EmailId"] || "—"}</div>
          </div>
          <div className="space-y-0.5">
            <label className="text-[9px] font-medium text-slate-400 uppercase tracking-tight block">Sharing Facts</label>
            <div className="pt-0.5">{item["ShareFacts?"] === 'Yes' ? <span className={getTagStyle('Yes')}>Yes</span> : <span className="text-slate-300 italic text-[10px]">No</span>}</div>
          </div>
        </div>
      </motion.div>
    );

    if (groupByField) {
      const grouped: Record<string, any[]> = {};
      sortedVisualData.forEach((item: any) => {
        const raw = String(item[groupByField] || '');
        const keys = raw.split(',').map((s: string) => s.trim()).filter(Boolean);
        (keys.length > 0 ? keys : ['—']).forEach(k => { if (!grouped[k]) grouped[k] = []; grouped[k].push(item); });
      });
      return (
        <div className="max-w-6xl mx-auto md:ml-4 py-4 md:py-8 relative">
          <div className="absolute left-[15px] md:left-[19px] top-0 bottom-0 w-0.5 bg-slate-800/40" />
          <div className="space-y-8 md:space-y-12">
            {sortedVisualData.length === 0 && <div className="pl-12"><EmptyState searchQuery={searchQuery} onClearSearch={() => setSearchQuery('')} onAddFirst={openAddModal} /></div>}
            {Object.entries(grouped).map(([groupValue, groupItems], groupIdx) => (
              <motion.div key={groupValue} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="relative flex items-start gap-4 md:gap-8">
                <div className="relative z-10 flex items-center justify-center mt-5 md:mt-6">
                  <div className="h-8 w-8 md:h-10 md:w-10 rounded-full border border-slate-700 bg-brand-bg flex items-center justify-center shrink-0">
                    <div className={`h-2 w-2 md:h-2.5 md:w-2.5 rounded-full ${groupIdx === 0 ? 'bg-brand-primary animate-pulse' : 'bg-brand-primary/40'}`} />
                  </div>
                </div>
                <div className="flex-1 mt-3 md:mt-4">
                  <h3 className="text-xl md:text-3xl font-black text-brand-primary uppercase tracking-tight mb-4 md:mb-6">{groupValue}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                    {groupItems.map((item: any) => renderDataCard(item))}
                  </div>
                </div>
              </motion.div>
            ))}
            {filteredData.length > 0 && !searchQuery && hasPerm(user, activeTable, 'add') && <motion.div onClick={openAddModal} className="ml-12 md:ml-16 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center p-4 sm:p-8 text-slate-400 cursor-pointer hover:text-brand-primary hover:border-brand-primary/50 transition-all bg-white/50 min-h-[120px]"><Plus className="h-5 w-5 sm:h-6 sm:w-6 mb-1 sm:mb-2" /><span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest">Add record</span></motion.div>}
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 py-4 sm:py-6">
        {sortedVisualData.length === 0 && <EmptyState searchQuery={searchQuery} onClearSearch={() => setSearchQuery('')} onAddFirst={openAddModal} />}
        {sortedVisualData.map((item: any) => renderDataCard(item))}
        {filteredData.length > 0 && !searchQuery && hasPerm(user, activeTable, 'add') && <motion.div onClick={openAddModal} className="border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center p-4 sm:p-8 text-slate-400 cursor-pointer hover:text-brand-primary hover:border-brand-primary/50 transition-all bg-white/50 min-h-[160px] sm:min-h-[240px]"><Plus className="h-5 w-5 sm:h-6 sm:w-6 mb-1 sm:mb-2" /><span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest">Add record</span></motion.div>}
      </div>
    );
  })()
) : activeTable === 'Guidance & Learning' ? (
  /* --- GUIDANCE & LEARNING GALLERY VIEW --- */
  (() => {
    const renderGuidanceCard = (item: any) => {
      const attachmentString = item["Attachments"] || "";
      const match = attachmentString.match(/\((https?:\/\/[^)]+|data:image\/[^;]+;base64,[^)]+)\)/);
      const imageUrl = match ? match[1] : null;
      return (
        <motion.div key={item.id || item._id} onClick={() => setViewingRecord(item)} whileHover={{ y: -2 }} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col min-h-[240px] sm:min-h-[380px]">
          <div className="h-28 sm:h-48 w-full bg-slate-50 border-b border-slate-100 flex items-center justify-center overflow-hidden">
            {imageUrl ? <img src={imageUrl} loading="lazy" decoding="async" className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" alt="Attachment" /> : <div className="flex flex-col items-center gap-2 opacity-20"><Monitor className="h-12 w-12 text-slate-400" /></div>}
          </div>
          <div className="p-5 flex-1 flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[10px] font-bold text-brand-primary bg-brand-primary/8 border border-brand-primary/15 px-2 py-0.5 rounded">{item["LearningId"] || "—"}</span>
              {item["Category"] && <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded truncate max-w-[120px]">{item["Category"]}</span>}
            </div>
            <div className="flex-1"><p className="text-[13px] text-slate-800 font-medium leading-relaxed">{item["Guidance/Learning"] || <span className="text-slate-300 italic">No content</span>}</p></div>
            {item["GuidanceFrom"] && <div className="flex items-center gap-1.5 pt-1 border-t border-slate-100"><span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Guidance From</span><span className="text-[11px] font-semibold text-slate-600 truncate">{item["GuidanceFrom"]}</span></div>}
            {item["Event"] && <div className="space-y-1 mt-1"><span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Event</span><div className="flex flex-wrap gap-1.5">{String(item["Event"]).split(',').map((eName: string, idx: number) => <span key={idx} className={`${getTagStyle(eName.trim())} !text-[10px]`} style={{maxWidth:'100%',whiteSpace:'normal',wordBreak:'break-word',display:'inline-block'}}>{eName.trim()}</span>)}</div></div>}
          </div>
        </motion.div>
      );
    };

    if (groupByField) {
      const grouped: Record<string, any[]> = {};
      sortedVisualData.forEach((item: any) => {
        const raw = String(item[groupByField] || '');
        const keys = raw.split(',').map((s: string) => s.trim()).filter(Boolean);
        (keys.length > 0 ? keys : ['—']).forEach(k => { if (!grouped[k]) grouped[k] = []; grouped[k].push(item); });
      });
      return (
        <div className="max-w-6xl mx-auto md:ml-4 py-4 md:py-8 relative">
          <div className="absolute left-[15px] md:left-[19px] top-0 bottom-0 w-0.5 bg-slate-800/40" />
          <div className="space-y-8 md:space-y-12">
            {sortedVisualData.length === 0 && <div className="pl-12"><EmptyState searchQuery={searchQuery} onClearSearch={() => setSearchQuery('')} onAddFirst={openAddModal} /></div>}
            {Object.entries(grouped).map(([groupValue, groupItems], groupIdx) => (
              <motion.div key={groupValue} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="relative flex items-start gap-4 md:gap-8">
                <div className="relative z-10 flex items-center justify-center mt-5 md:mt-6">
                  <div className="h-8 w-8 md:h-10 md:w-10 rounded-full border border-slate-700 bg-brand-bg flex items-center justify-center shrink-0">
                    <div className={`h-2 w-2 md:h-2.5 md:w-2.5 rounded-full ${groupIdx === 0 ? 'bg-brand-primary animate-pulse' : 'bg-brand-primary/40'}`} />
                  </div>
                </div>
                <div className="flex-1 mt-3 md:mt-4">
                  <h3 className="text-xl md:text-3xl font-black text-brand-primary uppercase tracking-tight mb-4 md:mb-6">{groupValue}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                    {groupItems.map((item: any) => renderGuidanceCard(item))}
                  </div>
                </div>
              </motion.div>
            ))}
            {filteredData.length > 0 && !searchQuery && hasPerm(user, activeTable, 'add') && <motion.div onClick={openAddModal} className="ml-12 md:ml-16 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center p-8 text-slate-400 cursor-pointer hover:text-brand-primary hover:border-brand-primary/50 transition-all bg-white/50 min-h-[120px]"><Plus className="h-6 w-6 mb-2" /><span className="text-[10px] font-black uppercase tracking-widest">Add Guidance & Learning</span></motion.div>}
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 py-4 sm:py-6">
        {sortedVisualData.length === 0 && <EmptyState searchQuery={searchQuery} onClearSearch={() => setSearchQuery('')} onAddFirst={openAddModal} />}
        {sortedVisualData.map((item: any) => renderGuidanceCard(item))}
        {filteredData.length > 0 && !searchQuery && hasPerm(user, activeTable, 'add') && <motion.div onClick={openAddModal} className="border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center p-8 text-slate-400 cursor-pointer hover:text-brand-primary hover:border-brand-primary/50 transition-all bg-white/50 min-h-[240px] sm:min-h-[380px]"><Plus className="h-6 w-6 mb-2" /><span className="text-[10px] font-black uppercase tracking-widest">Add Guidance & Learning</span></motion.div>}
      </div>
    );
  })()
) :
                  activeTable === 'Session' ? (
                  /* --- SESSION CARD VIEW --- */
                  (() => {
                    const expandedData = filteredData.flatMap((item: any) => {
                      const parentsList = String(item["Parent Event"] || "").split(',').map(s => s.trim()).filter(Boolean);
                      const datesList = String(item["Date"] || "").split(',').map(s => s.trim()).filter(Boolean);
                      const timesList = String(item["Time Of Day"] || "").split(',').map(s => s.trim()).filter(Boolean);
                      const citiesList = String(item["City"] || "").split(',').map(s => s.trim()).filter(Boolean);
                      const venuesList = String(item["Venue"] || "").split(',').map(s => s.trim()).filter(Boolean);
                      const maxLen = Math.max(parentsList.length, datesList.length, timesList.length, citiesList.length, venuesList.length, 1);
                      const result = [];
                      for (let i = 0; i < maxLen; i++) {
                        result.push({ ...item, _originalItem: item, "Parent Event": parentsList[i] || parentsList[0] || "Unlinked Sessions", "Date": datesList[i] || datesList[0] || "", "Time Of Day": timesList[i] || timesList[0] || "", "City": citiesList[i] || citiesList[0] || "", "Venue": venuesList[i] || venuesList[0] || "" });
                      }
                      return result;
                    });
                    const sortedData = [...expandedData].sort((a, b) => {
                      const ta = a["Date"] ? new Date(a["Date"]).getTime() : Infinity;
                      const tb = b["Date"] ? new Date(b["Date"]).getTime() : Infinity;
                      if (isNaN(ta)) return 1; if (isNaN(tb)) return -1; return ta - tb;
                    });
                    const renderSessionCard = (item: any) => {
                      const realItem = item._originalItem || item;
                      const sessionId = realItem.id || realItem._id;
                      const sessionImagesFromDb = item["Images"] || "";
                      const urlRegex = /\((https?:\/\/[^)]+|data:image\/[^;]+;base64,[^)]+)\)/g;
                      const images: string[] = [];
                      let m; const re = new RegExp(urlRegex.source, 'g');
                      while ((m = re.exec(sessionImagesFromDb)) !== null) images.push(m[1]);
                      return (
                        <div key={`${sessionId}-${item["Parent Event"]}`} onClick={() => setViewingRecord(realItem)} className="bg-white border border-slate-200 rounded-[16px] sm:rounded-[20px] p-3 sm:p-5 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col sm:min-h-[280px] overflow-hidden group/card">
                          <div className="text-[13px] sm:text-base font-black text-slate-900 mb-2 sm:mb-5 leading-tight flex justify-between items-start gap-2">
                            <span>{item["Session Name"] || "Untitled Session"}</span>
                            {item["SessionType"] && <Badge className="bg-brand-primary/10 text-brand-primary text-[8px] sm:text-[9px] px-2 py-0.5 shrink-0 border-none font-bold">{item["SessionType"]}</Badge>}
                          </div>
                          <div className="space-y-2 sm:space-y-4 flex-1">
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-0.5"><label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Date</label><div className="text-[11px] sm:text-[13px] font-bold text-slate-800">{item["Date"] || "—"}</div></div>
                              <div className="space-y-0.5"><label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Time Of Day</label><div className="text-[11px] sm:text-[13px] font-bold text-slate-800">{item["Time Of Day"] || "—"}</div></div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-0.5"><label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">City</label><div className="text-[11px] sm:text-[12px] font-semibold text-slate-700 truncate">{item["City"] || "—"}</div></div>
                              <div className="space-y-0.5"><label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Venue</label><div className="text-[11px] sm:text-[12px] font-semibold text-slate-700 truncate">{item["Venue"] || "—"}</div></div>
                            </div>
                            {item["Occasion"] && (
                              <div className="space-y-0.5">
                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Occasion</label>
                                <div className="flex flex-wrap gap-1 overflow-hidden">{String(item["Occasion"]).split(',').map((t: string, i: number) => <span key={i} className={getTagStyle(t.trim())} style={{maxWidth:'100%',whiteSpace:'normal',wordBreak:'break-word',display:'inline-block'}}>{t.trim()}</span>)}</div>
                              </div>
                            )}
                          </div>
                          <div className="mt-4 flex overflow-x-auto gap-2 md:gap-3 scrollbar-hide pb-1">
                            {images.map((imgSrc, imgIdx) => (
                              <div key={imgIdx} className="relative h-20 md:h-24 w-28 md:w-36 shrink-0 rounded-xl overflow-hidden border border-slate-200 group/sessionimg hover:ring-2 hover:ring-brand-primary transition-all shadow-md" onClick={(e) => e.stopPropagation()}>
                                <img src={imgSrc.replace('export=view', 'export=download')} loading="lazy" decoding="async" className="h-full w-full object-cover" alt="Upload" />
                                <button onClick={(e) => { e.stopPropagation(); if (!window.confirm("Remove this image?")) return; const entries: string[] = []; const re2 = /(?:\[([^\]]*)\])?\((https?:\/\/[^)]+|data:image\/[^;]+;base64,[^)]+)\)/g; let mr; while ((mr = re2.exec(item["Images"] || "")) !== null) entries.push(mr[0]); entries.splice(imgIdx, 1); const updated = { ...realItem, ["Images"]: entries.join(' ') }; setSessions(prev => prev.map(r => (r._id === sessionId || r.id === sessionId) ? updated : r)); window.fetch(`/api/sessions/${sessionId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updated) }); }} className="absolute top-1 right-1 p-1.5 bg-black/60 text-white rounded-lg opacity-100 sm:opacity-0 sm:group-hover/sessionimg:opacity-100 hover:bg-red-600 transition-all shadow-sm" title="Remove Image"><Trash2 className="h-3 w-3" /></button>
                              </div>
                            ))}
                            <div onClick={(e) => { e.stopPropagation(); const fi = e.currentTarget.querySelector('input[type="file"]') as HTMLInputElement; if (fi) fi.click(); }} className="h-20 md:h-24 w-20 md:w-24 shrink-0 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-1.5 text-slate-400 hover:text-brand-primary hover:border-brand-primary/50 transition-colors cursor-pointer bg-slate-50 hover:bg-white">
                              <Plus className="h-4 w-4 pointer-events-none" /><span className="text-[7px] md:text-[8px] font-black uppercase pointer-events-none">Add Media</span>
                              <input type="file" accept="image/png, image/jpeg, image/jpg, image/webp, image/gif, image/svg+xml" className="hidden" onClick={(e) => e.stopPropagation()} onChange={(e) => handleDirectImageUpload(e, item, 'sessions', setSessions as any)} />
                            </div>
                          </div>
                        </div>
                      );
                    };
                    if (groupByField) {
                      const grouped: Record<string, any[]> = {};
                      sortedData.forEach((item: any) => {
                        const raw = String(item[groupByField] || '');
                        const keys = raw.split(',').map((s: string) => s.trim()).filter(Boolean);
                        (keys.length > 0 ? keys : ['—']).forEach(k => { if (!grouped[k]) grouped[k] = []; grouped[k].push(item); });
                      });
                      return (
                        <div className="max-w-6xl mx-auto md:ml-4 py-4 md:py-8 relative">
                          <div className="absolute left-[15px] md:left-[19px] top-0 bottom-0 w-0.5 bg-slate-800/40" />
                          <div className="space-y-8 md:space-y-12">
                            {filteredData.length === 0 && <div className="pl-12"><EmptyState searchQuery={searchQuery} onClearSearch={() => setSearchQuery('')} onAddFirst={openAddModal} /></div>}
                            {Object.entries(grouped).map(([groupValue, groupItems], groupIdx) => (
                              <motion.div key={groupValue} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="relative flex items-start gap-4 md:gap-8 group">
                                <div className="relative z-10 flex items-center justify-center mt-5 md:mt-6"><div className="h-8 w-8 md:h-10 md:w-10 rounded-full border border-slate-700 bg-brand-bg flex items-center justify-center shrink-0"><div className={`h-2 w-2 md:h-2.5 md:w-2.5 rounded-full ${groupIdx === 0 ? 'bg-brand-primary animate-pulse' : 'bg-brand-primary/40'}`} /></div></div>
                                <div className="flex-1 mt-3 md:mt-4">
                                  <h3 className="text-xl md:text-3xl font-black text-brand-primary uppercase tracking-tight mb-4 md:mb-6">{groupValue}</h3>
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">{groupItems.map((item: any) => renderSessionCard(item))}</div>
                                </div>
                              </motion.div>
                            ))}
                            {filteredData.length > 0 && !searchQuery && hasPerm(user, activeTable, 'add') && <motion.div onClick={openAddModal} className="ml-12 md:ml-16 border-2 border-dashed border-slate-200 rounded-[16px] sm:rounded-[20px] flex flex-col items-center justify-center p-4 sm:p-8 text-slate-400 cursor-pointer hover:text-brand-primary hover:border-brand-primary/50 transition-all bg-white/50 min-h-[120px]"><Plus className="h-6 w-6 sm:h-8 sm:w-8 mb-1 sm:mb-2" /><span className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest">New Session</span></motion.div>}
                          </div>
                        </div>
                      );
                    }
                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 py-4 md:py-6">
                        {filteredData.length === 0 && <EmptyState searchQuery={searchQuery} onClearSearch={() => setSearchQuery('')} onAddFirst={openAddModal} />}
                        {sortedData.map((item: any) => renderSessionCard(item))}
                        {filteredData.length > 0 && !searchQuery && hasPerm(user, activeTable, 'add') && <motion.div onClick={openAddModal} whileHover={{ y: -4 }} className="border-2 border-dashed border-slate-200 rounded-[16px] sm:rounded-[20px] flex flex-col items-center justify-center p-4 sm:p-8 text-slate-400 cursor-pointer hover:text-brand-primary hover:border-brand-primary/50 transition-all bg-white/50 min-h-[280px]"><Plus className="h-6 w-6 sm:h-8 sm:w-8 mb-1 sm:mb-2" /><span className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest">New Session</span></motion.div>}
                      </div>
                    );
                  })()
                  ) :activeTable === 'MusicLog' ? (
                  /* --- MUSIC LOG CARD VIEW --- */
                  (() => {
                    const mlExpandedData = filteredData.flatMap((item: any) => {
                      const sessionsList = String(item["Session"] || "").split(',').map(s => s.trim()).filter(Boolean);
                      const parentsList = String(item["Parent Event (from Session)"] || "").split(',').map(s => s.trim()).filter(Boolean);
                      const datesList = String(item["Date (from Session)"] || "").split(',').map(s => s.trim()).filter(Boolean);
                      const timesList = String(item["TimeOfDay (from Session)"] || "").split(',').map(s => s.trim()).filter(Boolean);
                      const tracksList = String(item["Track"] || "").split(',').map(s => s.trim()).filter(Boolean);
                      const maxLen = Math.max(sessionsList.length, parentsList.length, datesList.length, timesList.length, tracksList.length, 1);
                      const result = [];
                      for (let i = 0; i < maxLen; i++) {
                        result.push({ ...item, _originalItem: item, "Session": sessionsList[i] || sessionsList[0] || "", "Parent Event (from Session)": parentsList[i] || parentsList[0] || "Unlinked Logs", "Date (from Session)": datesList[i] || datesList[0] || "", "TimeOfDay (from Session)": timesList[i] || timesList[0] || "", "Track": tracksList[i] || tracksList[0] || "Unknown Track" });
                      }
                      return result;
                    });
                    const mlGetWeight = (t: string) => { const lower = t.toLowerCase(); if (lower.includes('morn')) return 1; if (lower.includes('aft')) return 2; if (lower.includes('eve')) return 3; if (lower.includes('night')) return 4; return 99; };
                    const mlSortedData = [...mlExpandedData].sort((a, b) => {
                      const ta = a["Date (from Session)"] ? new Date(a["Date (from Session)"]).getTime() : Infinity;
                      const tb = b["Date (from Session)"] ? new Date(b["Date (from Session)"]).getTime() : Infinity;
                      if (ta !== tb) return ta - tb;
                      const wA = mlGetWeight(String(a["TimeOfDay (from Session)"] || "").trim());
                      const wB = mlGetWeight(String(b["TimeOfDay (from Session)"] || "").trim());
                      if (wA !== wB) return wA - wB;
                      const sA = a["Session"] || ""; const sB = b["Session"] || "";
                      if (sA !== sB) return sA.localeCompare(sB);
                      return (Number(a["Order"]) || 9999) - (Number(b["Order"]) || 9999);
                    });
                    const renderMusicCard = (item: any) => (
                    <motion.div
                      key={`${item.id || item._id}-${item["Session"]}-${item["Track"]}`}
                      onClick={() => setViewingRecord(item._originalItem || item)}
                      whileHover={{ y: -4 }}
                      className="bg-white border border-slate-200 rounded-[20px] shadow-sm hover:shadow-lg transition-all cursor-pointer flex flex-col overflow-hidden"
                    >
                                      {/* HEADER ACCENT */}
                                      <div className="px-4 py-4 border-b border-slate-100 bg-slate-50 flex items-start justify-between gap-3 transition-colors">
                                        <div className="flex items-start gap-3 min-w-0">
                                          <div className="h-9 w-9 shrink-0 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-200">
                                            <Music className="h-4 w-4 text-brand-primary" />
                                          </div>
                                          <div className="min-w-0 pt-0.5">
                                            <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Track</div>
                                            <div className="text-lg sm:text-xl font-black text-slate-900 leading-tight break-words">{item["Track"] || "Unknown Track"}</div>
                                          </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                          <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Date</div>
                                          <div className="text-[11px] font-bold text-slate-700 font-mono">{item["Date (from Session)"] || "—"}</div>
                                        </div>
                                      </div>

                                      {/* BODY */}
                                      <div className="p-4 space-y-3 flex-1">
                                        {/* HIERARCHICAL CONTEXT */}
                                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                                          <div className="relative">
                                            {/* Continuous vertical line */}
                                            <div className="absolute top-2 bottom-3 left-[9px] w-[2px] bg-slate-200" />

                                            {/* Session */}
                                            <div className="relative flex items-start gap-3 mb-3">
                                              <div className="h-5 w-5 rounded-md bg-violet-100 border border-violet-200 flex items-center justify-center shrink-0 z-10">
                                                <MessageSquare className="h-3 w-3 text-violet-600" />
                                              </div>
                                              <div className="min-w-0 flex-1 pt-0.5">
                                                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Session</div>
                                                {item["Session"] ? (
                                                  <span 
                                                    className="text-[11px] font-bold text-brand-primary hover:underline cursor-pointer truncate block"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      const linked = sessions.find((s: any) => s["Session Name"] === item["Session"]);
                                                      if (linked) setLinkedSession(linked);
                                                    }}
                                                  >
                                                    {item["Session"]}
                                                  </span>
                                                ) : (
                                                  <span className="text-[11px] font-bold text-slate-500 truncate block">—</span>
                                                )}
                                              </div>
                                            </div>

                                            {/* Time Of Day */}
                                            <div className="relative flex items-start gap-3">
                                              <div className="h-5 w-5 rounded-md bg-orange-100 border border-orange-200 flex items-center justify-center shrink-0 z-10">
                                                <Clock className="h-3 w-3 text-orange-600" />
                                              </div>
                                              <div className="min-w-0 flex-1 pt-0.5">
                                                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Time Of Day</div>
                                                <div className="text-[11px] font-bold text-slate-600 truncate">
                                                  {item["TimeOfDay (from Session)"] || "—"}
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        </div>

                                        {/* RELEVANCE STARS */}
                                        {item["Relevance"] && (
                                          <div className="flex items-center gap-0.5 mt-2">
                                            {[1, 2, 3, 4, 5].map(star => (
                                              <Star
                                                key={star}
                                                className={`h-3 w-3 ${
                                                  star <= Number(item["Relevance"])
                                                    ? 'fill-yellow-400 text-yellow-400'
                                                    : 'text-slate-200'
                                                }`}
                                              />
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    </motion.div>
                                  );
                    if (groupByField) {
                      const mlGrouped: Record<string, any[]> = {};
                      mlSortedData.forEach((item: any) => {
                        const raw = String(item[groupByField] || '');
                        const keys = raw.split(',').map((s: string) => s.trim()).filter(Boolean);
                        (keys.length > 0 ? keys : ['—']).forEach((k: string) => { if (!mlGrouped[k]) mlGrouped[k] = []; mlGrouped[k].push(item); });
                      });
                      return (
                        <div className="max-w-6xl mx-auto md:ml-4 py-4 md:py-8 relative">
                          <div className="absolute left-[15px] md:left-[19px] top-0 bottom-0 w-0.5 bg-slate-800/40" />
                          <div className="space-y-8 md:space-y-12">
                            {mlSortedData.length === 0 && <div className="pl-12"><EmptyState searchQuery={searchQuery} onClearSearch={() => setSearchQuery('')} onAddFirst={openAddModal} /></div>}
                            {Object.entries(mlGrouped).map(([groupValue, groupItems], groupIdx) => (
                              <motion.div key={groupValue} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="relative flex items-start gap-4 md:gap-8">
                                <div className="relative z-10 flex items-center justify-center mt-5 md:mt-6">
                                  <div className="h-8 w-8 md:h-10 md:w-10 rounded-full border border-slate-700 bg-brand-bg flex items-center justify-center shrink-0">
                                    <div className={`h-2 w-2 md:h-2.5 md:w-2.5 rounded-full ${groupIdx === 0 ? 'bg-brand-primary animate-pulse' : 'bg-brand-primary/40'}`} />
                                  </div>
                                </div>
                                <div className="flex-1 mt-3 md:mt-4">
                                  <h3 className="text-xl md:text-3xl font-black text-brand-primary uppercase tracking-tight mb-4 md:mb-6">{groupValue}</h3>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                                    {groupItems.map((gItem: any) => renderMusicCard(gItem))}
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                            {filteredData.length > 0 && !searchQuery && hasPerm(user, activeTable, 'add') && (
                              <motion.div onClick={openAddModal} className="ml-12 md:ml-16 border-2 border-dashed border-slate-200 rounded-[20px] flex flex-col items-center justify-center p-4 sm:p-8 text-slate-400 cursor-pointer hover:text-brand-primary hover:border-brand-primary/50 transition-all bg-white min-h-[120px]">
                                <Plus className="h-6 w-6 sm:h-8 sm:w-8 mb-1 sm:mb-2" />
                                <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest">New Music Entry</span>
                              </motion.div>
                            )}
                          </div>
                        </div>
                      );
                    }
                    return (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 py-4 sm:py-6">
                        {filteredData.length === 0 && <EmptyState searchQuery={searchQuery} onClearSearch={() => setSearchQuery('')} onAddFirst={openAddModal} />}
                        {mlSortedData.map((item: any) => renderMusicCard(item))}
                        {filteredData.length > 0 && !searchQuery && hasPerm(user, activeTable, 'add') && (
                          <motion.div onClick={openAddModal} className="border-2 border-dashed border-slate-200 rounded-[20px] flex flex-col items-center justify-center p-4 sm:p-8 text-slate-400 cursor-pointer hover:text-brand-primary hover:border-brand-primary/50 transition-all bg-white min-h-[120px]">
                            <Plus className="h-6 w-6 sm:h-8 sm:w-8 mb-1 sm:mb-2" />
                            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest">New Music Entry</span>
                          </motion.div>
                        )}
                      </div>
                    );
                  })()
                  ) : activeTable === 'VideoLog' ? (
                  /* --- VIDEO LOG CARD VIEW --- */
                  (() => {
                    const vlExpandedData = filteredData.flatMap((item: any) => {
                      const sessionsList = String(item["Session"] || "").split(',').map(s => s.trim()).filter(Boolean);
                      const parentsList = String(item["Parent Event (from Session)"] || "").split(',').map(s => s.trim()).filter(Boolean);
                      const datesList = String(item["Date (from Session)"] || "").split(',').map(s => s.trim()).filter(Boolean);
                      const timesList = String(item["TimeOfDay (from Session)"] || "").split(',').map(s => s.trim()).filter(Boolean);
                      const videosList = String(item["VideoTitle"] || "").split(',').map(s => s.trim()).filter(Boolean);
                      const maxLen = Math.max(sessionsList.length, parentsList.length, datesList.length, timesList.length, videosList.length, 1);
                      const result = [];
                      for (let i = 0; i < maxLen; i++) {
                        result.push({ ...item, _originalItem: item, "Session": sessionsList[i] || sessionsList[0] || "", "Parent Event (from Session)": parentsList[i] || parentsList[0] || "Unlinked Logs", "Date (from Session)": datesList[i] || datesList[0] || "", "TimeOfDay (from Session)": timesList[i] || timesList[0] || "", "VideoTitle": videosList[i] || videosList[0] || "Untitled Video" });
                      }
                      return result;
                    });
                    const vlGetWeight = (t: string) => { const lower = t.toLowerCase(); if (lower.includes('morn')) return 1; if (lower.includes('aft')) return 2; if (lower.includes('eve')) return 3; if (lower.includes('night')) return 4; return 99; };
                    const vlSortedData = [...vlExpandedData].sort((a, b) => {
                      const ta = a["Date (from Session)"] ? new Date(a["Date (from Session)"]).getTime() : Infinity;
                      const tb = b["Date (from Session)"] ? new Date(b["Date (from Session)"]).getTime() : Infinity;
                      if (ta !== tb) return ta - tb;
                      const wA = vlGetWeight(String(a["TimeOfDay (from Session)"] || "").trim());
                      const wB = vlGetWeight(String(b["TimeOfDay (from Session)"] || "").trim());
                      if (wA !== wB) return wA - wB;
                      const sA = a["Session"] || ""; const sB = b["Session"] || "";
                      if (sA !== sB) return sA.localeCompare(sB);
                      return 0;
                    });
                    const renderVideoCard = (item: any) => (
                      <motion.div
                        key={`${item.id || item._id}-${item["Session"]}-${item["VideoTitle"]}`}
                        onClick={() => setViewingRecord(item._originalItem || item)}
                        whileHover={{ y: -4 }}
                        className="bg-white border border-slate-200 rounded-[20px] shadow-sm hover:shadow-lg transition-all cursor-pointer flex flex-col overflow-hidden"
                      >
                        <div className="px-4 py-4 border-b border-slate-100 bg-slate-50 flex items-start justify-between gap-3 transition-colors">
                          <div className="flex items-start gap-3 min-w-0">
                            <div className="h-9 w-9 shrink-0 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-200">
                              <Video className="h-4 w-4 text-brand-primary" />
                            </div>
                            <div className="min-w-0 pt-0.5">
                              <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Video Title</div>
                              <div className="text-lg sm:text-xl font-black text-slate-900 leading-tight break-words">{item["VideoTitle"] || "Untitled Video"}</div>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Date</div>
                            <div className="text-[11px] font-bold text-slate-700 font-mono">{item["Date (from Session)"] || "—"}</div>
                          </div>
                        </div>
                        <div className="p-4 space-y-3 flex-1">
                          <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                            <div className="relative">
                              <div className="absolute top-2 bottom-3 left-[9px] w-[2px] bg-slate-200" />
                              <div className="relative flex items-start gap-3 mb-3">
                                <div className="h-5 w-5 rounded-md bg-violet-100 border border-violet-200 flex items-center justify-center shrink-0 z-10">
                                  <MessageSquare className="h-3 w-3 text-violet-600" />
                                </div>
                                <div className="min-w-0 flex-1 pt-0.5">
                                  <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Session</div>
                                  {item["Session"] ? (
                                    <span className="text-[11px] font-bold text-brand-primary hover:underline cursor-pointer truncate block" onClick={(e) => { e.stopPropagation(); const linked = sessions.find((s: any) => s["Session Name"] === item["Session"]); if (linked) setLinkedSession(linked); }}>{item["Session"]}</span>
                                  ) : (
                                    <span className="text-[11px] font-bold text-slate-500 truncate block">—</span>
                                  )}
                                </div>
                              </div>
                              <div className="relative flex items-start gap-3">
                                <div className="h-5 w-5 rounded-md bg-orange-100 border border-orange-200 flex items-center justify-center shrink-0 z-10">
                                  <Clock className="h-3 w-3 text-orange-600" />
                                </div>
                                <div className="min-w-0 flex-1 pt-0.5">
                                  <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Time Of Day</div>
                                  <div className="text-[11px] font-bold text-slate-600 truncate">{item["TimeOfDay (from Session)"] || "—"}</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                    if (groupByField) {
                      const vlGrouped: Record<string, any[]> = {};
                      vlSortedData.forEach((item: any) => {
                        const raw = String(item[groupByField] || '');
                        const keys = raw.split(',').map((s: string) => s.trim()).filter(Boolean);
                        (keys.length > 0 ? keys : ['—']).forEach((k: string) => { if (!vlGrouped[k]) vlGrouped[k] = []; vlGrouped[k].push(item); });
                      });
                      return (
                        <div className="max-w-6xl mx-auto md:ml-4 py-4 md:py-8 relative">
                          <div className="absolute left-[15px] md:left-[19px] top-0 bottom-0 w-0.5 bg-slate-800/40" />
                          <div className="space-y-8 md:space-y-12">
                            {vlSortedData.length === 0 && <div className="pl-12"><EmptyState searchQuery={searchQuery} onClearSearch={() => setSearchQuery('')} onAddFirst={openAddModal} /></div>}
                            {Object.entries(vlGrouped).map(([groupValue, groupItems], groupIdx) => (
                              <motion.div key={groupValue} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="relative flex items-start gap-4 md:gap-8">
                                <div className="relative z-10 flex items-center justify-center mt-5 md:mt-6">
                                  <div className="h-8 w-8 md:h-10 md:w-10 rounded-full border border-slate-700 bg-brand-bg flex items-center justify-center shrink-0">
                                    <div className={`h-2 w-2 md:h-2.5 md:w-2.5 rounded-full ${groupIdx === 0 ? 'bg-brand-primary animate-pulse' : 'bg-brand-primary/40'}`} />
                                  </div>
                                </div>
                                <div className="flex-1 mt-3 md:mt-4">
                                  <h3 className="text-xl md:text-3xl font-black text-brand-primary uppercase tracking-tight mb-4 md:mb-6">{groupValue}</h3>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                                    {groupItems.map((gItem: any) => renderVideoCard(gItem))}
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                            {filteredData.length > 0 && !searchQuery && hasPerm(user, activeTable, 'add') && (
                              <motion.div onClick={openAddModal} className="ml-12 md:ml-16 border-2 border-dashed border-slate-200 rounded-[20px] flex flex-col items-center justify-center p-4 sm:p-8 text-slate-400 cursor-pointer hover:text-brand-primary hover:border-brand-primary/50 transition-all bg-white min-h-[120px]">
                                <Plus className="h-6 w-6 sm:h-8 sm:w-8 mb-1 sm:mb-2" />
                                <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest">New Video Entry</span>
                              </motion.div>
                            )}
                          </div>
                        </div>
                      );
                    }
                    return (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 py-4 sm:py-6">
                        {filteredData.length === 0 && <EmptyState searchQuery={searchQuery} onClearSearch={() => setSearchQuery('')} onAddFirst={openAddModal} />}
                        {vlSortedData.map((item: any) => renderVideoCard(item))}
                        {filteredData.length > 0 && !searchQuery && hasPerm(user, activeTable, 'add') && (
                          <motion.div onClick={openAddModal} className="border-2 border-dashed border-slate-200 rounded-[20px] flex flex-col items-center justify-center p-4 sm:p-8 text-slate-400 cursor-pointer hover:text-brand-primary hover:border-brand-primary/50 transition-all bg-white min-h-[120px]">
                            <Plus className="h-6 w-6 sm:h-8 sm:w-8 mb-1 sm:mb-2" />
                            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest">New Video Entry</span>
                          </motion.div>
                        )}
                      </div>
                    );
                  })()
                  ) : (
                    /* --- 2. STANDARD GRID VIEW --- */
                  (() => {
                    const renderGenericCard = (item: any) => (
                    <motion.div
                      key={item.id || item._id}
                      onClick={() => setViewingRecord(item)}
                      whileHover={{ y: -4 }}
                      className="bg-white border border-slate-200 rounded-[20px] shadow-sm hover:shadow-lg transition-all cursor-pointer flex flex-col overflow-hidden"
                    >
                      {/* IMAGE/ATTACHMENT — rendered first so image appears at top */}
                      {(() => {
                        const colName = ['Images', 'Attachments', 'Attachment'].find(c => item[c] !== undefined && item[c] !== '') || (['LED', 'VideoSetup', 'AudioSetup'].includes(activeTable) ? (activeTable === 'LED' ? 'Images' : 'Attachments') : null);
                        if (!colName) return null;
                        return (
                        <div className="h-44 w-full overflow-hidden bg-slate-100 border-b border-slate-100">
                          {(() => {
                            const match = item[colName]?.match(/\((https?:\/\/[^)]+|data:image\/[^;]+;base64,[^)]+)\)/);
                            return match ? (
                              <CardImageGallery imageString={item[colName] || ""} />
                            ) : (
                              <div className="h-full flex flex-col items-center justify-center gap-2 opacity-30">
                                <Monitor className="h-10 w-10 text-slate-400" />
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No Preview</span>
                              </div>
                            );
                          })()}
                        </div>
                        );
                      })()}

                      {/* ACCENT HEADER — title shown below image for LED */}
                      <div className="bg-gradient-to-br from-brand-primary/10 to-slate-50 px-4 py-4 border-b border-slate-100 flex items-center gap-3">
                        <div className="h-9 w-9 shrink-0 bg-brand-primary/10 rounded-xl flex items-center justify-center text-brand-primary">
                          {activeTable === 'LED' ? <Monitor className="h-4 w-4" /> :
                           activeTable === 'DyatraChecklist' ? <CheckSquare className="h-4 w-4" /> :
                           activeTable === 'Guidance & Learning' ? <FileText className="h-4 w-4" /> :
                       activeTable === 'VideoSetup' ? <Film className="h-4 w-4" /> :
                           activeTable === 'AudioSetup' ? <Volume2 className="h-4 w-4" /> :
                           <LayoutGrid className="h-4 w-4" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{activeTable}</div>
                          <h3 className="text-[13px] font-black text-slate-900 leading-snug line-clamp-2">
                            {activeTable === 'LED' ? (item["Parent Event (from 🕘 Session)"] || "Untitled LED") :
                             activeTable === 'Guidance & Learning' ? item["Event"] :
                             activeTable === 'DyatraChecklist' ? item["Task"] :
                             (item.Name || item.name || item.Title || item.title || "Untitled Record")}
                          </h3>
                        </div>
                      </div>

                      {/* CARD BODY */}
                      <div className="p-4 space-y-3 flex-1">
                        {activeTable === 'Guidance & Learning' ? (
                          <div className="space-y-3">
                            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                              <p className="text-[12px] text-slate-600 leading-relaxed italic line-clamp-3">"{item["Guidance/Learning"]}"</p>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase">
                              <FileText className="h-3 w-3 text-brand-primary shrink-0" /><span className="truncate">{item["GuidanceFrom"]}</span>
                            </div>
                            <div className="pt-2 border-t border-slate-100">
                              <span className="text-[9px] font-black text-slate-400 uppercase">Year: {item.Year || item["Year (from Event)"]}</span>
                            </div>
                          </div>
                        ) : activeTable === 'LED' ? (
                          <div className="space-y-3">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                <Truck className="h-3 w-3 text-brand-primary/60 shrink-0" /><span className="truncate">{item["Vendor"] || "No Vendor"}</span>
                              </div>
                              <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                <MapPin className="h-3 w-3 text-brand-primary/60 shrink-0" /><span className="truncate">{item["City (from 🕘 Session)"] || "Location Unknown"}</span>
                              </div>
                            </div>
                            <div className="pt-2 border-t border-slate-100">
                              <Badge className="bg-brand-primary/10 text-brand-primary border-none text-[9px] font-black px-2 py-0.5 rounded">Date: {item["Date (from 🕘 Session)"]}</Badge>
                            </div>
                          </div>
                        ) : activeTable === 'DyatraChecklist' ? (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <CheckSquare className="h-3.5 w-3.5 text-brand-primary shrink-0" />
                              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest truncate">{item["TaskGroup"] || "General Task"}</span>
                            </div>
                            {item["Details"] && (
                              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                                <p className="text-[12px] text-slate-600 leading-relaxed italic line-clamp-3">{item["Details"]}</p>
                              </div>
                            )}
                            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                              <div className="space-y-1">
                                <p className="text-[8px] font-black text-slate-400 uppercase">Timeline</p>
                                <p className="text-[11px] font-bold text-slate-700">{item["Typical Timeline"] || "N/A"}</p>
                              </div>
                              <div className="space-y-1 overflow-hidden">
                                <p className="text-[8px] font-black text-slate-400 uppercase">Category</p>
                                {item["Category"] ? <span className={getTagStyle(item["Category"])} style={{maxWidth:"100%",overflow:"hidden",textOverflow:"ellipsis",display:"inline-block",whiteSpace:"nowrap"}}>{item["Category"]}</span> : <span className="text-slate-400 italic text-[9px]">—</span>}
                              </div>
                            </div>
                          </div>
                        ) : activeTable === 'DataSharing' ? (
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 shrink-0 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary font-black text-base border border-brand-primary/20">{item["Sevak"]?.[0]}</div>
                              <div className="min-w-0">
                                <div className="text-[13px] font-black text-slate-900 uppercase truncate">{item["Sevak"]}</div>
                                {item["Dept"] ? <span className={getTagStyle(item["Dept"])} style={{maxWidth:'100%',overflow:'hidden',textOverflow:'ellipsis',display:'inline-block',whiteSpace:'nowrap'}}>{item["Dept"]}</span> : null}
                              </div>
                            </div>
                            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1.5">
                              <div className="flex items-center gap-2 text-[11px] text-slate-600 font-medium"><Mail className="h-3 w-3 text-slate-400 shrink-0" /><span className="truncate">{item["EmailId"]}</span></div>
                              <div className="flex items-center gap-2 text-[11px] text-slate-600 font-medium"><Share2 className="h-3 w-3 text-slate-400 shrink-0" /><span className="truncate">{item["ShareData"] || "N/A"}</span></div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] font-black text-slate-400 uppercase">Sharing:</span>
                              <span className={getTagStyle(item["ShareFacts?"] || 'No')}>{item["ShareFacts?"] || 'No'}</span>
                            </div>
                          </div>
                        ) : (activeTable === 'VideoSetup' || activeTable === 'AudioSetup') ? (
                          <div className="grid grid-cols-2 gap-3 pt-2">
                            <div className="space-y-1">
                              <p className="text-[8px] font-black text-slate-400 uppercase">Assignee</p>
                              <p className="text-[11px] font-bold text-slate-700 truncate">{item["Assignee"] || item.assignee || "Unassigned"}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-[8px] font-black text-slate-400 uppercase">Status</p>
                              {(() => {
                                const st = item["Status"] || item.status;
                                return st ? (
                                  <Badge className={`text-[10px] px-2 py-0 border font-bold ${
                                    st === 'Done' ? 'bg-green-100 text-green-700 border-green-200' : 
                                    st === 'In Progress' ? 'bg-blue-100 text-blue-700 border-blue-200' : 
                                    'bg-slate-100 text-slate-700 border-slate-200'
                                  }`}>{st}</Badge>
                                ) : <span className="text-slate-400 italic text-[11px]">—</span>;
                              })()}
                            </div>
                          </div>
                        ) : (
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest truncate">{item.city || item.artist || item.category || item.DateFrom || "—"}</p>
                        )}
                      </div>
                    </motion.div>
                  );

                  if (groupByField) {
                    const grouped: Record<string, any[]> = {};
                    sortedVisualData.forEach((item: any) => {
                      const raw = String(item[groupByField] || '');
                      const keys = raw.split(',').map((s: string) => s.trim()).filter(Boolean);
                      (keys.length > 0 ? keys : ['—']).forEach(k => { if (!grouped[k]) grouped[k] = []; grouped[k].push(item); });
                    });
                    return (
                      <div className="max-w-6xl mx-auto md:ml-4 py-4 md:py-8 relative">
                        <div className="absolute left-[15px] md:left-[19px] top-0 bottom-0 w-0.5 bg-slate-800/40" />
                        <div className="space-y-8 md:space-y-12">
                          {sortedVisualData.length === 0 && <div className="pl-12"><EmptyState searchQuery={searchQuery} onClearSearch={() => setSearchQuery('')} onAddFirst={openAddModal} /></div>}
                          {Object.entries(grouped).map(([groupValue, groupItems], groupIdx) => (
                            <motion.div key={groupValue} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="relative flex items-start gap-4 md:gap-8">
                              <div className="relative z-10 flex items-center justify-center mt-5 md:mt-6">
                                <div className="h-8 w-8 md:h-10 md:w-10 rounded-full border border-slate-700 bg-brand-bg flex items-center justify-center shrink-0">
                                  <div className={`h-2 w-2 md:h-2.5 md:w-2.5 rounded-full ${groupIdx === 0 ? 'bg-brand-primary animate-pulse' : 'bg-brand-primary/40'}`} />
                                </div>
                              </div>
                              <div className="flex-1 mt-3 md:mt-4">
                                <h3 className="text-xl md:text-3xl font-black text-brand-primary uppercase tracking-tight mb-4 md:mb-6">{groupValue}</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                                  {groupItems.map((item: any) => renderGenericCard(item))}
                                </div>
                              </div>
                            </motion.div>
                          ))}
                          {filteredData.length > 0 && !searchQuery && hasPerm(user, activeTable, 'add') && <motion.div onClick={openAddModal} whileHover={{ y: -4 }} className="ml-12 md:ml-16 border-2 border-dashed border-slate-200 rounded-[20px] flex flex-col items-center justify-center p-8 text-slate-400 cursor-pointer hover:text-brand-primary hover:border-brand-primary/40 transition-all bg-white min-h-[120px]"><Plus className="h-6 w-6 mb-3" /><span className="text-[10px] font-black uppercase tracking-[0.2em]">New {activeTable} Entry</span></motion.div>}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                      {sortedVisualData.length === 0 && <EmptyState searchQuery={searchQuery} onClearSearch={() => setSearchQuery('')} onAddFirst={openAddModal} />}
                      {sortedVisualData.map((item: any) => renderGenericCard(item))}
                      {filteredData.length > 0 && !searchQuery && hasPerm(user, activeTable, 'add') && <motion.div onClick={openAddModal} whileHover={{ y: -4 }} className="border-2 border-dashed border-slate-200 rounded-[20px] flex flex-col items-center justify-center p-8 text-slate-400 cursor-pointer hover:text-brand-primary hover:border-brand-primary/40 transition-all bg-white min-h-[160px]"><Plus className="h-6 w-6 mb-3" /><span className="text-[10px] font-black uppercase tracking-[0.2em]">New {activeTable} Entry</span></motion.div>}
                    </div>
                  );
                  })()
                )
                ) : (
                  /* --- 3. DATA GRID VIEW (Table) --- */
                  /* --- 3. WHITE EXCEL / AIRTABLE STYLE GRID VIEW --- */
               <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col h-[calc(100vh-200px)]">
                  <div className="md:hidden bg-blue-50 text-[10px] text-center py-1 text-blue-600 font-bold uppercase">
                    ← Scroll horizontally to see all columns →
                  </div>
                 <div 
  ref={gridContainerRef} // Add this line
  className="overflow-auto thin-scrollbar flex-1 bg-white"
>
                    <table 
                      className="border-collapse text-left text-[11px] table-fixed" 
                      style={{ width: 'max-content' }} 
                    >
         <thead className="sticky top-0 z-30 bg-slate-50 border-b border-slate-200">
  <tr>
    <th className={`w-12 border-r border-b border-slate-200 px-2 py-3 text-center bg-slate-100 ${(frozenUpTo[activeTable] ?? -1) >= 0 ? 'sticky left-0 z-40' : ''}`} style={(frozenUpTo[activeTable] ?? -1) >= 0 ? FROZEN_STYLE : undefined}>
      <span className="text-[11px] font-black text-slate-500">#</span> 
    </th>
   {(() => {
  const allCols = getTableColumns();
  const frozen = frozenUpTo[activeTable] ?? -1;
  const leftOffsets: number[] = [];
  let acc = 48;
  allCols.forEach((c, idx) => { leftOffsets[idx] = acc; if (idx <= frozen) acc += (colWidths[c] || 200); });
  return allCols.map((col, i) => {
  const isSorted = sortBy?.field === col;
  const extraIndex = (extraColumns[activeTable] || []).indexOf(col);
  const isExtraColumn = extraIndex >= 0;
  const fieldType = getColumnType(col);
  const TypeIcon = FIELD_TYPES.find(f => f.id === fieldType)?.icon || AlignLeft;
  const isSticky = i <= frozen;
  const isFreezeEdge = i === frozen;

  return (
  <th
  key={i}
  draggable
  onDragStart={() => { dragColRef.current = col; }}
  onDragOver={(e) => { e.preventDefault(); setDragOverCol(col); }}
  onDragLeave={() => setDragOverCol(null)}
  onDrop={() => { setDragOverCol(null); if (dragColRef.current) handleColDrop(dragColRef.current, col); dragColRef.current = null; }}
  onDragEnd={() => { setDragOverCol(null); dragColRef.current = null; }}
  style={{ width: colWidths[col] || 200, minWidth: colWidths[col] || 200, ...(isSticky ? { position: 'sticky' as const, left: leftOffsets[i], zIndex: 30, ...FROZEN_STYLE } : {}) }}
  className={`border-b p-0 font-semibold tracking-tight overflow-hidden select-none transition-colors group/header ${
    isFreezeEdge ? 'border-r-2 border-r-brand-primary/40' : 'border-r border-slate-200'
  } ${
    dragOverCol === col ? 'bg-brand-primary/10 border-l-2 border-l-brand-primary' : isSorted ? 'bg-blue-50 text-brand-primary' : isSticky ? 'text-slate-600' : 'bg-slate-50 text-slate-600'
  } ${isSticky ? '' : 'relative'}`}
>
      {editingHeader?.index === i ? (
        <input
          autoFocus
        className="w-full h-full px-4 py-3 bg-white text-brand-primary outline-none border-none font-black text-[11px]"
          value={editingHeader.value}
          onChange={(e) => setEditingHeader({ ...editingHeader, value: e.target.value })}
          onBlur={() => {
            if (editingHeader && editingHeader.value.trim() !== "") {
              const oldName = (extraColumns[activeTable] || [])[extraIndex];
              const newExtras = [...(extraColumns[activeTable] || [])];
              newExtras[extraIndex] = editingHeader.value;
              const newCols = { ...extraColumns, [activeTable]: newExtras };
              const tableTypes = { ...(columnTypes[activeTable] || {}) };
              if (oldName && oldName !== editingHeader.value && tableTypes[oldName]) {
                tableTypes[editingHeader.value] = tableTypes[oldName];
                delete tableTypes[oldName];
              }
              const newTypes = { ...columnTypes, [activeTable]: tableTypes };
              setExtraColumns(newCols);
              setColumnTypes(newTypes);
              saveSettings(newCols, newTypes, hiddenColumns);
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
            className="flex items-center gap-2 px-4 py-3 h-full w-full cursor-grab active:cursor-grabbing hover:bg-black/5 transition-colors truncate pr-16"
          >
            <GripVertical className="h-3 w-3 shrink-0 text-slate-300 opacity-0 group-hover/header:opacity-100 transition-opacity -ml-1.5" />
            <TypeIcon className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <span className="truncate">{(() => {
              const meta = columnMeta[activeTable]?.[col];
              if (meta?.lookupField && meta?.linkedTable) return `${meta.lookupField} (from ${meta.linkedTable})`;
              if (meta?.linkedTable && fieldType === 'link_to_record') return `Linked to ${meta.linkedTable}`;
              return colLabel(col);
            })()}</span>
          </div>

          {/* COLUMN ACTIONS — type picker, freeze, delete */}
          <div className="absolute right-2 flex items-center gap-0.5 opacity-0 group-hover/header:opacity-100 transition-all">
            <button
              onClick={(e) => { e.stopPropagation(); const existMeta = columnMeta[activeTable]?.[col] || {}; setEditColumnModal({ col, type: getColumnType(col), extraIndex, linkedTable: existMeta.linkedTable || '', lookupField: existMeta.lookupField || '' }); }}
              className="p-1 hover:bg-blue-100 text-slate-400 hover:text-brand-primary rounded transition-all"
              title="Change field type"
            >
              <Settings2 className="h-3 w-3" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                const newFrozen = i === frozen ? -1 : i;
                const next = { ...frozenUpTo, [activeTable]: newFrozen };
                setFrozenUpTo(next);
                saveSettings(extraColumns, columnTypes, hiddenColumns, columnMeta, columnOrder, next);
              }}
              className={`p-1 rounded transition-all ${i <= frozen ? 'text-brand-primary' : 'text-slate-400 hover:text-brand-primary'}`}
              title={i <= frozen ? (i === frozen ? 'Unfreeze' : 'Freeze up to here') : 'Freeze up to here'}
            >
              <Layers className="h-3 w-3" />
            </button>
            {isExtraColumn && (
              <button
                onClick={(e) => { e.stopPropagation(); handleDeleteColumn(col); }}
                className="p-1 hover:bg-red-100 text-slate-400 hover:text-red-600 rounded transition-all"
                title="Remove column"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      )}
      {/* Resizer Handle */}
      <div onMouseDown={(e) => handleMouseDown(e, col)} className="absolute right-0 top-0 h-full w-[10px] cursor-col-resize hover:bg-brand-primary/50 z-20" />
    </th>
  );
  });
  })()}

    {/* The Dynamic Column PLUS button */}
    <th className="w-12 border-b border-slate-200 bg-slate-50 hover:bg-slate-100 cursor-pointer">
      <button
        onClick={() => {
          const currentExtras = extraColumns[activeTable] || [];
          setAddColumnModal({ name: `Field ${currentExtras.length + 1}`, type: 'text', linkedTable: '', lookupField: '' });
        }}
        className="w-full h-full flex items-center justify-center text-slate-400 hover:text-brand-primary transition-colors"
        title="Add field"
      >
        <Plus className="h-5 w-5" />
      </button>
    </th>
  </tr>
</thead>
                      
     <tbody className="bg-white">
     
  {(() => { const _rows = getProcessedData(); return _rows.map((row, idx) => {

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
              {colLabel(row.label)}
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
    const nextItem = _rows[idx + 1];
    const isLastInGroup = !!(groupByField && row.parentId &&
      !collapsedGroups.includes(row.parentId) &&
      (!nextItem || nextItem.type === 'header' || nextItem.type === 'edit-row'));
    const groupHeader = isLastInGroup ? _rows.find(r => r.type === 'header' && r.id === row.parentId) : null;
    const isTemp = !!(row.data?._isTemp);

 return (
  <React.Fragment key={row.data?._id || row.data?.id || idx}>
  <tr
    id={`record-${row.data?._id || row.data?.id}`}
    className={`group transition-colors duration-100 border-b border-slate-200 ${isTemp ? 'opacity-50 animate-pulse pointer-events-none' : ''} ${
      selectedIds.includes(row.data?._id || row.data?.id)
        ? 'bg-blue-100/60'
        : !row.groupColor
          ? 'hover:bg-blue-50/40'
          : ''
    }`}
    style={!selectedIds.includes(row.data?._id || row.data?.id) && row.groupColor ? { backgroundColor: row.groupColor + '22' } : undefined}
  >
    {/* CHECKBOX + EXPAND COLUMN (Sticky Left) */}
    <td className={`w-12 border-r border-slate-200 text-center px-1 py-0 ${(frozenUpTo[activeTable] ?? -1) >= 0 ? 'sticky left-0 z-20' : ''}`} style={(frozenUpTo[activeTable] ?? -1) >= 0 ? FROZEN_STYLE : undefined}>
      <div className="relative flex items-center justify-center h-full">
        {/* Row index — visible by default, fades on hover */}
        <span className={`absolute text-[10px] font-mono text-slate-400 transition-opacity duration-150 group-hover:opacity-0 ${
          selectedIds.includes(row.data?._id || row.data?.id) || isMobileView ? 'opacity-0' : 'opacity-100'
        }`}>
          {idx + 1}
        </span>
        {/* Controls — hidden by default on desktop (hover to reveal), always visible on mobile */}
        <div className={`flex items-center gap-1 transition-opacity duration-150 ${
          selectedIds.includes(row.data?._id || row.data?.id) || isMobileView ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}>
          <input
            type="checkbox"
            checked={selectedIds.includes(row.data?._id || row.data?.id)}
            onChange={() => {}}
            onClick={e => { e.stopPropagation(); toggleRowSelection(row.data?._id || row.data?.id); }}
            className="h-3.5 w-3.5 rounded border-slate-300 text-brand-primary focus:ring-brand-primary cursor-pointer"
          />
          <button
            onClick={e => { 
              e.stopPropagation(); 
              if (hasPerm(user, activeTable, 'edit')) {
                setExpandedRecord(row.data); 
              } else {
                setViewingRecord(row.data);
              }
            }}
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
            if (isMobileView) {
            if (hasPerm(user, activeTable, 'edit')) {
              setExpandedRecord(row.data);
            } else {
              setViewingRecord(row.data);
            }
              return;
            }
            // Disable edit if user lacks permissions
            if (!hasPerm(user, activeTable, 'edit')) {
            setViewingRecord(row.data);
              return;
            }
            // Detect which column cell was clicked via DOM position
            const td = (e.target as HTMLElement).closest('td');
            const tr = td?.closest('tr');
            let clickedCol: string | undefined;
            if (td && tr) {
              const tds = Array.from(tr.querySelectorAll('td'));
              const tdIdx = tds.indexOf(td as HTMLTableCellElement) - 1;
              clickedCol = getTableColumns()[tdIdx];
              // MusicLog star column — don't enter edit mode
              if (activeTable === 'MusicLog' && clickedCol === 'Relevance') return;
              // Images/Attachments column — don't enter inline edit mode (manager handles it)
              if (clickedCol === 'Images' || clickedCol === 'Attachments' || clickedCol === 'Attachment') {
                 setImageManager({ item: { ...row.data }, column: clickedCol, collection: getImageCollection(), isOpen: true });
                 return;
              }
            }
            const rowId = row.data?._id || row.data?.id;
            if (clickedCol) setEditingCell(clickedCol);
            setEditingId(rowId);
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
      {isLastInGroup && (
        <tr
          className="hover:bg-slate-50/80 cursor-pointer border-b border-slate-100 group/addrow"
          onClick={() => {
            const seedVal = groupHeader?.value === 'Unspecified' ? '' : groupHeader?.value;
            const seed = groupByField && seedVal != null ? { [groupByField]: seedVal } : {};
            handleAddBlankRow(seed);
          }}
        >
          <td className="w-12 border-r border-slate-100 text-center py-2">
            <div className="h-5 w-5 rounded bg-slate-100 group-hover/addrow:bg-brand-primary/10 flex items-center justify-center mx-auto transition-colors">
              <Plus className="h-3 w-3 text-slate-400 group-hover/addrow:text-brand-primary" />
            </div>
          </td>
          <td colSpan={getTableColumns().length} className="px-4 py-2 text-slate-300 text-[11px] group-hover/addrow:text-brand-primary/60 transition-colors">
            + Add record to {groupHeader?.value}
          </td>
        </tr>
      )}
  </React.Fragment>
    );
  });})()}

  {filteredData.length === 0 && !isInlineAdding && (
    <tr>
      <td colSpan={getTableColumns().length + 2}>
        <EmptyState searchQuery={searchQuery} onClearSearch={() => setSearchQuery('')} onAddFirst={() => hasPerm(user, activeTable, 'add') ? handleAddBlankRow() : showToast("No permission to add")} />
      </td>
    </tr>
  )}

  {filteredData.length > 0 && !isInlineAdding && hasPerm(user, activeTable, 'add') && (
    <tr
  className="hover:bg-slate-50 cursor-pointer group border-b border-slate-200"
  onClick={() => handleAddBlankRow()}
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
                      <span>{sortBy ? `Sorted by ${colLabel(sortBy.field)}` : 'Default Sort'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${groupByField ? 'bg-green-500 shadow-sm animate-pulse' : 'bg-slate-300'}`} />
                      <span>{groupByField ? 'Grouped View enabled' : 'Grouped View disabled'}</span>
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
    className="fixed bottom-4 left-3 right-3 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:w-auto z-[100] bg-slate-900 border border-slate-700 shadow-2xl rounded-2xl px-3 sm:px-6 py-3 flex items-center gap-2 sm:gap-6"
  >
    {/* Count badge */}
    <div className="flex items-center gap-2 border-r border-slate-700 pr-3 sm:pr-6 shrink-0">
      <div className="bg-brand-primary h-6 w-6 rounded-md flex items-center justify-center text-[10px] font-black text-white shrink-0">
        {selectedIds.length}
      </div>
      <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider whitespace-nowrap">Selected</span>
    </div>

    {/* Actions — fill remaining space evenly on mobile */}
    <div className="flex items-center gap-1 sm:gap-2 flex-1 justify-end">
      {/* Expand — desktop only */}
      {!isMobileView && selectedIds.length === 1 && (
        <button
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-700 text-[12px] font-bold transition-colors whitespace-nowrap"
          onClick={() => {
            const item = getActiveData().find(d => (d._id || d.id) === selectedIds[0]);
            setViewingRecord(item);
            setSelectedIds([]);
          }}
        >
          <ArrowUpRight className="h-4 w-4" /> Expand
        </button>
      )}

      {hasPerm(user, activeTable, 'delete') && (
        <button
          className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 text-[13px] font-bold transition-colors whitespace-nowrap"
          onClick={handleBulkDelete}
        >
          <X className="h-4 w-4" /> Delete
        </button>
      )}

      <div className="w-px h-5 bg-slate-700 sm:hidden" />

      <button
        className="px-3 sm:px-4 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-700 text-[13px] font-bold transition-colors whitespace-nowrap"
        onClick={() => setSelectedIds([])}
      >
        Deselect
      </button>
    </div>
  </motion.div>
)}
          </div>
        </div>
      </main>

      {/* ADD COLUMN MODAL */}
      {addColumnModal && (
        <>
          <div className="fixed inset-0 z-[600] bg-black/20" onClick={() => setAddColumnModal(null)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[601] w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col max-h-[80vh]">
            {/* sticky header */}
            <div className="px-5 pt-5 pb-3 shrink-0">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">Add field</h3>
            </div>

            {/* scrollable body */}
            <div className="flex-1 overflow-y-auto px-5 pb-1 min-h-0">
              <div className="mb-4">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Field name</label>
                <input
                  autoFocus
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary outline-none"
                  value={addColumnModal.name}
                  onChange={e => setAddColumnModal({ ...addColumnModal, name: e.target.value })}
                  onKeyDown={e => { if (e.key === 'Enter') confirmAddColumn(); if (e.key === 'Escape') setAddColumnModal(null); }}
                />
              </div>

              <div className="mb-4">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Field type</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {FIELD_TYPES.map(ft => (
                    <button
                      key={ft.id}
                      onClick={() => setAddColumnModal({ ...addColumnModal, type: ft.id })}
                      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border transition-all text-left ${addColumnModal.type === ft.id ? 'border-brand-primary bg-brand-primary/5 text-brand-primary' : 'border-slate-200 hover:border-slate-300 text-slate-600 hover:bg-slate-50'}`}
                    >
                      <ft.icon className="h-3 w-3 shrink-0" />
                      <div>
                        <div className="text-[11px] font-semibold leading-tight">{ft.label}</div>
                        <div className="text-[9px] text-slate-400 leading-tight">{ft.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Extra config for link_to_record and lookup */}
              {(addColumnModal.type === 'link_to_record' || addColumnModal.type === 'lookup') && (
                <div className="mb-4 space-y-3 border border-slate-100 rounded-xl p-3 bg-slate-50">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Linked table</label>
                    <select
                      className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-[12px] text-slate-900 bg-white focus:ring-2 focus:ring-brand-primary/30 outline-none"
                      value={addColumnModal.linkedTable}
                      onChange={e => setAddColumnModal({ ...addColumnModal, linkedTable: e.target.value, lookupField: '' })}
                    >
                      <option value="">Select table…</option>
                      {['Events','Session','MusicLog','VideoLog','Tracks','DyatraChecklist','Guidance & Learning','LED','DataSharing','VideoSetup','AudioSetup']
                        .filter(t => t !== activeTable)
                        .map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  {addColumnModal.type === 'lookup' && addColumnModal.linkedTable && (() => {
                    const baseColsMap: Record<string, string[]> = {
                      'Events': ['Event Name', 'DateFrom', 'DateTo', 'Occasion', 'City', 'Venue', 'Sessions', 'Year'],
                      'Session': ['Session Name', 'Parent Event', 'Date', 'City', 'Venue', 'Time Of Day', 'Occasion', 'SessionType', 'Notes'],
                      'MusicLog': ['PlayID', 'Session', 'Parent Event (from Session)', 'Date (from Session)', 'TimeOfDay (from Session)', 'Occasion (from Session)', 'Order', 'PlayedAt', 'Track', 'Theme', 'Relevance', 'Patrank', 'Topic', 'Cue', 'Notes', 'PPG', 'TrackID'],
                      'VideoLog': ['VideoPlayId', 'Session', 'Date (from Session)', 'City (from Session)', 'Venue (from Session)', 'Parent Event (from Session)', 'TimeOfDay (from Session)', 'Occasion (from Session)', 'SessionType (from Session)', 'VideoTitle', 'Duration', 'ProposalsList'],
                      'Tracks': ['PlayID', 'Title', 'Artist', 'Album', 'Duration', 'DurationTime', 'BPM', 'Key', 'Source', 'FileLink', 'Tags', 'Lyrics', 'LexiconID', 'LastUpdated', 'Plays'],
                      'DyatraChecklist': ['Task', 'Details', 'TaskGroup', 'OrderId', 'People Involved', 'Typical Timeline', 'Category', 'Period', 'Attachment'],
                      'Guidance & Learning': ['LearningId', 'Event', 'DateFrom (from Event)', 'DateTo (from Event)', 'Year (from Event)', 'City', 'GuidanceFrom', 'Guidance/Learning', 'Category', 'Attachments'],
                      'LED': ['LedId', '🕘 Session', 'Parent Event (from 🕘 Session)', 'Date (from 🕘 Session)', 'City (from 🕘 Session)', 'Venue (from 🕘 Session)', 'Indoor/Outdoor LED?', 'CentreLed', 'CntrPitch', 'CntrWdth', 'CntrHt', 'CntrRiser', 'Stageht', 'SideLed', 'SidePitch', 'SideWdth', 'SideHt', 'OtherLed1', 'OtherPitch', 'OtherWdth', 'OtherHt', 'OtherLed2', 'is Led Required?', 'Other2Wdth', 'Other2Ht', 'DGUseedKva', 'BackupPower', 'Vendor', 'Images'],
                      'DataSharing': ['Sevak', 'Dept', 'EmailId', 'ShareFacts?', 'ShareData'],
                      'VideoSetup': ['Name', 'Notes', 'Assignee', 'Status', 'Attachments', 'Attachment Summary'],
                      'AudioSetup': ['Name', 'Notes', 'Assignee', 'Status', 'Attachments', 'Attachment Summary'],
                    };
                    const predefined = baseColsMap[addColumnModal.linkedTable] || [];
                    const extras = extraColumns[addColumnModal.linkedTable] || [];
                    const dataKeys = (getDataForTable(addColumnModal.linkedTable)[0]
                      ? Object.keys(getDataForTable(addColumnModal.linkedTable)[0]).filter(f => !['_id','id','created_at','__v'].includes(f))
                      : []);
                    const linkedFields = [...new Set([...predefined, ...extras, ...dataKeys])];
                    return (
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Field to look up</label>
                        <select
                          className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-[12px] text-slate-900 bg-white focus:ring-2 focus:ring-brand-primary/30 outline-none"
                          value={addColumnModal.lookupField}
                          onChange={e => setAddColumnModal({ ...addColumnModal, lookupField: e.target.value, name: addColumnModal.name || `${e.target.value} (from ${addColumnModal.linkedTable})` })}
                        >
                          <option value="">Select field…</option>
                          {linkedFields.map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                        {addColumnModal.lookupField && (
                          <p className="text-[9px] text-slate-400 mt-1">Will display as: <span className="text-brand-primary font-semibold">{addColumnModal.lookupField} (from {addColumnModal.linkedTable})</span></p>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* sticky footer */}
            <div className="px-5 py-3 border-t border-slate-100 flex gap-2 shrink-0">
              <button onClick={() => setAddColumnModal(null)} className="flex-1 py-2 border border-slate-200 rounded-lg text-[12px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
              <button onClick={confirmAddColumn} className="flex-1 py-2 bg-brand-primary text-white rounded-lg text-[12px] font-semibold hover:bg-brand-primary/90 transition-colors">Add field</button>
            </div>
          </div>
        </>
      )}

      {/* EDIT COLUMN TYPE MODAL */}
      {editColumnModal && (
        <>
          <div className="fixed inset-0 z-[600] bg-black/20" onClick={() => setEditColumnModal(null)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[601] w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col max-h-[80vh]">
            {/* sticky header */}
            <div className="px-5 pt-5 pb-3 shrink-0">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide mb-0.5">Edit field</h3>
              <p className="text-[11px] text-slate-500 font-medium truncate">{editColumnModal.col}</p>
            </div>

            {/* scrollable body */}
            <div className="flex-1 overflow-y-auto px-5 pb-1 min-h-0">
              <div className="mb-4">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Field type</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {FIELD_TYPES.map(ft => (
                    <button
                      key={ft.id}
                      onClick={() => setEditColumnModal({ ...editColumnModal, type: ft.id })}
                      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border transition-all text-left ${editColumnModal.type === ft.id ? 'border-brand-primary bg-brand-primary/5 text-brand-primary' : 'border-slate-200 hover:border-slate-300 text-slate-600 hover:bg-slate-50'}`}
                    >
                      <ft.icon className="h-3 w-3 shrink-0" />
                      <div>
                        <div className="text-[11px] font-semibold leading-tight">{ft.label}</div>
                        <div className="text-[9px] text-slate-400 leading-tight">{ft.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Extra config for link_to_record and lookup */}
              {(editColumnModal.type === 'link_to_record' || editColumnModal.type === 'lookup') && (
                <div className="mb-4 space-y-3 border border-slate-100 rounded-xl p-3 bg-slate-50">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Linked table</label>
                    <select
                      className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-[12px] text-slate-900 bg-white focus:ring-2 focus:ring-brand-primary/30 outline-none"
                      value={editColumnModal.linkedTable}
                      onChange={e => setEditColumnModal({ ...editColumnModal, linkedTable: e.target.value, lookupField: '' })}
                    >
                      <option value="">Select table…</option>
                      {['Events','Session','MusicLog','VideoLog','Tracks','DyatraChecklist','Guidance & Learning','LED','DataSharing','VideoSetup','AudioSetup']
                        .filter(t => t !== activeTable)
                        .map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  {editColumnModal.type === 'lookup' && editColumnModal.linkedTable && (() => {
                    const baseColsMap: Record<string, string[]> = {
                      'Events': ['Event Name', 'DateFrom', 'DateTo', 'Occasion', 'City', 'Venue', 'Sessions', 'Year'],
                      'Session': ['Session Name', 'Parent Event', 'Date', 'City', 'Venue', 'Time Of Day', 'Occasion', 'SessionType', 'Notes'],
                      'MusicLog': ['PlayID', 'Session', 'Parent Event (from Session)', 'Date (from Session)', 'TimeOfDay (from Session)', 'Occasion (from Session)', 'Order', 'PlayedAt', 'Track', 'Theme', 'Relevance', 'Patrank', 'Topic', 'Cue', 'Notes', 'PPG', 'TrackID'],
                      'VideoLog': ['VideoPlayId', 'Session', 'Date (from Session)', 'City (from Session)', 'Venue (from Session)', 'Parent Event (from Session)', 'TimeOfDay (from Session)', 'Occasion (from Session)', 'SessionType (from Session)', 'VideoTitle', 'Duration', 'ProposalsList'],
                      'Tracks': ['PlayID', 'Title', 'Artist', 'Album', 'Duration', 'DurationTime', 'BPM', 'Key', 'Source', 'FileLink', 'Tags', 'Lyrics', 'LexiconID', 'LastUpdated', 'Plays'],
                      'DyatraChecklist': ['Task', 'Details', 'TaskGroup', 'OrderId', 'People Involved', 'Typical Timeline', 'Category', 'Period', 'Attachment'],
                      'Guidance & Learning': ['LearningId', 'Event', 'DateFrom (from Event)', 'DateTo (from Event)', 'Year (from Event)', 'City', 'GuidanceFrom', 'Guidance/Learning', 'Category', 'Attachments'],
                      'LED': ['LedId', '🕘 Session', 'Parent Event (from 🕘 Session)', 'Date (from 🕘 Session)', 'City (from 🕘 Session)', 'Venue (from 🕘 Session)', 'Indoor/Outdoor LED?', 'CentreLed', 'CntrPitch', 'CntrWdth', 'CntrHt', 'CntrRiser', 'Stageht', 'SideLed', 'SidePitch', 'SideWdth', 'SideHt', 'OtherLed1', 'OtherPitch', 'OtherWdth', 'OtherHt', 'OtherLed2', 'is Led Required?', 'Other2Wdth', 'Other2Ht', 'DGUseedKva', 'BackupPower', 'Vendor', 'Images'],
                      'DataSharing': ['Sevak', 'Dept', 'EmailId', 'ShareFacts?', 'ShareData'],
                      'VideoSetup': ['Name', 'Notes', 'Assignee', 'Status', 'Attachments', 'Attachment Summary'],
                      'AudioSetup': ['Name', 'Notes', 'Assignee', 'Status', 'Attachments', 'Attachment Summary'],
                    };
                    const predefined = baseColsMap[editColumnModal.linkedTable] || [];
                    const extras = extraColumns[editColumnModal.linkedTable] || [];
                    const dataKeys = (getDataForTable(editColumnModal.linkedTable)[0]
                      ? Object.keys(getDataForTable(editColumnModal.linkedTable)[0]).filter(f => !['_id','id','created_at','__v'].includes(f))
                      : []);
                    const linkedFields = [...new Set([...predefined, ...extras, ...dataKeys])];
                    return (
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Field to look up</label>
                        <select
                          className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-[12px] text-slate-900 bg-white focus:ring-2 focus:ring-brand-primary/30 outline-none"
                          value={editColumnModal.lookupField}
                          onChange={e => setEditColumnModal({ ...editColumnModal, lookupField: e.target.value })}
                        >
                          <option value="">Select field…</option>
                          {linkedFields.map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                        {editColumnModal.lookupField && (
                          <p className="text-[9px] text-slate-400 mt-1">Will display as: <span className="text-brand-primary font-semibold">{editColumnModal.lookupField} (from {editColumnModal.linkedTable})</span></p>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* sticky footer */}
            <div className="px-5 py-3 border-t border-slate-100 flex gap-2 shrink-0">
              <button onClick={() => setEditColumnModal(null)} className="flex-1 py-2 border border-slate-200 rounded-lg text-[12px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
              <button onClick={confirmEditColumnType} className="flex-1 py-2 bg-brand-primary text-white rounded-lg text-[12px] font-semibold hover:bg-brand-primary/90 transition-colors">Save</button>
            </div>
          </div>
        </>
      )}

      {/* Add Record Modal - Desktop only */}
      {!isMobileView && <Dialog open={isAddModalOpen} onOpenChange={(open, details) => {
        if (!open) {
          const target = (details as any)?.event?.target as Element | null;
          if (target?.closest?.('[data-floating-panel]')) return;
        }
        setIsAddModalOpen(open);
      }}>
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
            <div className="h-10 border border-slate-200 rounded-xl overflow-visible bg-white">
              <CellDropdown value={newRecord.Occasion || ''} options={[...new Set([...occasionOpts, ...(customTags['Events']?.['Occasion'] || [])])]} onAddOption={val => handleAddCustomTag('Events', 'Occasion', val)} removableOptions={[...new Set([...occasionOpts, ...(customTags['Events']?.['Occasion'] || [])])]} onRemoveOption={val => handleRemoveTagGlobally('Events', 'Occasion', val)} onCommit={val => setNewRecord({...newRecord, Occasion: val})} onCancel={() => {}} placeholder="Occasion…" tagClass="bg-blue-600 text-white text-[12px] font-semibold px-2 py-0.5 rounded-sm" />
            </div>
            <div className="h-10 border border-slate-200 rounded-xl overflow-visible bg-white">
              <CellDropdown value={newRecord.City || ''} options={[...new Set([...cityOpts, ...(customTags['Events']?.['City'] || [])])]} onAddOption={val => handleAddCustomTag('Events', 'City', val)} removableOptions={[...new Set([...cityOpts, ...(customTags['Events']?.['City'] || [])])]} onRemoveOption={val => handleRemoveTagGlobally('Events', 'City', val)} onCommit={val => setNewRecord({...newRecord, City: val})} onCancel={() => {}} placeholder="City…" tagClass="bg-orange-500 text-white text-[12px] font-semibold px-2 py-0.5 rounded-sm" />
            </div>
            <div className="h-10 border border-slate-200 rounded-xl overflow-visible bg-white">
              <CellDropdown value={newRecord.Year || ''} options={yearOpts} onCommit={val => setNewRecord({...newRecord, Year: val})} onCancel={() => {}} placeholder="Year…" tagClass="bg-brand-primary/10 text-brand-primary text-[12px] font-black px-3 py-0.5 rounded-sm border border-brand-primary/20" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-text-muted">Linked Sessions</label>
            <SessionPicker value={newRecord.Sessions || ''} allSessions={sessions} onCommit={val => setNewRecord({...newRecord, Sessions: val})} onCancel={() => {}} />
          </div>
        </div>
      );
    })()}
    {/* SESSION FIELDS */}
   {activeTable === 'Session' && (() => {
  const eventOpts = events.map((e: any) => e["Event Name"]).filter(Boolean).sort() as string[];
  const timeOpts = [...new Set(sessions.map((s: any) => s["Time Of Day"]).filter(Boolean))].sort() as string[];
  const sessOccasionOpts = [...new Set(sessions.map((s: any) => s.Occasion).filter(Boolean).flatMap((o: string) => o.split(',').map((x: string) => x.trim())).filter(Boolean))].sort() as string[];
  const sessionTypeOpts = [...new Set(sessions.map((s: any) => s.SessionType).filter(Boolean))].sort() as string[];
  const sessionCityOpts = [...new Set([...events.map((e: any) => e.City), ...sessions.map((s: any) => s.City)].filter(Boolean).flatMap((c: string) => c.split(',').map((x: string) => x.trim())).filter(Boolean))].sort() as string[];
  return (
  <>
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-text-muted">Session Name</label>
        <Input value={newRecord.name || ''} onChange={(e) => setNewRecord({...newRecord, name: e.target.value})} placeholder="Session Name" className="bg-brand-bg" />
      </div>
      <div className="space-y-2">
        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-text-muted">Parent Event</label>
        <div className="h-10 border border-slate-200 rounded-xl overflow-visible bg-white">
          <CellDropdown value={newRecord.parentEvent || ''} options={[...new Set([...eventOpts, ...(customTags['Session']?.['Parent Event'] || [])])]} onAddOption={val => handleAddCustomTag('Session', 'Parent Event', val)} removableOptions={[...new Set([...eventOpts, ...(customTags['Session']?.['Parent Event'] || [])])]} onRemoveOption={val => handleRemoveTagGlobally('Session', 'Parent Event', val)} onCommit={val => setNewRecord({...newRecord, parentEvent: val})} onCancel={() => {}} placeholder="Select event…" />
        </div>
      </div>
    </div>

    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      <div className="space-y-2">
        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-text-muted">Date</label>
        <Input type="date" value={newRecord.date || ''} onChange={(e) => setNewRecord({...newRecord, date: e.target.value})} className="bg-brand-bg" />
      </div>
      <div className="space-y-2">
        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-text-muted">City</label>
        <div className="h-10 border border-slate-200 rounded-xl overflow-visible bg-white">
          <CellDropdown value={newRecord.city || ''} options={[...new Set([...sessionCityOpts, ...(customTags['Session']?.['City'] || [])])]} onAddOption={val => handleAddCustomTag('Session', 'City', val)} removableOptions={[...new Set([...sessionCityOpts, ...(customTags['Session']?.['City'] || [])])]} onRemoveOption={val => handleRemoveTagGlobally('Session', 'City', val)} onCommit={val => setNewRecord({...newRecord, city: val})} onCancel={() => {}} placeholder="Select city…" tagClass="bg-orange-500 text-white text-[12px] font-semibold px-2 py-0.5 rounded-sm" />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-text-muted">Venue</label>
        <Input value={newRecord.venue || ''} onChange={(e) => setNewRecord({...newRecord, venue: e.target.value})} placeholder="Venue" className="bg-brand-bg" />
      </div>
    </div>

    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      <div className="space-y-2">
        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-text-muted">Time Of Day</label>
        <div className="h-10 border border-slate-200 rounded-xl overflow-visible bg-white">
          <CellDropdown value={newRecord.timeOfDay || ''} options={[...new Set([...timeOpts, ...(customTags['Session']?.['Time Of Day'] || [])])]} onAddOption={val => handleAddCustomTag('Session', 'Time Of Day', val)} removableOptions={[...new Set([...timeOpts, ...(customTags['Session']?.['Time Of Day'] || [])])]} onRemoveOption={val => handleRemoveTagGlobally('Session', 'Time Of Day', val)} onCommit={val => setNewRecord({...newRecord, timeOfDay: val})} onCancel={() => {}} placeholder="Morning / Evening…" tagClass="bg-orange-500 text-white text-[11px] font-semibold px-2 py-0.5 rounded-sm" />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-text-muted">Occasion</label>
        <div className="h-10 border border-slate-200 rounded-xl overflow-visible bg-white">
          <CellDropdown value={newRecord.occasion || ''} options={[...new Set([...sessOccasionOpts, ...(customTags['Session']?.['Occasion'] || [])])]} onAddOption={val => handleAddCustomTag('Session', 'Occasion', val)} removableOptions={[...new Set([...sessOccasionOpts, ...(customTags['Session']?.['Occasion'] || [])])]} onRemoveOption={val => handleRemoveTagGlobally('Session', 'Occasion', val)} onCommit={val => setNewRecord({...newRecord, occasion: val})} onCancel={() => {}} placeholder="Select occasion…" tagClass="bg-blue-600 text-white text-[12px] font-semibold px-2 py-0.5 rounded-sm" />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-text-muted">Session Type</label>
        <div className="h-10 border border-slate-200 rounded-xl overflow-visible bg-white">
          <CellDropdown value={newRecord.sessionType || ''} options={[...new Set([...sessionTypeOpts, ...(customTags['Session']?.['SessionType'] || [])])]} onAddOption={val => handleAddCustomTag('Session', 'SessionType', val)} removableOptions={[...new Set([...sessionTypeOpts, ...(customTags['Session']?.['SessionType'] || [])])]} onRemoveOption={val => handleRemoveTagGlobally('Session', 'SessionType', val)} onCommit={val => setNewRecord({...newRecord, sessionType: val})} onCancel={() => {}} placeholder="Select type…" />
        </div>
      </div>
    </div>

    <div className="space-y-2">
      <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-text-muted">Notes</label>
      <Textarea value={newRecord.notes || ''} onChange={(e) => setNewRecord({...newRecord, notes: e.target.value})} placeholder="Additional details..." className="bg-brand-bg min-h-[80px]" />
    </div>
  </>
  );
})()}

{/* MUSIC LOG FIELDS - 17 Columns Compact View */}
{activeTable === 'MusicLog' && (
  <div className="space-y-6">
    <div className="p-3 bg-brand-primary/5 border border-brand-primary/10 rounded-lg">
      <p className="text-[9px] font-black uppercase tracking-widest text-brand-primary mb-3">Event & Session Context</p>
      <div className="grid grid-cols-2 gap-3">
        <Input value={newRecord.playId || ''} onChange={(e) => setNewRecord({...newRecord, playId: e.target.value})} placeholder="PlayID" className="bg-brand-bg h-9 text-xs" />
        <div className="col-span-2 space-y-1">
          <label className="text-[9px] font-black uppercase tracking-widest text-brand-primary">Session</label>
          <div className="h-10 border border-slate-200 rounded-xl overflow-visible bg-white">
            <CellDropdown
              value={newRecord.session || ''}
              options={sessions.map((s: any) => s["Session Name"]).filter(Boolean)}
              onCommit={val => {
                const s = sessions.find((x: any) => x["Session Name"] === val);
                const norm = (d: any) => d ? String(d).split('T')[0] : '';
                if (s) setNewRecord((prev: any) => ({ ...prev, session: s["Session Name"], parentEvent: s["Parent Event"] || '', date: norm(s["Date"]), timeOfDay: s["Time Of Day"] || '', occasion: s["Occasion"] || '' }));
                else setNewRecord((prev: any) => ({ ...prev, session: val }));
              }}
              onCancel={() => {}}
              placeholder="Select session…"
              tagClass="bg-brand-primary/10 text-brand-primary text-[11px] font-semibold px-2 py-0.5 rounded-sm border border-brand-primary/20"
            />
          </div>
        </div>
        <Input value={newRecord.parentEvent || ''} onChange={(e) => setNewRecord((prev: any) => ({...prev, parentEvent: e.target.value}))} placeholder="Parent Event" className="bg-brand-bg h-9 text-xs" />
        <Input value={newRecord.date || ''} onChange={(e) => setNewRecord((prev: any) => ({...prev, date: e.target.value}))} placeholder="Date" className="bg-brand-bg h-9 text-xs" />
        <Input value={newRecord.timeOfDay || ''} onChange={(e) => setNewRecord((prev: any) => ({...prev, timeOfDay: e.target.value}))} placeholder="Time of Day" className="bg-brand-bg h-9 text-xs" />
        <Input value={newRecord.occasion || ''} onChange={(e) => setNewRecord((prev: any) => ({...prev, occasion: e.target.value}))} placeholder="Occasion" className="bg-brand-bg h-9 text-xs" />
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
          <div className="h-10 border border-slate-200 rounded-xl overflow-visible bg-white">
            <CellDropdown
              value={newRecord.session || ''}
              options={sessions.map((s: any) => s["Session Name"]).filter(Boolean)}
              onCommit={val => {
                const s = sessions.find((x: any) => x["Session Name"] === val);
                if (s) setNewRecord({ ...newRecord, session: s["Session Name"], parentEvent: s["Parent Event"], date: s["Date"], city: s["City"], venue: s["Venue"], timeOfDay: s["Time Of Day"], occasion: s["Occasion"], sessionType: s["SessionType"] });
                else setNewRecord({ ...newRecord, session: val });
              }}
              onCancel={() => {}}
              placeholder="Select session…"
              tagClass="bg-brand-primary/10 text-brand-primary text-[11px] font-semibold px-2 py-0.5 rounded-sm border border-brand-primary/20"
            />
          </div>
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
      <Input type="date" value={newRecord.dateFrom || ''} onChange={(e) => setNewRecord({...newRecord, dateFrom: e.target.value})} placeholder="Start Date" className="bg-brand-bg text-xs" />
      <Input type="date" value={newRecord.dateTo || ''} onChange={(e) => setNewRecord({...newRecord, dateTo: e.target.value})} placeholder="End Date" className="bg-brand-bg text-xs" />
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
      <p className="text-[9px] font-black uppercase tracking-widest text-brand-primary">Session & Location Context</p>
      <div className="grid grid-cols-2 gap-3">
        <Input value={newRecord["LedId"] || ''} onChange={(e) => setNewRecord({...newRecord, "LedId": e.target.value})} placeholder="LedId" className="bg-brand-bg h-9 text-xs" />
        <Input value={newRecord["🕘 Session"] || ''} onChange={(e) => setNewRecord({...newRecord, "🕘 Session": e.target.value})} placeholder="🕘 Session" className="bg-brand-bg h-9 text-xs" />
        <Input value={newRecord["Parent Event (from 🕘 Session)"] || ''} onChange={(e) => setNewRecord({...newRecord, "Parent Event (from 🕘 Session)": e.target.value})} placeholder="Parent Event" className="bg-brand-bg h-9 text-xs" />
        <Input type="date" value={newRecord["Date (from 🕘 Session)"] || ''} onChange={(e) => setNewRecord({...newRecord, "Date (from 🕘 Session)": e.target.value})} className="bg-brand-bg h-9 text-xs" />
        <Input value={newRecord["City (from 🕘 Session)"] || ''} onChange={(e) => setNewRecord({...newRecord, "City (from 🕘 Session)": e.target.value})} placeholder="City" className="bg-brand-bg h-9 text-xs" />
        <Input value={newRecord["Venue (from 🕘 Session)"] || ''} onChange={(e) => setNewRecord({...newRecord, "Venue (from 🕘 Session)": e.target.value})} placeholder="Venue" className="bg-brand-bg h-9 text-xs" />
      </div>
    </div>

    <div className="p-3 border border-slate-200 rounded-lg space-y-3">
      <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Core Setup</p>
      <div className="grid grid-cols-2 gap-3">
        <Input value={newRecord["Vendor"] || ''} onChange={(e) => setNewRecord({...newRecord, "Vendor": e.target.value})} placeholder="Vendor Name" className="bg-brand-bg h-9 text-xs" />
        <select className="bg-brand-bg border border-slate-200 rounded-lg h-9 text-xs px-2" value={newRecord["Indoor/Outdoor LED?"] || ''} onChange={(e) => setNewRecord({...newRecord, "Indoor/Outdoor LED?": e.target.value})}>
           <option value="">Indoor/Outdoor?</option>
           <option value="Indoor">Indoor</option>
           <option value="Outdoor">Outdoor</option>
        </select>
        <Input value={newRecord["is Led Required?"] || ''} onChange={(e) => setNewRecord({...newRecord, "is Led Required?": e.target.value})} placeholder="LED Required (Yes/No)" className="bg-brand-bg h-9 text-xs" />
        <Input value={newRecord["Stageht"] || ''} onChange={(e) => setNewRecord({...newRecord, "Stageht": e.target.value})} placeholder="Stage Height" className="bg-brand-bg h-9 text-xs" />
      </div>
    </div>

    <div className="grid grid-cols-1 gap-4">
      {/* Centre LED */}
      <div className="p-3 border border-slate-200 rounded-lg space-y-2">
        <p className="text-[9px] font-black uppercase tracking-widest text-blue-500">Centre LED</p>
        <Input value={newRecord["CentreLed"] || ''} onChange={(e) => setNewRecord({...newRecord, "CentreLed": e.target.value})} placeholder="CentreLed Name" className="bg-brand-bg h-8 text-xs mb-2" />
        <div className="grid grid-cols-4 gap-2">
          <Input value={newRecord["CntrPitch"] || ''} onChange={(e) => setNewRecord({...newRecord, "CntrPitch": e.target.value})} placeholder="Pitch" className="h-8 text-[10px]" />
          <Input value={newRecord["CntrWdth"] || ''} onChange={(e) => setNewRecord({...newRecord, "CntrWdth": e.target.value})} placeholder="Width" className="h-8 text-[10px]" />
          <Input value={newRecord["CntrHt"] || ''} onChange={(e) => setNewRecord({...newRecord, "CntrHt": e.target.value})} placeholder="Height" className="h-8 text-[10px]" />
          <Input value={newRecord["CntrRiser"] || ''} onChange={(e) => setNewRecord({...newRecord, "CntrRiser": e.target.value})} placeholder="Riser" className="h-8 text-[10px]" />
        </div>
      </div>

      {/* Side LED */}
      <div className="p-3 border border-slate-200 rounded-lg space-y-2">
        <p className="text-[9px] font-black uppercase tracking-widest text-purple-500">Side LED</p>
        <Input value={newRecord["SideLed"] || ''} onChange={(e) => setNewRecord({...newRecord, "SideLed": e.target.value})} placeholder="SideLed Name" className="bg-brand-bg h-8 text-xs mb-2" />
        <div className="grid grid-cols-3 gap-2">
          <Input value={newRecord["SidePitch"] || ''} onChange={(e) => setNewRecord({...newRecord, "SidePitch": e.target.value})} placeholder="Pitch" className="h-8 text-[10px]" />
          <Input value={newRecord["SideWdth"] || ''} onChange={(e) => setNewRecord({...newRecord, "SideWdth": e.target.value})} placeholder="Width" className="h-8 text-[10px]" />
          <Input value={newRecord["SideHt"] || ''} onChange={(e) => setNewRecord({...newRecord, "SideHt": e.target.value})} placeholder="Height" className="h-8 text-[10px]" />
        </div>
      </div>

      {/* Other LED 1 & 2 */}
      <div className="p-3 border border-slate-200 rounded-lg space-y-2">
        <p className="text-[9px] font-black uppercase tracking-widest text-orange-500">Auxiliary LED (Other 1 & 2)</p>
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

    <div className="p-3 border border-slate-200 rounded-lg space-y-3">
      <p className="text-[9px] font-black uppercase tracking-widest text-red-500">Power & Media</p>
      <div className="grid grid-cols-2 gap-3">
        <Input value={newRecord["DGUseedKva"] || ''} onChange={(e) => setNewRecord({...newRecord, "DGUseedKva": e.target.value})} placeholder="DG Use (KVA)" className="bg-brand-bg h-9 text-xs" />
        <Input value={newRecord["BackupPower"] || ''} onChange={(e) => setNewRecord({...newRecord, "BackupPower": e.target.value})} placeholder="Backup Power" className="bg-brand-bg h-9 text-xs" />
      </div>
      <Input value={newRecord["Images"] || ''} onChange={(e) => setNewRecord({...newRecord, "Images": e.target.value})} placeholder="Image URLs (https://...)" className="bg-brand-bg h-9 text-xs" />
    </div>
  </div>
)}

    {/* VIDEO SETUP & AUDIO SETUP */}
    {(activeTable === 'VideoSetup' || activeTable === 'AudioSetup') && (() => {
      const assigneeOpts = [...new Set(locations.map((item: any) => item["Sevak"]).filter(Boolean).map(String))].sort();
      return (
      <>
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-text-muted">Name</label>
          <Input value={newRecord.name || ''} onChange={(e) => setNewRecord({...newRecord, name: e.target.value})} placeholder="Equipment/Setup Name" className="bg-brand-bg" />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-text-muted">Notes</label>
          <Input value={newRecord.notes || ''} onChange={(e) => setNewRecord({...newRecord, notes: e.target.value})} placeholder="Additional notes" className="bg-brand-bg" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-text-muted">Assignee</label>
            <select
              className="w-full h-9 bg-brand-bg border border-brand-border rounded-md px-3 text-sm text-brand-text focus:ring-2 focus:ring-brand-primary outline-none"
              value={newRecord.assignee || ''}
              onChange={(e) => setNewRecord({...newRecord, assignee: e.target.value})}
            >
              <option value="">Select Assignee...</option>
              {assigneeOpts.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-text-muted">Status</label>
            <select
              className="w-full h-9 bg-brand-bg border border-brand-border rounded-md px-3 text-sm text-brand-text focus:ring-2 focus:ring-brand-primary outline-none"
              value={newRecord.status || ''}
              onChange={(e) => setNewRecord({...newRecord, status: e.target.value})}
            >
              <option value="">Select Status...</option>
              <option value="To Do">To Do</option>
              <option value="In Progress">In Progress</option>
              <option value="Done">Done</option>
            </select>
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-text-muted">Attachments (Images)</label>
          <Input value={newRecord.attachments || ''} onChange={(e) => setNewRecord({...newRecord, attachments: e.target.value})} placeholder="Upload images after saving or enter URL" className="bg-brand-bg" />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-text-muted">Attachment Summary</label>
          <Input value={newRecord.attachmentSummary || ''} onChange={(e) => setNewRecord({...newRecord, attachmentSummary: e.target.value})} placeholder="Summary of attachments" className="bg-brand-bg" />
        </div>
      </>
      );
    })()}

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
      <label className="text-[10px] font-bold uppercase text-slate-500">Sharing Facts</label>
      <select className="w-full bg-brand-bg border border-slate-200 rounded-md h-10 px-3 text-sm focus:ring-2 focus:ring-brand-primary outline-none" value={newRecord["ShareFacts?"] || ''} onChange={(e) => setNewRecord({...newRecord, "ShareFacts?": e.target.value})}>
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
      </Dialog>}

      {/* Mobile Add Wizard - bottom sheet wizard for new records */}
      {isMobileView && isAddModalOpen && (() => {
        const inputCls = "w-full h-11 bg-white border border-slate-200 rounded-xl px-3.5 text-[13px] font-medium text-slate-900 placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all";
        const labelCls = "text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] block mb-2";
        const occasionOpts = [...new Set(events.map((e: any) => e.Occasion).filter(Boolean).flatMap((o: string) => o.split(',').map((x: string) => x.trim())).filter(Boolean))].sort() as string[];
        const cityOpts = [...new Set([...events.map((e: any) => e.City), ...sessions.map((s: any) => s.City)].filter(Boolean).flatMap((c: string) => c.split(',').map((x: string) => x.trim())).filter(Boolean))].sort() as string[];
        const yr = new Date().getFullYear();
        const yearOpts = Array.from({ length: 11 }, (_, k) => String(yr + 2 - k));
        const sessionOpts = sessions.map((s: any) => s["Session Name"]).filter(Boolean);

        type WizardStep = { label: string; content: React.ReactNode };
        let wizardSteps: WizardStep[] = [];

        if (activeTable === 'Events') {
          const selectedSessions: string[] = newRecord.Sessions ? newRecord.Sessions.split(',').map((x: string) => x.trim()).filter(Boolean) : [];
          wizardSteps = [
            {
              label: 'Event Info',
              content: (
                <div className="space-y-5">
                  <div>
                    <label className={labelCls}>Event Name</label>
                    <input className={inputCls} value={newRecord["Event Name"] || ''} onChange={e => setNewRecord({...newRecord, "Event Name": e.target.value})} placeholder="Enter event name…" />
                  </div>
                  <div>
                    <label className={labelCls}>Venue</label>
                    <input className={inputCls} value={newRecord.Venue || ''} onChange={e => setNewRecord({...newRecord, Venue: e.target.value})} placeholder="Venue name…" />
                  </div>
                </div>
              )
            },
            {
              label: 'Schedule',
              content: (
                <div className="space-y-5">
                  <div>
                    <label className={labelCls}>{colLabel('DateFrom')}</label>
                    <input type="date" className={inputCls} value={newRecord.DateFrom || ''} onChange={e => setNewRecord({...newRecord, DateFrom: e.target.value})} />
                  </div>
                  <div>
                    <label className={labelCls}>{colLabel('DateTo')}</label>
                    <input type="date" className={inputCls} value={newRecord.DateTo || ''} onChange={e => setNewRecord({...newRecord, DateTo: e.target.value})} />
                  </div>
                </div>
              )
            },
            {
              label: 'Classification',
              content: (
                <div className="space-y-5">
                  <div>
                    <label className={labelCls}>Occasion</label>
                    <CellDropdown value={newRecord.Occasion || ''} options={[...new Set([...occasionOpts, ...(customTags['Events']?.['Occasion'] || [])])]} onAddOption={val => handleAddCustomTag('Events', 'Occasion', val)} removableOptions={[...new Set([...occasionOpts, ...(customTags['Events']?.['Occasion'] || [])])]} onRemoveOption={val => handleRemoveTagGlobally('Events', 'Occasion', val)} onCommit={val => setNewRecord({...newRecord, Occasion: val})} onCancel={() => {}} placeholder="Select occasion…" tagClass="bg-blue-600 text-white text-[12px] font-semibold px-2 py-0.5 rounded-sm" />
                  </div>
                  <div>
                    <label className={labelCls}>City</label>
                    <CellDropdown value={newRecord.City || ''} options={[...new Set([...cityOpts, ...(customTags['Events']?.['City'] || [])])]} onAddOption={val => handleAddCustomTag('Events', 'City', val)} removableOptions={[...new Set([...cityOpts, ...(customTags['Events']?.['City'] || [])])]} onRemoveOption={val => handleRemoveTagGlobally('Events', 'City', val)} onCommit={val => setNewRecord({...newRecord, City: val})} onCancel={() => {}} placeholder="Select city…" tagClass="bg-orange-500 text-white text-[12px] font-semibold px-2 py-0.5 rounded-sm" />
                  </div>
                  <div>
                    <label className={labelCls}>Year</label>
                    <CellDropdown value={newRecord.Year || ''} options={yearOpts} onCommit={val => setNewRecord({...newRecord, Year: val})} onCancel={() => {}} placeholder="Select year…" tagClass="bg-brand-primary/10 text-brand-primary text-[12px] font-black px-3 py-0.5 rounded-sm border border-brand-primary/20" />
                  </div>
                </div>
              )
            },
            {
              label: 'Sessions',
              content: (
                <div className="space-y-3">
                  <label className={labelCls}>Linked Sessions</label>
                  <SessionPicker value={newRecord.Sessions || ''} allSessions={sessions} onCommit={val => setNewRecord({...newRecord, Sessions: val})} onCancel={() => {}} />
                  {selectedSessions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {selectedSessions.map((name: string, i: number) => (
                        <span key={i} className="inline-flex items-center gap-1 bg-brand-primary/10 text-brand-primary text-[11px] font-bold px-2 py-1 rounded-sm border border-brand-primary/20">
                          {name}
                          <button onClick={() => setNewRecord({...newRecord, Sessions: selectedSessions.filter((_: any, fi: number) => fi !== i).join(', ')})} className="hover:text-red-500 font-bold">×</button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )
            },
          ];
        } else if (activeTable === 'Session') {
          const sessionCityOpts = [...new Set([...events.map((e: any) => e.City), ...sessions.map((s: any) => s.City)].filter(Boolean).flatMap((c: string) => c.split(',').map((x: string) => x.trim())).filter(Boolean))].sort() as string[];
          const eventOpts = events.map((e: any) => e["Event Name"]).filter(Boolean).sort() as string[];
          const timeOpts = [...new Set(sessions.map((s: any) => s["Time Of Day"]).filter(Boolean))].sort() as string[];
          const sessionTypeOpts = [...new Set(sessions.map((s: any) => s.SessionType).filter(Boolean))].sort() as string[];
          const sessOccasionOpts = [...new Set(sessions.map((s: any) => s.Occasion).filter(Boolean).flatMap((o: string) => o.split(',').map((x: string) => x.trim())).filter(Boolean))].sort() as string[];
          wizardSteps = [
            {
              label: 'Session Info',
              content: (
                <div className="space-y-5">
                  <div>
                    <label className={labelCls}>Session Name</label>
                    <input className={inputCls} value={newRecord.name || ''} onChange={e => setNewRecord({...newRecord, name: e.target.value})} placeholder="Session name…" />
                  </div>
                  <div>
                    <label className={labelCls}>Parent Event</label>
                    <CellDropdown value={newRecord.parentEvent || ''} options={[...new Set([...eventOpts, ...(customTags['Session']?.['Parent Event'] || [])])]} onAddOption={val => handleAddCustomTag('Session', 'Parent Event', val)} removableOptions={[...new Set([...eventOpts, ...(customTags['Session']?.['Parent Event'] || [])])]} onRemoveOption={val => handleRemoveTagGlobally('Session', 'Parent Event', val)} onCommit={val => setNewRecord({...newRecord, parentEvent: val})} onCancel={() => {}} placeholder="Select event…" />
                  </div>
                </div>
              )
            },
            {
              label: 'Schedule',
              content: (
                <div className="space-y-5">
                  <div>
                    <label className={labelCls}>Date</label>
                    <input type="date" className={inputCls} value={newRecord.date || ''} onChange={e => setNewRecord({...newRecord, date: e.target.value})} />
                  </div>
                  <div>
                    <label className={labelCls}>Time Of Day</label>
                    <CellDropdown value={newRecord.timeOfDay || ''} options={[...new Set([...timeOpts, ...(customTags['Session']?.['Time Of Day'] || [])])]} onAddOption={val => handleAddCustomTag('Session', 'Time Of Day', val)} removableOptions={[...new Set([...timeOpts, ...(customTags['Session']?.['Time Of Day'] || [])])]} onRemoveOption={val => handleRemoveTagGlobally('Session', 'Time Of Day', val)} onCommit={val => setNewRecord({...newRecord, timeOfDay: val})} onCancel={() => {}} placeholder="Morning / Evening…" tagClass="bg-orange-500 text-white text-[11px] font-semibold px-2 py-0.5 rounded-sm" />
                  </div>
                </div>
              )
            },
            {
              label: 'Location',
              content: (
                <div className="space-y-5">
                  <div>
                    <label className={labelCls}>City</label>
                    <CellDropdown value={newRecord.city || ''} options={[...new Set([...sessionCityOpts, ...(customTags['Session']?.['City'] || [])])]} onAddOption={val => handleAddCustomTag('Session', 'City', val)} removableOptions={[...new Set([...sessionCityOpts, ...(customTags['Session']?.['City'] || [])])]} onRemoveOption={val => handleRemoveTagGlobally('Session', 'City', val)} onCommit={val => setNewRecord({...newRecord, city: val})} onCancel={() => {}} placeholder="Select city…" tagClass="bg-orange-500 text-white text-[12px] font-semibold px-2 py-0.5 rounded-sm" />
                  </div>
                  <div>
                    <label className={labelCls}>Venue</label>
                    <input className={inputCls} value={newRecord.venue || ''} onChange={e => setNewRecord({...newRecord, venue: e.target.value})} placeholder="Venue…" />
                  </div>
                </div>
              )
            },
            {
              label: 'Type & Notes',
              content: (
                <div className="space-y-5">
                  <div>
                    <label className={labelCls}>Occasion</label>
                    <CellDropdown value={newRecord.occasion || ''} options={[...new Set([...sessOccasionOpts, ...(customTags['Session']?.['Occasion'] || [])])]} onAddOption={val => handleAddCustomTag('Session', 'Occasion', val)} removableOptions={[...new Set([...sessOccasionOpts, ...(customTags['Session']?.['Occasion'] || [])])]} onRemoveOption={val => handleRemoveTagGlobally('Session', 'Occasion', val)} onCommit={val => setNewRecord({...newRecord, occasion: val})} onCancel={() => {}} placeholder="Select occasion…" tagClass="bg-blue-600 text-white text-[12px] font-semibold px-2 py-0.5 rounded-sm" />
                  </div>
                  <div>
                    <label className={labelCls}>Session Type</label>
                    <CellDropdown value={newRecord.sessionType || ''} options={[...new Set([...sessionTypeOpts, ...(customTags['Session']?.['SessionType'] || [])])]} onAddOption={val => handleAddCustomTag('Session', 'SessionType', val)} removableOptions={[...new Set([...sessionTypeOpts, ...(customTags['Session']?.['SessionType'] || [])])]} onRemoveOption={val => handleRemoveTagGlobally('Session', 'SessionType', val)} onCommit={val => setNewRecord({...newRecord, sessionType: val})} onCancel={() => {}} placeholder="Select type…" />
                  </div>
                  <div>
                    <label className={labelCls}>Notes</label>
                    <textarea className={`${inputCls} h-24 resize-none py-2.5`} value={newRecord.notes || ''} onChange={e => setNewRecord({...newRecord, notes: e.target.value})} placeholder="Additional notes…" />
                  </div>
                </div>
              )
            },
          ];
        } else if (activeTable === 'MusicLog') {
          wizardSteps = [
            {
              label: 'Session Context',
              content: (
                <div className="space-y-5">
                  <div>
                    <label className={labelCls}>Session</label>
                    <CellDropdown value={newRecord.session || ''} options={sessionOpts} onCommit={val => {
                      const s = sessions.find((x: any) => x["Session Name"] === val);
                      const norm = (d: any) => d ? String(d).split('T')[0] : '';
                      if (s) setNewRecord((prev: any) => ({ ...prev, session: s["Session Name"], parentEvent: s["Parent Event"] || '', date: norm(s["Date"]), timeOfDay: s["Time Of Day"] || '', occasion: s["Occasion"] || '' }));
                      else setNewRecord((prev: any) => ({ ...prev, session: val }));
                    }} onCancel={() => {}} placeholder="Select session…" tagClass="bg-brand-primary/10 text-brand-primary text-[11px] font-semibold px-2 py-0.5 rounded-sm border border-brand-primary/20" />
                  </div>
                  {newRecord.parentEvent && (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Auto-filled</div>
                      <div className="text-[12px] font-semibold text-slate-700">{newRecord.parentEvent}</div>
                      {newRecord.date && <div className="text-[11px] text-slate-500">{String(newRecord.date).split('T')[0]}</div>}
                    </div>
                  )}
                  <div>
                    <label className={labelCls}>Play ID</label>
                    <input className={inputCls} value={newRecord.playId || ''} onChange={e => setNewRecord({...newRecord, playId: e.target.value})} placeholder="Play ID…" />
                  </div>
                </div>
              )
            },
            {
              label: 'Track Details',
              content: (
                <div className="space-y-5">
                  <div>
                    <label className={labelCls}>Track Name</label>
                    <input className={inputCls} value={newRecord.track || ''} onChange={e => setNewRecord({...newRecord, track: e.target.value})} placeholder="Track name…" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Order</label>
                      <input className={inputCls} value={newRecord.order || ''} onChange={e => setNewRecord({...newRecord, order: e.target.value})} placeholder="Order #" />
                    </div>
                    <div>
                      <label className={labelCls}>Played At</label>
                      <input className={inputCls} value={newRecord.playedAt || ''} onChange={e => setNewRecord({...newRecord, playedAt: e.target.value})} placeholder="Timestamp" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Theme</label>
                      <input className={inputCls} value={newRecord.theme || ''} onChange={e => setNewRecord({...newRecord, theme: e.target.value})} placeholder="Theme" />
                    </div>
                    <div>
                      <label className={labelCls}>Relevance</label>
                      <input className={inputCls} value={newRecord.relevance || ''} onChange={e => setNewRecord({...newRecord, relevance: e.target.value})} placeholder="Relevance" />
                    </div>
                  </div>
                </div>
              )
            },
            {
              label: 'Notes & Remarks',
              content: (
                <div className="space-y-5">
                  <div>
                    <label className={labelCls}>Notes</label>
                    <textarea className={`${inputCls} h-24 resize-none py-2.5`} value={newRecord.notes || ''} onChange={e => setNewRecord({...newRecord, notes: e.target.value})} placeholder="Notes…" />
                  </div>
                  <div>
                    <label className={labelCls}>PPG Remarks</label>
                    <input className={inputCls} value={newRecord.ppgRemarks || ''} onChange={e => setNewRecord({...newRecord, ppgRemarks: e.target.value})} placeholder="PPG remarks…" />
                  </div>
                  <div>
                    <label className={labelCls}>Pravachan Topic</label>
                    <input className={inputCls} value={newRecord.topic || ''} onChange={e => setNewRecord({...newRecord, topic: e.target.value})} placeholder="Topic…" />
                  </div>
                </div>
              )
            },
          ];
        } else if (activeTable === 'VideoLog') {
          wizardSteps = [
            {
              label: 'Session Context',
              content: (
                <div className="space-y-5">
                  <div>
                    <label className={labelCls}>Session</label>
                    <CellDropdown value={newRecord.session || ''} options={sessionOpts} onCommit={val => {
                      const s = sessions.find((x: any) => x["Session Name"] === val);
                      if (s) setNewRecord({...newRecord, session: s["Session Name"], parentEvent: s["Parent Event"], date: s["Date"], city: s["City"], venue: s["Venue"], timeOfDay: s["Time Of Day"], occasion: s["Occasion"], sessionType: s["SessionType"]});
                      else setNewRecord({...newRecord, session: val});
                    }} onCancel={() => {}} placeholder="Select session…" tagClass="bg-brand-primary/10 text-brand-primary text-[11px] font-semibold px-2 py-0.5 rounded-sm border border-brand-primary/20" />
                  </div>
                  {newRecord.parentEvent && (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Auto-filled</div>
                      <div className="text-[12px] font-semibold text-slate-700">{newRecord.parentEvent}</div>
                      {newRecord.date && <div className="text-[11px] text-slate-500">{String(newRecord.date).split('T')[0]}</div>}
                      {newRecord.city && <div className="text-[11px] text-slate-500">{newRecord.city}</div>}
                    </div>
                  )}
                  <div>
                    <label className={labelCls}>Video Play ID</label>
                    <input className={inputCls} value={newRecord.VideoPlayId || ''} onChange={e => setNewRecord({...newRecord, VideoPlayId: e.target.value})} placeholder="Video Play ID…" />
                  </div>
                </div>
              )
            },
            {
              label: 'Video Details',
              content: (
                <div className="space-y-5">
                  <div>
                    <label className={labelCls}>Video Title</label>
                    <input className={inputCls} value={newRecord.VideoTitle || ''} onChange={e => setNewRecord({...newRecord, VideoTitle: e.target.value})} placeholder="Title…" />
                  </div>
                  <div>
                    <label className={labelCls}>Duration</label>
                    <input className={inputCls} value={newRecord.duration || ''} onChange={e => setNewRecord({...newRecord, duration: e.target.value})} placeholder="MM:SS" />
                  </div>
                  <div>
                    <label className={labelCls}>Proposals List</label>
                    <textarea className={`${inputCls} h-24 resize-none py-2.5`} value={newRecord.proposalsList || ''} onChange={e => setNewRecord({...newRecord, proposalsList: e.target.value})} placeholder="Proposals…" />
                  </div>
                </div>
              )
            },
          ];
        } else if (activeTable === 'Guidance & Learning') {
          wizardSteps = [
            {
              label: 'Basic Info',
              content: (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Learning ID</label>
                      <input className={inputCls} value={newRecord.LearningId || ''} onChange={e => setNewRecord({...newRecord, LearningId: e.target.value})} placeholder="ID…" />
                    </div>
                    <div>
                      <label className={labelCls}>Year</label>
                      <input className={inputCls} value={newRecord.year || ''} onChange={e => setNewRecord({...newRecord, year: e.target.value})} placeholder="Year" />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Event Name</label>
                    <input className={inputCls} value={newRecord.event || ''} onChange={e => setNewRecord({...newRecord, event: e.target.value})} placeholder="Event name…" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Date From</label>
                      <input type="date" className={inputCls} value={newRecord.dateFrom || ''} onChange={e => setNewRecord({...newRecord, dateFrom: e.target.value})} />
                    </div>
                    <div>
                      <label className={labelCls}>Date To</label>
                      <input type="date" className={inputCls} value={newRecord.dateTo || ''} onChange={e => setNewRecord({...newRecord, dateTo: e.target.value})} />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>City</label>
                    <input className={inputCls} value={newRecord.city || ''} onChange={e => setNewRecord({...newRecord, city: e.target.value})} placeholder="City…" />
                  </div>
                </div>
              )
            },
            {
              label: 'Content',
              content: (
                <div className="space-y-5">
                  <div>
                    <label className={labelCls}>Guidance / Learning</label>
                    <textarea className={`${inputCls} h-28 resize-none py-2.5`} value={newRecord.guidanceLearning || ''} onChange={e => setNewRecord({...newRecord, guidanceLearning: e.target.value})} placeholder="Content…" />
                  </div>
                  <div>
                    <label className={labelCls}>Guidance From</label>
                    <input className={inputCls} value={newRecord.guidanceFrom || ''} onChange={e => setNewRecord({...newRecord, guidanceFrom: e.target.value})} placeholder="Source…" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Category</label>
                      <input className={inputCls} value={newRecord.category || ''} onChange={e => setNewRecord({...newRecord, category: e.target.value})} placeholder="Category…" />
                    </div>
                    <div>
                      <label className={labelCls}>Attachments</label>
                      <input className={inputCls} value={newRecord.attachments || ''} onChange={e => setNewRecord({...newRecord, attachments: e.target.value})} placeholder="Link…" />
                    </div>
                  </div>
                </div>
              )
            },
          ];
        } else if (activeTable === 'Tracks') {
          wizardSteps = [
            {
              label: 'Track Info',
              content: (
                <div className="space-y-5">
                  <div>
                    <label className={labelCls}>Title</label>
                    <input className={inputCls} value={newRecord.title || ''} onChange={e => setNewRecord({...newRecord, title: e.target.value})} placeholder="Track title…" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Artist</label>
                      <input className={inputCls} value={newRecord.artist || ''} onChange={e => setNewRecord({...newRecord, artist: e.target.value})} placeholder="Artist…" />
                    </div>
                    <div>
                      <label className={labelCls}>Album</label>
                      <input className={inputCls} value={newRecord.album || ''} onChange={e => setNewRecord({...newRecord, album: e.target.value})} placeholder="Album…" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Duration</label>
                      <input className={inputCls} value={newRecord.duration || ''} onChange={e => setNewRecord({...newRecord, duration: e.target.value})} placeholder="3:45" />
                    </div>
                    <div>
                      <label className={labelCls}>BPM</label>
                      <input className={inputCls} value={newRecord.bpm || ''} onChange={e => setNewRecord({...newRecord, bpm: e.target.value})} placeholder="BPM" />
                    </div>
                    <div>
                      <label className={labelCls}>Key</label>
                      <input className={inputCls} value={newRecord.key || ''} onChange={e => setNewRecord({...newRecord, key: e.target.value})} placeholder="Key" />
                    </div>
                  </div>
                </div>
              )
            },
            {
              label: 'Source & Tags',
              content: (
                <div className="space-y-5">
                  <div>
                    <label className={labelCls}>Source</label>
                    <input className={inputCls} value={newRecord.source || ''} onChange={e => setNewRecord({...newRecord, source: e.target.value})} placeholder="Source…" />
                  </div>
                  <div>
                    <label className={labelCls}>File Link</label>
                    <input className={inputCls} value={newRecord.fileLink || ''} onChange={e => setNewRecord({...newRecord, fileLink: e.target.value})} placeholder="https://…" />
                  </div>
                  <div>
                    <label className={labelCls}>Tags</label>
                    <input className={inputCls} value={newRecord.tags || ''} onChange={e => setNewRecord({...newRecord, tags: e.target.value})} placeholder="Comma separated…" />
                  </div>
                  <div>
                    <label className={labelCls}>Lexicon ID</label>
                    <input className={inputCls} value={newRecord.lexiconID || ''} onChange={e => setNewRecord({...newRecord, lexiconID: e.target.value})} placeholder="ID…" />
                  </div>
                </div>
              )
            },
          ];
        } else if (activeTable === 'DyatraChecklist') {
          const checklistCategoryOpts = [...new Set(checklist.map((c: any) => c.Category).filter(Boolean))].sort() as string[];
          const taskGroupOpts = [...new Set(checklist.map((c: any) => c.TaskGroup).filter(Boolean))].sort() as string[];
          wizardSteps = [
            {
              label: 'Task Details',
              content: (
                <div className="space-y-5">
                  <div>
                    <label className={labelCls}>Task</label>
                    <input className={inputCls} value={newRecord["Task"] || ''} onChange={e => setNewRecord({...newRecord, "Task": e.target.value})} placeholder="Task name…" />
                  </div>
                  <div>
                    <label className={labelCls}>Details</label>
                    <textarea className={`${inputCls} h-24 resize-none py-2.5`} value={newRecord["Details"] || ''} onChange={e => setNewRecord({...newRecord, "Details": e.target.value})} placeholder="Full task description…" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Category</label>
                      <CellDropdown value={newRecord["Category"] || ''} options={[...new Set([...checklistCategoryOpts, ...(customTags['DyatraChecklist']?.['Category'] || [])])]} onAddOption={val => handleAddCustomTag('DyatraChecklist', 'Category', val)} removableOptions={[...new Set([...checklistCategoryOpts, ...(customTags['DyatraChecklist']?.['Category'] || [])])]} onRemoveOption={val => handleRemoveTagGlobally('DyatraChecklist', 'Category', val)} onCommit={val => setNewRecord({...newRecord, "Category": val})} onCancel={() => {}} placeholder="Category…" />
                    </div>
                    <div>
                      <label className={labelCls}>Task Group</label>
                      <CellDropdown value={newRecord["TaskGroup"] || ''} options={[...new Set([...taskGroupOpts, ...(customTags['DyatraChecklist']?.['TaskGroup'] || [])])]} onAddOption={val => handleAddCustomTag('DyatraChecklist', 'TaskGroup', val)} removableOptions={[...new Set([...taskGroupOpts, ...(customTags['DyatraChecklist']?.['TaskGroup'] || [])])]} onRemoveOption={val => handleRemoveTagGlobally('DyatraChecklist', 'TaskGroup', val)} onCommit={val => setNewRecord({...newRecord, "TaskGroup": val})} onCancel={() => {}} placeholder="Group…" />
                    </div>
                  </div>
                </div>
              )
            },
            {
              label: 'Scheduling',
              content: (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className={labelCls}>Order ID</label><input className={inputCls} value={newRecord["OrderId"] || ''} onChange={e => setNewRecord({...newRecord, "OrderId": e.target.value})} placeholder="#" /></div>
                    <div><label className={labelCls}>Period</label><input className={inputCls} value={newRecord["Period"] || ''} onChange={e => setNewRecord({...newRecord, "Period": e.target.value})} placeholder="Pre / During…" /></div>
                  </div>
                  <div><label className={labelCls}>People Involved</label><input className={inputCls} value={newRecord["People Involved"] || ''} onChange={e => setNewRecord({...newRecord, "People Involved": e.target.value})} placeholder="Names…" /></div>
                  <div><label className={labelCls}>Typical Timeline</label><input className={inputCls} value={newRecord["Typical Timeline"] || ''} onChange={e => setNewRecord({...newRecord, "Typical Timeline": e.target.value})} placeholder="e.g. 2 days before…" /></div>
                  <div><label className={labelCls}>Attachment</label><input className={inputCls} value={newRecord["Attachment"] || ''} onChange={e => setNewRecord({...newRecord, "Attachment": e.target.value})} placeholder="https://…" /></div>
                </div>
              )
            },
          ];
        } else if (activeTable === 'LED') {
          const sessionOpts2 = sessions.map((s: any) => s["Session Name"]).filter(Boolean);
          wizardSteps = [
            {
              label: 'Session Link',
              content: (
                <div className="space-y-5">
                  <div>
                    <label className={labelCls}>LED ID</label>
                    <input className={inputCls} value={newRecord["LedId"] || ''} onChange={e => setNewRecord({...newRecord, "LedId": e.target.value})} placeholder="LED ID…" />
                  </div>
                  <div>
                    <label className={labelCls}>Session</label>
                    <CellDropdown value={newRecord["🕘 Session"] || ''} options={sessionOpts2} onCommit={val => {
                      const s = sessions.find((x: any) => x["Session Name"] === val);
                      if (s) setNewRecord({...newRecord, "🕘 Session": s["Session Name"], "Parent Event (from 🕘 Session)": s["Parent Event"], "Date (from 🕘 Session)": s["Date"], "City (from 🕘 Session)": s["City"], "Venue (from 🕘 Session)": s["Venue"]});
                      else setNewRecord({...newRecord, "🕘 Session": val});
                    }} onCancel={() => {}} placeholder="Select session…" tagClass="bg-brand-primary/10 text-brand-primary text-[11px] font-semibold px-2 py-0.5 rounded-sm border border-brand-primary/20" />
                  </div>
                  {newRecord["Parent Event (from 🕘 Session)"] && (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Auto-filled</div>
                      <div className="text-[12px] font-semibold text-slate-700">{newRecord["Parent Event (from 🕘 Session)"]}</div>
                      {newRecord["Date (from 🕘 Session)"] && <div className="text-[11px] text-slate-500">{String(newRecord["Date (from 🕘 Session)"]).split('T')[0]}</div>}
                      {newRecord["City (from 🕘 Session)"] && <div className="text-[11px] text-slate-500">{newRecord["City (from 🕘 Session)"]}</div>}
                    </div>
                  )}
                  <div>
                    <label className={labelCls}>Indoor / Outdoor?</label>
                    <div className="flex gap-2">
                      {['Indoor', 'Outdoor'].map(opt => (
                        <button key={opt} type="button" onClick={() => setNewRecord({...newRecord, "Indoor/Outdoor LED?": opt})} className={`flex-1 h-11 rounded-xl border text-[12px] font-black uppercase tracking-widest transition-all ${newRecord["Indoor/Outdoor LED?"] === opt ? 'bg-brand-primary text-white border-brand-primary' : 'bg-white text-slate-600 border-slate-200'}`}>{opt}</button>
                      ))}
                    </div>
                  </div>
                </div>
              )
            },
            {
              label: 'Centre LED',
              content: (
                <div className="space-y-5">
                  <div>
                    <label className={labelCls}>Centre LED Name</label>
                    <input className={inputCls} value={newRecord["CentreLed"] || ''} onChange={e => setNewRecord({...newRecord, "CentreLed": e.target.value})} placeholder="Centre LED model…" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className={labelCls}>Pitch</label><input className={inputCls} value={newRecord["CntrPitch"] || ''} onChange={e => setNewRecord({...newRecord, "CntrPitch": e.target.value})} placeholder="mm" /></div>
                    <div><label className={labelCls}>Width</label><input className={inputCls} value={newRecord["CntrWdth"] || ''} onChange={e => setNewRecord({...newRecord, "CntrWdth": e.target.value})} placeholder="ft" /></div>
                    <div><label className={labelCls}>Height</label><input className={inputCls} value={newRecord["CntrHt"] || ''} onChange={e => setNewRecord({...newRecord, "CntrHt": e.target.value})} placeholder="ft" /></div>
                    <div><label className={labelCls}>Riser</label><input className={inputCls} value={newRecord["CntrRiser"] || ''} onChange={e => setNewRecord({...newRecord, "CntrRiser": e.target.value})} placeholder="ft" /></div>
                  </div>
                  <div><label className={labelCls}>Stage Height</label><input className={inputCls} value={newRecord["Stageht"] || ''} onChange={e => setNewRecord({...newRecord, "Stageht": e.target.value})} placeholder="Stage ht…" /></div>
                </div>
              )
            },
            {
              label: 'Side & Aux LED',
              content: (
                <div className="space-y-5">
                  <div>
                    <label className={labelCls}>Side LED Name</label>
                    <input className={inputCls} value={newRecord["SideLed"] || ''} onChange={e => setNewRecord({...newRecord, "SideLed": e.target.value})} placeholder="Side LED model…" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className={labelCls}>Pitch</label><input className={inputCls} value={newRecord["SidePitch"] || ''} onChange={e => setNewRecord({...newRecord, "SidePitch": e.target.value})} placeholder="mm" /></div>
                    <div><label className={labelCls}>Width</label><input className={inputCls} value={newRecord["SideWdth"] || ''} onChange={e => setNewRecord({...newRecord, "SideWdth": e.target.value})} placeholder="ft" /></div>
                    <div><label className={labelCls}>Height</label><input className={inputCls} value={newRecord["SideHt"] || ''} onChange={e => setNewRecord({...newRecord, "SideHt": e.target.value})} placeholder="ft" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className={labelCls}>Other LED 1</label><input className={inputCls} value={newRecord["OtherLed1"] || ''} onChange={e => setNewRecord({...newRecord, "OtherLed1": e.target.value})} placeholder="Other LED 1…" /></div>
                    <div><label className={labelCls}>Other LED 2</label><input className={inputCls} value={newRecord["OtherLed2"] || ''} onChange={e => setNewRecord({...newRecord, "OtherLed2": e.target.value})} placeholder="Other LED 2…" /></div>
                    <div><label className={labelCls}>Oth Width</label><input className={inputCls} value={newRecord["OtherWdth"] || ''} onChange={e => setNewRecord({...newRecord, "OtherWdth": e.target.value})} placeholder="ft" /></div>
                    <div><label className={labelCls}>Oth Height</label><input className={inputCls} value={newRecord["OtherHt"] || ''} onChange={e => setNewRecord({...newRecord, "OtherHt": e.target.value})} placeholder="ft" /></div>
                  </div>
                </div>
              )
            },
            {
              label: 'Power & Vendor',
              content: (
                <div className="space-y-5">
                  <div><label className={labelCls}>Vendor</label><input className={inputCls} value={newRecord["Vendor"] || ''} onChange={e => setNewRecord({...newRecord, "Vendor": e.target.value})} placeholder="Vendor name…" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className={labelCls}>DG Used (KVA)</label><input className={inputCls} value={newRecord["DGUseedKva"] || ''} onChange={e => setNewRecord({...newRecord, "DGUseedKva": e.target.value})} placeholder="KVA" /></div>
                    <div><label className={labelCls}>Backup Power</label><input className={inputCls} value={newRecord["BackupPower"] || ''} onChange={e => setNewRecord({...newRecord, "BackupPower": e.target.value})} placeholder="Backup…" /></div>
                  </div>
                  <div>
                    <label className={labelCls}>Is LED Required?</label>
                    <div className="flex gap-2">
                      {['Yes', 'No'].map(opt => (
                        <button key={opt} type="button" onClick={() => setNewRecord({...newRecord, "is Led Required?": opt})} className={`flex-1 h-11 rounded-xl border text-[12px] font-black uppercase tracking-widest transition-all ${newRecord["is Led Required?"] === opt ? 'bg-brand-primary text-white border-brand-primary' : 'bg-white text-slate-600 border-slate-200'}`}>{opt}</button>
                      ))}
                    </div>
                  </div>
                </div>
              )
            },
          ];
        } else if (activeTable === 'DataSharing') {
          const deptOpts = [...new Set(locations.map((l: any) => l.Dept).filter(Boolean).flatMap((d: string) => d.split(',').map((x: string) => x.trim())).filter(Boolean))].sort() as string[];
          wizardSteps = [
            {
              label: 'Contact Info',
              content: (
                <div className="space-y-5">
                  <div><label className={labelCls}>Sevak Name</label><input className={inputCls} value={newRecord["Sevak"] || ''} onChange={e => setNewRecord({...newRecord, "Sevak": e.target.value})} placeholder="Full name…" /></div>
                  <div>
                    <label className={labelCls}>Department</label>
                    <CellDropdown value={newRecord["Dept"] || ''} options={[...new Set([...deptOpts, ...(customTags['DataSharing']?.['Dept'] || [])])]} onAddOption={val => handleAddCustomTag('DataSharing', 'Dept', val)} removableOptions={[...new Set([...deptOpts, ...(customTags['DataSharing']?.['Dept'] || [])])]} onRemoveOption={val => handleRemoveTagGlobally('DataSharing', 'Dept', val)} onCommit={val => setNewRecord({...newRecord, "Dept": val})} onCancel={() => {}} placeholder="Select dept…" />
                  </div>
                  <div><label className={labelCls}>Email ID</label><input className={inputCls} type="email" value={newRecord["EmailId"] || ''} onChange={e => setNewRecord({...newRecord, "EmailId": e.target.value})} placeholder="email@example.com" /></div>
                </div>
              )
            },
            {
              label: 'Data Sharing',
              content: (
                <div className="space-y-5">
                  <div>
                    <label className={labelCls}>Sharing Facts</label>
                    <div className="flex gap-2">
                      {['Yes', 'No'].map(opt => (
                        <button key={opt} type="button" onClick={() => setNewRecord({...newRecord, "ShareFacts?": opt})} className={`flex-1 h-11 rounded-xl border text-[12px] font-black uppercase tracking-widest transition-all ${newRecord["ShareFacts?"] === opt ? 'bg-brand-primary text-white border-brand-primary' : 'bg-white text-slate-600 border-slate-200'}`}>{opt}</button>
                      ))}
                    </div>
                  </div>
                  <div><label className={labelCls}>Share Data</label><textarea className={`${inputCls} h-28 resize-none py-2.5`} value={newRecord["ShareData"] || ''} onChange={e => setNewRecord({...newRecord, "ShareData": e.target.value})} placeholder="Describe data to share…" /></div>
                </div>
              )
            },
          ];
        } else if (activeTable === 'VideoSetup' || activeTable === 'AudioSetup') {
          const statusOpts = ['To Do', 'In Progress', 'Done'];
          const assigneeOpts = [...new Set(locations.map((item: any) => item["Sevak"]).filter(Boolean).map(String))].sort();
          const setupLabel = activeTable === 'VideoSetup' ? 'Video' : 'Audio';
          wizardSteps = [
            {
              label: `${setupLabel} Setup`,
              content: (
                <div className="space-y-5">
                  <div><label className={labelCls}>Name</label><input className={inputCls} value={newRecord.name || ''} onChange={e => setNewRecord({...newRecord, name: e.target.value})} placeholder="Equipment / setup name…" /></div>
                  <div>
                    <label className={labelCls}>Assignee</label>
                    <CellDropdown value={newRecord.assignee || ''} options={[...new Set([...assigneeOpts, ...(customTags[activeTable]?.['Assignee'] || [])])]} onAddOption={val => handleAddCustomTag(activeTable, 'Assignee', val)} removableOptions={[...new Set([...assigneeOpts, ...(customTags[activeTable]?.['Assignee'] || [])])]} onRemoveOption={val => handleRemoveTagGlobally(activeTable, 'Assignee', val)} onCommit={val => setNewRecord({...newRecord, assignee: val})} onCancel={() => {}} placeholder="Select Assignee…" />
                  </div>
                  <div>
                    <label className={labelCls}>Status</label>
                    <div className="grid grid-cols-3 gap-2">
                      {statusOpts.map(opt => (
                        <button key={opt} type="button" onClick={() => setNewRecord({...newRecord, status: opt})} className={`h-11 rounded-xl border text-[11px] font-black uppercase tracking-widest transition-all ${newRecord.status === opt ? 'bg-brand-primary text-white border-brand-primary' : 'bg-white text-slate-600 border-slate-200'}`}>{opt}</button>
                      ))}
                    </div>
                  </div>
                </div>
              )
            },
            {
              label: 'Notes & Links',
              content: (
                <div className="space-y-5">
                  <div><label className={labelCls}>Notes</label><textarea className={`${inputCls} h-28 resize-none py-2.5`} value={newRecord.notes || ''} onChange={e => setNewRecord({...newRecord, notes: e.target.value})} placeholder="Additional notes…" /></div>
                  <div><label className={labelCls}>Attachments</label><input className={inputCls} value={newRecord.attachments || ''} onChange={e => setNewRecord({...newRecord, attachments: e.target.value})} placeholder="Image URLs (https://...)" /></div>
                  <div><label className={labelCls}>Attachment Summary</label><input className={inputCls} value={newRecord.attachmentSummary || ''} onChange={e => setNewRecord({...newRecord, attachmentSummary: e.target.value})} placeholder="Brief summary…" /></div>
                </div>
              )
            },
          ];
        } else {
          // Generic: single step with all visible columns
          wizardSteps = [
            {
              label: 'Details',
              content: (
                <div className="space-y-5">
                  {getTableColumns().map((col: string) => (
                    <div key={col}>
                      <label className={labelCls}>{colLabel(col)}</label>
                      <input className={inputCls} value={newRecord[col] || ''} onChange={e => setNewRecord({...newRecord, [col]: e.target.value})} placeholder={`${colLabel(col)}…`} />
                    </div>
                  ))}
                </div>
              )
            },
          ];
        }

        const totalSteps = wizardSteps.length;
        const currentStep = wizardSteps[Math.min(addWizardStep, totalSteps - 1)];

        return (
          <div className="fixed inset-0 z-[600] flex items-end justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(2px)' }} onClick={() => setIsAddModalOpen(false)}>
            <div className="w-full bg-white rounded-t-3xl shadow-2xl flex flex-col max-h-[92vh]" onClick={e => e.stopPropagation()}>
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-1 shrink-0">
                <div className="w-10 h-1 bg-slate-300 rounded-full" />
              </div>

              {/* Header */}
              <div className="px-5 pt-2 pb-3 flex items-start justify-between shrink-0">
                <div className="flex-1 min-w-0 pr-3">
                  <div className="text-[9px] font-black text-brand-primary uppercase tracking-[0.2em] mb-0.5">{activeTable}</div>
                  <h2 className="text-[17px] font-black text-slate-900 tracking-tight leading-snug">Add New Record</h2>
                </div>
                <button onClick={() => setIsAddModalOpen(false)} className="p-1.5 rounded-xl hover:bg-slate-100 mt-0.5 shrink-0">
                  <X className="h-5 w-5 text-slate-400" />
                </button>
              </div>

              {/* Step progress bar */}
              <div className="px-5 pb-3 shrink-0">
                <div className="flex items-center gap-1">
                  {wizardSteps.map((_, i) => (
                    <div key={i} onClick={() => setAddWizardStep(i)} className={`h-8 flex items-center cursor-pointer ${i === addWizardStep ? 'flex-[2]' : 'flex-1'}`}>
                      <div className={`h-1.5 w-full rounded-full transition-all duration-300 ${i === addWizardStep ? 'bg-brand-primary' : i < addWizardStep ? 'bg-brand-primary/40' : 'bg-slate-200'}`} />
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-brand-primary uppercase tracking-[0.15em]">{currentStep?.label}</span>
                  <span className="text-[10px] font-bold text-slate-400">{addWizardStep + 1} / {totalSteps}</span>
                </div>
              </div>

              {/* Step content */}
              <div className="flex-1 overflow-y-auto px-5 pb-2 min-h-0">
                {currentStep?.content}
              </div>

              {/* Footer nav */}
              <div className="px-5 py-4 border-t border-slate-100 shrink-0" style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}>
                <div className="flex items-center gap-3">
                  <button onClick={() => { if (addWizardStep === 0) setIsAddModalOpen(false); else setAddWizardStep(s => s - 1); }} className="flex-1 h-12 border border-slate-300 rounded-2xl text-[12px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-colors">
                    {addWizardStep === 0 ? 'Cancel' : 'Back'}
                  </button>
                  {addWizardStep < totalSteps - 1 ? (
                    <button onClick={() => setAddWizardStep(s => s + 1)} className="flex-[2] h-12 bg-brand-primary text-white rounded-2xl text-[12px] font-black uppercase tracking-widest hover:bg-brand-primary/90 transition-colors shadow-lg shadow-brand-primary/25">
                      Next
                    </button>
                  ) : (
                    <button onClick={handleAddRecord} disabled={isAdding} className="flex-[2] h-12 bg-green-600 text-white rounded-2xl text-[12px] font-black uppercase tracking-widest hover:bg-green-700 transition-colors shadow-lg shadow-green-600/25 disabled:opacity-50">
                      {isAdding ? 'Saving…' : 'Create Record'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      <AttachmentManagerDialog
        manager={imageManager}
        onClose={stableOnImageClose}
        onSaved={stableOnImageSaved}
      />

      {expandedRecord && (
        <RecordExpandModal
          item={expandedRecord}
          tableName={activeTable}
          columns={getTableColumns()}
          sessions={sessions}
          events={events}
          columnMeta={columnMeta}
          columnTypes={columnTypes}
          allData={{
            Events: events,
            Session: sessions,
            MusicLog: musicLogs,
            VideoLog: videoLogs,
            Tracks: media.filter((m: any) => m.type === 'track' || m.Type === 'track' || m["Title"]),
            'Guidance & Learning': guidance,
            LED: ledDetails,
            DyatraChecklist: checklist,
            DataSharing: locations,
            VideoSetup: videoSetup,
            AudioSetup: audioSetup,
          }}
          onAddLookup={lt => {
            setAddColumnModal({ name: '', type: 'lookup', linkedTable: lt, lookupField: '' });
          }}
          onClose={() => setExpandedRecord(null)}
          onSave={handleExpandedSave}
          currentUser={user}
          customTags={customTags}
          onAddCustomTag={handleAddCustomTag}
          onRemoveTag={handleRemoveTagGlobally}
          onImageManage={(col, currentItem) => {
            setImageManager({ item: currentItem, column: col, collection: getImageCollection(), isOpen: true });
          }}
          setLinkedRecordPopup={setLinkedRecordPopup}
        />
      )}

      {/* TOAST NOTIFICATIONS */}
      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl text-[13px] font-semibold pointer-events-none transition-all ${
          toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
        }`}>
          {toast.type === 'error' ? <X className="h-4 w-4 shrink-0" /> : <Check className="h-4 w-4 shrink-0" />}
          {toast.msg}
        </div>
      )}

      <AnimatePresence>
        {inboxOpen && user?.email && (
          <InboxPanel
            email={user.email}
            onClose={() => setInboxOpen(false)}
            onOpenRecord={openNotificationRecord}
            onUnreadChange={(count) => setInboxUnread(count)}
            isMobileView={isMobileView}
            currentUser={user}
          />
        )}
      </AnimatePresence>

      {linkedSession && (
        <div
          className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4"
          onClick={() => setLinkedSession(null)}
        >
          <div
            className="bg-white rounded-[24px] shadow-2xl w-full max-w-lg overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="bg-slate-50 border-b border-slate-100 px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between">
              <div>
                <div className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5">Linked Session</div>
                <div className="text-lg font-black text-slate-900 tracking-tight">{linkedSession["Session Name"]}</div>
              </div>
              <button onClick={() => setLinkedSession(null)} className="p-2 rounded-xl hover:bg-slate-200 transition-colors">
                <X className="h-4 w-4 text-slate-500" />
              </button>
            </div>
            <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 sm:gap-y-4">
              {(['Parent Event', 'Date', 'City', 'Venue', 'Time Of Day', 'Occasion', 'SessionType', 'Notes'] as const).map(field => (
                <div key={field}>
                  <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{field}</div>
                  <div className="text-[13px] font-semibold text-slate-800">
                    {linkedSession[field] ? linkedSession[field] : <span className="text-slate-300 italic font-normal">—</span>}
                  </div>
                </div>
              ))}
            </div>
            <div className="px-4 sm:px-6 pb-4 sm:pb-5 border-t border-slate-100 pt-3 sm:pt-4">
              <button
                onClick={() => { setActiveTable('Session'); setViewingRecord(linkedSession); setLinkedSession(null); }}
                className="text-[11px] font-black text-brand-primary uppercase tracking-widest hover:underline flex items-center gap-1"
              >
                Open in Sessions table <ArrowUpRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      )}

      {linkedRecordPopup && (
        <div
          className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4"
          onClick={() => setLinkedRecordPopup(null)}
        >
          <div
            className="bg-white rounded-[24px] shadow-2xl w-full max-w-lg overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="bg-slate-50 border-b border-slate-100 px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between">
              <div>
                <div className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5">Linked {linkedRecordPopup.tableName}</div>
                <div className="text-lg font-black text-slate-900 tracking-tight">{linkedRecordPopup.record[linkedRecordPopup.nameField] || 'Untitled'}</div>
              </div>
              <button onClick={() => setLinkedRecordPopup(null)} className="p-2 rounded-xl hover:bg-slate-200 transition-colors">
                <X className="h-4 w-4 text-slate-500" />
              </button>
            </div>
            <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 sm:gap-y-4 max-h-[50vh] overflow-y-auto">
              {linkedRecordPopup.fields.map(field => (
                <div key={field}>
                  <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{colLabel(field)}</div>
                  <div className="text-[13px] font-semibold text-slate-800">
                    {linkedRecordPopup.record[field] ? (typeof linkedRecordPopup.record[field] === 'object' ? JSON.stringify(linkedRecordPopup.record[field]) : String(linkedRecordPopup.record[field])) : <span className="text-slate-300 italic font-normal">—</span>}
                  </div>
                </div>
              ))}
            </div>
            <div className="px-4 sm:px-6 pb-4 sm:pb-5 border-t border-slate-100 pt-3 sm:pt-4">
              <button
                onClick={() => { setActiveTable(linkedRecordPopup.tableName); setViewingRecord(linkedRecordPopup.record); setLinkedRecordPopup(null); }}
                className="text-[11px] font-black text-brand-primary uppercase tracking-widest hover:underline flex items-center gap-1"
              >
                Open in {linkedRecordPopup.tableName} table <ArrowUpRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>

  );
}