import React from 'react';
import { ArrowRight, Rocket, Sparkles, ShieldCheck, Palette } from 'lucide-react';

interface HomePageProps {
  onStartBuilding: () => void;
}

const HomePage: React.FC<HomePageProps> = ({ onStartBuilding }) => {
  return (
    <section className="flex-1 overflow-y-auto px-6 py-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10">
        <div className="rounded-[32px] border border-white/10 bg-gradient-to-br from-slate-900/80 via-slate-950/90 to-slate-950/80 p-8 shadow-[0_0_40px_rgba(99,102,241,0.15)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-300">Home</p>
              <h2 className="mt-4 text-3xl font-semibold text-white md:text-4xl">
                Orchestrate your QuestLayer experience.
              </h2>
              <p className="mt-3 max-w-xl text-sm text-slate-400">
                Launch the builder, update your widget, and keep your community engaged—all from one modern dashboard.
              </p>
            </div>
            <button
              onClick={onStartBuilding}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-500 px-5 py-3 text-[11px] font-black uppercase tracking-[0.3em] text-white shadow-[0_0_30px_rgba(99,102,241,0.35)] transition hover:brightness-110"
            >
              Start Building
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              title: 'Launch campaigns',
              description: 'Spin up quest chains and reward pools in minutes.',
              icon: <Rocket size={20} className="text-indigo-300" />
            },
            {
              title: 'Personalize your hub',
              description: 'Blend themes, layouts, and callouts in real time.',
              icon: <Palette size={20} className="text-indigo-300" />
            },
            {
              title: 'Earn trust',
              description: 'Deliver transparent progress and security messaging.',
              icon: <ShieldCheck size={20} className="text-indigo-300" />
            }
          ].map(card => (
            <div
              key={card.title}
              className="rounded-3xl border border-white/10 bg-slate-900/50 p-6 shadow-[0_0_30px_rgba(15,23,42,0.35)]"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/15">
                {card.icon}
              </div>
              <h3 className="mt-4 text-lg font-semibold text-white">{card.title}</h3>
              <p className="mt-2 text-sm text-slate-400">{card.description}</p>
            </div>
          ))}
        </div>

        <div className="rounded-[28px] border border-white/10 bg-slate-900/40 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10">
              <Sparkles size={18} className="text-emerald-300" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-300">Quick Tip</p>
              <p className="mt-1 text-sm text-slate-400">
                Toggle between editor and preview to see widget updates instantly.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomePage;
