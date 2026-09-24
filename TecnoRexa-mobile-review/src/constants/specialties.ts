// src/constants/specialties.ts

export const SPECIALTIES = [
  { id: 'washer', label: 'غسالات ملابس وأطباق 🧺', icon: '🧺' },
  { id: 'fridge', label: 'ثلاجات وديب فريزر 🥶', icon: '🥶' },
  { id: 'cooker', label: 'بوتاجازات وأفران 🔥', icon: '🔥' },
  { id: 'microwave', label: 'ميكروويف وأجهزة طهي ♨️', icon: '♨️' },
  { id: 'ac', label: 'تكييفات وتبريد ❄️', icon: '❄️' },
] as const;

export type SpecialtyId = typeof SPECIALTIES[number]['id'];

export const getSpecialtyLabel = (id: string): string => {
  const spec = SPECIALTIES.find(s => s.id === id);
  return spec?.label || id;
};
