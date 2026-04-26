import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { supabase } from '../supabase';

export type PushRegistrationStatus =
  | 'unsupported'
  | 'undetermined'
  | 'denied'
  | 'granted'
  | 'project_id_missing'
  | 'token_missing'
  | 'saved'
  | 'save_failed'
  | 'error';

export type PushRegistrationResult = {
  token: string;
  status: PushRegistrationStatus;
};

function isValidExpoPushToken(token: string) {
  return (
    token.startsWith('ExponentPushToken[') ||
    token.startsWith('ExpoPushToken[')
  );
}

export async function getPushPermissionStatus() {
  try {
    const settings = await Notifications.getPermissionsAsync();
    const status = settings.granted ? 'granted' : settings.status;
    console.log('[PushOS] permission status:', status);
    return status;
  } catch (error) {
    console.log('[PushOS] error', error);
    return 'undetermined';
  }
}

export async function registerForPushNotifications(
  schoolSlug: string
): Promise<PushRegistrationResult> {
  try {
    console.log('[PushOS] START');
    console.log('[PushOS] schoolSlug', schoolSlug || '(missing)');

    if (!schoolSlug?.trim()) {
      return {
        token: '',
        status: 'error',
      };
    }

    if (!Device.isDevice || Platform.OS !== 'ios') {
      console.log('[PushOS] error', 'unsupported device/platform');
      return { token: '', status: 'unsupported' };
    }

    const existingSettings = await Notifications.getPermissionsAsync();
    let finalStatus = existingSettings.granted ? 'granted' : existingSettings.status;
    console.log('Notification permission status:', finalStatus);

    if (finalStatus === 'undetermined') {
      const requestSettings = await Notifications.requestPermissionsAsync();
      finalStatus = requestSettings.granted ? 'granted' : requestSettings.status;
      console.log('Notification permission status:', finalStatus);
    }

    if (finalStatus !== 'granted') {
      return {
        token: '',
        status: finalStatus === 'denied' ? 'denied' : 'undetermined',
      };
    }

    const projectId =
      Constants.easConfig?.projectId ??
      Constants.expoConfig?.extra?.eas?.projectId;
    const finalSchoolSlug = schoolSlug.trim().toLowerCase();

    console.log('[PushOS] resolved schoolSlug', finalSchoolSlug || '(missing)');
    console.log('[PushOS] projectId', projectId || '(missing)');

    if (!projectId) {
      console.log('[PushOS] error', 'missing projectId');
      return {
        token: '',
        status: 'project_id_missing',
      };
    }

    const tokenResponse = await Notifications.getExpoPushTokenAsync(
      { projectId }
    );
    const expoPushToken = tokenResponse.data?.trim() ?? '';

    console.log('[PushOS] token', expoPushToken || '(missing)');

    if (!finalSchoolSlug || !expoPushToken || !isValidExpoPushToken(expoPushToken)) {
      return {
        token: '',
        status: 'token_missing',
      };
    }

    const { error } = await supabase.from('app_push_tokens').upsert(
      [
        {
          school_slug: finalSchoolSlug,
          expo_push_token: expoPushToken,
          platform: Platform.OS,
          updated_at: new Date().toISOString(),
        },
      ],
      {
        onConflict: 'expo_push_token',
        ignoreDuplicates: false,
      }
    );

    if (error) {
      console.log('[PushOS] error', error.message ?? error);
      return {
        token: expoPushToken,
        status: 'save_failed',
      };
    }

    console.log('[PushOS] saved', expoPushToken);
    return {
      token: expoPushToken,
      status: 'saved',
    };
  } catch (error) {
    console.log('[PushOS] error', error);
    return {
      token: '',
      status: 'error',
    };
  }
}
