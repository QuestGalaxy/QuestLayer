
import React, { useEffect, useRef, useState } from 'react';
import Editor from './components/Editor.tsx';
import Widget from './components/Widget.tsx';
import LandingPage from './components/LandingPage.tsx';
import { AppState, Task, Position, ThemeType } from './types';
import { INITIAL_TASKS } from './constants';
import { Layout, Monitor, Smartphone, Globe, Shield, Menu } from 'lucide-react';
import { syncProjectToSupabase } from './lib/supabase';
import { useDisconnect, useAppKitAccount } from '@reown/appkit/react';

import Dashboard from './components/Dashboard.tsx';
import ExplorePage from './components/ExplorePage.tsx';
import QuestBrowse from './components/QuestBrowse.tsx';
import LeaderboardPage from './components/LeaderboardPage.tsx';
import { fetchProjectDetails, deleteProject } from './lib/supabase';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<'landing' | 'dashboard' | 'builder' | 'explore' | 'questbrowse' | 'leaderboard'>(() => {
    // Check URL path on initial load
    if (window.location.pathname === '/questbrowse') {
      return 'questbrowse';
    }
    if (window.location.pathname === '/leaderboard') {
      return 'leaderboard';
    }
    return 'landing';
  });

  // Handle URL updates and back button
  useEffect(() => {
    const handlePopState = () => {
        if (window.location.pathname === '/questbrowse') {
            setCurrentPage('questbrowse');
        } else if (window.location.pathname === '/leaderboard') {
            setCurrentPage('leaderboard');
        } else if (window.location.pathname === '/') {
            setCurrentPage('landing');
        }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Update URL when page changes
  useEffect(() => {
    if (currentPage === 'questbrowse') {
        window.history.pushState(null, '', '/questbrowse');
        document.title = 'QuestBrowse - Browse Web3 & Earn XP';
        // Add meta tags dynamically
        let metaTitle = document.querySelector('meta[name="title"]');
        if (!metaTitle) {
            metaTitle = document.createElement('meta');
            metaTitle.setAttribute('name', 'title');
            document.head.appendChild(metaTitle);
        }
        metaTitle.setAttribute('content', 'QuestBrowse - Browse Web3 & Earn XP');

        let metaDesc = document.querySelector('meta[name="description"]');
        if (!metaDesc) {
            metaDesc = document.createElement('meta');
            metaDesc.setAttribute('name', 'description');
            document.head.appendChild(metaDesc);
        }
        metaDesc.setAttribute('content', 'Discover decentralized ecosystems, earn XP, and unlock rewards simply by browsing your favorite protocols.');
        
        // Open Graph
        let ogTitle = document.querySelector('meta[property="og:title"]');
        if (!ogTitle) {
            ogTitle = document.createElement('meta');
            ogTitle.setAttribute('property', 'og:title');
            document.head.appendChild(ogTitle);
        }
        ogTitle.setAttribute('content', 'QuestBrowse - Browse Web3 & Earn XP');
        
        let ogDesc = document.querySelector('meta[property="og:description"]');
        if (!ogDesc) {
            ogDesc = document.createElement('meta');
            ogDesc.setAttribute('property', 'og:description');
            document.head.appendChild(ogDesc);
        }
        ogDesc.setAttribute('content', 'Discover decentralized ecosystems, earn XP, and unlock rewards simply by browsing your favorite protocols.');

        let ogUrl = document.querySelector('meta[property="og:url"]');
        if (!ogUrl) {
            ogUrl = document.createElement('meta');
            ogUrl.setAttribute('property', 'og:url');
            document.head.appendChild(ogUrl);
        }
        ogUrl.setAttribute('content', window.location.href);

        // Twitter
        let twTitle = document.querySelector('meta[name="twitter:title"]') || document.querySelector('meta[property="twitter:title"]');
        if (!twTitle) {
            twTitle = document.createElement('meta');
            twTitle.setAttribute('name', 'twitter:title');
            document.head.appendChild(twTitle);
        }
        twTitle.setAttribute('content', 'QuestBrowse - Browse Web3 & Earn XP');

        let twDesc = document.querySelector('meta[name="twitter:description"]') || document.querySelector('meta[property="twitter:description"]');
        if (!twDesc) {
            twDesc = document.createElement('meta');
            twDesc.setAttribute('name', 'twitter:description');
            document.head.appendChild(twDesc);
        }
        twDesc.setAttribute('content', 'Discover decentralized ecosystems, earn XP, and unlock rewards simply by browsing your favorite protocols.');

        let twUrl = document.querySelector('meta[name="twitter:url"]') || document.querySelector('meta[property="twitter:url"]');
        if (!twUrl) {
            twUrl = document.createElement('meta');
            twUrl.setAttribute('name', 'twitter:url');
            document.head.appendChild(twUrl);
        }
        twUrl.setAttribute('content', window.location.href);

    } else if (currentPage === 'leaderboard') {
        window.history.pushState(null, '', '/leaderboard');
        document.title = 'QuestLayer Leaderboard - Your XP Legacy';
    } else if (currentPage === 'landing') {
        window.history.pushState(null, '', '/');
        document.title = 'QuestLayer - Turn Any Website Into a Quest';
    }
  }, [currentPage]);

  const [view, setView] = useState<'editor' | 'preview'>('editor');
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [previewTheme, setPreviewTheme] = useState<'dark' | 'light'>('dark');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const [pendingBrowseRequest, setPendingBrowseRequest] = useState<{ projectId?: string; url?: string } | null>(null);
  
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
  const handleSetDomain = (domain: string) => setState(prev => ({ ...prev, projectDomain: domain }));
  const handleSetColor = (color: string) => setState(prev => ({ ...prev, accentColor: color }));
  const handleSetPos = (pos: Position) => setState(prev => ({ ...prev, position: pos }));
  const handleSetTheme = (theme: ThemeType) => setState(prev => ({ ...prev, activeTheme: theme }));

  const { address } = useAppKitAccount();

  const handlePublish = async () => {
    if (!address) return;
    const { projectId } = await syncProjectToSupabase(state, address);
    if (projectId) {
      setState(prev => ({ ...prev, projectId }));
    }
  };

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

  const { disconnect } = useDisconnect();

  if (currentPage === 'landing') {
    return (
      <LandingPage
        onLaunch={() => {
          setCurrentPage('dashboard');
        }}
        onExplore={() => {
          setCurrentPage('explore');
        }}
        onBrowse={() => {
          setCurrentPage('questbrowse');
        }}
      />
    );
  }

  if (currentPage === 'explore') {
    return (
      <ExplorePage
        onBack={() => setCurrentPage('landing')}
      />
    );
  }

  if (currentPage === 'questbrowse') {
    return (
      <QuestBrowse
        onBack={() => setCurrentPage('landing')}
        onLeaderboard={() => setCurrentPage('leaderboard')}
        initialBrowseRequest={pendingBrowseRequest}
        onBrowseHandled={() => setPendingBrowseRequest(null)}
      />
    );
  }

  if (currentPage === 'leaderboard') {
    return (
      <LeaderboardPage
        onBack={() => setCurrentPage('questbrowse')}
        onContinue={({ projectId, domain }) => {
          setPendingBrowseRequest({ projectId, url: domain || undefined });
          setCurrentPage('questbrowse');
        }}
      />
    );
  }

  if (currentPage === 'dashboard') {
    return (
      <Dashboard
        onSelectProject={async (id) => {
          // Fetch and Load
          try {
            const { project, tasks } = await fetchProjectDetails(id);
            if (project) {
              setState({
                projectId: project.id,
                projectName: project.name,
                projectDomain: project.domain, // Load domain
                accentColor: project.accent_color,
                position: project.position as Position,
                activeTheme: project.theme as ThemeType,
                tasks: tasks.map((t: any) => ({
                  id: t.id,
                  title: t.title,
                  desc: t.description,
                  link: t.link,
                  icon: t.icon_url,
                  xp: t.xp_reward
                })),
                userXP: 0,
                currentStreak: 1,
                dailyClaimed: false
              });
              setCurrentPage('builder');
            }
          } catch (err) {
            console.error("Failed to load project", err);
          }
        }}
        onCreateProject={() => {
          // Reset State
          setState({
            projectName: 'New Project',
            accentColor: '#6366f1',
            position: 'bottom-right',
            activeTheme: 'sleek',
            tasks: INITIAL_TASKS,
            userXP: 0,
            currentStreak: 1,
            dailyClaimed: false
          });
          setCurrentPage('builder');
        }}
        onDisconnect={() => {
          setCurrentPage('landing');
        }}
        onExplore={() => {
          setCurrentPage('explore');
        }}
        onBrowse={() => {
          setCurrentPage('questbrowse');
        }}
        onDeleteProject={async (id) => {
            try {
                await deleteProject(id);
                // Force a reload to refresh dashboard list
                // Since we are in parent, we can just toggle page or rely on Dashboard internal state
                // But Dashboard uses useEffect on mount.
                // Simplest is to just re-mount dashboard or let dashboard handle it.
                // For now, let's toggle page briefly or just alert.
                // Better UX: Trigger a state update in App that forces Dashboard remount
                setCurrentPage('landing');
                setTimeout(() => setCurrentPage('dashboard'), 50);
            } catch (e) {
                console.error(e);
                alert("Failed to delete project");
            }
        }}
      />
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] w-full overflow-hidden text-slate-100 font-['Inter'] bg-slate-950 animate-in fade-in duration-700">
      {/* Mobile Tab Navigation */}
      <div className="md:hidden flex bg-slate-900 border-b border-white/10 shrink-0 z-10">
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

      <div className="flex flex-1 overflow-hidden">
        {/* Editor Panel */}
        <aside className={`${view === 'editor' ? 'flex' : 'hidden'} md:flex flex-col flex-1 md:flex-none md:w-[450px] shrink-0 z-20 overflow-hidden min-h-0`}>
          <Editor 
            state={state}
            setProjectName={handleSetName}
            setProjectDomain={handleSetDomain}
            setAccentColor={handleSetColor}
            setPosition={handleSetPos}
            setActiveTheme={handleSetTheme}
            setTasks={handleSetTasks}
            onPublish={handlePublish}
            onBack={() => setCurrentPage('dashboard')}
          />
        </aside>

        {/* Preview Area */}
        <main className={`${view === 'preview' ? 'flex' : 'hidden'} md:flex flex-1 relative overflow-hidden ${previewTheme === 'dark' ? 'bg-slate-900' : 'bg-slate-100'} transition-colors duration-500 p-0 md:p-8`}>
          {/* Mock Website Container */}
          <div
            ref={previewRef}
            className={`w-full h-full border-0 md:border rounded-none md:rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col group transition-all duration-500 ${
              previewTheme === 'dark'
                ? 'bg-slate-950 border-white/5'
                : 'bg-white border-slate-200'
            } ${previewMode === 'mobile' ? 'max-w-[420px] mx-auto border rounded-[2.5rem]' : ''}`}
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

                  {/* Mock Content or Iframe */}
                  {state.projectDomain && state.projectDomain.includes('.') && state.projectDomain.length > 4 ? (
                    <div className="flex-1 w-full h-full bg-white relative">
                      <iframe
                        src={state.projectDomain.startsWith('http') ? state.projectDomain : `https://${state.projectDomain}`}
                        className="w-full h-full border-none"
                        title="Website Preview"
                        sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                      />
                      {/* Overlay to intercept clicks on iframe when in editor mode so widget can be used */}
                      <div className="absolute inset-0 pointer-events-none" />
                    </div>
                  ) : (
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
                  )}

                  {/* View Switcher Overlay (Desktop Only) */}
                  <div className="absolute top-20 left-1/2 -translate-x-1/2 hidden md:flex items-center gap-2 bg-black/60 backdrop-blur-md p-1 rounded-full border border-white/10 z-[60] opacity-0 group-hover:opacity-100 transition-opacity">
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

            {/* Focus Mask */}
            <div 
              className={`absolute inset-0 bg-black/60 backdrop-blur-[2px] z-[50] transition-all duration-500 opacity-100 ${isWidgetOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
              onClick={() => setIsWidgetOpen(false)}
            />

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
    </div>
  );
};

export default App;
