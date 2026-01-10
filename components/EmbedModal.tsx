
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Copy, X, Code, Terminal, ExternalLink } from 'lucide-react';
import { AppState } from '../types.ts';

interface EmbedModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: AppState;
}

const EmbedModal: React.FC<EmbedModalProps> = ({ isOpen, onClose, state }) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'script' | 'react'>('script');

  if (!isOpen) return null;

  // Generate unique ID based on project ID or timestamp
  const projectId = state.projectId || `ql-${Date.now()}`;
  
  const config = {
    projectName: state.projectName,
    projectId: projectId,
    // We only export essential config that differs from defaults or needs specific ID
  };

  const embedOrigin = import.meta.env.DEV && typeof window !== 'undefined'
    ? window.location.origin
    : 'https://questlayer.app';
  const scriptCode = `<script src="${embedOrigin}/widget-embed.js" data-config='${JSON.stringify(config)}'></script>`;

  const reactCode = `import { initQuestLayer } from 'questlayer';

useEffect(() => {
  initQuestLayer({
    projectId: '${projectId}',
    projectName: '${state.projectName}'
  });
}, []);`;

  const handleCopy = () => {
    navigator.clipboard.writeText(activeTab === 'script' ? scriptCode : reactCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return createPortal(
    <div className="fixed inset-0 z-[2147483647] flex items-center justify-center p-3 sm:p-6 overflow-hidden">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/5 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
              <Code size={20} />
            </div>
            <div>
              <h3 className="text-white font-black uppercase tracking-tight text-lg">Embed Widget</h3>
              <p className="text-slate-400 text-xs">Add QuestLayer to your website</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/5">
          <button
            onClick={() => setActiveTab('script')}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${
              activeTab === 'script' 
                ? 'border-indigo-500 text-white bg-white/5' 
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            HTML Script
          </button>
          <button
            onClick={() => setActiveTab('react')}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${
              activeTab === 'react' 
                ? 'border-indigo-500 text-white bg-white/5' 
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            React / Next.js
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 bg-slate-950/50 flex-1 overflow-y-auto custom-scroll">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                <Terminal size={12} />
                {activeTab === 'script' ? 'Paste this before </body> tag' : 'Install & Initialize'}
              </label>
              {activeTab === 'react' && (
                <span className="text-[10px] font-mono text-slate-500">npm install questlayer</span>
              )}
            </div>
            
            <div className="relative group">
              <pre className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-xs font-mono text-slate-300 overflow-x-auto custom-scroll whitespace-pre-wrap break-all">
                {activeTab === 'script' ? scriptCode : reactCode}
              </pre>
              <button 
                onClick={handleCopy}
                className="absolute top-2 right-2 p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all backdrop-blur-sm opacity-0 group-hover:opacity-100 focus:opacity-100"
                title="Copy to clipboard"
              >
                {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              </button>
            </div>
          </div>

          <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 space-y-2">
            <h4 className="text-indigo-400 text-xs font-black uppercase flex items-center gap-2">
              <ExternalLink size={12} />
              Pro Tip
            </h4>
            <p className="text-slate-400 text-xs leading-relaxed">
              Your widget will automatically sync with the configuration you set here. 
              Changes to theme, colors, and missions update instantly without changing the code.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/5 bg-slate-900 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 bg-white text-black font-black uppercase text-xs rounded-xl hover:bg-slate-200 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default EmbedModal;
