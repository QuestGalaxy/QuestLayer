import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { X, Gift } from 'lucide-react';
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
  const [showRewardModal, setShowRewardModal] = useState(false);

  const handleLogoClick = () => {
    // Trigger fireworks
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 60 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(function() {
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

    // Show modal
    setShowRewardModal(true);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 pointer-events-none">
      <div className="absolute inset-x-0 top-0 h-24 md:h-32 bg-gradient-to-b from-slate-950/90 via-slate-950/50 to-transparent pointer-events-none" />
      <div className="max-w-[1920px] mx-auto p-3 md:px-6 md:py-6 flex items-start gap-4 pointer-events-auto">
        {/* Merged Header Container */}
        <div className="relative flex items-center justify-between gap-2 md:gap-4 bg-slate-950/40 backdrop-blur-xl rounded-2xl border border-white/10 p-1.5 md:p-2 shadow-2xl hover:bg-slate-950/60 transition-all duration-300 ring-1 ring-white/5 w-full">
          
          {/* Center Video - Absolute Positioned behind content */}
          <div 
            onClick={handleLogoClick}
            className="absolute bottom-0 z-0 pointer-events-auto cursor-pointer select-none flex items-center justify-center ql-video-patrol hover:scale-110 transition-transform duration-300"
          >
            <video 
              src="/questLogo.webm"
              autoPlay 
              loop 
              muted 
              playsInline
              className="h-20 md:h-28 w-auto object-contain opacity-90"
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

      {/* Secret Reward Modal */}
      {showRewardModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 pointer-events-auto">
          <div 
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity duration-300"
            onClick={() => setShowRewardModal(false)}
          />
          <div className="relative w-full max-w-md bg-slate-900 border border-indigo-500/30 rounded-2xl p-8 shadow-2xl transform transition-all scale-100 animate-[ql-modal-pop_0.4s_ease-out]">
            {/* Shiny Border Effect */}
            <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
              <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_50%,transparent_75%)] bg-[length:250%_250%] animate-[ql-shine_3s_linear_infinite]" />
            </div>

            <button 
              onClick={() => setShowRewardModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>

            <div className="flex flex-col items-center text-center space-y-6 relative z-10">
              <div className="relative">
                <div className="absolute inset-0 bg-indigo-500 blur-3xl opacity-20 animate-pulse" />
                <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl border border-white/20 animate-[ql-float_3s_ease-in-out_infinite]">
                  <Gift size={48} className="text-white" />
                </div>
                <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg uppercase tracking-wider animate-bounce">
                  Secret!
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-black text-white uppercase tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-200 via-white to-indigo-200 animate-[ql-shimmer_2s_linear_infinite] bg-[length:200%_100%]">
                  Congratulations!
                </h3>
                <p className="text-slate-400 leading-relaxed">
                  You found your first secret Reward!
                </p>
              </div>

              <button 
                onClick={() => setShowRewardModal(false)}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/25 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Claim Reward
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes ql-modal-pop {
          0% { opacity: 0; transform: scale(0.9) translateY(20px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes ql-shine {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes ql-float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(2deg); }
        }
        @keyframes ql-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </header>
  );
};

export default UnifiedHeader;
