
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Task, Position, ThemeType, AppState } from '../types.ts';
import { 
  Edit2, Trash2, Plus, Check, X, Palette, Layout, Target, Droplets, Share2, Loader2, 
  ArrowLeft, AlertCircle, Coins, Trophy, Gem, Sword, Crown, Twitter, MessageSquare, 
  Send, Globe, Calendar, Zap, Heart, ArrowRight, Sparkles, Info
} from 'lucide-react';

const TASK_TEMPLATES = [
  {
    id: 'tpl-twitter-follow',
    title: 'Follow on X',
    desc: 'Follow our official X account for the latest updates and announcements.',
    link: 'https://x.com/',
    icon: 'icon:twitter',
    xp: 50,
    category: 'Social'
  },
  {
    id: 'tpl-twitter-repost',
    title: 'Repost a Post',
    desc: 'Help us spread the word by reposting our latest announcement on X.',
    link: 'https://x.com/',
    icon: 'icon:repost',
    xp: 100,
    category: 'Social'
  },
  {
    id: 'tpl-twitter-like',
    title: 'Like a Post',
    desc: 'Show some love to our latest announcement on X by liking it.',
    link: 'https://x.com/',
    icon: 'icon:heart',
    xp: 25,
    category: 'Social'
  },
  {
    id: 'tpl-discord-join',
    title: 'Join Discord',
    desc: 'Join our community server to chat with other members and get support.',
    link: 'https://discord.gg/',
    icon: 'icon:discord',
    xp: 150,
    category: 'Community'
  },
  {
    id: 'tpl-telegram-join',
    title: 'Join Telegram',
    desc: 'Subscribe to our Telegram channel for instant notifications.',
    link: 'https://t.me/',
    icon: 'icon:telegram',
    xp: 50,
    category: 'Community'
  },
  {
    id: 'tpl-visit-web',
    title: 'Visit Website',
    desc: 'Explore our platform and learn more about what we do.',
    link: 'https://',
    icon: 'icon:globe',
    xp: 10,
    category: 'General'
  },
  {
    id: 'tpl-daily-checkin',
    title: 'Daily Check-in',
    desc: 'Return daily to claim your streak and bonus XP rewards.',
    link: '',
    icon: 'icon:calendar',
    xp: 20,
    category: 'Daily'
  }
];

const XP_PRESETS = [10, 25, 50, 100, 250, 500];
import EmbedModal from './EmbedModal.tsx';
import GlobalFooter from './GlobalFooter';
import { DEMO_TASKS, SPONSORED_TASKS } from '../constants';

interface EditorProps {
  state: AppState;
  setProjectName: (name: string) => void;
  setProjectDomain: (domain: string) => void;
  setAccentColor: (color: string) => void;
  setPosition: (pos: Position) => void;
  setActiveTheme: (theme: ThemeType) => void;
  setTasks: (tasks: Task[]) => void;
  onPublish: () => Promise<void>;
  onBack: () => void;
}

const PASTEL_PALETTE = [
  '#6366f1', // Indigo (Default)
  '#8b5cf6', // Violet
  '#06b6d4', // Cyan
  '#0ea5e9', // Sky
  '#22c55e', // Green
  '#f59e0b', // Amber
  '#f97316', // Orange
  '#f43f5e', // Rose
  '#d946ef' // Fuchsia
];

// Yellow/Gold Game Icon Codes
const GAME_ICONS = [
  'icon:coin',
  'icon:trophy',
  'icon:gem',
  'icon:sword',
  'icon:crown'
];

const Editor: React.FC<EditorProps> = ({
  state,
  setProjectName,
  setProjectDomain,
  setAccentColor,
  setPosition,
  setActiveTheme,
  setTasks,
  onPublish,
  onBack
}) => {
  const getFaviconUrl = (link: string) => {
    try {
      if (!link || link.length < 4) return '';
      let validLink = link.trim();
      
      // Remove trailing slashes or dots from the end of the string before parsing
      // This prevents "key2web3." from being treated as the hostname root
      validLink = validLink.replace(/[\/.]+$/, ''); 

      if (!validLink.startsWith('http://') && !validLink.startsWith('https://')) {
        validLink = `https://${validLink}`;
      }
      
      const url = new URL(validLink);
      let hostname = url.hostname;

      // Double check: remove trailing dot if URL constructor left it
      if (hostname.endsWith('.')) {
        hostname = hostname.slice(0, -1);
      }

      // Ensure hostname has at least one dot and a valid TLD length (at least 2 chars)
      const parts = hostname.split('.');
      if (parts.length < 2 || parts[parts.length - 1].length < 2) return '';

      return `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`;
    } catch {
      return '';
    }
  };

  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [editForm, setEditForm] = useState<Task | null>(null);
  const [isEmbedModalOpen, setIsEmbedModalOpen] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const handlePublishClick = async () => {
    setIsPublishing(true);
    await onPublish();
    setIsPublishing(false);
    setIsEmbedModalOpen(true);
  };


  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  const getDynamicLimit = () => {
    const sponsoredCount = state.tasks.filter(t => t.isSponsored).length;
    const sponsoredBonus = sponsoredCount * 100;
    return 1000 + sponsoredBonus;
  };

  const calculateXPRemaining = () => {
    const totalXP = state.tasks.reduce((acc, task) => acc + task.xp, 0);
    return getDynamicLimit() - totalXP;
  };

  const toggleSponsoredTask = (sponsoredTask: Task) => {
    const isActive = state.tasks.some(t => t.id === sponsoredTask.id);
    if (isActive) {
      setTasks(state.tasks.filter(t => t.id !== sponsoredTask.id));
    } else {
      setTasks([...state.tasks, sponsoredTask]);
    }
  };

  const toggleDemoTask = (demoTask: Task) => {
     const isActive = state.tasks.some(t => t.id === demoTask.id);
     if (isActive) {
       setTasks(state.tasks.filter(t => t.id !== demoTask.id));
     } else {
       const remaining = calculateXPRemaining();
       if (remaining < demoTask.xp) {
         setAlertMessage(`Not enough XP remaining to add this Demo Quest. Available: ${remaining} XP`);
         return;
       }
       setTasks([...state.tasks, demoTask]);
     }
   };

  const addTask = () => {
    const remaining = calculateXPRemaining();
    if (remaining <= 0) {
      setAlertMessage(`You have reached the maximum ${getDynamicLimit()} XP limit.`);
      // Do NOT setEditingId or setEditForm here to prevent opening the edit UI
      return;
    }

    const newTask: Task = {
      id: Date.now(),
      title: 'New Quest',
      desc: 'Enter mission details...',
      link: 'https://',
      icon: '',
      xp: Math.min(100, remaining) // Auto-cap at remaining
    };
    setTasks([newTask, ...state.tasks]);
    setEditingId(newTask.id);
    setEditForm(newTask);
  };

  const addTemplateTask = (template: typeof TASK_TEMPLATES[0]) => {
    const remaining = calculateXPRemaining();
    if (remaining <= 0) {
      setAlertMessage(`You have reached the maximum ${getDynamicLimit()} XP limit.`);
      return;
    }

    const newTask: Task = {
      id: Date.now(),
      title: template.title,
      desc: template.desc,
      link: template.link,
      icon: template.icon,
      xp: Math.min(template.xp, remaining)
    };
    setTasks([newTask, ...state.tasks]);
    setEditingId(newTask.id);
    setEditForm(newTask);
  };

  const getTotalXPExcludingEditing = () =>
    state.tasks
      .filter(t => t.id !== editingId)
      .reduce((acc, t) => acc + t.xp, 0);

  const getEditMaxXP = () => Math.max(0, getDynamicLimit() - getTotalXPExcludingEditing());

  const getEditRemainingXP = (currentXP: number) =>
    Math.max(0, getDynamicLimit() - (getTotalXPExcludingEditing() + currentXP));

  const themeButtonStyles: Record<ThemeType, { base: string; active: string; inactive: string }> = {
    sleek: {
      base: 'border',
      active: 'border-indigo-400 bg-indigo-500/15 text-indigo-100',
      inactive: 'border-white/10 bg-white/5 text-slate-300 hover:border-indigo-400/60 hover:text-white'
    },
    cyber: {
      base: 'border',
      active: 'border-emerald-300 bg-emerald-400/15 text-emerald-100 shadow-[0_0_20px_rgba(52,211,153,0.35)]',
      inactive: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-300/70 hover:bg-emerald-500/10 hover:text-emerald-100'
    },
    minimal: {
      base: 'border',
      active: 'border-slate-200 bg-white text-slate-900',
      inactive: 'border-slate-500/30 bg-slate-900/40 text-slate-300 hover:bg-slate-800/60'
    },
    gaming: {
      base: 'border',
      active: 'border-amber-300 bg-amber-400/15 text-amber-100 shadow-[0_0_20px_rgba(251,191,36,0.35)]',
      inactive: 'border-amber-500/30 bg-amber-500/5 text-amber-300/70 hover:bg-amber-500/10 hover:text-amber-100'
    },
    brutal: {
      base: 'border',
      active: 'border-white bg-white text-black shadow-[4px_4px_0_rgba(255,255,255,0.8)]',
      inactive: 'border-white/60 bg-black text-white hover:shadow-[4px_4px_0_rgba(255,255,255,0.35)]'
    },
    glass: {
      base: 'border backdrop-blur-sm',
      active: 'border-cyan-200/60 bg-white/15 text-cyan-100',
      inactive: 'border-white/15 bg-white/5 text-slate-200 hover:bg-white/10'
    },
    terminal: {
      base: 'border',
      active: 'border-green-300 bg-green-500/15 text-green-100',
      inactive: 'border-green-500/30 bg-green-500/5 text-green-300/70 hover:bg-green-500/10 hover:text-green-100'
    },
    aura: {
      base: 'border',
      active: 'border-rose-300 bg-rose-500/15 text-rose-100 shadow-[0_0_20px_rgba(244,63,94,0.25)]',
      inactive: 'border-rose-500/30 bg-rose-500/5 text-rose-300/70 hover:bg-rose-500/10 hover:text-rose-100'
    },
    avatar: {
      base: 'border',
      active: 'border-cyan-200 bg-cyan-400/20 text-cyan-100 shadow-[0_0_22px_rgba(34,211,238,0.4)]',
      inactive: 'border-cyan-400/30 bg-cyan-500/5 text-cyan-200/70 hover:bg-cyan-400/10 hover:text-cyan-100'
    },
    ironman: {
      base: 'border',
      active: 'border-amber-300 bg-amber-400/20 text-amber-100 shadow-[0_0_22px_rgba(251,191,36,0.4)]',
      inactive: 'border-amber-500/30 bg-amber-500/5 text-amber-200/70 hover:bg-amber-400/10 hover:text-amber-100'
    }
  };

  const removeTask = (id: string | number) => {
    setTasks(state.tasks.filter(t => t.id !== id));
    if (editingId === id) {
      setEditingId(null);
      setEditForm(null);
    }
  };

  const startEdit = (task: Task) => {
    setEditingId(task.id);
    setEditForm({ ...task });
  };

  const getRandomGameIcon = () => GAME_ICONS[Math.floor(Math.random() * GAME_ICONS.length)];

  const saveEdit = () => {
    if (editForm) {
      // Determine Icon: Manual -> Favicon -> Random Game Icon Fallback
      const nextTask = {
        ...editForm,
        icon: editForm.icon || getFaviconUrl(editForm.link) || getRandomGameIcon()
      };

      // Validate XP Limit before saving
      const currentTasksXP = state.tasks
        .filter(t => t.id !== editingId)
        .reduce((acc, t) => acc + t.xp, 0);
      
      const dynamicLimit = getDynamicLimit();
      if (currentTasksXP + nextTask.xp > dynamicLimit) {
        setAlertMessage(`Cannot save: Total XP would exceed ${dynamicLimit}. Available: ${dynamicLimit - currentTasksXP}`);
        return;
      }

      setTasks(state.tasks.map(t => t.id === editingId ? nextTask : t));
      setEditingId(null);
      setEditForm(null);
    }
  };

  useEffect(() => {
    if (!editForm) return;
    if (editForm.icon) return;

    // Debounce favicon extraction to avoid partial URL parsing while typing
    const timeoutId = setTimeout(() => {
      const faviconUrl = getFaviconUrl(editForm.link);
      if (!faviconUrl) return;
      setEditForm(prev => (prev ? { ...prev, icon: faviconUrl } : null));
    }, 800);

    return () => clearTimeout(timeoutId);
  }, [editForm?.link, editForm?.icon]);

  return (
    <div className="flex flex-col h-full bg-slate-900 border-r border-white/5 overflow-hidden">
      {/* Fixed Header */}
      <div className="p-6 border-b border-white/5 bg-slate-900 shrink-0 z-30 shadow-xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            title="Back to Dashboard"
          >
            <ArrowLeft size={16} />
          </button>
          <h1 className="text-xl font-black italic tracking-tighter text-white uppercase flex items-center gap-2">
            QuestLayer <span className="text-indigo-500 not-italic font-mono text-[10px] bg-indigo-500/10 px-2 py-0.5 rounded tracking-normal">BUILDER</span>
          </h1>
        </div>
        <button 
          onClick={handlePublishClick}
          disabled={isPublishing}
          className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-400 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all shadow-lg shadow-indigo-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPublishing ? <Loader2 size={14} className="animate-spin" /> : <Share2 size={14} />} 
          {isPublishing ? 'Saving...' : 'Save & Publish'}
        </button>
      </div>

      {/* Internal Scroll Area */}
      <div className="flex-1 overflow-y-auto custom-scroll p-6 space-y-10 pb-32">
        {/* Style & Layout Section */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
            <Palette size={12} />
            <h3>Style & Layout</h3>
          </div>
          <div className="space-y-4 bg-slate-950/50 p-4 rounded-3xl border border-white/5">
            <div className="space-y-2">
              <div className="flex items-center text-[9px] font-black uppercase tracking-widest text-slate-500">
                <span>Theme</span>
              </div>
              <div className="relative">
                <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                  {(['sleek', 'cyber', 'minimal', 'gaming', 'brutal', 'glass', 'terminal', 'aura', 'avatar', 'ironman'] as ThemeType[])
                    .map((t) => (
                      <button
                        key={t}
                        onClick={() => setActiveTheme(t)}
                        className={`min-w-[calc((100%-24px)/4)] p-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${
                          themeButtonStyles[t].base
                        } ${
                          state.activeTheme === t
                            ? themeButtonStyles[t].active
                            : themeButtonStyles[t].inactive
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                </div>
                <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-slate-950/80 to-transparent" />
                <div className="pointer-events-none absolute top-1/2 right-1 -translate-y-1/2 flex items-center text-slate-400 animate-bounce">
                  <ArrowRight size={12} />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-900/60 px-3 py-2">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-1.5">
                  <Droplets size={10} /> Accent Palette
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {PASTEL_PALETTE.map((color) => (
                    <button
                      key={color}
                      onClick={() => setAccentColor(color)}
                      className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 active:scale-95 ${
                        state.accentColor.toLowerCase() === color.toLowerCase() 
                          ? 'border-white ring-2 ring-indigo-500/50 scale-110' 
                          : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                  <div className="relative group flex items-center justify-center w-7 h-7 rounded-full border-2 border-white/10 overflow-hidden bg-slate-800">
                    <input 
                      type="color" 
                      value={state.accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="absolute inset-0 w-full h-full cursor-pointer opacity-0"
                    />
                    <Plus size={14} className="text-slate-400 group-hover:text-white transition-colors" />
                  </div>
                </div>
              </div>
              <div className="w-40 space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-1.5">
                  <Layout size={10} /> Position
                </label>
                <select 
                  value={state.position}
                  onChange={(e) => setPosition(e.target.value as Position)}
                  className="w-full h-[38px] bg-slate-900 border border-white/10 rounded-xl px-3 text-[10px] font-bold text-white uppercase outline-none focus:border-indigo-500"
                >
                  <option value="bottom-right">Bottom Right</option>
                  <option value="bottom-left">Bottom Left</option>
                  <option value="top-right">Top Right</option>
                  <option value="top-left">Top Left</option>
                  <option value="free-form">Custom (embed anywhere)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase">Project Name</label>
                <input 
                  value={state.projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase">Website Domain</label>
                <input 
                  value={state.projectDomain || ''}
                  onChange={(e) => setProjectDomain(e.target.value)}
                  placeholder="e.g. my-awesome-app.com"
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Quick Templates Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
            <Zap size={12} className="text-indigo-500" />
            <h3>Quick Templates</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {TASK_TEMPLATES.map((tpl) => (
              <button
                key={tpl.id}
                onClick={() => addTemplateTask(tpl)}
                disabled={calculateXPRemaining() <= 0}
                className="group flex flex-col items-center gap-2 p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all text-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="h-8 w-8 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  {tpl.icon === 'icon:twitter' && <Twitter size={14} className="text-indigo-400" />}
                  {tpl.icon === 'icon:repost' && <Zap size={14} className="text-green-400" />}
                  {tpl.icon === 'icon:heart' && <Heart size={14} className="text-pink-400" />}
                  {tpl.icon === 'icon:discord' && <MessageSquare size={14} className="text-indigo-400" />}
                  {tpl.icon === 'icon:telegram' && <Send size={14} className="text-sky-400" />}
                  {tpl.icon === 'icon:globe' && <Globe size={14} className="text-slate-400" />}
                  {tpl.icon === 'icon:calendar' && <Calendar size={14} className="text-orange-400" />}
                </div>
                <div className="space-y-0.5">
                  <p className="text-[9px] font-black text-white uppercase">{tpl.title}</p>
                  <p className="text-[8px] font-bold text-indigo-400">{tpl.xp} XP</p>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Sponsored Missions Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
            <Trophy size={12} className="text-amber-500" />
            <h3>Sponsored Missions</h3>
            <span className="relative ml-1 inline-flex items-center group">
              <button
                type="button"
                className="inline-flex items-center justify-center text-slate-500 hover:text-slate-300 transition-colors"
              >
                <Info size={12} />
              </button>
              <span className="pointer-events-none absolute left-1/2 top-6 z-20 w-44 -translate-x-1/2 rounded-lg border border-white/10 bg-slate-900/95 px-2 py-1 text-[9px] font-bold uppercase tracking-widest text-slate-300 opacity-0 shadow-xl transition-opacity group-hover:opacity-100">
                Add sponsors to raise the widget XP cap.
              </span>
            </span>
            <span className="ml-auto text-[8px] font-bold text-amber-500/80 bg-amber-500/10 px-1.5 py-0.5 rounded uppercase">+100 XP Each</span>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {SPONSORED_TASKS.map((task) => {
              const isActive = state.tasks.some(t => t.id === task.id);
              return (
                <div 
                  key={task.id}
                  className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                    isActive 
                      ? 'bg-amber-500/5 border-amber-500/20' 
                      : 'bg-white/5 border-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-full border flex items-center justify-center ${
                      isActive ? 'bg-amber-500/10 border-amber-500/20' : 'bg-slate-900 border-white/10'
                    }`}>
                      {task.icon === 'icon:twitter' && <Twitter size={14} className="text-indigo-400" />}
                      {task.icon === 'icon:discord' && <MessageSquare size={14} className="text-indigo-400" />}
                      {task.icon === 'icon:globe' && <Globe size={14} className="text-slate-400" />}
                      {task.icon === 'icon:repost' && <Zap size={14} className="text-green-400" />}
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-white uppercase">{task.title}</p>
                      <p className="text-[9px] text-slate-500 font-medium">{task.desc}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleSponsoredTask(task)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                      isActive ? 'bg-amber-500' : 'bg-slate-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                        isActive ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* Demo Quests Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
            <Layout size={12} className="text-indigo-500" />
            <h3>Demo Quests</h3>
            <span className="ml-auto text-[8px] font-bold text-indigo-500/80 bg-indigo-500/10 px-1.5 py-0.5 rounded uppercase">Predefined</span>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {DEMO_TASKS.map((task) => {
              const isActive = state.tasks.some(t => t.id === task.id);
              return (
                <div 
                  key={task.id}
                  className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                    isActive 
                      ? 'bg-indigo-500/5 border-indigo-500/20' 
                      : 'bg-white/5 border-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-full border flex items-center justify-center ${
                      isActive ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-slate-900 border-white/10'
                    }`}>
                      {task.icon && task.icon.startsWith('http') ? (
                        <img src={task.icon} alt="" className="w-4 h-4 rounded-full" />
                      ) : (
                        <Globe size={14} className="text-slate-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-white uppercase">{task.title}</p>
                      <p className="text-[9px] text-slate-500 font-medium">{task.desc}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleDemoTask(task)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                      isActive ? 'bg-indigo-500' : 'bg-slate-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                        isActive ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* Missions Section */}
        <section className="space-y-6">
          <div className="flex justify-between items-center sticky top-0 bg-slate-900 py-2 z-20">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
              <Target size={12} />
              <h3>Missions List</h3>
              <span className={`ml-2 px-1.5 py-0.5 rounded text-[9px] ${calculateXPRemaining() < 0 ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-slate-400'}`}>
                {getDynamicLimit() - calculateXPRemaining()}/{getDynamicLimit()} XP
              </span>
            </div>
            <button 
              onClick={addTask}
              disabled={calculateXPRemaining() <= 0}
              className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg font-black text-[9px] uppercase hover:bg-indigo-500 transition-all flex items-center gap-1 shadow-lg shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus size={12} /> New Quest
            </button>
          </div>

          <div className="space-y-3">
            {state.tasks.length === 0 && (
              <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-950/80 via-slate-950/60 to-indigo-500/10 p-4 text-slate-200 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="absolute -top-10 -right-8 h-24 w-24 rounded-full bg-indigo-500/20 blur-2xl animate-float-slow" />
                <div className="absolute -bottom-12 -left-10 h-28 w-28 rounded-full bg-rose-500/20 blur-2xl animate-float-slow" />
                <div className="relative flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-200 animate-float">
                    <Sparkles size={16} />
                  </div>
                  <div className="text-[11px] font-black uppercase tracking-[0.35em] text-slate-400">Mission List</div>
                </div>
                <div className="relative mt-3 grid grid-cols-3 gap-2 text-center text-[9px] font-black uppercase tracking-widest">
                  <div className="flex flex-col items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-2 py-2">
                    <Zap size={14} className="text-amber-300 animate-float" />
                    Add tasks
                  </div>
                  <div className="flex flex-col items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-2 py-2">
                    <Globe size={14} className="text-sky-300 animate-float" />
                    See live
                  </div>
                  <div className="flex flex-col items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-2 py-2">
                    <Share2 size={14} className="text-emerald-300 animate-float" />
                    Save embed
                  </div>
                </div>
                <div className="relative mt-3 rounded-xl border border-dashed border-white/15 bg-white/5 px-3 py-2 text-center text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400">
                  No missions yet
                </div>
              </div>
            )}
            {state.tasks.map((task) => (
              <div key={task.id} className="bg-white/5 rounded-2xl border border-white/5 overflow-hidden transition-all group">
                {editingId !== task.id ? (
                  <div className="p-4 flex items-center justify-between">
                    <div className="truncate mr-4 flex items-center gap-2">
                      {task.icon?.startsWith('icon:') ? (
                        <div className="h-6 w-6 rounded-full border border-white/10 bg-yellow-500/10 flex items-center justify-center">
                          {task.icon === 'icon:coin' && <Coins size={14} className="text-yellow-400" />}
                          {task.icon === 'icon:trophy' && <Trophy size={14} className="text-yellow-400" />}
                          {task.icon === 'icon:gem' && <Gem size={14} className="text-yellow-400" />}
                          {task.icon === 'icon:sword' && <Sword size={14} className="text-yellow-400" />}
                          {task.icon === 'icon:crown' && <Crown size={14} className="text-yellow-400" />}
                          {task.icon === 'icon:twitter' && <Twitter size={14} className="text-indigo-400" />}
                          {task.icon === 'icon:repost' && <Zap size={14} className="text-green-400" />}
                          {task.icon === 'icon:heart' && <Heart size={14} className="text-pink-400" />}
                          {task.icon === 'icon:discord' && <MessageSquare size={14} className="text-indigo-400" />}
                          {task.icon === 'icon:telegram' && <Send size={14} className="text-sky-400" />}
                          {task.icon === 'icon:globe' && <Globe size={14} className="text-slate-400" />}
                          {task.icon === 'icon:calendar' && <Calendar size={14} className="text-orange-400" />}
                        </div>
                      ) : task.icon ? (
                        <img
                          src={task.icon}
                          alt=""
                          className="h-6 w-6 rounded-full border border-white/10 bg-white/10 object-contain"
                          loading="lazy"
                        />
                      ) : null}
                      <div className="truncate">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-black text-white truncate uppercase">{task.title}</p>
                          {task.isSponsored && (
                            <span className="text-[7px] font-black bg-amber-500/10 text-amber-500 px-1 rounded uppercase tracking-tighter border border-amber-500/20">Sponsored</span>
                          )}
                          {task.isDemo && (
                            <span className="text-[7px] font-black bg-indigo-500/10 text-indigo-400 px-1 rounded uppercase tracking-tighter border border-indigo-500/20">Demo</span>
                          )}
                        </div>
                        <p className="text-[10px] text-indigo-400 font-bold">{task.xp} XP Reward</p>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {!task.isSponsored ? (
                        <>
                          <button 
                            onClick={() => startEdit(task)}
                            className="p-2 text-slate-400 hover:text-white transition-colors"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => removeTask(task.id)}
                            className="p-2 text-slate-600 hover:text-red-400 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      ) : (
                        <button 
                          onClick={() => removeTask(task.id)}
                          className="p-2 text-slate-600 hover:text-red-400 transition-colors"
                          title="Remove from list"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-5 bg-indigo-600/5 border-l-4 border-indigo-500 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-500 uppercase">Mission Title</label>
                      <input 
                        value={editForm?.title}
                        autoFocus
                        onChange={(e) => setEditForm(prev => prev ? { ...prev, title: e.target.value } : null)}
                        placeholder="e.g. Follow on Twitter"
                        className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-500 uppercase">Instructions</label>
                      <textarea 
                        value={editForm?.desc}
                        onChange={(e) => setEditForm(prev => prev ? { ...prev, desc: e.target.value } : null)}
                        placeholder="What should the user do?"
                        className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-[11px] h-16 text-white outline-none resize-none focus:border-indigo-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-500 uppercase">Action Link</label>
                      <input 
                        value={editForm?.link}
                        onChange={(e) => setEditForm(prev => prev ? { ...prev, link: e.target.value } : null)}
                        placeholder="https://..."
                        className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-[11px] text-white focus:border-indigo-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950/60 px-3 py-2">
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">XP Reward</p>
                          <p className="text-[11px] font-bold text-white">
                            {editForm?.xp ?? 0} XP
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Remaining</p>
                          <p className="text-[11px] font-bold text-emerald-300">
                            {getEditRemainingXP(editForm?.xp ?? 0)} XP
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                        {XP_PRESETS.map((preset) => {
                          const isActive = editForm?.xp === preset;
                          const isDisabled = preset > getEditMaxXP();
                          return (
                            <button
                              key={preset}
                              type="button"
                              onClick={() =>
                                setEditForm(prev =>
                                  prev ? { ...prev, xp: Math.min(preset, getEditMaxXP()) } : null
                                )
                              }
                              disabled={isDisabled}
                              className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase transition-all border ${
                                isActive
                                  ? 'bg-indigo-500/20 text-indigo-200 border-indigo-500/40 shadow-lg shadow-indigo-500/20'
                                  : 'bg-white/5 text-slate-400 border-white/10 hover:text-white hover:border-white/20 hover:bg-white/10'
                              } ${isDisabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                            >
                              {preset}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-500 uppercase">Icon URL</label>
                      <input 
                        value={editForm?.icon || ''}
                        onChange={(e) => setEditForm(prev => prev ? { ...prev, icon: e.target.value } : null)}
                        placeholder="https://..."
                        className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-[11px] text-white focus:border-indigo-500"
                      />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button 
                        onClick={saveEdit}
                        className="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-black text-[10px] uppercase flex items-center justify-center gap-1 hover:bg-indigo-500 transition-colors"
                      >
                        <Check size={14} /> Save Mission
                      </button>
                      <button 
                        onClick={() => setEditingId(null)}
                        className="px-4 bg-slate-800 text-slate-400 py-2 rounded-lg font-black text-[10px] uppercase hover:text-white transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-white/5">
            <button 
              onClick={handlePublishClick}
              disabled={isPublishing}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl text-xs font-black uppercase transition-all shadow-lg shadow-indigo-600/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPublishing ? <Loader2 size={16} className="animate-spin" /> : <Share2 size={16} />} 
              {isPublishing ? 'Saving Project...' : 'Save & Publish Widget'}
            </button>
            <div className="mt-16">
              <GlobalFooter />
            </div>
          </div>
        </section>
      </div>

      <EmbedModal 
        isOpen={isEmbedModalOpen} 
        onClose={() => setIsEmbedModalOpen(false)} 
        state={state} 
      />

      {/* Alert Modal */}
      {alertMessage && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setAlertMessage(null)} />
          <div className="relative w-full max-w-sm bg-slate-950 border border-white/10 rounded-2xl p-6 shadow-[0_30px_80px_-50px_rgba(99,102,241,0.8)] flex flex-col items-center text-center gap-4 overflow-hidden">
            <div className="absolute -top-24 -left-16 h-48 w-48 rounded-full bg-indigo-500/20 blur-3xl" />
            <div className="absolute -bottom-24 -right-16 h-48 w-48 rounded-full bg-rose-500/20 blur-3xl" />
            <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-rose-500/20 border border-white/10 flex items-center justify-center text-indigo-300">
              <AlertCircle size={26} />
            </div>
            <div className="relative flex flex-col items-center gap-2">
              <span className="text-[9px] font-black uppercase tracking-[0.4em] text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full">
                Widget XP Cap
              </span>
              <h3 className="text-white font-black uppercase text-xl tracking-tight">Limit Reached</h3>
            </div>
            <p className="relative text-slate-300 text-sm leading-relaxed">
              Each widget can only hold up to <span className="text-white font-black">1000 XP</span>. Remove or reduce missions to add more.
            </p>
            {alertMessage && (
              <p className="relative text-slate-500 text-xs leading-relaxed">{alertMessage}</p>
            )}
            <button 
              onClick={() => setAlertMessage(null)}
              className="relative mt-2 w-full py-3 bg-white text-black font-black uppercase text-xs rounded-xl hover:bg-slate-200 transition-colors"
            >
              Got it
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Editor;
