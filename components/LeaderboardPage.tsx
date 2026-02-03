import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight, Crown, Flame, Globe, Loader2, Star, Trophy, Users, X, Gift, Wallet, AlertCircle, Check, Sword, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';
import { fetchAllProjects, fetchProjectStats, fetchUserXP, supabase } from '../lib/supabase';
import { calculateXpForLevel, calculateLevel, getTier } from '../lib/gamification';
import { useAppKit, useAppKitAccount, useDisconnect } from '@reown/appkit/react';
import ProfileMenuButton from './ProfileMenuButton';
import AnimatedNumber from './AnimatedNumber';
import TierIcon from './TierIcon';
import UnifiedHeader from './UnifiedHeader';
import GlobalFooter from './GlobalFooter';

interface LeaderboardPageProps {
  onBack: () => void;
  onHome?: () => void;
  onLeaderboard: () => void;
  onContinue: (payload: { projectId: string; domain?: string | null }) => void;
  onWidgetBuilder?: () => void;
  onSubmitProject?: () => void;
  focusProjectId?: string | null;
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
  userId?: string | null;
  claimStatus?: { daily: boolean; weekly: boolean };
  claimableDaily?: boolean;
  claimableWeekly?: boolean;
};

const PROJECT_PLACEHOLDER = 'QuestLayer';
const PROJECTS_PER_PAGE = 6;

const formatNumber = (value: number | undefined | null) => {
  if (!value) return '0';
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}m`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return value.toString();
};

const triggerConfetti = () => {
  const duration = 3 * 1000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

  const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

  const interval: any = setInterval(function () {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = 50 * (timeLeft / duration);

    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
    });
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
    });
  }, 250);
};

const playCoinSound = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const playTone = (freq: number, startTime: number, duration: number, type: OscillatorType = 'sine') => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = type;
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.1, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const now = ctx.currentTime;
    // Coin sound: rapid high pitch sequence
    playTone(1200, now, 0.1);
    playTone(2000, now + 0.05, 0.2);
  } catch (e) {
    console.error('Audio play failed', e);
  }
};

const ClaimModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  type: 'daily' | 'weekly';
  rank: number;
  status: 'idle' | 'claiming' | 'success' | 'error';
  rewardAmount?: number;
  errorMessage?: string;
}> = ({ isOpen, onClose, onConfirm, type, rank, status, rewardAmount, errorMessage }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity duration-300"
        onClick={status === 'claiming' ? undefined : onClose}
      />
      <div className="relative w-full max-w-sm bg-slate-900 border border-indigo-500/30 rounded-2xl p-6 shadow-2xl transform transition-all scale-100 animate-[ql-modal-pop_0.4s_ease-out]">
        {/* Shiny Border Effect */}
        <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_50%,transparent_75%)] bg-[length:250%_250%] animate-[ql-shine_3s_linear_infinite]" />
        </div>

        {status !== 'claiming' && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-50 text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        )}

        <div className="flex flex-col items-center text-center space-y-6 relative z-10">
          <div className="relative">
            <div className={`absolute inset-0 blur-3xl opacity-20 animate-pulse ${status === 'success' ? 'bg-emerald-500' : 'bg-indigo-500'
              }`} />
            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center shadow-xl border border-white/20 ${status === 'success'
              ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
              : 'bg-gradient-to-br from-indigo-500 to-purple-600'
              }`}>
              {status === 'success' ? (
                <Check size={40} className="text-white" />
              ) : (
                <Gift size={40} className="text-white animate-bounce" />
              )}
            </div>
            {status === 'success' && (
              <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg uppercase tracking-wider animate-bounce">
                Claimed!
              </div>
            )}
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-black text-white uppercase tracking-tight">
              {status === 'success' ? 'Reward Claimed!' : `Claim ${type} Reward`}
            </h3>
            <div className="text-sm text-slate-400 leading-relaxed">
              {status === 'success' ? (
                <>
                  You have successfully claimed your <span className="text-white font-bold">{rewardAmount} XP</span> reward!
                </>
              ) : status === 'error' ? (
                <span className="text-red-400">{errorMessage}</span>
              ) : (
                <div className="flex flex-col gap-3">
                  <span>
                    You are eligible for the <span className="text-indigo-400 font-bold">{type}</span> reward because you are in the <span className="text-white font-bold">Top 10</span> (Rank #{rank}).
                  </span>
                  <div className="flex items-center justify-center gap-2 text-sm font-bold text-emerald-400 bg-emerald-500/10 px-4 py-3 rounded-xl border border-emerald-500/20">
                    <Gift size={16} />
                    Reward: {rewardAmount} XP
                  </div>
                </div>
              )}
            </div>
          </div>

          {status === 'idle' || status === 'error' ? (
            <button
              onClick={onConfirm}
              className="w-full py-3 font-bold rounded-xl shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/25"
            >
              Claim Reward
            </button>
          ) : status === 'claiming' ? (
            <button disabled className="w-full py-3 font-bold rounded-xl bg-slate-700 text-slate-400 cursor-wait flex items-center justify-center gap-2">
              <Loader2 size={16} className="animate-spin" /> Claiming...
            </button>
          ) : (
            <button
              onClick={onClose}
              className="w-full py-3 font-bold rounded-xl shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/25"
            >
              Awesome!
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const RewardsTable = () => (
  <div className="w-full lg:w-auto overflow-x-auto">
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl min-w-[320px]">
      <div className="flex items-center gap-2 mb-4 text-xs font-bold uppercase tracking-[0.2em] text-indigo-300">
        <Gift size={14} /> Rewards Pool
      </div>
      <table className="w-full text-left border-collapse whitespace-nowrap">
        <thead>
          <tr className="border-b border-white/5 text-[9px] font-black uppercase tracking-widest text-slate-500">
            <th className="py-2 pr-8">Rank</th>
            <th className="py-2 pr-8 text-emerald-400">Daily</th>
            <th className="py-2 text-amber-400">Weekly</th>
          </tr>
        </thead>
        <tbody className="text-[10px] font-bold text-slate-300">
          <tr className="border-b border-white/5 group hover:bg-white/5 transition-colors">
            <td className="py-2 flex items-center gap-2 pr-4"><Crown size={12} className="text-yellow-400 fill-yellow-400" /> 1st</td>
            <td className="py-2 pr-4 text-emerald-300">3,000 XP</td>
            <td className="py-2 text-amber-300">15,000 XP</td>
          </tr>
          <tr className="border-b border-white/5 group hover:bg-white/5 transition-colors">
            <td className="py-2 flex items-center gap-2 pr-4"><span className="text-slate-300 text-xs">🥈</span> 2nd</td>
            <td className="py-2 pr-4 text-emerald-300">1,500 XP</td>
            <td className="py-2 text-amber-300">7,500 XP</td>
          </tr>
          <tr className="border-b border-white/5 group hover:bg-white/5 transition-colors">
            <td className="py-2 flex items-center gap-2 pr-4"><span className="text-orange-700 text-xs">🥉</span> 3rd</td>
            <td className="py-2 pr-4 text-emerald-300">1,000 XP</td>
            <td className="py-2 text-amber-300">5,000 XP</td>
          </tr>
          <tr className="group hover:bg-white/5 transition-colors">
            <td className="py-2 flex items-center gap-2 pr-4"><span className="text-slate-400 text-xs font-bold">#</span> 4th - 10th</td>
            <td className="py-2 pr-4 text-emerald-300">100 - 700 XP</td>
            <td className="py-2 text-amber-300">500 - 3,500 XP</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
);

const ProjectCard: React.FC<{
  data: ProjectLeaderboard;
  userWallet?: string;
  userId?: string | null;
  onContinue: (payload: { projectId: string; domain?: string | null }) => void;
  timeframe: 'all' | 'weekly';
  timeRemaining: string;
  onRewardClaimed?: (amount: number) => void;
  initialClaimStatus?: { daily: boolean; weekly: boolean };
}> = ({ data, userWallet, userId, onContinue, timeframe, timeRemaining, onRewardClaimed, initialClaimStatus }) => {
  const [ogImage, setOgImage] = useState<string | null>(null);
  const [loadingImage, setLoadingImage] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const [claimStatus, setClaimStatus] = useState(() => initialClaimStatus ?? { daily: false, weekly: false });
  const [claiming, setClaiming] = useState<'daily' | 'weekly' | null>(null);

  useEffect(() => {
    if (!initialClaimStatus) return;
    setClaimStatus(initialClaimStatus);
  }, [initialClaimStatus?.daily, initialClaimStatus?.weekly]);

  const [dailyTimeRemaining, setDailyTimeRemaining] = useState<string>('');
  const [weeklyTimeRemaining, setWeeklyTimeRemaining] = useState<string>('');

  useEffect(() => {
    const updateCountdowns = () => {
      const now = new Date();

      // Daily Countdown (Until next 00:00 UTC)
      const nextDay = new Date();
      nextDay.setUTCDate(now.getUTCDate() + 1);
      nextDay.setUTCHours(0, 0, 0, 0);
      const diffDaily = nextDay.getTime() - now.getTime();

      const dh = Math.floor((diffDaily % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const dm = Math.floor((diffDaily % (1000 * 60 * 60)) / (1000 * 60));
      setDailyTimeRemaining(`${dh}h ${dm}m`);

      // Weekly Countdown (Until next Monday 00:00 UTC)
      const nextWeek = new Date();
      nextWeek.setUTCDate(now.getUTCDate() + (7 - now.getUTCDay()) + 1);
      nextWeek.setUTCHours(0, 0, 0, 0);
      const diffWeekly = nextWeek.getTime() - now.getTime();

      const wd = Math.floor(diffWeekly / (1000 * 60 * 60 * 24));
      const wh = Math.floor((diffWeekly % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      setWeeklyTimeRemaining(`${wd}d ${wh}h`);
    };

    updateCountdowns();
    const interval = setInterval(updateCountdowns, 60000);
    return () => clearInterval(interval);
  }, []);

  const [claimModalState, setClaimModalState] = useState<{
    isOpen: boolean;
    type: 'daily' | 'weekly';
    rank: number;
    status: 'idle' | 'claiming' | 'success' | 'error';
    rewardAmount?: number;
    errorMessage?: string;
  }>({
    isOpen: false,
    type: 'daily',
    rank: 0,
    status: 'idle'
  });

  useEffect(() => {
    if (!userId || !data.project?.id) return;

    const fetchStatus = async () => {
      const { data: status } = await supabase.rpc('get_leaderboard_claim_status', {
        p_user_id: userId,
        p_project_id: data.project.id
      });

      if (status) {
        setClaimStatus({
          daily: status.daily_claimed,
          weekly: status.weekly_claimed
        });
      }
    };

    fetchStatus();
  }, [userId, data.project?.id, claiming]); // Re-fetch after claiming

  const calculateReward = (rank: number, period: 'daily' | 'weekly') => {
    let amount = 0;
    if (rank === 1) amount = 3000;
    else if (rank === 2) amount = 1500;
    else if (rank === 3) amount = 1000;
    else if (rank === 4) amount = 700;
    else if (rank === 5) amount = 600;
    else if (rank === 6) amount = 500;
    else if (rank === 7) amount = 400;
    else if (rank === 8) amount = 300;
    else if (rank === 9) amount = 200;
    else if (rank === 10) amount = 100;

    if (period === 'weekly') amount *= 5;
    return amount;
  };

  const handleClaim = async (period: 'daily' | 'weekly') => {
    if (!userWallet || !data.project?.id || !data.userRank) return;
    const potentialReward = calculateReward(data.userRank, period);

    setClaimModalState({
      isOpen: true,
      type: period,
      rank: data.userRank,
      status: 'idle',
      rewardAmount: potentialReward
    });
  };

  const handleModalConfirm = async () => {
    if (!userId || !data.project?.id || !claimModalState.rank) return;
    const period = claimModalState.type;
    setClaimModalState(prev => ({ ...prev, status: 'claiming' }));
    setClaiming(period);

    try {
      const { data: result, error } = await supabase.rpc('claim_leaderboard_reward', {
        p_user_id: userId,
        p_project_id: data.project.id,
        p_period_type: period
      });

      if (error) throw error;

      if (result.success) {
        triggerConfetti();
        playCoinSound();
        if (onRewardClaimed) onRewardClaimed(result.reward);
        setClaimStatus(prev => ({ ...prev, [period]: true }));
        setClaimModalState(prev => ({
          ...prev,
          status: 'success',
          rewardAmount: result.reward
        }));
      } else {
        setClaimModalState(prev => ({
          ...prev,
          status: 'error',
          errorMessage: result.message
        }));
      }
    } catch (err: any) {
      setClaimModalState(prev => ({
        ...prev,
        status: 'error',
        errorMessage: 'Error claiming reward: ' + err.message
      }));
    } finally {
      setClaiming(null);
    }
  };

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
      <ClaimModal
        isOpen={claimModalState.isOpen}
        onClose={() => setClaimModalState(prev => ({ ...prev, isOpen: false }))}
        onConfirm={handleModalConfirm}
        type={claimModalState.type}
        rank={claimModalState.rank}
        status={claimModalState.status}
        rewardAmount={claimModalState.rewardAmount}
        errorMessage={claimModalState.errorMessage}
      />
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

        {/* Category Badge - Moved to top left */}
        <div className="absolute left-6 top-5">
          <div
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white backdrop-blur-md"
          >
            <Flame size={12} className="text-indigo-300" />
            {data.project?.theme || 'Sleek'}
          </div>
        </div>

        <div className="absolute left-6 bottom-12">
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
        {userWallet && (
          <div className="absolute right-6 top-5 flex flex-col items-end gap-2">
            <div className="flex flex-col items-end gap-1">
              <div className="rounded-full bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-indigo-200">
                Your XP {formatNumber(data.userXp)}
              </div>
              {data.userXp > 0 && (
                <div className={`px-2.5 py-1 rounded-full bg-gradient-to-br ${getTier(calculateLevel(data.userXp)).bgGradient} border border-white/10 text-[8px] font-black uppercase tracking-widest ${getTier(calculateLevel(data.userXp)).color} shadow-lg ${getTier(calculateLevel(data.userXp)).shadow} backdrop-blur-md flex items-center gap-1.5`}>
                  <TierIcon icon={getTier(calculateLevel(data.userXp)).icon} size={16} />
                  <span className={`bg-gradient-to-br ${getTier(calculateLevel(data.userXp)).textGradient} bg-clip-text text-transparent`}>{getTier(calculateLevel(data.userXp)).name}</span>
                </div>
              )}
            </div>
            {data.userRank && (
              <div className="rounded-full bg-indigo-500/20 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-indigo-300">
                Rank #{data.userRank}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="p-6 space-y-5">
        {data.project?.id && (
          <button
            onClick={() => onContinue({ projectId: data.project.id, domain: data.project.domain })}
            className={`group w-full rounded-xl px-4 py-3 text-[11px] font-black uppercase tracking-widest transition-all relative overflow-hidden ${data.userXp > 0
              // Continue Quest (Green)
              ? 'bg-gradient-to-r from-emerald-400 via-green-400 to-emerald-500 text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.45)] hover:brightness-110'
              // Start Quest (Yellow/Amber)
              : 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 shadow-[0_0_20px_rgba(251,191,36,0.45)] hover:brightness-110'
              }`}
          >
            <span className="absolute inset-0 translate-x-[-120%] group-hover:translate-x-[120%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/70 to-transparent opacity-80" />
            <span className="relative flex items-center justify-center gap-2">
              {data.userXp > 0 ? (
                <>
                  <Zap size={14} className="text-slate-950 fill-slate-950" />
                  Continue Quest
                </>
              ) : (
                <>
                  <Sword size={14} className="text-slate-950 fill-slate-950" />
                  Start Quest
                </>
              )}
            </span>
          </button>
        )}

        {userWallet && (
          <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 px-4 py-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-300">
                <Trophy size={12} /> Your Rewards
              </div>
              {data.userRank && data.userRank <= 10 && (
                <div className="text-[9px] font-bold uppercase tracking-widest text-emerald-400">
                  Eligible
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Daily Claim Button */}
              <button
                onClick={() => handleClaim('daily')}
                disabled={!userId || !data.userRank || data.userRank > 10 || claimStatus.daily || claiming === 'daily'}
                className={`relative group flex flex-col items-center justify-center rounded-xl border p-3 text-center transition-all duration-300 overflow-hidden ${!userId || !data.userRank || data.userRank > 10
                  ? 'border-white/5 bg-white/5 opacity-50 cursor-not-allowed grayscale'
                  : claimStatus.daily
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 cursor-default shadow-[inset_0_0_20px_rgba(16,185,129,0.1)]'
                    : 'border-indigo-500/50 bg-gradient-to-br from-indigo-500/20 to-purple-600/20 hover:from-indigo-500/30 hover:to-purple-600/30 text-white hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_20px_rgba(99,102,241,0.2)] hover:shadow-[0_0_30px_rgba(99,102,241,0.4)] backdrop-blur-md'
                  }`}
              >
                {/* Shiny effect overlay */}
                {(!claimStatus.daily && data.userRank && data.userRank <= 10) && (
                  <div className="absolute inset-0 -translate-x-full group-hover:animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent z-0 pointer-events-none" />
                )}

                <div className="relative z-10 flex flex-col items-center gap-1.5">
                  <span className="text-[9px] font-bold uppercase tracking-widest opacity-80 text-indigo-200">Daily Reward</span>
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${claimStatus.daily ? 'bg-emerald-500/20' : 'bg-indigo-500/30'}`}>
                      <Gift size={16} className={claimStatus.daily ? "text-emerald-400" : "text-indigo-300 animate-bounce"} />
                    </div>
                    <div className="flex flex-col items-start">
                      <span className={`text-xs font-black ${claimStatus.daily ? 'text-emerald-400' : 'text-white'}`}>
                        {claimStatus.daily ? 'Claimed' : (data.userRank && data.userRank <= 10 ? 'Claim' : 'Locked')}
                      </span>
                      <span className={`text-[8px] font-bold uppercase tracking-wider ${claimStatus.daily ? 'text-emerald-500/70' : 'text-indigo-200/70'
                        }`}>
                        {claimStatus.daily ? 'Next:' : 'Ends:'} {dailyTimeRemaining}
                      </span>
                    </div>
                  </div>
                </div>
              </button>

              {/* Weekly Claim Button */}
              <button
                onClick={() => handleClaim('weekly')}
                disabled={!userId || !data.userRank || data.userRank > 10 || claimStatus.weekly || claiming === 'weekly'}
                className={`relative group flex flex-col items-center justify-center rounded-xl border p-3 text-center transition-all duration-300 overflow-hidden ${!userId || !data.userRank || data.userRank > 10
                  ? 'border-white/5 bg-white/5 opacity-50 cursor-not-allowed grayscale'
                  : claimStatus.weekly
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 cursor-default shadow-[inset_0_0_20px_rgba(16,185,129,0.1)]'
                    : 'border-amber-500/50 bg-gradient-to-br from-amber-500/20 to-orange-600/20 hover:from-amber-500/30 hover:to-orange-600/30 text-white hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:shadow-[0_0_30px_rgba(245,158,11,0.4)] backdrop-blur-md'
                  }`}
              >
                {/* Shiny effect overlay */}
                {(!claimStatus.weekly && data.userRank && data.userRank <= 10) && (
                  <div className="absolute inset-0 -translate-x-full group-hover:animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent z-0 pointer-events-none" />
                )}

                <div className="relative z-10 flex flex-col items-center gap-1.5">
                  <span className="text-[9px] font-bold uppercase tracking-widest opacity-80 text-amber-200">Weekly Reward</span>
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${claimStatus.weekly ? 'bg-emerald-500/20' : 'bg-amber-500/30'}`}>
                      <Crown size={16} className={claimStatus.weekly ? "text-emerald-400" : "text-amber-300 animate-pulse"} />
                    </div>
                    <div className="flex flex-col items-start">
                      <span className={`text-xs font-black ${claimStatus.weekly ? 'text-emerald-400' : 'text-white'}`}>
                        {claimStatus.weekly ? 'Claimed' : (data.userRank && data.userRank <= 10 ? 'Claim' : 'Locked')}
                      </span>
                      <span className={`text-[8px] font-bold uppercase tracking-wider ${claimStatus.weekly ? 'text-emerald-500/70' : 'text-amber-200/70'
                        }`}>
                        {claimStatus.weekly ? 'Next:' : 'Ends:'} {weeklyTimeRemaining}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            </div>

            {(!data.userRank || data.userRank > 10) ? (
              <div className="mt-2 text-center text-[9px] text-slate-500">
                * Reach Top 10 in All-Time Leaderboard to claim rewards
              </div>
            ) : (
              <div className="mt-2 text-center text-[9px] text-slate-500/50">
                * Rewards based on All-Time Rank
              </div>
            )}
          </div>
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
                  className={`flex items-center justify-between rounded-xl px-3 py-2 text-[10px] font-semibold uppercase tracking-widest ${isYou
                    ? 'bg-indigo-500/15 text-white'
                    : 'bg-white/5 text-slate-300'
                    }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-black ${index === 0 ? 'bg-yellow-400/80 text-black' : 'bg-white/10 text-slate-300'
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
    </div >
  );
};

const LeaderboardPage: React.FC<LeaderboardPageProps> = ({ onBack, onHome, onLeaderboard, onContinue, onWidgetBuilder, onSubmitProject, focusProjectId }) => {
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();
  const { disconnect } = useDisconnect();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<ProjectLeaderboard[]>([]);
  const [userProjectIds, setUserProjectIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [userStats, setUserStats] = useState({ xp: 0, level: 1 });
  const [nextLevelXP, setNextLevelXP] = useState(1000);
  const [leaderboardFilter, setLeaderboardFilter] = useState<'global' | 'mine'>(() => {
    try {
      const stored = window.localStorage.getItem('ql:leaderboard:filter');
      return stored === 'mine' ? 'mine' : 'global';
    } catch {
      return 'global';
    }
  });
  const [timeframe, setTimeframe] = useState<'all' | 'weekly'>(() => {
    try {
      const stored = window.localStorage.getItem('ql:leaderboard:timeframe');
      return stored === 'weekly' ? 'weekly' : 'all';
    } catch {
      return 'all';
    }
  });

  // Calculate time remaining until Sunday midnight UTC
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const nextWeek = new Date();
      nextWeek.setUTCDate(now.getUTCDate() + (7 - now.getUTCDay()) + 1);
      nextWeek.setUTCHours(0, 0, 0, 0); // Monday 00:00 UTC

      const diff = nextWeek.getTime() - now.getTime();
      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      setTimeRemaining(`${d}d ${h}h ${m}m`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const loadUserStats = async () => {
      if (address) {
        const stats = await fetchUserXP(address);
        setUserStats(stats);
        setNextLevelXP(calculateXpForLevel(stats.level + 1));
      }
    };
    loadUserStats();
  }, [address]);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setLoading(true);
      try {
        const allProjects = await fetchAllProjects();
        if (!allProjects || allProjects.length === 0) {
          if (isMounted) setProjects([]);
          if (isMounted) setUserProjectIds(new Set());
          return;
        }

        const projectsWithStats = await Promise.all(
          allProjects.map(async (project: any) => {
            try {
              const stats = await fetchProjectStats(project.id);
              return { ...project, stats };
            } catch (e) {
              return { ...project, stats: { total_visits: 0, connected_wallets: 0, tasks_completed: 0 } };
            }
          })
        );

        const sortedProjects = projectsWithStats.sort((a, b) => {
          const visitsA = a.stats?.total_visits || 0;
          const visitsB = b.stats?.total_visits || 0;
          return visitsB - visitsA;
        });

        const seenDomains = new Set<string>();
        const uniqueProjects = sortedProjects.filter(project => {
          if (!project.domain) return false;
          const domain = project.domain.toLowerCase();
          if (seenDomains.has(domain)) return false;
          seenDomains.add(domain);
          return true;
        });

        const projectIds = uniqueProjects.map(project => project.id);
        const userXpByProject = new Map<string, number>();
        const userProjects = new Set<string>();
        const userIdByProject = new Map<string, string>();

        if (address && projectIds.length > 0) {
          const { data: userLinks, error: userError } = await supabase
            .from('end_users')
            .select('id, project_id')
            .eq('wallet_address', address)
            .in('project_id', projectIds);

          if (!userError && userLinks && userLinks.length > 0) {
            userLinks.forEach(link => {
              userProjects.add(link.project_id);
              if (link.id) userIdByProject.set(link.project_id, link.id);
            });

            if (timeframe === 'all') {
              const userIds = userLinks.map(link => link.id);
              const { data: progressRows } = await supabase
                .from('user_progress')
                .select('user_id, xp')
                .in('user_id', userIds);

              const progressByUser = new Map<string, number>();
              progressRows?.forEach(row => progressByUser.set(row.user_id, row.xp || 0));

              userLinks.forEach(link => {
                userXpByProject.set(link.project_id, progressByUser.get(link.id) || 0);
              });
            } else {
              // For weekly, we skip user XP calculation for now to keep it fast
            }
          }
        }

        const fullData = await Promise.all(
          uniqueProjects.map(async project => {
            const stats = project.stats;
            const userXp = (timeframe === 'all' && address) ? userXpByProject.get(project.id) || 0 : 0;
            const userId = userIdByProject.get(project.id) ?? null;

            let leaderboard: LeaderboardEntry[] = [];

            if (timeframe === 'all') {
              const { data: leaderboardRows } = await supabase
                .from('user_progress')
                .select('xp, end_users!inner(wallet_address, project_id)')
                .eq('end_users.project_id', project.id)
                .order('xp', { ascending: false })
                .limit(10);

              leaderboard = (leaderboardRows || []).map((row: any) => ({
                wallet: row.end_users?.wallet_address || '0x----',
                xp: row.xp || 0
              }));
            } else {
              const { data: weeklyRows, error } = await supabase.rpc('get_project_leaderboard_weekly', {
                p_id: project.id
              });

              if (!error && weeklyRows) {
                leaderboard = weeklyRows.slice(0, 10).map((row: any) => ({
                  wallet: row.wallet_address,
                  xp: row.xp
                }));
              }
            }

            let userRank: number | null = null;
            if (timeframe === 'all' && address && userXp > 0) {
              const { count } = await supabase
                .from('user_progress')
                .select('id, end_users!inner(project_id)', { count: 'exact', head: true })
                .eq('end_users.project_id', project.id)
                .gt('xp', userXp);
              userRank = (count || 0) + 1;
            }

            let claimStatus = { daily: false, weekly: false };
            if (userId) {
              const { data: status } = await supabase.rpc('get_leaderboard_claim_status', {
                p_user_id: userId,
                p_project_id: project.id
              });
              if (status) {
                claimStatus = {
                  daily: status.daily_claimed,
                  weekly: status.weekly_claimed
                };
              }
            }

            const claimableDaily = Boolean(userRank && userRank <= 10 && !claimStatus.daily);
            const claimableWeekly = Boolean(userRank && userRank <= 10 && !claimStatus.weekly);

            return {
              project,
              stats,
              userXp,
              userRank,
              leaderboard,
              userId,
              claimStatus,
              claimableDaily,
              claimableWeekly
            };
          })
        );

        fullData.sort((a, b) => {
          const visitsA = a.stats?.total_visits || 0;
          const visitsB = b.stats?.total_visits || 0;
          return visitsB - visitsA;
        });

        if (isMounted) {
          setProjects(fullData);
          setUserProjectIds(userProjects);
        }
      } catch (error) {
        if (isMounted) {
          setProjects([]);
          setUserProjectIds(new Set());
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void load();

    return () => {
      isMounted = false;
    };
  }, [address, timeframe]);

  useEffect(() => {
    if (!isConnected) {
      setLeaderboardFilter('global');
      return;
    }
    setLeaderboardFilter(prev => (prev === 'global' ? 'mine' : prev));
  }, [isConnected]);

  useEffect(() => {
    try {
      window.localStorage.setItem('ql:leaderboard:filter', leaderboardFilter);
    } catch {
      // Ignore storage errors (private mode, quota).
    }
  }, [leaderboardFilter]);

  useEffect(() => {
    try {
      window.localStorage.setItem('ql:leaderboard:timeframe', timeframe);
    } catch {
      // Ignore storage errors (private mode, quota).
    }
  }, [timeframe]);

  const totalXp = useMemo(() => projects.reduce((sum, project) => sum + project.userXp, 0), [projects]);
  const filteredProjects = useMemo(() => {
    if (focusProjectId) {
      return projects.filter(project => project.project?.id === focusProjectId);
    }
    if (leaderboardFilter === 'mine' && isConnected) {
      const mine = projects.filter(project => userProjectIds.has(project.project.id));
      const sorted = [...mine].sort((a, b) => {
        const priorityA = (a.claimableDaily ? 2 : 0) + (a.claimableWeekly ? 1 : 0);
        const priorityB = (b.claimableDaily ? 2 : 0) + (b.claimableWeekly ? 1 : 0);
        if (priorityB !== priorityA) return priorityB - priorityA;
        const visitsA = a.stats?.total_visits || 0;
        const visitsB = b.stats?.total_visits || 0;
        return visitsB - visitsA;
      });
      return sorted;
    }
    return projects;
  }, [leaderboardFilter, isConnected, projects, userProjectIds, focusProjectId]);
  const focusedProjectName = useMemo(() => {
    if (!focusProjectId) return null;
    const match = projects.find(project => project.project?.id === focusProjectId);
    return match?.project?.name || 'Project';
  }, [projects, focusProjectId]);
  const totalPages = Math.ceil(filteredProjects.length / PROJECTS_PER_PAGE);
  const paginatedProjects = filteredProjects.slice(
    (currentPage - 1) * PROJECTS_PER_PAGE,
    currentPage * PROJECTS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [filteredProjects.length, leaderboardFilter]);

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-y-auto">
      {/* Unified Sticky Header */}
      <UnifiedHeader
        onBack={onBack}
        onHome={onHome}
        isConnected={isConnected}
        address={address}
        userStats={userStats}
        nextLevelXP={nextLevelXP}
        onConnect={() => open()}
        onDisconnect={() => disconnect()}
        onLeaderboard={onLeaderboard}
        onWidgetBuilder={onWidgetBuilder}
        onSubmitProject={onSubmitProject}
      />

      <div className="relative overflow-hidden pt-28 md:pt-36">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.35),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(14,165,233,0.3),transparent_55%)]" />
        <div className="relative z-10 px-6 py-10 md:px-12">

          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.3em] text-indigo-300">
                <Trophy size={14} /> Leaderboard
              </div>
              <h1 className="mt-3 text-4xl md:text-6xl font-black uppercase tracking-tight">
                {focusProjectId ? focusedProjectName : 'QuestLayer'}
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-sky-400">
                  {focusProjectId
                    ? 'Project Leaderboard'
                    : (leaderboardFilter === 'mine' && isConnected ? 'Your Leaderboard' : 'Global Leaderboard')}
                </span>
              </h1>
              <p className="mt-4 max-w-2xl text-sm text-slate-300">
                {focusProjectId
                  ? 'See ranks and XP for this project.'
                  : (leaderboardFilter === 'mine' && isConnected
                    ? 'Track your personal ranks across the projects you have joined.'
                    : 'Explore the most active quests worldwide. Connect your wallet to highlight your XP and rank.')}
              </p>
            </div>
            {!focusProjectId && <RewardsTable />}
          </div>
        </div>
      </div>

      <div className="px-6 pb-16 md:px-12">
        {!isConnected && (
          <div className="mt-8 mb-10 rounded-2xl border border-white/10 bg-white/5 p-6 text-center max-w-lg mx-auto">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-200">
              <Users size={16} />
            </div>
            <h3 className="mt-3 text-lg font-black">Connect to highlight your rank</h3>
            <p className="mt-1 text-xs text-slate-400 max-w-xs mx-auto">
              Global leaderboards are public. Connect your wallet to show your XP placement.
            </p>
            <button
              onClick={() => open()}
              className="mt-4 rounded-full bg-white px-5 py-2 text-[10px] font-black uppercase tracking-widest text-black hover:bg-slate-200 transition-colors"
            >
              Connect wallet
            </button>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-indigo-400" size={40} />
          </div>
        )}

        {!loading && filteredProjects.length === 0 && (
          <div className="mt-8 rounded-[28px] border border-white/10 bg-white/5 p-8 text-center text-slate-300">
            {leaderboardFilter === 'mine' && isConnected
              ? 'No personal leaderboard activity yet.'
              : 'No leaderboard activity yet.'}
          </div>
        )}

        {!loading && filteredProjects.length > 0 && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8 rounded-2xl border border-white/5 bg-white/5 p-4 backdrop-blur-sm">
              <div className="flex flex-wrap items-center gap-4 md:gap-8">
                {/* Filter Switch */}
                <div className="flex items-center gap-3">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Filter</span>
                  <div className="flex items-center gap-1 rounded-full border border-white/10 bg-black/30 p-1">
                    <button
                      onClick={() => {
                        setLeaderboardFilter('global');
                        if (focusProjectId) onLeaderboard();
                      }}
                      className={`rounded-full px-3 py-1.5 text-[9px] font-black uppercase tracking-widest transition-all ${leaderboardFilter === 'global' ? 'bg-white text-black' : 'text-slate-400 hover:text-white'
                        }`}
                    >
                      Global
                    </button>
                    {isConnected && (
                      <button
                        onClick={() => {
                          setLeaderboardFilter('mine');
                          if (focusProjectId) onLeaderboard();
                        }}
                        className={`rounded-full px-3 py-1.5 text-[9px] font-black uppercase tracking-widest transition-all ${leaderboardFilter === 'mine' ? 'bg-indigo-400 text-slate-950' : 'text-slate-400 hover:text-white'
                          }`}
                      >
                        My Projects
                      </button>
                    )}
                  </div>
                </div>

                {/* Period Switch */}
                <div className="flex items-center gap-3 md:border-l md:border-white/10 md:pl-8">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Period</span>
                  <div className="flex items-center gap-1 rounded-full border border-white/10 bg-black/30 p-1">
                    <button
                      onClick={() => setTimeframe('all')}
                      className={`rounded-full px-3 py-1.5 text-[9px] font-black uppercase tracking-widest transition-all ${timeframe === 'all' ? 'bg-white text-black' : 'text-slate-400 hover:text-white'
                        }`}
                    >
                      All Time
                    </button>
                    <button
                      onClick={() => setTimeframe('weekly')}
                      className={`rounded-full px-3 py-1.5 text-[9px] font-black uppercase tracking-widest transition-all ${timeframe === 'weekly' ? 'bg-amber-400 text-slate-950' : 'text-slate-400 hover:text-white'
                        }`}
                    >
                      This Week
                    </button>
                  </div>
                  {timeframe === 'weekly' && (
                    <div className="hidden lg:block text-[9px] font-bold uppercase tracking-widest text-amber-400 animate-pulse ml-2">
                      Ends in {timeRemaining}
                    </div>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-6">
                {isConnected && (
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Total XP</span>
                    <span className="text-sm font-black text-white"><AnimatedNumber value={totalXp} /></span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Projects</span>
                  <span className="text-sm font-black text-white">{filteredProjects.length}</span>
                </div>
              </div>
            </div>

            <div className="mt-10 grid gap-10 lg:grid-cols-2 xl:grid-cols-3">
              {paginatedProjects.map(project => (
                <ProjectCard
                  key={project.project.id}
                  data={project}
                  userWallet={address || undefined}
                  userId={project.userId}
                  initialClaimStatus={project.claimStatus}
                  onContinue={onContinue}
                  timeframe={timeframe}
                  timeRemaining={timeRemaining}
                  onRewardClaimed={(amount) => {
                    setProjects(prev => prev.map(p => {
                      if (p.project.id === project.project.id) {
                        return { ...p, userXp: p.userXp + amount };
                      }
                      return p;
                    }));
                    setUserStats(prev => ({
                      ...prev,
                      xp: prev.xp + amount
                    }));
                  }}
                />
              ))}
            </div>
            {totalPages > 1 ? (
              <div className="flex justify-center items-center gap-3 sm:gap-4 mt-12 pb-10">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 sm:p-3 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft size={20} />
                </button>

                <div className="hidden sm:flex items-center gap-2">
                  {(() => {
                    const pages = new Set<number>();
                    const add = (p: number) => {
                      if (p >= 1 && p <= totalPages) pages.add(p);
                    };
                    add(1);
                    add(totalPages);
                    for (let i = currentPage - 2; i <= currentPage + 2; i += 1) add(i);

                    const sorted = Array.from(pages).sort((a, b) => a - b);
                    const items: Array<number | 'ellipsis'> = [];
                    sorted.forEach((p, idx) => {
                      if (idx === 0) {
                        items.push(p);
                        return;
                      }
                      const prev = sorted[idx - 1];
                      if (p - prev > 1) items.push('ellipsis');
                      items.push(p);
                    });

                    return items.map((item, i) => {
                      if (item === 'ellipsis') {
                        return (
                          <span
                            key={`ellipsis-${i}`}
                            className="w-8 text-center text-slate-500 font-bold"
                          >
                            …
                          </span>
                        );
                      }
                      const page = item as number;
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`w-10 h-10 rounded-xl font-bold text-sm transition-all ${currentPage === page
                            ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                            : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                            }`}
                        >
                          {page}
                        </button>
                      );
                    });
                  })()}
                </div>

                <div className="flex sm:hidden items-center gap-2">
                  {(() => {
                    const start = Math.max(1, Math.min(currentPage - 1, totalPages - 2));
                    const pages = [start, start + 1, start + 2].filter((p) => p >= 1 && p <= totalPages);
                    return pages.map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-9 h-9 rounded-xl font-bold text-xs transition-all ${currentPage === page
                          ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                          : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                          }`}
                      >
                        {page}
                      </button>
                    ));
                  })()}
                </div>

                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 sm:p-3 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            ) : (
              <div className="pb-20" />
            )}
          </>
        )}
        <GlobalFooter />
      </div>
    </div>
  );
};

export default LeaderboardPage;
