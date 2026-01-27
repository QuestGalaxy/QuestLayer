
import React, { useEffect, useRef, useState } from 'react';
import Editor from './components/Editor.tsx';
import Widget from './components/Widget.tsx';
import LandingPage from './components/LandingPage.tsx';
import { AppState, Task, Position, ThemeType } from './types';
import { INITIAL_TASKS } from './constants';
import { Layout, Monitor, Smartphone, Globe, Shield, Menu } from 'lucide-react';
import { syncProjectToSupabase } from './lib/supabase';
import { useAppKit, useDisconnect, useAppKitAccount } from '@reown/appkit/react';

import Dashboard from './components/Dashboard.tsx';
import ExplorePage from './components/ExplorePage.tsx';
import QuestBrowse from './components/QuestBrowse.tsx';
import LeaderboardPage from './components/LeaderboardPage.tsx';
import SubmitProject from './components/SubmitProject.tsx';
import ProjectDetail from './components/ProjectDetail.tsx';
import { fetchProjectDetails, deleteProject } from './lib/supabase';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<'landing' | 'dashboard' | 'builder' | 'explore' | 'questbrowse' | 'leaderboard' | 'submit' | 'projectdetail'>(() => {
    // Check URL path on initial load
    if (window.location.pathname === '/browse') {
      return 'questbrowse';
    }
    if (window.location.pathname === '/submit' || window.location.pathname === '/store/submit') {
      return 'submit';
    }
    if (window.location.pathname.startsWith('/store/')) {
      return 'projectdetail';
    }
    if (window.location.pathname === '/explore') {
      return 'explore';
    }
    if (window.location.pathname === '/leaderboard') {
      return 'leaderboard';
    }
    if (window.location.pathname === '/builder') {
      return 'builder';
    }
    if (window.location.pathname === '/dashboard') {
      return 'dashboard';
    }
    return 'landing';
  });

  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const submitModalReturnPathRef = useRef<string>('/');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [leaderboardProjectId, setLeaderboardProjectId] = useState<string | null>(null);

  const getSubmitPath = () => (currentPage === 'questbrowse' ? '/store/submit' : '/submit');
  const getProjectIdFromPath = (path: string) => {
    if (!path.startsWith('/store/') || path.startsWith('/store/submit')) return null;
    const match = path.match(/^\/store\/([^/]+)/);
    return match?.[1] ?? null;
  };
  const getProjectIdFromQuery = (search: string) => {
    if (!search) return null;
    const params = new URLSearchParams(search);
    return params.get('projectId');
  };

  const openSubmitModal = () => {
    submitModalReturnPathRef.current = window.location.pathname + window.location.search;
    setIsSubmitModalOpen(true);
    window.history.pushState({ modal: 'submit' }, '', getSubmitPath());
  };

  useEffect(() => {
    const projectIdFromQuery = getProjectIdFromQuery(window.location.search);
    if (projectIdFromQuery) {
      setSelectedProjectId(projectIdFromQuery);
      setCurrentPage('projectdetail');
      window.history.replaceState(null, '', `/store/${projectIdFromQuery}`);
      return;
    }
    if (currentPage !== 'projectdetail' || selectedProjectId) return;
    const fromPath = getProjectIdFromPath(window.location.pathname);
    if (fromPath) {
      setSelectedProjectId(fromPath);
    } else {
      setCurrentPage('questbrowse');
    }
  }, [currentPage, selectedProjectId]);

  const closeSubmitModal = () => {
    setIsSubmitModalOpen(false);
    const returnPath = submitModalReturnPathRef.current || '/';
    window.history.pushState(null, '', returnPath);
  };

  // Handle URL updates and back button
  useEffect(() => {
    const handlePopState = () => {
      const projectIdFromQuery = getProjectIdFromQuery(window.location.search);
      if (projectIdFromQuery) {
        setSelectedProjectId(projectIdFromQuery);
        setIsSubmitModalOpen(false);
        setCurrentPage('projectdetail');
        window.history.replaceState(null, '', `/store/${projectIdFromQuery}`);
        return;
      }
      const projectIdFromPath = getProjectIdFromPath(window.location.pathname);
      if (projectIdFromPath) {
        setSelectedProjectId(projectIdFromPath);
        setIsSubmitModalOpen(false);
        setCurrentPage('projectdetail');
      } else if (window.location.pathname === '/submit' || window.location.pathname === '/store/submit') {
        setIsSubmitModalOpen(false);
        setCurrentPage('submit');
      } else if (window.location.pathname === '/browse') {
        setIsSubmitModalOpen(false);
        setLeaderboardProjectId(null);
        setCurrentPage('questbrowse');
      } else if (window.location.pathname === '/leaderboard') {
        setIsSubmitModalOpen(false);
        setCurrentPage('leaderboard');
      } else if (window.location.pathname === '/explore') {
        setIsSubmitModalOpen(false);
        setLeaderboardProjectId(null);
        setCurrentPage('explore');
      } else if (window.location.pathname === '/builder') {
        setIsSubmitModalOpen(false);
        setLeaderboardProjectId(null);
        setCurrentPage('builder');
      } else if (window.location.pathname === '/dashboard') {
        setIsSubmitModalOpen(false);
        setLeaderboardProjectId(null);
        setCurrentPage('dashboard');
      } else if (window.location.pathname === '/') {
        setIsSubmitModalOpen(false);
        setLeaderboardProjectId(null);
        setCurrentPage('landing');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Update URL when page changes
  useEffect(() => {
    if (isSubmitModalOpen && currentPage !== 'submit') return;
    const setMetaTag = (selector: string, attributes: Record<string, string>) => {
      let tag = document.querySelector<HTMLMetaElement>(selector);
      if (!tag) {
        tag = document.createElement('meta');
        Object.entries(attributes).forEach(([key, value]) => tag!.setAttribute(key, value));
        document.head.appendChild(tag);
      }
      if (attributes.content) {
        tag.setAttribute('content', attributes.content);
      }
    };

    const applySeo = (payload: { title: string; description: string; path: string; image: string }) => {
      const baseUrl = window.location.origin;
      const pageUrl = `${baseUrl}${payload.path}`;
      const imageUrl = payload.image.startsWith('http') ? payload.image : `${baseUrl}${payload.image}`;

      document.title = payload.title;
      setMetaTag('meta[name="title"]', { name: 'title', content: payload.title });
      setMetaTag('meta[name="description"]', { name: 'description', content: payload.description });

      setMetaTag('meta[property="og:title"]', { property: 'og:title', content: payload.title });
      setMetaTag('meta[property="og:description"]', { property: 'og:description', content: payload.description });
      setMetaTag('meta[property="og:url"]', { property: 'og:url', content: pageUrl });
      setMetaTag('meta[property="og:type"]', { property: 'og:type', content: 'website' });
      setMetaTag('meta[property="og:image"]', { property: 'og:image', content: imageUrl });

      setMetaTag('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary_large_image' });
      setMetaTag('meta[name="twitter:title"]', { name: 'twitter:title', content: payload.title });
      setMetaTag('meta[name="twitter:description"]', { name: 'twitter:description', content: payload.description });
      setMetaTag('meta[name="twitter:url"]', { name: 'twitter:url', content: pageUrl });
      setMetaTag('meta[name="twitter:image"]', { name: 'twitter:image', content: imageUrl });
    };

    const applyJsonLd = (schema: object) => {
      let script = document.querySelector<HTMLScriptElement>('#json-ld-data');
      if (!script) {
        script = document.createElement('script');
        script.id = 'json-ld-data';
        script.type = 'application/ld+json';
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(schema);
    };

    if (currentPage === 'questbrowse') {
      window.history.pushState(null, '', '/browse');
      applySeo({
        title: 'Quest Store - Explore Web3 & Earn XP',
        description: 'Discover decentralized ecosystems, earn XP, and unlock rewards simply by exploring your favorite protocols.',
        path: '/browse',
        image: '/questbrowse.jpeg'
      });
      applyJsonLd({
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'Quest Store - Explore Web3 & Earn XP',
        description: 'Discover decentralized ecosystems, earn XP, and unlock rewards simply by exploring your favorite protocols.',
        url: 'https://questlayer.app/browse'
      });
    } else if (currentPage === 'builder') {
      window.history.pushState(null, '', '/builder');
      applySeo({
        title: 'QuestLayer Builder - Create Your Widget',
        description: 'Build and customize your QuestLayer widget, missions, and themes in minutes.',
        path: '/builder',
        image: '/qlayer.jpeg'
      });
      applyJsonLd({
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'QuestLayer Builder',
        applicationCategory: 'DeveloperApplication',
        operatingSystem: 'Web',
        description: 'Build and customize your QuestLayer widget, missions, and themes in minutes.',
        url: 'https://questlayer.app/builder'
      });
    } else if (currentPage === 'dashboard') {
      window.history.pushState(null, '', '/dashboard');
      applySeo({
        title: 'QuestLayer Dashboard - Manage Your Projects',
        description: 'Manage projects, track performance, and publish quests from your QuestLayer dashboard.',
        path: '/dashboard',
        image: '/qlayer.jpeg'
      });
    } else if (currentPage === 'explore') {
      window.history.pushState(null, '', '/explore');
      applySeo({
        title: 'QuestLayer Explore',
        description: 'Explore the QuestLayer ecosystem.',
        path: '/explore',
        image: '/qlayer.jpeg'
      });
    } else if (currentPage === 'leaderboard') {
      window.history.pushState(null, '', '/leaderboard');
      applySeo({
        title: 'QuestLayer Leaderboard - Your XP Legacy',
        description: 'See top QuestLayer users and compete for the highest XP rank.',
        path: '/leaderboard',
        image: '/leaderboard.jpeg'
      });
      applyJsonLd({
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'QuestLayer Leaderboard',
        description: 'See top QuestLayer users and compete for the highest XP rank.',
        url: 'https://questlayer.app/leaderboard'
      });
    } else if (currentPage === 'submit') {
      const submitPath = window.location.pathname === '/store/submit' ? '/store/submit' : '/submit';
      window.history.pushState(null, '', submitPath);
      applySeo({
        title: 'Quest Store - Submit Project',
        description: 'Submit your project to the QuestLayer Store and get verified for visibility.',
        path: submitPath,
        image: '/questbrowse.jpeg'
      });
    } else if (currentPage === 'projectdetail') {
      const projectPath = selectedProjectId ? `/store/${selectedProjectId}` : '/browse';
      window.history.pushState(null, '', projectPath);
      applySeo({
        title: 'Quest Store - Project Details',
        description: 'View project requirements, rewards, and verification status.',
        path: projectPath,
        image: '/questbrowse.jpeg'
      });
    } else if (currentPage === 'landing') {
      window.history.pushState(null, '', '/');
      applySeo({
        title: 'QuestLayer - Turn Any Website Into a Quest',
        description: 'Launch quests, grow communities, and reward users with on-chain XP across any website.',
        path: '/',
        image: '/qlayer.jpeg'
      });
      applyJsonLd({
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'QuestLayer',
        url: 'https://questlayer.app/',
        potentialAction: {
          '@type': 'SearchAction',
          target: 'https://questlayer.app/browse?q={search_term_string}',
          'query-input': 'required name=search_term_string'
        }
      });
    }
  }, [currentPage, isSubmitModalOpen]);

  const [view, setView] = useState<'editor' | 'preview'>('editor');
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [previewTheme, setPreviewTheme] = useState<'dark' | 'light'>('dark');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const [pendingBrowseRequest, setPendingBrowseRequest] = useState<{ projectId?: string; url?: string } | null>(null);
  const lastPublishedRef = useRef<string | null>(null);

  const [state, setState] = useState<AppState>({
    projectName: 'Vortex Protocol',
    accentColor: '#a78bfa',
    position: 'free-form',
    activeTheme: 'quest',
    tasks: INITIAL_TASKS,
    userXP: 0,
    currentStreak: 1,
    dailyClaimed: false
  });

  const handleSetTasks = (newTasks: Task[]) => setState(prev => ({ ...prev, tasks: newTasks }));
  const handleSetName = (name: string) => setState(prev => ({ ...prev, projectName: name }));
  const handleSetDomain = (domain: string) => setState(prev => ({
    ...prev,
    projectDomain: domain,
    projectDescription: undefined,
    projectSocials: undefined
  }));
  const handleSetDescription = (description: string) => setState(prev => ({
    ...prev,
    projectDescription: description
  }));
  const handleSetLogo = (logo: string) => setState(prev => ({
    ...prev,
    projectLogo: logo
  }));
  const handleSetBanner = (banner: string) => setState(prev => ({
    ...prev,
    projectBanner: banner
  }));
  const handleSetSocials = (socials: AppState['projectSocials']) => setState(prev => ({
    ...prev,
    projectSocials: socials
  }));
  const handleSetColor = (color: string) => setState(prev => ({ ...prev, accentColor: color }));
  const handleSetPos = (pos: Position) => setState(prev => ({ ...prev, position: pos }));
  const handleSetTheme = (theme: ThemeType) => setState(prev => ({ ...prev, activeTheme: theme }));

  const lastMetadataDomainRef = useRef<string | null>(null);

  const fetchProjectMetadata = async (domain: string, signal?: AbortSignal) => {
    const normalized = domain.startsWith('http') ? domain : `https://${domain}`;
    const res = await fetch(`/api/metadata?url=${encodeURIComponent(normalized)}`, { signal });
    if (!res.ok) return null;
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const text = await res.text();
      console.warn('Metadata endpoint returned non-JSON response.', text.slice(0, 120));
      return null;
    }
    const data = await res.json();
    return data ?? null;
  };

  const handleFetchMetadata = async () => {
    const rawDomain = state.projectDomain?.trim();
    if (!rawDomain || rawDomain.length < 4 || !rawDomain.includes('.')) return;

    try {
      const data = await fetchProjectMetadata(rawDomain);
      if (!data) return;
      lastMetadataDomainRef.current = rawDomain.startsWith('http') ? rawDomain : `https://${rawDomain}`;
      setState(prev => ({
        ...prev,
        projectDescription: (data.description || prev.projectDescription || undefined),
        projectSocials: (data.socials && Object.keys(data.socials).length > 0)
          ? data.socials
          : (prev.projectSocials || undefined)
      }));
    } catch (err) {
      console.warn('Failed to fetch project metadata:', err);
    }
  };

  useEffect(() => {
    const rawDomain = state.projectDomain?.trim();
    if (!rawDomain || rawDomain.length < 4 || !rawDomain.includes('.')) return;

    const normalized = rawDomain.startsWith('http') ? rawDomain : `https://${rawDomain}`;
    const needsDescription = state.projectDescription == null;
    const needsSocials = state.projectSocials == null;

    if (!needsDescription && !needsSocials) return;
    if (lastMetadataDomainRef.current === normalized) return;

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      try {
        const data = await fetchProjectMetadata(rawDomain, controller.signal);
        if (!data) return;

        lastMetadataDomainRef.current = normalized;
        setState(prev => ({
          ...prev,
          projectDescription: (data.description || prev.projectDescription || undefined),
          projectSocials: (data.socials && Object.keys(data.socials).length > 0)
            ? data.socials
            : (prev.projectSocials || undefined)
        }));
      } catch (err) {
        if ((err as any)?.name !== 'AbortError') {
          console.warn('Failed to fetch project metadata:', err);
        }
      }
    }, 600);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [state.projectDomain, state.projectDescription, state.projectSocials]);

  const { open } = useAppKit();
  const { address, isConnected, status } = useAppKitAccount();
  const isConnecting = status === 'connecting' || status === 'reconnecting';

  const buildPublishSnapshot = (snapshotState: AppState) => {
      const tasks = snapshotState.tasks.map(task => ({
        id: task.id,
        title: task.title,
      desc: task.desc,
      link: task.link,
      icon: task.icon,
      xp: task.xp,
      isSponsored: task.isSponsored ?? false,
      section: task.section ?? 'missions',
      kind: task.kind ?? 'link',
      question: task.question ?? '',
      answer: task.answer ?? '',
      nftContract: task.nftContract ?? '',
      nftChainId: task.nftChainId ?? null,
      tokenContract: task.tokenContract ?? '',
      tokenChainId: task.tokenChainId ?? null,
      minTokenAmount: task.minTokenAmount ?? '1'
    }));
    return JSON.stringify({
      projectId: snapshotState.projectId ?? null,
      projectName: snapshotState.projectName,
      projectDomain: snapshotState.projectDomain ?? null,
      projectDescription: snapshotState.projectDescription ?? null,
      projectSocials: snapshotState.projectSocials ?? null,
      accentColor: snapshotState.accentColor,
      position: snapshotState.position,
      activeTheme: snapshotState.activeTheme,
      tasks
    });
  };

  const handlePublish = async () => {
    if (!address) return;
    const snapshot = buildPublishSnapshot(state);
    if (state.projectId && lastPublishedRef.current === snapshot) {
      return;
    }
    const { projectId } = await syncProjectToSupabase(state, address);
    if (projectId) {
      setState(prev => ({ ...prev, projectId }));
      lastPublishedRef.current = buildPublishSnapshot({ ...state, projectId });
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
  const [allowAutoLaunch, setAllowAutoLaunch] = useState(true);
  const openProjectDetails = (projectId: string) => {
    setSelectedProjectId(projectId);
    setCurrentPage('projectdetail');
    window.history.pushState(null, '', `/store/${projectId}`);
  };

  useEffect(() => {
    if (currentPage !== 'dashboard') return;
    // Builder is now open to guests, only Dashboard requires auth immediately
    if (isConnected || isConnecting) return;

    // If we were in dashboard and got disconnected, go to landing
    setAllowAutoLaunch(true);
    setCurrentPage('landing');
  }, [currentPage, isConnected, isConnecting]);

  if (currentPage === 'landing') {
    return (
      <>
        <LandingPage
          onLaunch={() => {
            setAllowAutoLaunch(true);
            setCurrentPage('dashboard');
          }}
          onBrowse={() => {
            setCurrentPage('questbrowse');
          }}
          onProjectDetails={openProjectDetails}
          onTryBuilder={() => {
            setCurrentPage('builder');
          }}
          onSubmitProject={openSubmitModal}
          allowAutoLaunch={allowAutoLaunch}
        />
        {isSubmitModalOpen && (
          <SubmitProject
            mode="modal"
            onClose={closeSubmitModal}
            onOpenBuilder={() => {
              setIsSubmitModalOpen(false);
              setCurrentPage('builder');
            }}
          />
        )}
      </>
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
      <>
        <QuestBrowse
          onBack={() => setCurrentPage('landing')}
          onLeaderboard={() => {
            setLeaderboardProjectId(null);
            setCurrentPage('leaderboard');
          }}
          onWidgetBuilder={() => setCurrentPage('dashboard')}
          onSubmitProject={openSubmitModal}
          onProjectDetails={openProjectDetails}
          initialBrowseRequest={pendingBrowseRequest}
          onBrowseHandled={() => setPendingBrowseRequest(null)}
        />
        {isSubmitModalOpen && (
          <SubmitProject
            mode="modal"
            onClose={closeSubmitModal}
            onOpenBuilder={() => {
              setIsSubmitModalOpen(false);
              setCurrentPage('builder');
            }}
          />
        )}
      </>
    );
  }

  if (currentPage === 'leaderboard') {
    return (
      <>
        <LeaderboardPage
          onBack={() => setCurrentPage('questbrowse')}
          onContinue={({ projectId, domain }) => {
            setPendingBrowseRequest({ projectId, url: domain || undefined });
            setCurrentPage('questbrowse');
          }}
          onWidgetBuilder={() => setCurrentPage('dashboard')}
          onSubmitProject={openSubmitModal}
          focusProjectId={leaderboardProjectId}
        />
        {isSubmitModalOpen && (
          <SubmitProject
            mode="modal"
            onClose={closeSubmitModal}
            onOpenBuilder={() => {
              setIsSubmitModalOpen(false);
              setCurrentPage('builder');
            }}
          />
        )}
      </>
    );
  }

  if (currentPage === 'projectdetail') {
    if (!selectedProjectId) {
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-xs uppercase tracking-widest">
          Loading project...
        </div>
      );
    }
    return (
      <ProjectDetail
        projectId={selectedProjectId}
        onBack={() => setCurrentPage('questbrowse')}
        onOpen={({ projectId, domain }) => {
          setPendingBrowseRequest({ projectId, url: domain || undefined });
          setCurrentPage('questbrowse');
        }}
        onLeaderboard={(projectId) => {
          setLeaderboardProjectId(projectId);
          setCurrentPage('leaderboard');
        }}
        onWidgetBuilder={() => setCurrentPage('builder')}
        onSubmitProject={() => setCurrentPage('submit')}
      />
    );
  }

  if (currentPage === 'submit') {
    const submitReturnPage = window.location.pathname.startsWith('/store') ? 'questbrowse' : 'landing';
    return (
      <SubmitProject
        mode="page"
        onClose={() => setCurrentPage(submitReturnPage)}
        onOpenBuilder={() => setCurrentPage('builder')}
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
              lastPublishedRef.current = buildPublishSnapshot({
                projectId: project.id,
                projectName: project.name,
                projectDomain: project.domain,
                projectDescription: project.description ?? undefined,
                projectSocials: project.social_links ?? undefined,
                projectLogo: project.logo_url ?? undefined,
                projectBanner: project.banner_url ?? undefined,
                accentColor: project.accent_color,
                position: project.position as Position,
                activeTheme: project.theme as ThemeType,
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
              });
              setState({
                projectId: project.id,
                projectName: project.name,
                projectDomain: project.domain, // Load domain
                projectDescription: project.description ?? undefined,
                projectSocials: project.social_links ?? undefined,
                projectLogo: project.logo_url ?? undefined,
                projectBanner: project.banner_url ?? undefined,
                accentColor: project.accent_color,
                position: project.position as Position,
                activeTheme: project.theme as ThemeType,
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
              });
              setCurrentPage('builder');
            }
          } catch (err) {
            console.error("Failed to load project", err);
          }
        }}
        onCreateProject={() => {
          // Reset State
          lastPublishedRef.current = null;
          setState({
            projectId: `temp-${Date.now()}`,
            projectName: 'New Project',
            accentColor: '#6366f1',
            position: 'free-form',
            activeTheme: 'sleek',
            tasks: INITIAL_TASKS,
            userXP: 0,
            currentStreak: 1,
            dailyClaimed: false
          });
          setCurrentPage('builder');
        }}
        onDisconnect={() => {
          setAllowAutoLaunch(false);
          setCurrentPage('landing');
        }}
        onBrowse={() => {
          setCurrentPage('questbrowse');
        }}
        onOpenProjectDetails={(projectId) => {
          setSelectedProjectId(projectId);
          setCurrentPage('projectdetail');
          window.history.pushState(null, '', `/store/${projectId}`);
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
            setProjectDescription={handleSetDescription}
            setProjectSocials={handleSetSocials}
            setProjectLogo={handleSetLogo}
            setProjectBanner={handleSetBanner}
            onFetchMetadata={handleFetchMetadata}
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
            className={`w-full h-full border-0 md:border rounded-none md:rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col group transition-all duration-500 ${previewTheme === 'dark'
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
                    Liquid <span style={{ color: state.accentColor }}>Efficiency</span> <br />
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
            <div
              className={`absolute top-20 left-1/2 -translate-x-1/2 hidden md:flex items-center gap-2 bg-black/60 backdrop-blur-md p-1 rounded-full border border-white/10 z-[110] transition-opacity pointer-events-none ${state.position === 'free-form'
                ? 'opacity-100'
                : 'opacity-0 group-hover:opacity-100'
                }`}
            >
              <button
                onClick={() => setPreviewMode('desktop')}
                className={`pointer-events-auto flex items-center gap-2 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-tight transition-all ${previewMode === 'desktop' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'
                  }`}
              >
                <Monitor size={12} /> Live Preview
              </button>
              <button
                onClick={() => setPreviewMode('mobile')}
                className={`pointer-events-auto flex items-center gap-2 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-tight transition-all ${previewMode === 'mobile' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'
                  }`}
              >
                <Smartphone size={12} /> Responsive
              </button>
              <div className="w-px h-3 bg-white/20" />
              <button
                onClick={() => setPreviewTheme('dark')}
                className={`pointer-events-auto flex items-center gap-2 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-tight transition-all ${previewTheme === 'dark' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'
                  }`}
              >
                Dark
              </button>
              <button
                onClick={() => setPreviewTheme('light')}
                className={`pointer-events-auto flex items-center gap-2 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-tight transition-all ${previewTheme === 'light' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'
                  }`}
              >
                Light
              </button>
              <div className="w-px h-3 bg-white/20" />
              <button
                onClick={toggleFullscreen}
                className="pointer-events-auto flex items-center gap-2 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-tight text-white/70 transition-all hover:text-white"
              >
                <Layout size={12} /> {isFullscreen ? 'Exit' : 'Fullscreen'}
              </button>
            </div>

            {/* Focus Mask */}
            <div
              className={`absolute inset-0 bg-black/60 backdrop-blur-[2px] z-[30] transition-all duration-500 opacity-100 ${isWidgetOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
              onClick={() => setIsWidgetOpen(false)}
            />

            {/* Widget Component inside the mock browser container */}
            <Widget
              isOpen={isWidgetOpen}
              setIsOpen={setIsWidgetOpen}
              state={state}
              setState={setState}
              isPreview={true}
              previewPositionMode="state"
            />
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
