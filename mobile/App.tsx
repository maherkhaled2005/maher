import React, { Component, ErrorInfo, ReactNode, useEffect } from 'react';
import {
  StatusBar,
  View,
  Text,
  TouchableOpacity,
  Platform,
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

  // Background non-blocking push notification initialization
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const { usePushNotifications } = require('./src/hooks/usePushNotifications');
      } catch (e) {
        console.warn('Background push notification init skipped:', e);
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Background non-blocking socket connection for live moderation
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
