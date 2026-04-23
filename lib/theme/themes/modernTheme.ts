import type { AthleticOSThemePreset } from '../../athleticos';

export const modernTheme: AthleticOSThemePreset = {
  key: 'modern',
  label: 'Modern',
  description:
    'A clean modern athletics theme with light surfaces, premium cards, and school-branded accents.',
  colors: {
    primary: '#1F3B7A',
    secondary: '#365CA4',
    accent: '#1F3B7A',
    background: '#FFFFFF',
    surface: '#FFFFFF',
    card: '#FFFFFF',
    cardAlt: '#F8FAFC',
    text: '#101828',
    mutedText: '#475467',
    border: '#D0D5DD',
    pillBackground: '#1F3B7A',
    pillText: '#FFFFFF',
    buttonBackground: '#1F3B7A',
    buttonText: '#FFFFFF',
    glow: '#D9E4FF',
    heroStart: '#FFFFFF',
    heroEnd: '#F8FAFC',
  },
  styles: {
    backgroundStyle: 'light_canvas',
    surfaceStyle: 'modern_surface',
    cardStyle: 'modern_card',
    pillStyle: 'modern_badge',
    navStyle: 'modern_nav',
    heroStyle: 'modern_gradient',
    newsStyle: 'modern_story',
  },
};
