import React, { useEffect, useState } from 'react';
import { fetchAllProjects, fetchProjectStats, fetchProjectDetails } from '../lib/supabase';
import { Globe, ArrowRight, Loader2, Search, Zap, ExternalLink, Activity, Users, ChevronLeft, ChevronRight, X, Layout } from 'lucide-react';
import Widget from './Widget';
import { INITIAL_TASKS } from '../constants';
import { AppState, Position, ThemeType } from '../types';

interface QuestBrowseProps {
  onBack: () => void;
}

const DEFAULT_WIDGET_STATE: AppState = {
  projectName: 'Quest Browser',
  accentColor: '#6366f1',
  position: 'bottom-right',
  activeTheme: 'sleek',
  tasks: INITIAL_TASKS,
  userXP: 0,
  currentStreak: 1,
  dailyClaimed: false
};

const BrowseCard: React.FC<{ project: any; stats: any; onClick: () => void; onImageError: (id: string) => void }> = ({ project, stats, onClick, onImageError }) => {
  const [ogImage, setOgImage] = useState<string | null>(null);
  
  useEffect(() => {
    if (!project.domain) {
        onImageError(project.id);
        return;
    }
    let isMounted = true;

    const fetchOg = async () => {
      try {
        const url = `https://api.microlink.io/?url=${encodeURIComponent(project.domain.startsWith('http') ? project.domain : `https://${project.domain}`)}&palette=true&audio=false&video=false&iframe=false`;
        const res = await fetch(url);
        const data = await res.json();
        if (isMounted) {
            if (data.status === 'success' && data.data.image?.url) {
                setOgImage(data.data.image.url);
            } else {
                onImageError(project.id);
            }
        }
      } catch (e) {
        if (isMounted) {
            onImageError(project.id);
        }
      }
    };

    fetchOg();
    return () => { isMounted = false; };
  }, [project.domain, project.id, onImageError]);

  if (!ogImage) return (
    <div className="rounded-3xl border border-white/5 bg-slate-900/40 h-[300px] animate-pulse">
        <div className="h-48 bg-white/5 rounded-t-3xl" />
    </div>
  );

  return (
    <div 
      onClick={onClick}
      className="group relative rounded-3xl border border-white/10 bg-slate-900/40 overflow-hidden transition-all duration-500 hover:bg-slate-900 hover:border-indigo-500/50 hover:shadow-[0_0_40px_rgba(99,102,241,0.15)] flex flex-col h-full hover:-translate-y-1 cursor-pointer"
    >
      <div className="relative h-48 w-full bg-slate-950/50 border-b border-white/5">
        <div className="absolute inset-0 overflow-hidden">
            {ogImage ? (
            <img 
                src={ogImage} 
                alt={project.name} 
                className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-all duration-700 group-hover:scale-110"
            />
            ) : (
            <div className="absolute inset-0 flex items-center justify-center opacity-10 group-hover:opacity-20 transition-opacity">
                <Layout size={64} className="text-white" />
            </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-60" />
        </div>

        <div 
          className="absolute -bottom-6 left-6 w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-xl z-10 border-4 border-slate-900 transition-transform group-hover:scale-110 duration-300"
          style={{ backgroundColor: project.accent_color }}
        >
          <Zap size={24} fill="currentColor" />
        </div>
      </div>

      <div className="p-6 pt-10 flex-1 flex flex-col">
        <h3 className="text-xl font-black text-white mb-2 truncate group-hover:text-indigo-400 transition-colors tracking-tight">
          {project.name}
        </h3>
        
        {project.domain && (
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-4 truncate">
            <Globe size={12} className="shrink-0 text-indigo-500" />
            <span className="truncate group-hover:text-indigo-300 transition-colors font-medium">
              {project.domain.replace(/^https?:\/\//, '')}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

const QuestBrowse: React.FC<QuestBrowseProps> = ({ onBack }) => {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [invalidImages, setInvalidImages] = useState<Set<string>>(new Set());
  
  const handleNextProject = () => {
    if (projects.length === 0) return;
    const nextIndex = (currentProjectIndex + 1) % projects.length; // Loop back to start
    const nextProject = projects[nextIndex];
    handleProjectClick(nextProject);
  };

  const handlePrevProject = () => {
    if (projects.length === 0) return;
    const prevIndex = (currentProjectIndex - 1 + projects.length) % projects.length; // Loop back to end
    const prevProject = projects[prevIndex];
    handleProjectClick(prevProject);
  };

  // Browsing State
  const [isBrowsing, setIsBrowsing] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');
  const [widgetState, setWidgetState] = useState<AppState>(DEFAULT_WIDGET_STATE);
  const [isWidgetOpen, setIsWidgetOpen] = useState(true);

  const ITEMS_PER_PAGE = 12;

  const handleImageError = (id: string) => {
    setInvalidImages(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchAllProjects();
        if (data) {
          const projectsWithStats = await Promise.all(
            data.map(async (project: any) => {
              try {
                const stats = await fetchProjectStats(project.id);
                return { ...project, stats };
              } catch (e) {
                return { ...project, stats: { total_visits: 0, connected_wallets: 0 } };
              }
            })
          );
          
          const sortedProjects = projectsWithStats.sort((a, b) => {
            const visitsA = a.stats?.total_visits || 0;
            const visitsB = b.stats?.total_visits || 0;
            return visitsB - visitsA;
          });

          const seenDomains = new Set();
          const uniqueProjects = sortedProjects.filter(project => {
            if (!project.domain) return false;
            const domain = project.domain.toLowerCase();
            if (seenDomains.has(domain)) return false;
            seenDomains.add(domain);
            return true;
          });

          setProjects(uniqueProjects);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleBrowseUrl = (url: string) => {
    if (!url) return;
    let validUrl = url.trim();
    if (!validUrl.startsWith('http://') && !validUrl.startsWith('https://')) {
      validUrl = `https://${validUrl}`;
    }
    
    setCurrentUrl(validUrl);
    setWidgetState({
        ...DEFAULT_WIDGET_STATE,
        projectName: 'Quest Browser',
        projectDomain: validUrl
    });
    setIsBrowsing(true);
    setIsWidgetOpen(true);
  };

  const [currentProjectIndex, setCurrentProjectIndex] = useState<number>(-1);

  // ... (inside handleProjectClick)
  const handleProjectClick = async (project: any) => {
    if (!project.domain) return;
    
    // Find index in projects array for navigation
    const index = projects.findIndex(p => p.id === project.id);
    setCurrentProjectIndex(index);

    // ... (rest of function)
    try {
        const { tasks } = await fetchProjectDetails(project.id);
        const newState: AppState = {
            projectId: project.id,
            projectName: project.name,
            projectDomain: project.domain,
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
        };
        
        setWidgetState(newState);
        setCurrentUrl(project.domain.startsWith('http') ? project.domain : `https://${project.domain}`);
        setIsBrowsing(true);
        setIsWidgetOpen(true);
    } catch (e) {
        console.error("Failed to load project details", e);
        // Fallback to basic info if tasks fail
        handleBrowseUrl(project.domain);
    }
  };

  const filteredProjects = projects.filter(p => 
    !invalidImages.has(p.id) &&
    p.domain && (
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.domain.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const totalPages = Math.ceil(filteredProjects.length / ITEMS_PER_PAGE);
  const paginatedProjects = filteredProjects.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  if (isBrowsing) {
    return (
        <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col">
            {/* Browser Header */}
            <div className="h-14 bg-slate-900 border-b border-white/10 flex items-center px-4 gap-4 shrink-0 z-50">
                <button 
                    onClick={() => setIsBrowsing(false)}
                    className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                >
                    <X size={20} />
                </button>
                <div className="flex-1 max-w-3xl mx-auto relative flex items-center gap-4">
                    <div className="flex-1 relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                            <Globe size={14} />
                        </div>
                        <input 
                            value={currentUrl}
                            onChange={(e) => setCurrentUrl(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleBrowseUrl(currentUrl)}
                            className="w-full bg-slate-950 border border-white/10 rounded-full py-1.5 pl-9 pr-24 text-xs text-slate-300 focus:outline-none focus:border-indigo-500/50 font-mono"
                        />
                        <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1 pr-1">
                            <div className="w-px h-4 bg-white/10 mr-1" />
                            <button 
                                onClick={handlePrevProject}
                                disabled={currentProjectIndex === -1 && projects.length === 0}
                                className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Previous Project"
                            >
                                <ChevronLeft size={14} />
                            </button>
                            <button 
                                onClick={handleNextProject}
                                disabled={currentProjectIndex === -1 && projects.length === 0}
                                className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Next Project"
                            >
                                <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                </div>
                <div className="w-10" /> {/* Spacer */}
            </div>

            {/* Browser Content */}
            <div className="flex-1 relative bg-white">
                <iframe 
                    src={currentUrl}
                    className="w-full h-full border-none"
                    title="Quest Browser"
                    sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                />
                
                {/* Widget Overlay */}
                <Widget 
                    isOpen={isWidgetOpen}
                    setIsOpen={setIsWidgetOpen}
                    state={widgetState}
                    setState={setWidgetState}
                    isPreview={true} // Use preview mode to avoid writing to local storage with wrong keys
                />
            </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col overflow-y-auto custom-scroll h-screen">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-slate-950/80 backdrop-blur-xl shrink-0">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={onBack}
              className="p-2 -ml-2 text-slate-400 hover:text-white transition-colors"
            >
              <ArrowRight size={20} className="rotate-180" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Globe className="text-white" size={20} />
              </div>
              <span className="text-xl font-black italic tracking-tighter text-white uppercase">
                Quest<span className="text-indigo-500">Browse</span>
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="flex-1 relative">
        {/* Video Background */}
        <div className="absolute top-0 left-0 w-full h-[500px] overflow-hidden pointer-events-none opacity-30 mask-linear-fade">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-950 z-10" />
            <video 
                autoPlay 
                loop 
                muted 
                playsInline
                className="w-full h-full object-cover"
            >
                <source src="/questlayer.mp4" type="video/mp4" />
            </video>
        </div>

        <div className="relative z-20 p-6 md:p-10">
            <div className="max-w-7xl mx-auto space-y-10">
            
            {/* Hero URL Input */}
            <div className="py-12 md:py-20 text-center space-y-6">
                <div className="px-4">
                    <h1 className="text-3xl md:text-6xl font-black text-white uppercase tracking-tight mb-4 drop-shadow-2xl">
                        Browse the <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Web3</span>
                    </h1>
                    <p className="text-slate-300 text-xs md:text-lg font-medium max-w-lg mx-auto leading-relaxed drop-shadow-lg">
                        Discover decentralized ecosystems, earn XP, and unlock rewards simply by browsing your favorite protocols.
                    </p>
                </div>
            <div className="max-w-2xl mx-auto relative px-4">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur opacity-20" />
                <div className="relative bg-slate-900 border border-white/10 rounded-2xl p-2 flex items-center shadow-2xl">
                    <div className="pl-4 pr-3 text-slate-500">
                        <Globe size={20} />
                    </div>
                    <input 
                        type="text" 
                        placeholder="Enter any website URL (e.g. uniswap.org)..."
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleBrowseUrl(urlInput)}
                        className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-slate-600 text-lg h-12"
                    />
                    <button 
                        onClick={() => handleBrowseUrl(urlInput)}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 h-12 rounded-xl font-bold uppercase tracking-wide transition-all"
                    >
                        Go
                    </button>
                </div>
                
                {/* Scrolling Badges */}
                <div className="absolute top-full left-0 w-full pt-6 overflow-hidden">
                    <div className="flex gap-4 animate-scroll whitespace-nowrap">
                        {[
                            { name: 'Uniswap', icon: '🦄' },
                            { name: 'Aave', icon: '👻' },
                            { name: 'Curve', icon: '🌈' },
                            { name: 'Compound', icon: '📊' },
                            { name: 'SushiSwap', icon: '🍣' },
                            { name: 'Synthetix', icon: '⚔️' },
                            { name: 'Balancer', icon: '⚖️' },
                            { name: 'MakerDAO', icon: '🏦' },
                            { name: '1inch', icon: '🐴' },
                            { name: 'Yearn', icon: '🌾' },
                             { name: 'Uniswap', icon: '🦄' },
                            { name: 'Aave', icon: '👻' },
                            { name: 'Curve', icon: '🌈' },
                            { name: 'Compound', icon: '📊' },
                            { name: 'SushiSwap', icon: '🍣' },
                            { name: 'Synthetix', icon: '⚔️' },
                            { name: 'Balancer', icon: '⚖️' },
                            { name: 'MakerDAO', icon: '🏦' },
                            { name: '1inch', icon: '🐴' },
                            { name: 'Yearn', icon: '🌾' }
                        ].map((badge, i) => (
                            <div 
                                key={i} 
                                onClick={() => handleBrowseUrl(`${badge.name.toLowerCase()}.com`)}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-slate-300 text-xs font-bold uppercase tracking-wider hover:bg-white/10 hover:text-white hover:border-white/20 transition-all cursor-pointer backdrop-blur-sm"
                            >
                                <span>{badge.icon}</span>
                                {badge.name}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="animate-spin text-indigo-500" size={40} />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-500 tracking-widest mb-4">
                <Zap size={14} /> Popular Ecosystems
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {paginatedProjects.map((project) => (
                  <BrowseCard 
                    key={project.id} 
                    project={project} 
                    stats={project.stats} 
                    onClick={() => handleProjectClick(project)}
                    onImageError={handleImageError} 
                  />
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-12 pb-10">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-3 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  
                  <div className="flex items-center gap-2">
                    {[...Array(totalPages)].map((_, i) => (
                      <button
                        key={i + 1}
                        onClick={() => setCurrentPage(i + 1)}
                        className={`w-10 h-10 rounded-xl font-bold text-sm transition-all ${
                          currentPage === i + 1
                            ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                            : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-3 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      </div>
    </div>
  );
};

export default QuestBrowse;