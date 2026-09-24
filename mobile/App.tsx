import React, { Component, ErrorInfo, ReactNode, useEffect } from 'react';
import { StatusBar, View, Text, TouchableOpacity, Platform, Animated, Image, ActivityIndicator, useWindowDimensions } from 'react-native';
import { StripeProvider } from './src/components/StripeWrapper';
import RootNavigation from './src/navigation/index';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import Logo from './src/components/Logo';
import './global.css';
import { usePushNotifications } from './src/hooks/usePushNotifications';

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
  const [appReady, setAppReady] = React.useState(false);
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const circleSize = Math.max(160, Math.min(Math.min(windowWidth * 0.55, windowHeight * 0.28), 200));

  useEffect(() => {
    if (Platform.OS === 'web') {
      const style = document.createElement('style');
      style.textContent = `
        html, body, #root {
          height: 100%;
          width: 100%;
          display: flex;
          flex-direction: column;
        }
        #root {
          flex: 1;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  // 1. Splash Screen Animation State
  const splashOpacity = React.useRef(new Animated.Value(0)).current;
  const splashScale = React.useRef(new Animated.Value(1.35)).current;

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
        duration: 600,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.spring(splashScale, {
        toValue: 1,
        friction: 7,
        tension: 40,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start();

    // Linger comfortably (~2.8s) so user sees splash and loading clearly
    const transitionTimer = setTimeout(() => {
      Animated.timing(splashOpacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: Platform.OS !== 'web',
      }).start(() => {
        setAppReady(true);
      });
    }, 2800);

    return () => clearTimeout(transitionTimer);
  }, []);

  if (!appReady) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0A0A0A', justifyContent: 'center', alignItems: 'center' }}>
        <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />

        <Animated.View
          style={{
            opacity: splashOpacity,
            transform: [{ scale: splashScale }],
            alignItems: 'center',
            paddingHorizontal: 20,
          }}
        >
          {/* Official TecnoRexa Blue Sphere Showcase Graphic with Royal Gold Border */}
          <View
            style={{
              width: circleSize,
              height: circleSize,
              borderRadius: circleSize / 2,
              backgroundColor: '#0F0E0B',
              borderWidth: 4,
              borderColor: '#D4AF37',
              overflow: 'hidden',
              justifyContent: 'center',
              alignItems: 'center',
              shadowColor: '#D4AF37',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.75,
              shadowRadius: 30,
              elevation: 20,
              marginBottom: 24,
            }}
          >
            <Image
              source={require('./assets/tecnorexa_sphere_showcase.jpg')}
              style={{ width: '100%', height: '100%', borderRadius: circleSize / 2 }}
              resizeMode="cover"
            />
          </View>

          {/* Brand Typography in Pure Gold */}
          <Text style={{ color: '#D4AF37', fontSize: 34, fontWeight: '900', letterSpacing: 1, marginBottom: 6 }}>
            Tecno<Text style={{ color: '#F5DEB3' }}>Rexa</Text>
          </Text>
          <Text style={{ color: '#D4AF37', fontSize: 14, fontWeight: '700', letterSpacing: 0.5, textAlign: 'center', marginBottom: 24, opacity: 0.9 }}>
            منصة TecnoRexa المتكاملة لصيانة الأجهزة المنزلية
          </Text>

          {/* Gold Loading Indicator and Text */}
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
              shadowOpacity: 0.35,
              shadowRadius: 12,
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
      <View style={[{ flex: 1 }, Platform.OS === 'web' && { height: '100vh' } as any]}>
        <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />
        <StripeProvider publishableKey={process.env.EXPO_PUBLIC_STRIPE_KEY || ''}>
          <RootNavigation />
        </StripeProvider>
      </View>
    </ErrorBoundary>
  );
}
