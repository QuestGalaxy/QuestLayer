import React, { useEffect, useState } from 'react';
import { fetchProjects, fetchProjectStats, fetchGlobalDashboardStats, deleteProject } from '../lib/supabase';
import { Plus, Layout, ArrowRight, Loader2, Calendar, FolderOpen, LogOut, Globe, ExternalLink, Image as ImageIcon, Users, Eye, CheckCircle, Activity, Wifi, BarChart3, Zap, Layers, Trash2, AlertTriangle, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useDisconnect, useAppKitAccount } from '@reown/appkit/react';
import GlobalFooter from './GlobalFooter';

interface DashboardProps {
  onSelectProject: (projectId: string) => void;
  onCreateProject: () => void;
  onDisconnect: () => void;
  onBrowse: () => void;
  onDeleteProject: (projectId: string) => void;
}

const GlobalStats: React.FC<{ ownerAddress: string }> = ({ ownerAddress }) => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchGlobalDashboardStats(ownerAddress);
        setStats(data);
      } catch (e) {
        console.error('Failed to load global stats', e);
      } finally {
        setLoading(false);
      }
    };
    if (ownerAddress) load();
  }, [ownerAddress]);

  if (loading) return <div className="h-32 w-full animate-pulse bg-slate-900/50 rounded-3xl mb-8"></div>;
  if (!stats) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
      <div className="bg-slate-900/40 border border-white/5 p-5 rounded-3xl flex flex-col items-center justify-center text-center group hover:bg-slate-900 hover:border-indigo-500/30 transition-all">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-3 group-hover:scale-110 transition-transform">
          <Activity size={20} />
        </div>
        <p className="text-3xl font-black text-white mb-1">{stats.total_visits || 0}</p>
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Total Views</p>
      </div>

      <div className="bg-slate-900/40 border border-white/5 p-5 rounded-3xl flex flex-col items-center justify-center text-center group hover:bg-slate-900 hover:border-emerald-500/30 transition-all">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-3 group-hover:scale-110 transition-transform">
          <Users size={20} />
        </div>
        <p className="text-3xl font-black text-white mb-1">{stats.total_users || 0}</p>
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Unique Users</p>
      </div>

      <div className="bg-slate-900/40 border border-white/5 p-5 rounded-3xl flex flex-col items-center justify-center text-center group hover:bg-slate-900 hover:border-amber-500/30 transition-all">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 mb-3 group-hover:scale-110 transition-transform">
          <Zap size={20} />
        </div>
        <p className="text-3xl font-black text-white mb-1">{stats.total_actions || 0}</p>
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Actions Completed</p>
      </div>

      <div className="bg-slate-900/40 border border-white/5 p-5 rounded-3xl flex flex-col items-center justify-center text-center group hover:bg-slate-900 hover:border-pink-500/30 transition-all">
        <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-400 mb-3 group-hover:scale-110 transition-transform">
          <Layers size={20} />
        </div>
        <p className="text-3xl font-black text-white mb-1">{stats.total_projects || 0}</p>
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Active Widgets</p>
      </div>
    </div>
  );
};

const ProjectCard: React.FC<{ project: any; onSelect: () => void; onDelete: () => void }> = ({ project, onSelect, onDelete }) => {
  const [ogImage, setOgImage] = useState<string | null>(null);
  const [loadingImage, setLoadingImage] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowConfirm(true);
  };

  const confirmDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleting(true);
    try {
      await onDelete();
    } catch (error) {
      console.error("Delete failed", error);
      setIsDeleting(false);
      setShowConfirm(false);
    }
  };

  const cancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowConfirm(false);
  };

  const getProjectInitials = (name: string) => {
    const cleaned = name?.trim() || '';
    if (!cleaned) return 'QL';
    const parts = cleaned.split(/\s+/).filter(Boolean);
    const letters = parts.slice(0, 2).map(part => part[0]).join('');
    return letters.toUpperCase();
  };

  // Fetch OG Image
  useEffect(() => {
    if (!project.domain) return;
    let isMounted = true;
    setLoadingImage(true);

    const fetchOg = async () => {
      try {
        const target = project.domain.startsWith('http') ? project.domain : `https://${project.domain}`;
        const url = `/api/og?url=${encodeURIComponent(target)}`;
        const res = await fetch(url);
        const data = await res.json();
        if (isMounted && data?.image) {
          setOgImage(data.image);
        }
      } catch (e) {
        // Ignore
      } finally {
        if (isMounted) setLoadingImage(false);
      }
    };

    fetchOg();
    return () => { isMounted = false; };
  }, [project.domain]);

  // Fetch Analytics Stats
  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await fetchProjectStats(project.id);
        setStats(data);
      } catch (e) {
        console.error('Failed to load stats', e);
      }
    };
    loadStats();
  }, [project.id]);

  // Online Status: Check if last_ping_at is within 5 minutes
  const isOnline = React.useMemo(() => {
    if (!project.last_ping_at) return false;
    const lastPing = new Date(project.last_ping_at).getTime();
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return lastPing > sevenDaysAgo;
  }, [project.last_ping_at]);

  const getFaviconUrl = (link: string) => {
    try {
      if (!link || link.length < 4) return '';
      let validLink = link.trim();
      validLink = validLink.replace(/[\/.]+$/, '');
      if (!validLink.startsWith('http://') && !validLink.startsWith('https://')) {
        validLink = `https://${validLink}`;
      }
      const url = new URL(validLink);
      let hostname = url.hostname;
      if (hostname.endsWith('.')) hostname = hostname.slice(0, -1);
      const parts = hostname.split('.');
      if (parts.length < 2 || parts[parts.length - 1].length < 2) return '';
      return `https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${hostname}&size=128`;
    } catch {
      return '';
    }
  };

  const projectIconUrl = project.logo || (project.domain ? getFaviconUrl(project.domain) : '');

  return (
    <div
      onClick={onSelect}
      className="group relative cursor-pointer rounded-3xl border border-white/10 bg-slate-900/40 overflow-hidden transition-all hover:bg-slate-900 hover:border-indigo-500/50 hover:shadow-[0_0_30px_rgba(99,102,241,0.1)] flex flex-col h-full"
    >
      {/* Card Header / Image Area */}
      <div className="relative h-32 w-full bg-slate-950/50 border-b border-white/5">
        <div className="absolute inset-0 overflow-hidden">
          {ogImage ? (
            <img
              src={ogImage}
              alt="Preview"
              className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-500 group-hover:scale-105 transform"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="absolute inset-0 opacity-70"
                style={{
                  background: `radial-gradient(120% 120% at 10% 10%, ${project.accent_color}55, transparent 60%), radial-gradient(120% 120% at 90% 90%, ${project.accent_color}33, transparent 65%), linear-gradient(135deg, #0f172a 0%, #0b1120 60%)`
                }}
              />
              <div className="relative flex flex-col items-center justify-center text-white/80">
                <span className="text-3xl font-black tracking-tight">
                  {getProjectInitials(project.name)}
                </span>
                <span className="text-[9px] uppercase tracking-[0.35em] text-white/40">Widget</span>
              </div>
            </div>
          )}
        </div>

        {/* Floating Icon Badge */}
        <div
          className="absolute -bottom-5 left-6 w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg z-20 border-2 border-slate-900 overflow-hidden"
          style={{
            backgroundColor: projectIconUrl ? 'transparent' : project.accent_color
          }}
        >
          {projectIconUrl ? (
            <img
              src={projectIconUrl}
              alt={project.name}
              className="w-full h-full object-cover"
              onLoad={(e) => {
                const img = e.target as HTMLImageElement;
                if (img.naturalWidth < 32) {
                  img.style.display = 'none';
                  const zapIcon = img.nextElementSibling as HTMLElement;
                  if (zapIcon) zapIcon.style.display = 'flex';
                  const parent = img.parentElement;
                  if (parent) parent.style.backgroundColor = project.accent_color;
                }
              }}
              onError={(e) => {
                const img = e.target as HTMLImageElement;
                img.style.display = 'none';
                const zapIcon = img.nextElementSibling as HTMLElement;
                if (zapIcon) zapIcon.style.display = 'flex';
                const parent = img.parentElement;
                if (parent) parent.style.backgroundColor = project.accent_color;
              }}
            />
          ) : null}
          <div
            style={{ display: projectIconUrl ? 'none' : 'flex' }}
            className="w-full h-full items-center justify-center"
          >
            <Layout size={20} />
          </div>
        </div>

        {/* Theme Badge */}
        <div className="absolute top-4 right-4 flex gap-2">
          {/* Online Status Tag */}
          {isOnline && (
            <div className="px-2 py-1 rounded-lg bg-emerald-500/20 backdrop-blur-md border border-emerald-500/30 text-[10px] font-black text-emerald-400 uppercase shadow-sm flex items-center gap-1.5 animate-in fade-in">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Online
            </div>
          )}

          <div className="px-2 py-1 rounded-lg bg-black/40 backdrop-blur-md border border-white/10 text-[10px] font-mono text-slate-300 uppercase shadow-sm">
            {project.theme}
          </div>
        </div>
      </div>

      <div className="p-6 pt-8 flex-1 flex flex-col relative z-0">
        <h3 className="text-xl font-bold text-white mb-1 truncate group-hover:text-indigo-400 transition-colors">
          {project.name}
        </h3>

        {project.domain && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-4 truncate">
            <Globe size={12} className="shrink-0" />
            <span className="truncate hover:text-indigo-300 transition-colors">
              {project.domain.replace(/^https?:\/\//, '')}
            </span>
          </div>
        )}

        {/* Analytics Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Daily Visits */}
          <div className="bg-white/5 rounded-xl p-2.5 border border-white/5">
            <p className="text-[9px] text-slate-500 font-bold uppercase flex items-center gap-1 mb-0.5">
              <Eye size={10} /> Daily Visits
            </p>
            <p className="text-sm font-black text-white">{stats?.daily_visits || 0}</p>
          </div>

          {/* Connected Wallets */}
          <div className="bg-white/5 rounded-xl p-2.5 border border-white/5">
            <p className="text-[9px] text-slate-500 font-bold uppercase flex items-center gap-1 mb-0.5">
              <Users size={10} /> Connected
            </p>
            <p className="text-sm font-black text-white">{stats?.connected_wallets || 0}</p>
          </div>

          {/* Tasks Completed */}
          <div className="bg-white/5 rounded-xl p-2.5 border border-white/5">
            <p className="text-[9px] text-slate-500 font-bold uppercase flex items-center gap-1 mb-0.5">
              <CheckCircle size={10} /> Completed
            </p>
            <p className="text-sm font-black text-white">{stats?.tasks_completed || 0}</p>
          </div>

          {/* Total Visits */}
          <div className="bg-white/5 rounded-xl p-2.5 border border-white/5">
            <p className="text-[9px] text-slate-500 font-bold uppercase flex items-center gap-1 mb-0.5">
              <Activity size={10} /> Total Visits
            </p>
            <p className="text-sm font-black text-white">{stats?.total_visits || 0}</p>
          </div>
        </div>

        <div className="mt-auto flex items-center gap-4 text-[10px] font-bold uppercase text-slate-500 pt-4 border-t border-white/5">
          <span className="flex items-center gap-1.5">
            <Calendar size={12} />
            {new Date(project.created_at).toLocaleDateString()}
          </span>
          <span className="flex items-center gap-1.5 ml-auto text-indigo-400 group-hover:translate-x-1 transition-transform">
            Edit <ArrowRight size={12} />
          </span>
          <button
            onClick={handleDeleteClick}
            disabled={isDeleting}
            className="p-1.5 -mr-1.5 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors ml-2"
            title="Delete Widget"
          >
            {isDeleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
          </button>
        </div>
      </div>

      {/* Custom Confirmation Modal */}
      {showConfirm && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={(e) => e.stopPropagation()}>
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-xs shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4 text-red-500">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <AlertTriangle size={20} />
              </div>
              <h4 className="font-bold text-white uppercase text-sm">Delete Widget?</h4>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed mb-6">
              Are you sure you want to delete <span className="text-white font-bold">"{project.name}"</span>? This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={cancelDelete}
                className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold uppercase transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold uppercase transition-colors flex items-center justify-center gap-2"
              >
                {isDeleting ? <Loader2 size={12} className="animate-spin" /> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Dashboard: React.FC<DashboardProps> = ({ onSelectProject, onCreateProject, onDisconnect, onBrowse, onDeleteProject }) => {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 12;
  const { disconnect } = useDisconnect();
  const { address } = useAppKitAccount();

  const handleDisconnect = async () => {
    await disconnect();
    onDisconnect();
  };

  useEffect(() => {
    const load = async () => {
      if (!address) return;
      try {
        const data = await fetchProjects(address);
        setProjects(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [address]);

  const totalPages = Math.ceil(projects.length / ITEMS_PER_PAGE);
  const paginatedProjects = projects.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [projects.length]);

  return (
    <div className="flex-1 overflow-y-auto px-6 py-10 bg-slate-950">
      <div className="mx-auto w-full max-w-6xl space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-3xl font-black text-white uppercase tracking-tight">My Widgets</h2>
            <p className="mt-2 text-slate-400 text-sm">Manage your quest campaigns and settings.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onBrowse}
              className="flex items-center gap-2 bg-slate-900 border border-white/10 hover:bg-slate-800 text-slate-400 hover:text-white px-4 py-2.5 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all group"
            >
              <Globe size={14} className="group-hover:text-indigo-400 transition-colors" /> <span>Store</span>
            </button>
            <button
              onClick={handleDisconnect}
              className="flex items-center gap-2 bg-slate-900 border border-white/10 hover:bg-slate-800 text-slate-400 hover:text-white px-4 py-2.5 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all"
              title="Disconnect Wallet"
            >
              <LogOut size={14} /> <span>Disconnect</span>
            </button>
            <button
              onClick={onCreateProject}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-black uppercase text-xs tracking-widest transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
            >
              <Plus size={16} /> <span className="hidden sm:inline">New Widget</span>
              <span className="sm:hidden">New</span>
            </button>
          </div>
        </div>

        {/* Global Analytics Overview */}
        {address && <GlobalStats ownerAddress={address} />}

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="animate-spin text-indigo-500" size={32} />
          </div>
        ) : projects.length === 0 ? (
          <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-slate-900 to-slate-950 p-8 md:p-12 text-center">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
              <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[100px]" />
              <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 rounded-full blur-[100px]" />
            </div>

            <div className="relative z-10 max-w-3xl mx-auto space-y-8">
              <div className="space-y-4">
                <div className="w-20 h-20 mx-auto rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-6 shadow-xl shadow-indigo-500/10 rotate-3">
                  <Zap size={40} className="text-indigo-400" />
                </div>
                <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tight leading-tight">
                  Ready to Gamify <br /> Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Community?</span>
                </h2>
                <p className="text-slate-400 text-base md:text-lg max-w-xl mx-auto leading-relaxed">
                  QuestLayer helps you turn passive visitors into active community members through rewarding quests and daily engagement.
                </p>
              </div>

              {/* Steps Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                <div className="bg-white/5 border border-white/5 p-6 rounded-2xl hover:bg-white/10 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center mb-4 font-black text-lg">1</div>
                  <h4 className="text-white font-bold uppercase mb-2">Create Widget</h4>
                  <p className="text-slate-400 text-xs leading-relaxed">Set up your project branding, colors, and theme in seconds.</p>
                </div>
                <div className="bg-white/5 border border-white/5 p-6 rounded-2xl hover:bg-white/10 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center mb-4 font-black text-lg">2</div>
                  <h4 className="text-white font-bold uppercase mb-2">Add Quests</h4>
                  <p className="text-slate-400 text-xs leading-relaxed">Define social tasks, daily logins, and custom actions for XP.</p>
                </div>
                <div className="bg-white/5 border border-white/5 p-6 rounded-2xl hover:bg-white/10 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4 font-black text-lg">3</div>
                  <h4 className="text-white font-bold uppercase mb-2">Embed & Grow</h4>
                  <p className="text-slate-400 text-xs leading-relaxed">Copy one line of code to launch your rewards program instantly.</p>
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={onCreateProject}
                  className="group relative inline-flex items-center gap-3 bg-white text-black px-8 py-4 rounded-xl font-black uppercase tracking-widest text-sm hover:scale-105 transition-all shadow-xl hover:shadow-2xl hover:shadow-white/20"
                >
                  <span>Launch First Campaign</span>
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedProjects.map((p) => (
                <ProjectCard
                  key={p.id}
                  project={p}
                  onSelect={() => onSelectProject(p.id)}
                  onDelete={() => onDeleteProject(p.id)}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-12 pb-10">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-3 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft size={20} />
                </button>

                <div className="flex items-center gap-2">
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`w-10 h-10 rounded-xl font-bold text-sm transition-all ${currentPage === i + 1
                          ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                          : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                        }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-3 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
      <div className="mt-12">
        <GlobalFooter />
      </div>
    </div>
  );
};

export default Dashboard;
