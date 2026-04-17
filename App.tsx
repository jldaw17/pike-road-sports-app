import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
} from 'expo-audio';
import { Video } from 'expo-av';
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
  Text,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import {
  getDefaultSchoolConfig,
  getSchoolConfigBySlug,
  getScheduleEventsBySchoolSlug,
  getSportConfigBySchoolSlugAndKey,
  getSportScheduleEventsBySchoolSlug,
  getSportStoriesBySchoolSlug,
  getStoriesBySchoolSlug,
  mapScheduleEventToHomeEventItem,
  mapStoryToHomeNewsItem,
} from './lib/athleticos';
import { supabase } from './lib/supabase';

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

const STREAM_URL = 'https://ice42.securenetsystems.net/RALA1';
const TICKETS_URL = 'https://gofan.co/app/school/AL72525';

const CASTOS_FEED_URL = 'https://feeds.castos.com/0gjg';
const ASN_YOUTUBE_URL = 'https://www.youtube.com/@pikeroadlive';
const ASN_CASTR_URL = 'https://www.youtube.com/@pikeroadlive';
const ASN_RADIO_URL = 'https://ice42.securenetsystems.net/RALA1';
const SCHOOL_SLUG = 'pike-road';
const DEFAULT_SCHOOL_CONFIG = getDefaultSchoolConfig(SCHOOL_SLUG);
const URLS = {
  watch: DEFAULT_SCHOOL_CONFIG.watchUrl,
  schedule: DEFAULT_SCHOOL_CONFIG.scheduleUrl,
  mainSite: DEFAULT_SCHOOL_CONFIG.mainSiteUrl,
  sponsor: DEFAULT_SCHOOL_CONFIG.sponsorUrl,
};
const STORAGE_KEYS = {
  notificationsEnabled: 'notificationsEnabled',
  notificationsPromptDismissed: 'notificationsPromptDismissed',
  followedTeams: 'followedTeams',
};

type TabKey = 'home' | 'teams' | 'PSN' | 'tickets' | 'PRS';
type ScreenMode = 'tabs' | 'sportDetail' | 'embedded';

type SportType = {
  key: string;
  label: string;
  shortLabel?: string;
};

type PodcastEpisode = {
  title: string;
  link: string;
  date: string;
  description: string;
  image?: string;
  rawDate?: string;
};

type NewsItem = {
  title: string;
  link: string;
  date: string;
  description: string;
  image?: string;
  rawDate?: string;
};

type EventItem = {
  id: string;
  title: string;
  link: string;
  date: string;
  description: string;
  rawDate?: string;
  sportName?: string;
  status?: string;
};

type NormalizedScheduleItem = {
  id: string;
  title: string;
  sport: string;
  opponent: string;
  displayDate: string;
  timeLabel: string;
  link: string;
  homeAway?: string;
};

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

  if (!imgMatch) return undefined;
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

async function fetchRssItems(url: string) {
  const response = await fetch(normalizeUrl(url));
  const xml = await response.text();
  const items = xml.match(/<item\b[\s\S]*?<\/item>/gi) ?? [];

  return items.map((itemXml) => {
    const title = decodeHtml(getTagValue(itemXml, 'title'));
    const link = normalizeUrl(decodeHtml(getTagValue(itemXml, 'link')));
    const description = decodeHtml(getTagValue(itemXml, 'description'));
    const pubDate = decodeHtml(getTagValue(itemXml, 'pubDate'));
    const image = extractImageFromHtml(description);

    return {
      title: stripHtml(title),
      link,
      description: stripHtml(description),
      rawDate: pubDate,
      date: formatDate(pubDate),
      image,
    };
  });
}


async function fetchPodcastFeed(url: string): Promise<PodcastEpisode[]> {
  const items = await fetchRssItems(url);

  return items
    .filter((item) => item.title && item.link)
    .map((item) => ({
      title: item.title,
      link: item.link,
      description: item.description,
      date: item.date,
      rawDate: item.rawDate,
      image: item.image,
    }))
    .sort((a, b) => {
      const aTime = safeDate(a.rawDate)?.getTime() ?? 0;
      const bTime = safeDate(b.rawDate)?.getTime() ?? 0;
      return bTime - aTime;
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
  return 'Aggies';
}

function normalizeScheduleItem(item: EventItem) {
  const parsed = safeDate(item.rawDate);

  const displayDate = parsed
    ? parsed.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      })
    : item.date;

  const timeLabel = parsed
    ? parsed.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      })
    : 'TBA';

  const title = item.title || 'Upcoming Event';
  const cleanedTitle = title.replace(/\s+/g, ' ').trim();

  let sport = item.sportName || inferSportFromTitle(cleanedTitle);
  let opponent = item.description?.trim() || cleanedTitle;
  let homeAway: 'vs.' | 'at' = 'vs.';
  let teamScore = '';
  let opponentScore = '';
  let hasScore = false;
  let result: 'W' | 'L' | '' = '';

  if (cleanedTitle.includes(' vs. ')) {
    const parts = cleanedTitle.split(' vs. ');
    opponent = item.description?.trim() || parts[1] || opponent;
    homeAway = 'vs.';
  } else if (cleanedTitle.includes(' at ')) {
    const parts = cleanedTitle.split(' at ');
    opponent = item.description?.trim() || parts[1] || opponent;
    homeAway = 'at';
  }

  const wlScoreMatch = cleanedTitle.match(/([WL]),\s*(\d+)-(\d+)/i);
  if (wlScoreMatch) {
    hasScore = true;
    result = wlScoreMatch[1].toUpperCase() as 'W' | 'L';
    teamScore = wlScoreMatch[2];
    opponentScore = wlScoreMatch[3];
  } else {
    const plainScoreMatch = cleanedTitle.match(/(\d+)\s*-\s*(\d+)/);
    if (plainScoreMatch) {
      hasScore = true;
      teamScore = plainScoreMatch[1];
      opponentScore = plainScoreMatch[2];

      const teamNum = Number(teamScore);
      const oppNum = Number(opponentScore);

      if (teamNum > oppNum) {
        result = 'W';
      } else if (teamNum < oppNum) {
        result = 'L';
      }
    }
  }

  opponent = opponent
    .replace(/\s*[WL],\s*\d+-\d+/i, '')
    .replace(/\s*Final\s*/i, '')
    .replace(/\s*\d+\s*-\s*\d+\s*/i, '')
    .replace(/\|.*$/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  return {
    id: item.id,
    sport,
    opponent,
    displayDate,
    timeLabel,
    link: item.link,
    homeAway,
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

async function registerForPushNotificationsAsync() {
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
      });
    }

    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') return '';

    const token = await Notifications.getExpoPushTokenAsync({
      projectId:
        Constants?.expoConfig?.extra?.eas?.projectId ||
        Constants?.easConfig?.projectId,
    });

    return token.data;
  } catch (error) {
    console.log('Push registration error:', error);
    return '';
  }
}
async function savePushToken(token: string) {
  try {
    const { error } = await supabase
      .from('push_tokens')
      .upsert(
        {
          expo_push_token: token,
          platform: Platform.OS,
          app_name: 'pike road',
          notifications_enabled: true,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'expo_push_token',
        }
      );

    if (error) {
      console.log('Save push token error:', error);
    }
  } catch (error) {
    console.log('Save push token unexpected error:', error);
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
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction}>
          <Text style={styles.sectionAction}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
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
  onToggle,
}: {
  isPlaying: boolean;
  isLoading: boolean;
  onToggle: () => void;
}) {
  return (
    <View style={styles.audioBar}>
      <View style={styles.audioBarLeft}>
        <Text style={styles.audioBarTitle}> The Patriot Sports Network</Text>
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

function LaunchSplash() {
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

      <ImageBackground
        source={require('./assets/images/splash.png')}
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
          <View style={styles.flashShadowLong} />
          <Animated.View
            style={{
              transform: [{ translateY: logoSlide }],
            }}
          >
            <View style={styles.flashLogoPlate}>
              <Image
                source={require('./assets/images/splash-logo.png')}
                style={styles.flashMainLogo}
                resizeMode="contain"
              />
            </View>
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
          <Image
            source={require('./assets/images/network-logo.png')}
            style={styles.flashWSNLogo}
            resizeMode="contain"
          />

          <Text style={styles.flashBottomSub}>Pike Road Athletics</Text>

          <Text style={styles.splashSponsorText}>Presented by</Text>

          <Image
            source={require('./assets/images/splash-sponsor.png')}
            style={styles.splashSponsorLogo}
            resizeMode="contain"
          />
        </Animated.View>
      </ImageBackground>
    </Animated.View>
  );
}

function NewsCard({
  item,
  onPress,
  featured = false,
}: {
  item: NewsItem;
  onPress: () => void;
  featured?: boolean;
}) {
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
          <View style={styles.featuredPill}>
            <Text style={styles.featuredPillText}>Latest Story</Text>
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

function EventCard({
  item,
  onPress,
  showTime = true,
}: {
  item: EventItem;
  onPress: () => void;
  showTime?: boolean;
}) {
  const normalized = normalizeScheduleItem(item);

  const resultLabel =
    normalized.result === 'W' || normalized.result === 'L'
      ? normalized.result
      : null;

  return (
    <Pressable style={styles.eventCard} onPress={onPress}>
      {!normalized.hasScore ? (
        <>
          <View style={styles.eventTopRow}>
            <Text style={styles.eventSportLine}>{normalized.sport}</Text>
            <Text style={styles.eventVsLine}>{normalized.homeAway}</Text>
          </View>

          <Text style={styles.eventOpponentLine} numberOfLines={2}>
            {normalized.opponent}
          </Text>

          <Text style={styles.eventMeta}>{normalized.displayDate}</Text>
          {showTime ? (
            <Text style={styles.eventMetaSecondary}>{normalized.timeLabel}</Text>
          ) : null}
        </>
      ) : (
        <>
          <View style={styles.resultHeaderRow}>
            <Text style={styles.eventSportLine}>{normalized.sport}</Text>

            {resultLabel ? (
              <View style={styles.resultBadgeTopRight}>
                <Text style={styles.resultBadgeText}>{resultLabel}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.resultRow}>
            <Text style={styles.resultTeamName}>Pike Road</Text>
            <Text style={styles.resultScore}>{normalized.teamScore}</Text>
          </View>

          <View style={styles.resultRow}>
            <Text style={styles.resultOpponentName} numberOfLines={1}>
              {normalized.opponent}
            </Text>
            <Text style={styles.resultScore}>{normalized.opponentScore}</Text>
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
  onOpenSport,
  onToggleAudio,
  onGoToAsn,
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
}: {
  onOpenEmbedded: (title: string, url: string) => void;
  onOpenSport: (sport: SportType) => void;
  onToggleAudio: () => void;
  onGoToAsn: () => void;
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
    mainSiteUrl: string;
    scheduleUrl: string;
    watchUrl: string;
    sponsorUrl: string;
  };
}) {
  const hasWatchUrl = hasResolvedUrl(schoolConfig.watchUrl);
  const hasScheduleUrl = hasResolvedUrl(schoolConfig.scheduleUrl);
  const hasMainSiteUrl = hasResolvedUrl(schoolConfig.mainSiteUrl);
  const hasSponsorUrl = hasResolvedUrl(schoolConfig.sponsorUrl);
  const tappableRecentEvents = recentEvents.filter((item) => hasResolvedUrl(item.link));
  const tappableUpcomingEvents = upcomingEvents.filter((item) =>
    hasResolvedUrl(item.link)
  );

  const heroItem = newsItems[0];
  const latestNews = newsItems.slice(0, 4);

  const isAudioLive = liveStatus.audio;
  const isVideoLive = liveStatus.video;
  const isAnythingLive = isAudioLive || isVideoLive;

  const [bannerIndex, setBannerIndex] = useState(0);

  const banners = [
    {
      image: require('./assets/images/banner1.png'),
      url: 'https://example.com',
    },
    {
      image: require('./assets/images/banner2.png'),
      url: 'https://example.com',
    },
    {
      image: require('./assets/images/banner3.png'),
      url: 'https://example.com',
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setBannerIndex((prev) => (prev + 1) % banners.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [banners.length]);

  let heroEyebrow = 'Game Day Headquarters';
  let heroTitle = 'The Patriot Sports Network';
  let heroText =
    'Watch live, listen live, follow the latest news, and stay on top of every Pike Road team.';
  let heroCta = 'Open PSN';

  if (isAudioLive && isVideoLive) {
    heroEyebrow = 'Live Now';
    heroTitle = 'Live Audio + Video';
    heroText =
      'Tap to open PSN for the live video stream and live audio coverage.';
    heroCta = 'Open Live Coverage';
  } else if (isVideoLive) {
    heroEyebrow = 'Live Now';
    heroTitle = 'Live Video';
    heroText = 'Tap to open PSN and watch the live video stream now.';
    heroCta = 'Watch Live';
  } else if (isAudioLive) {
    heroEyebrow = 'Live Now';
    heroTitle = 'Live Audio';
    heroText = 'Tap to open PSN and listen to the live audio broadcast now.';
    heroCta = 'Listen Live';
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.screenContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={BRAND.primary}
        />
      }
    >
      <LinearGradient
        colors={[BRAND.red, '#141418', BRAND.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.homeHeader}
      >
        <View style={styles.headerLeft}>
          <View style={styles.teamLogoBox}>
            <Image
              source={require('./assets/images/school-logo.png')}
              style={styles.headerTeamLogo}
              resizeMode="contain"
            />
          </View>

          <View style={styles.headerTitleWrap}>
            <Text style={styles.appTitle} numberOfLines={1} adjustsFontSizeToFit>
              Pike Road Athletics
            </Text>
            <Text style={styles.appSubtitle} numberOfLines={1}>
              Home of the Patriots
            </Text>
          </View>
        </View>

        <View style={styles.heroButtonRow}>
          {hasWatchUrl ? (
            <TopIcon
              label="Watch"
              icon="videocam"
              onPress={() => onOpenEmbedded('Watch Live', schoolConfig.watchUrl)}
            />
          ) : null}
          <TopIcon label="Listen" icon="headset" onPress={onToggleAudio} />
          {hasScheduleUrl ? (
            <TopIcon
              label="Schedule"
              icon="calendar"
              onPress={() => onOpenEmbedded('Full Schedule', schoolConfig.scheduleUrl)}
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

      <Pressable
        style={({ pressed }) => [
          styles.liveNowCard,
          isAnythingLive ? styles.liveNowCardLive : null,
          pressed ? { opacity: 0.88, transform: [{ scale: 0.985 }] } : null,
        ]}
        onPress={onGoToAsn}
      >
        <View style={styles.liveNowLeft}>
          <Text style={styles.liveNowEyebrow}>{heroEyebrow}</Text>
          <Text style={styles.liveNowTitle}>{heroTitle}</Text>
          <Text style={styles.liveNowText}>{heroText}</Text>

          <View style={styles.liveNowCTA}>
            <Text style={styles.liveNowCTAText}>{heroCta}</Text>
            <Ionicons name="chevron-forward" size={16} color={BRAND.white} />
          </View>
        </View>

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
      </Pressable>

      <Pressable
  style={styles.bannerWrap}
  onPress={() =>
    onOpenEmbedded('Sponsor', banners[bannerIndex].url)
  }
>
<Image
    source={banners[bannerIndex].image}
    style={styles.bannerImage}
    resizeMode="contain"
  />
</Pressable>

      {showNotificationPrompt && !notificationsEnabled && (
        <View style={styles.notificationSignupCard}>
          <View style={styles.notificationTextWrap}>
            <Text style={styles.notificationSignupTitle}>
              Get live broadcast + final score alerts
            </Text>
            <Text style={styles.notificationSignupText}>
              Be the first to know when the Patriots are live and when finals go official.
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

      <SectionHeader title="Featured Story" />
      {newsLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={BRAND.primary} />
        </View>
      ) : heroItem ? (
        <NewsCard
          item={heroItem}
          featured
          onPress={() => onOpenEmbedded(heroItem.title, heroItem.link)}
        />
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No featured story found.</Text>
        </View>
      )}

      <SectionHeader title="Recent Finals" />
      {eventsLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={BRAND.primary} />
        </View>
      ) : tappableRecentEvents.length === 0 ? (
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
          {tappableRecentEvents.map((item) => (
            <EventCard
              key={item.id}
              item={item}
              showTime={false}
              onPress={() => onOpenEmbedded(item.title, item.link)}
            />
          ))}
        </ScrollView>
      )}

      <SectionHeader
        title="Upcoming Games"
        actionLabel={hasScheduleUrl ? 'Full Schedule' : undefined}
        onAction={
          hasScheduleUrl
            ? () => onOpenEmbedded('Full Schedule', schoolConfig.scheduleUrl)
            : undefined
        }
      />
      {eventsLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={BRAND.primary} />
        </View>
      ) : tappableUpcomingEvents.length === 0 ? (
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
          {tappableUpcomingEvents.slice(0, 10).map((item) => (
            <EventCard
              key={item.id}
              item={item}
              onPress={() => onOpenEmbedded(item.title, item.link)}
            />
          ))}
        </ScrollView>
      )}

      <SectionHeader
        title="Latest News"
        actionLabel={hasMainSiteUrl ? 'Main Site' : undefined}
        onAction={
          hasMainSiteUrl
            ? () => onOpenEmbedded('Pike Road Athletics', schoolConfig.mainSiteUrl)
            : undefined
        }
      />
      {newsLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={BRAND.primary} />
        </View>
      ) : latestNews.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No news stories found.</Text>
        </View>
      ) : (
        <View style={styles.newsList}>
          {latestNews.map((item) => (
            <NewsCard
              key={`${item.link}-${item.title}`}
              item={item}
              onPress={() => onOpenEmbedded(item.title, item.link)}
            />
          ))}
        </View>
      )}

      <SectionHeader title="All" />
      <View style={styles.teamsGrid}>
        {SPORTS.map((sport) => (
          <TeamTile
            key={sport.key}
            sport={sport}
            onPress={() => onOpenSport(sport)}
          />
        ))}
      </View>

      {hasSponsorUrl ? (
        <Pressable
          style={styles.sponsorCard}
          onPress={() => onOpenEmbedded('Sponsor', schoolConfig.sponsorUrl)}
        >
          <View style={styles.sponsorTextWrap}>
            <Text style={styles.sponsorEyebrow}>Presented by</Text>
            <Text style={styles.sponsorTitle}>Your Sponsor Here</Text>
            <Text style={styles.sponsorText}>
              Premium sponsor placement for the Patriot Sports Network app.
            </Text>
          </View>

          <Image
            source={require('./assets/images/sponsor-logo.png')}
            style={styles.sponsorLogo}
            resizeMode="contain"
          />
        </Pressable>
      ) : null}
    </ScrollView>
  );
}

function TeamsScreen({
  onOpenSport,
}: {
  onOpenSport: (sport: SportType) => void;
}) {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.screenContent}>
      <View style={styles.tabHero}>
        <Text style={styles.tabHeroEyebrow}>Teams</Text>
        <Text style={styles.tabHeroTitle}>Patriot Athletics</Text>
        <Text style={styles.tabHeroText}>
          Tap into schedules, rosters, news, and team pages for Pike Road Athletics.
        </Text>
      </View>

      <View style={styles.teamsList}>
        {SPORTS.map((sport) => (
          <Pressable
            key={sport.key}
            style={styles.teamListCard}
            onPress={() => onOpenSport(sport)}
          >
            <View>
              <Text style={styles.teamListTitle}>{sport.shortLabel || sport.label}</Text>
              <Text style={styles.teamListSub}>Open team page</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color={BRAND.gray} />
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

function WatchScreen({
  onOpenEmbedded,
  onToggleAudio,
}: {
  onOpenEmbedded: (title: string, url: string) => void;
  onToggleAudio: () => void;
}) {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.screenContent}>
      <View style={styles.tabHero}>
        <Text style={styles.tabHeroEyebrow}>Watch + Listen</Text>
        <Text style={styles.tabHeroTitle}>The Patriot Sports Network</Text>
        <Text style={styles.tabHeroText}>
          Jump straight into live coverage, the full website, and the schedule.
        </Text>
      </View>

      <Pressable
        style={styles.watchPrimaryCard}
        onPress={() => onOpenEmbedded('Watch Live', URLS.watch)}
      >
        <Ionicons name="videocam" size={28} color={BRAND.white} />
        <View style={styles.watchCardBody}>
          <Text style={styles.watchCardTitle}>Watch Live</Text>
          <Text style={styles.watchCardText}>
            Open the Pike Road live video page inside the app.
          </Text>
        </View>
      </Pressable>

      <Pressable style={styles.watchSecondaryCard} onPress={onToggleAudio}>
        <Ionicons name="headset" size={26} color={BRAND.white} />
        <View style={styles.watchCardBody}>
          <Text style={styles.watchCardTitle}>Listen Live</Text>
          <Text style={styles.watchCardText}>
            Start the live Patriot Sports Network audio stream.
          </Text>
        </View>
      </Pressable>

      <Pressable
        style={styles.watchSecondaryCard}
        onPress={() => onOpenEmbedded('Schedule', URLS.schedule)}
      >
        <Ionicons name="calendar" size={26} color={BRAND.white} />
        <View style={styles.watchCardBody}>
          <Text style={styles.watchCardTitle}>View Schedule</Text>
          <Text style={styles.watchCardText}>
            See the full Pike Road Athletics composite schedule.
          </Text>
        </View>
      </Pressable>
    </ScrollView>
  );
}

function ScheduleScreen({
  upcomingEvents,
  eventsLoading,
  onOpenEmbedded,
}: {
  upcomingEvents: EventItem[];
  eventsLoading: boolean;
  onOpenEmbedded: (title: string, url: string) => void;
}) {
  const normalized = useMemo(
    () => upcomingEvents.slice(0, 40).map(normalizeScheduleItem),
    [upcomingEvents]
  );

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.screenContent}>
      <LinearGradient
        colors={[BRAND.primaryDark, BRAND.black]}
        style={styles.scheduleHero}
      >
        <View style={styles.scheduleHeroLogoWrap}>
          <Image
            source={require('./assets/images/school-logo.png')}
            style={styles.scheduleHeroLogo}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.scheduleHeroTitle}>Schedule</Text>
        <Text style={styles.scheduleHeroSub}>Pike Road Athletics</Text>
      </LinearGradient>

      {eventsLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={BRAND.primary} />
          <Text style={styles.scheduleLoadingText}>Loading schedule...</Text>
        </View>
      ) : normalized.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No upcoming events in the next 10 days.</Text>
          <Text style={styles.emptyText}>Pull down to refresh and check again.</Text>
        </View>
      ) : (
        normalized.map((item) => (
          <Pressable
            key={item.id}
            style={styles.scheduleCard}
            onPress={() => onOpenEmbedded(item.title, item.link)}
          >
            <View style={styles.scheduleCardLeft}>
              <View
                style={[
                  styles.scheduleSportTag,
                  { backgroundColor: getSportColor(item.sport) },
                ]}
              >
                <Text style={styles.scheduleSportTagText}>{item.sport}</Text>
              </View>

              <Text style={styles.scheduleOpponent} numberOfLines={2}>
                {item.homeAway ? `${item.homeAway} ${item.opponent}` : item.opponent}
              </Text>

              <Text style={styles.scheduleMeta}>{item.displayDate}</Text>
              <Text style={styles.scheduleMetaSecondary}>{item.timeLabel}</Text>
            </View>

            <Ionicons name="chevron-forward" size={22} color={BRAND.primary} />
          </Pressable>
        ))
      )}
    </ScrollView>
  );
}

function SportDetailScreen({
  sport,
  onBack,
  onOpenEmbedded,
  followedTeams,
  onToggleFollowTeam,
}: {
  sport: SportType;
  onBack: () => void;
  onOpenEmbedded: (title: string, url: string) => void;
  followedTeams: string[];
  onToggleFollowTeam: (teamKey: string) => void;
}) {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
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
  const hasRosterUrl = hasResolvedUrl(sportConfig.rosterUrl);
  const hasMainUrl = hasResolvedUrl(sportConfig.mainUrl);
  const hasRecruitingUrl = hasResolvedUrl(sportConfig.recruitingUrl);
  const tappableEvents = events.filter((item) => hasResolvedUrl(item.link));

  const isFollowing = followedTeams.includes(sport.key);

  useEffect(() => {
    let mounted = true;

    async function loadSportData() {
      try {
        setLoading(true);

        const [nextSportConfig, teamNews, teamSchedule] = await Promise.all([
          getSportConfigBySchoolSlugAndKey(SCHOOL_SLUG, sport.key),
          getSportStoriesBySchoolSlug(SCHOOL_SLUG, sport.key),
          getSportScheduleEventsBySchoolSlug(SCHOOL_SLUG, sport.key),
        ]);

        if (!mounted) return;

        setSportConfig(nextSportConfig);
        const mappedNews = teamNews
          .map((story) => mapStoryToHomeNewsItem(story, nextSportConfig.mainUrl))
          .filter((item) => item.title && item.link)
          .map((item) => ({
            ...item,
            date: formatDate(item.rawDate),
          }));

        const mappedEvents = teamSchedule.map((event) => {
          const mapped = mapScheduleEventToHomeEventItem(
            event,
            nextSportConfig.scheduleUrl
          );

          return {
            ...mapped,
            date: formatDate(mapped.rawDate),
          };
        });

        setNewsItems(mappedNews.slice(0, 6));
        setEvents(filterNextFourGames(mappedEvents));
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
  }, [sport]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.screenContent}>
      <LinearGradient
        colors={[BRAND.black, BRAND.primaryDark]}
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

          <Image
            source={require('./assets/images/team-sponsor.png')}
            style={styles.teamPageSponsorLogo}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.sportHeaderSub}>Pike Road Athletics</Text>

        <Pressable
          style={[
            styles.followTeamButton,
            isFollowing ? styles.followTeamButtonActive : null,
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

      {hasScheduleUrl || hasRosterUrl || hasMainUrl ? (
        <View style={styles.sportActionGrid}>
          {hasScheduleUrl ? (
            <Pressable
              style={styles.sportActionCard}
              onPress={() =>
                onOpenEmbedded(
                  `${sport.shortLabel || sport.label} Schedule`,
                  sportConfig.scheduleUrl
                )
              }
            >
              <Ionicons name="calendar-outline" size={22} color={BRAND.white} />
              <Text style={styles.sportActionText}>Schedule</Text>
            </Pressable>
          ) : null}

          {hasRosterUrl || hasMainUrl ? (
            <Pressable
              style={styles.sportActionCard}
              onPress={() =>
                onOpenEmbedded(
                  `${sport.label} Roster`,
                  sportConfig.rosterUrl || sportConfig.mainUrl
                )
              }
            >
              <Ionicons name="people-outline" size={22} color={BRAND.white} />
              <Text style={styles.sportActionText}>Roster</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {hasRecruitingUrl || hasMainUrl ? (
        <View style={styles.sportActionSingleWrap}>
          <Pressable
            style={styles.sportActionCardFull}
            onPress={() =>
              onOpenEmbedded(
                `${sport.shortLabel || sport.label} Recruiting`,
                sportConfig.recruitingUrl || sportConfig.mainUrl
              )
            }
          >
            <Ionicons name="school-outline" size={22} color={BRAND.white} />
            <Text style={styles.sportActionText}>Recruiting</Text>
          </Pressable>
        </View>
      ) : null}

      <SectionHeader title="Upcoming Games" />
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={BRAND.primary} />
        </View>
      ) : tappableEvents.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No upcoming games found.</Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.teamGamesRow}
        >
          {tappableEvents.map((item) => {
            const normalized = normalizeScheduleItem(item);
            const opponentText = item.description?.trim() || 'Opponent TBA';
            const matchupLine = `${normalized.homeAway || 'vs.'} ${opponentText}`;

            return (
              <Pressable
                key={item.id}
                style={styles.teamGameCard}
                onPress={() => onOpenEmbedded(item.title, item.link)}
              >
                <Text style={styles.teamGameMatchup} numberOfLines={2}>
                  {matchupLine}
                </Text>

                <View>
                  <Text style={styles.teamGameDate}>{normalized.displayDate}</Text>
                  <Text style={styles.teamGameTime}>{normalized.timeLabel}</Text>
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
              onPress={() => onOpenEmbedded(item.title, item.link)}
            />
          ))}
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

function ASNScreen({
  onOpenEmbedded,
  onOpenExternal,
  onToggleAsnAudio,
  asnAudioPlaying,
  liveStatus,
}: {
  onOpenEmbedded: (title: string, url: string) => void;
  onOpenExternal: (url: string) => void;
  onToggleAsnAudio: () => void;
  asnAudioPlaying: boolean;
  liveStatus: {
    audio: boolean;
    video: boolean;
  };
}) {
  const [episodes, setEpisodes] = useState<PodcastEpisode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadEpisodes = async () => {
      try {
        setLoading(true);
        const feedItems = await fetchPodcastFeed(CASTOS_FEED_URL);
        if (!mounted) return;
        setEpisodes(feedItems.slice(0, 8));
      } catch (error) {
        console.log('Podcast load error:', error);
        if (!mounted) return;
        setEpisodes([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadEpisodes();

    return () => {
      mounted = false;
    };
  }, []);
  const isAudioLive = liveStatus.audio;
const isVideoLive = liveStatus.video;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.screenContent}>
      <LinearGradient
        colors={[BRAND.black, BRAND.primaryDark]}
        style={styles.asnHero}
      >
        <Image
          source={require('./assets/images/network-logo.png')}
          style={styles.asnHeroLogo}
          resizeMode="contain"
        />
        <Text style={styles.asnHeroTitle}>Patriot Sports Network</Text>
        <Text style={styles.asnHeroText}>
          Watch live, listen live, catch the latest episodes, and stay connected to The Patriot Sports Network.
        </Text>
      </LinearGradient>

      <View style={styles.asnActionsWrap}>
        <Pressable
          style={styles.asnPrimaryButton}
          onPress={() => onOpenEmbedded('PSN Watch Live', ASN_CASTR_URL)}
        >
          <Ionicons name="videocam" size={22} color={BRAND.white} />
          <Text style={styles.asnPrimaryButtonText}>
  {isVideoLive ? 'Watch Live Now' : 'Watch Live'}
</Text>
        </Pressable>

        <Pressable style={styles.asnSecondaryButton} onPress={onToggleAsnAudio}>
          <Ionicons
            name={asnAudioPlaying ? 'pause-circle' : 'headset'}
            size={22}
            color={BRAND.white}
          />
          <Text style={styles.asnSecondaryButtonText}>
  {asnAudioPlaying
    ? 'Pause Listen Live'
    : isAudioLive
      ? 'Listen Live Now'
      : 'Listen Live'}
</Text>
        </Pressable>

        <Pressable
          style={styles.asnSecondaryButton}
          onPress={() => onOpenExternal(ASN_YOUTUBE_URL)}
        >
          <Ionicons name="logo-youtube" size={22} color={BRAND.white} />
          <Text style={styles.asnSecondaryButtonText}>YouTube Channel</Text>
        </Pressable>
      </View>

      <SectionHeader title="Latest Episodes" />

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={BRAND.primary} />
        </View>
      ) : episodes.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No podcast episodes found.</Text>
          <Text style={styles.emptyText}>Pull down to refresh and check again.</Text>
        </View>
      ) : (
        <View style={styles.newsList}>
          {episodes.map((item) => (
            <Pressable
              key={`${item.link}-${item.title}`}
              style={styles.newsCard}
              onPress={() => onOpenExternal(item.link)}
            >
              {item.image ? (
                <Image source={{ uri: item.image }} style={styles.newsThumb} />
              ) : (
                <View style={styles.newsThumbFallback}>
                  <Ionicons name="mic-outline" size={22} color={BRAND.white} />
                </View>
              )}

              <View style={styles.newsCardBody}>
                <Text style={styles.newsCardTitle} numberOfLines={2}>
                  {item.title}
                </Text>
                <Text style={styles.newsCardMeta}>{item.date || 'Latest Episode'}</Text>
              </View>

              <Ionicons
                name="chevron-forward"
                size={20}
                color={BRAND.gray}
                style={styles.newsChevron}
              />
            </Pressable>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function TicketsScreen({
  onOpenEmbedded,
}: {
  onOpenEmbedded: (title: string, url: string) => void;
}) {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.screenContent}>
      <LinearGradient
        colors={[BRAND.red, BRAND.primaryDark]}
        style={styles.tabHero}
      >
        <Text style={styles.tabHeroEyebrow}>Tickets</Text>
        <Text style={styles.tabHeroTitle}>Game Tickets</Text>
        <Text style={styles.tabHeroText}>
          Buy official Pike Road Athletics tickets through GoFan.
        </Text>
      </LinearGradient>

      <Pressable
        style={styles.watchPrimaryCard}
        onPress={() => onOpenEmbedded('Pike Road Tickets', TICKETS_URL)}
      >
        <Ionicons name="ticket-outline" size={28} color={BRAND.white} />
        <View style={styles.watchCardBody}>
          <Text style={styles.watchCardTitle}>Open Tickets</Text>
          <Text style={styles.watchCardText}>
            View and purchase tickets for Pike Road Athletics events.
          </Text>
        </View>
      </Pressable>
    </ScrollView>
  );
}

function BottomNav({
  activeTab,
  onChange,
}: {
  activeTab: TabKey;
  onChange: (tab: TabKey) => void;
}) {
  const items: {
    key: TabKey;
    label: string;
    icon?: keyof typeof Ionicons.glyphMap;
    isAsn?: boolean;
  }[] = [
    { key: 'home', label: 'Home', icon: 'home' },
    { key: 'teams', label: 'Teams', icon: 'people' },
    { key: 'asn', label: 'ASN', isAsn: true },
    { key: 'tickets', label: 'Tickets', icon: 'ticket-outline' },
    { key: 'scs', label: 'PCS Site', icon: 'school-outline' },
  ];

  return (
    <View style={styles.bottomNav}>
      {items.map((item) => {
        const active = activeTab === item.key;

        return (
          <Pressable
            key={item.key}
            style={[
              styles.bottomNavItem,
              item.isAsn ? styles.bottomNavItemAsn : null,
            ]}
            onPress={() => onChange(item.key)}
          >
            {item.isAsn ? (
              <>
                <View
                  style={[
                    styles.asnTabWrap,
                    active ? styles.asnTabWrapActive : null,
                  ]}
                >
                  <Image
                    source={require('./assets/images/network-logo.png')}
                    style={styles.asnTabLogo}
                    resizeMode="contain"
                  />
                </View>
                <Text
                  style={[
                    styles.asnTabLabel,
                    active ? styles.bottomNavLabelActive : null,
                  ]}
                >
                  PSN
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

function LaunchVideo({ onFinish }: { onFinish: () => void }) {
  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <Video
        source={require('./assets/images/launch-sponsor.mp4')}
        style={{ flex: 1 }}
        resizeMode="cover"
        shouldPlay
        isLooping={false}
        onPlaybackStatusUpdate={(status) => {
          if (!status.isLoaded) return;
          if (status.didJustFinish) {
            onFinish();
          }
        }}
      />
    </View>
  );
}

export default function App() {
  const player = useAudioPlayer(STREAM_URL);
  const playerStatus = useAudioPlayerStatus(player);

  const asnPlayer = useAudioPlayer(ASN_RADIO_URL);
  const asnPlayerStatus = useAudioPlayerStatus(asnPlayer);

  const SCS_SITE_URL = 'https://www.pikeroadschools.org/';

  const [showLaunchSplash, setShowLaunchSplash] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const [screenMode, setScreenMode] = useState<ScreenMode>('tabs');
  const [selectedSport, setSelectedSport] = useState<SportType | null>(null);
  const [embeddedTitle, setEmbeddedTitle] = useState('');
  const [embeddedUrl, setEmbeddedUrl] = useState('');
  useEffect(() => {
  setAudioModeAsync({
    playsInSilentMode: true,
    shouldPlayInBackground: true,
  }).catch((error) => {
    console.log('Audio mode setup error:', error);
  });

  fetchLiveStatus(); // 👈 ADD THIS LINE

}, []);
useEffect(() => {
  const interval = setInterval(() => {
    fetchLiveStatus();
  }, 30000);

  return () => clearInterval(interval);
}, []);

  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
const [recentEvents, setRecentEvents] = useState<EventItem[]>([]);
const [upcomingEvents, setUpcomingEvents] = useState<EventItem[]>([]);
const [allEvents, setAllEvents] = useState<EventItem[]>([]);
  const [schoolConfig, setSchoolConfig] = useState(() =>
    getDefaultSchoolConfig(SCHOOL_SLUG)
  );
  const [newsLoading, setNewsLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showLaunchVideo, setShowLaunchVideo] = useState(true);

 const [expoPushToken, setExpoPushToken] = useState('');
const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);
const [notificationsEnabled, setNotificationsEnabled] = useState(false);
const [followedTeams, setFollowedTeams] = useState<string[]>([]);

const [liveStatus, setLiveStatus] = useState({
  audio: true,
  video: true,
});
const fetchLiveStatus = async () => {
  const { data, error } = await supabase
    .from('live_status')
    .select('*')
    .eq('id', 1)
    .single();

  if (data) {
    setLiveStatus({
      audio: data.audio_live,
      video: data.video_live,
    });
  }
};


  const isPlaying = Boolean((playerStatus as any)?.playing);
  const isLoading = Boolean((playerStatus as any)?.loading);
  const asnAudioPlaying = Boolean((asnPlayerStatus as any)?.playing);

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

  const loadHomeFeeds = async () => {
  try {
    setNewsLoading(true);
    setEventsLoading(true);

    const [nextSchoolConfig, stories, scheduleEvents] = await Promise.all([
      getSchoolConfigBySlug(SCHOOL_SLUG),
      getStoriesBySchoolSlug(SCHOOL_SLUG),
      getScheduleEventsBySchoolSlug(SCHOOL_SLUG),
    ]);

    const news = stories
      .map((story) => mapStoryToHomeNewsItem(story, nextSchoolConfig.mainSiteUrl))
      .filter((item) => item.title && item.link)
      .map((item) => ({
        ...item,
        date: formatDate(item.rawDate),
      }));

    const allScheduleEvents = scheduleEvents.map((event) => {
      const mapped = mapScheduleEventToHomeEventItem(
        event,
        nextSchoolConfig.scheduleUrl
      );

      return {
        ...mapped,
        date: formatDate(mapped.rawDate),
      };
    });

    const recent = filterRecentResultEvents(allScheduleEvents).slice(0, 10);
    const upcoming = filterUpcomingWeekEvents(allScheduleEvents).slice(0, 10);

    console.log('RECENT FINALS COUNT:', recent.length);
    console.log('UPCOMING COUNT:', upcoming.length);

    setNewsItems(news.slice(0, 8));
    setRecentEvents(recent);
    setUpcomingEvents(upcoming);
    setAllEvents(allScheduleEvents);
    setSchoolConfig(nextSchoolConfig);
  } catch (error) {
    console.log('Home feed load error:', error);
    setNewsItems([]);
    setRecentEvents([]);
    setUpcomingEvents([]);
    setAllEvents([]);
  } finally {
    setNewsLoading(false);
    setEventsLoading(false);
  }
};

  useEffect(() => {
    loadHomeFeeds();
  }, []);

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

        if (savedEnabled === 'true') {
          setNotificationsEnabled(true);
          setShowNotificationPrompt(false);
        } else {
          setShowNotificationPrompt(savedDismissed === 'true' ? false : true);
        }
      } catch (error) {
        console.log('Preference load error:', error);
      }
    };

    loadSavedPreferences();
  }, []);

 useEffect(() => {
  const checkNotificationStatus = async () => {
    try {
      const { status } = await Notifications.getPermissionsAsync();

      if (status === 'granted') {
        setNotificationsEnabled(true);
        setShowNotificationPrompt(false);

        await AsyncStorage.setItem(STORAGE_KEYS.notificationsEnabled, 'true');

        const token = await registerForPushNotificationsAsync();

        if (token) {
          setExpoPushToken(token);
          await savePushToken(token); // 👈 THIS IS THE IMPORTANT LINE
        }
      }
    } catch (error) {
      console.log('Notification status check error:', error);
    }
  };

  checkNotificationStatus();
}, []);

  useEffect(() => {
    if (expoPushToken) {
      console.log('Expo push token:', expoPushToken);
    }
  }, [expoPushToken]);

  const toggleFollowTeam = async (teamKey: string) => {
    try {
      let updated: string[];

      if (followedTeams.includes(teamKey)) {
        updated = followedTeams.filter((key) => key !== teamKey);
      } else {
        updated = [...followedTeams, teamKey];
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

  const handleEnableNotifications = async () => {
  try {
    const token = await registerForPushNotificationsAsync();

    if (!token) {
      Alert.alert(
        'Notifications Not Enabled',
        'We could not get permission for notifications on this device.'
      );
      return;
    }

    setExpoPushToken(token);
    await savePushToken(token);

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

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await loadHomeFeeds();
    } finally {
      setRefreshing(false);
    }
  };

  const openEmbedded = (title: string, url: string) => {
    setEmbeddedTitle(title);
    setEmbeddedUrl(url);
    setScreenMode('embedded');
  };

  const openSport = (sport: SportType) => {
    setSelectedSport(sport);
    setScreenMode('sportDetail');
  };

  const closeSpecialScreen = () => {
    setScreenMode('tabs');
    setEmbeddedTitle('');
    setEmbeddedUrl('');
  };

  const toggleAudio = async () => {
  try {
    if (isPlaying) {
      await player.pause();

      if (Platform.OS === 'android') {
        player.setActiveForLockScreen(false);
      }

      return;
    }

    if (Platform.OS === 'android') {
      player.setActiveForLockScreen(true, {
        title: 'Patriot Sports Network',
        artist: 'Pike Road Athletics',
        albumTitle: 'Live Stream',
      });
    }

    await player.play();
  } catch (error) {
    console.log('Audio toggle error:', error);
    Alert.alert('Audio Error', 'Could not start the stream.');
  }
};

const toggleAsnAudio = async () => {
  try {
    if (asnAudioPlaying) {
      await asnPlayer.pause();

      if (Platform.OS === 'android') {
        asnPlayer.setActiveForLockScreen(false);
      }

      return;
    }

    if (Platform.OS === 'android') {
      asnPlayer.setActiveForLockScreen(true, {
        title: 'Aggie Sports Network',
        artist: 'Sylacauga Athletics',
        albumTitle: 'Live Stream',
      });
    }

    await asnPlayer.play();
  } catch (error) {
    console.log('ASN audio toggle error:', error);
    Alert.alert('Audio Error', 'Could not start the ASN stream.');
  }
};

const checkLiveStatus = async () => {
  try {
    const response = await fetch(
      'http://192.168.1.114:3000/live-status.json?ts=' + Date.now()
    );
    const data = await response.json();

    console.log('LIVE STATUS JSON:', data);

    setLiveStatus({
      audio: data.audio === true,
      video: data.video === true,
    });
  } catch (error) {
    console.log('Live status fetch error:', error);
  }
};

/*
useEffect(() => {
  checkLiveStatus();

  const interval = setInterval(() => {
    checkLiveStatus();
  }, 5000);

  return () => clearInterval(interval);
}, []);
*/

  if (showLaunchSplash) {
  return <LaunchSplash />;
}

if (showLaunchVideo) {
  return <LaunchVideo onFinish={() => setShowLaunchVideo(false)} />;
}

  if (screenMode === 'embedded' && embeddedUrl) {
    return (
      <EmbeddedWebView
        url={embeddedUrl}
        headerTitle={embeddedTitle}
        onBack={closeSpecialScreen}
      />
    );
  }

  if (screenMode === 'sportDetail' && selectedSport) {
    return (
      <SafeAreaView style={styles.appShell}>
        <StatusBar barStyle="light-content" />
        <SportDetailScreen
          sport={selectedSport}
          onBack={closeSpecialScreen}
          onOpenEmbedded={openEmbedded}
          followedTeams={followedTeams}
          onToggleFollowTeam={toggleFollowTeam}
        />
        <AudioMiniPlayer
          isPlaying={isPlaying}
          isLoading={isLoading}
          onToggle={toggleAudio}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.appShell}>
      <StatusBar barStyle="light-content" />

      {activeTab === 'home' ? (
        <HomeScreen
  onOpenEmbedded={openEmbedded}
  onOpenSport={openSport}
  onToggleAudio={toggleAudio}
  onGoToAsn={() => setActiveTab('asn')}
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
/>
      ) : null}

      {activeTab === 'teams' ? (
        <TeamsScreen onOpenSport={openSport} />
      ) : null}

      {activeTab === 'asn' ? (
        <ASNScreen
  onOpenEmbedded={openEmbedded}
  onOpenExternal={(url) => Linking.openURL(url)}
  onToggleAsnAudio={toggleAsnAudio}
  asnAudioPlaying={asnAudioPlaying}
  liveStatus={liveStatus}
/>
      ) : null}

     {activeTab === 'tickets' ? (
  <TicketsScreen onOpenEmbedded={openEmbedded} />
) : null}

      {activeTab === 'scs' ? (
  <EmbeddedWebView
    title="Pike Road City Schools"
    url={SCS_SITE_URL}
    onBack={() => setActiveTab('home')}
  />
) : null}

      <AudioMiniPlayer
        isPlaying={isPlaying}
        isLoading={isLoading}
        onToggle={toggleAudio}
      />
      <BottomNav activeTab={activeTab} onChange={setActiveTab} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  appShell: {
    flex: 1,
    backgroundColor: BRAND.background,
  },

  screen: {
    flex: 1,
    backgroundColor: BRAND.background,
  },

  screenContent: {
    paddingBottom: 28,
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
    paddingTop: 18,
    paddingHorizontal: 16,
    paddingBottom: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },

  teamLogoBox: {
    width: 74,
    height: 74,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },

  headerTeamLogo: {
    width: 56,
    height: 56,
  },

  headerTitleWrap: {
    flex: 1,
  },

  appTitle: {
    color: BRAND.white,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 0.2,
  },

  appSubtitle: {
    color: BRAND.lightGray,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },

  heroButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  topIconWrap: {
    flex: 1,
    alignItems: 'center',
  },

  topIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },

  topIconLabel: {
    color: BRAND.white,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },

  liveNowCard: {
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 22,
    padding: 18,
    backgroundColor: BRAND.surface,
    borderWidth: 1,
    borderColor: BRAND.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  liveNowLeft: {
    flex: 1,
    paddingRight: 12,
  },

  liveNowEyebrow: {
    color: BRAND.red,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 6,
  },

  liveNowTitle: {
    color: BRAND.white,
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 6,
  },

  liveNowText: {
    color: BRAND.gray,
    fontSize: 14,
    lineHeight: 20,
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
    padding: 16,
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
    lineHeight: 20,
  },

  notificationButtonRow: {
    flexDirection: 'row',
  },

  notificationPrimaryButton: {
    backgroundColor: BRAND.primary,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 10,
  },

  notificationPrimaryButtonText: {
    color: BRAND.white,
    fontSize: 14,
    fontWeight: '800',
  },

  notificationSecondaryButton: {
    backgroundColor: BRAND.surfaceAlt,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: BRAND.border,
  },

  notificationSecondaryButtonText: {
    color: BRAND.white,
    fontSize: 14,
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

  teamGamesRow: {
  paddingHorizontal: 16,
  paddingRight: 24,
},

teamGameCard: {
  width: 220,
  minHeight: 140,
  backgroundColor: BRAND.surface,
  borderWidth: 1,
  borderColor: BRAND.border,
  borderRadius: 22,
  paddingHorizontal: 18,
  paddingVertical: 16,
  marginRight: 12,
  justifyContent: 'space-between',
},

teamGameTime: {
  color: BRAND.gray,
  fontSize: 13,
  fontWeight: '600',
  marginTop: 4,
},

teamGameMatchup: {
  color: BRAND.white,
  fontSize: 17,
  fontWeight: '900',
  lineHeight: 22,
  marginBottom: 14,
},

teamGameDate: {
  color: BRAND.lightGray,
  fontSize: 15,
  fontWeight: '800',
},

teamGameTime: {
  color: BRAND.gray,
  fontSize: 14,
  fontWeight: '600',
  marginTop: 4,
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
  fontSize: 13,
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
  minWidth: 140,
  borderRadius: 999,
  paddingHorizontal: 12,
  paddingVertical: 10,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
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
  marginRight: 6,
},

heroStatusText: {
  color: BRAND.white,
  fontSize: 12,
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
    fontSize: 14,
    lineHeight: 20,
  },

  sponsorLogo: {
    width: 100,
    height: 100,
    marginLeft: 10,
  },

  emptyCard: {
    marginHorizontal: 16,
    backgroundColor: BRAND.surface,
    borderWidth: 1,
    borderColor: BRAND.border,
    borderRadius: 20,
    padding: 18,
  },

  emptyTitle: {
    color: BRAND.white,
    fontSize: 16,
    fontWeight: '800',
  },

  emptyText: {
    color: BRAND.gray,
    fontSize: 14,
    marginTop: 6,
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
    paddingTop: 20,
    paddingBottom: 22,
    paddingHorizontal: 16,
    marginBottom: 14,
  },

  scheduleHeroLogoWrap: {
    alignItems: 'center',
    marginBottom: 10,
  },

  scheduleHeroLogo: {
    width: 86,
    height: 86,
  },

  scheduleHeroTitle: {
    color: BRAND.white,
    fontSize: 30,
    fontWeight: '800',
    textAlign: 'center',
  },

  scheduleHeroSub: {
    color: BRAND.lightGray,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 4,
  },

  scheduleLoadingText: {
    color: BRAND.gray,
    fontSize: 14,
    marginTop: 10,
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
    alignItems: 'center',
  },

  scheduleCardLeft: {
    flex: 1,
    paddingRight: 10,
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

  scheduleMeta: {
    color: BRAND.lightGray,
    fontSize: 14,
    marginTop: 8,
    fontWeight: '700',
  },

  scheduleMetaSecondary: {
    color: BRAND.gray,
    fontSize: 13,
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

resultTeamName: {
  color: BRAND.white,
  fontSize: 17,
  fontWeight: '800',
  flex: 1,
  paddingRight: 10,
},
resultTeamRowLeft: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
},

teamGamesRow: {
  paddingHorizontal: 16,
  paddingRight: 28,
},

teamGameCard: {
  width: 210,
  height: 110,
  backgroundColor: BRAND.surface,
  borderWidth: 1,
  borderColor: BRAND.border,
  borderRadius: 20,
  paddingHorizontal: 18,
  paddingVertical: 16,
  marginRight: 12,
  justifyContent: 'space-between',
},

teamGameMatchup: {
  color: BRAND.white,
  fontSize: 16,
  fontWeight: '900',
  lineHeight: 21,
},

teamGameDate: {
  color: BRAND.lightGray,
  fontSize: 14,
  fontWeight: '700',
},

resultOpponentName: {
  color: BRAND.lightGray,
  fontSize: 17,
  fontWeight: '700',
  flex: 1,
  paddingRight: 10,
},

resultScore: {
  color: BRAND.white,
  fontSize: 22,
  fontWeight: '900',
  minWidth: 28,
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
    justifyContent: 'space-between',
  },

  sportActionSingleWrap: {
    paddingHorizontal: 16,
  },

  sportActionCard: {
    width: '48%',
    backgroundColor: BRAND.surface,
    borderWidth: 1,
    borderColor: BRAND.border,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
  },

  sportActionCardFull: {
    width: '100%',
    backgroundColor: BRAND.surface,
    borderWidth: 1,
    borderColor: BRAND.border,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
  },

  sportActionText: {
    color: BRAND.white,
    fontSize: 15,
    fontWeight: '800',
    marginTop: 12,
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
    paddingTop: 8,
    paddingBottom: 10,
    minHeight: 76,
    alignItems: 'flex-end',
  },

  bottomNavItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    minHeight: 56,
  },

  bottomNavItemAsn: {
    justifyContent: 'center',
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

  asnTabWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#1c1b1b',
    borderWidth: 1,
    borderColor: BRAND.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },

  asnTabWrapActive: {
    backgroundColor: BRAND.primaryDark,
    borderColor: BRAND.primary,
  },

  asnTabLogo: {
    width: 100,
    height: 100,
  },

  asnTabLabel: {
    color: BRAND.gray,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
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
