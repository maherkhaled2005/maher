import {
  normalizeRole as normalizeRoleFromRoles,
  getRoleLabel,
  getRoleColor,
  isAdminRole,
  isStaffRole,
} from './roles';

// Re-export shared API (axios instance with auth interceptor)
export { api, SOCKET_URL } from './api/client';

export const normalizeRole = (role: string): string => normalizeRoleFromRoles(role);

export { hasPermission } from './utils/permissions';

// Re-export role helpers so screens can use them directly
export { getRoleLabel, getRoleColor, isAdminRole, isStaffRole };


export const formatDate = (dateStr: string): string => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' });
};

export const formatCurrency = (amount: number, currency = 'EGP'): string => {
  return `${amount?.toLocaleString('ar-EG')} ${currency}`;
};

export const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    active: '#22c55e',
    pending: '#f59e0b',
    suspended: '#ef4444',
    blocked: '#ef4444',
    completed: '#22c55e',
    cancelled: '#ef4444',
    in_progress: '#3b82f6',
    assigned: '#8b5cf6',
    delivered: '#22c55e',
    shipped: '#3b82f6',
    processing: '#f59e0b',
  };
  return colors[status] || '#6b7280';
};
