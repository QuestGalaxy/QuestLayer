
import React, { useState, useEffect, useRef } from 'react';
import { Task, Position, ThemeType, AppState } from '../types.ts';
import { THEMES } from '../constants.ts';
import { 
  LogOut, X, Zap, Trophy, Flame, ChevronRight, CheckCircle2, 
  ShieldCheck, ExternalLink, Sparkles, Loader2, Send, 
  MessageSquare, Facebook, Linkedin, Twitter
} from 'lucide-react';

interface WidgetProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  isPreview?: boolean;
}

const Widget: React.FC<WidgetProps> = ({ isOpen, setIsOpen, state, setState, isPreview = false }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [loadingId, setLoadingId] = useState<string | number | null>(null);
  const [sharedPlatforms, setSharedPlatforms] = useState<string[]>([]);
  const [verifyingPlatforms, setVerifyingPlatforms] = useState<string[]>([]);
  const [timerValue, setTimerValue] = useState(10);
  const [visualXP, setVisualXP] = useState(state.userXP);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const shareVerifyTimeoutsRef = useRef<Record<string, ReturnType<typeof setTimeout> | null>>({});
  const audioCtxRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const activeTheme = THEMES[state.activeTheme];
  const isLightTheme = ['minimal', 'brutal'].includes(state.activeTheme);
  const isTransparentTheme = state.activeTheme === 'glass';

  const positionClasses = isPreview ? 'absolute' : 'fixed';

  // --- XP ANIMATION ENGINE ---
  useEffect(() => {
    if (visualXP !== state.userXP) {
      const startTime = performance.now();
      const startXP = visualXP;
      const targetXP = state.userXP;
      const duration = 1200;

      const step = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOutQuad = (t: number) => t * (2 - t);
        const currentXP = Math.floor(startXP + (targetXP - startXP) * easeOutQuad(progress));
        setVisualXP(currentXP);
        if (progress < 1) {
          animationFrameRef.current = requestAnimationFrame(step);
        } else {
          animationFrameRef.current = null;
        }
      };
      animationFrameRef.current = requestAnimationFrame(step);
    }
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [state.userXP]);

  // --- AUDIO ENGINE ---
  const initAudio = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  };

  const playSound = (type: 'connect' | 'reward' | 'fanfare') => {
    initAudio();
    const ctx = audioCtxRef.current!;
    const masterGain = ctx.createGain();
    masterGain.connect(ctx.destination);
    masterGain.gain.value = 0.08; 
    const now = ctx.currentTime;
    if (type === 'connect') {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);
      osc.connect(masterGain);
      osc.start();
      osc.stop(now + 0.15);
    } else if (type === 'reward') {
      [523.25, 659.25, 783.99, 1046.50].forEach((f, i) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = f;
        osc.connect(g);
        g.connect(masterGain);
        g.gain.setValueAtTime(0, now + i * 0.08);
        g.gain.linearRampToValueAtTime(0.2, now + i * 0.08 + 0.04);
        g.gain.linearRampToValueAtTime(0, now + i * 0.08 + 0.25);
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.25);
      });
    } else if (type === 'fanfare') {
      [392.00, 523.25, 659.25, 783.99].forEach((f, i) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = f;
        osc.connect(g);
        g.connect(masterGain);
        g.gain.setValueAtTime(0, now + i * 0.12);
        g.gain.linearRampToValueAtTime(0.3, now + i * 0.12 + 0.1);
        g.gain.linearRampToValueAtTime(0, now + i * 0.12 + 0.6);
        osc.start(now + i * 0.12);
        osc.stop(now + i * 0.12 + 0.6);
      });
    }
  };

  const calculateLevel = (xp: number) => {
    const xpPerLevel = 3000;
    const lvl = Math.floor(xp / xpPerLevel) + 1;
    const progress = ((xp % xpPerLevel) / xpPerLevel) * 100;
    return { lvl, progress: Math.floor(progress) };
  };

  const getRankName = () => {
    const { lvl } = calculateLevel(visualXP);
    if (lvl < 2) return "Pioneer";
    if (lvl < 5) return "Guardian";
    return "Overlord";
  };

  const claimDaily = () => {
    if (state.dailyClaimed) return;
    playSound('fanfare');
    const bonus = 100 * Math.pow(2, state.currentStreak - 1);
    setState(prev => ({
      ...prev,
      userXP: prev.userXP + bonus,
      currentStreak: (prev.currentStreak % 5) + 1,
      dailyClaimed: true
    }));
  };

  const startQuest = (task: Task) => {
    initAudio(); 
    window.open(task.link, '_blank');
    setLoadingId(task.id);
    setTimerValue(10);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = setInterval(() => {
      setTimerValue(prev => {
        if (prev <= 1) {
          if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
          playSound('reward');
          setState(prev => ({
            ...prev,
            userXP: prev.userXP + task.xp,
            tasks: prev.tasks.filter(t => t.id !== task.id)
          }));
          setLoadingId(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleShare = (platform: string) => {
    initAudio();
    if (sharedPlatforms.includes(platform) || verifyingPlatforms.includes(platform)) return;
    const shareUrl = window.location.origin;
    const shareText = `Engage with ${state.projectName} on QuestLayer and earn rewards!`;
    let url = '';

    switch(platform) {
      case 'x': url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`; break;
      case 'tg': url = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`; break;
      case 'wa': url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`; break;
      case 'fb': url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`; break;
      case 'li': url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`; break;
    }

    if (url) {
      window.open(url, '_blank');
      setVerifyingPlatforms(prev => [...prev, platform]);
      if (shareVerifyTimeoutsRef.current[platform]) {
        clearTimeout(shareVerifyTimeoutsRef.current[platform]!);
      }
      shareVerifyTimeoutsRef.current[platform] = setTimeout(() => {
        setVerifyingPlatforms(prev => prev.filter(p => p !== platform));
        if (!sharedPlatforms.includes(platform)) {
          setSharedPlatforms(prev => [...prev, platform]);
          playSound('reward');
          setState(prev => ({ ...prev, userXP: prev.userXP + 100 }));
        }
      }, 10000);
    }
  };

  const handleConnect = () => {
    if (isConnecting) return;
    setIsConnecting(true);
    initAudio();
    setTimeout(() => {
      playSound('connect');
      setIsConnected(true);
      setIsConnecting(false);
    }, 1500);
  };

  const disconnect = () => {
    setIsConnected(false);
    setIsOpen(false);
    setVisualXP(0);
    setSharedPlatforms([]);
    setState(prev => ({
      ...prev,
      userXP: 0,
      currentStreak: 1,
      dailyClaimed: false
    }));
  };

  const getPositionClasses = () => {
    const classes = {
      'bottom-right': 'bottom-2 right-2 md:bottom-8 md:right-8',
      'bottom-left': 'bottom-2 left-2 md:bottom-8 md:left-8',
      'top-right': 'top-2 right-2 md:top-8 md:right-8',
      'top-left': 'top-2 left-2 md:top-8 md:left-8'
    };
    return classes[state.position];
  };

  const isBottom = state.position.includes('bottom');
  const isRight = state.position.includes('right');
  const wrapperClasses = [
    positionClasses,
    'z-50',
    'flex',
    isBottom ? 'flex-col-reverse' : 'flex-col',
    isRight ? 'items-end' : 'items-start',
    getPositionClasses(),
    'gap-2',
  ].join(' ');

  const formatXP = (val: number) => val >= 1000 ? (val / 1000).toFixed(1) + 'k' : val;

  const currentLevelData = calculateLevel(visualXP);

  return (
    <>
      <div className={`${positionClasses} inset-0 bg-black/60 md:hidden z-[45]`} onClick={() => setIsOpen(false)} />

      <div className={`${wrapperClasses} ${isOpen ? (isPreview ? 'max-h-[calc(100%-1rem)]' : 'max-h-[calc(100vh-1rem)]') : ''}`}>
        <button
          onClick={() => {
            if (!isOpen) initAudio();
            setIsOpen(prev => !prev);
          }}
          style={(!isLightTheme && !isTransparentTheme) ? {
            backgroundColor: state.accentColor,
            borderColor: state.activeTheme === 'cyber' ? state.accentColor : 'transparent'
          } : (isTransparentTheme ? {
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(20px)',
            borderColor: `${state.accentColor}60`,
            boxShadow: `0 0 20px ${state.accentColor}30`
          } : {})}
          className={`z-40 flex items-center gap-2 md:gap-3 px-4 md:px-6 h-10 md:h-14 shadow-2xl theme-transition font-bold border-2 ${activeTheme.trigger}`}
        >
          {!isConnected ? (
            <span className="flex items-center gap-1.5 md:gap-2 text-[10px] md:text-sm">
              <Zap size={12} md:size={16} fill="currentColor" />
              Connect
            </span>
          ) : (
            <span className="flex items-center gap-2 md:gap-3">
              <div className="bg-white/10 px-1 py-0.5 rounded text-[6px] md:text-[8px] font-mono tracking-tighter uppercase truncate max-w-[40px] md:max-w-none">0x71...3921</div>
              <div className="flex items-center gap-1 border-l border-white/20 pl-1.5 md:pl-2">
                <span className="text-[6px] md:text-[8px] font-black uppercase opacity-60">Lvl</span>
                <span className="text-sm md:text-lg font-black">{currentLevelData.lvl}</span>
              </div>
            </span>
          )}
        </button>

        {isOpen && (
          <div
            className={`w-[min(350px,calc(100vw-1rem))] md:w-[350px] flex flex-col shadow-2xl overflow-hidden border-2 theme-transition relative ${isOpen ? `${isPreview ? 'max-h-[calc(100%-3.5rem)]' : 'max-h-full'}` : ''} ${activeTheme.card} ${activeTheme.font}`}
            style={{
              borderColor: state.activeTheme === 'cyber' ? state.accentColor : (state.activeTheme === 'gaming' ? '#fbbf24' : (isLightTheme ? '#000' : (isTransparentTheme ? `${state.accentColor}60` : 'rgba(255,255,255,0.08)')))
            }}
          >
            {/* Header */}
            <div className={`px-3 py-2.5 md:px-5 md:py-4 flex items-center justify-between shrink-0 ${activeTheme.header}`}>
              <div className="flex items-center gap-2 md:gap-3 truncate">
                <div
                  style={{ backgroundColor: isLightTheme ? '#000' : (isTransparentTheme ? `${state.accentColor}30` : state.accentColor) }}
                  className={`p-1.5 md:p-2 shadow-lg shrink-0 ${activeTheme.iconBox} ${isTransparentTheme ? '' : 'text-white'}`}
                >
                  <Zap size={10} md:size={14} fill="currentColor" style={isTransparentTheme ? { color: state.accentColor } : {}} />
                </div>
                <span className={`font-black text-[10px] md:text-sm uppercase tracking-tight truncate ${isLightTheme ? 'text-black' : 'text-white'}`}>
                  {state.projectName}
                </span>
              </div>
              <div className="flex items-center gap-1.5 md:gap-2 shrink-0 ml-2">
                {isConnected && (
                  <button onClick={disconnect} className="p-1 md:p-1.5 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors">
                    <LogOut size={10} md:size={12} />
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className={`${isLightTheme ? 'text-slate-400 hover:text-black' : 'text-white/40 hover:text-white'} hover:scale-110 transition-all`}
                >
                  <X size={14} md:size={16} />
                </button>
              </div>
            </div>

        {/* Body */}
        <div className="flex-1 min-h-0 overflow-y-auto p-3 md:p-5 space-y-3 md:space-y-5 custom-scroll">
          {!isConnected ? (
            <div className="flex flex-col items-center justify-center text-center space-y-4 py-4 md:py-8">
              <div className="space-y-2">
                <div 
                  className="mx-auto w-10 h-10 md:w-16 md:h-16 rounded-full flex items-center justify-center mb-1"
                  style={{ backgroundColor: `${state.accentColor}15`, color: state.accentColor }}
                >
                  <ShieldCheck size={24} md:size={32} />
                </div>
                <h3 className={`text-[11px] md:text-lg font-black uppercase tracking-tighter ${isLightTheme ? 'text-black' : 'text-white'}`}>
                  Connect to unlock <br/><span className="opacity-40 text-[10px] md:text-sm">{state.projectName} Missions</span>
                </h3>
              </div>
              <div className={`w-full space-y-1.5 text-left p-3 md:p-4 rounded-xl border ${isLightTheme ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/5'}`}>
                <p className={`text-[7px] md:text-[8px] font-black uppercase tracking-widest flex items-center gap-1 ${isLightTheme ? 'text-indigo-700' : 'text-indigo-400'}`} style={!isLightTheme ? { color: state.accentColor } : {}}>
                  <ChevronRight size={8} /> Protocol Info
                </p>
                <p className={`text-[9px] md:text-xs leading-relaxed ${isLightTheme ? 'text-slate-800' : 'text-slate-300 opacity-70'}`}>
                  Join the ecosystem board to track progress and earn rewards.
                </p>
              </div>
              <button 
                onClick={handleConnect} 
                disabled={isConnecting}
                style={(!isLightTheme && !isTransparentTheme) ? { backgroundColor: state.accentColor } : (isTransparentTheme ? { border: `2px solid ${state.accentColor}`, backgroundColor: `${state.accentColor}20` } : {})} 
                className={`w-full py-2 md:py-3 font-black uppercase tracking-widest text-[8px] md:text-[9px] hover:brightness-110 transition-all flex items-center justify-center gap-2 ${activeTheme.button} ${isConnecting ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isConnecting ? (
                  <><Loader2 size={10} className="animate-spin" /> Connecting...</>
                ) : (
                  "Connect Wallet"
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-3.5 md:space-y-5">
              {/* Progress Card */}
              <div className={`p-2.5 md:p-4 border border-opacity-20 shadow-sm ${activeTheme.itemCard}`}>
                <div className="flex justify-between items-start mb-2 md:mb-4">
                  <div className="flex items-center gap-2 md:gap-3">
                    <div 
                      className={`w-7 h-7 md:w-10 md:h-10 flex items-center justify-center text-[10px] md:text-lg font-black text-white relative group ${activeTheme.iconBox} ${visualXP < state.userXP ? 'animate-pulse' : ''}`}
                      style={{ backgroundColor: isLightTheme ? '#000' : state.accentColor }}
                    >
                      {currentLevelData.lvl}
                      {visualXP < state.userXP && <Sparkles size={6} className="absolute -top-1 -right-1 text-white animate-bounce" />}
                    </div>
                    <div>
                      <p className={`text-[6px] md:text-[8px] font-black uppercase ${isLightTheme ? 'text-slate-500' : 'opacity-60 text-white'}`}>Rank</p>
                      <p className={`text-[7px] md:text-[9px] font-black uppercase tracking-widest ${isLightTheme ? 'text-indigo-700' : 'text-indigo-500'}`} style={!isLightTheme ? { color: state.accentColor } : {}}>{getRankName()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-xs md:text-xl font-black tabular-nums ${isLightTheme ? 'text-black' : 'text-white'}`}>{visualXP}</p>
                    <p className={`text-[6px] md:text-[8px] font-black uppercase tracking-widest ${isLightTheme ? 'text-slate-500' : 'opacity-60 text-white'}`}>XP Total</p>
                  </div>
                </div>
                <div className={`h-1 md:h-2 w-full overflow-hidden border relative ${isLightTheme ? 'bg-slate-100 border-slate-200' : 'bg-slate-200/10 border-white/5'} ${activeTheme.iconBox}`}>
                  <div 
                    className={`h-full transition-all duration-300 ease-out relative`} 
                    style={{ width: `${currentLevelData.progress}%`, backgroundColor: state.accentColor }}
                  >
                     {visualXP < state.userXP && (
                       <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-[shimmer_1s_infinite]" />
                     )}
                  </div>
                </div>
              </div>

              {/* Streak Section */}
              <div className="space-y-1.5 md:space-y-3">
                <div className="flex justify-between items-center px-1">
                  <p className={`text-[6px] md:text-[8px] font-black uppercase tracking-widest ${isLightTheme ? 'text-slate-500' : 'opacity-40 text-white'}`}>
                    Multipliers
                  </p>
                  <p className={`text-[6px] md:text-[8px] font-black uppercase flex items-center gap-1 ${isLightTheme ? 'text-indigo-700' : 'text-indigo-400'}`} style={!isLightTheme ? { color: state.accentColor } : {}}>
                    <Flame size={8} /> {state.currentStreak}D STREAK
                  </p>
                </div>
                <div className="flex gap-1 justify-between">
                  {[1, 2, 3, 4, 5].map(day => {
                    const isActive = day <= state.currentStreak;
                    const isCurrent = day === state.currentStreak;
                    return (
                      <div 
                        key={day}
                        className={`flex-1 h-8 md:h-12 border flex flex-col items-center justify-center transition-all duration-500 relative ${activeTheme.iconBox} ${
                          isActive 
                            ? (isLightTheme ? 'border-transparent shadow-sm' : 'border-transparent shadow-md') 
                            : (isLightTheme ? 'border-slate-200 opacity-20' : 'border-white/5 opacity-10')
                        } ${isCurrent ? 'ring-1 md:ring-2 ring-offset-1 md:ring-offset-2' : ''}`}
                        style={{
                          borderColor: isActive ? state.accentColor : undefined,
                          backgroundColor: isActive ? `${state.accentColor}${isLightTheme ? '10' : '20'}` : undefined,
                          ringColor: isCurrent ? state.accentColor : 'transparent',
                          ringOffsetColor: isLightTheme ? '#ffffff' : '#0f172a'
                        }}
                      >
                        <span className={`text-[5px] md:text-[7px] font-black uppercase ${isActive ? (isLightTheme ? 'text-slate-900' : 'text-white') : (isLightTheme ? 'text-black' : 'text-white')}`}>D{day}</span>
                        <span 
                          className={`text-[7px] md:text-[9px] font-mono font-bold transition-colors`}
                          style={{ color: isActive ? state.accentColor : (isLightTheme ? '#64748b' : 'rgba(255,255,255,0.4)') }}
                        >
                          {formatXP(100 * Math.pow(2, day - 1))}
                        </span>
                        {isActive && (
                           <div className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow-sm border border-slate-100">
                             <CheckCircle2 size={6} style={{ color: state.accentColor }} />
                           </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                {!state.dailyClaimed ? (
                  <button 
                    onClick={claimDaily} 
                    style={(!isLightTheme && !isTransparentTheme) ? { backgroundColor: state.accentColor } : (isTransparentTheme ? { border: `2px solid ${state.accentColor}`, backgroundColor: `${state.accentColor}20` } : (isLightTheme ? { backgroundColor: state.accentColor, color: 'white' } : {}))} 
                    className={`w-full py-1.5 md:py-3 font-black text-[8px] md:text-[9px] uppercase tracking-widest ${activeTheme.button} hover:scale-[1.01] transition-transform`}
                  >
                    Claim Daily Bonus
                  </button>
                ) : (
                  <div className={`w-full py-1.5 md:py-2.5 text-center text-[7px] md:text-[8px] font-black uppercase border flex items-center justify-center gap-1.5 ${isLightTheme ? 'border-slate-200 text-slate-400' : 'opacity-30 text-white border-white/5'} ${activeTheme.iconBox}`}>
                    <Trophy size={8} /> Bonus Stashed
                  </div>
                )}
              </div>

              {/* Viral Boost Section */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center px-1">
                  <p className={`text-[6px] md:text-[8px] font-black uppercase tracking-widest ${isLightTheme ? 'text-slate-500' : 'opacity-40 text-white'}`}>
                    Viral Boost
                  </p>
                  <p className={`text-[6px] md:text-[8px] font-black uppercase ${isLightTheme ? 'text-emerald-700' : 'text-emerald-400'}`}>
                    +100 XP EACH
                  </p>
                </div>
                <div className={`p-2 md:p-4 border border-opacity-10 shadow-sm flex flex-col items-center gap-2 ${activeTheme.itemCard}`}>
                  <div className="flex gap-2.5 md:gap-5 items-center justify-center w-full">
                    {[
                      { id: 'x', icon: <Twitter size={12} />, color: '#000000' },
                      { id: 'tg', icon: <Send size={12} />, color: '#0088cc' },
                      { id: 'wa', icon: <MessageSquare size={12} />, color: '#25D366' },
                      { id: 'fb', icon: <Facebook size={12} />, color: '#1877F2' },
                      { id: 'li', icon: <Linkedin size={12} />, color: '#0A66C2' }
                    ].map(platform => {
                      const isShared = sharedPlatforms.includes(platform.id);
                      const isVerifying = verifyingPlatforms.includes(platform.id);
                      return (
                        <button 
                          key={platform.id}
                          onClick={() => handleShare(platform.id)}
                          className={`relative w-7 h-7 md:w-10 md:h-10 rounded-full flex items-center justify-center text-white transition-all shadow-md active:scale-90 hover:scale-105 ${isShared ? 'grayscale opacity-10 pointer-events-none' : ''} ${isVerifying ? 'pointer-events-none' : ''}`}
                          style={{ backgroundColor: platform.color }}
                        >
                          {platform.icon}
                          {isVerifying && (
                            <svg
                              className="absolute inset-[-4px] h-[calc(100%+8px)] w-[calc(100%+8px)] -rotate-90"
                              viewBox="0 0 40 40"
                            >
                              <circle
                                cx="20"
                                cy="20"
                                r="18"
                                fill="none"
                                stroke="rgba(255,255,255,0.25)"
                                strokeWidth="3"
                              />
                              <circle
                                cx="20"
                                cy="20"
                                r="18"
                                fill="none"
                                stroke="rgba(255,255,255,0.9)"
                                strokeWidth="3"
                                strokeLinecap="round"
                                className="ql-share-progress"
                                style={{ animationDuration: '10s' }}
                              />
                            </svg>
                          )}
                          {isShared && (
                            <div className="absolute -top-0.5 -right-0.5 bg-white rounded-full p-0.5 border border-slate-100 shadow-sm">
                               <CheckCircle2 size={6} className="text-emerald-500" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Missions Board */}
              <div className="space-y-2 md:space-y-3">
                <p className={`text-[6px] md:text-[8px] font-black uppercase tracking-widest px-1 ${isLightTheme ? 'text-slate-500' : 'opacity-40 text-white'}`}>
                  Missions
                </p>
                <div className="space-y-2 md:space-y-3 pb-2">
                  {state.tasks.map(task => (
                    <div key={task.id} className={`p-2 md:p-3.5 border border-opacity-20 shadow-sm transition-all relative overflow-hidden ${activeTheme.itemCard}`}>
                      <div className="flex justify-between items-start mb-0.5 gap-2">
                        <h5 className={`text-[8px] md:text-xs font-black uppercase tracking-tight truncate ${isLightTheme ? 'text-black' : 'text-white'}`}>
                          {task.title}
                        </h5>
                        <span 
                          className={`text-[6px] md:text-[8px] font-black px-1 py-0.5 shrink-0 ${activeTheme.iconBox}`}
                          style={{ background: `${state.accentColor}10`, color: state.accentColor }}
                        >
                          +{task.xp}
                        </span>
                      </div>
                      <p className={`text-[7px] md:text-[9px] mb-2 leading-relaxed line-clamp-2 ${isLightTheme ? 'text-slate-700' : 'opacity-60 text-white'}`}>
                        {task.desc}
                      </p>
                      <button 
                        onClick={() => startQuest(task)} 
                        disabled={loadingId !== null && loadingId !== task.id}
                        style={(!isLightTheme && !isTransparentTheme) ? { 
                          borderColor: state.accentColor, 
                          color: loadingId === task.id ? 'gray' : 'white',
                          backgroundColor: 'transparent'
                        } : (isTransparentTheme ? { borderColor: state.accentColor, backgroundColor: loadingId === task.id ? `${state.accentColor}10` : 'transparent' } : (loadingId === task.id ? { backgroundColor: '#f8fafc', color: '#1e293b', borderColor: '#cbd5e1' } : { backgroundColor: state.accentColor, color: 'white', borderColor: state.accentColor }))} 
                        className={`w-full h-7 md:h-9 border-2 font-black text-[7px] md:text-[8px] uppercase transition-all flex items-center justify-center relative z-10 tracking-widest ${activeTheme.button}`}
                      >
                        {loadingId !== task.id ? (
                          <span className="flex items-center gap-1">Launch <ExternalLink size={7} /></span>
                        ) : (
                          <span className="flex items-center gap-1">Syncing <span className={`font-mono`} style={{ color: state.accentColor }}>{timerValue}s</span></span>
                        )}
                        {loadingId === task.id && (
                          <div 
                            className="absolute left-0 top-0 bottom-0 opacity-20 transition-all duration-1000 linear" 
                            style={{ width: `${((10 - timerValue) / 10) * 100}%`, backgroundColor: state.accentColor }} 
                          />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`p-2 md:p-3 border-t shrink-0 flex items-center justify-center gap-1.5 ${activeTheme.header}`}>
          <Zap size={8} md:size={10} className={`${isLightTheme ? 'text-black' : 'text-indigo-500'} fill-current`} style={!isLightTheme ? { color: state.accentColor } : {}} />
          <p className={`text-[5px] md:text-[7px] font-black uppercase tracking-[0.4em] ${isLightTheme ? 'text-slate-500' : 'opacity-30 text-white'}`}>
            QuestLayer Engine v2.5
          </p>
        </div>
      </div>
        )}
      </div>
      <style>{`
        .ql-share-progress {
          stroke-dasharray: 113;
          stroke-dashoffset: 113;
          animation-name: ql-share-progress;
          animation-timing-function: linear;
          animation-fill-mode: forwards;
        }
        @keyframes ql-share-progress {
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </>
  );
};

export default Widget;
