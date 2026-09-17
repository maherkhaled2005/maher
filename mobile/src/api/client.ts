// src/api/client.ts
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const LOCAL_PC_IPS = [
  '192.168.1.2',
  '192.168.1.3',
  '192.168.1.4',
  '192.168.1.5',
  '192.168.1.6',
  '192.168.1.7',
  '192.168.1.8',
  '192.168.1.9',
  '192.168.1.10',
];

export const CANDIDATE_BASE_URLS = [
  process.env.EXPO_PUBLIC_API_URL,
  ...LOCAL_PC_IPS.map((ip) => `http://${ip}:5000/api`),
  'http://10.0.2.2:5000/api',
  'http://localhost:5000/api',
  'https://api.tecnorexa.com/api',
].filter(Boolean) as string[];

let activeBaseURL = `http://192.168.1.2:5000/api`;

// Load saved custom or working API URL asynchronously
AsyncStorage.getItem('custom_api_url').then((saved) => {
  if (saved) activeBaseURL = saved;
});

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
  activeBaseURL = `http://192.168.1.2:5000/api`;
  api.defaults.baseURL = activeBaseURL;
};

export const SOCKET_URL = (() => {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.hostname) {
    return 'http://' + window.location.hostname + ':5000';
  }
  return process.env.EXPO_PUBLIC_SOCKET_URL || `http://192.168.1.2:5000`;
})();

export const api = axios.create({
  baseURL: activeBaseURL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 8000,
});

// Sync baseURL on every request
api.interceptors.request.use(
  async (config) => {
    const custom = await AsyncStorage.getItem('custom_api_url');
    if (custom && custom !== api.defaults.baseURL) {
      activeBaseURL = custom;
      api.defaults.baseURL = custom;
      config.baseURL = custom;
    } else {
      config.baseURL = activeBaseURL;
    }

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

// Interceptor: Auto-failover to alternative URLs on network errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    const isNetworkError =
      error.code === 'ECONNABORTED' ||
      error.code === 'ERR_NETWORK' ||
      error.message?.includes('Network Error') ||
      !error.response;

    if (isNetworkError && !config._candidateAttempted) {
      config._candidateAttempted = true;

      for (const candidate of CANDIDATE_BASE_URLS) {
        if (candidate === activeBaseURL) continue;
        try {
          // Quick probe to test candidate
          const probeRes = await axios.get(`${candidate}/health`, { timeout: 3000 });
          if (probeRes.data?.status === 'ok') {
            console.log(`⚡ [API FAILOVER] Switched active API URL to ${candidate}`);
            await setActiveBaseURL(candidate);
            config.baseURL = candidate;
            return api(config);
          }
        } catch {
          // Continue probing next candidate
        }
      }
    }

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
    const message = error.response?.data?.error || error.response?.data?.message || error.message || 'حدث خطأ في الاتصال بالسيرفر';
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



