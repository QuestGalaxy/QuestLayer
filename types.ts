
export type Position = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';

export type ThemeType = 'sleek' | 'cyber' | 'minimal' | 'gaming' | 'brutal' | 'glass' | 'terminal' | 'aura';

export interface Task {
  id: string | number;
  title: string;
  desc: string;
  link: string;
  icon?: string;
  xp: number;
  isSponsored?: boolean;
  isDemo?: boolean;
}

export interface ThemeConfig {
  card: string;
  trigger: string;
  header: string;
  button: string;
  itemCard: string;
  iconBox: string;
  font: string;
}

export interface AppState {
  projectId?: string;
  projectName: string;
  projectDomain?: string; // New field for whitelisted domain
  accentColor: string;
  position: Position;
  activeTheme: ThemeType;
  tasks: Task[];
  userXP: number;
  globalXP?: number;
  currentStreak: number;
  dailyClaimed: boolean;
}
