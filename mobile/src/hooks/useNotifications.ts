// src/hooks/useNotifications.ts
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchApi } from '../api/client';

export const useNotifications = () => {
  const [expoPushToken, setExpoPushToken] = useState('');
  const [notification, setNotification] = useState<any>(null);

  const registerForPushNotifications = async () => {
    try {
      const Notifications = await import('expo-notifications');
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') return;
      const tokenObj = await Notifications.getExpoPushTokenAsync();
      const token = tokenObj.data;
      setExpoPushToken(token);
      await AsyncStorage.setItem('expo_push_token', token);
      try {
        await fetchApi('/notifications/register-token', {
          method: 'POST',
          data: { token, platform: Platform.OS },
        });
      } catch {}
    } catch (e) {
      console.warn('[Notifications] Not available:', e);
    }
  };

  useEffect(() => {
    if (Platform.OS !== 'web') {
      registerForPushNotifications();
    }
  }, []);

  const sendLocalNotification = async (title: string, body: string) => {
    if (Platform.OS === 'web') return;
    try {
      const Notifications = await import('expo-notifications');
      await Notifications.scheduleNotificationAsync({
        content: { title, body, sound: true },
        trigger: { seconds: 1 } as any,
      });
    } catch {}
  };

  return { expoPushToken, notification, sendLocalNotification };
};

export default useNotifications;
