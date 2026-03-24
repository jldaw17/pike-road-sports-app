import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
} from 'expo-audio';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { LinearGradient } from 'expo-linear-gradient';
import * as Notifications from 'expo-notifications';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Image,
  Linking,
  Pressable,
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
  success: '#166534',
  successBg: '#ECFDF3',
};

const STREAM_URL = 'https://ice66.securenetsystems.net/WRFSFM';

const URLS = {
  watch: 'https://www.radioalabama.net/bbcomertigers/',
  news: 'https://www.radioalabama.net/bbcomertigers/',
};

const STORAGE_KEYS = {
  liveAlertsSubscribed: 'bb_comer_live_alerts_subscribed',
  expoPushToken: 'bb_comer_expo_push_token',
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

type TabKey = 'home' | 'news';
type ScreenMode = 'tabs' | 'embedded';

type NewsItem = {
  id: string;
  title: string;
  date: string;
  description: string;
};

type EventItem = {
  id: string;
  title: string;
  date: string;
  location: string;
};

const PLACEHOLDER_NEWS: NewsItem[] = [
  {
    id: '1',
    title: 'Latest news coming soon',
    date: 'Coming Soon',
    description: 'BB Comer Sports Network stories will appear here.',
  },
  {
    id: '2',
    title: 'More Tigers coverage on the way',
    date: 'Coming Soon',
    description: 'Game stories, features, and updates will live here.',
  },
];

const PLACEHOLDER_EVENTS: EventItem[] = [
  {
    id: '1',
    title: 'Upcoming events coming soon',
    date: 'Coming Soon',
    location: 'BB Comer High School',
  },
  {
    id: '2',
    title: 'Schedules will be added here',
    date: 'Coming Soon',
    location: 'Childersburg, AL',
  },
];

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
            source={require('./assets/images/school-logo.png')}
            style={styles.flashMainLogo}
            resizeMode="contain"
          />
        </View>
      </View>

      <View style={styles.flashBottomBranding}>
        <Image
          source={require('./assets/images/network-logo.png')}
          style={styles.flashNetworkLogo}
          resizeMode="contain"
        />

        <View style={styles.flashSponsorBadge}>
          <Image
            source={require('./assets/images/sponsor-logo-splash.png')}
            style={styles.flashSponsorImage}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.flashBottomSub}>
          Presented by Coosa Pines Federal Credit Union
        </Text>
      </View>
    </View>
  );
}

function LiveAlertsCard({
  onSubscribe,
  subscribing,
}: {
  onSubscribe: () => void;
  subscribing: boolean;
}) {
  return (
    <View style={styles.alertCard}>
      <View style={styles.alertCardTop}>
        <View style={styles.alertIconWrap}>
          <Ionicons name="notifications" size={18} color={BRAND.gold} />
        </View>
        <View style={styles.flexOne}>
          <Text style={styles.alertTitle}>Live Broadcast Alerts</Text>
          <Text style={styles.alertDescription}>
            Get notified when BB Comer Sports Network goes live.
          </Text>
        </View>
      </View>

      <Pressable
        style={styles.alertButton}
        onPress={onSubscribe}
        disabled={subscribing}
      >
        <Ionicons
          name={subscribing ? 'hourglass-outline' : 'notifications-outline'}
          size={18}
          color={BRAND.black}
        />
        <Text style={styles.alertButtonText}>
          {subscribing ? 'Subscribing...' : 'Subscribe'}
        </Text>
      </Pressable>
    </View>
  );
}

function HomeScreen({
  onOpenEmbedded,
  onToggleAudio,
  showLiveAlertsCard,
  onSubscribeToAlerts,
  subscribingToAlerts,
}: {
  onOpenEmbedded: (title: string, url: string) => void;
  onToggleAudio: () => void;
  showLiveAlertsCard: boolean;
  onSubscribeToAlerts: () => void;
  subscribingToAlerts: boolean;
}) {
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.screenContent}
      showsVerticalScrollIndicator={false}
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
              source={require('./assets/images/school-logo.png')}
              style={styles.headerTeamLogo}
              resizeMode="contain"
            />
          </View>

          <View style={styles.headerTitleWrap}>
            <Text style={styles.appTitle} numberOfLines={1} adjustsFontSizeToFit>
              BB Comer Athletics
            </Text>
            <Text style={styles.appSubtitle} numberOfLines={1}>
              Home of the Tigers
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

      <View style={styles.sponsorBanner}>
        <View style={styles.sponsorBannerLogo}>
          <Image
            source={require('./assets/images/sponsor-logo.png')}
            style={styles.sponsorBannerLogoImage}
            resizeMode="contain"
          />
        </View>

        <View style={styles.flexOne}>
          <Text style={styles.sponsorBannerLabel}>PRESENTED BY</Text>
          <Text style={styles.sponsorBannerTitle}>Coosa Pines FCU</Text>
          <Text style={styles.sponsorBannerSub}>
            Proud sponsor of Comer Sports Network
          </Text>
        </View>
      </View>

      {showLiveAlertsCard && (
        <View style={styles.sectionBlockSpacing}>
          <LiveAlertsCard
            onSubscribe={onSubscribeToAlerts}
            subscribing={subscribingToAlerts}
          />
        </View>
      )}

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
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.espnCardsRow}
      >
        {PLACEHOLDER_EVENTS.map((item) => (
          <View key={item.id} style={styles.espnCard}>
            <View style={styles.espnCardHeader}>
              <Text style={styles.espnCardSport}>Tigers</Text>
              <Text style={styles.espnCardDate}>{item.date}</Text>
            </View>

            <View style={styles.upcomingEventCardBody}>
              <Text style={styles.upcomingEventTitle} numberOfLines={3}>
                {item.title}
              </Text>
              <Text style={styles.upcomingEventLocation}>{item.location}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Latest News</Text>
      </View>

      {PLACEHOLDER_NEWS.map((item) => (
        <View key={item.id} style={styles.newsFeedCard}>
          <View style={styles.newsFeedImage}>
            <Image
              source={require('./assets/images/network-logo.png')}
              style={styles.newsFeedImageActual}
              resizeMode="contain"
            />
          </View>

          <View style={styles.newsFeedBody}>
            <Text style={styles.newsFeedTitle}>{item.title}</Text>
            <Text style={styles.newsFeedDate}>{item.date}</Text>
            <Text style={styles.newsFeedDescription} numberOfLines={3}>
              {item.description}
            </Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

function NewsScreen({
  onOpenEmbedded,
}: {
  onOpenEmbedded: (title: string, url: string) => void;
}) {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.screenContent}>
      <View style={styles.sectionHeaderTop}>
        <Text style={styles.sectionTitle}>News</Text>
      </View>

      {PLACEHOLDER_NEWS.map((item) => (
        <Pressable
          key={item.id}
          style={styles.feedListCard}
          onPress={() => onOpenEmbedded('BB Comer News', URLS.news)}
        >
          <View style={styles.feedListTopRow}>
            <Text style={styles.feedListTitle}>{item.title}</Text>
            <Ionicons name="arrow-forward" size={16} color={BRAND.goldDark} />
          </View>

          <Text style={styles.feedListDate}>{item.date}</Text>
          <Text style={styles.feedListDescription}>{item.description}</Text>
        </Pressable>
      ))}
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

async function registerForPushNotificationsAsync() {
  if (!Device.isDevice) {
    throw new Error('Push notifications require a physical device.');
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    throw new Error('Push notification permission was not granted.');
  }

  const projectId =
    Constants?.expoConfig?.extra?.eas?.projectId ??
    Constants?.easConfig?.projectId;

  if (!projectId) {
    throw new Error('Missing EAS projectId for push notifications.');
  }

  const tokenResponse = await Notifications.getExpoPushTokenAsync({ projectId });
  return tokenResponse.data;
}

export default function App() {
  const player = useAudioPlayer(STREAM_URL);
  const playerStatus = useAudioPlayerStatus(player);

  const [showLaunchSplash, setShowLaunchSplash] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const [screenMode, setScreenMode] = useState<ScreenMode>('tabs');
  const [embeddedTitle, setEmbeddedTitle] = useState('');
  const [embeddedUrl, setEmbeddedUrl] = useState('');
  const [showAudioBar, setShowAudioBar] = useState(false);
  const [showLiveAlertsCard, setShowLiveAlertsCard] = useState(true);
  const [subscribingToAlerts, setSubscribingToAlerts] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLaunchSplash(false);
    }, 2200);
    return () => clearTimeout(timer);
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
    const loadAlertPreference = async () => {
      try {
        const storedValue = await AsyncStorage.getItem(
          STORAGE_KEYS.liveAlertsSubscribed
        );
        if (storedValue === 'true') {
          setShowLiveAlertsCard(false);
        }
      } catch (error) {
        console.log('Failed to load live alert preference:', error);
      }
    };

    loadAlertPreference();
  }, []);

  const toggleAudio = async () => {
    try {
      setShowAudioBar(true);

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

  const openEmbedded = (title: string, url: string) => {
    setEmbeddedTitle(title);
    setEmbeddedUrl(url);
    setScreenMode('embedded');
  };

  const subscribeToLiveAlerts = async () => {
    try {
      setSubscribingToAlerts(true);

      const token = await registerForPushNotificationsAsync();

      await AsyncStorage.setItem(STORAGE_KEYS.liveAlertsSubscribed, 'true');
      await AsyncStorage.setItem(STORAGE_KEYS.expoPushToken, token);

      console.log('Expo push token:', token);

      setShowLiveAlertsCard(false);

      Alert.alert(
        'Subscribed',
        'Live broadcast alerts are turned on for this device.'
      );
    } catch (error: any) {
      console.log('Push notification setup error:', error);
      Alert.alert(
        'Unable to subscribe',
        error?.message || 'Push notifications could not be enabled right now.'
      );
    } finally {
      setSubscribingToAlerts(false);
    }
  };

  const renderMainContent = () => {
    if (showLaunchSplash) return <LaunchSplash />;

    if (screenMode === 'tabs') {
      if (activeTab === 'home') {
        return (
          <HomeScreen
            onOpenEmbedded={openEmbedded}
            onToggleAudio={toggleAudio}
            showLiveAlertsCard={showLiveAlertsCard}
            onSubscribeToAlerts={subscribeToLiveAlerts}
            subscribingToAlerts={subscribingToAlerts}
          />
        );
      }

      return <NewsScreen onOpenEmbedded={openEmbedded} />;
    }

    return (
      <EmbeddedWebView
        url={embeddedUrl}
        headerTitle={embeddedTitle}
        onBack={() => setScreenMode('tabs')}
      />
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={BRAND.black} />
      <View style={styles.mainArea}>{renderMainContent()}</View>

      {!showLaunchSplash && (
        <>
          {showAudioBar && (
            <AudioMiniPlayer
              isPlaying={!!playerStatus?.playing}
              isLoading={!!playerStatus?.isBuffering}
              onToggle={toggleAudio}
            />
          )}

          <View style={styles.bottomTabBar}>
            <TabButton
              label="Home"
              icon="home"
              active={screenMode === 'tabs' && activeTab === 'home'}
              onPress={() => {
                setScreenMode('tabs');
                setActiveTab('home');
              }}
            />
            <TabButton
              label="News"
              icon="newspaper"
              active={screenMode === 'tabs' && activeTab === 'news'}
              onPress={() => {
                setScreenMode('tabs');
                setActiveTab('news');
              }}
            />
            <TabButton
  label="Watch"
  icon="play-circle"
  active={screenMode === 'embedded' && embeddedTitle === 'Watch Live'}
  onPress={() => {
    setEmbeddedTitle('Watch Live');
    setEmbeddedUrl(URLS.watch);
    setScreenMode('embedded');
  }}
/>
            <TabButton
              label="Listen"
              icon="headset"
              active={!!playerStatus?.playing}
              onPress={toggleAudio}
            />
          </View>
        </>
      )}
    </SafeAreaView>
  );
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
  sectionBlockSpacing: {
    marginTop: 16,
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
    backgroundColor: 'rgba(0,0,0,0.05)',
    transform: [{ rotate: '-38deg' }, { translateX: 120 }, { translateY: 120 }],
    borderRadius: 30,
  },
  flashLogoPlate: {
    width: 280,
    height: 280,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flashMainLogo: {
    width: 240,
    height: 240,
  },
  flashBottomBranding: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    marginTop: 10,
  },
  flashNetworkLogo: {
    width: 300,
    height: 72,
    marginBottom: 14,
  },
  flashSponsorBadge: {
    width: 300,
    height: 90,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#D9D9D9',
    marginBottom: 12,
  },
  flashSponsorImage: {
    width: '110%',
    height: '110%',
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

  alertCard: {
    backgroundColor: BRAND.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BRAND.border,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  alertCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  alertIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: BRAND.black,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  alertTitle: {
    color: BRAND.black,
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 4,
  },
  alertDescription: {
    color: BRAND.gray,
    fontSize: 14,
    lineHeight: 20,
  },
  alertButton: {
    marginTop: 14,
    backgroundColor: BRAND.gold,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  alertButtonText: {
    color: BRAND.black,
    fontSize: 15,
    fontWeight: '800',
  },

  sectionHeaderTop: {
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  sectionHeader: {
    marginTop: 22,
    marginBottom: 10,
    paddingHorizontal: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    color: BRAND.black,
    fontSize: 22,
    fontWeight: '800',
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
  upcomingEventLocation: {
    color: BRAND.gray,
    fontSize: 13,
    marginTop: 8,
    fontWeight: '600',
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
    height: 160,
    backgroundColor: BRAND.black,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    padding: 20,
  },
  newsFeedImageActual: {
    width: '100%',
    height: '100%',
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

  feedListCard: {
    backgroundColor: BRAND.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BRAND.border,
    padding: 14,
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
    width: 78,
    height: 78,
    borderRadius: 22,
    backgroundColor: BRAND.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -26,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  centerWatchButtonText: {
    color: BRAND.black,
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
  },

  subHeader: {
    height: 56,
    backgroundColor: BRAND.white,
    borderBottomWidth: 1,
    borderBottomColor: BRAND.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: BRAND.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  subHeaderTitle: {
    color: BRAND.black,
    fontSize: 18,
    fontWeight: '800',
    flex: 1,
  },
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.75)',
  },
});