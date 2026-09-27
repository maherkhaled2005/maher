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
  const splashOpacity = React.useRef(new Animated.Value(0)).current;
  const splashScale = React.useRef(new Animated.Value(1.15)).current;

  useEffect(() => {
    if (notification) {
      console.log('Received notification in App:', notification.request.content.title);
    }
  }, [notification]);

  useEffect(() => {
    // Elegant entrance animation: scale down smoothly into focus
    Animated.parallel([
      Animated.timing(splashOpacity, {
        toValue: 1,
        duration: 350,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.spring(splashScale, {
        toValue: 1,
        friction: 8,
        tension: 50,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start();

    // Fast, crisp splash: 350ms on Web, 1500ms on Native
    const splashDuration = Platform.OS === 'web' ? 350 : 1500;
    const transitionTimer = setTimeout(() => {
      Animated.timing(splashOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: Platform.OS !== 'web',
      }).start(() => {
        setAppReady(true);
      });
    }, splashDuration);

    return () => clearTimeout(transitionTimer);
  }, []);

  if (!appReady) {
    return (
      <View style={{ flex: 1, backgroundColor: '#070A0F', justifyContent: 'center', alignItems: 'center' }}>
        <StatusBar barStyle="light-content" backgroundColor="#070A0F" translucent />

        <Animated.View
          style={{
            opacity: splashOpacity,
            transform: [{ scale: splashScale }],
            alignItems: 'center',
            paddingHorizontal: 20,
          }}
        >
          {/* Official TecnoRexa Large Blue Sphere Showcase Graphic with Royal Gold Border */}
          <View
            style={{
              width: 220,
              height: 220,
              borderRadius: 110,
              backgroundColor: '#0A1118',
              borderWidth: 3.5,
              borderColor: '#D4AF37',
              overflow: 'hidden',
              justifyContent: 'center',
              alignItems: 'center',
              shadowColor: '#D4AF37',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.65,
              shadowRadius: 28,
              elevation: 16,
              marginBottom: 24,
            }}
          >
            <Image
              source={require('./assets/tecnorexa_sphere_showcase.jpg')}
              style={{ width: '100%', height: '100%', borderRadius: 110 }}
              resizeMode="cover"
            />
          </View>

          {/* Brand Typography in Royal Gold */}
          <Text style={{ color: '#D4AF37', fontSize: 34, fontWeight: '900', letterSpacing: 1, marginBottom: 6 }}>
            Tecno<Text style={{ color: '#F3E5AB' }}>Rexa</Text>
          </Text>
          <Text style={{ color: '#D4AF37', fontSize: 14, fontWeight: '700', letterSpacing: 0.5, textAlign: 'center', marginBottom: 24, opacity: 0.95 }}>
            منصة TecnoRexa المتكاملة لصيانة الأجهزة المنزلية
          </Text>

          {/* Luxury Gold Loading Indicator */}
          <View
            style={{
              flexDirection: 'row-reverse',
              alignItems: 'center',
              gap: 10,
              backgroundColor: 'rgba(212, 175, 55, 0.1)',
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
          </View>
        </Animated.View>
      </View>
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
