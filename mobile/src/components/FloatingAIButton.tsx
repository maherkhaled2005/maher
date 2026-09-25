import React, { useRef, useEffect } from 'react';
import {
  TouchableOpacity,
  View,
  StyleSheet,
  Platform,
  Animated,
} from 'react-native';
import { Bot, Sparkles } from 'lucide-react-native';
import { useAuthStore } from '../store/authStore';
import { navigationRef } from '../navigation/navigationRef';

interface FloatingAIButtonProps {
  currentRoute?: string;
  onNavigate?: () => void;
}

export default function FloatingAIButton({ currentRoute, onNavigate }: FloatingAIButtonProps) {
  const { isAuthenticated } = useAuthStore();

  // Subtle breathing pulse animation for the golden aura
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 1.08,
            duration: 1400,
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(glowAnim, {
            toValue: 0.9,
            duration: 1400,
            useNativeDriver: Platform.OS !== 'web',
          }),
        ]),
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1400,
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(glowAnim, {
            toValue: 0.4,
            duration: 1400,
            useNativeDriver: Platform.OS !== 'web',
          }),
        ]),
      ])
    );
    pulseLoop.start();
    return () => pulseLoop.stop();
  }, []);

  // Do not render if not logged in or if already on AIChat screen
  if (!isAuthenticated || currentRoute === 'AIChat') {
    return null;
  }

  const handlePress = () => {
    if (onNavigate) {
      onNavigate();
    } else if (navigationRef.isReady()) {
      navigationRef.navigate('AIChat');
    }
  };

  return (
    <View style={styles.floatingContainer} pointerEvents="box-none">
      <Animated.View
        style={[
          styles.glowRing,
          {
            transform: [{ scale: pulseAnim }],
            opacity: glowAnim,
          },
        ]}
      />
      <TouchableOpacity
        style={styles.circleBtn}
        onPress={handlePress}
        activeOpacity={0.85}
        accessibilityLabel="مساعد الذكاء الاصطناعي الذكي"
      >
        <View style={styles.iconWrap}>
          <Bot size={24} color="#0A0A0A" />
        </View>
        <View style={styles.sparkleBadge}>
          <Sparkles size={10} color="#D4AF37" />
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  floatingContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'web' ? 100 : 190,
    right: 18,
    zIndex: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowRing: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#D4AF37',
  },
  circleBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#D4AF37',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#FFF8DC',
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkleBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#18181B',
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D4AF37',
  },
});
