
import React, { useState } from 'react';
import Editor from './components/Editor.tsx';
import Widget from './components/Widget.tsx';
import LandingPage from './components/LandingPage.tsx';
import { AppState, Task, Position, ThemeType } from './types';
import { INITIAL_TASKS } from './constants';
import { Layout, Monitor, Smartphone, Globe, Shield, Zap, Search, Menu } from 'lucide-react';

const App: React.FC = () => {
  const [showLanding, setShowLanding] = useState(true);
  const [view, setView] = useState<'editor' | 'preview'>('editor');
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [previewTheme, setPreviewTheme] = useState<'dark' | 'light'>('dark');
  
  const [state, setState] = useState<AppState>({
    projectName: 'Vortex Protocol',
    accentColor: '#6366f1',
    position: 'bottom-right',
    activeTheme: 'sleek',
    tasks: INITIAL_TASKS,
    userXP: 0,
    currentStreak: 1,
    dailyClaimed: false
  });

  const handleSetTasks = (newTasks: Task[]) => setState(prev => ({ ...prev, tasks: newTasks }));
  const handleSetName = (name: string) => setState(prev => ({ ...prev, projectName: name }));
  const handleSetColor = (color: string) => setState(prev => ({ ...prev, accentColor: color }));
  const handleSetPos = (pos: Position) => setState(prev => ({ ...prev, position: pos }));
  const handleSetTheme = (theme: ThemeType) => setState(prev => ({ ...prev, activeTheme: theme }));

  if (showLanding) {
    return <LandingPage onLaunch={() => setShowLanding(false)} />;
  }

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] w-full overflow-hidden text-slate-100 font-['Inter'] bg-slate-950 animate-in fade-in duration-700">
      
      {/* Mobile Tab Navigation */}
      <div className="md:hidden flex bg-slate-900 border-b border-white/10 shrink-0 z-50">
        <button 
          onClick={() => setView('editor')} 
          className={`flex-1 py-4 font-bold text-xs uppercase tracking-widest transition-colors ${view === 'editor' ? 'text-indigo-400 border-b-2 border-indigo-400 bg-white/5' : 'text-slate-500'}`}
        >
          Editor
        </button>
        <button 
          onClick={() => setView('preview')} 
          className={`flex-1 py-4 font-bold text-xs uppercase tracking-widest transition-colors ${view === 'preview' ? 'text-indigo-400 border-b-2 border-indigo-400 bg-white/5' : 'text-slate-500'}`}
        >
          Preview
        </button>
      </div>

      {/* Editor Panel */}
      <aside className={`${view === 'editor' ? 'flex' : 'hidden'} md:flex flex-col flex-1 md:flex-none md:w-[450px] shrink-0 z-20 overflow-hidden min-h-0`}>
        <Editor 
          state={state}
          setProjectName={handleSetName}
          setAccentColor={handleSetColor}
          setPosition={handleSetPos}
          setActiveTheme={handleSetTheme}
          setTasks={handleSetTasks}
        />
      </aside>

      {/* Preview Area */}
      <main className={`${view === 'preview' ? 'flex' : 'hidden'} md:flex flex-1 relative overflow-hidden ${previewTheme === 'dark' ? 'bg-slate-900' : 'bg-slate-100'} transition-colors duration-500 p-4 md:p-8`}>
        {/* Mock Website Container */}
        <div
          className={`w-full h-full border rounded-[2rem] md:rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col group transition-all duration-500 ${
            previewTheme === 'dark'
              ? 'bg-slate-950 border-white/5'
              : 'bg-white border-slate-200'
          } ${previewMode === 'mobile' ? 'max-w-[420px] mx-auto' : ''}`}
        >
          
          {/* Mock Browser Header */}
          <header className={`h-14 border-b flex items-center justify-between px-6 shrink-0 ${previewTheme === 'dark' ? 'border-white/5 bg-black/20' : 'border-slate-200 bg-white'}`}>
             <div className="flex items-center gap-4">
               <div className="flex gap-1.5">
                  <div className={`w-2.5 h-2.5 rounded-full ${previewTheme === 'dark' ? 'bg-red-500/30' : 'bg-red-500/50'}`} />
                  <div className={`w-2.5 h-2.5 rounded-full ${previewTheme === 'dark' ? 'bg-amber-500/30' : 'bg-amber-500/50'}`} />
                  <div className={`w-2.5 h-2.5 rounded-full ${previewTheme === 'dark' ? 'bg-emerald-500/30' : 'bg-emerald-500/50'}`} />
               </div>
               <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${previewTheme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-slate-100 border-slate-200'}`}>
                 <Globe size={12} className={`${previewTheme === 'dark' ? 'text-slate-500' : 'text-slate-600'}`} />
                 <span className={`text-[10px] font-mono tracking-tighter ${previewTheme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>your-protocol.io</span>
               </div>
             </div>
             <div className="flex items-center gap-6">
                <div className={`hidden lg:flex items-center gap-6 text-[10px] font-black uppercase tracking-widest ${previewTheme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>
                  <span className={`cursor-pointer transition-colors ${previewTheme === 'dark' ? 'hover:text-white' : 'hover:text-slate-900'}`}>Stake</span>
                  <span className={`cursor-pointer transition-colors ${previewTheme === 'dark' ? 'hover:text-white' : 'hover:text-slate-900'}`}>Swap</span>
                  <span className={`cursor-pointer transition-colors ${previewTheme === 'dark' ? 'hover:text-white' : 'hover:text-slate-900'}`}>Docs</span>
                </div>
                <Menu size={18} className={`${previewTheme === 'dark' ? 'text-slate-400' : 'text-slate-600'} lg:hidden`} />
             </div>
          </header>

          {/* Mock Content */}
          <div className={`flex-1 overflow-y-auto custom-scroll p-10 space-y-20 ${previewTheme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
             {/* Hero section mock */}
             <div className="space-y-6 max-w-2xl">
                <div className={`flex items-center gap-2 ${previewTheme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'}`}>
                  <Shield size={16} />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em]">Protocol V3.2</span>
                </div>
                <h1 className={`text-4xl md:text-6xl font-black uppercase tracking-tighter leading-[0.9] ${previewTheme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  Liquid <span style={{ color: state.accentColor }}>Efficiency</span> <br/>
                  Defined.
                </h1>
                <p className={`text-sm leading-relaxed max-w-md ${previewTheme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                  Experience the next generation of decentralized liquidity provisioning with cross-chain atomic settlements.
                </p>
                <div className="flex gap-3">
                  <div style={{ backgroundColor: state.accentColor }} className="px-6 py-2.5 rounded-xl text-black font-black text-[10px] uppercase tracking-widest cursor-pointer hover:brightness-110">Launch App</div>
                  <div className={`px-6 py-2.5 rounded-xl border font-black text-[10px] uppercase tracking-widest cursor-pointer ${previewTheme === 'dark' ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' : 'bg-white border-slate-200 text-slate-900 hover:bg-slate-100'}`}>Read Whitepaper</div>
                </div>
             </div>

             {/* Grid mockup */}
             <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 ${previewTheme === 'dark' ? 'opacity-30' : 'opacity-40'}`}>
                {[1, 2, 3].map(i => (
                  <div key={i} className={`h-32 border rounded-3xl ${previewTheme === 'dark' ? 'border-white/5 bg-white/5' : 'border-slate-200 bg-slate-100'}`} />
                ))}
             </div>

             <div className={`h-64 border rounded-[3rem] w-full flex items-center justify-center ${previewTheme === 'dark' ? 'border-white/5 bg-white/5 opacity-20' : 'border-slate-200 bg-slate-100 opacity-40'}`}>
                <p className={`text-[9px] font-black uppercase tracking-[1em] ${previewTheme === 'dark' ? 'text-white' : 'text-slate-700'}`}>Main Content Block</p>
             </div>
          </div>

          {/* View Switcher Overlay (Desktop Only) */}
          <div className="absolute top-20 left-1/2 -translate-x-1/2 hidden md:flex items-center gap-2 bg-black/60 backdrop-blur-md p-1 rounded-full border border-white/10 z-40 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => setPreviewMode('desktop')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-tight transition-all ${
                previewMode === 'desktop' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'
              }`}
            >
              <Monitor size={12} /> Live Preview
            </button>
            <button
              onClick={() => setPreviewMode('mobile')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-tight transition-all ${
                previewMode === 'mobile' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'
              }`}
            >
              <Smartphone size={12} /> Responsive
            </button>
            <div className="w-px h-3 bg-white/20" />
            <button
              onClick={() => setPreviewTheme('dark')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-tight transition-all ${
                previewTheme === 'dark' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'
              }`}
            >
              Dark
            </button>
            <button
              onClick={() => setPreviewTheme('light')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-tight transition-all ${
                previewTheme === 'light' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'
              }`}
            >
              Light
            </button>
          </div>

          {/* Widget Component inside the mock browser container */}
          <Widget 
            isOpen={isWidgetOpen} 
            setIsOpen={setIsWidgetOpen} 
            state={state} 
            setState={setState} 
            isPreview={true}
          />
        </div>
      </main>
    </div>
  );
};

export default App;
