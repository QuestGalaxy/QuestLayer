import React, { useEffect, useState } from 'react';
import { fetchProjects, fetchProjectStats } from '../lib/supabase';
import { Plus, Layout, ArrowRight, Loader2, Calendar, FolderOpen, LogOut, Globe, ExternalLink, Image as ImageIcon, Users, Eye, CheckCircle, Activity, Wifi } from 'lucide-react';
import { useDisconnect, useAppKitAccount } from '@reown/appkit/react';

interface DashboardProps {
  onSelectProject: (projectId: string) => void;
  onCreateProject: () => void;
  onDisconnect: () => void;
}

const ProjectCard: React.FC<{ project: any; onSelect: () => void }> = ({ project, onSelect }) => {
  const [ogImage, setOgImage] = useState<string | null>(null);
  const [loadingImage, setLoadingImage] = useState(false);
  const [stats, setStats] = useState<any>(null);

  // Fetch OG Image
  useEffect(() => {
    if (!project.domain) return;
    let isMounted = true;
    setLoadingImage(true);

    const fetchOg = async () => {
      try {
        const url = `https://api.microlink.io/?url=${encodeURIComponent(project.domain.startsWith('http') ? project.domain : `https://${project.domain}`)}&palette=true&audio=false&video=false&iframe=false`;
        const res = await fetch(url);
        const data = await res.json();
        if (isMounted && data.status === 'success' && data.data.image?.url) {
          setOgImage(data.data.image.url);
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
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    return lastPing > fiveMinutesAgo;
  }, [project.last_ping_at]);

  return (
    <div
      onClick={onSelect}
      className="group relative cursor-pointer rounded-3xl border border-white/10 bg-slate-900/40 overflow-hidden transition-all hover:bg-slate-900 hover:border-indigo-500/50 hover:shadow-[0_0_30px_rgba(99,102,241,0.1)] flex flex-col h-full"
    >
      {/* Card Header / Image Area */}
      <div className="relative h-32 w-full bg-slate-950/50 border-b border-white/5 overflow-hidden">
        {ogImage ? (
          <img 
            src={ogImage} 
            alt="Preview" 
            className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-500 group-hover:scale-105 transform"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center opacity-10 group-hover:opacity-20 transition-opacity">
            <Layout size={64} className="text-white" />
          </div>
        )}
        
        {/* Floating Icon Badge */}
        <div 
          className="absolute -bottom-5 left-6 w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg z-10 border-2 border-slate-900"
          style={{ backgroundColor: project.accent_color }}
        >
          <Layout size={20} />
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

      <div className="p-6 pt-8 flex-1 flex flex-col">
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
        </div>
      </div>
    </div>
  );
};

const Dashboard: React.FC<DashboardProps> = ({ onSelectProject, onCreateProject, onDisconnect }) => {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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

  return (
    <div className="flex-1 overflow-y-auto px-6 py-10 bg-slate-950">
      <div className="mx-auto w-full max-w-6xl space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-black text-white uppercase tracking-tight">My Widgets</h2>
            <p className="mt-2 text-slate-400 text-sm">Manage your quest campaigns and settings.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleDisconnect}
              className="flex items-center gap-2 bg-slate-900 border border-white/10 hover:bg-slate-800 text-slate-400 hover:text-white px-4 py-2.5 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all"
              title="Disconnect Wallet"
            >
              <LogOut size={14} /> <span className="hidden sm:inline">Disconnect</span>
            </button>
            <button
              onClick={onCreateProject}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-black uppercase text-xs tracking-widest transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
            >
              <Plus size={16} /> New Widget
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="animate-spin text-indigo-500" size={32} />
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 rounded-[32px] border border-white/5 bg-slate-900/50 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
              <FolderOpen size={32} className="text-slate-500" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">No widgets yet</h3>
              <p className="text-slate-500 text-sm mt-1">Create your first quest campaign to get started.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((p) => (
              <ProjectCard key={p.id} project={p} onSelect={() => onSelectProject(p.id)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
