import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, 
  Layers, 
  BarChart3, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Filter, 
  Search, 
  ChevronRight, 
  Building2, 
  RefreshCw,
  Check,
  Edit3,
  BadgeCheck,
  ZoomIn,
  Camera,
  UploadCloud,
  Star,
  User,
  ExternalLink,
  Sparkles,
  X,
  FileText
} from 'lucide-react';
import { useIssues } from '../../context/IssuesContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import EditProfileModal from './EditProfileModal';
import ImageZoomModal from '../Common/ImageZoomModal';

export default function AdminDashboard() {
  const { issues, departments, updateStatus, refreshIssues } = useIssues();
  const { user, t } = useAuth();

  const [adminTab, setAdminTab] = useState('triage'); // 'overview' | 'triage' | 'departments'
  const [statusFilter, setStatusFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  
  // Inspection State for Officer viewing complaint details
  const [inspectingIssue, setInspectingIssue] = useState(null);

  // Image Zoom Lightbox State
  const [zoomImage, setZoomImage] = useState(null);

  // Status Update Action Modal State
  const [editingIssue, setEditingIssue] = useState(null);
  const [newStatus, setNewStatus] = useState('in_progress');
  const [selectedDeptId, setSelectedDeptId] = useState('roads');
  const [assignedCrew, setAssignedCrew] = useState('Unit Bravo - Heavy Asphalt');
  const [dispatchNote, setDispatchNote] = useState('');
  const [resolvedPhotoUrl, setResolvedPhotoUrl] = useState('');
  const [resolvedPhotoFile, setResolvedPhotoFile] = useState(null);
  const [resolvedPhotoPreview, setResolvedPhotoPreview] = useState(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateSuccessMsg, setUpdateSuccessMsg] = useState(null);

  const fileInputRef = useRef(null);

  // Analytics state
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        const data = await api.getAnalytics();
        setAnalytics(data);
      } catch (err) {
        console.error('Error fetching analytics:', err);
      }
    }
    loadAnalytics();
  }, [issues]);

  const handleOpenStatusModal = (issue) => {
    setEditingIssue(issue);
    setNewStatus(issue.status === 'open' ? 'in_progress' : issue.status);
    setSelectedDeptId(issue.departmentId || 'roads');
    setAssignedCrew(issue.assignedTo || 'Rapid Response Unit 1');
    setDispatchNote('');
    setResolvedPhotoUrl(issue.resolvedPhotoUrl || '');
    setResolvedPhotoFile(null);
    setResolvedPhotoPreview(issue.resolvedPhotoUrl || null);
    setUpdateSuccessMsg(null);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setResolvedPhotoFile(file);
      setResolvedPhotoPreview(URL.createObjectURL(file));
      setResolvedPhotoUrl('');
    }
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    setIsDraggingFile(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setResolvedPhotoFile(file);
      setResolvedPhotoPreview(URL.createObjectURL(file));
      setResolvedPhotoUrl('');
    }
  };

  const handleSaveStatusUpdate = async (e) => {
    e.preventDefault();
    if (!editingIssue) return;

    try {
      setIsUpdating(true);

      let payload;
      if (resolvedPhotoFile) {
        payload = new FormData();
        payload.append('status', newStatus);
        payload.append('departmentId', selectedDeptId);
        payload.append('assignedTo', assignedCrew);
        payload.append('note', dispatchNote || `Status updated to ${newStatus.replace('_', ' ').toUpperCase()} by Municipal Admin.`);
        payload.append('resolvedPhoto', resolvedPhotoFile);
      } else {
        payload = {
          status: newStatus,
          departmentId: selectedDeptId,
          assignedTo: assignedCrew,
          note: dispatchNote || `Status updated to ${newStatus.replace('_', ' ').toUpperCase()} by Municipal Admin.`,
          resolvedPhotoUrl: newStatus === 'resolved' 
            ? (resolvedPhotoUrl || resolvedPhotoPreview || 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=800&auto=format&fit=crop&q=80') 
            : null
        };
      }

      await updateStatus(editingIssue.id, payload);

      setUpdateSuccessMsg('✓ Status saved, resolution photo published and broadcast to citizens in real-time!');
      setTimeout(() => {
        setEditingIssue(null);
        setUpdateSuccessMsg(null);
        if (inspectingIssue && inspectingIssue.id === editingIssue.id) {
          setInspectingIssue(null);
        }
      }, 1200);
    } catch (err) {
      alert(err.message || 'Failed to update status');
    } finally {
      setIsUpdating(false);
    }
  };

  // Filter issues for admin triage
  const triageIssues = issues.filter(issue => {
    if (statusFilter !== 'all' && issue.status !== statusFilter) return false;
    if (deptFilter !== 'all' && issue.departmentId !== deptFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        issue.title.toLowerCase().includes(q) ||
        issue.id.toLowerCase().includes(q) ||
        issue.address.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const openIssues = triageIssues.filter(i => i.status === 'open');
  const inProgressIssues = triageIssues.filter(i => i.status === 'in_progress');
  const resolvedIssues = triageIssues.filter(i => i.status === 'resolved');

  // Compute average citizen rating across all resolved issues with feedback
  const issuesWithFeedback = issues.filter(i => i.feedback && i.feedback.length > 0);
  const totalFeedbackCount = issuesWithFeedback.reduce((acc, i) => acc + i.feedback.length, 0);
  const avgCitizenRating = totalFeedbackCount > 0
    ? (issuesWithFeedback.reduce((acc, i) => acc + i.feedback.reduce((sum, f) => sum + (f.rating || 5), 0), 0) / totalFeedbackCount).toFixed(1)
    : '4.9';

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6 space-y-6">
      
      {/* Admin Header Banner */}
      <div className="bg-gradient-to-r from-[#0d2238] via-[#102d4a] to-[#0d2238] border border-cyan-500/30 rounded-3xl p-6 lg:p-8 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold">
              <Shield className="w-3.5 h-3.5 text-cyan-400" />
              <span>{t('municipalAdmin')}</span>
            </div>
            <h2 className="font-display text-2xl lg:text-3xl font-bold text-white tracking-tight">
              {t('adminCommandCenter')}
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm max-w-xl">
              Inspect complaints with high-resolution image zoom, dispatch crews, and publish photo verification proofs upon resolution.
            </p>

            {/* Active Officer Profile Chip */}
            <div className="pt-2 flex items-center gap-3">
              <div className="flex items-center gap-2.5 p-1.5 pr-3 rounded-2xl bg-[#0a192f]/90 border border-cyan-500/30 shadow-md">
                <img
                  src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'Officer')}&background=0284c7&color=ffffff&bold=true`}
                  alt={user?.name || 'Officer'}
                  className="w-8 h-8 rounded-xl object-cover border border-cyan-400/50 bg-slate-800"
                  onError={(e) => {
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'Officer')}&background=0284c7&color=ffffff&bold=true`;
                  }}
                />
                <div>
                  <p className="text-xs font-bold text-slate-100 flex items-center gap-1">
                    <span>{user?.name || 'Municipal Officer'}</span>
                    <BadgeCheck className="w-3.5 h-3.5 text-cyan-400" />
                  </p>
                  <p className="text-[10px] text-cyan-300 font-mono">
                    {user?.badge || 'Lead Dispatcher'} • {user?.ward || 'Central HQ'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsEditProfileOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-300 hover:text-white text-xs font-semibold transition-all"
                title="Customize Admin Name and Avatar"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Profile</span>
              </button>
            </div>
          </div>

          {/* Quick SLA & Satisfaction Metrics */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="px-4 py-3 rounded-2xl bg-[#0a192f]/80 border border-[#1e3857] text-center">
              <p className="text-[10px] uppercase font-bold text-slate-400">{t('totalIncidentLog')}</p>
              <p className="text-xl font-bold text-slate-100 font-mono mt-0.5">{issues.length}</p>
            </div>
            
            <div className="px-4 py-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-center">
              <p className="text-[10px] uppercase font-bold text-amber-400">{t('inProgressCrews')}</p>
              <p className="text-xl font-bold text-amber-300 font-mono mt-0.5">{inProgressIssues.length}</p>
            </div>

            <div className="px-4 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center">
              <p className="text-[10px] uppercase font-bold text-emerald-400">Citizen Rating</p>
              <p className="text-xl font-bold text-emerald-300 font-mono mt-0.5 flex items-center justify-center gap-1">
                <span>⭐ {avgCitizenRating}</span>
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Admin Navigation Sub-tabs */}
      <div className="flex items-center justify-between border-b border-[#1e3857] pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAdminTab('triage')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              adminTab === 'triage'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/25'
                : 'text-slate-400 hover:text-white bg-[#0f2438]/50'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>{t('tabTriage')} ({issues.length})</span>
          </button>

          <button
            onClick={() => setAdminTab('overview')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              adminTab === 'overview'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/25'
                : 'text-slate-400 hover:text-white bg-[#0f2438]/50'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>{t('tabAnalytics')}</span>
          </button>

          <button
            onClick={() => setAdminTab('departments')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              adminTab === 'departments'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/25'
                : 'text-slate-400 hover:text-white bg-[#0f2438]/50'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>{t('tabDepartments')}</span>
          </button>
        </div>

        <button
          onClick={refreshIssues}
          className="p-2 rounded-xl bg-[#0f2438] hover:bg-[#16304d] text-slate-300 border border-[#1e3857] transition-all flex items-center gap-1 text-xs"
          title="Refresh Issues from Database"
        >
          <RefreshCw className="w-4 h-4" />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* TAB 1: TRIAGE & DISPATCH VIEW (Kanban / Cards) */}
      {adminTab === 'triage' && (
        <div className="space-y-4">
          
          {/* Filter Bar */}
          <div className="bg-[#0f2438]/80 border border-[#1e3857] rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-lg">
            <div className="flex-1 min-w-[240px] relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by complaint ID, title, or street..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#0a192f] border border-[#1e3857] text-slate-100 text-xs focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-[#0a192f] border border-[#1e3857] text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
              >
                <option value="all">{t('allStatus')}</option>
                <option value="open">{t('open')}</option>
                <option value="in_progress">{t('inProgress')}</option>
                <option value="resolved">{t('resolved')}</option>
              </select>

              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-[#0a192f] border border-[#1e3857] text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
              >
                <option value="all">{t('allCategories')}</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Kanban / Multi-Column Triage Board */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            
            {/* COLUMN 1: OPEN (Needs Triage) */}
            <div className="bg-[#0a192f]/70 border border-rose-500/30 rounded-2xl p-4 space-y-3 shadow-xl">
              <div className="flex items-center justify-between pb-2 border-b border-[#1e3857]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                  <h3 className="font-bold text-sm text-slate-100 uppercase tracking-wider">
                    {t('openAndPending')} ({openIssues.length})
                  </h3>
                </div>
                <span className="text-[10px] text-rose-400 font-mono font-bold bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20">
                  {t('actionRequired')}
                </span>
              </div>

              <div className="space-y-3">
                {openIssues.map(issue => (
                  <div 
                    key={issue.id} 
                    onClick={() => setInspectingIssue(issue)}
                    className="bg-[#0f2438] border border-[#1e3857] hover:border-cyan-500/50 rounded-2xl p-4 space-y-3 shadow-lg cursor-pointer transition-all hover:-translate-y-0.5 group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-lg border border-cyan-500/20">
                        #{issue.id}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        {issue.priority}
                      </span>
                    </div>

                    <div className="flex gap-3">
                      {issue.photoUrl && (
                        <div 
                          className="relative w-16 h-16 rounded-xl overflow-hidden bg-slate-900 shrink-0 border border-[#1e3857] group/img"
                          onClick={(e) => {
                            e.stopPropagation();
                            setZoomImage({
                              src: issue.photoUrl,
                              alt: issue.title,
                              title: `Initial Report Photo • #${issue.id}`,
                              subtitle: `${issue.address} • Reported by ${issue.reporter?.name || 'Citizen'}`,
                              badge: 'Initial Report',
                              badgeColor: 'rose'
                            });
                          }}
                        >
                          <img src={issue.photoUrl} alt="Thumb" className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-300" />
                          <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white">
                            <ZoomIn className="w-4 h-4 text-cyan-300" />
                          </div>
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <h4 className="font-semibold text-xs text-slate-100 group-hover:text-cyan-300 transition-colors line-clamp-1">{issue.title}</h4>
                        <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-cyan-400 shrink-0" /> {issue.address}
                        </p>
                        <p className="text-[10px] text-cyan-400 font-mono mt-1 truncate">
                          👤 {issue.reporter?.name || 'Citizen'} • 📱 +91 {issue.reporter?.phone || '9876543210'}
                        </p>
                      </div>
                    </div>

                    <div className="pt-2.5 border-t border-[#1e3857] flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">
                        {issue.upvotes || 0} {t('upvotes')}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenStatusModal(issue);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center gap-1"
                      >
                        <span>{t('dispatchCrewBtn')}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* COLUMN 2: IN PROGRESS */}
            <div className="bg-[#0a192f]/70 border border-amber-500/30 rounded-2xl p-4 space-y-3 shadow-xl">
              <div className="flex items-center justify-between pb-2 border-b border-[#1e3857]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <h3 className="font-bold text-sm text-slate-100 uppercase tracking-wider">
                    {t('inProgressCrews')} ({inProgressIssues.length})
                  </h3>
                </div>
                <span className="text-[10px] text-amber-400 font-mono font-bold bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                  Active
                </span>
              </div>

              <div className="space-y-3">
                {inProgressIssues.map(issue => (
                  <div 
                    key={issue.id} 
                    onClick={() => setInspectingIssue(issue)}
                    className="bg-[#0f2438] border border-[#1e3857] hover:border-amber-500/50 rounded-2xl p-4 space-y-3 shadow-lg cursor-pointer transition-all hover:-translate-y-0.5 group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
                        #{issue.id}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-300">
                        {issue.departmentName}
                      </span>
                    </div>

                    <div className="flex gap-3">
                      {issue.photoUrl && (
                        <div 
                          className="relative w-16 h-16 rounded-xl overflow-hidden bg-slate-900 shrink-0 border border-[#1e3857] group/img"
                          onClick={(e) => {
                            e.stopPropagation();
                            setZoomImage({
                              src: issue.photoUrl,
                              alt: issue.title,
                              title: `Complaint Photo • #${issue.id}`,
                              subtitle: `${issue.address} • Crew: ${issue.assignedTo || 'Assigned'}`,
                              badge: 'In Progress',
                              badgeColor: 'amber'
                            });
                          }}
                        >
                          <img src={issue.photoUrl} alt="Thumb" className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-300" />
                          <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white">
                            <ZoomIn className="w-4 h-4 text-amber-300" />
                          </div>
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <h4 className="font-semibold text-xs text-slate-100 group-hover:text-amber-300 transition-colors line-clamp-1">{issue.title}</h4>
                        <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{issue.address}</p>
                        <p className="text-[10px] text-cyan-400 font-mono mt-1 truncate">
                          👤 {issue.reporter?.name || 'Citizen'} • 📱 +91 {issue.reporter?.phone || '9876543210'}
                        </p>
                        <p className="text-[10px] text-amber-400 font-medium mt-0.5 truncate">
                          Assigned: {issue.assignedTo || 'Field Crew'}
                        </p>
                      </div>
                    </div>

                    <div className="pt-2.5 border-t border-[#1e3857] flex items-center justify-between">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setInspectingIssue(issue);
                        }}
                        className="text-[11px] text-slate-400 hover:text-cyan-400 flex items-center gap-1"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>View Details</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenStatusModal(issue);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 font-bold text-xs border border-amber-500/40 transition-all flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Resolve & Publish</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* COLUMN 3: RESOLVED */}
            <div className="bg-[#0a192f]/70 border border-emerald-500/30 rounded-2xl p-4 space-y-3 shadow-xl">
              <div className="flex items-center justify-between pb-2 border-b border-[#1e3857]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <h3 className="font-bold text-sm text-slate-100 uppercase tracking-wider">
                    {t('resolved')} ({resolvedIssues.length})
                  </h3>
                </div>
                <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                  Closed & Published
                </span>
              </div>

              <div className="space-y-3">
                {resolvedIssues.map(issue => {
                  const latestFeedback = issue.feedback?.[0];
                  return (
                    <div 
                      key={issue.id} 
                      onClick={() => setInspectingIssue(issue)}
                      className="bg-[#0f2438] border border-[#1e3857] hover:border-emerald-500/50 rounded-2xl p-4 space-y-3 shadow-lg cursor-pointer transition-all hover:-translate-y-0.5 group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                          #{issue.id}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> {t('resolved')}
                        </span>
                      </div>

                      <div className="flex gap-3">
                        {/* Render resolution photo if present, otherwise reported photo */}
                        <div 
                          className="relative w-16 h-16 rounded-xl overflow-hidden bg-slate-900 shrink-0 border border-emerald-500/40 group/img"
                          onClick={(e) => {
                            e.stopPropagation();
                            setZoomImage({
                              src: issue.resolvedPhotoUrl || issue.photoUrl,
                              alt: issue.title,
                              title: issue.resolvedPhotoUrl ? `Resolution Proof Photo • #${issue.id}` : `Report Photo • #${issue.id}`,
                              subtitle: `Fixed by ${issue.assignedTo || 'Field Crew'} • ${issue.address}`,
                              badge: issue.resolvedPhotoUrl ? 'Resolution Proof' : 'Initial Report',
                              badgeColor: 'emerald'
                            });
                          }}
                        >
                          <img 
                            src={issue.resolvedPhotoUrl || issue.photoUrl} 
                            alt="Resolution thumb" 
                            className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-300" 
                          />
                          <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white">
                            <ZoomIn className="w-4 h-4 text-emerald-300" />
                          </div>
                          {issue.resolvedPhotoUrl && (
                            <div className="absolute bottom-0 inset-x-0 bg-emerald-950/90 text-emerald-300 text-[8px] font-bold text-center py-0.5">
                              Fixed Photo
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <h4 className="font-semibold text-xs text-slate-100 group-hover:text-emerald-300 transition-colors line-clamp-1">{issue.title}</h4>
                          <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{issue.address}</p>
                          
                          {/* Citizen Feedback Rating if present */}
                          {latestFeedback ? (
                            <div className="mt-1 flex items-center gap-1.5 text-[11px] bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg text-emerald-300 font-medium">
                              <span>{'⭐'.repeat(latestFeedback.rating)}</span>
                              <span className="truncate text-slate-300 font-mono">({latestFeedback.rating}/5)</span>
                            </div>
                          ) : (
                            <p className="text-[10px] text-slate-500 font-mono mt-1">
                              Fixed by {issue.assignedTo || 'Public Works'}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="pt-2.5 border-t border-[#1e3857] flex items-center justify-between">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setInspectingIssue(issue);
                          }}
                          className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>View Full Proof</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenStatusModal(issue);
                          }}
                          className="text-[11px] text-slate-400 hover:text-white"
                        >
                          {t('updateResolveBtn')}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* TAB 2: ANALYTICS & SLAS */}
      {adminTab === 'overview' && analytics && (
        <div className="space-y-6">
          
          {/* Key Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#0f2438] border border-[#1e3857] rounded-2xl p-5 shadow-xl">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{t('totalVolume')}</p>
              <p className="text-3xl font-bold text-slate-100 font-mono mt-2">{analytics.metrics.total}</p>
              <p className="text-xs text-cyan-400 mt-1">Across 6 municipal departments</p>
            </div>

            <div className="bg-[#0f2438] border border-[#1e3857] rounded-2xl p-5 shadow-xl">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{t('resolutionSLA')}</p>
              <p className="text-3xl font-bold text-emerald-400 font-mono mt-2">{analytics.metrics.resolutionRate}%</p>
              <p className="text-xs text-emerald-400/80 mt-1">Target: &gt; 80% on 48h SLA</p>
            </div>

            <div className="bg-[#0f2438] border border-[#1e3857] rounded-2xl p-5 shadow-xl">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Citizen Satisfaction</p>
              <p className="text-3xl font-bold text-amber-400 font-mono mt-2">⭐ {avgCitizenRating}</p>
              <p className="text-xs text-amber-400/80 mt-1">Based on {totalFeedbackCount} citizen reviews</p>
            </div>

            <div className="bg-[#0f2438] border border-[#1e3857] rounded-2xl p-5 shadow-xl">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{t('communityUpvotes')}</p>
              <p className="text-3xl font-bold text-purple-400 font-mono mt-2">{analytics.metrics.totalUpvotes}</p>
              <p className="text-xs text-purple-400/80 mt-1">Citizen engagement signal</p>
            </div>
          </div>

          {/* Department Workload & Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Department SLA Matrix */}
            <div className="bg-[#0f2438] border border-[#1e3857] rounded-2xl p-6 shadow-xl space-y-4">
              <h3 className="font-display font-bold text-base text-slate-100 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-cyan-400" />
                {t('deptSLAAdherence')}
              </h3>

              <div className="space-y-4">
                {analytics.departmentPerformance.map(dept => (
                  <div key={dept.departmentId} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-200">{dept.name}</span>
                      <span className="text-cyan-400 font-mono">{dept.resolutionRate}% ({dept.totalAssigned} cases)</span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-[#0a192f] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.max(10, dept.resolutionRate)}%`,
                          backgroundColor: dept.color || '#06b6d4'
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Category Breakdown */}
            <div className="bg-[#0f2438] border border-[#1e3857] rounded-2xl p-6 shadow-xl space-y-4">
              <h3 className="font-display font-bold text-base text-slate-100 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-cyan-400" />
                {t('categoryDistribution')}
              </h3>

              <div className="grid grid-cols-2 gap-3">
                {analytics.categoryBreakdown.map(cat => (
                  <div key={cat.category} className="bg-[#0a192f] p-3 rounded-xl border border-[#1e3857]">
                    <span className="text-xs text-slate-400 capitalize block">{cat.category.replace('_', ' ')}</span>
                    <p className="text-xl font-bold text-slate-100 font-mono mt-1">{cat.count} reports</p>
                    <span className="text-[11px] text-cyan-400">{cat.percentage}% of total</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* TAB 3: DEPARTMENTS OVERVIEW */}
      {adminTab === 'departments' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map(dept => (
            <div key={dept.id} className="bg-[#0f2438] border border-[#1e3857] rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold text-white uppercase tracking-wider" style={{ backgroundColor: dept.color }}>
                  {dept.code}
                </span>
                <span className="text-xs font-mono text-slate-400">Avg {dept.avgResolutionHours}h fix</span>
              </div>

              <div>
                <h3 className="font-bold text-base text-slate-100">{dept.name}</h3>
                <p className="text-xs text-slate-400 mt-1">Lead: <span className="text-slate-200">{dept.head}</span></p>
                <p className="text-xs text-cyan-400 font-mono mt-0.5">{dept.contact}</p>
              </div>

              <div className="pt-3 border-t border-[#1e3857] text-xs space-y-1 text-slate-400">
                <p className="font-semibold text-slate-300">Categories:</p>
                <p className="capitalize">{dept.categories.join(', ').replace(/_/g, ' ')}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* OFFICER COMPLAINT INSPECTION MODAL (Shows full details, zoomable images, citizen details, timeline, feedback) */}
      {inspectingIssue && (
        <div className="fixed inset-0 z-[1000] overflow-y-auto flex items-center justify-center p-4 sm:p-6">
          <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md" onClick={() => setInspectingIssue(null)} />

          <div className="relative w-full max-w-3xl bg-[#0a192f] border border-cyan-500/40 rounded-3xl shadow-2xl overflow-hidden z-10 my-8">
            
            {/* Header */}
            <div className="p-5 sm:p-6 border-b border-[#1e3857] bg-[#0f2438]/90 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-500/15 px-2 py-0.5 rounded-lg border border-cyan-500/30">
                      Complaint #{inspectingIssue.id}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                      inspectingIssue.status === 'resolved'
                        ? 'badge-resolved'
                        : inspectingIssue.status === 'in_progress'
                        ? 'badge-in_progress'
                        : 'badge-open'
                    }`}>
                      {inspectingIssue.status === 'resolved' ? t('resolved') : inspectingIssue.status === 'in_progress' ? t('inProgress') : t('open')}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-slate-800 text-slate-300">
                      Priority: {inspectingIssue.priority}
                    </span>
                  </div>
                  <h2 className="font-display font-bold text-lg sm:text-xl text-slate-100 mt-1">
                    {inspectingIssue.title}
                  </h2>
                </div>
              </div>

              <button
                onClick={() => setInspectingIssue(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-[#16304d] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-5 sm:p-6 space-y-6 max-h-[calc(85vh-140px)] overflow-y-auto">
              
              {/* Photos Comparison: Reported Photo vs Resolution Proof Photo with Click to Zoom */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* 1. Initial Reported Photo */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-300 font-semibold uppercase tracking-wider">
                    <span className="flex items-center gap-1.5 text-cyan-300 font-bold">
                      <Camera className="w-4 h-4 text-cyan-400" />
                      Reported Complaint Photo
                    </span>
                    <span className="text-[10px] text-cyan-400 font-mono bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/20">
                      🔍 Click photo to Zoom
                    </span>
                  </div>
                  
                  <div 
                    onClick={() => {
                      if (inspectingIssue.photoUrl) {
                        setZoomImage({
                          src: inspectingIssue.photoUrl,
                          alt: inspectingIssue.title,
                          title: `Initial Complaint Photo • #${inspectingIssue.id}`,
                          subtitle: `${inspectingIssue.address} • Reported by ${inspectingIssue.reporter?.name || 'Citizen'}`,
                          badge: 'Initial Report',
                          badgeColor: 'cyan'
                        });
                      }
                    }}
                    className="h-52 rounded-2xl overflow-hidden bg-slate-900 border-2 border-[#1e3857] hover:border-cyan-400 shadow-xl relative group cursor-zoom-in transition-all duration-300"
                  >
                    <img
                      src={inspectingIssue.photoUrl || 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop&q=80'}
                      alt="Report photo"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    
                    {/* Always-visible Top Right Zoom Badge */}
                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-950/85 text-cyan-300 text-[11px] font-bold border border-cyan-500/40 backdrop-blur-md shadow-lg group-hover:bg-cyan-500 group-hover:text-slate-950 transition-all">
                      <ZoomIn className="w-3.5 h-3.5" />
                      <span>Zoom In / Out</span>
                    </div>

                    <div className="absolute inset-0 bg-slate-950/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 text-white font-bold text-xs backdrop-blur-[2px]">
                      <div className="p-3 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-xl">
                        <ZoomIn className="w-6 h-6" />
                      </div>
                      <span>Click to Open Fullscreen Zoom</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (inspectingIssue.photoUrl) {
                        setZoomImage({
                          src: inspectingIssue.photoUrl,
                          alt: inspectingIssue.title,
                          title: `Initial Complaint Photo • #${inspectingIssue.id}`,
                          subtitle: `${inspectingIssue.address} • Reported by ${inspectingIssue.reporter?.name || 'Citizen'}`,
                          badge: 'Initial Report',
                          badgeColor: 'cyan'
                        });
                      }
                    }}
                    className="w-full py-2 rounded-xl bg-[#0f2438] hover:bg-cyan-500/20 text-cyan-300 hover:text-white border border-[#1e3857] hover:border-cyan-500/40 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-md"
                  >
                    <ZoomIn className="w-3.5 h-3.5 text-cyan-400" />
                    <span>🔍 Zoom & Inspect Reported Photo</span>
                  </button>
                </div>

                {/* 2. Resolution Proof Photo */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider">
                    <span className="flex items-center gap-1.5 text-emerald-300 font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      Resolution Proof Photo
                    </span>
                    {inspectingIssue.resolvedPhotoUrl && (
                      <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                        🔍 Click photo to Zoom
                      </span>
                    )}
                  </div>

                  {inspectingIssue.resolvedPhotoUrl ? (
                    <>
                      <div 
                        onClick={() => {
                          setZoomImage({
                            src: inspectingIssue.resolvedPhotoUrl,
                            alt: inspectingIssue.title,
                            title: `Resolution Proof Photo • #${inspectingIssue.id}`,
                            subtitle: `Verified fix by ${inspectingIssue.assignedTo || 'Field Crew'} • ${inspectingIssue.address}`,
                            badge: 'Resolution Proof',
                            badgeColor: 'emerald'
                          });
                        }}
                        className="h-52 rounded-2xl overflow-hidden bg-slate-900 border-2 border-emerald-500/50 hover:border-emerald-400 shadow-xl relative group cursor-zoom-in transition-all duration-300"
                      >
                        <img
                          src={inspectingIssue.resolvedPhotoUrl}
                          alt="Resolved photo"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        
                        {/* Always-visible Top Right Zoom Badge */}
                        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-950/85 text-emerald-300 text-[11px] font-bold border border-emerald-500/40 backdrop-blur-md shadow-lg group-hover:bg-emerald-500 group-hover:text-slate-950 transition-all">
                          <ZoomIn className="w-3.5 h-3.5" />
                          <span>Zoom In / Out</span>
                        </div>

                        <div className="absolute inset-0 bg-slate-950/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 text-white font-bold text-xs backdrop-blur-[2px]">
                          <div className="p-3 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/50 shadow-xl">
                            <ZoomIn className="w-6 h-6" />
                          </div>
                          <span>Click to Open Fullscreen Zoom</span>
                        </div>
                        <div className="absolute bottom-2.5 left-2.5 px-2.5 py-1 rounded-lg bg-emerald-950/90 text-emerald-300 text-[11px] font-bold border border-emerald-500/40 backdrop-blur-md shadow-md">
                          ✓ Published Proof
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setZoomImage({
                            src: inspectingIssue.resolvedPhotoUrl,
                            alt: inspectingIssue.title,
                            title: `Resolution Proof Photo • #${inspectingIssue.id}`,
                            subtitle: `Verified fix by ${inspectingIssue.assignedTo || 'Field Crew'} • ${inspectingIssue.address}`,
                            badge: 'Resolution Proof',
                            badgeColor: 'emerald'
                          });
                        }}
                        className="w-full py-2 rounded-xl bg-emerald-950/60 hover:bg-emerald-500/20 text-emerald-300 hover:text-white border border-emerald-500/40 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-md"
                      >
                        <ZoomIn className="w-3.5 h-3.5 text-emerald-400" />
                        <span>🔍 Zoom & Inspect Resolution Photo</span>
                      </button>
                    </>
                  ) : (
                    <div className="h-52 rounded-2xl bg-[#0f2438]/60 border border-[#1e3857] p-4 flex flex-col items-center justify-center text-center">
                      <div className="p-3 rounded-2xl mb-2 bg-amber-500/10 text-amber-400">
                        <Clock className="w-6 h-6" />
                      </div>
                      <h4 className="text-xs font-bold text-slate-200">
                        {inspectingIssue.status === 'in_progress' ? 'Repairs in Progress' : 'Pending Resolution'}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
                        Post resolution photo when closing this issue so citizen can inspect the fix.
                      </p>
                      <button
                        type="button"
                        onClick={() => handleOpenStatusModal(inspectingIssue)}
                        className="mt-3 px-3 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500 text-cyan-300 hover:text-slate-950 text-xs font-bold border border-cyan-500/30 transition-all"
                      >
                        Upload Resolution Photo
                      </button>
                    </div>
                  )}
                </div>

              </div>

              {/* Citizen Feedback Rating Card (if available) */}
              {inspectingIssue.feedback && inspectingIssue.feedback.length > 0 && (
                <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-2xl p-4 sm:p-5 space-y-3 shadow-xl">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                      <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                      <span>Citizen Feedback & Rating</span>
                    </h4>
                    <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                      Satisfied Resolution
                    </span>
                  </div>

                  {inspectingIssue.feedback.map(fb => (
                    <div key={fb.id} className="bg-[#0a192f]/80 rounded-xl p-3 border border-emerald-500/20 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <img 
                            src={fb.userAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(fb.userName || 'Citizen')}`} 
                            alt={fb.userName} 
                            className="w-6 h-6 rounded-full border border-emerald-400/40" 
                          />
                          <span className="text-xs font-bold text-slate-200">{fb.userName || 'Citizen Reviewer'}</span>
                        </div>
                        <div className="text-amber-400 font-mono text-xs flex items-center gap-1">
                          <span>{'⭐'.repeat(fb.rating)}</span>
                          <span className="text-slate-300">({fb.rating}/5)</span>
                        </div>
                      </div>

                      {fb.comment && (
                        <p className="text-xs text-slate-200 italic leading-relaxed bg-[#0f2438] p-2.5 rounded-lg border border-[#1e3857]">
                          "{fb.comment}"
                        </p>
                      )}

                      {fb.tags && fb.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {fb.tags.map((t, idx) => (
                            <span key={idx} className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[10px] font-semibold">
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Details and Reporter Grid */}
              <div className="bg-[#0f2438]/70 border border-[#1e3857] rounded-2xl p-4 sm:p-5 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                  {t('detailedDescription')}
                </h4>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                  {inspectingIssue.description || 'No additional description provided.'}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-[#1e3857] text-xs">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Address</span>
                    <span className="font-medium text-slate-200 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      {inspectingIssue.address}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                      [{inspectingIssue.latitude.toFixed(4)}, {inspectingIssue.longitude.toFixed(4)}]
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 block text-[11px]">Department & Crew</span>
                    <span className="font-medium text-slate-200 block mt-0.5">
                      {inspectingIssue.departmentName || 'Public Works'}
                    </span>
                    <span className="text-[11px] text-cyan-400 font-mono block mt-0.5">
                      {inspectingIssue.assignedTo || 'Unassigned'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 block text-[11px]">Reported By</span>
                    <span className="font-medium text-slate-200 flex items-center gap-1 mt-0.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>{inspectingIssue.reporter?.name || 'Citizen'}</span>
                    </span>
                    <span className="text-[11px] text-cyan-400 font-mono block mt-0.5">
                      📱 +91 {inspectingIssue.reporter?.phone || '9876543210'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-cyan-400" />
                    {t('liveTimelineTitle')}
                  </h4>
                  <span className="text-[11px] text-cyan-400 font-mono">
                    {inspectingIssue.timeline?.length || 1} {t('eventsLogged')}
                  </span>
                </div>

                <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#1e3857]">
                  {inspectingIssue.timeline && inspectingIssue.timeline.map((event, idx) => {
                    const isLast = idx === inspectingIssue.timeline.length - 1;
                    return (
                      <div key={event.id || idx} className="relative">
                        <div className={`absolute -left-6 top-1 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          isLast ? 'bg-cyan-500 border-cyan-300 ring-4 ring-cyan-500/20' : 'bg-[#0a192f] border-slate-500'
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${isLast ? 'bg-slate-950' : 'bg-slate-400'}`} />
                        </div>

                        <div className="bg-[#0f2438]/60 border border-[#1e3857] rounded-xl p-3">
                          <div className="flex flex-wrap items-center justify-between gap-1">
                            <span className="font-bold text-xs text-slate-100">{event.title}</span>
                            <span className="font-mono text-[11px] text-slate-400">
                              {event.timeFormatted || new Date(event.time).toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 mt-1">{event.description}</p>
                          <div className="mt-1.5 text-[10px] text-cyan-400 font-medium">Actor: {event.actor}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-4 border-t border-[#1e3857] flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setInspectingIssue(null)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white bg-[#0f2438] border border-[#1e3857]"
                >
                  Close Inspection
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenStatusModal(inspectingIssue)}
                    className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/25 flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Update / Resolve Complaint</span>
                  </button>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* STATUS UPDATE, DISPATCH & RESOLUTION PHOTO PUBLISHING MODAL */}
      {editingIssue && (
        <div className="fixed inset-0 z-[1100] overflow-y-auto flex items-center justify-center p-4 sm:p-6">
          <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md" onClick={() => setEditingIssue(null)} />
          
          <div className="relative w-full max-w-xl bg-[#0a192f] border border-cyan-500/40 rounded-3xl shadow-2xl p-6 z-10 space-y-5 my-8">
            
            <div className="flex items-center justify-between pb-3 border-b border-[#1e3857]">
              <div>
                <span className="text-xs font-mono font-bold text-cyan-400">
                  {t('updateCaseTitle')} #{editingIssue.id}
                </span>
                <h3 className="font-bold text-base text-slate-100 mt-0.5">
                  {editingIssue.title}
                </h3>
              </div>
              <button onClick={() => setEditingIssue(null)} className="p-1.5 rounded-lg text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            {updateSuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                <span>{updateSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveStatusUpdate} className="space-y-4">
              
              {/* Status Select */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  {t('transitionStatus')}
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'open', label: 'Open', color: 'border-rose-500 text-rose-300' },
                    { id: 'in_progress', label: 'In Progress', color: 'border-amber-500 text-amber-300' },
                    { id: 'resolved', label: 'Resolved 🎉', color: 'border-emerald-500 text-emerald-300' },
                    { id: 'rejected', label: 'Rejected', color: 'border-slate-500 text-slate-300' }
                  ].map(st => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setNewStatus(st.id)}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all text-center ${
                        newStatus === st.id
                          ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md'
                          : 'bg-[#0f2438] text-slate-400 border-[#1e3857] hover:border-slate-500'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Department Assignment */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    {t('assignDept')}
                  </label>
                  <select
                    value={selectedDeptId}
                    onChange={(e) => setSelectedDeptId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#0f2438] border border-[#1e3857] text-slate-100 text-xs focus:border-cyan-500"
                  >
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    {t('fieldDispatchUnit')}
                  </label>
                  <input
                    type="text"
                    value={assignedCrew}
                    onChange={(e) => setAssignedCrew(e.target.value)}
                    placeholder="e.g. Crew Bravo - Heavy Asphalt"
                    className="w-full px-3 py-2 rounded-xl bg-[#0f2438] border border-[#1e3857] text-slate-100 text-xs focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* RESOLUTION PHOTO UPLOAD & PUBLISH SECTION (Visible when status is 'resolved') */}
              {newStatus === 'resolved' && (
                <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                      <Camera className="w-4 h-4 text-emerald-400" />
                      <span>Upload Resolution Proof Photo</span>
                    </label>
                    <span className="text-[10px] text-emerald-400 font-mono">Visible to Citizen</span>
                  </div>

                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  {/* Drag and Drop Zone or Live Preview */}
                  {resolvedPhotoPreview ? (
                    <div className="relative rounded-2xl overflow-hidden border border-emerald-500/50 h-44 bg-slate-900 group">
                      <img
                        src={resolvedPhotoPreview}
                        alt="Resolution proof preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md"
                        >
                          Change Photo
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setResolvedPhotoFile(null);
                            setResolvedPhotoPreview(null);
                            setResolvedPhotoUrl('');
                          }}
                          className="px-3 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs shadow-md"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-emerald-950/90 text-emerald-300 text-[10px] font-bold border border-emerald-500/40">
                        ✓ Photo Ready to Publish
                      </div>
                    </div>
                  ) : (
                    <div
                      onDragOver={(e) => { e.preventDefault(); setIsDraggingFile(true); }}
                      onDragLeave={() => setIsDraggingFile(false)}
                      onDrop={handleFileDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`p-6 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                        isDraggingFile
                          ? 'border-emerald-400 bg-emerald-500/20'
                          : 'border-emerald-500/40 bg-[#0f2438]/70 hover:border-emerald-400 hover:bg-[#0f2438]'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-2">
                        <UploadCloud className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-bold text-slate-100">
                        Click or drag & drop resolution photo
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        JPG, PNG, WebP from camera or device (up to 10MB)
                      </p>
                    </div>
                  )}

                  {/* Preset quick resolution photos */}
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                      Or select quick sample resolution photo:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { label: '🛠️ Fresh Asphalt Patch', url: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=800&auto=format&fit=crop&q=80' },
                        { label: '💡 Repaired Streetlight', url: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=800&auto=format&fit=crop&q=80' },
                        { label: '✨ Clean Sanitation Bay', url: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=800&auto=format&fit=crop&q=80' }
                      ].map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setResolvedPhotoUrl(preset.url);
                            setResolvedPhotoPreview(preset.url);
                            setResolvedPhotoFile(null);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-[#0f2438] hover:bg-[#163558] text-slate-300 hover:text-emerald-300 text-[10px] font-medium border border-[#1e3857] transition-all"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Note / Dispatch Comment */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  {newStatus === 'resolved' ? 'Resolution Work Summary & Notes' : t('dispatchNoteAudit')}
                </label>
                <textarea
                  value={dispatchNote}
                  onChange={(e) => setDispatchNote(e.target.value)}
                  placeholder={newStatus === 'resolved' ? "e.g. Issue repaired and certified. Road/amenity restored to normal state." : "e.g. Crew dispatched with patch truck..."}
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl bg-[#0f2438] border border-[#1e3857] text-slate-100 text-xs focus:border-cyan-500 resize-none"
                />
              </div>

              <div className="pt-3 border-t border-[#1e3857] flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Instant alert sent to citizen
                </span>
                
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingIssue(null)}
                    className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                  >
                    {t('cancelBtn')}
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className={`px-5 py-2 rounded-xl font-bold text-xs shadow-lg transition-all ${
                      newStatus === 'resolved'
                        ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/25'
                        : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/25'
                    }`}
                  >
                    {isUpdating ? t('saving') : newStatus === 'resolved' ? 'Publish Resolution & Photo' : t('saveAndPushBtn')}
                  </button>
                </div>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Lightbox / Zoom Modal */}
      {zoomImage && (
        <ImageZoomModal
          src={zoomImage.src}
          alt={zoomImage.alt}
          title={zoomImage.title}
          subtitle={zoomImage.subtitle}
          badge={zoomImage.badge}
          badgeColor={zoomImage.badgeColor}
          onClose={() => setZoomImage(null)}
        />
      )}

      {/* Edit Officer Profile Modal */}
      <EditProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
      />

    </div>
  );
}
