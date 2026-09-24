// src/constants/categories.ts

export const CATEGORIES = [
  { id: 'all', label: 'الكل' },
  { id: 'electronics', label: 'أجهزة إلكترونية' },
  { id: 'new_tools', label: 'عدة وأدوات جديدة' },
  { id: 'used_tools', label: 'عدة مستعملة' },
  { id: 'new_spare', label: 'قطع غيار جديدة' },
  { id: 'used_spare', label: 'قطع غيار مستعملة' },
] as const;

export type CategoryId = typeof CATEGORIES[number]['id'];

export const getCategoryLabel = (id: string): string => {
  const cat = CATEGORIES.find(c => c.id === id);
  return cat?.label || id;
};
