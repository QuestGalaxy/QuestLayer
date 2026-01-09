
import { ThemeConfig, ThemeType, Task } from './types';

export const THEMES: Record<ThemeType, ThemeConfig> = {
  sleek: {
    card: 'bg-slate-900/80 backdrop-blur-xl rounded-t-2xl md:rounded-3xl border-white/10',
    trigger: 'rounded-2xl',
    header: 'bg-white/5 border-b border-white/5',
    button: 'rounded-2xl',
    itemCard: 'bg-white/5 border-white/5 rounded-2xl md:rounded-3xl',
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
      card: 'bg-indigo-950 rounded-t-2xl md:rounded-3xl border-2 border-[#fbbf24]',
      trigger: 'rounded-lg border-2 border-[#fbbf24] bg-indigo-900 italic',
      header: 'bg-black/40 border-b-2 border-[#fbbf24]',
      button: 'rounded-lg border-b-4 border-amber-800 bg-amber-500 text-black active:border-b-0 active:translate-y-1',
      itemCard: 'bg-indigo-900 rounded-lg md:rounded-xl border-indigo-400/20',
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
    card: 'bg-slate-950/60 backdrop-blur-3xl rounded-2xl md:rounded-[40px] border border-white/20 shadow-[0_0_40px_rgba(0,0,0,0.3)]',
    trigger: 'rounded-full bg-slate-950/60 backdrop-blur-xl border border-white/30 shadow-xl',
    header: 'bg-white/5 border-b border-white/10 backdrop-blur-md',
    button: 'rounded-full bg-white/5 hover:bg-white/10 border border-white/20 backdrop-blur-md transition-all active:scale-95 shadow-lg',
    itemCard: 'bg-white/5 border border-white/10 rounded-2xl md:rounded-[32px] backdrop-blur-sm',
    iconBox: 'rounded-2xl bg-white/10 border border-white/20 shadow-inner',
    font: 'font-["Plus_Jakarta_Sans"]'
  },
  terminal: {
    card: 'bg-[#0b0f0c] rounded-none border border-[#1f3d2a] shadow-[0_0_0_1px_rgba(24,255,131,0.12)]',
    trigger: 'rounded-none border border-[#1f3d2a] bg-[#0b0f0c] text-[#86efac] tracking-[0.2em]',
    header: 'bg-[#0f1612] border-b border-[#1f3d2a]',
    button: 'rounded-none border border-[#1f3d2a] bg-[#0f1612] text-[#86efac] hover:bg-[#142018] transition-colors',
    itemCard: 'bg-[#0f1612] border border-[#1f3d2a] rounded-none',
    iconBox: 'rounded-none border border-[#1f3d2a] bg-[#0b0f0c]',
    font: 'font-["Space_Mono"]'
  },
  aura: {
    card: 'bg-[#fff7f3] rounded-2xl md:rounded-[36px] border border-rose-200 shadow-[0_20px_50px_rgba(244,63,94,0.18)]',
    trigger: 'rounded-full border border-rose-200 bg-rose-100 text-rose-900',
    header: 'bg-rose-100 border-b border-rose-200',
    button: 'rounded-full bg-rose-200 text-rose-900 border border-rose-300 hover:bg-rose-300 transition-colors',
    itemCard: 'bg-white border-rose-200 rounded-xl md:rounded-[28px]',
    iconBox: 'rounded-full bg-rose-100 border border-rose-200',
    font: 'font-["Inter"]'
  }
};

export const DEMO_TASKS: Task[] = [
  {
    id: 'demo-1',
    title: 'Visit Website',
    desc: 'Explore QuestGalaxy and discover the latest quests and galaxy rewards.',
    link: 'https://questgalaxy.com/',
    icon: 'https://www.google.com/s2/favicons?domain=questgalaxy.com&sz=128',
    xp: 200,
    isDemo: true
  },
  {
    id: 'demo-2',
    title: 'Follow X',
    desc: 'Follow @questgalaxycom for launches, raids, and drops.',
    link: 'https://x.com/questgalaxycom',
    icon: 'https://www.google.com/s2/favicons?domain=x.com&sz=128',
    xp: 200,
    isDemo: true
  },
  {
    id: 'demo-3',
    title: 'Join Telegram',
    desc: 'Join the QuestGalaxy Telegram to meet the community and mods.',
    link: 'https://t.me/questgalaxy',
    icon: 'https://www.google.com/s2/favicons?domain=t.me&sz=128',
    xp: 200,
    isDemo: true
  },
  {
    id: 'demo-4',
    title: 'Follow Medium',
    desc: 'Read the QuestGalaxy Medium for updates and deep dives.',
    link: 'https://medium.com/questgalaxy',
    icon: 'https://www.google.com/s2/favicons?domain=medium.com&sz=128',
    xp: 200,
    isDemo: true
  }
];

export const INITIAL_TASKS: Task[] = [];
