import React, { useEffect, useRef, useState } from 'react';
import { fetchAllProjects, fetchProjectStats, fetchProjectDetails, fetchUserXP } from '../lib/supabase';
import { Globe, ArrowRight, Loader2, Search, Zap, ChevronLeft, ChevronRight, X, Layout, Sparkles, BadgeCheck, Sword, Info, Coins, ClipboardCheck } from 'lucide-react';
import Widget from './Widget';
import ProfileMenuButton from './ProfileMenuButton';
import UnifiedHeader from './UnifiedHeader';
import GlobalFooter from './GlobalFooter';
import { INITIAL_TASKS, SPONSORED_TASKS, THEMES, STORE_SLIDING_LINKS } from '../constants';
import { AppState, Position, ThemeType, Task } from '../types';
import { useAppKit, useAppKitAccount, useDisconnect } from '@reown/appkit/react';
import { calculateXpForLevel } from '../lib/gamification';

interface QuestBrowseProps {
  onBack: () => void;
  onLeaderboard: () => void;
  onWidgetBuilder?: () => void;
  onSubmitProject?: () => void;
  onProjectDetails?: (projectId: string) => void;
  initialBrowseRequest?: { projectId?: string; url?: string } | null;
  onBrowseHandled?: () => void;
}

const DEFAULT_WIDGET_STATE: AppState = {
  projectName: 'Quest Store',
  accentColor: '#6366f1',
  position: 'free-form',
  activeTheme: 'sleek',
  widgetSize: 'medium',
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

const getFaviconUrl = (link: string) => {
  try {
    if (!link || link.length < 4) return '';
    let validLink = link.trim();
    // Remove trailing slashes and dots
    validLink = validLink.replace(/[\/.]+$/, '');
    if (!validLink.startsWith('http://') && !validLink.startsWith('https://')) {
      validLink = `https://${validLink}`;
    }
    const url = new URL(validLink);
    let hostname = url.hostname;
    // Remove trailing dot if exists
    if (hostname.endsWith('.')) hostname = hostname.slice(0, -1);
    const parts = hostname.split('.');
    if (parts.length < 2 || parts[parts.length - 1].length < 2) return '';

    // Use Google's s2 API which returns a default icon instead of 404 when not found
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`;
  } catch {
    return '';
  }
};

const pickRandomTasks = (tasks: Task[], count: number, rng: () => number) => {
  const pool = [...tasks];
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.min(count, pool.length));
};

const BadgeWithTooltip: React.FC<{
  children: React.ReactNode;
  tooltipText: React.ReactNode;
}> = ({ children, tooltipText }) => {
  return (
    <div
      className="relative flex items-center z-30 group/tooltip"
      onClick={(e) => e.stopPropagation()}
    >
      {children}
      <div className="hidden group-hover/tooltip:block absolute top-full right-0 mt-2 w-40 p-2 bg-slate-950/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl z-[100] text-[10px] leading-snug text-slate-300 font-medium animate-in fade-in zoom-in-95 duration-200 text-left pointer-events-none select-none">
        {tooltipText}
        <div className="absolute -top-1 right-3 w-2 h-2 bg-slate-950/95 border-t border-l border-white/10 rotate-45 transform" />
      </div>
    </div>
  );
};

const BrowseCard: React.FC<{
  project: any;
  stats: any;
  isOnline: boolean;
  onOpen: () => void;
  onDetails: () => void;
  onImageError: (id: string) => void;
  cachedImage?: string | null;
  onImageLoad: (id: string, url: string) => void;
}> = ({ project, stats, isOnline, onOpen, onDetails, onImageError, cachedImage, onImageLoad }) => {
  const [ogImage, setOgImage] = useState<string | null>(cachedImage || null);
  const isDev = (import.meta as any).env?.DEV ?? false;

  useEffect(() => {
    if (cachedImage) {
      setOgImage(cachedImage);
      return;
    }

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
            onImageLoad(project.id, data.image);
          } else if (isDev) {
            const fallbackImage = getFaviconUrl(project.domain);
            if (fallbackImage) {
              setOgImage(fallbackImage);
              onImageLoad(project.id, fallbackImage);
            } else {
              onImageError(project.id);
            }
          } else {
            onImageError(project.id);
          }
        }
      } catch (e) {
        if (isMounted) {
          if (isDev) {
            const fallbackImage = getFaviconUrl(project.domain);
            if (fallbackImage) {
              setOgImage(fallbackImage);
              onImageLoad(project.id, fallbackImage);
            } else {
              onImageError(project.id);
            }
          } else {
            onImageError(project.id);
          }
        }
      }
    };

    fetchOg();
    return () => { isMounted = false; };
  }, [project.domain, project.id, onImageError, cachedImage, onImageLoad]);

  const fallbackAccent = project.accent_color || '#6366f1';
  const fallbackLabel = (project.name || 'QL').slice(0, 2).toUpperCase();
  const rewardBadge = (typeof stats?.reward_xp === 'number' || typeof stats?.total_xp === 'number')
    ? `Rewards: ${stats?.reward_xp ?? stats?.total_xp} XP`
    : 'Rewards · Multi-chain';
  const lastCheckedLabel = project.last_ping_at
    ? new Date(project.last_ping_at).toLocaleString('en-US')
    : 'Not checked yet';
  const requirementsCount = (typeof stats?.requirements === 'number')
    ? stats.requirements
    : null;

  return (
    <div
      className="group relative rounded-3xl border border-white/10 bg-slate-900/40 overflow-hidden transition-all duration-500 hover:bg-slate-900 hover:border-indigo-500/50 hover:shadow-[0_0_40px_rgba(99,102,241,0.15)] flex flex-col h-full hover:-translate-y-1"
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

        <div className="absolute top-4 right-4 flex gap-2 items-end">
          {project.last_ping_at && (
            <BadgeWithTooltip
              tooltipText={
                <div className="flex flex-col gap-1">
                  <span>Auto-verified: Embedded & active on the website.</span>
                  <span className="text-[9px] text-slate-400">Last checked: {lastCheckedLabel}</span>
                </div>
              }
            >
              <div className="px-2 py-1 rounded-lg bg-blue-500/20 backdrop-blur-md border border-blue-500/30 text-[10px] font-black text-blue-300 uppercase shadow-sm flex items-center gap-1.5">
                <BadgeCheck size={12} className="text-blue-400" />
                Verified
              </div>
            </BadgeWithTooltip>
          )}
          {isOnline && (
            <BadgeWithTooltip tooltipText="This project is currently active and running.">
              <div className="px-2 py-1 rounded-lg bg-emerald-500/20 backdrop-blur-md border border-emerald-500/30 text-[10px] font-black text-emerald-300 uppercase shadow-sm flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                </span>
                Online
              </div>
            </BadgeWithTooltip>
          )}
        </div>

        <div
          className="absolute -bottom-6 left-6 w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-xl z-20 border-4 border-slate-900 transition-transform group-hover:scale-110 duration-300 overflow-hidden"
          style={{
            backgroundColor: (project.logo_url || getFaviconUrl(project.domain)) ? 'transparent' : project.accent_color
          }}
        >
          {(project.logo_url || getFaviconUrl(project.domain)) ? (
            <img
              src={project.logo_url || getFaviconUrl(project.domain)}
              alt={project.name}
              className="w-full h-full object-cover"
              onLoad={(e) => {
                const img = e.target as HTMLImageElement;
                if (img.naturalWidth < 32) {
                  img.style.display = 'none';
                  const zapIcon = img.nextElementSibling as HTMLElement;
                  if (zapIcon) zapIcon.style.display = 'flex';
                  const parent = img.parentElement;
                  if (parent) parent.style.backgroundColor = project.accent_color;
                }
              }}
              onError={(e) => {
                const img = e.target as HTMLImageElement;
                img.style.display = 'none';
                const zapIcon = img.nextElementSibling as HTMLElement;
                if (zapIcon) zapIcon.style.display = 'flex';
                const parent = img.parentElement;
                if (parent) parent.style.backgroundColor = project.accent_color;
              }}
            />
          ) : null}
          <div
            style={{ display: (project.logo_url || getFaviconUrl(project.domain)) ? 'none' : 'flex' }}
            className="items-center justify-center w-full h-full"
          >
            <Zap size={24} fill="currentColor" />
          </div>
        </div>
      </div>

      <div className="p-6 pt-10 flex-1 flex flex-col">
        <h3 className="text-xl font-black text-white mb-2 truncate group-hover:text-indigo-400 transition-colors tracking-tight">
          {project.name}
        </h3>

        {project.domain && (
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-4 truncate">
            <Globe size={12} className="shrink-0 text-indigo-500" />
            <a
              href={project.domain.startsWith('http') ? project.domain : `https://${project.domain}`}
              target="_blank"
              rel="noreferrer"
              className="truncate group-hover:text-indigo-300 transition-colors font-medium hover:text-indigo-200"
              onClick={(e) => e.stopPropagation()}
            >
              {project.domain.replace(/^https?:\/\//, '')}
            </a>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="px-2 py-1 rounded-lg bg-slate-800/60 border border-white/10 text-[9px] font-black uppercase tracking-widest text-slate-200">
            <span className="inline-flex items-center gap-1.5">
              <Coins size={12} className="text-amber-300" />
              {rewardBadge}
            </span>
          </span>
          {requirementsCount !== null && (
            <span className="px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-black uppercase tracking-widest text-emerald-200">
              <span className="inline-flex items-center gap-1.5">
                <ClipboardCheck size={12} className="text-emerald-200" />
                Requirements: {requirementsCount}
              </span>
            </span>
          )}
        </div>

        <div className="mt-auto flex gap-2">
          <button
            onClick={onOpen}
            className="group flex-1 px-3 py-2 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-widest shadow-[0_0_20px_rgba(251,191,36,0.45)] hover:brightness-110 transition-all relative overflow-hidden"
          >
            <span className="absolute inset-0 translate-x-[-120%] group-hover:translate-x-[120%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/70 to-transparent opacity-80" />
            <span className="relative inline-flex items-center gap-2 font-extrabold">
              <Sword size={12} className="text-slate-950" />
              Start Quest
            </span>
          </button>
          <button
            onClick={onDetails}
            className="flex-1 px-3 py-2 rounded-xl border border-white/10 text-white/80 text-[10px] font-black uppercase tracking-widest hover:text-white hover:border-white/20 transition-colors"
          >
            <span className="inline-flex items-center gap-2">
              <Info size={12} />
              Details
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

const QuestBrowse: React.FC<QuestBrowseProps> = ({ onBack, onLeaderboard, onWidgetBuilder, onSubmitProject, onProjectDetails, initialBrowseRequest, onBrowseHandled }) => {
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
        // Calculate XP needed for next level based on dynamic formula
        setNextLevelXP(calculateXpForLevel(stats.level + 1));
      }
    };
    loadUserStats();
  }, [address]);

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [browseFilter, setBrowseFilter] = useState<'trending' | 'new' | 'verified'>('trending');
  const [urlInput, setUrlInput] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [invalidImages, setInvalidImages] = useState<Set<string>>(new Set());
  const [ogImageCache, setOgImageCache] = useState<Record<string, string>>({});
  const [featuredImages, setFeaturedImages] = useState<Record<string, string>>({});
  const isDev = (import.meta as any).env?.DEV ?? false;
  const NEW_WIDGET_WINDOW_MS = 1000 * 60 * 60 * 24 * 30;
  const TRENDING_COOLDOWN_MS = 1000 * 60 * 60 * 12;

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
            // Sort by Online status first (24h window)
            const isOnlineA = a.last_ping_at && (new Date(a.last_ping_at).getTime() > Date.now() - 24 * 60 * 60 * 1000);
            const isOnlineB = b.last_ping_at && (new Date(b.last_ping_at).getTime() > Date.now() - 24 * 60 * 60 * 1000);
            if (isOnlineA !== isOnlineB) return isOnlineA ? -1 : 1;

            // Then by Verified status (ever had a ping)
            const isVerifiedA = !!a.last_ping_at;
            const isVerifiedB = !!b.last_ping_at;
            if (isVerifiedA !== isVerifiedB) return isVerifiedA ? -1 : 1;

            // Then by visits
            const visitsA = a.stats?.total_visits || 0;
            const visitsB = b.stats?.total_visits || 0;
            if (visitsA !== visitsB) return visitsB - visitsA;

            // Then by creation date (newest first)
            const createdA = a.created_at ? new Date(a.created_at).getTime() : 0;
            const createdB = b.created_at ? new Date(b.created_at).getTime() : 0;
            return createdB - createdA;
          });

          const normalize = (d: string) => {
            try {
              const url = d.trim().startsWith('http') ? d.trim() : `https://${d.trim()}`;
              return new URL(url).hostname.replace(/^www\./, '').toLowerCase();
            } catch {
              return d.toLowerCase();
            }
          };

          const byDomain = new Map<string, any>();
          sortedProjects.forEach(project => {
            if (!project.domain) return;
            const domain = normalize(project.domain);
            const existing = byDomain.get(domain);
            if (!existing) {
              byDomain.set(domain, project);
              return;
            }

            const existingOnline = existing.last_ping_at
              ? new Date(existing.last_ping_at).getTime() > Date.now() - 24 * 60 * 60 * 1000
              : false;
            const candidateOnline = project.last_ping_at
              ? new Date(project.last_ping_at).getTime() > Date.now() - 24 * 60 * 60 * 1000
              : false;

            if (candidateOnline && !existingOnline) {
              byDomain.set(domain, project);
              return;
            }

            if (candidateOnline === existingOnline) {
              const existingVisits = existing.stats?.total_visits || 0;
              const candidateVisits = project.stats?.total_visits || 0;
              if (candidateVisits > existingVisits) {
                byDomain.set(domain, project);
              }
            }
          });

          setProjects(Array.from(byDomain.values()));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    let isMounted = true;
    const fetchFeaturedImages = async () => {
      const candidates = STORE_SLIDING_LINKS
        .filter((link) => link.domain && !featuredImages[link.domain]);
      if (candidates.length === 0) return;

      const projectImageByDomain = new Map<string, string>();
      projects.forEach((project) => {
        if (!project?.domain) return;
        const key = normalizeDomain(project.domain);
        const image = project.banner_url || project.logo_url;
        if (key && image) projectImageByDomain.set(key, image);
      });

      const results = await Promise.all(
        candidates.map(async (link) => {
          try {
            const key = normalizeDomain(link.domain);
            const projectImage = key ? projectImageByDomain.get(key) : null;
            const isFavicon = projectImage?.includes('favicon');
            const target = link.domain.startsWith('http')
              ? link.domain
              : `https://${link.domain}`;
            const url = `/api/og?url=${encodeURIComponent(target)}`;
            const res = await fetch(url);
            const data = await res.json();
            if (data?.image && !isFavicon) return { id: link.domain, image: data.image };
            if (data?.image && isFavicon) return { id: link.domain, image: data.image };
            if (projectImage) return { id: link.domain, image: projectImage };
            if (isDev) {
              return { id: link.domain, image: `https://www.google.com/s2/favicons?domain=${link.domain}&sz=256` };
            }
            return null;
          } catch {
            if (isDev && link.domain) {
              return { id: link.domain, image: `https://www.google.com/s2/favicons?domain=${link.domain}&sz=256` };
            }
            if (projectImageByDomain.has(normalizeDomain(link.domain))) {
              return { id: link.domain, image: projectImageByDomain.get(normalizeDomain(link.domain))! };
            }
            return null;
          }
        })
      );

      if (!isMounted) return;
      const updates = results.reduce<Record<string, string>>((acc, item) => {
        if (item?.image) acc[item.id] = item.image;
        return acc;
      }, {});

      if (Object.keys(updates).length > 0) {
        setFeaturedImages((prev) => ({ ...prev, ...updates }));
      }
    };

    if (STORE_SLIDING_LINKS.length > 0) {
      void fetchFeaturedImages();
    }

    return () => {
      isMounted = false;
    };
  }, [featuredImages, isDev, projects]);

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
      projectName: normalizedDomain || 'Quest Store',
      projectDomain: url,
      accentColor: nextAccent,
      activeTheme: nextTheme,
      tasks: fallbackTasks
    };
  };

  const handleBrowseUrl = (url: string, updateUrl = true) => {
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
    if (updateUrl && typeof window !== 'undefined') {
      const query = normalized || validUrl.replace(/^https?:\/\//, '');
      window.history.pushState(null, '', `/browse?url=${encodeURIComponent(query)}`);
    }
    iframeLoadTimeoutRef.current = setTimeout(() => {
      setIframeBlocked(true);
      setIsIframeLoading(false);
      setIsWidgetOpen(false);
    }, 6000);
  };

  const handleSearchOrSubmit = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    const isLikelyUrl = trimmed.startsWith('http://')
      || trimmed.startsWith('https://')
      || trimmed.includes('.');
    if (!isLikelyUrl) {
      setSearchTerm(trimmed);
      return;
    }
    const normalized = normalizeDomain(trimmed);
    if (normalized) {
      const matchedIndex = projects.findIndex(project => normalizeDomain(project.domain || '') === normalized);
      if (matchedIndex !== -1) {
        setCurrentProjectIndex(matchedIndex);
        void handleBrowseProjectById(projects[matchedIndex].id, projects[matchedIndex].domain);
        return;
      }
    }
    if (onSubmitProject) {
      onSubmitProject();
      return;
    }
    handleBrowseUrl(trimmed, true);
  };

  const handleBrowseProjectById = async (projectId: string, domain?: string, updateUrl = true) => {
    setIsIframeLoading(true);
    if (iframeLoadTimeoutRef.current) {
      clearTimeout(iframeLoadTimeoutRef.current);
    }
    setIframeBlocked(false);
    try {
      const { project, tasks } = await fetchProjectDetails(projectId);
      if (!project) return;
      const resolvedPosition = project.position === 'free-form'
        ? 'bottom-right'
        : (project.position as Position);
      const newState: AppState = {
        projectId: project.id,
        projectName: project.name,
        projectDomain: project.domain,
        accentColor: project.accent_color,
        position: resolvedPosition,
        activeTheme: project.theme as ThemeType,
        widgetSize: project.widget_size ?? 'medium',
        tasks: tasks.map((t: any) => ({
          id: t.id,
          title: t.title,
          desc: t.description,
          link: t.link,
          icon: t.icon_url,
          xp: t.xp_reward,
          isSponsored: t.is_sponsored,
          section: t.task_section ?? 'missions',
          kind: (t.task_kind === 'secret' ? 'quiz' : (t.task_kind ?? 'link')),
          rewardCadence: t.reward_cadence ?? 'once',
          quizType: t.quiz_type ?? 'secret_code',
          choices: t.choices ?? undefined,
          correctChoice: typeof t.correct_choice === 'number' ? t.correct_choice : undefined,
          question: t.question ?? '',
          answer: t.answer ?? '',
          nftContract: t.nft_contract ?? '',
          nftChainId: t.nft_chain_id ?? undefined,
          tokenContract: t.token_contract ?? '',
          tokenChainId: t.token_chain_id ?? undefined,
          minTokenAmount: t.min_token_amount ?? '1'
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
        if (updateUrl && typeof window !== 'undefined') {
          const normalized = normalizeDomain(url);
          const query = normalized || url.replace(/^https?:\/\//, '');
          window.history.pushState(null, '', `/browse?url=${encodeURIComponent(query)}`);
        }
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
        handleBrowseUrl(domain, updateUrl);
      }
    }
  };

  const [currentProjectIndex, setCurrentProjectIndex] = useState<number>(-1);

  const scrollRef = React.useRef<HTMLDivElement>(null);
  const featureScrollRef = React.useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [isFeatureDragging, setIsFeatureDragging] = useState(false);
  const featureDraggingRef = useRef(false);
  const featureDragDistance = useRef(0);
  const featureLastDragAt = useRef(0);
  const [featureStartX, setFeatureStartX] = useState(0);
  const [featureScrollLeft, setFeatureScrollLeft] = useState(0);

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

  const handleFeaturePointerDown = (e: React.PointerEvent) => {
    if (!featureScrollRef.current || e.pointerType !== 'touch') return;
    setIsFeatureDragging(true);
    featureDraggingRef.current = true;
    featureDragDistance.current = 0;
    featureScrollRef.current.setPointerCapture(e.pointerId);
    setFeatureStartX(e.clientX);
    setFeatureScrollLeft(featureScrollRef.current.scrollLeft);
  };

  const handleFeaturePointerMove = (e: React.PointerEvent) => {
    if (!isFeatureDragging || !featureScrollRef.current || e.pointerType !== 'touch') return;
    featureDragDistance.current = Math.max(featureDragDistance.current, Math.abs(e.clientX - featureStartX));
    featureLastDragAt.current = Date.now();
    const walk = (e.clientX - featureStartX) * 1.5;
    featureScrollRef.current.scrollLeft = featureScrollLeft - walk;
  };

  const handleFeaturePointerUp = (e: React.PointerEvent) => {
    if (!featureScrollRef.current || e.pointerType !== 'touch') return;
    setIsFeatureDragging(false);
    featureDraggingRef.current = false;
    featureScrollRef.current.releasePointerCapture(e.pointerId);
  };

  const handleBadgeClick = (badge: { domain: string }) => {
    if (isDragging) return;
    const normalized = normalizeDomain(badge.domain);
    const matched = projects.find(project => normalizeDomain(project.domain || '') === normalized);
    if (matched?.id && onProjectDetails) {
      onProjectDetails(matched.id);
      return;
    }
    handleBrowseUrl(badge.domain);
  };

  const getProjectIdByDomain = (domain: string) => {
    const normalized = normalizeDomain(domain);
    const matched = projects.find(project => normalizeDomain(project.domain || '') === normalized);
    return matched?.id || null;
  };

  // ... rest of component
  const handleProjectClick = async (project: any) => {
    if (!project.domain) return;

    // Find index in projects array for navigation
    const index = projects.findIndex(p => p.id === project.id);
    setCurrentProjectIndex(index);

    // ... (rest of function)
    try {
      void handleBrowseProjectById(project.id, project.domain, true);
    } catch (e) {
      console.error("Failed to load project details", e);
      // Fallback to basic info if tasks fail
      handleBrowseUrl(project.domain);
    }
  };

  const isProjectOnline = (project: any) => {
    if (!project.last_ping_at) return false;
    const lastPing = new Date(project.last_ping_at).getTime();
    return lastPing > Date.now() - 24 * 60 * 60 * 1000;
  };

  const isNewProject = (project: any) => {
    if (!project.created_at) return false;
    const createdAt = new Date(project.created_at).getTime();
    return createdAt >= Date.now() - NEW_WIDGET_WINDOW_MS;
  };

  const hashSeed = (value: string) => {
    let hash = 2166136261;
    for (let i = 0; i < value.length; i += 1) {
      hash ^= value.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  };

  const mulberry32 = (seed: number) => {
    return () => {
      let t = (seed += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  const shuffleWithSeed = (list: any[], seedKey: string) => {
    const result = [...list];
    const rand = mulberry32(hashSeed(seedKey));
    for (let i = result.length - 1; i > 0; i -= 1) {
      const j = Math.floor(rand() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  };

  const getCooldownMap = () => {
    if (typeof window === 'undefined') return {} as Record<string, number>;
    try {
      const raw = window.localStorage.getItem('questlayer_trending_cooldown');
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return typeof parsed === 'object' && parsed ? parsed : {};
    } catch {
      return {};
    }
  };

  const setCooldownMap = (map: Record<string, number>) => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem('questlayer_trending_cooldown', JSON.stringify(map));
    } catch {
      // Ignore storage errors to avoid breaking browsing.
    }
  };

  const applyCooldown = (list: any[]) => {
    const now = Date.now();
    const cooldownMap = getCooldownMap();
    const active = new Set(
      Object.entries(cooldownMap)
        .filter(([, ts]) => typeof ts === 'number' && now - ts < TRENDING_COOLDOWN_MS)
        .map(([id]) => id)
    );
    if (active.size === 0) return list;
    const fresh: any[] = [];
    const cooled: any[] = [];
    list.forEach((project) => {
      const key = String(project.id ?? '');
      if (key && active.has(key)) {
        cooled.push(project);
      } else {
        fresh.push(project);
      }
    });
    return [...fresh, ...cooled];
  };

  const recordTrendingShown = (list: any[]) => {
    if (typeof window === 'undefined') return;
    const now = Date.now();
    const next = getCooldownMap();
    list.forEach((project) => {
      if (project?.id == null) return;
      next[String(project.id)] = now;
    });
    setCooldownMap(next);
  };

  const getTrendingPage = (list: any[], page: number, perPage: number) => {
    if (list.length === 0) return [];
    const cooledList = applyCooldown(list);
    const start = (page - 1) * perPage;
    const end = Math.min(start + perPage, list.length);
    const primary = cooledList.slice(start, end);
    if (primary.length <= 1) return primary;

    const exploreCount = Math.max(1, Math.round(primary.length * 0.2));
    const explorePool = cooledList.slice(end);
    if (explorePool.length === 0) return primary;

    const dayKey = new Date().toISOString().slice(0, 10);
    const shuffledExplore = shuffleWithSeed(explorePool, `${dayKey}-trending-${page}`);
    const explorePick = shuffledExplore.slice(0, exploreCount);

    const next = [...primary];
    for (let i = 0; i < explorePick.length; i += 1) {
      const replaceIndex = next.length - 1 - i;
      if (replaceIndex < 0) break;
      next[replaceIndex] = explorePick[i];
    }
    return next;
  };

  const filteredProjects = projects
    .filter(p =>
      p.domain && (
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.domain.toLowerCase().includes(searchTerm.toLowerCase())
      )
    )
    .filter(p => (browseFilter === 'new' ? isNewProject(p) : true))
    .filter(p => (browseFilter === 'verified' ? !!p.last_ping_at : true))
    .sort((a, b) => {
      if (browseFilter === 'new') {
        const aCreated = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bCreated = b.created_at ? new Date(b.created_at).getTime() : 0;
        if (aCreated !== bCreated) return bCreated - aCreated;
        return (a.name || '').localeCompare(b.name || '');
      }

      if (browseFilter === 'verified') {
        const aOnline = isProjectOnline(a);
        const bOnline = isProjectOnline(b);
        if (aOnline !== bOnline) return aOnline ? -1 : 1;
        const isVerifiedA = !!a.last_ping_at;
        const isVerifiedB = !!b.last_ping_at;
        if (isVerifiedA !== isVerifiedB) return isVerifiedA ? -1 : 1;
        const visitsA = a.stats?.total_visits || 0;
        const visitsB = b.stats?.total_visits || 0;
        if (visitsA !== visitsB) return visitsB - visitsA;
      }

      const aOnline = isProjectOnline(a);
      const bOnline = isProjectOnline(b);
      if (aOnline !== bOnline) return aOnline ? -1 : 1;
      const isVerifiedA = !!a.last_ping_at;
      const isVerifiedB = !!b.last_ping_at;
      if (isVerifiedA !== isVerifiedB) return isVerifiedA ? -1 : 1;
      const visitsA = a.stats?.total_visits || 0;
      const visitsB = b.stats?.total_visits || 0;
      if (visitsA !== visitsB) return visitsB - visitsA;
      const aPing = a.last_ping_at ? new Date(a.last_ping_at).getTime() : 0;
      const bPing = b.last_ping_at ? new Date(b.last_ping_at).getTime() : 0;
      if (aPing !== bPing) return bPing - aPing;
      return (a.name || '').localeCompare(b.name || '');
    });

  const totalPages = Math.ceil(filteredProjects.length / ITEMS_PER_PAGE);
  const paginatedProjects = browseFilter === 'trending'
    ? getTrendingPage(filteredProjects, currentPage, ITEMS_PER_PAGE)
    : filteredProjects.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE
    );

  useEffect(() => {
    if (browseFilter !== 'trending') return;
    if (paginatedProjects.length === 0) return;
    recordTrendingShown(paginatedProjects);
  }, [browseFilter, paginatedProjects]);
  const currentProjectOnline = currentProjectIndex >= 0 && projects[currentProjectIndex]
    ? isProjectOnline(projects[currentProjectIndex])
    : false;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, browseFilter]);

  useEffect(() => {
    if (!initialBrowseRequest) return;
    setIsBrowsing(true);
    setIsIframeLoading(true);
    if (initialBrowseRequest.projectId) {
      void handleBrowseProjectById(initialBrowseRequest.projectId, initialBrowseRequest.url, false);
    } else if (initialBrowseRequest.url) {
      handleBrowseUrl(initialBrowseRequest.url, false);
    }
    onBrowseHandled?.();
  }, [initialBrowseRequest]);

  useEffect(() => {
    if (typeof window === 'undefined' || projects.length === 0) return;
    const params = new URLSearchParams(window.location.search);
    const urlParam = params.get('url');
    if (!urlParam) return;
    const normalized = normalizeDomain(urlParam);
    const matchedIndex = projects.findIndex(project => normalizeDomain(project.domain || '') === normalized);
    if (matchedIndex !== -1) {
      setCurrentProjectIndex(matchedIndex);
      void handleBrowseProjectById(projects[matchedIndex].id, projects[matchedIndex].domain, false);
    } else {
      handleBrowseUrl(urlParam, false);
    }
  }, [projects]);

  useEffect(() => {
    return () => {
      if (iframeLoadTimeoutRef.current) {
        clearTimeout(iframeLoadTimeoutRef.current);
      }
    };
  }, []);

  if (isBrowsing) {
    return (
      <div
        className="fixed inset-0 z-50 bg-slate-950 flex flex-col"
        style={{ '--questlayer-top-offset': '64px' } as React.CSSProperties}
      >
        {/* Browser Header */}
        <div className="sticky top-0 z-50 h-16 bg-gradient-to-r from-slate-950/95 via-slate-900/90 to-slate-950/95 border-b border-white/10 flex items-center px-4 shrink-0 backdrop-blur-xl shadow-[0_12px_30px_rgba(0,0,0,0.4)] relative">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-400/50 to-transparent" />
          <div className="pointer-events-none absolute inset-x-8 bottom-0 h-px bg-gradient-to-r from-transparent via-purple-400/40 to-transparent" />
          <div className="flex-1 relative flex items-center gap-4">
            <div className="flex-1 relative">
              <div className="absolute left-1.5 top-1/2 -translate-y-1/2 flex items-center">
                <button
                  onClick={() => setIsBrowsing(false)}
                  className="p-2 rounded-full text-slate-400 hover:text-white transition-colors"
                >
                  <X size={14} />
                </button>
                <div className="h-5 w-px bg-white/10 mx-1.5" />
              </div>
              <div className="absolute left-11 top-1/2 -translate-y-1/2 text-slate-500 hidden sm:block">
                <Globe size={14} />
              </div>
              <input
                value={currentUrl}
                onChange={(e) => setCurrentUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchOrSubmit(currentUrl)}
                onPaste={(e) => {
                  const pasted = e.clipboardData.getData('text');
                  if (!pasted) return;
                  e.preventDefault();
                  setCurrentUrl(pasted);
                  handleSearchOrSubmit(pasted);
                }}
                className="w-full bg-slate-950/70 border border-white/10 rounded-full py-2 pl-16 sm:pl-20 pr-28 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-indigo-400/60 focus:shadow-[0_0_0_1px_rgba(99,102,241,0.35)] font-mono"
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
        </div>

        {/* Browser Content */}
        <div className="flex-1 relative bg-white">
          <iframe
            ref={iframeRef}
            src={currentUrl}
            className="w-full h-full border-none"
            title="Quest Store"
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
                        Quest Store
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
                          1. Visit Store
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
                      Keep Exploring
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
              isPreview={!widgetState.projectId} // Sync when projectId is known
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
          @keyframes ql-marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          @keyframes ql-flicker {
            0%, 100% { opacity: 1; }
            10% { opacity: 0.85; }
            12% { opacity: 0.6; }
            16% { opacity: 1; }
            24% { opacity: 0.9; }
            26% { opacity: 1; }
            44% { opacity: 0.8; }
            46% { opacity: 1; }
            70% { opacity: 0.9; }
          }
          @keyframes ql-scanline {
            0% { transform: translateY(-120%); opacity: 0; }
            10% { opacity: 0.4; }
            50% { opacity: 0.35; }
            100% { transform: translateY(140%); opacity: 0; }
          }
          @keyframes ql-pixel-jitter {
            0% { transform: translate(0, 0); }
            20% { transform: translate(-0.5px, 0.5px); }
            40% { transform: translate(0.5px, -0.5px); }
            60% { transform: translate(-0.5px, -0.5px); }
            80% { transform: translate(0.5px, 0.5px); }
            100% { transform: translate(0, 0); }
          }
          @keyframes ql-title-float {
            0%, 100% { transform: translateY(0); color: #94a3b8; }
            50% { transform: translateY(-2px); color: #c7d2fe; }
          }
          @keyframes ql-title-arrow {
            0%, 100% { transform: translate(-50%, 0); opacity: 0.7; }
            50% { transform: translate(-50%, 2px); opacity: 1; }
          }
          .ql-browse-word {
            display: inline-block;
            animation: ql-title-float 2.6s ease-in-out infinite;
            position: relative;
            padding-bottom: 8px;
          }
          .ql-browse-word::after {
            content: '';
            position: absolute;
            left: 50%;
            bottom: 0;
            width: 0;
            height: 0;
            border-left: 4px solid transparent;
            border-right: 4px solid transparent;
            border-top: 6px solid rgba(199, 210, 254, 0.85);
            animation: ql-title-arrow 2.6s ease-in-out infinite;
          }
        `}
      </style>

      {/* Content */}
      <div className="flex-1 relative">
        {/* Unified Sticky Header */}
        <UnifiedHeader
          onBack={onBack}
          onHome={() => {
            setIsBrowsing(false);
            setIsIframeLoading(false);
          }}
          isConnected={isConnected}
          address={address}
          userStats={userStats}
          nextLevelXP={nextLevelXP}
          onConnect={() => open()}
          onDisconnect={() => disconnect()}
          onLeaderboard={onLeaderboard}
          onWidgetBuilder={onWidgetBuilder}
          onSubmitProject={onSubmitProject}
        />

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
                <div className="mb-3 text-[10px] md:text-xs font-black uppercase tracking-[0.35em] text-indigo-300/70">
                  Live Experiences
                </div>
                <h1 className="text-3xl md:text-6xl font-black text-white uppercase tracking-tight mb-4 drop-shadow-2xl">
                  Explore the <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Web3 Store</span>
                </h1>
                <p className="text-slate-300 text-xs md:text-lg font-medium max-w-lg mx-auto leading-relaxed drop-shadow-lg">
                  Discover decentralized ecosystems, earn XP, and unlock rewards simply by exploring your favorite protocols.
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
                    placeholder="Search or paste URL"
                    value={urlInput}
                    onChange={(e) => {
                      setUrlInput(e.target.value);
                      setSearchTerm(e.target.value);
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchOrSubmit(urlInput)}
                    onPaste={(e) => {
                      const pasted = e.clipboardData.getData('text');
                      if (!pasted) return;
                      e.preventDefault();
                      setUrlInput(pasted);
                      setSearchTerm(pasted);
                      handleSearchOrSubmit(pasted);
                    }}
                    className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-slate-600 text-sm md:text-lg h-12 min-w-0"
                  />
                  <button
                    onClick={() => handleSearchOrSubmit(urlInput)}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 h-12 rounded-xl font-bold uppercase tracking-wide transition-all shrink-0"
                  >
                    Go
                  </button>
                </div>

                {/* Scrolling Badges */}
                <div className="absolute top-full left-0 w-full pt-6 overflow-hidden">
                  <div
                    ref={scrollRef}
                    className="flex gap-2 overflow-x-auto whitespace-nowrap scrollbar-hide pb-4 px-1"
                  >
                    {STORE_SLIDING_LINKS.concat(STORE_SLIDING_LINKS).map((badge, i) => {
                      const projectId = getProjectIdByDomain(badge.domain);
                      const href = projectId ? `/store/${projectId}` : '/browse';
                      return (
                        <a
                          key={i}
                          href={href}
                          onClick={(e) => {
                            if (isDragging) {
                              e.preventDefault();
                              return;
                            }
                            if (projectId && onProjectDetails) {
                              e.preventDefault();
                              onProjectDetails(projectId);
                              return;
                            }
                            if (!projectId) {
                              e.preventDefault();
                              handleBrowseUrl(badge.domain);
                            }
                          }}
                          className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-white/5 border border-white/10 text-slate-300 text-xs font-bold uppercase tracking-wider hover:bg-white/10 hover:text-white hover:border-white/20 transition-all cursor-pointer backdrop-blur-sm min-w-[120px] justify-center shrink-0 select-none"
                        >
                          <img
                            src={`https://www.google.com/s2/favicons?domain=${badge.domain}&sz=32`}
                            alt={badge.name}
                            className="w-4 h-4 rounded-full pointer-events-none"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                              (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                          <span className="hidden">{badge.name.slice(0, 2).toUpperCase()}</span>
                          {badge.name}
                        </a>
                      );
                    })}
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
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-2 p-1 bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm">
                    <button
                      onClick={() => setBrowseFilter('trending')}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${browseFilter === 'trending'
                          ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                      Trending
                    </button>
                    <button
                      onClick={() => setBrowseFilter('verified')}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-1.5 ${browseFilter === 'verified'
                          ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                      <BadgeCheck size={12} />
                      Verified
                    </button>
                    <button
                      onClick={() => setBrowseFilter('new')}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${browseFilter === 'new'
                          ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                      New
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {paginatedProjects.map((project) => (
                    <BrowseCard
                      key={project.id}
                      project={project}
                      stats={project.stats}
                      isOnline={isProjectOnline(project)}
                      onOpen={() => handleProjectClick(project)}
                      onDetails={() => onProjectDetails?.(project.id)}
                      onImageError={handleImageError}
                      cachedImage={ogImageCache[project.id] || project.banner_url}
                      onImageLoad={(id, url) => setOgImageCache(prev => ({ ...prev, [id]: url }))}
                    />
                  ))}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-3 sm:gap-4 mt-12 pb-10">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-2 sm:p-3 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronLeft size={20} />
                    </button>

                    <div className="hidden sm:flex items-center gap-2">
                      {(() => {
                        const pages = new Set<number>();
                        const add = (p: number) => {
                          if (p >= 1 && p <= totalPages) pages.add(p);
                        };
                        add(1);
                        add(totalPages);
                        for (let i = currentPage - 2; i <= currentPage + 2; i += 1) add(i);

                        const sorted = Array.from(pages).sort((a, b) => a - b);
                        const items: Array<number | 'ellipsis'> = [];
                        sorted.forEach((p, idx) => {
                          if (idx === 0) {
                            items.push(p);
                            return;
                          }
                          const prev = sorted[idx - 1];
                          if (p - prev > 1) items.push('ellipsis');
                          items.push(p);
                        });

                        return items.map((item, i) => {
                          if (item === 'ellipsis') {
                            return (
                              <span
                                key={`ellipsis-${i}`}
                                className="w-8 text-center text-slate-500 font-bold"
                              >
                                …
                              </span>
                            );
                          }
                          const page = item as number;
                          return (
                            <button
                              key={page}
                              onClick={() => setCurrentPage(page)}
                              className={`w-10 h-10 rounded-xl font-bold text-sm transition-all ${currentPage === page
                                  ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                                  : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                                }`}
                            >
                              {page}
                            </button>
                          );
                        });
                      })()}
                    </div>

                    <div className="flex sm:hidden items-center gap-2">
                      {(() => {
                        const start = Math.max(1, Math.min(currentPage - 1, totalPages - 2));
                        const pages = [start, start + 1, start + 2].filter((p) => p >= 1 && p <= totalPages);
                        return pages.map((page) => (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`w-9 h-9 rounded-xl font-bold text-xs transition-all ${currentPage === page
                                ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                                : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                              }`}
                          >
                            {page}
                          </button>
                        ));
                      })()}
                    </div>

                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="p-2 sm:p-3 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
                )}

                {/* Sliding Featured Cards */}
                {STORE_SLIDING_LINKS.some((link) => featuredImages[link.domain]) && (
                  <div className="mt-12">
                    <div className="mb-4 text-center text-sm font-black uppercase tracking-[0.4em] text-slate-400">
                      Earn With Web3 Quests
                    </div>
                    <div className="mb-6 text-center text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                      Discover leading projects, complete missions, and get rewarded instantly.
                    </div>
                    <div
                      ref={featureScrollRef}
                      className="relative overflow-x-auto scrollbar-hide"
                      onPointerDown={handleFeaturePointerDown}
                      onPointerMove={handleFeaturePointerMove}
                      onPointerUp={handleFeaturePointerUp}
                      onPointerLeave={handleFeaturePointerUp}
                    >
                      <div
                        className="flex gap-4 w-max animate-[ql-marquee_40s_linear_infinite]"
                        style={{ animationPlayState: isFeatureDragging ? 'paused' : 'running' }}
                      >
                        {STORE_SLIDING_LINKS
                          .filter((link) => featuredImages[link.domain])
                          .slice(0, 12)
                          .concat(
                            STORE_SLIDING_LINKS
                              .filter((link) => featuredImages[link.domain])
                              .slice(0, 12)
                          )
                          .map((link, index) => {
                            const projectId = getProjectIdByDomain(link.domain);
                            const href = projectId ? `/store/${projectId}` : '/browse';
                            return (
                              <a
                                key={`${link.domain}-${index}`}
                                href={href}
                                onClick={(e) => {
                                  if (featureDraggingRef.current || featureDragDistance.current > 6 || Date.now() - featureLastDragAt.current < 150) {
                                    e.preventDefault();
                                    return;
                                  }
                                  if (projectId && onProjectDetails) {
                                    e.preventDefault();
                                    onProjectDetails(projectId);
                                    return;
                                  }
                                  if (!projectId) {
                                    e.preventDefault();
                                    handleBrowseUrl(link.domain);
                                  }
                                }}
                                className="group relative w-64 h-36 rounded-2xl overflow-hidden border border-white/10 bg-slate-900/40 shadow-[0_20px_50px_rgba(0,0,0,0.35)] hover:shadow-[0_20px_60px_rgba(99,102,241,0.25)] transition-all duration-300 hover:scale-[1.02] active:scale-95 hover:border-indigo-500/30"
                              >
                                <img
                                  src={featuredImages[link.domain]}
                                  alt={link.name}
                                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                  loading="lazy"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />
                                <div className="absolute bottom-3 left-4 right-4 text-left">
                                  <div className="text-xs font-black uppercase tracking-widest text-white">
                                    {link.name}
                                  </div>
                                  <div className="text-[10px] text-slate-300 truncate">
                                    {link.domain}
                                  </div>
                                </div>
                              </a>
                            );
                          })}
                      </div>
                    </div>
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
