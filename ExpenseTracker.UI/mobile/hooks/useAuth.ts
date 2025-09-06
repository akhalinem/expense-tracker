import { useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '~/context/AuthContext';

/**
 * Custom hook for handling login functionality
 * Provides login state management and navigation
 */
export const useLogin = () => {
  const { login: authLogin, loading: authLoading } = useAuth();
  const router = useRouter();
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const login = useCallback(
    async (email: string, password: string) => {
      setError('');
      setIsSubmitting(true);

      try {
        const result = await authLogin(email, password);

        if (result.success) {
          // Navigate to main app, replace to prevent going back to auth screens
          router.replace('/(tabs)');
          return { success: true };
        } else {
          setError(result.error || 'Login failed');
          return { success: false, error: result.error };
        }
      } catch (err: any) {
        const errorMessage = err.message || 'An unexpected error occurred';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setIsSubmitting(false);
      }
    },
    [authLogin, router]
  );

  const clearError = useCallback(() => {
    setError('');
  }, []);

  return {
    login,
    error,
    isSubmitting,
    isLoading: authLoading || isSubmitting,
    clearError,
  };
};

/**
 * Custom hook for handling registration functionality
 * Provides registration state management and navigation
 */
export const useRegister = () => {
  const { register: authRegister, loading: authLoading } = useAuth();
  const router = useRouter();
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const register = useCallback(
    async (email: string, password: string) => {
      setError('');
      setSuccessMessage('');
      setIsSubmitting(true);

      try {
        const result = await authRegister(email, password);

        if (result.success) {
          if (result.requiresConfirmation) {
            setSuccessMessage(
              result.error ||
                'Please check your email to confirm your account before signing in.'
            );
            // Stay on registration screen to show confirmation message
            return { success: true, requiresConfirmation: true };
          } else {
            // User was logged in immediately, navigate to main app
            router.replace('/(tabs)');
            return { success: true, requiresConfirmation: false };
          }
        } else {
          setError(result.error || 'Registration failed');
          return { success: false, error: result.error };
        }
      } catch (err: any) {
        const errorMessage = err.message || 'An unexpected error occurred';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setIsSubmitting(false);
      }
    },
    [authRegister, router]
  );

  const clearMessages = useCallback(() => {
    setError('');
    setSuccessMessage('');
  }, []);

  return {
    register,
    error,
    successMessage,
    isSubmitting,
    isLoading: authLoading || isSubmitting,
    clearMessages,
  };
};

/**
 * Custom hook for handling password reset functionality
 * Provides forgot password state management
 */
export const useForgotPassword = () => {
  const { forgotPassword: authForgotPassword } = useAuth();
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const forgotPassword = useCallback(
    async (email: string) => {
      setError('');
      setSuccessMessage('');
      setIsSubmitting(true);

      try {
        const result = await authForgotPassword(email);

        if (result.success) {
          setSuccessMessage(
            result.message ||
              'If an account with this email exists, you will receive a password reset link shortly.'
          );
          return { success: true, message: result.message };
        } else {
          setError(result.error || 'Password reset failed');
          return { success: false, error: result.error };
        }
      } catch (err: any) {
        const errorMessage = err.message || 'An unexpected error occurred';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setIsSubmitting(false);
      }
    },
    [authForgotPassword]
  );

  const clearMessages = useCallback(() => {
    setError('');
    setSuccessMessage('');
  }, []);

  return {
    forgotPassword,
    error,
    successMessage,
    isSubmitting,
    clearMessages,
  };
};

/**
 * Custom hook for handling password reset completion
 * Provides reset password state management and navigation
 */
export const useResetPassword = () => {
  const router = useRouter();
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetPassword = useCallback(
    async (accessToken: string, refreshToken: string, newPassword: string) => {
      setError('');
      setSuccessMessage('');
      setIsSubmitting(true);

      try {
        const response = await fetch(
          `${process.env.EXPO_PUBLIC_API_URL}/auth/reset-password`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              access_token: accessToken,
              refresh_token: refreshToken,
              new_password: newPassword,
            }),
          }
        );

        const data = await response.json();

        if (response.ok) {
          setSuccessMessage(data.message || 'Password updated successfully!');

          // Navigate to login screen after successful reset
          setTimeout(() => {
            router.replace('/auth/login');
          }, 4000);

          return { success: true, message: data.message };
        } else {
          setError(data.error || 'Password reset failed');
          return { success: false, error: data.error };
        }
      } catch (err: any) {
        const errorMessage = err.message || 'An unexpected error occurred';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setIsSubmitting(false);
      }
    },
    [router]
  );

  const clearMessages = useCallback(() => {
    setError('');
    setSuccessMessage('');
  }, []);

  return {
    resetPassword,
    error,
    successMessage,
    isSubmitting,
    clearMessages,
  };
};
