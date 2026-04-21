import type { AthleticOSThemePreset } from '../../athleticos';

export const DEFAULT_THEME_COLORS = {
  primary: '#1F3B7A',
  secondary: '#162E63',
  accent: '#C8102E',
  background: '#0B1020',
  surface: '#141B2D',
  card: '#141B2D',
  cardAlt: '#1C2540',
  text: '#FFFFFF',
  mutedText: '#D9DFEA',
  border: '#2B3657',
  pillBackground: '#1F3B7A',
  pillText: '#FFFFFF',
  buttonBackground: '#1F3B7A',
  buttonText: '#FFFFFF',
  glow: '#FFFFFF',
  heroStart: '#D3183B',
  heroEnd: '#102754',
} as const;

export const power5Theme: AthleticOSThemePreset = {
  key: 'sec_power5',
  label: 'SEC Power 5',
  description: 'Bold athletics chrome with premium dark surfaces and a broadcast-style hero.',
  colors: { ...DEFAULT_THEME_COLORS },
  styles: {
    backgroundStyle: 'dark_chrome',
    surfaceStyle: 'layered_dark',
    cardStyle: 'premium_dark',
    pillStyle: 'broadcast',
    navStyle: 'floating_crest',
    heroStyle: 'broadcast_gradient',
    newsStyle: 'athletics_editorial',
  },
};
