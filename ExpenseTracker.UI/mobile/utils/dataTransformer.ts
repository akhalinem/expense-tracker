/**
 * Data transformation utilities for sync operations
 * Handles conversion between local SQLite format and cloud Supabase format
 */

import { Category, Transaction, TransactionTypeEnum } from '~/types';
import { VALIDATION_RULES } from '../constants/sync';
import { createSyncError, SyncErrorType } from './syncErrorHandler';

// Type definitions for cloud data format
export interface CloudCategory {
  name: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface CloudTransaction {
  amount: number;
  description: string;
  date: string;
  type: 'income' | 'expense';
  categories: string[];
  created_at: string;
  updated_at: string;
}

export interface LocalData {
  categories: CloudCategory[];
  transactions: CloudTransaction[];
}

export interface TransactionTypeMap {
  incomeType: { id: number; name: string } | undefined;
  expenseType: { id: number; name: string } | undefined;
  typeMap: Map<string, { id: number; name: string }>;
}

export interface CategoryMaps {
  categories: any[];
  nameToIdMap: Map<string, number>;
  idToNameMap: Map<number, string>;
}

/**
 * Transforms local SQLite data to cloud-compatible format
 */
export class DataTransformer {
  /**
   * Transform categories from local to cloud format
   */
  static transformCategoriesToCloud(localCategories: any[]): CloudCategory[] {
    if (!Array.isArray(localCategories)) {
      throw createSyncError(
        'Categories must be an array',
        SyncErrorType.VALIDATION,
        { details: { received: typeof localCategories } }
      );
    }

    return localCategories.map((cat, index) => {
      try {
        if (!cat.name || typeof cat.name !== 'string') {
          throw new Error(`Category at index ${index} missing or invalid name`);
        }

        if (cat.name.length > VALIDATION_RULES.CATEGORY_NAME_MAX_LENGTH) {
          throw new Error(
            `Category name too long: ${cat.name.length} characters`
          );
        }

        return {
          name: cat.name.trim(),
          color: cat.color || '#000000',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      } catch (error) {
        throw createSyncError(
          `Invalid category data: ${error instanceof Error ? error.message : 'Unknown error'}`,
          SyncErrorType.DATA_INTEGRITY,
          { details: { category: cat, index } }
        );
      }
    });
  }

  /**
   * Transform transactions from local to cloud format
   */
  static transformTransactionsToCloud(
    localTransactions: any[],
    transactionCategories: any[],
    categoryIdToNameMap: Map<number, string>,
    typeMap: Map<string, { id: number; name: string }>
  ): CloudTransaction[] {
    if (!Array.isArray(localTransactions)) {
      throw createSyncError(
        'Transactions must be an array',
        SyncErrorType.VALIDATION,
        { details: { received: typeof localTransactions } }
      );
    }

    return localTransactions.map((trans, index) => {
      try {
        // Validate amount
        const amount = parseFloat(trans.amount?.toString() || '0');
        if (isNaN(amount) || amount < 0) {
          throw new Error(`Invalid amount: ${trans.amount}`);
        }

        if (amount > VALIDATION_RULES.TRANSACTION_AMOUNT_MAX) {
          throw new Error(`Amount too large: ${amount}`);
        }

        // Get transaction type
        const transactionType = Array.from(typeMap.values()).find(
          (tt) => tt.id === trans.typeId
        );

        if (!transactionType) {
          throw new Error(
            `Transaction type not found for typeId: ${trans.typeId}`
          );
        }

        // Get categories for this transaction
        const transactionCategoryNames = transactionCategories
          .filter((tc) => tc.transactionId === trans.id)
          .map((tc) => categoryIdToNameMap.get(tc.categoryId))
          .filter(Boolean) as string[];

        // Validate description length
        const description = trans.description || '';
        if (
          description.length >
          VALIDATION_RULES.TRANSACTION_DESCRIPTION_MAX_LENGTH
        ) {
          throw new Error(
            `Description too long: ${description.length} characters`
          );
        }

        // Validate date
        const date = trans.date || new Date().toISOString().split('T')[0];
        if (!this.isValidDate(date)) {
          throw new Error(`Invalid date format: ${date}`);
        }

        return {
          amount,
          description: description.trim(),
          date,
          type:
            transactionType.name.toLowerCase() === 'income'
              ? 'income'
              : 'expense',
          categories: transactionCategoryNames,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      } catch (error) {
        throw createSyncError(
          `Invalid transaction data: ${error instanceof Error ? error.message : 'Unknown error'}`,
          SyncErrorType.DATA_INTEGRITY,
          { details: { transaction: trans, index } }
        );
      }
    });
  }

  /**
   * Validate and prepare local data for cloud sync
   */
  static prepareLocalDataForSync(
    categories: any[],
    transactions: any[],
    transactionCategories: any[],
    typeMap: Map<string, { id: number; name: string }>,
    categoryIdToNameMap: Map<number, string>
  ): LocalData {
    // Validate input data limits
    if (categories.length > VALIDATION_RULES.MAX_CATEGORIES_PER_SYNC) {
      throw createSyncError(
        `Too many categories: ${categories.length} (max: ${VALIDATION_RULES.MAX_CATEGORIES_PER_SYNC})`,
        SyncErrorType.VALIDATION
      );
    }

    if (transactions.length > VALIDATION_RULES.MAX_TRANSACTIONS_PER_SYNC) {
      throw createSyncError(
        `Too many transactions: ${transactions.length} (max: ${VALIDATION_RULES.MAX_TRANSACTIONS_PER_SYNC})`,
        SyncErrorType.VALIDATION
      );
    }

    console.log('🔄 Transforming data for cloud sync...');
    console.log(`   - Categories: ${categories.length}`);
    console.log(`   - Transactions: ${transactions.length}`);

    const transformedCategories = this.transformCategoriesToCloud(categories);
    const transformedTransactions = this.transformTransactionsToCloud(
      transactions,
      transactionCategories,
      categoryIdToNameMap,
      typeMap
    );

    const result = {
      categories: transformedCategories,
      transactions: transformedTransactions,
    };

    // Validate payload size
    const payloadSize = JSON.stringify(result).length;
    if (payloadSize > VALIDATION_RULES.MAX_SYNC_PAYLOAD_SIZE) {
      throw createSyncError(
        `Sync payload too large: ${payloadSize} bytes (max: ${VALIDATION_RULES.MAX_SYNC_PAYLOAD_SIZE})`,
        SyncErrorType.VALIDATION
      );
    }

    console.log(`✅ Data transformation complete:`, {
      categories: transformedCategories.length,
      transactions: transformedTransactions.length,
      payloadSize: `${Math.round(payloadSize / 1024)}KB`,
    });

    return result;
  }

  /**
   * Validate downloaded data from cloud
   */
  static validateDownloadedData(
    data: any
  ): data is { categories: any[]; transactions: any[] } {
    if (!data || typeof data !== 'object') {
      return false;
    }

    // Check if categories array is present and valid
    if (!Array.isArray(data.categories)) {
      console.warn('Downloaded data missing or invalid categories array');
      return false;
    }

    // Check if transactions array is present and valid
    if (!Array.isArray(data.transactions)) {
      console.warn('Downloaded data missing or invalid transactions array');
      return false;
    }

    // Validate category structure
    for (const category of data.categories) {
      if (!category.name || typeof category.name !== 'string') {
        console.warn('Invalid category structure:', category);
        return false;
      }
    }

    // Validate transaction structure
    for (const transaction of data.transactions) {
      if (
        typeof transaction.amount !== 'number' ||
        !transaction.type ||
        !['income', 'expense'].includes(transaction.type) ||
        !Array.isArray(transaction.categories)
      ) {
        console.warn('Invalid transaction structure:', transaction);
        return false;
      }
    }

    return true;
  }

  /**
   * Prepare downloaded data for local database insertion
   */
  static prepareDownloadedDataForLocal(
    downloadedData: { categories: any[]; transactions: any[] },
    incomeTypeId: number,
    expenseTypeId: number,
    categoryNameToIdMap: Map<string, number>
  ): {
    categoryInserts: Array<{ name: string; color: string }>;
    transactionInserts: Array<{
      typeId: number;
      amount: number;
      description: string;
      date: string;
    }>;
    categoryLinks: Array<{ transactionIndex: number; categoryIds: number[] }>;
  } {
    const { categories, transactions } = downloadedData;

    // Prepare category inserts
    const categoryInserts = categories.map((cat: any) => ({
      name: cat.name,
      color: cat.color || '#000000',
    }));

    // Prepare transaction inserts and category links
    const transactionInserts = [];
    const categoryLinks = [];

    for (let i = 0; i < transactions.length; i++) {
      const trans = transactions[i];

      try {
        const typeId = trans.type === 'income' ? incomeTypeId : expenseTypeId;

        const transactionData = {
          typeId,
          amount: trans.amount,
          description: trans.description || '',
          date: trans.date,
        };

        transactionInserts.push(transactionData);

        // Prepare category links if transaction has categories
        if (trans.categories && trans.categories.length > 0) {
          const categoryIds = trans.categories
            .map((catName: string) => categoryNameToIdMap.get(catName))
            .filter(Boolean) as number[];

          if (categoryIds.length > 0) {
            categoryLinks.push({
              transactionIndex: i,
              categoryIds,
            });
          }
        }
      } catch (error) {
        console.warn(
          `Skipping invalid transaction at index ${i}:`,
          error,
          trans
        );
      }
    }

    return {
      categoryInserts,
      transactionInserts,
      categoryLinks,
    };
  }

  /**
   * Create efficient lookup maps for data processing
   */
  static createCategoryLookupMaps(categories: any[]): {
    nameToIdMap: Map<string, number>;
    idToNameMap: Map<number, string>;
  } {
    const nameToIdMap = new Map<string, number>();
    const idToNameMap = new Map<number, string>();

    for (const category of categories) {
      if (category.id && category.name) {
        nameToIdMap.set(category.name, category.id);
        idToNameMap.set(category.id, category.name);
      }
    }

    return { nameToIdMap, idToNameMap };
  }

  /**
   * Create transaction type lookup maps
   */
  static createTransactionTypeMaps(types: any[]): TransactionTypeMap {
    const typeMap = new Map<string, { id: number; name: string }>();
    let incomeType: { id: number; name: string } | undefined;
    let expenseType: { id: number; name: string } | undefined;

    for (const type of types) {
      if (type.id && type.name) {
        const typeData = { id: type.id, name: type.name };
        typeMap.set(type.name, typeData);

        if (type.name.toLowerCase() === 'income') {
          incomeType = typeData;
        } else if (type.name.toLowerCase() === 'expense') {
          expenseType = typeData;
        }
      }
    }

    return { incomeType, expenseType, typeMap };
  }

  /**
   * Validate date format (YYYY-MM-DD)
   */
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

  /**
   * Get summary statistics for local data
   */
  static getDataSummary(data: LocalData): {
    totalCategories: number;
    totalTransactions: number;
    incomeTransactions: number;
    expenseTransactions: number;
    totalAmount: number;
    payloadSize: string;
  } {
    const { categories, transactions } = data;

    const incomeTransactions = transactions.filter(
      (t) => t.type === 'income'
    ).length;
    const expenseTransactions = transactions.filter(
      (t) => t.type === 'expense'
    ).length;
    const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
    const payloadSize = `${Math.round(JSON.stringify(data).length / 1024)}KB`;

    return {
      totalCategories: categories.length,
      totalTransactions: transactions.length,
      incomeTransactions,
      expenseTransactions,
      totalAmount,
      payloadSize,
    };
  }
}

/**
 * Utility function to safely transform data with error handling
 */
export async function safeDataTransformation<T>(
  operation: () => T,
  operationName: string
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    console.log(`🔄 Starting ${operationName}...`);
    const data = operation();
    console.log(`✅ ${operationName} completed successfully`);
    return { success: true, data };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown transformation error';
    console.error(`❌ ${operationName} failed:`, message);
    return { success: false, error: message };
  }
}
