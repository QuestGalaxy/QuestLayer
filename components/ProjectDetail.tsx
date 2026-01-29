import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ExternalLink,
  Globe,
  ShieldCheck,
  Sparkles,
  Trophy,
  Sword,
  Zap,
  Users,
  BarChart3,
  Clock,
  CheckCircle2,
  Star,
  Share2,
  ChevronDown,
  ChevronUp,
  Twitter,
  MessageSquare,
  Send,
  Github,
  Linkedin,
  Youtube,
  Instagram,
  Facebook
} from 'lucide-react';
import { useAppKit, useAppKitAccount, useDisconnect } from '@reown/appkit/react';
import { fetchProjectDetails, fetchProjectStats, fetchUserXP, rewardDailyShare } from '../lib/supabase';
import { calculateXpForLevel } from '../lib/gamification';
import UnifiedHeader from './UnifiedHeader';
import GlobalFooter from './GlobalFooter';

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
    return `https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${hostname}&size=128`;
  } catch {
    return '';
  }
};

interface ProjectDetailProps {
  projectId: string;
  onBack: () => void;
  onOpen: (payload: { projectId: string; domain?: string | null }) => void;
  onLeaderboard: () => void;
  onProjectLeaderboard: (projectId: string) => void;
  onWidgetBuilder?: () => void;
  onSubmitProject?: () => void;
}

const ProjectDetail: React.FC<ProjectDetailProps> = ({ projectId, onBack, onOpen, onLeaderboard, onProjectLeaderboard, onWidgetBuilder, onSubmitProject }) => {
  const [project, setProject] = useState<any | null>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [stats, setStats] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [ogImage, setOgImage] = useState<string | null>(null);
  const [showInitial, setShowInitial] = useState(true);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [canExpandDescription, setCanExpandDescription] = useState(false);
  const [logoOverride, setLogoOverride] = useState<string | null>(null);
  const descriptionRef = useRef<HTMLParagraphElement | null>(null);
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();
  const { disconnect } = useDisconnect();
  const [userStats, setUserStats] = useState({ xp: 0, level: 1 });
  const [nextLevelXP, setNextLevelXP] = useState(3000);

  useEffect(() => {
    const loadUserStats = async () => {
      if (address) {
        const stats = await fetchUserXP(address);
        setUserStats(stats);
        setNextLevelXP(calculateXpForLevel(stats.level + 1));
      }
    };
    loadUserStats();
  }, [address]);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const { project, tasks } = await fetchProjectDetails(projectId);
        const stats = await fetchProjectStats(projectId).catch(() => null);
        if (!isMounted) return;
        setProject(project);
        setTasks(tasks || []);
        setStats(stats);

        if (project?.banner_url) {
          setOgImage(project.banner_url);
        } else if (project?.domain) {
          try {
            const target = project.domain.startsWith('http') ? project.domain : `https://${project.domain}`;
            const url = `/api/og?url=${encodeURIComponent(target)}`;
            const res = await fetch(url);
            const data = await res.json();
            if (isMounted && data?.image) {
              setOgImage(data.image);
            }
          } catch (e) {
            console.error('Failed to fetch OG image:', e);
          }
        }
        setShowInitial(!(project?.logo_url || project?.domain));
      } catch (err) {
        if (!isMounted) return;
        setProject(null);
        setTasks([]);
        setStats(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [projectId]);

  useEffect(() => {
    setShowFullDescription(false);
    setLogoOverride(null);
  }, [projectId]);

  useEffect(() => {
    const el = descriptionRef.current;
    if (!el) return;
    const measure = () => {
      const wasClamped = !showFullDescription;
      if (wasClamped) {
        setCanExpandDescription(el.scrollHeight > el.clientHeight + 1);
      } else {
        setCanExpandDescription(true);
      }
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [project?.description, showFullDescription]);

  const [shareRewardMessage, setShareRewardMessage] = useState<string | null>(null);

  const triggerShareReward = useCallback(async () => {
    if (!address) {
      setShareRewardMessage('Connect wallet to earn XP');
      return;
    }
    if (!project?.id) return;

    try {
      const result = await rewardDailyShare(address, project.id);
      if (result.alreadyClaimed) {
        setShareRewardMessage('Daily share already claimed');
        return;
      }
      if (result.xpAwarded > 0) {
        const stats = await fetchUserXP(address);
        setUserStats(stats);
        setNextLevelXP(calculateXpForLevel(stats.level + 1));
        setShareRewardMessage(`+${result.xpAwarded} XP credited!`);
      }
    } catch (err) {
      console.error('Share reward failed:', err);
      setShareRewardMessage('Share logged soon. Try again if it does not appear.');
    }
  }, [address, project?.id]);

  const BadgeWithTooltip: React.FC<{
    children: React.ReactNode;
    tooltipText: React.ReactNode;
    className?: string;
  }> = ({ children, tooltipText }) => (
    <div className="relative flex items-center z-30 group/tooltip">
      {children}
      <div className="hidden group-hover/tooltip:block absolute top-full right-0 mt-2 w-40 p-2 bg-slate-950/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl z-[100] text-[10px] leading-snug text-slate-300 font-medium animate-in fade-in zoom-in-95 duration-200 text-left pointer-events-none select-none">
        {tooltipText}
        <div className="absolute -top-1 right-3 w-2 h-2 bg-slate-950/95 border-t border-l border-white/10 rotate-45 transform" />
      </div>
    </div>
  );

  useEffect(() => {
    if (!project) return;
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

    const setLinkTag = (rel: string, href: string) => {
      let tag = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
      if (!tag) {
        tag = document.createElement('link');
        tag.setAttribute('rel', rel);
        document.head.appendChild(tag);
      }
      tag.setAttribute('href', href);
    };

    const setJsonLd = (payload: Record<string, any>) => {
      let script = document.querySelector<HTMLScriptElement>('script[data-schema="project"]');
      if (!script) {
        script = document.createElement('script');
        script.type = 'application/ld+json';
        script.setAttribute('data-schema', 'project');
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(payload);
    };

    const baseUrl = window.location.origin;
    const canonicalUrl = `${baseUrl}/store/${project.id}`;
    const description = project.description || `Explore quests and rewards from ${project.name} on QuestLayer.`;
    const imageUrl = ogImage || project.banner_url || project.logo_url || '';
    const pageTitle = `${project.name} · QuestLayer`;

    document.title = pageTitle;
    setLinkTag('canonical', canonicalUrl);
    setMetaTag('meta[name="description"]', { name: 'description', content: description });
    setMetaTag('meta[property="og:title"]', { property: 'og:title', content: pageTitle });
    setMetaTag('meta[property="og:description"]', { property: 'og:description', content: description });
    setMetaTag('meta[property="og:url"]', { property: 'og:url', content: canonicalUrl });
    if (imageUrl) {
      setMetaTag('meta[property="og:image"]', { property: 'og:image', content: imageUrl });
    }
    setMetaTag('meta[name="twitter:card"]', { name: 'twitter:card', content: imageUrl ? 'summary_large_image' : 'summary' });
    setMetaTag('meta[name="twitter:title"]', { name: 'twitter:title', content: pageTitle });
    setMetaTag('meta[name="twitter:description"]', { name: 'twitter:description', content: description });
    if (imageUrl) {
      setMetaTag('meta[name="twitter:image"]', { name: 'twitter:image', content: imageUrl });
    }

    const socialLinks = project.social_links ? Object.values(project.social_links).filter(Boolean) : [];
    setJsonLd({
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: pageTitle,
      url: canonicalUrl,
      description,
      image: imageUrl || undefined,
      dateModified: project.last_ping_at || project.created_at,
      isPartOf: {
        '@type': 'WebSite',
        name: 'QuestLayer',
        url: baseUrl
      },
      mainEntity: {
        '@type': 'Project',
        name: project.name,
        url: canonicalUrl,
        description,
        image: imageUrl || undefined,
        sameAs: socialLinks.length > 0 ? socialLinks : undefined
      }
    });
  }, [project, ogImage]);

  const rewardTotal = useMemo(() => {
    return tasks.reduce((sum, task) => sum + (task?.xp_reward || 0), 0);
  }, [tasks]);

  const logoSrc = logoOverride || project?.logo_url || (project?.domain ? getFaviconUrl(project.domain) : '');

  const lastVerifiedLabel = project?.last_ping_at
    ? new Date(project.last_ping_at).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
    : 'Not verified yet';

  const isVerified = Boolean(project?.last_ping_at);
  const isOnline = project?.last_ping_at
    ? new Date(project.last_ping_at).getTime() > Date.now() - 24 * 60 * 60 * 1000
    : false;

  const socialLinks = useMemo(() => {
    const socials = (project?.social_links ?? {}) as Record<string, string | undefined>;
    const entries: Array<{ key: string; label: string; href: string; icon: React.ReactNode }> = [];
    const add = (key: string, label: string, href?: string, icon?: React.ReactNode) => {
      if (!href) return;
      entries.push({ key, label, href, icon: icon ?? <ExternalLink size={16} /> });
    };
    add('twitter', 'Twitter / X', socials.twitter, <Twitter size={16} />);
    add('discord', 'Discord', socials.discord, <MessageSquare size={16} />);
    add('telegram', 'Telegram', socials.telegram, <Send size={16} />);
    add('github', 'GitHub', socials.github, <Github size={16} />);
    add('medium', 'Medium', socials.medium, <ExternalLink size={16} />);
    add('linkedin', 'LinkedIn', socials.linkedin, <Linkedin size={16} />);
    add('youtube', 'YouTube', socials.youtube, <Youtube size={16} />);
    add('instagram', 'Instagram', socials.instagram, <Instagram size={16} />);
    add('tiktok', 'TikTok', socials.tiktok, <ExternalLink size={16} />);
    add('facebook', 'Facebook', socials.facebook, <Facebook size={16} />);
    return entries;
  }, [project]);

  const projectLinks = useMemo(() => {
    const links = new Map<string, string>();
    if (project?.domain) {
      const domain = project.domain.startsWith('http')
        ? project.domain
        : `https://${project.domain}`;
      links.set(project.domain.replace(/^https?:\/\//, ''), domain);
    }
    tasks.forEach((task) => {
      if (!task?.link) return;
      try {
        const url = task.link.startsWith('http') ? task.link : `https://${task.link}`;
        const label = url.replace(/^https?:\/\//, '').split('/')[0];
        if (!links.has(label)) links.set(label, url);
      } catch {
        // ignore invalid link
      }
    });
    return Array.from(links.entries());
  }, [project, tasks]);

  const getTaskIcon = (kind: string) => {
    switch (kind) {
      case 'quiz': return <Zap size={18} className="text-amber-400" />;
      case 'nft': return <Star size={18} className="text-purple-400" />;
      case 'token': return <BarChart3 size={18} className="text-emerald-400" />;
      default: return <ExternalLink size={18} className="text-indigo-400" />;
    }
  };

  const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);
  const shareMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isShareMenuOpen) return;
    const handleClick = (event: MouseEvent) => {
      if (!shareMenuRef.current) return;
      if (!shareMenuRef.current.contains(event.target as Node)) {
        setIsShareMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isShareMenuOpen]);

  const buildShareUrl = useCallback((platform: string) => {
    if (!project) return '';
    const shareUrl = window.location.href;
    let shareText = `Join ${project.name} on QuestLayer and earn rewards!`;

    switch (platform) {
      case 'x':
        shareText = `Excited to be engaging with ${project.name} on QuestLayer and earning rewards! 🚀`;
        return `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
      case 'tg':
        return `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
      case 'wa':
        return `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`;
      case 'fb':
        return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`;
      case 'li':
        return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
      case 'rd':
        return `https://www.reddit.com/submit?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareText)}`;
      default:
        return '';
    }
  }, [project]);

  const handleShareOption = useCallback(async (platform: string) => {
    const shareUrl = window.location.href;
    if (platform === 'copy') {
      await navigator.clipboard.writeText(shareUrl);
      setShareRewardMessage('Link copied. Share to earn rewards daily.');
      triggerShareReward();
      return;
    }

    if (platform === 'ig') {
      await navigator.clipboard.writeText(shareUrl);
      window.open('https://www.instagram.com/', '_blank');
      setShareRewardMessage('Link copied. Paste into Instagram.');
      triggerShareReward();
      return;
    }

    if (platform === 'dc') {
      await navigator.clipboard.writeText(shareUrl);
      window.open('https://discord.com/channels/@me', '_blank');
      setShareRewardMessage('Link copied. Paste into Discord.');
      triggerShareReward();
      return;
    }

    const url = buildShareUrl(platform);
    if (url) {
      window.open(url, '_blank');
      triggerShareReward();
    }
  }, [buildShareUrl, triggerShareReward]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="relative">
          <div className="h-24 w-24 rounded-full border-t-2 border-indigo-500 animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <video
              className="h-16 w-16 rounded-full animate-[prism-drift_4s_ease-in-out_infinite]"
              autoPlay
              loop
              muted
              playsInline
            >
              <source src="/questLogo.webm" type="video/webm" />
            </video>
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4 text-white p-6">
        <div className="h-20 w-20 rounded-2xl bg-slate-900 border border-white/5 flex items-center justify-center mb-4">
          <Zap size={40} className="text-slate-700" />
        </div>
        <div className="text-lg font-black uppercase tracking-[0.3em] text-slate-400">Project not found</div>
        <p className="text-slate-500 text-sm max-w-xs text-center">The project you are looking for might have been moved or deleted.</p>
        <button
          onClick={onBack}
          className="mt-4 px-8 py-3 rounded-2xl bg-white/5 border border-white/10 text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all active:scale-95"
        >
          Back to Store
        </button>
      </div>
    );
  }

  const accentColor = project.accent_color || '#6366f1';

  return (
    <div className="min-h-screen bg-[#020617] text-white overflow-y-auto custom-scroll selection:bg-indigo-500/30 flex flex-col">
      <UnifiedHeader
        onBack={onBack}
        onHome={onBack}
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

      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full opacity-20 blur-[120px]"
          style={{ backgroundColor: accentColor }}
        />
        <div
          className="absolute top-[40%] -right-[10%] w-[50%] h-[50%] rounded-full opacity-10 blur-[100px]"
          style={{ backgroundColor: '#f97316' }}
        />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-10 pt-24 md:pt-32 flex-1 w-full">
        {/* Hero Section */}
        <div className="relative flex flex-col lg:flex-row gap-6 md:gap-12 items-start mb-16 rounded-[2rem] md:rounded-[3rem] p-5 sm:p-6 md:p-12 border border-white/10 bg-white/5 backdrop-blur-sm group">
          {/* Banner Image Background */}
          <div className="absolute inset-0 z-0 overflow-hidden rounded-[2rem] md:rounded-[3rem]">
            {ogImage ? (
              <div className="absolute inset-0">
                <img
                  src={ogImage}
                  alt=""
                  className="w-full h-full object-cover opacity-30 blur-[1px] group-hover:opacity-40 group-hover:scale-105 transition-all duration-700"
                />
                {/* Stronger left-to-right gradient for text readability */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#020617] via-[#020617]/80 to-transparent" />
                {/* Bottom-to-top gradient to blend with the page background */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-transparent" />
              </div>
            ) : (
              <div
                className="absolute inset-0 opacity-10"
                style={{
                  background: `radial-gradient(circle at 20% 50%, ${accentColor} 0%, transparent 70%)`
                }}
              />
            )}
          </div>

          <div className="flex-1 space-y-8 w-full relative z-10">
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-3">
                <BadgeWithTooltip
                  tooltipText={isVerified ? 'Official, verified quest.' : 'Community quest. Not verified.'}
                >
                  <div
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 md:px-4 md:py-1.5 text-[9px] md:text-[10px] font-black uppercase tracking-[0.25em] md:tracking-[0.3em] ${isVerified ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : 'border-amber-500/30 bg-amber-500/10 text-amber-300'}`}
                  >
                    <Sparkles size={12} className="animate-pulse" />
                    {isVerified ? 'Official Quest' : 'Unofficial Quest'}
                  </div>
                </BadgeWithTooltip>
                <div ref={shareMenuRef} className="relative inline-flex">
                  <button
                    onClick={() => setIsShareMenuOpen((prev) => !prev)}
                    className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 md:px-4 md:py-1.5 text-[9px] md:text-[10px] font-black uppercase tracking-[0.25em] md:tracking-[0.3em] text-indigo-300 hover:text-white hover:border-indigo-500/60 hover:bg-indigo-500/20 transition-all"
                    title="Share Project"
                  >
                    <Share2 size={12} className="animate-pulse" /> Share Quest
                  </button>
                  <BadgeWithTooltip tooltipText="Share to earn rewards daily">
                    <span className="absolute -top-2.5 -right-2.5 inline-flex items-center whitespace-nowrap rounded-full border border-yellow-400/60 bg-yellow-400/15 px-2 py-0.5 text-[8px] font-black text-yellow-200 tracking-[0.3em] shadow-[0_0_16px_rgba(234,179,8,0.45)] animate-bounce">
                      +150 XP
                    </span>
                  </BadgeWithTooltip>
                  {isShareMenuOpen && (
                    <div className="absolute top-full right-0 mt-2 w-64 rounded-2xl border border-white/10 bg-slate-950/90 backdrop-blur-xl shadow-2xl z-[120] p-2">
                      <div className="mb-2 px-3 pt-2 text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">
                        Share to Earn 150XP
                      </div>
                      <div className="grid grid-cols-2 gap-2 px-1 text-[11px] font-semibold text-slate-100">
                        <button onClick={() => handleShareOption('wa')} className="flex items-center gap-2 rounded-xl px-3 py-2.5 hover:bg-white/5 transition-colors">
                          <MessageSquare size={14} className="text-emerald-300" /> WhatsApp
                        </button>
                        <button onClick={() => handleShareOption('tg')} className="flex items-center gap-2 rounded-xl px-3 py-2.5 hover:bg-white/5 transition-colors">
                          <Send size={14} className="text-sky-300" /> Telegram
                        </button>
                        <button onClick={() => handleShareOption('x')} className="flex items-center gap-2 rounded-xl px-3 py-2.5 hover:bg-white/5 transition-colors">
                          <Twitter size={14} className="text-slate-200" /> Twitter / X
                        </button>
                        <button onClick={() => handleShareOption('fb')} className="flex items-center gap-2 rounded-xl px-3 py-2.5 hover:bg-white/5 transition-colors">
                          <Facebook size={14} className="text-blue-400" /> Facebook
                        </button>
                        <button onClick={() => handleShareOption('li')} className="flex items-center gap-2 rounded-xl px-3 py-2.5 hover:bg-white/5 transition-colors">
                          <Linkedin size={14} className="text-sky-400" /> LinkedIn
                        </button>
                        <button onClick={() => handleShareOption('rd')} className="flex items-center gap-2 rounded-xl px-3 py-2.5 hover:bg-white/5 transition-colors">
                          <Globe size={14} className="text-orange-300" /> Reddit
                        </button>
                        <button onClick={() => handleShareOption('ig')} className="flex items-center gap-2 rounded-xl px-3 py-2.5 hover:bg-white/5 transition-colors">
                          <Instagram size={14} className="text-pink-300" /> Instagram
                        </button>
                        <button onClick={() => handleShareOption('dc')} className="flex items-center gap-2 rounded-xl px-3 py-2.5 hover:bg-white/5 transition-colors">
                          <MessageSquare size={14} className="text-indigo-300" /> Discord
                        </button>
                      </div>
                      {shareRewardMessage && (
                        <div className="mx-3 my-2 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-[10px] font-semibold text-emerald-200">
                          {shareRewardMessage}
                        </div>
                      )}
                      <div className="my-1 h-px bg-white/5" />
                      <button onClick={() => handleShareOption('copy')} className="mx-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[11px] font-semibold text-slate-100 hover:bg-white/5 transition-colors">
                        <ExternalLink size={14} className="text-slate-300" /> Copy link
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                {/* Logo and Title side by side */}
                <div className="flex items-center gap-4 sm:gap-6">
                  <div
                    className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 rounded-2xl md:rounded-3xl flex items-center justify-center text-3xl sm:text-4xl md:text-5xl font-black shadow-2xl shrink-0 overflow-hidden relative"
                    style={{
                      backgroundColor: `${accentColor}20`,
                      border: `2px solid ${accentColor}40`,
                      color: accentColor,
                      textShadow: `0 0 20px ${accentColor}40`
                    }}
                  >
                    {logoSrc ? (
                      <img
                        src={logoSrc}
                        alt={project.name}
                        className="w-full h-full object-cover"
                        onLoad={(e) => {
                          const img = e.target as HTMLImageElement;
                          if (img.naturalWidth < 16) {
                            setShowInitial(true);
                          } else {
                            setShowInitial(false);
                          }
                        }}
                        onError={() => {
                          if (project?.domain) {
                            const fallback = getFaviconUrl(project.domain);
                            if (fallback && fallback !== logoSrc) {
                              setLogoOverride(fallback);
                              return;
                            }
                          }
                          setShowInitial(true);
                        }}
                      />
                    ) : null}
                    {showInitial && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        {project.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  <h1 className="text-3xl sm:text-4xl md:text-7xl font-black uppercase tracking-tight leading-none">
                    {project.name}
                  </h1>
                </div>

                {/* Description and Info below */}
                <div className="space-y-4 max-w-3xl">
                  {project.description && (
                    <div className="relative">
                      <p
                        ref={descriptionRef}
                        onClick={() => {
                          if (canExpandDescription) setShowFullDescription((prev) => !prev);
                        }}
                        className={`text-sm sm:text-base text-slate-300/80 leading-relaxed ${showFullDescription ? '' : 'line-clamp-2'} transition-all duration-300 ${canExpandDescription ? 'cursor-pointer' : ''}`}
                      >
                        {project.description}
                      </p>
                      {canExpandDescription && (
                        <button
                          type="button"
                          onClick={() => setShowFullDescription((prev) => !prev)}
                          className="absolute left-1/2 -translate-x-1/2 -bottom-[5px] inline-flex items-center justify-center text-indigo-300 hover:text-white transition-colors"
                          aria-label={showFullDescription ? 'Collapse description' : 'Expand description'}
                        >
                          {showFullDescription ? <ChevronUp size={14} /> : <ChevronDown size={14} className="arrow-float" />}
                        </button>
                      )}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-slate-400 text-xs sm:text-sm">
                    <a
                      href={project.domain?.startsWith('http') ? project.domain : `https://${project.domain}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 hover:text-white transition-colors group min-w-0"
                    >
                      <Globe size={16} className="text-indigo-400 group-hover:rotate-12 transition-transform" />
                      <span className="border-b border-transparent group-hover:border-slate-500 transition-all truncate">
                        {project.domain || 'No domain provided'}
                      </span>
                    </a>
                    <div className="h-1 w-1 rounded-full bg-slate-700" />
                    {isVerified ? (
                      <BadgeWithTooltip tooltipText="Auto‑verified via widget activity.">
                        <div className="flex items-center gap-2 text-sm text-sky-300">
                          <ShieldCheck size={16} />
                          <span>Verified</span>
                        </div>
                      </BadgeWithTooltip>
                    ) : (
                      <BadgeWithTooltip tooltipText="Embed widget to verify.">
                        <div className="flex items-center gap-2 text-sm text-amber-300">
                          <ShieldCheck size={16} />
                          <span>Not Verified</span>
                        </div>
                      </BadgeWithTooltip>
                    )}
                    {isOnline && (
                      <div className="flex items-center gap-2 text-sm text-emerald-400">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span>Online</span>
                      </div>
                    )}
                  </div>

                  {socialLinks.length > 0 && (
                    <div className="pt-2 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        {socialLinks.map((link) => (
                          <a
                            key={link.key}
                            href={link.href}
                            target="_blank"
                            rel="noreferrer"
                            title={link.label}
                            className="group inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:text-white hover:border-white/20 hover:bg-white/10 hover:-translate-y-1 transition-all duration-300 shadow-lg"
                          >
                            <span className="text-slate-400 group-hover:text-indigo-400 transition-colors">
                              {link.icon}
                            </span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full">
              <button
                onClick={() => onOpen({ projectId: project.id, domain: project.domain })}
                className="group relative flex-1 min-w-0 px-3 py-3 sm:px-6 sm:py-3.5 md:px-8 md:py-4 rounded-xl md:rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 text-[11px] sm:text-sm font-black uppercase tracking-[0.12em] sm:tracking-widest whitespace-nowrap transition-all hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(251,191,36,0.45)] overflow-hidden"
              >
                <span className="absolute inset-0 translate-x-[-120%] group-hover:translate-x-[120%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/70 to-transparent opacity-80" />
                <span className="relative inline-flex items-center justify-center gap-2 sm:gap-3 w-full font-extrabold">
                  <Sword size={16} className="text-slate-950" />
                  Start Quest
                </span>
              </button>
              <button
                onClick={() => onProjectLeaderboard(project.id)}
                className="flex-1 min-w-0 px-3 py-3 sm:px-6 sm:py-3.5 md:px-8 md:py-4 rounded-xl md:rounded-2xl border border-white/10 bg-white/5 text-white/80 text-[11px] sm:text-sm font-black uppercase tracking-[0.12em] sm:tracking-widest hover:text-white hover:border-white/20 hover:bg-white/10 transition-all active:scale-95"
              >
                <span className="inline-flex items-center justify-center gap-2 sm:gap-3 w-full">
                  <Trophy size={16} className="text-amber-400" />
                  Leaderboard
                </span>
              </button>
            </div>
          </div>



          {/* Key Stats Sidebar */}
          <div className="w-full lg:w-80 grid grid-cols-2 lg:grid-cols-1 gap-4 relative z-10">
            <div className="p-4 sm:p-5 md:p-6 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl group hover:border-indigo-500/30 transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                  <Zap size={16} />
                </div>
                <div className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-slate-500 font-black truncate">Total Reward</div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white group-hover:text-indigo-400 transition-colors">{rewardTotal} XP</div>
              <div className="mt-1 text-[9px] sm:text-[10px] text-slate-500 uppercase font-bold tracking-wider leading-snug">Across {tasks.length} missions</div>
            </div>

            <div className="p-4 sm:p-5 md:p-6 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl group hover:border-emerald-500/30 transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <Users size={16} />
                </div>
                <div className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-slate-500 font-black min-w-0 truncate">Participants</div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white group-hover:text-emerald-400 transition-colors">{stats?.connected_wallets ?? 0}</div>
              <div className="mt-1 text-[9px] sm:text-[10px] text-slate-500 uppercase font-bold tracking-wider leading-snug">{stats?.auw ?? 0} active this week</div>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Tasks Area */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xs font-black uppercase tracking-[0.3em] text-slate-500">Quest Requirements</h2>
              <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
                {tasks.length} Missions Available
              </div>
            </div>

            <div className="grid gap-4">
              {tasks.length === 0 ? (
                <div className="rounded-[2rem] border border-dashed border-white/10 p-12 text-center">
                  <Clock size={40} className="mx-auto text-slate-700 mb-4" />
                  <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No missions published yet</p>
                </div>
              ) : (
                tasks.map((task, idx) => (
                  <div
                    key={task.id}
                    className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-md p-6 hover:bg-white/[0.08] hover:border-white/20 transition-all"
                  >
                    <div className="relative z-10 flex items-center gap-6">
                      <div className="h-14 w-14 rounded-2xl bg-slate-900 border border-white/10 flex items-center justify-center shrink-0 shadow-xl group-hover:scale-110 transition-transform">
                        {getTaskIcon(task.task_kind)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-lg font-black text-white truncate group-hover:text-indigo-300 transition-colors">
                            {task.title}
                          </h3>
                          {task.is_sponsored && (
                            <span className="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-[8px] font-black uppercase tracking-widest text-amber-400">
                              Sponsored
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-400 line-clamp-1 group-hover:text-slate-300 transition-colors">
                          {task.description || 'Complete this task to earn XP and rewards.'}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-black text-white">+{task.xp_reward || 0}</div>
                        <div className="text-[9px] font-black uppercase tracking-widest text-indigo-400/80">XP Reward</div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6 md:space-y-8">
            {/* Project Links */}
            <div className="rounded-[2.5rem] border border-white/10 bg-white/5 backdrop-blur-xl p-6 md:p-8 order-2 lg:order-1">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-6 flex items-center gap-2">
                <Globe size={14} /> Ecosystem Links
              </h3>
              <div className="space-y-3">
                {projectLinks.length === 0 ? (
                  <div className="text-xs text-slate-500 italic">No public links provided</div>
                ) : (
                  projectLinks.map(([label, url]) => (
                    <a
                      key={label}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between gap-3 rounded-2xl border border-white/5 bg-slate-950/50 p-4 text-sm text-white hover:border-indigo-500/40 hover:bg-indigo-500/5 transition-all group"
                    >
                      <span className="truncate font-bold text-slate-300 group-hover:text-white transition-colors">{label}</span>
                      <ExternalLink size={14} className="text-slate-500 group-hover:text-indigo-400 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </a>
                  ))
                )}
              </div>
            </div>

            {/* Trust & Verification */}
            <div className="rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-emerald-500/10 to-transparent p-6 md:p-8 order-3 lg:order-2">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-6 flex items-center gap-2">
                <ShieldCheck size={14} /> Trust & Verification
              </h3>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${isVerified ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-500/10 text-slate-400'}`}>
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <div className="text-sm font-black text-white uppercase tracking-tight">
                      {isVerified ? 'Active Integration' : 'Not Verified Yet'}
                    </div>
                    <div className="text-xs text-slate-400 mt-1 leading-relaxed">
                      {isVerified
                        ? `QuestLayer widget is detected and active on ${project.domain}.`
                        : 'We have not detected a live widget ping for this project yet.'}
                    </div>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0">
                    <Clock size={20} />
                  </div>
                  <div>
                    <div className="text-sm font-black text-white uppercase tracking-tight">Last Verified</div>
                    <div className="text-xs text-slate-400 mt-1">{lastVerifiedLabel}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Overview */}
            <div className="rounded-[2.5rem] border border-white/10 bg-white/5 backdrop-blur-xl p-6 md:p-8 order-1 lg:order-3">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-6 flex items-center gap-2">
                <BarChart3 size={14} /> Activity Feed
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-bold uppercase tracking-wider">Total Interactions</span>
                  <span className="text-white font-black">{(stats?.total_visits ?? 0) + (stats?.tasks_completed ?? 0)}</span>
                </div>
                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: '65%' }} />
                </div>
                <div className="flex items-center justify-between text-xs pt-2">
                  <span className="text-slate-400 font-bold uppercase tracking-wider">Completion Rate</span>
                  <span className="text-white font-black">
                    {stats?.total_visits ? Math.round(((stats?.tasks_completed ?? 0) / stats.total_visits) * 100) : 0}%
                  </span>
                </div>
                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '42%' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <GlobalFooter className="mt-8" />
    </div>
  );
};

export default ProjectDetail;
