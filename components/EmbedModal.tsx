
import React, { useState } from 'react';
import { AppState } from '../types.ts';
import { X, Copy, Check, Code, Info, Terminal } from 'lucide-react';

interface EmbedModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: AppState;
}

const EmbedModal: React.FC<EmbedModalProps> = ({ isOpen, onClose, state }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const configJson = JSON.stringify({
    projectName: state.projectName,
    projectId: state.projectId // Include ID for fetching live config
  }).replace(/'/g, '&#39;');

  const scriptCode = `<!-- QuestLayer Widget Embed -->
<script src="${window.location.origin}/widget-embed.js" data-config='${configJson}'></script>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(scriptCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 overflow-hidden">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] flex flex-col bg-slate-900 border border-white/10 rounded-[28px] md:rounded-[40px] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="p-5 md:p-8 border-b border-white/5 flex items-center justify-between bg-slate-800/20 shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-500 rounded-2xl text-white shadow-lg shadow-indigo-500/20">
              <Code size={20} className="md:w-6 md:h-6" />
            </div>
            <div>
              <h3 className="text-white font-black uppercase text-sm md:text-base tracking-tight">Installation</h3>
              <p className="text-slate-400 text-[9px] md:text-[10px] font-black uppercase tracking-widest opacity-60">Production Snippet</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all active:scale-90"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="p-5 md:p-8 space-y-6 overflow-y-auto custom-scroll flex-1">
          
          <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-4 md:p-5 flex gap-4">
            <div className="shrink-0 w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center">
               <Info className="text-indigo-400" size={16} />
            </div>
            <p className="text-[11px] md:text-xs text-indigo-100/80 leading-relaxed font-medium">
              Paste this snippet before the <code className="bg-white/10 px-1.5 py-0.5 rounded text-indigo-300 font-mono text-[10px]">&lt;/body&gt;</code> tag of your website. 
              The widget will initialize automatically with your custom configuration.
            </p>
          </div>

          <div className="relative flex flex-col group space-y-3">
            <div className="flex justify-between items-center px-1">
              <div className="flex items-center gap-2">
                <Terminal size={12} className="text-slate-500" />
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Global Embed Script</span>
              </div>
              <button 
                onClick={handleCopy}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all shadow-xl active:scale-95 ${
                  copied ? 'bg-emerald-500 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-500 border border-indigo-400/20'
                }`}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copied' : 'Copy Snippet'}
              </button>
            </div>
            
            <div className="relative w-full overflow-hidden">
              <div className="bg-black/40 border border-white/5 rounded-[20px] md:rounded-[24px] overflow-hidden transition-all duration-300">
                <div className="p-5 md:p-8 overflow-x-auto custom-scroll-horizontal">
                  <pre className="text-indigo-300/90 font-mono text-[11px] md:text-xs leading-relaxed whitespace-pre-wrap break-words md:whitespace-pre-wrap md:break-normal selection:bg-indigo-500/30">
                    <code className="block w-full">{scriptCode}</code>
                  </pre>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="p-4 rounded-2xl border border-white/5 bg-white/5 flex flex-col justify-center">
                <p className="text-[9px] font-black text-slate-500 uppercase mb-2 tracking-tighter">Status</p>
                <div className="text-[10px] md:text-xs font-black text-emerald-400 flex items-center gap-2 uppercase">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" /> 
                  Build Ready
                </div>
             </div>
             <div className="p-4 rounded-2xl border border-white/5 bg-white/5 flex flex-col justify-center">
                <p className="text-[9px] font-black text-slate-500 uppercase mb-2 tracking-tighter">Payload</p>
                <p className="text-[10px] md:text-xs font-black text-white uppercase tracking-wider">~14.2 KB <span className="text-slate-500 font-normal">GZIPPED</span></p>
             </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 md:p-8 bg-slate-950/40 border-t border-white/5 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">
              Updates in builder sync <span className="text-white">instantly</span>
            </p>
          </div>
          <button 
            onClick={onClose}
            className="w-full sm:w-auto px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition-all"
          >
            Close Settings
          </button>
        </div>
      </div>
      
      <style>{`
        .custom-scroll-horizontal::-webkit-scrollbar {
          height: 6px;
        }
        .custom-scroll-horizontal::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.1);
          border-radius: 10px;
        }
        .custom-scroll-horizontal::-webkit-scrollbar-track {
          background: transparent;
        }
      `}</style>
    </div>
  );
};

export default EmbedModal;
