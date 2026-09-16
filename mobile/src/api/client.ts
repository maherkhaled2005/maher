// src/api/client.ts
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const getBaseURL = () => {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.hostname) {
    return 'http://' + window.location.hostname + ':5000/api';
  }
  return process.env.EXPO_PUBLIC_API_URL || 'https://api.tecnorexa.com/api';
};

export const SOCKET_URL = (() => {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.hostname) {
    return 'http://' + window.location.hostname + ':5000';
  }
  return process.env.EXPO_PUBLIC_SOCKET_URL || 'https://api.tecnorexa.com';
})();

export const api = axios.create({
  baseURL: getBaseURL(),
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// Interceptor: إضافة الـ Token (يقرأ من tr_token أو auth-storage)
api.interceptors.request.use(
  async (config) => {
    let token = await AsyncStorage.getItem('tr_token');
    if (!token) {
      try {
        const authData = await AsyncStorage.getItem('auth-storage');
        if (authData) {
          const parsed = JSON.parse(authData);
          token = parsed?.state?.token || null;
        }
      } catch {}
    }
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor: معالجة 401 و 403 (الحظر)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.multiRemove(['tr_token', 'tr_user']);
    } else if (error.response?.status === 403 && error.response?.data?.isBanned) {
      try {
        const userStr = await AsyncStorage.getItem('tr_user');
        if (userStr) {
          const u = JSON.parse(userStr);
          u.status = 'banned';
          await AsyncStorage.setItem('tr_user', JSON.stringify(u));
        }
      } catch {}
    }
    return Promise.reject(error);
  }
);

export const fetchApi = async (endpoint: string, options?: any) => {
  try {
    const response = await api({ url: endpoint, ...options });
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.error || error.response?.data?.message || error.message || 'حدث خطأ في الاتصال';
    const err = new Error(message);
    (err as any).response = error.response;
    throw err;
  }
};

export const uploadFile = async (endpoint: string, file: any) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post(endpoint, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export default api;
