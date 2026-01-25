import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ExternalLink, Globe, Loader2, ShieldCheck, Sparkles, Trophy, Sword } from 'lucide-react';
import { fetchProjectDetails, fetchProjectStats } from '../lib/supabase';

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

  const lastVerifiedLabel = project?.last_ping_at
    ? new Date(project.last_ping_at).toLocaleString('en-US')
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="text-indigo-500 animate-spin" size={32} />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4 text-white">
        <div className="text-sm uppercase tracking-[0.3em] text-slate-400">Project not found</div>
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-xl border border-white/10 text-xs font-black uppercase tracking-widest hover:bg-white/5"
        >
          Back to Store
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-y-auto custom-scroll">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.35),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(249,115,22,0.25),transparent_55%)]" />
        <div className="relative z-10 px-6 md:px-12 pt-10 pb-8">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={14} /> Back to Store
          </button>
          <div className="mt-6 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.3em] text-indigo-200">
                <Sparkles size={12} /> Store Project
              </div>
              <h1 className="mt-4 text-3xl md:text-6xl font-black uppercase tracking-tight">
                {project.name}
              </h1>
              <div className="mt-3 flex items-center gap-2 text-sm text-slate-300">
                <Globe size={14} className="text-indigo-400" />
                {project.domain || 'No domain provided'}
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => onOpen({ projectId: project.id, domain: project.domain })}
                className="px-6 py-3 rounded-xl bg-indigo-500 text-white text-xs font-black uppercase tracking-widest shadow-[0_0_25px_rgba(99,102,241,0.4)] hover:bg-indigo-400 transition-colors"
              >
                <span className="inline-flex items-center gap-2">
                  <Sword size={14} />
                  Start Quest
                </span>
              </button>
              <button
                onClick={() => onLeaderboard(project.id)}
                className="px-6 py-3 rounded-xl border border-white/10 text-white/80 text-xs font-black uppercase tracking-widest hover:text-white hover:border-white/20 transition-colors"
              >
                <span className="inline-flex items-center gap-2">
                  <Trophy size={14} />
                  Leaderboard
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 md:px-12 pb-16 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-2xl">
            <div className="text-[10px] uppercase tracking-[0.3em] text-slate-400 font-black">Rewards</div>
            <div className="mt-4 text-3xl font-black text-white">{rewardTotal} XP</div>
            <div className="mt-2 text-xs text-slate-400">Total XP available across tasks.</div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-2xl">
            <div className="text-[10px] uppercase tracking-[0.3em] text-slate-400 font-black">Requirements</div>
            <div className="mt-4 text-3xl font-black text-white">{tasks.length}</div>
            <div className="mt-2 text-xs text-slate-400">Tasks to complete for rewards.</div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-2xl">
            <div className="text-[10px] uppercase tracking-[0.3em] text-slate-400 font-black">Last verified</div>
            <div className="mt-4 text-sm font-black uppercase tracking-widest text-emerald-200">
              <ShieldCheck size={14} className="inline mr-2" />
              {project.last_ping_at ? 'Auto-verified' : 'Pending'}
            </div>
            <div className="mt-2 text-xs text-slate-400">{lastVerifiedLabel}</div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-2xl">
          <div className="flex items-center justify-between">
            <div className="text-[10px] uppercase tracking-[0.3em] text-slate-400 font-black">Requirements</div>
            <div className="text-xs text-slate-500">{stats?.tasks_completed ?? 0} completed</div>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {tasks.length === 0 && (
              <div className="text-xs text-slate-500">No tasks published yet.</div>
            )}
            {tasks.map((task) => (
              <div key={task.id} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-black text-white">{task.title}</div>
                  <div className="text-[10px] uppercase tracking-widest text-indigo-300">{task.xp_reward || 0} XP</div>
                </div>
                {task.description && (
                  <div className="mt-2 text-xs text-slate-400">{task.description}</div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-2xl">
          <div className="text-[10px] uppercase tracking-[0.3em] text-slate-400 font-black">Links</div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {projectLinks.length === 0 && (
              <div className="text-xs text-slate-500">No links available.</div>
            )}
            {projectLinks.map(([label, url]) => (
              <a
                key={label}
                href={url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-sm text-white hover:border-indigo-400/40 hover:bg-slate-900 transition-colors"
              >
                <span className="truncate">{label}</span>
                <ExternalLink size={14} className="text-indigo-300" />
              </a>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-2xl">
          <div className="text-[10px] uppercase tracking-[0.3em] text-slate-400 font-black">Activity</div>
          <div className="mt-4 flex flex-wrap gap-4 text-xs uppercase tracking-widest text-slate-300">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
              <Trophy size={12} className="text-indigo-300" />
              Total visits: {stats?.total_visits ?? 0}
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
              Connected wallets: {stats?.connected_wallets ?? 0}
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
              Weekly actives: {stats?.auw ?? 0}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;
