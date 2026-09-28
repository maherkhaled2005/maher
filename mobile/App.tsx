import React, { Component, ErrorInfo, ReactNode, useEffect } from 'react';
import { StatusBar, View, Text, TouchableOpacity, Platform, Animated, Image, ActivityIndicator, useWindowDimensions } from 'react-native';
import { StripeProvider } from './src/components/StripeWrapper';
import RootNavigation from './src/navigation/index';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import Logo from './src/components/Logo';
import './global.css';
import { usePushNotifications } from './src/hooks/usePushNotifications';
import { io } from 'socket.io-client';
import { getActiveSocketURL } from './src/api/client';
import { useAuthStore } from './src/store/authStore';
import { Alert } from 'react-native';

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
  const [appReady, setAppReady] = React.useState(false);
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const circleSize = Math.max(160, Math.min(Math.min(windowWidth * 0.55, windowHeight * 0.28), 200));

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

  // 1. Splash Screen Animation State
  const logoOpacity = React.useRef(new Animated.Value(0)).current;
  const logoScale = React.useRef(new Animated.Value(0.8)).current;
  const subtitleOpacity = React.useRef(new Animated.Value(0)).current;
  const loadingOpacity = React.useRef(new Animated.Value(0)).current;
  const splashContainerOpacity = React.useRef(new Animated.Value(1)).current;

  const [typedText, setTypedText] = React.useState('');
  const fullText = 'TecnoRexa';

  useEffect(() => {
    if (notification) {
      console.log('Received notification in App:', notification.request.content.title);
    }
  }, [notification]);

  useEffect(() => {
    // 0ms: Logo image fades in and scales
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(logoScale, {
        toValue: 1,
        duration: 300,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start();

    // 300ms: Start typing 'TecnoRexa' letter by letter
    let typeIndex = 0;
    let typeInterval: ReturnType<typeof setInterval>;
    const typingDelay = setTimeout(() => {
      typeInterval = setInterval(() => {
        typeIndex++;
        setTypedText(fullText.substring(0, typeIndex));
        if (typeIndex >= fullText.length) {
          clearInterval(typeInterval);
        }
      }, 100);
    }, 300);

    // 1300ms: Subtitle text fades in
    const subtitleTimer = setTimeout(() => {
      Animated.timing(subtitleOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: Platform.OS !== 'web',
      }).start();
    }, 1300);

    // 1800ms: 'جاري التحميل...' fades in
    const loadingTimer = setTimeout(() => {
      Animated.timing(loadingOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: Platform.OS !== 'web',
      }).start();
    }, 1800);

    // 2800ms: Splash fades out, app starts
    const transitionTimer = setTimeout(() => {
      Animated.timing(splashContainerOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: Platform.OS !== 'web',
      }).start(() => {
        setAppReady(true);
      });
    }, 2800);

    return () => {
      clearTimeout(typingDelay);
      clearInterval(typeInterval);
      clearTimeout(subtitleTimer);
      clearTimeout(loadingTimer);
      clearTimeout(transitionTimer);
    };
  }, []);

  if (!appReady) {
    return (
      <Animated.View style={{ flex: 1, backgroundColor: '#070A0F', justifyContent: 'center', alignItems: 'center', opacity: splashContainerOpacity }}>
        <StatusBar barStyle="light-content" backgroundColor="#070A0F" translucent />

        <View style={{ alignItems: 'center', paddingHorizontal: 20 }}>
          {/* Logo Image */}
          <Animated.Image
            source={require('./assets/tr_logo.jpg')}
            style={{
              width: 120,
              height: 120,
              borderRadius: 20,
              marginBottom: 24,
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            }}
          />

          {/* Brand Typography in Royal Gold with Typing Effect */}
          <Text style={{ color: '#D4AF37', fontSize: 36, fontWeight: '900', letterSpacing: 1, marginBottom: 8, textAlign: 'center', minHeight: 45 }}>
            {typedText.substring(0, 5)}
            <Text style={{ color: '#F3E5AB' }}>{typedText.substring(5)}</Text>
          </Text>

          {/* Subtitle */}
          <Animated.Text style={{ opacity: subtitleOpacity, color: '#D4AF37', fontSize: 14, fontWeight: '700', letterSpacing: 0.5, textAlign: 'center', marginBottom: 28 }}>
            منصة TecnoRexa المتكاملة لصيانة الأجهزة المنزلية
          </Animated.Text>

          {/* Luxury Gold Loading Indicator */}
          <Animated.View
            style={{
              opacity: loadingOpacity,
              flexDirection: 'row-reverse',
              alignItems: 'center',
              gap: 10,
              backgroundColor: '#070A0F',
              paddingHorizontal: 20,
              paddingVertical: 10,
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
            <Text style={{ color: '#D4AF37', fontSize: 14, fontWeight: '900' }}>
              جاري التحميل...
            </Text>
          </Animated.View>
        </View>
      </Animated.View>
    );
  }

  return (
    <ErrorBoundary>
      <View style={[{ flex: 1 }, Platform.OS === 'web' && { height: '100%', maxHeight: '100%', overflow: 'hidden' } as any]}>
        <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />
        <StripeProvider publishableKey={process.env.EXPO_PUBLIC_STRIPE_KEY || ''}>
          <RootNavigation />
        </StripeProvider>
      </View>
    </ErrorBoundary>
  );
}
