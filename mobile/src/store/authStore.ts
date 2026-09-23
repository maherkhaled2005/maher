// src/store/authStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchApi } from '../api/client';

interface User {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: string;
  status: string;
  balance: number;
  avatar?: string;
  bio?: string;
  isPro?: boolean;
  available?: number | boolean;
  developerRank?: string;
  specialty?: string;
  storeName?: string;
  signature?: string;
  rating?: number;
  ratingCount?: number;
  governorate?: string;
  city?: string;
  area?: string;
  address?: string;
  mustChangePassword?: boolean;
  isAvailable?: boolean;
  specialties?: string;
  createdAt: string;
}

export interface LoginResult {
  requireOtp: boolean;
  tempToken?: string;
  phone?: string;
  message?: string;
  user?: User;
  token?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isCheckingAuth: boolean;
  isAuthenticated: boolean;
  login: (identifier: string, password: string) => Promise<LoginResult>;
  verifyLoginOTP: (tempToken: string, phone: string, otp: string) => Promise<void>;
  loginWithOTP: (phone: string, otp: string) => Promise<void>;
  resendOTP: (tempToken?: string, phone?: string) => Promise<any>;
  forgotPassword: (phone: string) => Promise<any>;
  resetPassword: (phone: string, otp: string, newPassword: string) => Promise<any>;
  register: (data: any) => Promise<any>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  quickAccess: (role: string) => Promise<void>;
  updateUser: (user: User) => void;
}

const MOCK_USERS: Record<string, User> = {
  owner: { id: 'mock-owner', name: 'المهندس خالد محمد', email: 'owner@tecnorexa.com', phone: '01000000001', role: 'owner', status: 'active', balance: 0, createdAt: new Date().toISOString() },
  manager: { id: 'mock-manager', name: 'المدير التنفيذي', email: 'manager@tecnorexa.com', phone: '01000000003', role: 'manager', status: 'active', balance: 0, createdAt: new Date().toISOString() },
  programmer: { id: 'mock-programmer', name: 'المهندس ماهر خالد', email: 'maher@tecnorexa.com', phone: '01064739664', role: 'programmer', status: 'active', balance: 0, createdAt: new Date().toISOString() },
  customer_support: { id: 'mock-support', name: 'فريق خدمة العملاء', email: 'support@tecnorexa.com', phone: '01000000004', role: 'customer_support', status: 'active', balance: 0, createdAt: new Date().toISOString() },
  technician: { id: 'mock-tech', name: 'فني صيانة معتمد', email: 'tech@tecnorexa.com', phone: '01000000005', role: 'technician', status: 'active', balance: 0, createdAt: new Date().toISOString() },
  merchant: { id: 'mock-merchant', name: 'تاجر قطع الغيار المعتمد', email: 'merchant@tecnorexa.com', phone: '01000000006', role: 'merchant', status: 'active', balance: 0, createdAt: new Date().toISOString() },
  customer: { id: 'mock-customer', name: 'عميل المنصة المعتمد', email: 'customer@tecnorexa.com', phone: '01000000007', role: 'customer', status: 'active', balance: 0, createdAt: new Date().toISOString() },
};

const resolveMockUser = (cleanId: string): User => {
  const idLower = cleanId.toLowerCase();
  for (const u of Object.values(MOCK_USERS)) {
    if (u.phone === cleanId || u.email.toLowerCase() === idLower || u.role === idLower) {
      return u;
    }
  }
  return {
    id: `user-${Date.now()}`,
    name: 'مستخدم تكنوريكسا',
    phone: cleanId.match(/^\d+$/) ? cleanId : '',
    email: cleanId.includes('@') ? cleanId : '',
    role: 'customer',
    status: 'active',
    balance: 0,
    createdAt: new Date().toISOString(),
  };
};

const saveSession = async (token: string, user: User) => {
  try {
    await AsyncStorage.setItem('tr_token', token);
    await AsyncStorage.setItem('tr_user', JSON.stringify(user));
  } catch {}
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      isCheckingAuth: false,
      isAuthenticated: false,

      login: async (identifier, password) => {
        set({ isLoading: true });
        const cleanId = identifier.trim();
        try {
          const data = await fetchApi('/auth/login', {
            method: 'POST',
            data: { phone: cleanId, email: cleanId, password },
          });
          set({ isLoading: false });
          if (data?.requireOtp) {
            return {
              requireOtp: true,
              tempToken: data.tempToken,
              phone: data.phone || cleanId,
              message: data.message || 'تم إرسال رمز التحقق إلى هاتفك',
            };
          }
          if (data?.success && data?.token) {
            await saveSession(data.token, data.user);
            set({ user: data.user, token: data.token, isAuthenticated: true, isLoading: false });
            return { requireOtp: false, user: data.user, token: data.token };
          }
          throw new Error(data?.error || 'بيانات الدخول غير صحيحة');
        } catch (error: any) {
          set({ isLoading: false });
          throw error;
        }
      },

      verifyLoginOTP: async (tempToken, phone, otp) => {
        set({ isLoading: true });
        try {
          const data = await fetchApi('/auth/verify-login-otp', {
            method: 'POST',
            data: { tempToken, phone, otp },
          });
          if (data?.token && data?.user) {
            await saveSession(data.token, data.user);
            set({ user: data.user, token: data.token, isAuthenticated: true, isLoading: false });
            return;
          }
          throw new Error(data?.error || 'رمز التحقق غير صحيح');
        } catch (error: any) {
          set({ isLoading: false });
          throw error;
        }
      },

      loginWithOTP: async (phone, otp) => {
        set({ isLoading: true });
        try {
          const data = await fetchApi('/auth/verify-otp', { method: 'POST', data: { phone, otp } });
          if (data?.success && (data?.token || data?.user)) {
            if (data.token && data.user) {
              await saveSession(data.token, data.user);
              set({ user: data.user, token: data.token, isAuthenticated: true, isLoading: false });
            } else {
              set({ isLoading: false });
            }
            return;
          }
          throw new Error(data?.error || 'رمز التحقق غير صحيح');
        } catch (error: any) {
          set({ isLoading: false });
          throw error;
        }
      },

      resendOTP: async (tempToken, phone) => {
        try {
          const data = await fetchApi('/auth/resend-otp', {
            method: 'POST',
            data: { tempToken, phone },
          });
          return data;
        } catch (error: any) {
          throw error;
        }
      },

      forgotPassword: async (phone) => {
        set({ isLoading: true });
        try {
          const data = await fetchApi('/auth/forgot-password', {
            method: 'POST',
            data: { phone },
          });
          set({ isLoading: false });
          return data;
        } catch (error: any) {
          set({ isLoading: false });
          throw error;
        }
      },

      resetPassword: async (phone, otp, newPassword) => {
        set({ isLoading: true });
        try {
          const data = await fetchApi('/auth/reset-password', {
            method: 'POST',
            data: { phone, otp, newPassword },
          });
          set({ isLoading: false });
          return data;
        } catch (error: any) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (formData) => {
        set({ isLoading: true });
        try {
          const res = await fetchApi('/auth/register', { method: 'POST', data: formData });
          set({ isLoading: false });
          if (res?.requireOtp || res?.success) {
            return res;
          }
          throw new Error(res?.error || 'فشل تسجيل الحساب');
        } catch (error: any) {
          set({ isLoading: false });
          throw error;
        }
      },

      quickAccess: async (role) => {
        if (!__DEV__) {
          throw new Error('الدخول السريع غير متاح في بيئة الإنتاج');
        }
        set({ isLoading: true });
        try {
          const data = await fetchApi('/auth/quick-access', { method: 'POST', data: { role } });
          if (data?.success || data?.token) {
            await saveSession(data.token, data.user);
            set({ user: data.user, token: data.token, isAuthenticated: true, isLoading: false });
            return;
          }
        } catch {}
        set({ isLoading: false });
      },

      logout: async () => {
        try {
          await AsyncStorage.multiRemove(['tr_token', 'tr_user', 'auth-storage']);
          if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.removeItem('tr_token');
            window.localStorage.removeItem('tr_user');
            window.localStorage.removeItem('auth-storage');
          }
        } catch {}
        set({ user: null, token: null, isAuthenticated: false, isLoading: false });
      },

      checkAuth: async () => {
        try {
          const token = await AsyncStorage.getItem('tr_token');
          const userStr = await AsyncStorage.getItem('tr_user');
          if (token && userStr) {
            let user = JSON.parse(userStr);
            set({ user, token, isAuthenticated: true, isCheckingAuth: false, isLoading: false });
            // Silently refresh profile in background without blocking UI
            fetchApi('/auth/me').then(async (res) => {
              if (res?.user) {
                user = { ...user, ...res.user };
                await AsyncStorage.setItem('tr_user', JSON.stringify(user));
                set({ user });
              }
            }).catch(async (err) => {
              if (err?.response?.status === 401) {
                await AsyncStorage.multiRemove(['tr_token', 'tr_user']);
                set({ user: null, token: null, isAuthenticated: false });
              } else if (err?.response?.status === 403 && err?.response?.data?.isBanned) {
                user.status = 'banned';
                await AsyncStorage.setItem('tr_user', JSON.stringify(user));
                set({ user });
              }
            });
          } else {
            set({ isCheckingAuth: false, isLoading: false });
          }
        } catch {
          set({ isCheckingAuth: false, isLoading: false });
        }
      },

      updateUser: (user) => {
        set({ user });
        AsyncStorage.setItem('tr_user', JSON.stringify(user));
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

