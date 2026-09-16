import { Platform, Vibration } from 'react-native';

export const triggerHaptic = (pattern: number | number[] = 10) => {
  if (Platform.OS === 'web') return;
  Vibration.vibrate(pattern);
};

export const triggerSelectionHaptic = () => triggerHaptic(8);
export const triggerSuccessHaptic = () => triggerHaptic([10, 25, 10]);
