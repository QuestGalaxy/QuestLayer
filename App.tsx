
import React, { useEffect, useRef, useState } from 'react';
import Editor from './components/Editor.tsx';
import Widget from './components/Widget.tsx';
import LandingPage from './components/LandingPage.tsx';
import { AppState, Task, Position, ThemeType } from './types';
import { INITIAL_TASKS } from './constants';
import { Layout, Monitor, Smartphone, Zap, Search, SlidersHorizontal, ChevronRight } from 'lucide-react';

const App: React.FC = () => {
  const [showLanding, setShowLanding] = useState(true);
  const [view, setView] = useState<'editor' | 'preview'>('editor');
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [previewTheme, setPreviewTheme] = useState<'dark' | 'light'>('dark');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const previewRef = useRef<HTMLDivElement | null>(null);
  
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

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    if (!previewRef.current) return;
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await previewRef.current.requestFullscreen();
    }
  };

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
          ref={previewRef}
          className={`w-full h-full border rounded-[2rem] md:rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col group transition-all duration-500 ${
            previewTheme === 'dark'
              ? 'bg-slate-950 border-white/5'
              : 'bg-white border-slate-200'
          } ${previewMode === 'mobile' ? 'max-w-[420px] mx-auto' : ''}`}
        >
          
          <div className="flex flex-1 overflow-hidden bg-[#121212] text-slate-100">
            <aside className="w-20 shrink-0 border-r border-white/10 bg-black/40 py-6 flex flex-col items-center gap-6">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                <Zap size={22} className="text-emerald-400" />
              </div>
              <div className="flex flex-col items-center gap-5 text-white/40">
                {['nodes', 'users', 'grid', 'chart', 'wallet', 'settings'].map((item, index) => (
                  <div
                    key={item}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center border transition ${
                      index === 0 ? 'bg-white/10 border-white/20 text-white' : 'border-transparent hover:border-white/10'
                    }`}
                  >
                    <div className="w-4 h-4 rounded-sm bg-white/40" />
                  </div>
                ))}
              </div>
            </aside>

            <div className="flex-1 flex flex-col overflow-hidden">
              <header className="h-16 border-b border-white/10 bg-black/30 flex items-center justify-between px-6">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                      <Zap size={18} className="text-emerald-400" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-semibold tracking-tight">Midday</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border border-white/10 text-white/70">PRO</span>
                    </div>
                  </div>
                  <div className="w-px h-5 bg-white/10" />
                  <button className="w-10 h-10 rounded-2xl border border-white/10 bg-white/5 text-white/50 flex items-center justify-center">
                    <ChevronRight size={16} />
                  </button>
                </div>
                <div className="text-[11px] text-white/40 font-medium tracking-[0.2em] uppercase">Dashboard</div>
              </header>

              <div className="relative flex-1 overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#1f1f1f_0%,#121212_55%)]" />
                <div className="relative z-10 h-full p-8">
                  <div className="flex justify-end gap-3 mb-8">
                    <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white/50">
                      <Search size={14} />
                      <span className="hidden sm:inline">Search</span>
                    </div>
                    <button className="w-10 h-10 rounded-xl border border-dashed border-white/20 text-white/50 flex items-center justify-center">
                      <SlidersHorizontal size={16} />
                    </button>
                  </div>

                  <div className="flex items-center justify-center h-[calc(100%-4rem)]">
                    <div className="w-full max-w-3xl rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur shadow-[0_0_40px_rgba(0,0,0,0.45)] p-10 flex flex-col justify-between min-h-[280px]">
                      <div className="flex justify-between items-start">
                        <span className="text-[11px] font-semibold tracking-[0.3em] uppercase text-emerald-400 border border-emerald-500/40 px-3 py-1 rounded-full">
                          Medium
                        </span>
                        <ChevronRight className="text-white/50" size={20} />
                      </div>
                      <div className="text-white/40 text-xs">AI-generated content</div>
                    </div>
                  </div>
                </div>
              </div>
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
            <div className="w-px h-3 bg-white/20" />
            <button
              onClick={toggleFullscreen}
              className="flex items-center gap-2 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-tight text-white/70 transition-all hover:text-white"
            >
              <Layout size={12} /> {isFullscreen ? 'Exit' : 'Fullscreen'}
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
