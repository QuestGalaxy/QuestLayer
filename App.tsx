
import React, { useEffect, useRef, useState } from 'react';
import Editor from './components/Editor.tsx';
import Widget from './components/Widget.tsx';
import LandingPage from './components/LandingPage.tsx';
import HomePage from './components/HomePage.tsx';
import SettingsPage from './components/SettingsPage.tsx';
import ProfilePage from './components/ProfilePage.tsx';
import Paywall from './components/Paywall.tsx';
import { getOfferings, purchasePackage, PaywallOffering } from './lib/revenuecat';
import { AppState, Task, Position, ThemeType } from './types';
import { INITIAL_TASKS } from './constants';
import { Layout, Monitor, Smartphone, Globe, Shield, Zap, Search, Menu, Home, Sparkles, UserCircle2, Settings } from 'lucide-react';

const App: React.FC = () => {
  const [showLanding, setShowLanding] = useState(true);
  const [view, setView] = useState<'editor' | 'preview'>('editor');
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [previewTheme, setPreviewTheme] = useState<'dark' | 'light'>('dark');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeSection, setActiveSection] = useState<'home' | 'builder' | 'profile' | 'settings'>('home');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const [paywallOffering, setPaywallOffering] = useState<PaywallOffering | null>(null);
  const [paywallLoading, setPaywallLoading] = useState(false);
  const [paywallError, setPaywallError] = useState<string | null>(null);
  const [paywallNotice, setPaywallNotice] = useState<string | null>(null);
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

  useEffect(() => {
    if (!isPaywallOpen) return;
    let isMounted = true;
    setPaywallLoading(true);
    setPaywallError(null);
    setPaywallNotice(null);
    getOfferings()
      .then(offering => {
        if (isMounted) {
          setPaywallOffering(offering);
        }
      })
      .catch(() => {
        if (isMounted) {
          setPaywallError('Unable to load the current offering. Please try again.');
        }
      })
      .finally(() => {
        if (isMounted) {
          setPaywallLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [isPaywallOpen]);

  const handlePaywallPurchase = async (packageId: string) => {
    setPaywallLoading(true);
    setPaywallError(null);
    setPaywallNotice(null);
    const result = await purchasePackage(packageId);
    if (result.status === 'missing_key') {
      setPaywallError(result.message);
    } else if (result.status === 'redirect' && result.redirectUrl) {
      window.open(result.redirectUrl, '_blank', 'noopener');
      setPaywallNotice('Checkout opened in a new tab.');
    } else {
      setPaywallError(result.message);
    }
    setPaywallLoading(false);
  };

  const handlePaywallRestore = () => {
    setPaywallNotice('Restore flow will be available once RevenueCat is configured.');
  };

  const handleSectionChange = (section: 'home' | 'builder' | 'profile' | 'settings') => {
    setActiveSection(section);
    setIsSidebarOpen(false);
  };

  const toggleFullscreen = async () => {
    if (!previewRef.current) return;
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await previewRef.current.requestFullscreen();
    }
  };

  if (showLanding) {
    return (
      <LandingPage
        onLaunch={() => {
          setShowLanding(false);
          setActiveSection('home');
        }}
      />
    );
  }

  return (
    <>
      <div className="flex h-[100dvh] w-full overflow-hidden text-slate-100 font-['Inter'] bg-slate-950 animate-in fade-in duration-700">
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 border-r border-white/10 bg-slate-950/95 backdrop-blur-xl transition-transform duration-300 md:static md:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col overflow-hidden">
          <div className="sticky top-0 z-10 border-b border-white/10 bg-slate-950/90 px-5 py-4 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/15">
                  <Zap size={18} className="text-indigo-300" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-300">QuestLayer</p>
                  <p className="text-[10px] uppercase tracking-[0.35em] text-slate-400">Builder Suite</p>
                </div>
              </div>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="md:hidden rounded-lg border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:text-white"
              >
                <Layout size={16} />
              </button>
            </div>
            <div className="mt-4 flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[10px] uppercase tracking-[0.3em] text-slate-400">
              <Search size={12} />
              Search commands
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto custom-scroll px-4 py-6 space-y-6">
            <div className="space-y-2">
              <p className="px-3 text-[9px] font-black uppercase tracking-[0.4em] text-slate-500">Workspace</p>
              <button
                onClick={() => handleSectionChange('home')}
                className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] transition ${
                  activeSection === 'home'
                    ? 'bg-indigo-500/20 text-indigo-200 shadow-[0_0_20px_rgba(99,102,241,0.2)]'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Home size={16} />
                Home
              </button>
              <button
                onClick={() => handleSectionChange('builder')}
                className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] transition ${
                  activeSection === 'builder'
                    ? 'bg-indigo-500/20 text-indigo-200 shadow-[0_0_20px_rgba(99,102,241,0.2)]'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Sparkles size={16} />
                Builder + Widget
              </button>
            </div>

            <div className="space-y-2">
              <p className="px-3 text-[9px] font-black uppercase tracking-[0.4em] text-slate-500">Account</p>
              <button
                onClick={() => handleSectionChange('profile')}
                className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] transition ${
                  activeSection === 'profile'
                    ? 'bg-indigo-500/20 text-indigo-200 shadow-[0_0_20px_rgba(99,102,241,0.2)]'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <UserCircle2 size={16} />
                Profile
              </button>
              <button
                onClick={() => handleSectionChange('settings')}
                className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] transition ${
                  activeSection === 'settings'
                    ? 'bg-indigo-500/20 text-indigo-200 shadow-[0_0_20px_rgba(99,102,241,0.2)]'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Settings size={16} />
                Settings
              </button>
            </div>
          </nav>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/10 bg-slate-950/95 px-6 py-4 md:hidden">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-200"
          >
            <Menu size={18} />
          </button>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
            {activeSection === 'home' && 'Home'}
            {activeSection === 'builder' && 'Builder + Widget'}
            {activeSection === 'profile' && 'Profile'}
            {activeSection === 'settings' && 'Settings'}
          </p>
        </div>

        {activeSection === 'home' && (
          <HomePage
            onStartBuilding={() => handleSectionChange('builder')}
            onOpenPaywall={() => setIsPaywallOpen(true)}
          />
        )}

        {activeSection === 'profile' && (
          <ProfilePage />
        )}

        {activeSection === 'settings' && (
          <SettingsPage
            state={state}
            setProjectName={handleSetName}
            setAccentColor={handleSetColor}
            setPosition={handleSetPos}
            setActiveTheme={handleSetTheme}
          />
        )}

        {activeSection === 'builder' && (
          <>
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
          </>
        )}
      </div>
      </div>
      {paywallOffering && (
        <Paywall
          isOpen={isPaywallOpen}
          offering={paywallOffering}
          isLoading={paywallLoading}
          errorMessage={paywallError}
          noticeMessage={paywallNotice}
          onClose={() => setIsPaywallOpen(false)}
          onPurchase={handlePaywallPurchase}
          onRestore={handlePaywallRestore}
        />
      )}
    </>
  );
};

export default App;
