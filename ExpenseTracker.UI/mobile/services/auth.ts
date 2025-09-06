import api from './api';
import {
  API_ENDPOINTS,
  ERROR_MESSAGES,
  isNetworkError,
  type ApiResponse,
} from '~/constants/api';

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

export interface RefreshTokenRequest {
  refresh_token: string;
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
      const response = await api.post<AuthResponse>(
        API_ENDPOINTS.AUTH_LOGIN,
        credentials
      );
      return response.data;
    } catch (error: any) {
      if (isNetworkError(error)) {
        throw new Error(ERROR_MESSAGES.NETWORK_ERROR);
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
        API_ENDPOINTS.AUTH_REGISTER,
        credentials
      );
      return response.data;
    } catch (error: any) {
      if (isNetworkError(error)) {
        throw new Error(ERROR_MESSAGES.NETWORK_ERROR);
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
        API_ENDPOINTS.AUTH_FORGOT_PASSWORD,
        request
      );
      return response.data;
    } catch (error: any) {
      if (isNetworkError(error)) {
        throw new Error(ERROR_MESSAGES.NETWORK_ERROR);
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

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>(
        API_ENDPOINTS.AUTH_REFRESH,
        {
          refresh_token: refreshToken,
        }
      );
      return response.data;
    } catch (error: any) {
      if (isNetworkError(error)) {
        throw new Error(ERROR_MESSAGES.NETWORK_ERROR);
      }

      const errorData = error.response?.data as AuthError;
      throw new Error(
        errorData?.error || error.message || 'Token refresh failed'
      );
    }
  },
};
