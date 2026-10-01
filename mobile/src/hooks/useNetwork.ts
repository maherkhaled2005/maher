// src/hooks/useNetwork.ts
import { useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';

export const useNetwork = () => {
  const [isConnected, setIsConnected] = useState<boolean | null>(true);
  const [isInternetReachable, setIsInternetReachable] = useState<boolean | null>(true);

  useEffect(() => {
    try {
      if (typeof NetInfo?.addEventListener === 'function') {
        const unsubscribe = NetInfo.addEventListener(state => {
          try {
            setIsConnected(state?.isConnected ?? true);
            setIsInternetReachable(state?.isInternetReachable ?? true);
          } catch {}
        });

        return () => {
          try {
            if (typeof unsubscribe === 'function') unsubscribe();
          } catch {}
        };
      }
    } catch (e) {
      console.warn('NetInfo addEventListener safe caught:', e);
    }
    return () => {};
  }, []);

  return { isConnected, isInternetReachable };
};
