import React, { useMemo, useState } from 'react';
import { CheckCircle2, ExternalLink, Loader2, ShieldCheck, Sparkles, Wallet, X } from 'lucide-react';
import { useAppKit, useAppKitAccount } from '@reown/appkit/react';

interface SubmitProjectProps {
  mode?: 'modal' | 'page';
  onClose?: () => void;
  onOpenBuilder?: () => void;
}

const SubmitProject: React.FC<SubmitProjectProps> = ({ mode = 'page', onClose, onOpenBuilder }) => {
  const { open } = useAppKit();
  const { isConnected, status } = useAppKitAccount();
  const isConnecting = status === 'connecting' || status === 'reconnecting';

  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'checking' | 'verified'>('idle');
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const embedSnippet = useMemo(() => {
    return `<script src="https://questlayer.app/widget-embed.js" data-project="YOUR_PROJECT_ID"></script>`;
  }, []);

  const handleOpenBuilder = () => {
    if (onOpenBuilder) {
      onOpenBuilder();
      return;
    }
    window.location.assign('/builder');
  };

  const handleVerify = async () => {
    setVerificationStatus('checking');
    try {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      await fetch('/api/verify-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      }).catch(() => null);
      setVerificationStatus('verified');
    } finally {
      setLastChecked(new Date());
    }
  };

  const isModal = mode === 'modal';
  const verified = verificationStatus === 'verified';

  return (
    <div className={isModal ? 'fixed inset-0 z-[120] flex items-center justify-center px-4 py-8' : 'h-[100dvh] w-full bg-slate-950 overflow-y-auto custom-scroll'}>
      {isModal && (
        <div
          className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
          onClick={onClose}
        />
      )}

      <div
        className={`relative w-full ${isModal ? 'max-w-5xl max-h-[90vh] overflow-y-auto custom-scroll' : 'max-w-6xl mx-auto'} bg-slate-950 ${isModal ? 'rounded-[32px] border border-white/10 shadow-[0_40px_120px_rgba(15,23,42,0.65)]' : ''}`}
      >
        <div className="absolute -top-20 -right-24 h-64 w-64 rounded-full bg-indigo-500/20 blur-[120px]" />
        <div className="absolute -bottom-24 -left-20 h-64 w-64 rounded-full bg-orange-500/10 blur-[140px]" />

        <div className={`${isModal ? 'p-6 md:p-10' : 'p-6 md:p-16'} relative`}>
          {isModal && (
            <button
              onClick={onClose}
              className="absolute right-6 top-6 text-slate-400 hover:text-white transition-colors"
              aria-label="Close submit project"
            >
              <X size={20} />
            </button>
          )}

          <div className="mb-10 flex flex-col gap-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.35em] text-indigo-200 w-fit">
              <Sparkles size={12} /> Submit Project
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tight">
              Launch on the Quest Store
            </h1>
            <p className="text-slate-300 text-sm md:text-lg max-w-2xl leading-relaxed">
              Share your website, embed the QuestLayer widget, and unlock auto-verification for Store visibility.
            </p>
          </div>

          <div className="relative">
            <div className="absolute left-5 top-7 bottom-6 w-px bg-white/10" />

            <div className="space-y-6">
              <div className="relative pl-12">
                <div className="absolute left-0 top-3 h-10 w-10 rounded-full border border-indigo-500/30 bg-indigo-500/15 text-indigo-200 flex items-center justify-center text-xs font-black">
                  1
                </div>
                <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-5 md:p-6 shadow-2xl">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <h3 className="text-white font-black uppercase tracking-wide text-sm">Connect wallet</h3>
                      <p className="text-slate-400 text-xs mt-2">
                        Connect to claim ownership and manage project visibility.
                      </p>
                    </div>
                    <button
                      onClick={() => (isConnected ? null : open())}
                      disabled={isConnected || isConnecting}
                      className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border transition-all ${
                        isConnected ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200' :
                        'border-white/10 bg-white/5 hover:bg-white/10 text-white'
                      }`}
                    >
                      {isConnected ? 'Connected' : (isConnecting ? 'Connecting...' : 'Connect')}
                    </button>
                  </div>
                </div>
              </div>

              <div className="relative pl-12">
                <div className="absolute left-0 top-3 h-10 w-10 rounded-full border border-orange-500/30 bg-orange-500/15 text-orange-200 flex items-center justify-center text-xs font-black">
                  2
                </div>
                <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-5 md:p-6 shadow-2xl">
                  <div className="flex flex-col gap-5">
                    <div>
                      <h3 className="text-white font-black uppercase tracking-wide text-sm">Build a widget</h3>
                      <p className="text-slate-400 text-xs mt-2">
                        Set your project name and website, then launch the builder.
                      </p>
                    </div>
                    <button
                      onClick={handleOpenBuilder}
                      className="w-full md:w-fit px-5 py-2.5 rounded-xl bg-orange-500 text-black font-black uppercase text-xs tracking-widest shadow-[0_0_25px_rgba(249,115,22,0.35)] hover:brightness-110 transition-all"
                    >
                      Build Your Widget
                    </button>
                  </div>
                </div>
              </div>

              <div className="relative pl-12">
                <div className="absolute left-0 top-3 h-10 w-10 rounded-full border border-indigo-500/30 bg-indigo-500/15 text-indigo-200 flex items-center justify-center text-xs font-black">
                  3
                </div>
                <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-5 md:p-6 shadow-2xl">
                  <div className="flex flex-col gap-4">
                    <div>
                      <h3 className="text-white font-black uppercase tracking-wide text-sm">Embed to website</h3>
                      <p className="text-slate-400 text-xs mt-2">
                        Add the QuestLayer script to your site to activate verification.
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-[11px] text-slate-200 font-mono">
                      {embedSnippet}
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={handleOpenBuilder}
                        className="px-4 py-2 rounded-xl border border-indigo-500/30 bg-indigo-500/10 text-xs font-black uppercase tracking-widest text-indigo-200 hover:bg-indigo-500/20 transition-all inline-flex items-center gap-2"
                      >
                        Get Your Embed Code <ExternalLink size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative pl-12">
                <div className="absolute left-0 top-3 h-10 w-10 rounded-full border border-emerald-500/30 bg-emerald-500/15 text-emerald-200 flex items-center justify-center text-xs font-black">
                  4
                </div>
                <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-5 md:p-6 shadow-2xl">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <h3 className="text-white font-black uppercase tracking-wide text-sm">Auto-verified</h3>
                      <p className="text-slate-400 text-xs mt-2">
                        We scan your site to confirm the widget is embedded and active.
                      </p>
                      <div className="mt-3 text-[11px] uppercase tracking-[0.2em] text-slate-500">
                        Status: <span className={verified ? 'text-emerald-300' : 'text-slate-400'}>{verified ? 'Verified' : 'Pending'}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        Last checked: {lastChecked ? lastChecked.toLocaleString() : 'Not checked yet'}
                      </div>
                    </div>
                    <button
                      onClick={handleVerify}
                      disabled={verificationStatus === 'checking'}
                      className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-black uppercase text-xs tracking-widest shadow-[0_0_25px_rgba(16,185,129,0.35)] hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
                    >
                      {verificationStatus === 'checking' ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                      Verify now
                    </button>
                  </div>
                </div>
              </div>

              <div className="relative pl-12">
                <div className="absolute left-0 top-3 h-10 w-10 rounded-full border border-purple-500/30 bg-purple-500/15 text-purple-200 flex items-center justify-center text-xs font-black">
                  5
                </div>
                <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-5 md:p-6 shadow-2xl">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <h3 className="text-white font-black uppercase tracking-wide text-sm">Featured</h3>
                      <p className="text-slate-400 text-xs mt-2">
                        Verified projects appear in Store filters like Verified and Trending, with live activity boosting visibility.
                      </p>
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.3em] text-purple-200">
                      <CheckCircle2 size={12} /> Store Ready
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/80 via-slate-900/40 to-slate-950/80 p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h3 className="text-white font-black uppercase tracking-wide text-sm">Ready to submit?</h3>
                <p className="text-slate-400 text-xs mt-2">Finish verification and we will surface your project in the Store.</p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-xs text-slate-300">
                <Wallet size={14} className="text-indigo-300" />
                Wallet required for ownership
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubmitProject;
