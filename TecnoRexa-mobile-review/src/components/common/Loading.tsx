import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../theme';

interface LoadingProps {
  message?: string;
  fullScreen?: boolean;
  color?: string;
}

export const Loading: React.FC<LoadingProps> = ({
  message = 'جاري التحميل...',
  fullScreen = false,
  color = colors.primary,
}) => (
  <View style={fullScreen ? styles.fullScreen : styles.container}>
    <ActivityIndicator size="large" color={color} />
    {message ? <Text style={styles.message}>{message}</Text> : null}
  </View>
);

const styles = StyleSheet.create({
  container: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.dark,
  },
  message: {
    color: colors.gray,
    fontSize: typography.sizes.md,
    marginTop: spacing.md,
    fontWeight: '500',
  },
});

export default Loading;
