
export type Position = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'free-form';

export type ThemeType = 'sleek' | 'cyber' | 'minimal' | 'gaming' | 'brutal' | 'glass' | 'terminal' | 'aura' | 'avatar' | 'ironman' | 'quest';

export type TaskSection = 'missions' | 'onboarding';
export type TaskKind = 'link' | 'quiz' | 'nft_hold' | 'token_hold';

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
  nftContract?: string;
  nftChainId?: number;
  tokenContract?: string;
  tokenChainId?: number;
  minTokenAmount?: string;
}

export interface ThemeColors {
  primary?: string;
  border?: string | null;
  secondary?: string;
  background?: string;
  text?: string;
  success?: string;
}

export interface ThemeConfig {
  type: 'light' | 'dark';
  isTransparent?: boolean;
  colors?: ThemeColors;
  card: string;
  trigger: string;
  header: string;
  footer?: string;
  button: string;
  itemCard: string;
  iconBox: string;
  font: string;
}

export interface AppState {
  projectId?: string;
  projectName: string;
  projectDomain?: string; // New field for whitelisted domain
  projectUrl?: string; // Full project URL for metadata fetching
  projectLogo?: string; // Favicon or logo URL
  projectBanner?: string; // Banner/OG image URL
  accentColor: string;
  position: Position;
  activeTheme: ThemeType;
  tasks: Task[];
  userXP: number;
  globalXP?: number;
  currentStreak: number;
  dailyClaimed: boolean;
}
