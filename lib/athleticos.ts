import { supabase } from './supabase';

export type AthleticOSSchool = {
  id: string | number;
  slug: string;
  [key: string]: unknown;
};

export type AthleticOSSchoolConfig = {
  athleticOSSiteUrl: string;
  mainSiteUrl: string;
  scheduleUrl: string;
  watchUrl: string;
  listenUrl: string;
  sponsorUrl: string;
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
const SCHOOL_SITE_FIELDS = ['athleticos_site_url', 'public_site_url', 'site_url'] as const;
const SCHOOL_WEBSITE_FIELDS = ['website_url', 'url'] as const;
const SCHOOL_SCHEDULE_FIELDS = ['schedule_url', 'website_url', 'url'] as const;
const SCHOOL_WATCH_FIELDS = ['watch_url', 'youtube_url', 'video_url'] as const;
const SCHOOL_LISTEN_FIELDS = ['listen_url', 'radio_url', 'audio_url'] as const;
const SCHOOL_SPONSOR_FIELDS = ['sponsor_url', 'website_url', 'url'] as const;

const SCHOOL_CONFIG_FALLBACKS: Record<string, AthleticOSSchoolConfig> = {
  'pike-road': {
    athleticOSSiteUrl: 'https://athleticos.ai/pike-road',
    mainSiteUrl: 'https://athleticos.ai/pike-road',
    scheduleUrl: 'https://athleticos.ai/pike-road/schedule',
    watchUrl: 'https://www.youtube.com/@pikeroadlive',
    listenUrl: 'https://ice42.securenetsystems.net/RALA1',
    sponsorUrl: 'https://www.pikeroadathletics.org/',
  },
};

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

export async function getSchoolBySlug(slug: string) {
  const { data, error } = await supabase
    .from('schools')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data ?? null) as AthleticOSSchool | null;
}

export function getDefaultSchoolConfig(slug: string): AthleticOSSchoolConfig {
  return (
    SCHOOL_CONFIG_FALLBACKS[slug] ?? {
      athleticOSSiteUrl: '',
      mainSiteUrl: '',
      scheduleUrl: '',
      watchUrl: '',
      listenUrl: '',
      sponsorUrl: '',
    }
  );
}

export async function getSchoolConfigBySlug(slug: string) {
  const school = await getSchoolBySlug(slug);
  const fallbackConfig = getDefaultSchoolConfig(slug);

  if (!school) {
    return fallbackConfig;
  }

  // Assumptions to verify: school-level Home links live on the `schools` record
  // under these URL fields when present.
  return {
    athleticOSSiteUrl:
      pickFirstString(school, [...SCHOOL_SITE_FIELDS]) ??
      fallbackConfig.athleticOSSiteUrl,
    mainSiteUrl:
      pickFirstString(school, [...SCHOOL_SITE_FIELDS]) ??
      pickFirstString(school, [...SCHOOL_WEBSITE_FIELDS]) ??
      fallbackConfig.mainSiteUrl,
    scheduleUrl:
      pickFirstString(school, [...SCHOOL_SCHEDULE_FIELDS]) ??
      buildSchoolPath(
        pickFirstString(school, [...SCHOOL_SITE_FIELDS]) ??
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

export async function getSportsBySchoolSlug(slug: string) {
  const school = await requireSchool(slug);

  // Assumption to verify: `sports.school_id` references `schools.id`.
  const { data, error } = await supabase
    .from('sports')
    .select('*')
    .eq('school_id', school.id as string | number);

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

  // Assumption to verify: `stories.school_id` references `schools.id`.
  const { data, error } = await supabase
    .from('stories')
    .select('*')
    .eq('school_id', school.id as string | number);

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

  // Assumption to verify: `schedule_events.school_id` references `schools.id`.
  const { data, error } = await supabase
    .from('schedule_events')
    .select('*')
    .eq('school_id', school.id as string | number);

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
  const description = pickFirstString(story, ['summary']) ?? '';
  const image = pickFirstString(story, [...STORY_IMAGE_FIELDS]);
  const rawDate = pickFirstString(story, [...STORY_DATE_FIELDS]);

  return {
    title,
    link,
    description,
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
  const sport = pickFirstString(event, ['sport_name']) ?? 'Pike Road';
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
