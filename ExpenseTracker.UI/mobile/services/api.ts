import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  API_CONFIG,
  API_ENDPOINTS,
  ERROR_MESSAGES,
  HTTP_STATUS,
  isNetworkError,
  isAuthError,
} from '~/constants/api';

const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Track whether we're currently refreshing the token to avoid duplicate requests
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });

  failedQueue = [];
};

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const authData = await AsyncStorage.getItem('authUser');
      if (authData) {
        const user = JSON.parse(authData);
        if (user.token) {
          config.headers.Authorization = `Bearer ${user.token}`;
        }
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (isAuthError(error) && !originalRequest._retry) {
      if (isRefreshing) {
        // If we're already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const authData = await AsyncStorage.getItem('authUser');
        if (authData) {
          const user = JSON.parse(authData);
          if (user.refreshToken) {
            console.log('🔄 [API] Attempting token refresh...');

            // Make refresh request directly to avoid interceptor loop
            const refreshResponse = await axios.post(
              `${API_CONFIG.BASE_URL}${API_ENDPOINTS.AUTH_REFRESH}`,
              {
                refreshToken: user.refreshToken,
              }
            );

            if (refreshResponse.data?.session?.access_token) {
              const updatedUser = {
                ...user,
                token: refreshResponse.data.session.access_token,
                refreshToken: refreshResponse.data.session.refresh_token,
                expiresAt: refreshResponse.data.session.expires_at * 1000,
              };

              await AsyncStorage.setItem(
                'authUser',
                JSON.stringify(updatedUser)
              );

              // Update authorization header for original request
              originalRequest.headers.Authorization = `Bearer ${updatedUser.token}`;

              processQueue(null, updatedUser.token);
              console.log('✅ [API] Token refreshed successfully');

              return api(originalRequest);
            }
          }
        }

        // If refresh failed or no refresh token, clear auth data
        console.warn('⚠️ [API] Token refresh failed, clearing auth data');
        await AsyncStorage.removeItem('authUser');
        processQueue(error, null);
      } catch (refreshError) {
        console.error('❌ [API] Token refresh error:', refreshError);
        await AsyncStorage.removeItem('authUser');
        processQueue(refreshError, null);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
