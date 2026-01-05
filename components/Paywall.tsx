import React from 'react';
import { Check, X } from 'lucide-react';
import { PaywallOffering } from '../lib/revenuecat';

interface PaywallProps {
  isOpen: boolean;
  offering: PaywallOffering;
  isLoading: boolean;
  errorMessage?: string | null;
  noticeMessage?: string | null;
  onClose: () => void;
  onPurchase: (packageId: string) => void;
  onRestore: () => void;
}

const Paywall: React.FC<PaywallProps> = ({
  isOpen,
  offering,
  isLoading,
  errorMessage,
  noticeMessage,
  onClose,
  onPurchase,
  onRestore
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 py-10 backdrop-blur-lg">
      <div className="relative w-full max-w-4xl overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-slate-900/90 via-slate-950/95 to-slate-900/90 shadow-[0_40px_120px_rgba(15,23,42,0.7)]">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 rounded-full border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:text-white"
          aria-label="Close paywall"
        >
          <X size={16} />
        </button>

        <div className="grid gap-8 p-8 md:grid-cols-[1.1fr_1fr] md:p-12">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.4em] text-indigo-300">QuestLayer Pro</p>
            <h2 className="mt-4 text-3xl font-semibold text-white md:text-4xl">{offering.name}</h2>
            <p className="mt-4 text-sm text-slate-400">
              Unlock premium builder tools, revenue-ready templates, and priority support.
            </p>

            <div className="mt-8 space-y-4">
              {offering.features.map(feature => (
                <div key={feature} className="flex items-start gap-3 text-sm text-slate-200">
                  <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-200">
                    <Check size={12} />
                  </span>
                  <span>{feature}</span>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-slate-400">
              You can cancel anytime. Purchases are managed through RevenueCat and your billing provider.
            </div>
          </div>

          <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-slate-950/60 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Choose a plan</p>

            <div className="space-y-4">
              {offering.packages.map(pkg => (
                <button
                  key={pkg.id}
                  onClick={() => onPurchase(pkg.id)}
                  disabled={isLoading}
                  className="group w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-left transition hover:border-indigo-400/40 hover:bg-indigo-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <p className="text-sm font-semibold text-white">{pkg.title}</p>
                        {pkg.badge && (
                          <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-indigo-200">
                            {pkg.badge}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-slate-400">{pkg.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-semibold text-white">{pkg.price}</p>
                      <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400">{pkg.interval}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={onRestore}
              className="mt-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-300 transition hover:text-white"
            >
              Restore purchases
            </button>

            {errorMessage && (
              <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-200">
                {errorMessage}
              </div>
            )}

            {noticeMessage && (
              <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-200">
                {noticeMessage}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Paywall;
