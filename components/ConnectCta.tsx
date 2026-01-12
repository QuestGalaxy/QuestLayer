import React from 'react';
import { Wallet } from 'lucide-react';

interface ConnectCtaProps {
  onConnect: () => void;
}

const ConnectCta: React.FC<ConnectCtaProps> = ({ onConnect }) => (
  <button
    onClick={onConnect}
    className="group flex items-center gap-2 bg-white text-black px-4 py-2 md:px-6 md:py-3 rounded-full font-black uppercase text-[10px] md:text-xs tracking-widest hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] animate-in fade-in slide-in-from-top-4 duration-700"
  >
    <Wallet size={16} className="group-hover:-rotate-12 transition-transform w-3 h-3 md:w-4 md:h-4" />
    <span>Connect</span>
  </button>
);

export default ConnectCta;
