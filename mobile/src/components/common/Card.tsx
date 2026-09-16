import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing, borderRadius, shadows } from '../../theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  noPadding?: boolean;
  gold?: boolean;
  padding?: number;
}

export const Card: React.FC<CardProps> = ({
  children, style, noPadding = false, gold = false, padding,
}) => (
  <View
    style={[
      styles.card,
      gold && styles.goldCard,
      { padding: noPadding ? 0 : (padding ?? spacing.lg) },
      style,
    ]}
  >
    {children}
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.darkCard,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.md,
  },
  goldCard: {
    borderColor: colors.primary,
    borderWidth: 1.5,
  },
});

export default Card;
