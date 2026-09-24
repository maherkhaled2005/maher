// src/constants/roles.ts

export const ROLES = [
  { id: 'owner', label: 'المالك 👑', color: '#d97706', bg: '#fef3c7', icon: '👑' },
  { id: 'manager', label: 'المدير 👔', color: '#0ea5e9', bg: '#e0f2fe', icon: '👔' },
  { id: 'programmer', label: 'المبرمج 💻', color: '#8b5cf6', bg: '#ede9fe', icon: '💻' },
  { id: 'customer_support', label: 'خدمة العملاء 🎧', color: '#14b8a6', bg: '#ccfbf1', icon: '🎧' },
  { id: 'technician', label: 'فني صيانة 🧑🔧', color: '#10b981', bg: '#d1fae5', icon: '🧑🔧' },
  { id: 'merchant', label: 'تاجر معتمد 🏪', color: '#ea580c', bg: '#ffedd5', icon: '🏪' },
  { id: 'customer', label: 'عميل 👤', color: '#2563eb', bg: '#dbeafe', icon: '👤' },
] as const;

export type RoleId = typeof ROLES[number]['id'];

export const normalizeRole = (role: string): RoleId => {
  const map: Record<string, RoleId> = {
    'owner': 'owner',
    'admin': 'owner',
    'manager': 'manager',
    'programmer': 'programmer',
    'customer_support': 'customer_support',
    'support': 'customer_support',
    'technician': 'technician',
    'tech': 'technician',
    'merchant': 'merchant',
    'seller': 'merchant',
    'customer': 'customer',
    'client': 'customer',
  };
  return map[role?.toLowerCase()] || 'customer';
};

export const getRoleLabel = (role: string): string => {
  const r = ROLES.find(r => r.id === normalizeRole(role));
  return r?.label || 'عميل 👤';
};

export const hasPermission = (userRole: string, requiredRole: string): boolean => {
  const order = ['customer', 'technician', 'merchant', 'customer_support', 'programmer', 'manager', 'owner'];
  const userIndex = order.indexOf(normalizeRole(userRole));
  const requiredIndex = order.indexOf(normalizeRole(requiredRole));
  if (userIndex === -1 || requiredIndex === -1) return false;
  return userIndex >= requiredIndex;
};
