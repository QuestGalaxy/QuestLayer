import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, ExternalLink, Home, Layout, LogOut, ShoppingBag, Star, Trophy, Upload, User } from 'lucide-react';
import ConnectCta from './ConnectCta';
import AnimatedNumber from './AnimatedNumber';
import { getLevelProgress, getTier } from '../lib/gamification';
import TierIcon from './TierIcon';

interface ProfileMenuButtonProps {
  isConnected: boolean;
  address?: string | null;
  xp: number;
  level: number;
  nextLevelXP: number;
  onConnect: () => void;
  onDisconnect: () => void;
  onHome?: () => void;
  onLeaderboard?: () => void;
  onWidgetBuilder?: () => void;
  onSubmitProject?: () => void;
}

const ProfileMenuButton: React.FC<ProfileMenuButtonProps> = ({
  isConnected,
  address,
  xp,
  level,
  onConnect,
  onDisconnect,
  onHome,
  onLeaderboard,
  onWidgetBuilder,
  onSubmitProject
}) => {
  const tier = getTier(level);
  const levelProgress = getLevelProgress(xp);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isConnected) {
    return <ConnectCta onConnect={onConnect} />;
  }

  return (
    <div className="relative" ref={profileRef}>
      <div
        onClick={() => setIsProfileOpen(!isProfileOpen)}
        className="flex items-center gap-2 h-9 md:h-[42px] pl-1 pr-2 md:px-2 md:pr-3 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl hover:bg-slate-900/80 hover:border-indigo-500/30 transition-all cursor-pointer group animate-in fade-in slide-in-from-top-4 duration-700"
      >
        <div
          className={`w-7 h-7 md:w-8.5 md:h-8.5 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 p-0.5 shadow-lg ${tier.shadow} group-hover:scale-105 transition-all relative`}
          title={tier.name}
        >
          <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center overflow-hidden">
            <User size={16} className="text-white md:w-[18px] md:h-[18px]" />
          </div>
          <div className="absolute -bottom-1 -right-1">
            <TierIcon icon={tier.icon} size={15} className="drop-shadow-[0_0_10px_rgba(255,191,0,0.7)]" />
          </div>
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2 whitespace-nowrap">
            <span className="text-[10px] md:text-xs font-black text-white uppercase tracking-wider opacity-0 max-w-0 overflow-hidden group-hover:opacity-100 group-hover:max-w-[80px] transition-all">
              Lvl {level}
            </span>
            <span className="w-1 h-1 rounded-full bg-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="text-[9px] md:text-[10px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1">
              <Star size={10} fill="currentColor" /> <AnimatedNumber value={xp} /> XP
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
            <span className="text-[9px] md:text-[10px] font-mono text-slate-400 group-hover:text-white transition-colors">
              {address?.slice(0, 4)}...{address?.slice(-4)}
            </span>
          </div>
        </div>
        <ChevronDown size={14} className={`text-slate-400 group-hover:text-white transition-transform duration-300 ${isProfileOpen ? 'rotate-180' : ''}`} />
      </div>

      {isProfileOpen && (
        <div className="absolute top-full right-0 mt-3 w-64 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-4 border-b border-white/5 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 p-0.5 shadow-lg shadow-indigo-500/20">
                <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center overflow-hidden">
                  <User size={24} className="text-white" />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className="text-base font-black text-white tracking-tight">User</div>
                  <div className={`px-2 py-0.5 rounded-full bg-gradient-to-br ${tier.bgGradient} border border-white/10 text-[8px] font-black uppercase tracking-widest ${tier.color} shadow-lg ${tier.shadow} backdrop-blur-md flex items-center gap-1`}>
                    <TierIcon icon={tier.icon} size={14} />
                    <span className={`bg-gradient-to-br ${tier.textGradient} bg-clip-text text-transparent`}>{tier.name}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 mb-1.5">
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                  <ExternalLink size={10} className="hover:text-white cursor-pointer transition-colors" />
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                    style={{ width: `${levelProgress.progress}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[9px] font-bold text-slate-500 uppercase">Lvl {level}</span>
                  <span className="text-[9px] font-bold text-slate-500 uppercase">{levelProgress.xpInLevel} / {levelProgress.xpRequired} XP</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-slate-950/50 rounded-xl p-2 border border-white/5 flex flex-col items-center">
                <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Level</div>
                <div className="text-lg font-black text-white">{level}</div>
              </div>
              <div className="bg-slate-950/50 rounded-xl p-2 border border-white/5 flex flex-col items-center">
                <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">XP</div>
                <div className="text-lg font-black text-indigo-400"><AnimatedNumber value={xp} /></div>
              </div>
            </div>
          </div>

          <div className="p-1.5 space-y-0.5">
            {onHome && (
              <button
                onClick={() => {
                  setIsProfileOpen(false);
                  onHome();
                }}
                className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-white/5 text-slate-300 hover:text-white transition-all group"
              >
                <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-300 group-hover:bg-indigo-500/20 transition-colors">
                  <Home size={16} />
                </div>
                <span className="font-bold text-xs">Home</span>
              </button>
            )}
            {onLeaderboard && (
              <button
                onClick={() => {
                  setIsProfileOpen(false);
                  onLeaderboard();
                }}
                className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-white/5 text-slate-300 hover:text-white transition-all group"
              >
                <div className="p-1.5 rounded-lg bg-yellow-500/10 text-yellow-500 group-hover:bg-yellow-500/20 transition-colors">
                  <Trophy size={16} />
                </div>
                <span className="font-bold text-xs">Leaderboard</span>
              </button>
            )}
            {onWidgetBuilder && (
              <button
                onClick={() => {
                  setIsProfileOpen(false);
                  onWidgetBuilder();
                }}
                className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-white/5 text-slate-300 hover:text-white transition-all group"
              >
                <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 group-hover:bg-sky-500/20 transition-colors">
                  <Layout size={16} />
                </div>
                <span className="font-bold text-xs">Widget Builder</span>
              </button>
            )}
            {onSubmitProject && (
              <button
                onClick={() => {
                  setIsProfileOpen(false);
                  onSubmitProject();
                }}
                className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-white/5 text-slate-300 hover:text-white transition-all group"
              >
                <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-300 group-hover:bg-indigo-500/20 transition-colors">
                  <Upload size={16} />
                </div>
                <span className="font-bold text-xs">Submit Project</span>
              </button>
            )}
            <div className="relative group">
              <button
                disabled
                className="w-full flex items-center gap-2.5 p-2 rounded-xl text-slate-600 cursor-not-allowed"
              >
                <div className="p-1.5 rounded-lg bg-pink-500/10 text-pink-500 transition-colors">
                  <ShoppingBag size={16} />
                </div>
                <span className="font-bold text-xs">Marketplace</span>
              </button>
              <div className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 w-56 -translate-x-1/2 rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-slate-300 opacity-0 transition-opacity group-hover:opacity-100">
                Spend XP points and levels to buy rewards (coming soon).
              </div>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                disabled
                className="flex items-center justify-center gap-2 p-2 rounded-xl border border-white/5 text-slate-600 font-bold text-[10px] uppercase tracking-widest cursor-not-allowed"
              >
                Mint
              </button>
              <button
                disabled
                className="flex items-center justify-center gap-2 p-2 rounded-xl border border-white/5 text-slate-600 font-bold text-[10px] uppercase tracking-widest cursor-not-allowed"
              >
                Stake
              </button>
            </div>
            <div className="h-px bg-white/5 my-1.5 mx-2" />
            <button
              onClick={onDisconnect}
              className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-all group"
            >
              <div className="p-1.5 rounded-lg bg-white/5 text-slate-400 group-hover:text-red-400 transition-colors">
                <LogOut size={16} />
              </div>
              <span className="font-bold text-xs">Disconnect</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileMenuButton;
