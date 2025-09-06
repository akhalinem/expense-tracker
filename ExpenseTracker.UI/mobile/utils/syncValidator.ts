/**
 * Comprehensive validation utilities for sync data integrity
 * Provides validation functions for all sync operations
 */

import { VALIDATION_RULES } from '../constants/sync';
import { createSyncError, SyncErrorType } from './syncErrorHandler';

// Type definitions for validation results
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
  index?: number;
}

export interface ValidationWarning {
  field: string;
  message: string;
  value?: any;
  index?: number;
}

/**
 * Core validation utilities
 */
export class SyncValidator {
  /**
   * Validate a complete sync payload
   */
  static validateSyncPayload(payload: any): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Check payload structure
    if (!payload || typeof payload !== 'object') {
      errors.push({
        field: 'payload',
        message: 'Sync payload must be an object',
        value: payload,
      });
      return { isValid: false, errors, warnings };
    }

    // Validate categories if present
    if (payload.categories !== undefined) {
      const categoryValidation = SyncValidator.validateCategories(
        payload.categories
      );
      errors.push(...categoryValidation.errors);
      warnings.push(...categoryValidation.warnings);
    }

    // Validate transactions if present
    if (payload.transactions !== undefined) {
      const transactionValidation = SyncValidator.validateTransactions(
        payload.transactions
      );
      errors.push(...transactionValidation.errors);
      warnings.push(...transactionValidation.warnings);
    }

    // Check payload size
    const payloadSize = JSON.stringify(payload).length;
    if (payloadSize > VALIDATION_RULES.MAX_SYNC_PAYLOAD_SIZE) {
      errors.push({
        field: 'payload',
        message: `Payload too large: ${payloadSize} bytes (max: ${VALIDATION_RULES.MAX_SYNC_PAYLOAD_SIZE})`,
        value: payloadSize,
      });
    } else if (payloadSize > VALIDATION_RULES.MAX_SYNC_PAYLOAD_SIZE * 0.8) {
      warnings.push({
        field: 'payload',
        message: `Payload approaching size limit: ${payloadSize} bytes`,
        value: payloadSize,
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate categories array
   */
  static validateCategories(categories: any): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Check if it's an array
    if (!Array.isArray(categories)) {
      errors.push({
        field: 'categories',
        message: 'Categories must be an array',
        value: typeof categories,
      });
      return { isValid: false, errors, warnings };
    }

    // Check array length
    if (categories.length > VALIDATION_RULES.MAX_CATEGORIES_PER_SYNC) {
      errors.push({
        field: 'categories',
        message: `Too many categories: ${categories.length} (max: ${VALIDATION_RULES.MAX_CATEGORIES_PER_SYNC})`,
        value: categories.length,
      });
    }

    // Validate individual categories
    const seenNames = new Set<string>();
    for (let i = 0; i < categories.length; i++) {
      const category = categories[i];
      const categoryErrors = SyncValidator.validateSingleCategory(category, i);
      errors.push(...categoryErrors);

      // Check for duplicate names
      if (category?.name) {
        const normalizedName = category.name.trim().toLowerCase();
        if (seenNames.has(normalizedName)) {
          warnings.push({
            field: 'categories',
            message: `Duplicate category name: "${category.name}"`,
            value: category.name,
            index: i,
          });
        } else {
          seenNames.add(normalizedName);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate a single category
   */
  static validateSingleCategory(
    category: any,
    index?: number
  ): ValidationError[] {
    const errors: ValidationError[] = [];
    const baseError = { field: 'category', index };

    // Check if category is an object
    if (!category || typeof category !== 'object') {
      errors.push({
        ...baseError,
        message: 'Category must be an object',
        value: category,
      });
      return errors;
    }

    // Validate name
    if (!category.name) {
      errors.push({
        ...baseError,
        field: 'category.name',
        message: 'Category name is required',
        value: category.name,
      });
    } else if (typeof category.name !== 'string') {
      errors.push({
        ...baseError,
        field: 'category.name',
        message: 'Category name must be a string',
        value: category.name,
      });
    } else if (
      category.name.trim().length < VALIDATION_RULES.CATEGORY_NAME_MIN_LENGTH
    ) {
      errors.push({
        ...baseError,
        field: 'category.name',
        message: `Category name too short: ${category.name.trim().length} characters (min: ${VALIDATION_RULES.CATEGORY_NAME_MIN_LENGTH})`,
        value: category.name,
      });
    } else if (
      category.name.length > VALIDATION_RULES.CATEGORY_NAME_MAX_LENGTH
    ) {
      errors.push({
        ...baseError,
        field: 'category.name',
        message: `Category name too long: ${category.name.length} characters (max: ${VALIDATION_RULES.CATEGORY_NAME_MAX_LENGTH})`,
        value: category.name,
      });
    }

    // Validate color (optional)
    if (category.color !== undefined) {
      if (typeof category.color !== 'string') {
        errors.push({
          ...baseError,
          field: 'category.color',
          message: 'Category color must be a string',
          value: category.color,
        });
      } else if (!SyncValidator.isValidColor(category.color)) {
        errors.push({
          ...baseError,
          field: 'category.color',
          message: 'Category color must be a valid hex color',
          value: category.color,
        });
      }
    }

    return errors;
  }

  /**
   * Validate transactions array
   */
  static validateTransactions(transactions: any): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Check if it's an array
    if (!Array.isArray(transactions)) {
      errors.push({
        field: 'transactions',
        message: 'Transactions must be an array',
        value: typeof transactions,
      });
      return { isValid: false, errors, warnings };
    }

    // Check array length
    if (transactions.length > VALIDATION_RULES.MAX_TRANSACTIONS_PER_SYNC) {
      errors.push({
        field: 'transactions',
        message: `Too many transactions: ${transactions.length} (max: ${VALIDATION_RULES.MAX_TRANSACTIONS_PER_SYNC})`,
        value: transactions.length,
      });
    }

    // Validate individual transactions
    const seenTransactions = new Set<string>();
    for (let i = 0; i < transactions.length; i++) {
      const transaction = transactions[i];
      const transactionErrors = SyncValidator.validateSingleTransaction(
        transaction,
        i
      );
      errors.push(...transactionErrors);

      // Check for potential duplicates
      if (
        transaction?.amount &&
        transaction?.date &&
        transaction?.description
      ) {
        // Use type or typeId for duplicate detection key
        const typeIdentifier = transaction.type || transaction.typeId;
        const key = `${transaction.amount}-${transaction.date}-${transaction.description}-${typeIdentifier}`;
        if (seenTransactions.has(key)) {
          warnings.push({
            field: 'transactions',
            message: 'Potential duplicate transaction detected',
            value: `Amount: ${transaction.amount}, Date: ${transaction.date}`,
            index: i,
          });
        } else {
          seenTransactions.add(key);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate a single transaction
   */
  static validateSingleTransaction(
    transaction: any,
    index?: number
  ): ValidationError[] {
    const errors: ValidationError[] = [];
    const baseError = { field: 'transaction', index };

    // Check if transaction is an object
    if (!transaction || typeof transaction !== 'object') {
      errors.push({
        ...baseError,
        message: 'Transaction must be an object',
        value: transaction,
      });
      return errors;
    }

    // Validate amount
    if (transaction.amount === undefined || transaction.amount === null) {
      errors.push({
        ...baseError,
        field: 'transaction.amount',
        message: 'Transaction amount is required',
        value: transaction.amount,
      });
    } else if (
      typeof transaction.amount !== 'number' ||
      isNaN(transaction.amount)
    ) {
      errors.push({
        ...baseError,
        field: 'transaction.amount',
        message: 'Transaction amount must be a valid number',
        value: transaction.amount,
      });
    } else if (transaction.amount < VALIDATION_RULES.TRANSACTION_AMOUNT_MIN) {
      errors.push({
        ...baseError,
        field: 'transaction.amount',
        message: `Transaction amount too small: ${transaction.amount} (min: ${VALIDATION_RULES.TRANSACTION_AMOUNT_MIN})`,
        value: transaction.amount,
      });
    } else if (transaction.amount > VALIDATION_RULES.TRANSACTION_AMOUNT_MAX) {
      errors.push({
        ...baseError,
        field: 'transaction.amount',
        message: `Transaction amount too large: ${transaction.amount} (max: ${VALIDATION_RULES.TRANSACTION_AMOUNT_MAX})`,
        value: transaction.amount,
      });
    }

    // Validate type (accept both type string and typeId number formats)
    const hasTypeString =
      transaction.type && typeof transaction.type === 'string';
    const hasTypeId =
      transaction.typeId && typeof transaction.typeId === 'number';

    if (!hasTypeString && !hasTypeId) {
      errors.push({
        ...baseError,
        field: 'transaction.type',
        message: 'Transaction type or typeId is required',
        value: transaction.type || transaction.typeId,
      });
    } else if (
      hasTypeString &&
      !['income', 'expense'].includes(transaction.type)
    ) {
      errors.push({
        ...baseError,
        field: 'transaction.type',
        message: 'Transaction type must be "income" or "expense"',
        value: transaction.type,
      });
    } else if (
      hasTypeId &&
      (!Number.isInteger(transaction.typeId) || transaction.typeId <= 0)
    ) {
      errors.push({
        ...baseError,
        field: 'transaction.typeId',
        message: 'Transaction typeId must be a positive integer',
        value: transaction.typeId,
      });
    }

    // Validate date
    if (!transaction.date) {
      errors.push({
        ...baseError,
        field: 'transaction.date',
        message: 'Transaction date is required',
        value: transaction.date,
      });
    } else if (!SyncValidator.isValidDate(transaction.date)) {
      errors.push({
        ...baseError,
        field: 'transaction.date',
        message:
          'Transaction date must be in YYYY-MM-DD or YYYY-MM-DD HH:mm:ss format',
        value: transaction.date,
      });
    }

    // Validate description (optional)
    if (transaction.description !== undefined) {
      if (typeof transaction.description !== 'string') {
        errors.push({
          ...baseError,
          field: 'transaction.description',
          message: 'Transaction description must be a string',
          value: transaction.description,
        });
      } else if (
        transaction.description.length >
        VALIDATION_RULES.TRANSACTION_DESCRIPTION_MAX_LENGTH
      ) {
        errors.push({
          ...baseError,
          field: 'transaction.description',
          message: `Transaction description too long: ${transaction.description.length} characters (max: ${VALIDATION_RULES.TRANSACTION_DESCRIPTION_MAX_LENGTH})`,
          value: transaction.description,
        });
      }
    }

    // Validate categories (optional)
    if (transaction.categories !== undefined) {
      if (!Array.isArray(transaction.categories)) {
        errors.push({
          ...baseError,
          field: 'transaction.categories',
          message: 'Transaction categories must be an array',
          value: transaction.categories,
        });
      } else {
        for (let i = 0; i < transaction.categories.length; i++) {
          const category = transaction.categories[i];
          if (typeof category !== 'string' || category.trim().length === 0) {
            errors.push({
              ...baseError,
              field: 'transaction.categories',
              message: `Invalid category at index ${i}: must be a non-empty string`,
              value: category,
            });
          }
        }
      }
    }

    return errors;
  }

  /**
   * Validate downloaded data structure
   */
  static validateDownloadedData(data: any): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Check basic structure
    if (!data || typeof data !== 'object') {
      errors.push({
        field: 'downloadedData',
        message: 'Downloaded data must be an object',
        value: data,
      });
      return { isValid: false, errors, warnings };
    }

    // Check for required fields
    if (!('categories' in data)) {
      errors.push({
        field: 'downloadedData.categories',
        message: 'Downloaded data must include categories field',
        value: data,
      });
    }

    if (!('transactions' in data)) {
      errors.push({
        field: 'downloadedData.transactions',
        message: 'Downloaded data must include transactions field',
        value: data,
      });
    }

    // Validate categories if present
    if (data.categories !== undefined) {
      const categoryValidation = SyncValidator.validateCategories(
        data.categories
      );
      errors.push(...categoryValidation.errors);
      warnings.push(...categoryValidation.warnings);
    }

    // Validate transactions if present
    if (data.transactions !== undefined) {
      const transactionValidation = SyncValidator.validateTransactions(
        data.transactions
      );
      errors.push(...transactionValidation.errors);
      warnings.push(...transactionValidation.warnings);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate user ID
   */
  static validateUserId(userId: any): ValidationResult {
    const errors: ValidationError[] = [];

    if (!userId) {
      errors.push({
        field: 'userId',
        message: 'User ID is required',
        value: userId,
      });
    } else if (typeof userId !== 'string') {
      errors.push({
        field: 'userId',
        message: 'User ID must be a string',
        value: userId,
      });
    } else if (userId.trim().length === 0) {
      errors.push({
        field: 'userId',
        message: 'User ID cannot be empty',
        value: userId,
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: [],
    };
  }

  /**
   * Validate sync job type
   */
  static validateSyncJobType(jobType: any): ValidationResult {
    const errors: ValidationError[] = [];
    const validTypes = ['upload', 'download', 'full_sync'];

    if (!jobType) {
      errors.push({
        field: 'jobType',
        message: 'Job type is required',
        value: jobType,
      });
    } else if (!validTypes.includes(jobType)) {
      errors.push({
        field: 'jobType',
        message: `Invalid job type: ${jobType} (valid types: ${validTypes.join(', ')})`,
        value: jobType,
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: [],
    };
  }

  // Helper methods
  private static isValidDate(dateString: string): boolean {
    // Accept both date-only (YYYY-MM-DD) and date-time (YYYY-MM-DD HH:mm:ss) formats
    const dateOnlyRegex = /^\d{4}-\d{2}-\d{2}$/;
    const dateTimeRegex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;

    if (!dateOnlyRegex.test(dateString) && !dateTimeRegex.test(dateString)) {
      return false;
    }

    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  }

  private static isValidColor(color: string): boolean {
    // Check for hex color format (#RGB, #RRGGBB, or #RRGGBBAA)
    const hexRegex = /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$/;
    return hexRegex.test(color);
  }
}

/**
 * Validation result formatter for user-friendly error messages
 */
export class ValidationResultFormatter {
  static formatErrors(validation: ValidationResult): string[] {
    return validation.errors.map((error) => {
      let message = error.message;
      if (error.index !== undefined) {
        message = `Item ${error.index + 1}: ${message}`;
      }
      return message;
    });
  }

  static formatWarnings(validation: ValidationResult): string[] {
    return validation.warnings.map((warning) => {
      let message = warning.message;
      if (warning.index !== undefined) {
        message = `Item ${warning.index + 1}: ${message}`;
      }
      return message;
    });
  }

  static getSummary(validation: ValidationResult): string {
    if (validation.isValid) {
      const warningCount = validation.warnings.length;
      return warningCount > 0
        ? `Validation passed with ${warningCount} warning(s)`
        : 'Validation passed';
    } else {
      const errorCount = validation.errors.length;
      const warningCount = validation.warnings.length;
      return (
        `Validation failed with ${errorCount} error(s)` +
        (warningCount > 0 ? ` and ${warningCount} warning(s)` : '')
      );
    }
  }
}

/**
 * Utility function to validate and throw appropriate errors
 */
export function validateOrThrow(
  data: any,
  validationFunction: (data: any) => ValidationResult,
  context: string
): void {
  const validation = validationFunction(data);

  if (!validation.isValid) {
    const errorMessages = ValidationResultFormatter.formatErrors(validation);
    const summary = ValidationResultFormatter.getSummary(validation);

    console.error(`Validation failed for ${context}:`, {
      summary,
      errors: errorMessages,
      warnings: ValidationResultFormatter.formatWarnings(validation),
    });

    throw createSyncError(
      `${context} validation failed: ${errorMessages.join('; ')}`,
      SyncErrorType.VALIDATION,
      {
        details: {
          errors: validation.errors,
          warnings: validation.warnings,
          summary,
        },
      }
    );
  }

  // Log warnings if any
  if (validation.warnings.length > 0) {
    const warningMessages =
      ValidationResultFormatter.formatWarnings(validation);
    console.warn(`Validation warnings for ${context}:`, warningMessages);
  }
}

/**
 * Batch validation utility for processing large datasets
 */
export class BatchValidator {
  static async validateInBatches<T>(
    items: T[],
    validationFunction: (item: T, index: number) => ValidationError[],
    batchSize: number = 100
  ): Promise<ValidationResult> {
    const allErrors: ValidationError[] = [];
    const allWarnings: ValidationWarning[] = [];

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);

      for (let j = 0; j < batch.length; j++) {
        const itemIndex = i + j;
        const errors = validationFunction(batch[j], itemIndex);
        allErrors.push(...errors);
      }

      // Yield control to prevent blocking
      if (i + batchSize < items.length) {
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    }

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings,
    };
  }
}
