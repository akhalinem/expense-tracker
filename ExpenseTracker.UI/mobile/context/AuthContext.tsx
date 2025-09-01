import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '~/services/auth';

export type AuthUser = {
  id: string;
  email: string;
  token: string;
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

  return (
    <AuthContext.Provider
      value={{ user, loading, login, logout, register, forgotPassword }}
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
