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
  [key: string]: unknown;
};

export type AthleticOSScheduleEvent = {
  id?: string | number;
  slug?: string;
  school_id?: string | number;
  sport_id?: string | number;
  sport_slug?: string;
  sport_name?: string;
  opponent_name?: string;
  home_away?: string;
  status?: string;
  result?: string;
  start_time?: string;
  home_score?: number;
  away_score?: number;
  external_url?: string;
  url?: string;
  created_at?: string;
  [key: string]: unknown;
};

const SPORT_NAME_FIELDS = ['name'] as const;
const STORY_DATE_FIELDS = ['published_at', 'created_at'] as const;
const SCHEDULE_EVENT_DATE_FIELDS = ['start_time', 'created_at'] as const;
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

  if (sportId) {
    return Boolean(matchedSportId) && sportId === matchedSportId;
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
  const { data, error } = await supabase
    .from('stories')
    .select('*')
    .eq('school_id', schoolId);

  if (error) {
    throw error;
  }

  return ((data ?? []) as AthleticOSStory[]).sort((a, b) => {
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
    const aDate = normalizeSortDate(
      pickFirstString(a, [...SCHEDULE_EVENT_DATE_FIELDS])
    );
    const bDate = normalizeSortDate(
      pickFirstString(b, [...SCHEDULE_EVENT_DATE_FIELDS])
    );
    return aDate - bDate;
  });
}

export function mapStoryToHomeNewsItem(
  story: AthleticOSStory,
  fallbackLink: string
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
  const sportName = pickFirstString(story, ['sport_name']) ?? '';

  return {
    title,
    link,
    description: summary,
    summary,
    body,
    sportName,
    image,
    rawDate,
  };
}

export function mapScheduleEventToHomeEventItem(
  event: AthleticOSScheduleEvent,
  fallbackLink: string
) {
  // Assumptions to verify: schedule events expose `sport_name`,
  // `opponent_name`, `home_away`, `status`, `result`, `start_time`,
  // `home_score`, `away_score`, and either `external_url` or `url`.
  const sport = pickFirstString(event, ['sport_name']) ?? 'School Event';
  const opponent = pickFirstString(event, ['opponent_name']) ?? 'Opponent TBA';
  const homeAway = pickFirstString(event, ['home_away']) ?? '';
  const normalizedHomeAway =
    /^away$/i.test(homeAway) || /^at$/i.test(homeAway) ? 'at' : 'vs.';
  const status = pickFirstString(event, ['status']) ?? '';
  const result = pickFirstString(event, ['result']) ?? '';
  const rawDate = pickFirstString(event, [...SCHEDULE_EVENT_DATE_FIELDS]);
  const link = pickFirstString(event, ['external_url', 'url']) ?? fallbackLink;

  const homeScore = pickFirstNumber(event, ['home_score']);
  const awayScore = pickFirstNumber(event, ['away_score']);
  const hasScore = homeScore !== undefined && awayScore !== undefined;
  const scoreText = hasScore ? `${homeScore}-${awayScore}` : '';
  const resultPrefix = result || (isFinalStatus(status) ? 'Final' : '');
  const resultSuffix = [resultPrefix, scoreText].filter(Boolean).join(' ').trim();

  return {
    id:
      pickFirstId(event, ['id', 'slug']) ??
      `${sport}-${opponent}-${rawDate ?? 'unknown'}`,
    title: [sport, normalizedHomeAway, opponent, resultSuffix]
      .filter(Boolean)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim(),
    link,
    description: opponent,
    rawDate,
    sportName: sport,
    status: normalizeStatus(status),
  };
}
