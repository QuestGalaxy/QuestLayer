import React from 'react';
import { CalendarDays, Globe2, Shield, UserCircle2, WalletCards } from 'lucide-react';

const ProfilePage: React.FC = () => (
  <section className="flex-1 overflow-y-auto px-6 py-10">
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
      <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-2xl">
        <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-indigo-300">Profile</p>
        <h2 className="mt-3 text-2xl font-semibold text-white">Your QuestLayer identity</h2>
        <p className="mt-2 text-sm text-slate-400">
          Keep your profile synced across chains, communities, and reward campaigns.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-slate-900/40 p-6">
            <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-slate-300">
              <UserCircle2 size={16} className="text-indigo-300" />
              Profile overview
            </div>
            <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-white/10 bg-slate-950 p-5">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-200">
                  <UserCircle2 size={28} />
                </div>
                <div>
                  <p className="text-lg font-semibold text-white">Nova Captain</p>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">vortex protocol team</p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500">Role</p>
                  <p className="mt-2 text-sm text-slate-200">Growth steward</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500">Plan</p>
                  <p className="mt-2 text-sm text-slate-200">Builder Pro</p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-900/40 p-6">
            <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-slate-300">
              <WalletCards size={16} className="text-indigo-300" />
              Connected wallets
            </div>
            <div className="mt-6 space-y-3">
              {['0x7a9f...4d2b', '0x32ef...a9c1'].map((wallet) => (
                <div
                  key={wallet}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-xs font-semibold text-slate-200"
                >
                  <span>{wallet}</span>
                  <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-emerald-200">
                    Verified
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-slate-900/40 p-6">
            <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-slate-300">
              <CalendarDays size={16} className="text-indigo-300" />
              Activity
            </div>
            <div className="mt-6 space-y-4">
              {[
                { label: 'Quest completions', value: '42 this month' },
                { label: 'Engagement score', value: '91 / 100' },
                { label: 'Reward streak', value: '8 days' },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500">{item.label}</p>
                  <p className="mt-2 text-sm font-semibold text-white">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-900/40 p-6">
            <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-slate-300">
              <Shield size={16} className="text-indigo-300" />
              Trust signals
            </div>
            <div className="mt-6 space-y-3 text-sm text-slate-400">
              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950 px-4 py-3">
                <span>2FA enabled</span>
                <span className="text-emerald-300">Active</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950 px-4 py-3">
                <span>Session encryption</span>
                <span className="text-emerald-300">Enabled</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950 px-4 py-3">
                <span>Linked domain</span>
                <span className="text-indigo-200">questlayer.app</span>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-900/40 p-6">
            <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-slate-300">
              <Globe2 size={16} className="text-indigo-300" />
              Public presence
            </div>
            <p className="mt-4 text-sm text-slate-400">
              Choose which quests and achievements appear on your public badge page.
            </p>
            <button className="mt-6 w-full rounded-2xl border border-indigo-500/40 bg-indigo-500/10 px-4 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-indigo-100 transition hover:bg-indigo-500/20">
              Manage visibility
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default ProfilePage;
