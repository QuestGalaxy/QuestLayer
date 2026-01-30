import React, { useEffect, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import Widget from './components/Widget.tsx';
import { INITIAL_TASKS } from './constants.ts';
import { AppKitProvider } from './appkit.tsx';
import { setupAudioListeners } from './lib/audio-effects.js';
import type { AppState, Task } from './types.ts';
import widgetStyles from './widget.css?inline';

export type WidgetConfig = Partial<
  Pick<AppState, 'projectName' | 'accentColor' | 'position' | 'activeTheme' | 'tasks' | 'widgetSize'>
> & {
  mountId?: string;
  apiBaseUrl?: string;
};

declare global {
  interface Window {
    QuestLayer?: {
      init: (config?: WidgetConfig) => void;
    };
  }
}

const DEFAULT_STATE: AppState = {
  projectName: 'QuestLayer',
  accentColor: '#a78bfa',
  position: 'free-form',
  activeTheme: 'quest',
  widgetSize: 'medium',
  tasks: INITIAL_TASKS,
  userXP: 0,
  currentStreak: 1,
  dailyClaimed: false
};

const normalizeConfig = (config?: WidgetConfig): AppState => {
  const { mountId, ...safeConfig } = config ?? {};
  const tasks = config?.tasks?.length
    ? config.tasks.map(task => {
      const rawKind = (task.kind ?? 'link') as string;
      return ({
        ...task,
        id: task.id ?? `task-${Math.random().toString(36).substr(2, 9)}`,
        link: task.link ?? '',
        section: task.section ?? 'missions',
        kind: rawKind === 'secret' ? 'quiz' : (rawKind as Task['kind']),
        question: task.question ?? '',
        answer: task.answer ?? '',
        nftContract: task.nftContract ?? '',
        nftChainId: task.nftChainId ?? 1,
        tokenContract: task.tokenContract ?? '',
        tokenChainId: task.tokenChainId ?? 1,
        minTokenAmount: task.minTokenAmount ?? '1'
      });
    })
    : DEFAULT_STATE.tasks;
  return {
    ...DEFAULT_STATE,
    ...safeConfig,
    tasks
  };
};

const HOST_ID = 'questlayer-widget-host';
const ROOT_ID = 'questlayer-widget-root';
const PORTAL_HOST_ID = 'questlayer-widget-portal';
const PORTAL_ROOT_ID = 'questlayer-widget-portal-root';
const STYLE_ATTR = 'data-questlayer-styles';
const FONT_ATTR = 'data-questlayer-fonts';
const GLOBAL_FONT_ATTR = 'data-questlayer-fonts-global';
const APPKIT_Z_ATTR = 'data-questlayer-appkit-z';
const FONT_URL =
  'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&family=Space+Mono&family=Inter:wght@400;700;900&display=swap';
let widgetRoot: Root | null = null;
let renderVersion = 0;

const ensureShadowAssets = (shadow: ShadowRoot) => {
  if (!shadow.querySelector(`style[${STYLE_ATTR}]`)) {
    const style = document.createElement('style');
    style.setAttribute(STYLE_ATTR, 'true');
    // Ensure preflight/reset is applied inside shadow dom
    style.textContent = `
      :host {
        all: initial;
        display: block;
        font-family: 'Inter', 'Plus Jakarta Sans', sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }
      :host([data-questlayer-inline='true']) {
        display: inline-block;
      }
      * {
        box-sizing: border-box;
      }
      ${widgetStyles}
    `;
    shadow.appendChild(style);
  }

  if (!shadow.querySelector(`link[${FONT_ATTR}]`)) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = FONT_URL;
    link.setAttribute(FONT_ATTR, 'true');
    shadow.appendChild(link);
  }

  if (document.head && !document.head.querySelector(`link[${GLOBAL_FONT_ATTR}]`)) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = FONT_URL;
    link.setAttribute(GLOBAL_FONT_ATTR, 'true');
    document.head.appendChild(link);
  }

  if (document.head && !document.head.querySelector(`style[${APPKIT_Z_ATTR}]`)) {
    const style = document.createElement('style');
    style.setAttribute(APPKIT_Z_ATTR, 'true');
    style.textContent = 'w3m-modal { z-index: 2147483647 !important; }';
    document.head.appendChild(style);
  }
};

const ensureMount = (options: { mountId?: string; inline?: boolean } = {}): HTMLDivElement => {
  const { mountId, inline } = options;
  const targetHostId = inline && mountId ? mountId : HOST_ID;
  const legacyRoot = document.getElementById(ROOT_ID);
  if (legacyRoot && legacyRoot.parentElement && legacyRoot.parentElement.id !== targetHostId) {
    legacyRoot.remove();
  }

  let host = document.getElementById(targetHostId) as HTMLDivElement | null;
  if (!host) {
    host = document.createElement('div');
    host.id = targetHostId;
    if (document.body) {
      document.body.appendChild(host);
    }
  }
  if (inline) {
    host.setAttribute('data-questlayer-inline', 'true');
    if (!mountId) {
      console.warn('[QuestLayer] Free-form embed missing mountId; falling back to inline host.');
    }
    if (mountId) {
      if (!host.style.pointerEvents) host.style.pointerEvents = 'none';
      if (!host.style.fontSize) host.style.fontSize = '16px';
      if (!host.style.lineHeight) host.style.lineHeight = 'normal';
    } else {
      host.style.cssText = [
        'position: relative',
        'pointer-events: none',
        'font-size: 16px',
        'line-height: normal'
      ].join('; ');
    }
  } else {
    host.removeAttribute('data-questlayer-inline');
    host.style.cssText = [
      'position: fixed',
      'top: 0',
      'left: 0',
      'width: 100%',
      'height: 100%',
      'z-index: 2147483647',
      'pointer-events: none',
      'font-size: 16px',
      'line-height: normal'
    ].join('; ');
  }

  const shadow = host.shadowRoot || host.attachShadow({ mode: 'open' });
  ensureShadowAssets(shadow);
  setupAudioListeners(shadow);

  let container = shadow.querySelector(`#${ROOT_ID}`) as HTMLDivElement | null;
  if (!container) {
    container = document.createElement('div');
    container.id = ROOT_ID;
    container.style.pointerEvents = 'auto';
    shadow.appendChild(container);
  }

  return container;
};

const ensurePortalMount = (): HTMLDivElement => {
  let host = document.getElementById(PORTAL_HOST_ID) as HTMLDivElement | null;
  if (!host) {
    host = document.createElement('div');
    host.id = PORTAL_HOST_ID;
    if (document.body) {
      document.body.appendChild(host);
    }
  }
  host.style.cssText = [
    'position: fixed',
    'top: 0',
    'left: 0',
    'width: 100%',
    'height: 100%',
    'z-index: 2147483647',
    'pointer-events: none',
    'font-size: 16px',
    'line-height: normal'
  ].join('; ');

  const shadow = host.shadowRoot || host.attachShadow({ mode: 'open' });
  ensureShadowAssets(shadow);
  setupAudioListeners(shadow);

  let container = shadow.querySelector(`#${PORTAL_ROOT_ID}`) as HTMLDivElement | null;
  if (!container) {
    container = document.createElement('div');
    container.id = PORTAL_ROOT_ID;
    container.style.pointerEvents = 'auto';
    shadow.appendChild(container);
  }

  return container;
};

import { fetchProjectDetails, supabase } from './lib/supabase.ts';
import type { Position, ThemeType } from './types.ts';

const RuntimeApp: React.FC<{ initialState: AppState; version: number; portalContainer?: HTMLDivElement | null; apiBaseUrl?: string }> = ({
  initialState,
  version,
  portalContainer,
  apiBaseUrl
}) => {
  const [state, setState] = useState<AppState>(initialState);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setState(initialState);
    setIsOpen(false);
  }, [initialState, version]);

  // Live Sync Logic
  useEffect(() => {
    const syncLiveConfig = async () => {
       try {
         let targetProjectId = state.projectId;

         // If no ID provided but Name is, try to resolve ID from DB (Legacy Support)
         if (!targetProjectId && state.projectName) {
            const { data: projects } = await supabase
              .from('projects')
              .select('id')
              .eq('name', state.projectName)
              .limit(1);
            targetProjectId = projects?.[0]?.id;
         }

         if (targetProjectId) {
            const { project, tasks } = await fetchProjectDetails(targetProjectId);
            if (project) {
              const mappedTasks = tasks.map((t: any) => ({
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
                nftChainId: t.nft_chain_id ?? 1,
                tokenContract: t.token_contract ?? '',
                tokenChainId: t.token_chain_id ?? 1,
                minTokenAmount: t.min_token_amount ?? '1'
              }));
              setState(prev => ({
                ...prev,
                projectId: project.id, // Ensure ID is set
                projectName: project.name,
                projectDomain: project.domain,
                projectLogo: (project as any).logo_url ?? undefined,
                projectBanner: (project as any).banner_url ?? undefined,
                accentColor: project.accent_color,
                position: project.position as Position,
                activeTheme: project.theme as ThemeType,
                tasks: mappedTasks.length ? mappedTasks : prev.tasks
              }));
            }
         }
       } catch (err) {
         console.error('[QuestLayer] Failed to sync live config', err);
       }
    };
    
    syncLiveConfig();
  }, []); // Run once on mount

  return (
    <AppKitProvider>
      <Widget
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        state={state}
        setState={setState}
        isPreview={false}
        isEmbedded={true}
        portalContainer={portalContainer}
        apiBaseUrl={apiBaseUrl}
      />
    </AppKitProvider>
  );
};

export const initQuestLayer = (config?: WidgetConfig) => {
  const boot = () => {
    const state = normalizeConfig(config);
    const inlineMode = state.position === 'free-form' || Boolean(config?.mountId);
    const container = ensureMount({ mountId: config?.mountId, inline: inlineMode });
    const portalContainer = inlineMode ? ensurePortalMount() : null;
    if (!widgetRoot) {
      widgetRoot = createRoot(container);
    }
    renderVersion += 1;
    widgetRoot.render(<RuntimeApp initialState={state} version={renderVersion} portalContainer={portalContainer} apiBaseUrl={config?.apiBaseUrl} />);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
};
