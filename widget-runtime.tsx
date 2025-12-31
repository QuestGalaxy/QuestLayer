import React, { useEffect, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import Widget from './components/Widget.tsx';
import { INITIAL_TASKS } from './constants.ts';
import type { AppState } from './types.ts';

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

const ROOT_ID = 'questlayer-widget-root';
let widgetRoot: Root | null = null;
let renderVersion = 0;

const RuntimeApp: React.FC<{ initialState: AppState; version: number }> = ({ initialState, version }) => {
  const [state, setState] = useState<AppState>(initialState);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setState(initialState);
    setIsOpen(false);
  }, [initialState, version]);

  return (
    <Widget
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      state={state}
      setState={setState}
      isPreview={false}
    />
  );
};

export const initQuestLayer = (config?: WidgetConfig) => {
  const boot = () => {
    const state = normalizeConfig(config);
    let container = document.getElementById(ROOT_ID);
    if (!container) {
      container = document.createElement('div');
      container.id = ROOT_ID;
      document.body.appendChild(container);
    }
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
