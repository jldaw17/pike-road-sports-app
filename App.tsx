import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    setAudioModeAsync,
    useAudioPlayer,
    useAudioPlayerStatus,
} from 'expo-audio';
import { LinearGradient } from 'expo-linear-gradient';
import * as Notifications from 'expo-notifications';
import { XMLParser } from 'fast-xml-parser';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    BackHandler,
    Image,
    Linking,
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

const BRAND = {
  black: '#000000',
  gold: '#C5A253',
  goldDark: '#A88A3F',
  gray: '#6B7280',
  lightGray: '#F3F4F6',
  white: '#FFFFFF',
  border: '#E5E7EB',
  offWhite: '#F8F8F8',
};

const STREAM_URL = 'https://ice66.securenetsystems.net/WRFSFM';
const NEWS_RSS_URL =
  'https://wetumpkasports.com/landing/headlines-featured?print=rss';
const EVENTS_RSS_URL =
  'http://wetumpkasports.com/composite?print=rss&view=2';

const URLS = {
  watch: 'https://wetumpkasports.com/watch-on-site',
  schedule: 'https://wetumpkasports.com/composite',
  collierFord: 'https://www.collierfordinc.com/',
};

type TabKey = 'home' | 'teams' | 'watch' | 'schedule';
type ScreenMode = 'tabs' | 'sportDetail' | 'embedded';

type SportType = {
  key: string;
  label: string;
  mainUrl: string;
  scheduleUrl: string;
  rosterUrl: string;
  statsUrl: string;
  newsRssUrl: string;
  allEventsRssUrl: string;
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
};

const SPORTS: SportType[] = [
  {
    key: 'football',
    label: 'Football',
    mainUrl: 'https://wetumpkasports.com/sports/fball/index',
    scheduleUrl: 'https://wetumpkasports.com/sports/fball/2025-26/schedule',
    rosterUrl: 'https://wetumpkasports.com/sports/fball/2025-26/roster',
    statsUrl: 'https://wetumpkasports.com/sports/fball/2025-26/teams',
    newsRssUrl:
      'http://wetumpkasports.com/sports/fball/headlines-featured?print=rss',
    allEventsRssUrl:
      'http://wetumpkasports.com/sports/fball/composite?print=rss',
  },
  {
    key: 'baseball',
    label: 'Baseball',
    mainUrl: 'https://wetumpkasports.com/sports/bsb/index',
    scheduleUrl: 'https://wetumpkasports.com/sports/bsb/2025-26/schedule',
    rosterUrl: 'https://wetumpkasports.com/sports/bsb/2025-26/roster',
    statsUrl: 'https://wetumpkasports.com/sports/bsb/2025-26/teams',
    newsRssUrl:
      'http://wetumpkasports.com/sports/bsb/headlines-featured?print=rss',
    allEventsRssUrl:
      'http://wetumpkasports.com/sports/bsb/composite?print=rss',
  },
  {
    key: 'boys-basketball',
    label: "Men's Basketball",
    mainUrl: 'https://wetumpkasports.com/sports/mbkb/index',
    scheduleUrl: 'https://wetumpkasports.com/sports/mbkb/2025-26/schedule',
    rosterUrl: 'https://wetumpkasports.com/sports/mbkb/2025-26/roster',
    statsUrl: 'https://wetumpkasports.com/sports/mbkb/2025-26/teams',
    newsRssUrl:
      'http://wetumpkasports.com/sports/mbkb/headlines-featured?print=rss',
    allEventsRssUrl:
      'http://wetumpkasports.com/sports/mbkb/composite?print=rss',
  },
  {
    key: 'girls-basketball',
    label: "Women's Basketball",
    mainUrl: 'https://wetumpkasports.com/sports/wbkb/index',
    scheduleUrl: 'https://wetumpkasports.com/sports/wbkb/2025-26/schedule',
    rosterUrl: 'https://wetumpkasports.com/sports/wbkb/2025-26/roster',
    statsUrl: 'https://wetumpkasports.com/sports/wbkb/2025-26/teams',
    newsRssUrl:
      'http://wetumpkasports.com/sports/wbkb/headlines-featured?print=rss',
    allEventsRssUrl:
      'http://wetumpkasports.com/sports/wbkb/composite?print=rss',
  },
  {
    key: 'softball',
    label: 'Softball',
    mainUrl: 'https://wetumpkasports.com/sports/sball/index',
    scheduleUrl: 'https://wetumpkasports.com/sports/sball/2025-26/schedule',
    rosterUrl: 'https://wetumpkasports.com/sports/sball/2025-26/roster',
    statsUrl: 'https://wetumpkasports.com/sports/sball/2025-26/teams',
    newsRssUrl:
      'http://wetumpkasports.com/sports/sball/headlines-featured?print=rss',
    allEventsRssUrl:
      'http://wetumpkasports.com/sports/sball/composite?print=rss',
  },
  {
    key: 'volleyball',
    label: 'Volleyball',
    mainUrl: 'https://wetumpkasports.com/sports/wvball/index',
    scheduleUrl: 'https://wetumpkasports.com/sports/wvball/2025-26/schedule',
    rosterUrl: 'https://wetumpkasports.com/sports/wvball/2025-26/roster',
    statsUrl: 'https://wetumpkasports.com/sports/wvball/2025-26/teams',
    newsRssUrl:
      'http://wetumpkasports.com/sports/wvball/headlines-featured?print=rss',
    allEventsRssUrl:
      'http://wetumpkasports.com/sports/wvball/composite?print=rss',
  },
  {
    key: 'boys-soccer',
    label: 'Soccer',
    mainUrl: 'https://wetumpkasports.com/sports/msoc/index',
    scheduleUrl: 'https://wetumpkasports.com/sports/msoc/2025-26/schedule',
    rosterUrl: 'https://wetumpkasports.com/sports/msoc/2025-26/roster',
    statsUrl: 'https://wetumpkasports.com/sports/msoc/2025-26/teams',
    newsRssUrl:
      'http://wetumpkasports.com/sports/msoc/headlines-featured?print=rss',
    allEventsRssUrl:
      'http://wetumpkasports.com/sports/msoc/composite?print=rss',
  },
  {
    key: 'girls-soccer',
    label: "Women's Soccer",
    mainUrl: 'https://wetumpkasports.com/sports/wsoc/index',
    scheduleUrl: 'https://wetumpkasports.com/sports/wsoc/2025-26/schedule',
    rosterUrl: 'https://wetumpkasports.com/sports/wsoc/2025-26/roster',
    statsUrl: 'https://wetumpkasports.com/sports/wsoc/2025-26/teams',
    newsRssUrl:
      'http://wetumpkasports.com/sports/wsoc/headlines-featured?print=rss',
    allEventsRssUrl:
      'http://wetumpkasports.com/sports/wsoc/composite?print=rss',
  },
  {
    key: 'cross-country-boys',
    label: 'Cross Country',
    mainUrl: 'https://wetumpkasports.com/sports/mxc/index',
    scheduleUrl: 'https://wetumpkasports.com/sports/mxc/2025-26/schedule',
    rosterUrl: 'https://wetumpkasports.com/sports/mxc/2025-26/roster',
    statsUrl: 'https://wetumpkasports.com/sports/mxc/2025-26/teams',
    newsRssUrl:
      'http://wetumpkasports.com/sports/mxc/headlines-featured?print=rss',
    allEventsRssUrl:
      'http://wetumpkasports.com/sports/mxc/composite?print=rss',
  },
  {
    key: 'cross-country-girls',
    label: "Women's Cross Country",
    mainUrl: 'https://wetumpkasports.com/sports/wxc/index',
    scheduleUrl: 'https://wetumpkasports.com/sports/wxc/2025-26/schedule',
    rosterUrl: 'https://wetumpkasports.com/sports/wxc/2025-26/roster',
    statsUrl: 'https://wetumpkasports.com/sports/wxc/2025-26/teams',
    newsRssUrl:
      'http://wetumpkasports.com/sports/wxc/headlines-featured?print=rss',
    allEventsRssUrl:
      'http://wetumpkasports.com/sports/wxc/composite?print=rss',
  },
  {
    key: 'boys-tennis',
    label: "Men's Tennis",
    mainUrl: 'https://wetumpkasports.com/sports/mten/index',
    scheduleUrl: 'https://wetumpkasports.com/sports/mten/2025-26/schedule',
    rosterUrl: 'https://wetumpkasports.com/sports/mten/2025-26/roster',
    statsUrl: 'https://wetumpkasports.com/sports/mten/2025-26/teams',
    newsRssUrl:
      'http://wetumpkasports.com/sports/mten/headlines-featured?print=rss',
    allEventsRssUrl:
      'http://wetumpkasports.com/sports/mten/composite?print=rss',
  },
  {
    key: 'girls-tennis',
    label: "Women's Tennis",
    mainUrl: 'https://wetumpkasports.com/sports/wten/index',
    scheduleUrl: 'https://wetumpkasports.com/sports/wten/2025-26/schedule',
    rosterUrl: 'https://wetumpkasports.com/sports/wten/2025-26/roster',
    statsUrl: 'https://wetumpkasports.com/sports/wten/2025-26/teams',
    newsRssUrl:
      'http://wetumpkasports.com/sports/wten/headlines-featured?print=rss',
    allEventsRssUrl:
      'http://wetumpkasports.com/sports/wten/composite?print=rss',
  },
  {
    key: 'golf-boys',
    label: "Men's Golf",
    mainUrl: 'https://wetumpkasports.com/sports/mgolf/index',
    scheduleUrl: 'https://wetumpkasports.com/sports/mgolf/2025-26/schedule',
    rosterUrl: 'https://wetumpkasports.com/sports/mgolf/2025-26/roster',
    statsUrl: 'https://wetumpkasports.com/sports/mgolf/2025-26/teams',
    newsRssUrl:
      'http://wetumpkasports.com/sports/mgolf/headlines-featured?print=rss',
    allEventsRssUrl:
      'http://wetumpkasports.com/sports/mgolf/composite?print=rss',
  },
  {
    key: 'golf-girls',
    label: "Women's Golf",
    mainUrl: 'https://wetumpkasports.com/sports/wgolf/index',
    scheduleUrl: 'https://wetumpkasports.com/sports/wgolf/2025-26/schedule',
    rosterUrl: 'https://wetumpkasports.com/sports/wgolf/2025-26/roster',
    statsUrl: 'https://wetumpkasports.com/sports/wgolf/2025-26/teams',
    newsRssUrl:
      'http://wetumpkasports.com/sports/wgolf/headlines-featured?print=rss',
    allEventsRssUrl:
      'http://wetumpkasports.com/sports/wgolf/composite?print=rss',
  },
  {
    key: 'track-boys',
    label: 'Track & Field',
    mainUrl: 'https://wetumpkasports.com/sports/mtrack/index',
    scheduleUrl: 'https://wetumpkasports.com/sports/mtrack/2025-26/schedule',
    rosterUrl: 'https://wetumpkasports.com/sports/mtrack/2025-26/roster',
    statsUrl: 'https://wetumpkasports.com/sports/mtrack/2025-26/teams',
    newsRssUrl:
      'http://wetumpkasports.com/sports/mtrack/headlines-featured?print=rss',
    allEventsRssUrl:
      'http://wetumpkasports.com/sports/mtrack/composite?print=rss',
  },
  {
    key: 'track-girls',
    label: "Women's Track & Field",
    mainUrl: 'https://wetumpkasports.com/sports/wtrack/index',
    scheduleUrl: 'https://wetumpkasports.com/sports/wtrack/2025-26/schedule',
    rosterUrl: 'https://wetumpkasports.com/sports/wtrack/2025-26/roster',
    statsUrl: 'https://wetumpkasports.com/sports/wtrack/2025-26/teams',
    newsRssUrl:
      'http://wetumpkasports.com/sports/wtrack/headlines-featured?print=rss',
    allEventsRssUrl:
      'http://wetumpkasports.com/sports/wtrack/composite?print=rss',
  },
  {
    key: 'cheer',
    label: 'Cheer',
    mainUrl: 'https://wetumpkasports.com/sports/cheer/index',
    scheduleUrl: 'https://wetumpkasports.com/sports/cheer/2025-26/schedule',
    rosterUrl: 'https://wetumpkasports.com/sports/cheer/2025-26/roster',
    statsUrl: 'https://wetumpkasports.com/sports/cheer/2025-26/teams',
    newsRssUrl:
      'http://wetumpkasports.com/sports/cheer/headlines-featured?print=rss',
    allEventsRssUrl:
      'http://wetumpkasports.com/sports/cheer/composite?print=rss',
  },
  {
    key: 'dance',
    label: 'Dance',
    mainUrl: 'https://wetumpkasports.com/sports/dance/index',
    scheduleUrl: 'https://wetumpkasports.com/sports/dance/2025-26/schedule',
    rosterUrl: 'https://wetumpkasports.com/sports/dance/2025-26/roster',
    statsUrl: 'https://wetumpkasports.com/sports/dance/2025-26/teams',
    newsRssUrl:
      'http://wetumpkasports.com/sports/dance/headlines-featured?print=rss',
    allEventsRssUrl:
      'http://wetumpkasports.com/sports/dance/composite?print=rss',
  },
  {
    key: 'flag-football',
    label: 'Flag Football',
    mainUrl: 'https://wetumpkasports.com/sports/flagfball/index',
    scheduleUrl:
      'https://wetumpkasports.com/sports/flagfball/2025-26/schedule',
    rosterUrl:
      'https://wetumpkasports.com/sports/flagfball/2025-26/roster',
    statsUrl: 'https://wetumpkasports.com/sports/flagfball/2025-26/teams',
    newsRssUrl:
      'http://wetumpkasports.com/sports/flagfball/headlines-featured?print=rss',
    allEventsRssUrl:
      'http://wetumpkasports.com/sports/flagfball/composite?print=rss',
  },
  {
    key: 'wrestling-boys',
    label: "Men's Wrestling",
    mainUrl: 'https://wetumpkasports.com/sports/wrest/index',
    scheduleUrl: 'https://wetumpkasports.com/sports/wrest/2025-26/schedule',
    rosterUrl: 'https://wetumpkasports.com/sports/wrest/2025-26/roster',
    statsUrl: 'https://wetumpkasports.com/sports/wrest/2025-26/teams',
    newsRssUrl:
      'http://wetumpkasports.com/sports/wrest/headlines-featured?print=rss',
    allEventsRssUrl:
      'http://wetumpkasports.com/sports/wrest/composite?print=rss',
  },
  {
    key: 'wrestling-girls',
    label: "Women's Wrestling",
    mainUrl: 'https://wetumpkasports.com/sports/wwrest/index',
    scheduleUrl: 'https://wetumpkasports.com/sports/wwrest/2025-26/schedule',
    rosterUrl: 'https://wetumpkasports.com/sports/wwrest/2025-26/roster',
    statsUrl: 'https://wetumpkasports.com/sports/wwrest/2025-26/teams',
    newsRssUrl:
      'http://wetumpkasports.com/sports/wwrest/headlines-featured?print=rss',
    allEventsRssUrl:
      'http://wetumpkasports.com/sports/wwrest/composite?print=rss',
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
      <View style={styles.topIconCircle}>
        <Ionicons name={icon} size={20} color={BRAND.white} />
      </View>
      <Text style={styles.topIconLabel}>{label}</Text>
    </Pressable>
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
        <Text style={styles.audioBarTitle}>Listen Live</Text>
        <Text style={styles.audioBarSub}>
          {isLoading ? 'Loading stream...' : isPlaying ? 'Now Playing' : 'Paused'}
        </Text>
      </View>

      <Pressable style={styles.audioBarButton} onPress={onToggle}>
        <Ionicons
          name={isPlaying ? 'pause' : 'play'}
          size={18}
          color={BRAND.black}
        />
        <Text style={styles.audioBarButtonText}>
          {isLoading ? '...' : isPlaying ? 'Pause' : 'Play'}
        </Text>
      </Pressable>
    </View>
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

  useEffect(() => {
    const onBackPress = () => {
      if (canGoBack && webViewRef.current) {
        webViewRef.current.goBack();
        return true;
      }
      onBack();
      return true;
    };

    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      onBackPress
    );

    return () => subscription.remove();
  }, [canGoBack, onBack]);

  const onShouldStartLoadWithRequest = (request: any) => {
    const nextUrl = request?.url ?? '';

    if (
      nextUrl.startsWith('tel:') ||
      nextUrl.startsWith('mailto:') ||
      nextUrl.startsWith('sms:')
    ) {
      Linking.openURL(nextUrl).catch(() => {
        Alert.alert('Unable to open link');
      });
      return false;
    }

    return true;
  };

  return (
    <View style={styles.flexOne}>
      <View style={styles.subHeader}>
        <Pressable onPress={onBack} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={20} color={BRAND.black} />
        </Pressable>
        <Text style={styles.subHeaderTitle}>{headerTitle}</Text>
      </View>

      <View style={styles.flexOne}>
        {loading && (
          <View style={styles.loaderOverlay}>
            <ActivityIndicator size="large" color={BRAND.gold} />
          </View>
        )}

        <WebView
          ref={webViewRef}
          source={{ uri: url }}
          javaScriptEnabled
          domStorageEnabled
          sharedCookiesEnabled
          thirdPartyCookiesEnabled
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          startInLoadingState
          onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
          onNavigationStateChange={(navState: any) =>
            setCanGoBack(navState.canGoBack)
          }
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          setSupportMultipleWindows={false}
          originWhitelist={['*']}
        />
      </View>
    </View>
  );
}

function LaunchSplash() {
  return (
    <View style={styles.flashContainer}>
      <View style={styles.flashTopStripeWrap}>
        <View style={styles.flashTopStripeBlack} />
        <View style={styles.flashTopStripeGold} />
        <View style={styles.flashTopStripeBlack} />
      </View>

      <View style={styles.flashCenterArea}>
        <View style={styles.flashShadowLong} />
        <View style={styles.flashLogoPlate}>
          <Image
            source={require('./assets/whs-indian-head.png')}
            style={styles.flashMainLogo}
            resizeMode="contain"
          />
        </View>
      </View>

      <View style={styles.flashBottomBranding}>
        <Image
          source={require('./assets/wsn-logo.png')}
          style={styles.flashWSNLogo}
          resizeMode="contain"
        />

        <View style={styles.flashSponsorBadge}>
          <Image
            source={require('./assets/collier-ford-logo.png')}
            style={styles.flashSponsorImage}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.flashBottomSub}>Presented by Collier Ford</Text>
      </View>
    </View>
  );
}

function HomeScreen({
  onOpenEmbedded,
  onToggleAudio,
  newsItems,
  newsLoading,
  upcomingEvents,
  eventsLoading,
  finalAlertsEnabled,
  onEnableFinalAlerts,
  onTestFinalScoreAlert,
  broadcastAlertsEnabled,
  onEnableBroadcastAlerts,
  onTestBroadcastAlert,
  onRefresh,
  refreshing,
}: {
  onOpenEmbedded: (title: string, url: string) => void;
  onToggleAudio: () => void;
  newsItems: NewsItem[];
  newsLoading: boolean;
  upcomingEvents: EventItem[];
  eventsLoading: boolean;
  finalAlertsEnabled: boolean;
  onEnableFinalAlerts: () => void;
  onTestFinalScoreAlert: () => void;
  broadcastAlertsEnabled: boolean;
  onEnableBroadcastAlerts: () => void;
  onTestBroadcastAlert: () => void;
  onRefresh: () => void;
  refreshing: boolean;
}) {
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.screenContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <LinearGradient
        colors={[BRAND.black, '#161616']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.homeHeader}
      >
        <View style={styles.headerLeft}>
          <View style={styles.teamLogoBox}>
            <Image
              source={require('./assets/whs-indian-head.png')}
              style={styles.headerTeamLogo}
              resizeMode="contain"
            />
          </View>

          <View style={styles.headerTitleWrap}>
            <Text style={styles.appTitle} numberOfLines={1} adjustsFontSizeToFit>
              Wetumpka Athletics
            </Text>
            <Text style={styles.appSubtitle} numberOfLines={1}>
              Home of the Indians
            </Text>
          </View>
        </View>

        <View style={styles.headerRightCompact}>
          <TopIcon label="Listen" icon="headset" onPress={onToggleAudio} />
          <TopIcon
            label="Watch"
            icon="play"
            onPress={() => onOpenEmbedded('Watch Live', URLS.watch)}
          />
        </View>
      </LinearGradient>

      <Pressable
        style={styles.sponsorBanner}
        onPress={() => Linking.openURL(URLS.collierFord)}
      >
        <View style={styles.sponsorBannerLogo}>
          <Image
            source={require('./assets/collier-ford-logo.png')}
            style={styles.sponsorBannerLogoImage}
            resizeMode="contain"
          />
        </View>

        <View style={styles.flexOne}>
          <Text style={styles.sponsorBannerLabel}>PRESENTED BY</Text>
          <Text style={styles.sponsorBannerTitle}>Collier Ford</Text>
          <Text style={styles.sponsorBannerSub}>Tap to visit website</Text>
        </View>
      </Pressable>

      <View style={styles.pushBannerWrap}>
        <LinearGradient
          colors={finalAlertsEnabled ? ['#151515', '#222222'] : ['#151515', '#232323']}
          style={styles.pushBanner}
        >
          <View style={styles.pushBannerLeft}>
            <Ionicons
              name={finalAlertsEnabled ? 'notifications' : 'notifications-outline'}
              size={18}
              color={BRAND.gold}
            />
            <Text style={styles.pushBannerText}>
              {finalAlertsEnabled ? 'Final score alerts enabled' : 'Turn on final score alerts'}
            </Text>
          </View>

          <View style={styles.pushBannerRight}>
            {!finalAlertsEnabled ? (
              <Pressable style={styles.pushBannerButton} onPress={onEnableFinalAlerts}>
                <Text style={styles.pushBannerButtonText}>Enable</Text>
              </Pressable>
            ) : (
              <Pressable style={styles.pushBannerButtonAlt} onPress={onTestFinalScoreAlert}>
                <Text style={styles.pushBannerButtonAltText}>Test</Text>
              </Pressable>
            )}
          </View>
        </LinearGradient>
      </View>

      <View style={styles.pushBannerWrap}>
        <LinearGradient
          colors={broadcastAlertsEnabled ? ['#151515', '#222222'] : ['#151515', '#232323']}
          style={styles.pushBanner}
        >
          <View style={styles.pushBannerLeft}>
            <Ionicons
              name={broadcastAlertsEnabled ? 'radio' : 'radio-outline'}
              size={18}
              color={BRAND.gold}
            />
            <Text style={styles.pushBannerText}>
              {broadcastAlertsEnabled
                ? 'Live broadcast alerts enabled'
                : 'Turn on live broadcast notifications'}
            </Text>
          </View>

          <View style={styles.pushBannerRight}>
            {!broadcastAlertsEnabled ? (
              <Pressable style={styles.pushBannerButton} onPress={onEnableBroadcastAlerts}>
                <Text style={styles.pushBannerButtonText}>Enable</Text>
              </Pressable>
            ) : (
              <Pressable style={styles.pushBannerButtonAlt} onPress={onTestBroadcastAlert}>
                <Text style={styles.pushBannerButtonAltText}>Test</Text>
              </Pressable>
            )}
          </View>
        </LinearGradient>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Quick Access</Text>
      </View>

      <View style={styles.quickGrid}>
        <Pressable
          style={styles.quickCardGold}
          onPress={() => onOpenEmbedded('Watch Live', URLS.watch)}
        >
          <Ionicons name="play-circle" size={28} color={BRAND.black} />
          <Text style={styles.quickCardTextDark}>Watch Live</Text>
        </Pressable>

        <Pressable style={styles.quickCardGold} onPress={onToggleAudio}>
          <Ionicons name="radio" size={28} color={BRAND.black} />
          <Text style={styles.quickCardTextDark}>Listen Live</Text>
        </Pressable>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Upcoming Events</Text>
        <Pressable onPress={() => onOpenEmbedded('Schedule', URLS.schedule)}>
          <Text style={styles.sectionLink}>See All</Text>
        </Pressable>
      </View>

      {eventsLoading ? (
        <View style={styles.sliderLoadingWrap}>
          <ActivityIndicator size="small" color={BRAND.gold} />
        </View>
      ) : upcomingEvents.length === 0 ? (
        <View style={styles.sliderEmptyWrap}>
          <Text style={styles.sliderEmptyText}>No upcoming events this week.</Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.espnCardsRow}
        >
          {upcomingEvents.map((item, index) => (
            <Pressable
              key={`${item.id}-${index}`}
              style={styles.espnCard}
              onPress={() => onOpenEmbedded(item.title, item.link)}
            >
              <View style={styles.espnCardHeader}>
                <Text style={styles.espnCardSport}>{detectSport(item.title)}</Text>
                <Text style={styles.espnCardDate}>{item.date}</Text>
              </View>

              <View style={styles.upcomingEventCardBody}>
                <Text style={styles.upcomingEventTitle} numberOfLines={3}>
                  {item.title}
                </Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      )}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Latest News</Text>
      </View>

      {newsLoading ? (
        <View style={styles.newsLoadingWrap}>
          <ActivityIndicator size="large" color={BRAND.gold} />
          <Text style={styles.newsLoadingText}>Loading news...</Text>
        </View>
      ) : newsItems.length === 0 ? (
        <View style={styles.newsLoadingWrap}>
          <Text style={styles.newsEmptyTitle}>No news stories loaded.</Text>
          <Text style={styles.newsEmptyText}>
            The RSS feed may be blocked or may not include stories in the format the app expects.
          </Text>
        </View>
      ) : (
        newsItems.map((item, index) => (
          <Pressable
            key={`${item.link}-${index}`}
            style={styles.newsFeedCard}
            onPress={() => onOpenEmbedded(item.title, item.link)}
          >
            <View style={styles.newsFeedImage}>
              {item.image ? (
                <Image
                  source={{ uri: item.image }}
                  style={styles.newsFeedImageActual}
                  resizeMode="cover"
                />
              ) : (
                <Text style={styles.newsFeedImageText}>NEWS</Text>
              )}
            </View>

            <View style={styles.newsFeedBody}>
              <Text style={styles.newsFeedTitle}>{item.title}</Text>
              <Text style={styles.newsFeedDate}>{item.date}</Text>
              <Text style={styles.newsFeedDescription} numberOfLines={3}>
                {item.description || 'Tap to read more'}
              </Text>
            </View>
          </Pressable>
        ))
      )}
    </ScrollView>
  );
}

function TeamsScreen({
  onOpenSport,
  followedTeams,
  onToggleFollow,
}: {
  onOpenSport: (sport: SportType) => void;
  followedTeams: string[];
  onToggleFollow: (teamKey: string) => void;
}) {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.teamsScreenContent}>
      <LinearGradient colors={[BRAND.black, '#141414']} style={styles.teamsHeroBar}>
        <Text style={styles.teamsHeroTitle}>TEAMS</Text>
      </LinearGradient>

      <View style={styles.teamsListWrap}>
        {SPORTS.map((sport) => {
          const isFollowed = followedTeams.includes(sport.key);

          return (
            <View key={sport.key} style={styles.teamRowCard}>
              <Pressable
                style={styles.teamRowMain}
                onPress={() => onOpenSport(sport)}
              >
                <Text style={styles.teamRowText}>{sport.label}</Text>
                <Ionicons name="chevron-forward" size={18} color={BRAND.goldDark} />
              </Pressable>

              <Pressable
                style={[
                  styles.followPill,
                  isFollowed ? styles.followPillOn : styles.followPillOff,
                ]}
                onPress={() => onToggleFollow(sport.key)}
              >
                <Ionicons
                  name={isFollowed ? 'star' : 'star-outline'}
                  size={14}
                  color={isFollowed ? BRAND.white : BRAND.black}
                />
                <Text
                  style={[
                    styles.followPillText,
                    isFollowed ? styles.followPillTextOn : styles.followPillTextOff,
                  ]}
                >
                  {isFollowed ? 'Following' : 'Follow'}
                </Text>
              </Pressable>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

function FeedSection({
  title,
  items,
  loading,
  emptyText,
  onOpenEmbedded,
  isEventFeed = false,
}: {
  title: string;
  items: NewsItem[] | EventItem[];
  loading: boolean;
  emptyText: string;
  onOpenEmbedded: (title: string, url: string) => void;
  isEventFeed?: boolean;
}) {
  return (
    <>
      <View style={styles.sectionHeaderPadded}>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>

      {loading ? (
        <View style={styles.newsLoadingWrap}>
          <ActivityIndicator size="small" color={BRAND.gold} />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.feedEmptyCard}>
          <Text style={styles.feedEmptyText}>{emptyText}</Text>
        </View>
      ) : (
        items.map((item: any, index: number) => (
          <Pressable
            key={`${item.link}-${index}`}
            style={styles.feedListCard}
            onPress={() => onOpenEmbedded(item.title, item.link)}
          >
            {isEventFeed ? (
              <>
                <View style={styles.feedEventHeaderRow}>
                  <Text style={styles.feedListDate}>{item.date}</Text>
                  <Ionicons name="calendar-outline" size={16} color={BRAND.goldDark} />
                </View>

                <View style={styles.feedScoreWrap}>
                  <Text style={styles.upcomingEventTitle} numberOfLines={3}>
                    {item.title}
                  </Text>
                </View>

                <Text style={styles.feedListDescription} numberOfLines={2}>
                  {item.description || 'Tap to open'}
                </Text>
              </>
            ) : (
              <>
                <View style={styles.feedListTopRow}>
                  <Text style={styles.feedListTitle}>{item.title}</Text>
                  <Ionicons name="arrow-forward" size={16} color={BRAND.goldDark} />
                </View>

                <Text style={styles.feedListDate}>{item.date}</Text>
                <Text style={styles.feedListDescription} numberOfLines={2}>
                  {item.description || 'Tap to open'}
                </Text>
              </>
            )}
          </Pressable>
        ))
      )}
    </>
  );
}

function SportDetailScreen({
  sport,
  onBack,
  onOpenEmbedded,
}: {
  sport: SportType;
  onBack: () => void;
  onOpenEmbedded: (title: string, url: string) => void;
}) {
  const [teamNews, setTeamNews] = useState<NewsItem[]>([]);
  const [teamEvents, setTeamEvents] = useState<EventItem[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    setNewsLoading(true);
    setEventsLoading(true);

    try {
      const [news, events] = await Promise.all([
        fetchNewsFeed(sport.newsRssUrl),
        fetchEventsFeed(sport.allEventsRssUrl),
      ]);

      const upcomingEvents = filterUpcomingWeekEvents(events);

      setTeamNews(news.slice(0, 5));
      setTeamEvents(upcomingEvents.slice(0, 4));
    } catch (error) {
      console.log('Sport detail feed error:', error);
      setTeamNews([]);
      setTeamEvents([]);
    } finally {
      setNewsLoading(false);
      setEventsLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initialLoad = async () => {
      if (!mounted) return;
      await load();
    };

    initialLoad();

    const interval = setInterval(() => {
      if (mounted) load();
    }, 60000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [sport]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.sportDetailContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <LinearGradient colors={[BRAND.black, '#151515']} style={styles.sportTopBar}>
        <Pressable onPress={onBack} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={20} color={BRAND.black} />
        </Pressable>

        <View style={styles.sportTopBarTitleWrap}>
          <Text style={styles.sportTopBarTitle}>{sport.label.toUpperCase()}</Text>
        </View>
      </LinearGradient>

      <View style={styles.sportActionRow}>
        <Pressable
          style={styles.goldActionButton}
          onPress={() => onOpenEmbedded(`${sport.label} Schedule`, sport.scheduleUrl)}
        >
          <Ionicons name="calendar-outline" size={16} color={BRAND.black} />
          <Text style={styles.goldActionText}>SCHEDULE</Text>
        </Pressable>

        <Pressable
          style={styles.goldActionButton}
          onPress={() => onOpenEmbedded(`${sport.label} Roster`, sport.rosterUrl)}
        >
          <Ionicons name="people-outline" size={16} color={BRAND.black} />
          <Text style={styles.goldActionText}>ROSTER</Text>
        </Pressable>

        <Pressable
          style={styles.goldActionButton}
          onPress={() => onOpenEmbedded(`${sport.label} Stats`, sport.statsUrl)}
        >
          <Ionicons name="stats-chart-outline" size={16} color={BRAND.black} />
          <Text style={styles.goldActionText}>STATS</Text>
        </Pressable>
      </View>

      <FeedSection
        title="Latest Team News"
        items={teamNews}
        loading={newsLoading}
        emptyText="No team news available right now."
        onOpenEmbedded={onOpenEmbedded}
      />

      <FeedSection
        title="Upcoming Team Events"
        items={teamEvents}
        loading={eventsLoading}
        emptyText="No upcoming team events this week."
        onOpenEmbedded={onOpenEmbedded}
        isEventFeed
      />

      <View style={styles.sectionHeaderPadded}>
        <Text style={styles.sectionTitle}>More</Text>
      </View>

      <View style={styles.upcomingRow}>
        <Pressable
          style={styles.upcomingCard}
          onPress={() => onOpenEmbedded(`${sport.label} Team Page`, sport.mainUrl)}
        >
          <Text style={styles.upcomingDate}>TEAM PAGE</Text>
          <Text style={styles.upcomingSport}>{sport.label}</Text>
          <Text style={styles.upcomingMeta}>Open official team page</Text>
        </Pressable>

        <Pressable
          style={styles.upcomingCard}
          onPress={() => onOpenEmbedded(`${sport.label} Schedule`, sport.scheduleUrl)}
        >
          <Text style={styles.upcomingDate}>FULL SCHEDULE</Text>
          <Text style={styles.upcomingSport}>{sport.label}</Text>
          <Text style={styles.upcomingMeta}>Open complete schedule</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function TabButton({
  label,
  icon,
  active,
  onPress,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.bottomTabButton} onPress={onPress}>
      <Ionicons
        name={icon}
        size={20}
        color={active ? BRAND.gold : BRAND.black}
      />
      <Text style={[styles.bottomTabText, active && styles.bottomTabTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function App() {
  const player = useAudioPlayer(STREAM_URL);
  const playerStatus = useAudioPlayerStatus(player);

  const [showLaunchSplash, setShowLaunchSplash] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const [screenMode, setScreenMode] = useState<ScreenMode>('tabs');
  const [selectedSport, setSelectedSport] = useState<SportType | null>(null);
  const [embeddedTitle, setEmbeddedTitle] = useState('');
  const [embeddedUrl, setEmbeddedUrl] = useState('');
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<EventItem[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [finalAlertsEnabled, setFinalAlertsEnabled] = useState(false);
  const [broadcastAlertsEnabled, setBroadcastAlertsEnabled] = useState(false);
  const [followedTeams, setFollowedTeams] = useState<string[]>([]);
  const [expoPushToken, setExpoPushToken] = useState('');

  const loadHomeFeeds = async () => {
    try {
      setNewsLoading(true);
      setEventsLoading(true);

      const [news, events] = await Promise.all([
        fetchNewsFeed(NEWS_RSS_URL),
        fetchEventsFeed(EVENTS_RSS_URL),
      ]);

      const weekEvents = filterUpcomingWeekEvents(events);

      setNewsItems(news.slice(0, 8));
      setUpcomingEvents(weekEvents.slice(0, 10));
    } catch (error) {
      console.log('Home feed load error:', error);
      setNewsItems([]);
      setUpcomingEvents([]);
    } finally {
      setNewsLoading(false);
      setEventsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLaunchSplash(false);
    }, 2200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    loadHomeFeeds();
  }, []);

  useEffect(() => {
    const configureAudio = async () => {
      try {
        await setAudioModeAsync({
          playsInSilentMode: true,
          shouldPlayInBackground: true,
          interruptionMode: 'doNotMix',
        });
      } catch (error) {
        console.log('Audio mode setup error:', error);
      }
    };

    configureAudio();
  }, []);

  useEffect(() => {
    const loadSavedPreferences = async () => {
      try {
        const savedTeams = await AsyncStorage.getItem('followedTeams');
        const savedFinalAlerts = await AsyncStorage.getItem('finalAlertsEnabled');
        const savedBroadcastAlerts = await AsyncStorage.getItem('broadcastAlertsEnabled');

        if (savedTeams) setFollowedTeams(JSON.parse(savedTeams));
        if (savedFinalAlerts === 'true') setFinalAlertsEnabled(true);
        if (savedBroadcastAlerts === 'true') setBroadcastAlertsEnabled(true);
      } catch (error) {
        console.log('Preference load error:', error);
      }
    };

    loadSavedPreferences();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      loadHomeFeeds();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const onRefreshHome = async () => {
    setRefreshing(true);
    await loadHomeFeeds();
    setRefreshing(false);
  };

  const ensurePushPermissionAndToken = async () => {
    const existing = await Notifications.getPermissionsAsync();
    let finalStatus = existing.status;

    if (finalStatus !== 'granted') {
      const requested = await Notifications.requestPermissionsAsync();
      finalStatus = requested.status;
    }

    if (finalStatus !== 'granted') {
      throw new Error('Permission not granted');
    }

    if (!expoPushToken) {
      const token = await Notifications.getExpoPushTokenAsync();
      setExpoPushToken(token.data);
      console.log('Expo push token:', token.data);
    }
  };

  const enableFinalAlerts = async () => {
    try {
      await ensurePushPermissionAndToken();
      await AsyncStorage.setItem('finalAlertsEnabled', 'true');
      setFinalAlertsEnabled(true);
      Alert.alert(
        'Final score alerts enabled',
        'This device is ready to receive final score push notifications.'
      );
    } catch {
      Alert.alert('Notifications not enabled', 'Permission was not granted.');
    }
  };

  const enableBroadcastAlerts = async () => {
    try {
      await ensurePushPermissionAndToken();
      await AsyncStorage.setItem('broadcastAlertsEnabled', 'true');
      setBroadcastAlertsEnabled(true);
      Alert.alert(
        'Broadcast alerts enabled',
        'This device is now set to receive live radio and video broadcast alerts.'
      );
    } catch {
      Alert.alert('Notifications not enabled', 'Permission was not granted.');
    }
  };

  const toggleFollowTeam = async (teamKey: string) => {
    try {
      let updated: string[] = [];
      if (followedTeams.includes(teamKey)) {
        updated = followedTeams.filter((key) => key !== teamKey);
      } else {
        updated = [...followedTeams, teamKey];
      }
      setFollowedTeams(updated);
      await AsyncStorage.setItem('followedTeams', JSON.stringify(updated));
    } catch (error) {
      console.log('Follow toggle error:', error);
    }
  };

  const sendTestFinalScoreNotification = async () => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Final Score',
          body: 'Wetumpka 42, Opponent 21',
          data: { type: 'final_score' },
        },
        trigger: null,
      });
    } catch (error) {
      console.log('Test final notification error:', error);
    }
  };

  const sendTestBroadcastNotification = async () => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'We Are Live',
          body: 'Wetumpka Sports Network is now live on radio/video.',
          data: { type: 'live_broadcast' },
        },
        trigger: null,
      });
    } catch (error) {
      console.log('Broadcast test notification error:', error);
    }
  };

  const toggleAudio = async () => {
    try {
      if (playerStatus?.playing) {
        player.pause();
      } else {
        player.play();
      }
    } catch (error) {
      console.log('Audio playback error:', error);
      Alert.alert('Audio error', 'Unable to start the live stream right now.');
    }
  };

  const openSport = (sport: SportType) => {
    setSelectedSport(sport);
    setScreenMode('sportDetail');
  };

  const openEmbedded = (title: string, url: string) => {
    setEmbeddedTitle(title);
    setEmbeddedUrl(url);
    setScreenMode('embedded');
  };

  const closeSubScreen = () => {
    if (screenMode === 'embedded' && selectedSport) {
      setScreenMode('sportDetail');
      return;
    }
    setScreenMode('tabs');
  };

  const renderMainContent = () => {
    if (showLaunchSplash) return <LaunchSplash />;

    if (screenMode === 'tabs') {
      if (activeTab === 'home') {
        return (
          <HomeScreen
            onOpenEmbedded={openEmbedded}
            onToggleAudio={toggleAudio}
            newsItems={newsItems}
            newsLoading={newsLoading}
            upcomingEvents={upcomingEvents}
            eventsLoading={eventsLoading}
            finalAlertsEnabled={finalAlertsEnabled}
            onEnableFinalAlerts={enableFinalAlerts}
            onTestFinalScoreAlert={sendTestFinalScoreNotification}
            broadcastAlertsEnabled={broadcastAlertsEnabled}
            onEnableBroadcastAlerts={enableBroadcastAlerts}
            onTestBroadcastAlert={sendTestBroadcastNotification}
            onRefresh={onRefreshHome}
            refreshing={refreshing}
          />
        );
      }

      if (activeTab === 'teams') {
        return (
          <TeamsScreen
            onOpenSport={openSport}
            followedTeams={followedTeams}
            onToggleFollow={toggleFollowTeam}
          />
        );
      }

      if (activeTab === 'watch') {
        return (
          <EmbeddedWebView
            url={URLS.watch}
            headerTitle="Watch Live"
            onBack={() => setActiveTab('home')}
          />
        );
      }

      return (
        <EmbeddedWebView
          url={URLS.schedule}
          headerTitle="Schedule"
          onBack={() => setActiveTab('home')}
        />
      );
    }

    if (screenMode === 'sportDetail' && selectedSport) {
      return (
        <SportDetailScreen
          sport={selectedSport}
          onBack={() => setScreenMode('tabs')}
          onOpenEmbedded={openEmbedded}
        />
      );
    }

    return (
      <EmbeddedWebView
        url={embeddedUrl}
        headerTitle={embeddedTitle}
        onBack={closeSubScreen}
      />
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={BRAND.black} />
      <View style={styles.mainArea}>{renderMainContent()}</View>

      {!showLaunchSplash && (
        <>
          <AudioMiniPlayer
            isPlaying={!!playerStatus?.playing}
            isLoading={!!playerStatus?.isBuffering}
            onToggle={toggleAudio}
          />

          <View style={styles.bottomTabBar}>
            <TabButton
              label="Home"
              icon="home"
              active={screenMode === 'tabs' && activeTab === 'home'}
              onPress={() => {
                setScreenMode('tabs');
                setSelectedSport(null);
                setActiveTab('home');
              }}
            />
            <TabButton
              label="Teams"
              icon="grid"
              active={
                (screenMode === 'tabs' && activeTab === 'teams') ||
                screenMode === 'sportDetail'
              }
              onPress={() => {
                setScreenMode('tabs');
                setSelectedSport(null);
                setActiveTab('teams');
              }}
            />
            <Pressable
              style={styles.centerWatchButton}
              onPress={() => {
                setEmbeddedTitle('Watch Live');
                setEmbeddedUrl(URLS.watch);
                setScreenMode('embedded');
              }}
            >
              <Ionicons name="play" size={26} color={BRAND.black} />
            </Pressable>
            <TabButton
              label="Listen"
              icon="headset"
              active={false}
              onPress={toggleAudio}
            />
            <TabButton
              label="Schedule"
              icon="calendar"
              active={screenMode === 'tabs' && activeTab === 'schedule'}
              onPress={() => {
                setScreenMode('tabs');
                setSelectedSport(null);
                setActiveTab('schedule');
              }}
            />
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

function detectSport(text: string) {
  const lowered = text.toLowerCase();

  if (lowered.includes('football')) return 'Football';
  if (lowered.includes('baseball')) return 'Baseball';
  if (lowered.includes('softball')) return 'Softball';
  if (lowered.includes('basketball')) return 'Basketball';
  if (lowered.includes('soccer')) return 'Soccer';
  if (lowered.includes('volleyball')) return 'Volleyball';
  if (lowered.includes('tennis')) return 'Tennis';
  if (lowered.includes('golf')) return 'Golf';
  if (lowered.includes('track')) return 'Track';
  if (lowered.includes('cross country')) return 'Cross Country';
  if (lowered.includes('wrestling')) return 'Wrestling';
  if (lowered.includes('flag football')) return 'Flag Football';
  if (lowered.includes('cheer')) return 'Cheer';
  if (lowered.includes('dance')) return 'Dance';

  return 'Event';
}

async function fetchNewsFeed(url: string): Promise<NewsItem[]> {
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/rss+xml, application/xml, text/xml, */*',
    },
  });

  const xmlText = await response.text();

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    trimValues: true,
  });

  const parsed = parser.parse(xmlText);
  const rawItems = parsed?.rss?.channel?.item ?? [];
  const itemsArray = Array.isArray(rawItems)
    ? rawItems
    : rawItems
      ? [rawItems]
      : [];

  return itemsArray
    .filter((item: any) => item?.title && item?.link)
    .map((item: any) => {
      const descriptionHtml = String(item.description ?? '');

      const mediaContent =
        item?.['media:content']?.['@_url'] ||
        item?.['media:content']?.url ||
        item?.enclosure?.['@_url'] ||
        item?.enclosure?.url ||
        item?.['media:thumbnail']?.['@_url'] ||
        item?.['media:thumbnail']?.url ||
        '';

      const imageFromDescriptionMatch = descriptionHtml.match(
        /<img[^>]+src=["']([^"']+)["']/i
      );

      const image =
        mediaContent ||
        (imageFromDescriptionMatch ? imageFromDescriptionMatch[1] : '');

      return {
        title: String(item.title ?? '').trim(),
        link: String(item.link ?? '').trim(),
        date: formatFeedDate(String(item.pubDate ?? '').trim()),
        rawDate: String(item.pubDate ?? '').trim(),
        description: stripHtml(descriptionHtml),
        image,
      };
    })
    .sort((a, b) => dateSortAscDescRecent(a.rawDate, b.rawDate));
}

async function fetchEventsFeed(url: string): Promise<EventItem[]> {
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/rss+xml, application/xml, text/xml, */*',
    },
  });

  const xmlText = await response.text();

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    trimValues: true,
  });

  const parsed = parser.parse(xmlText);
  const rawItems = parsed?.rss?.channel?.item ?? [];
  const itemsArray = Array.isArray(rawItems)
    ? rawItems
    : rawItems
      ? [rawItems]
      : [];

  return itemsArray
    .filter((item: any) => item?.title && item?.link)
    .map((item: any, index: number) => ({
      id: String(item.link ?? `${index}`),
      title: String(item.title ?? '').trim(),
      link: String(item.link ?? '').trim(),
      date: formatFeedDate(String(item.pubDate ?? '').trim()),
      rawDate: String(item.pubDate ?? '').trim(),
      description: stripHtml(String(item.description ?? '')),
    }))
    .sort((a, b) => sortUpcomingFirst(a.rawDate, b.rawDate));
}

function sortUpcomingFirst(a?: string, b?: string) {
  const aDate = parseFeedDateValue(a);
  const bDate = parseFeedDateValue(b);
  if (!aDate && !bDate) return 0;
  if (!aDate) return 1;
  if (!bDate) return -1;
  return aDate.getTime() - bDate.getTime();
}

function dateSortAscDescRecent(a?: string, b?: string) {
  const aTime = a ? new Date(a).getTime() : NaN;
  const bTime = b ? new Date(b).getTime() : NaN;
  if (Number.isNaN(aTime) && Number.isNaN(bTime)) return 0;
  if (Number.isNaN(aTime)) return 1;
  if (Number.isNaN(bTime)) return -1;
  return bTime - aTime;
}

function stripHtml(value: string) {
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function formatFeedDate(dateString: string) {
  if (!dateString) return '';

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function parseFeedDateValue(dateString?: string) {
  if (!dateString) return null;
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function isWithinNextWeek(dateString?: string) {
  const eventDate = parseFeedDateValue(dateString);
  if (!eventDate) return false;

  const now = new Date();
  const todayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    0,
    0,
    0,
    0
  );

  const nextWeekEnd = new Date(todayStart);
  nextWeekEnd.setDate(nextWeekEnd.getDate() + 7);
  nextWeekEnd.setHours(23, 59, 59, 999);

  return eventDate >= todayStart && eventDate <= nextWeekEnd;
}

function filterUpcomingWeekEvents(events: EventItem[]) {
  return events.filter((event) => isWithinNextWeek(event.rawDate));
}

const styles = StyleSheet.create({
  flexOne: {
    flex: 1,
  },
  safe: {
    flex: 1,
    backgroundColor: BRAND.black,
  },
  mainArea: {
    flex: 1,
    backgroundColor: BRAND.lightGray,
  },
  screen: {
    flex: 1,
    backgroundColor: BRAND.lightGray,
  },
  screenContent: {
    padding: 16,
    paddingBottom: 30,
  },
  sportDetailContent: {
    paddingBottom: 24,
  },

  flashContainer: {
    flex: 1,
    backgroundColor: '#E6E6E6',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 0,
    paddingBottom: 80,
  },
  flashTopStripeWrap: {
    width: '100%',
    height: 180,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  flashTopStripeBlack: {
    width: 14,
    height: '100%',
    backgroundColor: BRAND.black,
    marginHorizontal: 4,
  },
  flashTopStripeGold: {
    width: 40,
    height: '100%',
    backgroundColor: BRAND.gold,
  },
  flashCenterArea: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  flashShadowLong: {
    position: 'absolute',
    width: 360,
    height: 360,
    backgroundColor: 'rgba(0,0,0,0.07)',
    transform: [{ rotate: '-38deg' }, { translateX: 120 }, { translateY: 120 }],
    borderRadius: 30,
  },
  flashLogoPlate: {
    width: 260,
    height: 260,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flashMainLogo: {
    width: 250,
    height: 250,
  },
  flashBottomBranding: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  flashWSNLogo: {
    width: 280,
    height: 65,
    marginBottom: 12,
  },
  flashSponsorBadge: {
    width: 220,
    height: 62,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#D9D9D9',
    marginBottom: 10,
  },
  flashSponsorImage: {
    width: '100%',
    height: '100%',
  },
  flashBottomSub: {
    color: '#4B5563',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },

  homeHeader: {
    borderRadius: 24,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    overflow: 'hidden',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },
  headerTitleWrap: {
    flex: 1,
    minWidth: 0,
  },
  teamLogoBox: {
    width: 62,
    height: 62,
    backgroundColor: BRAND.white,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  headerTeamLogo: {
    width: 48,
    height: 48,
  },
  appTitle: {
    color: BRAND.white,
    fontSize: 17,
    fontWeight: '800',
  },
  appSubtitle: {
    color: BRAND.gold,
    fontSize: 14,
    marginTop: 2,
    fontWeight: '600',
  },
  headerRightCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },
  topIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 56,
    marginLeft: 6,
  },
  topIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  topIconLabel: {
    color: BRAND.white,
    fontSize: 11,
    fontWeight: '600',
  },

  sponsorBanner: {
    marginTop: 16,
    backgroundColor: BRAND.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BRAND.border,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  sponsorBannerLogo: {
    width: 74,
    height: 74,
    borderRadius: 12,
    backgroundColor: BRAND.offWhite,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    padding: 6,
  },
  sponsorBannerLogoImage: {
    width: '100%',
    height: '100%',
  },
  sponsorBannerLabel: {
    color: BRAND.gray,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  sponsorBannerTitle: {
    color: BRAND.black,
    fontSize: 18,
    fontWeight: '800',
    marginTop: 2,
  },
  sponsorBannerSub: {
    color: BRAND.gray,
    fontSize: 13,
    marginTop: 2,
  },

  pushBannerWrap: {
    marginTop: 14,
  },
  pushBanner: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pushBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  pushBannerText: {
    color: BRAND.white,
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 8,
  },
  pushBannerRight: {
    marginLeft: 10,
  },
  pushBannerButton: {
    backgroundColor: BRAND.gold,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  pushBannerButtonText: {
    color: BRAND.black,
    fontSize: 12,
    fontWeight: '800',
  },
  pushBannerButtonAlt: {
    backgroundColor: '#2A2A2A',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: '#3B3B3B',
  },
  pushBannerButtonAltText: {
    color: BRAND.white,
    fontSize: 12,
    fontWeight: '800',
  },

  sectionHeader: {
    marginTop: 22,
    marginBottom: 10,
    paddingHorizontal: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionHeaderPadded: {
    marginTop: 22,
    marginBottom: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    color: BRAND.black,
    fontSize: 22,
    fontWeight: '800',
  },
  sectionLink: {
    color: BRAND.goldDark,
    fontSize: 14,
    fontWeight: '700',
  },

  quickGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  quickCardGold: {
    flex: 1,
    backgroundColor: BRAND.gold,
    borderRadius: 18,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickCardTextDark: {
    color: BRAND.black,
    fontSize: 16,
    fontWeight: '800',
    marginTop: 8,
  },

  sliderLoadingWrap: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sliderEmptyWrap: {
    backgroundColor: BRAND.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BRAND.border,
    padding: 18,
  },
  sliderEmptyText: {
    color: BRAND.gray,
    fontSize: 14,
  },

  espnCardsRow: {
    paddingRight: 12,
  },
  espnCard: {
    width: 250,
    backgroundColor: BRAND.white,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: BRAND.border,
    padding: 16,
    marginRight: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  espnCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  espnCardSport: {
    color: BRAND.goldDark,
    fontSize: 13,
    fontWeight: '800',
  },
  espnCardDate: {
    color: '#7B8190',
    fontSize: 12,
    fontWeight: '700',
  },
  upcomingEventCardBody: {
    backgroundColor: '#F7F7F7',
    borderRadius: 18,
    padding: 14,
  },
  upcomingEventTitle: {
    color: BRAND.black,
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 22,
  },

  newsLoadingWrap: {
    paddingVertical: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newsLoadingText: {
    marginTop: 10,
    color: BRAND.gray,
    fontSize: 14,
  },
  newsEmptyTitle: {
    color: BRAND.black,
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 6,
  },
  newsEmptyText: {
    color: BRAND.gray,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  newsFeedCard: {
    backgroundColor: BRAND.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BRAND.border,
    marginBottom: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  newsFeedImage: {
    height: 180,
    backgroundColor: BRAND.black,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  newsFeedImageActual: {
    width: '100%',
    height: '100%',
  },
  newsFeedImageText: {
    color: BRAND.gold,
    fontSize: 24,
    fontWeight: '800',
  },
  newsFeedBody: {
    padding: 14,
  },
  newsFeedTitle: {
    color: BRAND.black,
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 24,
  },
  newsFeedDate: {
    color: BRAND.gray,
    fontSize: 13,
    marginTop: 6,
    marginBottom: 8,
    fontWeight: '600',
  },
  newsFeedDescription: {
    color: BRAND.gray,
    fontSize: 14,
    lineHeight: 20,
  },

  teamsScreenContent: {
    paddingBottom: 120,
  },
  teamsHeroBar: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    marginBottom: 14,
  },
  teamsHeroTitle: {
    color: BRAND.gold,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  teamsListWrap: {
    paddingHorizontal: 16,
  },
  teamRowCard: {
    backgroundColor: BRAND.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BRAND.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  teamRowMain: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginRight: 12,
  },
  teamRowText: {
    color: BRAND.black,
    fontSize: 16,
    fontWeight: '800',
  },
  followPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
    gap: 4,
  },
  followPillOn: {
    backgroundColor: BRAND.black,
  },
  followPillOff: {
    backgroundColor: BRAND.gold,
  },
  followPillText: {
    fontSize: 12,
    fontWeight: '800',
  },
  followPillTextOn: {
    color: BRAND.white,
  },
  followPillTextOff: {
    color: BRAND.black,
  },

  sportTopBar: {
    paddingHorizontal: 16,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sportTopBarTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
    flex: 1,
  },
  sportTopBarTitle: {
    color: BRAND.white,
    fontSize: 20,
    fontWeight: '800',
    flex: 1,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: BRAND.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subHeader: {
    backgroundColor: BRAND.black,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  subHeaderTitle: {
    color: BRAND.white,
    fontSize: 18,
    fontWeight: '800',
    marginLeft: 12,
    flex: 1,
  },
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(243,244,246,0.65)',
  },

  sportActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    gap: 10,
  },
  goldActionButton: {
    flex: 1,
    backgroundColor: BRAND.gold,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  goldActionText: {
    color: BRAND.black,
    fontSize: 12,
    fontWeight: '800',
  },

  upcomingRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
  },
  upcomingCard: {
    flex: 1,
    backgroundColor: BRAND.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BRAND.border,
    padding: 16,
  },
  upcomingDate: {
    color: BRAND.goldDark,
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 8,
  },
  upcomingSport: {
    color: BRAND.black,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 8,
  },
  upcomingMeta: {
    color: BRAND.gray,
    fontSize: 13,
  },

  feedEmptyCard: {
    marginHorizontal: 16,
    backgroundColor: BRAND.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BRAND.border,
    padding: 16,
  },
  feedEmptyText: {
    color: BRAND.gray,
    fontSize: 14,
  },
  feedListCard: {
    backgroundColor: BRAND.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BRAND.border,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 10,
  },
  feedListTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    alignItems: 'flex-start',
  },
  feedListTitle: {
    color: BRAND.black,
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 21,
    flex: 1,
  },
  feedListDate: {
    color: BRAND.gray,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 6,
    marginBottom: 6,
  },
  feedListDescription: {
    color: BRAND.gray,
    fontSize: 13,
    lineHeight: 18,
  },

  feedEventHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  feedScoreWrap: {
    backgroundColor: BRAND.offWhite,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },

  audioBar: {
    backgroundColor: BRAND.black,
    borderTopWidth: 1,
    borderTopColor: '#1E1E1E',
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
    backgroundColor: BRAND.gold,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  audioBarButtonText: {
    color: BRAND.black,
    fontSize: 14,
    fontWeight: '800',
  },

  bottomTabBar: {
    backgroundColor: BRAND.white,
    borderTopWidth: 1,
    borderTopColor: '#E9E9E9',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 18,
    paddingHorizontal: 8,
  },
  bottomTabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: BRAND.black,
    marginTop: 4,
  },
  bottomTabTextActive: {
    color: BRAND.gold,
  },
  centerWatchButton: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: BRAND.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -24,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
});