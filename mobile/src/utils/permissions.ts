// src/utils/permissions.ts
export const normalizeRole = (role: string): string => {
  const map: Record<string, string> = {
    owner: 'owner', admin: 'owner',
    manager: 'manager',
    programmer: 'programmer', developer: 'programmer',
    customer_support: 'customer_support', support: 'customer_support',
    technician: 'technician', tech: 'technician',
    merchant: 'merchant', seller: 'merchant',
    customer: 'customer', client: 'customer',
  };
  return map[role?.toLowerCase()] || 'customer';
};

export const ROLE_HIERARCHY: Record<string, number> = {
  owner: 7, manager: 6, programmer: 5,
  customer_support: 4, merchant: 3, technician: 2, customer: 1,
};

export const hasPermission = (userRole: string, requiredRole: string): boolean =>
  (ROLE_HIERARCHY[normalizeRole(userRole)] || 0) >= (ROLE_HIERARCHY[normalizeRole(requiredRole)] || 0);

export const isOwner = (role: string) => normalizeRole(role) === 'owner';
export const isAdmin = (role: string) => {
  const r = normalizeRole(role);
  return r === 'owner' || r === 'manager';
};
export const isProgrammer = (role: string) => {
  const r = normalizeRole(role);
  return r === 'owner' || r === 'programmer';
};
export const isSupport = (role: string) => {
  const r = normalizeRole(role);
  return ['owner', 'manager', 'customer_support'].includes(r);
};
export const isTechnician = (role: string) => {
  const r = normalizeRole(role);
  return r === 'owner' || r === 'technician';
};
export const isMerchant = (role: string) => {
  const r = normalizeRole(role);
  return r === 'owner' || r === 'merchant';
};
export const isCustomer = (role: string) => normalizeRole(role) === 'customer';

export const getRoleColor = (role: string): string => {
  const map: Record<string, string> = {
    owner: '#D4AF37', manager: '#1E40AF', programmer: '#7C3AED',
    customer_support: '#0D9488', technician: '#EA580C', merchant: '#15803D', customer: '#06B6D4',
  };
  return map[normalizeRole(role)] || '#6B7280';
};

export const getRoleLabel = (role: string): string => {
  const map: Record<string, string> = {
    owner: 'المالك 👑', manager: 'المدير 🔵', programmer: 'المبرمج 💻',
    customer_support: 'دعم العملاء 🩵', technician: 'فني 🔧', merchant: 'تاجر 🟢', customer: 'عميل',
  };
  return map[normalizeRole(role)] || 'عميل';
};

export const DEV_RANK_HIERARCHY: Record<string, number> = {
  lead: 3,      // أعلى رتبة برمجية: المسؤول التقني (المهندس ماهر خالد)
  assistant: 2, // الرتبة الوسطى: المبرمج المساعد (تحت ماهر ومشرف على العاديين)
  junior: 1,    // أقل رتبة برمجية: المبرمج العادي (ينفذ التعليمات فقط)
};

export const isDevLead = (user: any) => {
  if (!user) return false;
  if (user.role === 'owner') return true;
  return user.developerRank === 'lead' || user.phone === '01064739664' || user.name?.includes('ماهر');
};

export const isDevAssistant = (user: any) => {
  if (!user) return false;
  if (isDevLead(user)) return true;
  return user.developerRank === 'assistant' || user.role === 'programmer_assistant';
};

export const isDevJunior = (user: any) => {
  if (!user) return false;
  return !isDevAssistant(user);
};

export const getDeveloperRankLevel = (user: any): number => {
  if (user?.role === 'owner') return 4; // مالك المنصة
  if (isDevLead(user)) return 3;       // المسؤول التقني (ماهر)
  if (isDevAssistant(user)) return 2;  // المبرمج المساعد
  return 1;                            // المبرمج العادي
};

export const getDeveloperRankLabel = (rank?: string, name?: string): { title: string; color: string; icon: string; levelText: string } => {
  if (rank === 'lead' || name?.includes('ماهر')) {
    return { title: '👑 المسؤول التقني (ماهر)', color: '#8B5CF6', icon: '👑', levelText: 'الرتبة الأولى (أعلى رتبة برمجية)' };
  }
  if (rank === 'assistant') {
    return { title: '⚡ المبرمج المساعد', color: '#F59E0B', icon: '⚡', levelText: 'الرتبة الثانية (مشرف المطورين)' };
  }
  return { title: '💻 المبرمج العادي', color: '#3B82F6', icon: '💻', levelText: 'الرتبة الثالثة (مطور تنفيذ)' };
};

export default {
  normalizeRole, hasPermission, isOwner, isAdmin, isProgrammer,
  isSupport, isTechnician, isMerchant, isCustomer, getRoleColor, getRoleLabel,
  isDevLead, isDevAssistant, isDevJunior, getDeveloperRankLevel, getDeveloperRankLabel,
};
