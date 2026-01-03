import React, { useState } from 'react';
import { AppState, Position, ThemeType } from '../types.ts';
import { SlidersHorizontal, Bell, ShieldCheck, Palette, LayoutPanelLeft, UserCircle2 } from 'lucide-react';

interface SettingsPageProps {
  state: AppState;
  setProjectName: (name: string) => void;
  setAccentColor: (color: string) => void;
  setPosition: (pos: Position) => void;
  setActiveTheme: (theme: ThemeType) => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({
  state,
  setProjectName,
  setAccentColor,
  setPosition,
  setActiveTheme,
}) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [autoPublishEnabled, setAutoPublishEnabled] = useState(false);
  const [securityLevel, setSecurityLevel] = useState('standard');

  return (
    <section className="flex-1 overflow-y-auto px-6 py-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-2xl">
          <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-indigo-300">Settings</p>
          <h2 className="mt-3 text-2xl font-semibold text-white">Control your QuestLayer workspace</h2>
          <p className="mt-2 text-sm text-slate-400">
            Personalize your project branding, widget defaults, and team preferences before going live.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-slate-900/40 p-6">
              <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-slate-300">
                <UserCircle2 size={16} className="text-indigo-300" />
                Workspace profile
              </div>
              <div className="mt-6 grid gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Project name</label>
                  <input
                    value={state.projectName}
                    onChange={(event) => setProjectName(event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Accent color</label>
                  <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-slate-950 px-4 py-3">
                    <div className="h-10 w-10 rounded-xl" style={{ backgroundColor: state.accentColor }} />
                    <input
                      type="color"
                      value={state.accentColor}
                      onChange={(event) => setAccentColor(event.target.value)}
                      className="h-10 w-20 cursor-pointer rounded-lg border-0 bg-transparent"
                    />
                    <span className="text-xs font-semibold text-slate-400">{state.accentColor.toUpperCase()}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-900/40 p-6">
              <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-slate-300">
                <Palette size={16} className="text-indigo-300" />
                Widget style
              </div>
              <div className="mt-6 grid gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Theme</label>
                  <div className="flex flex-wrap gap-2">
                    {(['sleek', 'cyber', 'minimal', 'gaming', 'brutal', 'glass', 'terminal', 'aura'] as ThemeType[]).map(
                      (theme) => (
                        <button
                          key={theme}
                          onClick={() => setActiveTheme(theme)}
                          className={`rounded-full border px-4 py-2 text-[10px] font-black uppercase transition-all ${
                            state.activeTheme === theme
                              ? 'border-indigo-400 bg-indigo-500/20 text-indigo-100'
                              : 'border-white/10 bg-slate-950 text-slate-400 hover:text-white'
                          }`}
                        >
                          {theme}
                        </button>
                      ),
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Default widget position</label>
                  <select
                    value={state.position}
                    onChange={(event) => setPosition(event.target.value as Position)}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-[10px] font-black uppercase text-white outline-none transition focus:border-indigo-500"
                  >
                    <option value="bottom-right">Bottom right</option>
                    <option value="bottom-left">Bottom left</option>
                    <option value="top-right">Top right</option>
                    <option value="top-left">Top left</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-slate-900/40 p-6">
              <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-slate-300">
                <Bell size={16} className="text-indigo-300" />
                Notifications
              </div>
              <p className="mt-4 text-sm text-slate-400">Decide when QuestLayer should send outreach to your team.</p>
              <button
                onClick={() => setNotificationsEnabled((prev) => !prev)}
                className={`mt-6 flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-xs font-semibold transition ${
                  notificationsEnabled
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                    : 'border-white/10 bg-slate-950 text-slate-400'
                }`}
              >
                <span>Weekly engagement summaries</span>
                <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.3em]">
                  {notificationsEnabled ? 'On' : 'Off'}
                </span>
              </button>
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-900/40 p-6">
              <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-slate-300">
                <LayoutPanelLeft size={16} className="text-indigo-300" />
                Publishing defaults
              </div>
              <p className="mt-4 text-sm text-slate-400">Control how updates are staged before being sent live.</p>
              <button
                onClick={() => setAutoPublishEnabled((prev) => !prev)}
                className={`mt-6 flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-xs font-semibold transition ${
                  autoPublishEnabled
                    ? 'border-indigo-500/40 bg-indigo-500/10 text-indigo-200'
                    : 'border-white/10 bg-slate-950 text-slate-400'
                }`}
              >
                <span>Auto-publish safe changes</span>
                <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.3em]">
                  {autoPublishEnabled ? 'On' : 'Off'}
                </span>
              </button>
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-900/40 p-6">
              <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-slate-300">
                <ShieldCheck size={16} className="text-indigo-300" />
                Security
              </div>
              <p className="mt-4 text-sm text-slate-400">Choose how strict QuestLayer should be with sensitive actions.</p>
              <div className="mt-6 space-y-2">
                {['standard', 'elevated', 'maximum'].map((level) => (
                  <button
                    key={level}
                    onClick={() => setSecurityLevel(level)}
                    className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] transition ${
                      securityLevel === level
                        ? 'border-indigo-500/40 bg-indigo-500/10 text-indigo-200'
                        : 'border-white/10 bg-slate-950 text-slate-400'
                    }`}
                  >
                    <span>{level}</span>
                    {securityLevel === level && <SlidersHorizontal size={14} />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SettingsPage;
