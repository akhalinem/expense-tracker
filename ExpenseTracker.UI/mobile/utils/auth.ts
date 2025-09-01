import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import * as Linking from 'expo-linking';

/**
 * Authentication utility functions for common operations
 */

export interface AuthUser {
  id: string;
  email: string;
  token: string;
}

export interface ResetPasswordParams {
  access_token?: string;
  refresh_token?: string;
  type?: string;
  error?: string;
  error_description?: string;
  validated?: string;
  user_id?: string;
  email?: string;
}

/**
 * Storage keys for authentication data
 */
const STORAGE_KEYS = {
  AUTH_USER: 'authUser',
  LAST_EMAIL: 'lastEmail',
  AUTH_PREFERENCES: 'authPreferences',
} as const;

/**
 * Session Management Utilities
 */
export const sessionUtils = {
  /**
   * Store user session in AsyncStorage
   */
  async storeSession(user: AuthUser): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(user));
    } catch (error) {
      console.error('Failed to store session:', error);
      throw new Error('Failed to save session');
    }
  },

  /**
   * Retrieve user session from AsyncStorage
   */
  async getSession(): Promise<AuthUser | null> {
    try {
      const storedUser = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_USER);
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (error) {
      console.error('Failed to get session:', error);
      return null;
    }
  },

  /**
   * Clear user session from AsyncStorage
   */
  async clearSession(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_USER);
    } catch (error) {
      console.error('Failed to clear session:', error);
    }
  },

  /**
   * Check if user session is valid (basic check)
   */
  async isSessionValid(): Promise<boolean> {
    const user = await this.getSession();
    return !!(user?.token && user?.id && user?.email);
  },

  /**
   * Store last used email for UX convenience
   */
  async storeLastEmail(email: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_EMAIL, email);
    } catch (error) {
      console.error('Failed to store last email:', error);
    }
  },

  /**
   * Get last used email
   */
  async getLastEmail(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.LAST_EMAIL);
    } catch (error) {
      console.error('Failed to get last email:', error);
      return null;
    }
  },
};

/**
 * Navigation Utilities
 */
export const navigationUtils = {
  /**
   * Navigate to authenticated area (main app)
   */
  navigateToApp(): void {
    router.replace('/(tabs)');
  },

  /**
   * Navigate to login screen
   */
  navigateToSignIn(): void {
    router.replace('/auth/login');
  },

  /**
   * Navigate to register screen
   */
  navigateToRegister(): void {
    router.replace('/auth/register');
  },

  /**
   * Navigate to forgot password screen
   */
  navigateToForgotPassword(): void {
    router.replace('/auth/forgot-password');
  },

  /**
   * Navigate back with fallback
   */
  navigateBack(fallbackRoute: string = '/auth/login'): void {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(fallbackRoute);
    }
  },

  /**
   * Reset navigation stack and go to specific route
   */
  resetToRoute(route: string): void {
    router.replace(route);
  },
};

/**
 * Deep Link Utilities
 */
export const deepLinkUtils = {
  /**
   * Parse reset password parameters from URL
   */
  parseResetPasswordParams(url: string): ResetPasswordParams {
    try {
      const parsed = Linking.parse(url);
      const params = parsed.queryParams as ResetPasswordParams;

      return {
        access_token: params.access_token,
        refresh_token: params.refresh_token,
        type: params.type,
        error: params.error,
        error_description: params.error_description,
        validated: params.validated,
        user_id: params.user_id,
        email: params.email,
      };
    } catch (error) {
      console.error('Failed to parse reset password params:', error);
      return {};
    }
  },

  /**
   * Validate reset password parameters
   */
  validateResetPasswordParams(params: ResetPasswordParams): boolean {
    return !!(
      params.access_token &&
      params.refresh_token &&
      params.type === 'recovery' &&
      !params.error
    );
  },

  /**
   * Get error message from reset password params
   */
  getResetPasswordError(params: ResetPasswordParams): string | null {
    if (params.error) {
      switch (params.error) {
        case 'invalid_request':
          return 'Invalid reset link. Please request a new password reset.';
        case 'session_invalid':
          return 'Reset link has expired. Please request a new password reset.';
        case 'processing_error':
          return 'Error processing reset link. Please try again.';
        case 'server_error':
          return 'Server error occurred. Please try again later.';
        case 'missing_parameters':
          return 'Invalid reset link format. Please request a new password reset.';
        default:
          return (
            params.error_description ||
            'An error occurred during password reset.'
          );
      }
    }
    return null;
  },
};

/**
 * Token Utilities
 */
export const tokenUtils = {
  /**
   * Decode JWT token (basic decode without verification)
   */
  decodeToken(token: string): any {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid token format');
      }

      const payload = parts[1];
      const decoded = atob(payload);
      return JSON.parse(decoded);
    } catch (error) {
      console.error('Failed to decode token:', error);
      return null;
    }
  },

  /**
   * Check if token is expired
   */
  isTokenExpired(token: string): boolean {
    try {
      const decoded = this.decodeToken(token);
      if (!decoded || !decoded.exp) {
        return true;
      }

      const currentTime = Math.floor(Date.now() / 1000);
      return decoded.exp < currentTime;
    } catch (error) {
      console.error('Failed to check token expiration:', error);
      return true;
    }
  },

  /**
   * Get token expiration time
   */
  getTokenExpiration(token: string): Date | null {
    try {
      const decoded = this.decodeToken(token);
      if (!decoded || !decoded.exp) {
        return null;
      }

      return new Date(decoded.exp * 1000);
    } catch (error) {
      console.error('Failed to get token expiration:', error);
      return null;
    }
  },
};

/**
 * Error Handling Utilities
 */
export const errorUtils = {
  /**
   * Format API error for user display
   */
  formatApiError(error: any): string {
    if (typeof error === 'string') {
      return error;
    }

    if (error?.response?.data?.error) {
      return error.response.data.error;
    }

    if (error?.message) {
      return error.message;
    }

    return 'An unexpected error occurred. Please try again.';
  },

  /**
   * Check if error is network related
   */
  isNetworkError(error: any): boolean {
    return (
      error?.code === 'NETWORK_ERROR' ||
      error?.message === 'Network Error' ||
      error?.code === 'ECONNABORTED' ||
      !navigator.onLine
    );
  },

  /**
   * Get user-friendly error message
   */
  getUserFriendlyError(error: any): string {
    if (this.isNetworkError(error)) {
      return 'Network connection issue. Please check your internet connection and try again.';
    }

    const formattedError = this.formatApiError(error);

    // Handle common authentication errors
    if (formattedError.includes('Invalid login credentials')) {
      return 'Invalid email or password. Please check your credentials and try again.';
    }

    if (formattedError.includes('User already registered')) {
      return 'An account with this email already exists. Please try signing in instead.';
    }

    if (formattedError.includes('Email not confirmed')) {
      return 'Please check your email and click the confirmation link before signing in.';
    }

    if (formattedError.includes('Too many requests')) {
      return 'Too many attempts. Please wait a few minutes before trying again.';
    }

    return formattedError;
  },
};

/**
 * Validation Utilities
 */
export const validationUtils = {
  /**
   * Check if email format is valid
   */
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  },

  /**
   * Check if password meets requirements
   */
  isValidPassword(password: string): boolean {
    const trimmed = password.trim();
    return (
      trimmed.length >= 6 &&
      trimmed.length <= 128 &&
      /(?=.*[a-zA-Z])/.test(trimmed)
    );
  },

  /**
   * Get password strength indicator
   */
  getPasswordStrength(password: string): {
    score: number;
    feedback: string[];
  } {
    const feedback: string[] = [];
    let score = 0;

    if (password.length >= 6) score += 1;
    else feedback.push('At least 6 characters');

    if (/[a-z]/.test(password)) score += 1;
    else feedback.push('Include lowercase letters');

    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push('Include uppercase letters');

    if (/[0-9]/.test(password)) score += 1;
    else feedback.push('Include numbers');

    if (/[^a-zA-Z0-9]/.test(password)) score += 1;
    else feedback.push('Include special characters');

    return { score, feedback };
  },
};

/**
 * Debug Utilities (for development)
 */
export const debugUtils = {
  /**
   * Log authentication events in development
   */
  logAuthEvent(event: string, data?: any): void {
    if (__DEV__) {
      console.log(`[AUTH] ${event}`, data);
    }
  },

  /**
   * Clear all authentication data (for testing)
   */
  async clearAllAuthData(): Promise<void> {
    if (__DEV__) {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.AUTH_USER,
        STORAGE_KEYS.LAST_EMAIL,
        STORAGE_KEYS.AUTH_PREFERENCES,
      ]);
      console.log('[AUTH] All auth data cleared');
    }
  },

  /**
   * Get all stored authentication data (for debugging)
   */
  async getAllAuthData(): Promise<Record<string, any>> {
    if (__DEV__) {
      const keys = Object.values(STORAGE_KEYS);
      const data = await AsyncStorage.multiGet(keys);
      const result: Record<string, any> = {};

      data.forEach(([key, value]) => {
        try {
          result[key] = value ? JSON.parse(value) : null;
        } catch {
          result[key] = value;
        }
      });

      return result;
    }
    return {};
  },
};
