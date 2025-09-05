/**
 * API Constants and Types for Expense Tracker Mobile App
 * Centralized location for all API-related constants, endpoints, and shared types
 */

// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000',
  TIMEOUT: 15000, // 15 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 2000, // 2 seconds
} as const;

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  AUTH_LOGIN: '/auth/login',
  AUTH_REGISTER: '/auth/register',
  AUTH_FORGOT_PASSWORD: '/auth/forgot-password',
  AUTH_REFRESH: '/auth/refresh',

  // Sync Operations
  SYNC_UPLOAD: '/api/sync/upload',
  SYNC_DOWNLOAD: '/api/sync/download',
  SYNC_FULL: '/api/sync/full',
  SYNC_STATUS: '/api/sync/status',

  // Background Jobs
  JOBS_CREATE: '/api/jobs/sync',
  JOBS_STATUS: (jobId: string) => `/api/jobs/${jobId}`,
  JOBS_HISTORY: '/api/jobs',
} as const;

// Common Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR:
    'Cannot connect to server. Please check your network connection.',
  AUTH_REQUIRED: 'Authentication required. Please sign in again.',
  SERVER_ERROR: 'Server error. Please try again later.',
  TIMEOUT_ERROR: 'Request timeout. Please check your connection and try again.',
  TOKEN_EXPIRED: 'Your session has expired. Please sign in again.',
  SYNC_FAILED: 'Sync operation failed. Please try again.',
  UNKNOWN_ERROR: 'An unexpected error occurred.',
} as const;

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// Sync Job Types
export const SYNC_JOB_TYPES = {
  UPLOAD: 'upload',
  DOWNLOAD: 'download',
  FULL_SYNC: 'full_sync',
} as const;

// Sync Job Status
export const SYNC_JOB_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;

// Token Configuration
export const TOKEN_CONFIG = {
  REFRESH_BUFFER_MINUTES: 5, // Refresh token 5 minutes before expiry
  MAX_REFRESH_ATTEMPTS: 3,
} as const;

// Polling Configuration
export const POLLING_CONFIG = {
  INTERVAL_MS: 3000, // 3 seconds
  MAX_ATTEMPTS: 300, // 5 minutes with 1-second intervals for job monitoring
  MIN_INTERVAL_MS: 500, // Minimum polling interval
} as const;

// Shared Types
export interface BaseApiResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export interface ApiError {
  error: string;
  code?: string;
  details?: Record<string, any>;
}

export interface PaginatedResponse<T> extends BaseApiResponse {
  data: T[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

export type SyncJobType = (typeof SYNC_JOB_TYPES)[keyof typeof SYNC_JOB_TYPES];
export type SyncJobStatus =
  (typeof SYNC_JOB_STATUS)[keyof typeof SYNC_JOB_STATUS];

// Utility type for API responses with data
export interface ApiResponse<T = any> extends BaseApiResponse {
  data?: T;
}

// Progress callback type
export interface ProgressCallback {
  (progress: number, status: string, message?: string): void;
}

// Network error detection utility
export const isNetworkError = (error: any): boolean => {
  return (
    error?.code === 'NETWORK_ERROR' ||
    error?.code === 'ECONNABORTED' ||
    error?.code === 'ENOTFOUND' ||
    error?.code === 'ECONNREFUSED' ||
    error?.message === 'Network Error'
  );
};

// Auth error detection utility
export const isAuthError = (error: any): boolean => {
  return error?.response?.status === HTTP_STATUS.UNAUTHORIZED;
};

// Server error detection utility
export const isServerError = (error: any): boolean => {
  return error?.response?.status === HTTP_STATUS.INTERNAL_SERVER_ERROR;
};
