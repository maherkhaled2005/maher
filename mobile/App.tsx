import React, { Component, ErrorInfo, ReactNode, useEffect, useState, useRef } from 'react';
import {
  StatusBar,
  View,
  Text,
  TouchableOpacity,
  Platform,
  Animated,
  ActivityIndicator,
  useWindowDimensions,
  Easing,
  Alert,
} from 'react-native';
import { StripeProvider } from './src/components/StripeWrapper';
import RootNavigation from './src/navigation/index';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import './global.css';
import { useAuthStore } from './src/store/authStore';

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

function MainAppContent() {
  const { user, logout } = useAuthStore();
  const [appReady, setAppReady] = useState(false);
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const circleSize = Math.max(120, Math.min(Math.min(windowWidth * 0.45, windowHeight * 0.22), 160));

  // Splash Screen Animation State
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.85)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const loadingOpacity = useRef(new Animated.Value(0)).current;
  const splashContainerOpacity = useRef(new Animated.Value(1)).current;

  const [typedText, setTypedText] = useState('');
  const fullText = 'TecnoRexa';

  // Web layout styles
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

  // Splash Screen Sequence
  useEffect(() => {
    // 1. Logo fades in and scales smoothly
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 350,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(logoScale, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start();

    // 2. Typing 'TecnoRexa' text letter by letter
    let typeIndex = 0;
    let typeInterval: ReturnType<typeof setInterval>;
    const typingDelay = setTimeout(() => {
      typeInterval = setInterval(() => {
        typeIndex++;
        setTypedText(fullText.substring(0, typeIndex));
        if (typeIndex >= fullText.length) {
          clearInterval(typeInterval);
        }
      }, 55);
    }, 200);

    // 3. Subtitle text fades in
    const subtitleTimer = setTimeout(() => {
      Animated.timing(subtitleOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: Platform.OS !== 'web',
      }).start();
    }, 600);

    // 4. 'جاري التحميل...' badge fades in
    const loadingTimer = setTimeout(() => {
      Animated.timing(loadingOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: Platform.OS !== 'web',
      }).start();
    }, 850);

    // 5. Smooth fade out transition to App
    const transitionTimer = setTimeout(() => {
      Animated.timing(splashContainerOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: Platform.OS !== 'web',
      }).start(() => {
        setAppReady(true);
      });
    }, 1600);

    // Hard fallback safety timer to ensure progression
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

  // Background non-blocking push notification initialization
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const { usePushNotifications } = require('./src/hooks/usePushNotifications');
      } catch (e) {
        console.warn('Push notification init skipped:', e);
      }
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  // Background socket connection for live moderation (after login)
  useEffect(() => {
    if (!user?.id) return;
    let socket: any = null;
    const timer = setTimeout(() => {
      try {
        const { io } = require('socket.io-client');
        const { getActiveSocketURL } = require('./src/api/client');
        socket = io(getActiveSocketURL(), {
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
      } catch (e) {
        console.warn('Socket connection error:', e);
      }
    }, 3000);

    return () => {
      clearTimeout(timer);
      try {
        if (socket) socket.disconnect();
      } catch {}
    };
  }, [user?.id]);

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
          {/* Official TR Logo smoothly animated */}
          <Animated.Image
            source={require('./assets/tecnorexa_official_logo.jpg')}
            resizeMode="cover"
            style={{
              width: circleSize,
              height: circleSize,
              borderRadius: circleSize / 2,
              borderWidth: 2,
              borderColor: '#D4AF37',
              backgroundColor: '#000000',
              marginBottom: 20,
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            }}
          />

          {/* Brand Typography in Royal Gold with Typing Effect */}
          <Text
            maxFontSizeMultiplier={1.15}
            style={{
              color: '#D4AF37',
              fontSize: 32,
              fontWeight: '900',
              letterSpacing: 1,
              marginBottom: 6,
              textAlign: 'center',
              minHeight: 40,
            }}
          >
            {typedText.substring(0, 5)}
            <Text style={{ color: '#F3E5AB' }}>{typedText.substring(5)}</Text>
          </Text>

          {/* Subtitle */}
          <Animated.Text
            maxFontSizeMultiplier={1.15}
            numberOfLines={2}
            style={{
              opacity: subtitleOpacity,
              color: '#D4AF37',
              fontSize: 13,
              fontWeight: '700',
              letterSpacing: 0.5,
              textAlign: 'center',
              marginBottom: 22,
              paddingHorizontal: 8,
            }}
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
            }}
          >
            <ActivityIndicator size="small" color="#D4AF37" />
            <Text
              maxFontSizeMultiplier={1.15}
              style={{ color: '#D4AF37', fontSize: 13, fontWeight: '900' }}
            >
              جاري التحميل...
            </Text>
          </Animated.View>
        </View>
      </Animated.View>
    );
  }

  return (
    <View style={[{ flex: 1, backgroundColor: '#0A0A0A' }, Platform.OS === 'web' && { height: '100%', maxHeight: '100%', overflow: 'hidden' } as any]}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />
      <StripeProvider publishableKey={process.env.EXPO_PUBLIC_STRIPE_KEY || ''}>
        <RootNavigation />
      </StripeProvider>
    </View>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <MainAppContent />
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
