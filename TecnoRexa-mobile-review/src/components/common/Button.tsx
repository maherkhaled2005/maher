import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, View } from 'react-native';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { triggerSelectionHaptic } from '../../utils/haptics';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'success' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  style?: any;
}

export const Button: React.FC<ButtonProps> = ({
  title, onPress, variant = 'primary', size = 'md',
  loading = false, disabled = false, fullWidth = false, icon, style,
}) => {
  const getStyle = () => {
    switch (variant) {
      case 'primary':   return { bg: colors.primary, text: colors.dark, border: undefined };
      case 'secondary': return { bg: colors.darkCard, text: colors.white, border: undefined };
      case 'outline':   return { bg: 'transparent', text: colors.primary, border: colors.primary };
      case 'danger':    return { bg: colors.danger, text: colors.white, border: undefined };
      case 'success':   return { bg: colors.success, text: colors.white, border: undefined };
      default:          return { bg: 'transparent', text: colors.gray, border: undefined };
    }
  };
  const getPad = () => {
    switch (size) {
      case 'sm': return { pv: spacing.sm, ph: spacing.md, fs: typography.sizes.sm };
      case 'lg': return { pv: spacing.lg, ph: spacing.xl, fs: typography.sizes.lg };
      default:   return { pv: spacing.md, ph: spacing.lg, fs: typography.sizes.md };
    }
  };
  const { bg, text, border } = getStyle();
  const { pv, ph, fs } = getPad();
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={() => {
        triggerSelectionHaptic();
        onPress();
      }}
      disabled={isDisabled}
      activeOpacity={0.75}
      style={[
        styles.btn,
        {
          paddingVertical: pv,
          paddingHorizontal: ph,
          backgroundColor: isDisabled ? '#1E293B' : bg,
          borderWidth: border ? 1.5 : 0,
          borderColor: border || 'transparent',
          width: fullWidth ? '100%' : 'auto',
          opacity: isDisabled ? 0.6 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={text} size="small" />
      ) : (
        <>
          {icon && <View style={{ marginRight: 6 }}>{icon}</View>}
          <Text style={[styles.txt, { color: isDisabled ? colors.gray : text, fontSize: fs }]}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
  },
  txt: {
    fontWeight: '900',
    textAlign: 'center',
  },
});

export default Button;
