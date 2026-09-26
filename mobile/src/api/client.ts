// mobile/src/api/client.ts
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const getBaseURL = (): string => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.origin && !window.location.origin.includes('localhost') && !window.location.origin.includes('127.0.0.1')) {
    return `${window.location.origin}/api`;
  }
  return 'https://technorexa.com/api';
};

export const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 10000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

export const apiClient = api;
export const getActiveBaseURL = (): string => api.defaults.baseURL as string || '';

export const SOCKET_URL =
  process.env.EXPO_PUBLIC_SOCKET_URL ||
  getBaseURL().replace(/\/api$/, '');

export const getActiveSocketURL = (): string =>
  process.env.EXPO_PUBLIC_SOCKET_URL || getBaseURL().replace(/\/api$/, '');

// Authentication interceptor
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
        (config as any)._sessionToken = token;
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

// Response interceptor — auth errors only
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    const status = error?.response?.status;

    if (status === 401 && (config as any)?._sessionToken) {
      const currentToken = await AsyncStorage.getItem('tr_token');
      if (currentToken === (config as any)._sessionToken) {
        await AsyncStorage.multiRemove(['tr_token', 'tr_user']);
      }
    }

    if (status === 403) {
      const message =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        'غير مصرح بهذا الإجراء';
      const normalizedError = new Error(message);
      (normalizedError as any).response = error.response;
      return Promise.reject(normalizedError);
    }

    return Promise.reject(error);
  },
);

function sanitizeErrorMessage(error: any): string {
  if (!error) return 'تعذر إتمام الطلب، يرجى المحاولة مرة أخرى';

  const serverMsg = error?.response?.data?.error || error?.response?.data?.message;
  if (serverMsg && typeof serverMsg === 'string') {
    const raw = serverMsg.trim();
    const isTechRaw =
      raw.toLowerCase().includes('sql') ||
      raw.toLowerCase().includes('jwt') ||
      raw.toLowerCase().includes('syntaxerror') ||
      raw.toLowerCase().includes('unauthorized') ||
      raw.toLowerCase().includes('internal server') ||
      raw.startsWith('<!doctype') ||
      raw.startsWith('<html');

    if (!isTechRaw) {
      return raw;
    }
  }

  const status = error?.response?.status;
  if (status === 401) return 'انتهت الجلسة، يرجى تسجيل الدخول مجدداً للمتابعة';
  if (status === 403) return 'غير مصرح بهذا الإجراء أو ليس لديك الصلاحية';
  if (status === 404) return 'البيانات المطلوبة غير متوفرة حالياً';
  if (status === 429) return 'يرجى الانتظار قليلاً قبل إعادة المحاولة';
  if (status && status >= 500) return 'حدث خطأ في معالجة طلبك، يرجى المحاولة مرة أخرى لاحقاً';

  return 'تعذر الاتصال حالياً، يرجى التأكد من اتصال الإنترنت والمحاولة لاحقاً';
}

export const fetchApi = async (endpoint: string, options?: any) => {
  try {
    const response = await api({
      url: endpoint,
      ...options,
    });
    return response.data;
  } catch (error: any) {
    const message = sanitizeErrorMessage(error);
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
