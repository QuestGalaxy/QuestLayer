import React, { useEffect, useState } from 'react';
import { fetchAllProjects, fetchProjectStats, fetchProjectDetails, fetchUserXP } from '../lib/supabase';
import { Globe, ArrowRight, Loader2, Search, Zap, ChevronLeft, ChevronRight, X, Layout } from 'lucide-react';
import Widget from './Widget';
import ProfileMenuButton from './ProfileMenuButton';
import GlobalFooter from './GlobalFooter';
import { INITIAL_TASKS, SPONSORED_TASKS, THEMES } from '../constants';
import { AppState, Position, ThemeType, Task } from '../types';
import { useAppKit, useAppKitAccount, useDisconnect } from '@reown/appkit/react';

interface QuestBrowseProps {
  onBack: () => void;
  onLeaderboard: () => void;
  onWidgetBuilder?: () => void;
  initialBrowseRequest?: { projectId?: string; url?: string } | null;
  onBrowseHandled?: () => void;
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

const THEME_KEYS = Object.keys(THEMES) as ThemeType[];
const FALLBACK_ACCENTS = [
  '#6366f1',
  '#22c55e',
  '#0ea5e9',
  '#f97316',
  '#f43f5e',
  '#14b8a6',
  '#a855f7',
  '#f59e0b'
];

const hashString = (value: string) => {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

const createSeededRandom = (seed: number) => {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
};

const pickRandomTasks = (tasks: Task[], count: number, rng: () => number) => {
  const pool = [...tasks];
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.min(count, pool.length));
};

const BrowseCard: React.FC<{ project: any; stats: any; isOnline: boolean; onClick: () => void; onImageError: (id: string) => void }> = ({ project, stats, isOnline, onClick, onImageError }) => {
  const [ogImage, setOgImage] = useState<string | null>(null);
  
  useEffect(() => {
    if (!project.domain) {
        onImageError(project.id);
        return;
    }
    let isMounted = true;

    const fetchOg = async () => {
      try {
        const target = project.domain.startsWith('http') ? project.domain : `https://${project.domain}`;
        const url = `/api/og?url=${encodeURIComponent(target)}`;
        const res = await fetch(url);
        const data = await res.json();
        if (isMounted) {
            if (data?.image) {
                setOgImage(data.image);
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

  const fallbackAccent = project.accent_color || '#6366f1';
  const fallbackLabel = (project.name || 'QL').slice(0, 2).toUpperCase();

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
                onError={() => {
                  setOgImage(null);
                  onImageError(project.id);
                }}
            />
            ) : (
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{
                  background: `radial-gradient(120% 120% at 20% 10%, ${fallbackAccent}55 0%, transparent 55%), linear-gradient(135deg, rgba(15,23,42,0.95), rgba(2,6,23,0.95))`
                }}
              >
                <div className="flex flex-col items-center gap-2 text-white/80">
                  <Layout size={48} className="text-white/60" />
                  <span className="text-sm font-black tracking-widest">{fallbackLabel}</span>
                </div>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-60" />
        </div>

        {isOnline && (
          <div className="absolute top-4 right-4">
            <div className="px-2 py-1 rounded-lg bg-emerald-500/20 backdrop-blur-md border border-emerald-500/30 text-[10px] font-black text-emerald-300 uppercase shadow-sm flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
              </span>
              Online
              {project.domain && (
                <a
                  href={project.domain.startsWith('http') ? project.domain : `https://${project.domain}`}
                  target="_blank"
                  rel="noreferrer"
                  className="ml-1 inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/10 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-white/80 hover:text-white hover:bg-white/20 transition-colors"
                  onClick={(event) => event.stopPropagation()}
                >
                  Visit
                </a>
              )}
            </div>
          </div>
        )}

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

const QuestBrowse: React.FC<QuestBrowseProps> = ({ onBack, onLeaderboard, onWidgetBuilder, initialBrowseRequest, onBrowseHandled }) => {
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();
  const { disconnect } = useDisconnect();
  const [userStats, setUserStats] = useState({ xp: 0, level: 1 });
  const [nextLevelXP, setNextLevelXP] = useState(3000);
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    const loadUserStats = async () => {
        if (address) {
            const stats = await fetchUserXP(address);
            setUserStats(stats);
            // Calculate XP needed for next level based on formula: level * 3000
            setNextLevelXP(stats.level * 3000);
        }
    };
    loadUserStats();
  }, [address]);

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
  const [isIframeLoading, setIsIframeLoading] = useState(false);
  const [iframeBlocked, setIframeBlocked] = useState(false);
  const iframeLoadTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const iframeRef = React.useRef<HTMLIFrameElement | null>(null);

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

  const normalizeDomain = (value: string) => {
    const trimmed = value.trim().toLowerCase();
    if (!trimmed) return '';
    try {
      const withScheme = trimmed.startsWith('http://') || trimmed.startsWith('https://')
        ? trimmed
        : `https://${trimmed}`;
      return new URL(withScheme).hostname.replace(/^www\./, '');
    } catch {
      return trimmed.split('/')[0].replace(/^www\./, '');
    }
  };

  const buildFallbackState = (url: string, normalizedDomain: string) => {
    const seedBase = `${normalizedDomain || url}|${address || 'anon'}`;
    const rng = createSeededRandom(hashString(seedBase));
    const nextTheme = THEME_KEYS[Math.floor(rng() * THEME_KEYS.length)];
    const nextAccent = FALLBACK_ACCENTS[Math.floor(rng() * FALLBACK_ACCENTS.length)];
    const fallbackTasks = pickRandomTasks(SPONSORED_TASKS, 4, rng);

    return {
      ...DEFAULT_WIDGET_STATE,
      projectName: normalizedDomain || 'Quest Browser',
      projectDomain: url,
      accentColor: nextAccent,
      activeTheme: nextTheme,
      tasks: fallbackTasks
    };
  };

  const handleBrowseUrl = (url: string) => {
    if (!url) return;
    const normalized = normalizeDomain(url);
    if (normalized) {
      const matchedIndex = projects.findIndex(project => normalizeDomain(project.domain || '') === normalized);
      if (matchedIndex !== -1) {
        setCurrentProjectIndex(matchedIndex);
        void handleBrowseProjectById(projects[matchedIndex].id, projects[matchedIndex].domain);
        return;
      }
    }

    let validUrl = url.trim();
    if (!validUrl.startsWith('http://') && !validUrl.startsWith('https://')) {
      validUrl = `https://${validUrl}`;
    }

    if (iframeLoadTimeoutRef.current) {
      clearTimeout(iframeLoadTimeoutRef.current);
    }
    setIframeBlocked(false);
    setIsIframeLoading(true);
    setCurrentUrl(validUrl);
    setWidgetState(buildFallbackState(validUrl, normalized));
    setIsBrowsing(true);
    setIsWidgetOpen(true);
    iframeLoadTimeoutRef.current = setTimeout(() => {
      setIframeBlocked(true);
      setIsIframeLoading(false);
      setIsWidgetOpen(false);
    }, 6000);
  };

  const handleBrowseProjectById = async (projectId: string, domain?: string) => {
    setIsIframeLoading(true);
    if (iframeLoadTimeoutRef.current) {
      clearTimeout(iframeLoadTimeoutRef.current);
    }
    setIframeBlocked(false);
    try {
      const { project, tasks } = await fetchProjectDetails(projectId);
      if (!project) return;
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
      const resolvedDomain = project.domain || domain;
      if (resolvedDomain) {
        const url = resolvedDomain.startsWith('http') ? resolvedDomain : `https://${resolvedDomain}`;
        setCurrentUrl(url);
      }
      setIsBrowsing(true);
      setIsWidgetOpen(true);
      iframeLoadTimeoutRef.current = setTimeout(() => {
        setIframeBlocked(true);
        setIsIframeLoading(false);
        setIsWidgetOpen(false);
      }, 6000);
    } catch (error) {
      if (domain) {
        handleBrowseUrl(domain);
      }
    }
  };

  const [currentProjectIndex, setCurrentProjectIndex] = useState<number>(-1);

  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // Auto-scrolling logic
  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    let animationFrameId: number;
    let startTime: number | null = null;
    const scrollSpeed = 0.5; // pixels per frame

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      
      if (!isDragging) {
        if (scrollContainer.scrollLeft >= (scrollContainer.scrollWidth / 2)) {
          scrollContainer.scrollLeft = 0;
        } else {
          scrollContainer.scrollLeft += scrollSpeed;
        }
      }
      
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrameId);
  }, [isDragging]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.pageX - (scrollRef.current?.offsetLeft || 0));
    setScrollLeft(scrollRef.current?.scrollLeft || 0);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - (scrollRef.current?.offsetLeft || 0);
    const walk = (x - startX) * 2; // scroll-fast
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollLeft - walk;
    }
  };

  const handleBadgeClick = (badge: any) => {
      if (!isDragging) {
          handleBrowseUrl(`${badge.name.toLowerCase()}.com`);
      }
  };
  
  // ... rest of component
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

  const isProjectOnline = (project: any) => {
    if (!project.last_ping_at) return false;
    const lastPing = new Date(project.last_ping_at).getTime();
    return lastPing > Date.now() - 60 * 60 * 1000;
  };

  const filteredProjects = projects
    .filter(p => 
      p.domain && (
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.domain.toLowerCase().includes(searchTerm.toLowerCase())
      )
    )
    .sort((a, b) => {
      const aOnline = isProjectOnline(a);
      const bOnline = isProjectOnline(b);
      if (aOnline !== bOnline) return aOnline ? -1 : 1;
      const aPing = a.last_ping_at ? new Date(a.last_ping_at).getTime() : 0;
      const bPing = b.last_ping_at ? new Date(b.last_ping_at).getTime() : 0;
      if (aPing !== bPing) return bPing - aPing;
      return (a.name || '').localeCompare(b.name || '');
    });

  const totalPages = Math.ceil(filteredProjects.length / ITEMS_PER_PAGE);
  const paginatedProjects = filteredProjects.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  const currentProjectOnline = currentProjectIndex >= 0 && projects[currentProjectIndex]
    ? isProjectOnline(projects[currentProjectIndex])
    : false;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  useEffect(() => {
    if (!initialBrowseRequest) return;
    setIsBrowsing(true);
    setIsIframeLoading(true);
    if (initialBrowseRequest.projectId) {
      void handleBrowseProjectById(initialBrowseRequest.projectId, initialBrowseRequest.url);
    } else if (initialBrowseRequest.url) {
      handleBrowseUrl(initialBrowseRequest.url);
    }
    onBrowseHandled?.();
  }, [initialBrowseRequest]);

  useEffect(() => {
    return () => {
      if (iframeLoadTimeoutRef.current) {
        clearTimeout(iframeLoadTimeoutRef.current);
      }
    };
  }, []);

  if (isBrowsing) {
    return (
        <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col">
            {/* Browser Header */}
            <div className="sticky top-0 z-50 h-16 bg-gradient-to-r from-slate-950/95 via-slate-900/90 to-slate-950/95 border-b border-white/10 flex items-center px-4 gap-4 shrink-0 backdrop-blur-xl shadow-[0_12px_30px_rgba(0,0,0,0.4)] relative">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-400/50 to-transparent" />
                <div className="pointer-events-none absolute inset-x-8 bottom-0 h-px bg-gradient-to-r from-transparent via-purple-400/40 to-transparent" />
                <button 
                    onClick={() => setIsBrowsing(false)}
                    className="p-2.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors border border-white/10 bg-slate-900/60 shadow-lg"
                >
                    <X size={20} />
                </button>
                <div className="flex-1 max-w-3xl mx-auto relative flex items-center gap-4">
                    <div className="hidden sm:flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.35em] text-slate-400">
                        <span className="h-2 w-2 rounded-full bg-emerald-400/80 shadow-[0_0_12px_rgba(52,211,153,0.6)]" />
                        Quest Browse
                    </div>
                    <div className="flex-1 relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                            <Globe size={14} />
                        </div>
                        <input 
                            value={currentUrl}
                            onChange={(e) => setCurrentUrl(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleBrowseUrl(currentUrl)}
                            className="w-full bg-slate-950/70 border border-white/10 rounded-full py-2 pl-9 pr-28 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-indigo-400/60 focus:shadow-[0_0_0_1px_rgba(99,102,241,0.35)] font-mono"
                        />
                        <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1 pr-1">
                            <div className="w-px h-5 bg-white/10 mr-1" />
                            <button 
                                onClick={handlePrevProject}
                                disabled={currentProjectIndex === -1 && projects.length === 0}
                                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Previous Project"
                            >
                                <ChevronLeft size={14} />
                            </button>
                            <button 
                                onClick={handleNextProject}
                                disabled={currentProjectIndex === -1 && projects.length === 0}
                                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                    ref={iframeRef}
                    src={currentUrl}
                    className="w-full h-full border-none"
                    title="Quest Browser"
                    sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                    onLoad={() => {
                        if (iframeLoadTimeoutRef.current) {
                            clearTimeout(iframeLoadTimeoutRef.current);
                        }
                        setIsIframeLoading(false);
                        let isBlocked = false;
                        try {
                            const href = iframeRef.current?.contentWindow?.location?.href || '';
                            if (!href || href === 'about:blank' || href.startsWith('chrome-error://')) {
                                isBlocked = true;
                            }
                        } catch {
                            isBlocked = false;
                        }
                        setIframeBlocked(isBlocked);
                        if (isBlocked) {
                            setIsWidgetOpen(false);
                        }
                    }}
                />

                {isIframeLoading && (
                    <div className="absolute inset-0 z-40 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
                        <div className="flex flex-col items-center gap-4 text-center">
                            <div className="h-12 w-12 rounded-2xl border border-indigo-400/30 bg-indigo-500/10 p-3">
                                <Loader2 className="h-6 w-6 animate-spin text-indigo-300" />
                            </div>
                            <div className="text-xs font-black uppercase tracking-widest text-indigo-200">
                                Loading quest site
                            </div>
                            <div className="h-1.5 w-40 overflow-hidden rounded-full bg-white/10">
                                <div className="h-full w-full animate-pulse bg-gradient-to-r from-indigo-400/30 via-indigo-400/70 to-indigo-400/30" />
                            </div>
                        </div>
                    </div>
                )}

                {iframeBlocked && (
                    <div className="absolute inset-0 z-40 flex items-center justify-center bg-slate-950/85 backdrop-blur-md">
                        <div className="relative w-full max-w-xl p-6 sm:p-8 rounded-3xl border border-white/10 bg-slate-900/80 shadow-[0_30px_80px_rgba(15,23,42,0.6)] text-left overflow-hidden">
                            <div className="absolute -top-20 -right-20 h-48 w-48 rounded-full bg-indigo-500/20 blur-3xl" />
                            <div className="absolute -bottom-24 -left-20 h-52 w-52 rounded-full bg-purple-500/20 blur-3xl" />
                            <div className="relative space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="h-14 w-14 rounded-2xl border border-indigo-400/30 bg-indigo-500/10 p-3 shadow-lg">
                                        <Globe className="h-8 w-8 text-indigo-200" />
                                    </div>
                                    <div>
                                        <div className="text-[11px] font-black uppercase tracking-[0.35em] text-indigo-300/80">
                                            QuestBrowse
                                        </div>
                                        <div className="text-xl font-black text-white tracking-tight">
                                            This site blocks embedding
                                        </div>
                                        <div className="text-xs text-slate-400">
                                            Some sites (like OpenSea) refuse to load inside an iframe.
                                        </div>
                                    </div>
                                </div>

                                <div className="grid gap-3 sm:grid-cols-3">
                                    <div className="group rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-3 text-xs text-slate-200 shadow-[0_12px_30px_rgba(15,23,42,0.35)]">
                                        <div className="mb-2 flex items-center gap-2">
                                            <span className="flex h-7 w-7 items-center justify-center rounded-xl border border-indigo-400/30 bg-indigo-500/15 text-indigo-200 shadow-lg transition-transform group-hover:-translate-y-0.5 group-hover:scale-105">
                                                <Search size={14} className="animate-[pulse_2s_ease-in-out_infinite]" />
                                            </span>
                                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-300">
                                                1. Browse
                                            </span>
                                        </div>
                                        <p className="text-[12px] leading-relaxed text-slate-100">
                                            Enter a domain or pick a project card to preview it.
                                        </p>
                                    </div>
                                    <div className="group rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-3 text-xs text-slate-200 shadow-[0_12px_30px_rgba(15,23,42,0.35)]">
                                        <div className="mb-2 flex items-center gap-2">
                                            <span className="flex h-7 w-7 items-center justify-center rounded-xl border border-amber-400/30 bg-amber-500/15 text-amber-200 shadow-lg transition-transform group-hover:-translate-y-0.5 group-hover:scale-105">
                                                <Zap size={14} className="animate-[bounce_2.4s_ease-in-out_infinite]" />
                                            </span>
                                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-200">
                                                2. Engage
                                            </span>
                                        </div>
                                        <p className="text-[12px] leading-relaxed text-slate-100">
                                            The widget floats over the site so you can earn XP.
                                        </p>
                                    </div>
                                    <div className="group rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-3 text-xs text-slate-200 shadow-[0_12px_30px_rgba(15,23,42,0.35)]">
                                        <div className="mb-2 flex items-center gap-2">
                                            <span className="flex h-7 w-7 items-center justify-center rounded-xl border border-emerald-400/30 bg-emerald-500/15 text-emerald-200 shadow-lg transition-transform group-hover:-translate-y-0.5 group-hover:scale-105">
                                                <ArrowRight size={14} className="animate-[wiggle_2.8s_ease-in-out_infinite]" />
                                            </span>
                                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-200">
                                                3. Open
                                            </span>
                                        </div>
                                        <p className="text-[12px] leading-relaxed text-slate-100">
                                            If a site blocks embeds, use a new tab instead.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-3">
                                    <button
                                        onClick={() => {
                                            setIframeBlocked(false);
                                            setIsBrowsing(false);
                                        }}
                                        className="px-4 py-2 rounded-xl border border-white/10 text-xs font-black uppercase text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                                    >
                                        Keep Browsing
                                    </button>
                                    {currentUrl && (
                                        <a
                                            href={currentUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="px-4 py-2 rounded-xl bg-indigo-500 text-xs font-black uppercase tracking-widest text-white hover:bg-indigo-400 transition-colors"
                                        >
                                            Open Site
                                        </a>
                                    )}
                                    <span className="text-[10px] uppercase tracking-widest text-slate-500">
                                        Tip: Use projects with an Online badge for best results.
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                
                {/* Widget Overlay */}
                {!iframeBlocked && (
                    <Widget 
                        isOpen={isWidgetOpen}
                        setIsOpen={setIsWidgetOpen}
                        state={widgetState}
                        setState={setWidgetState}
                        isPreview={true} // Use preview mode to avoid writing to local storage with wrong keys
                    />
                )}
            </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col overflow-y-auto custom-scroll h-screen">
      <style>
        {`
          @keyframes wiggle {
            0%, 100% { transform: translateX(0); }
            50% { transform: translateX(4px); }
          }
        `}
      </style>
      
      {/* Content */}
      <div className="flex-1 relative">
        <button 
            onClick={onBack}
            className="fixed top-6 left-6 z-50 p-2 text-slate-400 hover:text-white transition-colors bg-slate-950/50 backdrop-blur-md rounded-xl border border-white/10 shadow-lg"
        >
            <ArrowRight size={20} className="rotate-180" />
        </button>

        {/* Wallet Connect / Profile Button */}
        <div className="fixed top-6 right-6 z-50">
            <ProfileMenuButton
                isConnected={isConnected}
                address={address}
                xp={userStats.xp}
                level={userStats.level}
                nextLevelXP={nextLevelXP}
                onConnect={() => open()}
                onDisconnect={() => disconnect()}
                onHome={() => {
                  setIsBrowsing(false);
                  setIsIframeLoading(false);
                }}
                onLeaderboard={onLeaderboard}
                onWidgetBuilder={onWidgetBuilder}
            />
        </div>

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
            <div className="py-12 md:py-20 text-center space-y-6 mt-[10px]">
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
                        className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-slate-600 text-sm md:text-lg h-12 min-w-0"
                    />
                    <button 
                        onClick={() => handleBrowseUrl(urlInput)}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 h-12 rounded-xl font-bold uppercase tracking-wide transition-all shrink-0"
                    >
                        Go
                    </button>
                </div>
                
                {/* Scrolling Badges */}
                <div className="absolute top-full left-0 w-full pt-6 overflow-hidden">
                    <div 
                        ref={scrollRef}
                        className="flex gap-2 overflow-x-hidden whitespace-nowrap scrollbar-hide cursor-grab active:cursor-grabbing pb-4 px-1"
                        onMouseDown={handleMouseDown}
                        onMouseLeave={handleMouseLeave}
                        onMouseUp={handleMouseUp}
                        onMouseMove={handleMouseMove}
                    >
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
                                onClick={() => handleBadgeClick(badge)}
                                className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-white/5 border border-white/10 text-slate-300 text-xs font-bold uppercase tracking-wider hover:bg-white/10 hover:text-white hover:border-white/20 transition-all cursor-pointer backdrop-blur-sm min-w-[120px] justify-center shrink-0 select-none"
                            >
                                <img 
                                    src={`https://www.google.com/s2/favicons?domain=${badge.name.toLowerCase()}.com&sz=32`}
                                    alt={badge.name}
                                    className="w-4 h-4 rounded-full pointer-events-none"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                        (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                    }}
                                />
                                <span className="hidden">{badge.icon}</span>
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
                    isOnline={isProjectOnline(project)}
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
      <GlobalFooter />
      </div>
    </div>
  );
};

export default QuestBrowse;
