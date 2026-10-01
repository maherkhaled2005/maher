import React, { Component, ErrorInfo, ReactNode, useEffect, useState, useRef } from 'react';
import {
  StatusBar,
  View,
  Text,
  TouchableOpacity,
  Platform,
  Animated,
  Image,
  ActivityIndicator,
  useWindowDimensions,
  Easing,
  Alert,
  Linking,
  Modal,
} from 'react-native';
import { StripeProvider } from './src/components/StripeWrapper';
import RootNavigation from './src/navigation/index';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import './global.css';
import { usePushNotifications } from './src/hooks/usePushNotifications';
import { io } from 'socket.io-client';
import { getActiveSocketURL, api } from './src/api/client';
import { useAuthStore } from './src/store/authStore';
import { useNetwork } from './src/hooks/useNetwork';
import NetInfo from '@react-native-community/netinfo';
import { WifiOff, AlertTriangle } from 'lucide-react-native';

if (Platform.OS === 'web' && typeof document !== 'undefined') {
  document.documentElement.lang = 'ar';
  document.documentElement.dir = 'rtl';
}

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, backgroundColor: '#0A0A0A', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>⚠️</Text>
          <Text style={{ color: '#D4AF37', fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 }}>
            حدث خطأ أثناء تحميل الشاشة
          </Text>
          <Text style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', marginBottom: 20 }}>
            {this.state.error?.message || 'خطأ غير معروف'}
          </Text>
          <TouchableOpacity
            onPress={this.handleReset}
            style={{ backgroundColor: '#D4AF37', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }}
          >
            <Text style={{ color: '#0A0A0A', fontWeight: 'bold', fontSize: 15 }}>إعادة المحاولة</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const { expoPushToken, notification } = usePushNotifications();
  const { user, logout } = useAuthStore();
  const [appReady, setAppReady] = useState(false);
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const circleSize = Math.max(130, Math.min(Math.min(windowWidth * 0.45, windowHeight * 0.22), 170));

  // Network State
  const { isConnected, isInternetReachable } = useNetwork();
  const isOffline = isConnected === false || isInternetReachable === false;
  const [retryingNetwork, setRetryingNetwork] = useState(false);

  // Mandatory App Update Modal State
  const [updateRequired, setUpdateRequired] = useState(false);
  const [updateUrl, setUpdateUrl] = useState('https://play.google.com/store/apps/details?id=com.tecnorexa.app');

  const handleRetryConnection = async () => {
    setRetryingNetwork(true);
    try {
      const state = await NetInfo.refresh();
      if (!state.isConnected) {
        Alert.alert('تنبيه الاتصال', 'لا زال الاتصال بالإنترنت غير متوفر. يرجى التحقق من شبكة Wi-Fi أو بيانات الهاتف.');
      }
    } catch {}
    finally {
      setRetryingNetwork(false);
    }
  };

  // App Version & Force Update Check
  useEffect(() => {
    const checkVersion = async () => {
      try {
        const res = await api.get('/app/version');
        if (res.data?.forceUpdate) {
          setUpdateRequired(true);
          if (res.data?.updateUrl) setUpdateUrl(res.data.updateUrl);
        }
      } catch {
        // Non-blocking in case of offline or early startup
      }
    };
    checkVersion();
  }, []);

  // Live Socket connection for instant account ban & live role sync
  useEffect(() => {
    if (!user?.id) return;
    try {
      const socket = io(getActiveSocketURL(), {
        transports: ['websocket'],
        autoConnect: true,
      });

      socket.emit('auth', user.id);

      socket.on('force_logout', (data: any) => {
        const reason = data?.reason || 'تم حظر حسابك من قبل إدارة المنظومة.';
        Alert.alert('تنبيه أمني إداري ⚠️', reason);
        logout();
      });

      socket.on('account_banned', (data: any) => {
        Alert.alert(
          'تم حظر الحساب ⛔',
          data?.reason || 'تم حظر حسابك من قبل إدارة TecnoRexa.'
        );
        logout();
      });

      socket.on('account_unbanned', () => {
        useAuthStore.getState().checkAuth().catch(() => {});
      });

      socket.on('role_changed', () => {
        useAuthStore.getState().checkAuth().catch(() => {});
      });

      return () => {
        socket.disconnect();
      };
    } catch (e) {
      console.warn('Socket connection error:', e);
    }
  }, [user?.id]);

  useEffect(() => {
    if (Platform.OS === 'web') {
      const style = document.createElement('style');
      style.textContent = `
        html, body, #root {
          height: 100%;
          width: 100%;
          overflow: hidden;
          margin: 0;
          padding: 0;
        }
        #root {
          display: flex;
          flex-direction: column;
          position: relative;
        }
        #root div[class*="css-"] {
          min-height: 0 !important;
          min-width: 0 !important;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  // 1. Splash Screen Animation State: Starts large circular logo and smoothly shrinks down
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(1.45)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const loadingOpacity = useRef(new Animated.Value(0)).current;
  const splashContainerOpacity = useRef(new Animated.Value(1)).current;

  const [typedText, setTypedText] = useState('');
  const fullText = 'TecnoRexa';

  useEffect(() => {
    // Stage 1: Official Logo fades in and smoothly shrinks from large (1.45) down to 1.0
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 350,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(logoScale, {
        toValue: 1,
        duration: 550,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start();

    // Stage 2: Typing 'TecnoRexa' letter by letter
    let typeIndex = 0;
    let typeInterval: ReturnType<typeof setInterval>;
    const typingDelay = setTimeout(() => {
      typeInterval = setInterval(() => {
        typeIndex++;
        setTypedText(fullText.substring(0, typeIndex));
        if (typeIndex >= fullText.length) {
          clearInterval(typeInterval);
        }
      }, 60);
    }, 250);

    // Stage 3: Subtitle text fades in
    const subtitleTimer = setTimeout(() => {
      Animated.timing(subtitleOpacity, {
        toValue: 1,
        duration: 350,
        useNativeDriver: Platform.OS !== 'web',
      }).start();
    }, 650);

    // Stage 4: Independent Loading indicator fades in
    const loadingTimer = setTimeout(() => {
      Animated.timing(loadingOpacity, {
        toValue: 1,
        duration: 350,
        useNativeDriver: Platform.OS !== 'web',
      }).start();
    }, 950);

    // Stage 5: Smooth fade out transition to App/Login
    const transitionTimer = setTimeout(() => {
      Animated.timing(splashContainerOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: Platform.OS !== 'web',
      }).start(() => {
        setAppReady(true);
      });
    }, 1600);

    // Stage 6: Hard fallback safety timer to ensure app always opens
    const safetyTimer = setTimeout(() => {
      setAppReady(true);
    }, 2200);

    return () => {
      clearTimeout(typingDelay);
      clearInterval(typeInterval);
      clearTimeout(subtitleTimer);
      clearTimeout(loadingTimer);
      clearTimeout(transitionTimer);
      clearTimeout(safetyTimer);
    };
  }, []);

  if (!appReady) {
    return (
      <Animated.View
        style={{
          flex: 1,
          width: '100%',
          maxWidth: '100%',
          backgroundColor: '#070A0F',
          justifyContent: 'center',
          alignItems: 'center',
          opacity: splashContainerOpacity,
        }}
      >
        <StatusBar barStyle="light-content" backgroundColor="#070A0F" translucent />

        <View style={{ alignItems: 'center', width: '100%', paddingHorizontal: 16 }}>
          {/* Official TR Logo in a circular container that starts large and smoothly shrinks */}
          <Animated.View
            style={{
              width: circleSize,
              height: circleSize,
              borderRadius: circleSize / 2,
              borderWidth: 2.5,
              borderColor: '#D4AF37',
              overflow: 'hidden',
              backgroundColor: '#000000',
              marginBottom: 20,
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
              shadowColor: '#D4AF37',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.45,
              shadowRadius: 14,
              elevation: 8,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Image
              source={require('./assets/tecnorexa_official_logo.jpg')}
              resizeMode="cover"
              style={{
                width: '100%',
                height: '100%',
              }}
            />
          </Animated.View>

          {/* Brand Typography in Royal Gold with Typing Effect */}
          <Text
            maxFontSizeMultiplier={1.15}
            style={{ color: '#D4AF37', fontSize: 32, fontWeight: '900', letterSpacing: 1, marginBottom: 6, textAlign: 'center', minHeight: 40 }}
          >
            {typedText.substring(0, 5)}
            <Text style={{ color: '#F3E5AB' }}>{typedText.substring(5)}</Text>
          </Text>

          {/* Subtitle */}
          <Animated.Text
            maxFontSizeMultiplier={1.15}
            numberOfLines={2}
            style={{ opacity: subtitleOpacity, color: '#D4AF37', fontSize: 13, fontWeight: '700', letterSpacing: 0.5, textAlign: 'center', marginBottom: 22, paddingHorizontal: 8 }}
          >
            منصة TecnoRexa المتكاملة لصيانة الأجهزة المنزلية
          </Animated.Text>

          {/* Luxury Gold Loading Indicator */}
          <Animated.View
            style={{
              opacity: loadingOpacity,
              flexDirection: 'row-reverse',
              alignItems: 'center',
              gap: 8,
              backgroundColor: '#0B0E14',
              paddingHorizontal: 18,
              paddingVertical: 9,
              borderRadius: 24,
              borderWidth: 1.5,
              borderColor: '#D4AF37',
              shadowColor: '#D4AF37',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.35,
              shadowRadius: 10,
              elevation: 6,
            }}
          >
            <ActivityIndicator size="small" color="#D4AF37" />
            <Text maxFontSizeMultiplier={1.15} style={{ color: '#D4AF37', fontSize: 13, fontWeight: '900' }}>
              جاري التحميل...
            </Text>
          </Animated.View>
        </View>
      </Animated.View>
    );
  }

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <View style={[{ flex: 1, backgroundColor: '#0A0A0A' }, Platform.OS === 'web' && { height: '100%', maxHeight: '100%', overflow: 'hidden' } as any]}>
          <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />

          {/* Global Offline Network Banner */}
          {isOffline && (
            <View
              style={{
                backgroundColor: '#DC2626',
                paddingVertical: 9,
                paddingHorizontal: 16,
                flexDirection: 'row-reverse',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottomWidth: 1,
                borderColor: '#B91C1C',
                zIndex: 9999,
              }}
            >
              <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 8, flex: 1 }}>
                <WifiOff size={16} color="#FFFFFF" />
                <Text style={{ color: '#FFFFFF', fontSize: 12.5, fontWeight: '800' }}>
                  لا يوجد اتصال بالإنترنت
                </Text>
              </View>
              <TouchableOpacity
                onPress={handleRetryConnection}
                disabled={retryingNetwork}
                style={{
                  backgroundColor: '#FFFFFF',
                  paddingHorizontal: 12,
                  paddingVertical: 4,
                  borderRadius: 6,
                  flexDirection: 'row-reverse',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                {retryingNetwork ? (
                  <ActivityIndicator size="small" color="#DC2626" />
                ) : (
                  <Text style={{ color: '#DC2626', fontSize: 11, fontWeight: '900' }}>
                    إعادة المحاولة
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Mandatory Update Modal */}
          <Modal visible={updateRequired} transparent animationType="fade">
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
              <View style={{ backgroundColor: '#141414', borderRadius: 20, padding: 24, width: '100%', maxWidth: 380, borderWidth: 1.5, borderColor: '#D4AF37', alignItems: 'center' }}>
                <AlertTriangle size={48} color="#D4AF37" style={{ marginBottom: 16 }} />
                <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '900', marginBottom: 8, textAlign: 'center' }}>
                  تحديث إجباري متوفر 🚀
                </Text>
                <Text style={{ color: '#94A3B8', fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: 20 }}>
                  يجب تحديث تطبيق TecnoRexa إلى أحدث إصدار لمتابعة الاستخدام والاستفادة من الميزات الأمنية وتحسينات الأداء.
                </Text>
                <TouchableOpacity
                  onPress={() => Linking.openURL(updateUrl).catch(() => {})}
                  style={{ backgroundColor: '#D4AF37', width: '100%', paddingVertical: 12, borderRadius: 12, alignItems: 'center' }}
                >
                  <Text style={{ color: '#0A0A0A', fontSize: 14, fontWeight: '900' }}>تحديث الآن عبر المتجر</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          <StripeProvider publishableKey={process.env.EXPO_PUBLIC_STRIPE_KEY || ''}>
            <RootNavigation />
          </StripeProvider>
        </View>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
