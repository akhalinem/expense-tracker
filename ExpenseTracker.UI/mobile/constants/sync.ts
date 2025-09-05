/**
 * Centralized sync system constants and configuration
 * This file contains all configurable values for the sync system
 * to improve maintainability and allow easy tuning.
 */

// API Configuration
export const SYNC_CONFIG = {
  // Backend server configuration
  DEFAULT_BASE_URL: 'http://localhost:3000',

  // Timeout settings (in milliseconds)
  REQUEST_TIMEOUT: 30000, // 30 seconds
  JOB_MONITORING_TIMEOUT: 300000, // 5 minutes

  // Polling configuration
  JOB_POLL_INTERVAL: 1000, // 1 second
  STATUS_CACHE_DURATION: 30000, // 30 seconds

  // Batch processing
  TRANSACTION_CHUNK_SIZE: 50,
  BACKEND_BATCH_SIZE: 25,

  // Retry configuration
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY_BASE: 1000, // 1 second, will be exponentially increased

  // Progress tracking
  PROGRESS_UPDATE_THRESHOLD: 5, // Only emit progress updates if change >= 5%
} as const;

// Job Types
export const SYNC_JOB_TYPES = {
  UPLOAD: 'upload',
  DOWNLOAD: 'download',
  FULL_SYNC: 'full_sync',
} as const;

// Job Status Values
export const JOB_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;

// Error Messages (User-Friendly)
export const ERROR_MESSAGES = {
  // Network-related errors
  NETWORK_ERROR: 'Please check your internet connection and try again.',
  CONNECTION_TIMEOUT: 'The request took too long. Please try again.',
  SERVER_UNAVAILABLE:
    'Server is temporarily unavailable. Please try again later.',

  // Authentication errors
  AUTH_REQUIRED: 'Please sign in to sync your data.',
  AUTH_EXPIRED: 'Your session has expired. Please sign in again.',
  PERMISSION_DENIED: "You don't have permission to perform this action.",

  // Sync-specific errors
  SYNC_FAILED: 'Sync failed. Please try again.',
  UPLOAD_FAILED: 'Failed to upload data. Please check your connection.',
  DOWNLOAD_FAILED: 'Failed to download data. Please check your connection.',
  DATA_VALIDATION_FAILED: 'Invalid data detected. Please contact support.',

  // Job-related errors
  JOB_CREATION_FAILED: 'Failed to start sync operation. Please try again.',
  JOB_TIMEOUT: 'Sync operation timed out. Please try again.',
  JOB_MONITORING_FAILED:
    'Cannot track sync progress. Operation may still be running.',

  // Data integrity errors
  NO_DATA_TO_SYNC: 'No data to synchronize.',
  INVALID_DATA_FORMAT: 'Data format is invalid and cannot be synced.',
  LOCAL_DATA_ERROR: 'Error reading local data. Please restart the app.',

  // Generic fallback
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
  SERVER_ERROR: 'Server error occurred. Please try again later.',
} as const;

// Success Messages (User-Friendly)
export const SUCCESS_MESSAGES = {
  SYNC_COMPLETED: 'Sync completed successfully!',
  UPLOAD_COMPLETED: 'Data uploaded successfully!',
  DOWNLOAD_COMPLETED: 'Data downloaded successfully!',
  NO_CHANGES_NEEDED: 'Your data is already up to date.',
} as const;

// Validation Rules
export const VALIDATION_RULES = {
  // Category validation
  CATEGORY_NAME_MAX_LENGTH: 100,
  CATEGORY_NAME_MIN_LENGTH: 1,

  // Transaction validation
  TRANSACTION_DESCRIPTION_MAX_LENGTH: 500,
  TRANSACTION_AMOUNT_MAX: 999999999.99,
  TRANSACTION_AMOUNT_MIN: 0.01,

  // Sync limits
  MAX_CATEGORIES_PER_SYNC: 1000,
  MAX_TRANSACTIONS_PER_SYNC: 10000,
  MAX_SYNC_PAYLOAD_SIZE: 50 * 1024 * 1024, // 50MB
} as const;

// Type definitions for better type safety
export type SyncJobType = (typeof SYNC_JOB_TYPES)[keyof typeof SYNC_JOB_TYPES];
export type JobStatus = (typeof JOB_STATUS)[keyof typeof JOB_STATUS];

// Utility functions for error handling
export const isNetworkError = (error: any): boolean => {
  return (
    error?.code === 'NETWORK_ERROR' ||
    error?.message?.includes('Network Error') ||
    error?.code === 'TIMEOUT' ||
    !navigator.onLine
  );
};

export const isAuthError = (error: any): boolean => {
  return (
    error?.response?.status === 401 ||
    error?.response?.status === 403 ||
    error?.message?.includes('auth') ||
    error?.message?.includes('token')
  );
};

export const isServerError = (error: any): boolean => {
  return error?.response?.status >= 500;
};

export const getRetryDelay = (attempt: number): number => {
  return SYNC_CONFIG.RETRY_DELAY_BASE * Math.pow(2, attempt);
};

// Helper function to get user-friendly error message
export const getErrorMessage = (error: any): string => {
  if (isNetworkError(error)) {
    return ERROR_MESSAGES.NETWORK_ERROR;
  }

  if (isAuthError(error)) {
    return ERROR_MESSAGES.AUTH_REQUIRED;
  }

  if (isServerError(error)) {
    return ERROR_MESSAGES.SERVER_UNAVAILABLE;
  }

  // Return specific error message if available, otherwise generic
  return error?.message || ERROR_MESSAGES.UNKNOWN_ERROR;
};
