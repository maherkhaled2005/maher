// mobile/src/components/common/Toast.tsx
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  View,
} from 'react-native';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react-native';
import { colors, borderRadius, typography, spacing, shadows } from '../../theme';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  visible: boolean;
  type: ToastType;
  title: string;
  message?: string;
  onDismiss: () => void;
  duration?: number; // Default 3000ms per Section 23.7
}

export const Toast: React.FC<ToastProps> = ({
  visible,
  type,
  title,
  message,
  onDismiss,
  duration = 3000,
}) => {
  const translateY = useRef(new Animated.Value(-120)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(translateY, {
        toValue: 10,
        duration: 300,
        useNativeDriver: true,
      }).start();

      const timer = setTimeout(() => {
        handleDismiss();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      Animated.timing(translateY, {
        toValue: -120,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleDismiss = () => {
    Animated.timing(translateY, {
      toValue: -120,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      onDismiss();
    });
  };

  if (!visible) return null;

  const getTheme = () => {
    switch (type) {
      case 'success':
        return {
          bg: colors.card,
          border: colors.success,
          text: colors.success,
          icon: <CheckCircle size={24} color={colors.success} />,
        };
      case 'error':
        return {
          bg: colors.card,
          border: colors.danger,
          text: colors.danger,
          icon: <XCircle size={24} color={colors.danger} />,
        };
      case 'warning':
        return {
          bg: colors.card,
          border: colors.warning,
          text: colors.warning,
          icon: <AlertTriangle size={24} color={colors.warning} />,
        };
      case 'info':
      default:
        return {
          bg: colors.card,
          border: colors.info,
          text: colors.info,
          icon: <Info size={24} color={colors.info} />,
        };
    }
  };

  const theme = getTheme();

  return (
    <SafeAreaView pointerEvents="box-none" style={styles.safeArea}>
      <Animated.View
        style={[
          styles.container,
          {
            transform: [{ translateY }],
            borderColor: theme.border,
            backgroundColor: theme.bg,
          },
        ]}
      >
        <View style={styles.contentRow}>
          <View style={styles.iconContainer}>{theme.icon}</View>
          <View style={styles.textContainer}>
            <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
            {message ? <Text style={styles.message}>{message}</Text> : null}
          </View>
          <TouchableOpacity onPress={handleDismiss} style={styles.closeButton}>
            <X size={18} color={colors.grayMedium} />
          </TouchableOpacity>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 99999,
    alignItems: 'center',
  },
  container: {
    width: '92%',
    maxWidth: 500,
    borderWidth: 1.5,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...shadows.lg,
  },
  contentRow: {
    flexDirection: 'row-reverse', // RTL alignment
    alignItems: 'center',
  },
  iconContainer: {
    marginLeft: spacing.sm,
  },
  textContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  title: {
    fontSize: typography.sizes.md,
    fontWeight: '700',
    textAlign: 'right',
  },
  message: {
    fontSize: typography.sizes.sm,
    color: colors.grayLight,
    marginTop: 2,
    textAlign: 'right',
  },
  closeButton: {
    padding: spacing.xs,
    marginRight: spacing.xs,
  },
});

export default Toast;
