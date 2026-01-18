
export type Position = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'free-form';

export type ThemeType = 'sleek' | 'cyber' | 'minimal' | 'gaming' | 'brutal' | 'glass' | 'terminal' | 'aura' | 'avatar' | 'ironman';

export type TaskSection = 'missions' | 'onboarding';
export type TaskKind = 'link' | 'quiz';

export interface Task {
  id: string | number;
  title: string;
  desc: string;
  link: string;
  icon?: string;
  xp: number;
  isSponsored?: boolean;
  isDemo?: boolean;
  section: TaskSection;
  kind: TaskKind;
  question?: string;
  answer?: string;
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
  projectLogo?: string; // Favicon or logo URL
  accentColor: string;
  position: Position;
  activeTheme: ThemeType;
  tasks: Task[];
  userXP: number;
  globalXP?: number;
  currentStreak: number;
  dailyClaimed: boolean;
}
