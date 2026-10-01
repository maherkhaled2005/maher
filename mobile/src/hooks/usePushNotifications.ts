import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';

try {
  if (Platform.OS !== 'web' && typeof Notifications?.setNotificationHandler === 'function') {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      } as any),
    });
  }
} catch (e) {
  console.warn('Notifications handler init skipped:', e);
}

export function usePushNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | undefined>('');
  const [notification, setNotification] = useState<any>(false);
  const notificationListener = useRef<any>(null);
  const responseListener = useRef<any>(null);

  useEffect(() => {
    if (Platform.OS === 'web') {
      return;
    }

    try {
      registerForPushNotificationsAsync()
        .then(token => {
          if (token) setExpoPushToken(token);
        })
        .catch(err => {
          console.warn('Push registration skipped:', err);
        });
    } catch (err) {
      console.warn('Push notification hook error:', err);
    }

    try {
      if (typeof Notifications?.addNotificationReceivedListener === 'function') {
        notificationListener.current = Notifications.addNotificationReceivedListener(item => {
          setNotification(item);
        });
      }
    } catch (err) {
      console.warn('addNotificationReceivedListener skipped:', err);
    }

    try {
      if (typeof Notifications?.addNotificationResponseReceivedListener === 'function') {
        responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
          console.log('User tapped on notification:', response);
        });
      }
    } catch (err) {
      console.warn('addNotificationResponseReceivedListener skipped:', err);
    }

    return () => {
      try {
        if (notificationListener.current) {
          if (typeof notificationListener.current.remove === 'function') {
            notificationListener.current.remove();
          } else if (typeof (Notifications as any).removeNotificationSubscription === 'function') {
            (Notifications as any).removeNotificationSubscription(notificationListener.current);
          }
        }
      } catch {}
      try {
        if (responseListener.current) {
          if (typeof responseListener.current.remove === 'function') {
            responseListener.current.remove();
          } else if (typeof (Notifications as any).removeNotificationSubscription === 'function') {
            (Notifications as any).removeNotificationSubscription(responseListener.current);
          }
        }
      } catch {}
    };
  }, []);

  return {
    expoPushToken,
    notification,
  };
}

async function registerForPushNotificationsAsync(): Promise<string | undefined> {
  if (Platform.OS === 'web') return undefined;

  try {
    if (Platform.OS === 'android' && typeof Notifications?.setNotificationChannelAsync === 'function') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        lightColor: '#FF231F7C',
      });
    }

    if (Device.isDevice && typeof Notifications?.getPermissionsAsync === 'function') {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted' && typeof Notifications?.requestPermissionsAsync === 'function') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        return undefined;
      }
      
      try {
        const projectId = "151b9af2-362a-4101-9b46-c5d0c63f70af";
        const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
        return tokenData?.data;
      } catch (error) {
        console.warn('Expo token fetch skipped:', error);
      }
    }
  } catch (error) {
    console.warn('registerForPushNotificationsAsync error caught safely:', error);
  }

  return undefined;
}
