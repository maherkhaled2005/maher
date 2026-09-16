// src/constants/devices.ts

export const DEVICES = [
  { label: 'غسالة', emoji: '🧺' },
  { label: 'ثلاجة', emoji: '❄️' },
  { label: 'تكييف', emoji: '💨' },
  { label: 'شاشة', emoji: '📺' },
  { label: 'موبايل', emoji: '📱' },
  { label: 'لاب توب', emoji: '💻' },
  { label: 'مكيف سبليت', emoji: '🌀' },
  { label: 'سخان', emoji: '🚿' },
  { label: 'فرن', emoji: '🔥' },
  { label: 'خلاط', emoji: '⚡' },
  { label: 'تلفزيون', emoji: '📡' },
  { label: 'بوتاجاز', emoji: '🍳' },
  { label: 'مروحة', emoji: '💨' },
  { label: 'طابعة', emoji: '🖨️' },
  { label: 'راوتر', emoji: '📶' },
  { label: 'UPS', emoji: '🔋' },
  { label: 'مولد', emoji: '⚡' },
  { label: 'مضخة مياه', emoji: '💧' },
  { label: 'ستاند باي', emoji: '🔌' },
  { label: 'أخرى', emoji: '⚙️' },
] as const;

export type Device = typeof DEVICES[number];

export const getDeviceEmoji = (label: string): string => {
  const device = DEVICES.find(d => d.label === label);
  return device?.emoji || '⚙️';
};
