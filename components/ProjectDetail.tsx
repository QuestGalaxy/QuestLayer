import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ExternalLink, Globe, Loader2, ShieldCheck, Sparkles, Trophy, Sword, Zap, Users, BarChart3, Clock, CheckCircle2, Star, Share2 } from 'lucide-react';
import { fetchProjectDetails, fetchProjectStats } from '../lib/supabase';

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
    return `https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${hostname}&size=128`;
  } catch {
    return '';
  }
};

interface ProjectDetailProps {
  projectId: string;
  onBack: () => void;
  onOpen: (payload: { projectId: string; domain?: string | null }) => void;
  onLeaderboard: (projectId: string) => void;
}

const ProjectDetail: React.FC<ProjectDetailProps> = ({ projectId, onBack, onOpen, onLeaderboard }) => {
  const [project, setProject] = useState<any | null>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [stats, setStats] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [ogImage, setOgImage] = useState<string | null>(null);
  const [showInitial, setShowInitial] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const { project, tasks } = await fetchProjectDetails(projectId);
        const stats = await fetchProjectStats(projectId).catch(() => null);
        if (!isMounted) return;
        setProject(project);
        setTasks(tasks || []);
        setStats(stats);

        if (project?.banner_url) {
          setOgImage(project.banner_url);
        } else if (project?.domain) {
          try {
            const target = project.domain.startsWith('http') ? project.domain : `https://${project.domain}`;
            const url = `/api/og?url=${encodeURIComponent(target)}`;
            const res = await fetch(url);
            const data = await res.json();
            if (isMounted && data?.image) {
              setOgImage(data.image);
            }
          } catch (e) {
            console.error('Failed to fetch OG image:', e);
          }
        }
        setShowInitial(!(project?.logo_url || project?.domain));
      } catch (err) {
        if (!isMounted) return;
        setProject(null);
        setTasks([]);
        setStats(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [projectId]);

  const rewardTotal = useMemo(() => {
    return tasks.reduce((sum, task) => sum + (task?.xp_reward || 0), 0);
  }, [tasks]);

  const logoSrc = project?.logo_url || (project?.domain ? getFaviconUrl(project.domain) : '');

  const lastVerifiedLabel = project?.last_ping_at
    ? new Date(project.last_ping_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : 'Not verified yet';

  const projectLinks = useMemo(() => {
    const links = new Map<string, string>();
    if (project?.domain) {
      const domain = project.domain.startsWith('http')
        ? project.domain
        : `https://${project.domain}`;
      links.set(project.domain.replace(/^https?:\/\//, ''), domain);
    }
    tasks.forEach((task) => {
      if (!task?.link) return;
      try {
        const url = task.link.startsWith('http') ? task.link : `https://${task.link}`;
        const label = url.replace(/^https?:\/\//, '').split('/')[0];
        if (!links.has(label)) links.set(label, url);
      } catch {
        // ignore invalid link
      }
    });
    return Array.from(links.entries());
  }, [project, tasks]);

  const getTaskIcon = (kind: string) => {
    switch (kind) {
      case 'quiz': return <Zap size={18} className="text-amber-400" />;
      case 'nft': return <Star size={18} className="text-purple-400" />;
      case 'token': return <BarChart3 size={18} className="text-emerald-400" />;
      default: return <ExternalLink size={18} className="text-indigo-400" />;
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `QuestLayer - ${project.name}`,
          text: `Join ${project.name} on QuestLayer and earn rewards!`,
          url: url,
        });
      } catch (err) {
        // Fallback to clipboard
        navigator.clipboard.writeText(url);
        alert('Link copied to clipboard!');
      }
    } else {
      navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="relative">
          <div className="h-24 w-24 rounded-full border-t-2 border-indigo-500 animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="text-indigo-500 animate-pulse" size={32} />
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4 text-white p-6">
        <div className="h-20 w-20 rounded-2xl bg-slate-900 border border-white/5 flex items-center justify-center mb-4">
          <Zap size={40} className="text-slate-700" />
        </div>
        <div className="text-lg font-black uppercase tracking-[0.3em] text-slate-400">Project not found</div>
        <p className="text-slate-500 text-sm max-w-xs text-center">The project you are looking for might have been moved or deleted.</p>
        <button
          onClick={onBack}
          className="mt-4 px-8 py-3 rounded-2xl bg-white/5 border border-white/10 text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all active:scale-95"
        >
          Back to Store
        </button>
      </div>
    );
  }

  const accentColor = project.accent_color || '#6366f1';

  return (
    <div className="min-h-screen bg-[#020617] text-white overflow-y-auto custom-scroll selection:bg-indigo-500/30">
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full opacity-20 blur-[120px]"
          style={{ backgroundColor: accentColor }}
        />
        <div
          className="absolute top-[40%] -right-[10%] w-[50%] h-[50%] rounded-full opacity-10 blur-[100px]"
          style={{ backgroundColor: '#f97316' }}
        />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 py-10">
        {/* Header Navigation */}
        <button
          onClick={onBack}
          className="group inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-slate-500 hover:text-white transition-all mb-10"
        >
          <div className="p-2 rounded-lg bg-white/5 border border-white/10 group-hover:bg-white/10 group-hover:border-white/20 transition-all">
            <ArrowLeft size={14} />
          </div>
          Back to Store
        </button>

        {/* Hero Section */}
        <div className="relative flex flex-col lg:flex-row gap-12 items-start mb-16 rounded-[3rem] p-8 md:p-12 overflow-hidden border border-white/10 bg-white/5 backdrop-blur-sm group">
          {/* Banner Image Background */}
          <div className="absolute inset-0 z-0 overflow-hidden">
            {ogImage ? (
              <div className="absolute inset-0">
                <img 
                  src={ogImage} 
                  alt="" 
                  className="w-full h-full object-cover opacity-40 blur-[2px] group-hover:opacity-50 group-hover:scale-105 transition-all duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#020617]/90 via-[#020617]/40 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-transparent" />
              </div>
            ) : (
              <div 
                className="absolute inset-0 opacity-10"
                style={{ 
                  background: `radial-gradient(circle at 20% 50%, ${accentColor} 0%, transparent 70%)` 
                }}
              />
            )}
          </div>

          <div className="flex-1 space-y-8 w-full relative z-10">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.3em] text-indigo-300">
                <Sparkles size={12} className="animate-pulse" /> Official Quest
              </div>
              <div className="flex items-center gap-6">
                <div
                  className="h-20 w-20 md:h-28 md:w-28 rounded-[2.5rem] flex items-center justify-center text-4xl md:text-5xl font-black shadow-2xl shrink-0 overflow-hidden relative z-20"
                  style={{
                    backgroundColor: `${accentColor}20`,
                    border: `2px solid ${accentColor}40`,
                    color: accentColor,
                    textShadow: `0 0 20px ${accentColor}40`
                  }}
                >
                  {logoSrc ? (
                    <img 
                      src={logoSrc}
                      alt={project.name}
                      className="w-full h-full object-cover"
                      onLoad={(e) => {
                        const img = e.target as HTMLImageElement;
                        if (img.naturalWidth < 16) {
                          setShowInitial(true);
                        } else {
                          setShowInitial(false);
                        }
                      }}
                      onError={() => {
                        setShowInitial(true);
                      }}
                    />
                  ) : null}
                  {showInitial && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      {project.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="relative z-20">
                  <h1 className="text-4xl md:text-7xl font-black uppercase tracking-tight leading-none">
                    {project.name}
                  </h1>
                  <div className="mt-4 flex items-center gap-4 text-slate-400">
                    <a
                      href={project.domain?.startsWith('http') ? project.domain : `https://${project.domain}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 text-sm hover:text-white transition-colors group"
                    >
                      <Globe size={16} className="text-indigo-400 group-hover:rotate-12 transition-transform" />
                      <span className="border-b border-transparent group-hover:border-slate-500 transition-all">
                        {project.domain || 'No domain provided'}
                      </span>
                    </a>
                    <div className="h-1 w-1 rounded-full bg-slate-700" />
                    <div className="flex items-center gap-2 text-sm text-emerald-400">
                      <ShieldCheck size={16} />
                      <span>Verified</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => onOpen({ projectId: project.id, domain: project.domain })}
                className="group relative px-8 py-4 rounded-2xl bg-indigo-500 text-white text-sm font-black uppercase tracking-widest overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(99,102,241,0.4)]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                <span className="relative inline-flex items-center gap-3">
                  <Sword size={18} />
                  Start Quest
                </span>
              </button>
              <button
                onClick={() => onLeaderboard(project.id)}
                className="px-8 py-4 rounded-2xl border border-white/10 bg-white/5 text-white/80 text-sm font-black uppercase tracking-widest hover:text-white hover:border-white/20 hover:bg-white/10 transition-all active:scale-95"
              >
                <span className="inline-flex items-center gap-3">
                  <Trophy size={18} className="text-amber-400" />
                  Leaderboard
                </span>
              </button>
              <button
                onClick={handleShare}
                className="p-4 rounded-2xl border border-white/10 bg-white/5 text-slate-400 hover:text-white hover:border-white/20 hover:bg-white/10 transition-all active:scale-95"
                title="Share Project"
              >
                <Share2 size={18} />
              </button>
            </div>
          </div>

          {/* Key Stats Sidebar */}
          <div className="w-full lg:w-80 grid grid-cols-2 lg:grid-cols-1 gap-4 relative z-10">
            <div className="p-6 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl group hover:border-indigo-500/30 transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                  <Zap size={16} />
                </div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-black">Total Reward</div>
              </div>
              <div className="text-3xl font-black text-white group-hover:text-indigo-400 transition-colors">{rewardTotal} XP</div>
              <div className="mt-1 text-[10px] text-slate-500 uppercase font-bold tracking-wider">Across {tasks.length} missions</div>
            </div>

            <div className="p-6 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl group hover:border-emerald-500/30 transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <Users size={16} />
                </div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-black">Participants</div>
              </div>
              <div className="text-3xl font-black text-white group-hover:text-emerald-400 transition-colors">{stats?.connected_wallets ?? 0}</div>
              <div className="mt-1 text-[10px] text-slate-500 uppercase font-bold tracking-wider">{stats?.auw ?? 0} active this week</div>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Tasks Area */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xs font-black uppercase tracking-[0.3em] text-slate-500">Quest Requirements</h2>
              <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
                {tasks.length} Missions Available
              </div>
            </div>

            <div className="grid gap-4">
              {tasks.length === 0 ? (
                <div className="rounded-[2rem] border border-dashed border-white/10 p-12 text-center">
                  <Clock size={40} className="mx-auto text-slate-700 mb-4" />
                  <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No missions published yet</p>
                </div>
              ) : (
                tasks.map((task, idx) => (
                  <div
                    key={task.id}
                    className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-md p-6 hover:bg-white/[0.08] hover:border-white/20 transition-all"
                  >
                    <div className="relative z-10 flex items-center gap-6">
                      <div className="h-14 w-14 rounded-2xl bg-slate-900 border border-white/10 flex items-center justify-center shrink-0 shadow-xl group-hover:scale-110 transition-transform">
                        {getTaskIcon(task.task_kind)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-lg font-black text-white truncate group-hover:text-indigo-300 transition-colors">
                            {task.title}
                          </h3>
                          {task.is_sponsored && (
                            <span className="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-[8px] font-black uppercase tracking-widest text-amber-400">
                              Sponsored
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-400 line-clamp-1 group-hover:text-slate-300 transition-colors">
                          {task.description || 'Complete this task to earn XP and rewards.'}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-black text-white">+{task.xp_reward || 0}</div>
                        <div className="text-[9px] font-black uppercase tracking-widest text-indigo-400/80">XP Reward</div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-8">
            {/* Project Links */}
            <div className="rounded-[2.5rem] border border-white/10 bg-white/5 backdrop-blur-xl p-8">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-6 flex items-center gap-2">
                <Globe size={14} /> Ecosystem Links
              </h3>
              <div className="space-y-3">
                {projectLinks.length === 0 ? (
                  <div className="text-xs text-slate-500 italic">No public links provided</div>
                ) : (
                  projectLinks.map(([label, url]) => (
                    <a
                      key={label}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between gap-3 rounded-2xl border border-white/5 bg-slate-950/50 p-4 text-sm text-white hover:border-indigo-500/40 hover:bg-indigo-500/5 transition-all group"
                    >
                      <span className="truncate font-bold text-slate-300 group-hover:text-white transition-colors">{label}</span>
                      <ExternalLink size={14} className="text-slate-500 group-hover:text-indigo-400 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </a>
                  ))
                )}
              </div>
            </div>

            {/* Trust & Verification */}
            <div className="rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-emerald-500/10 to-transparent p-8">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-6 flex items-center gap-2">
                <ShieldCheck size={14} /> Trust & Verification
              </h3>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <div className="text-sm font-black text-white uppercase tracking-tight">Active Integration</div>
                    <div className="text-xs text-slate-400 mt-1 leading-relaxed">
                      QuestLayer widget is detected and active on {project.domain}.
                    </div>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0">
                    <Clock size={20} />
                  </div>
                  <div>
                    <div className="text-sm font-black text-white uppercase tracking-tight">Last Verified</div>
                    <div className="text-xs text-slate-400 mt-1">{lastVerifiedLabel}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Overview */}
            <div className="rounded-[2.5rem] border border-white/10 bg-white/5 backdrop-blur-xl p-8">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-6 flex items-center gap-2">
                <BarChart3 size={14} /> Activity Feed
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-bold uppercase tracking-wider">Total Interactions</span>
                  <span className="text-white font-black">{(stats?.total_visits ?? 0) + (stats?.tasks_completed ?? 0)}</span>
                </div>
                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: '65%' }} />
                </div>
                <div className="flex items-center justify-between text-xs pt-2">
                  <span className="text-slate-400 font-bold uppercase tracking-wider">Completion Rate</span>
                  <span className="text-white font-black">
                    {stats?.total_visits ? Math.round(((stats?.tasks_completed ?? 0) / stats.total_visits) * 100) : 0}%
                  </span>
                </div>
                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '42%' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;
