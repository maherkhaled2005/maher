// src/types/index.ts
export * from '../types';

export interface ProductItem {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  images: string[];
  sellerId: string;
  sellerName: string;
  rating: number;
  reviewsCount: number;
  isSponsored: boolean;
  isAvailable: boolean;
  createdAt: string;
  views: number;
  sales: number;
}

export interface OrderItem {
  id: string;
  productId?: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface MessageItem {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  text: string;
  isEncrypted: boolean;
  isRead: boolean;
  createdAt: string;
}

export interface TicketItem {
  id: string;
  subject: string;
  description: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  status: 'open' | 'in_progress' | 'pending_customer' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: 'payments' | 'technician_complaint' | 'product_inquiry' | 'shipping' | 'tech_issue' | 'other';
  assignedTo?: string;
  createdAt: string;
  updatedAt?: string;
}
