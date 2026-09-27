// src/constants/devices.ts
// Canonical Household Appliance Catalog (Strictly Household Appliances Only)

export const DEVICES = [
  { label: 'ثلاجة', emoji: '❄️' },
  { label: 'ديب فريزر', emoji: '🧊' },
  { label: 'غسالة ملابس', emoji: '🧺' },
  { label: 'غسالة أطباق', emoji: '🍽️' },
  { label: 'ميكروويف', emoji: '♨️' },
  { label: 'بوتجاز', emoji: '🍳' },
  { label: 'فرن غاز', emoji: '🔥' },
  { label: 'فرن كهربائي', emoji: '⚡' },
  { label: 'تكييف منزلي', emoji: '💨' },
  { label: 'شفاط مطبخ', emoji: '🌀' },
  { label: 'سخان مياه', emoji: '🚿' },
  { label: 'خلاط', emoji: '🥤' },
  { label: 'عجان', emoji: '🥣' },
  { label: 'كبة', emoji: '🔪' },
  { label: 'محضرة طعام', emoji: '🍲' },
  { label: 'عصارة', emoji: '🍊' },
  { label: 'خلاط يدوي', emoji: '🥄' },
  { label: 'مكنسة كهربائية', emoji: '🧹' },
  { label: 'مكواة', emoji: '👔' },
  { label: 'مروحة', emoji: '💨' },
  { label: 'مروحة سقف', emoji: '🌪️' },
  { label: 'غلاية مياه', emoji: '🫖' },
  { label: 'ماكينة قهوة', emoji: '☕' },
  { label: 'ماكينة تحضير شاي', emoji: '🍵' },
  { label: 'مقلاة هوائية', emoji: '🍟' },
  { label: 'مكنسة روبوت', emoji: '🤖' },
  { label: 'مجفف ملابس', emoji: '👕' },
  { label: 'صانعة ساندوتشات', emoji: '🥪' },
] as const;

export type Device = typeof DEVICES[number];

export const getDeviceEmoji = (label: string): string => {
  const device = DEVICES.find(d => d.label === label);
  return device?.emoji || '⚙️';
};

export const HOUSEHOLD_APPLIANCES = DEVICES.map(d => d.label);
