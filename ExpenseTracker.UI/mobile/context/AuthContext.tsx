import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '~/services/auth';
import { TOKEN_CONFIG } from '~/constants/api';

export type AuthUser = {
  id: string;
  email: string;
  token: string;
  refreshToken?: string;
  expiresAt?: number;
};

export type AuthState = {
  user: AuthUser | null;
  loading: boolean;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  register: (
    email: string,
    password: string
  ) => Promise<{
    success: boolean;
    error?: string;
    requiresConfirmation?: boolean;
  }>;
  forgotPassword: (
    email: string
  ) => Promise<{ success: boolean; error?: string; message?: string }>;
  refreshToken: () => Promise<boolean>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const storedUser = await AsyncStorage.getItem('authUser');
      if (storedUser) setUser(JSON.parse(storedUser));
      setLoading(false);
    };
    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await authService.login({ email, password });

      if (!response.session?.access_token) {
        return {
          success: false,
          error: 'Invalid response from server - no access token received',
        };
      }

      const authUser = {
        id: response.user.id,
        email: response.user.email,
        token: response.session.access_token,
        refreshToken: response.session.refresh_token,
        expiresAt: response.session.expires_at * 1000, // Convert to milliseconds
      };
      setUser(authUser);
      await AsyncStorage.setItem('authUser', JSON.stringify(authUser));
      return { success: true };
    } catch (error: any) {
      console.error('Login failed:', error);
      return {
        success: false,
        error: error.message || 'Login failed',
      };
    }
  };

  const logout = async () => {
    // Clear local auth state - no backend logout needed
    setUser(null);
    await AsyncStorage.removeItem('authUser');
  };

  const forgotPassword = async (email: string) => {
    try {
      const response = await authService.forgotPassword({ email });
      return {
        success: true,
        message: response.message,
      };
    } catch (error: any) {
      console.error('Forgot password failed:', error);
      return {
        success: false,
        error: error.message || 'Password reset failed',
      };
    }
  };

  const register = async (email: string, password: string) => {
    try {
      const response = await authService.register({ email, password });

      // Check if email confirmation is required (no session returned)
      if (!response.session) {
        return {
          success: true,
          requiresConfirmation: true,
          error:
            'Please check your email to confirm your account before signing in.',
        };
      }

      // If session is provided, user is immediately logged in
      const authUser = {
        id: response.user.id,
        email: response.user.email,
        token: response.session.access_token,
        refreshToken: response.session.refresh_token,
        expiresAt: response.session.expires_at * 1000, // Convert to milliseconds
      };
      setUser(authUser);
      await AsyncStorage.setItem('authUser', JSON.stringify(authUser));
      return { success: true };
    } catch (error: any) {
      console.error('Registration failed:', error);
      return {
        success: false,
        error: error.message || 'Registration failed',
      };
    }
  };

  const refreshToken = async (): Promise<boolean> => {
    try {
      if (!user?.refreshToken) {
        console.warn('No refresh token available');
        return false;
      }

      console.log('🔄 [AUTH_CONTEXT] Refreshing token...');
      const response = await authService.refreshToken(user.refreshToken);

      if (!response.session?.access_token) {
        console.error(
          '❌ [AUTH_CONTEXT] Invalid refresh response - no access token'
        );
        return false;
      }

      const updatedUser = {
        ...user,
        token: response.session.access_token,
        refreshToken: response.session.refresh_token,
        expiresAt: response.session.expires_at * 1000, // Convert to milliseconds
      };

      setUser(updatedUser);
      await AsyncStorage.setItem('authUser', JSON.stringify(updatedUser));

      console.log('✅ [AUTH_CONTEXT] Token refreshed successfully');
      return true;
    } catch (error: any) {
      console.error('❌ [AUTH_CONTEXT] Token refresh failed:', error);
      // If refresh fails, user needs to log in again
      await logout();
      return false;
    }
  };

  // Check if token is expired or will expire soon (within configured buffer)
  const isTokenExpired = (user: AuthUser | null): boolean => {
    if (!user?.expiresAt) return true;
    const now = Date.now();
    const bufferMs = TOKEN_CONFIG.REFRESH_BUFFER_MINUTES * 60 * 1000;
    return user.expiresAt <= now + bufferMs;
  };

  // Auto-refresh token if expired
  React.useEffect(() => {
    if (user && isTokenExpired(user)) {
      console.log('🔄 [AUTH_CONTEXT] Token expired, attempting refresh...');
      refreshToken();
    }
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        register,
        forgotPassword,
        refreshToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
