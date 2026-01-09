import React, { useEffect, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import Widget from './components/Widget.tsx';
import { INITIAL_TASKS } from './constants.ts';
import { AppKitProvider } from './appkit.tsx';
import type { AppState } from './types.ts';
import widgetStyles from './widget.css?inline';

export type WidgetConfig = Partial<Pick<AppState, 'projectName' | 'accentColor' | 'position' | 'activeTheme' | 'tasks'>>;

declare global {
  interface Window {
    QuestLayer?: {
      init: (config?: WidgetConfig) => void;
    };
  }
}

const DEFAULT_STATE: AppState = {
  projectName: 'QuestLayer',
  accentColor: '#6366f1',
  position: 'bottom-right',
  activeTheme: 'sleek',
  tasks: INITIAL_TASKS,
  userXP: 0,
  currentStreak: 1,
  dailyClaimed: false
};

const normalizeConfig = (config?: WidgetConfig): AppState => ({
  ...DEFAULT_STATE,
  ...config,
  tasks: config?.tasks?.length ? config.tasks : DEFAULT_STATE.tasks
});

const HOST_ID = 'questlayer-widget-host';
const ROOT_ID = 'questlayer-widget-root';
const STYLE_ATTR = 'data-questlayer-styles';
const FONT_ATTR = 'data-questlayer-fonts';
const GLOBAL_FONT_ATTR = 'data-questlayer-fonts-global';
const APPKIT_Z_ATTR = 'data-questlayer-appkit-z';
const FONT_URL =
  'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&family=Space+Mono&family=Inter:wght@400;700;900&display=swap';
let widgetRoot: Root | null = null;
let renderVersion = 0;

const ensureMount = (): HTMLDivElement => {
  const legacyRoot = document.getElementById(ROOT_ID);
  if (legacyRoot && legacyRoot.parentElement && legacyRoot.parentElement.id !== HOST_ID) {
    legacyRoot.remove();
  }

  let host = document.getElementById(HOST_ID) as HTMLDivElement | null;
  if (!host) {
    host = document.createElement('div');
    host.id = HOST_ID;
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
    document.body.appendChild(host);
  }
  const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
  const rawScale = Number.isFinite(rootFontSize) && rootFontSize > 0 && rootFontSize < 16 ? 16 / rootFontSize : 1;
  const scale = Math.min(1.1, Math.max(1, rawScale));
  host.style.setProperty('--questlayer-scale', String(scale));

  const shadow = host.shadowRoot || host.attachShadow({ mode: 'open' });

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

  let container = shadow.querySelector(`#${ROOT_ID}`) as HTMLDivElement | null;
  if (!container) {
    container = document.createElement('div');
    container.id = ROOT_ID;
    container.style.pointerEvents = 'auto';
    shadow.appendChild(container);
  }

  return container;
};

import { fetchProjectDetails, supabase } from './lib/supabase.ts';
import type { Task, Position, ThemeType } from './types.ts';

const RuntimeApp: React.FC<{ initialState: AppState; version: number }> = ({ initialState, version }) => {
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
              setState(prev => ({
                ...prev,
                projectId: project.id, // Ensure ID is set
                projectName: project.name,
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
                }))
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
      />
    </AppKitProvider>
  );
};

export const initQuestLayer = (config?: WidgetConfig) => {
  const boot = () => {
    const state = normalizeConfig(config);
    const container = ensureMount();
    if (!widgetRoot) {
      widgetRoot = createRoot(container);
    }
    renderVersion += 1;
    widgetRoot.render(<RuntimeApp initialState={state} version={renderVersion} />);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
};
