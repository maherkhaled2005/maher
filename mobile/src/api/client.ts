// mobile/src/api/client.ts
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PRODUCTION_API_URL = (
  process.env.EXPO_PUBLIC_API_URL || 'https://api.tecnorexa.com/api'
).replace(/\/+$/, '');

export const CANDIDATE_BASE_URLS = [PRODUCTION_API_URL];

export const api = axios.create({
  baseURL: PRODUCTION_API_URL,
  timeout: 15000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

export const apiClient = api;
export const getActiveBaseURL = () => PRODUCTION_API_URL;

// لا تسمح للمستخدم العادي بتغيير عنوان السيرفر
export const setActiveBaseURL = async (_url: string) => {
  if (__DEV__) {
    console.warn('[API] setActiveBaseURL is disabled in production.');
  }
};

export const resetBaseURL = async () => {
  // حذف أي إعدادات قديمة من النسخ السابقة
  await AsyncStorage.removeItem('custom_api_url');
};

export const SOCKET_URL =
  process.env.EXPO_PUBLIC_SOCKET_URL || 'https://api.tecnorexa.com';

// Authentication
api.interceptors.request.use(
  async (config) => {
    try {
      let token = await AsyncStorage.getItem('tr_token');
      if (!token) {
        const authData = await AsyncStorage.getItem('auth-storage');
        if (authData) {
          const parsed = JSON.parse(authData);
          token = parsed?.state?.token || null;
        }
      }
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      if (__DEV__) {
        console.warn('[API] Failed to load auth token', error);
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      await AsyncStorage.multiRemove(['tr_token', 'tr_user']);
    }

    // 403 ليس Network Error
    // لا تحاول تبديل السيرفر عند 403
    if (status === 403) {
      const message =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        'غير مصرح بهذا الإجراء';
      const normalizedError = new Error(message);
      (normalizedError as any).response = error.response;
      return Promise.reject(normalizedError);
    }

    if (__DEV__) {
      console.error('[API ERROR]', {
        url: error?.config?.url,
        method: error?.config?.method,
        status,
        message: error?.message,
        response: error?.response?.data,
      });
    }

    return Promise.reject(error);
  },
);

export const fetchApi = async (endpoint: string, options?: any) => {
  try {
    const response = await api({
      url: endpoint,
      ...options,
    });
    return response.data;
  } catch (error: any) {
    const message =
      error?.response?.data?.error ||
      error?.response?.data?.message ||
      (error?.response ? `HTTP ${error.response.status}` : 'تعذر الاتصال بالخادم');
    const err = new Error(message);
    (err as any).response = error.response;
    throw err;
  }
};

export const uploadFile = async (endpoint: string, file: any) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post(endpoint, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    timeout: 60000,
  });
  return response.data;
};

export default api;
