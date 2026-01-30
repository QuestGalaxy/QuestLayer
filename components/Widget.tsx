
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Task, Position, ThemeType, AppState } from '../types';
import { calculateLevel as getCalculatedLevel, getLevelProgress, getTier } from '../lib/gamification';
import { THEMES } from '../constants';
import {
  LogOut, X, Zap, Trophy, Flame, ChevronRight, CheckCircle2,
  ShieldCheck, ExternalLink, Sparkles, Loader2, Send, Coins, Gem, Sword, Crown,
  MessageSquare, Facebook, Linkedin, Twitter, Globe, Calendar, Heart, User,
  XCircle, Lock, RefreshCw, Shield, Bird, Star
} from 'lucide-react';
import TierIcon from './TierIcon';
import { supabase, logProjectView } from '../lib/supabase';
import { useAppKit, useAppKitAccount, useDisconnect } from '@reown/appkit/react';
import { useChainId, useSignMessage, useSwitchChain } from 'wagmi';

interface WidgetProps {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  isPreview?: boolean;
  previewPositionMode?: 'fixed' | 'state';
  isEmbedded?: boolean;
  portalContainer?: HTMLElement | null;
  apiBaseUrl?: string;
}

const CHAIN_METADATA: Record<number, {
  chainIdHex: `0x${string}`;
  chainName: string;
  nativeCurrency: { name: string; symbol: string; decimals: number };
  rpcUrls: string[];
  blockExplorerUrls: string[];
}> = {
  1: {
    chainIdHex: '0x1',
    chainName: 'Ethereum Mainnet',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://rpc.ankr.com/eth'],
    blockExplorerUrls: ['https://etherscan.io']
  },
  56: {
    chainIdHex: '0x38',
    chainName: 'BNB Smart Chain',
    nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
    rpcUrls: ['https://bsc-dataseed.binance.org'],
    blockExplorerUrls: ['https://bscscan.com']
  },
  137: {
    chainIdHex: '0x89',
    chainName: 'Polygon',
    nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
    rpcUrls: ['https://rpc.ankr.com/polygon'],
    blockExplorerUrls: ['https://polygonscan.com']
  },
  42161: {
    chainIdHex: '0xa4b1',
    chainName: 'Arbitrum One',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://arb1.arbitrum.io/rpc'],
    blockExplorerUrls: ['https://arbiscan.io']
  },
  43114: {
    chainIdHex: '0xa86a',
    chainName: 'Avalanche C-Chain',
    nativeCurrency: { name: 'AVAX', symbol: 'AVAX', decimals: 18 },
    rpcUrls: ['https://api.avax.network/ext/bc/C/rpc'],
    blockExplorerUrls: ['https://snowtrace.io']
  }
};

const Widget: React.FC<WidgetProps> = ({
  isOpen,
  setIsOpen,
  state,
  setState,
  isPreview = false,
  previewPositionMode = 'fixed',
  isEmbedded = false,
  portalContainer = null,
  apiBaseUrl
}) => {
  const { open } = useAppKit();
  const { address, isConnected, status } = useAppKitAccount();
  const { disconnect } = useDisconnect();
  const { signMessageAsync } = useSignMessage();
  const walletChainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const isConnecting = status === 'connecting' || status === 'reconnecting';
  const [loadingId, setLoadingId] = useState<string | number | null>(null);
  const [sharedPlatforms, setSharedPlatforms] = useState<string[]>([]);
  const [verifyingPlatforms, setVerifyingPlatforms] = useState<string[]>([]);
  const [timerValue, setTimerValue] = useState(10);
  const [visualXP, setVisualXP] = useState(state.userXP);
  const [globalXP, setGlobalXP] = useState(0);
  const [dbProjectId, setDbProjectId] = useState<string | null>(null);
  const [dbUserId, setDbUserId] = useState<string | null>(null);
  const loadedProjectRef = useRef<string | null>(null);
  const [taskMap, setTaskMap] = useState<Record<string | number, string>>({}); // localId -> dbUuid
  const [completedTaskIds, setCompletedTaskIds] = useState<Set<string>>(new Set());
  const [onboardingInputs, setOnboardingInputs] = useState<Record<string | number, string>>({});
  const [onboardingSelections, setOnboardingSelections] = useState<Record<string | number, number | null>>({});
  const [onboardingFeedback, setOnboardingFeedback] = useState<Record<string | number, { type: 'error' | 'success'; message: string }>>({});
  const [onboardingCheckStatus, setOnboardingCheckStatus] = useState<Record<string | number, 'checking' | 'success' | 'error'>>({});
  const [nftVerifyState, setNftVerifyState] = useState<Record<string | number, { status: 'idle' | 'signing' | 'checking' | 'success' | 'error'; message?: string }>>({});
  const [tokenVerifyState, setTokenVerifyState] = useState<Record<string | number, { status: 'idle' | 'signing' | 'checking' | 'success' | 'error'; message?: string }>>({});
  const [nftBgImage, setNftBgImage] = useState<string | null>(null);
  const [isWidgetActive, setIsWidgetActive] = useState(false);
  const effectiveConnected = isConnected && isWidgetActive;
  const isMinimalTheme = state.activeTheme === 'minimal';
  const isBrutalTheme = state.activeTheme === 'brutal';
  const isAuraTheme = state.activeTheme === 'aura';
  const [isConnectHover, setIsConnectHover] = useState(false);

  const getUtcDayRange = (date = new Date()) => {
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();
    const day = date.getUTCDate();
    const start = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
    const end = new Date(Date.UTC(year, month, day + 1, 0, 0, 0, 0));
    return { start, end, key: start.toISOString().slice(0, 10) };
  };

  const [viralDayKey, setViralDayKey] = useState(() => getUtcDayRange().key);
  const resolveRewardCadence = (task: Task) => task.rewardCadence ?? 'once';
  const resolveQuizType = (task: Task) => task.quizType ?? (task.section === 'onboarding' ? 'multiple_choice' : 'secret_code');
  const buildFallbackChoices = (correct?: string) => {
    const trimmed = (correct ?? '').trim();
    const base = trimmed ? [trimmed, 'Option B', 'Option C'] : ['Option A', 'Option B', 'Option C'];
    return base.slice(0, 3);
  };
  const getCompletionKey = (task: Task, dayKey = getUtcDayRange().key) => {
    const id = String(task.id);
    return resolveRewardCadence(task) === 'daily' ? `${id}:${dayKey}` : id;
  };
  const isTaskCompleted = (task: Task) => completedTaskIds.has(getCompletionKey(task));
  const markTaskCompleted = (task: Task, dayKey = getUtcDayRange().key) => {
    setCompletedTaskIds(prev => {
      const next = new Set(prev);
      next.add(getCompletionKey(task, dayKey));
      return next;
    });
  };

  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const shareVerifyTimeoutsRef = useRef<Record<string, ReturnType<typeof setTimeout> | null>>({});
  const onboardingCheckTimeoutsRef = useRef<Record<string | number, { check?: ReturnType<typeof setTimeout>; reset?: ReturnType<typeof setTimeout> }>>({});
  const audioCtxRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const wasConnectedRef = useRef(false);
  const isDisconnectingRef = useRef(false);
  const cacheScope = globalThis.location?.origin ?? 'unknown-origin';
  const projectScope = state.projectId ?? (state.projectName ? `name:${state.projectName}` : 'unknown-project');
  const walletKey = address ? `questlayer:wallet:${address.toLowerCase()}:${cacheScope}:${projectScope}` : '';
  const projectScopeRef = useRef<string | null>(null);
  const normalizeHost = (value: string) => value.toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .split('/')[0]
    .split(':')[0];
  const normalizeAnswer = (value: string) => value
    .toLowerCase()
    .normalize('NFKC')
    .replace(/[\s\p{P}\p{S}]+/gu, '');
  const toRgba = (value: string, alpha: number) => {
    const trimmed = value.trim();
    if (!trimmed.startsWith('#')) return value;
    const hex = trimmed.replace('#', '');
    if (hex.length === 3) {
      const r = parseInt(hex[0] + hex[0], 16);
      const g = parseInt(hex[1] + hex[1], 16);
      const b = parseInt(hex[2] + hex[2], 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    if (hex.length === 6) {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    return value;
  };
  const isAnswerMatch = (input: string, answer: string) => {
    const normalizedAnswer = normalizeAnswer(answer);
    if (!normalizedAnswer) return false;
    return normalizeAnswer(input) === normalizedAnswer;
  };
  const clearOnboardingCheckTimeouts = (taskId: string | number) => {
    const timers = onboardingCheckTimeoutsRef.current[taskId];
    if (!timers) return;
    if (timers.check) clearTimeout(timers.check);
    if (timers.reset) clearTimeout(timers.reset);
    delete onboardingCheckTimeoutsRef.current[taskId];
  };

  const activeTheme = THEMES[state.activeTheme];
  const isLightTheme = activeTheme.type === 'light';
  const isTransparentTheme = activeTheme.isTransparent || false;

  const themePrimary = activeTheme.colors?.primary || state.accentColor;
  const actionPrimary = (state.activeTheme === 'quest' || state.activeTheme === 'aura')
    ? state.accentColor
    : themePrimary;
  const themeBorderRaw = activeTheme.colors?.border;
  const getReadableTextColor = (hex: string | undefined) => {
    if (!hex || !hex.startsWith('#') || hex.length !== 7) return undefined;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    return luminance > 0.6 ? '#0b0f0c' : '#ffffff';
  };
  const themeBorder = themeBorderRaw === 'accent' ? state.accentColor : themeBorderRaw;

  const isFreeForm = state.position === 'free-form';
  const overlayPositionClasses = isPreview ? 'absolute' : 'fixed';
  const [widgetScale, setWidgetScale] = useState(1);
  const [maxPanelHeight, setMaxPanelHeight] = useState<number | null>(null);

  const getWidgetScale = () => {
    if (typeof window === 'undefined') return 1;
    const layoutWidth = window.innerWidth || 0;
    const visualWidth = window.visualViewport?.width || layoutWidth;
    if (!layoutWidth || !visualWidth) return 1;
    const viewportRatio = layoutWidth / visualWidth;
    const rootFontSizeRaw = window.getComputedStyle(document.documentElement).fontSize || '16px';
    const rootFontSize = Number.parseFloat(rootFontSizeRaw) || 16;
    const fontScale = rootFontSize > 0 ? 16 / rootFontSize : 1;
    const combinedScale = viewportRatio * fontScale;
    if (combinedScale > 1.05) {
      return Math.min(combinedScale, 3);
    }
    if (combinedScale < 0.95) {
      return Math.max(combinedScale, 0.8);
    }
    return 1;
  };

  const getMaxPanelHeight = (_connected: boolean) => {
    if (typeof window === 'undefined') return null;
    const viewportHeight = window.visualViewport?.height || window.innerHeight || 0;
    if (!viewportHeight) return null;
    const gap = 100;
    const available = viewportHeight - (gap * 2);
    return Math.max(280, available);
  };

  useEffect(() => {
    const updateScale = () => {
      const nextScale = getWidgetScale();
      setWidgetScale(prev => (Math.abs(prev - nextScale) < 0.01 ? prev : nextScale));
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    window.addEventListener('orientationchange', updateScale);
    const viewport = window.visualViewport;
    viewport?.addEventListener('resize', updateScale);
    return () => {
      window.removeEventListener('resize', updateScale);
      window.removeEventListener('orientationchange', updateScale);
      viewport?.removeEventListener('resize', updateScale);
    };
  }, []);

  useEffect(() => {
    const updateMaxHeight = () => {
      const nextMax = getMaxPanelHeight(effectiveConnected);
      if (nextMax === null) return;
      setMaxPanelHeight(prev => (prev && Math.abs(prev - nextMax) < 2 ? prev : nextMax));
    };

    updateMaxHeight();
    window.addEventListener('resize', updateMaxHeight);
    window.addEventListener('orientationchange', updateMaxHeight);
    const viewport = window.visualViewport;
    viewport?.addEventListener('resize', updateMaxHeight);
    return () => {
      window.removeEventListener('resize', updateMaxHeight);
      window.removeEventListener('orientationchange', updateMaxHeight);
      viewport?.removeEventListener('resize', updateMaxHeight);
    };
  }, [effectiveConnected]);

  const getApiUrl = (path: string) => {
    if (apiBaseUrl) {
      // Remove trailing slash from base and leading slash from path to avoid double slashes
      const base = apiBaseUrl.replace(/\/$/, '');
      const endpoint = path.replace(/^\//, '');
      return `${base}/${endpoint}`;
    }
    return path;
  };

  useEffect(() => {
    if (isPreview) return;
    const fetchMetadata = async () => {
      let url: string | undefined;
      if (state.projectDomain) {
        url = state.projectDomain.startsWith('http') ? state.projectDomain : `https://${state.projectDomain}`;
      }

      // If we have a URL, try to fetch high-res metadata
      if (url) {
        try {
          const res = await fetch(getApiUrl(`/api/metadata?url=${encodeURIComponent(url)}`));
          if (res.ok) {
            const data = await res.json();
            if (data.image) {
              setNftBgImage(data.image);
              return;
            }
          }
        } catch (e) {
          console.warn('[QuestLayer] Failed to fetch project metadata (likely due to local dev environment):', e);
        }
      }

      // Fallback: If API fails or no URL, we don't set nftBgImage here.
      // We will handle fallback in the render to use projectIconUrl
    };
    fetchMetadata();
  }, [state.projectDomain, isPreview]);

  useEffect(() => {
    if (isPreview) return;
    let projectId = state.projectId;
    if (!projectId || projectId.startsWith('temp-')) return;
    if (loadedProjectRef.current === projectId) return;
    loadedProjectRef.current = projectId;

    let isActive = true;
    const loadProjectConfig = async () => {
      try {
        const { data: project, error: projectError } = await supabase
          .from('projects')
          .select('id, name, domain, description, social_links, accent_color, position, theme, widget_size, logo_url, banner_url')
          .eq('id', projectId)
          .single();
        if (projectError) throw projectError;

        const { data: tasks, error: tasksError } = await supabase
          .from('tasks')
          .select('id, title, description, link, icon_url, xp_reward, is_sponsored, task_section, task_kind, reward_cadence, quiz_type, choices, correct_choice, question, answer, nft_contract, nft_chain_id, token_contract, token_chain_id, min_token_amount')
          .eq('project_id', projectId);
        if (tasksError) throw tasksError;

        if (!isActive) return;

        setState(prev => {
          const next: AppState = {
            ...prev,
            projectName: project?.name ?? prev.projectName,
            projectDomain: project?.domain ?? prev.projectDomain,
            projectDescription: project?.description ?? prev.projectDescription,
            projectSocials: project?.social_links ?? prev.projectSocials,
            projectLogo: project?.logo_url ?? prev.projectLogo,
            projectBanner: project?.banner_url ?? prev.projectBanner,
            accentColor: project?.accent_color ?? prev.accentColor,
            position: (project?.position as Position) ?? prev.position,
            activeTheme: (project?.theme as ThemeType) ?? prev.activeTheme,
            widgetSize: (project?.widget_size as AppState['widgetSize']) ?? prev.widgetSize
          };

          if (tasks && tasks.length > 0) {
            next.tasks = tasks.map((t: any) => ({
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
              choices: t.choices ?? [],
              correctChoice: typeof t.correct_choice === 'number' ? t.correct_choice : undefined,
              question: t.question ?? '',
              answer: t.answer ?? '',
              nftContract: t.nft_contract ?? '',
              nftChainId: t.nft_chain_id ?? undefined,
              tokenContract: t.token_contract ?? '',
              tokenChainId: t.token_chain_id ?? undefined,
              minTokenAmount: t.min_token_amount ?? '1'
            }));
          }

          return next;
        });
      } catch (err) {
        console.warn('[QuestLayer] Failed to load project config for widget embed:', err);
      }
    };

    loadProjectConfig();
    return () => {
      isActive = false;
    };
  }, [state.projectId, isPreview, setState]);

  useEffect(() => {
    if (!isFreeForm || isPreview) return;
    const root = document.documentElement;
    const body = document.body;
    const prevRootOverflow = root.style.overflow;
    const prevBodyOverflow = body.style.overflow;
    if (isOpen) {
      root.style.overflow = 'hidden';
      body.style.overflow = 'hidden';
    } else {
      root.style.overflow = prevRootOverflow;
      body.style.overflow = prevBodyOverflow;
    }
    return () => {
      root.style.overflow = prevRootOverflow;
      body.style.overflow = prevBodyOverflow;
    };
  }, [isOpen, isFreeForm]);

  // --- SUPABASE SYNC ---
  useEffect(() => {
    if (projectScopeRef.current && projectScopeRef.current !== projectScope) {
      setCompletedTaskIds(new Set());
      setTaskMap({});
      setDbProjectId(null);
      setDbUserId(null);
      setSharedPlatforms([]);
      setViralDayKey(getUtcDayRange().key);
      setOnboardingInputs({});
      setOnboardingSelections({});
      setOnboardingFeedback({});
      setOnboardingCheckStatus({});
    }
    projectScopeRef.current = projectScope;
  }, [projectScope]);

  useEffect(() => {
    if (!effectiveConnected || !address) return;
    const fetchGlobalXP = async () => {
      const { data: globalXPData } = await supabase.rpc('get_global_xp', { wallet_addr: address });
      if (globalXPData !== null) {
        setGlobalXP(globalXPData);
      }
    };
    fetchGlobalXP();
  }, [effectiveConnected, address]);

  useEffect(() => {
    const initSupabase = async () => {
      if (!effectiveConnected || !address) return;

      try {
        let projectId = state.projectId;

        if (projectId && projectId.startsWith('temp-')) {
          projectId = undefined;
        }

        // Fallback: Try to find project by name if ID is missing (legacy/unsynced state)
        // ONLY if not in preview mode. In preview, we rely on state.projectId being explicitly set.
        if (!projectId && state.projectName && !isPreview) {
          const { data: projects } = await supabase
            .from('projects')
            .select('id')
            .eq('name', state.projectName)
            .limit(1);
          projectId = projects?.[0]?.id;
        }

        if (!projectId) {
          // If project doesn't exist in DB (Unpublished Preview Mode), 
          // we do NOT create the user or sync DB progress.
          // We just operate in local mode.
          console.log('Preview Mode: Project not published. Running in local-only mode.');
          return;
        }

        setDbProjectId(projectId);

        // 2. Fetch Tasks Mappings (Read-Only)
        // We only map tasks that exist in the DB. New unsaved tasks won't have IDs.
        const taskMapping: Record<string | number, string> = {};
        if (state.tasks.length > 0) {
          const { data: dbTasks } = await supabase
            .from('tasks')
            .select('id, title')
            .eq('project_id', projectId);

          if (dbTasks) {
            // Map by title (assuming titles are unique per project for simplicity)
            // or ideally we would have a stable ID.
            state.tasks.forEach(localTask => {
              const match = dbTasks.find(d => d.title === localTask.title);
              if (match) {
                taskMapping[localTask.id] = match.id;
              }
            });
          }
        }
        setTaskMap(taskMapping);

        // 3. Get or Create User
        // Use upsert to handle race conditions safely
        const { data: user, error: userError } = await supabase
          .from('end_users')
          .upsert(
            {
              project_id: projectId,
              wallet_address: address
            },
            { onConflict: 'project_id,wallet_address' }
          )
          .select('id')
          .single();

        if (userError) throw userError;
        let userId = user.id;
        setDbUserId(userId);

        // 4. Fetch Progress
        const { data: progress } = await supabase
          .from('user_progress')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (progress) {
          // Check if claimed today (UTC Comparison)
          let isClaimedToday = false;
          if (progress.last_claim_date) {
            const lastClaim = new Date(progress.last_claim_date);
            const now = new Date();
            isClaimedToday = lastClaim.getUTCFullYear() === now.getUTCFullYear() &&
              lastClaim.getUTCMonth() === now.getUTCMonth() &&
              lastClaim.getUTCDate() === now.getUTCDate();
          }

          // Sync DB state to Local State
          setState(prev => ({
            ...prev,
            userXP: progress.xp || 0,
            currentStreak: progress.streak || 1,
            dailyClaimed: isClaimedToday
          }));
        } else {
          // Initialize progress row
          await supabase.from('user_progress').insert({
            user_id: userId,
            xp: 0,
            streak: 1
          });
        }

        // 5. Fetch completed tasks
        const { data: completions } = await supabase
          .from('task_completions')
          .select('task_id, completed_on, created_at')
          .eq('user_id', userId);

        if (completions) {
          const todayKey = getUtcDayRange().key;
          const dbCompletionsByTask = new Map<string, Set<string>>();

          completions.forEach((completion) => {
            const completedOn = completion.completed_on
              || (completion.created_at ? completion.created_at.slice(0, 10) : null);
            if (!completedOn) return;
            if (!dbCompletionsByTask.has(completion.task_id)) {
              dbCompletionsByTask.set(completion.task_id, new Set());
            }
            dbCompletionsByTask.get(completion.task_id)!.add(completedOn);
          });

          const localCompletedIds = new Set<string>();
          state.tasks.forEach(t => {
            const dbUuid = taskMapping[t.id];
            if (!dbUuid) return;
            const completedDays = dbCompletionsByTask.get(dbUuid);
            if (!completedDays || completedDays.size === 0) return;
            if (resolveRewardCadence(t) === 'daily') {
              if (completedDays.has(todayKey)) {
                localCompletedIds.add(getCompletionKey(t, todayKey));
              }
            } else {
              localCompletedIds.add(getCompletionKey(t));
            }
          });

          setCompletedTaskIds(localCompletedIds);
        }

        // 6. Fetch Viral Boosts
        const { start, end, key } = getUtcDayRange();
        setViralDayKey(key);
        const { data: viralBoosts } = await supabase
          .from('viral_boost_completions')
          .select('platform')
          .eq('user_id', userId)
          .eq('project_id', projectId)
          .gte('created_at', start.toISOString())
          .lt('created_at', end.toISOString());

        if (viralBoosts) {
          setSharedPlatforms(viralBoosts.map(v => v.platform));
        }

      } catch (err: any) {
        console.error('Supabase sync error details:', {
          message: err.message,
          code: err.code,
          details: err.details,
          hint: err.hint
        });
        // Visual feedback for debugging
        if (isPreview) {
          const toast = document.createElement('div');
          toast.className = 'fixed top-4 left-1/2 -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-lg text-xs font-bold z-[100]';
          toast.innerText = `DB Sync Failed: ${err.message || 'Unknown error'}`;
          document.body.appendChild(toast);
          setTimeout(() => toast.remove(), 5000);
        }
      }
    };

    initSupabase();
  }, [effectiveConnected, address, state.projectName, state.projectId]); // Added state.projectId dependency

  // --- XP ANIMATION ENGINE ---
  useEffect(() => {
    if (visualXP !== state.userXP) {
      const startTime = performance.now();
      const startXP = visualXP;
      const targetXP = state.userXP;
      const duration = 1200;

      const step = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOutQuad = (t: number) => t * (2 - t);
        const currentXP = Math.floor(startXP + (targetXP - startXP) * easeOutQuad(progress));
        setVisualXP(currentXP);
        if (progress < 1) {
          animationFrameRef.current = requestAnimationFrame(step);
        } else {
          animationFrameRef.current = null;
        }
      };
      animationFrameRef.current = requestAnimationFrame(step);
    }
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [state.userXP]);

  useEffect(() => {
    if (!wasConnectedRef.current && effectiveConnected) {
      playSound('connect');
    }
    wasConnectedRef.current = effectiveConnected;
    if (!effectiveConnected) {
      isDisconnectingRef.current = false;
    }
  }, [effectiveConnected]);

  useEffect(() => {
    if (!effectiveConnected || !walletKey) return;
    try {
      const cached = localStorage.getItem(walletKey);
      if (cached) {
        const parsed = JSON.parse(cached) as Pick<AppState, 'tasks' | 'userXP' | 'currentStreak' | 'dailyClaimed'> & {
          sharedPlatforms?: string[];
        };
        setState(prev => ({
          ...prev,
          // Avoid overwriting server-driven tasks for published projects.
          tasks: (isPreview || prev.projectId) ? prev.tasks : (parsed.tasks ?? prev.tasks),
          userXP: parsed.userXP ?? prev.userXP,
          currentStreak: parsed.currentStreak ?? prev.currentStreak,
          dailyClaimed: parsed.dailyClaimed ?? prev.dailyClaimed
        }));
        // We do NOT load sharedPlatforms from cache if connected, as DB is source of truth.
        // But if unconnected (preview mode), we can respect it or just default to empty.
        if (!dbUserId) {
          setSharedPlatforms(parsed.sharedPlatforms ?? []);
        }
      }
    } catch {
      // Ignore cache errors and keep current state.
    }
  }, [effectiveConnected, walletKey, setState, dbUserId]);

  useEffect(() => {
    if (!effectiveConnected || !walletKey) return;
    if (isDisconnectingRef.current) return;
    try {
      const payload = {
        tasks: state.tasks,
        userXP: state.userXP,
        currentStreak: state.currentStreak,
        dailyClaimed: state.dailyClaimed,
        sharedPlatforms
      };
      localStorage.setItem(walletKey, JSON.stringify(payload));
    } catch {
      // Ignore storage errors in case localStorage is unavailable.
    }
  }, [effectiveConnected, walletKey, state.tasks, state.userXP, state.currentStreak, state.dailyClaimed, sharedPlatforms]);

  useEffect(() => () => {
    Object.keys(onboardingCheckTimeoutsRef.current).forEach((taskId) => {
      clearOnboardingCheckTimeouts(taskId);
    });
  }, []);

  // --- AUDIO ENGINE ---
  const initAudio = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  };

  const playSound = (type: 'connect' | 'reward' | 'fanfare') => {
    initAudio();
    const ctx = audioCtxRef.current!;
    const masterGain = ctx.createGain();
    masterGain.connect(ctx.destination);
    masterGain.gain.value = 0.08;
    const now = ctx.currentTime;
    if (type === 'connect') {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);
      osc.connect(masterGain);
      osc.start();
      osc.stop(now + 0.15);
    } else if (type === 'reward') {
      [523.25, 659.25, 783.99, 1046.50].forEach((f, i) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = f;
        osc.connect(g);
        g.connect(masterGain);
        g.gain.setValueAtTime(0, now + i * 0.08);
        g.gain.linearRampToValueAtTime(0.2, now + i * 0.08 + 0.04);
        g.gain.linearRampToValueAtTime(0, now + i * 0.08 + 0.25);
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.25);
      });
    } else if (type === 'fanfare') {
      [392.00, 523.25, 659.25, 783.99].forEach((f, i) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = f;
        osc.connect(g);
        g.connect(masterGain);
        g.gain.setValueAtTime(0, now + i * 0.12);
        g.gain.linearRampToValueAtTime(0.3, now + i * 0.12 + 0.1);
        g.gain.linearRampToValueAtTime(0, now + i * 0.12 + 0.6);
        osc.start(now + i * 0.12);
        osc.stop(now + i * 0.12 + 0.6);
      });
    }
  };

  const calculateLevel = (xp: number) => {
    // Use Global XP if available (connected), otherwise local XP (preview/unconnected)
    const effectiveXP = effectiveConnected ? (globalXP > xp ? globalXP : xp) : xp;

    const progressData = getLevelProgress(effectiveXP);

    return {
      lvl: progressData.level,
      progress: Math.floor(progressData.progress),
      xpNeeded: progressData.xpRequired - progressData.xpInLevel,
      effectiveXP,
      tier: progressData.tier
    };
  };

  const getRankName = () => {
    const { lvl } = calculateLevel(visualXP);
    const tier = getTier(lvl);
    return tier.name;
  };

  const claimDaily = async () => {
    if (state.dailyClaimed) return;

    // DB Update & Calculation via RPC
    if (dbUserId) {
      try {
        const { data, error } = await supabase.rpc('claim_daily_bonus', { u_id: dbUserId });

        if (error) throw error;

        if (data && data.success) {
          playSound('fanfare');

          // Update Local State with Server Response
          setState(prev => ({
            ...prev,
            userXP: data.new_total_xp,
            currentStreak: data.new_streak,
            dailyClaimed: true
          }));

          // Update Global XP locally to reflect change immediately
          setGlobalXP(prev => prev + data.bonus);
        } else {
          console.warn('Claim failed:', data?.message);
        }
      } catch (err) {
        console.error('Error claiming daily:', err);
      }
    } else {
      // Local / Preview Mode Fallback
      playSound('fanfare');
      const bonus = 100 * Math.pow(2, state.currentStreak - 1);
      setState(prev => ({
        ...prev,
        userXP: prev.userXP + bonus,
        currentStreak: (prev.currentStreak % 5) + 1,
        dailyClaimed: true
      }));
    }
  };

  // --- REFACTORED STARTQUEST LOGIC ---
  const startQuest = (task: Task) => {
    initAudio();
    if ((task.kind ?? 'link') !== 'link') return;
    if (!task.link) {
      console.warn('QuestLayer task missing link:', task);
      return;
    }
    window.open(task.link, '_blank');
    setLoadingId(task.id);
    setTimerValue(10);
  };

  useEffect(() => {
    if (loadingId !== null && timerValue > 0) {
      timerIntervalRef.current = setInterval(() => {
        setTimerValue(prev => prev - 1);
      }, 1000);
      return () => {
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      };
    } else if (loadingId !== null && timerValue <= 0) {
      // Timer Finished - Execute Completion Logic Once
      const task = state.tasks.find(t => t.id === loadingId);
      if (task) {
        completeQuest(task);
      }
    }
  }, [loadingId, timerValue]);

  const completeQuest = (task: Task, options?: { skipDb?: boolean; xpAwarded?: number }) => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    // Prevent multiple triggers if already completing
    if (isTaskCompleted(task)) return;

    const xpAwarded = options?.xpAwarded ?? task.xp;

    playSound('reward');

    // Optimistic Update
    setState(prev => ({
      ...prev,
      userXP: prev.userXP + xpAwarded
    }));
    markTaskCompleted(task);
    setLoadingId(null);
    setGlobalXP(prev => prev + xpAwarded);

    // DB Update
    if (!options?.skipDb && dbUserId) {
      const completeTaskInDb = async () => {
        let dbTaskId = taskMap[task.id];

        // Fallback: If not in map, try to find it by title in the DB right now
        if (!dbTaskId && dbProjectId) {
          const { data: foundTask } = await supabase
            .from('tasks')
            .select('id')
            .eq('project_id', dbProjectId)
            .eq('title', task.title)
            .single();
          if (foundTask) dbTaskId = foundTask.id;
        }

        if (dbTaskId) {
          const todayKey = getUtcDayRange().key;
          await supabase.from('task_completions').insert({
            user_id: dbUserId,
            task_id: dbTaskId,
            completed_on: resolveRewardCadence(task) === 'daily' ? todayKey : undefined
          });

          // Fetch latest XP to be safe (race conditions)
          const { data: userProgress } = await supabase
            .from('user_progress')
            .select('xp')
            .eq('user_id', dbUserId)
            .single();

          const currentDbXP = userProgress?.xp || state.userXP;

          await supabase.from('user_progress')
            .update({ xp: currentDbXP + xpAwarded })
            .eq('user_id', dbUserId);
        } else {
          console.error("Task ID not found for completion", task);
        }
      };
      completeTaskInDb();
    }
  };

  const isUuid = (value: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

  const resolveDbTaskId = async (task: Task) => {
    if (taskMap[task.id]) return taskMap[task.id];
    if (typeof task.id === 'string' && isUuid(task.id)) return task.id;
    if (!dbProjectId) return null;
    const { data: foundTask } = await supabase
      .from('tasks')
      .select('id')
      .eq('project_id', dbProjectId)
      .eq('title', task.title)
      .single();
    if (foundTask?.id) {
      setTaskMap(prev => ({ ...prev, [task.id]: foundTask.id }));
      return foundTask.id;
    }
    return null;
  };

  const buildNftHoldMessage = (params: { address: string; projectId: string; taskId: string; chainId: number; timestamp: string }) => {
    const addressLower = params.address.toLowerCase();
    return [
      'QuestLayer NFT Hold Verification',
      `Wallet: ${addressLower}`,
      `Project: ${params.projectId}`,
      `Task: ${params.taskId}`,
      `Chain: ${params.chainId}`,
      `Timestamp: ${params.timestamp}`
    ].join('\n');
  };

  const ensureWalletChain = async (chainId: number) => {
    if (!walletChainId || walletChainId === chainId) return true;
    try {
      await switchChainAsync({ chainId });
      return true;
    } catch {
      const metadata = CHAIN_METADATA[chainId];
      const provider = (window as any).ethereum;
      if (!metadata || !provider?.request) return false;
      try {
        await provider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: metadata.chainIdHex }]
        });
        return true;
      } catch (switchError: any) {
        if (switchError?.code !== 4902) return false;
        try {
          await provider.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: metadata.chainIdHex,
                chainName: metadata.chainName,
                nativeCurrency: metadata.nativeCurrency,
                rpcUrls: metadata.rpcUrls,
                blockExplorerUrls: metadata.blockExplorerUrls
              }
            ]
          });
          return true;
        } catch {
          return false;
        }
      }
    }
  };

  const handleNftHoldVerify = async (task: Task) => {
    if (isTaskCompleted(task)) return;
    if (!effectiveConnected || !address) {
      await open();
      return;
    }
    const contract = (task.nftContract || '').trim();
    if (!contract) {
      setNftVerifyState(prev => ({ ...prev, [task.id]: { status: 'error', message: 'Missing collection contract.' } } as any));
      return;
    }
    if (!dbProjectId) {
      setNftVerifyState(prev => ({ ...prev, [task.id]: { status: 'error', message: 'Project is not published yet.' } } as any));
      return;
    }
    if (nftVerifyState[task.id]?.status === 'signing' || nftVerifyState[task.id]?.status === 'checking') return;

    const dbTaskId = await resolveDbTaskId(task);
    if (!dbTaskId) {
      setNftVerifyState(prev => ({ ...prev, [task.id]: { status: 'error', message: 'Task not synced to database.' } } as any));
      return;
    }

    const chainId = task.nftChainId ?? 1;
    const chainLabel = CHAIN_METADATA[chainId]?.chainName ?? `chain ${chainId}`;
    const switched = await ensureWalletChain(chainId);
    if (!switched) {
      setNftVerifyState(prev => ({
        ...prev,
        [task.id]: { status: 'error', message: `Switch wallet to ${chainLabel}.` }
      } as any));
      return;
    }

    setNftVerifyState(prev => ({ ...prev, [task.id]: { status: 'signing', message: 'Sign to verify ownership.' } } as any));
    const timestamp = new Date().toISOString();
    const message = buildNftHoldMessage({
      address,
      projectId: dbProjectId,
      taskId: dbTaskId,
      chainId,
      timestamp
    });

    let signature = '';
    try {
      signature = await signMessageAsync({ message, account: address as any });
    } catch {
      setNftVerifyState(prev => ({ ...prev, [task.id]: { status: 'error', message: 'Signature rejected.' } } as any));
      return;
    }

    setNftVerifyState(prev => ({ ...prev, [task.id]: { status: 'checking', message: 'Checking on-chain balance...' } } as any));

    try {
      const response = await fetch(getApiUrl('/api/nft-hold'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address,
          signature,
          message,
          projectId: dbProjectId,
          taskId: dbTaskId
        })
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        const detailSuffix = payload?.details ? ` (${payload.details})` : '';
        const errorMessage = (payload?.error || 'Verification failed.') + detailSuffix;
        setNftVerifyState(prev => ({ ...prev, [task.id]: { status: 'error', message: errorMessage } } as any));
        return;
      }

      if (payload?.alreadyCompleted) {
        markTaskCompleted(task);
        setNftVerifyState(prev => ({ ...prev, [task.id]: { status: 'success', message: 'Already verified.' } } as any));
        return;
      }

      if (!payload?.success) {
        const detailSuffix = payload?.details ? ` (${payload.details})` : '';
        const errorMessage = (payload?.error || 'No eligible NFT found.') + detailSuffix;
        setNftVerifyState(prev => ({ ...prev, [task.id]: { status: 'error', message: errorMessage } } as any));
        return;
      }

      completeQuest(task, { skipDb: true, xpAwarded: payload?.xpAwarded ?? task.xp });
      setNftVerifyState(prev => ({ ...prev, [task.id]: { status: 'success', message: 'NFT verified.' } } as any));
    } catch {
      setNftVerifyState(prev => ({ ...prev, [task.id]: { status: 'error', message: 'Network error. Try again.' } } as any));
    }
  };

  const buildTokenHoldMessage = (params: { address: string; projectId: string; taskId: string; chainId: number; timestamp: string }) => {
    const addressLower = params.address.toLowerCase();
    return [
      'QuestLayer Token Hold Verification',
      `Wallet: ${addressLower}`,
      `Project: ${params.projectId}`,
      `Task: ${params.taskId}`,
      `Chain: ${params.chainId}`,
      `Timestamp: ${params.timestamp}`
    ].join('\n');
  };

  const handleTokenHoldVerify = async (task: Task) => {
    if (isTaskCompleted(task)) return;
    if (!effectiveConnected || !address) {
      await open();
      return;
    }
    const contract = (task.tokenContract || '').trim();
    if (!contract) {
      setTokenVerifyState(prev => ({ ...prev, [task.id]: { status: 'error', message: 'Missing token contract.' } } as any));
      return;
    }
    if (!dbProjectId) {
      setTokenVerifyState(prev => ({ ...prev, [task.id]: { status: 'error', message: 'Project is not published yet.' } } as any));
      return;
    }
    if (tokenVerifyState[task.id]?.status === 'signing' || tokenVerifyState[task.id]?.status === 'checking') return;

    const dbTaskId = await resolveDbTaskId(task);
    if (!dbTaskId) {
      setTokenVerifyState(prev => ({ ...prev, [task.id]: { status: 'error', message: 'Task not synced to database.' } } as any));
      return;
    }

    const chainId = task.tokenChainId ?? 1;
    const chainLabel = CHAIN_METADATA[chainId]?.chainName ?? `chain ${chainId}`;
    const switched = await ensureWalletChain(chainId);
    if (!switched) {
      setTokenVerifyState(prev => ({
        ...prev,
        [task.id]: { status: 'error', message: `Switch wallet to ${chainLabel}.` }
      } as any));
      return;
    }

    setTokenVerifyState(prev => ({ ...prev, [task.id]: { status: 'signing', message: 'Sign to verify ownership.' } } as any));
    const timestamp = new Date().toISOString();
    const message = buildTokenHoldMessage({
      address,
      projectId: dbProjectId,
      taskId: dbTaskId,
      chainId,
      timestamp
    });

    let signature = '';
    try {
      signature = await signMessageAsync({ message, account: address as any });
    } catch {
      setTokenVerifyState(prev => ({ ...prev, [task.id]: { status: 'error', message: 'Signature rejected.' } } as any));
      return;
    }

    setTokenVerifyState(prev => ({ ...prev, [task.id]: { status: 'checking', message: 'Checking token balance...' } } as any));

    try {
      const response = await fetch(getApiUrl('/api/token-hold'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address,
          signature,
          message,
          projectId: dbProjectId,
          taskId: dbTaskId
        })
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        const detailSuffix = payload?.details ? ` (${payload.details})` : '';
        const errorMessage = (payload?.error || 'Verification failed.') + detailSuffix;
        setTokenVerifyState(prev => ({ ...prev, [task.id]: { status: 'error', message: errorMessage } } as any));
        return;
      }

      if (payload?.alreadyCompleted) {
        markTaskCompleted(task);
        setTokenVerifyState(prev => ({ ...prev, [task.id]: { status: 'success', message: 'Already verified.' } } as any));
        return;
      }

      if (!payload?.success) {
        const detailSuffix = payload?.details ? ` (${payload.details})` : '';
        const errorMessage = (payload?.error || 'Insufficient balance.') + detailSuffix;
        setTokenVerifyState(prev => ({ ...prev, [task.id]: { status: 'error', message: errorMessage } } as any));
        return;
      }

      completeQuest(task, { skipDb: true, xpAwarded: payload?.xpAwarded ?? task.xp });
      setTokenVerifyState(prev => ({ ...prev, [task.id]: { status: 'success', message: 'Tokens verified.' } } as any));
    } catch {
      setTokenVerifyState(prev => ({ ...prev, [task.id]: { status: 'error', message: 'Network error. Try again.' } } as any));
    }
  };

  const handleOnboardingSubmit = (task: Task, selectedChoice?: number) => {
    if (isTaskCompleted(task)) return;
    if (onboardingCheckStatus[task.id] === 'checking') return;
    const quizType = resolveQuizType(task);
    const input = onboardingInputs[task.id] ?? '';
    if (quizType === 'multiple_choice') {
      const rawChoices = task.choices ?? [];
      const choices = rawChoices.length ? rawChoices : buildFallbackChoices(task.answer);
      if (!choices.length) {
        setOnboardingFeedback(prev => ({
          ...prev,
          [task.id]: { type: 'error' as const, message: 'Choices not configured yet.' }
        }));
        return;
      }
      if (typeof selectedChoice !== 'number') {
        setOnboardingFeedback(prev => ({
          ...prev,
          [task.id]: { type: 'error' as const, message: 'Pick an option first.' }
        }));
        return;
      }
      setOnboardingSelections(prev => ({ ...prev, [task.id]: selectedChoice }));
    } else {
      if (!input.trim()) {
        setOnboardingFeedback(prev => ({
          ...prev,
          [task.id]: { type: 'error' as const, message: 'Type the secret code first.' }
        }));
        return;
      }
      if (!task.answer || !task.answer.trim()) {
        setOnboardingFeedback(prev => ({
          ...prev,
          [task.id]: { type: 'error' as const, message: 'Answer not configured yet.' }
        }));
        return;
      }
    }
    clearOnboardingCheckTimeouts(task.id);
    setOnboardingFeedback(prev => {
      const next = { ...prev };
      delete next[task.id];
      return next;
    });
    setOnboardingCheckStatus(prev => ({ ...prev, [task.id]: 'checking' as const }));
    const checkTimeout = setTimeout(() => {
      const isMatch = quizType === 'multiple_choice'
        ? (typeof selectedChoice === 'number' && selectedChoice === (typeof task.correctChoice === 'number' ? task.correctChoice : 0))
        : isAnswerMatch(input, task.answer ?? '');
      setOnboardingCheckStatus(prev => ({ ...prev, [task.id]: isMatch ? 'success' as const : 'error' as const }));
      setOnboardingFeedback(prev => ({
        ...prev,
        [task.id]: { type: isMatch ? 'success' as const : 'error' as const, message: isMatch ? 'Correct' : 'Wrong' }
      }));
      const resetTimeout = setTimeout(() => {
        setOnboardingCheckStatus(prev => {
          const next = { ...prev };
          delete next[task.id];
          return next;
        });
        setOnboardingFeedback(prev => {
          const next = { ...prev };
          delete next[task.id];
          return next;
        });
        if (isMatch) {
          setOnboardingInputs(prev => ({ ...prev, [task.id]: '' }));
          setOnboardingSelections(prev => ({ ...prev, [task.id]: null }));
          completeQuest(task);
        }
      }, 900);
      onboardingCheckTimeoutsRef.current[task.id] = { reset: resetTimeout };
    }, 3000);
    onboardingCheckTimeoutsRef.current[task.id] = { check: checkTimeout };
  };

  const handleShare = (platform: string) => {
    initAudio();
    const { key } = getUtcDayRange();
    if (key !== viralDayKey) {
      setSharedPlatforms([]);
      setViralDayKey(key);
    }
    if (sharedPlatforms.includes(platform) || verifyingPlatforms.includes(platform)) return;
    const shareUrl = window.location.origin;

    // Platform-specific marketing copy
    let shareText = '';
    const projectHashtag = `#${state.projectName.replace(/\s+/g, '')}`;

    switch (platform) {
      case 'x':
        shareText = `🚀 Just started my journey on ${state.projectName}! \n\nCompleting quests and earning XP. Join me and level up! ⚡️\n\n${projectHashtag} #QuestLayer #Web3`;
        break;
      case 'tg':
        shareText = `Check out ${state.projectName} on QuestLayer! 🎮 I'm earning rewards by completing quests. Come join the leaderboard! 🚀`;
        break;
      case 'wa':
        shareText = `Hey! I'm using QuestLayer to earn rewards on ${state.projectName}. It's actually pretty cool, check it out here:`;
        break;
      case 'li':
        shareText = `Excited to be engaging with ${state.projectName} through their new QuestLayer integration. Gamifying the experience and earning rewards! 🚀 #Web3 #Community #Growth`;
        break;
      default: // fb and others
        shareText = `Loving the new quest system on ${state.projectName}! 🎮 Earning XP and rewards for engaging with the community. Check it out!`;
        break;
    }

    let url = '';

    switch (platform) {
      case 'x': url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`; break;
      case 'tg': url = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`; break;
      case 'wa': url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`; break;
      case 'fb': url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`; break;
      case 'li': url = `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(shareText + ' ' + shareUrl)}`; break;
    }

    if (url) {
      window.open(url, '_blank');
      setVerifyingPlatforms(prev => [...prev, platform]);
      if (shareVerifyTimeoutsRef.current[platform]) {
        clearTimeout(shareVerifyTimeoutsRef.current[platform]!);
      }
      shareVerifyTimeoutsRef.current[platform] = setTimeout(() => {
        setVerifyingPlatforms(prev => prev.filter(p => p !== platform));
        if (!sharedPlatforms.includes(platform)) {
          setSharedPlatforms(prev => [...prev, platform]);
          playSound('reward');
          setState(prev => ({ ...prev, userXP: prev.userXP + 100 }));

          // DB Update
          if (dbUserId && dbProjectId) {
            // 1. Log completion in DB
            supabase.from('viral_boost_completions').insert({
              user_id: dbUserId,
              project_id: dbProjectId,
              platform: platform
            }).then(() => {
              // 2. Update User XP
              supabase.from('user_progress')
                .update({ xp: state.userXP + 100 })
                .eq('user_id', dbUserId)
                .then(() => {
                  setGlobalXP(prev => prev + 100);
                });
            });
          }
        }
      }, 10000);
    }
  };

  const handleConnect = () => {
    if (isConnecting) return;
    initAudio();
    if (isConnected) {
      setIsWidgetActive(true);
      playSound('connect');
    } else {
      if (!isPreview && isEmbedded) {
        const trackConnect = async () => {
          let projectId = state.projectId;

          if (!projectId && state.projectName) {
            const { data: projects } = await supabase
              .from('projects')
              .select('id')
              .eq('name', state.projectName)
              .limit(1);
            projectId = projects?.[0]?.id;
          }

          if (!projectId) return;

          const host = normalizeHost(window.location.hostname || '');
          const projectHost = state.projectDomain ? normalizeHost(state.projectDomain) : '';

          console.log('[QuestLayer] Tracking Connect:', {
            host,
            projectHost,
            projectId,
            match: host === projectHost
          });

          if (!host || !projectHost || host !== projectHost) {
            console.warn('[QuestLayer] Domain mismatch or missing configuration. Tracking skipped.');
            return;
          }

          await logProjectView(projectId);
        };

        void trackConnect();
      }
      setIsWidgetActive(true);
      open();
    }
  };

  const handleDisconnect = () => {
    if (!effectiveConnected) return;
    isDisconnectingRef.current = true;
    void disconnect();
    setIsWidgetActive(false);
    setIsOpen(false);
  };

  const questLayerBase = 'https://questlayer.app';

  const handleQuestLayerNav = (path: string) => {
    window.open(`${questLayerBase}${path}`, '_blank', 'noopener,noreferrer');
  };

  const getPositionClasses = () => {
    switch (state.position) {
      case 'bottom-right':
        return 'bottom-4 right-4 md:bottom-8 md:right-8';
      case 'bottom-left':
        return 'bottom-4 left-4 md:bottom-8 md:left-8';
      case 'top-right':
        return 'ql-pos-top ql-pos-top-right right-4 md:right-8';
      case 'top-left':
        return 'ql-pos-top ql-pos-top-left left-4 md:left-8';
      default:
        return '';
    }
  };

  const isBottom = state.position.includes('bottom');
  const isRight = state.position.includes('right');
  const effectiveScale = widgetScale;
  const wrapperStyle: React.CSSProperties = {
    transform: effectiveScale > 1 ? `scale(${effectiveScale})` : undefined,
    transformOrigin: isFreeForm
      ? 'center'
      : (isBottom
        ? (isRight ? 'bottom right' : 'bottom left')
        : (isRight ? 'top right' : 'top left'))
  };
  const isPreviewStatePosition = isPreview && previewPositionMode === 'state';
  const isPreviewFreeFormCentered = isPreviewStatePosition && isFreeForm;
  const previewPositionClasses = isPreviewFreeFormCentered
    ? 'inset-0'
    : 'bottom-4 right-4 md:bottom-8 md:right-8';
  const effectivePreviewPositionClasses = previewPositionMode === 'fixed'
    ? previewPositionClasses
    : (isPreviewFreeFormCentered ? 'inset-0' : getPositionClasses());
  const previewStackClass = isPreviewStatePosition
    ? (isBottom ? 'flex-col-reverse' : 'flex-col')
    : 'flex-col-reverse';
  const previewAlignmentClasses = isPreviewFreeFormCentered
    ? 'items-center justify-center'
    : (isPreviewStatePosition ? (isRight ? 'items-end' : 'items-start') : 'items-end');
  const shouldPortal = Boolean(portalContainer) && isFreeForm && !isPreview;
  const wrapperClasses = [
    isPreview ? overlayPositionClasses : (isFreeForm ? 'relative' : overlayPositionClasses),
    isPreview ? (isOpen ? 'z-[120]' : 'z-[90]') : 'z-[2147483000]',
    isPreview ? 'flex' : (isFreeForm ? 'inline-flex' : 'flex'),
    activeTheme.font,
    isPreview ? previewStackClass : (isFreeForm ? 'flex-col' : (isBottom ? 'flex-col-reverse' : 'flex-col')),
    isPreview ? previewAlignmentClasses : (isFreeForm ? 'items-start' : (isRight ? 'items-end' : 'items-start')),
    isPreview ? effectivePreviewPositionClasses : getPositionClasses(),
    'gap-2',
    'antialiased'
  ].join(' ');
  const formatXP = (val: number) => val >= 1000 ? (val / 1000).toFixed(1) + 'k' : val;

  const currentLevelData = calculateLevel(visualXP);
  const shortAddress = address ? `${address.slice(0, 4)}...${address.slice(-4)}` : '';
  const triggerSizeClass = state.widgetSize === 'small'
    ? 'px-2.5 md:px-3 h-8 md:h-10'
    : state.widgetSize === 'large'
      ? 'px-4 md:px-6 h-11 md:h-14'
      : 'px-3 md:px-5 h-9 md:h-12';
  const triggerTextClass = state.widgetSize === 'small'
    ? 'text-xs md:text-sm'
    : state.widgetSize === 'large'
      ? 'text-base md:text-lg'
      : 'text-sm md:text-sm';
  const triggerIconClass = state.widgetSize === 'small'
    ? 'w-[10px] h-[10px] md:w-[14px] md:h-[14px]'
    : state.widgetSize === 'large'
      ? 'w-[14px] h-[14px] md:w-[18px] md:h-[18px]'
      : 'w-[12px] h-[12px] md:w-[16px] md:h-[16px]';
  const triggerMetaClass = state.widgetSize === 'small'
    ? 'text-[8px] md:text-[9px]'
    : state.widgetSize === 'large'
      ? 'text-[10px] md:text-[11px]'
      : 'text-[9px] md:text-[10px]';
  const triggerLevelClass = state.widgetSize === 'small'
    ? 'text-sm md:text-base'
    : state.widgetSize === 'large'
      ? 'text-base md:text-xl'
      : 'text-sm md:text-lg';
  const triggerStyle = (() => {
    if (isTransparentTheme) {
      return {
        backgroundColor: 'rgba(2, 6, 23, 0.6)', // Darker background (slate-950 at 0.6)
        backdropFilter: 'blur(20px)',
        borderColor: `${state.accentColor}60`,
        boxShadow: `0 0 20px ${state.accentColor}30`,
        color: state.accentColor
      };
    }

    switch (state.activeTheme) {
      case 'cyber':
        return {
          backgroundColor: state.accentColor,
          borderColor: state.accentColor
        };
      case 'gaming':
        return {
          backgroundColor: state.accentColor,
          borderColor: '#fbbf24',
          boxShadow: '4px 4px 0px 0px #fbbf24'
        };
      case 'terminal':
        return {
          borderColor: '#1f3d2a',
          boxShadow: '0 0 0 1px rgba(24, 255, 131, 0.15)'
        };
      case 'aura':
        return {
          borderColor: '#fecdd3',
          boxShadow: '0 0 0 2px rgba(244, 63, 94, 0.08)'
        };
      case 'avatar':
        return {
          backgroundColor: '#0a2a43',
          borderColor: '#67e8f9',
          boxShadow: '0 0 18px rgba(34, 211, 238, 0.45)'
        };
      case 'ironman':
        return {
          backgroundColor: '#7f0d12',
          borderColor: '#f59e0b',
          boxShadow: '0 0 18px rgba(248, 113, 113, 0.4)'
        };
      case 'minimal':
      case 'brutal':
        return {
          borderColor: '#000',
          boxShadow: '4px 4px 0px 0px #000'
        };
      default:
        return {
          backgroundColor: state.accentColor,
          borderColor: 'transparent'
        };
    }
  })();

  const overlayElement = (
    <div
      className={`${overlayPositionClasses} inset-0 bg-black/60 ${isFreeForm ? (isPreview ? 'z-[45]' : 'z-[2147482990]') : 'md:hidden z-[45]'}`}
      onClick={() => setIsOpen(false)}
    />
  );

  const getFaviconUrl = (link: string) => {
    try {
      if (!link || link.length < 4) return '';
      let validLink = link.trim();
      validLink = validLink.replace(/[\/.]+$/, '');
      if (!validLink.startsWith('http://') && !validLink.startsWith('https://')) {
        validLink = `https://${validLink}`;
      }
      const url = new URL(validLink);
      let hostname = url.hostname;
      if (hostname.endsWith('.')) hostname = hostname.slice(0, -1);
      const parts = hostname.split('.');
      if (parts.length < 2 || parts[parts.length - 1].length < 2) return '';
      return `https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${hostname}&size=128`;
    } catch {
      return '';
    }
  };

  const projectIconUrl = state.projectLogo || (state.projectDomain ? getFaviconUrl(state.projectDomain) : '');
  const hasCustomLogo = Boolean(state.projectLogo);
  const resolveTaskSection = (task: Task) => task.section ?? 'missions';
  const resolveTaskKind = (task: Task) => {
    const rawKind = (task.kind ?? 'link') as string;
    return rawKind === 'secret' ? 'quiz' : (rawKind as Task['kind']);
  };
  const sortTasksByCompletion = (tasks: Task[]) => [...tasks].sort((a, b) => {
    const aCompleted = isTaskCompleted(a);
    const bCompleted = isTaskCompleted(b);
    if (aCompleted === bCompleted) return 0;
    return aCompleted ? 1 : -1;
  });
  const renderTaskList = (tasks: Task[], options?: { variant?: 'default' | 'onboarding' }) => {
    const isOnboardingVariant = options?.variant === 'onboarding';
    const tasksSorted = sortTasksByCompletion(tasks);
    return tasksSorted.map((task, index) => {
      const resolvedKind = resolveTaskKind(task);
      const isQuizTask = resolvedKind === 'quiz';
      const isNftTask = resolvedKind === 'nft_hold';
      const isTokenTask = resolvedKind === 'token_hold';
      const isCompleted = isTaskCompleted(task);
      const isLoading = loadingId === task.id;
      const inputValue = onboardingInputs[task.id] ?? '';
      const selectedChoice = onboardingSelections[task.id];
      const feedback = onboardingFeedback[task.id];
      const checkStatus = onboardingCheckStatus[task.id];
      const isChecking = checkStatus === 'checking';
      const isSuccess = checkStatus === 'success';
      const isError = checkStatus === 'error';
      const isLocked = isChecking || isSuccess || isError;
      const nftStatus = nftVerifyState[task.id]?.status ?? 'idle';
      const nftMessage = nftVerifyState[task.id]?.message;
      const isNftSigning = nftStatus === 'signing';
      const isNftChecking = nftStatus === 'checking';
      const isNftSuccess = nftStatus === 'success';
      const isNftError = nftStatus === 'error';
      const isNftBusy = isNftSigning || isNftChecking;

      const tokenStatus = tokenVerifyState[task.id]?.status ?? 'idle';
      const tokenMessage = tokenVerifyState[task.id]?.message;
      const isTokenSigning = tokenStatus === 'signing';
      const isTokenChecking = tokenStatus === 'checking';
      const isTokenSuccess = tokenStatus === 'success';
      const isTokenError = tokenStatus === 'error';
      const isTokenBusy = isTokenSigning || isTokenChecking;

      const stepIndex = index + 1;
      const isLastStep = index === tasksSorted.length - 1;
      const showTypeTag = isOnboardingVariant || resolvedKind !== 'link';
      const titleText = isQuizTask ? (task.question?.trim() || task.title) : task.title;
      const descriptionText = isQuizTask ? '' : task.desc;
      const stepIcon = task.icon?.startsWith('icon:') ? (
        <>
          {task.icon === 'icon:coin' && <Coins size={14} className="text-yellow-300/80" />}
          {task.icon === 'icon:trophy' && <Trophy size={14} className="text-yellow-300/80" />}
          {task.icon === 'icon:gem' && <Gem size={14} className="text-yellow-300/80" />}
          {task.icon === 'icon:sword' && <Sword size={14} className="text-yellow-300/80" />}
          {task.icon === 'icon:crown' && <Crown size={14} className="text-yellow-300/80" />}
          {task.icon === 'icon:twitter' && <Twitter size={14} className="text-indigo-300/80" />}
          {task.icon === 'icon:repost' && <Zap size={14} className="text-green-300/80" />}
          {task.icon === 'icon:heart' && <Heart size={14} className="text-pink-300/80" />}
          {task.icon === 'icon:discord' && <MessageSquare size={14} className="text-indigo-300/80" />}
          {task.icon === 'icon:telegram' && <Send size={14} className="text-sky-300/80" />}
          {task.icon === 'icon:globe' && <Globe size={14} className="text-slate-300/80" />}
          {task.icon === 'icon:calendar' && <Calendar size={14} className="text-orange-300/80" />}
        </>
      ) : task.icon ? (
        <img
          src={task.icon}
          alt=""
          className="h-4 w-4 md:h-5 md:w-5 object-contain opacity-80"
          loading="lazy"
        />
      ) : (
        <Sparkles size={14} className="text-emerald-300/80" />
      );
      const questionText = isQuizTask ? (task.question?.trim() || task.title) : '';
      const titleClassName = `text-[11px] md:text-xs font-black uppercase tracking-tight truncate ${isLightTheme ? 'text-black' : 'text-white'} ${isCompleted ? 'line-through decoration-2' : ''}`;
      const questionClassName = `text-[12px] md:text-[13px] font-semibold tracking-normal leading-snug break-words whitespace-normal ${isLightTheme ? 'text-slate-800' : 'text-white'} ${isCompleted ? 'line-through decoration-2' : ''}`;
      const flashColor = isSuccess ? '#22c55e' : (isError ? '#ef4444' : null);
      const flashClass = (isSuccess || isError) ? 'animate-pulse' : '';
      const themedBorderColor = (themeBorderRaw && themeBorderRaw !== 'accent') ? themeBorderRaw : undefined;
      const baseInputBorderClass = isLightTheme
        ? 'border-slate-300 focus:border-slate-400'
        : 'border-white/20 focus:border-white/40';
      const inputBorderClass = feedback?.type === 'error'
        ? 'border-rose-500/70 focus:border-rose-500'
        : baseInputBorderClass;
      const inputSurfaceClass = isLightTheme
        ? 'bg-white placeholder:text-slate-400'
        : 'bg-white/5 placeholder:text-white/40';
      const choiceBaseClass = isLightTheme
        ? 'border-slate-200 bg-white text-slate-900 hover:border-slate-300'
        : 'border-white/10 bg-white/5 text-white hover:border-white/20';
      const dividerClass = isLightTheme ? 'border-slate-200' : 'border-white/10';
      const showFeedback = Boolean(feedback && (!checkStatus || checkStatus === 'error'));
      const showTypeBadge = showTypeTag && !isQuizTask;
      const quizType = resolveQuizType(task);
      const rawQuizChoices = task.choices ?? [];
      const quizChoices = (quizType === 'multiple_choice' && rawQuizChoices.length === 0)
        ? buildFallbackChoices(task.answer)
        : rawQuizChoices;
      const isDaily = resolveRewardCadence(task) === 'daily';
      const fallbackIcon = resolvedKind === 'nft_hold'
        ? <ShieldCheck size={14} className="text-emerald-400" />
        : (resolvedKind === 'token_hold' ? <Coins size={14} className="text-amber-400" /> : null);
      const mappedIcon = task.icon?.startsWith('icon:') ? (
        task.icon === 'icon:coin' ? <Coins size={14} className="text-yellow-400" />
          : task.icon === 'icon:trophy' ? <Trophy size={14} className="text-yellow-400" />
            : task.icon === 'icon:gem' ? <Gem size={14} className="text-yellow-400" />
              : task.icon === 'icon:sword' ? <Sword size={14} className="text-yellow-400" />
                : task.icon === 'icon:crown' ? <Crown size={14} className="text-yellow-400" />
                  : task.icon === 'icon:twitter' ? <Twitter size={14} className="text-indigo-400" />
                    : task.icon === 'icon:repost' ? <Zap size={14} className="text-green-400" />
                      : task.icon === 'icon:heart' ? <Heart size={14} className="text-pink-400" />
                        : task.icon === 'icon:discord' ? <MessageSquare size={14} className="text-indigo-400" />
                          : task.icon === 'icon:telegram' ? <Send size={14} className="text-sky-400" />
                            : task.icon === 'icon:globe' ? <Globe size={14} className="text-slate-400" />
                              : task.icon === 'icon:calendar' ? <Calendar size={14} className="text-orange-400" />
                                : task.icon === 'icon:nft' ? <ShieldCheck size={14} className="text-emerald-400" />
                                  : task.icon === 'icon:token' ? <Coins size={14} className="text-amber-400" />
                                    : null
      ) : null;
      const headerIconClass = (resolvedKind === 'nft_hold' || resolvedKind === 'token_hold') ? 'rounded-full' : '';
      const iconNode = !isOnboardingVariant ? (
        task.icon?.startsWith('icon:') ? (
          <div
            className={`flex h-5 w-5 md:h-6 md:w-6 items-center justify-center overflow-hidden ${activeTheme.iconBox} ${headerIconClass}`}
            style={{ background: `${state.accentColor}10` }}
          >
            {mappedIcon || fallbackIcon || <Sparkles size={14} className="text-emerald-300/80" />}
          </div>
        ) : task.icon ? (
          <div
            className={`flex h-5 w-5 md:h-6 md:w-6 items-center justify-center overflow-hidden ${activeTheme.iconBox} ${headerIconClass}`}
            style={{ background: `${state.accentColor}10` }}
          >
            <img
              src={task.icon}
              alt=""
              className="h-4 w-4 md:h-5 md:w-5 object-contain"
              loading="lazy"
            />
          </div>
        ) : fallbackIcon ? (
          <div
            className={`flex h-5 w-5 md:h-6 md:w-6 items-center justify-center overflow-hidden ${activeTheme.iconBox} ${headerIconClass}`}
            style={{ background: `${state.accentColor}10` }}
          >
            {fallbackIcon}
          </div>
        ) : null
      ) : null;
      return (
        <div key={task.id} className="relative">
          <div
            className={`p-2 md:p-3 border border-opacity-20 shadow-sm transition-all relative overflow-hidden ${activeTheme.itemCard} ${isCompleted ? 'opacity-60 grayscale-[0.8]' : ''} ${isOnboardingVariant ? 'backdrop-blur-xl' : ''} ${isOnboardingVariant ? 'ring-1 ring-white/10' : ''}`}
            style={{
              borderColor: (themeBorderRaw && themeBorderRaw !== 'accent') ? `${themeBorderRaw}40` : undefined,
              boxShadow: (themeBorderRaw && themeBorderRaw !== 'accent') ? `3px 3px 0px 0px ${themeBorderRaw}20` : undefined,
              minHeight: isOnboardingVariant ? '94px' : undefined
            }}
          >
            {isOnboardingVariant && (
              <div
                className={`absolute left-2 top-2 w-6 h-6 md:w-7 md:h-7 rounded-xl text-[9px] md:text-[10px] font-black flex items-center justify-center border ${isCompleted ? 'text-emerald-400' : (isLightTheme ? 'text-slate-700' : 'text-white')}`}
                style={{
                  backgroundColor: isCompleted ? `${state.accentColor}20` : (isLightTheme ? '#ffffff' : 'rgba(255,255,255,0.08)'),
                  borderColor: isCompleted ? state.accentColor : (isLightTheme ? '#e2e8f0' : 'rgba(255,255,255,0.2)')
                }}
              >
                <div className="relative flex items-center justify-center">
                  {stepIcon}
                  <span className="absolute -top-1 -right-1 text-[8px] md:text-[9px] font-black text-white bg-black/70 rounded-full px-1">
                    {stepIndex}
                  </span>
                </div>
              </div>
            )}
            <div className="flex justify-between items-start mb-0.5 gap-2">
              <div className={`min-w-0 ${isOnboardingVariant ? 'pl-8 md:pl-9' : ''}`}>
                {isQuizTask ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      {iconNode}
                      <span className={`text-[9px] md:text-[9px] font-black uppercase tracking-widest ${isLightTheme ? 'text-slate-600' : 'text-white/70'}`}>
                        Question
                      </span>
                      {isDaily && (
                        <span
                          className={`text-[8px] md:text-[8px] font-black px-1 rounded uppercase tracking-tighter border shrink-0 inline-flex items-center gap-1`}
                          style={{
                            backgroundColor: `${state.accentColor}10`,
                            borderColor: `${state.accentColor}20`,
                            color: state.accentColor
                          }}
                          title="Recurring daily reward"
                        >
                          <RefreshCw size={10} />
                          Daily
                        </span>
                      )}
                      {task.isSponsored && (
                        <span
                          className={`text-[8px] md:text-[8px] font-black px-1 rounded uppercase tracking-tighter border shrink-0`}
                          style={{
                            backgroundColor: `${state.accentColor}10`,
                            borderColor: `${state.accentColor}20`,
                            color: state.accentColor
                          }}
                        >
                          Sponsored
                        </span>
                      )}
                      {task.isDemo && (
                        <span
                          className={`text-[8px] md:text-[8px] font-black px-1 rounded uppercase tracking-tighter border shrink-0`}
                          style={{
                            backgroundColor: `${state.accentColor}10`,
                            borderColor: `${state.accentColor}20`,
                            color: state.accentColor
                          }}
                        >
                          Demo
                        </span>
                      )}
                    </div>
                    <h5 className={questionClassName}>
                      {questionText || titleText}
                    </h5>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 min-w-0">
                    {iconNode}
                    <h5 className={titleClassName}>
                      {titleText}
                    </h5>
                    {showTypeBadge && (
                      <span
                        className={`text-[8px] md:text-[8px] font-black px-1 rounded uppercase tracking-tighter border shrink-0`}
                        style={{
                          backgroundColor: `${state.accentColor}10`,
                          borderColor: `${state.accentColor}20`,
                          color: state.accentColor
                        }}
                      >
                        {resolvedKind === 'nft_hold' ? 'NFT Hold' : (resolvedKind === 'token_hold' ? 'Token Hold' : 'Link')}
                      </span>
                    )}
                    {isDaily && (
                      <span
                        className={`text-[8px] md:text-[8px] font-black px-1 rounded uppercase tracking-tighter border shrink-0 inline-flex items-center gap-1`}
                        style={{
                          backgroundColor: `${state.accentColor}10`,
                          borderColor: `${state.accentColor}20`,
                          color: state.accentColor
                        }}
                        title="Recurring daily reward"
                      >
                        <RefreshCw size={10} />
                        Daily
                      </span>
                    )}
                    {task.isSponsored && (
                      <span
                        className={`text-[8px] md:text-[8px] font-black px-1 rounded uppercase tracking-tighter border shrink-0`}
                        style={{
                          backgroundColor: `${state.accentColor}10`,
                          borderColor: `${state.accentColor}20`,
                          color: state.accentColor
                        }}
                      >
                        Sponsored
                      </span>
                    )}
                    {task.isDemo && (
                      <span
                        className={`text-[8px] md:text-[8px] font-black px-1 rounded uppercase tracking-tighter border shrink-0`}
                        style={{
                          backgroundColor: `${state.accentColor}10`,
                          borderColor: `${state.accentColor}20`,
                          color: state.accentColor
                        }}
                      >
                        Demo
                      </span>
                    )}
                  </div>
                )}
              </div>
              <span
                className={`text-[10px] md:text-[10px] font-black px-1 py-0.5 shrink-0 ${activeTheme.iconBox}`}
                style={{ background: `${state.accentColor}10`, color: state.accentColor }}
              >
                +{task.xp}
              </span>
            </div>
            {descriptionText && (
              <p className={`text-[11px] md:text-[11px] mb-2 leading-relaxed line-clamp-2 ${isLightTheme ? 'text-slate-700' : 'opacity-60 text-white'}`}>
                {descriptionText}
              </p>
            )}
            {isQuizTask ? (
              <div className="space-y-1.5">
                <div
                  className={`pt-2 mt-1 border-t ${dividerClass} ql-no-outline`}
                  style={{ borderColor: themedBorderColor ? `${themedBorderColor}80` : undefined }}
                >
                  {quizType === 'multiple_choice' ? (
                    <div className="flex flex-col gap-2">
                      <div className="grid grid-cols-1 gap-2">
                        {quizChoices.map((choice, index) => {
                          const isSelected = selectedChoice === index;
                          const isCheckingChoice = isChecking && isSelected;
                          const isSuccessChoice = checkStatus === 'success' && isSelected;
                          const isErrorChoice = checkStatus === 'error' && isSelected;
                          return (
                            <button
                              key={`${task.id}-choice-${index}`}
                              onClick={() => handleOnboardingSubmit(task, index)}
                              disabled={isCompleted || isLocked || isChecking}
                              className={`relative overflow-hidden ${embeddedActionHeightClass} px-2 md:px-3 rounded-lg border text-[10px] md:text-[11px] font-black uppercase tracking-wide transition-all whitespace-normal break-words leading-snug ${
                                isSuccessChoice
                                  ? (isLightTheme ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-emerald-400 bg-emerald-500/20 text-emerald-50')
                                  : isErrorChoice
                                    ? (isLightTheme ? 'border-rose-500 bg-rose-500 text-white' : 'border-rose-400 bg-rose-500/20 text-rose-50')
                                    : isCheckingChoice
                                      ? (isLightTheme ? 'border-slate-900 bg-slate-900 text-white' : 'border-indigo-300 bg-indigo-500/15 text-white')
                                      : isSelected
                                        ? 'border-indigo-400 bg-indigo-500/20 text-white'
                                        : choiceBaseClass
                              } ${isChecking && !isSelected ? 'opacity-50' : ''} disabled:opacity-50`}
                            >
                              {isCheckingChoice && (
                                <span className="absolute inset-0 pointer-events-none">
                                  <span className="absolute inset-y-0 -left-full w-[200%] bg-gradient-to-r from-transparent via-white/35 to-transparent animate-[shimmer_1.1s_infinite]" />
                                </span>
                              )}
                              <span className="relative z-10">
                                {isCheckingChoice
                                  ? 'Syncing…'
                                  : isSuccessChoice
                                    ? 'Correct'
                                    : isErrorChoice
                                      ? 'Wrong'
                                      : choice}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                      {showFeedback && quizType !== 'multiple_choice' && (
                        <p className={`text-[10px] font-bold ${feedback.type === 'error' ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {feedback.message}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col md:flex-row gap-2">
                      <input
                        value={inputValue}
                        onChange={(e) => {
                          const value = e.target.value;
                          setOnboardingInputs(prev => ({ ...prev, [task.id]: value }));
                          setOnboardingFeedback(prev => {
                            if (!prev[task.id]) return prev;
                            const next = { ...prev };
                            delete next[task.id];
                            return next;
                          });
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleOnboardingSubmit(task);
                          }
                        }}
                        disabled={isCompleted || isLocked}
                        placeholder="Type the secret code..."
                        className={`w-full h-7 md:h-9 px-2 md:px-3 rounded-lg border text-[10px] md:text-[11px] ${inputBorderClass} ${inputSurfaceClass} ${isLightTheme ? 'text-slate-900' : 'text-white'} disabled:opacity-50`}
                        style={{ borderColor: themedBorderColor && feedback?.type !== 'error' ? `${themedBorderColor}80` : undefined }}
                      />
                      <button
                        onClick={() => handleOnboardingSubmit(task)}
                        disabled={isCompleted || isLocked}
                        style={{
                          ...((!isLightTheme && !isTransparentTheme) ? {
                            backgroundColor: isCompleted ? '#94a3b8' : actionPrimary,
                            borderColor: isCompleted ? '#94a3b8' : (activeTheme.colors?.secondary || actionPrimary),
                            color: activeTheme.colors?.text || 'white',
                            cursor: isCompleted ? 'not-allowed' : 'pointer'
                          } : (isTransparentTheme ? {
                            borderColor: isCompleted ? '#94a3b8' : actionPrimary,
                            backgroundColor: isCompleted ? '#94a3b820' : 'transparent',
                            color: isCompleted ? '#94a3b8' : 'white',
                            cursor: isCompleted ? 'not-allowed' : 'pointer'
                          } : {
                            backgroundColor: isCompleted ? '#e2e8f0' : actionPrimary,
                            color: isCompleted ? '#94a3b8' : (state.activeTheme === 'aura' ? '#ffffff' : (activeTheme.colors?.text || getReadableTextColor(actionPrimary))),
                            borderColor: isCompleted ? '#e2e8f0' : actionPrimary,
                            cursor: isCompleted ? 'not-allowed' : 'pointer'
                          })),
                          ...(flashColor ? {
                            backgroundColor: flashColor,
                            borderColor: flashColor,
                            color: 'white'
                          } : {})
                        }}
                        className={`w-full md:w-32 ${embeddedActionHeightClass} border-2 font-black text-[10px] md:text-[10px] uppercase transition-all flex items-center justify-center tracking-widest ${activeTheme.button} ${flashClass}`}
                      >
                        {isCompleted ? (
                          <span className="flex items-center gap-1">Completed <CheckCircle2 size={10} /></span>
                        ) : isChecking ? (
                          <span className="flex items-center gap-1"><Loader2 size={12} className="animate-spin" /> Checking</span>
                        ) : isSuccess ? (
                          <span className="flex items-center gap-1">Correct</span>
                        ) : isError ? (
                          <span className="flex items-center gap-1">Wrong</span>
                        ) : (
                          <span className="flex items-center gap-1">Check</span>
                        )}
                      </button>
                    </div>
                  )}
                </div>
                {quizType !== 'multiple_choice' && showFeedback && (
                  <p className={`text-[10px] font-bold ${feedback.type === 'error' ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {feedback.message}
                  </p>
                )}
              </div>
            ) : isNftTask ? (
              <div className={`relative overflow-hidden rounded-xl border-2 transition-all duration-500 group/nft ${isCompleted || isNftSuccess
                ? 'border-emerald-500/50 bg-emerald-500/5'
                : isNftError
                  ? 'border-rose-500/50 bg-rose-500/5'
                  : `border-white/10 ${isLightTheme ? 'bg-slate-50' : 'bg-white/5'} hover:border-white/20`
                }`}>
                <div className="absolute left-3 top-3 z-10 flex items-center gap-1.5">
                  <div className={`flex h-6 w-6 items-center justify-center rounded-full ${activeTheme.iconBox}`} style={{ background: `${state.accentColor}10` }}>
                    <ShieldCheck size={12} className="text-emerald-400" />
                  </div>
                  <span className={`text-[8px] font-black uppercase tracking-widest ${isLightTheme ? 'text-slate-700' : 'text-white/80'}`}>
                    NFT Holder
                  </span>
                </div>
                {/* Background Image */}
                {(nftBgImage || projectIconUrl) && (
                  <>
                    <div className="absolute inset-0 opacity-30 pointer-events-none transition-opacity duration-700">
                      <img
                        src={nftBgImage || projectIconUrl}
                        alt=""
                        className="w-full h-full object-cover blur-sm"
                        onError={(e) => {
                          // If main image fails, and we are not already using fallback, try fallback or hide
                          if (nftBgImage && e.currentTarget.src === nftBgImage) {
                            if (projectIconUrl) e.currentTarget.src = projectIconUrl;
                            else e.currentTarget.style.display = 'none';
                          } else {
                            e.currentTarget.style.display = 'none';
                          }
                        }}
                      />
                    </div>
                    <div className="absolute inset-0 bg-black/40 pointer-events-none" />
                  </>
                )}

                {/* Background Glow */}
                <div className={`absolute inset-0 opacity-20 pointer-events-none transition-opacity duration-700 ${isNftChecking || isNftSigning ? 'opacity-40' : ''
                  }`}
                  style={{
                    background: isCompleted || isNftSuccess
                      ? 'radial-gradient(circle at center, #10b981 0%, transparent 70%)'
                      : isNftError
                        ? 'radial-gradient(circle at center, #f43f5e 0%, transparent 70%)'
                        : `radial-gradient(circle at center, ${state.accentColor} 0%, transparent 70%)`
                  }} />

                <div className="relative p-4 flex flex-col items-center text-center space-y-3">
                  {/* Header / Project Banner Effect */}
                  <div className="flex flex-col items-center gap-2">
                    <div className={`relative w-12 h-12 md:w-14 md:h-14 rounded-full border-2 flex items-center justify-center bg-black/20 backdrop-blur-sm shadow-xl transition-transform duration-500 ${isNftBusy ? 'scale-110' : ''}`}
                      style={{ borderColor: isCompleted ? '#10b981' : (isNftError ? '#f43f5e' : state.accentColor) }}
                    >
                      {projectIconUrl ? (
                        <img src={projectIconUrl} alt="" className="w-full h-full object-cover rounded-full" />
                      ) : (
                        <ShieldCheck size={24} className={isCompleted ? 'text-emerald-400' : 'text-white'} />
                      )}
                      {/* Status Indicator Icon */}
                      <div className="absolute -bottom-1 -right-1 bg-black rounded-full p-1 border border-white/10">
                        {isCompleted || isNftSuccess ? (
                          <CheckCircle2 size={12} className="text-emerald-400" />
                        ) : isNftError ? (
                          <XCircle size={12} className="text-rose-400" />
                        ) : (
                          <Lock size={12} className="text-white/60" />
                        )}
                      </div>
                    </div>

                    <div className="space-y-0.5">
                      <h4 className={`text-xs font-black uppercase tracking-widest ${isLightTheme ? 'text-slate-900' : 'text-white'}`}>
                        {state.projectName} Holder
                      </h4>
                      <p className={`text-[10px] font-medium ${isLightTheme ? 'text-slate-500' : 'text-white/60'}`}>
                        NFT Verification
                      </p>
                    </div>
                  </div>

                  {/* Dynamic Action Button */}
                  <button
                    onClick={() => handleNftHoldVerify(task)}
                    disabled={isCompleted || isNftBusy}
                    className={`w-full ${embeddedActionHeightClass} px-4 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 overflow-hidden relative ${isCompleted || isNftSuccess
                      ? 'bg-emerald-500 text-white cursor-default shadow-[0_0_20px_rgba(16,185,129,0.4)]'
                      : isNftError
                        ? 'bg-rose-500 text-white hover:bg-rose-600'
                        : isNftBusy
                          ? 'cursor-wait'
                          : 'hover:brightness-110 hover:scale-[1.02] active:scale-[0.98]'
                      }`}
                    style={!(isCompleted || isNftSuccess || isNftError) ? {
                      backgroundColor: state.accentColor,
                      color: 'white',
                      boxShadow: `0 0 20px ${state.accentColor}40`
                    } : {}}
                  >
                    {/* Button Content */}
                    <div className="relative z-10 flex items-center gap-2">
                      {isCompleted || isNftSuccess ? (
                        <>
                          <span>Verified Owner</span>
                          <CheckCircle2 size={14} />
                        </>
                      ) : isNftSigning ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          <span>Requesting Signature...</span>
                        </>
                      ) : isNftChecking ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          <span>Verifying On-Chain...</span>
                        </>
                      ) : isNftError ? (
                        <>
                          <span>Verification Failed</span>
                          <RefreshCw size={14} />
                        </>
                      ) : (
                        <>
                          <span>Verify Holdings</span>
                          <Shield size={14} />
                        </>
                      )}
                    </div>

                    {/* Loading Progress Bar */}
                    {isNftBusy && (
                      <div
                        className="absolute bottom-0 left-0 h-1 bg-white/30 animate-[progress_2s_ease-in-out_infinite]"
                        style={{ width: '100%' }}
                      />
                    )}
                  </button>

                  {/* Feedback Message */}
                  <div className={`text-[10px] font-bold transition-all duration-300 ${nftMessage ? 'opacity-100 max-h-10' : 'opacity-0 max-h-0'
                    } ${isNftError ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {nftMessage}
                  </div>
                </div>
              </div>
            ) : isTokenTask ? (
              <div className={`relative overflow-hidden rounded-xl border-2 transition-all duration-500 group/token ${isCompleted || isTokenSuccess
                ? 'border-emerald-500/50 bg-emerald-500/5'
                : isTokenError
                  ? 'border-rose-500/50 bg-rose-500/5'
                  : `border-white/10 ${isLightTheme ? 'bg-slate-50' : 'bg-white/5'} hover:border-white/20`
                }`}>
                <div className="absolute left-3 top-3 z-10 flex items-center gap-1.5">
                  <div className={`flex h-6 w-6 items-center justify-center rounded-full ${activeTheme.iconBox}`} style={{ background: `${state.accentColor}10` }}>
                    <Coins size={12} className="text-amber-400" />
                  </div>
                  <span className={`text-[8px] font-black uppercase tracking-widest ${isLightTheme ? 'text-slate-700' : 'text-white/80'}`}>
                    Token Holder
                  </span>
                </div>
                {/* Background Glow */}
                <div className={`absolute inset-0 opacity-20 pointer-events-none transition-opacity duration-700 ${isTokenChecking || isTokenSigning ? 'opacity-40' : ''
                  }`}
                  style={{
                    background: isCompleted || isTokenSuccess
                      ? 'radial-gradient(circle at center, #10b981 0%, transparent 70%)'
                      : isTokenError
                        ? 'radial-gradient(circle at center, #f43f5e 0%, transparent 70%)'
                        : `radial-gradient(circle at center, ${state.accentColor} 0%, transparent 70%)`
                  }} />

                <div className="relative p-4 flex flex-col items-center text-center space-y-3">
                  {/* Header / Project Banner Effect */}
                  <div className="flex flex-col items-center gap-2">
                    <div className={`relative w-12 h-12 md:w-14 md:h-14 rounded-full border-2 flex items-center justify-center bg-black/20 backdrop-blur-sm shadow-xl transition-transform duration-500 ${isTokenBusy ? 'scale-110' : ''}`}
                      style={{ borderColor: isCompleted ? '#10b981' : (isTokenError ? '#f43f5e' : state.accentColor) }}
                    >
                      {projectIconUrl ? (
                        <img src={projectIconUrl} alt="" className="w-full h-full object-cover rounded-full" />
                      ) : (
                        <Coins size={24} className={isCompleted ? 'text-emerald-400' : 'text-white'} />
                      )}
                      {/* Status Indicator Icon */}
                      <div className="absolute -bottom-1 -right-1 bg-black rounded-full p-1 border border-white/10">
                        {isCompleted || isTokenSuccess ? (
                          <CheckCircle2 size={12} className="text-emerald-400" />
                        ) : isTokenError ? (
                          <XCircle size={12} className="text-rose-400" />
                        ) : (
                          <Lock size={12} className="text-white/60" />
                        )}
                      </div>
                    </div>

                    <div className="space-y-0.5">
                      <h4 className={`text-xs font-black uppercase tracking-widest ${isLightTheme ? 'text-slate-900' : 'text-white'}`}>
                        {state.projectName} Token
                      </h4>
                      <p className={`text-[10px] font-medium ${isLightTheme ? 'text-slate-500' : 'text-white/60'}`}>
                        Token Verification
                      </p>
                    </div>
                  </div>

                  {/* Dynamic Action Button */}
                  <button
                    onClick={() => handleTokenHoldVerify(task)}
                    disabled={isCompleted || isTokenBusy}
                    className={`w-full ${embeddedActionHeightClass} px-4 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 overflow-hidden relative ${isCompleted || isTokenSuccess
                      ? 'bg-emerald-500 text-white cursor-default shadow-[0_0_20px_rgba(16,185,129,0.4)]'
                      : isTokenError
                        ? 'bg-rose-500 text-white hover:bg-rose-600'
                        : isTokenBusy
                          ? 'cursor-wait'
                          : 'hover:brightness-110 hover:scale-[1.02] active:scale-[0.98]'
                      }`}
                    style={!(isCompleted || isTokenSuccess || isTokenError) ? {
                      backgroundColor: state.accentColor,
                      color: 'white',
                      boxShadow: `0 0 20px ${state.accentColor}40`
                    } : {}}
                  >
                    {/* Button Content */}
                    <div className="relative z-10 flex items-center gap-2">
                      {isCompleted || isTokenSuccess ? (
                        <>
                          <span>Verified Holder</span>
                          <CheckCircle2 size={14} />
                        </>
                      ) : isTokenSigning ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          <span>Requesting Signature...</span>
                        </>
                      ) : isTokenChecking ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          <span>Verifying Balance...</span>
                        </>
                      ) : isTokenError ? (
                        <>
                          <span>Verification Failed</span>
                          <RefreshCw size={14} />
                        </>
                      ) : (
                        <>
                          <span>Verify Tokens</span>
                          <Coins size={14} />
                        </>
                      )}
                    </div>

                    {/* Loading Progress Bar */}
                    {isTokenBusy && (
                      <div
                        className="absolute bottom-0 left-0 h-1 bg-white/30 animate-[progress_2s_ease-in-out_infinite]"
                        style={{ width: '100%' }}
                      />
                    )}
                  </button>

                  {/* Feedback Message */}
                  <div className={`text-[10px] font-bold transition-all duration-300 ${tokenMessage ? 'opacity-100 max-h-10' : 'opacity-0 max-h-0'
                    } ${isTokenError ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {tokenMessage}
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => startQuest(task)}
                disabled={isCompleted || (loadingId !== null && loadingId !== task.id)}
                style={(!isLightTheme && !isTransparentTheme) ? {
                  backgroundColor: isCompleted ? '#94a3b8' : themePrimary,
                  borderColor: isCompleted ? '#94a3b8' : (activeTheme.colors?.secondary || themePrimary),
                  color: activeTheme.colors?.text || 'white',
                  cursor: isCompleted ? 'not-allowed' : 'pointer'
                } : (isTransparentTheme ? {
                  borderColor: isCompleted ? '#94a3b8' : state.accentColor,
                  backgroundColor: isCompleted ? '#94a3b820' : (isLoading ? `${state.accentColor}10` : 'transparent'),
                  color: isCompleted ? '#94a3b8' : 'white',
                  cursor: isCompleted ? 'not-allowed' : 'pointer'
                } : (isLoading ? {
                  backgroundColor: '#f8fafc',
                  color: '#1e293b',
                  borderColor: '#cbd5e1'
                } : {
                  backgroundColor: isCompleted ? '#e2e8f0' : state.accentColor,
                  color: isCompleted ? '#94a3b8' : 'white',
                  borderColor: isCompleted ? '#e2e8f0' : state.accentColor,
                  cursor: isCompleted ? 'not-allowed' : 'pointer'
                }))}
                className={`w-full ${embeddedActionHeightClass} border-2 font-black text-[10px] md:text-[10px] uppercase transition-all flex items-center justify-center relative z-10 tracking-widest ${activeTheme.button}`}
              >
                {isCompleted ? (
                  <span className="flex items-center gap-1">Completed <CheckCircle2 size={10} /></span>
                ) : !isLoading ? (
                  <span className="flex items-center gap-1">Open <ExternalLink size={7} /></span>
                ) : (
                  <span className="flex items-center gap-1">Syncing <span className={`font-mono`} style={{ color: state.accentColor }}>{timerValue}s</span></span>
                )}
                {isLoading && (
                  <div
                    className="absolute left-0 top-0 bottom-0 opacity-20 transition-all duration-1000 linear"
                    style={{ width: `${((10 - timerValue) / 10) * 100}%`, backgroundColor: state.accentColor }}
                  />
                )}
              </button>
            )}
          </div>
        </div>
      );
    });
  };
  const onboardingTasks = state.tasks.filter(task => resolveTaskSection(task) === 'onboarding');
  const missionTasks = state.tasks.filter(task => resolveTaskSection(task) !== 'onboarding');
  const onboardingCompletedCount = onboardingTasks.filter(task => isTaskCompleted(task)).length;
  const onboardingXP = onboardingTasks.reduce((acc, task) => acc + (task.xp || 0), 0);
  const onboardingAccent = themeBorder || state.accentColor;

  const bodyPaddingClass = isEmbedded ? 'p-4 md:p-5' : 'p-3 md:p-4';
  const embeddedActionHeightClass = 'h-8 md:h-10';
  const embeddedPrimaryButtonPaddingClass = isEmbedded ? 'py-2.5 md:py-3.5' : 'py-2 md:py-3';
  const embeddedSecondaryButtonPaddingClass = isEmbedded ? 'py-2 md:py-3.5' : 'py-1.5 md:py-3';
  const popupContent = (
    <div
      data-ql-root="true"
      data-ql-theme={isLightTheme ? 'light' : 'dark'}
      className={`w-[min(350px,calc(100vw-1rem))] md:w-[350px] flex flex-col overflow-hidden theme-transition ${isFreeForm ? `${isPreview ? 'relative z-[130]' : `${overlayPositionClasses} left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[2147483001]`}` : 'relative'} ${isOpen ? `${isPreview ? 'max-h-[calc(100%-3.5rem)]' : 'max-h-full'}` : ''} ${activeTheme.card} ${activeTheme.font} ${isLightTheme ? 'text-black' : 'text-white'}`}
      style={{
        maxHeight: (isOpen && maxPanelHeight)
          ? `${Math.max(280, Math.floor(maxPanelHeight / Math.max(0.8, effectiveScale)))}px`
          : undefined,
        '--ql-border-emphasis': (themeBorderRaw === null
          ? (isLightTheme ? '#000000' : '#ffffff')
          : (themeBorderRaw === 'accent' ? state.accentColor : (themeBorderRaw || (isLightTheme ? '#000000' : '#ffffff')))),
        '--ql-border-emphasis-soft': toRgba((themeBorderRaw === null
          ? (isLightTheme ? '#000000' : '#ffffff')
          : (themeBorderRaw === 'accent' ? state.accentColor : (themeBorderRaw || (isLightTheme ? '#000000' : '#ffffff')))), isLightTheme ? (isAuraTheme ? 0.6 : 0.35) : 0.22),
        '--ql-border-emphasis-strong': (themeBorderRaw === null
          ? (isLightTheme ? '#000000' : '#ffffff')
          : (themeBorderRaw === 'accent' ? state.accentColor : (themeBorderRaw || (isLightTheme ? '#000000' : '#ffffff')))),
        borderColor: (isMinimalTheme || isBrutalTheme || isAuraTheme)
          ? (isAuraTheme ? (themeBorder || state.accentColor) : '#000')
          : (themeBorderRaw === null
            ? undefined
            : (themeBorder ?? (isLightTheme ? '#000' : (isTransparentTheme ? `${themePrimary}60` : 'rgba(255,255,255,0.08)')))),
        borderWidth: (isMinimalTheme || isBrutalTheme || isAuraTheme) ? 2 : undefined,
        borderStyle: (isMinimalTheme || isBrutalTheme || isAuraTheme) ? 'solid' : undefined
      }}
    >
      {/* Header */}
      <div
        className={`px-4 py-3 md:px-5 md:py-4 flex items-center justify-between shrink-0 ${activeTheme.header}`}
      >
        <div className="flex items-center gap-2 md:gap-3 truncate">
          <div
            style={{
              backgroundColor: projectIconUrl
                ? 'transparent'
                : (isLightTheme ? '#000' : (isTransparentTheme ? `${themePrimary}30` : themePrimary))
            }}
            className={`w-8 h-8 md:w-9 md:h-9 shadow-lg shrink-0 overflow-hidden flex items-center justify-center ${activeTheme.iconBox} ${isTransparentTheme ? '' : 'text-white'}`}
          >
            {projectIconUrl ? (
              <img
                src={projectIconUrl}
                alt={state.projectName}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onLoad={(e) => {
                  const img = e.target as HTMLImageElement;
                  // Google's fallback "globe" is usually 16x16 or 32x32
                  // If it's too small and we requested 128, it's likely a fallback or low quality
                  if (!hasCustomLogo && img.naturalWidth < 32) {
                    img.style.display = 'none';
                    const zapIcon = img.nextElementSibling as HTMLElement;
                    if (zapIcon) zapIcon.style.display = 'flex';
                    // Restore background if falling back to Zap
                    const parent = img.parentElement;
                    if (parent) {
                      parent.style.backgroundColor = isLightTheme ? '#000' : (isTransparentTheme ? `${state.accentColor}30` : state.accentColor);
                    }
                  }
                }}
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  if (hasCustomLogo && state.projectDomain && !img.dataset.fallbackTried) {
                    img.dataset.fallbackTried = 'true';
                    img.src = getFaviconUrl(state.projectDomain);
                    return;
                  }
                  // If favicon fails, fallback to Zap icon
                  img.style.display = 'none';
                  const zapIcon = img.nextElementSibling as HTMLElement;
                  if (zapIcon) zapIcon.style.display = 'flex';
                  // Restore background if falling back to Zap
                  const parent = img.parentElement;
                  if (parent) {
                    parent.style.backgroundColor = isLightTheme ? '#000' : (isTransparentTheme ? `${state.accentColor}30` : state.accentColor);
                  }
                }}
              />
            ) : null}
            <div
              style={{ display: projectIconUrl ? 'none' : 'flex' }}
              className="w-full h-full items-center justify-center"
            >
              <Zap className="w-4 h-4 md:w-5 md:h-5" fill="currentColor" />
            </div>
          </div>
          <span
            className={`font-black text-sm md:text-sm uppercase tracking-tight truncate ${isLightTheme ? 'text-black' : 'text-white'}`}
            style={isTransparentTheme ? { color: state.accentColor } : {}}
          >
            {state.projectName}
          </span>
        </div>
        <div className="flex items-center gap-2 md:gap-2 shrink-0 ml-2">
          {effectiveConnected && (
            <button onClick={handleDisconnect} className="p-2 md:p-1.5 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors">
              <LogOut className="w-[12px] h-[12px] md:w-[12px] md:h-[12px]" />
            </button>
          )}
          <button
            onClick={() => setIsOpen(false)}
            className={`p-2 md:p-1.5 rounded-lg ${isLightTheme ? 'text-slate-400 hover:text-black' : 'text-white/40 hover:text-white'} hover:scale-110 transition-all`}
          >
            <X className="w-[16px] h-[16px] md:w-[16px] md:h-[16px]" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className={`flex-1 min-h-0 overflow-y-auto ${bodyPaddingClass} space-y-2 md:space-y-3 custom-scroll`}>
        {!effectiveConnected ? (
          <div className="flex flex-col items-center justify-center text-center space-y-4 py-4 md:py-8">
            <div className="space-y-2">
              <div
                className="mx-auto w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center mb-1"
                style={{ backgroundColor: `${state.accentColor}15`, color: state.accentColor }}
              >
                <ShieldCheck className="w-[26px] h-[26px] md:w-[32px] md:h-[32px]" />
              </div>
              <h3 className={`text-[13px] md:text-lg font-black uppercase tracking-tighter ${isLightTheme ? 'text-black' : 'text-white'}`}>
                Connect to unlock <br /><span className="opacity-40 text-xs md:text-sm">{state.projectName} Missions</span>
              </h3>
            </div>
            <div className={`w-full space-y-3 text-left p-2 md:p-3 rounded-xl border ${isLightTheme ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/5'}`}>
              <p className={`text-[11px] md:text-[10px] font-black uppercase tracking-widest flex items-center gap-1 ${isLightTheme ? 'text-indigo-700' : 'text-indigo-400'}`} style={!isLightTheme ? { color: themePrimary } : {}}>
                <ChevronRight size={8} /> Protocol Intel
              </p>
              <p className={`text-[13px] md:text-xs leading-relaxed ${isLightTheme ? 'text-slate-800' : 'text-slate-300 opacity-70'}`}>
                Connect to personalize your rank, unlock streaks, and earn XP inside {state.projectName}.
              </p>
              <div className="grid grid-cols-3 gap-2">
                <div className={`flex flex-col items-center gap-1 text-[9px] font-bold uppercase text-center ${isLightTheme ? 'text-slate-600' : 'text-white/60'}`}>
                  <Zap size={16} strokeWidth={2.5} className="animate-pulse text-yellow-400" style={{ animationDelay: '0ms' }} />
                  <span className="leading-none">XP Quests</span>
                </div>
                <div className={`flex flex-col items-center gap-1 text-[9px] font-bold uppercase text-center ${isLightTheme ? 'text-slate-600' : 'text-white/60'}`}>
                  <Flame size={16} strokeWidth={2.5} className="animate-pulse text-yellow-400" style={{ animationDelay: '200ms' }} />
                  <span className="leading-none">Daily Streaks</span>
                </div>
                <div className={`flex flex-col items-center gap-1 text-[9px] font-bold uppercase text-center ${isLightTheme ? 'text-slate-600' : 'text-white/60'}`}>
                  <Trophy size={16} strokeWidth={2.5} className="animate-pulse text-yellow-400" style={{ animationDelay: '400ms' }} />
                  <span className="leading-none">Leaderboard</span>
                </div>
              </div>
            </div>
            <button
              onClick={handleConnect}
              onMouseEnter={() => setIsConnectHover(true)}
              onMouseLeave={() => setIsConnectHover(false)}
              disabled={isConnecting}
              style={{
                ...((!isLightTheme && !isTransparentTheme) ? { backgroundColor: state.accentColor } : (isTransparentTheme ? { border: `2px solid ${state.accentColor}`, backgroundColor: `${state.accentColor}10`, color: state.accentColor } : {})),
                ...((isMinimalTheme || isBrutalTheme) ? {
                  backgroundColor: isConnectHover ? '#ffffff' : '#000000',
                  color: isConnectHover ? '#000000' : '#ffffff',
                  borderColor: '#000000',
                  borderWidth: 2,
                  borderStyle: 'solid'
                } : {})
              }}
              className={`w-full ${embeddedPrimaryButtonPaddingClass} font-black uppercase tracking-widest text-[11px] md:text-[11px] hover:brightness-110 transition-all flex items-center justify-center gap-2 ${activeTheme.button} ${isMinimalTheme ? '!bg-black !text-white !border-black hover:!bg-white hover:!text-black' : ''} ${isConnecting ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isConnecting ? (
                <><Loader2 size={10} className="animate-spin" /> Connecting...</>
              ) : (
                "Connect Wallet"
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-5 md:space-y-7">
            {/* Progress Card */}
            <div className={`p-2.5 md:p-4 border border-opacity-20 shadow-sm ${activeTheme.itemCard}`}>
              <div className="flex justify-between items-start mb-2 md:mb-4">
                <div className="flex items-center gap-2 md:gap-3">
                  <button
                    onClick={() => handleQuestLayerNav('/browse')}
                    title="Open profile"
                    className={`w-8 h-8 md:w-11 md:h-11 flex items-center justify-center text-sm md:text-xl font-black text-white relative group/level ${activeTheme.iconBox} ${visualXP < state.userXP ? 'animate-pulse' : ''} transition-all duration-300 hover:scale-110 shadow-lg ${currentLevelData.tier.shadow}`}
                    style={{
                      backgroundColor: isLightTheme ? '#000' : state.accentColor,
                      boxShadow: currentLevelData.lvl > 1 ? `0 0 20px ${currentLevelData.tier.color.replace('text-', '')}` : undefined
                    }}
                  >
                    <span className="group-hover/level:opacity-0 transition-opacity">
                      {currentLevelData.lvl}
                    </span>
                    <span className="absolute inset-0 flex items-center justify-center opacity-0 scale-75 group-hover/level:opacity-100 group-hover/level:scale-100 transition-all">
                      <span className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-white/20 flex items-center justify-center">
                        <User className="w-3 h-3 md:w-5 md:h-5" />
                      </span>
                    </span>
                    {visualXP < state.userXP && <Sparkles size={8} className="absolute -top-1 -right-1 text-white animate-bounce" />}

                    {/* Tier Icon Badge on the corner of the level box */}
                    <div className="absolute -top-3 -right-3 w-8 h-8 flex items-center justify-center filter drop-shadow-[0_0_12px_rgba(255,191,0,0.5)]">
                      <TierIcon icon={currentLevelData.tier.icon} size={22} />
                    </div>
                  </button>
                  <div className="flex flex-col gap-0.5">
                    <p className={`text-[9px] md:text-[10px] font-black uppercase tracking-[0.15em] ${isLightTheme ? 'text-slate-500' : 'opacity-40 text-white'}`}>Current Tier</p>
                    <div className="flex items-center gap-1.5 drop-shadow-[0_0_10px_currentColor]">
                      <span className={`text-[11px] md:text-[12px] font-black uppercase tracking-widest flex items-center gap-1 ${
                        isLightTheme
                          ? (currentLevelData.tier.color || 'text-black')
                          : (currentLevelData.tier.color || 'text-white')
                      }`}>
                        {currentLevelData.tier.name}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleQuestLayerNav('/leaderboard')}
                  title="Open leaderboard"
                  className="text-right group/rankxp"
                >
                  <p className={`text-xs md:text-xl font-black tabular-nums ${isLightTheme ? 'text-black' : 'text-white'}`}>{currentLevelData.effectiveXP >= 1000 ? (currentLevelData.effectiveXP / 1000).toFixed(1) + 'k' : currentLevelData.effectiveXP}</p>
                  <p className={`relative text-[10px] md:text-[10px] font-black uppercase tracking-widest ${isLightTheme ? 'text-slate-500' : 'opacity-60 text-white'}`}>
                    <span className="group-hover/rankxp:opacity-0 transition-opacity">Rank XP</span>
                    <span className="absolute right-0 opacity-0 group-hover/rankxp:opacity-100 transition-opacity">
                      Leaderboard
                    </span>
                  </p>
                </button>
              </div>
              <div className={`h-1 md:h-2 w-full overflow-hidden border relative mb-1 ${isLightTheme ? 'bg-slate-100 border-slate-200' : 'bg-slate-200/10 border-white/5'} ${activeTheme.iconBox}`}>
                <div
                  className={`h-full transition-all duration-300 ease-out relative`}
                  style={{ width: `${currentLevelData.progress}%`, backgroundColor: themePrimary }}
                >
                  {visualXP < state.userXP && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-[shimmer_1s_infinite]" />
                  )}
                </div>
              </div>
              <div className="flex justify-between items-center">
                <p className={`text-[10px] md:text-[10px] font-bold uppercase ${isLightTheme ? 'text-slate-400' : 'text-white/40'}`}>
                  Quest XP: <span className={isLightTheme ? 'text-slate-600' : 'text-white/70'}>{visualXP}</span>
                </p>
                <p className={`text-[10px] md:text-[10px] font-bold uppercase ${isLightTheme ? 'text-indigo-600' : 'text-indigo-400'}`} style={!isLightTheme ? { color: themePrimary } : {}}>
                  {currentLevelData.xpNeeded} XP to Lvl {currentLevelData.lvl + 1}
                </p>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => handleQuestLayerNav('/browse')}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${isLightTheme ? 'border-slate-200 text-slate-700 hover:text-black hover:border-slate-300' : 'border-white/10 text-white/70 hover:text-white hover:border-white/20'
                    }`}
                  style={{
                    borderColor: isTransparentTheme ? `${themePrimary}50` : undefined,
                    backgroundColor: `${themePrimary}12`,
                    color: isTransparentTheme ? themePrimary : undefined
                  }}
                >
                  <User className="w-[12px] h-[12px]" />
                  Profile
                </button>
                <button
                  onClick={() => handleQuestLayerNav('/leaderboard')}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${isLightTheme ? 'border-slate-200 text-slate-700 hover:text-black hover:border-slate-300' : 'border-white/10 text-white/70 hover:text-white hover:border-white/20'
                    }`}
                  style={{
                    borderColor: isTransparentTheme ? `${themePrimary}50` : undefined,
                    backgroundColor: `${themePrimary}12`,
                    color: isTransparentTheme ? themePrimary : undefined
                  }}
                >
                  <Trophy className="w-[12px] h-[12px]" />
                  Leaderboard
                </button>
              </div>

              {/* Streak Section */}
              <div className="space-y-1.5 md:space-y-3 pt-3 md:pt-4">
                <div className="flex justify-between items-center px-1">
                  <p className={`text-[10px] md:text-[10px] font-black uppercase tracking-widest ${isLightTheme ? 'text-slate-500' : 'opacity-40 text-white'}`}>
                    Multipliers
                  </p>
                  <p className={`text-[10px] md:text-[10px] font-black uppercase flex items-center gap-1 ${isLightTheme ? 'text-indigo-700' : 'text-indigo-400'}`} style={!isLightTheme ? { color: themePrimary } : {}}>
                    <Flame size={8} /> {state.currentStreak}D STREAK
                  </p>
                </div>
                <div className="flex gap-1 justify-between">
                  {[1, 2, 3, 4, 5].map(day => {
                    const isActive = day <= state.currentStreak;
                    const isCurrent = day === state.currentStreak;
                    return (
                      <div
                        key={day}
                        className={`flex-1 h-8 md:h-12 border flex flex-col items-center justify-center transition-all duration-500 relative ${activeTheme.iconBox} ${isActive
                          ? (isLightTheme ? 'border-transparent shadow-sm' : 'border-transparent shadow-md')
                          : (isLightTheme ? 'border-slate-200 opacity-20' : 'border-white/5 opacity-10')
                          } ${isCurrent ? 'ring-1 md:ring-2 ring-offset-1 md:ring-offset-2' : ''}`}
                        style={{
                          borderColor: isActive ? themePrimary : undefined,
                          backgroundColor: isActive ? `${themePrimary}${isLightTheme ? '10' : '20'}` : undefined,
                          '--tw-ring-color': isCurrent ? themePrimary : 'transparent',
                          ringOffsetColor: isLightTheme ? '#ffffff' : '#0f172a',
                          boxShadow: (isActive && themeBorderRaw && themeBorderRaw !== 'accent') ? `2px 2px 0px 0px ${themeBorderRaw}` : undefined
                        } as React.CSSProperties}
                      >
                        <span className={`text-[8px] md:text-[9px] font-black uppercase ${isActive ? (isLightTheme ? 'text-slate-900' : 'text-white') : (isLightTheme ? 'text-black' : 'text-white')}`}>D{day}</span>
                        <span
                          className={`text-[11px] md:text-[11px] font-mono font-bold transition-colors`}
                          style={{ color: isActive ? themePrimary : (isLightTheme ? '#64748b' : 'rgba(255,255,255,0.4)') }}
                        >
                          {formatXP(100 * Math.pow(2, day - 1))}
                        </span>
                        {isActive && (
                          <div className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow-sm border border-slate-100">
                            <CheckCircle2 size={6} style={{ color: themePrimary }} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                {!state.dailyClaimed ? (
                  <button
                    onClick={claimDaily}
                    style={
                      isTransparentTheme ? {
                        border: `2px solid ${themePrimary}`,
                        backgroundColor: `${themePrimary}20`
                      } : {
                        backgroundColor: themePrimary,
                        borderColor: activeTheme.colors?.secondary || themePrimary,
                        color: activeTheme.colors?.text
                      }
                    }
                    className={`w-full ${embeddedSecondaryButtonPaddingClass} font-black text-[11px] md:text-[11px] uppercase tracking-widest ${activeTheme.button} hover:scale-[1.01] transition-transform`}
                  >
                    Claim Daily Bonus
                  </button>
                ) : (
                  <div className={`w-full py-1.5 md:py-2.5 text-center text-[10px] md:text-[10px] font-black uppercase border flex items-center justify-center gap-1.5 ${isLightTheme ? 'border-slate-200 text-slate-400' : 'opacity-30 text-white border-white/5'} ${activeTheme.iconBox}`}>
                    <Trophy size={8} /> Bonus Stashed
                  </div>
                )}
              </div>

              {/* Viral Boost Section */}
              <div className="space-y-1.5 pt-2 md:pt-3">
                <div className="flex justify-between items-center px-1">
                  <p className={`text-[10px] md:text-[10px] font-black uppercase tracking-widest ${isLightTheme ? 'text-slate-500' : 'opacity-40 text-white'}`}>
                    Viral Boost
                  </p>
                  <p className={`text-[10px] md:text-[10px] font-black uppercase ${isLightTheme ? 'text-emerald-700' : 'text-emerald-400'}`}>
                    +100 XP EACH / DAY
                  </p>
                </div>
                <div
                  className={`p-2 md:p-4 border border-opacity-10 shadow-sm flex flex-col items-center gap-2 ${activeTheme.itemCard}`}
                  style={{
                    borderColor: (themeBorderRaw && themeBorderRaw !== 'accent') ? `${themeBorderRaw}40` : undefined,
                    boxShadow: (themeBorderRaw && themeBorderRaw !== 'accent') ? `3px 3px 0px 0px ${themeBorderRaw}20` : undefined
                  }}
                >
                  <div className="flex gap-2.5 md:gap-5 items-center justify-center w-full">
                    {[
                      { id: 'x', icon: <Twitter size={12} />, color: '#000000' },
                      { id: 'tg', icon: <Send size={12} />, color: '#0088cc' },
                      { id: 'wa', icon: <MessageSquare size={12} />, color: '#25D366' },
                      { id: 'fb', icon: <Facebook size={12} />, color: '#1877F2' },
                      { id: 'li', icon: <Linkedin size={12} />, color: '#0A66C2' }
                    ].map(platform => {
                      const isShared = sharedPlatforms.includes(platform.id);
                      const isVerifying = verifyingPlatforms.includes(platform.id);
                      return (
                        <button
                          key={platform.id}
                          onClick={() => handleShare(platform.id)}
                          className={`relative w-7 h-7 md:w-10 md:h-10 rounded-full flex items-center justify-center text-white transition-all shadow-md active:scale-90 hover:scale-105 ${isShared ? 'grayscale opacity-10 pointer-events-none' : ''} ${isVerifying ? 'pointer-events-none' : ''}`}
                          style={{ backgroundColor: platform.color }}
                        >
                          {platform.icon}
                          {isVerifying && (
                            <svg
                              className="absolute inset-[-4px] h-[calc(100%+8px)] w-[calc(100%+8px)] -rotate-90"
                              viewBox="0 0 40 40"
                            >
                              <circle
                                cx="20"
                                cy="20"
                                r="18"
                                fill="none"
                                stroke="rgba(255,255,255,0.25)"
                                strokeWidth="3"
                              />
                              <circle
                                cx="20"
                                cy="20"
                                r="18"
                                fill="none"
                                stroke="rgba(255,255,255,0.9)"
                                strokeWidth="3"
                                strokeLinecap="round"
                                className="ql-share-progress"
                                style={{ animationDuration: '10s' }}
                              />
                            </svg>
                          )}
                          {isShared && (
                            <div className="absolute -top-0.5 -right-0.5 bg-white rounded-full p-0.5 border border-slate-100 shadow-sm">
                              <CheckCircle2 size={6} className="text-emerald-500" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {onboardingTasks.length > 0 && (
                <div className="space-y-2 md:space-y-3 pt-2 md:pt-3">
                  <div
                    className={`relative overflow-hidden rounded-2xl border ${isLightTheme ? 'border-slate-200' : 'border-white/10'} ${isTransparentTheme ? 'bg-white/5' : ''}`}
                    style={{
                      background: isLightTheme
                        ? `linear-gradient(135deg, ${onboardingAccent}0f, #ffffff 60%)`
                        : `linear-gradient(135deg, ${onboardingAccent}1a, rgba(15,23,42,0.9) 65%)`
                    }}
                  >
                    <div
                      className="absolute inset-0 opacity-60"
                      style={{
                        backgroundImage: `radial-gradient(circle at top right, ${onboardingAccent}40, transparent 60%)`
                      }}
                    />
                    <div className="relative p-3 md:p-4 space-y-3 md:space-y-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-8 h-8 md:w-9 md:h-9 rounded-2xl flex items-center justify-center border ${activeTheme.iconBox}`}
                            style={{
                              backgroundColor: `${onboardingAccent}20`,
                              borderColor: `${onboardingAccent}40`
                            }}
                          >
                            <Sparkles size={14} style={{ color: onboardingAccent }} />
                          </div>
                          <div>
                            <p className={`text-[11px] md:text-xs font-black uppercase tracking-widest ${isLightTheme ? 'text-slate-700' : 'text-white'}`}>
                              Onboarding
                            </p>
                            <p className={`text-[10px] md:text-[10px] ${isLightTheme ? 'text-slate-500' : 'text-white/60'}`}>
                              Quick steps to get started and earn XP.
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-[12px] md:text-sm font-black ${isLightTheme ? 'text-slate-900' : 'text-white'}`}>
                            {onboardingCompletedCount}/{onboardingTasks.length}
                          </p>
                          <p className={`text-[9px] md:text-[9px] font-black uppercase tracking-widest ${isLightTheme ? 'text-slate-500' : 'text-white/50'}`}>
                            Steps
                          </p>
                          <p className={`text-[9px] md:text-[9px] font-bold ${isLightTheme ? 'text-emerald-700' : 'text-emerald-300'}`}>
                            +{onboardingXP} XP
                          </p>
                        </div>
                      </div>
                      <div className="space-y-3 md:space-y-4">
                        {renderTaskList(onboardingTasks, { variant: 'onboarding' })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Missions Board */}
              <div className="space-y-2 md:space-y-3 pt-2 md:pt-3">
                <p className={`text-[10px] md:text-[10px] font-black uppercase tracking-widest px-1 ${isLightTheme ? 'text-slate-500' : 'opacity-40 text-white'}`}>
                  Missions
                </p>
                <div className="space-y-2 md:space-y-3 pb-2">
                  {renderTaskList(missionTasks)}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        className={`p-2 md:p-3 border-t shrink-0 flex items-center justify-center gap-1.5 ${activeTheme.footer ?? activeTheme.header}`}
        style={{ borderColor: themeBorder ?? undefined }}
      >
        <Zap className={`${isLightTheme ? 'text-black' : 'text-indigo-500'} fill-current w-[8px] h-[8px] md:w-[10px] md:h-[10px]`} style={!isLightTheme ? { color: themePrimary } : {}} />
        <a
          href="https://questlayer.app/"
          target="_blank"
          rel="noreferrer"
          className={`text-[9px] md:text-[9px] font-black uppercase tracking-[0.4em] ${isLightTheme ? 'text-slate-500' : 'opacity-30 text-white'} hover:opacity-80 transition-opacity`}
        >
          QuestLayer Engine v2.5
        </a>
      </div>
    </div>
  );

  const shouldShowTrigger = !(isFreeForm && isOpen && !isPreview);

  return (
    <>
      {isOpen && (shouldPortal && portalContainer ? createPortal(overlayElement, portalContainer) : overlayElement)}

      <div
        className={`${wrapperClasses} ${!isFreeForm && isOpen ? (isPreview ? 'max-h-[calc(100%-6rem)]' : 'max-h-[calc(100vh-6rem)]') : ''}`}
        style={wrapperStyle}
      >
        {shouldShowTrigger && (
          <button
            onClick={() => {
              if (!isOpen) initAudio();
              setIsOpen(prev => !prev);
            }}
            style={triggerStyle}
            className={`${isPreview ? (isOpen ? 'relative z-[40]' : 'relative z-[120]') : 'z-40'} flex items-center gap-2 md:gap-3 ${triggerSizeClass} shadow-2xl theme-transition font-bold border-2 ${activeTheme.trigger} ${isLightTheme ? 'text-black' : 'text-white'} ${(isPreview || isEmbedded) && !isOpen ? 'animate-[pulse_3s_ease-in-out_infinite] hover:animate-none scale-110 hover:scale-125' : ''}`}
          >
            {!effectiveConnected ? (
              <span className={`flex items-center gap-1 md:gap-1.5 ${triggerTextClass}`}>
                <Zap className={triggerIconClass} fill="currentColor" />
                Connect
              </span>
            ) : (
              <span className="flex items-center gap-2 md:gap-3">
                <div className={`bg-white/10 px-1 py-0.5 rounded ${triggerMetaClass} font-mono tracking-tighter uppercase truncate max-w-[40px] md:max-w-none`}>
                  {shortAddress}
                </div>
                <div className="flex items-center gap-1 border-l border-white/20 pl-1.5 md:pl-2">
                  <span className={`${triggerMetaClass} font-black uppercase opacity-60`}>Lvl</span>
                  <span className={`${triggerLevelClass} font-black`}>{currentLevelData.lvl}</span>
                </div>
              </span>
            )}
          </button>
        )}
        {isOpen && !shouldPortal && popupContent}
      </div>

      {isOpen && shouldPortal && portalContainer && createPortal(popupContent, portalContainer)}
      <style>{`
        .ql-pos-top {
          top: calc(var(--questlayer-top-offset, 0px) + 1rem);
        }
        @media (min-width: 768px) {
          .ql-pos-top {
            top: calc(var(--questlayer-top-offset, 0px) + 2rem);
          }
        }
        .ql-share-progress {
          stroke-dasharray: 113;
          stroke-dashoffset: 113;
          animation-name: ql-share-progress;
          animation-timing-function: linear;
          animation-fill-mode: forwards;
        }
        @keyframes ql-share-progress {
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </>
  );


};

export default Widget;
