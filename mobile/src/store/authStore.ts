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
  createdAt: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  loginWithOTP: (phone: string, otp: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  quickAccess: (role: string) => Promise<void>;
  updateUser: (user: User) => void;
}

// حفظ الجلسة في كلا المفتاحين
const saveSession = async (token: string, user: User) => {
  await AsyncStorage.setItem('tr_token', token);
  await AsyncStorage.setItem('tr_user', JSON.stringify(user));
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,

      login: async (identifier, password) => {
        set({ isLoading: true });
        try {
          const cleanId = identifier.trim();
          const data = await fetchApi('/auth/login', {
            method: 'POST',
            data: { phone: cleanId, email: cleanId, password },
          });
          if (data.success || data.token) {
            await saveSession(data.token, data.user);
            set({ user: data.user, token: data.token, isAuthenticated: true, isLoading: false });
          } else throw new Error(data.error || 'خطأ في تسجيل الدخول');
        } catch (error: any) {
          set({ isLoading: false });
          throw error;
        }
      },

      loginWithOTP: async (phone, otp) => {
        set({ isLoading: true });
        try {
          const data = await fetchApi('/auth/verify-otp', { method: 'POST', data: { phone, otp } });
          if (data.success || data.token) {
            await saveSession(data.token, data.user);
            set({ user: data.user, token: data.token, isAuthenticated: true, isLoading: false });
          } else throw new Error(data.error);
        } catch (error: any) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (formData) => {
        set({ isLoading: true });
        try {
          const res = await fetchApi('/auth/register', { method: 'POST', data: formData });
          if (res.success || res.token) {
            await saveSession(res.token, res.user);
            set({ user: res.user, token: res.token, isAuthenticated: true, isLoading: false });
          } else {
            throw new Error(res.error || 'فشل التسجيل');
          }
        } catch (error: any) {
          set({ isLoading: false });
          throw error;
        }
      },

      quickAccess: async (role) => {
        set({ isLoading: true });
        try {
          const data = await fetchApi('/auth/quick-access', { method: 'POST', data: { role } });
          if (data.success || data.token) {
            await saveSession(data.token, data.user);
            set({ user: data.user, token: data.token, isAuthenticated: true, isLoading: false });
          } else throw new Error(data.error);
        } catch (error: any) {
          set({ isLoading: false });
          throw error;
        }
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
        set({ isLoading: true });
        try {
          const token = await AsyncStorage.getItem('tr_token');
          const userStr = await AsyncStorage.getItem('tr_user');
          if (token && userStr) {
            let user = JSON.parse(userStr);
            try {
              const res = await fetchApi('/auth/me');
              if (res?.user) {
                user = { ...user, ...res.user };
                await AsyncStorage.setItem('tr_user', JSON.stringify(user));
              }
            } catch (err: any) {
              if (err?.response?.status === 403 && err?.response?.data?.isBanned) {
                user.status = 'banned';
                await AsyncStorage.setItem('tr_user', JSON.stringify(user));
              }
            }
            set({ user, token, isAuthenticated: true, isLoading: false });
          } else {
            set({ isLoading: false });
          }
        } catch {
          set({ isLoading: false });
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
