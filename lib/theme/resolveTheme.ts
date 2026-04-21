import type {
  AthleticOSAppThemeConfig,
  AthleticOSResolvedTheme,
  AthleticOSThemePreset,
} from '../athleticos';
import { cleanSlateTheme } from './themes/cleanSlateTheme';
import { DEFAULT_THEME_COLORS, power5Theme } from './themes/power5Theme';

const ATHLETICOS_THEME_PRESETS: AthleticOSThemePreset[] = [
  power5Theme,
  {
    key: 'news_heavy',
    label: 'News Heavy',
    description: 'Editorial-forward presentation that emphasizes headlines and content readability.',
    colors: {
      ...DEFAULT_THEME_COLORS,
      primary: '#263B73',
      secondary: '#18284F',
      accent: '#B61F3F',
      cardAlt: '#202B44',
      heroStart: '#1A2136',
      heroEnd: '#243C76',
    },
    styles: {
      backgroundStyle: 'editorial_dark',
      surfaceStyle: 'inked_surface',
      cardStyle: 'editorial_panel',
      pillStyle: 'clean_editorial',
      navStyle: 'floating_crest',
      heroStyle: 'editorial_gradient',
      newsStyle: 'headline_stack',
    },
  },
  {
    key: 'gameday',
    label: 'Gameday',
    description: 'High-energy surfaces and contrast tuned for live-event emphasis.',
    colors: {
      ...DEFAULT_THEME_COLORS,
      primary: '#213D85',
      secondary: '#132754',
      accent: '#E23D3D',
      glow: '#FFD7D7',
      heroStart: '#C11E3A',
      heroEnd: '#0F2A63',
    },
    styles: {
      backgroundStyle: 'arena_dark',
      surfaceStyle: 'charged_surface',
      cardStyle: 'broadcast_panel',
      pillStyle: 'gameday_badge',
      navStyle: 'floating_crest',
      heroStyle: 'gameday_gradient',
      newsStyle: 'broadcast_cards',
    },
  },
  {
    key: 'classic_school',
    label: 'Classic School',
    description: 'Traditional school spirit treatment with balanced colors and simple chrome.',
    colors: {
      ...DEFAULT_THEME_COLORS,
      primary: '#29456F',
      secondary: '#1E2F4A',
      accent: '#A52039',
      heroStart: '#182338',
      heroEnd: '#324F80',
    },
    styles: {
      backgroundStyle: 'classic_dark',
      surfaceStyle: 'traditional_surface',
      cardStyle: 'school_card',
      pillStyle: 'school_badge',
      navStyle: 'classic_tabs',
      heroStyle: 'classic_gradient',
      newsStyle: 'school_news',
    },
  },
  {
    key: 'minimal',
    label: 'Minimal',
    description: 'Reduced visual noise with restrained accents and cleaner surfaces.',
    colors: {
      ...DEFAULT_THEME_COLORS,
      primary: '#38517A',
      secondary: '#1C2942',
      accent: '#5E7CB7',
      border: '#34415F',
      glow: '#E8EEF9',
      heroStart: '#111827',
      heroEnd: '#243B67',
    },
    styles: {
      backgroundStyle: 'minimal_dark',
      surfaceStyle: 'quiet_surface',
      cardStyle: 'minimal_panel',
      pillStyle: 'minimal_badge',
      navStyle: 'clean_floating',
      heroStyle: 'minimal_gradient',
      newsStyle: 'minimal_cards',
    },
  },
  {
    key: 'recruiting',
    label: 'Recruiting',
    description: 'Sharper contrast and spotlight accents for feature-forward recruiting storytelling.',
    colors: {
      ...DEFAULT_THEME_COLORS,
      primary: '#25437A',
      secondary: '#111F3D',
      accent: '#D4A529',
      pillBackground: '#D4A529',
      pillText: '#101828',
      buttonBackground: '#D4A529',
      buttonText: '#101828',
      glow: '#FCE7A8',
      heroStart: '#111827',
      heroEnd: '#23467D',
    },
    styles: {
      backgroundStyle: 'spotlight_dark',
      surfaceStyle: 'recruiting_surface',
      cardStyle: 'spotlight_panel',
      pillStyle: 'gold_badge',
      navStyle: 'floating_crest',
      heroStyle: 'spotlight_gradient',
      newsStyle: 'feature_stack',
    },
  },
  {
    key: 'gradient_elite',
    label: 'Gradient Elite',
    description: 'Premium, luminous gradients layered over dark athletics surfaces.',
    colors: {
      ...DEFAULT_THEME_COLORS,
      primary: '#2A4A8D',
      secondary: '#172B57',
      accent: '#DA365A',
      cardAlt: '#22345B',
      glow: '#F3F4FF',
      heroStart: '#C32651',
      heroEnd: '#1F4D97',
    },
    styles: {
      backgroundStyle: 'luxe_gradient',
      surfaceStyle: 'elite_surface',
      cardStyle: 'glass_dark',
      pillStyle: 'elite_badge',
      navStyle: 'floating_crest',
      heroStyle: 'elite_gradient',
      newsStyle: 'elite_editorial',
    },
  },
  {
    key: 'light_mode',
    label: 'Light Mode',
    description: 'Bright surfaces and cleaner contrast while preserving athletics emphasis.',
    colors: {
      ...DEFAULT_THEME_COLORS,
      primary: '#1F3B7A',
      secondary: '#365CA4',
      accent: '#C8102E',
      background: '#EEF2FA',
      surface: '#FFFFFF',
      card: '#FFFFFF',
      cardAlt: '#E5ECF8',
      text: '#101828',
      mutedText: '#475467',
      border: '#D0D5DD',
      pillBackground: '#1F3B7A',
      pillText: '#FFFFFF',
      buttonBackground: '#1F3B7A',
      buttonText: '#FFFFFF',
      glow: '#D9E4FF',
      heroStart: '#D6E3FF',
      heroEnd: '#F8FAFF',
    },
    styles: {
      backgroundStyle: 'light_canvas',
      surfaceStyle: 'light_surface',
      cardStyle: 'light_card',
      pillStyle: 'light_badge',
      navStyle: 'light_nav',
      heroStyle: 'light_gradient',
      newsStyle: 'light_editorial',
    },
  },
  cleanSlateTheme,
];

function normalizeThemeKey(value?: string) {
  return (value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');
}

function normalizeHexColor(value?: string) {
  const trimmed = value?.trim() ?? '';
  if (!trimmed) {
    return '';
  }

  const normalized = trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
  return /^#[0-9a-f]{6}$/i.test(normalized) ? normalized : '';
}

function resolveThemeSurfaceTokens(surfaceStyle: string) {
  switch (surfaceStyle) {
    case 'clean_slate_surface':
      return {
        background: '#FFFFFF',
        surface: '#FFFFFF',
        card: '#FFFFFF',
        cardAlt: '#FFFFFF',
        border: '#D6D9DE',
        text: '#111827',
        mutedText: '#374151',
      };
    case 'light_surface':
      return {
        background: '#F7F5F2',
        surface: '#FFFFFF',
        card: '#FFFFFF',
        cardAlt: '#F8F6F2',
        border: '#DDD6CC',
        text: '#101828',
        mutedText: '#475467',
      };
    case 'inked_surface':
      return {
        background: '#0E1526',
        surface: '#141C31',
        card: '#141C31',
        cardAlt: '#1A243B',
        border: '#2B3657',
        text: '#FFFFFF',
        mutedText: '#D0D5DD',
      };
    default:
      return {
        background: DEFAULT_THEME_COLORS.background,
        surface: DEFAULT_THEME_COLORS.surface,
        card: DEFAULT_THEME_COLORS.card,
        cardAlt: DEFAULT_THEME_COLORS.cardAlt,
        border: DEFAULT_THEME_COLORS.border,
        text: DEFAULT_THEME_COLORS.text,
        mutedText: DEFAULT_THEME_COLORS.mutedText,
      };
  }
}

function resolveThemeHeroTokens(
  heroStyle: string,
  resolvedPrimary: string,
  resolvedSecondary: string,
  resolvedAccent: string
) {
  switch (heroStyle) {
    case 'clean_slate_hero':
      return {
        heroStart: '#FFFFFF',
        heroEnd: '#FFFFFF',
      };
    case 'light_gradient':
      return {
        heroStart: '#FFFFFF',
        heroEnd: '#F8FAFC',
      };
    case 'editorial_gradient':
      return {
        heroStart: '#1A2136',
        heroEnd: resolvedPrimary || '#243C76',
      };
    case 'spotlight_gradient':
      return {
        heroStart: '#111827',
        heroEnd: resolvedPrimary || '#23467D',
      };
    case 'gameday_gradient':
      return {
        heroStart: resolvedAccent || '#C11E3A',
        heroEnd: resolvedSecondary || '#0F2A63',
      };
    case 'elite_gradient':
      return {
        heroStart: resolvedAccent || '#C32651',
        heroEnd: resolvedPrimary || '#1F4D97',
      };
    default:
      return {
        heroStart: resolvedAccent || DEFAULT_THEME_COLORS.heroStart,
        heroEnd: resolvedSecondary || DEFAULT_THEME_COLORS.heroEnd,
      };
  }
}

function resolveThemePillTokens(
  pillStyle: string,
  resolvedPrimary: string,
  resolvedAccent: string
) {
  switch (pillStyle) {
    case 'clean_slate_editorial':
      return {
        pillBackground: '#FFFFFF',
        pillText: resolvedPrimary || '#172033',
      };
    case 'gold_badge':
      return {
        pillBackground: resolvedAccent || '#D4A529',
        pillText: '#101828',
      };
    case 'clean_editorial':
      return {
        pillBackground: '#EAECF0',
        pillText: '#101828',
      };
    default:
      return {
        pillBackground: resolvedPrimary || DEFAULT_THEME_COLORS.secondary,
        pillText: '#FFFFFF',
      };
  }
}

export function getAthleticOSThemePresets() {
  return ATHLETICOS_THEME_PRESETS.map((preset) => ({
    ...preset,
    colors: { ...preset.colors },
    styles: { ...preset.styles },
  }));
}

export function resolveAthleticOSTheme(
  config?: AthleticOSAppThemeConfig | null
): AthleticOSResolvedTheme {
  const themeKey = normalizeThemeKey(config?.theme_key) || 'sec_power5';
  const preset =
    ATHLETICOS_THEME_PRESETS.find((item) => item.key === themeKey) ??
    power5Theme;
  const isCleanSlate = preset.key === 'clean_slate';

  const resolvedPrimary =
    normalizeHexColor(config?.primary_color) || preset.colors.primary;
  const resolvedSecondary =
    normalizeHexColor(config?.secondary_color) || preset.colors.secondary;
  const resolvedAccent =
    normalizeHexColor(config?.accent_color) || preset.colors.accent;
  const resolvedStyles = isCleanSlate
    ? { ...preset.styles }
    : {
        backgroundStyle:
          normalizeThemeKey(config?.background_style) || preset.styles.backgroundStyle,
        surfaceStyle:
          normalizeThemeKey(config?.surface_style) || preset.styles.surfaceStyle,
        cardStyle: normalizeThemeKey(config?.card_style) || preset.styles.cardStyle,
        pillStyle: normalizeThemeKey(config?.pill_style) || preset.styles.pillStyle,
        navStyle: normalizeThemeKey(config?.nav_style) || preset.styles.navStyle,
        heroStyle: normalizeThemeKey(config?.hero_style) || preset.styles.heroStyle,
        newsStyle: normalizeThemeKey(config?.news_style) || preset.styles.newsStyle,
      };

  const surfaceTokens = resolveThemeSurfaceTokens(resolvedStyles.surfaceStyle);
  const heroTokens = resolveThemeHeroTokens(
    resolvedStyles.heroStyle,
    resolvedPrimary,
    resolvedSecondary,
    resolvedAccent
  );
  const pillTokens = resolveThemePillTokens(
    resolvedStyles.pillStyle,
    resolvedPrimary,
    resolvedAccent
  );
  const buttonBackground =
    isCleanSlate
      ? '#FFFFFF'
      : resolvedStyles.pillStyle === 'gold_badge'
      ? resolvedAccent
      : resolvedPrimary;
  const buttonText =
    isCleanSlate
      ? resolvedPrimary || '#172033'
      : resolvedStyles.pillStyle === 'gold_badge'
      ? '#101828'
      : '#FFFFFF';
  const glow =
    isCleanSlate
      ? 'transparent'
      : resolvedStyles.navStyle === 'light_nav'
      ? '#D9E4FF'
      : preset.colors.glow || DEFAULT_THEME_COLORS.glow;

  return {
    meta: {
      themeKey: preset.key,
      label: preset.label,
    },
    colors: {
      primary: resolvedPrimary,
      secondary: resolvedSecondary,
      accent: resolvedAccent,
      background: surfaceTokens.background,
      surface: surfaceTokens.surface,
      card: surfaceTokens.card,
      cardAlt: surfaceTokens.cardAlt,
      text: surfaceTokens.text,
      mutedText: surfaceTokens.mutedText,
      border: surfaceTokens.border,
      pillBackground: pillTokens.pillBackground,
      pillText: pillTokens.pillText,
      buttonBackground,
      buttonText,
      glow,
      heroStart: heroTokens.heroStart,
      heroEnd: heroTokens.heroEnd,
    },
    styles: resolvedStyles,
  };
}
