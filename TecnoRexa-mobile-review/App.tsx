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
  const splashLogoScale = React.useRef(new Animated.Value(5)).current; // Start very large
  const splashContentOpacity = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (notification) {
      console.log('Received notification in App:', notification.request.content.title);
    }
  }, [notification]);

  useEffect(() => {
    // Safety fallback: guaranteed entry after short timeout
    const fallbackTimer = setTimeout(() => {
      setAppReady(true);
    }, Platform.OS === 'web' ? 600 : 2500);

    // Run animation
    try {
      Animated.sequence([
        Animated.spring(splashLogoScale, {
          toValue: 1,
          friction: 5,
          tension: 80,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(splashContentOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.delay(Platform.OS === 'web' ? 400 : 1500),
      ]).start(() => {
        setAppReady(true);
      });
    } catch {
      setAppReady(true);
    }

    return () => clearTimeout(fallbackTimer);
  }, []);

  if (!appReady) {
    return (
      <TouchableOpacity 
        activeOpacity={1} 
        onPress={() => setAppReady(true)}
        style={{ flex: 1, backgroundColor: '#0A0A0A', justifyContent: 'center', alignItems: 'center' }}
      >
        <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />
        
        {/* Animated Circular Image Logo */}
        <Animated.View style={{ transform: [{ scale: splashLogoScale }], alignItems: 'center' }}>
          <View style={{
            width: 250,
            height: 250,
            borderRadius: 125,
            backgroundColor: '#000',
            borderWidth: 4,
            borderColor: '#D4AF37',
            overflow: 'hidden',
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: '#D4AF37',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.5,
            shadowRadius: 20,
            elevation: 15,
          }}>
            <Image
              source={require('./assets/splash_poster.jpg')}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
          </View>
        </Animated.View>

        <Animated.View style={{ opacity: splashContentOpacity, alignItems: 'center', marginTop: 32 }}>
          {/* Main English Name */}
          <Text style={{ color: '#FFFFFF', fontSize: 36, fontWeight: '900', letterSpacing: 1, marginBottom: 12 }}>
            Tecno<Text style={{ color: '#D4AF37' }}>Rexa</Text>
          </Text>
          <Text style={{ color: '#94A3B8', fontSize: 18, fontWeight: '700', letterSpacing: 1 }}>
            كل شيء في تطبيق واحد
          </Text>

          {/* Gold Loading Button */}
          <TouchableOpacity 
            onPress={() => setAppReady(true)}
            activeOpacity={0.8}
            style={{ 
              marginTop: 50,
              backgroundColor: '#D4AF37', // Gold color
              borderRadius: 30, 
              paddingVertical: 14, 
              paddingHorizontal: 40,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              shadowColor: '#D4AF37',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.4,
              shadowRadius: 15,
              elevation: 10,
            }}
          >
            <ActivityIndicator size="small" color="#FFFFFF" />
            <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '800', letterSpacing: 1 }}>دخول التطبيق</Text>
          </TouchableOpacity>
        </Animated.View>
      </TouchableOpacity>
    );
  }

  return (
    <ErrorBoundary>
      <View style={[{ flex: 1 }, Platform.OS === 'web' && { height: '100vh' } as any]}>
        <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />
        <StripeProvider publishableKey="pk_test_51MzTecnoRexaLiveKeyMock99887766554433221100">
          <RootNavigation />
        </StripeProvider>
      </View>
    </ErrorBoundary>
  );
}
