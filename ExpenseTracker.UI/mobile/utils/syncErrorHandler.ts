/**
 * Comprehensive error handling system for sync operations
 * Provides standardized error types, retry logic, and user-friendly error management
 */

import {
  ERROR_MESSAGES,
  SYNC_CONFIG,
  getRetryDelay,
  getErrorMessage,
} from '../constants/sync';

// Error type definitions
export enum SyncErrorType {
  NETWORK = 'NETWORK',
  AUTH = 'AUTH',
  VALIDATION = 'VALIDATION',
  SERVER = 'SERVER',
  TIMEOUT = 'TIMEOUT',
  DATA_INTEGRITY = 'DATA_INTEGRITY',
  UNKNOWN = 'UNKNOWN',
}

export interface SyncError extends Error {
  type: SyncErrorType;
  code?: string;
  statusCode?: number;
  retryable: boolean;
  userMessage: string;
  details?: any;
  timestamp: string;
}

// Retry configuration
export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: SYNC_CONFIG.MAX_RETRY_ATTEMPTS,
  baseDelay: SYNC_CONFIG.RETRY_DELAY_BASE,
  maxDelay: 30000, // 30 seconds max
  backoffMultiplier: 2,
};

/**
 * Creates a standardized SyncError instance
 */
export function createSyncError(
  message: string,
  type: SyncErrorType,
  options: {
    code?: string;
    statusCode?: number;
    retryable?: boolean;
    details?: any;
    cause?: Error;
  } = {}
): SyncError {
  const error = new Error(message) as SyncError;

  error.type = type;
  error.code = options.code;
  error.statusCode = options.statusCode;
  error.retryable = options.retryable ?? isRetryableError(type);
  error.userMessage = getUserFriendlyMessage(type, message);
  error.details = options.details;
  error.timestamp = new Date().toISOString();

  if (options.cause) {
    error.cause = options.cause;
  }

  return error;
}

/**
 * Analyzes an error and converts it to a SyncError
 */
export function analyzeSyncError(error: any): SyncError {
  // If it's already a SyncError, return as is
  if (error instanceof Error && 'type' in error) {
    return error as SyncError;
  }

  let type = SyncErrorType.UNKNOWN;
  let retryable = false;
  let statusCode: number | undefined;

  // Analyze error to determine type
  if (error?.response) {
    statusCode = error.response.status;

    if (statusCode === 401 || statusCode === 403) {
      type = SyncErrorType.AUTH;
      retryable = false;
    } else if (statusCode && statusCode >= 500) {
      type = SyncErrorType.SERVER;
      retryable = true;
    } else if (statusCode === 408 || statusCode === 504) {
      type = SyncErrorType.TIMEOUT;
      retryable = true;
    } else if (statusCode && statusCode >= 400 && statusCode < 500) {
      type = SyncErrorType.VALIDATION;
      retryable = false;
    }
  } else if (
    error?.code === 'NETWORK_ERROR' ||
    error?.message?.includes('Network Error')
  ) {
    type = SyncErrorType.NETWORK;
    retryable = true;
  } else if (error?.code === 'TIMEOUT') {
    type = SyncErrorType.TIMEOUT;
    retryable = true;
  }

  return createSyncError(error?.message || 'Unknown error occurred', type, {
    code: error?.code,
    statusCode,
    retryable,
    details: error?.response?.data,
    cause: error,
  });
}

/**
 * Determines if an error type is retryable
 */
function isRetryableError(type: SyncErrorType): boolean {
  switch (type) {
    case SyncErrorType.NETWORK:
    case SyncErrorType.TIMEOUT:
    case SyncErrorType.SERVER:
      return true;
    case SyncErrorType.AUTH:
    case SyncErrorType.VALIDATION:
    case SyncErrorType.DATA_INTEGRITY:
      return false;
    case SyncErrorType.UNKNOWN:
    default:
      return false; // Conservative approach
  }
}

/**
 * Gets user-friendly error message based on error type
 */
function getUserFriendlyMessage(
  type: SyncErrorType,
  originalMessage: string
): string {
  switch (type) {
    case SyncErrorType.NETWORK:
      return ERROR_MESSAGES.NETWORK_ERROR;
    case SyncErrorType.AUTH:
      return ERROR_MESSAGES.AUTH_REQUIRED;
    case SyncErrorType.TIMEOUT:
      return ERROR_MESSAGES.CONNECTION_TIMEOUT;
    case SyncErrorType.SERVER:
      return ERROR_MESSAGES.SERVER_UNAVAILABLE;
    case SyncErrorType.VALIDATION:
      return ERROR_MESSAGES.DATA_VALIDATION_FAILED;
    case SyncErrorType.DATA_INTEGRITY:
      return ERROR_MESSAGES.INVALID_DATA_FORMAT;
    case SyncErrorType.UNKNOWN:
    default:
      return ERROR_MESSAGES.UNKNOWN_ERROR;
  }
}

/**
 * Retry wrapper function with exponential backoff
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {},
  onRetry?: (attempt: number, error: SyncError) => void
): Promise<T> {
  const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: SyncError;

  for (let attempt = 1; attempt <= retryConfig.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = analyzeSyncError(error);

      // Don't retry if error is not retryable or if this is the last attempt
      if (!lastError.retryable || attempt === retryConfig.maxAttempts) {
        throw lastError;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        retryConfig.baseDelay *
          Math.pow(retryConfig.backoffMultiplier, attempt - 1),
        retryConfig.maxDelay
      );

      console.warn(
        `Sync operation failed (attempt ${attempt}/${retryConfig.maxAttempts}), retrying in ${delay}ms:`,
        lastError.message
      );

      // Call retry callback if provided
      if (onRetry) {
        onRetry(attempt, lastError);
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

/**
 * Timeout wrapper function
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = SYNC_CONFIG.REQUEST_TIMEOUT,
  errorMessage: string = 'Operation timed out'
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(
          createSyncError(errorMessage, SyncErrorType.TIMEOUT, {
            code: 'TIMEOUT',
            retryable: true,
          })
        );
      }, timeoutMs);
    }),
  ]);
}

/**
 * Safe async operation wrapper that handles all types of errors
 */
export async function safeAsyncOperation<T>(
  operation: () => Promise<T>,
  fallbackValue?: T,
  logError: boolean = true
): Promise<{ success: boolean; data?: T; error?: SyncError }> {
  try {
    const data = await operation();
    return { success: true, data };
  } catch (error) {
    const syncError = analyzeSyncError(error);

    if (logError) {
      console.error('Safe async operation failed:', {
        type: syncError.type,
        message: syncError.message,
        userMessage: syncError.userMessage,
        retryable: syncError.retryable,
        timestamp: syncError.timestamp,
      });
    }

    return {
      success: false,
      error: syncError,
      data: fallbackValue,
    };
  }
}

/**
 * Error aggregation for batch operations
 */
export class ErrorAggregator {
  private errors: SyncError[] = [];

  addError(error: any): void {
    this.errors.push(analyzeSyncError(error));
  }

  hasErrors(): boolean {
    return this.errors.length > 0;
  }

  getErrors(): SyncError[] {
    return [...this.errors];
  }

  getErrorsByType(type: SyncErrorType): SyncError[] {
    return this.errors.filter((error) => error.type === type);
  }

  hasRetryableErrors(): boolean {
    return this.errors.some((error) => error.retryable);
  }

  getSummary(): {
    totalErrors: number;
    errorsByType: Record<SyncErrorType, number>;
    retryableCount: number;
    userMessages: string[];
  } {
    const errorsByType = {} as Record<SyncErrorType, number>;
    const userMessages = new Set<string>();

    for (const error of this.errors) {
      errorsByType[error.type] = (errorsByType[error.type] || 0) + 1;
      userMessages.add(error.userMessage);
    }

    return {
      totalErrors: this.errors.length,
      errorsByType,
      retryableCount: this.errors.filter((e) => e.retryable).length,
      userMessages: Array.from(userMessages),
    };
  }

  clear(): void {
    this.errors = [];
  }
}

/**
 * Error logging utility for debugging and monitoring
 */
export function logSyncError(error: SyncError, context?: string): void {
  const logData = {
    context,
    type: error.type,
    message: error.message,
    userMessage: error.userMessage,
    code: error.code,
    statusCode: error.statusCode,
    retryable: error.retryable,
    timestamp: error.timestamp,
    details: error.details,
    stack: error.stack,
  };

  // Use appropriate log level based on error type
  if (
    error.type === SyncErrorType.VALIDATION ||
    error.type === SyncErrorType.DATA_INTEGRITY
  ) {
    console.error('Sync Error (Critical):', logData);
  } else if (error.retryable) {
    console.warn('Sync Error (Retryable):', logData);
  } else {
    console.error('Sync Error (Non-retryable):', logData);
  }
}

/**
 * Creates a standardized error result for API responses
 */
export function createErrorResult(error: any, operation: string) {
  const syncError = analyzeSyncError(error);
  logSyncError(syncError, operation);

  return {
    success: false,
    message: syncError.userMessage,
    error: syncError.message,
    errorType: syncError.type,
    retryable: syncError.retryable,
    timestamp: syncError.timestamp,
  };
}
