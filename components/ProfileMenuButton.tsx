import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, ExternalLink, Home, Layout, LogOut, ShoppingBag, Star, Trophy, User } from 'lucide-react';
import ConnectCta from './ConnectCta';

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
}

const ProfileMenuButton: React.FC<ProfileMenuButtonProps> = ({
  isConnected,
  address,
  xp,
  level,
  nextLevelXP,
  onConnect,
  onDisconnect,
  onHome,
  onLeaderboard,
  onWidgetBuilder
}) => {
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
        className="flex items-center gap-2 md:gap-3 h-10 md:h-12 pl-1 pr-2 md:px-2 md:pr-3 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl hover:bg-slate-900/80 hover:border-indigo-500/30 transition-all cursor-pointer group animate-in fade-in slide-in-from-top-4 duration-700"
      >
        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 p-0.5 shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
          <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center overflow-hidden">
            <User size={16} className="text-white md:w-[18px] md:h-[18px]" />
          </div>
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2 whitespace-nowrap">
            <span className="text-[10px] md:text-xs font-black text-white uppercase tracking-wider opacity-0 max-w-0 overflow-hidden group-hover:opacity-100 group-hover:max-w-[80px] transition-all">
              Lvl {level}
            </span>
            <span className="w-1 h-1 rounded-full bg-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="text-[9px] md:text-[10px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1">
              <Star size={10} fill="currentColor" /> {xp} XP
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
        <div className="absolute top-full right-0 mt-4 w-72 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-6 border-b border-white/5 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 p-0.5 shadow-lg shadow-indigo-500/20">
                <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center overflow-hidden">
                  <User size={32} className="text-white" />
                </div>
              </div>
              <div className="flex-1">
                <div className="text-lg font-black text-white tracking-tight">User</div>
                <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mb-2">
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                  <ExternalLink size={12} className="hover:text-white cursor-pointer transition-colors" />
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((xp / nextLevelXP) * 100, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[9px] font-bold text-slate-500 uppercase">Lvl {level}</span>
                  <span className="text-[9px] font-bold text-slate-500 uppercase">{xp} / {nextLevelXP} XP</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-950/50 rounded-xl p-3 border border-white/5 flex flex-col items-center">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Level</div>
                <div className="text-xl font-black text-white">{level}</div>
              </div>
              <div className="bg-slate-950/50 rounded-xl p-3 border border-white/5 flex flex-col items-center">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">XP</div>
                <div className="text-xl font-black text-indigo-400">{xp}</div>
              </div>
            </div>
          </div>

          <div className="p-2 space-y-1">
            {onHome && (
              <button
                onClick={() => {
                  setIsProfileOpen(false);
                  onHome();
                }}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-slate-300 hover:text-white transition-all group"
              >
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-300 group-hover:bg-indigo-500/20 transition-colors">
                  <Home size={18} />
                </div>
                <span className="font-bold text-sm">Home</span>
              </button>
            )}
            {onLeaderboard && (
              <button
                onClick={() => {
                  setIsProfileOpen(false);
                  onLeaderboard();
                }}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-slate-300 hover:text-white transition-all group"
              >
                <div className="p-2 rounded-lg bg-yellow-500/10 text-yellow-500 group-hover:bg-yellow-500/20 transition-colors">
                  <Trophy size={18} />
                </div>
                <span className="font-bold text-sm">Leaderboard</span>
              </button>
            )}
            {onWidgetBuilder && (
              <button
                onClick={() => {
                  setIsProfileOpen(false);
                  onWidgetBuilder();
                }}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-slate-300 hover:text-white transition-all group"
              >
                <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 group-hover:bg-sky-500/20 transition-colors">
                  <Layout size={18} />
                </div>
                <span className="font-bold text-sm">Widget Builder</span>
              </button>
            )}
            <div className="relative group">
              <button
                disabled
                className="w-full flex items-center gap-3 p-3 rounded-xl text-slate-600 cursor-not-allowed"
              >
                <div className="p-2 rounded-lg bg-pink-500/10 text-pink-500 transition-colors">
                  <ShoppingBag size={18} />
                </div>
                <span className="font-bold text-sm">Marketplace</span>
              </button>
              <div className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 w-56 -translate-x-1/2 rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-slate-300 opacity-0 transition-opacity group-hover:opacity-100">
                Spend XP points and levels to buy rewards (coming soon).
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                disabled
                className="flex items-center justify-center gap-2 p-3 rounded-xl border border-white/5 text-slate-600 font-bold text-xs uppercase tracking-widest cursor-not-allowed"
              >
                Mint
              </button>
              <button
                disabled
                className="flex items-center justify-center gap-2 p-3 rounded-xl border border-white/5 text-slate-600 font-bold text-xs uppercase tracking-widest cursor-not-allowed"
              >
                Stake
              </button>
            </div>
            <div className="h-px bg-white/5 my-2 mx-3" />
            <button
              onClick={onDisconnect}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-all group"
            >
              <div className="p-2 rounded-lg bg-white/5 text-slate-400 group-hover:text-red-400 transition-colors">
                <LogOut size={18} />
              </div>
              <span className="font-bold text-sm">Disconnect</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileMenuButton;
