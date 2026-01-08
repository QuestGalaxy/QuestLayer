import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight, Crown, Flame, Globe, Loader2, Star, Trophy, Users } from 'lucide-react';
import { fetchProjectStats, fetchUserXP, supabase } from '../lib/supabase';
import { useAppKit, useAppKitAccount, useDisconnect } from '@reown/appkit/react';
import ProfileMenuButton from './ProfileMenuButton';
import GlobalFooter from './GlobalFooter';

interface LeaderboardPageProps {
  onBack: () => void;
  onContinue: (payload: { projectId: string; domain?: string | null }) => void;
}

type LeaderboardEntry = {
  wallet: string;
  xp: number;
};

type ProjectLeaderboard = {
  project: any;
  stats: any;
  userXp: number;
  userRank: number | null;
  leaderboard: LeaderboardEntry[];
};

const PROJECT_PLACEHOLDER = 'QuestLayer';
const PROJECTS_PER_PAGE = 6;

const formatNumber = (value: number | undefined | null) => {
  if (!value) return '0';
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}m`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return value.toString();
};

const ProjectCard: React.FC<{
  data: ProjectLeaderboard;
  userWallet?: string;
  onContinue: (payload: { projectId: string; domain?: string | null }) => void;
}> = ({ data, userWallet, onContinue }) => {
  const [ogImage, setOgImage] = useState<string | null>(null);
  const [loadingImage, setLoadingImage] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (!data.project?.domain) return;
    let isMounted = true;
    setLoadingImage(true);
    const fetchOg = async () => {
      try {
        const url = `https://api.microlink.io/?url=${encodeURIComponent(
          data.project.domain.startsWith('http') ? data.project.domain : `https://${data.project.domain}`
        )}&palette=true&audio=false&video=false&iframe=false`;
        const res = await fetch(url);
        const result = await res.json();
        if (isMounted && result.status === 'success' && result.data.image?.url) {
          setOgImage(result.data.image.url);
        }
      } catch (error) {
        // ignore
      } finally {
        if (isMounted) setLoadingImage(false);
      }
    };
    fetchOg();
    return () => {
      isMounted = false;
    };
  }, [data.project?.domain]);

  const trimmedDomain = data.project?.domain?.replace(/^https?:\/\//, '') || '';

  return (
    <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-slate-900/60 shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
      <div className="relative h-48 w-full overflow-hidden">
        {ogImage ? (
          <img src={ogImage} alt={data.project?.name || PROJECT_PLACEHOLDER} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-indigo-500/30 via-slate-900 to-slate-950" />
        )}
        {loadingImage && (
          <div className="absolute inset-0 animate-pulse bg-slate-900/60" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />
        <div className="absolute left-6 bottom-12">
          <div
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white"
          >
            <Flame size={12} className="text-indigo-300" />
            {data.project?.theme || 'Sleek'}
          </div>
          <div className="mt-3 text-2xl font-black text-white">{data.project?.name || PROJECT_PLACEHOLDER}</div>
          {trimmedDomain && (
            <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
              <Globe size={12} />
              {trimmedDomain}
            </div>
          )}
        </div>
        <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-white/5 bg-black/40 px-6 py-2 text-[9px] uppercase tracking-widest text-slate-300 backdrop-blur">
          <span className="flex items-center gap-1">
            <span className="text-[11px] font-black text-white">{formatNumber(data.stats?.total_visits)}</span> Total Views
          </span>
          <span className="flex items-center gap-1">
            <span className="text-[11px] font-black text-white">{formatNumber(data.stats?.connected_wallets)}</span> Connected
          </span>
          <span className="flex items-center gap-1">
            <span className="text-[11px] font-black text-white">{formatNumber(data.stats?.tasks_completed)}</span> Completed
          </span>
        </div>
        <div className="absolute right-6 top-5 flex flex-col items-end gap-2">
          <div className="rounded-full bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-indigo-200">
            Your XP {formatNumber(data.userXp)}
          </div>
          {data.userRank && (
            <div className="rounded-full bg-indigo-500/20 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-indigo-300">
              Rank #{data.userRank}
            </div>
          )}
        </div>
      </div>

      <div className="p-6 space-y-5">
        {data.project?.id && (
          <button
            onClick={() => onContinue({ projectId: data.project.id, domain: data.project.domain })}
            className="quest-cta-shine w-full rounded-2xl border border-indigo-400/30 px-4 py-3 text-[11px] font-black uppercase tracking-widest text-white transition-all"
          >
            Continue quests
          </button>
        )}

        <div className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Top 10 leaderboard</div>
            <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-indigo-300">
              <Trophy size={10} /> Elite
            </div>
          </div>
          <div className="mt-3 space-y-2">
            {data.leaderboard.length === 0 && (
              <div className="text-[10px] text-slate-500">No leaderboard activity yet.</div>
            )}
            {data.leaderboard.slice(0, isExpanded ? 10 : 3).map((entry, index) => {
              const isYou = userWallet && entry.wallet?.toLowerCase() === userWallet.toLowerCase();
              return (
                <div
                  key={`${entry.wallet}-${index}`}
                  className={`flex items-center justify-between rounded-xl px-3 py-2 text-[10px] font-semibold uppercase tracking-widest ${
                    isYou
                      ? 'bg-indigo-500/15 text-white'
                      : 'bg-white/5 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-black ${
                        index === 0 ? 'bg-yellow-400/80 text-black' : 'bg-white/10 text-slate-300'
                      }`}
                    >
                      {index === 0 ? <Crown size={12} /> : index + 1}
                    </div>
                    <span>{isYou ? 'You' : `${entry.wallet.slice(0, 4)}...${entry.wallet.slice(-4)}`}</span>
                    {isYou && <span className="text-[9px] text-indigo-200">• you</span>}
                  </div>
                  <div className="flex items-center gap-1 text-indigo-200">
                    <Star size={10} /> {formatNumber(entry.xp)}
                  </div>
                </div>
              );
            })}
          </div>
          {data.leaderboard.length > 3 && (
            <button
              onClick={() => setIsExpanded(prev => !prev)}
              className="mt-3 text-[9px] font-black uppercase tracking-widest text-indigo-300 hover:text-indigo-200"
            >
              {isExpanded ? 'Show less' : 'Show full leaderboard'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const LeaderboardPage: React.FC<LeaderboardPageProps> = ({ onBack, onContinue }) => {
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();
  const { disconnect } = useDisconnect();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<ProjectLeaderboard[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [userStats, setUserStats] = useState({ xp: 0, level: 1 });
  const [nextLevelXP, setNextLevelXP] = useState(3000);

  useEffect(() => {
    const loadUserStats = async () => {
      if (address) {
        const stats = await fetchUserXP(address);
        setUserStats(stats);
        setNextLevelXP(stats.level * 3000);
      }
    };
    loadUserStats();
  }, [address]);

  useEffect(() => {
    if (!address) {
      setProjects([]);
      setLoading(false);
      return;
    }

    let isMounted = true;

    const load = async () => {
      setLoading(true);
      try {
        const { data: userLinks, error: userError } = await supabase
          .from('end_users')
          .select('id, project_id')
          .eq('wallet_address', address);

        if (userError) throw userError;
        if (!userLinks || userLinks.length === 0) {
          if (isMounted) setProjects([]);
          return;
        }

        const userIds = userLinks.map(link => link.id);
        const { data: progressRows } = await supabase
          .from('user_progress')
          .select('user_id, xp')
          .in('user_id', userIds);

        const progressByUser = new Map<string, number>();
        progressRows?.forEach(row => progressByUser.set(row.user_id, row.xp || 0));

        const activeLinks = userLinks.filter(link => (progressByUser.get(link.id) || 0) > 0);
        const projectIds = Array.from(new Set(activeLinks.map(link => link.project_id)));

        if (projectIds.length === 0) {
          if (isMounted) setProjects([]);
          return;
        }

        const { data: projectsData, error: projectsError } = await supabase
          .from('projects')
          .select('*')
          .in('id', projectIds);

        if (projectsError) throw projectsError;

        const fullData = await Promise.all(
          (projectsData || []).map(async project => {
            const userLink = activeLinks.find(link => link.project_id === project.id);
            const userXp = userLink ? progressByUser.get(userLink.id) || 0 : 0;

            const stats = await fetchProjectStats(project.id).catch(() => null);

            const { data: leaderboardRows } = await supabase
              .from('user_progress')
              .select('xp, end_users!inner(wallet_address, project_id)')
              .eq('end_users.project_id', project.id)
              .order('xp', { ascending: false })
              .limit(10);

            const leaderboard: LeaderboardEntry[] = (leaderboardRows || []).map((row: any) => ({
              wallet: row.end_users?.wallet_address || '0x----',
              xp: row.xp || 0
            }));

            let userRank: number | null = null;
            if (userXp > 0) {
              const { count } = await supabase
                .from('user_progress')
                .select('id, end_users!inner(project_id)', { count: 'exact', head: true })
                .eq('end_users.project_id', project.id)
                .gt('xp', userXp);
              userRank = (count || 0) + 1;
            }

            return {
              project,
              stats,
              userXp,
              userRank,
              leaderboard
            };
          })
        );

        fullData.sort((a, b) => b.userXp - a.userXp);
        if (isMounted) setProjects(fullData);
      } catch (error) {
        if (isMounted) setProjects([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void load();

    return () => {
      isMounted = false;
    };
  }, [address]);

  const totalXp = useMemo(() => projects.reduce((sum, project) => sum + project.userXp, 0), [projects]);
  const totalPages = Math.ceil(projects.length / PROJECTS_PER_PAGE);
  const paginatedProjects = projects.slice(
    (currentPage - 1) * PROJECTS_PER_PAGE,
    currentPage * PROJECTS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [projects.length]);

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-y-auto">
      <div className="fixed top-6 right-6 z-50">
        <ProfileMenuButton
          isConnected={isConnected}
          address={address}
          xp={userStats.xp}
          level={userStats.level}
          nextLevelXP={nextLevelXP}
          onConnect={() => open()}
          onDisconnect={() => disconnect()}
          onHome={onBack}
          onLeaderboard={() => {}}
        />
      </div>
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.35),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(14,165,233,0.3),transparent_55%)]" />
        <div className="relative z-10 px-6 py-10 md:px-12">
          <button
            onClick={onBack}
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-black uppercase tracking-widest text-slate-200 hover:text-white"
          >
            <ArrowRight size={14} className="rotate-180" /> Back
          </button>

          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.3em] text-indigo-300">
                <Trophy size={14} /> Leaderboard
              </div>
              <h1 className="mt-3 text-4xl md:text-6xl font-black uppercase tracking-tight">
                Your QuestLayer
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-sky-400">
                  XP Legacy
                </span>
              </h1>
              <p className="mt-4 max-w-2xl text-sm text-slate-300">
                See every project you have earned XP in, compare your placement, and watch the top explorers rise.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3">
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total XP</div>
                <div className="text-2xl font-black text-white">{formatNumber(totalXp)}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3">
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Projects</div>
                <div className="text-2xl font-black text-white">{projects.length}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 pb-16 md:px-12">
        {!isConnected && (
          <div className="mt-8 rounded-[28px] border border-white/10 bg-white/5 p-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-200">
              <Users size={20} />
            </div>
            <h3 className="mt-4 text-xl font-black">Connect to view your leaderboard</h3>
            <p className="mt-2 text-sm text-slate-400">
              Sign in with your wallet to load project rankings and XP placement.
            </p>
            <button
              onClick={() => open()}
              className="mt-6 rounded-full bg-white px-6 py-3 text-xs font-black uppercase tracking-widest text-black"
            >
              Connect wallet
            </button>
          </div>
        )}

        {isConnected && loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-indigo-400" size={40} />
          </div>
        )}

        {isConnected && !loading && projects.length === 0 && (
          <div className="mt-8 rounded-[28px] border border-white/10 bg-white/5 p-8 text-center text-slate-300">
            You have not earned XP in any project yet.
          </div>
        )}

        {isConnected && !loading && projects.length > 0 && (
          <>
            <div className="mt-10 grid gap-10 lg:grid-cols-2 xl:grid-cols-3">
              {paginatedProjects.map(project => (
                <ProjectCard
                  key={project.project.id}
                  data={project}
                  userWallet={address || undefined}
                  onContinue={onContinue}
                />
              ))}
            </div>
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-12 pb-10">
                <button
                  onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
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
                      className={`w-10 h-10 rounded-xl font-bold text-sm transition-all ${
                        currentPage === i + 1
                          ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                          : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
                  disabled={currentPage === totalPages}
                  className="p-3 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </>
        )}
        <GlobalFooter />
      </div>
    </div>
  );
};

export default LeaderboardPage;
