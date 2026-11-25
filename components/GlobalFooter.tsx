import React from 'react';
import { staticPageHref } from './landing/links';

interface GlobalFooterProps {
  variant?: 'default' | 'bright' | 'landing';
  className?: string;
}

function NetworkMarks({ className, decorative }: { className: string; decorative?: boolean }) {
  return (
    <div className={className} aria-hidden={decorative}>
      <svg width="16" height="16" viewBox="0 0 256 417" xmlns="http://www.w3.org/2000/svg" aria-label="Ethereum">
        <path d="M127.961 0l-2.795 9.5v275.668l2.795 2.79 127.962-75.638z" fill="#343434" />
        <path d="M127.962 0L0 212.32l127.962 75.639V154.158z" fill="#8C8C8C" />
        <path d="M127.961 312.187l-1.575 1.92V414.41l1.575 4.59 128.038-180.32z" fill="#3C3C3B" />
        <path d="M127.962 419V312.187L0 238.68z" fill="#8C8C8C" />
        <path d="M127.961 287.958l127.96-75.637-127.96-58.162z" fill="#141414" />
        <path d="M0 212.32l127.962 75.638V154.158z" fill="#393939" />
      </svg>
      <svg width="16" height="16" viewBox="0 0 397 311" xmlns="http://www.w3.org/2000/svg" aria-label="Solana">
        <path d="M64.6 237.9c2.4-2.4 5.7-3.8 9.2-3.8h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H4.6c-5.8 0-8.7-7-4.6-11.1l64.6-62.7z" fill="#9945FF" />
        <path d="M64.6 3.8C67.1 1.4 70.4 0 73.8 0h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H4.6c-5.8 0-8.7-7-4.6-11.1L64.6 3.8z" fill="#14F195" />
        <path d="M333.1 120.1c-2.4-2.4-5.7-3.8-9.2-3.8H6.5c-5.8 0-8.7 7-4.6 11.1l62.7 62.7c2.4 2.4 5.7 3.8 9.2 3.8h317.4c5.8 0 8.7-7 4.6-11.1l-62.7-62.7z" fill="#9945FF" />
      </svg>
      <svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-label="Polygon">
        <path d="M12 0.75L14.6515 8.91031H23.2307L16.2896 13.9544L18.9411 22.1147L12 17.0706L5.05887 22.1147L7.71039 13.9544L0.769264 8.91031H9.34848L12 0.75Z" fill="#8247E5" />
      </svg>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Base">
        <circle cx="12" cy="12" r="12" fill="#0052FF" />
        <path d="M12 18.5V5.5C15.5899 5.5 18.5 8.41015 18.5 12C18.5 15.5899 15.5899 18.5 12 18.5Z" fill="white" />
      </svg>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Arbitrum">
        <circle cx="12" cy="12" r="12" fill="#28A0F0" />
        <path d="M12 16.5L16.5 12L12 7.5L7.5 12L12 16.5Z" fill="white" />
      </svg>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Optimism">
        <circle cx="12" cy="12" r="12" fill="#FF0420" />
        <path d="M8 12C8 9.79086 9.79086 8 12 8C14.2091 8 16 9.79086 16 12C16 14.2091 14.2091 16 12 16C9.79086 16 8 14.2091 8 12Z" fill="white" />
      </svg>
    </div>
  );
}

const GlobalFooter: React.FC<GlobalFooterProps> = ({ variant = 'default', className }) => {
  const year = new Date().getFullYear();
  if (variant === 'landing') {
    return (
      <footer className={`ql-landing-footer ${className ?? ''}`}>
        <a className="ql-landing-footer-brand" href="/">
          <img src="/landing/mascot-mark.webp" alt="" width={40} height={40} loading="lazy" />
          <span className="pixel-text">QuestLayer</span>
        </a>
        <p className="ql-landing-footer-tagline">
          <span>Embed quests</span>
          <span className="ql-landing-footer-dot" aria-hidden="true" />
          <span>Build loyalty</span>
          <span className="ql-landing-footer-dot" aria-hidden="true" />
          <span>Reward users</span>
        </p>
        <nav aria-label="Footer">
          <a href="/browse">Store</a>
          <a href="/explore">Explore</a>
          <a href="/submit">Submit Project</a>
          <a href="/leaderboard">Leaderboard</a>
          <a href={staticPageHref('/docs')}>Docs</a>
          <a href={staticPageHref('/templates')}>Templates</a>
          <a href={staticPageHref('/terms')}>Terms</a>
          <a href={staticPageHref('/privacy')}>Privacy</a>
        </nav>
        <NetworkMarks className="ql-landing-footer-networks" decorative />
        <div className="ql-landing-footer-meta">
          <a href="https://questgalaxy.com/" target="_blank" rel="noopener noreferrer">Powered by <strong>QuestGalaxy</strong></a>
          <span>© {year} All rights reserved</span>
        </div>
      </footer>
    );
  }
  const tone = variant === 'bright'
    ? {
        title: 'text-slate-200',
        nav: 'text-slate-300',
        navHover: 'hover:text-white',
        icons: 'opacity-70',
        powered: 'text-slate-300 hover:text-indigo-300',
        poweredStrong: 'text-slate-200',
        copyright: 'text-slate-400/80'
      }
    : {
        title: 'text-slate-300',
        nav: 'text-slate-500',
        navHover: 'hover:text-slate-200',
        icons: 'opacity-50',
        powered: 'text-slate-500 hover:text-indigo-400',
        poweredStrong: 'text-slate-400',
        copyright: 'text-slate-600/50'
      };
  return (
    <footer className={`w-full px-6 pb-10 ${className ?? ''}`}>
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-2 text-center">
        <span className={`pixel-text text-[14px] uppercase tracking-[0.6em] ${tone.title}`}>QuestLayer</span>
        <nav className={`flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[9px] font-semibold uppercase tracking-[0.35em] ${tone.nav}`}>
          <a className={`${tone.navHover} transition-colors`} href="/">QuestLayer</a>
          <a className={`${tone.navHover} transition-colors`} href="/browse">Store</a>
          <a className={`${tone.navHover} transition-colors`} href="/submit">Submit Project</a>
          <a className={`${tone.navHover} transition-colors`} href="/explore">Explore</a>
          <a className={`${tone.navHover} transition-colors`} href="/leaderboard">Leaderboard</a>
          <a className={`${tone.navHover} transition-colors`} href="/terms">Terms</a>
          <a className={`${tone.navHover} transition-colors`} href="/privacy">Privacy</a>
        </nav>
        <NetworkMarks className={`flex items-center justify-center gap-4 grayscale ${tone.icons}`} />
        <div className="flex flex-col items-center gap-1">
          <a 
            href="https://questgalaxy.com/" 
            target="_blank" 
            rel="noopener noreferrer"
            className={`text-[9px] uppercase tracking-[0.3em] transition-colors ${tone.powered}`}
          >
            powered by <span className={`font-black ${tone.poweredStrong}`}>QuestGalaxy</span>
          </a>
          <span className={`text-[9px] uppercase tracking-[0.3em] ${tone.copyright}`}>© {year} All rights reserved</span>
        </div>
      </div>
    </footer>
  );
};

export default GlobalFooter;
