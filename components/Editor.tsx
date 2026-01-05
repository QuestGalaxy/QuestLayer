
import React, { useState } from 'react';
import { Task, Position, ThemeType, AppState } from '../types.ts';
import { Edit2, Trash2, Plus, Check, X, Palette, Layout, Target, Droplets, Share2 } from 'lucide-react';
import EmbedModal from './EmbedModal.tsx';

interface EditorProps {
  state: AppState;
  setProjectName: (name: string) => void;
  setAccentColor: (color: string) => void;
  setPosition: (pos: Position) => void;
  setActiveTheme: (theme: ThemeType) => void;
  setTasks: (tasks: Task[]) => void;
}

const PASTEL_PALETTE = [
  '#6366f1', // Indigo (Default)
  '#8b5cf6', // Violet
  '#d946ef', // Fuchsia
  '#ec4899', // Pink
  '#f43f5e', // Rose
  '#f97316', // Orange
  '#eab308', // Yellow
  '#22c55e', // Green
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#0ea5e9', // Sky
  '#3b82f6', // Blue
];

const Editor: React.FC<EditorProps> = ({
  state,
  setProjectName,
  setAccentColor,
  setPosition,
  setActiveTheme,
  setTasks,
}) => {
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [editForm, setEditForm] = useState<Task | null>(null);
  const [isEmbedModalOpen, setIsEmbedModalOpen] = useState(false);

  const addTask = () => {
    const newTask: Task = {
      id: Date.now(),
      title: 'New Quest',
      desc: 'Enter mission details...',
      link: 'https://',
      icon: '',
      xp: 100
    };
    setTasks([newTask, ...state.tasks]);
    setEditingId(newTask.id);
    setEditForm(newTask);
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

  const saveEdit = () => {
    if (editForm) {
      setTasks(state.tasks.map(t => t.id === editingId ? editForm : t));
      setEditingId(null);
      setEditForm(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border-r border-white/5 overflow-hidden">
      {/* Fixed Header */}
      <div className="p-6 border-b border-white/5 bg-slate-900 shrink-0 z-30 shadow-xl flex items-center justify-between">
        <h1 className="text-xl font-black italic tracking-tighter text-white uppercase flex items-center gap-2">
          QuestLayer <span className="text-indigo-500 not-italic font-mono text-[10px] bg-indigo-500/10 px-2 py-0.5 rounded tracking-normal">BUILDER</span>
        </h1>
        <button 
          onClick={() => setIsEmbedModalOpen(true)}
          className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-400 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
        >
          <Share2 size={14} /> Publish
        </button>
      </div>

      {/* Internal Scroll Area */}
      <div className="flex-1 overflow-y-auto custom-scroll p-6 space-y-10 pb-32">
        {/* Style & Layout Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
            <Palette size={12} />
            <h3>Style & Layout</h3>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {(['sleek', 'cyber', 'minimal', 'gaming', 'brutal', 'glass', 'terminal', 'aura'] as ThemeType[]).map((t) => (
              <button
                key={t}
                onClick={() => setActiveTheme(t)}
                className={`p-3 rounded-xl border text-[10px] font-black uppercase transition-all ${
                  state.activeTheme === t 
                    ? 'border-indigo-500 bg-indigo-500/10 text-white' 
                    : 'border-white/5 bg-white/5 text-slate-400'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          
          <div className="space-y-4 bg-slate-950/50 p-4 rounded-3xl border border-white/5">
            <div className="space-y-2.5">
              <label className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-1.5">
                <Droplets size={10} /> Accent Palette
              </label>
              <div className="flex flex-wrap gap-2">
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

            <div className="flex gap-4 items-end">
              <div className="flex-1 space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase">Project Name</label>
                <input 
                  value={state.projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-1.5">
                <Layout size={10} /> Widget Position
              </label>
              <select 
                value={state.position}
                onChange={(e) => setPosition(e.target.value as Position)}
                className="w-full h-[40px] bg-slate-900 border border-white/10 rounded-xl px-3 text-[10px] font-bold text-white uppercase outline-none focus:border-indigo-500"
              >
                <option value="bottom-right">Bottom Right</option>
                <option value="bottom-left">Bottom Left</option>
                <option value="top-right">Top Right</option>
                <option value="top-left">Top Left</option>
              </select>
            </div>
          </div>
        </section>

        {/* Missions Section */}
        <section className="space-y-6">
          <div className="flex justify-between items-center sticky top-0 bg-slate-900 py-2 z-20">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
              <Target size={12} />
              <h3>Missions List</h3>
            </div>
            <button 
              onClick={addTask}
              className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg font-black text-[9px] uppercase hover:bg-indigo-500 transition-all flex items-center gap-1 shadow-lg shadow-indigo-600/20"
            >
              <Plus size={12} /> New Quest
            </button>
          </div>

          <div className="space-y-3">
            {state.tasks.map((task) => (
              <div key={task.id} className="bg-white/5 rounded-2xl border border-white/5 overflow-hidden transition-all group">
                {editingId !== task.id ? (
                  <div className="p-4 flex items-center justify-between">
                    <div className="truncate mr-4 flex items-center gap-2">
                      {task.icon ? (
                        <img
                          src={task.icon}
                          alt=""
                          className="h-6 w-6 rounded-full border border-white/10 bg-white/10 object-contain"
                          loading="lazy"
                        />
                      ) : null}
                      <div className="truncate">
                        <p className="text-xs font-black text-white truncate uppercase">{task.title}</p>
                        <p className="text-[10px] text-indigo-400 font-bold">{task.xp} XP Reward</p>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
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
                    <div className="flex gap-2">
                      <div className="flex-1 space-y-1">
                        <label className="text-[9px] font-bold text-slate-500 uppercase">Action Link</label>
                        <input 
                          value={editForm?.link}
                          onChange={(e) => setEditForm(prev => prev ? { ...prev, link: e.target.value } : null)}
                          placeholder="https://..."
                          className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-[11px] text-white focus:border-indigo-500"
                        />
                      </div>
                      <div className="w-20 space-y-1">
                        <label className="text-[9px] font-bold text-slate-500 uppercase text-center block">XP</label>
                        <input 
                          type="number"
                          value={editForm?.xp}
                          onChange={(e) => setEditForm(prev => prev ? { ...prev, xp: parseInt(e.target.value) || 0 } : null)}
                          className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-[11px] text-center text-white focus:border-indigo-500"
                        />
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
        </section>
      </div>

      <EmbedModal 
        isOpen={isEmbedModalOpen} 
        onClose={() => setIsEmbedModalOpen(false)} 
        state={state} 
      />
    </div>
  );
};

export default Editor;
