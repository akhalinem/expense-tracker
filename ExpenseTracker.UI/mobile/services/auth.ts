import { api } from './api';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  message: string;
}

export interface AuthResponse {
  message: string;
  user: {
    id: string;
    email: string;
    confirmation_sent_at?: string;
  };
  session?: {
    access_token: string;
    refresh_token: string;
    expires_at: number;
    token_type: string;
  };
  confirmation_sent_at?: string;
}

export interface AuthError {
  error: string;
  code?: string;
  details?: {
    email?: string | null;
    password?: string | null;
  };
}

export const authService = {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>('/auth/login', credentials);
      return response.data;
    } catch (error: any) {
      if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
        throw new Error(
          'Cannot connect to server. Please check your network connection.'
        );
      }

      const errorData = error.response?.data as AuthError;
      if (errorData?.details) {
        const fieldErrors = [];
        if (errorData.details.email) fieldErrors.push(errorData.details.email);
        if (errorData.details.password)
          fieldErrors.push(errorData.details.password);
        if (fieldErrors.length > 0) {
          throw new Error(fieldErrors.join('. '));
        }
      }

      throw new Error(errorData?.error || error.message || 'Login failed');
    }
  },

  async register(credentials: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>(
        '/auth/register',
        credentials
      );
      return response.data;
    } catch (error: any) {
      if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
        throw new Error(
          'Cannot connect to server. Please check your network connection.'
        );
      }

      const errorData = error.response?.data as AuthError;
      if (errorData?.details) {
        const fieldErrors = [];
        if (errorData.details.email) fieldErrors.push(errorData.details.email);
        if (errorData.details.password)
          fieldErrors.push(errorData.details.password);
        if (fieldErrors.length > 0) {
          throw new Error(fieldErrors.join('. '));
        }
      }

      throw new Error(
        errorData?.error || error.message || 'Registration failed'
      );
    }
  },

  async forgotPassword(
    request: ForgotPasswordRequest
  ): Promise<ForgotPasswordResponse> {
    try {
      const response = await api.post<ForgotPasswordResponse>(
        '/auth/forgot-password',
        request
      );
      return response.data;
    } catch (error: any) {
      if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
        throw new Error(
          'Cannot connect to server. Please check your network connection.'
        );
      }

      const errorData = error.response?.data as AuthError;
      if (errorData?.details?.email) {
        throw new Error(errorData.details.email);
      }

      throw new Error(
        errorData?.error || error.message || 'Password reset failed'
      );
    }
  },
};
