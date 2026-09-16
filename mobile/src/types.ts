// Shared types for the mobile app - mirrors the original web app types
export type UserRole = 'customer' | 'client' | 'technician' | 'tech' | 'customer_support' | 'programmer' | 'manager' | 'owner' | 'merchant' | 'seller' | 'admin';
export type UserStatus = 'active' | 'pending' | 'suspended' | 'blocked';

export interface User {
  id: string;
  phone: string;
  name: string;
  email?: string;
  role: UserRole;
  status?: UserStatus;
  verified: boolean;
  avatar?: string;
  bio?: string;
  skills?: string;
  isPro?: boolean;
  canSell?: boolean;
  balance?: number;
  expertise?: string[];
  specialty?: string;
  specialtyPending?: boolean;
  developerRank?: string;
  governorate?: string;
  city?: string;
  area?: string;
  createdAt?: string;
  signature?: string;
  isTechActive?: boolean;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  stock?: number;
  isAvailable: boolean;
  sellerId: string;
  isSponsored: boolean;
  image?: string;
  rating?: number;
  reviewsCount?: number;
}

export interface Order {
  id: string;
  type: 'customer' | 'technician';
  customerName: string;
  total: number;
  status: string;
  serviceType?: string;
  createdAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'audio' | 'video' | 'file';
  timestamp: string;
  isRead?: boolean;
}

export interface Conversation {
  id: string;
  name: string;
  avatar?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
  online: boolean;
  isTyping?: boolean;
}
// ========================================
// Extended types for the full app
// ========================================

export interface SupportTicket {
  id: string;
  subject: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed';
  customerName?: string;
  customerPhone?: string;
  email?: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AppNotification {
  id: string;
  type: 'order' | 'message' | 'system' | 'offer';
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  data?: Record<string, unknown>;
}

export interface WalletTransaction {
  id: string;
  type: 'credit' | 'debit' | 'topup' | 'refund';
  amount: number;
  description?: string;
  createdAt: string;
}

export interface WalletInfo {
  balance: number;
  transactions: WalletTransaction[];
}

export interface TicketReply {
  id: string;
  ticketId: string;
  senderId: string;
  senderName: string;
  content: string;
  isStaff: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName?: string;
  action: string;
  details?: string;
  ip?: string;
  createdAt: string;
}

export interface ErrorReport {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  environment?: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  reporterId?: string;
  createdAt: string;
}

export interface Warehouse {
  id: string;
  name: string;
  location?: string;
  isDefault: boolean;
  createdAt: string;
}

export interface WarehouseInventoryItem {
  id: string;
  warehouseId: string;
  productId: string;
  productName: string;
  quantity: number;
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  warehouseId: string;
  productId: string;
  productName?: string;
  type: 'in' | 'out' | 'transfer_in' | 'transfer_out';
  quantity: number;
  note?: string;
  createdAt: string;
}
