
export type Position = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';

export type ThemeType = 'sleek' | 'cyber' | 'minimal' | 'gaming' | 'brutal' | 'glass';

export interface Task {
  id: string | number;
  title: string;
  desc: string;
  link: string;
  xp: number;
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
  projectName: string;
  accentColor: string;
  position: Position;
  activeTheme: ThemeType;
  tasks: Task[];
  userXP: number;
  currentStreak: number;
  dailyClaimed: boolean;
}
