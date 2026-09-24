// src/constants/devices.ts

export const DEVICES = [
  { label: 'غسالة ملابس', emoji: '🧺' },
  { label: 'غسالة أطباق', emoji: '🍽️' },
  { label: 'ثلاجة', emoji: '❄️' },
  { label: 'ديب فريزر', emoji: '🧊' },
  { label: 'تكييف وتبريد', emoji: '💨' },
  { label: 'بوتاجاز', emoji: '🍳' },
  { label: 'فرن بلت إن', emoji: '🔥' },
  { label: 'ميكروويف', emoji: '♨️' },
  { label: 'سخان مياه', emoji: '🚿' },
  { label: 'شاشة وتلفزيون', emoji: '📺' },
  { label: 'خلاط ومحضر طعام', emoji: '⚡' },
  { label: 'مروحة', emoji: '💨' },
  { label: 'أخرى (أجهزة منزلية)', emoji: '⚙️' },
] as const;

export type Device = typeof DEVICES[number];

export const getDeviceEmoji = (label: string): string => {
  const device = DEVICES.find(d => d.label === label);
  return device?.emoji || '⚙️';
};
