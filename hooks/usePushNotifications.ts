import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

import { registerDeviceToken } from '../lib/pushos';

type SchoolId = string | number | null | undefined;

export function usePushNotifications(schoolId: SchoolId) {
  const [token, setToken] = useState('');
  const [isEnabled, setIsEnabled] = useState(false);
  const isRegisteringRef = useRef(false);

  const enable = useCallback(async () => {
    if (!schoolId || isRegisteringRef.current) {
      return '';
    }

    isRegisteringRef.current = true;

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

      if (finalStatus !== 'granted') {
        setIsEnabled(false);
        setToken('');
        return '';
      }

      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ||
        Constants?.easConfig?.projectId;

      const tokenResponse = projectId
        ? await Notifications.getExpoPushTokenAsync({ projectId })
        : await Notifications.getExpoPushTokenAsync();
      const nextToken = tokenResponse.data?.trim() ?? '';

      if (!nextToken) {
        setIsEnabled(false);
        setToken('');
        return '';
      }

      setToken(nextToken);
      setIsEnabled(true);
      await registerDeviceToken(schoolId, nextToken);

      return nextToken;
    } catch (error) {
      console.log('Push registration error:', error);
      setIsEnabled(false);
      setToken('');
      return '';
    } finally {
      isRegisteringRef.current = false;
    }
  }, [schoolId]);

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
    if (!schoolId) {
      setToken('');
      setIsEnabled(false);
      return;
    }

    enable();
  }, [enable, schoolId]);

  return {
    token,
    isEnabled,
    enable,
  };
}
