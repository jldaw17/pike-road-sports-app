import { getSchoolFromSlug } from './getSchool';
import { supabase } from './supabase';

export type AthleticOSSchool = {
  id: string | number;
  slug: string;
  [key: string]: unknown;
};

export type AthleticOSSchoolConfig = {
  displayName: string;
  logoUrl: string;
  splashLogoUrl: string;
  splashBackgroundUrl: string;
  appShortName: string;
  mascotName: string;
  heroTitleOverride: string;
  heroSubtitleOverride: string;
  athleticOSSiteUrl: string;
  mainSiteUrl: string;
  scheduleUrl: string;
  watchUrl: string;
  listenUrl: string;
  ticketsUrl: string;
  shopUrl: string;
  sponsorUrl: string;
};

export type AthleticOSSchoolAppConfig = {
  id?: string | number;
  school_id?: string | number;
  app_enabled?: boolean;
  website_url?: string;
  watch_url?: string;
  listen_url?: string;
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  logo_url?: string;
  splash_logo_url?: string;
  splash_background_url?: string;
  app_short_name?: string;
  mascot_name?: string;
  hero_title_override?: string;
  hero_subtitle_override?: string;
  tickets_url?: string;
  shop_url?: string;
  default_sport_id?: string | number | null;
  ios_app_store_url?: string;
  android_app_store_url?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
};

export type AthleticOSAppHomeModule = {
  id?: string | number;
  school_id?: string | number;
  module_key?: string;
  label?: string;
  is_enabled?: boolean;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
};

export type AthleticOSAppBottomNavItem = {
  id?: string | number;
  school_id?: string | number;
  slot_number?: number;
  enabled?: boolean;
  label?: string;
  icon_key?: string;
  destination_type?: string;
  destination_value?: string;
  open_in_webview?: boolean;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
};

export type AthleticOSBottomNavItem = {
  slotNumber: 1 | 2 | 4;
  enabled: boolean;
  label: string;
  iconKey: string;
  destinationType: string;
  destinationValue: string;
  openInWebview: boolean;
};

export type AthleticOSAppTeamNavItem = {
  id?: string | number;
  school_id?: string | number;
  sport_id?: string | number;
  nav_key?: string;
  label?: string;
  is_enabled?: boolean;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
};

export type AthleticOSTeamNavItem = {
  navKey: string;
  label: string;
  isEnabled: boolean;
  sortOrder: number;
};

export type AthleticOSAppSponsorPlacement = {
  id?: string | number;
  school_id?: string | number;
  placement_key?: string;
  sponsor_name?: string;
  sponsor_logo_url?: string;
  sponsor_link_url?: string;
  is_enabled?: boolean;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
};

export type AthleticOSPromotionCard = {
  id?: string | number;
  school_id?: string | number;
  title?: string;
  subtitle?: string;
  image_url?: string;
  cta_text?: string;
  cta_url?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
};

export type AthleticOSAppPrerollConfig = {
  id?: string | number;
  school_id?: string | number;
  is_enabled: boolean;
  video_url: string;
  click_url: string;
  sponsor_name: string;
  sponsor_logo_url: string;
  skip_after_seconds: number;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
};

export type AthleticOSAppLiveCoverageConfig = {
  id?: string | number;
  school_id?: string | number;
  is_enabled: boolean;
  eyebrow: string;
  headline: string;
  body_copy: string;
  cta_label: string;
  show_status_pill: boolean;
  destination_type: string;
  destination_value: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
};

export type AthleticOSAppThemeConfig = {
  id?: string | number;
  school_id?: string | number;
  theme_key?: string;
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  background_style?: string;
  surface_style?: string;
  card_style?: string;
  pill_style?: string;
  nav_style?: string;
  hero_style?: string;
  news_style?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
};

export type AthleticOSThemePreset = {
  key: string;
  label: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    card: string;
    cardAlt: string;
    text: string;
    mutedText: string;
    border: string;
    pillBackground: string;
    pillText: string;
    buttonBackground: string;
    buttonText: string;
    glow: string;
    heroStart: string;
    heroEnd: string;
  };
  styles: {
    backgroundStyle: string;
    surfaceStyle: string;
    cardStyle: string;
    pillStyle: string;
    navStyle: string;
    heroStyle: string;
    newsStyle: string;
  };
};

export type AthleticOSResolvedTheme = {
  meta: {
    themeKey: string;
    label: string;
  };
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    card: string;
    cardAlt: string;
    text: string;
    mutedText: string;
    border: string;
    pillBackground: string;
    pillText: string;
    buttonBackground: string;
    buttonText: string;
    glow: string;
    heroStart: string;
    heroEnd: string;
  };
  styles: {
    backgroundStyle: string;
    surfaceStyle: string;
    cardStyle: string;
    pillStyle: string;
    navStyle: string;
    heroStyle: string;
    newsStyle: string;
  };
};

export type AthleticOSAthleteOfWeek = {
  id: string;
  athleteName: string;
  sportName: string | null;
  classYear: string | null;
  position: string | null;
  headshotUrl: string | null;
  featuredImageUrl: string | null;
  summary: string | null;
  stats: string | null;
  awardWeekLabel: string | null;
  awardDate: string | null;
  opponent: string | null;
};

export type AthleticOSAthleteOfTheWeek = AthleticOSAthleteOfWeek;

export type AthleticOSAppVideosConfig = {
  id?: string | number;
  school_id?: string | number;
  is_enabled: boolean;
  playlist_id: string;
  playlist_url: string;
  youtube_playlist_id?: string;
  youtube_playlist_url?: string;
  max_videos: number;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
};

export type AthleticOSSportAppConfig = {
  id?: string | number;
  school_id?: string | number;
  sport_id?: string | number;
  is_visible?: boolean;
  sort_order?: number;
  recruiting_enabled?: boolean;
  recruiting_url?: string;
  custom_watch_url?: string;
  custom_listen_url?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
};

export type AthleticOSSportConfig = {
  key: string;
  name: string;
  slug: string;
  mainUrl: string;
  scheduleUrl: string;
  rosterUrl: string;
  recruitingUrl: string;
};

export type AthleticOSSport = {
  id?: string | number;
  school_id?: string | number;
  name?: string;
  slug?: string;
  url?: string;
  schedule_url?: string;
  roster_url?: string;
  recruiting_url?: string;
  [key: string]: unknown;
};

export type AthleticOSRosterEntry = {
  id?: string | number;
  athlete_id?: string | number;
  school_id?: string | number;
  sport_id?: string | number;
  season_id?: string | number;
  jersey_number?: string | number;
  position?: string;
  class_year?: string;
  height?: string;
  weight?: string;
  bio?: string;
  sport_photo_url?: string;
  active?: boolean | string | number;
  sort_order?: number;
  [key: string]: unknown;
};

export type AthleticOSPlayer = {
  id?: string | number;
  school_id?: string | number;
  sport_id?: string | number;
  first_name?: string;
  last_name?: string;
  number?: string | number;
  position?: string;
  class_year?: string;
  height?: string;
  weight?: string;
  hometown?: string;
  photo_url?: string;
  [key: string]: unknown;
};

export type AthleticOSAthlete = {
  id?: string | number;
  first_name?: string;
  last_name?: string;
  default_photo_url?: string;
  hometown?: string;
  [key: string]: unknown;
};

export type AthleticOSRosterAthlete = {
  id: string;
  athleteId: string | null;
  schoolId: string | null;
  sportId: string | null;
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
  jerseyNumber: string | null;
  number: string | null;
  position: string | null;
  classYear: string | null;
  height: string | null;
  weight: string | null;
  hometown: string | null;
  bio: string | null;
  photoUrl: string | null;
  sportPhotoUrl: string | null;
  active: boolean;
  sortOrder: number | null;
};

export type AthleticOSStory = {
  id?: string | number;
  slug?: string;
  school_id?: string | number;
  title?: string;
  summary?: string;
  sport_id?: string | number;
  sport_slug?: string;
  sport_name?: string;
  image_url?: string;
  featured_image_url?: string;
  published_at?: string;
  external_url?: string;
  url?: string;
  created_at?: string;
  story_sports?: Array<{
    sport_id?: string | number;
    sports?:
      | {
          id?: string | number;
          name?: string;
          slug?: string;
          [key: string]: unknown;
        }
      | Array<{
          id?: string | number;
          name?: string;
          slug?: string;
          [key: string]: unknown;
        }>
      | null;
    [key: string]: unknown;
  }> | null;
  [key: string]: unknown;
};

export type AthleticOSScheduleEvent = {
  id?: string | number;
  school_id?: string | number;
  sport_id?: string | number;
  home_team_id?: string | number;
  away_team_id?: string | number;
  homeTeamId?: string | number;
  awayTeamId?: string | number;
  opponent_name?: string;
  opponent_logo_url?: string;
  home_away?: string;
  status?: string;
  result?: string;
  start_datetime?: string;
  event_date?: string;
  event_time_text?: string;
  home_score?: number;
  away_score?: number;
  is_final?: boolean | string | number;
  location?: string;
  stadium_name?: string;
  location_city?: string;
  location_state?: string;
  external_url?: string;
  url?: string;
  [key: string]: unknown;
};

const normalizeId = (val: any) => {
  if (!val) return null;
  return val.toString().toLowerCase().replace(/[^a-z0-9]/g, '');
};

const resolveMediaUrl = (val: unknown) => {
  if (!val) return null;
  const raw = String(val).trim();
  if (!raw) return null;

  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    return raw.replace(/^http:\/\//i, 'https://');
  }

  return null;
};

const SPORT_NAME_FIELDS = ['name'] as const;
const STORY_DATE_FIELDS = ['published_at', 'created_at'] as const;
const STORY_IMAGE_FIELDS = ['featured_image_url', 'image_url'] as const;
const SCHOOL_DISPLAY_NAME_FIELDS = ['app_display_name', 'display_name', 'name'] as const;
const SCHOOL_LOGO_FIELDS = ['logo_url'] as const;
const SCHOOL_SPLASH_LOGO_FIELDS = ['splash_logo_url'] as const;
const SCHOOL_SPLASH_BACKGROUND_FIELDS = ['splash_background_url'] as const;
const SCHOOL_SITE_FIELDS = ['athleticos_site_url', 'public_site_url', 'site_url'] as const;
const SCHOOL_WEBSITE_FIELDS = ['website_url', 'url'] as const;
const SCHOOL_SCHEDULE_FIELDS = ['schedule_url', 'website_url', 'url'] as const;
const SCHOOL_WATCH_FIELDS = ['watch_url', 'youtube_url', 'video_url'] as const;
const SCHOOL_LISTEN_FIELDS = ['listen_url', 'radio_url', 'audio_url'] as const;
const SCHOOL_TICKETS_FIELDS = ['tickets_url', 'ticket_url'] as const;
const SCHOOL_SHOP_FIELDS = ['shop_url', 'store_url'] as const;
const SCHOOL_SPONSOR_FIELDS = ['sponsor_url', 'website_url', 'url'] as const;

const SPORT_KEY_ALIASES: Record<string, string[]> = {
  football: ['football'],
  baseball: ['baseball'],
  'boys-basketball': ['boys-basketball', 'mens-basketball'],
  'girls-basketball': ['girls-basketball', 'womens-basketball'],
  softball: ['softball'],
  volleyball: ['volleyball', 'womens-volleyball'],
  'boys-soccer': ['boys-soccer', 'mens-soccer'],
  'girls-soccer': ['girls-soccer', 'womens-soccer'],
  'boys-golf': ['boys-golf', 'mens-golf'],
  'girls-golf': ['girls-golf', 'womens-golf'],
  'boys-tennis': ['boys-tennis', 'mens-tennis'],
  'girls-tennis': ['girls-tennis', 'womens-tennis'],
  'boys-track-field': ['boys-track-field', 'mens-track-field', 'outdoor-track'],
  'girls-track-field': ['girls-track-field', 'womens-track-field'],
  'boys-cross-country': ['boys-cross-country', 'mens-cross-country'],
  'girls-cross-country': ['girls-cross-country', 'womens-cross-country'],
};

const SPORT_LABEL_FALLBACKS: Record<string, string> = {
  football: 'Football',
  baseball: 'Baseball',
  'boys-basketball': 'Boys Basketball',
  'girls-basketball': 'Girls Basketball',
  softball: 'Softball',
  volleyball: 'Volleyball',
  'boys-soccer': 'Boys Soccer',
  'girls-soccer': 'Girls Soccer',
  'boys-golf': 'Boys Golf',
  'girls-golf': 'Girls Golf',
  'boys-tennis': 'Boys Tennis',
  'girls-tennis': 'Girls Tennis',
  'boys-track-field': 'Boys Track & Field',
  'girls-track-field': 'Girls Track & Field',
  'boys-cross-country': 'Boys Cross Country',
  'girls-cross-country': 'Girls Cross Country',
};

const DEFAULT_THEME_COLORS = {
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

const ATHLETICOS_THEME_PRESETS: AthleticOSThemePreset[] = [
  {
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
  },
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
];

function pickFirstString(
  record: Record<string, unknown>,
  keys: string[]
): string | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return undefined;
}

function normalizeThemeKey(value?: string) {
  return (value ?? '').trim().toLowerCase();
}

function normalizeHexColor(value?: string) {
  const trimmed = (value ?? '').trim();
  if (!trimmed) {
    return '';
  }

  const withHash = trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
  return /^#[0-9a-f]{6}$/i.test(withHash) ? withHash.toUpperCase() : '';
}

function resolveThemeSurfaceTokens(surfaceStyle: string) {
  switch (surfaceStyle) {
    case 'light_surface':
      return {
        background: '#EEF2FA',
        surface: '#FFFFFF',
        card: '#FFFFFF',
        cardAlt: '#E5ECF8',
        border: '#D0D5DD',
        text: '#101828',
        mutedText: '#475467',
      };
    case 'elite_surface':
      return {
        background: '#0A1020',
        surface: '#131C30',
        card: '#17233A',
        cardAlt: '#22345B',
        border: '#2F4166',
        text: '#FFFFFF',
        mutedText: '#D9DFEA',
      };
    case 'recruiting_surface':
      return {
        background: '#0C111D',
        surface: '#151C2B',
        card: '#1A2538',
        cardAlt: '#24334A',
        border: '#394963',
        text: '#FFFFFF',
        mutedText: '#D6DDEB',
      };
    case 'quiet_surface':
      return {
        background: '#0F1727',
        surface: '#151D2E',
        card: '#182234',
        cardAlt: '#21314D',
        border: '#33425D',
        text: '#FFFFFF',
        mutedText: '#CFD8E8',
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
    case 'editorial_gradient':
      return {
        heroStart: '#121A2A',
        heroEnd: resolvedPrimary,
      };
    case 'gameday_gradient':
      return {
        heroStart: resolvedAccent,
        heroEnd: resolvedSecondary,
      };
    case 'classic_gradient':
      return {
        heroStart: '#151E31',
        heroEnd: resolvedPrimary,
      };
    case 'minimal_gradient':
      return {
        heroStart: '#111827',
        heroEnd: resolvedSecondary,
      };
    case 'spotlight_gradient':
      return {
        heroStart: '#101828',
        heroEnd: resolvedPrimary,
      };
    case 'elite_gradient':
      return {
        heroStart: resolvedAccent,
        heroEnd: resolvedPrimary,
      };
    case 'light_gradient':
      return {
        heroStart: '#D6E3FF',
        heroEnd: '#F8FAFF',
      };
    case 'broadcast_gradient':
    default:
      return {
        heroStart: DEFAULT_THEME_COLORS.heroStart,
        heroEnd: DEFAULT_THEME_COLORS.heroEnd,
      };
  }
}

function resolveThemePillTokens(
  pillStyle: string,
  resolvedPrimary: string,
  resolvedAccent: string
) {
  switch (pillStyle) {
    case 'gold_badge':
      return {
        pillBackground: resolvedAccent,
        pillText: '#101828',
      };
    case 'light_badge':
      return {
        pillBackground: resolvedPrimary,
        pillText: '#FFFFFF',
      };
    case 'minimal_badge':
      return {
        pillBackground: resolvedPrimary || DEFAULT_THEME_COLORS.secondary,
        pillText: '#FFFFFF',
      };
    default:
      return {
        pillBackground: resolvedPrimary,
        pillText: '#FFFFFF',
      };
  }
}

function pickFirstNumber(
  record: Record<string, unknown>,
  keys: string[]
): number | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string' && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return undefined;
}

function pickFirstBoolean(
  record: Record<string, unknown>,
  keys: string[]
): boolean | undefined {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'number') {
      if (value === 1) return true;
      if (value === 0) return false;
    }

    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (['true', '1', 'yes'].includes(normalized)) return true;
      if (['false', '0', 'no'].includes(normalized)) return false;
    }
  }

  return undefined;
}

function pickFirstId(
  record: Record<string, unknown>,
  keys: string[]
): string | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
      return String(value);
    }
  }

  return undefined;
}

function normalizeSortDate(value?: string) {
  if (!value) return 0;

  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function normalizeToken(value?: string) {
  return (value ?? '')
    .toLowerCase()
    .trim()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeStatus(value?: string) {
  return value?.trim().toLowerCase() ?? '';
}

function getScheduleEventDateTime(event: AthleticOSScheduleEvent) {
  const startDateTime = pickFirstString(event, ['start_datetime']);
  if (startDateTime) {
    return startDateTime;
  }

  const eventDate = pickFirstString(event, ['event_date']);
  const eventTimeText = pickFirstString(event, ['event_time_text']);

  if (eventDate && eventTimeText) {
    return `${eventDate} ${eventTimeText}`;
  }

  return eventDate ?? '';
}

function readStringArray(value: unknown) {
  if (Array.isArray(value)) {
    return value
      .filter((entry): entry is string => typeof entry === 'string')
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  if (typeof value === 'string' && value.trim()) {
    return value
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  return [];
}

function isMissingAppOSRelationError(error: unknown) {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const maybeError = error as { code?: string; message?: string; details?: string };
  const combinedText = [maybeError.message, maybeError.details]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return (
    maybeError.code === '42P01' ||
    maybeError.code === 'PGRST205' ||
    combinedText.includes('does not exist') ||
    combinedText.includes('could not find the table') ||
    combinedText.includes('relation') && combinedText.includes('does not exist')
  );
}

function isFinalStatus(value?: string) {
  const status = normalizeStatus(value);
  return status === 'final' || status === 'completed' || status === 'closed';
}

async function requireSchool(slug: string) {
  const school = await getSchoolBySlug(slug);

  if (!school) {
    throw new Error(`No school found for slug "${slug}"`);
  }

  return school;
}

async function requireSchoolById(schoolId: string | number) {
  const school = await getSchoolById(schoolId);

  if (!school) {
    throw new Error(`No school found for id "${schoolId}"`);
  }

  return school;
}

export async function getSchoolBySlug(slug: string) {
  return (await getSchoolFromSlug(slug)) as AthleticOSSchool | null;
}

export async function getSchoolById(schoolId: string | number) {
  const { data, error } = await supabase
    .from('schools')
    .select('*')
    .eq('id', schoolId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data ?? null) as AthleticOSSchool | null;
}

export async function getSchoolAppConfigById(schoolId: string | number) {
  try {
    await requireSchoolById(schoolId);

    const { data, error } = await supabase
      .from('school_app_config')
      .select('*')
      .eq('school_id', schoolId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return (data ?? null) as AthleticOSSchoolAppConfig | null;
  } catch (error) {
    if (isMissingAppOSRelationError(error)) {
      return null;
    }

    throw error;
  }
}

export function getDefaultSchoolConfig(slug: string): AthleticOSSchoolConfig {
  return {
    displayName: '',
    logoUrl: '',
    splashLogoUrl: '',
    splashBackgroundUrl: '',
    appShortName: '',
    mascotName: '',
    heroTitleOverride: '',
    heroSubtitleOverride: '',
    athleticOSSiteUrl: '',
    mainSiteUrl: '',
    scheduleUrl: '',
    watchUrl: '',
    listenUrl: '',
    ticketsUrl: '',
    shopUrl: '',
    sponsorUrl: '',
  };
}

export async function getSchoolConfigBySlug(slug: string) {
  const school = await getSchoolBySlug(slug);
  const fallbackConfig = getDefaultSchoolConfig(slug);

  return getSchoolConfigFromRecord(school, fallbackConfig);
}

export async function getSchoolConfigById(
  schoolId: string | number,
  fallbackSlug?: string
) {
  const [school, fallbackConfig] = await Promise.all([
    getSchoolById(schoolId),
    Promise.resolve(getDefaultSchoolConfig(fallbackSlug ?? '')),
  ]);

  return getSchoolConfigFromRecord(school, fallbackConfig);
}

function getSchoolConfigFromRecord(
  school: AthleticOSSchool | null,
  fallbackConfig: AthleticOSSchoolConfig
) {
  if (!school) {
    return fallbackConfig;
  }

  const derivedAthleticOSSiteUrl =
    pickFirstString(school, [...SCHOOL_SITE_FIELDS]) ??
    buildAthleticOSSchoolSiteUrl(pickFirstString(school, ['slug']));

  // Assumptions to verify: school-level Home links live on the `schools` record
  // under these URL fields when present.
  return {
    displayName:
      pickFirstString(school, [...SCHOOL_DISPLAY_NAME_FIELDS]) ??
      fallbackConfig.displayName,
    logoUrl:
      pickFirstString(school, [...SCHOOL_LOGO_FIELDS]) ??
      fallbackConfig.logoUrl,
    splashLogoUrl:
      pickFirstString(school, [...SCHOOL_SPLASH_LOGO_FIELDS]) ??
      fallbackConfig.splashLogoUrl,
    splashBackgroundUrl:
      pickFirstString(school, [...SCHOOL_SPLASH_BACKGROUND_FIELDS]) ??
      fallbackConfig.splashBackgroundUrl,
    athleticOSSiteUrl:
      derivedAthleticOSSiteUrl ??
      fallbackConfig.athleticOSSiteUrl,
    mainSiteUrl:
      derivedAthleticOSSiteUrl ??
      pickFirstString(school, [...SCHOOL_WEBSITE_FIELDS]) ??
      fallbackConfig.mainSiteUrl,
    scheduleUrl:
      pickFirstString(school, [...SCHOOL_SCHEDULE_FIELDS]) ??
      buildSchoolPath(
        derivedAthleticOSSiteUrl ??
          fallbackConfig.athleticOSSiteUrl,
        'schedule'
      ) ??
      pickFirstString(school, [...SCHOOL_WEBSITE_FIELDS]) ??
      fallbackConfig.scheduleUrl,
    watchUrl:
      pickFirstString(school, [...SCHOOL_WATCH_FIELDS]) ??
      fallbackConfig.watchUrl,
    listenUrl:
      pickFirstString(school, [...SCHOOL_LISTEN_FIELDS]) ??
      fallbackConfig.listenUrl,
    ticketsUrl:
      pickFirstString(school, [...SCHOOL_TICKETS_FIELDS]) ??
      fallbackConfig.ticketsUrl,
    shopUrl:
      pickFirstString(school, [...SCHOOL_SHOP_FIELDS]) ??
      fallbackConfig.shopUrl,
    sponsorUrl:
      pickFirstString(school, [...SCHOOL_SPONSOR_FIELDS]) ??
      fallbackConfig.sponsorUrl,
  };
}

function getSportAliases(sportKey: string) {
  return SPORT_KEY_ALIASES[sportKey] ?? [sportKey];
}

function getDefaultSportSlug(sportKey: string) {
  return getSportAliases(sportKey)[0] ?? sportKey;
}

function buildSportPath(baseUrl: string, sportSlug: string, suffix = '') {
  const trimmedBase = baseUrl.replace(/\/+$/, '');
  const trimmedSuffix = suffix.replace(/^\/+/, '');
  return `${trimmedBase}/sports/${sportSlug}${trimmedSuffix ? `/${trimmedSuffix}` : ''}`;
}

function buildSchoolPath(baseUrl: string, suffix = '') {
  const trimmedBase = baseUrl.replace(/\/+$/, '');
  const trimmedSuffix = suffix.replace(/^\/+/, '');
  return trimmedSuffix ? `${trimmedBase}/${trimmedSuffix}` : trimmedBase;
}

function buildAthleticOSSchoolSiteUrl(slug?: string) {
  const normalizedSlug = (slug ?? '').trim();
  if (!normalizedSlug) {
    return '';
  }

  return `https://athleticos.ai/${normalizedSlug}`;
}

function buildStoryPath(baseUrl: string, storyIdentifier: string) {
  const trimmedBase = baseUrl.replace(/\/+$/, '');
  return `${trimmedBase}/stories/${storyIdentifier}`;
}

function sportRecordMatchesKey(sport: AthleticOSSport, sportKey: string) {
  const aliases = getSportAliases(sportKey).map(normalizeToken);
  const candidates = [
    pickFirstString(sport, ['slug']),
    pickFirstString(sport, ['name']),
  ]
    .filter(Boolean)
    .map((value) => normalizeToken(value));

  return candidates.some((candidate) => aliases.includes(candidate));
}

function storyMatchesSport(
  story: AthleticOSStory,
  sportKey: string,
  sport?: AthleticOSSport | null
) {
  const aliases = new Set(getSportAliases(sportKey).map(normalizeToken));
  const sportId = pickFirstId(story, ['sport_id']);
  const matchedSportId = sport ? pickFirstId(sport, ['id']) : undefined;
  const taggedSportRows = Array.isArray(story.story_sports) ? story.story_sports : [];
  const taggedSportIds = taggedSportRows
    .map((row) => pickFirstId((row ?? {}) as Record<string, unknown>, ['sport_id']))
    .filter(Boolean);

  if (matchedSportId && taggedSportIds.includes(matchedSportId)) {
    return true;
  }

  if (sportId) {
    return Boolean(matchedSportId) && sportId === matchedSportId;
  }

  const taggedSportNames = taggedSportRows
    .map((row) => {
      const rowSportValue = (row?.sports ?? null) as
        | Record<string, unknown>
        | Record<string, unknown>[]
        | null;
      const rowSport = Array.isArray(rowSportValue)
        ? (rowSportValue[0] ?? null)
        : rowSportValue;
      return normalizeToken(
        pickFirstString((rowSport ?? {}) as Record<string, unknown>, ['slug', 'name'])
      );
    })
    .filter(Boolean);

  if (taggedSportNames.some((candidate) => aliases.has(candidate))) {
    return true;
  }

  const storySportSlug = normalizeToken(pickFirstString(story, ['sport_slug']));
  if (storySportSlug) {
    return aliases.has(storySportSlug);
  }

  const storySportName = normalizeToken(pickFirstString(story, ['sport_name']));
  if (storySportName) {
    return aliases.has(storySportName);
  }

  return false;
}

function scheduleEventMatchesSport(
  event: AthleticOSScheduleEvent,
  sportKey: string,
  sport?: AthleticOSSport | null
) {
  const aliases = new Set(getSportAliases(sportKey).map(normalizeToken));
  const sportId = pickFirstId(event, ['sport_id']);
  const matchedSportId = sport ? pickFirstId(sport, ['id']) : undefined;

  if (sportId && matchedSportId && sportId === matchedSportId) {
    return true;
  }

  const candidates = [
    pickFirstString(event, ['sport_slug']),
    pickFirstString(event, ['sport_name']),
  ]
    .filter(Boolean)
    .map((value) => normalizeToken(value));

  return candidates.some((candidate) => aliases.has(candidate));
}

export async function getSportBySchoolSlugAndKey(
  slug: string,
  sportKey: string
) {
  const sports = await getSportsBySchoolSlug(slug);
  return sports.find((sport) => sportRecordMatchesKey(sport, sportKey)) ?? null;
}

export async function getSportBySchoolIdAndKey(
  schoolId: string | number,
  sportKey: string
) {
  const sports = await getSportsBySchoolId(schoolId);
  return sports.find((sport) => sportRecordMatchesKey(sport, sportKey)) ?? null;
}

export async function getAppHomeModulesBySchoolId(schoolId: string | number) {
  try {
    await requireSchoolById(schoolId);

    const { data, error } = await supabase
      .from('app_home_modules')
      .select('*')
      .eq('school_id', schoolId)
      .order('sort_order', { ascending: true })
      .order('id', { ascending: true });

    if (error) {
      throw error;
    }

    return (data ?? []) as AthleticOSAppHomeModule[];
  } catch (error) {
    if (isMissingAppOSRelationError(error)) {
      return [];
    }

    throw error;
  }
}

export async function getAppBottomNavItemsBySchoolId(schoolId: string | number) {
  try {
    await requireSchoolById(schoolId);

    const { data, error } = await supabase
      .from('app_bottom_nav_items')
      .select('*')
      .eq('school_id', schoolId)
      .in('slot_number', [1, 2, 4])
      .order('slot_number', { ascending: true })
      .order('id', { ascending: true });

    if (error) {
      throw error;
    }

    return ((data ?? []) as AthleticOSAppBottomNavItem[])
      .map((item) => {
        const slotNumber = pickFirstNumber(item, ['slot_number']);
        if (slotNumber !== 1 && slotNumber !== 2 && slotNumber !== 4) {
          return null;
        }

        return {
          slotNumber,
          enabled: pickFirstBoolean(item, ['enabled']) ?? true,
          label: pickFirstString(item, ['label']) ?? '',
          iconKey: pickFirstString(item, ['icon_key']) ?? '',
          destinationType: pickFirstString(item, ['destination_type']) ?? '',
          destinationValue: pickFirstString(item, ['destination_value']) ?? '',
          openInWebview: pickFirstBoolean(item, ['open_in_webview']) ?? true,
        } satisfies AthleticOSBottomNavItem;
      })
      .filter(Boolean) as AthleticOSBottomNavItem[];
  } catch (error) {
    if (isMissingAppOSRelationError(error)) {
      return [];
    }

    throw error;
  }
}

export async function getAppThemeConfigBySchoolId(schoolId: string | number) {
  try {
    await requireSchoolById(schoolId);

    const { data, error } = await supabase
      .from('app_theme_config')
      .select('*')
      .eq('school_id', schoolId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return (data ?? null) as AthleticOSAppThemeConfig | null;
  } catch (error) {
    if (isMissingAppOSRelationError(error)) {
      return null;
    }

    throw error;
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
    ATHLETICOS_THEME_PRESETS[0];

  const resolvedPrimary =
    normalizeHexColor(config?.primary_color) || preset.colors.primary;
  const resolvedSecondary =
    normalizeHexColor(config?.secondary_color) || preset.colors.secondary;
  const resolvedAccent =
    normalizeHexColor(config?.accent_color) || preset.colors.accent;
  const resolvedStyles = {
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
    resolvedStyles.pillStyle === 'gold_badge' ? resolvedAccent : resolvedPrimary;
  const buttonText =
    resolvedStyles.pillStyle === 'gold_badge' ? '#101828' : '#FFFFFF';
  const glow =
    resolvedStyles.navStyle === 'light_nav'
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

export async function getTeamNavBySportId(
  schoolId: string | number,
  sportId: string | number
) {
  try {
    await requireSchoolById(schoolId);

    const { data, error } = await supabase
      .from('app_team_nav_items')
      .select('*')
      .eq('school_id', schoolId)
      .eq('sport_id', sportId)
      .eq('is_enabled', true)
      .order('sort_order', { ascending: true })
      .order('id', { ascending: true });

    if (error) {
      throw error;
    }

    return ((data ?? []) as AthleticOSAppTeamNavItem[])
      .map((item) => ({
        navKey: pickFirstString(item, ['nav_key']) ?? '',
        label: pickFirstString(item, ['label']) ?? '',
        isEnabled: true,
        sortOrder: pickFirstNumber(item, ['sort_order']) ?? 0,
      }))
      .filter((item) => item.navKey)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  } catch (error) {
    if (isMissingAppOSRelationError(error)) {
      return [];
    }

    throw error;
  }
}

export async function getRosterBySchoolIdAndSportId(
  schoolId: string | number,
  sportId: string | number
) {
  await requireSchoolById(schoolId);

  const { data: rosterData, error: rosterError } = await supabase
    .from('athlete_roster_entries')
    .select(
      `
        id,
        athlete_id,
        jersey_number,
        position,
        class_year,
        height,
        weight,
        bio,
        school_id,
        sport_id,
        sort_order,
        sport_photo_url,
        active
      `
    )
    .eq('school_id', schoolId)
    .eq('sport_id', sportId);

  if (rosterError) {
    throw rosterError;
  }

  const rosterEntries = (rosterData ?? []) as AthleticOSRosterEntry[];
  const athleteIds = (rosterData ?? [])
    .map((entry) => entry.athlete_id)
    .filter(Boolean) as Array<string | number>;

  if (athleteIds.length === 0) {
    return [] as AthleticOSRosterAthlete[];
  }

  const { data: athletesData, error: athletesError } = await supabase
    .from('athletes')
    .select('id, first_name, last_name, default_photo_url, hometown')
    .in('id', athleteIds);

  if (athletesError) {
    console.log('Roster athletes lookup failed:', athletesError);
  }

  const athletes = ((athletesData ?? []) as AthleticOSAthlete[]) || [];
  const athletesById = new Map(
    athletes.map((athlete) => [athlete.id, athlete] as const)
  );

  const normalizedRoster = rosterEntries
    .map((entry) => {
      const athleteId =
        entry.athlete_id === undefined || entry.athlete_id === null
          ? null
          : String(entry.athlete_id);
      const athlete = athleteId ? athletesById.get(athleteId) ?? null : null;

      const firstName = athlete?.first_name ?? null;
      const lastName = athlete?.last_name ?? null;
      const fullName = [firstName, lastName].filter(Boolean).join(' ').trim() || null;
      const photoUrl = resolveMediaUrl(athlete?.default_photo_url) ?? null;
      const jerseyNumber = pickFirstString(entry, ['jersey_number']) ?? null;
      const sortOrder = pickFirstNumber(entry, ['sort_order']) ?? 0;
      const active = pickFirstBoolean(entry, ['active']) ?? true;

      return {
        id: pickFirstId(entry, ['id']) ?? athleteId ?? '',
        athleteId,
        schoolId: pickFirstId(entry, ['school_id']) ?? null,
        sportId: pickFirstId(entry, ['sport_id']) ?? null,
        firstName,
        lastName,
        fullName,
        number: jerseyNumber,
        jerseyNumber,
        position: pickFirstString(entry, ['position']) ?? null,
        classYear: pickFirstString(entry, ['class_year']) ?? null,
        height: pickFirstString(entry, ['height']) ?? null,
        weight: pickFirstString(entry, ['weight']) ?? null,
        hometown: athlete?.hometown ?? null,
        bio: pickFirstString(entry, ['bio']) ?? null,
        photoUrl,
        sportPhotoUrl: pickFirstString(entry, ['sport_photo_url']) ?? null,
        active,
        sortOrder,
      } satisfies AthleticOSRosterAthlete;
    })
    .sort((a, b) => {
      if (a.active !== b.active) {
        return a.active ? -1 : 1;
      }

      const aSort = a.sortOrder ?? Number.MAX_SAFE_INTEGER;
      const bSort = b.sortOrder ?? Number.MAX_SAFE_INTEGER;
      if (aSort !== bSort) {
        return aSort - bSort;
      }

      const aNumber = Number(a.jerseyNumber ?? a.number ?? '');
      const bNumber = Number(b.jerseyNumber ?? b.number ?? '');
      const aHasNumber = Number.isFinite(aNumber);
      const bHasNumber = Number.isFinite(bNumber);

      if (aHasNumber && bHasNumber && aNumber !== bNumber) {
        return aNumber - bNumber;
      }

      if (aHasNumber !== bHasNumber) {
        return aHasNumber ? -1 : 1;
      }

      const lastCompare = a.lastName.localeCompare(b.lastName);
      if (lastCompare !== 0) {
        return lastCompare;
      }

      return a.firstName.localeCompare(b.firstName);
    });

  return normalizedRoster;
}

export async function getAppSponsorPlacementsBySchoolId(schoolId: string | number) {
  try {
    await requireSchoolById(schoolId);

    const { data, error } = await supabase
      .from('app_sponsor_placements')
      .select('*')
      .eq('school_id', schoolId)
      .order('sort_order', { ascending: true })
      .order('id', { ascending: true });

    if (error) {
      throw error;
    }

    return (data ?? []) as AthleticOSAppSponsorPlacement[];
  } catch (error) {
    if (isMissingAppOSRelationError(error)) {
      return [];
    }

    throw error;
  }
}

export async function getPromotionCardBySchoolId(schoolId: string | number) {
  try {
    await requireSchoolById(schoolId);

    const { data, error } = await supabase
      .from('promotion_cards')
      .select('*')
      .eq('school_id', schoolId)
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return (data ?? null) as AthleticOSPromotionCard | null;
  } catch (error) {
    if (isMissingAppOSRelationError(error)) {
      return null;
    }

    throw error;
  }
}

export async function getAppPrerollConfigBySchoolId(schoolId: string | number) {
  try {
    await requireSchoolById(schoolId);

    const { data, error } = await supabase
      .from('app_preroll_config')
      .select('*')
      .eq('school_id', schoolId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return null;
    }

    const videoUrl = pickFirstString(data, ['video_url']) ?? '';
    const skipAfterSeconds =
      pickFirstNumber(data, ['skip_after_seconds']) && pickFirstNumber(data, ['skip_after_seconds'])! > 0
        ? pickFirstNumber(data, ['skip_after_seconds'])!
        : 5;

    return {
      ...(data as Record<string, unknown>),
      is_enabled: data.is_enabled !== false,
      video_url: videoUrl,
      click_url: pickFirstString(data, ['click_url']) ?? '',
      sponsor_name: pickFirstString(data, ['sponsor_name']) ?? '',
      sponsor_logo_url: pickFirstString(data, ['sponsor_logo_url']) ?? '',
      skip_after_seconds: skipAfterSeconds,
    } as AthleticOSAppPrerollConfig;
  } catch (error) {
    if (isMissingAppOSRelationError(error)) {
      return null;
    }

    throw error;
  }
}

export async function getAppLiveCoverageConfigBySchoolId(schoolId: string | number) {
  try {
    await requireSchoolById(schoolId);

    const { data, error } = await supabase
      .from('app_live_coverage_config')
      .select('*')
      .eq('school_id', schoolId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return null;
    }

    return {
      ...(data as Record<string, unknown>),
      is_enabled: data.is_enabled !== false && data.enabled !== false,
      eyebrow: pickFirstString(data, ['eyebrow']) ?? '',
      headline: pickFirstString(data, ['headline']) ?? '',
      body_copy: pickFirstString(data, ['body_copy']) ?? '',
      cta_label: pickFirstString(data, ['cta_label']) ?? '',
      show_status_pill: data.show_status_pill !== false,
      destination_type: pickFirstString(data, ['destination_type']) ?? '',
      destination_value: pickFirstString(data, ['destination_value']) ?? '',
    } as AthleticOSAppLiveCoverageConfig;
  } catch (error) {
    if (isMissingAppOSRelationError(error)) {
      return null;
    }

    throw error;
  }
}

export async function getAthleteOfTheWeekBySchoolId(schoolId: string | number) {
  try {
    await requireSchoolById(schoolId);

    const { data, error } = await supabase
      .from('athlete_of_week')
      .select('*')
      .eq('school_id', schoolId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('award_date', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return null;
    }

    const row = data as Record<string, unknown>;
    console.log('[AthleticOS] athleteOfWeek row:', row);

    return {
      id: pickFirstId(row, ['id']) ?? '',
      athleteName: pickFirstString(row, ['athlete_name']) ?? '',
      sportName: pickFirstString(row, ['sport_name']) ?? null,
      classYear: pickFirstString(row, ['class_year']) ?? null,
      position: pickFirstString(row, ['position']) ?? null,
      headshotUrl: pickFirstString(row, ['headshot_url']) ?? null,
      featuredImageUrl: pickFirstString(row, ['featured_image_url']) ?? null,
      summary: pickFirstString(row, ['summary']) ?? null,
      stats: pickFirstString(row, ['stats']) ?? null,
      awardWeekLabel: pickFirstString(row, ['award_week_label']) ?? null,
      awardDate: pickFirstString(row, ['award_date']) ?? null,
      opponent: pickFirstString(row, ['opponent']) ?? null,
    };
  } catch (error) {
    if (isMissingAppOSRelationError(error)) {
      return null;
    }

    throw error;
  }
}

export async function getAppVideosConfigBySchoolId(schoolId: string | number) {
  try {
    await requireSchoolById(schoolId);

    const { data, error } = await supabase
      .from('app_videos_config')
      .select('*')
      .eq('school_id', schoolId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return null;
    }

    return {
      ...(data as Record<string, unknown>),
      is_enabled: data.is_enabled !== false,
      playlist_id:
        pickFirstString(data, ['playlist_id', 'youtube_playlist_id']) ?? '',
      playlist_url:
        pickFirstString(data, ['playlist_url', 'youtube_playlist_url', 'url']) ?? '',
      youtube_playlist_id:
        pickFirstString(data, ['youtube_playlist_id', 'playlist_id']) ?? '',
      youtube_playlist_url:
        pickFirstString(data, ['youtube_playlist_url', 'playlist_url', 'url']) ?? '',
      max_videos:
        (() => {
          const value = pickFirstNumber(data, ['max_videos']);
          return value && value > 0 ? value : 8;
        })(),
    } as AthleticOSAppVideosConfig;
  } catch (error) {
    if (isMissingAppOSRelationError(error)) {
      return null;
    }

    throw error;
  }
}

export async function getSportAppConfigBySchoolId(schoolId: string | number) {
  try {
    await requireSchoolById(schoolId);

    const { data, error } = await supabase
      .from('sport_app_config')
      .select('*')
      .eq('school_id', schoolId)
      .order('sort_order', { ascending: true })
      .order('id', { ascending: true });

    if (error) {
      throw error;
    }

    return (data ?? []) as AthleticOSSportAppConfig[];
  } catch (error) {
    if (isMissingAppOSRelationError(error)) {
      return [];
    }

    throw error;
  }
}

export async function getSportConfigBySchoolSlugAndKey(
  slug: string,
  sportKey: string
) {
  const [schoolConfig, sport] = await Promise.all([
    getSchoolConfigBySlug(slug),
    getSportBySchoolSlugAndKey(slug, sportKey),
  ]);

  const fallbackSlug = getDefaultSportSlug(sportKey);
  const fallbackName = SPORT_LABEL_FALLBACKS[sportKey] ?? sportKey;
  const sportSlug = pickFirstString(sport ?? {}, ['slug']) ?? fallbackSlug;
  const sportName = pickFirstString(sport ?? {}, ['name']) ?? fallbackName;
  const defaultMainUrl = buildSportPath(schoolConfig.athleticOSSiteUrl, sportSlug);
  const explicitSportUrl = pickFirstString(sport ?? {}, ['url']);
  const explicitScheduleUrl = pickFirstString(sport ?? {}, ['schedule_url']);
  const explicitRosterUrl = pickFirstString(sport ?? {}, ['roster_url']);
  const explicitRecruitingUrl = pickFirstString(sport ?? {}, ['recruiting_url']);

  // Assumptions to verify: sport-level AthleticOS links live on the `sports`
  // record under these URL fields when present.
  return {
    key: sportKey,
    name: sportName,
    slug: sportSlug,
    mainUrl: defaultMainUrl || explicitSportUrl || schoolConfig.mainSiteUrl,
    scheduleUrl:
      explicitScheduleUrl ||
      buildSportPath(schoolConfig.athleticOSSiteUrl, sportSlug, 'schedule') ||
      explicitSportUrl ||
      schoolConfig.scheduleUrl,
    rosterUrl:
      explicitRosterUrl ||
      buildSportPath(schoolConfig.athleticOSSiteUrl, sportSlug, 'roster') ||
      explicitSportUrl ||
      schoolConfig.mainSiteUrl,
    recruitingUrl:
      explicitRecruitingUrl ||
      buildSportPath(schoolConfig.athleticOSSiteUrl, sportSlug, 'recruiting') ||
      explicitSportUrl ||
      schoolConfig.mainSiteUrl,
  } as AthleticOSSportConfig;
}

export async function getSportConfigBySchoolIdAndKey(
  schoolId: string | number,
  sportKey: string,
  fallbackSlug?: string
) {
  const [schoolConfig, sport] = await Promise.all([
    getSchoolConfigById(schoolId, fallbackSlug),
    getSportBySchoolIdAndKey(schoolId, sportKey),
  ]);

  const fallbackSportSlug = getDefaultSportSlug(sportKey);
  const fallbackName = SPORT_LABEL_FALLBACKS[sportKey] ?? sportKey;
  const sportSlug = pickFirstString(sport ?? {}, ['slug']) ?? fallbackSportSlug;
  const sportName = pickFirstString(sport ?? {}, ['name']) ?? fallbackName;
  const defaultMainUrl = buildSportPath(schoolConfig.athleticOSSiteUrl, sportSlug);
  const explicitSportUrl = pickFirstString(sport ?? {}, ['url']);
  const explicitScheduleUrl = pickFirstString(sport ?? {}, ['schedule_url']);
  const explicitRosterUrl = pickFirstString(sport ?? {}, ['roster_url']);
  const explicitRecruitingUrl = pickFirstString(sport ?? {}, ['recruiting_url']);

  return {
    key: sportKey,
    name: sportName,
    slug: sportSlug,
    mainUrl: defaultMainUrl || explicitSportUrl || schoolConfig.mainSiteUrl,
    scheduleUrl:
      explicitScheduleUrl ||
      buildSportPath(schoolConfig.athleticOSSiteUrl, sportSlug, 'schedule') ||
      explicitSportUrl ||
      schoolConfig.scheduleUrl,
    rosterUrl:
      explicitRosterUrl ||
      buildSportPath(schoolConfig.athleticOSSiteUrl, sportSlug, 'roster') ||
      explicitSportUrl ||
      schoolConfig.mainSiteUrl,
    recruitingUrl:
      explicitRecruitingUrl ||
      buildSportPath(schoolConfig.athleticOSSiteUrl, sportSlug, 'recruiting') ||
      explicitSportUrl ||
      schoolConfig.mainSiteUrl,
  } as AthleticOSSportConfig;
}

export async function getSportStoriesBySchoolSlug(
  slug: string,
  sportKey: string
) {
  const [stories, sport] = await Promise.all([
    getStoriesBySchoolSlug(slug),
    getSportBySchoolSlugAndKey(slug, sportKey),
  ]);

  return stories.filter((story) => storyMatchesSport(story, sportKey, sport));
}

export async function getSportStoriesBySchoolId(
  schoolId: string | number,
  sportKey: string
) {
  const [stories, sport] = await Promise.all([
    getStoriesBySchoolId(schoolId),
    getSportBySchoolIdAndKey(schoolId, sportKey),
  ]);

  return stories.filter((story) => storyMatchesSport(story, sportKey, sport));
}

export async function getSportScheduleEventsBySchoolSlug(
  slug: string,
  sportKey: string
) {
  const [events, sport] = await Promise.all([
    getScheduleEventsBySchoolSlug(slug),
    getSportBySchoolSlugAndKey(slug, sportKey),
  ]);

  return events.filter((event) => scheduleEventMatchesSport(event, sportKey, sport));
}

export async function getSportScheduleEventsBySchoolId(
  schoolId: string | number,
  sportKey: string
) {
  const [events, sport] = await Promise.all([
    getScheduleEventsBySchoolId(schoolId),
    getSportBySchoolIdAndKey(schoolId, sportKey),
  ]);

  return events.filter((event) => scheduleEventMatchesSport(event, sportKey, sport));
}

export async function getSportsBySchoolSlug(slug: string) {
  const school = await requireSchool(slug);

  return getSportsBySchoolId(school.id);
}

export async function getSportsBySchoolId(schoolId: string | number) {
  await requireSchoolById(schoolId);

  // Assumption to verify: `sports.school_id` references `schools.id`.
  const { data, error } = await supabase
    .from('sports')
    .select('*')
    .eq('school_id', schoolId);

  if (error) {
    throw error;
  }

  return ((data ?? []) as AthleticOSSport[]).sort((a, b) => {
    const aName = pickFirstString(a, [...SPORT_NAME_FIELDS]) ?? '';
    const bName = pickFirstString(b, [...SPORT_NAME_FIELDS]) ?? '';
    return aName.localeCompare(bName);
  });
}

export async function getStoriesBySchoolSlug(slug: string) {
  const school = await requireSchool(slug);

  return getStoriesBySchoolId(school.id);
}

export async function getStoriesBySchoolId(schoolId: string | number) {
  await requireSchoolById(schoolId);

  // Assumption to verify: `stories.school_id` references `schools.id`.
  const { data: storiesData, error } = await supabase
    .from('stories')
    .select(
      `
        *,
        sports(id, name),
        story_sports(
          sport_id,
          sports(id, name, slug)
        )
      `
    )
    .eq('school_id', schoolId);

  if (error) {
    throw error;
  }

  console.log('RAW HOME STORY SAMPLE', (storiesData ?? []).slice(0, 3));

  return ((storiesData ?? []) as AthleticOSStory[]).sort((a, b) => {
    const aDate = normalizeSortDate(pickFirstString(a, [...STORY_DATE_FIELDS]));
    const bDate = normalizeSortDate(pickFirstString(b, [...STORY_DATE_FIELDS]));
    return bDate - aDate;
  });
}

export async function getScheduleEventsBySchoolSlug(slug: string) {
  const school = await requireSchool(slug);

  return getScheduleEventsBySchoolId(school.id);
}

export async function getScheduleEventsBySchoolId(schoolId: string | number) {
  await requireSchoolById(schoolId);

  // Assumption to verify: `schedule_events.school_id` references `schools.id`.
  const { data, error } = await supabase
    .from('schedule_events')
    .select('*')
    .eq('school_id', schoolId);

  if (error) {
    throw error;
  }

  return ((data ?? []) as AthleticOSScheduleEvent[]).sort((a, b) => {
    const aDate = normalizeSortDate(getScheduleEventDateTime(a));
    const bDate = normalizeSortDate(getScheduleEventDateTime(b));
    return aDate - bDate;
  });
}

export function mapStoryToHomeNewsItem(
  story: AthleticOSStory,
  fallbackLink: string,
  sports: AthleticOSSport[] = []
) {
  // Assumptions to verify: stories expose `title`, `summary`, `image_url`,
  // `featured_image_url`, `published_at`, and either `external_url` or `url`.
  const title = pickFirstString(story, ['title']) ?? 'Untitled Story';
  const explicitLink = pickFirstString(story, ['external_url', 'url']);
  const athleticOSBaseUrl = fallbackLink.includes('/sports/')
    ? fallbackLink.split('/sports/')[0]
    : fallbackLink.includes('/schedule')
    ? fallbackLink.replace(/\/schedule\/?$/, '')
    : fallbackLink;
  const storyIdentifier =
    pickFirstString(story, ['slug']) ?? pickFirstId(story, ['id']);
  const athleticOSStoryLink =
    athleticOSBaseUrl.includes('athleticos.ai') && storyIdentifier
      ? buildStoryPath(athleticOSBaseUrl, storyIdentifier)
      : '';
  const link = explicitLink || athleticOSStoryLink || fallbackLink;
  const summary = pickFirstString(story, ['summary']) ?? '';
  const body =
    pickFirstString(story, ['body', 'content', 'story_body', 'html_content']) ?? '';
  const image = pickFirstString(story, [...STORY_IMAGE_FIELDS]);
  const rawDate = pickFirstString(story, [...STORY_DATE_FIELDS]);
  const sportId = pickFirstId(story, ['sport_id']) ?? '';
  const storySportRows = Array.isArray(story.story_sports) ? story.story_sports : [];
  const taggedStorySportValue =
    ((storySportRows[0]?.sports ?? null) as
      | Record<string, unknown>
      | Record<string, unknown>[]
      | null) ?? null;
  const taggedStorySport = Array.isArray(taggedStorySportValue)
    ? (taggedStorySportValue[0] ?? null)
    : taggedStorySportValue;
  const directStorySportValue = story.sports ?? story.sport ?? null;
  const directStorySport = Array.isArray(directStorySportValue)
    ? ((directStorySportValue[0] as Record<string, unknown> | undefined) ?? null)
    : ((directStorySportValue as Record<string, unknown> | null) ?? null);
  const matchedSport =
    sports.find((sport) => pickFirstId(sport as Record<string, unknown>, ['id']) === sportId) ??
    null;
  const sportLabel =
    pickFirstString((taggedStorySport ?? {}) as Record<string, unknown>, ['name']) ??
    pickFirstString((directStorySport ?? {}) as Record<string, unknown>, ['name']) ??
    pickFirstString((matchedSport ?? {}) as Record<string, unknown>, ['name']) ??
    pickFirstString(story, ['sport_name']) ??
    null;

  return {
    title,
    link,
    description: summary,
    summary,
    body,
    sportId: sportId || undefined,
    sportLabel,
    sportName: sportLabel,
    image,
    rawDate,
  };
}

export function mapScheduleEventToHomeEventItem(
  event: AthleticOSScheduleEvent,
  fallbackLink: string,
  sports: AthleticOSSport[] = []
) {
  const schoolId = pickFirstId(event, ['school_id']) ?? '';
  const sportId = pickFirstId(event, ['sport_id']) ?? '';
  const matchedSport =
    sports.find((sport) => pickFirstId(sport as Record<string, unknown>, ['id']) === sportId) ??
    null;
  const sport = pickFirstString((matchedSport ?? {}) as Record<string, unknown>, ['name']) ?? 'Athletics';
  const opponent = pickFirstString(event, ['opponent_name']) ?? '';
  const homeAway = pickFirstString(event, ['home_away']) ?? '';
  const normalizedHomeAway = /^home$/i.test(homeAway)
    ? 'vs.'
    : /^away$/i.test(homeAway)
    ? 'at'
    : '';
  const status = pickFirstString(event, ['status']) ?? '';
  const result = pickFirstString(event, ['result']) ?? '';
  const eventDate = pickFirstString(event, ['event_date']) ?? '';
  const eventTimeText = pickFirstString(event, ['event_time_text']) ?? '';
  const startDateTime = pickFirstString(event, ['start_datetime']) ?? '';
  const eventDateTime = getScheduleEventDateTime(event);
  const rawDate = eventDateTime;
  const link = pickFirstString(event, ['external_url', 'url']) ?? fallbackLink;
  const opponentLogoUrl = pickFirstString(event, ['opponent_logo_url']) ?? '';
  const location = pickFirstString(event, ['location']) ?? '';
  const stadiumName = pickFirstString(event, ['stadium_name']) ?? '';
  const locationCity = pickFirstString(event, ['location_city']) ?? '';
  const locationState = pickFirstString(event, ['location_state']) ?? '';
  const isFinal =
    pickFirstBoolean(event, ['is_final']) ?? isFinalStatus(status);

  const homeTeamId = pickFirstId(event, ['homeTeamId', 'home_team_id']);
  const awayTeamId = pickFirstId(event, ['awayTeamId', 'away_team_id']);
  const schoolIdNorm = normalizeId(schoolId);
  const homeTeamIdNorm = normalizeId(homeTeamId);
  const awayTeamIdNorm = normalizeId(awayTeamId);

  let isHome = false;
  let isAway = false;

  if (homeTeamIdNorm && schoolIdNorm) {
    isHome = homeTeamIdNorm === schoolIdNorm;
  }

  if (awayTeamIdNorm && schoolIdNorm) {
    isAway = awayTeamIdNorm === schoolIdNorm;
  }

  const homeScore = pickFirstNumber(event, ['home_score']);
  const awayScore = pickFirstNumber(event, ['away_score']);
  let fallbackIsHome = false;

  if (!isHome && !isAway) {
    const matchup = (event?.home_away || '').toLowerCase();

    if (matchup === 'home' || matchup === 'vs') {
      fallbackIsHome = true;
    } else if (matchup === 'away' || matchup === 'at') {
      fallbackIsHome = false;
    }
  }

  let teamScore = null;
  let opponentScore = null;

  if (isHome) {
    teamScore = homeScore ?? null;
    opponentScore = awayScore ?? null;
  } else if (isAway) {
    teamScore = awayScore ?? null;
    opponentScore = homeScore ?? null;
  } else {
    teamScore = fallbackIsHome ? (homeScore ?? null) : (awayScore ?? null);
    opponentScore = fallbackIsHome ? (awayScore ?? null) : (homeScore ?? null);
  }

  let resultLabel = null;

  if (isFinal && teamScore != null && opponentScore != null) {
    resultLabel = teamScore > opponentScore ? 'W' : 'L';
  }

  const hasScore = homeScore !== undefined && awayScore !== undefined;
  const scoreText = hasScore ? `${homeScore}-${awayScore}` : '';
  const resultPrefix = result || (isFinal ? 'Final' : '');
  const resultSuffix = [resultPrefix, scoreText].filter(Boolean).join(' ').trim();

  return {
    id:
      pickFirstId(event, ['id']) ??
      `${sport}-${opponent}-${rawDate ?? 'unknown'}`,
    schoolId,
    sportId,
    homeTeamId: homeTeamId ?? undefined,
    awayTeamId: awayTeamId ?? undefined,
    title: [sport, normalizedHomeAway, opponent, resultSuffix]
      .filter(Boolean)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim(),
    link,
    description: opponent,
    opponentName: opponent,
    opponentLogoUrl: opponentLogoUrl ?? '',
    eventDate,
    eventTimeText,
    startDateTime,
    eventDateTime,
    rawDate,
    sportName: sport,
    homeAway: normalizedHomeAway,
    status: normalizeStatus(status),
    result: result || undefined,
    isFinal,
    homeScore,
    awayScore,
    teamScore,
    opponentScore,
    resultLabel: resultLabel ?? undefined,
    location,
    stadiumName,
    locationCity,
    locationState,
  };
}
