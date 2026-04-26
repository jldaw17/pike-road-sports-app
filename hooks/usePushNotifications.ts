import * as Notifications from 'expo-notifications';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, AppState, Linking, Platform } from 'react-native';

import {
  getPushPermissionStatus,
  registerForPushNotifications,
} from '../lib/push/registerForPush';

type EnableOptions = {
  interactive?: boolean;
};
export const PUSH_PERMISSION_DENIED = '__push_permission_denied__';

export function usePushNotifications(schoolSlug?: string) {
  const [token, setToken] = useState('');
  const [isEnabled, setIsEnabled] = useState(false);
  const isRegisteringRef = useRef(false);
  const autoRegisterAttemptedRef = useRef(false);
  const hasShownDeniedAlertRef = useRef(false);

  const showDeniedAlert = useCallback(() => {
    if (hasShownDeniedAlertRef.current) {
      return;
    }

    hasShownDeniedAlertRef.current = true;
    Alert.alert(
      'Notifications Disabled',
      'Notifications are disabled for this app. You can enable them in iOS Settings.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Open Settings',
          onPress: () => {
            if (typeof Linking.openSettings === 'function') {
              Linking.openSettings().catch((error) => {
                console.log('[PushOS] error', error);
              });
            }
          },
        },
      ]
    );
  }, []);

  const enable = useCallback(async (options?: EnableOptions) => {
    if (!schoolSlug || isRegisteringRef.current) {
      return '';
    }

    console.log('[PushOS] START');
    isRegisteringRef.current = true;

    try {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
        });
      }
      const result = await registerForPushNotifications(schoolSlug);
      console.log('[PushOS] result:', result.status);

      if (result.status === 'denied') {
        setIsEnabled(false);
        setToken('');
        if (options?.interactive) {
          showDeniedAlert();
        }
        return PUSH_PERMISSION_DENIED;
      }

      if (!result.token) {
        setIsEnabled(false);
        setToken('');
        return '';
      }

      hasShownDeniedAlertRef.current = false;
      setToken(result.token);
      setIsEnabled(true);

      return result.token;
    } catch {
      setIsEnabled(false);
      setToken('');
      return '';
    } finally {
      isRegisteringRef.current = false;
    }
  }, [schoolSlug, showDeniedAlert]);

  useEffect(() => {
    const receivedSubscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log(
          'Notification received:',
          notification.request.content.data ?? {}
        );
      }
    );

    const responseSubscription =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log(
          'Notification response:',
          response.notification.request.content.data ?? {}
        );
      });

    return () => {
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  }, []);

  useEffect(() => {
    if (!schoolSlug) {
      setToken('');
      setIsEnabled(false);
      autoRegisterAttemptedRef.current = false;
      hasShownDeniedAlertRef.current = false;
      return;
    }

    if (autoRegisterAttemptedRef.current) {
      return;
    }

    autoRegisterAttemptedRef.current = true;
    enable();
  }, [enable, schoolSlug]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextState) => {
      if (nextState !== 'active' || !schoolSlug) {
        return;
      }

      const permissionStatus = await getPushPermissionStatus();
      if (permissionStatus === 'granted') {
        await enable();
      } else if (permissionStatus === 'denied') {
        setIsEnabled(false);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [enable, schoolSlug]);

  return {
    token,
    isEnabled,
    enable,
  };
}
