
import React, { useState } from 'react';
import { BarChart3, ChevronRight, Gem, Lock, LogIn, Rocket, Sparkles, Target, Trophy, UserPlus, Wallet, X } from 'lucide-react';
import { useAppKit, useAppKitAccount } from '@reown/appkit/react';
import GlobalFooter from './GlobalFooter';

interface LandingPageProps {
  onLaunch: () => void;
  onBrowse: () => void;
  onTryBuilder: () => void;
  onSubmitProject: () => void;
  allowAutoLaunch?: boolean;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLaunch, onBrowse, onTryBuilder, onSubmitProject, allowAutoLaunch = true }) => {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const [bgVideoLoaded, setBgVideoLoaded] = useState(false);
  const { open } = useAppKit();
  const { isConnected, status } = useAppKitAccount();
  const isConnecting = status === 'connecting' || status === 'reconnecting';
  const videoRef = React.useRef<HTMLVideoElement>(null);

  React.useEffect(() => {
    // Lazy load video after mount to prioritize LCP
    const timer = setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.src = "/questlayer.mp4";
        // Attempt to play - some browsers require user interaction for unmuted, but this is muted
        videoRef.current.play().catch(e => console.debug("Video autoplay blocked", e));
      }
    }, 1000); // 1 second delay to ensure initial paint is done
    return () => clearTimeout(timer);
  }, []);

  React.useEffect(() => {
    if (isConnected && allowAutoLaunch) {
      onLaunch();
    }
  }, [isConnected, allowAutoLaunch, onLaunch]);

  const handleStartBuilding = () => {
    if (isConnected) {
      onLaunch();
    } else {
      open();
    }
  };

  const getHubGlow = () => {
    switch (hoveredCard) {
      case 1: return 'shadow-[0_0_80px_rgba(249,115,22,0.6)] border-orange-500';
      case 2: return 'shadow-[0_0_80px_rgba(99,102,241,0.6)] border-indigo-500';
      case 3: return 'shadow-[0_0_80px_rgba(168,85,247,0.6)] border-purple-500';
      case 4: return 'shadow-[0_0_80px_rgba(234,179,8,0.6)] border-yellow-500';
      default: return 'shadow-[0_0_60px_rgba(139,92,246,0.4)] border-indigo-500/50';
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-[#05010d] overflow-x-hidden overflow-y-auto custom-scroll selection:bg-orange-500/30 font-['Inter']">

      {/* --- VIDEO BACKGROUND LAYER --- */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <video
          ref={videoRef}
          muted
          loop
          playsInline
          preload="none"
          poster="/qlayer.jpeg"
          className="absolute inset-0 w-full h-full object-cover opacity-20"
          onLoadedData={() => setBgVideoLoaded(true)}
        >
          {/* Source injected via JS */}
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-[#05010d]/50 via-transparent to-[#05010d]" />
      </div>

      {/* --- COSMIC BACKGROUND LAYER --- */}
      <div className="fixed inset-0 pointer-events-none z-[1]">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-900/15 blur-[150px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-orange-900/15 blur-[150px] rounded-full" />

        {/* Animated Stars */}
        {[...Array(40)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white opacity-40 animate-pulse"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              width: `${1 + Math.random() * 2}px`,
              height: `${1 + Math.random() * 2}px`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${2 + Math.random() * 3}s`
            }}
          />
        ))}

        {/* Floating Particles */}
        {[...Array(25)].map((_, i) => (
          <div
            key={`p-${i}`}
            className="absolute bg-indigo-500/30 rounded-full animate-float-slow"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              width: `${4 + Math.random() * 8}px`,
              height: `${4 + Math.random() * 8}px`,
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: `${10 + Math.random() * 15}s`,
              opacity: 0.2 + Math.random() * 0.3
            }}
          />
        ))}

        {/* Pixel Blocks */}
        {[...Array(20)].map((_, i) => (
          <div
            key={`px-${i}`}
            className="absolute bg-orange-500/20 border border-orange-500/30 animate-pulse"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              width: '10px',
              height: '10px',
              transform: `rotate(${Math.random() * 360}deg)`,
              animationDelay: `${Math.random() * 4}s`,
              opacity: 0.15 + Math.random() * 0.2
            }}
          />
        ))}
      </div>

      <div className="relative max-w-6xl mx-auto px-6 py-16 flex flex-col items-center z-10">

        {/* --- HERO SECTION --- */}
        <div className="mb-6 text-center animate-in fade-in slide-in-from-top-8 duration-1000 w-full">
          <div className="flex flex-col items-center">
            <div className="flex flex-row items-center gap-2 sm:gap-4 mb-6">
              <video
                src="/questLogo.webm"
                autoPlay
                loop
                muted
                playsInline
                poster="/logoLayer.webp"
                className="h-16 w-16 sm:h-24 sm:w-24 object-contain"
              />
              <h1 className="pixel-text text-3xl sm:text-5xl md:text-7xl text-white tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-orange-400 drop-shadow-[0_0_15px_rgba(249,115,22,0.3)]">
                QUESTLAYER
              </h1>
            </div>
            <p className="text-lg sm:text-2xl md:text-3xl font-black text-white max-w-3xl leading-[1.2] tracking-tight px-4">
              Turn Any Website Into an Interactive <br className="hidden sm:block" />
              <span className="text-orange-500 italic underline decoration-orange-500/30 underline-offset-8">Quest & Reward Hub</span>
            </p>
            <div className="mt-6 flex items-center gap-3 px-6 py-2 bg-white/5 border border-white/10 rounded-full max-w-[90vw]">
              <Sparkles size={14} className="text-orange-400 animate-spin-slow shrink-0" />
              <p className="text-slate-400 text-[9px] sm:text-xs font-black uppercase tracking-[0.2em] truncate">
                One embed • No redirects • Instant Web3
              </p>
            </div>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 w-full px-4">
              <button
                onClick={handleStartBuilding}
                disabled={isConnecting}
                className="w-full sm:w-auto px-6 py-3.5 bg-orange-500 text-black font-black uppercase text-[10px] tracking-[0.2em] rounded-xl shadow-[0_0_30px_rgba(249,115,22,0.35)] transition-all hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isConnecting ? 'Connecting...' : (isConnected ? 'Start Building' : 'Connect to Build')}
                {!isConnected && !isConnecting && <Wallet size={14} />}
              </button>

              <div className="flex gap-4 w-full sm:w-auto">
                <button
                  onClick={onBrowse}
                  className="flex-1 sm:flex-none px-6 py-3.5 bg-white/5 hover:bg-white/10 text-white font-black uppercase text-[10px] tracking-[0.2em] rounded-xl border border-white/10 transition-all flex items-center justify-center gap-2 group"
                >
                  <LogIn size={14} className="group-hover:text-indigo-400 transition-colors" />
                  Store
                </button>
                <button
                  onClick={onTryBuilder}
                  className="flex-1 sm:flex-none px-6 py-3.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 font-black uppercase text-[10px] tracking-[0.2em] rounded-xl border border-indigo-500/20 transition-all flex items-center justify-center gap-2 group"
                >
                  <Sparkles size={14} className="group-hover:text-white transition-colors" />
                  Try Demo
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* --- FEATURED STORE STRIP --- */}
        <div className="w-full max-w-6xl mx-auto mt-10 mb-6 px-2 sm:px-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-left">
              <div className="text-[10px] uppercase tracking-[0.35em] text-indigo-300/70 font-black">
                Featured in Store
              </div>
              <p className="text-slate-400 text-xs sm:text-sm mt-2">
                Live quests across the ecosystem, curated for instant exploration.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={onSubmitProject}
                className="px-4 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-100 font-black uppercase text-[10px] tracking-[0.3em] rounded-xl border border-indigo-500/30 transition-all"
              >
                Submit Project
              </button>
              <button
                onClick={onBrowse}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white font-black uppercase text-[10px] tracking-[0.3em] rounded-xl border border-white/10 transition-all"
              >
                View all
              </button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {[
              { name: 'Galxe', tag: 'XP Quests', accent: 'from-indigo-500/40 via-indigo-500/10 to-transparent' },
              { name: 'Uniswap', tag: 'Liquidity', accent: 'from-orange-500/40 via-orange-500/10 to-transparent' },
              { name: 'Magic Eden', tag: 'Collectibles', accent: 'from-emerald-500/40 via-emerald-500/10 to-transparent' },
              { name: 'Aave', tag: 'DeFi', accent: 'from-sky-500/40 via-sky-500/10 to-transparent' }
            ].map((item) => (
              <button
                key={item.name}
                onClick={onBrowse}
                className="group text-left rounded-3xl border border-white/10 bg-slate-900/40 hover:bg-slate-900/70 transition-all overflow-hidden"
              >
                <div className="relative h-24 sm:h-28 w-full bg-slate-950/60 border-b border-white/5">
                  <div className={`absolute inset-0 bg-gradient-to-br ${item.accent}`} />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent" />
                  <div className="absolute top-3 right-3 px-2 py-1 rounded-lg bg-white/10 border border-white/10 text-[9px] font-black uppercase tracking-[0.25em] text-white/80">
                    Live
                  </div>
                </div>
                <div className="p-3 sm:p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl border border-white/10 bg-slate-950/60 flex items-center justify-center text-white font-black text-xs">
                      {item.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-black uppercase text-[11px] sm:text-xs tracking-widest truncate">{item.name}</div>
                      <div className="text-slate-400 text-[9px] sm:text-[10px] uppercase tracking-[0.3em] mt-1 truncate">{item.tag}</div>
                    </div>
                    <ChevronRight size={14} className="text-white/30 group-hover:text-white/70 transition-colors shrink-0" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* --- THE OCTOPUS ENGINE (Interactive Feature Map) --- */}
        <div className="relative w-full min-h-[500px] flex items-center justify-center pb-20 pt-4">

          {/* SVG Tentacle Layer */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30 overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <linearGradient id="tentacleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#f97316" />
              </linearGradient>
            </defs>
            {/* These paths simulate the tentacles reaching from center to grid positions */}
            <path d="M 50 50 Q 25 25 15 15" stroke="url(#tentacleGrad)" strokeWidth="0.5" fill="none" strokeDasharray="2 2" className="animate-pulse" />
            <path d="M 50 50 Q 75 25 85 15" stroke="url(#tentacleGrad)" strokeWidth="0.5" fill="none" strokeDasharray="2 2" />
            <path d="M 50 50 Q 75 75 85 85" stroke="url(#tentacleGrad)" strokeWidth="0.5" fill="none" strokeDasharray="2 2" />
            <path d="M 50 50 Q 25 75 15 85" stroke="url(#tentacleGrad)" strokeWidth="0.5" fill="none" strokeDasharray="2 2" />
            <path d="M 50 50 L 50 90" stroke="url(#tentacleGrad)" strokeWidth="0.5" fill="none" strokeDasharray="2 2" />
          </svg>

          {/* Central Animated Hub */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none">
            <div className={`w-32 h-32 md:w-56 md:h-56 rounded-full bg-gradient-to-tr from-purple-600/20 to-indigo-400/20 p-1.5 animate-float transition-all duration-700 border-4 ${getHubGlow()}`}>
              <div className="w-full h-full rounded-full bg-slate-950/90 flex flex-col items-center justify-center backdrop-blur-3xl overflow-hidden relative">
                <div className="absolute inset-0 bg-indigo-500/5 animate-pulse" />
                <video
                  src="/questLogo.webm"
                  autoPlay
                  loop
                  muted
                  playsInline
                  poster="/logoLayer.webp"
                  className="h-20 w-20 md:h-24 md:w-24 object-contain mb-2 relative z-10"
                />
                <span className="pixel-text text-[10px] text-white/40 tracking-[0.4em] relative z-10">CORE</span>
              </div>
            </div>
            {/* Ambient Pulsing Rings */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] rounded-full border border-indigo-500/10 scale-125 animate-ping opacity-10" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] rounded-full border border-orange-500/5 scale-150 animate-pulse opacity-5" />
          </div>

          {/* Responsive Feature Grid */}
          <div className="grid w-full max-w-5xl grid-cols-1 gap-10 md:grid-cols-2 md:gap-12 relative z-40">

            {/* Card 1: Embed */}
            <div
              onMouseEnter={() => setHoveredCard(1)}
              onMouseLeave={() => setHoveredCard(null)}
              onClick={() => setActiveVideo('/EmbedCode.webm')}
              className="group cursor-pointer"
            >
              <div className="relative rounded-[32px] p-[1px] transition-all duration-700 card-drift group-hover:-translate-y-2 group-hover:scale-[1.03]">
                <div className="absolute -inset-6 rounded-[40px] bg-orange-500/20 blur-3xl opacity-60 transition-opacity duration-700 group-hover:opacity-90 pointer-events-none" />
                <div className="absolute inset-0 rounded-[32px] card-aurora card-aurora-orange opacity-70 pointer-events-none" />
                <div className="absolute inset-0 rounded-[32px] border border-white/10 pointer-events-none" />
                <div className="absolute inset-0 rounded-[32px] bg-gradient-to-br from-orange-500/20 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100 pointer-events-none" />
                <div className="absolute inset-0 rounded-[32px] bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 card-scanline group-hover:opacity-100 pointer-events-none" />
                <div className="absolute right-6 top-6 h-14 w-14 rounded-full border border-orange-500/40 opacity-50 card-ring pointer-events-none" />
                <div className="relative rounded-[31px] bg-slate-900/70 backdrop-blur-2xl border border-white/10 p-6 shadow-[0_30px_80px_-50px_rgba(249,115,22,0.7)]">
                  <div className="absolute inset-0 rounded-[31px] bg-[radial-gradient(circle_at_top,_rgba(251,146,60,0.25),transparent_60%)] opacity-80 pointer-events-none" />
                  <div className="relative z-10 flex items-center gap-3 mb-4">
                    <span className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-[10px] font-black shadow-[0_0_15px_rgba(249,115,22,0.4)]">01</span>
                    <h4 className="text-white font-black uppercase text-xs tracking-widest">Embed Once</h4>
                  </div>
                  <div className="relative z-10 aspect-video bg-black/40 rounded-2xl mb-4 border border-white/5 flex items-center justify-center group-hover:bg-orange-500/10 transition-all overflow-hidden">
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-[radial-gradient(circle_at_center,_rgba(251,146,60,0.25),transparent_65%)] pointer-events-none" />
                    <video
                      src="/EmbedCode.webm"
                      autoPlay
                      loop
                      muted
                      playsInline
                      poster="/logoLayer.webp"
                      className="w-full h-full object-cover opacity-50 group-hover:opacity-100 transition-opacity duration-500"
                    />
                  </div>
                  <p className="relative z-10 text-[10px] text-slate-400 font-bold uppercase tracking-tight text-center">Inject QuestLayer Snippet</p>
                </div>
              </div>
            </div>

            {/* Card 2: Wallet */}
            <div
              onMouseEnter={() => setHoveredCard(2)}
              onMouseLeave={() => setHoveredCard(null)}
              onClick={() => setActiveVideo('/ConnectWallet.webm')}
              className="group cursor-pointer"
            >
              <div className="relative rounded-[32px] p-[1px] transition-all duration-700 card-drift group-hover:-translate-y-2 group-hover:scale-[1.03]" style={{ animationDelay: '0.4s' }}>
                <div className="absolute -inset-6 rounded-[40px] bg-indigo-500/20 blur-3xl opacity-60 transition-opacity duration-700 group-hover:opacity-90 pointer-events-none" />
                <div className="absolute inset-0 rounded-[32px] card-aurora card-aurora-indigo opacity-70 pointer-events-none" />
                <div className="absolute inset-0 rounded-[32px] border border-white/10 pointer-events-none" />
                <div className="absolute inset-0 rounded-[32px] bg-gradient-to-br from-indigo-500/20 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100 pointer-events-none" />
                <div className="absolute inset-0 rounded-[32px] bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 card-scanline group-hover:opacity-100 pointer-events-none" />
                <div className="absolute right-6 top-6 h-14 w-14 rounded-full border border-indigo-500/40 opacity-50 card-ring pointer-events-none" />
                <div className="relative rounded-[31px] bg-slate-900/70 backdrop-blur-2xl border border-white/10 p-6 shadow-[0_30px_80px_-50px_rgba(99,102,241,0.7)]">
                  <div className="absolute inset-0 rounded-[31px] bg-[radial-gradient(circle_at_top,_rgba(129,140,248,0.25),transparent_60%)] opacity-80 pointer-events-none" />
                  <div className="relative z-10 flex items-center gap-3 mb-4">
                    <span className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-[10px] font-black shadow-[0_0_15px_rgba(99,102,241,0.4)]">02</span>
                    <h4 className="text-white font-black uppercase text-xs tracking-widest">Connect Wallet</h4>
                  </div>
                  <div className="relative z-10 aspect-video bg-black/40 rounded-2xl mb-4 border border-white/5 flex items-center justify-center group-hover:bg-indigo-500/10 transition-all overflow-hidden">
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-[radial-gradient(circle_at_center,_rgba(129,140,248,0.25),transparent_65%)] pointer-events-none" />
                    <video
                      src="/ConnectWallet.webm"
                      autoPlay
                      loop
                      muted
                      playsInline
                      poster="/logoLayer.webp"
                      className="w-full h-full object-cover opacity-50 group-hover:opacity-100 transition-opacity duration-500"
                    />
                    <div className="absolute inset-0 flex items-center justify-center group-hover:opacity-0 transition-opacity duration-500">
                      <Wallet size={48} className="text-indigo-500/50" />
                    </div>
                  </div>
                  <p className="relative z-10 text-[10px] text-slate-400 font-bold uppercase tracking-tight text-center">Floating Wallet Button</p>
                </div>
              </div>
            </div>

            {/* Card 3: Tasks */}
            <div
              onMouseEnter={() => setHoveredCard(3)}
              onMouseLeave={() => setHoveredCard(null)}
              className="group cursor-pointer"
            >
              <div className="relative rounded-[32px] p-[1px] transition-all duration-700 card-drift group-hover:-translate-y-2 group-hover:scale-[1.03]" style={{ animationDelay: '0.8s' }}>
                <div className="absolute -inset-6 rounded-[40px] bg-purple-500/20 blur-3xl opacity-60 transition-opacity duration-700 group-hover:opacity-90 pointer-events-none" />
                <div className="absolute inset-0 rounded-[32px] card-aurora card-aurora-purple opacity-70 pointer-events-none" />
                <div className="absolute inset-0 rounded-[32px] border border-white/10 pointer-events-none" />
                <div className="absolute inset-0 rounded-[32px] bg-gradient-to-br from-purple-500/20 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100 pointer-events-none" />
                <div className="absolute inset-0 rounded-[32px] bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 card-scanline group-hover:opacity-100 pointer-events-none" />
                <div className="absolute right-6 top-6 h-14 w-14 rounded-full border border-purple-500/40 opacity-50 card-ring pointer-events-none" />
                <div className="relative rounded-[31px] bg-slate-900/70 backdrop-blur-2xl border border-white/10 p-6 shadow-[0_30px_80px_-50px_rgba(168,85,247,0.7)]">
                  <div className="absolute inset-0 rounded-[31px] bg-[radial-gradient(circle_at_top,_rgba(216,180,254,0.25),transparent_60%)] opacity-80 pointer-events-none" />
                  <div className="relative z-10 flex items-center gap-3 mb-4">
                    <span className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-[10px] font-black shadow-[0_0_15px_rgba(168,85,247,0.4)]">03</span>
                    <h4 className="text-white font-black uppercase text-xs tracking-widest">Complete Tasks</h4>
                  </div>
                  <div className="relative z-10 aspect-video bg-black/40 rounded-2xl mb-4 border border-white/5 flex items-center justify-center group-hover:bg-purple-500/10 transition-all overflow-hidden">
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-[radial-gradient(circle_at_center,_rgba(216,180,254,0.25),transparent_65%)] pointer-events-none" />
                    <Target size={48} className="text-purple-500/50 group-hover:text-purple-200 group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-500" />
                  </div>
                  <p className="relative z-10 text-[10px] text-slate-400 font-bold uppercase tracking-tight text-center">Gamified Mission Completion</p>
                </div>
              </div>
            </div>

            {/* Card 4: Rewards */}
            <div
              onMouseEnter={() => setHoveredCard(4)}
              onMouseLeave={() => setHoveredCard(null)}
              className="group cursor-pointer"
            >
              <div className="relative rounded-[32px] p-[1px] transition-all duration-700 card-drift group-hover:-translate-y-2 group-hover:scale-[1.03]" style={{ animationDelay: '1.2s' }}>
                <div className="absolute -inset-6 rounded-[40px] bg-yellow-500/25 blur-3xl opacity-60 transition-opacity duration-700 group-hover:opacity-90 pointer-events-none" />
                <div className="absolute inset-0 rounded-[32px] card-aurora card-aurora-yellow opacity-70 pointer-events-none" />
                <div className="absolute inset-0 rounded-[32px] border border-white/10 pointer-events-none" />
                <div className="absolute inset-0 rounded-[32px] bg-gradient-to-br from-yellow-500/20 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100 pointer-events-none" />
                <div className="absolute inset-0 rounded-[32px] bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 card-scanline group-hover:opacity-100 pointer-events-none" />
                <div className="absolute right-6 top-6 h-14 w-14 rounded-full border border-yellow-500/40 opacity-50 card-ring pointer-events-none" />
                <div className="relative rounded-[31px] bg-slate-900/80 backdrop-blur-2xl border border-white/10 p-6 shadow-[0_30px_80px_-50px_rgba(234,179,8,0.8)]">
                  <div className="absolute inset-0 rounded-[31px] bg-[radial-gradient(circle_at_top,_rgba(253,230,138,0.25),transparent_60%)] opacity-80 pointer-events-none" />
                  <div className="relative z-10 flex items-center justify-center gap-3 mb-4">
                    <span className="w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center text-[12px] font-black text-black shadow-[0_0_20px_rgba(234,179,8,0.5)]">04</span>
                    <h4 className="text-white font-black uppercase text-sm tracking-widest">Earn Rewards</h4>
                  </div>
                  <div className="relative z-10 aspect-video bg-black/40 rounded-2xl mb-4 border border-white/5 flex items-center justify-around group-hover:bg-yellow-500/10 transition-all overflow-hidden">
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-[radial-gradient(circle_at_center,_rgba(253,230,138,0.3),transparent_65%)] pointer-events-none" />
                    <Trophy size={40} className="text-yellow-500/50 group-hover:text-yellow-200 reward-hop" style={{ animationDelay: '0.2s' }} />
                    <div className="w-12 h-12 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400 font-black text-xs reward-smash" style={{ animationDelay: '0.6s' }}>XP</div>
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 font-black text-[10px] reward-splash" style={{ animationDelay: '1s' }}>NFT</div>
                  </div>
                  <p className="relative z-10 text-[11px] text-slate-400 font-bold uppercase tracking-tight text-center">Gain XP, Tokens, & Digital Assets</p>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* --- FEATURES STRIP --- */}
        <div className="relative w-full mt-16 md:mt-24">
          <div className="absolute -inset-6 rounded-[40px] bg-gradient-to-r from-orange-500/15 via-indigo-500/10 to-purple-500/15 blur-3xl opacity-80 pointer-events-none" />
          <div className="relative rounded-[36px] border border-white/10 bg-white/5 p-8 md:p-12 overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(251,146,60,0.2),transparent_55%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(99,102,241,0.2),transparent_55%)]" />
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-4 py-2 text-[10px] font-black uppercase tracking-[0.3em] text-orange-300">
                <span className="h-2 w-2 rounded-full bg-orange-400 shadow-[0_0_12px_rgba(249,115,22,0.8)]" />
                Features
              </div>

              <div className="mt-6 grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-center">
                <div>
                  <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-white">
                    Embed Quests.
                    <span className="block text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-yellow-300 to-indigo-400">
                      Trigger Growth.
                    </span>
                  </h2>
                  <p className="mt-4 text-sm md:text-base text-slate-300 max-w-xl">
                    Turn your website into a living reward hub - powered by quests, XP, NFTs & tokens.
                  </p>
                  <button
                    onClick={handleStartBuilding}
                    disabled={isConnecting}
                    className="group mt-8 inline-flex items-center gap-3 rounded-2xl bg-orange-500 px-6 py-3 text-[11px] font-black uppercase tracking-[0.2em] text-black shadow-[0_0_30px_rgba(249,115,22,0.35)] transition-all hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Launch Your Widget <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {[
                    {
                      icon: Rocket,
                      title: '1-Line Embed Setup',
                      copy: 'Go live in minutes.',
                      tone: 'from-orange-500/30 via-transparent to-transparent'
                    },
                    {
                      icon: Target,
                      title: 'Quests That Drive Action',
                      copy: 'Follow, join, mint, stake, claim.',
                      tone: 'from-indigo-500/30 via-transparent to-transparent'
                    },
                    {
                      icon: Gem,
                      title: 'Token / NFT / XP Rewards',
                      copy: 'Automated distribution.',
                      tone: 'from-yellow-500/30 via-transparent to-transparent'
                    },
                    {
                      icon: Lock,
                      title: 'NFT-Gated Missions',
                      copy: 'Reward your real holders.',
                      tone: 'from-purple-500/30 via-transparent to-transparent'
                    },
                    {
                      icon: Trophy,
                      title: 'Leaderboards & Seasons',
                      copy: 'Competitive grind = retention.',
                      tone: 'from-emerald-500/30 via-transparent to-transparent'
                    },
                    {
                      icon: UserPlus,
                      title: 'Referral Growth Loops',
                      copy: 'Invite-to-earn built-in.',
                      tone: 'from-sky-500/30 via-transparent to-transparent'
                    },
                    {
                      icon: BarChart3,
                      title: 'Analytics Dashboard',
                      copy: 'Clicks -> connects -> completions.',
                      tone: 'from-rose-500/30 via-transparent to-transparent'
                    },
                    {
                      icon: Sparkles,
                      title: 'Free Lifetime',
                      copy: 'Launch without hidden fees.',
                      tone: 'from-cyan-500/30 via-transparent to-transparent'
                    }
                  ].map(({ icon: Icon, title, copy, tone }) => (
                    <div
                      key={title}
                      className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-950/70 p-4 backdrop-blur-xl"
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${tone} opacity-60`} />
                      <div className="relative z-10 flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white">
                          <Icon size={18} />
                        </div>
                        <div>
                          <div className="text-[11px] font-black uppercase tracking-widest text-white">{title}</div>
                          <div className="mt-1 text-[11px] text-slate-400">{copy}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* --- BOTTOM CTA --- */}
        <div className="mt-20 md:mt-40 w-full max-w-3xl text-center space-y-12 animate-in fade-in slide-in-from-bottom-12 duration-1000">
          <div className="space-y-4">
            <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter leading-tight drop-shadow-2xl">
              QuestLayer turns traffic <br />
              <span className="text-indigo-500">into engagement</span> <br />
              <span className="opacity-20">& engagement into ownership.</span>
            </h2>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-center gap-6">
            <button
              onClick={handleStartBuilding}
              disabled={isConnecting}
              className="group relative w-full md:w-auto px-12 py-6 bg-orange-500 text-black font-black uppercase text-sm tracking-[0.2em] rounded-2xl shadow-[0_0_40px_rgba(249,115,22,0.4)] transition-all active:scale-95 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {/* Shimmer Effect */}
              <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/40 to-transparent" />
              <span className="relative flex items-center justify-center gap-3">
                {isConnecting ? 'Connecting...' : (isConnected ? 'Start Building Now' : 'Connect Wallet to Build')} <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </span>
            </button>

            <button
              onClick={onBrowse}
              className="w-full md:w-auto px-10 py-5 bg-white/5 hover:bg-white/10 text-white font-black uppercase text-xs tracking-[0.2em] rounded-2xl border border-white/10 transition-all backdrop-blur-md flex items-center justify-center gap-3"
            >
              <LogIn size={16} /> Store
            </button>

            <button
              onClick={onTryBuilder}
              className="w-full md:w-auto px-10 py-5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 font-black uppercase text-xs tracking-[0.2em] rounded-2xl border border-indigo-500/20 transition-all backdrop-blur-md flex items-center justify-center gap-3"
            >
              <Sparkles size={16} /> Try Demo
            </button>

          </div>

        </div>
      </div>

      <div className="mt-10 border-t border-white/1 bg-white/2 backdrop-blur-sm">
        <GlobalFooter className="pt-8" />
      </div>

      {/* Video Lightbox Modal */}
      {activeVideo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
          <div
            className="absolute inset-0 bg-[#05010d]/90 backdrop-blur-2xl cursor-pointer"
            onClick={() => setActiveVideo(null)}
          />

          <div className="relative w-full max-w-5xl aspect-video bg-black rounded-3xl overflow-hidden border border-white/10 shadow-[0_0_100px_rgba(249,115,22,0.2)] animate-in zoom-in-95 duration-300">
            {/* Close Button */}
            <button
              onClick={() => setActiveVideo(null)}
              className="absolute top-4 right-4 z-50 p-2 bg-black/50 hover:bg-white/10 text-white rounded-full backdrop-blur-md transition-all border border-white/10 group"
            >
              <X size={24} className="group-hover:rotate-90 transition-transform duration-300" />
            </button>

            {/* Modal Video */}
            <video
              key={activeVideo}
              src={activeVideo}
              autoPlay
              controls
              loop
              className="w-full h-full object-contain"
            />

            {/* Decorative Glows */}
            <div className="absolute -top-24 -left-24 w-64 h-64 bg-orange-500/10 blur-[100px] rounded-full pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
