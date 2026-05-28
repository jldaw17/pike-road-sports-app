import type { AthleticOSThemePreset } from '../../athleticos';

export const premiumTheme: AthleticOSThemePreset = {
  key: 'premium',
  label: 'Premium',
  description:
    'A clean, sponsor-ready athletics app presentation with bright editorial surfaces, restrained school-color accents, and polished mobile-native chrome.',
  colors: {
    primary: '#151515',
    secondary: '#3F3F46',
    accent: '#111827',
    background: '#FFFFFF',
    surface: '#FFFFFF',
    card: '#FFFFFF',
    cardAlt: '#F8FAFC',
    text: '#111111',
    mutedText: '#4B5563',
    border: '#E5E7EB',
    pillBackground: '#151515',
    pillText: '#FFFFFF',
    buttonBackground: '#151515',
    buttonText: '#FFFFFF',
    glow: '#E5E7EB',
    heroStart: '#FFFFFF',
    heroEnd: '#FFFFFF',
  },
  styles: {
    backgroundStyle: 'premium_editorial',
    surfaceStyle: 'premium_surface',
    cardStyle: 'premium_panel',
    pillStyle: 'premium_badge',
    navStyle: 'premium_floating_pill',
    heroStyle: 'premium_app_bar',
    newsStyle: 'premium_editorial_feed',
  },
};
