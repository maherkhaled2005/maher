import React, { Component, ErrorInfo, ReactNode, useEffect } from 'react';
import { StatusBar, View, Text, TouchableOpacity, Platform, Animated, Image, ActivityIndicator } from 'react-native';
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
  const splashScale = React.useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    if (notification) {
      console.log('Received notification in App:', notification.request.content.title);
    }
  }, [notification]);

  useEffect(() => {
    // Elegant, short branding animation then directly into the app
    Animated.parallel([
      Animated.timing(splashOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.spring(splashScale, {
        toValue: 1,
        friction: 7,
        tension: 90,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start();

    const transitionTimer = setTimeout(() => {
      Animated.timing(splashOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: Platform.OS !== 'web',
      }).start(() => {
        setAppReady(true);
      });
    }, Platform.OS === 'web' ? 400 : 900);

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
          }}
        >
          {/* Official TecnoRexa Brand Logo Card */}
          <View
            style={{
              width: 130,
              height: 130,
              borderRadius: 30,
              backgroundColor: '#111111',
              borderWidth: 2,
              borderColor: '#D4AF37',
              overflow: 'hidden',
              justifyContent: 'center',
              alignItems: 'center',
              shadowColor: '#D4AF37',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.35,
              shadowRadius: 16,
              elevation: 10,
              marginBottom: 24,
            }}
          >
            <Image
              source={require('./assets/tecnorexa_official_logo.jpg')}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
          </View>

          {/* Brand Typography */}
          <Text style={{ color: '#FFFFFF', fontSize: 32, fontWeight: '900', letterSpacing: 1, marginBottom: 8 }}>
            Tecno<Text style={{ color: '#D4AF37' }}>Rexa</Text>
          </Text>
          <Text style={{ color: '#A1A1AA', fontSize: 13, fontWeight: '700', letterSpacing: 0.5, textAlign: 'center' }}>
            منصة TecnoRexa المتكاملة لصيانة الأجهزة المنزلية
          </Text>
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
