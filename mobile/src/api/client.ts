// mobile/src/api/client.ts
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const CANDIDATE_BASE_URLS = [
  'http://10.128.200.45:5000/api',
  'https://api.tecnorexa.com/api',
  'http://192.168.1.2:5000/api',
  'http://10.0.2.2:5000/api',
  'http://localhost:5000/api',
];

let activeBaseURL = process.env.EXPO_PUBLIC_API_URL || 'http://10.128.200.45:5000/api';

AsyncStorage.getItem('custom_api_url').then((saved) => {
  if (saved) activeBaseURL = saved;
});

export const api = axios.create({
  baseURL: activeBaseURL,
  timeout: 8000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

export const apiClient = api;
export const getActiveBaseURL = () => activeBaseURL;

export const setActiveBaseURL = async (url: string) => {
  let cleanUrl = url.trim().replace(/\/+$/, '');
  if (!cleanUrl.endsWith('/api')) cleanUrl += '/api';
  activeBaseURL = cleanUrl;
  api.defaults.baseURL = cleanUrl;
  await AsyncStorage.setItem('custom_api_url', cleanUrl);
};

export const resetBaseURL = async () => {
  await AsyncStorage.removeItem('custom_api_url');
  activeBaseURL = CANDIDATE_BASE_URLS[0];
  api.defaults.baseURL = activeBaseURL;
};

export const SOCKET_URL =
  process.env.EXPO_PUBLIC_SOCKET_URL ||
  activeBaseURL.replace(/\/api$/, '');

// Authentication
api.interceptors.request.use(
  async (config) => {
    config.baseURL = activeBaseURL;
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

// Response handling & Auto-Failover to working server
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    const status = error?.response?.status;

    if (status === 401) {
      await AsyncStorage.multiRemove(['tr_token', 'tr_user']);
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

    const isNetworkError =
      error.code === 'ECONNABORTED' ||
      error.code === 'ERR_NETWORK' ||
      error.message?.includes('Network Error') ||
      !error.response;

    if (isNetworkError && config && !config._candidateAttempted) {
      config._candidateAttempted = true;

      for (const candidate of CANDIDATE_BASE_URLS) {
        if (candidate === activeBaseURL) continue;
        try {
          const probeRes = await axios.get(`${candidate}/health`, { timeout: 3000 });
          if (probeRes.data?.status === 'ok') {
            await setActiveBaseURL(candidate);
            config.baseURL = candidate;
            return api(config);
          }
        } catch {}
      }
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
      (error?.response ? `HTTP ${error.response.status}` : 'تعذر الاتصال بالخادم، يرجى التأكد من تشغيل السيرفر');
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
