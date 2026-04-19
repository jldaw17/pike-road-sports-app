import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
} from 'expo-audio';
import { Video, type AVPlaybackStatus } from 'expo-av';
import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';
import * as Notifications from 'expo-notifications';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  ImageBackground,
  Linking,
  Platform,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  type ViewStyle,
  Text,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import {
  type AthleticOSAppHomeModule,
  type AthleticOSAppThemeConfig,
  type AthleticOSBottomNavItem,
  type AthleticOSRosterAthlete,
  type AthleticOSResolvedTheme,
  type AthleticOSTeamNavItem,
  type AthleticOSAthleteOfTheWeek,
  type AthleticOSAppLiveCoverageConfig,
  type AthleticOSAppPrerollConfig,
  type AthleticOSAppVideosConfig,
  type AthleticOSPromotionCard,
  type AthleticOSAppSponsorPlacement,
  type AthleticOSSport,
  type AthleticOSSportAppConfig,
  getAthleteOfTheWeekBySchoolId,
  getAppBottomNavItemsBySchoolId,
  getAppPrerollConfigBySchoolId,
  getAppThemeConfigBySchoolId,
  getTeamNavBySportId,
  getAppLiveCoverageConfigBySchoolId,
  getAppVideosConfigBySchoolId,
  getDefaultSchoolConfig,
  getAppHomeModulesBySchoolId,
  getAppSponsorPlacementsBySchoolId,
  getPromotionCardBySchoolId,
  getSchoolConfigById,
  getScheduleEventsBySchoolId,
  getRosterBySchoolIdAndSportId,
  getSchoolAppConfigById,
  getSportAppConfigBySchoolId,
  getSportBySchoolIdAndKey,
  getSportConfigBySchoolIdAndKey,
  getSportScheduleEventsBySchoolId,
  getSportStoriesBySchoolId,
  getSportsBySchoolId,
  getStoriesBySchoolId,
  mapScheduleEventToHomeEventItem,
  mapStoryToHomeNewsItem,
  resolveAthleticOSTheme,
} from './lib/athleticos';
import { getSchoolIdFromSlug } from './lib/getSchool';
import { subscribeToTeam, unsubscribeFromTeam } from './lib/pushos';
import { usePushNotifications } from './hooks/usePushNotifications';

const BRAND = {
  primary: '#1F3B7A',
  primaryDark: '#162E63',
  black: '#000000',
  background: '#0B1020',
  surface: '#141B2D',
  surfaceAlt: '#1C2540',
  white: '#FFFFFF',
  gray: '#AAB2C5',
  lightGray: '#D9DFEA',
  border: '#2B3657',
  muted: '#7D879C',
  red: '#C8102E',
};

const STORAGE_KEYS = {
  notificationsEnabled: 'notificationsEnabled',
  notificationsPromptDismissed: 'notificationsPromptDismissed',
  followedTeams: 'followedTeams',
  autoPlayVideo: 'autoPlayVideo',
  useLocalTimezone: 'useLocalTimezone',
  themeMode: 'themeMode',
};

const SPONSOR_CAROUSEL_CARD_WIDTH = 248;
const SPONSOR_CAROUSEL_CARD_GAP = 12;
const DEFAULT_APP_THEME = resolveAthleticOSTheme();

function getThemeHeroGradient(theme: AthleticOSResolvedTheme) {
  return [theme.colors.heroStart, theme.colors.heroEnd, theme.colors.cardAlt];
}

function getThemeDarkHeroGradient(theme: AthleticOSResolvedTheme) {
  return [BRAND.black, theme.colors.heroEnd, theme.colors.cardAlt];
}

function normalizeConfiguredSchoolSlug(value?: string) {
  return (value ?? '')
    .trim()
    .toLowerCase()
    .replace(/-(athletics|sports-app|sports)$/i, '');
}

function getConfiguredSchoolSlug() {
  const extraSlug = Constants?.expoConfig?.extra?.schoolSlug;
  if (typeof extraSlug === 'string' && extraSlug.trim()) {
    return normalizeConfiguredSchoolSlug(extraSlug);
  }

  const appSlug = Constants?.expoConfig?.slug;
  if (typeof appSlug === 'string' && appSlug.trim()) {
    return normalizeConfiguredSchoolSlug(appSlug);
  }

  return '';
}

function getYoutubeApiKey() {
  try {
    // Expo config (primary)
    const expoKey =
      (Constants?.expoConfig?.extra as any)?.youtubeApiKey ||
      (Constants as any)?.manifest?.extra?.youtubeApiKey;

    if (expoKey && typeof expoKey === 'string' && expoKey.trim().length > 0) {
      return expoKey.trim();
    }

    // Env fallback
    if (process.env.EXPO_PUBLIC_YOUTUBE_API_KEY) {
      return process.env.EXPO_PUBLIC_YOUTUBE_API_KEY.trim();
    }

    return null;
  } catch (err) {
    console.warn('Failed to resolve YouTube API key', err);
    return null;
  }
}

function getSafeSortOrder(value?: number) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function normalizeModuleKey(value?: string) {
  return (value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');
}

function normalizePlacementKey(value?: string) {
  return normalizeModuleKey(value);
}

function getHeroBrandTitle(schoolConfig: {
  heroTitleOverride?: string;
  appShortName?: string;
  displayName?: string;
}) {
  const heroTitleOverride = schoolConfig.heroTitleOverride?.trim() ?? '';
  if (heroTitleOverride) {
    return heroTitleOverride;
  }

  const appShortName = schoolConfig.appShortName?.trim() ?? '';
  if (appShortName) {
    return `${appShortName} Athletics`;
  }

  return schoolConfig.displayName?.trim() || 'Athletics';
}

function getHeroBrandSubtitle(schoolConfig: {
  heroSubtitleOverride?: string;
  mascotName?: string;
}) {
  const heroSubtitleOverride = schoolConfig.heroSubtitleOverride?.trim() ?? '';
  if (heroSubtitleOverride) {
    return heroSubtitleOverride;
  }

  const mascotName = schoolConfig.mascotName?.trim() ?? '';
  if (mascotName) {
    return `Home of the ${mascotName}`;
  }

  return 'Powered by AthleticOS';
}

function getResolvedHomeModules(modules: AthleticOSAppHomeModule[]) {
  return [...modules]
    .filter((module) => module.is_enabled !== false && module.module_key)
    .sort((a, b) => {
      const orderDiff = getSafeSortOrder(a.sort_order) - getSafeSortOrder(b.sort_order);
      if (orderDiff !== 0) {
        return orderDiff;
      }

      return (a.module_key ?? '').localeCompare(b.module_key ?? '');
    });
}

function normalizeBottomNavDestinationType(value?: string) {
  return (value ?? '').trim().toLowerCase();
}

function resolveBottomNavIcon(iconKey?: string): keyof typeof Ionicons.glyphMap {
  switch ((iconKey ?? '').trim().toLowerCase()) {
    case 'broadcast':
      return 'radio-outline';
    case 'teams':
      return 'people';
    case 'tickets':
      return 'ticket-outline';
    case 'schedule':
      return 'calendar-outline';
    case 'news':
      return 'newspaper-outline';
    case 'standings':
      return 'stats-chart-outline';
    case 'shop':
      return 'bag-handle-outline';
    case 'watch':
    case 'livestream':
      return 'videocam-outline';
    case 'media':
      return 'play-circle-outline';
    default:
      return 'ellipse-outline';
  }
}

type TabKey = 'home' | 'teams' | 'media' | 'tickets' | 'more';
type BottomNavSlot = 1 | 2 | 4;
type ScreenMode =
  | 'tabs'
  | 'sportDetail'
  | 'roster'
  | 'athleteProfile'
  | 'athleteOfWeekDetail'
  | 'newsList'
  | 'storyDetail'
  | 'embedded'
  | 'schedule'
  | 'settings'
  | 'manageTeams'
  | 'savedEvents';

type SportType = {
  key: string;
  label: string;
  shortLabel?: string;
};

type NewsItem = {
  title: string;
  link: string;
  date: string;
  description: string;
  summary?: string;
  body?: string;
  sportId?: string;
  sportLabel?: string | null;
  sportName?: string;
  image?: string;
  rawDate?: string;
};

type VideoItem = {
  id: string;
  title: string;
  link: string;
  date: string;
  image?: string;
  rawDate?: string;
};

type GalleryItem = {
  id: string;
  title: string;
  link: string;
  date: string;
  image?: string;
  sport?: string;
  rawDate?: string;
};

type EventItem = {
  id: string;
  schoolId?: string;
  sportId?: string;
  teamId?: string;
  homeTeamId?: string;
  awayTeamId?: string;
  title: string;
  link: string;
  date: string;
  description: string;
  opponentName?: string;
  opponentLogoUrl?: string;
  eventDate?: string;
  eventTimeText?: string;
  startDateTime?: string;
  eventDateTime?: string;
  rawDate?: string;
  sportName?: string;
  homeAway?: string;
  status?: string;
  result?: string;
  isFinal?: boolean;
  homeScore?: number;
  awayScore?: number;
  teamScore?: number | null;
  opponentScore?: number | null;
  resultLabel?: 'W' | 'L';
  location?: string;
  stadiumName?: string;
  locationCity?: string;
  locationState?: string;
};

type ScheduleScreenVariant = 'school' | 'team';

type NormalizedScheduleItem = {
  id: string;
  title: string;
  sport: string;
  opponent: string;
  opponentLogoUrl?: string;
  displayDate: string;
  timeLabel: string;
  link: string;
  homeAway?: string;
  statusLabel?: string;
  locationLabel?: string;
  hasScore?: boolean;
  teamScore?: string;
  opponentScore?: string;
  result?: 'W' | 'L' | '';
};

type FollowableSport = {
  id: string;
  label: string;
};

type TeamNavAction = {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
};

type OpenRosterOptions = {
  sport: SportType;
  sportId: string;
  headerTitle: string;
  headerSubtitle?: string;
  schoolLogoUrl?: string;
};

type BottomNavRenderItem = {
  key: string;
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  active: boolean;
};

type RosterSortKey = 'number' | 'name' | 'position';

const SPORTS: SportType[] = [
  {
    key: 'football',
    label: 'Football',
  },
  {
    key: 'baseball',
    label: 'Baseball',
  },
  {
    key: 'boys-basketball',
    label: "Men's Basketball",
    shortLabel: 'Boys Basketball',
  },
  {
    key: 'girls-basketball',
    label: "Women's Basketball",
    shortLabel: 'Girls Basketball',
  },
  {
    key: 'softball',
    label: 'Softball',
  },
  {
    key: 'volleyball',
    label: 'Volleyball',
  },
  {
    key: 'boys-soccer',
    label: "Men's Soccer",
    shortLabel: 'Boys Soccer',
  },
  {
    key: 'girls-soccer',
    label: "Women's Soccer",
    shortLabel: 'Girls Soccer',
  },
  {
    key: 'boys-golf',
    label: "Men's Golf",
    shortLabel: 'Boys Golf',
  },
  {
    key: 'girls-golf',
    label: "Women's Golf",
    shortLabel: 'Girls Golf',
  },
  {
    key: 'boys-tennis',
    label: "Men's Tennis",
    shortLabel: 'Boys Tennis',
  },
  {
    key: 'girls-tennis',
    label: "Women's Tennis",
    shortLabel: 'Girls Tennis',
  },
  {
    key: 'boys-track-field',
    label: "Men's Track & Field",
    shortLabel: 'Boys Track',
  },
  {
    key: 'girls-track-field',
    label: "Women's Track & Field",
    shortLabel: 'Girls Track',
  },
  {
    key: 'boys-cross-country',
    label: "Men's Cross Country",
    shortLabel: 'Boys XC',
  },
  {
    key: 'girls-cross-country',
    label: "Women's Cross Country",
    shortLabel: 'Girls XC',
  },
];
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

function decodeHtml(value = '') {
  return value
    .replace(/<!\[CDATA\[(.*?)\]\]>/gs, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, ' ')
    .replace(/&ndash;/g, '–')
    .replace(/&mdash;/g, '—')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function stripHtml(value = '') {
  return decodeHtml(value)
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getTagValue(xml: string, tag: string) {
  const match = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return match?.[1]?.trim() ?? '';
}

function extractImageFromHtml(html = '') {
  const imgMatch =
    html.match(/<img[^>]+src=["']([^"']+)["']/i) ||
    html.match(/https?:\/\/[^"'\s>]+\.(?:jpg|jpeg|png|webp)/i);

  if (!imgMatch) {
    return undefined;
  }

  return Array.isArray(imgMatch) ? imgMatch[1] || imgMatch[0] : undefined;
}

function normalizeUrl(url = '') {
  return url.replace(/^http:\/\//i, 'https://');
}

function hasResolvedUrl(url?: string) {
  return /^https?:\/\//i.test((url ?? '').trim());
}

function safeDate(raw?: string) {
  if (!raw) return null;

  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) return parsed;

  const fallback = Date.parse(raw);
  if (!Number.isNaN(fallback)) return new Date(fallback);

  return null;
}

function hasExplicitTime(raw?: string) {
  if (!raw) return false;

  return (
    /t\d{2}:\d{2}/i.test(raw) ||
    /\b\d{1,2}:\d{2}\b/.test(raw) ||
    /\b\d{1,2}\s?(am|pm)\b/i.test(raw)
  );
}

function getScheduleStatusLabel(item: EventItem) {
  if (item.isFinal) {
    return 'Final';
  }

  const status = (item.status ?? '').trim().toLowerCase();

  if (status === 'postponed') {
    return 'Postponed';
  }

  if (status === 'canceled' || status === 'cancelled') {
    return 'Canceled';
  }

  if (status === 'live' || status === 'in_progress' || status === 'in-progress') {
    return 'Live';
  }

  return '';
}

function getScheduleLocationLabel(item: EventItem) {
  const stadiumName = item.stadiumName?.trim() || '';
  const location = item.location?.trim() || '';
  const city = item.locationCity?.trim() || '';
  const state = item.locationState?.trim() || '';
  const cityState =
    city && state ? `${city}, ${state}` : city || state;

  const candidates = [stadiumName, location, cityState].filter(Boolean);

  const deduped: string[] = [];
  for (const value of candidates) {
    const normalizedValue = value.toLowerCase();
    if (!deduped.some((existing) => existing.toLowerCase() === normalizedValue)) {
      deduped.push(value);
    }
  }

  return deduped[0] ?? '';
}

function formatDate(raw?: string) {
  const parsed = safeDate(raw);
  if (!parsed) return '';
  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDateTime(raw?: string) {
  const parsed = safeDate(raw);
  if (!parsed) return '';
  return parsed.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

async function fetchRssItems(url: string) {
  const response = await fetch(normalizeUrl(url));

  if (!response.ok) {
    throw new Error(`Feed request failed: ${response.status}`);
  }

  const xml = await response.text();
  const items = xml.match(/<item\b[\s\S]*?<\/item>/gi) ?? [];

  return items.map((itemXml, index) => {
    const title = stripHtml(decodeHtml(getTagValue(itemXml, 'title')));
    const link = normalizeUrl(decodeHtml(getTagValue(itemXml, 'link')));
    const description = decodeHtml(getTagValue(itemXml, 'description'));
    const pubDate = decodeHtml(getTagValue(itemXml, 'pubDate'));
    const image = extractImageFromHtml(description);

    return {
      id: `${index}-${title}-${link}`,
      title,
      link,
      description: stripHtml(description),
      rawDate: pubDate,
      date: formatDate(pubDate),
      image,
    };
  });
}

function getGalleryFeedCandidates(mainSiteUrl: string) {
  const trimmedBase = mainSiteUrl.replace(/\/+$/, '');

  // Assumptions to verify: the school site exposes one of these gallery/photo RSS feeds.
  return [
    `${trimmedBase}/gallery/feed/`,
    `${trimmedBase}/galleries/feed/`,
    `${trimmedBase}/category/galleries/feed/`,
    `${trimmedBase}/category/photos/feed/`,
    `${trimmedBase}/feed/?post_type=gallery`,
  ];
}

async function fetchGalleryItems(mainSiteUrl: string): Promise<GalleryItem[]> {
  if (!hasResolvedUrl(mainSiteUrl)) {
    return [];
  }

  for (const candidateUrl of getGalleryFeedCandidates(mainSiteUrl)) {
    try {
      const items = await fetchRssItems(candidateUrl);
      const galleries = items
        .filter((item) => item.title && item.link && item.image)
        .map((item, index) => ({
          id: item.id || `${candidateUrl}-${index}`,
          title: item.title,
          link: item.link,
          image: item.image,
          rawDate: item.rawDate,
          date: item.date,
          sport: inferSportFromTitle(item.title),
        }));

      if (galleries.length > 0) {
        return galleries;
      }
    } catch (error) {
      continue;
    }
  }

  return [];
}

function filterRecentResultEvents(events: EventItem[]) {
  const now = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(now.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  return events
    .filter((event) => {
      const eventDate = safeDate(event.rawDate);
      if (!eventDate) return false;

      if (eventDate < sevenDaysAgo || eventDate > now) return false;

      const title = event.title || '';

      const hasResult =
        ['final', 'completed', 'closed'].includes(
          event.status?.toLowerCase() ?? ''
        ) ||
        /\b(W|L),\s*\d+-\d+\b/i.test(title) ||
        /\b\d+\s*-\s*\d+\b/.test(title) ||
        /\bFinal\b/i.test(title);

      return hasResult;
    })
    .sort((a, b) => {
      const aTime = safeDate(a.rawDate)?.getTime() ?? 0;
      const bTime = safeDate(b.rawDate)?.getTime() ?? 0;
      return bTime - aTime;
    })
    .slice(0, 10);
}

function filterUpcomingWeekEvents(events: EventItem[]) {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const tenDaysOut = new Date(todayStart);
  tenDaysOut.setDate(tenDaysOut.getDate() + 10);
  tenDaysOut.setHours(23, 59, 59, 999);

  return events
    .filter((event) => {
      const eventDate = safeDate(event.rawDate);
      if (!eventDate) return false;
      if (eventDate < todayStart || eventDate > tenDaysOut) return false;
      return (
        !['final', 'completed', 'closed'].includes(
          event.status?.toLowerCase() ?? ''
        ) && !/\b(W|L),\s*\d+-\d+/i.test(event.title)
      );
    })
    .sort((a, b) => {
      const aTime = safeDate(a.rawDate)?.getTime() ?? 0;
      const bTime = safeDate(b.rawDate)?.getTime() ?? 0;
      return aTime - bTime;
    });
}

function filterNextFourGames(events: EventItem[]) {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  return events
    .filter((event) => {
      const eventDate = safeDate(event.rawDate);
      if (!eventDate) return false;

      const hasResult = /\b(W|L),\s*\d+-\d+/i.test(event.title);
      if (hasResult) return false;

      return eventDate >= todayStart;
    })
    .sort((a, b) => {
      const aTime = safeDate(a.rawDate)?.getTime() ?? 0;
      const bTime = safeDate(b.rawDate)?.getTime() ?? 0;
      return aTime - bTime;
    })
    .slice(0, 4);
}

function getXmlAttributeValue(xml: string, tag: string, attribute: string) {
  const match = xml.match(
    new RegExp(`<${tag}\\b[^>]*\\b${attribute}=["']([^"']+)["'][^>]*\\/?>`, 'i')
  );
  return match?.[1]?.trim() ?? '';
}

function extractYoutubePlaylistId(value?: string) {
  const normalizedValue = (value ?? '').trim();
  if (!normalizedValue) {
    return '';
  }

  if (!normalizedValue.includes('http')) {
    return normalizedValue;
  }

  const listMatch = normalizedValue.match(/[?&]list=([A-Za-z0-9_-]+)/i);
  if (listMatch?.[1]?.trim()) {
    return listMatch[1].trim();
  }

  const pathMatch = normalizedValue.match(/\/playlist\/([A-Za-z0-9_-]+)/i);
  return pathMatch?.[1]?.trim() ?? '';
}

async function fetchYoutubePlaylistVideos(
  config: AthleticOSAppVideosConfig | null
): Promise<VideoItem[]> {
  if (!config?.is_enabled) {
    return [];
  }

  console.log('[AthleticOS] videos config:', config);

  const playlistId = extractYoutubePlaylistId(
    config.playlist_id ||
      config.youtube_playlist_id ||
      config.playlist_url ||
      config.youtube_playlist_url
  );
  console.log('YOUTUBE API KEY:', getYoutubeApiKey());
  console.log('PLAYLIST ID:', playlistId);
  console.log('[AthleticOS] extracted playlist id:', playlistId);
  if (!playlistId) {
    return [];
  }

  const youtubeApiKey = getYoutubeApiKey();
  if (!youtubeApiKey) {
    console.log('[AthleticOS] missing YouTube API key for videos module');
    return [];
  }

  try {
    const maxResults =
      typeof config.max_videos === 'number' && Number.isFinite(config.max_videos)
        ? Math.max(1, Math.min(50, Math.floor(config.max_videos)))
        : 8;
    const params = new URLSearchParams({
      part: 'snippet',
      playlistId,
      maxResults: String(maxResults),
      key: youtubeApiKey,
    });
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?${params.toString()}`
    );

    if (!response.ok) {
      console.log('[AthleticOS] YouTube playlist request failed:', response.status);
      return [];
    }

    const payload = await response.json();
    const items = Array.isArray(payload?.items) ? payload.items : [];

    const videos = items
      .map((item: any, index: number) => {
        const snippet = item?.snippet && typeof item.snippet === 'object' ? item.snippet : null;
        const resourceId =
          snippet?.resourceId && typeof snippet.resourceId === 'object'
            ? snippet.resourceId
            : null;
        const thumbnails =
          snippet?.thumbnails && typeof snippet.thumbnails === 'object'
            ? snippet.thumbnails
            : null;
        const mediumThumbnail =
          thumbnails?.medium && typeof thumbnails.medium === 'object'
            ? thumbnails.medium
            : null;
        const videoId =
          typeof resourceId?.videoId === 'string' ? resourceId.videoId.trim() : '';
        const title =
          typeof snippet?.title === 'string'
            ? stripHtml(decodeHtml(snippet.title)).trim()
            : '';
        const rawDate =
          typeof snippet?.publishedAt === 'string' ? snippet.publishedAt.trim() : '';
        const thumbnail =
          typeof mediumThumbnail?.url === 'string' ? normalizeUrl(mediumThumbnail.url) : '';
        const link = videoId ? `https://www.youtube.com/watch?v=${videoId}` : '';

        if (!title || !hasResolvedUrl(link)) {
          return null;
        }

        return {
          id: videoId || `${playlistId}-${index}`,
          title,
          link,
          rawDate,
          date: formatDate(rawDate),
          image: hasResolvedUrl(thumbnail) ? thumbnail : undefined,
        } satisfies VideoItem;
      })
      .filter(Boolean) as VideoItem[];

    console.log('[AthleticOS] fetched video count:', videos.length);
    return videos.length > 0 ? videos : [];
  } catch (error) {
    console.log('YouTube playlist load error:', error);
    return [];
  }
}

function getSponsorSignature(placement: AthleticOSAppSponsorPlacement) {
  return [
    (placement.sponsor_name ?? '').trim().toLowerCase(),
    (placement.sponsor_logo_url ?? '').trim().toLowerCase(),
    (placement.sponsor_link_url ?? '').trim().toLowerCase(),
  ].join('|');
}

function isRenderableSponsorPlacement(placement: AthleticOSAppSponsorPlacement) {
  return Boolean(
    placement &&
      placement.is_enabled !== false &&
      ((placement.sponsor_logo_url ?? '').trim() ||
        (placement.sponsor_name ?? '').trim())
  );
}

function dedupeSponsorPlacements(placements: AthleticOSAppSponsorPlacement[]) {
  const seen = new Set<string>();

  return placements.filter((placement) => {
    const signature = getSponsorSignature(placement);
    if (!signature || seen.has(signature)) {
      return false;
    }

    seen.add(signature);
    return true;
  });
}

function inferSportFromTitle(title: string) {
  const lower = title.toLowerCase();
  if (lower.includes('football')) return 'Football';
  if (lower.includes('baseball')) return 'Baseball';
  if (lower.includes('softball')) return 'Softball';
  if (lower.includes('men') || lower.includes('boys') || lower.includes('mbkb'))
    return 'Boys Basketball';
  if (
    lower.includes('women') ||
    lower.includes('girls') ||
    lower.includes('wbkb')
  )
    return 'Girls Basketball';
  if (lower.includes('volleyball')) return 'Volleyball';
  if (lower.includes('soccer')) return 'Soccer';
  if (lower.includes('tennis')) return 'Tennis';
  if (lower.includes('track')) return 'Track';
  if (lower.includes('golf')) return 'Golf';
  return '';
}

function normalizeScheduleItem(item: EventItem) {
  const eventDateTime =
    item.startDateTime?.trim() ||
    item.eventDateTime?.trim() ||
    item.rawDate ||
    item.eventDate?.trim() ||
    '';
  const parsed = safeDate(eventDateTime || item.eventDate);
  const explicitTimeText = item.eventTimeText?.trim() || '';
  const derivedHasTime = hasExplicitTime(eventDateTime);
  const hasTime = Boolean(explicitTimeText) || derivedHasTime;

  const displayDate = parsed
    ? parsed.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      })
    : item.date || item.eventDate || '';

  const timeLabel = explicitTimeText
    ? explicitTimeText
    : parsed && hasTime
      ? parsed.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
        })
      : '';

  const title = item.title || '';
  const cleanedTitle = title.replace(/\s+/g, ' ').trim();

  let sport = item.sportName?.trim() || inferSportFromTitle(cleanedTitle);
  if (!sport) {
    sport = 'Athletics';
  }
  let opponent =
    item.opponentName?.trim() ||
    item.description?.trim() ||
    cleanedTitle ||
    '';
  let homeAway: 'vs.' | 'at' | '' =
    item.homeAway === 'at' || item.homeAway === 'vs.' ? item.homeAway : '';
  let teamScore = '';
  let opponentScore = '';
  let hasScore = false;
  let result: 'W' | 'L' | '' = '';

  if (!homeAway && cleanedTitle.includes(' vs. ')) {
    const parts = cleanedTitle.split(' vs. ');
    opponent = item.description?.trim() || parts[1] || opponent;
    homeAway = 'vs.';
  } else if (!homeAway && cleanedTitle.includes(' at ')) {
    const parts = cleanedTitle.split(' at ');
    opponent = item.description?.trim() || parts[1] || opponent;
    homeAway = 'at';
  }

  if (
    item.isFinal &&
    typeof item.teamScore === 'number' &&
    typeof item.opponentScore === 'number'
  ) {
    hasScore = true;
    teamScore = String(item.teamScore);
    opponentScore = String(item.opponentScore);
    const normalizedResult = (item.resultLabel ?? item.result ?? '').trim().toUpperCase();
    if (normalizedResult === 'W' || normalizedResult === 'L') {
      result = normalizedResult;
    }
  }

  opponent = opponent
    .replace(/\s*[WL],\s*\d+-\d+/i, '')
    .replace(/\s*Final\s*/i, '')
    .replace(/\s*\d+\s*-\s*\d+\s*/i, '')
    .replace(/\|.*$/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!opponent) {
    opponent = item.opponentName?.trim() || cleanedTitle || sport;
  }

  return {
    id: item.id,
    title: cleanedTitle,
    sport,
    opponent,
    opponentLogoUrl: item.opponentLogoUrl?.trim() || '',
    displayDate,
    timeLabel,
    link: item.link,
    homeAway,
    statusLabel: getScheduleStatusLabel(item),
    locationLabel: getScheduleLocationLabel(item),
    hasScore,
    teamScore,
    opponentScore,
    result,
  };
}

function getSportColor(sport: string) {
  switch (sport) {
    case 'Football':
      return '#B91C1C';
    case 'Baseball':
      return '#2563EB';
    case 'Softball':
      return '#DB2777';
    case 'Boys Basketball':
      return '#D97706';
    case 'Girls Basketball':
      return '#7C3AED';
    case 'Volleyball':
      return '#059669';
    default:
      return BRAND.primary;
  }
}

function TopIcon({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.topIconWrap} onPress={onPress}>
      <LinearGradient
        colors={[BRAND.primary, BRAND.primaryDark]}
        style={styles.topIconCircle}
      >
        <Ionicons name={icon} size={20} color={BRAND.white} />
      </LinearGradient>
      <Text style={styles.topIconLabel}>{label}</Text>
    </Pressable>
  );
}

function SectionHeader({
  title,
  actionLabel,
  onAction,
  containerStyle,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  containerStyle?: ViewStyle;
}) {
  return (
    <View style={[styles.sectionHeader, containerStyle]}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction}>
          <Text style={styles.sectionAction}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function OptionalSectionHeader({
  title,
  actionLabel,
  onAction,
  containerStyle,
}: {
  title?: string;
  actionLabel?: string;
  onAction?: () => void;
  containerStyle?: ViewStyle;
}) {
  const resolvedTitle = title?.trim() ?? '';
  if (!resolvedTitle) {
    return null;
  }

  return (
    <SectionHeader
      title={resolvedTitle}
      actionLabel={actionLabel}
      onAction={onAction}
      containerStyle={containerStyle}
    />
  );
}

function LiveBadge() {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 0.75,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );

    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <View style={styles.liveBadge}>
      <Animated.View
        style={[styles.liveDot, { transform: [{ scale: pulse }] }]}
      />
      <Text style={styles.liveBadgeText}>LIVE</Text>
    </View>
  );
}

function AudioMiniPlayer({
  isPlaying,
  isLoading,
  title,
  enabled,
  onToggle,
}: {
  isPlaying: boolean;
  isLoading: boolean;
  title?: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  if (!enabled) {
    return null;
  }

  return (
    <View style={styles.audioBar}>
      <View style={styles.audioBarLeft}>
        <Text style={styles.audioBarTitle}>{title || 'Live Audio'}</Text>
        <Text style={styles.audioBarSub}>
          {isLoading
            ? 'Loading stream...'
            : isPlaying
              ? 'Now Playing'
              : 'Tap to Listen Live'}
        </Text>
      </View>

      <Pressable style={styles.audioBarButton} onPress={onToggle}>
        <Ionicons
          name={isPlaying ? 'pause' : 'play'}
          size={18}
          color={BRAND.white}
        />
        <Text style={styles.audioBarButtonText}>
          {isLoading ? '...' : isPlaying ? 'Pause' : 'Play'}
        </Text>
      </Pressable>
    </View>
  );
}

function LaunchSplash({
  splashBackgroundUrl,
  splashLogoUrl,
  schoolDisplayName,
}: {
  splashBackgroundUrl?: string;
  splashLogoUrl?: string;
  schoolDisplayName?: string;
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.96)).current;
  const logoSlide = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.timing(logoSlide, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim, logoSlide]);

  return (
    <Animated.View
      style={[
        styles.flashContainer,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <StatusBar barStyle="light-content" backgroundColor="#1F3B7A" />

      {hasResolvedUrl(splashBackgroundUrl) ? (
        <ImageBackground
          source={{ uri: splashBackgroundUrl }}
          style={styles.flashBackgroundImage}
          imageStyle={styles.flashBackgroundImageInner}
          resizeMode="cover"
        >
          <View style={styles.flashOverlay} />

          <View style={styles.flashTopStripeWrap}>
            <View style={styles.flashTopStripeBlack} />
            <View style={styles.flashTopStripeRed} />
            <View style={styles.flashTopStripeBlack} />
          </View>

          <View style={styles.flashCenterArea}>
            {hasResolvedUrl(splashLogoUrl) ? <View style={styles.flashShadowLong} /> : null}
            <Animated.View
              style={{
                transform: [{ translateY: logoSlide }],
              }}
            >
              {hasResolvedUrl(splashLogoUrl) ? (
                <View style={styles.flashLogoPlate}>
                  <Image
                    source={{ uri: splashLogoUrl }}
                    style={styles.flashMainLogo}
                    resizeMode="contain"
                  />
                </View>
              ) : null}
            </Animated.View>
          </View>

          <Animated.View
            style={[
              styles.flashBottomBranding,
              {
                opacity: fadeAnim,
                transform: [{ translateY: logoSlide }],
              },
            ]}
          >
            {schoolDisplayName ? (
              <Text style={styles.flashBottomSub}>{schoolDisplayName}</Text>
            ) : null}
          </Animated.View>
        </ImageBackground>
      ) : (
        <LinearGradient
          colors={[BRAND.black, BRAND.primaryDark, BRAND.surfaceAlt]}
          style={styles.flashBackgroundImage}
        >
          <View style={styles.flashOverlay} />

          <View style={styles.flashTopStripeWrap}>
            <View style={styles.flashTopStripeBlack} />
            <View style={styles.flashTopStripeRed} />
            <View style={styles.flashTopStripeBlack} />
          </View>

          <View style={styles.flashCenterArea}>
            <View style={styles.flashShadowLong} />
            <Animated.View
              style={{
                transform: [{ translateY: logoSlide }],
              }}
            >
              {hasResolvedUrl(splashLogoUrl) ? (
                <View style={styles.flashLogoPlate}>
                  <Image
                    source={{ uri: splashLogoUrl }}
                    style={styles.flashMainLogo}
                    resizeMode="contain"
                  />
                </View>
              ) : null}
            </Animated.View>
          </View>

          <Animated.View
            style={[
              styles.flashBottomBranding,
              {
                opacity: fadeAnim,
                transform: [{ translateY: logoSlide }],
              },
            ]}
          >
            {schoolDisplayName ? (
              <Text style={styles.flashBottomSub}>{schoolDisplayName}</Text>
            ) : null}
          </Animated.View>
        </LinearGradient>
      )}
    </Animated.View>
  );
}

function NewsCard({
  item,
  onPress,
  featured = false,
  theme = DEFAULT_APP_THEME,
}: {
  item: NewsItem;
  onPress: () => void;
  featured?: boolean;
  theme?: AthleticOSResolvedTheme;
}) {
  const sportLabel = item.sportLabel?.trim() || 'Athletics';

  if (featured) {
    return (
      <Pressable style={styles.featuredStoryCard} onPress={onPress}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.featuredStoryImage} />
        ) : (
          <LinearGradient
            colors={[BRAND.primaryDark, BRAND.black]}
            style={styles.featuredStoryImage}
          />
        )}

        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.92)']}
          style={styles.featuredStoryOverlay}
        />

        <View style={styles.featuredStoryContent}>
          <View style={[styles.featuredPill, { backgroundColor: theme.colors.pillBackground }]}>
            <Text style={[styles.featuredPillText, { color: theme.colors.pillText }]}>
              {sportLabel}
            </Text>
          </View>
          <Text style={styles.featuredStoryTitle} numberOfLines={3}>
            {item.title}
          </Text>
          <Text style={styles.featuredStoryMeta}>
            {item.date || 'Latest News'}
          </Text>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable style={styles.newsCard} onPress={onPress}>
      {item.image ? (
        <Image
          source={{ uri: item.image }}
          style={styles.newsThumbWide}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.newsThumbFallbackWide}>
          <Ionicons name="newspaper-outline" size={22} color={BRAND.white} />
        </View>
      )}

      <View style={styles.newsCardBody}>
        <View style={[styles.featuredPill, { backgroundColor: theme.colors.pillBackground }]}>
          <Text style={[styles.featuredPillText, { color: theme.colors.pillText }]}>
            {sportLabel}
          </Text>
        </View>
        <Text style={styles.newsCardTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.newsCardMeta}>{item.date || 'Latest'}</Text>
      </View>

      <Ionicons
        name="chevron-forward"
        size={20}
        color={BRAND.gray}
        style={styles.newsChevron}
      />
    </Pressable>
  );
}

function StoryDetailScreen({
  item,
  onBack,
  theme = DEFAULT_APP_THEME,
}: {
  item: NewsItem;
  onBack: () => void;
  theme?: AthleticOSResolvedTheme;
}) {
  const summary = item.summary?.trim() || item.description?.trim() || '';
  const body = item.body?.trim() || '';
  const articleText = body || summary;
  const sportName = item.sportLabel?.trim() || 'Athletics';

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.screenContent}>
      <LinearGradient
        colors={getThemeDarkHeroGradient(theme)}
        style={styles.storyDetailHero}
      >
        <Pressable style={styles.storyDetailBackButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={20} color={BRAND.white} />
          <Text style={styles.backButtonText}>Back</Text>
        </Pressable>

        <View style={styles.storyDetailHeroContent}>
          {sportName ? <Text style={styles.storyDetailKicker}>{sportName}</Text> : null}
          {item.date ? <Text style={styles.storyDetailDate}>{item.date}</Text> : null}
          <Text style={styles.storyDetailTitle}>{item.title}</Text>
        </View>
      </LinearGradient>

      {item.image ? (
        <Image
          source={{ uri: item.image }}
          style={styles.storyDetailImage}
          resizeMode="cover"
        />
      ) : null}

      {articleText ? (
        <View style={styles.storyDetailArticlePanel}>
          <Text style={styles.storyDetailBody}>{articleText}</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

function StoryCarouselCard({
  item,
  onPress,
  theme = DEFAULT_APP_THEME,
}: {
  item: NewsItem;
  onPress: () => void;
  theme?: AthleticOSResolvedTheme;
}) {
  const sportLabel = item.sportLabel?.trim() || 'Athletics';

  return (
    <Pressable style={styles.storyCarouselCard} onPress={onPress}>
      {item.image ? (
        <Image source={{ uri: item.image }} style={styles.storyCarouselImage} />
      ) : (
        <LinearGradient
          colors={[BRAND.primaryDark, BRAND.black]}
          style={styles.storyCarouselImage}
        />
      )}

      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.92)']}
        style={styles.storyCarouselOverlay}
      />

      <View style={styles.storyCarouselContent}>
        <View style={styles.storyCarouselMetaRow}>
          <View style={[styles.featuredPill, { backgroundColor: theme.colors.pillBackground }]}>
            <Text style={[styles.featuredPillText, { color: theme.colors.pillText }]}>
              {sportLabel}
            </Text>
          </View>
          <Text style={styles.storyCarouselMeta}>{item.date || 'Latest News'}</Text>
        </View>

        <Text style={styles.storyCarouselTitle} numberOfLines={3}>
          {item.title}
        </Text>
      </View>
    </Pressable>
  );
}

function VideoCarouselCard({
  item,
  onPress,
}: {
  item: VideoItem;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.videoCarouselCard} onPress={onPress}>
      {item.image ? (
        <Image source={{ uri: item.image }} style={styles.videoCarouselImage} />
      ) : (
        <LinearGradient
          colors={[BRAND.primaryDark, BRAND.black]}
          style={styles.videoCarouselImage}
        />
      )}

      <LinearGradient
        colors={['rgba(0,0,0,0.08)', 'rgba(0,0,0,0.88)']}
        style={styles.videoCarouselOverlay}
      />

      <View style={styles.videoPlayBadge}>
        <Ionicons name="play" size={18} color={BRAND.white} />
      </View>

      <View style={styles.videoCarouselContent}>
        <Text style={styles.videoCarouselMeta}>{item.date || 'Latest Video'}</Text>
        <Text style={styles.videoCarouselTitle} numberOfLines={3}>
          {item.title}
        </Text>
      </View>
    </Pressable>
  );
}

function GalleryCarouselCard({
  item,
  onPress,
}: {
  item: GalleryItem;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.galleryCarouselCard} onPress={onPress}>
      {item.image ? (
        <Image source={{ uri: item.image }} style={styles.galleryCarouselImage} />
      ) : (
        <LinearGradient
          colors={[BRAND.primaryDark, BRAND.black]}
          style={styles.galleryCarouselImage}
        />
      )}

      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.9)']}
        style={styles.galleryCarouselOverlay}
      />

      <View style={styles.galleryCarouselContent}>
        <View style={styles.storyCarouselMetaRow}>
          <Text style={styles.galleryCarouselMeta}>{item.sport || 'Gallery'}</Text>
          <Text style={styles.galleryCarouselMeta}>{item.date || 'Latest'}</Text>
        </View>
        <Text style={styles.galleryCarouselTitle} numberOfLines={3}>
          {item.title}
        </Text>
      </View>
    </Pressable>
  );
}

function PromotionCard({
  promotion,
  onPress,
}: {
  promotion: AthleticOSPromotionCard;
  onPress?: () => void;
}) {
  const cardBody = (
    <>
      {promotion.image_url ? (
        <Image
          source={{ uri: promotion.image_url }}
          style={styles.promotionCardImage}
          resizeMode="cover"
        />
      ) : (
        <LinearGradient
          colors={[BRAND.primaryDark, BRAND.surface]}
          style={styles.promotionCardImage}
        />
      )}

      <LinearGradient
        colors={promotion.image_url ? ['transparent', 'rgba(0,0,0,0.92)'] : ['rgba(0,0,0,0)', 'rgba(0,0,0,0)']}
        style={styles.promotionCardOverlay}
      />

      <View style={styles.promotionCardContent}>
        <View style={styles.promotionPill}>
          <Text style={styles.promotionPillText}>Featured</Text>
        </View>
        <Text style={styles.promotionCardTitle} numberOfLines={3}>
          {promotion.title?.trim() || 'Promotion'}
        </Text>
        {promotion.subtitle?.trim() ? (
          <Text style={styles.promotionCardSubtitle} numberOfLines={3}>
            {promotion.subtitle.trim()}
          </Text>
        ) : null}
        {promotion.cta_text?.trim() ? (
          <View style={styles.promotionCardButton}>
            <Text style={styles.promotionCardButtonText}>
              {promotion.cta_text.trim()}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={BRAND.white} />
          </View>
        ) : null}
      </View>
    </>
  );

  if (onPress) {
    return (
      <Pressable style={styles.promotionCard} onPress={onPress}>
        {cardBody}
      </Pressable>
    );
  }

  return <View style={styles.promotionCard}>{cardBody}</View>;
}

function AppPrerollScreen({
  config,
  onComplete,
}: {
  config: AthleticOSAppPrerollConfig;
  onComplete: () => void;
}) {
  const [canSkip, setCanSkip] = useState(false);

  useEffect(() => {
    setCanSkip(false);

    const timer = setTimeout(() => {
      setCanSkip(true);
    }, Math.max(config.skip_after_seconds, 1) * 1000);

    return () => clearTimeout(timer);
  }, [config.skip_after_seconds]);

  const handlePress = () => {
    if (!config.click_url) {
      return;
    }

    Linking.openURL(config.click_url).catch((error) => {
      console.log('Preroll click-through error:', error);
      onComplete();
    });
  };

  const handlePlaybackStatus = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) {
      if (status.error) {
        console.log('Preroll playback error:', status.error);
        onComplete();
      }

      return;
    }

    if (status.didJustFinish) {
      onComplete();
    }
  };

  const content = (
    <>
      <Video
        source={{ uri: config.video_url }}
        style={styles.prerollVideo}
        resizeMode="cover"
        shouldPlay
        isLooping={false}
        onPlaybackStatusUpdate={handlePlaybackStatus}
        onError={(error) => {
          console.log('Preroll video load error:', error);
          onComplete();
        }}
      />

      <LinearGradient
        colors={['rgba(0,0,0,0.16)', 'rgba(0,0,0,0.76)']}
        style={styles.prerollOverlay}
      />

      <SafeAreaView style={styles.prerollSafeArea}>
        <View style={styles.prerollTopRow}>
          <View style={styles.prerollSponsorWrap}>
            {config.sponsor_name ? (
              <Text style={styles.prerollSponsorEyebrow}>Presented by</Text>
            ) : null}
            {config.sponsor_logo_url ? (
              <Image
                source={{ uri: config.sponsor_logo_url }}
                style={styles.prerollSponsorLogo}
                resizeMode="contain"
              />
            ) : config.sponsor_name ? (
              <Text style={styles.prerollSponsorName}>{config.sponsor_name}</Text>
            ) : null}
          </View>

          {canSkip ? (
            <Pressable style={styles.prerollSkipButton} onPress={onComplete}>
              <Text style={styles.prerollSkipButtonText}>Skip</Text>
            </Pressable>
          ) : null}
        </View>

        {config.click_url ? (
          <Pressable style={styles.prerollTapHint} onPress={handlePress}>
            <Text style={styles.prerollTapHintText}>Learn More</Text>
            <Ionicons name="chevron-forward" size={16} color={BRAND.white} />
          </Pressable>
        ) : null}
      </SafeAreaView>
    </>
  );

  return <View style={styles.prerollScreen}>{content}</View>;
}

function AthleteOfWeekCard({
  item,
  onPress,
}: {
  item: AthleticOSAthleteOfTheWeek;
  onPress?: () => void;
}) {
  const imageUrl = item.featuredImageUrl || item.headshotUrl || null;
  const title = item.sportName || item.awardWeekLabel || 'Athlete of the Week';
  const subtitle = item.summary || item.opponent || null;
  const statsLine = item.stats?.trim() || null;

  const cardBody = (
    <>
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={styles.athleteOfWeekImage}
          resizeMode="cover"
        />
      ) : (
        <LinearGradient
          colors={[BRAND.primaryDark, BRAND.surface]}
          style={styles.athleteOfWeekImage}
        />
      )}

      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.92)']}
        style={styles.athleteOfWeekOverlay}
      />

      <View style={styles.athleteOfWeekContent}>
        <View style={styles.athleteOfWeekTopRow}>
          <View style={styles.promotionPill}>
            <Text style={styles.promotionPillText}>Athlete of the Week</Text>
          </View>
        </View>

        {item.athleteName ? (
          <Text style={styles.athleteOfWeekName} numberOfLines={1}>
            {item.athleteName}
          </Text>
        ) : null}

        <Text style={styles.athleteOfWeekTitle} numberOfLines={3}>
          {title}
        </Text>

        {subtitle ? (
          <Text style={styles.athleteOfWeekSubtitle} numberOfLines={3}>
            {subtitle}
          </Text>
        ) : null}

        {statsLine ? (
          <Text style={styles.athleteOfWeekStats} numberOfLines={2}>
            {statsLine}
          </Text>
        ) : null}

      </View>
    </>
  );

  if (onPress) {
    return (
      <Pressable style={styles.athleteOfWeekCard} onPress={onPress}>
        {cardBody}
      </Pressable>
    );
  }

  return <View style={styles.athleteOfWeekCard}>{cardBody}</View>;
}

function AthleteOfWeekDetailScreen({
  item,
  onBack,
}: {
  item: AthleticOSAthleteOfTheWeek;
  onBack: () => void;
}) {
  const imageUrl = item.featuredImageUrl || item.headshotUrl || null;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.screenContent}>
      <LinearGradient colors={[BRAND.black, BRAND.primaryDark]} style={styles.sportHeader}>
        <Pressable style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={20} color={BRAND.white} />
          <Text style={styles.backButtonText}>Back</Text>
        </Pressable>
        <Text style={styles.sportHeaderTitle}>Athlete of the Week</Text>
        {item.awardWeekLabel ? (
          <Text style={styles.sportHeaderSub}>{item.awardWeekLabel}</Text>
        ) : null}
      </LinearGradient>

      <View style={styles.aotwDetailWrap}>
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.aotwDetailImage}
            resizeMode="cover"
          />
        ) : null}

        <View style={styles.aotwDetailCard}>
          <Text style={styles.aotwDetailName}>{item.athleteName}</Text>

          {item.sportName ? (
            <Text style={styles.aotwDetailMeta}>{item.sportName}</Text>
          ) : null}

          {item.classYear ? (
            <Text style={styles.aotwDetailMeta}>Class Year: {item.classYear}</Text>
          ) : null}

          {item.position ? (
            <Text style={styles.aotwDetailMeta}>Position: {item.position}</Text>
          ) : null}

          {item.awardWeekLabel ? (
            <Text style={styles.aotwDetailMeta}>Week: {item.awardWeekLabel}</Text>
          ) : null}

          {item.awardDate ? (
            <Text style={styles.aotwDetailMeta}>
              Award Date: {formatDate(item.awardDate)}
            </Text>
          ) : null}

          {item.opponent ? (
            <Text style={styles.aotwDetailMeta}>Opponent: {item.opponent}</Text>
          ) : null}

          {item.summary ? (
            <View style={styles.aotwDetailSection}>
              <Text style={styles.aotwDetailSectionTitle}>Summary</Text>
              <Text style={styles.aotwDetailBody}>{item.summary}</Text>
            </View>
          ) : null}

          {item.stats ? (
            <View style={styles.aotwDetailSection}>
              <Text style={styles.aotwDetailSectionTitle}>Stats</Text>
              <Text style={styles.aotwDetailBody}>{item.stats}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </ScrollView>
  );
}

function EventCard({
  item,
  onPress,
  showTime = true,
  theme = DEFAULT_APP_THEME,
}: {
  item: EventItem;
  onPress: () => void;
  showTime?: boolean;
  theme?: AthleticOSResolvedTheme;
}) {
  const normalized = normalizeScheduleItem(item);

  const resultLabel =
    normalized.result === 'W' || normalized.result === 'L'
      ? normalized.result
      : null;
  const matchupLabel =
    normalized.homeAway && normalized.opponent
      ? `${normalized.homeAway} ${normalized.opponent}`
      : normalized.opponent;

  return (
    <Pressable
      style={[styles.eventCard, normalized.hasScore ? styles.resultEventCard : null]}
      onPress={onPress}
    >
      {!normalized.hasScore ? (
        <>
          <View style={styles.eventTopRow}>
            <Text style={[styles.eventSportLine, { color: theme.colors.pillBackground }]}>
              {normalized.sport}
            </Text>
            {normalized.homeAway ? (
              <Text style={styles.eventVsLine}>{normalized.homeAway}</Text>
            ) : null}
          </View>

          <View style={styles.eventMainRow}>
            <View style={styles.eventTextWrap}>
              <Text style={styles.eventOpponentLine} numberOfLines={2}>
                {normalized.opponent}
              </Text>

              <Text style={styles.eventMeta}>{normalized.displayDate}</Text>
              {showTime && normalized.timeLabel ? (
                <Text style={styles.eventMetaSecondary}>{normalized.timeLabel}</Text>
              ) : null}
              {normalized.locationLabel ? (
                <Text style={styles.eventMetaSecondary} numberOfLines={1}>
                  {normalized.locationLabel}
                </Text>
              ) : null}
            </View>

            {normalized.opponentLogoUrl ? (
              <View style={styles.eventLogoPlate}>
                <Image
                  source={{ uri: normalized.opponentLogoUrl }}
                  style={styles.eventLogo}
                  resizeMode="contain"
                />
              </View>
            ) : null}
          </View>
        </>
      ) : (
        <>
          <View style={styles.resultHeaderRow}>
            <Text style={[styles.eventSportLine, { color: theme.colors.pillBackground }]}>
              {normalized.sport}
            </Text>

            {resultLabel ? (
              <View style={styles.resultBadgeTopRight}>
                <Text style={styles.resultBadgeText}>{resultLabel}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.resultMainRow}>
            <View style={styles.resultTeamRowLeft}>
              {normalized.opponentLogoUrl ? (
                <View style={styles.resultLogoPlate}>
                  <Image
                    source={{ uri: normalized.opponentLogoUrl }}
                    style={styles.resultLogo}
                    resizeMode="contain"
                  />
                </View>
              ) : null}
              <Text style={styles.resultOpponentName} numberOfLines={2}>
                {matchupLabel}
              </Text>
            </View>
            <Text style={styles.resultScore}>
              {normalized.teamScore} - {normalized.opponentScore}
            </Text>
          </View>

          <Text style={styles.eventMeta}>{normalized.displayDate}</Text>
        </>
      )}
    </Pressable>
  );
}

function PulseDot() {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scale, {
            toValue: 1.35,
            duration: 700,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1,
            duration: 700,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 0.45,
            duration: 700,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: 700,
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    loop.start();

    return () => {
      loop.stop();
    };
  }, [opacity, scale]);

  return (
    <Animated.View
      style={[
        styles.pulseDot,
        {
          opacity,
          transform: [{ scale }],
        },
      ]}
    />
  );
}

function TeamTile({
  sport,
  onPress,
}: {
  sport: SportType;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.teamTile} onPress={onPress}>
      <LinearGradient
        colors={[BRAND.surfaceAlt, BRAND.surface]}
        style={styles.teamTileInner}
      >
        <Text style={styles.teamTileTitle}>
          {sport.shortLabel || sport.label}
        </Text>
        <Text style={styles.teamTileSub}>News, roster, schedule</Text>
        <View style={styles.teamTileArrowWrap}>
          <Ionicons name="chevron-forward" size={18} color={BRAND.red} />
        </View>
      </LinearGradient>
    </Pressable>
  );
}

function HomeScreen({
  onOpenEmbedded,
  onOpenStoryDetail,
  onOpenExternal,
  onOpenSchedule,
  onOpenSport,
  onToggleAudio,
  onGoToMedia,
  newsItems,
  newsLoading,
  recentEvents,
  upcomingEvents,
  eventsLoading,
  onRefresh,
  refreshing,
  showNotificationPrompt,
  notificationsEnabled,
  onEnableNotifications,
  onDismissNotificationPrompt,
  liveStatus,
  schoolConfig,
  appDisplayName,
  homeModules,
  liveCoverageConfig,
  promotionCard,
  athleteOfWeek,
  sponsorPlacements,
  videoItems,
  galleryItems,
  homeSports,
  scheduleAvailable,
  theme = DEFAULT_APP_THEME,
}: {
  onOpenEmbedded: (title: string, url: string) => void;
  onOpenStoryDetail: (item: NewsItem) => void;
  onOpenExternal: (url: string) => void;
  onOpenSchedule: () => void;
  onOpenSport: (sport: SportType) => void;
  onToggleAudio: () => void;
  onGoToMedia: () => void;
  newsItems: NewsItem[];
  newsLoading: boolean;
  recentEvents: EventItem[];
  upcomingEvents: EventItem[];
  eventsLoading: boolean;
  onRefresh: () => void;
  refreshing: boolean;
  showNotificationPrompt: boolean;
  notificationsEnabled: boolean;
  onEnableNotifications: () => void;
  onDismissNotificationPrompt: () => void;
  liveStatus: {
    audio: boolean;
    video: boolean;
  };
  schoolConfig: {
    displayName: string;
    logoUrl: string;
    splashLogoUrl?: string;
    appShortName?: string;
    mascotName?: string;
    heroTitleOverride?: string;
    heroSubtitleOverride?: string;
    mainSiteUrl: string;
    scheduleUrl: string;
    watchUrl: string;
    listenUrl: string;
  };
  appDisplayName: string;
  homeModules: AthleticOSAppHomeModule[];
  liveCoverageConfig: AthleticOSAppLiveCoverageConfig | null;
  promotionCard: AthleticOSPromotionCard | null;
  athleteOfWeek: AthleticOSAthleteOfTheWeek | null;
  sponsorPlacements: AthleticOSAppSponsorPlacement[];
  videoItems: VideoItem[];
  galleryItems: GalleryItem[];
  homeSports: SportType[];
  scheduleAvailable: boolean;
  theme?: AthleticOSResolvedTheme;
}) {
  const hasWatchUrl = hasResolvedUrl(schoolConfig.watchUrl);
  const hasListenUrl = hasResolvedUrl(schoolConfig.listenUrl);
  const hasScheduleUrl = scheduleAvailable;
  const hasMainSiteUrl = hasResolvedUrl(schoolConfig.mainSiteUrl);
  const hasSchoolLogo = hasResolvedUrl(schoolConfig.logoUrl);
  const visibleRecentEvents = recentEvents;
  const visibleUpcomingEvents = upcomingEvents;

  const storyCarouselItems = newsItems.slice(0, 8);
  const videoCarouselItems = videoItems.slice(0, 10);
  const galleryCarouselItems = galleryItems.slice(0, 10);

  const isAudioLive = liveStatus.audio;
  const isVideoLive = liveStatus.video;
  const isAnythingLive = isAudioLive || isVideoLive;

  const sponsorCarouselRef = useRef<ScrollView | null>(null);
  const resolvedModules = useMemo(() => getResolvedHomeModules(homeModules), [homeModules]);
  const hasPresentingSponsorModule = useMemo(
    () =>
      resolvedModules.some(
        (module) => normalizeModuleKey(module.module_key) === 'presenting_sponsor'
      ),
    [resolvedModules]
  );
  const enabledSponsorPlacements = useMemo(
    () =>
      sponsorPlacements.filter((placement) => isRenderableSponsorPlacement(placement)),
    [sponsorPlacements]
  );
  const heroSponsorPlacement = useMemo(() => {
    const placements = dedupeSponsorPlacements(
      enabledSponsorPlacements.filter((placement) => {
        const key = normalizePlacementKey(placement.placement_key);
        return key === 'hero' || key === 'hero_sponsor';
      })
    );

    return placements[0] ?? null;
  }, [enabledSponsorPlacements]);
  const presentingSponsorPlacement = useMemo(() => {
    const placements = dedupeSponsorPlacements(
      enabledSponsorPlacements.filter((placement) => {
        const key = normalizePlacementKey(placement.placement_key);
        return key === 'presenting_sponsor';
      })
    );

    return placements[0] ?? null;
  }, [enabledSponsorPlacements]);
  const standardSponsorPlacements = useMemo(
    () =>
      dedupeSponsorPlacements(
        enabledSponsorPlacements.filter((placement) => {
          const key = normalizePlacementKey(placement.placement_key);
          return key.startsWith('banner_') || key === 'sponsors';
        })
      ),
    [enabledSponsorPlacements]
  );
  const sponsorPlacement = useMemo(
    () => standardSponsorPlacements[0] ?? null,
    [standardSponsorPlacements]
  );
  const sponsorCardTitle = sponsorPlacement?.sponsor_name?.trim() || 'Sponsor';
  const sponsorCardLink = sponsorPlacement?.sponsor_link_url?.trim() || '';
  const hasSponsorCardLink = hasResolvedUrl(sponsorCardLink);
  const heroSponsorName = heroSponsorPlacement?.sponsor_name?.trim() || '';
  const heroSponsorLogo = heroSponsorPlacement?.sponsor_logo_url?.trim() || '';
  const heroSponsorLink = heroSponsorPlacement?.sponsor_link_url?.trim() || '';
  const hasHeroSponsorLogo = hasResolvedUrl(heroSponsorLogo);
  const hasHeroSponsorLink = hasResolvedUrl(heroSponsorLink);
  const presentingSponsorCardPlacement = presentingSponsorPlacement;
  const showHeroSponsor = Boolean(heroSponsorName) || hasHeroSponsorLogo;
  const sponsorCarouselPlacements = useMemo(
    () =>
      dedupeSponsorPlacements(
        enabledSponsorPlacements.filter((placement) =>
          normalizePlacementKey(placement.placement_key).startsWith('carousel_')
        )
      ),
    [enabledSponsorPlacements]
  );
  const firstUpcomingEvent = visibleUpcomingEvents[0];
  const hasPromotionCtaUrl = hasResolvedUrl(promotionCard?.cta_url);
  const heroActionCount = [
    hasWatchUrl,
    hasListenUrl,
    hasScheduleUrl,
    hasMainSiteUrl,
  ].filter(Boolean).length;
  const heroBrandTitle = getHeroBrandTitle(schoolConfig);
  const heroBrandSubtitle = getHeroBrandSubtitle(schoolConfig);
  const hasLiveCoverageModule = useMemo(
    () =>
      resolvedModules.some(
        (module) => normalizeModuleKey(module.module_key) === 'live_coverage'
      ),
    [resolvedModules]
  );

  useEffect(() => {
    if (sponsorCarouselPlacements.length < 2) {
      return;
    }

    let currentIndex = 0;

    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % sponsorCarouselPlacements.length;
      sponsorCarouselRef.current?.scrollTo({
        x: currentIndex * (SPONSOR_CAROUSEL_CARD_WIDTH + SPONSOR_CAROUSEL_CARD_GAP),
        animated: true,
      });
    }, 4500);

    return () => clearInterval(interval);
  }, [sponsorCarouselPlacements.length]);

  useEffect(() => {
    console.log('[AthleticOS] sponsor placement counts:', {
      all: sponsorPlacements.length,
      renderable: enabledSponsorPlacements.length,
      presenting: heroSponsorPlacement ? 1 : 0,
      sponsors: standardSponsorPlacements.length,
      carousel: sponsorCarouselPlacements.length,
    });
  }, [
    enabledSponsorPlacements.length,
    heroSponsorPlacement,
    sponsorCarouselPlacements.length,
    sponsorPlacements.length,
    standardSponsorPlacements.length,
  ]);

  let heroEyebrow = 'Live Coverage';
  let heroTitle = 'Live Coverage';
  let heroText =
    'Open live video, audio, schedules, and the latest school coverage.';
  let heroCta = 'Open Coverage';

  if (isAudioLive && isVideoLive) {
    heroEyebrow = 'Live Now';
    heroTitle = 'Live Audio + Video';
    heroText = 'Open the live coverage hub for video and audio coverage.';
    heroCta = 'Open Live Coverage';
  } else if (isVideoLive) {
    heroEyebrow = 'Live Now';
    heroTitle = 'Live Video';
    heroText = 'Open the live coverage hub to watch video now.';
    heroCta = 'Watch Live';
  } else if (isAudioLive) {
    heroEyebrow = 'Live Now';
    heroTitle = 'Live Audio';
    heroText = 'Open the live coverage hub to listen now.';
    heroCta = 'Listen Live';
  }

  const handleOpenLiveCoverage = () => {
    const destinationType = normalizeModuleKey(liveCoverageConfig?.destination_type);
    const destinationValue = liveCoverageConfig?.destination_value?.trim() || '';

    if (destinationType === 'custom_url' && hasResolvedUrl(destinationValue)) {
      onOpenEmbedded(
        liveCoverageConfig?.headline?.trim() || heroTitle,
        destinationValue
      );
      return;
    }

    if (destinationType === 'watch_tab') {
      onGoToMedia();
      return;
    }

    if (destinationType === 'broadcast_page' || !destinationType) {
      onGoToMedia();
      return;
    }

    onGoToMedia();
  };

  const renderLiveCoverageModule = () => {
    if (!hasLiveCoverageModule || !liveCoverageConfig?.is_enabled) {
      return null;
    }

    const eyebrow = liveCoverageConfig.eyebrow?.trim() || heroEyebrow;
    const title = liveCoverageConfig.headline?.trim() || heroTitle;
    const bodyCopy = liveCoverageConfig.body_copy?.trim() || '';
    const ctaLabel = liveCoverageConfig.cta_label?.trim() || heroCta;
    const showStatusPill = liveCoverageConfig.show_status_pill !== false;

    return (
      <Pressable
        key="live_coverage"
        style={({ pressed }) => [
          styles.liveNowCard,
          isAnythingLive ? styles.liveNowCardLive : null,
          pressed ? { opacity: 0.88, transform: [{ scale: 0.985 }] } : null,
        ]}
        onPress={handleOpenLiveCoverage}
      >
        <View style={styles.liveNowLeft}>
          <Text style={styles.liveNowEyebrow}>{eyebrow}</Text>
          <Text style={styles.liveNowTitle}>{title}</Text>
          {bodyCopy ? <Text style={styles.liveNowText}>{bodyCopy}</Text> : null}

          <View style={styles.liveNowCTA}>
            <Text style={styles.liveNowCTAText}>{ctaLabel}</Text>
            <Ionicons name="chevron-forward" size={16} color={BRAND.white} />
          </View>
        </View>

        {showStatusPill ? (
          <View style={styles.liveNowRight}>
            <View
              style={[
                styles.heroStatusPill,
                isAnythingLive ? styles.heroStatusPillLive : styles.heroStatusPillOff,
              ]}
            >
              {isAnythingLive ? <PulseDot /> : null}

              <Ionicons
                name={
                  isVideoLive
                    ? 'videocam'
                    : isAudioLive
                    ? 'headset'
                    : 'radio-outline'
                }
                size={16}
                color={BRAND.white}
                style={styles.heroStatusIcon}
              />

              <Text style={styles.heroStatusText}>
                {isVideoLive && isAudioLive
                  ? 'Live Audio + Video'
                  : isVideoLive
                  ? 'Live Video'
                  : isAudioLive
                  ? 'Live Audio'
                  : 'Not Currently Live'}
              </Text>
            </View>
          </View>
        ) : null}
      </Pressable>
    );
  };

  const renderStoriesModule = (title: string) => (
    <React.Fragment key="stories">
      <OptionalSectionHeader
        title={title}
        actionLabel={hasMainSiteUrl ? 'Website' : undefined}
        onAction={
          hasMainSiteUrl
            ? () => onOpenEmbedded('Website', schoolConfig.mainSiteUrl)
            : undefined
        }
      />
      {newsLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={BRAND.primary} />
        </View>
      ) : storyCarouselItems.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No news stories found.</Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToAlignment="start"
          decelerationRate="fast"
          contentContainerStyle={styles.storyCarouselRow}
        >
          {storyCarouselItems.map((item, index) => (
            <StoryCarouselCard
              key={`${item.link}-${item.title}-${index}`}
              item={item}
              theme={theme}
              onPress={() => onOpenStoryDetail(item)}
            />
          ))}
        </ScrollView>
      )}
    </React.Fragment>
  );

  const renderVideosModule = (title: string) => {
    if (videoCarouselItems.length === 0) {
      return null;
    }

    return (
      <React.Fragment key="videos">
        <OptionalSectionHeader title={title} />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToAlignment="start"
          decelerationRate="fast"
          contentContainerStyle={styles.videoCarouselRow}
        >
          {videoCarouselItems.map((item, index) => (
            <VideoCarouselCard
              key={`${item.id}-${index}`}
              item={item}
              onPress={() => {
                Linking.openURL(item.link).catch((error) => {
                  console.log('Video open error:', error);
                });
              }}
            />
          ))}
        </ScrollView>
      </React.Fragment>
    );
  };

  const renderGalleriesModule = (title: string) => {
    if (galleryCarouselItems.length === 0) {
      return null;
    }

    return (
      <React.Fragment key="galleries">
        <OptionalSectionHeader title={title} />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToAlignment="start"
          decelerationRate="fast"
          contentContainerStyle={styles.galleryCarouselRow}
        >
          {galleryCarouselItems.map((item, index) => (
            <GalleryCarouselCard
              key={`${item.id}-${index}`}
              item={item}
              onPress={() => onOpenEmbedded(item.title, item.link)}
            />
          ))}
        </ScrollView>
      </React.Fragment>
    );
  };

  const renderRecentResultsModule = (title: string) => (
    <React.Fragment key="recent_results">
      <OptionalSectionHeader title={title} />
      {eventsLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={BRAND.primary} />
        </View>
      ) : visibleRecentEvents.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No recent finals from the last 7 days.</Text>
          <Text style={styles.emptyText}>Pull down to refresh and check again.</Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.eventsRow}
        >
          {visibleRecentEvents.map((item) => (
            <EventCard
              key={item.id}
              item={item}
              showTime={false}
              theme={theme}
              onPress={() => onOpenSchedule()}
            />
          ))}
        </ScrollView>
      )}
    </React.Fragment>
  );

  const renderUpcomingGamesModule = (title: string) => (
    <React.Fragment key="upcoming_games">
      <OptionalSectionHeader
        title={title}
        actionLabel={hasScheduleUrl ? 'Schedule' : undefined}
        onAction={hasScheduleUrl ? onOpenSchedule : undefined}
      />
      {eventsLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={BRAND.primary} />
        </View>
      ) : visibleUpcomingEvents.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No upcoming events in the next 7 days.</Text>
          <Text style={styles.emptyText}>Pull down to refresh and check again.</Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.eventsRow}
        >
          {visibleUpcomingEvents.slice(0, 10).map((item) => (
            <EventCard
              key={item.id}
              item={item}
              theme={theme}
              onPress={() => onOpenSchedule()}
            />
          ))}
        </ScrollView>
      )}
    </React.Fragment>
  );

  const renderNextGameModule = (title: string) => (
    <React.Fragment key="next_game">
      <OptionalSectionHeader title={title} />
      {eventsLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={BRAND.primary} />
        </View>
      ) : firstUpcomingEvent ? (
        <View style={styles.newsList}>
          <EventCard
            item={firstUpcomingEvent}
            theme={theme}
            onPress={() => onOpenSchedule()}
          />
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No upcoming games scheduled.</Text>
        </View>
      )}
    </React.Fragment>
  );

  const renderAthleteOfWeekModule = (title: string) => (
    athleteOfWeek?.athleteName?.trim() ? (
      <React.Fragment key="athlete_of_week">
        <OptionalSectionHeader title={title} />
        <AthleteOfWeekCard item={athleteOfWeek} />
      </React.Fragment>
    ) : null
  );

  const renderSponsorsModule = (title: string) => {
    if (!sponsorPlacement) {
      return null;
    }

    const card = (
      <>
        <View style={styles.sponsorTextWrap}>
          <Text style={styles.sponsorEyebrow}>Presented by</Text>
          <Text style={styles.sponsorTitle}>{sponsorCardTitle}</Text>
          <Text style={styles.sponsorText}>
            Premium sponsor placement for the AthleticOS app experience.
          </Text>
        </View>

        {sponsorPlacement?.sponsor_logo_url ? (
          <Image
            source={{ uri: sponsorPlacement.sponsor_logo_url }}
            style={styles.sponsorLogo}
            resizeMode="contain"
          />
        ) : null}
      </>
    );

    return (
      <React.Fragment key="sponsors">
        <OptionalSectionHeader title={title} />
        {hasSponsorCardLink ? (
          <Pressable
            style={styles.sponsorCard}
            onPress={() => onOpenEmbedded(sponsorCardTitle, sponsorCardLink)}
          >
            {card}
          </Pressable>
        ) : (
          <View style={styles.sponsorCard}>{card}</View>
        )}
      </React.Fragment>
    );
  };

  const renderPresentingSponsorModule = (title: string) => {
    if (!hasPresentingSponsorModule || !presentingSponsorCardPlacement) {
      return null;
    }

    const presentingTitle = presentingSponsorCardPlacement.sponsor_name?.trim() || title;
    const presentingLink = presentingSponsorCardPlacement.sponsor_link_url?.trim() || '';
    const hasPresentingLink = hasResolvedUrl(presentingLink);

    const card = (
      <>
        <View style={styles.sponsorTextWrap}>
          <Text style={styles.sponsorEyebrow}>{title}</Text>
          <Text style={styles.sponsorTitle}>{presentingTitle}</Text>
          <Text style={styles.sponsorText}>
            Official presenting sponsor for the AthleticOS app experience.
          </Text>
        </View>

        {presentingSponsorCardPlacement.sponsor_logo_url ? (
          <Image
            source={{ uri: presentingSponsorCardPlacement.sponsor_logo_url }}
            style={styles.sponsorLogo}
            resizeMode="contain"
          />
        ) : null}
      </>
    );

    return (
      <React.Fragment key="presenting_sponsor">
        {hasPresentingLink ? (
          <Pressable
            style={styles.sponsorCard}
            onPress={() => onOpenEmbedded(presentingTitle, presentingLink)}
          >
            {card}
          </Pressable>
        ) : (
          <View style={styles.sponsorCard}>{card}</View>
        )}
      </React.Fragment>
    );
  };

  const renderSponsorCarouselModule = (title: string) => {
    if (sponsorCarouselPlacements.length === 0) {
      return null;
    }

    return (
      <React.Fragment key="sponsor_carousel">
        <OptionalSectionHeader
          title={title}
          containerStyle={styles.sectionHeaderTightTop}
        />
        <ScrollView
          ref={sponsorCarouselRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          contentContainerStyle={styles.sponsorCarouselRow}
          snapToInterval={SPONSOR_CAROUSEL_CARD_WIDTH + SPONSOR_CAROUSEL_CARD_GAP}
          snapToAlignment="start"
        >
          {sponsorCarouselPlacements.map((placement, index) => {
            const sponsorName = placement.sponsor_name?.trim() || '';
            const sponsorLink = placement.sponsor_link_url?.trim() || '';
            const hasSponsorLink = hasResolvedUrl(sponsorLink);
            const sponsorLogo = placement.sponsor_logo_url?.trim() || '';
            const hasSponsorLogo = hasResolvedUrl(sponsorLogo);

            if (!hasSponsorLogo && !sponsorName) {
              return null;
            }

            const card = (
              <View style={styles.sponsorCarouselCardContent}>
                {hasSponsorLogo ? (
                  <View style={styles.sponsorCarouselLogoWrap}>
                    <Image
                      source={{ uri: sponsorLogo }}
                      style={styles.sponsorCarouselLogo}
                      resizeMode="contain"
                    />
                  </View>
                ) : (
                  <Text style={styles.sponsorCarouselName} numberOfLines={2}>
                    {sponsorName}
                  </Text>
                )}
              </View>
            );

            return hasSponsorLink ? (
              <Pressable
                key={`${placement.id ?? placement.placement_key ?? sponsorName}-${index}`}
                style={styles.sponsorCarouselCard}
                onPress={() => onOpenEmbedded(sponsorName, sponsorLink)}
              >
                {card}
              </Pressable>
            ) : (
              <View
                key={`${placement.id ?? placement.placement_key ?? sponsorName}-${index}`}
                style={styles.sponsorCarouselCard}
              >
                {card}
              </View>
            );
          })}
        </ScrollView>
      </React.Fragment>
    );
  };

  const renderPromotionModule = (title: string) => {
    if (!promotionCard || promotionCard.is_active === false) {
      return null;
    }

    return (
      <React.Fragment key="promotion">
        <OptionalSectionHeader title={title} />
        <View style={styles.promotionModuleBottomSpacing}>
          <PromotionCard
            promotion={promotionCard}
            onPress={
              hasPromotionCtaUrl
                ? () =>
                    onOpenEmbedded(
                      promotionCard.cta_text?.trim() || promotionCard.title?.trim() || title,
                      promotionCard.cta_url as string
                    )
                : undefined
            }
          />
        </View>
      </React.Fragment>
    );
  };

  const renderHomeModule = (module: AthleticOSAppHomeModule) => {
    const title = module.label?.trim() || '';
    const moduleKey = normalizeModuleKey(module.module_key);

    switch (moduleKey) {
      case 'stories':
        return renderStoriesModule(title);
      case 'videos':
      case 'social_carousel':
        return renderVideosModule(title);
      case 'galleries':
        return renderGalleriesModule(title);
      case 'recent_results':
        return renderRecentResultsModule(title);
      case 'upcoming_games':
        return renderUpcomingGamesModule(title);
      case 'next_game':
        return renderNextGameModule(title);
      case 'live_coverage':
        return renderLiveCoverageModule();
      case 'athlete_of_week':
      case 'athlete_of_the_week':
        return renderAthleteOfWeekModule(title);
      case 'promotion':
        return renderPromotionModule(title);
      case 'presenting_sponsor':
        return renderPresentingSponsorModule(title);
      case 'sponsor_carousel':
        return renderSponsorCarouselModule(title);
      case 'sponsors':
        return renderSponsorsModule(title);
      default:
        return null;
    }
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.screenContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={theme.colors.primary}
        />
      }
    >
      <LinearGradient
        colors={getThemeHeroGradient(theme)}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.homeHeader}
      >
        <View style={styles.heroBackdropGlow} />
        <View style={styles.headerTopRow}>
          <View style={styles.headerLeft}>
            {hasSchoolLogo ? (
              <View style={styles.teamLogoBox}>
                <Image
                  source={{ uri: schoolConfig.logoUrl }}
                  style={styles.headerTeamLogo}
                  resizeMode="contain"
                />
              </View>
            ) : null}

            <View style={styles.headerTitleWrap}>
              <Text style={styles.appTitle} numberOfLines={1} adjustsFontSizeToFit>
                {heroBrandTitle}
              </Text>
              <Text style={styles.appSubtitle} numberOfLines={1}>
                {heroBrandSubtitle}
              </Text>
              {showHeroSponsor && heroSponsorName ? (
                <Text style={styles.heroSponsorInlineText} numberOfLines={1}>
                  Presented by {heroSponsorName}
                </Text>
              ) : null}
            </View>
          </View>

          {showHeroSponsor && hasHeroSponsorLogo ? (
            hasHeroSponsorLink ? (
              <Pressable
                style={styles.heroSponsorLogoWrap}
                onPress={() =>
                  onOpenEmbedded(heroSponsorName || 'Sponsor', heroSponsorLink)
                }
              >
                <Image
                  source={{ uri: heroSponsorLogo }}
                  style={styles.heroSponsorLogo}
                  resizeMode="contain"
                />
              </Pressable>
            ) : (
              <View style={styles.heroSponsorLogoWrap}>
                <Image
                  source={{ uri: heroSponsorLogo }}
                  style={styles.heroSponsorLogo}
                  resizeMode="contain"
                />
              </View>
            )
          ) : null}
        </View>

        <View
          style={[
            styles.heroButtonRow,
            heroActionCount >= 4 ? styles.heroButtonRowCompact : null,
          ]}
        >
          {hasWatchUrl ? (
            <TopIcon
              label="Watch"
              icon="videocam"
              onPress={() => onOpenExternal(schoolConfig.watchUrl)}
            />
          ) : null}
          {hasListenUrl ? (
            <TopIcon label="Listen" icon="headset" onPress={onToggleAudio} />
          ) : null}
          {hasScheduleUrl ? (
            <TopIcon
              label="Schedule"
              icon="calendar"
              onPress={onOpenSchedule}
            />
          ) : null}
          {hasMainSiteUrl ? (
            <TopIcon
              label="Website"
              icon="globe-outline"
              onPress={() => onOpenEmbedded('Website', schoolConfig.mainSiteUrl)}
            />
          ) : null}
        </View>
      </LinearGradient>

      {showNotificationPrompt && !notificationsEnabled && (
        <View style={styles.notificationSignupCard}>
          <View style={styles.notificationTextWrap}>
            <Text style={styles.notificationSignupTitle}>
              Get live broadcast + final score alerts
            </Text>
            <Text style={styles.notificationSignupText}>
              Be the first to know when your teams are live and when finals go official.
            </Text>
          </View>

          <View style={styles.notificationButtonRow}>
            <Pressable
              style={styles.notificationPrimaryButton}
              onPress={onEnableNotifications}
            >
              <Text style={styles.notificationPrimaryButtonText}>Enable</Text>
            </Pressable>

            <Pressable
              style={styles.notificationSecondaryButton}
              onPress={onDismissNotificationPrompt}
            >
              <Text style={styles.notificationSecondaryButtonText}>Not Now</Text>
            </Pressable>
          </View>
        </View>
      )}

      {resolvedModules.map((module) => renderHomeModule(module))}
    </ScrollView>
  );
}

function TeamsScreen({
  onOpenSport,
  schoolDisplayName,
  mascotName,
  schoolLogoUrl,
  themeMode,
  theme = DEFAULT_APP_THEME,
}: {
  onOpenSport: (sport: SportType) => void;
  schoolDisplayName?: string;
  mascotName?: string;
  schoolLogoUrl?: string;
  themeMode: 'light' | 'dark';
  theme?: AthleticOSResolvedTheme;
}) {
  const heroSchoolName =
    schoolDisplayName?.replace(/\bHigh School\b/gi, '').replace(/\s{2,}/g, ' ').trim() ||
    'Athletics';
  const heroMascot = mascotName?.trim() || '';
  const heroText = heroMascot
    ? `Explore ${heroMascot} athletics, team pages, schedules, rosters, and coverage.`
    : 'Explore team pages, schedules, rosters, and coverage.';

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={[
        styles.screenContent,
        { backgroundColor: theme.colors.background },
      ]}
    >
      <LinearGradient
        colors={[
          `${theme.colors.secondary}22`,
          `${theme.colors.primary}12`,
          theme.colors.background,
        ]}
        style={styles.teamsScreenBackdrop}
        pointerEvents="none"
      />
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.secondary]}
        style={styles.teamsHubHero}
      >
        <View
          style={[
            styles.teamsHubAccentRail,
            { backgroundColor: theme.colors.accent },
          ]}
        />

        {hasResolvedUrl(schoolLogoUrl) ? (
          <Image
            source={{ uri: schoolLogoUrl }}
            style={styles.teamsHubLogo}
            resizeMode="contain"
          />
        ) : null}

        <View style={styles.teamsHubContent}>
          <Text style={styles.teamsHubEyebrow}>Teams</Text>
          <Text style={styles.teamsHubTitle}>{heroSchoolName}</Text>
          {heroMascot ? <Text style={styles.teamsHubMascot}>{heroMascot}</Text> : null}
          <Text style={styles.teamsHubText}>{heroText}</Text>
        </View>
      </LinearGradient>

      <View style={styles.teamsListPremium}>
        {SPORTS.map((sport) => (
          <Pressable
            key={sport.key}
            style={[
              styles.teamDirectoryCard,
              {
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border,
              },
            ]}
            onPress={() => onOpenSport(sport)}
          >
            <View
              style={[
                styles.teamDirectoryAccent,
                { backgroundColor: theme.colors.accent },
              ]}
            />
            <View style={styles.teamDirectoryContent}>
              <Text style={styles.teamDirectoryTitle}>{sport.shortLabel || sport.label}</Text>
              <Text style={styles.teamDirectorySub}>Open team page</Text>
            </View>
            <View
              style={[
                styles.teamDirectoryChevronWrap,
                {
                  backgroundColor: theme.colors.cardAlt,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <Ionicons
                name="chevron-forward"
                size={18}
                color={BRAND.white}
              />
            </View>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

function MediaScreen({
  onOpenEmbedded,
  onOpenExternal,
  onOpenSchedule,
  onToggleAudio,
  watchUrl,
  listenUrl,
  scheduleUrl,
  mainSiteUrl,
  displayName,
  mascotName,
  schoolLogoUrl,
  isAudioPlaying,
  liveStatus,
  themeMode,
  scheduleAvailable,
  theme = DEFAULT_APP_THEME,
}: {
  onOpenEmbedded: (title: string, url: string) => void;
  onOpenExternal: (url: string) => void;
  onOpenSchedule: () => void;
  onToggleAudio: () => void;
  watchUrl: string;
  listenUrl: string;
  scheduleUrl: string;
  mainSiteUrl: string;
  displayName?: string;
  mascotName?: string;
  schoolLogoUrl?: string;
  isAudioPlaying: boolean;
  liveStatus: {
    audio: boolean;
    video: boolean;
  };
  themeMode: 'light' | 'dark';
  scheduleAvailable: boolean;
  theme?: AthleticOSResolvedTheme;
}) {
  const hasWatchUrl = hasResolvedUrl(watchUrl);
  const hasListenUrl = hasResolvedUrl(listenUrl);
  const hasScheduleUrl = scheduleAvailable;
  const hasMainSiteUrl = hasResolvedUrl(mainSiteUrl);
  const hasActions = hasWatchUrl || hasListenUrl || hasScheduleUrl || hasMainSiteUrl;
  const heroSchoolName =
    displayName?.replace(/\bHigh School\b/gi, '').replace(/\s{2,}/g, ' ').trim() ||
    'Media';
  const heroMascot = mascotName?.trim() || '';

  const renderMediaAction = (
    key: string,
    icon: keyof typeof Ionicons.glyphMap,
    title: string,
    subtitle: string,
    onPress: () => void
  ) => (
    <Pressable
      key={key}
      style={[
        styles.mediaActionCard,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border,
        },
      ]}
      onPress={onPress}
    >
      <View
        style={[
          styles.mediaActionAccent,
          { backgroundColor: theme.colors.accent },
        ]}
      />
      <View
        style={[
          styles.mediaActionIconWrap,
          {
            backgroundColor: theme.colors.cardAlt,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <Ionicons name={icon} size={22} color={BRAND.white} />
      </View>
      <View style={styles.mediaActionBody}>
        <Text style={styles.mediaActionTitle}>{title}</Text>
        <Text style={styles.mediaActionText}>{subtitle}</Text>
      </View>
      <View
        style={[
          styles.mediaActionChevronWrap,
          {
            backgroundColor: theme.colors.cardAlt,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <Ionicons name="chevron-forward" size={18} color={BRAND.white} />
      </View>
    </Pressable>
  );

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={[
        styles.screenContent,
        { backgroundColor: theme.colors.background },
      ]}
    >
      <LinearGradient
        colors={[
          `${theme.colors.secondary}22`,
          `${theme.colors.primary}12`,
          theme.colors.background,
        ]}
        style={styles.teamsScreenBackdrop}
        pointerEvents="none"
      />

      <LinearGradient colors={[theme.colors.primary, theme.colors.secondary]} style={styles.teamsHubHero}>
        <View
          style={[
            styles.teamsHubAccentRail,
            { backgroundColor: theme.colors.accent },
          ]}
        />

        {hasResolvedUrl(schoolLogoUrl) ? (
          <Image
            source={{ uri: schoolLogoUrl }}
            style={styles.teamsHubLogo}
            resizeMode="contain"
          />
        ) : null}

        <View style={styles.teamsHubContent}>
          <Text style={styles.teamsHubEyebrow}>Watch + Listen</Text>
          <Text style={styles.teamsHubTitle}>{heroSchoolName}</Text>
          {heroMascot ? <Text style={styles.teamsHubMascot}>{heroMascot}</Text> : null}
          <Text style={styles.teamsHubText}>
            Open live coverage, schedules, and school links when available.
          </Text>
        </View>
      </LinearGradient>

      {!hasActions ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No media links are available.</Text>
        </View>
      ) : null}

      {hasWatchUrl ? (
        renderMediaAction(
          'watch',
          'videocam',
          liveStatus.video ? 'Watch Live Now' : 'Watch Live',
          'Open the live video stream.',
          () => onOpenExternal(watchUrl)
        )
      ) : null}

      {hasListenUrl ? (
        renderMediaAction(
          'listen',
          isAudioPlaying ? 'pause-circle' : 'headset',
          isAudioPlaying
            ? 'Pause Live Audio'
            : liveStatus.audio
            ? 'Listen Live Now'
            : 'Listen Live',
          'Start or pause the live audio stream.',
          onToggleAudio
        )
      ) : null}

      {hasScheduleUrl ? (
        renderMediaAction(
          'schedule',
          'calendar',
          'View Schedule',
          'Open the in-app school schedule.',
          onOpenSchedule
        )
      ) : null}

      {hasMainSiteUrl ? (
        renderMediaAction(
          'website',
          'globe-outline',
          'Open Website',
          'Open the school site.',
          () => onOpenEmbedded('Website', mainSiteUrl)
        )
      ) : null}
    </ScrollView>
  );
}

function ScheduleScreen({
  scheduleEvents,
  eventsLoading,
  onBack,
  headerTitle,
  headerSubtitle,
  schoolLogoUrl,
  schoolId,
  variant = 'school',
  accentColor,
  theme = DEFAULT_APP_THEME,
}: {
  scheduleEvents: EventItem[];
  eventsLoading: boolean;
  onBack: () => void;
  headerTitle?: string;
  headerSubtitle?: string;
  schoolLogoUrl?: string;
  schoolId?: string | number | null;
  variant?: ScheduleScreenVariant;
  accentColor?: string;
  theme?: AthleticOSResolvedTheme;
}) {
  const isTeamVariant = variant === 'team';
  const scheduleScrollRef = useRef<ScrollView | null>(null);
  const compositeOffsetsRef = useRef<Record<number, number>>({});
  const hasAutoScrolledRef = useRef(false);
  const visibleScheduleEvents = useMemo(() => {
    if (isTeamVariant) {
      return [...scheduleEvents].sort((a, b) => {
        const aTime = new Date(
          a.eventDateTime || a.startDateTime || a.eventDate || 0
        ).getTime();

        const bTime = new Date(
          b.eventDateTime || b.startDateTime || b.eventDate || 0
        ).getTime();

        return aTime - bTime;
      });
    }

    const now = new Date();
    const pastLimit = new Date();
    pastLimit.setDate(now.getDate() - 30);

    const futureLimit = new Date();
    futureLimit.setDate(now.getDate() + 30);

    return [...scheduleEvents]
      .filter((event) => {
        const eventDate = safeDate(
          event.eventDateTime || event.startDateTime || event.eventDate
        );
        return Boolean(eventDate && eventDate >= pastLimit && eventDate <= futureLimit);
      })
      .sort((a, b) => {
        const aDate =
          safeDate(a.eventDateTime || a.startDateTime || a.eventDate)?.getTime() ?? 0;
        const bDate =
          safeDate(b.eventDateTime || b.startDateTime || b.eventDate)?.getTime() ?? 0;
        return aDate - bDate;
      });
  }, [isTeamVariant, scheduleEvents]);
  const normalized = useMemo(
    () => visibleScheduleEvents.map(normalizeScheduleItem),
    [visibleScheduleEvents]
  );
  const todayIndex = useMemo(() => {
    if (isTeamVariant) {
      return -1;
    }

    const now = new Date();
    const foundIndex = visibleScheduleEvents.findIndex((event) => {
      const eventDate = safeDate(
        event.eventDateTime || event.startDateTime || event.eventDate
      );
      return Boolean(eventDate && eventDate >= now);
    });

    if (foundIndex >= 0) {
      return foundIndex;
    }

    return visibleScheduleEvents.length > 0 ? visibleScheduleEvents.length - 1 : -1;
  }, [isTeamVariant, visibleScheduleEvents]);
  const resolvedAccentColor = accentColor?.trim() || theme.colors.accent || BRAND.primary;

  useEffect(() => {
    compositeOffsetsRef.current = {};
    hasAutoScrolledRef.current = false;
  }, [todayIndex, visibleScheduleEvents]);

  return (
    <ScrollView
      ref={scheduleScrollRef}
      style={styles.screen}
      contentContainerStyle={styles.screenContent}
    >
      <LinearGradient
        colors={getThemeDarkHeroGradient(theme)}
        style={styles.scheduleHero}
      >
        <Pressable style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={20} color={BRAND.white} />
          <Text style={styles.backButtonText}>Back</Text>
        </Pressable>

        {hasResolvedUrl(schoolLogoUrl) ? (
          <View style={styles.scheduleHeroLogoWrap}>
            <Image
              source={{ uri: schoolLogoUrl }}
              style={styles.scheduleHeroLogo}
              resizeMode="contain"
            />
          </View>
        ) : null}

        <Text style={styles.scheduleHeroTitle}>{headerTitle || 'Schedule'}</Text>
        {headerSubtitle ? (
          <Text style={styles.scheduleHeroSub}>{headerSubtitle}</Text>
        ) : null}
      </LinearGradient>

      {eventsLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={BRAND.primary} />
          <Text style={styles.scheduleLoadingText}>Loading schedule...</Text>
        </View>
      ) : normalized.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No schedule events are available.</Text>
          <Text style={styles.emptyText}>Pull down to refresh and check again.</Text>
        </View>
      ) : (
        normalized.map((item, index) => (
          isTeamVariant ? (() => {
            return (
              <View key={item.id} style={styles.teamScheduleCard}>
                <View style={styles.teamScheduleLogoColumn}>
                  {item.opponentLogoUrl ? (
                    <View style={styles.teamScheduleLogoPlate}>
                      <Image
                        source={{ uri: item.opponentLogoUrl }}
                        style={styles.teamScheduleLogo}
                        resizeMode="contain"
                      />
                    </View>
                  ) : null}
                </View>

                <View style={styles.teamScheduleCenterColumn}>
                  <View
                    style={[
                      styles.scheduleSportTag,
                      styles.teamScheduleSportTag,
                      { backgroundColor: resolvedAccentColor },
                    ]}
                  >
                    <Text style={[styles.scheduleSportTagText, { color: theme.colors.pillText }]}>
                      {item.sport}
                    </Text>
                  </View>

                  <Text style={styles.teamScheduleMatchup} numberOfLines={2}>
                    {item.homeAway ? `${item.homeAway} ${item.opponent}` : item.opponent}
                  </Text>

                  {item.statusLabel ? (
                    <Text style={styles.teamScheduleStatus}>{item.statusLabel}</Text>
                  ) : null}

                  {item.hasScore && item.teamScore && item.opponentScore ? (
                    <Text style={styles.scoreText}>
                      {item.result} {item.teamScore} - {item.opponentScore}
                    </Text>
                  ) : null}

                  {item.locationLabel ? (
                    <Text style={styles.teamScheduleLocation} numberOfLines={1}>
                      {item.locationLabel}
                    </Text>
                  ) : null}
                </View>

                <View style={styles.teamScheduleRightColumn}>
                  <Text style={styles.teamScheduleDate}>{item.displayDate}</Text>
                  {item.timeLabel ? (
                    <Text style={styles.teamScheduleTime}>{item.timeLabel}</Text>
                  ) : null}
                </View>
              </View>
            );
          })() : (
            (() => {
              return (
                <View
                  key={item.id}
                  style={styles.teamScheduleCard}
                  onLayout={
                    !isTeamVariant
                      ? (layoutEvent) => {
                          compositeOffsetsRef.current[index] = layoutEvent.nativeEvent.layout.y;

                          if (
                            !hasAutoScrolledRef.current &&
                            index === todayIndex &&
                            scheduleScrollRef.current
                          ) {
                            hasAutoScrolledRef.current = true;
                            scheduleScrollRef.current.scrollTo({
                              y: Math.max(layoutEvent.nativeEvent.layout.y - 12, 0),
                              animated: false,
                            });
                          }
                        }
                      : undefined
                  }
                >
                  <View style={styles.teamScheduleLogoColumn}>
                    {item.opponentLogoUrl ? (
                      <View style={styles.teamScheduleLogoPlate}>
                        <Image
                          source={{ uri: item.opponentLogoUrl }}
                          style={styles.teamScheduleLogo}
                          resizeMode="contain"
                        />
                      </View>
                    ) : null}
                  </View>

                  <View style={styles.teamScheduleCenterColumn}>
                    <View
                      style={[
                        styles.scheduleSportTag,
                        styles.teamScheduleSportTag,
                        { backgroundColor: resolvedAccentColor },
                      ]}
                    >
                      <Text style={[styles.scheduleSportTagText, { color: theme.colors.pillText }]}>
                        {item.sport}
                      </Text>
                    </View>

                    <Text style={styles.teamScheduleMatchup} numberOfLines={2}>
                      {item.homeAway ? `${item.homeAway} ${item.opponent}` : item.opponent}
                    </Text>

                    {item.statusLabel ? (
                      <Text style={styles.teamScheduleStatus}>{item.statusLabel}</Text>
                    ) : null}

                    {item.hasScore && item.teamScore && item.opponentScore ? (
                      <Text style={styles.teamScheduleScore}>
                        {item.result} {item.teamScore} - {item.opponentScore}
                      </Text>
                    ) : null}

                    {!item.hasScore && item.locationLabel ? (
                      <Text style={styles.teamScheduleLocation} numberOfLines={1}>
                        {item.locationLabel}
                      </Text>
                    ) : null}
                  </View>

                  <View style={styles.teamScheduleRightColumn}>
                    <Text style={styles.teamScheduleDate}>{item.displayDate}</Text>
                    {item.timeLabel ? (
                      <Text style={styles.teamScheduleTime}>{item.timeLabel}</Text>
                    ) : null}
                  </View>
                </View>
              );
            })()
          )
        ))
      )}
    </ScrollView>
  );
}

function RosterScreen({
  athletes,
  loading,
  onBack,
  onOpenAthlete,
  headerTitle,
  headerSubtitle,
  schoolLogoUrl,
  theme = DEFAULT_APP_THEME,
}: {
  athletes: AthleticOSRosterAthlete[];
  loading: boolean;
  onBack: () => void;
  onOpenAthlete: (athlete: AthleticOSRosterAthlete) => void;
  headerTitle: string;
  headerSubtitle?: string;
  schoolLogoUrl?: string;
  theme?: AthleticOSResolvedTheme;
}) {
  const [sortKey, setSortKey] = useState<RosterSortKey>('number');
  const rosterEntries = athletes ?? [];
  const sortedRoster = useMemo(() => {
    const items = [...rosterEntries];

    if (sortKey === 'name') {
      return items.sort((a, b) => {
        const lastCompare = (a.lastName || '').localeCompare(b.lastName || '');
        if (lastCompare !== 0) {
          return lastCompare;
        }

        const firstCompare = (a.firstName || '').localeCompare(b.firstName || '');
        if (firstCompare !== 0) {
          return firstCompare;
        }

        return (a.fullName || '').localeCompare(b.fullName || '');
      });
    }

    if (sortKey === 'position') {
      return items.sort((a, b) => {
        const positionCompare = (a.position || '').localeCompare(b.position || '');
        if (positionCompare !== 0) {
          return positionCompare;
        }

        const lastCompare = (a.lastName || '').localeCompare(b.lastName || '');
        if (lastCompare !== 0) {
          return lastCompare;
        }

        return (a.firstName || '').localeCompare(b.firstName || '');
      });
    }

    return items.sort((a, b) => {
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

      const lastCompare = (a.lastName || '').localeCompare(b.lastName || '');
      if (lastCompare !== 0) {
        return lastCompare;
      }

      return (a.firstName || '').localeCompare(b.firstName || '');
    });
  }, [rosterEntries, sortKey]);

  console.log('ROSTER UI DEBUG', {
    incomingRoster: rosterEntries?.length ?? 0,
    sortedRoster: sortedRoster?.length ?? 0,
    sortKey,
  });

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.screenContent}>
      <LinearGradient colors={getThemeDarkHeroGradient(theme)} style={styles.scheduleHero}>
        <Pressable style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={20} color={BRAND.white} />
          <Text style={styles.backButtonText}>Back</Text>
        </Pressable>

        {hasResolvedUrl(schoolLogoUrl) ? (
          <View style={styles.scheduleHeroLogoWrap}>
            <Image
              source={{ uri: schoolLogoUrl }}
              style={styles.scheduleHeroLogo}
              resizeMode="contain"
            />
          </View>
        ) : null}

        <Text style={styles.scheduleHeroTitle}>{headerTitle}</Text>
        {headerSubtitle ? <Text style={styles.scheduleHeroSub}>{headerSubtitle}</Text> : null}
      </LinearGradient>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={BRAND.primary} />
          <Text style={styles.scheduleLoadingText}>Loading roster...</Text>
        </View>
      ) : !sortedRoster.length ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No roster entries are available.</Text>
          <Text style={styles.emptyText}>Pull down to refresh and check again.</Text>
        </View>
      ) : (
        <View style={styles.rosterList}>
          <View style={styles.rosterSortRow}>
            {([
              ['number', 'Number'],
              ['name', 'Name'],
              ['position', 'Position'],
            ] as const).map(([key, label]) => {
              const active = sortKey === key;

              return (
                <Pressable
                  key={key}
                  style={[
                    styles.rosterSortChip,
                    active
                      ? {
                          backgroundColor: theme.colors.buttonBackground,
                          borderColor: theme.colors.buttonBackground,
                        }
                      : null,
                  ]}
                  onPress={() => setSortKey(key)}
                >
                  <Text
                    style={[
                      styles.rosterSortChipText,
                      active ? { color: theme.colors.buttonText } : null,
                    ]}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {sortedRoster.map((athlete) => {
            const numberLabel = athlete.jerseyNumber || athlete.number || '';
            const metaBits = [athlete.position, athlete.classYear].filter(Boolean).join(' • ');
            const sizeBits = [athlete.height, athlete.weight].filter(Boolean).join(' • ');
            const imageUrl = athlete.photoUrl?.trim() || '';
            const displayName =
              athlete.fullName?.trim() ||
              [athlete.firstName, athlete.lastName].filter(Boolean).join(' ').trim() ||
              'Unknown Athlete';

            return (
              <Pressable
                key={athlete.id}
                style={styles.rosterCard}
                onPress={() => onOpenAthlete(athlete)}
              >
                {imageUrl ? (
                  <Image
                    source={{ uri: imageUrl }}
                    style={styles.rosterPhoto}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.rosterPhotoFallback}>
                    <Ionicons name="person" size={22} color={BRAND.white} />
                  </View>
                )}

                <View style={styles.rosterBody}>
                  <View style={styles.rosterTopRow}>
                    <Text style={styles.rosterName} numberOfLines={1}>
                      {displayName}
                    </Text>
                    {numberLabel ? (
                      <Text style={styles.rosterNumber}>#{numberLabel}</Text>
                    ) : null}
                  </View>

                  {metaBits ? <Text style={styles.rosterMeta}>{metaBits}</Text> : null}
                  {sizeBits ? <Text style={styles.rosterMetaSecondary}>{sizeBits}</Text> : null}
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={BRAND.gray}
                  style={styles.newsChevron}
                />
              </Pressable>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

function AthleteProfileScreen({
  athlete,
  onBack,
  theme = DEFAULT_APP_THEME,
}: {
  athlete: AthleticOSRosterAthlete;
  onBack: () => void;
  theme?: AthleticOSResolvedTheme;
}) {
  const imageUrl = athlete.photoUrl?.trim() || '';
  const numberLabel = athlete.jerseyNumber || athlete.number || '';
  const infoRows = [
    numberLabel ? `No. ${numberLabel}` : '',
    athlete.position || '',
    athlete.classYear || '',
  ].filter(Boolean);
  const bodyRows = [
    athlete.height ? `Height: ${athlete.height}` : '',
    athlete.weight ? `Weight: ${athlete.weight}` : '',
    athlete.hometown ? `Hometown: ${athlete.hometown}` : '',
  ].filter(Boolean);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.screenContent}>
      <LinearGradient colors={getThemeDarkHeroGradient(theme)} style={styles.storyDetailHero}>
        <Pressable style={styles.storyDetailBackButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={20} color={BRAND.white} />
          <Text style={styles.backButtonText}>Back</Text>
        </Pressable>

        <View style={styles.storyDetailHeroContent}>
          <Text style={styles.storyDetailTitle}>{athlete.fullName}</Text>
        </View>
      </LinearGradient>

      <View style={styles.rosterProfileWrap}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.rosterProfileImage} resizeMode="cover" />
        ) : (
          <View style={styles.rosterProfileImageFallback}>
            <Ionicons name="person" size={40} color={BRAND.white} />
          </View>
        )}

        <View style={styles.rosterProfileCard}>
          {infoRows.length > 0 ? (
            <Text style={styles.rosterProfileMeta}>{infoRows.join(' • ')}</Text>
          ) : null}
          {bodyRows.map((row) => (
            <Text key={row} style={styles.rosterProfileDetail}>
              {row}
            </Text>
          ))}
          {athlete.bio ? (
            <Text style={styles.rosterProfileBio}>{athlete.bio}</Text>
          ) : null}
        </View>
      </View>
    </ScrollView>
  );
}

function SportDetailScreen({
  sport,
  schoolId,
  schoolSlug,
  schoolConfig,
  scheduleAccentColor,
  onBack,
  onOpenEmbedded,
  onOpenRoster,
  onOpenSchedule,
  onOpenStoryDetail,
  followedTeams,
  onToggleFollowTeam,
  theme = DEFAULT_APP_THEME,
}: {
  sport: SportType;
  schoolId: string | number | null;
  schoolSlug: string;
  schoolConfig: {
    displayName: string;
    logoUrl: string;
    splashLogoUrl?: string;
    ticketsUrl: string;
  };
  scheduleAccentColor: string;
  onBack: () => void;
  onOpenEmbedded: (title: string, url: string) => void;
  onOpenRoster: (options: OpenRosterOptions) => void;
  onOpenSchedule: (options?: {
    events?: EventItem[];
    headerTitle?: string;
    headerSubtitle?: string;
    schoolLogoUrl?: string;
    variant?: ScheduleScreenVariant;
    accentColor?: string;
  }) => void;
  onOpenStoryDetail: (item: NewsItem) => void;
  followedTeams: string[];
  onToggleFollowTeam: (teamKey: string) => void;
  theme?: AthleticOSResolvedTheme;
}) {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [allTeamScheduleEvents, setAllTeamScheduleEvents] = useState<EventItem[]>([]);
  const [teamNavItems, setTeamNavItems] = useState<AthleticOSTeamNavItem[]>([]);
  const [teamSportId, setTeamSportId] = useState('');
  const [sportConfig, setSportConfig] = useState(() => ({
    key: sport.key,
    name: sport.shortLabel || sport.label,
    slug: sport.key,
    mainUrl: '',
    scheduleUrl: '',
    rosterUrl: '',
    recruitingUrl: '',
  }));
  const [loading, setLoading] = useState(true);
  const hasScheduleUrl = hasResolvedUrl(sportConfig.scheduleUrl);
  const hasNativeRosterAccess = Boolean(teamSportId);
  const hasMainUrl = hasResolvedUrl(sportConfig.mainUrl);
  const hasRecruitingUrl = hasResolvedUrl(sportConfig.recruitingUrl);
  const visibleEvents = events;
  const hasScheduleAccess = hasScheduleUrl || allTeamScheduleEvents.length > 0;
  const handleOpenTeamRoster = () => {
    console.log('TEAM PAGE ROSTER TAP -> handleOpenTeamRoster', {
      sportKey: sport.key,
      sportId: teamSportId,
    });

    if (!teamSportId) {
      return;
    }

    console.log('TEAM PAGE ROSTER TAP -> onOpenRoster', {
      sportKey: sport.key,
      sportId: teamSportId,
    });
    onOpenRoster({
      sport,
      sportId: teamSportId,
      headerTitle: `${sport.shortLabel || sport.label} Roster`,
      headerSubtitle: schoolConfig.displayName,
      schoolLogoUrl: schoolConfig.logoUrl,
    });
  };

  const isFollowing = followedTeams.includes(sport.key);
  const fallbackTeamNavActions = useMemo(() => {
    const actions: TeamNavAction[] = [];

    if (hasScheduleAccess) {
      actions.push({
        key: 'schedule',
        label: 'Schedule',
        icon: 'calendar-outline',
        onPress: () =>
          onOpenSchedule({
            events: allTeamScheduleEvents,
            headerTitle: `${sport.shortLabel || sport.label} Schedule`,
            headerSubtitle: schoolConfig.displayName,
            schoolLogoUrl: schoolConfig.logoUrl,
            variant: 'team',
            accentColor: scheduleAccentColor,
          }),
      });
    }

    if (hasNativeRosterAccess) {
      actions.push({
        key: 'roster',
        label: 'Roster',
        icon: 'people-outline',
        onPress: handleOpenTeamRoster,
      });
    }

    if (hasRecruitingUrl || hasMainUrl) {
      actions.push({
        key: 'recruiting',
        label: 'Recruiting',
        icon: 'school-outline',
        onPress: () =>
          onOpenEmbedded(
            `${sport.shortLabel || sport.label} Recruiting`,
            sportConfig.recruitingUrl || sportConfig.mainUrl
          ),
      });
    }

    return actions;
  }, [
    handleOpenTeamRoster,
    hasRecruitingUrl,
    hasNativeRosterAccess,
    hasScheduleAccess,
    onOpenSchedule,
    scheduleAccentColor,
    schoolConfig.displayName,
    schoolConfig.logoUrl,
    sport.label,
    sport.shortLabel,
    sportConfig.recruitingUrl,
    allTeamScheduleEvents,
  ]);

  const resolvedTeamNavActions = useMemo(() => {
    if (teamNavItems.length === 0) {
      return fallbackTeamNavActions;
    }

    const actions: TeamNavAction[] = [];

    for (const item of teamNavItems) {
      if (!item.isEnabled) {
        continue;
      }

      switch (item.navKey) {
        case 'schedule':
          if (hasScheduleAccess) {
            actions.push({
              key: 'schedule',
              label: item.label || 'Schedule',
              icon: 'calendar-outline',
              onPress: () =>
                onOpenSchedule({
                  events: allTeamScheduleEvents,
                  headerTitle: `${sport.shortLabel || sport.label} Schedule`,
                  headerSubtitle: schoolConfig.displayName,
                  schoolLogoUrl: schoolConfig.logoUrl,
                  variant: 'team',
                  accentColor: scheduleAccentColor,
                }),
            });
          }
          break;
        case 'roster':
          if (hasNativeRosterAccess) {
            actions.push({
              key: 'roster',
              label: item.label || 'Roster',
              icon: 'people-outline',
              onPress: handleOpenTeamRoster,
            });
          }
          break;
        case 'recruiting':
          if (hasRecruitingUrl || hasMainUrl) {
            actions.push({
              key: 'recruiting',
              label: item.label || 'Recruiting',
              icon: 'school-outline',
              onPress: () =>
                onOpenEmbedded(
                  `${sport.shortLabel || sport.label} Recruiting`,
                  sportConfig.recruitingUrl || sportConfig.mainUrl
                ),
            });
          }
          break;
        case 'news':
        case 'coaches':
        case 'stats':
        case 'standings':
        case 'tickets':
        default:
          break;
      }
    }

    return actions.length > 0 ? actions : fallbackTeamNavActions;
  }, [
    fallbackTeamNavActions,
    handleOpenTeamRoster,
    hasMainUrl,
    hasRecruitingUrl,
    hasNativeRosterAccess,
    hasScheduleAccess,
    onOpenEmbedded,
    onOpenSchedule,
    scheduleAccentColor,
    schoolConfig.displayName,
    schoolConfig.logoUrl,
    sport.label,
    sport.shortLabel,
    sportConfig.recruitingUrl,
    teamNavItems,
    allTeamScheduleEvents,
  ]);

  useEffect(() => {
    let mounted = true;

    async function loadSportData() {
      try {
        setLoading(true);

        if (!schoolId) {
          console.log(`No school found for slug "${schoolSlug}"`);
          setSportConfig({
            key: sport.key,
            name: sport.shortLabel || sport.label,
            slug: sport.key,
            mainUrl: '',
            scheduleUrl: '',
            rosterUrl: '',
            recruitingUrl: '',
          });
          setNewsItems([]);
          setEvents([]);
          setAllTeamScheduleEvents([]);
          setTeamNavItems([]);
          setTeamSportId('');
          return;
        }

        const [nextSportConfig, teamNews, teamSchedule, teamSportRecord] = await Promise.all([
          getSportConfigBySchoolIdAndKey(schoolId, sport.key, schoolSlug),
          getSportStoriesBySchoolId(schoolId, sport.key),
          getSportScheduleEventsBySchoolId(schoolId, sport.key),
          getSportBySchoolIdAndKey(schoolId, sport.key),
        ]);

        if (!mounted) return;

        setSportConfig(nextSportConfig);
        setTeamSportId(
          teamSportRecord?.id === undefined || teamSportRecord?.id === null
            ? ''
            : String(teamSportRecord.id)
        );
        const mappedNews = teamNews
          .map((story) =>
            mapStoryToHomeNewsItem(
              story,
              nextSportConfig.mainUrl || nextSportConfig.scheduleUrl,
              teamSportRecord ? [teamSportRecord] : []
            )
          )
          .filter((item) => item.title && item.link)
          .map((item) => ({
            ...item,
            date: formatDate(item.rawDate),
          }));

        const mappedEvents = teamSchedule.map((event) => {
          const mapped = mapScheduleEventToHomeEventItem(
            event,
            nextSportConfig.scheduleUrl,
            teamSportRecord ? [teamSportRecord] : []
          );

          return {
            ...mapped,
            date: formatDate(mapped.rawDate),
          };
        });

        const nextTeamNavItems =
          teamSportRecord?.id !== undefined && teamSportRecord?.id !== null
            ? await getTeamNavBySportId(schoolId, teamSportRecord.id)
            : [];

        const sortedTeamScheduleEvents = [...mappedEvents].sort((a, b) => {
          const aTime = new Date(
            a.eventDateTime || a.startDateTime || a.eventDate || 0
          ).getTime();

          const bTime = new Date(
            b.eventDateTime || b.startDateTime || b.eventDate || 0
          ).getTime();

          return aTime - bTime;
        });

        setNewsItems(mappedNews.slice(0, 6));
        setEvents(filterNextFourGames(mappedEvents));
        setAllTeamScheduleEvents(sortedTeamScheduleEvents);
        setTeamNavItems(nextTeamNavItems);
      } catch (error) {
        console.log(`Failed loading sport data for ${sport.key}:`, error);

        if (!mounted) return;

        setSportConfig({
          key: sport.key,
          name: sport.shortLabel || sport.label,
          slug: sport.key,
          mainUrl: '',
          scheduleUrl: '',
          rosterUrl: '',
          recruitingUrl: '',
        });
        setNewsItems([]);
        setEvents([]);
        setAllTeamScheduleEvents([]);
        setTeamNavItems([]);
        setTeamSportId('');
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadSportData();

    return () => {
      mounted = false;
    };
  }, [schoolId, schoolSlug, sport]);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.screenContent}
    >
      <LinearGradient
        colors={getThemeDarkHeroGradient(theme)}
        style={styles.sportHeader}
      >
        <Pressable style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={20} color={BRAND.white} />
          <Text style={styles.backButtonText}>Back</Text>
        </Pressable>

        <View style={styles.teamPageHeader}>
          <Text style={styles.sportHeaderTitle}>
            {sport.shortLabel || sport.label}
          </Text>

          {hasResolvedUrl(schoolConfig.logoUrl) ? (
            <Image
              source={{ uri: schoolConfig.logoUrl }}
              style={styles.teamPageSponsorLogo}
              resizeMode="contain"
            />
          ) : null}
        </View>

        {schoolConfig.displayName ? (
          <Text style={styles.sportHeaderSub}>{schoolConfig.displayName}</Text>
        ) : null}

        <Pressable
          style={[
            styles.followTeamButton,
            isFollowing
              ? [
                  styles.followTeamButtonActive,
                  {
                    backgroundColor: theme.colors.buttonBackground,
                    borderColor: theme.colors.buttonBackground,
                  },
                ]
              : null,
          ]}
          onPress={() => onToggleFollowTeam(sport.key)}
        >
          <Ionicons
            name={isFollowing ? 'notifications' : 'notifications-outline'}
            size={18}
            color={BRAND.white}
          />
          <Text style={styles.followTeamButtonText}>
            {isFollowing
              ? `Following ${sport.shortLabel || sport.label}`
              : `Follow ${sport.shortLabel || sport.label}`}
          </Text>
        </Pressable>
      </LinearGradient>

      {resolvedTeamNavActions.length > 0 ? (
        <View
          style={
            resolvedTeamNavActions.length === 1
              ? styles.sportActionSingleWrap
              : styles.sportActionGrid
          }
        >
          {resolvedTeamNavActions.map((action) => (
            <Pressable
              key={action.key}
              style={
                resolvedTeamNavActions.length === 1
                  ? styles.sportActionCardFull
                  : styles.sportActionCard
              }
              onPress={action.onPress}
            >
              <Ionicons name={action.icon} size={22} color={BRAND.white} />
              <Text style={styles.sportActionText}>{action.label}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      <SectionHeader title="Upcoming Games" />
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={BRAND.primary} />
        </View>
      ) : visibleEvents.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No upcoming games found.</Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.teamGamesRow}
        >
          {visibleEvents.map((item) => {
            const normalized = normalizeScheduleItem(item);
            const matchupLine =
              normalized.homeAway && normalized.opponent
                ? `${normalized.homeAway} ${normalized.opponent}`
                : normalized.opponent || normalized.sport;
            const dateTimeLine = [normalized.displayDate, normalized.timeLabel]
              .filter(Boolean)
              .join(' • ');

            return (
              <Pressable
                key={item.id}
                style={styles.teamGameCard}
                onPress={() =>
                  onOpenSchedule({
                    events: visibleEvents,
                    headerTitle: `${sport.shortLabel || sport.label} Schedule`,
                    headerSubtitle: schoolConfig.displayName,
                    schoolLogoUrl: schoolConfig.logoUrl,
                    variant: 'team',
                    accentColor: scheduleAccentColor,
                  })
                }
              >
                <View style={styles.teamGameMainRow}>
                  <View style={styles.teamGameTextWrap}>
                    <Text style={styles.teamGameSport} numberOfLines={1}>
                      {normalized.sport}
                    </Text>
                    {normalized.statusLabel ? (
                      <Text style={styles.teamGameStatus}>{normalized.statusLabel}</Text>
                    ) : null}
                    <Text style={styles.teamGameMatchup} numberOfLines={2}>
                      {matchupLine}
                    </Text>

                    {normalized.hasScore && normalized.teamScore && normalized.opponentScore ? (
                      <View style={styles.teamGameScoreRow}>
                        <Text style={styles.teamGameScoreValue}>{normalized.teamScore}</Text>
                        <Text style={styles.teamGameScoreSeparator}>-</Text>
                        <Text style={styles.teamGameScoreValue}>{normalized.opponentScore}</Text>
                      </View>
                    ) : null}

                    {dateTimeLine ? (
                      <Text style={styles.teamGameDate}>{dateTimeLine}</Text>
                    ) : null}
                    {normalized.locationLabel ? (
                      <Text style={styles.teamGameVenue} numberOfLines={1}>
                        {normalized.locationLabel}
                      </Text>
                    ) : null}
                  </View>

                  {normalized.opponentLogoUrl ? (
                    <View style={styles.teamGameLogoPlate}>
                      <Image
                        source={{ uri: normalized.opponentLogoUrl }}
                        style={styles.teamGameLogo}
                        resizeMode="contain"
                      />
                    </View>
                  ) : null}
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      <SectionHeader title="Latest Team News" />
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={BRAND.primary} />
        </View>
      ) : newsItems.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No team news found.</Text>
        </View>
      ) : (
        <View style={styles.newsList}>
          {newsItems.map((item) => (
            <NewsCard
              key={`${item.link}-${item.title}`}
              item={item}
              theme={theme}
              onPress={() => onOpenStoryDetail(item)}
            />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function NewsListScreen({
  newsItems,
  loading,
  onBack,
  onOpenStoryDetail,
  schoolDisplayName,
  mascotName,
  schoolLogoUrl,
  theme = DEFAULT_APP_THEME,
}: {
  newsItems: NewsItem[];
  loading: boolean;
  onBack: () => void;
  onOpenStoryDetail: (item: NewsItem) => void;
  schoolDisplayName?: string;
  mascotName?: string;
  schoolLogoUrl?: string;
  theme?: AthleticOSResolvedTheme;
}) {
  const heroSchoolName =
    schoolDisplayName?.replace(/\bHigh School\b/gi, '').replace(/\s{2,}/g, ' ').trim() ||
    'Athletics';
  const heroMascot = mascotName?.trim() || '';

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={[
        styles.screenContent,
        { backgroundColor: theme.colors.background },
      ]}
    >
      <LinearGradient
        colors={[
          `${theme.colors.secondary}22`,
          `${theme.colors.primary}12`,
          theme.colors.background,
        ]}
        style={styles.teamsScreenBackdrop}
        pointerEvents="none"
      />

      <LinearGradient colors={[theme.colors.primary, theme.colors.secondary]} style={styles.teamsHubHero}>
        <View
          style={[
            styles.teamsHubAccentRail,
            { backgroundColor: theme.colors.accent },
          ]}
        />

        <Pressable style={styles.storyDetailBackButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={20} color={BRAND.white} />
          <Text style={styles.backButtonText}>Back</Text>
        </Pressable>

        {hasResolvedUrl(schoolLogoUrl) ? (
          <Image
            source={{ uri: schoolLogoUrl }}
            style={styles.teamsHubLogo}
            resizeMode="contain"
          />
        ) : null}

        <View style={styles.newsHubContent}>
          <Text style={styles.teamsHubEyebrow}>Latest News</Text>
          <Text style={styles.teamsHubTitle}>{heroSchoolName}</Text>
          {heroMascot ? <Text style={styles.teamsHubMascot}>{heroMascot}</Text> : null}
          <Text style={styles.teamsHubText}>
            School-wide athletics stories, features, and updates in one native feed.
          </Text>
        </View>
      </LinearGradient>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={BRAND.primary} />
        </View>
      ) : newsItems.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No stories available right now.</Text>
          <Text style={styles.emptyText}>Check back soon for the latest athletics updates.</Text>
        </View>
      ) : (
        <View style={styles.newsArchiveList}>
          {newsItems.map((item) => {
            const sportLabel = item.sportLabel?.trim() || 'Athletics';
            const summary = item.summary?.trim() || item.description?.trim() || '';

            return (
              <Pressable
                key={`${item.link}-${item.title}`}
                style={[
                  styles.newsArchiveCard,
                  {
                    backgroundColor: theme.colors.card,
                    borderColor: theme.colors.border,
                  },
                ]}
                onPress={() => onOpenStoryDetail(item)}
              >
                <View
                  style={[
                    styles.newsArchiveAccent,
                    { backgroundColor: theme.colors.accent },
                  ]}
                />

                {item.image ? (
                  <Image
                    source={{ uri: item.image }}
                    style={styles.newsArchiveThumb}
                    resizeMode="cover"
                  />
                ) : (
                  <View
                    style={[
                      styles.newsArchiveThumbFallback,
                      {
                        backgroundColor: theme.colors.cardAlt,
                        borderColor: theme.colors.border,
                      },
                    ]}
                  >
                    <Ionicons name="newspaper-outline" size={22} color={BRAND.white} />
                  </View>
                )}

                <View style={styles.newsArchiveContent}>
                  <View style={styles.newsArchiveMetaRow}>
                    <View
                      style={[
                        styles.featuredPill,
                        { backgroundColor: theme.colors.pillBackground },
                      ]}
                    >
                      <Text
                        style={[
                          styles.featuredPillText,
                          { color: theme.colors.pillText },
                        ]}
                      >
                        {sportLabel}
                      </Text>
                    </View>
                    <Text style={styles.newsArchiveDate}>{item.date || 'Latest'}</Text>
                  </View>

                  <Text style={styles.newsArchiveTitle} numberOfLines={3}>
                    {item.title}
                  </Text>

                  {summary ? (
                    <Text style={styles.newsArchiveSummary} numberOfLines={3}>
                      {summary}
                    </Text>
                  ) : null}
                </View>

                <View
                  style={[
                    styles.newsArchiveChevronWrap,
                    {
                      backgroundColor: theme.colors.cardAlt,
                      borderColor: theme.colors.border,
                    },
                  ]}
                >
                  <Ionicons name="chevron-forward" size={18} color={BRAND.white} />
                </View>
              </Pressable>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

function EmbeddedWebView({
  url,
  headerTitle,
  onBack,
}: {
  url: string;
  headerTitle: string;
  onBack: () => void;
}) {
  const webViewRef = useRef<WebView>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [loading, setLoading] = useState(true);

  return (
    <SafeAreaView style={styles.webSafe}>
      <View style={styles.webHeader}>
        <Pressable
          style={styles.webBackButton}
          onPress={() => {
            if (canGoBack && webViewRef.current) {
              webViewRef.current.goBack();
            } else {
              onBack();
            }
          }}
        >
          <Ionicons name="arrow-back" size={20} color={BRAND.white} />
        </Pressable>

        <Text style={styles.webHeaderTitle} numberOfLines={1}>
          {headerTitle}
        </Text>

        <Pressable
          style={styles.webExternalButton}
          onPress={() => Linking.openURL(url)}
        >
          <Ionicons name="open-outline" size={18} color={BRAND.white} />
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.webLoadingOverlay}>
          <ActivityIndicator color={BRAND.primary} />
        </View>
      ) : null}

      <WebView
        ref={webViewRef}
        source={{ uri: url }}
        style={{ flex: 1 }}
        javaScriptEnabled
        domStorageEnabled
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        allowsFullscreenVideo
        originWhitelist={['*']}
        startInLoadingState
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onNavigationStateChange={(navState) => setCanGoBack(navState.canGoBack)}
      />
    </SafeAreaView>
  );
}

function TicketsScreen({
  onOpenEmbedded,
  ticketsUrl,
  themeMode,
}: {
  onOpenEmbedded: (title: string, url: string) => void;
  ticketsUrl: string;
  themeMode: 'light' | 'dark';
}) {
  const isLightMode = themeMode === 'light';
  const hasTicketsUrl = hasResolvedUrl(ticketsUrl);

  return (
    <ScrollView
      style={[styles.screen, isLightMode ? styles.screenLight : null]}
      contentContainerStyle={[
        styles.screenContent,
        isLightMode ? styles.screenContentLight : null,
      ]}
    >
      <LinearGradient
        colors={[BRAND.red, BRAND.primaryDark]}
        style={styles.tabHero}
      >
        <Text style={styles.tabHeroEyebrow}>Tickets</Text>
        <Text style={styles.tabHeroTitle}>Game Tickets</Text>
        <Text style={styles.tabHeroText}>
          Open ticketing links when available.
        </Text>
      </LinearGradient>

      {hasTicketsUrl ? (
        <Pressable
          style={styles.watchPrimaryCard}
          onPress={() => onOpenEmbedded('Tickets', ticketsUrl)}
        >
          <Ionicons name="ticket-outline" size={28} color={BRAND.white} />
          <View style={styles.watchCardBody}>
            <Text style={styles.watchCardTitle}>Open Tickets</Text>
            <Text style={styles.watchCardText}>
              View and purchase tickets.
            </Text>
          </View>
        </Pressable>
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No ticket link is available.</Text>
        </View>
      )}
    </ScrollView>
  );
}

function MoreListRow({
  title,
  subtitle,
  onPress,
  trailing,
}: {
  title: string;
  subtitle?: string;
  onPress?: () => void;
  trailing?: React.ReactNode;
}) {
  return (
    <Pressable
      style={styles.teamListCard}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.moreRowTextWrap}>
        <Text style={styles.teamListTitle}>{title}</Text>
        {subtitle ? <Text style={styles.teamListSub}>{subtitle}</Text> : null}
      </View>
      {trailing ?? <Ionicons name="chevron-forward" size={22} color={BRAND.gray} />}
    </Pressable>
  );
}

function MoreScreen({
  schoolConfig,
  followedTeamsCount,
  scheduleAvailable,
  themeMode,
  onOpenManageTeams,
  onOpenSettings,
  onOpenSavedEvents,
  onOpenSchedule,
  onOpenEmbedded,
}: {
  schoolConfig: {
    watchUrl: string;
    scheduleUrl: string;
    ticketsUrl: string;
    shopUrl: string;
  };
  followedTeamsCount: number;
  scheduleAvailable: boolean;
  themeMode: 'light' | 'dark';
  onOpenManageTeams: () => void;
  onOpenSettings: () => void;
  onOpenSavedEvents: () => void;
  onOpenSchedule: () => void;
  onOpenEmbedded: (title: string, url: string) => void;
}) {
  const isLightMode = themeMode === 'light';
  const hasWatchUrl = hasResolvedUrl(schoolConfig.watchUrl);
  const hasScheduleUrl = scheduleAvailable;
  const hasTicketsUrl = hasResolvedUrl(schoolConfig.ticketsUrl);
  const hasShopUrl = hasResolvedUrl(schoolConfig.shopUrl);

  return (
    <ScrollView
      style={[styles.screen, isLightMode ? styles.screenLight : null]}
      contentContainerStyle={[
        styles.screenContent,
        isLightMode ? styles.screenContentLight : null,
      ]}
    >
      <View style={[styles.tabHero, isLightMode ? styles.tabHeroLight : null]}>
        <Text style={styles.tabHeroEyebrow}>More</Text>
        <Text style={[styles.tabHeroTitle, isLightMode ? styles.textPrimaryLight : null]}>
          More
        </Text>
        <Text style={[styles.tabHeroText, isLightMode ? styles.textSecondaryLight : null]}>
          Manage teams, settings, saved items, and school links.
        </Text>
      </View>

      <View style={styles.teamsList}>
        <MoreListRow
          title="My Teams"
          subtitle={
            followedTeamsCount > 0
              ? `${followedTeamsCount} followed`
              : 'Manage followed teams'
          }
          onPress={onOpenManageTeams}
        />
        <MoreListRow
          title="Settings"
          subtitle="Notifications, playback, timezone, theme"
          onPress={onOpenSettings}
        />
        <MoreListRow
          title="My Saved Events"
          subtitle="Saved events will appear here"
          onPress={onOpenSavedEvents}
        />
        {hasWatchUrl ? (
          <MoreListRow
            title="Video"
            subtitle="Open live video"
            onPress={() => onOpenEmbedded('Video', schoolConfig.watchUrl)}
          />
        ) : null}
        {hasScheduleUrl ? (
          <MoreListRow
            title="Events"
            subtitle="Open the in-app schedule"
            onPress={onOpenSchedule}
          />
        ) : null}
        {hasTicketsUrl ? (
          <MoreListRow
            title="Tickets"
            subtitle="Open ticketing"
            onPress={() => onOpenEmbedded('Tickets', schoolConfig.ticketsUrl)}
          />
        ) : null}
        {hasShopUrl ? (
          <MoreListRow
            title="Shop"
            subtitle="Open the team store"
            onPress={() => onOpenEmbedded('Shop', schoolConfig.shopUrl)}
          />
        ) : null}
      </View>
    </ScrollView>
  );
}

function ManageTeamsScreen({
  onBack,
  sports,
  followedTeams,
  onToggleFollowTeam,
  themeMode,
}: {
  onBack: () => void;
  sports: FollowableSport[];
  followedTeams: string[];
  onToggleFollowTeam: (teamKey: string) => void;
  themeMode: 'light' | 'dark';
}) {
  const isLightMode = themeMode === 'light';
  return (
    <ScrollView
      style={[styles.screen, isLightMode ? styles.screenLight : null]}
      contentContainerStyle={[
        styles.screenContent,
        isLightMode ? styles.screenContentLight : null,
      ]}
    >
      <LinearGradient colors={[BRAND.black, BRAND.primaryDark]} style={styles.sportHeader}>
        <Pressable style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={20} color={BRAND.white} />
          <Text style={styles.backButtonText}>Back</Text>
        </Pressable>
        <Text style={styles.sportHeaderTitle}>My Teams</Text>
        <Text style={styles.sportHeaderSub}>Manage followed teams for notifications.</Text>
      </LinearGradient>

      {sports.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No teams are available.</Text>
        </View>
      ) : (
        <View style={styles.teamsList}>
          {sports.map((sport) => {
            const isFollowing = followedTeams.includes(sport.id);
            return (
              <View key={sport.id} style={styles.teamListCard}>
                <View style={styles.moreRowTextWrap}>
                  <Text style={styles.teamListTitle}>{sport.label}</Text>
                  <Text style={styles.teamListSub}>
                    {isFollowing ? 'Following' : 'Not following'}
                  </Text>
                </View>
                <Pressable
                  style={[
                    styles.inlineFollowButton,
                    isFollowing ? styles.inlineFollowButtonActive : null,
                  ]}
                  onPress={() => onToggleFollowTeam(sport.id)}
                >
                  <Text style={styles.inlineFollowButtonText}>
                    {isFollowing ? 'Following' : 'Follow'}
                  </Text>
                </Pressable>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

function SettingsScreen({
  onBack,
  notificationsEnabled,
  onToggleNotifications,
  autoPlayVideo,
  onToggleAutoPlayVideo,
  useLocalTimezone,
  onToggleUseLocalTimezone,
  themeMode,
  onToggleThemeMode,
  onOpenManageTeams,
}: {
  onBack: () => void;
  notificationsEnabled: boolean;
  onToggleNotifications: () => void;
  autoPlayVideo: boolean;
  onToggleAutoPlayVideo: () => void;
  useLocalTimezone: boolean;
  onToggleUseLocalTimezone: () => void;
  themeMode: 'light' | 'dark';
  onToggleThemeMode: () => void;
  onOpenManageTeams: () => void;
}) {
  const isLightMode = themeMode === 'light';
  return (
    <ScrollView
      style={[styles.screen, isLightMode ? styles.screenLight : null]}
      contentContainerStyle={[
        styles.screenContent,
        isLightMode ? styles.screenContentLight : null,
      ]}
    >
      <LinearGradient colors={[BRAND.black, BRAND.primaryDark]} style={styles.sportHeader}>
        <Pressable style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={20} color={BRAND.white} />
          <Text style={styles.backButtonText}>Back</Text>
        </Pressable>
        <Text style={styles.sportHeaderTitle}>Settings</Text>
        <Text style={styles.sportHeaderSub}>Manage notifications, playback, and theme.</Text>
      </LinearGradient>

      <View style={styles.teamsList}>
        <MoreListRow
          title="Push Notifications"
          subtitle={notificationsEnabled ? 'Enabled' : 'Disabled'}
          onPress={onToggleNotifications}
          trailing={
            <Text style={styles.settingsValueText}>
              {notificationsEnabled ? 'On' : 'Off'}
            </Text>
          }
        />
        <MoreListRow
          title="Manage Notifications"
          subtitle="Choose followed teams"
          onPress={onOpenManageTeams}
        />
        <MoreListRow
          title="Auto-play Video"
          subtitle={autoPlayVideo ? 'Enabled' : 'Disabled'}
          onPress={onToggleAutoPlayVideo}
          trailing={
            <Text style={styles.settingsValueText}>
              {autoPlayVideo ? 'On' : 'Off'}
            </Text>
          }
        />
        <MoreListRow
          title="Use Local Timezone"
          subtitle={useLocalTimezone ? 'Enabled' : 'Disabled'}
          onPress={onToggleUseLocalTimezone}
          trailing={
            <Text style={styles.settingsValueText}>
              {useLocalTimezone ? 'On' : 'Off'}
            </Text>
          }
        />
        <MoreListRow
          title="Theme"
          subtitle={themeMode === 'light' ? 'Light mode' : 'Dark mode'}
          onPress={onToggleThemeMode}
          trailing={
            <Text style={styles.settingsValueText}>
              {themeMode === 'light' ? 'Light' : 'Dark'}
            </Text>
          }
        />
      </View>
    </ScrollView>
  );
}

function SavedEventsScreen({
  onBack,
  themeMode,
}: {
  onBack: () => void;
  themeMode: 'light' | 'dark';
}) {
  const isLightMode = themeMode === 'light';
  return (
    <ScrollView
      style={[styles.screen, isLightMode ? styles.screenLight : null]}
      contentContainerStyle={styles.screenContent}
    >
      <LinearGradient colors={[BRAND.black, BRAND.primaryDark]} style={styles.sportHeader}>
        <Pressable style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={20} color={BRAND.white} />
          <Text style={styles.backButtonText}>Back</Text>
        </Pressable>
        <Text style={styles.sportHeaderTitle}>My Saved Events</Text>
        <Text style={styles.sportHeaderSub}>Saved events will appear here.</Text>
      </LinearGradient>

      <View style={styles.emptyCard}>
        <Text style={styles.emptyTitle}>No saved events yet.</Text>
      </View>
    </ScrollView>
  );
}

function BottomNav({
  items,
  themeMode,
  centerLogoUrl,
  theme = DEFAULT_APP_THEME,
}: {
  items: BottomNavRenderItem[];
  themeMode: 'light' | 'dark';
  centerLogoUrl?: string;
  theme?: AthleticOSResolvedTheme;
}) {
  const isLightMode = themeMode === 'light';
  const hasCenterLogo = hasResolvedUrl(centerLogoUrl);
  const homeItem = items.find((item) => item.key === 'home');
  const homeActive = homeItem?.active ?? false;
  const homePulse = useRef(new Animated.Value(1)).current;
  const homePulseLoopRef = useRef<Animated.CompositeAnimation | null>(null);
  useEffect(() => {
    homePulseLoopRef.current?.stop();
    homePulseLoopRef.current = null;

    if (homeActive) {
      homePulseLoopRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(homePulse, {
            toValue: 1.06,
            duration: 1300,
            useNativeDriver: true,
          }),
          Animated.timing(homePulse, {
            toValue: 1,
            duration: 1300,
            useNativeDriver: true,
          }),
        ])
      );
      homePulseLoopRef.current.start();
    } else {
      homePulse.setValue(1);
    }

    return () => {
      homePulseLoopRef.current?.stop();
      homePulseLoopRef.current = null;
      homePulse.setValue(1);
    };
  }, [homeActive, homePulse]);

  return (
    <View style={[styles.bottomNav, isLightMode ? styles.bottomNavLight : null]}>
      {items.map((item) => {
        const active = item.active;

        return (
          <Pressable
            key={item.key}
            style={[
              styles.bottomNavItem,
              item.key === 'home' ? styles.bottomNavItemAsn : null,
            ]}
            onPress={item.onPress}
          >
            {item.key === 'home' ? (
              <>
                <Animated.View
                  style={[
                    styles.asnTabFloatWrap,
                    { transform: [{ scale: homePulse }] },
                  ]}
                >
                  <View
                    style={[
                      styles.asnTabWrap,
                      active ? styles.asnTabWrapActive : null,
                    ]}
                  >
                    <View
                      style={[
                        styles.asnTabGlowWrap,
                        active ? styles.asnTabGlowWrapActive : null,
                        active
                          ? {
                              shadowColor: theme.colors.glow,
                              borderColor: theme.colors.glow,
                            }
                          : null,
                      ]}
                    >
                      {hasCenterLogo ? (
                        <Image
                          source={{ uri: centerLogoUrl }}
                          style={styles.centerNavLogo}
                          resizeMode="contain"
                        />
                      ) : (
                        <Ionicons
                          name="radio-outline"
                          size={18}
                          color={active ? BRAND.white : BRAND.gray}
                        />
                      )}
                    </View>
                  </View>
                </Animated.View>
                <Text
                  style={[
                    styles.asnTabLabel,
                    active ? styles.bottomNavLabelActive : null,
                  ]}
                >
                  {item.label}
                </Text>
              </>
            ) : (
              <>
                <Ionicons
                  name={item.icon!}
                  size={22}
                  color={active ? BRAND.primary : BRAND.gray}
                />
                <Text
                  style={[
                    styles.bottomNavLabel,
                    active ? styles.bottomNavLabelActive : null,
                  ]}
                >
                  {item.label}
                </Text>
              </>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

export default function App() {
  const schoolSlug = useMemo(() => getConfiguredSchoolSlug(), []);
  const defaultSchoolConfig = useMemo(
    () => getDefaultSchoolConfig(schoolSlug),
    [schoolSlug]
  );
  const player = useAudioPlayer(null);
  const playerStatus = useAudioPlayerStatus(player);

  const [showLaunchSplash, setShowLaunchSplash] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const [screenMode, setScreenMode] = useState<ScreenMode>('tabs');
  const [selectedSport, setSelectedSport] = useState<SportType | null>(null);
  const [selectedRosterSport, setSelectedRosterSport] = useState<SportType | null>(null);
  const [selectedRosterSportId, setSelectedRosterSportId] = useState('');
  const [rosterHeaderTitle, setRosterHeaderTitle] = useState('Roster');
  const [rosterHeaderSubtitle, setRosterHeaderSubtitle] = useState('');
  const [rosterLogoUrl, setRosterLogoUrl] = useState('');
  const [rosterItems, setRosterItems] = useState<AthleticOSRosterAthlete[]>([]);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [selectedAthlete, setSelectedAthlete] = useState<AthleticOSRosterAthlete | null>(null);
  const [selectedStory, setSelectedStory] = useState<NewsItem | null>(null);
  const [previousScreenMode, setPreviousScreenMode] = useState<ScreenMode>('tabs');
  const [scheduleScreenEvents, setScheduleScreenEvents] = useState<EventItem[]>([]);
  const [scheduleScreenTitle, setScheduleScreenTitle] = useState('Schedule');
  const [scheduleScreenSubtitle, setScheduleScreenSubtitle] = useState('');
  const [scheduleScreenLogoUrl, setScheduleScreenLogoUrl] = useState('');
  const [scheduleScreenVariant, setScheduleScreenVariant] =
    useState<ScheduleScreenVariant>('school');
  const [scheduleScreenAccentColor, setScheduleScreenAccentColor] = useState(BRAND.primary);
  const [embeddedTitle, setEmbeddedTitle] = useState('');
  const [embeddedUrl, setEmbeddedUrl] = useState('');

const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
const [allNewsItems, setAllNewsItems] = useState<NewsItem[]>([]);
const [videoItems, setVideoItems] = useState<VideoItem[]>([]);
const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
const [recentEvents, setRecentEvents] = useState<EventItem[]>([]);
const [upcomingEvents, setUpcomingEvents] = useState<EventItem[]>([]);
const [allEvents, setAllEvents] = useState<EventItem[]>([]);
  const [homeModules, setHomeModules] = useState<AthleticOSAppHomeModule[]>([]);
  const [bottomNavItems, setBottomNavItems] = useState<AthleticOSBottomNavItem[]>([]);
  const [appThemeConfig, setAppThemeConfig] = useState<AthleticOSAppThemeConfig | null>(
    null
  );
  const [liveCoverageConfig, setLiveCoverageConfig] =
    useState<AthleticOSAppLiveCoverageConfig | null>(null);
  const [promotionCard, setPromotionCard] = useState<AthleticOSPromotionCard | null>(
    null
  );
  const [athleteOfWeek, setAthleteOfWeek] = useState<AthleticOSAthleteOfTheWeek | null>(
    null
  );
  const [sponsorPlacements, setSponsorPlacements] = useState<
    AthleticOSAppSponsorPlacement[]
  >([]);
  const [homeSports, setHomeSports] = useState<SportType[]>(SPORTS);
  const [followableSports, setFollowableSports] = useState<FollowableSport[]>([]);
  const [resolvedSchoolId, setResolvedSchoolId] = useState<string | number | null>(
    null
  );
  const [schoolLookupComplete, setSchoolLookupComplete] = useState(false);
  const [prerollConfig, setPrerollConfig] = useState<AthleticOSAppPrerollConfig | null>(
    null
  );
  const [prerollDecisionComplete, setPrerollDecisionComplete] = useState(false);
  const [showPreroll, setShowPreroll] = useState(false);
  const [schoolConfig, setSchoolConfig] = useState(() => defaultSchoolConfig);
  const [schoolAccentColor, setSchoolAccentColor] = useState(BRAND.primary);
  const resolvedTheme = useMemo(
    () => resolveAthleticOSTheme(appThemeConfig),
    [appThemeConfig]
  );
  const appDisplayName = schoolConfig.displayName.trim() || 'Athletics';
  const [newsLoading, setNewsLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [followedTeams, setFollowedTeams] = useState<string[]>([]);
  const [autoPlayVideo, setAutoPlayVideo] = useState(false);
  const [useLocalTimezone, setUseLocalTimezone] = useState(true);
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('dark');
  const [audioPlayerVisible, setAudioPlayerVisible] = useState(false);

  const [liveStatus] = useState({
    audio: false,
    video: false,
  });
  const {
    token: expoPushToken,
    isEnabled: pushNotificationsEnabled,
    enable: enablePushNotifications,
  } = usePushNotifications(resolvedSchoolId);

  const isPlaying = Boolean((playerStatus as any)?.playing);
  const isLoading = Boolean((playerStatus as any)?.loading);
  const hasListenUrl = hasResolvedUrl(schoolConfig.listenUrl);
  const hasMainSiteUrl = hasResolvedUrl(schoolConfig.mainSiteUrl);

  useEffect(() => {
    if (!hasListenUrl) {
      try {
        player.pause();
      } catch {}
      return;
    }

    player.replace(schoolConfig.listenUrl);
  }, [hasListenUrl, player, schoolConfig.listenUrl]);

  useEffect(() => {
  setAudioModeAsync({
    playsInSilentMode: true,
    shouldPlayInBackground: true,
    interruptionMode: 'doNotMix',
  }).catch((error) => {
    console.log('Audio mode setup error:', error);
  });
}, []);

  useEffect(() => {
    const timer = setTimeout(() => setShowLaunchSplash(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    let mounted = true;

    async function resolveSchool() {
      try {
        const nextSchoolId = schoolSlug
          ? await getSchoolIdFromSlug(schoolSlug)
          : null;

        if (!mounted) {
          return;
        }

        if (!nextSchoolId) {
          console.log(`No school found for slug "${schoolSlug}"`);
        }

        console.log('[AthleticOS] schoolSlug:', schoolSlug);
        console.log('[AthleticOS] schoolId:', nextSchoolId);
        setResolvedSchoolId(nextSchoolId);
      } catch (error) {
        console.log(`School lookup failed for slug "${schoolSlug}":`, error);

        if (!mounted) {
          return;
        }

        setResolvedSchoolId(null);
      } finally {
        if (mounted) {
          setSchoolLookupComplete(true);
        }
      }
    }

    setSchoolLookupComplete(false);
    resolveSchool();

    return () => {
      mounted = false;
    };
  }, [schoolSlug]);

  useEffect(() => {
    let mounted = true;
    const fallbackTimer = setTimeout(() => {
      if (!mounted) {
        return;
      }

      setPrerollConfig(null);
      setShowPreroll(false);
      setPrerollDecisionComplete(true);
    }, 4000);

    async function loadPrerollConfig() {
      if (!schoolLookupComplete) {
        return;
      }

      try {
        if (!resolvedSchoolId) {
          if (!mounted) {
            return;
          }

          setPrerollConfig(null);
          setShowPreroll(false);
          setPrerollDecisionComplete(true);
          return;
        }

        const nextPrerollConfig = await getAppPrerollConfigBySchoolId(resolvedSchoolId);

        if (!mounted) {
          return;
        }

        const shouldShow =
          Boolean(nextPrerollConfig?.is_enabled) &&
          hasResolvedUrl(nextPrerollConfig?.video_url);

        setPrerollConfig(nextPrerollConfig);
        setShowPreroll(shouldShow);
      } catch (error) {
        console.log('Preroll config load error:', error);

        if (!mounted) {
          return;
        }

        setPrerollConfig(null);
        setShowPreroll(false);
      } finally {
        if (mounted) {
          clearTimeout(fallbackTimer);
          setPrerollDecisionComplete(true);
        }
      }
    }

    setPrerollDecisionComplete(false);
    loadPrerollConfig();

    return () => {
      clearTimeout(fallbackTimer);
      mounted = false;
    };
  }, [resolvedSchoolId, schoolLookupComplete]);

  const loadHomeFeeds = async () => {
  try {
    setNewsLoading(true);
    setEventsLoading(true);

    if (!resolvedSchoolId) {
      console.log(`Home feed skipped because no school was resolved for "${schoolSlug}"`);
      setSchoolConfig(defaultSchoolConfig);
      setHomeModules([]);
      setBottomNavItems([]);
      setAppThemeConfig(null);
      setLiveCoverageConfig(null);
      setPromotionCard(null);
      setAthleteOfWeek(null);
      setSponsorPlacements([]);
      setHomeSports(SPORTS);
      setFollowableSports([]);
      setNewsItems([]);
      setAllNewsItems([]);
      setVideoItems([]);
      setGalleryItems([]);
      setRecentEvents([]);
      setUpcomingEvents([]);
      setAllEvents([]);
      setSchoolAccentColor(BRAND.primary);
      return;
    }

    const [
      nextSchoolConfig,
      schoolAppConfig,
      moduleConfig,
      nextBottomNavItems,
      nextThemeConfig,
      nextPromotionCard,
      nextLiveCoverageConfig,
      nextAthleteOfWeek,
      videosConfig,
      sponsorConfig,
      sportAppConfig,
      sportsData,
      stories,
      scheduleEvents,
      resolvedSports,
    ] = await Promise.all([
      getSchoolConfigById(resolvedSchoolId, schoolSlug),
      getSchoolAppConfigById(resolvedSchoolId),
      getAppHomeModulesBySchoolId(resolvedSchoolId),
      getAppBottomNavItemsBySchoolId(resolvedSchoolId),
      getAppThemeConfigBySchoolId(resolvedSchoolId),
      getPromotionCardBySchoolId(resolvedSchoolId),
      getAppLiveCoverageConfigBySchoolId(resolvedSchoolId),
      getAthleteOfTheWeekBySchoolId(resolvedSchoolId),
      getAppVideosConfigBySchoolId(resolvedSchoolId),
      getAppSponsorPlacementsBySchoolId(resolvedSchoolId),
      getSportAppConfigBySchoolId(resolvedSchoolId),
      getSportsBySchoolId(resolvedSchoolId),
      getStoriesBySchoolId(resolvedSchoolId),
      getScheduleEventsBySchoolId(resolvedSchoolId),
      Promise.all(
        SPORTS.map(async (sport) => ({
          sport,
          record: await getSportBySchoolIdAndKey(resolvedSchoolId, sport.key),
        }))
      ),
    ]);

    const mergedSchoolConfig = {
      ...nextSchoolConfig,
      logoUrl:
        (typeof schoolAppConfig?.logo_url === 'string' &&
        schoolAppConfig.logo_url.trim()
          ? schoolAppConfig.logo_url.trim()
          : undefined) ?? nextSchoolConfig.logoUrl,
      splashLogoUrl:
        (typeof schoolAppConfig?.splash_logo_url === 'string' &&
        schoolAppConfig.splash_logo_url.trim()
          ? schoolAppConfig.splash_logo_url.trim()
          : undefined) ?? nextSchoolConfig.splashLogoUrl,
      splashBackgroundUrl:
        (typeof schoolAppConfig?.splash_background_url === 'string' &&
        schoolAppConfig.splash_background_url.trim()
          ? schoolAppConfig.splash_background_url.trim()
          : undefined) ?? nextSchoolConfig.splashBackgroundUrl,
      appShortName:
        (typeof schoolAppConfig?.app_short_name === 'string' &&
        schoolAppConfig.app_short_name.trim()
          ? schoolAppConfig.app_short_name.trim()
          : undefined) ?? nextSchoolConfig.appShortName,
      mascotName:
        (typeof schoolAppConfig?.mascot_name === 'string' &&
        schoolAppConfig.mascot_name.trim()
          ? schoolAppConfig.mascot_name.trim()
          : undefined) ?? nextSchoolConfig.mascotName,
      heroTitleOverride:
        (typeof schoolAppConfig?.hero_title_override === 'string' &&
        schoolAppConfig.hero_title_override.trim()
          ? schoolAppConfig.hero_title_override.trim()
          : undefined) ?? nextSchoolConfig.heroTitleOverride,
      heroSubtitleOverride:
        (typeof schoolAppConfig?.hero_subtitle_override === 'string' &&
        schoolAppConfig.hero_subtitle_override.trim()
          ? schoolAppConfig.hero_subtitle_override.trim()
          : undefined) ?? nextSchoolConfig.heroSubtitleOverride,
      mainSiteUrl:
        (typeof schoolAppConfig?.website_url === 'string' &&
        schoolAppConfig.website_url.trim()
          ? schoolAppConfig.website_url.trim()
          : undefined) ?? nextSchoolConfig.mainSiteUrl,
      watchUrl:
        (typeof schoolAppConfig?.watch_url === 'string' &&
        schoolAppConfig.watch_url.trim()
          ? schoolAppConfig.watch_url.trim()
          : undefined) ?? nextSchoolConfig.watchUrl,
      listenUrl:
        (typeof schoolAppConfig?.listen_url === 'string' &&
        schoolAppConfig.listen_url.trim()
          ? schoolAppConfig.listen_url.trim()
          : undefined) ?? nextSchoolConfig.listenUrl,
      ticketsUrl:
        (typeof schoolAppConfig?.tickets_url === 'string' &&
        schoolAppConfig.tickets_url.trim()
          ? schoolAppConfig.tickets_url.trim()
          : undefined) ?? nextSchoolConfig.ticketsUrl,
      shopUrl:
        (typeof schoolAppConfig?.shop_url === 'string' &&
        schoolAppConfig.shop_url.trim()
          ? schoolAppConfig.shop_url.trim()
          : undefined) ?? nextSchoolConfig.shopUrl,
    };
    const nextSchoolAccentColor =
      (typeof schoolAppConfig?.accent_color === 'string' &&
      schoolAppConfig.accent_color.trim()
        ? schoolAppConfig.accent_color.trim()
        : '') ||
      (typeof schoolAppConfig?.secondary_color === 'string' &&
      schoolAppConfig.secondary_color.trim()
        ? schoolAppConfig.secondary_color.trim()
        : '') ||
      (typeof schoolAppConfig?.primary_color === 'string' &&
      schoolAppConfig.primary_color.trim()
        ? schoolAppConfig.primary_color.trim()
        : '') ||
      BRAND.primary;
    const mergedThemeConfig = {
      ...(nextThemeConfig ?? {}),
      theme_key: nextThemeConfig?.theme_key?.trim() || 'sec_power5',
      primary_color:
        nextThemeConfig?.primary_color?.trim() ||
        schoolAppConfig?.primary_color?.trim() ||
        BRAND.primary,
      secondary_color:
        nextThemeConfig?.secondary_color?.trim() ||
        schoolAppConfig?.secondary_color?.trim() ||
        BRAND.primaryDark,
      accent_color:
        nextThemeConfig?.accent_color?.trim() ||
        schoolAppConfig?.accent_color?.trim() ||
        nextSchoolAccentColor,
    } satisfies AthleticOSAppThemeConfig;

    console.log('[AthleticOS] appConfig:', schoolAppConfig);
    console.log('[AthleticOS] modules:', moduleConfig);

    const news = stories
      .map((story) =>
        mapStoryToHomeNewsItem(
          story,
          mergedSchoolConfig.athleticOSSiteUrl || mergedSchoolConfig.mainSiteUrl,
          sportsData
        )
      )
      .filter((item) => item.title && item.link)
      .map((item) => ({
        ...item,
        date: formatDate(item.rawDate),
      }));

    console.log(
      'NORMALIZED HOME STORY SAMPLE',
      news.slice(0, 3).map((item) => ({
        title: item.title,
        sportLabel: item.sportLabel,
        sportId: item.sportId,
      }))
    );

    console.log('[AthleticOS] stories count:', stories?.length);
    console.log('[AthleticOS] stories sample:', stories?.[0]);

    const allScheduleEvents = scheduleEvents.map((event) => {
      const mapped = mapScheduleEventToHomeEventItem(
        event,
        mergedSchoolConfig.scheduleUrl,
        sportsData
      );

      return {
        ...mapped,
        date: formatDate(mapped.rawDate),
      };
    });

    const recent = filterRecentResultEvents(allScheduleEvents).slice(0, 10);
    const upcoming = filterUpcomingWeekEvents(allScheduleEvents).slice(0, 10);
    const nextGame = upcoming[0] ?? null;
    const nextVideoItems = await fetchYoutubePlaylistVideos(videosConfig);
    const resolvedModules = getResolvedHomeModules(moduleConfig);
    const nextGalleryItems = resolvedModules.some(
      (module) => normalizeModuleKey(module.module_key) === 'galleries'
    )
      ? await fetchGalleryItems(mergedSchoolConfig.mainSiteUrl)
      : [];

    console.log('[AthleticOS] upcomingGames:', upcoming?.length);
    console.log('[AthleticOS] recentResults:', recent?.length);
    console.log('[AthleticOS] nextGame:', nextGame);
    console.log('[AthleticOS] sponsors:', sponsorConfig);

    const sportConfigById = new Map(
      sportAppConfig
        .map((config) => {
          const sportId =
            config.sport_id === undefined || config.sport_id === null
              ? ''
              : String(config.sport_id);
          return sportId ? [sportId, config] : null;
        })
        .filter(Boolean) as [string, AthleticOSSportAppConfig][]
    );

    const orderedHomeSports = resolvedSports
      .map(({ sport, record }, index) => {
        const config = record?.id ? sportConfigById.get(String(record.id)) : undefined;

        return {
          sport,
          index,
          sortOrder: getSafeSortOrder(config?.sort_order ?? index),
          isVisible: config?.is_visible !== false,
        };
      })
      .filter((item) => item.isVisible)
      .sort((a, b) => {
        const orderDiff = a.sortOrder - b.sortOrder;
        if (orderDiff !== 0) {
          return orderDiff;
        }

        return a.index - b.index;
      })
      .map((item) => item.sport);

    const nextFollowableSports = sportsData
      .map((sport) => {
        const id =
          typeof sport.slug === 'string' && sport.slug.trim()
            ? sport.slug.trim()
            : typeof sport.id === 'string' || typeof sport.id === 'number'
            ? String(sport.id)
            : '';
        const label =
          typeof sport.name === 'string' && sport.name.trim() ? sport.name.trim() : '';

        return id && label ? ({ id, label } satisfies FollowableSport) : null;
      })
      .filter(Boolean) as FollowableSport[];

    setNewsItems(news.slice(0, 8));
    setAllNewsItems(news);
    setGalleryItems(nextGalleryItems);
    setRecentEvents(recent);
    setUpcomingEvents(upcoming);
    setAllEvents(allScheduleEvents);
    setSchoolConfig(mergedSchoolConfig);
    setSchoolAccentColor(nextSchoolAccentColor);
    setHomeModules(moduleConfig);
    setBottomNavItems(nextBottomNavItems);
    setAppThemeConfig(mergedThemeConfig);
    setLiveCoverageConfig(nextLiveCoverageConfig);
    setPromotionCard(nextPromotionCard);
    setAthleteOfWeek(nextAthleteOfWeek);
    setSponsorPlacements(sponsorConfig);
    setVideoItems(nextVideoItems);
    setFollowableSports(nextFollowableSports);
    setHomeSports(orderedHomeSports.length > 0 ? orderedHomeSports : SPORTS);
  } catch (error) {
    console.log('Home feed load error:', error);
    setHomeModules([]);
    setBottomNavItems([]);
    setAppThemeConfig(null);
    setLiveCoverageConfig(null);
    setPromotionCard(null);
    setAthleteOfWeek(null);
    setSponsorPlacements([]);
    setHomeSports(SPORTS);
    setFollowableSports([]);
    setNewsItems([]);
    setAllNewsItems([]);
    setVideoItems([]);
    setGalleryItems([]);
    setRecentEvents([]);
    setUpcomingEvents([]);
    setAllEvents([]);
    setSchoolAccentColor(BRAND.primary);
  } finally {
    setNewsLoading(false);
    setEventsLoading(false);
  }
};

  useEffect(() => {
    if (!schoolLookupComplete) {
      return;
    }

    loadHomeFeeds();
  }, [defaultSchoolConfig, resolvedSchoolId, schoolLookupComplete, schoolSlug]);

  useEffect(() => {
    const loadSavedPreferences = async () => {
      try {
        const savedTeams = await AsyncStorage.getItem(STORAGE_KEYS.followedTeams);
        if (savedTeams) {
          setFollowedTeams(JSON.parse(savedTeams));
        }

        const savedEnabled = await AsyncStorage.getItem(STORAGE_KEYS.notificationsEnabled);
        const savedDismissed = await AsyncStorage.getItem(
          STORAGE_KEYS.notificationsPromptDismissed
        );
        const savedAutoPlayVideo = await AsyncStorage.getItem(
          STORAGE_KEYS.autoPlayVideo
        );
        const savedUseLocalTimezone = await AsyncStorage.getItem(
          STORAGE_KEYS.useLocalTimezone
        );
        const savedThemeMode = await AsyncStorage.getItem(STORAGE_KEYS.themeMode);

        if (savedEnabled === 'true') {
          setNotificationsEnabled(true);
          setShowNotificationPrompt(false);
        } else {
          setShowNotificationPrompt(savedDismissed === 'true' ? false : true);
        }

        if (savedAutoPlayVideo === 'true') {
          setAutoPlayVideo(true);
        }

        if (savedUseLocalTimezone === 'false') {
          setUseLocalTimezone(false);
        }

        if (savedThemeMode === 'light' || savedThemeMode === 'dark') {
          setThemeMode(savedThemeMode);
        }
      } catch (error) {
        console.log('Preference load error:', error);
      }
    };

    loadSavedPreferences();
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadRoster() {
      if (!resolvedSchoolId || !selectedRosterSportId) {
        if (mounted) {
          setRosterItems([]);
          setRosterLoading(false);
        }
        return;
      }

      try {
        setRosterLoading(true);
        const nextRoster = await getRosterBySchoolIdAndSportId(
          resolvedSchoolId,
          selectedRosterSportId
        );

        if (!mounted) {
          return;
        }

        setRosterItems(nextRoster);
      } catch (error) {
        console.log('Roster load error:', error);

        if (!mounted) {
          return;
        }

        setRosterItems([]);
      } finally {
        if (mounted) {
          setRosterLoading(false);
        }
      }
    }

    loadRoster();

    return () => {
      mounted = false;
    };
  }, [resolvedSchoolId, selectedRosterSportId]);

  useEffect(() => {
    if (!pushNotificationsEnabled) {
      return;
    }

    const persistNotificationState = async () => {
      try {
        setNotificationsEnabled(true);
        setShowNotificationPrompt(false);
        await AsyncStorage.setItem(STORAGE_KEYS.notificationsEnabled, 'true');
        await AsyncStorage.setItem(
          STORAGE_KEYS.notificationsPromptDismissed,
          'true'
        );
      } catch (error) {
        console.log('Notification persistence error:', error);
      }
    };

    persistNotificationState();
  }, [pushNotificationsEnabled]);

  useEffect(() => {
    if (expoPushToken) {
      console.log('Expo push token:', expoPushToken);
    }
  }, [expoPushToken]);

  useEffect(() => {
    if (!expoPushToken || !resolvedSchoolId || followedTeams.length === 0) {
      return;
    }

    let cancelled = false;

    const syncFollowedTeams = async () => {
      for (const teamId of followedTeams) {
        if (cancelled) {
          return;
        }

        await subscribeToTeam(expoPushToken, teamId, resolvedSchoolId);
      }
    };

    syncFollowedTeams();

    return () => {
      cancelled = true;
    };
  }, [expoPushToken, followedTeams, resolvedSchoolId]);

  const toggleFollowTeam = async (teamKey: string) => {
    try {
      let updated: string[];

      if (followedTeams.includes(teamKey)) {
        updated = followedTeams.filter((key) => key !== teamKey);
        if (expoPushToken) {
          await unsubscribeFromTeam(expoPushToken, teamKey);
        }
      } else {
        updated = [...followedTeams, teamKey];
        if (expoPushToken && resolvedSchoolId) {
          await subscribeToTeam(expoPushToken, teamKey, resolvedSchoolId);
        }
      }

      setFollowedTeams(updated);
      await AsyncStorage.setItem(
        STORAGE_KEYS.followedTeams,
        JSON.stringify(updated)
      );
    } catch (error) {
      console.log('Toggle follow team error:', error);
    }
  };

  const toggleAutoPlayVideoSetting = async () => {
    const nextValue = !autoPlayVideo;
    setAutoPlayVideo(nextValue);
    await AsyncStorage.setItem(STORAGE_KEYS.autoPlayVideo, String(nextValue));
  };

  const toggleUseLocalTimezoneSetting = async () => {
    const nextValue = !useLocalTimezone;
    setUseLocalTimezone(nextValue);
    await AsyncStorage.setItem(STORAGE_KEYS.useLocalTimezone, String(nextValue));
  };

  const toggleThemeModeSetting = async () => {
    const nextMode = themeMode === 'dark' ? 'light' : 'dark';
    setThemeMode(nextMode);
    await AsyncStorage.setItem(STORAGE_KEYS.themeMode, nextMode);
  };

const handleEnableNotifications = async () => {
  try {
    const token = await enablePushNotifications();

    if (!token) {
      Alert.alert(
        'Notifications Not Enabled',
        'We could not get permission for notifications on this device.'
      );
      return;
    }

    setNotificationsEnabled(true);
    setShowNotificationPrompt(false);

    await AsyncStorage.setItem(STORAGE_KEYS.notificationsEnabled, 'true');
    await AsyncStorage.setItem(
      STORAGE_KEYS.notificationsPromptDismissed,
      'true'
    );

    Alert.alert(
      'Notifications Enabled',
      'You will now get live broadcast alerts.'
    );
  } catch (error) {
    console.log('Enable notifications error:', error);
    Alert.alert(
      'Notification Error',
      'Something went wrong while enabling notifications.'
    );
  }
};

  const toggleNotificationsSetting = async () => {
    if (!notificationsEnabled) {
      await handleEnableNotifications();
      return;
    }

    setNotificationsEnabled(false);
    setShowNotificationPrompt(false);
    await AsyncStorage.setItem(STORAGE_KEYS.notificationsEnabled, 'false');
  };

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await loadHomeFeeds();
    } finally {
      setRefreshing(false);
    }
  };

  const openExternalUrl = (url: string) => {
    if (!hasResolvedUrl(url)) {
      return;
    }

    Linking.openURL(url).catch((error) => {
      console.log('External open error:', error);
    });
  };

  const openScheduleScreen = (options?: {
    events?: EventItem[];
    headerTitle?: string;
    headerSubtitle?: string;
    schoolLogoUrl?: string;
    variant?: ScheduleScreenVariant;
    accentColor?: string;
  }) => {
    setScheduleScreenEvents(options?.events ?? allEvents);
    setScheduleScreenTitle(options?.headerTitle ?? 'Schedule');
    setScheduleScreenSubtitle(options?.headerSubtitle ?? appDisplayName);
    setScheduleScreenLogoUrl(options?.schoolLogoUrl ?? schoolConfig.logoUrl);
    setScheduleScreenVariant(options?.variant ?? 'school');
    setScheduleScreenAccentColor(options?.accentColor ?? schoolAccentColor);
    setScreenMode('schedule');
  };

  const openEmbedded = (title: string, url: string) => {
    console.log('EMBED PATH HIT -> openEmbedded', { title, url });
    setEmbeddedTitle(title);
    setEmbeddedUrl(url);
    setScreenMode('embedded');
  };

  const openSport = (sport: SportType) => {
    setSelectedSport(sport);
    setScreenMode('sportDetail');
  };

  const openRosterScreen = (options: OpenRosterOptions) => {
    console.log('TEAM PAGE ROSTER TAP -> openRosterScreen', {
      sportKey: options.sport.key,
      sportId: options.sportId,
      headerTitle: options.headerTitle,
    });
    setPreviousScreenMode(screenMode);
    setSelectedRosterSport(options.sport);
    setSelectedRosterSportId(options.sportId);
    setRosterHeaderTitle(options.headerTitle);
    setRosterHeaderSubtitle(options.headerSubtitle ?? appDisplayName);
    setRosterLogoUrl(options.schoolLogoUrl ?? schoolConfig.logoUrl);
    setSelectedAthlete(null);
    setScreenMode('roster');
  };

  const handleOpenStoryDetail = (item: NewsItem) => {
    setPreviousScreenMode(screenMode);
    setSelectedStory(item);
    setScreenMode('storyDetail');
  };

  const openAthleteProfile = (athlete: AthleticOSRosterAthlete) => {
    setSelectedAthlete(athlete);
    setScreenMode('athleteProfile');
  };

  const openNewsListScreen = () => {
    setActiveTab('home');
    setScreenMode('newsList');
    setSelectedRosterSport(null);
    setSelectedRosterSportId('');
    setRosterItems([]);
    setEmbeddedTitle('');
    setEmbeddedUrl('');
    setSelectedAthlete(null);
    setSelectedStory(null);
  };

  const handleBottomNavChange = (tab: TabKey) => {
    setActiveTab(tab);
    setScreenMode('tabs');
    setSelectedRosterSport(null);
    setSelectedRosterSportId('');
    setRosterItems([]);
    setEmbeddedTitle('');
    setEmbeddedUrl('');
    setSelectedAthlete(null);
    setSelectedStory(null);
  };

  const openBottomNavUrl = (
    label: string,
    destinationValue: string,
    openInWebview: boolean
  ) => {
    const trimmedValue = destinationValue.trim();
    if (!trimmedValue) {
      return;
    }

    const resolvedUrl = hasResolvedUrl(trimmedValue)
      ? trimmedValue
      : trimmedValue.startsWith('/') && hasResolvedUrl(schoolConfig.mainSiteUrl)
      ? `${schoolConfig.mainSiteUrl.replace(/\/+$/, '')}${trimmedValue}`
      : '';

    if (!hasResolvedUrl(resolvedUrl)) {
      return;
    }

    if (openInWebview) {
      openEmbedded(label, resolvedUrl);
      return;
    }

    openExternalUrl(resolvedUrl);
  };

  const normalizeInternalBottomNavTarget = (value?: string) =>
    (value ?? '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '');

  const getDefaultBottomNavSlot = (
    slotNumber: BottomNavSlot
  ): Omit<BottomNavRenderItem, 'active'> & { activeTabKey?: TabKey } => {
    switch (slotNumber) {
      case 1:
        return {
          key: 'slot-1-media',
          label: 'Broadcast',
          icon: 'radio-outline',
          activeTabKey: 'media',
          onPress: () => handleBottomNavChange('media'),
        };
      case 2:
        return {
          key: 'slot-2-teams',
          label: 'Teams',
          icon: 'people',
          activeTabKey: 'teams',
          onPress: () => handleBottomNavChange('teams'),
        };
      case 4:
      default:
        return {
          key: 'slot-4-tickets',
          label: 'Tickets',
          icon: 'ticket-outline',
          activeTabKey: 'tickets',
          onPress: () => handleBottomNavChange('tickets'),
        };
    }
  };

  const buildConfiguredBottomNavSlot = (slotNumber: BottomNavSlot) => {
    const configuredItem = bottomNavItems.find((item) => item.slotNumber === slotNumber);
    const fallbackItem = getDefaultBottomNavSlot(slotNumber);

    if (!configuredItem || configuredItem.enabled === false) {
      return {
        ...fallbackItem,
        active:
          screenMode === 'tabs' &&
          Boolean(fallbackItem.activeTabKey) &&
          activeTab === fallbackItem.activeTabKey,
      } satisfies BottomNavRenderItem;
    }

    const destinationType = normalizeBottomNavDestinationType(configuredItem.destinationType);
    const label = configuredItem.label.trim() || fallbackItem.label;
    const icon = resolveBottomNavIcon(configuredItem.iconKey || fallbackItem.icon);
    let active = false;
    let onPress: () => void = fallbackItem.onPress;

    switch (destinationType) {
      case 'teams':
        active = screenMode === 'tabs' && activeTab === 'teams';
        onPress = () => handleBottomNavChange('teams');
        break;
      case 'news':
        active = screenMode === 'newsList';
        onPress = openNewsListScreen;
        break;
      case 'broadcast_audio':
      case 'broadcast_video':
      case 'media':
        active = screenMode === 'tabs' && activeTab === 'media';
        onPress = () => handleBottomNavChange('media');
        break;
      case 'all_schedules':
        onPress = () =>
          openScheduleScreen({
            headerTitle: 'Schedule',
            headerSubtitle: appDisplayName,
            schoolLogoUrl: schoolConfig.logoUrl,
          });
        break;
      case 'tickets_url':
        if (hasResolvedUrl(configuredItem.destinationValue)) {
          onPress = () =>
            openBottomNavUrl(label, configuredItem.destinationValue, configuredItem.openInWebview);
        } else {
          active = activeTab === 'tickets';
          onPress = () => handleBottomNavChange('tickets');
        }
        break;
      case 'external_url':
      case 'custom_page':
        if (normalizeInternalBottomNavTarget(configuredItem.destinationValue) === 'newslist') {
          active = screenMode === 'newsList';
          onPress = openNewsListScreen;
        } else {
          onPress = () =>
            openBottomNavUrl(
              label,
              configuredItem.destinationValue,
              configuredItem.openInWebview
            );
        }
        break;
      default:
        active =
          screenMode === 'tabs' &&
          Boolean(fallbackItem.activeTabKey) &&
          activeTab === fallbackItem.activeTabKey;
        onPress = fallbackItem.onPress;
        break;
    }

    return {
      key: `slot-${slotNumber}`,
      label,
      icon,
      onPress,
      active,
    } satisfies BottomNavRenderItem;
  };

  const bottomNavRenderItems = [
    buildConfiguredBottomNavSlot(1),
    buildConfiguredBottomNavSlot(2),
    {
      key: 'home',
      label: 'Home',
      onPress: () => handleBottomNavChange('home'),
      active: screenMode === 'tabs' && activeTab === 'home',
    },
    buildConfiguredBottomNavSlot(4),
    {
      key: 'more',
      label: 'More',
      icon: 'ellipsis-horizontal',
      onPress: () => handleBottomNavChange('more'),
      active: screenMode === 'tabs' && activeTab === 'more',
    },
  ] satisfies BottomNavRenderItem[];

  const closeSpecialScreen = () => {
    setScreenMode('tabs');
    setScheduleScreenEvents([]);
    setScheduleScreenTitle('Schedule');
    setScheduleScreenSubtitle('');
    setScheduleScreenLogoUrl('');
    setScheduleScreenVariant('school');
    setScheduleScreenAccentColor(schoolAccentColor);
    setSelectedRosterSport(null);
    setSelectedRosterSportId('');
    setRosterItems([]);
    setSelectedAthlete(null);
    setEmbeddedTitle('');
    setEmbeddedUrl('');
    setSelectedStory(null);
  };

  const closeStoryDetail = () => {
    setScreenMode(previousScreenMode);
    setSelectedStory(null);
  };

  const closeRosterScreen = () => {
    setScreenMode(previousScreenMode);
    setSelectedAthlete(null);
  };

  const closeAthleteProfile = () => {
    setScreenMode('roster');
  };

  const toggleAudio = async () => {
  try {
    if (!hasListenUrl) {
      Alert.alert('Audio Unavailable', 'No live audio stream is configured.');
      return;
    }

    if (isPlaying) {
      await player.pause();

      if (Platform.OS === 'android') {
        player.setActiveForLockScreen(false);
      }

      return;
    }

    setAudioPlayerVisible(true);

    if (Platform.OS === 'android') {
      player.setActiveForLockScreen(true, {
        title: appDisplayName,
        artist: 'AthleticOS',
        albumTitle: 'Live Stream',
      });
    }

    await player.play();
  } catch (error) {
    console.log('Audio toggle error:', error);
    Alert.alert('Audio Error', 'Could not start the stream.');
  }
};

if (showLaunchSplash) {
  return (
    <LaunchSplash
      splashBackgroundUrl={schoolConfig.splashBackgroundUrl}
      splashLogoUrl={schoolConfig.splashLogoUrl}
      schoolDisplayName={schoolConfig.displayName}
    />
  );
}

if (!prerollDecisionComplete) {
  return (
    <LaunchSplash
      splashBackgroundUrl={schoolConfig.splashBackgroundUrl}
      splashLogoUrl={schoolConfig.splashLogoUrl}
      schoolDisplayName={schoolConfig.displayName}
    />
  );
}

if (showPreroll && prerollConfig) {
  return (
    <AppPrerollScreen
      config={prerollConfig}
      onComplete={() => {
        setShowPreroll(false);
      }}
    />
  );
}

  let mainContent: React.ReactNode = null;

  if (screenMode === 'embedded' && embeddedUrl) {
    mainContent = (
      <EmbeddedWebView
        url={embeddedUrl}
        headerTitle={embeddedTitle}
        onBack={closeSpecialScreen}
      />
    );
  } else if (screenMode === 'newsList') {
    mainContent = (
      <NewsListScreen
        newsItems={allNewsItems}
        loading={newsLoading}
        onBack={closeSpecialScreen}
        onOpenStoryDetail={handleOpenStoryDetail}
        schoolDisplayName={appDisplayName}
        mascotName={schoolConfig.mascotName}
        schoolLogoUrl={schoolConfig.logoUrl}
        theme={resolvedTheme}
      />
    );
  } else if (screenMode === 'storyDetail' && selectedStory) {
    mainContent = (
      <StoryDetailScreen item={selectedStory} onBack={closeStoryDetail} theme={resolvedTheme} />
    );
  } else if (screenMode === 'roster' && selectedRosterSport) {
    mainContent = (
      <RosterScreen
        athletes={rosterItems}
        loading={rosterLoading}
        onBack={closeRosterScreen}
        onOpenAthlete={openAthleteProfile}
        headerTitle={rosterHeaderTitle}
        headerSubtitle={rosterHeaderSubtitle || appDisplayName}
        schoolLogoUrl={rosterLogoUrl || schoolConfig.logoUrl}
        theme={resolvedTheme}
      />
    );
  } else if (screenMode === 'athleteProfile' && selectedAthlete) {
    mainContent = (
      <AthleteProfileScreen
        athlete={selectedAthlete}
        onBack={closeAthleteProfile}
        theme={resolvedTheme}
      />
    );
  } else if (screenMode === 'manageTeams') {
    mainContent = (
      <ManageTeamsScreen
        onBack={closeSpecialScreen}
        sports={followableSports}
        followedTeams={followedTeams}
        onToggleFollowTeam={toggleFollowTeam}
        themeMode={themeMode}
      />
    );
  } else if (screenMode === 'settings') {
    mainContent = (
      <SettingsScreen
        onBack={closeSpecialScreen}
        notificationsEnabled={notificationsEnabled}
        onToggleNotifications={toggleNotificationsSetting}
        autoPlayVideo={autoPlayVideo}
        onToggleAutoPlayVideo={toggleAutoPlayVideoSetting}
        useLocalTimezone={useLocalTimezone}
        onToggleUseLocalTimezone={toggleUseLocalTimezoneSetting}
        themeMode={themeMode}
        onToggleThemeMode={toggleThemeModeSetting}
        onOpenManageTeams={() => setScreenMode('manageTeams')}
      />
    );
  } else if (screenMode === 'savedEvents') {
    mainContent = (
      <SavedEventsScreen onBack={closeSpecialScreen} themeMode={themeMode} />
    );
  } else if (screenMode === 'schedule') {
    mainContent = (
      <ScheduleScreen
        scheduleEvents={scheduleScreenEvents.length > 0 ? scheduleScreenEvents : allEvents}
        eventsLoading={eventsLoading}
        onBack={closeSpecialScreen}
        headerTitle={scheduleScreenTitle}
        headerSubtitle={scheduleScreenSubtitle || appDisplayName}
        schoolLogoUrl={scheduleScreenLogoUrl || schoolConfig.logoUrl}
        schoolId={resolvedSchoolId}
        variant={scheduleScreenVariant}
        accentColor={scheduleScreenAccentColor}
        theme={resolvedTheme}
      />
    );
  } else if (screenMode === 'sportDetail' && selectedSport) {
    mainContent = (
      <SportDetailScreen
        sport={selectedSport}
        schoolId={resolvedSchoolId}
        schoolSlug={schoolSlug}
        schoolConfig={schoolConfig}
        scheduleAccentColor={schoolAccentColor}
        onBack={closeSpecialScreen}
        onOpenEmbedded={openEmbedded}
        onOpenRoster={openRosterScreen}
        onOpenSchedule={openScheduleScreen}
        onOpenStoryDetail={handleOpenStoryDetail}
        followedTeams={followedTeams}
        onToggleFollowTeam={toggleFollowTeam}
        theme={resolvedTheme}
      />
    );
  } else {
    mainContent = (
      <>
        {activeTab === 'home' ? (
          <HomeScreen
            onOpenEmbedded={openEmbedded}
            onOpenStoryDetail={handleOpenStoryDetail}
            onOpenExternal={openExternalUrl}
            onOpenSchedule={openScheduleScreen}
            onOpenSport={openSport}
            onToggleAudio={toggleAudio}
            onGoToMedia={() => setActiveTab('media')}
            newsItems={newsItems}
            newsLoading={newsLoading}
            recentEvents={recentEvents}
            upcomingEvents={upcomingEvents}
            eventsLoading={eventsLoading}
            onRefresh={onRefresh}
            refreshing={refreshing}
            showNotificationPrompt={showNotificationPrompt}
            notificationsEnabled={notificationsEnabled}
            onEnableNotifications={handleEnableNotifications}
            onDismissNotificationPrompt={async () => {
              setShowNotificationPrompt(false);
              await AsyncStorage.setItem(
                STORAGE_KEYS.notificationsPromptDismissed,
                'true'
              );
            }}
            liveStatus={liveStatus}
            schoolConfig={schoolConfig}
            appDisplayName={appDisplayName}
            homeModules={homeModules}
            liveCoverageConfig={liveCoverageConfig}
            promotionCard={promotionCard}
            athleteOfWeek={athleteOfWeek}
            sponsorPlacements={sponsorPlacements}
            videoItems={videoItems}
            galleryItems={galleryItems}
            homeSports={homeSports}
            scheduleAvailable={eventsLoading || allEvents.length > 0}
            theme={resolvedTheme}
          />
        ) : null}

        {activeTab === 'teams' ? (
          <TeamsScreen
            onOpenSport={openSport}
            schoolDisplayName={appDisplayName}
            mascotName={schoolConfig.mascotName}
            schoolLogoUrl={schoolConfig.logoUrl}
            themeMode={themeMode}
            theme={resolvedTheme}
          />
        ) : null}

        {activeTab === 'media' ? (
          <MediaScreen
            onOpenEmbedded={openEmbedded}
            onOpenExternal={openExternalUrl}
            onOpenSchedule={openScheduleScreen}
            onToggleAudio={toggleAudio}
            watchUrl={schoolConfig.watchUrl}
            listenUrl={schoolConfig.listenUrl}
            scheduleUrl={schoolConfig.scheduleUrl}
            mainSiteUrl={schoolConfig.mainSiteUrl}
            displayName={appDisplayName}
            mascotName={schoolConfig.mascotName}
            schoolLogoUrl={schoolConfig.logoUrl}
            isAudioPlaying={isPlaying}
            liveStatus={liveStatus}
            themeMode={themeMode}
            scheduleAvailable={eventsLoading || allEvents.length > 0}
            theme={resolvedTheme}
          />
        ) : null}

        {activeTab === 'tickets' ? (
          <TicketsScreen
            onOpenEmbedded={openEmbedded}
            ticketsUrl={schoolConfig.ticketsUrl}
            themeMode={themeMode}
          />
        ) : null}

      {activeTab === 'more' ? (
  <MoreScreen
    schoolConfig={schoolConfig}
    followedTeamsCount={followedTeams.length}
    scheduleAvailable={eventsLoading || allEvents.length > 0}
    themeMode={themeMode}
    onOpenManageTeams={() => setScreenMode('manageTeams')}
    onOpenSettings={() => setScreenMode('settings')}
    onOpenSavedEvents={() => setScreenMode('savedEvents')}
    onOpenSchedule={openScheduleScreen}
    onOpenEmbedded={openEmbedded}
  />
) : null}
      </>
    );
  }

  return (
    <SafeAreaView style={[styles.appShell, themeMode === 'light' ? styles.appShellLight : null]}>
      <StatusBar barStyle="light-content" />
      <View style={styles.appContent}>{mainContent}</View>

      <AudioMiniPlayer
        isPlaying={isPlaying}
        isLoading={isLoading}
        title={appDisplayName}
        enabled={audioPlayerVisible && hasListenUrl}
        onToggle={toggleAudio}
      />
      <BottomNav
        items={bottomNavRenderItems}
        themeMode={themeMode}
        centerLogoUrl={schoolConfig.logoUrl}
        theme={resolvedTheme}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  appShell: {
    flex: 1,
    backgroundColor: BRAND.background,
  },

  appContent: {
    flex: 1,
  },

  appShellLight: {
    backgroundColor: '#F5F7FB',
  },

  prerollScreen: {
    flex: 1,
    backgroundColor: BRAND.black,
  },

  prerollVideo: {
    ...StyleSheet.absoluteFillObject,
  },

  prerollOverlay: {
    ...StyleSheet.absoluteFillObject,
  },

  prerollSafeArea: {
    flex: 1,
    backgroundColor: BRAND.black,
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 28,
  },

  prerollTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },

  prerollSponsorWrap: {
    maxWidth: '72%',
  },

  prerollSponsorEyebrow: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },

  prerollSponsorLogo: {
    width: 132,
    height: 42,
  },

  prerollSponsorName: {
    color: BRAND.white,
    fontSize: 16,
    fontWeight: '800',
  },

  prerollSkipButton: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },

  prerollSkipButtonText: {
    color: BRAND.white,
    fontSize: 13,
    fontWeight: '800',
  },

  prerollTapHint: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 11,
    backgroundColor: 'rgba(0,0,0,0.58)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },

  prerollTapHintText: {
    color: BRAND.white,
    fontSize: 14,
    fontWeight: '800',
    marginRight: 6,
  },

  screen: {
    flex: 1,
    backgroundColor: BRAND.background,
  },

  screenLight: {
    backgroundColor: '#F5F7FB',
  },

  screenContent: {
    flexGrow: 1,
    paddingBottom: 28,
    backgroundColor: BRAND.background,
  },

  screenContentLight: {
    backgroundColor: '#F5F7FB',
  },

  loadingWrap: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },

  flashContainer: {
  flex: 1,
  backgroundColor: '#050505',
  justifyContent: 'space-between',
},

  flashTopStripeWrap: {
    flexDirection: 'row',
    height: 16,
  },

  flashTopStripeBlack: {
    flex: 1,
    backgroundColor: BRAND.black,
  },

  flashTopStripeRed: {
    width: 120,
    backgroundColor: BRAND.primary,
  },

  flashCenterArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  flashShadowLong: {
  position: 'absolute',
  width: 320,
  height: 320,
  borderRadius: 999,
  backgroundColor: BRAND.primary,
  opacity: 0.18,
},

  flashLogoPlate: {
  width: 210,
  height: 210,
  borderRadius: 999,
  backgroundColor: 'rgba(255,255,255,0.04)',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.08)',
  alignItems: 'center',
  justifyContent: 'center',
},

  flashMainLogo: {
    width: 280,
    height: 280,
  },

  flashBottomBranding: {
  paddingHorizontal: 24,
  paddingBottom: 44,
  alignItems: 'center',
  marginTop: -65, // 👈 moves logo UP
},

splashSponsorText: {
  color: '#FFFFFF',
  fontSize: 35,
  marginTop: 8,
  marginBottom: 4,
  opacity: 0.85,
},

splashSponsorLogo: {
  width: 580,
  height: 168,
  marginTop: -20, // 👈 THIS moves it UP
},

  flashWSNLogo: {
    width: 440,
    height: 106,
    marginBottom: 100,
  },

  flashBottomSub: {
  color: BRAND.lightGray,
  fontSize: 13,
  fontWeight: '700',
  letterSpacing: 0.6,
  textTransform: 'uppercase',
},

  homeHeader: {
    paddingTop: 8,
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
    position: 'relative',
  },

  heroBackdropGlow: {
    position: 'absolute',
    top: -36,
    right: -28,
    width: 180,
    height: 180,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },

  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 12,
  },

  teamLogoBox: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },

  headerTeamLogo: {
    width: 44,
    height: 44,
  },

  headerTitleWrap: {
    flex: 1,
  },

  appTitle: {
    color: BRAND.white,
    fontSize: 25,
    fontWeight: '900',
    letterSpacing: 0.2,
  },

  appSubtitle: {
    color: 'rgba(217,223,234,0.78)',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },

  heroSponsorInlineText: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 3,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },

  heroSponsorLogoWrap: {
    width: 96,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  heroSponsorLogo: {
    width: '100%',
    height: '100%',
  },

  heroButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 0,
  },

  heroButtonRowCompact: {
    gap: 8,
  },

  topIconWrap: {
    flex: 1,
    alignItems: 'center',
  },

  topIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    shadowColor: BRAND.black,
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },

  topIconLabel: {
    color: BRAND.white,
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 1,
  },

  promotionCard: {
    marginHorizontal: 16,
    minHeight: 248,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: BRAND.surface,
    borderWidth: 1,
    borderColor: BRAND.border,
  },

  promotionCardImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },

  promotionCardOverlay: {
    ...StyleSheet.absoluteFillObject,
  },

  promotionCardContent: {
    minHeight: 248,
    justifyContent: 'flex-end',
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 18,
  },

  promotionPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },

  promotionPillText: {
    color: BRAND.white,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },

  promotionCardTitle: {
    color: BRAND.white,
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '900',
  },

  promotionCardSubtitle: {
    color: '#E5E7EB',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    marginTop: 8,
  },

  promotionCardButton: {
    alignSelf: 'flex-start',
    marginTop: 16,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: BRAND.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  promotionCardButtonText: {
    color: BRAND.white,
    fontSize: 13,
    fontWeight: '800',
  },

  athleteOfWeekCard: {
    marginHorizontal: 16,
    minHeight: 248,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: BRAND.surface,
    borderWidth: 1,
    borderColor: BRAND.border,
  },

  athleteOfWeekImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },

  athleteOfWeekOverlay: {
    ...StyleSheet.absoluteFillObject,
  },

  athleteOfWeekContent: {
    minHeight: 248,
    justifyContent: 'flex-end',
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 18,
  },

  athleteOfWeekTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  athleteOfWeekSponsorText: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 12,
    flexShrink: 1,
    textAlign: 'right',
  },

  athleteOfWeekName: {
    color: BRAND.lightGray,
    fontSize: 14,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: 8,
  },

  athleteOfWeekTitle: {
    color: BRAND.white,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '900',
  },

  athleteOfWeekSubtitle: {
    color: '#E5E7EB',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    marginTop: 8,
  },

  athleteOfWeekButton: {
    alignSelf: 'flex-start',
    marginTop: 16,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: BRAND.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  athleteOfWeekButtonText: {
    color: BRAND.white,
    fontSize: 13,
    fontWeight: '800',
  },

  liveNowCard: {
    marginTop: 12,
    marginHorizontal: 16,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: BRAND.surface,
    borderWidth: 1,
    borderColor: BRAND.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  liveNowLeft: {
    flex: 1,
    paddingRight: 10,
  },

  liveNowEyebrow: {
    color: BRAND.red,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 2,
  },

  liveNowTitle: {
    color: BRAND.white,
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 2,
  },

  liveNowText: {
    color: 'rgba(170,178,197,0.82)',
    fontSize: 11,
    lineHeight: 16,
  },

  liveBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(158,27,48,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(158,27,48,0.35)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: BRAND.primary,
    marginRight: 6,
  },

  liveBadgeText: {
    color: BRAND.white,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  notificationSignupCard: {
    marginTop: 12,
    marginHorizontal: 16,
    borderRadius: 18,
    backgroundColor: BRAND.surface,
    borderWidth: 1,
    borderColor: BRAND.border,
    padding: 14,
  },

  flashBackgroundImage: {
  flex: 1,
  width: '100%',
  height: '100%',
},

flashBackgroundImageInner: {
  opacity: 1,
},

flashOverlay: {
  ...StyleSheet.absoluteFillObject,
  backgroundColor: 'rgba(0,0,0,0.18)',
},

  notificationTextWrap: {
    marginBottom: 14,
  },

  notificationSignupTitle: {
    color: BRAND.white,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },

  notificationSignupText: {
    color: BRAND.gray,
    fontSize: 14,
    lineHeight: 18,
  },

  notificationButtonRow: {
    flexDirection: 'row',
  },

  notificationPrimaryButton: {
    backgroundColor: BRAND.primary,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
    marginRight: 10,
  },

  notificationPrimaryButtonText: {
    color: BRAND.white,
    fontSize: 13,
    fontWeight: '800',
  },

  notificationSecondaryButton: {
    backgroundColor: BRAND.surfaceAlt,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: BRAND.border,
  },

  notificationSecondaryButtonText: {
    color: BRAND.white,
    fontSize: 13,
    fontWeight: '700',
  },

  notificationEnabledBar: {
    marginTop: 12,
    marginHorizontal: 16,
    borderRadius: 16,
    backgroundColor: BRAND.primaryDark,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },

  notificationEnabledText: {
    color: BRAND.white,
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
  },

  sectionHeader: {
    marginTop: 24,
    marginBottom: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  sectionHeaderTightTop: {
    marginTop: 16,
  },

  bannerWrap: {
  marginTop: 8,
  marginBottom: 0,
  marginHorizontal: 16,
  borderRadius: 10,
  overflow: 'hidden',
},

bannerImage: {
  width: '100%',
  height: 80,
},

  sectionTitle: {
    color: BRAND.white,
    fontSize: 20,
    fontWeight: '900',
  },

  sectionAction: {
    color: BRAND.primary,
    fontSize: 13,
    fontWeight: '800',
  },

  featuredStoryCard: {
    marginHorizontal: 16,
    height: 240,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: BRAND.surface,
    borderWidth: 1,
    borderColor: BRAND.border,
  },

  featuredStoryImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },

  featuredStoryOverlay: {
    ...StyleSheet.absoluteFillObject,
  },

  featuredStoryContent: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
  },

  storyCarouselRow: {
    paddingLeft: 16,
    paddingRight: 6,
  },

  storyCarouselCard: {
    width: 308,
    height: 224,
    marginRight: 12,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: BRAND.surface,
    borderWidth: 1,
    borderColor: BRAND.border,
  },

  storyCarouselImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },

  storyCarouselOverlay: {
    ...StyleSheet.absoluteFillObject,
  },

  storyCarouselContent: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 14,
  },

  storyCarouselMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },

  storyCarouselMeta: {
    color: '#E5E7EB',
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 12,
    flexShrink: 1,
    textAlign: 'right',
  },

  storyCarouselTitle: {
    color: BRAND.white,
    fontSize: 21,
    lineHeight: 27,
    fontWeight: '900',
  },

  videoCarouselRow: {
    paddingLeft: 16,
    paddingRight: 6,
  },

  videoCarouselCard: {
    width: 286,
    height: 190,
    marginRight: 12,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: BRAND.surface,
    borderWidth: 1,
    borderColor: BRAND.border,
  },

  videoCarouselImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },

  videoCarouselOverlay: {
    ...StyleSheet.absoluteFillObject,
  },

  videoPlayBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  videoCarouselContent: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
  },

  videoCarouselMeta: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
  },

  videoCarouselTitle: {
    color: BRAND.white,
    fontSize: 19,
    lineHeight: 24,
    fontWeight: '900',
  },

  galleryCarouselRow: {
    paddingLeft: 16,
    paddingRight: 6,
  },

  galleryCarouselCard: {
    width: 300,
    height: 208,
    marginRight: 12,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: BRAND.surface,
    borderWidth: 1,
    borderColor: BRAND.border,
  },

  galleryCarouselImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },

  galleryCarouselOverlay: {
    ...StyleSheet.absoluteFillObject,
  },

  galleryCarouselContent: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
  },

  galleryCarouselMeta: {
    color: '#E5E7EB',
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 8,
  },

  galleryCarouselTitle: {
    color: BRAND.white,
    fontSize: 21,
    lineHeight: 27,
    fontWeight: '900',
  },

  sponsorCarouselRow: {
    paddingLeft: 16,
    paddingRight: 6,
  },

  sponsorCarouselCard: {
    width: SPONSOR_CAROUSEL_CARD_WIDTH,
    minHeight: 98,
    marginRight: SPONSOR_CAROUSEL_CARD_GAP,
    borderRadius: 22,
    backgroundColor: '#1B2438',
    borderWidth: 1,
    borderColor: '#34415F',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOpacity: 0.14,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },

  sponsorCarouselCardContent: {
    minHeight: 98,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  promotionModuleBottomSpacing: {
    marginBottom: 8,
  },

  sponsorCarouselLogoWrap: {
    width: '100%',
    minHeight: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },

  sponsorCarouselLogo: {
    width: '94%',
    maxWidth: 208,
    height: 70,
  },

  sponsorCarouselName: {
    color: BRAND.white,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '800',
    textAlign: 'center',
  },

  featuredPill: {
    alignSelf: 'flex-start',
    backgroundColor: BRAND.primary,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 10,
  },

  featuredPillText: {
    color: BRAND.white,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },

  featuredStoryTitle: {
    color: BRAND.white,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '900',
    marginBottom: 6,
  },

  featuredStoryMeta: {
    color: '#E5E7EB',
    fontSize: 13,
    fontWeight: '600',
  },

  storyDetailHero: {
    paddingTop: 16,
    paddingBottom: 28,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
  },

  storyDetailBackButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 26,
    backgroundColor: 'rgba(255,255,255,0.09)',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },

  storyDetailHeroContent: {
    maxWidth: '88%',
  },

  storyDetailKicker: {
    color: BRAND.lightGray,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.1,
    marginBottom: 8,
  },

  storyDetailTitle: {
    color: BRAND.white,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '900',
    marginTop: 10,
  },

  storyDetailDate: {
    color: 'rgba(217,223,234,0.8)',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  storyDetailImage: {
    width: '100%',
    aspectRatio: 16 / 9,
  },

  storyDetailArticlePanel: {
    marginHorizontal: 16,
    marginTop: 18,
    backgroundColor: '#171F34',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 22,
  },

  storyDetailBody: {
    color: BRAND.lightGray,
    fontSize: 16,
    lineHeight: 28,
  },

  eventsRow: {
    paddingLeft: 16,
    paddingRight: 6,
  },

  eventCard: {
    width: 240,
    minHeight: 156,
    borderRadius: 22,
    backgroundColor: BRAND.surface,
    borderWidth: 1,
    borderColor: BRAND.border,
    padding: 16,
    marginRight: 12,
  },

  resultEventCard: {
    minHeight: 0,
    paddingVertical: 14,
  },

  liveNowCardLive: {
  borderColor: 'rgba(239,68,68,0.45)',
  shadowColor: '#ef4444',
  shadowOpacity: 0.3,
  shadowRadius: 14,
  elevation: 8,
},

  eventTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
    alignItems: 'center',
  },

  eventSportTag: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  liveNowCTA: {
  flexDirection: 'row',
  alignItems: 'center',
  marginTop: 10,
},

liveNowCTAText: {
  color: BRAND.red,
  fontSize: 12,
  fontWeight: '800',
  marginRight: 4,
},

  eventSportTagText: {
    color: BRAND.white,
    fontSize: 11,
    fontWeight: '800',
  },

  eventTitle: {
    color: BRAND.white,
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 23,
    marginBottom: 10,
  },

  eventMeta: {
    color: BRAND.lightGray,
    fontSize: 14,
    fontWeight: '700',
  },

  eventMetaSecondary: {
    color: BRAND.gray,
    fontSize: 13,
    marginTop: 5,
  },

  liveNowRight: {
  justifyContent: 'center',
  alignItems: 'flex-end',
},

heroStatusPill: {
  minWidth: 118,
  borderRadius: 999,
  paddingHorizontal: 9,
  paddingVertical: 7,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  alignSelf: 'center',
},

pulseDot: {
  width: 8,
  height: 8,
  borderRadius: 999,
  backgroundColor: '#ef4444',
  marginRight: 8,
},

heroStatusPillLive: {
  backgroundColor: 'rgba(239,68,68,0.18)',
  borderWidth: 1,
  borderColor: 'rgba(239,68,68,0.45)',
},

heroStatusPillOff: {
  backgroundColor: BRAND.surfaceAlt,
  borderWidth: 1,
  borderColor: BRAND.border,
},

heroStatusIcon: {
  marginRight: 5,
},

heroStatusText: {
  color: BRAND.white,
  fontSize: 11,
  fontWeight: '800',
},

  teamsGrid: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  teamTile: {
    width: '48%',
    marginBottom: 12,
  },

  teamTileInner: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BRAND.border,
    padding: 16,
    minHeight: 116,
    justifyContent: 'space-between',
  },

  teamTileTitle: {
    color: BRAND.white,
    fontSize: 17,
    fontWeight: '800',
  },

  teamTileSub: {
    color: BRAND.gray,
    fontSize: 13,
    marginTop: 6,
  },

  teamTileArrowWrap: {
    alignSelf: 'flex-start',
    marginTop: 10,
    backgroundColor: BRAND.primary,
    width: 30,
    height: 30,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },

  newsList: {
    paddingHorizontal: 16,
  },

  newsCard: {
    backgroundColor: BRAND.surface,
    borderWidth: 1,
    borderColor: BRAND.border,
    borderRadius: 20,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

  newsThumb: {
    width: 72,
    height: 72,
    borderRadius: 16,
    marginRight: 12,
    backgroundColor: BRAND.surfaceAlt,
  },

  newsThumbFallback: {
    width: 72,
    height: 72,
    borderRadius: 16,
    marginRight: 12,
    backgroundColor: BRAND.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
  },

  newsThumbWide: {
    width: 128,
    height: 72,
    borderRadius: 16,
    marginRight: 12,
    backgroundColor: BRAND.surfaceAlt,
    alignSelf: 'flex-start',
  },

  newsThumbFallbackWide: {
    width: 128,
    height: 72,
    borderRadius: 16,
    marginRight: 12,
    backgroundColor: BRAND.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },

  newsCardBody: {
    flex: 1,
  },

  newsCardTitle: {
    color: BRAND.white,
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 21,
  },

  newsCardMeta: {
    color: BRAND.gray,
    fontSize: 13,
    marginTop: 6,
  },

  newsChevron: {
    marginLeft: 10,
  },

  sponsorCard: {
    marginTop: 24,
    marginHorizontal: 16,
    borderRadius: 24,
    backgroundColor: BRAND.primaryDark,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  sponsorTextWrap: {
    flex: 1,
    paddingRight: 12,
  },

  sponsorEyebrow: {
    color: '#F5D7DD',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 6,
  },

  sponsorTitle: {
    color: BRAND.white,
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 6,
  },

  sponsorText: {
    color: '#F3F4F6',
    fontSize: 13,
    lineHeight: 18,
  },

  sponsorLogo: {
    width: 100,
    height: 100,
    marginLeft: 10,
    alignSelf: 'center',
  },

  emptyCard: {
    marginHorizontal: 16,
    backgroundColor: BRAND.surface,
    borderWidth: 1,
    borderColor: BRAND.border,
    borderRadius: 20,
    padding: 16,
  },

  emptyTitle: {
    color: BRAND.white,
    fontSize: 15,
    fontWeight: '800',
  },

  emptyText: {
    color: BRAND.gray,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 5,
  },

  tabHero: {
    marginTop: 8,
    marginHorizontal: 16,
    marginBottom: 18,
    borderRadius: 24,
    backgroundColor: BRAND.surface,
    borderWidth: 1,
    borderColor: BRAND.border,
    padding: 18,
  },

  tabHeroLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D0D5DD',
  },

  tabHeroEyebrow: {
    color: BRAND.white,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 8,
  },

  tabHeroTitle: {
    color: BRAND.white,
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 8,
  },

  tabHeroText: {
    color: BRAND.white,
    fontSize: 14,
    lineHeight: 21,
  },

  textPrimaryLight: {
    color: '#101828',
  },

  textSecondaryLight: {
    color: '#475467',
  },

  teamsScreenBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 320,
  },

  teamsHubHero: {
    marginTop: 8,
    marginHorizontal: 16,
    marginBottom: 18,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 20,
    paddingVertical: 22,
    overflow: 'hidden',
    position: 'relative',
  },

  teamsHubAccentRail: {
    position: 'absolute',
    left: 0,
    top: 16,
    bottom: 16,
    width: 4,
    borderRadius: 999,
    opacity: 0.95,
  },

  teamsHubLogo: {
    position: 'absolute',
    top: 16,
    right: 18,
    width: 108,
    height: 72,
    opacity: 0.96,
  },

  teamsHubContent: {
    maxWidth: '74%',
  },

  newsHubContent: {
    maxWidth: '76%',
    paddingTop: 28,
  },

  teamsHubEyebrow: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.35,
    marginBottom: 8,
  },

  teamsHubTitle: {
    color: BRAND.white,
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '900',
    marginBottom: 4,
    maxWidth: '92%',
  },

  teamsHubMascot: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '700',
    marginBottom: 8,
  },

  teamsHubText: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 14,
    lineHeight: 21,
    maxWidth: '96%',
  },

  teamsListPremium: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },

  teamDirectoryCard: {
    borderWidth: 1,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOpacity: 0.14,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },

  teamDirectoryAccent: {
    width: 4,
    alignSelf: 'stretch',
    borderRadius: 999,
    marginRight: 14,
  },

  teamDirectoryContent: {
    flex: 1,
    paddingRight: 12,
  },

  teamDirectoryKicker: {
    color: BRAND.lightGray,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.9,
    marginBottom: 6,
  },

  teamDirectoryTitle: {
    color: BRAND.white,
    fontSize: 19,
    lineHeight: 24,
    fontWeight: '900',
    marginBottom: 4,
  },

  teamDirectorySub: {
    color: BRAND.gray,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },

  teamDirectoryChevronWrap: {
    width: 34,
    height: 34,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  mediaActionCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.14,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },

  mediaActionAccent: {
    width: 4,
    alignSelf: 'stretch',
    borderRadius: 999,
    marginRight: 14,
  },

  mediaActionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },

  mediaActionBody: {
    flex: 1,
    paddingRight: 12,
  },

  mediaActionTitle: {
    color: BRAND.white,
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '900',
    marginBottom: 4,
  },

  mediaActionText: {
    color: 'rgba(255,255,255,0.84)',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },

  mediaActionChevronWrap: {
    width: 34,
    height: 34,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  newsArchiveList: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },

  newsArchiveCard: {
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOpacity: 0.14,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },

  newsArchiveAccent: {
    width: 4,
    alignSelf: 'stretch',
    borderRadius: 999,
    marginRight: 14,
  },

  newsArchiveThumb: {
    width: 116,
    height: 88,
    borderRadius: 18,
    marginRight: 14,
    backgroundColor: BRAND.surfaceAlt,
  },

  newsArchiveThumbFallback: {
    width: 116,
    height: 88,
    borderRadius: 18,
    marginRight: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  newsArchiveContent: {
    flex: 1,
    paddingRight: 10,
  },

  newsArchiveMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 10,
  },

  newsArchiveDate: {
    color: BRAND.lightGray,
    fontSize: 12,
    fontWeight: '700',
    flexShrink: 1,
    textAlign: 'right',
  },

  newsArchiveTitle: {
    color: BRAND.white,
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '900',
    marginBottom: 8,
  },

  newsArchiveSummary: {
    color: BRAND.gray,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
  },

  newsArchiveChevronWrap: {
    width: 34,
    height: 34,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },

  teamsList: {
    paddingHorizontal: 16,
  },

  teamListCard: {
    backgroundColor: BRAND.surface,
    borderWidth: 1,
    borderColor: BRAND.border,
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  teamListTitle: {
    color: BRAND.white,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },

  teamListSub: {
    color: BRAND.gray,
    fontSize: 13,
  },

  moreRowTextWrap: {
    flex: 1,
    paddingRight: 12,
  },

  inlineFollowButton: {
    minWidth: 92,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: BRAND.surfaceAlt,
    borderWidth: 1,
    borderColor: BRAND.border,
    alignItems: 'center',
  },

  inlineFollowButtonActive: {
    backgroundColor: BRAND.red,
    borderColor: BRAND.primary,
  },

  inlineFollowButtonText: {
    color: BRAND.white,
    fontSize: 13,
    fontWeight: '800',
  },

  settingsValueText: {
    color: BRAND.primary,
    fontSize: 13,
    fontWeight: '800',
  },

  watchPrimaryCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 22,
    backgroundColor: BRAND.primary,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },

  watchSecondaryCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 22,
    backgroundColor: BRAND.surface,
    borderWidth: 1,
    borderColor: BRAND.border,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },

  watchCardBody: {
    marginLeft: 14,
    flex: 1,
  },

  watchCardTitle: {
    color: BRAND.white,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },

  watchCardText: {
    color: '#E5E7EB',
    fontSize: 14,
    lineHeight: 20,
  },

  scheduleHero: {
    paddingTop: 16,
    paddingBottom: 18,
    paddingHorizontal: 16,
    marginBottom: 12,
  },

  scheduleHeroLogoWrap: {
    alignItems: 'center',
    marginBottom: 8,
  },

  scheduleHeroLogo: {
    width: 86,
    height: 86,
  },

  scheduleHeroTitle: {
    color: BRAND.white,
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
  },

  scheduleHeroSub: {
    color: BRAND.lightGray,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 3,
  },

  scheduleLoadingText: {
    color: BRAND.gray,
    fontSize: 14,
    marginTop: 10,
  },

  rosterList: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },

  rosterSortRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },

  rosterSortChip: {
    alignSelf: 'flex-start',
    backgroundColor: BRAND.surface,
    borderWidth: 1,
    borderColor: BRAND.border,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
  },

  rosterSortChipText: {
    color: BRAND.white,
    fontSize: 13,
    fontWeight: '800',
  },

  rosterCard: {
    backgroundColor: BRAND.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BRAND.border,
    padding: 14,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },

  rosterPhoto: {
    width: 68,
    height: 68,
    borderRadius: 18,
    backgroundColor: BRAND.surfaceAlt,
  },

  rosterPhotoFallback: {
    width: 68,
    height: 68,
    borderRadius: 18,
    backgroundColor: BRAND.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
  },

  rosterBody: {
    flex: 1,
    marginLeft: 14,
    marginRight: 10,
    justifyContent: 'center',
  },

  rosterTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },

  rosterName: {
    color: BRAND.white,
    fontSize: 18,
    fontWeight: '800',
    flex: 1,
    paddingRight: 10,
  },

  rosterNumber: {
    color: BRAND.primary,
    fontSize: 15,
    fontWeight: '900',
  },

  rosterMeta: {
    color: BRAND.lightGray,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },

  rosterMetaSecondary: {
    color: BRAND.gray,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },

  rosterProfileWrap: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 12,
  },

  rosterProfileImage: {
    width: '100%',
    aspectRatio: 4 / 5,
    borderRadius: 24,
    backgroundColor: BRAND.surfaceAlt,
    marginBottom: 16,
  },

  rosterProfileImageFallback: {
    width: '100%',
    aspectRatio: 4 / 5,
    borderRadius: 24,
    backgroundColor: BRAND.primaryDark,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  rosterProfileCard: {
    backgroundColor: '#171F34',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 20,
  },

  rosterProfileMeta: {
    color: BRAND.white,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 22,
    marginBottom: 10,
  },

  rosterProfileDetail: {
    color: BRAND.lightGray,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 4,
  },

  rosterProfileBio: {
    color: BRAND.lightGray,
    fontSize: 15,
    lineHeight: 24,
    marginTop: 12,
  },

  scheduleCard: {
    backgroundColor: BRAND.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BRAND.border,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'stretch',
  },

  scheduleCardLeft: {
    flex: 1,
    paddingRight: 10,
  },

  scheduleCardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  scheduleCardMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  scheduleSportTag: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 10,
  },

  scheduleSportTagText: {
    color: BRAND.white,
    fontSize: 12,
    fontWeight: '800',
  },

  scheduleOpponent: {
    color: BRAND.white,
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 24,
  },

  scheduleTopMetaWrap: {
    alignItems: 'flex-end',
    paddingLeft: 12,
  },

  scheduleStatusText: {
    color: BRAND.primary,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 6,
  },

  scheduleMeta: {
    color: BRAND.lightGray,
    fontSize: 14,
    fontWeight: '700',
  },

  scheduleMetaSecondary: {
    color: BRAND.gray,
    fontSize: 13,
    marginTop: 4,
  },

  scheduleScoreLine: {
    color: BRAND.white,
    fontSize: 15,
    fontWeight: '800',
    marginTop: 8,
  },

  scheduleScoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 10,
  },

  scheduleScoreValue: {
    color: BRAND.white,
    fontSize: 26,
    fontWeight: '900',
    lineHeight: 30,
  },

  scheduleScoreSeparator: {
    color: BRAND.gray,
    fontSize: 18,
    fontWeight: '800',
    marginHorizontal: 8,
  },

  scheduleOpponentLogoPlate: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: BRAND.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
    padding: 8,
  },

  scheduleOpponentLogo: {
    width: '100%',
    height: '100%',
  },

  teamScheduleCard: {
    backgroundColor: BRAND.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BRAND.border,
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },

  teamScheduleLogoColumn: {
    width: 70,
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginRight: 10,
  },

  teamScheduleLogoPlate: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: BRAND.white,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 7,
  },

  teamScheduleLogo: {
    width: '100%',
    height: '100%',
  },

  teamScheduleCenterColumn: {
    flex: 1,
    minWidth: 0,
    paddingRight: 12,
  },

  teamScheduleSportTag: {
    marginBottom: 8,
    paddingVertical: 4,
  },

  teamScheduleMatchup: {
    color: BRAND.white,
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 22,
  },

  teamScheduleStatus: {
    color: BRAND.lightGray,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginTop: 6,
  },

  teamScheduleScore: {
    color: BRAND.white,
    fontSize: 20,
    fontWeight: '900',
    marginTop: 6,
  },

  scoreText: {
    color: BRAND.white,
    fontSize: 20,
    fontWeight: '900',
    marginTop: 6,
  },

  teamScheduleLocation: {
    color: BRAND.gray,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
  },

  teamScheduleRightColumn: {
    width: 88,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },

  teamScheduleDate: {
    color: BRAND.lightGray,
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'right',
  },

  teamScheduleTime: {
    color: BRAND.gray,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'right',
    marginTop: 4,
  },

  eventSportLine: {
  color: BRAND.white,
  fontSize: 18,
  fontWeight: '800',
  lineHeight: 22,
},

teamPageHeader: {
  position: 'relative',
  paddingRight: 130,
  marginTop: 4,
},

teamPageSponsorLogo: {
  position: 'absolute',
  top: -50,
  right: -30,
  width: 240,
  height: 96,
},

eventVsLine: {
  color: BRAND.red,
  fontSize: 15,
  fontWeight: '800',
  marginLeft: 8,
},

eventOpponentLine: {
  color: BRAND.lightGray,
  fontSize: 18,
  fontWeight: '700',
  lineHeight: 24,
  marginTop: 4,
  marginBottom: 12,
},

eventMainRow: {
  flexDirection: 'row',
  alignItems: 'center',
},

eventTextWrap: {
  flex: 1,
  paddingRight: 10,
},

eventLogoPlate: {
  width: 52,
  height: 52,
  borderRadius: 14,
  backgroundColor: BRAND.white,
  alignItems: 'center',
  justifyContent: 'center',
  padding: 6,
},

eventLogo: {
  width: '100%',
  height: '100%',
},

resultHeaderRow: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 10,
},

resultBadgeTopRight: {
  minWidth: 30,
  height: 30,
  borderRadius: 15,
  alignItems: 'center',
  justifyContent: 'center',
  paddingHorizontal: 8,
  borderWidth: 1.5,
  borderColor: BRAND.primary,
  backgroundColor: 'transparent',
},

resultBadge: {
  minWidth: 28,
  height: 28,
  borderRadius: 14,
  alignItems: 'center',
  justifyContent: 'center',
  paddingHorizontal: 8,
},

resultBadgeText: {
  color: BRAND.primary,
  fontSize: 13,
  fontWeight: '900',
},

resultBadgeWin: {
  backgroundColor: 'rgba(34,197,94,0.18)',
  borderWidth: 1,
  borderColor: 'rgba(34,197,94,0.45)',
},

resultBadgeLoss: {
  backgroundColor: 'rgba(239,68,68,0.18)',
  borderWidth: 1,
  borderColor: 'rgba(239,68,68,0.45)',
},

resultRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 8,
},

resultTeamRowLeft: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
  flex: 1,
  minWidth: 0,
},

resultLogoPlate: {
  width: 38,
  height: 38,
  borderRadius: 10,
  backgroundColor: BRAND.white,
  alignItems: 'center',
  justifyContent: 'center',
  padding: 5,
},

resultLogo: {
  width: '100%',
  height: '100%',
},

teamGamesRow: {
  paddingHorizontal: 16,
  paddingRight: 28,
},

teamGameCard: {
  width: 210,
  height: 150,
  backgroundColor: BRAND.surface,
  borderWidth: 1,
  borderColor: BRAND.border,
  borderRadius: 20,
  paddingHorizontal: 16,
  paddingVertical: 12,
  marginRight: 12,
  flexDirection: 'row',
  alignItems: 'flex-start',
  justifyContent: 'flex-start',
},

teamGameSport: {
  color: BRAND.primary,
  fontSize: 11,
  fontWeight: '800',
  textTransform: 'uppercase',
  letterSpacing: 0.7,
  marginBottom: 6,
},

teamGameMainRow: {
  flexDirection: 'row',
  flex: 1,
  alignItems: 'flex-start',
  justifyContent: 'space-between',
},

teamGameTextWrap: {
  flex: 1,
  paddingRight: 6,
  justifyContent: 'flex-start',
},

teamGameStatus: {
  color: BRAND.primary,
  fontSize: 11,
  fontWeight: '800',
  textTransform: 'uppercase',
  marginBottom: 2,
},

teamGameMatchup: {
  color: BRAND.white,
  fontSize: 16,
  fontWeight: '900',
  lineHeight: 19,
  marginBottom: 6,
},

teamGameScore: {
  color: BRAND.white,
  fontSize: 14,
  fontWeight: '800',
  marginTop: 8,
},

teamGameScoreRow: {
  flexDirection: 'row',
  alignItems: 'baseline',
  marginTop: 5,
},

teamGameScoreValue: {
  color: BRAND.white,
  fontSize: 22,
  fontWeight: '900',
  lineHeight: 24,
},

teamGameScoreSeparator: {
  color: BRAND.gray,
  fontSize: 16,
  fontWeight: '800',
  marginHorizontal: 6,
},

teamGameDate: {
  color: BRAND.white,
  fontSize: 13,
  fontWeight: '700',
  marginBottom: 2,
},

teamGameVenue: {
  color: BRAND.gray,
  fontSize: 12,
  fontWeight: '600',
  marginTop: 0,
},

teamGameLogoPlate: {
  width: 40,
  height: 40,
  borderRadius: 10,
  backgroundColor: BRAND.white,
  alignSelf: 'center',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 3,
},

teamGameLogo: {
  width: '100%',
  height: '100%',
},

resultOpponentName: {
  color: BRAND.lightGray,
  fontSize: 17,
  fontWeight: '700',
  flex: 1,
  paddingRight: 10,
},

resultMainRow: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 10,
},

resultScore: {
  color: BRAND.white,
  fontSize: 22,
  fontWeight: '900',
  minWidth: 74,
  textAlign: 'right',
},

  sportHeader: {
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },

  backButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },

  backButtonText: {
    color: BRAND.white,
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 6,
  },

  sportHeaderTitle: {
  fontSize: 28,
  fontWeight: '800',
  color: BRAND.white,
  paddingRight: 8,
},

  sportHeaderSub: {
    color: BRAND.lightGray,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 6,
  },

  sportActionGrid: {
    paddingHorizontal: 16,
    marginTop: 18,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },

  sportActionSingleWrap: {
    paddingHorizontal: 16,
    marginTop: 18,
  },

  sportActionCard: {
    alignSelf: 'flex-start',
    backgroundColor: BRAND.surface,
    borderWidth: 1,
    borderColor: BRAND.border,
    borderRadius: 22,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 10,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },

  sportActionCardFull: {
    alignSelf: 'flex-start',
    backgroundColor: BRAND.surface,
    borderWidth: 1,
    borderColor: BRAND.border,
    borderRadius: 22,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },

  sportActionText: {
    color: BRAND.white,
    fontSize: 13,
    fontWeight: '800',
    marginLeft: 8,
  },

  sportEventListCard: {
    backgroundColor: BRAND.surface,
    borderWidth: 1,
    borderColor: BRAND.border,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
  },

  sportEventListTitle: {
    color: BRAND.white,
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 22,
  },

  sportEventListMeta: {
    color: BRAND.gray,
    fontSize: 13,
    marginTop: 6,
  },

  followTeamButton: {
    marginTop: 14,
    alignSelf: 'flex-start',
    backgroundColor: BRAND.surface,
    borderWidth: 1,
    borderColor: BRAND.border,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },

  followTeamButtonActive: {
    backgroundColor: BRAND.red,
    borderColor: BRAND.primary,
  },

  followTeamButtonText: {
    color: BRAND.white,
    fontSize: 14,
    fontWeight: '800',
    marginLeft: 8,
  },

  audioBar: {
    backgroundColor: BRAND.primaryDark,
    borderTopWidth: 1,
    borderTopColor: BRAND.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },

  audioBarLeft: {
    flex: 1,
  },

  audioBarTitle: {
    color: BRAND.white,
    fontSize: 16,
    fontWeight: '800',
  },

  audioBarSub: {
    color: '#CFCFCF',
    fontSize: 13,
    marginTop: 2,
  },

  audioBarButton: {
    backgroundColor: BRAND.red,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
  },

  audioBarButtonText: {
    color: BRAND.white,
    fontSize: 14,
    fontWeight: '800',
    marginLeft: 6,
  },

  asnHero: {
    marginTop: 8,
    marginHorizontal: 16,
    marginBottom: 18,
    borderRadius: 24,
    padding: 22,
    alignItems: 'center',
  },

  asnHeroLogo: {
    width: 250,
    height: 250,
    marginBottom: 12,
  },

  asnHeroTitle: {
    color: BRAND.white,
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 8,
    textAlign: 'center',
  },

  asnHeroText: {
    color: BRAND.white,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },

  asnActionsWrap: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },

  asnPrimaryButton: {
    backgroundColor: BRAND.primary,
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },

  asnPrimaryButtonText: {
    color: BRAND.white,
    fontSize: 16,
    fontWeight: '800',
    marginLeft: 10,
  },

  asnSecondaryButton: {
    backgroundColor: BRAND.surface,
    borderWidth: 1,
    borderColor: BRAND.border,
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },

  asnSecondaryButtonText: {
    color: BRAND.white,
    fontSize: 16,
    fontWeight: '800',
    marginLeft: 10,
  },

  bottomNav: {
    flexDirection: 'row',
    backgroundColor: BRAND.black,
    borderTopWidth: 1,
    borderTopColor: BRAND.border,
    paddingTop: 0,
    paddingBottom: 5,
    minHeight: 54,
    alignItems: 'flex-end',
  },

  bottomNavItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    minHeight: 42,
  },

  bottomNavItemAsn: {
    justifyContent: 'flex-end',
    minHeight: 64,
  },

  bottomNavLabel: {
    color: BRAND.gray,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
  },

  bottomNavLabelActive: {
    color: BRAND.primary,
  },

  asnTabFloatWrap: {
    marginTop: -36,
    marginBottom: 3,
  },

  asnTabWrap: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: 'transparent',
    borderWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: BRAND.black,
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },

  asnTabGlowWrap: {
    width: 74,
    height: 74,
    borderRadius: 37,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.01)',
  },

  centerNavLogo: {
    width: 64,
    height: 64,
  },

  asnTabWrapActive: {
    backgroundColor: 'transparent',
    shadowColor: BRAND.white,
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },

  asnTabGlowWrapActive: {
    shadowColor: BRAND.white,
    shadowOpacity: 0.38,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
    elevation: 14,
  },

  asnTabLogo: {
    width: 100,
    height: 100,
  },

  asnTabLabel: {
    color: BRAND.gray,
    fontSize: 11,
    fontWeight: '700',
    marginTop: -1,
  },

  webSafe: {
    flex: 1,
    backgroundColor: BRAND.black,
  },

  webHeader: {
    backgroundColor: BRAND.black,
    borderBottomWidth: 1,
    borderBottomColor: BRAND.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },

  webBackButton: {
    width: 38,
    height: 38,
    borderRadius: 999,
    backgroundColor: BRAND.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },

  webHeaderTitle: {
    flex: 1,
    color: BRAND.white,
    fontSize: 16,
    fontWeight: '800',
    marginHorizontal: 12,
  },

  

  webExternalButton: {
    width: 38,
    height: 38,
    borderRadius: 999,
    backgroundColor: BRAND.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },

  webLoadingOverlay: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    zIndex: 3,
    alignItems: 'center',
  },
});
