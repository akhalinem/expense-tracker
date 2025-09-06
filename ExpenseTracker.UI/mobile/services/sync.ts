import api from './api';
import { db } from './db';
import {
  categoriesTable,
  transactionsTable,
  transactionCategoriesTable,
  transactionTypesTable,
} from '~/db/schema';
import { eq, desc } from 'drizzle-orm';
import { Category, Transaction, TransactionTypeEnum } from '~/types';
import { progressService } from './realtimeSync';

// Import new utility classes
import { SYNC_CONFIG, ERROR_MESSAGES } from '../constants/sync';
import { API_ENDPOINTS } from '../constants/api';
import {
  withRetry,
  createErrorResult,
  analyzeSyncError,
  SyncErrorType,
  type SyncError,
  type RetryConfig,
} from '../utils/syncErrorHandler';
import {
  DataTransformer,
  safeDataTransformation,
  type LocalData,
} from '../utils/dataTransformer';
import { SyncValidator, validateOrThrow } from '../utils/syncValidator';

export interface SyncResults {
  success: boolean;
  message: string;
  results?: {
    upload: {
      categories: { created: number; updated: number; errors: any[] };
      transactions: { created: number; updated: number; errors: any[] };
    };
    download: {
      categories: any[];
      transactions: any[];
    };
    timestamp: string;
  };
  error?: string;
}

export interface SyncStatus {
  categoriesCount: number;
  transactionsCount: number;
  lastSync: string | null;
  serverTime: string;
}

export interface SyncJob {
  id: string;
  type: 'upload' | 'download' | 'full_sync';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  total_items: number;
  processed_items: number;
  created_at: string;
  updated_at: string;
  started_at?: string;
  completed_at?: string;
  error_message?: string;
  results?: any;
}

export interface JobProgressCallback {
  (progress: number, status: string, message?: string): void;
}

class SyncService {
  private baseUrl: string;
  private statusCache: { timestamp: number; status: any } | null = null;
  private readonly CACHE_DURATION = 30 * 1000; // 30 seconds

  constructor() {
    // Use a default URL since process.env is not available in React Native
    this.baseUrl = 'http://localhost:3000';
  }

  /**
   * Helper method to get transaction types efficiently
   * @private
   */
  private async getTransactionTypes() {
    const types = await db.select().from(transactionTypesTable);
    return DataTransformer.createTransactionTypeMaps(types);
  }

  /**
   * Helper method to build category lookup maps efficiently
   * @private
   */
  private async getCategoryMaps() {
    const categories = await db.select().from(categoriesTable);
    return {
      categories,
      ...DataTransformer.createCategoryLookupMaps(categories),
    };
  }

  /**
   * Get all local data from SQLite database using new utilities
   */
  async getLocalData(): Promise<LocalData> {
    return await safeDataTransformation(async () => {
      console.log('🔍 Starting to get local data...');

      // Get all data in parallel for better performance
      const [categories, transactions, transactionCategories, typeMap] =
        await Promise.all([
          db.select().from(categoriesTable),
          db.select().from(transactionsTable),
          db.select().from(transactionCategoriesTable),
          this.getTransactionTypes(),
        ]);

      console.log(`✅ Retrieved data:`, {
        categories: categories.length,
        transactions: transactions.length,
        transactionCategories: transactionCategories.length,
      });

      // Use DataTransformer utility for efficient transformation
      const categoryIdToNameMap =
        DataTransformer.createCategoryLookupMaps(categories).idToNameMap;

      return DataTransformer.prepareLocalDataForSync(
        categories,
        transactions,
        transactionCategories,
        typeMap.typeMap,
        categoryIdToNameMap
      );
    }, 'Local data retrieval and transformation').then((result) => {
      if (!result.success) {
        throw new Error(result.error || ERROR_MESSAGES.LOCAL_DATA_ERROR);
      }
      return result.data!;
    });
  }

  /**
   * Upload local data to Supabase using background jobs with comprehensive validation
   */
  async uploadData(onProgress?: JobProgressCallback): Promise<SyncResults> {
    return await withRetry(
      async () => {
        console.log('🚀 Starting background upload process...');

        const localData = await this.getLocalData();

        // Validate data before upload
        validateOrThrow(
          localData,
          SyncValidator.validateSyncPayload,
          'Upload data'
        );

        console.log('📤 Creating background job...');
        console.log(
          `   - Payload summary:`,
          DataTransformer.getDataSummary(localData)
        );

        return await this.createAndMonitorJob('upload', localData, onProgress);
      },
      {
        maxAttempts: SYNC_CONFIG.MAX_RETRY_ATTEMPTS,
        baseDelay: SYNC_CONFIG.RETRY_DELAY_BASE,
      }
    ).catch((error) => {
      console.error('❌ Upload error:', error);
      return createErrorResult(error, 'Upload operation');
    });
  }

  /**
   * Upload data in chunks to avoid timeouts
   */
  private async uploadDataInChunks(localData: {
    categories: any[];
    transactions: any[];
  }): Promise<SyncResults> {
    try {
      // Upload categories first
      console.log('📁 Uploading categories...');
      const categoriesResponse = await api.post('/api/sync/upload', {
        categories: localData.categories,
        transactions: [],
      });

      if (!categoriesResponse.data.success) {
        throw new Error(ERROR_MESSAGES.UPLOAD_FAILED);
      }

      // Upload transactions in chunks of 50
      const chunkSize = 50;
      const transactionChunks = [];

      for (let i = 0; i < localData.transactions.length; i += chunkSize) {
        transactionChunks.push(localData.transactions.slice(i, i + chunkSize));
      }

      console.log(
        `💰 Uploading ${localData.transactions.length} transactions in ${transactionChunks.length} chunks...`
      );

      let totalResults = {
        categories: categoriesResponse.data.results?.upload?.categories || {
          created: 0,
          updated: 0,
          errors: [],
        },
        transactions: { created: 0, updated: 0, errors: [] as any[] },
      };

      for (let i = 0; i < transactionChunks.length; i++) {
        console.log(
          `📦 Uploading chunk ${i + 1}/${transactionChunks.length} (${transactionChunks[i].length} transactions)...`
        );

        const chunkResponse = await api.post('/api/sync/upload', {
          categories: [], // Already uploaded
          transactions: transactionChunks[i],
        });

        if (
          chunkResponse.data.success &&
          chunkResponse.data.results?.upload?.transactions
        ) {
          const chunkResults = chunkResponse.data.results.upload.transactions;
          totalResults.transactions.created += chunkResults.created || 0;
          totalResults.transactions.updated += chunkResults.updated || 0;
          totalResults.transactions.errors.push(...(chunkResults.errors || []));
        }
      }

      console.log('🎉 Chunked upload completed successfully');

      return {
        success: true,
        message: 'Data uploaded successfully in chunks',
        results: {
          upload: totalResults,
          download: { categories: [], transactions: [] },
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error('❌ Chunked upload error:', error);
      return {
        success: false,
        message: ERROR_MESSAGES.UPLOAD_FAILED,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Create and monitor a background job with polling
   */
  private async createAndMonitorJob(
    type: 'upload' | 'download' | 'full_sync',
    payload: any,
    onProgress?: JobProgressCallback
  ): Promise<SyncResults> {
    try {
      // Create the background job
      console.log(`📝 Creating ${type} job...`);
      const jobResponse = await api.post(API_ENDPOINTS.JOBS_CREATE, {
        type,
        ...payload,
      });

      if (!jobResponse.data.success) {
        throw new Error(
          jobResponse.data.message || ERROR_MESSAGES.JOB_CREATION_FAILED
        );
      }

      const jobId = jobResponse.data.job.id;
      console.log(`✅ Created job ${jobId}`);

      // Use polling to monitor the job
      if (onProgress) {
        progressService.createPollingProgressCallback(
          jobId,
          onProgress,
          (error) => {
            console.error(`❌ Polling error for job ${jobId}:`, error);
          }
        );
      }

      // Monitor the job until completion using direct polling
      return await this.monitorJob(jobId, onProgress);
    } catch (error) {
      console.error(`❌ Error in ${type} job:`, error);
      throw error;
    }
  }

  /**
   * Monitor a job until completion with improved error handling
   */
  private async monitorJob(
    jobId: string,
    onProgress?: JobProgressCallback
  ): Promise<SyncResults> {
    const maxAttempts = 360; // 6 minutes with 1-second intervals
    let attempts = 0;
    let consecutiveErrors = 0;

    console.log(
      `📊 Starting to monitor job ${jobId} (max attempts: ${maxAttempts})`
    );

    while (attempts < maxAttempts) {
      try {
        const statusResponse = await api.get(`/api/jobs/${jobId}`);

        if (!statusResponse.data.success) {
          throw new Error(
            statusResponse.data.message || 'Failed to get job status'
          );
        }

        const job: SyncJob = statusResponse.data.job;
        console.log(
          `📊 Job ${jobId} status: ${job.status} (${job.progress}%) - Attempt ${attempts + 1}/${maxAttempts}`
        );

        // Reset consecutive errors on successful response
        consecutiveErrors = 0;

        // Call progress callback if provided
        if (onProgress) {
          onProgress(job.progress, job.status);
        }

        switch (job.status) {
          case 'completed':
            console.log(
              `🎉 Job ${jobId} completed successfully after ${attempts + 1} attempts`
            );
            return {
              success: true,
              message: 'Operation completed successfully',
              results: job.results,
            };

          case 'failed':
            console.error(
              `❌ Job ${jobId} failed after ${attempts + 1} attempts: ${job.error_message}`
            );
            return {
              success: false,
              message: job.error_message || 'Job failed',
              error: job.error_message,
            };

          case 'pending':
          case 'processing':
            // Continue monitoring
            break;

          default:
            throw new Error(`Unknown job status: ${job.status}`);
        }

        attempts++;
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second
      } catch (error) {
        consecutiveErrors++;
        console.error(
          `❌ Error monitoring job ${jobId} (attempt ${attempts + 1}, consecutive errors: ${consecutiveErrors}):`,
          error
        );

        // If we have too many consecutive errors, give up
        if (consecutiveErrors >= 10) {
          console.error(
            `🛑 Too many consecutive errors for job ${jobId}, giving up`
          );
          return {
            success: false,
            message: 'Job monitoring failed due to repeated network errors',
            error:
              'Network connectivity issues - please check your connection and try again',
          };
        }

        attempts++;

        if (attempts >= maxAttempts) {
          console.error(
            `⏰ Job ${jobId} monitoring timed out after ${maxAttempts} attempts`
          );
          return {
            success: false,
            message: 'Job monitoring timed out',
            error:
              'The sync operation is taking longer than expected. Please try again.',
          };
        }

        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    console.error(
      `⏰ Job ${jobId} monitoring timed out after ${maxAttempts} attempts`
    );
    return {
      success: false,
      message: 'Job monitoring timed out',
      error:
        'The sync operation is taking longer than expected. Please try again.',
    };
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId: string): Promise<SyncJob | null> {
    try {
      const response = await api.get(API_ENDPOINTS.JOBS_STATUS(jobId));

      if (response.data.success) {
        return response.data.job;
      } else {
        console.error('Failed to get job status:', response.data.message);
        return null;
      }
    } catch (error) {
      console.error('Error getting job status:', error);
      return null;
    }
  }

  /**
   * Get user's job history
   */
  async getJobHistory(limit = 10): Promise<SyncJob[]> {
    try {
      const response = await api.get(
        `${API_ENDPOINTS.JOBS_HISTORY}?limit=${limit}`
      );

      if (response.data.success) {
        return response.data.jobs;
      } else {
        console.error('Failed to get job history:', response.data.message);
        return [];
      }
    } catch (error) {
      console.error('Error getting job history:', error);
      return [];
    }
  }

  /**
   * Download data from Supabase and merge with local data using validation
   */
  async downloadData(onProgress?: JobProgressCallback): Promise<SyncResults> {
    return await withRetry(
      async () => {
        console.log('⬇️ Starting download process...');

        return await this.createAndMonitorJob('download', {}, onProgress);
      },
      {
        maxAttempts: SYNC_CONFIG.MAX_RETRY_ATTEMPTS,
        baseDelay: SYNC_CONFIG.RETRY_DELAY_BASE,
      }
    ).catch((error) => {
      console.error('❌ Download error:', error);
      return createErrorResult(error, 'Download operation');
    });
  }

  /**
   * Initiates a full bidirectional sync between local and cloud data using background jobs
   *
   * This method uploads local changes to the cloud, then downloads the latest cloud data
   * to ensure both local and cloud databases are synchronized. Uses a background job
   * queue for reliable processing with progress tracking.
   *
   * @param onProgress - Optional callback to track sync progress and receive status updates
   * @returns Promise<SyncResults> - Contains sync statistics and results
   *
   * @example
   * ```typescript
   * const results = await syncService.fullSync((progress) => {
   *   console.log(`Sync progress: ${progress.percentage}%`);
   *   console.log(`Status: ${progress.status}`);
   * });
   *
   * console.log(`Synced ${results.categoriesCount} categories and ${results.transactionsCount} transactions`);
   * ```
   *
   * @throws Will throw an error if sync job creation fails or times out
   */
  async fullSync(onProgress?: JobProgressCallback): Promise<SyncResults> {
    return await withRetry(
      async () => {
        console.log('🔄 Starting background full sync process...');
        const localData = await this.getLocalData();

        // Validate data before sync
        validateOrThrow(
          localData,
          SyncValidator.validateSyncPayload,
          'Full sync data'
        );

        console.log('🔄 Creating full sync job...');
        console.log(
          `   - Payload summary:`,
          DataTransformer.getDataSummary(localData)
        );

        const result = await this.createAndMonitorJob(
          'full_sync',
          localData,
          onProgress
        );

        if (result.success) {
          // Only update local database if we have valid download data
          if (
            result.results?.download &&
            (result.results.download.categories?.length > 0 ||
              result.results.download.transactions?.length > 0)
          ) {
            console.log(
              '🔄 Full sync received download data, updating local database...'
            );
            await this.updateLocalDatabase(result.results.download);
          } else {
            console.log(
              '⚠️ Full sync completed but no download data received, keeping local data intact'
            );
          }
        }

        return result;
      },
      {
        maxAttempts: SYNC_CONFIG.MAX_RETRY_ATTEMPTS,
        baseDelay: SYNC_CONFIG.RETRY_DELAY_BASE,
      }
    ).catch((error) => {
      console.error('❌ Full sync error:', error);
      return createErrorResult(error, 'Full sync operation');
    });
  }

  /**
   * Retrieves the current synchronization status from the cloud server with caching
   *
   * Fetches cloud data statistics and checks server connectivity. Uses caching to
   * reduce API calls and improve performance.
   *
   * @param forceRefresh - Skip cache and force fresh data from server
   * @returns Promise<object> - Contains success flag, status object with counts, and error info
   *
   * @example
   * ```typescript
   * const { success, status, needsAuth } = await syncService.getSyncStatus();
   * if (success && status) {
   *   console.log(`Cloud: ${status.categoriesCount} categories, ${status.transactionsCount} transactions`);
   * }
   * ```
   *
   * @throws Returns error information in response object rather than throwing
   */
  async getSyncStatus(forceRefresh = false): Promise<{
    success: boolean;
    status?: SyncStatus;
    error?: string;
    needsAuth?: boolean;
  }> {
    try {
      // Check cache first unless force refresh
      if (!forceRefresh && this.statusCache) {
        const age = Date.now() - this.statusCache.timestamp;
        if (age < this.CACHE_DURATION) {
          console.log('🔍 [SYNC_STATUS] Using cached status');
          return {
            success: true,
            status: this.statusCache.status,
          };
        }
      }

      console.log('🔍 [SYNC_STATUS] Fetching fresh status from server');
      const response = await api.get(API_ENDPOINTS.SYNC_STATUS);

      if (response.data && response.data.success) {
        // Cache the successful response
        this.statusCache = {
          timestamp: Date.now(),
          status: response.data.status,
        };

        return {
          success: true,
          status: response.data.status,
        };
      } else {
        throw new Error(response.data?.message || ERROR_MESSAGES.SERVER_ERROR);
      }
    } catch (error: any) {
      console.error('Sync status error:', error);

      // Use new error handling utilities
      const syncError = analyzeSyncError(error);

      return {
        success: false,
        error: syncError.userMessage,
        needsAuth: syncError.type === SyncErrorType.AUTH,
      };
    }
  }

  /**
   * Update local database with downloaded data (OPTIMIZED)
   * @private
   */
  private async updateLocalDatabase(downloadedData: {
    categories: any[];
    transactions: any[];
  }) {
    try {
      console.log(
        '🔄 [UPDATE_LOCAL] Starting optimized local database update...'
      );
      console.log(
        `🔄 [UPDATE_LOCAL] Downloaded data: ${downloadedData.categories?.length || 0} categories, ${downloadedData.transactions?.length || 0} transactions`
      );

      const { categories, transactions } = downloadedData;

      // IMPORTANT: Only update if we actually have data to prevent data loss
      if (!categories && !transactions) {
        console.log(
          '⚠️ [UPDATE_LOCAL] No downloaded data provided, skipping local update to prevent data loss'
        );
        return;
      }

      if (
        categories &&
        categories.length === 0 &&
        transactions &&
        transactions.length === 0
      ) {
        console.log(
          '⚠️ [UPDATE_LOCAL] Empty arrays provided, skipping local update to prevent data loss'
        );
        return;
      }

      // Get transaction types once for efficiency
      const { incomeType, expenseType } = await this.getTransactionTypes();

      if (!incomeType || !expenseType) {
        console.error(
          '❌ [UPDATE_LOCAL] Transaction types not found! This will prevent transaction insertion.'
        );
        throw new Error(
          'Required transaction types (Income/Expense) not found in local database'
        );
      }

      console.log('🗑️ [UPDATE_LOCAL] Clearing existing local data...');
      // Clear existing data in correct order (foreign keys)
      await db.delete(transactionCategoriesTable);
      await db.delete(transactionsTable);
      await db.delete(categoriesTable);

      // Insert categories if provided
      if (categories && categories.length > 0) {
        console.log(
          `📁 [UPDATE_LOCAL] Inserting ${categories.length} categories...`
        );
        const categoryInserts = categories.map((cat: any) => ({
          name: cat.name,
          color: cat.color || '#000000',
        }));

        await db.insert(categoriesTable).values(categoryInserts);
        console.log(
          `✅ [UPDATE_LOCAL] Successfully inserted ${categoryInserts.length} categories`
        );
      } else {
        console.log('📁 [UPDATE_LOCAL] No categories to insert');
      }

      // Get updated categories with their IDs for transaction linking
      const { nameToIdMap: categoryMap } = await this.getCategoryMaps();
      console.log(
        `🔗 [UPDATE_LOCAL] Built category map with ${categoryMap.size} categories`
      );

      // Insert transactions if provided
      if (transactions && transactions.length > 0) {
        console.log(
          `💰 [UPDATE_LOCAL] Processing ${transactions.length} transactions in batches...`
        );

        // Process transactions in batches for better performance
        const batchSize = 50;
        let insertedCount = 0;

        for (let i = 0; i < transactions.length; i += batchSize) {
          const batch = transactions.slice(i, i + batchSize);
          console.log(
            `� [UPDATE_LOCAL] Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(transactions.length / batchSize)} (${batch.length} transactions)`
          );

          const transactionInserts = [];
          const categoryLinksToInsert = [];

          for (const trans of batch) {
            try {
              const typeId =
                trans.type === 'income' ? incomeType.id : expenseType.id;

              // Prepare transaction insert
              const transactionData = {
                typeId: typeId,
                amount: trans.amount,
                description: trans.description || '',
                date: trans.date,
              };

              transactionInserts.push(transactionData);

              // Prepare category links if transaction has categories
              if (trans.categories && trans.categories.length > 0) {
                const categoryIds = trans.categories
                  .map((catName: string) => categoryMap.get(catName))
                  .filter(Boolean);

                // We'll map these after transaction insertion
                categoryLinksToInsert.push({
                  transactionIndex: transactionInserts.length - 1,
                  categoryIds,
                });
              }
            } catch (error) {
              console.error(
                `❌ [UPDATE_LOCAL] Error preparing transaction:`,
                error,
                trans
              );
            }
          }

          // Batch insert transactions
          if (transactionInserts.length > 0) {
            const insertedTransactions = await db
              .insert(transactionsTable)
              .values(transactionInserts)
              .returning({ id: transactionsTable.id });

            insertedCount += insertedTransactions.length;

            // Insert category links in batch
            const allCategoryLinks = [];
            for (const linkData of categoryLinksToInsert) {
              const transactionId =
                insertedTransactions[linkData.transactionIndex]?.id;
              if (transactionId && linkData.categoryIds.length > 0) {
                const links = linkData.categoryIds.map(
                  (categoryId: number) => ({
                    transactionId,
                    categoryId,
                  })
                );
                allCategoryLinks.push(...links);
              }
            }

            if (allCategoryLinks.length > 0) {
              await db
                .insert(transactionCategoriesTable)
                .values(allCategoryLinks);
            }
          }
        }

        console.log(
          `✅ [UPDATE_LOCAL] Successfully inserted ${insertedCount}/${transactions.length} transactions`
        );
      } else {
        console.log('💰 [UPDATE_LOCAL] No transactions to insert');
      }

      console.log(
        '✅ [UPDATE_LOCAL] Optimized local database update completed'
      );

      // Log final counts for verification
      const finalStats = await this.getLocalStats();
      console.log('📊 [UPDATE_LOCAL] Final local stats:', finalStats);
    } catch (error) {
      console.error('❌ [UPDATE_LOCAL] Error updating local database:', error);
      const errorResult = createErrorResult(error, 'Local database update');
      throw new Error(errorResult.error || 'Failed to update local database');
    }
  }

  /**
   * Clear cached sync status to force fresh data on next call
   */
  clearStatusCache() {
    this.statusCache = null;
  }

  /**
   * Retrieves current statistics for local database
   *
   * Counts categories and transactions stored in the local SQLite database.
   * Used for sync UI display and progress tracking.
   *
   * @returns Promise<object> - Object containing categoriesCount and transactionsCount
   *
   * @example
   * ```typescript
   * const stats = await syncService.getLocalStats();
   * console.log(`Local: ${stats.categoriesCount} categories, ${stats.transactionsCount} transactions`);
   * ```
   */
  async getLocalStats() {
    try {
      const categories = await db.select().from(categoriesTable);
      const transactions = await db.select().from(transactionsTable);

      const lastTransaction = await db
        .select()
        .from(transactionsTable)
        .orderBy(desc(transactionsTable.id))
        .limit(1)
        .then((results) => results[0]);

      return {
        categoriesCount: categories.length,
        transactionsCount: transactions.length,
        lastModified: lastTransaction ? new Date().toISOString() : null,
      };
    } catch (error) {
      console.error('❌ Error getting local stats:', error);
      const errorResult = createErrorResult(error, 'Local stats retrieval');
      console.warn(
        '⚠️ Returning fallback stats due to error:',
        errorResult.error
      );
      return {
        categoriesCount: 0,
        transactionsCount: 0,
        lastModified: null,
      };
    }
  }
}

export const syncService = new SyncService();
