import React from 'react';
import { Wallet } from 'lucide-react';

interface ConnectCtaProps {
  onConnect: () => void;
}

const ConnectCta: React.FC<ConnectCtaProps> = ({ onConnect }) => (
  <button
    onClick={onConnect}
    className="group flex items-center gap-2 h-9 md:h-[42px] px-4 md:px-6 rounded-full bg-slate-900/60 text-white backdrop-blur-xl border border-white/10 font-black uppercase text-[10px] md:text-xs tracking-widest hover:bg-slate-900/80 hover:border-indigo-500/30 transition-all shadow-2xl animate-in fade-in slide-in-from-top-4 duration-700"
  >
    <Wallet size={16} className="text-indigo-300 group-hover:-rotate-12 transition-transform w-3 h-3 md:w-4 md:h-4" />
    <span>Connect</span>
  </button>
);

export default ConnectCta;
