import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { X, Gift, Wallet, AlertCircle } from 'lucide-react';
import ProfileMenuButton from './ProfileMenuButton';
import { supabase } from '../lib/supabase';

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
  const [isLogoLoading, setIsLogoLoading] = useState(false);
  const [modalContent, setModalContent] = useState({
    title: "Congratulations!",
    message: "You found your first secret Reward!",
    type: "success" // success, warning, info
  });

  const triggerConfetti = () => {
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
  };

  const handleLogoClick = async () => {
    if (!isConnected || !address) {
      setModalContent({
        title: "Connect Wallet",
        message: "Please connect your wallet to earn 1000 XP daily points!",
        type: "warning"
      });
      setShowRewardModal(true);
      return;
    }

    const lastClaimKey = `questlayer_daily_claim_${address}`;
    const lastClaimDate = localStorage.getItem(lastClaimKey);
    const today = new Date().toDateString();

    if (lastClaimDate === today) {
      setModalContent({
        title: "Already Claimed",
        message: "You have already claimed your 1000 XP today. Come back tomorrow!",
        type: "info"
      });
      setShowRewardModal(true);
      return;
    }

    setIsLogoLoading(true);
    try {
      // 1. Find Project (QuestLayer or any)
      let projectId;
      const { data: projects } = await supabase
        .from('projects')
        .select('id')
        .eq('name', 'QuestLayer')
        .limit(1);
      
      if (projects && projects.length > 0) {
        projectId = projects[0].id;
      } else {
        const { data: anyProjects } = await supabase
          .from('projects')
          .select('id')
          .limit(1);
        projectId = anyProjects?.[0]?.id;
      }

      if (projectId) {
        // 2. Find/Create User
        let userId;
        const { data: users } = await supabase
          .from('end_users')
          .select('id')
          .eq('project_id', projectId)
          .eq('wallet_address', address)
          .single();
        
        if (users) {
          userId = users.id;
        } else {
          const { data: newUser, error: createError } = await supabase
            .from('end_users')
            .insert({
              project_id: projectId,
              wallet_address: address
            })
            .select()
            .single();
          if (!createError && newUser) {
            userId = newUser.id;
          }
        }

        // 3. Update Progress
        if (userId) {
          const { data: progress } = await supabase
            .from('user_progress')
            .select('*')
            .eq('user_id', userId)
            .single();

          if (progress) {
            await supabase
              .from('user_progress')
              .update({
                xp: (progress.xp || 0) + 1000,
                last_claim_date: new Date().toISOString()
              })
              .eq('id', progress.id);
          } else {
            await supabase
              .from('user_progress')
              .insert({
                user_id: userId,
                xp: 1000,
                last_claim_date: new Date().toISOString()
              });
          }
        }
      }

      // Success flow
      localStorage.setItem(lastClaimKey, today);
      triggerConfetti();
      setModalContent({
        title: "Congratulations!",
        message: "You found your first secret Reward! +1000 XP",
        type: "success"
      });
      setShowRewardModal(true);

    } catch (err) {
      console.error("Error claiming reward:", err);
      // Fallback success for UX even if backend fails
      localStorage.setItem(lastClaimKey, today);
      triggerConfetti();
      setModalContent({
        title: "Congratulations!",
        message: "You found your first secret Reward! +1000 XP",
        type: "success"
      });
      setShowRewardModal(true);
    } finally {
      setIsLogoLoading(false);
    }
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
            className={`absolute bottom-0 pointer-events-auto cursor-pointer select-none flex items-center justify-center ql-video-patrol transition-transform duration-300 ${isLogoLoading ? 'z-20' : 'z-0'} ${isLogoLoading ? 'ql-logo-loading' : 'hover:scale-110'}`}
          >
            {isLogoLoading && (
              <>
                <span className="absolute inset-0 ql-logo-glow" />
                <span className="absolute -inset-6 ql-logo-shimmer" />
                <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 ql-logo-burst" />
                <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 ql-logo-beam" />
                <div className="absolute -bottom-14 left-1/2 -translate-x-1/2 ql-logo-payload">
                  <span className="ql-logo-payload-chip">XP</span>
                  <span className="ql-logo-payload-text">Reward inbound</span>
                  <div className="ql-logo-dots">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              </>
            )}
            <video 
              src="/questLogo.webm"
              autoPlay 
              loop 
              muted 
              playsInline
              className={`h-20 md:h-28 w-auto object-contain opacity-90 transition-transform duration-300 ${isLogoLoading ? 'translate-y-2 scale-105 drop-shadow-[0_12px_20px_rgba(15,23,42,0.6)]' : ''}`}
            />
          </div>
          
          <style>{`
            @keyframes ql-patrol {
              0%, 100% { left: 25%; transform: translate(-50%, 18%); }
              50% { left: 75%; transform: translate(-50%, 18%); }
            }
            .ql-logo-loading {
              animation-play-state: paused;
            }
            .ql-logo-glow {
              background: radial-gradient(circle at 50% 55%, rgba(99,102,241,0.35), rgba(15,23,42,0) 60%);
              filter: blur(8px);
              opacity: 0.9;
              animation: ql-logo-glow 1.2s ease-in-out infinite;
              border-radius: 999px;
            }
            .ql-logo-shimmer {
              border-radius: 999px;
              background: conic-gradient(from 0deg, rgba(99,102,241,0), rgba(99,102,241,0.35), rgba(99,102,241,0));
              filter: blur(6px);
              opacity: 0.6;
              animation: ql-logo-shimmer 1.6s linear infinite;
            }
            .ql-logo-burst {
              width: 64px;
              height: 16px;
              background: radial-gradient(circle, rgba(255,255,255,0.6), rgba(99,102,241,0) 70%);
              filter: blur(6px);
              opacity: 0.8;
              animation: ql-logo-burst 0.9s ease-out infinite;
            }
            .ql-logo-beam {
              width: 180px;
              height: 40px;
              background: radial-gradient(ellipse at center, rgba(129,140,248,0.5), rgba(15,23,42,0) 70%);
              filter: blur(10px);
              opacity: 0.7;
              animation: ql-logo-beam 1.1s ease-in-out infinite;
            }
            .ql-logo-payload {
              display: inline-flex;
              align-items: center;
              gap: 10px;
              padding: 8px 16px;
              border-radius: 12px;
              background: rgba(15, 23, 42, 0.95);
              border: 1px solid rgba(129, 140, 248, 0.3);
              box-shadow: 
                0 0 0 1px rgba(15, 23, 42, 1),
                0 0 20px rgba(99, 102, 241, 0.4),
                inset 0 0 20px rgba(99, 102, 241, 0.1);
              color: #e2e8f0;
              font-size: 11px;
              font-weight: 800;
              letter-spacing: 0.2em;
              text-transform: uppercase;
              animation: ql-logo-payload 2s ease-in-out infinite;
              backdrop-filter: blur(10px);
              position: relative;
              overflow: hidden;
            }
            .ql-logo-payload::before {
              content: '';
              position: absolute;
              top: 0;
              left: -100%;
              width: 100%;
              height: 100%;
              background: linear-gradient(
                90deg,
                transparent,
                rgba(255, 255, 255, 0.1),
                transparent
              );
              animation: ql-scan 2s linear infinite;
            }
            .ql-logo-payload-chip {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              width: 24px;
              height: 24px;
              border-radius: 6px;
              background: linear-gradient(135deg, #6366f1, #0ea5e9);
              color: #fff;
              font-size: 10px;
              font-weight: 900;
              box-shadow: 0 0 10px rgba(99, 102, 241, 0.5);
              position: relative;
              z-index: 1;
            }
            .ql-logo-payload-text {
              background: linear-gradient(to right, #e2e8f0, #94a3b8);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              text-shadow: 0 0 20px rgba(148, 163, 184, 0.3);
              position: relative;
              z-index: 1;
            }
            .ql-logo-dots {
              display: flex;
              gap: 3px;
            }
            .ql-logo-dots span {
              width: 4px;
              height: 4px;
              border-radius: 50%;
              background: #818cf8;
              animation: ql-dots-pulse 1s ease-in-out infinite;
            }
            .ql-logo-dots span:nth-child(2) { animation-delay: 0.2s; }
            .ql-logo-dots span:nth-child(3) { animation-delay: 0.4s; }

            @keyframes ql-scan {
              0% { left: -100%; }
              50%, 100% { left: 200%; }
            }
            @keyframes ql-dots-pulse {
              0%, 100% { opacity: 0.3; transform: scale(0.8); }
              50% { opacity: 1; transform: scale(1.2); box-shadow: 0 0 8px #818cf8; }
            }
            @keyframes ql-logo-glow {
              0%, 100% { opacity: 0.5; transform: scale(0.96); }
              50% { opacity: 1; transform: scale(1.04); }
            }
            @keyframes ql-logo-shimmer {
              0% { transform: rotate(0deg); opacity: 0.3; }
              50% { opacity: 0.7; }
              100% { transform: rotate(360deg); opacity: 0.3; }
            }
            @keyframes ql-logo-burst {
              0% { opacity: 0; transform: translateX(-50%) scale(0.8); }
              30% { opacity: 0.9; }
              100% { opacity: 0; transform: translateX(-50%) scale(1.4); }
            }
            @keyframes ql-logo-beam {
              0%, 100% { opacity: 0.3; transform: translateX(-50%) scale(0.9); }
              50% { opacity: 0.8; transform: translateX(-50%) scale(1.1); }
            }
            @keyframes ql-logo-payload {
              0%, 100% { transform: translateX(-50%) translateY(0); }
              50% { transform: translateX(-50%) translateY(-6px); }
            }
            @keyframes ql-logo-dots {
              0% { opacity: 0.3; }
              50% { opacity: 1; }
              100% { opacity: 0.3; }
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
                <div className={`absolute inset-0 blur-3xl opacity-20 animate-pulse ${
                  modalContent.type === 'success' ? 'bg-indigo-500' :
                  modalContent.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                }`} />
                <div className={`w-24 h-24 rounded-2xl flex items-center justify-center shadow-xl border border-white/20 animate-[ql-float_3s_ease-in-out_infinite] ${
                  modalContent.type === 'success' ? 'bg-gradient-to-br from-indigo-500 to-purple-600' :
                  modalContent.type === 'warning' ? 'bg-gradient-to-br from-yellow-500 to-orange-600' :
                  'bg-gradient-to-br from-blue-500 to-cyan-600'
                }`}>
                  {modalContent.type === 'success' && <Gift size={48} className="text-white" />}
                  {modalContent.type === 'warning' && <Wallet size={48} className="text-white" />}
                  {modalContent.type === 'info' && <AlertCircle size={48} className="text-white" />}
                </div>
                <div className={`absolute -top-2 -right-2 text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg uppercase tracking-wider animate-bounce ${
                  modalContent.type === 'success' ? 'bg-yellow-400 text-yellow-900' :
                  modalContent.type === 'warning' ? 'bg-white text-slate-900' :
                  'bg-white text-slate-900'
                }`}>
                  {modalContent.type === 'success' ? 'Secret!' : 
                   modalContent.type === 'warning' ? 'Action!' : 'Info'}
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-black text-white uppercase tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-200 via-white to-indigo-200 animate-[ql-shimmer_2s_linear_infinite] bg-[length:200%_100%]">
                  {modalContent.title}
                </h3>
                <p className="text-slate-400 leading-relaxed">
                  {modalContent.message}
                </p>
              </div>

              <button 
                onClick={() => setShowRewardModal(false)}
                className={`w-full py-3 font-bold rounded-xl shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] ${
                  modalContent.type === 'success' ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/25' :
                  modalContent.type === 'warning' ? 'bg-yellow-500 hover:bg-yellow-400 text-yellow-950 shadow-yellow-500/25' :
                  'bg-slate-700 hover:bg-slate-600 text-white shadow-slate-500/25'
                }`}
              >
                {modalContent.type === 'success' ? 'Claim Reward' : 'Got it'}
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
