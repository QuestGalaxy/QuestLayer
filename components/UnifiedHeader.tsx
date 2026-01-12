import React, { useState } from 'react';
import ProfileMenuButton from './ProfileMenuButton';

interface UnifiedHeaderProps {
  onBack: () => void;
  onHome?: () => void;
  isConnected: boolean;
  address?: string;
  userStats: { xp: number; level: number };
  nextLevelXP: number;
  onConnect: () => void;
  onDisconnect: () => void;
  onLeaderboard: () => void;
  onWidgetBuilder?: () => void;
}

const UnifiedHeader: React.FC<UnifiedHeaderProps> = ({
  onBack,
  onHome,
  isConnected,
  address,
  userStats,
  nextLevelXP,
  onConnect,
  onDisconnect,
  onLeaderboard,
  onWidgetBuilder
}) => {
  const [showBetaTooltip, setShowBetaTooltip] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 pointer-events-none">
      <div className="absolute inset-x-0 top-0 h-24 md:h-32 bg-gradient-to-b from-slate-950/90 via-slate-950/50 to-transparent pointer-events-none" />
      <div className="max-w-[1920px] mx-auto p-3 md:px-6 md:py-6 flex items-start gap-4 pointer-events-auto">
        {/* Merged Header Container */}
        <div className="relative flex items-center justify-between gap-2 md:gap-4 bg-slate-950/40 backdrop-blur-xl rounded-2xl border border-white/10 p-1.5 md:p-2 shadow-2xl hover:bg-slate-950/60 transition-all duration-300 ring-1 ring-white/5 w-full">
          
          {/* Center Video - Absolute Positioned behind content */}
          <div className="absolute bottom-0 z-0 pointer-events-none select-none flex items-center justify-center ql-video-patrol">
            <video 
              src="/questLogo.webm"
              autoPlay 
              loop 
              muted 
              playsInline
              className="h-18 md:h-24 w-auto object-contain opacity-90"
            />
          </div>
          
          <style>{`
            @keyframes ql-patrol {
              0%, 100% { left: 25%; transform: translate(-50%, 18%); }
              50% { left: 75%; transform: translate(-50%, 18%); }
            }
            .ql-video-patrol {
              animation: ql-patrol 10s ease-in-out infinite;
            }
            @media (max-width: 768px) {
              @keyframes ql-patrol-mobile {
                0%, 100% { left: 30%; transform: translate(-50%, 14%); }
                50% { left: 70%; transform: translate(-50%, 14%); }
              }
              .ql-video-patrol {
                animation: ql-patrol-mobile 8s ease-in-out infinite;
              }
            }
          `}</style>

          {/* Logo Group */}
          <div className="relative group/logo shrink-0 z-10">
            <button 
              onClick={onBack}
              className="h-10 md:h-12 px-3 md:px-5 text-slate-200 hover:text-white transition-colors bg-slate-900/50 hover:bg-slate-800/50 rounded-xl border border-white/5 relative overflow-hidden group flex items-center shadow-inner"
            >
              <span className="absolute inset-0 bg-[linear-gradient(0deg,transparent,rgba(99,102,241,0.15),transparent)] animate-[ql-scanline_3.2s_linear_infinite] pointer-events-none" />
              <span className="absolute inset-0 opacity-40 bg-[linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:4px_100%] pointer-events-none group-hover:opacity-70 transition-opacity" />
              <span className="pixel-text inline-block text-[10px] md:text-[13px] uppercase tracking-[0.2em] md:tracking-[0.3em] font-bold animate-[ql-flicker_3.4s_ease-in-out_infinite] text-indigo-200 group-hover:text-indigo-100 group-hover:scale-105 transition-transform duration-200 group-hover:animate-[ql-pixel-jitter_0.4s_steps(2,end)_infinite] will-change-transform">
                QuestLayer
              </span>
            </button>

            <div 
              onClick={(e) => {
                e.stopPropagation();
                setShowBetaTooltip(prev => !prev);
              }}
              className="absolute -top-1 md:-top-1.5 -right-1 md:-right-2 bg-indigo-500 text-white text-[8px] md:text-[9px] font-black px-1 md:px-1.5 py-0.5 rounded-md border border-white/20 shadow-lg cursor-pointer hover:bg-indigo-400 hover:scale-110 transition-all z-20 select-none ring-2 ring-slate-950"
            >
              BETA
            </div>

            {showBetaTooltip && (
              <div className="absolute top-full left-0 mt-3 w-64 md:w-72 p-4 bg-slate-900/95 border border-white/10 rounded-2xl shadow-2xl text-xs text-slate-300 z-30 backdrop-blur-xl ring-1 ring-white/10">
                <div className="font-bold text-white mb-1.5 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                  BETA v0.4
                </div>
                <p className="leading-relaxed text-slate-400">
                  QuestLayer is currently in public beta. Please note that as we optimize the platform, progress and data may occasionally be reset.
                </p>
              </div>
            )}
          </div>

          {/* Profile Menu */}
          <div className="relative shrink-0 z-10">
            <ProfileMenuButton
              isConnected={isConnected}
              address={address}
              xp={userStats.xp}
              level={userStats.level}
              nextLevelXP={nextLevelXP}
              onConnect={onConnect}
              onDisconnect={onDisconnect}
              onHome={onHome || onBack}
              onLeaderboard={onLeaderboard}
              onWidgetBuilder={onWidgetBuilder}
            />
          </div>
        </div>
      </div>
    </header>
  );
};

export default UnifiedHeader;
