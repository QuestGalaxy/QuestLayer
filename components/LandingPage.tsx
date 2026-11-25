import { useEffect, useId, useRef, useState } from 'react';
import type { FocusEvent, KeyboardEvent } from 'react';
import { ArrowRight, ArrowUpRight, Code2, Flame, Gem, Menu, MousePointerClick, Palette, Plus, Store, Target, Trophy, Zap } from 'lucide-react';
import { useAppKitAccount } from '@reown/appkit/react';
import GlobalFooter from './GlobalFooter';
import LandingDemo from './landing/LandingDemo';
import LandingEcosystem from './landing/LandingEcosystem';
import { followLandingLink, staticPageHref } from './landing/links';
import './landing/landing.css';

interface LandingPageProps {
  onLaunch: () => void;
  onBrowse: () => void;
  onTryBuilder: () => void;
  onSubmitProject: () => void;
  onProjectDetails?: (projectId: string) => void;
  allowAutoLaunch?: boolean;
}

const steps = [
  { title: 'Create', description: 'Choose your quests and XP.', Icon: MousePointerClick },
  { title: 'Customize', description: 'Match your theme, color and placement.', Icon: Palette },
  { title: 'Embed', description: 'Add the snippet to your website.', Icon: Code2 }
];

const features = [
  { title: 'Quests', description: 'Give visitors a reason to take action.', Icon: Target, href: '/features/quests' },
  { title: 'Rewards', description: 'Reward progress with XP and perks.', Icon: Gem, href: '/features/rewards' },
  { title: 'Streaks', description: 'Give players a reason to come back.', Icon: Flame, href: '/features/streaks' },
  { title: 'Leaderboards', description: 'Let players see how they rank.', Icon: Trophy, href: '/leaderboard' }
];

const templates = [
  { title: 'NFT holder quest', category: 'Web3 community', art: 'community', href: '/templates/nft-holder-only' },
  { title: 'Referral campaign', category: 'Product launch', art: 'launch', href: '/templates/referral-campaign' },
  { title: 'Daily login streak', category: 'Repeat engagement', art: 'gaming', href: '/templates/daily-login' },
  { title: 'E-commerce playbook', category: 'Use-case guide', art: 'commerce', href: '/use-cases/ecommerce' }
];

const faq = [
  { question: 'Do I need a wallet to use QuestLayer?', answer: 'You can try the demo and design a widget without a wallet. Connect a wallet to save and publish from the builder.' },
  { question: 'Where can I embed the widget?', answer: 'Add the embed snippet to a website where you can insert custom HTML or JavaScript.' },
  { question: 'Is QuestLayer only for Web3 projects?', answer: 'You can build quests around links, quizzes, and daily check-ins. Web3 projects can also use wallet and NFT-based quests.' }
];

const supportsPopover = typeof HTMLElement !== 'undefined' && 'showPopover' in HTMLElement.prototype;

function LandingHeader({ onTryBuilder, onBrowse, onLaunch }: Pick<LandingPageProps, 'onTryBuilder' | 'onBrowse' | 'onLaunch'>) {
  const menuId = useId();
  const menuRef = useRef<HTMLUListElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [expanded, setExpanded] = useState(false);

  function closeMenu() {
    const menu = menuRef.current;
    if (supportsPopover && menu?.matches(':popover-open')) menu.hidePopover();
    if (!supportsPopover) setExpanded(false);
  }

  function closeOnEscape(event: KeyboardEvent<HTMLElement>) {
    if (supportsPopover || !expanded || event.key !== 'Escape') return;
    closeMenu();
    triggerRef.current?.focus();
  }

  function closeOnBlur(event: FocusEvent<HTMLElement>) {
    if (!supportsPopover && !event.currentTarget.contains(event.relatedTarget)) closeMenu();
  }

  return (
    <header className="ql-landing-header">
      <div className="ql-landing-header-inner">
        <a className="ql-landing-brand" href="/" aria-current="page">
          <img src="/landing/mascot-mark.webp" alt="" width={38} height={38} />
          QuestLayer
        </a>
        <div className="ql-landing-header-actions">
          <a className="ql-landing-button ql-landing-button--primary ql-landing-button--small" href="/builder" onClick={event => followLandingLink(event, onTryBuilder)}>
            Get started <ArrowRight aria-hidden="true" />
          </a>
          <nav className="ql-landing-nav" aria-label="Main navigation" onKeyDown={closeOnEscape} onBlur={closeOnBlur}>
            <button
              ref={triggerRef}
              className="ql-landing-menu-button"
              type="button"
              aria-label="Menu"
              aria-controls={menuId}
              aria-expanded={supportsPopover ? undefined : expanded}
              popoverTarget={supportsPopover ? menuId : undefined}
              onClick={supportsPopover ? undefined : () => setExpanded(value => !value)}
            >
              <Menu size={23} aria-hidden="true" />
            </button>
            <ul ref={menuRef} id={menuId} className="ql-landing-menu" popover={supportsPopover ? 'auto' : undefined} hidden={!supportsPopover && !expanded}>
              <li><a href="#how-it-works" onClick={closeMenu}>How it works</a></li>
              <li><a href={staticPageHref('/templates')} onClick={closeMenu}>Templates</a></li>
              <li><a href="/browse" onClick={event => { closeMenu(); followLandingLink(event, onBrowse); }}>Quest Store</a></li>
              <li><a href="/explore" onClick={closeMenu}>Explore</a></li>
              <li><a href="/dashboard" onClick={event => { closeMenu(); followLandingLink(event, onLaunch); }}>Dashboard</a></li>
              <li><a href={staticPageHref('/docs')} onClick={closeMenu}>Docs <ArrowUpRight size={14} aria-hidden="true" /></a></li>
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
}

export default function LandingPage({ onLaunch, onBrowse, onTryBuilder, onSubmitProject, onProjectDetails, allowAutoLaunch = true }: LandingPageProps) {
  const { isConnected } = useAppKitAccount();

  useEffect(() => {
    if (isConnected && allowAutoLaunch) onLaunch();
  }, [isConnected, allowAutoLaunch, onLaunch]);

  return (
    <div className="ql-landing">
      <a className="ql-landing-skip" href="#landing-main">Skip to content</a>
      <LandingHeader onTryBuilder={onTryBuilder} onBrowse={onBrowse} onLaunch={onLaunch} />
      <main id="landing-main" className="ql-landing-main" tabIndex={-1}>
        <section className="ql-landing-hero" aria-labelledby="ql-hero-title">
          <div className="ql-hero-copy">
            <h1 id="ql-hero-title">Make your website <em>playable.</em></h1>
            <p>Add quests, XP and rewards to any website.</p>
            <div className="ql-hero-actions">
              <a className="ql-landing-button ql-landing-button--primary" href="/builder" onClick={event => followLandingLink(event, onTryBuilder)}>
                Build your widget <ArrowRight aria-hidden="true" />
              </a>
              <a className="ql-landing-button ql-landing-button--secondary" href="/browse" onClick={event => followLandingLink(event, onBrowse)}>
                <Store aria-hidden="true" /> Browse Store
              </a>
            </div>
          </div>
          <div className="ql-landing-stage">
            <img
              className="ql-landing-stage-art"
              src="/landing/hero.webp"
              srcSet="/landing/hero-small.webp 760w, /landing/hero.webp 1440w"
              sizes="(max-width: 29rem) 100vw, (max-width: 64rem) 48rem, 58rem"
              alt=""
              width={1440}
              height={960}
              fetchPriority="high"
              decoding="async"
            />
            <LandingDemo />
          </div>
          <ul className="ql-hero-benefits" aria-label="Widget benefits">
            <li><Code2 aria-hidden="true" /> One embed</li>
            <li><Zap aria-hidden="true" /> No redirects</li>
            <li><Palette aria-hidden="true" /> Fully customizable</li>
          </ul>
        </section>

        <section className="ql-landing-section ql-steps" id="how-it-works" aria-labelledby="ql-steps-title">
          <h2 id="ql-steps-title">Live in three simple steps</h2>
          <ol className="ql-steps-grid">
            {steps.map(({ title, description, Icon }, index) => (
              <li key={title}>
                <span className="ql-step-number" aria-hidden="true">{index + 1}</span>
                <Icon className="ql-step-icon" aria-hidden="true" />
                <div><h3>{title}</h3><p>{description}</p></div>
                {index < steps.length - 1 && <ArrowRight className="ql-step-arrow" aria-hidden="true" />}
              </li>
            ))}
          </ol>
        </section>

        <section className="ql-landing-section ql-features" aria-labelledby="ql-features-title">
          <h2 id="ql-features-title">Quests that keep people playing</h2>
          <ul className="ql-features-grid">
            {features.map(({ title, description, Icon, href }) => (
              <li key={title}>
                <a href={href.startsWith('/features/') ? staticPageHref(href) : href}>
                  <span className="ql-feature-icon"><Icon aria-hidden="true" /></span>
                  <span><strong>{title}</strong><small>{description}</small></span>
                  <ArrowUpRight className="ql-feature-arrow" size={16} aria-hidden="true" />
                </a>
              </li>
            ))}
          </ul>
        </section>

        <section className="ql-landing-section ql-templates" id="landing-templates" aria-labelledby="ql-templates-title">
          <div className="ql-section-heading">
            <div><h2 id="ql-templates-title">Start with a template</h2><p>Find a starting point for your next quest.</p></div>
            <a className="ql-landing-text-link" href={staticPageHref('/templates')}>Browse templates <ArrowRight size={16} aria-hidden="true" /></a>
          </div>
          <ul className="ql-template-grid">
            {templates.map(template => (
              <li key={template.art}>
                <a href={staticPageHref(template.href)} className="ql-template-card">
                  <img src={`/landing/${template.art}.webp`} alt="" width={496} height={248} loading="lazy" decoding="async" />
                  <span><strong>{template.title}</strong><small>{template.category}</small></span>
                </a>
              </li>
            ))}
          </ul>
        </section>

        <LandingEcosystem onBrowse={onBrowse} onSubmitProject={onSubmitProject} onProjectDetails={onProjectDetails} />

        <section className="ql-landing-section ql-final" aria-labelledby="ql-final-title">
          <img src="/landing/cta.webp" alt="" width={1280} height={427} loading="lazy" decoding="async" />
          <div className="ql-final-content">
            <h2 id="ql-final-title">Turn your community into a game.</h2>
            <a className="ql-landing-button ql-landing-button--primary" href="/builder" onClick={event => followLandingLink(event, onTryBuilder)}>
              Get started <ArrowRight aria-hidden="true" />
            </a>
          </div>
        </section>

        <section className="ql-landing-section ql-faq" aria-labelledby="ql-faq-title">
          <h2 id="ql-faq-title">Frequently asked questions</h2>
          <div>
            {faq.map(({ question, answer }) => (
              <details key={question} name="ql-landing-faq">
                <summary>{question}<Plus size={18} aria-hidden="true" /></summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        </section>
      </main>
      <GlobalFooter variant="landing" />
    </div>
  );
}
