// mobile/src/api/client.ts
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export const CANDIDATE_BASE_URLS = [
  'https://neighbors-pure-governor-commissioner.trycloudflare.com/api',
  'http://192.168.1.17:5000/api',
  'http://localhost:5000/api',
  'http://10.0.2.2:5000/api',
  'https://api.tecnorexa.com/api',
];

const getInitialBaseURL = () => {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}/api`;
  }
  return (
    process.env.EXPO_PUBLIC_API_URL ||
    'https://neighbors-pure-governor-commissioner.trycloudflare.com/api'
  );
};

let activeBaseURL = getInitialBaseURL();

AsyncStorage.getItem('custom_api_url').then((saved) => {
  if (saved && Platform.OS !== 'web') activeBaseURL = saved;
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

const GITHUB_API_URL_ENDPOINT =
  'https://raw.githubusercontent.com/maherkhaled2005/maher/main/api_url.txt';

export const findFastestServer = async (): Promise<string | null> => {
  const urlsToProbe = new Set<string>();

  for (const u of CANDIDATE_BASE_URLS) {
    urlsToProbe.add(u);
  }

  try {
    const ghRes = await axios.get(`${GITHUB_API_URL_ENDPOINT}?t=${Date.now()}`, {
      timeout: 3500,
    });
    if (ghRes.data && typeof ghRes.data === 'string') {
      let remoteUrl = ghRes.data.trim().replace(/\/+$/, '');
      if (remoteUrl.startsWith('http')) {
        if (!remoteUrl.endsWith('/api')) remoteUrl += '/api';
        urlsToProbe.add(remoteUrl);
      }
    }
  } catch {}

  const probePromises = Array.from(urlsToProbe).map(async (url) => {
    try {
      const res = await axios.get(`${url}/health`, { timeout: 3500 });
      if (res.data?.status === 'ok') {
        return url;
      }
    } catch {}
    throw new Error('Unreachable: ' + url);
  });

  try {
    const fastest = await Promise.any(probePromises);
    if (fastest) {
      await setActiveBaseURL(fastest);
      return fastest;
    }
  } catch {}

  return null;
};

// Background probe on native app startup
if (Platform.OS !== 'web') {
  setTimeout(() => {
    findFastestServer().catch(() => {});
  }, 100);
}

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
      const workingServer = await findFastestServer();
      if (workingServer) {
        config.baseURL = workingServer;
        return api(config);
      }
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
  if (status === 401) {
    return 'انتهت الجلسة، يرجى تسجيل الدخول مجدداً للمتابعة';
  }
  if (status === 403) {
    return 'غير مصرح بهذا الإجراء أو ليس لديك الصلاحية';
  }
  if (status === 404) {
    return 'البيانات المطلوبة غير متوفرة حالياً';
  }
  if (status === 429) {
    return 'يرجى الانتظار قليلاً قبل إعادة المحاولة';
  }
  if (status && status >= 500) {
    return 'حدث خطأ في معالجة طلبك، يرجى المحاولة مرة أخرى لاحقاً';
  }

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
