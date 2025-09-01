import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const baseURL = process.env.EXPO_PUBLIC_API_URL;

export const api = axios.create({
  baseURL,
  timeout: 15_000, // Increased timeout to 15 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const authUser = await AsyncStorage.getItem('authUser');
      if (authUser) {
        const user = JSON.parse(authUser);
        if (user.token) {
          config.headers.Authorization = `Bearer ${user.token}`;
        }
      }
    } catch (error) {
      console.warn('Failed to get auth token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    if (error.code === 'ECONNABORTED') {
      // Handle timeout specifically
      error.message =
        'Request timeout. Please check your connection and try again.';
      error.code = 'NETWORK_ERROR';
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      // Handle connection issues
      error.message =
        'Cannot connect to server. Please check if the server is running.';
      error.code = 'NETWORK_ERROR';
    } else if (error.response?.status === 401) {
      // Token expired or invalid - clear auth data
      await AsyncStorage.removeItem('authUser');
    }

    return Promise.reject(error);
  }
);
