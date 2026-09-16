// src/utils/format.ts

export const formatDate = (iso: string | null | undefined): string => {
  if (!iso) return '';
  try {
    const date = new Date(iso);
    return date.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
};

export const formatTimeAgo = (iso: string | null | undefined): string => {
  if (!iso) return '';
  try {
    const now = Date.now();
    const then = new Date(iso).getTime();
    const diffMs = now - then;
    const diffMin = Math.floor(diffMs / 60000);
    
    if (diffMin < 1) return 'الآن';
    if (diffMin < 60) return `منذ ${diffMin} دقيقة`;
    
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `منذ ${diffHr} ساعة`;
    
    const diffDays = Math.floor(diffHr / 24);
    if (diffDays < 7) return `منذ ${diffDays} يوم`;
    
    return formatDate(iso);
  } catch {
    return '';
  }
};

export const formatCurrency = (amount: number): string => {
  if (isNaN(amount) || amount === null || amount === undefined) return '0 ج.م';
  return amount.toLocaleString('ar-EG') + ' ج.م';
};

export const formatPhone = (phone: string): string => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return cleaned.slice(0, 3) + ' ' + cleaned.slice(3, 7) + ' ' + cleaned.slice(7);
  }
  return phone;
};
