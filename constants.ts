
import { ThemeConfig, ThemeType, Task } from './types';

export const THEMES: Record<ThemeType, ThemeConfig> = {
  sleek: {
    card: 'bg-slate-900/80 backdrop-blur-xl rounded-t-[40px] md:rounded-3xl border-white/10',
    trigger: 'rounded-2xl',
    header: 'bg-white/5 border-b border-white/5',
    button: 'rounded-2xl',
    itemCard: 'bg-white/5 border-white/5 rounded-3xl',
    iconBox: 'rounded-xl',
    font: 'font-["Plus_Jakarta_Sans"]'
  },
  cyber: {
    card: 'bg-black rounded-none border-2 shadow-[0_0_20px_rgba(255,255,255,0.1)]',
    trigger: 'rounded-none skew-x-[-12deg]',
    header: 'bg-slate-900 border-b-2 border-dashed',
    button: 'rounded-none skew-x-[-6deg]',
    itemCard: 'bg-slate-900 border border-slate-700',
    iconBox: 'rounded-none',
    font: 'font-["Space_Mono"]'
  },
  minimal: {
    card: 'bg-white rounded-none border-slate-200',
    trigger: 'rounded-full text-white bg-black border-black',
    header: 'bg-slate-50 border-b border-slate-200',
    button: 'rounded-none border-2 border-black bg-black text-white hover:bg-white hover:text-black transition-colors',
    itemCard: 'bg-white border-slate-200',
    iconBox: 'rounded-none border border-slate-200 shadow-sm',
    font: 'font-["Inter"]'
  },
  gaming: {
    card: 'bg-indigo-950 rounded-t-3xl md:rounded-3xl border-[#fbbf24]',
    trigger: 'rounded-lg border-2 border-[#fbbf24] bg-indigo-900 italic shadow-[4px_4px_0px_#fbbf24]',
    header: 'bg-black/40 border-b-2 border-[#fbbf24]',
    button: 'rounded-lg border-b-4 border-amber-800 bg-amber-500 text-black active:border-b-0 active:translate-y-1',
    itemCard: 'bg-indigo-900 rounded-xl border-indigo-400/20',
    iconBox: 'rounded-lg',
    font: 'font-["Plus_Jakarta_Sans"]'
  },
  brutal: {
    card: 'bg-white rounded-none border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]',
    trigger: 'rounded-none border-4 border-black bg-white text-black font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]',
    header: 'bg-yellow-400 border-b-4 border-black',
    button: 'rounded-none border-2 border-black bg-black text-white font-black hover:bg-white hover:text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all',
    itemCard: 'bg-white border-2 border-black rounded-none',
    iconBox: 'rounded-none border-2 border-black',
    font: 'font-["Inter"]'
  },
  glass: {
    card: 'bg-white/5 backdrop-blur-3xl rounded-[40px] border border-white/20 shadow-[0_0_40px_rgba(0,0,0,0.3)]',
    trigger: 'rounded-full bg-white/10 backdrop-blur-xl border border-white/30 text-white shadow-xl',
    header: 'bg-white/5 border-b border-white/10 backdrop-blur-md',
    button: 'rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white backdrop-blur-md transition-all active:scale-95 shadow-lg',
    itemCard: 'bg-white/5 border border-white/10 rounded-[32px] backdrop-blur-sm',
    iconBox: 'rounded-2xl bg-white/10 border border-white/20 shadow-inner',
    font: 'font-["Plus_Jakarta_Sans"]'
  }
};

export const INITIAL_TASKS: Task[] = [
  { id: 1, title: 'Verify Protocol X', desc: 'Secure your spot in the ecosystem by following our primary governance channel.', link: 'https://twitter.com', xp: 500 },
  { id: 2, title: 'Community Discord', desc: 'Join the verified builders and contributors to unlock restricted channels.', link: 'https://discord.com', xp: 800 },
  { id: 3, title: 'Review Tokenomics', desc: 'Deep dive into the latest v3 whitepaper regarding liquidity incentives.', link: 'https://google.com', xp: 300 },
  { id: 4, title: 'Share Feedback', desc: 'Help us improve the builder experience by submitting a quick bug report.', link: 'https://google.com', xp: 1200 }
];
