
import React, { useState } from 'react';
import { Code, Wallet, Target, Trophy, ChevronRight, Globe, Sparkles } from 'lucide-react';

interface LandingPageProps {
  onLaunch: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLaunch }) => {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

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
          autoPlay 
          muted 
          loop 
          playsInline 
          className="absolute inset-0 w-full h-full object-cover opacity-20"
        >
          <source src="/questlayer.mp4" type="video/mp4" />
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
        <div className="mb-6 text-center animate-in fade-in slide-in-from-top-8 duration-1000">
           <div className="flex flex-col items-center">
             <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 mb-6">
                <div className="p-3 bg-orange-500/10 rounded-2xl border border-orange-500/20 glow-orange">
                  <img
                    src="/logoLayer.webp"
                    alt="QuestLayer logo"
                    className="h-12 w-12 object-contain"
                  />
                </div>
                <h1 className="pixel-text text-4xl sm:text-5xl md:text-7xl text-white tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-orange-400 drop-shadow-[0_0_15px_rgba(249,115,22,0.3)]">
                  QUESTLAYER
                </h1>
             </div>
             <p className="text-xl sm:text-2xl md:text-3xl font-black text-white max-w-3xl leading-[1.1] tracking-tight">
               Turn Any Website Into an Interactive <br className="hidden sm:block" />
               <span className="text-orange-500 italic underline decoration-orange-500/30 underline-offset-8">Quest & Reward Hub</span>
             </p>
             <div className="mt-6 flex items-center gap-3 px-6 py-2 bg-white/5 border border-white/10 rounded-full">
                <Sparkles size={14} className="text-orange-400 animate-spin-slow" />
                <p className="text-slate-400 text-[10px] md:text-xs font-black uppercase tracking-[0.3em]">
                  One embed • No redirects • Instant Web3
                </p>
             </div>
             <div className="mt-4 flex items-center justify-center gap-4">
               <button
                 onClick={onLaunch}
                 className="px-6 py-3 bg-orange-500 text-black font-black uppercase text-[10px] tracking-[0.2em] rounded-xl shadow-[0_0_30px_rgba(249,115,22,0.35)] transition-all hover:brightness-110 active:scale-95"
               >
                 Start Building
               </button>
               <button className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-black uppercase text-[10px] tracking-[0.2em] rounded-xl border border-white/10 transition-all">
                 View Demo
               </button>
             </div>
           </div>
        </div>

        {/* --- THE OCTOPUS ENGINE (Interactive Feature Map) --- */}
        <div className="relative w-full min-h-[500px] flex items-center justify-center pb-20 pt-4">
          
          {/* SVG Tentacle Layer */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30 overflow-visible" preserveAspectRatio="none">
            <defs>
              <linearGradient id="tentacleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#f97316" />
              </linearGradient>
            </defs>
            {/* These paths simulate the tentacles reaching from center to grid positions */}
            <path d="M 50% 50% Q 25% 25% 15% 15%" stroke="url(#tentacleGrad)" strokeWidth="2" fill="none" strokeDasharray="8 8" className="animate-pulse" />
            <path d="M 50% 50% Q 75% 25% 85% 15%" stroke="url(#tentacleGrad)" strokeWidth="2" fill="none" strokeDasharray="8 8" />
            <path d="M 50% 50% Q 75% 75% 85% 85%" stroke="url(#tentacleGrad)" strokeWidth="2" fill="none" strokeDasharray="8 8" />
            <path d="M 50% 50% Q 25% 75% 15% 85%" stroke="url(#tentacleGrad)" strokeWidth="2" fill="none" strokeDasharray="8 8" />
            <path d="M 50% 50% L 50% 90%" stroke="url(#tentacleGrad)" strokeWidth="2" fill="none" strokeDasharray="8 8" />
          </svg>

          {/* Central Animated Hub */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none">
            <div className={`w-32 h-32 md:w-56 md:h-56 rounded-full bg-gradient-to-tr from-purple-600/20 to-indigo-400/20 p-1.5 animate-float transition-all duration-700 border-4 ${getHubGlow()}`}>
               <div className="w-full h-full rounded-full bg-slate-950/90 flex flex-col items-center justify-center backdrop-blur-3xl overflow-hidden relative">
                  <div className="absolute inset-0 bg-indigo-500/5 animate-pulse" />
                  <img
                    src="/logoLayer.webp"
                    alt="QuestLayer logo"
                    className="h-14 w-14 md:h-16 md:w-16 object-contain mb-2 relative z-10"
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
                     <Code size={48} className="text-orange-500/50 group-hover:text-orange-200 group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-500" />
                  </div>
                  <p className="relative z-10 text-[10px] text-slate-400 font-bold uppercase tracking-tight text-center">Inject QuestLayer Snippet</p>
                </div>
              </div>
            </div>

            {/* Card 2: Wallet */}
            <div 
              onMouseEnter={() => setHoveredCard(2)} 
              onMouseLeave={() => setHoveredCard(null)}
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
                     <Wallet size={48} className="text-indigo-500/50 group-hover:text-indigo-200 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500" />
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

        {/* --- BOTTOM CTA --- */}
        <div className="mt-20 md:mt-40 w-full max-w-3xl text-center space-y-12 animate-in fade-in slide-in-from-bottom-12 duration-1000">
           <div className="space-y-4">
             <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter leading-tight drop-shadow-2xl">
                QuestLayer turns traffic <br/>
                <span className="text-indigo-500">into engagement</span> <br/>
                <span className="opacity-20">& engagement into ownership.</span>
             </h2>
           </div>

           <div className="flex flex-col md:flex-row items-center justify-center gap-6">
              <button 
                onClick={onLaunch}
                className="group relative w-full md:w-auto px-12 py-6 bg-orange-500 text-black font-black uppercase text-sm tracking-[0.2em] rounded-2xl shadow-[0_0_40px_rgba(249,115,22,0.4)] transition-all active:scale-95 overflow-hidden"
              >
                {/* Shimmer Effect */}
                <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                <span className="relative flex items-center justify-center gap-3">
                  Start Building Now <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </span>
              </button>
              
              <button className="w-full md:w-auto px-12 py-6 bg-white/5 hover:bg-white/10 text-white font-black uppercase text-sm tracking-[0.2em] rounded-2xl border border-white/10 transition-all backdrop-blur-md flex items-center justify-center gap-3">
                <Globe size={18} /> Documentation
              </button>
           </div>

           {/* Chain Marquee */}
           <div className="pt-16 border-t border-white/5 overflow-hidden">
             <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.5em] mb-8">Ecosystem Support</p>
             <div className="flex flex-wrap justify-center items-center gap-x-16 gap-y-10 opacity-40 grayscale hover:grayscale-0 transition-all duration-700">
                <div className="flex flex-col items-center gap-3 group cursor-default">
                  <svg width="32" height="32" viewBox="0 0 256 417" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid" className="group-hover:scale-110 transition-transform"><path d="M127.961 0l-2.795 9.5v275.668l2.795 2.79 127.962-75.638z" fill="#343434"/><path d="M127.962 0L0 212.32l127.962 75.639V154.158z" fill="#8C8C8C"/><path d="M127.961 312.187l-1.575 1.92V414.41l1.575 4.59 128.038-180.32z" fill="#3C3C3B"/><path d="M127.962 419V312.187L0 238.68z" fill="#8C8C8C"/><path d="M127.961 287.958l127.96-75.637-127.96-58.162z" fill="#141414"/><path d="M0 212.32l127.962 75.638V154.158z" fill="#393939"/></svg>
                  <span className="text-[9px] font-bold text-white tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">ETHEREUM</span>
                </div>
                
                <div className="flex flex-col items-center gap-3 group cursor-default">
                  <svg width="32" height="32" viewBox="0 0 397 311" xmlns="http://www.w3.org/2000/svg" className="group-hover:scale-110 transition-transform"><path d="M64.6 237.9c2.4-2.4 5.7-3.8 9.2-3.8h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H4.6c-5.8 0-8.7-7-4.6-11.1l64.6-62.7z" fill="#9945FF"/><path d="M64.6 3.8C67.1 1.4 70.4 0 73.8 0h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H4.6c-5.8 0-8.7-7-4.6-11.1L64.6 3.8z" fill="#14F195"/><path d="M333.1 120.1c-2.4-2.4-5.7-3.8-9.2-3.8H6.5c-5.8 0-8.7 7-4.6 11.1l62.7 62.7c2.4 2.4 5.7 3.8 9.2 3.8h317.4c5.8 0 8.7-7 4.6-11.1l-62.7-62.7z" fill="#9945FF"/></svg>
                  <span className="text-[9px] font-bold text-white tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">SOLANA</span>
                </div>

                <div className="flex flex-col items-center gap-3 group cursor-default">
                  <svg width="32" height="32" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="group-hover:scale-110 transition-transform"><path d="M12 0.75L14.6515 8.91031H23.2307L16.2896 13.9544L18.9411 22.1147L12 17.0706L5.05887 22.1147L7.71039 13.9544L0.769264 8.91031H9.34848L12 0.75Z" fill="#8247E5"/></svg>
                  <span className="text-[9px] font-bold text-white tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">POLYGON</span>
                </div>

                <div className="flex flex-col items-center gap-3 group cursor-default">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="group-hover:scale-110 transition-transform"><circle cx="12" cy="12" r="12" fill="#0052FF"/><path d="M12 18.5V5.5C15.5899 5.5 18.5 8.41015 18.5 12C18.5 15.5899 15.5899 18.5 12 18.5Z" fill="white"/></svg>
                  <span className="text-[9px] font-bold text-white tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">BASE</span>
                </div>

                <div className="flex flex-col items-center gap-3 group cursor-default">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="group-hover:scale-110 transition-transform"><circle cx="12" cy="12" r="12" fill="#28A0F0"/><path d="M12 16.5L16.5 12L12 7.5L7.5 12L12 16.5Z" fill="white"/></svg>
                  <span className="text-[9px] font-bold text-white tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">ARBITRUM</span>
                </div>

                <div className="flex flex-col items-center gap-3 group cursor-default">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="group-hover:scale-110 transition-transform"><circle cx="12" cy="12" r="12" fill="#FF0420"/><path d="M8 12C8 9.79086 9.79086 8 12 8C14.2091 8 16 9.79086 16 12C16 14.2091 14.2091 16 12 16C9.79086 16 8 14.2091 8 12Z" fill="white"/></svg>
                  <span className="text-[9px] font-bold text-white tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">OPTIMISM</span>
                </div>
             </div>
           </div>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="py-10 flex flex-col items-center gap-4 opacity-10">
        <img
          src="/logoLayer.webp"
          alt="QuestLayer logo"
          className="h-6 w-6 object-contain"
        />
        <h3 className="pixel-text text-2xl text-white tracking-[0.5em] uppercase">
          QuestLayer
        </h3>
      </div>
    </div>
  );
};

export default LandingPage;
