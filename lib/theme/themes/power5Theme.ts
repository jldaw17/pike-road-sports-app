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

const POWER5_NEUTRAL_THEME_COLORS = {
  ...DEFAULT_THEME_COLORS,
  primary: '#1F1F23',
  secondary: '#0D0D10',
  accent: '#D4D4D8',
  background: '#050507',
  surface: '#0D0F12',
  card: '#13151A',
  cardAlt: '#191C22',
  text: '#FFFFFF',
  mutedText: '#D4D4D8',
  border: '#2B2E35',
  pillBackground: '#1F1F23',
  pillText: '#FFFFFF',
  buttonBackground: '#1F1F23',
  buttonText: '#FFFFFF',
  glow: '#F3F4F6',
  heroStart: '#0B0B0D',
  heroEnd: '#1A1B1F',
} as const;

export const power5Theme: AthleticOSThemePreset = {
  key: 'sec_power5',
  label: 'SEC Power 5',
  description: 'Bold athletics chrome with premium dark surfaces and a broadcast-style hero.',
  colors: { ...POWER5_NEUTRAL_THEME_COLORS },
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
