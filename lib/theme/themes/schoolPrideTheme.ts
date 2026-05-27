import type { AthleticOSThemePreset } from '../../athleticos';

export const schoolPrideTheme: AthleticOSThemePreset = {
  key: 'school_pride',
  label: 'School Pride',
  description:
    'A premium collegiate athletics foundation with open editorial surfaces, bold school-color energy, and sharp branded presentation.',
  colors: {
    primary: '#181818',
    secondary: '#343434',
    accent: '#121212',
    background: '#F7F7F4',
    surface: '#FFFFFF',
    card: '#FFFFFF',
    cardAlt: '#F2EEE7',
    text: '#111111',
    mutedText: '#555555',
    border: '#D7D1C7',
    pillBackground: '#121212',
    pillText: '#FFFFFF',
    buttonBackground: '#181818',
    buttonText: '#FFFFFF',
    glow: '#F3EDE2',
    heroStart: '#FFFFFF',
    heroEnd: '#F7F7F4',
  },
  styles: {
    backgroundStyle: 'school_pride_editorial',
    surfaceStyle: 'layered_light',
    cardStyle: 'school_pride_panel',
    pillStyle: 'school_pride_badge',
    navStyle: 'school_pride_nav',
    heroStyle: 'school_pride_gradient',
    newsStyle: 'school_pride_story',
  },
};
