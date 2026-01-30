
import { ThemeConfig, ThemeType, Task } from './types';

export const THEMES: Record<ThemeType, ThemeConfig> = {
  sleek: {
    type: 'dark',
    card: 'bg-slate-900/80 backdrop-blur-xl rounded-t-2xl md:rounded-3xl border-2 border-white/10 shadow-2xl',
    trigger: 'rounded-2xl',
    header: 'bg-white/5 border-b border-white/5',
    button: 'rounded-2xl',
    itemCard: 'bg-white/5 border-white/5 rounded-2xl md:rounded-3xl',
    iconBox: 'rounded-xl',
    font: 'font-["Plus_Jakarta_Sans"]'
  },
  cyber: {
    type: 'dark',
    colors: { border: 'accent' },
    card: 'bg-black rounded-none border-2 shadow-[0_0_20px_rgba(255,255,255,0.1)]',
    trigger: 'rounded-none skew-x-[-12deg]',
    header: 'bg-slate-900 border-b-2 border-dashed',
    button: 'rounded-none skew-x-[-6deg]',
    itemCard: 'bg-slate-900 border border-slate-700',
    iconBox: 'rounded-none',
    font: 'font-["Space_Mono"]'
  },
  minimal: {
    type: 'light',
    colors: { border: null, primary: '#000000' },
    card: 'bg-white rounded-none border-2 border-slate-200 shadow-2xl',
    trigger: 'rounded-full text-white bg-black border-black',
    header: 'bg-slate-50 border-b border-slate-200',
    button: 'rounded-none border-2 !border-black !bg-black !text-white hover:!bg-white hover:!text-black transition-colors',
    itemCard: 'bg-white border-slate-200',
    iconBox: 'rounded-none border border-slate-200 shadow-sm',
    font: 'font-["Inter"]'
  },
  gaming: {
    type: 'dark',
    colors: { primary: '#f59e0b', border: '#fbbf24', secondary: '#b45309', text: 'black' },
    card: 'bg-indigo-950 rounded-t-2xl md:rounded-3xl border-2 border-[#fbbf24] shadow-2xl',
    trigger: 'rounded-lg border-2 border-[#fbbf24] bg-indigo-900 italic',
    header: 'bg-black/40 border-b-2 border-[#fbbf24]',
    button: 'rounded-lg border-b-4 border-amber-800 bg-amber-500 text-black active:border-b-0 active:translate-y-1',
    itemCard: 'bg-indigo-900 rounded-lg md:rounded-xl border-indigo-400/20',
    iconBox: 'rounded-lg',
    font: 'font-["Plus_Jakarta_Sans"]'
  },
  brutal: {
    type: 'light',
    colors: { primary: '#000000', border: '#000000' },
    card: 'bg-white rounded-none border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]',
    trigger: 'rounded-none border-4 border-black bg-white text-black font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]',
    header: 'bg-yellow-400 border-b-4 border-black',
    button: 'rounded-none border-2 !border-black !bg-black !text-white font-black hover:!bg-white hover:!text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all',
    itemCard: 'bg-white border-2 border-black rounded-none',
    iconBox: 'rounded-none border-2 border-black',
    font: 'font-["Inter"]'
  },
  glass: {
    type: 'dark',
    isTransparent: true,
    card: 'bg-slate-950/60 backdrop-blur-3xl rounded-2xl md:rounded-[40px] border border-white/20 shadow-[0_0_40px_rgba(0,0,0,0.3)]',
    trigger: 'rounded-full bg-slate-950/60 backdrop-blur-xl border border-white/30 shadow-xl',
    header: 'bg-white/5 border-b border-white/10 backdrop-blur-md',
    button: 'rounded-full bg-white/5 hover:bg-white/10 border border-white/20 backdrop-blur-md transition-all active:scale-95 shadow-lg',
    itemCard: 'bg-white/5 border border-white/10 rounded-2xl md:rounded-[32px] backdrop-blur-sm',
    iconBox: 'rounded-2xl bg-white/10 border border-white/20 shadow-inner',
    font: 'font-["Plus_Jakarta_Sans"]'
  },
  terminal: {
    type: 'dark',
    colors: { primary: '#86efac', border: '#1f3d2a', text: '#0b0f0c' },
    card: 'bg-[#0b0f0c] rounded-none border border-[#1f3d2a] shadow-[0_0_0_1px_rgba(24,255,131,0.12)]',
    trigger: 'rounded-none border border-[#1f3d2a] bg-[#0b0f0c] text-[#86efac] tracking-[0.2em]',
    header: 'bg-[#0f1612] border-b border-[#1f3d2a]',
    button: 'rounded-none border border-[#1f3d2a] bg-[#0f1612] text-[#86efac] hover:bg-[#142018] transition-colors',
    itemCard: 'bg-[#0f1612] border border-[#1f3d2a] rounded-none',
    iconBox: 'rounded-none border border-[#1f3d2a] bg-[#0b0f0c]',
    font: 'font-["Space_Mono"]'
  },
  aura: {
    type: 'light',
    colors: { primary: '#f43f5e', border: '#fecdd3', text: '#881337' },
    card: 'bg-[#fff7f3] rounded-2xl md:rounded-[36px] border border-rose-200 shadow-[0_20px_50px_rgba(244,63,94,0.18)]',
    trigger: 'rounded-full border border-rose-200 bg-rose-100 text-rose-900',
    header: 'bg-rose-100 border-b border-rose-200',
    button: 'rounded-full bg-rose-200 text-rose-900 border border-rose-300 hover:bg-rose-300 transition-colors',
    itemCard: 'bg-white border-rose-200 rounded-xl md:rounded-[28px]',
    iconBox: 'rounded-full bg-rose-100 border border-rose-200',
    font: 'font-["Inter"]'
  },
  avatar: {
    type: 'dark',
    colors: { border: '#67e8f9' },
    card: 'bg-[#061b2d] rounded-2xl md:rounded-[34px] border border-cyan-200/30 shadow-[0_0_45px_rgba(34,211,238,0.18)]',
    trigger: 'rounded-full border border-cyan-200/60 bg-[#0a2a43] text-cyan-100 shadow-[0_0_22px_rgba(34,211,238,0.45)]',
    header: 'bg-[#0f2f4d] border-b border-cyan-200/20',
    button: 'rounded-full bg-cyan-400/15 text-cyan-100 border border-cyan-300/40 hover:bg-cyan-400/25 shadow-[0_0_18px_rgba(34,211,238,0.3)]',
    itemCard: 'bg-[#0b2236] border border-cyan-200/20 rounded-2xl md:rounded-[28px]',
    iconBox: 'rounded-full bg-cyan-400/10 border border-cyan-300/30',
    font: 'font-["Plus_Jakarta_Sans"]'
  },
  ironman: {
    type: 'dark',
    colors: { border: '#f59e0b' },
    card: 'bg-[#200709] rounded-2xl md:rounded-[32px] border-2 border-amber-400/60 shadow-[0_0_28px_rgba(251,191,36,0.35)]',
    trigger: 'rounded-xl border-2 border-amber-400 bg-[#7f0d12] text-amber-100 shadow-[0_0_20px_rgba(248,113,113,0.4)]',
    header: 'bg-[#3a0b0f] border-b border-amber-400/40',
    button: 'rounded-xl bg-amber-400 text-[#26070a] border border-amber-300 hover:bg-amber-300 shadow-[0_10px_20px_rgba(251,191,36,0.25)]',
    itemCard: 'bg-[#2a0b0f] border border-amber-400/30 rounded-xl md:rounded-2xl',
    iconBox: 'rounded-xl bg-[#7f0d12] border border-amber-400/40',
    font: 'font-["Plus_Jakarta_Sans"]'
  },
  quest: {
    type: 'light',
    colors: { border: null, primary: '#000000' },
    card: 'bg-white rounded-3xl border border-slate-100 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.1)]',
    trigger: 'rounded-2xl bg-[#a78bfa] hover:bg-[#9061f9] text-white shadow-lg shadow-indigo-500/20 transition-all duration-300',
    header: 'bg-white/80 backdrop-blur-md border-b border-slate-100 rounded-t-3xl',
    footer: 'bg-white/80 backdrop-blur-md rounded-b-3xl border-slate-100',
    button: 'rounded-xl bg-[#a78bfa] hover:bg-[#9061f9] text-white font-medium shadow-md shadow-indigo-500/10 transition-all active:scale-95',
    itemCard: 'bg-slate-50/50 border border-slate-200/60 rounded-2xl hover:bg-white hover:border-[#a78bfa]/30 transition-all duration-300',
    iconBox: 'rounded-xl bg-white border border-slate-100 shadow-sm text-[#a78bfa]',
    font: 'font-["Plus_Jakarta_Sans"]'
  }
};

export const STORE_SLIDING_LINKS = [
  { name: 'Galxe', domain: 'galxe.com' },
  { name: 'Phantom', domain: 'phantom.app' },
  { name: 'Daylight', domain: 'daylight.xyz' },
  { name: 'Magic Eden', domain: 'magiceden.io' },
  { name: 'Uniswap', domain: 'uniswap.org' },
  { name: 'PancakeSwap', domain: 'pancakeswap.finance' },
  { name: 'DeFiLlama', domain: 'defillama.com' },
  { name: 'Raydium', domain: 'raydium.io' },
  { name: 'CoinCollect', domain: 'coincollect.app' },
  { name: 'Aave', domain: 'aave.com' },
  { name: 'Curve', domain: 'curve.fi' },
  { name: 'Balancer', domain: 'balancer.fi' },
  { name: 'Compound', domain: 'compound.finance' },
  { name: 'Sushi', domain: 'sushi.com' },
  { name: 'Audius', domain: 'audius.co' },
  { name: 'WalletConnect', domain: 'walletconnect.com' },
  { name: 'QuickNode', domain: 'quicknode.com' },
  { name: 'Optimism', domain: 'optimism.io' },
  { name: 'zkSync', domain: 'zksync.io' },
  { name: 'Superfluid', domain: 'superfluid.finance' },
  { name: 'Snapshot', domain: 'snapshot.org' }
];



export const SPONSORED_TASKS: Task[] = [
  {
    id: 'sp-twitter-follow',
    title: 'Follow QuestGalaxy',
    desc: 'Follow @QuestGalaxycom on X for ecosystem updates.',
    link: 'https://x.com/QuestGalaxycom',
    icon: 'icon:twitter',
    xp: 100,
    isSponsored: true,
    section: 'missions',
    kind: 'link',
    rewardCadence: 'once'
  },
  {
    id: 'sp-telegram-join',
    title: 'Join Telegram',
    desc: 'Join the QuestGalaxy Telegram channel.',
    link: 'https://t.me/QuestGalaxy',
    icon: 'icon:telegram',
    xp: 100,
    isSponsored: true,
    section: 'missions',
    kind: 'link',
    rewardCadence: 'once'
  },
  {
    id: 'sp-medium-follow',
    title: 'Follow on Medium',
    desc: 'Read QuestGalaxy updates and announcements.',
    link: 'https://medium.com/questgalaxy',
    icon: 'icon:globe',
    xp: 100,
    isSponsored: true,
    section: 'missions',
    kind: 'link',
    rewardCadence: 'once'
  },
  {
    id: 'sp-mint-lootbox',
    title: 'Mint Lootbox NFT',
    desc: 'Mint the QuestGalaxy lootbox on OpenSea.',
    link: 'https://opensea.io/collection/questgalaxy-lootbox/overview',
    icon: 'icon:gem',
    xp: 100,
    isSponsored: true,
    section: 'missions',
    kind: 'link',
    rewardCadence: 'once'
  }
];

export const INITIAL_TASKS: Task[] = [];
