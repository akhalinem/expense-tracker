import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { ISyncResult, ICategory, ITransaction } from "../types";
import { supabaseClient } from "../config/supabase";
import prisma from "../config/prisma";
import categoryService from "./categoryService";
import transactionService from "./transactionService";

class SyncService {
  public supabase: SupabaseClient;

  constructor() {
    this.supabase = supabaseClient;
  }

  /**
   * Log performance metrics for monitoring using Prisma
   */
  async logPerformanceMetrics(
    userId: string,
    operationType: string,
    itemCount: number,
    durationMs: number,
    created: number,
    updated: number,
    errorCount: number
  ): Promise<void> {
    try {
      await prisma.sync_performance_stats.create({
        data: {
          user_id: userId,
          operation_type: operationType,
          item_count: itemCount,
          duration_ms: durationMs,
          created_items: created,
          updated_items: updated,
          error_count: errorCount,
        },
      });

      console.log(
        `📊 [PERFORMANCE] ${operationType}: ${itemCount} items in ${durationMs}ms (${created} created, ${updated} updated, ${errorCount} errors)`
      );
    } catch (error) {
      console.error("❌ Failed to log performance metrics:", error);
      // Don't throw - performance logging shouldn't break sync
    }
  }

  /**
   * Create a user-specific Supabase client with auth context
   */
  createUserClient(userToken: string): SupabaseClient {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    const userClient = createClient(supabaseUrl!, supabaseKey!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
      global: {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      },
    });

    return userClient;
  }

  /**
   * Sync categories using Prisma
   */
  async syncCategories(
    userId: string,
    categories: ICategory[]
  ): Promise<ISyncResult> {
    try {
      console.log(
        `📁 [SYNC_CATEGORIES] Starting Prisma sync for ${categories.length} categories (User: ${userId})`
      );
      const startTime = Date.now();

      if (categories.length === 0) {
        return { created: 0, updated: 0, errors: [] };
      }

      const results: ISyncResult = {
        created: 0,
        updated: 0,
        errors: [],
      };

      // Process categories individually to handle upsert logic
      for (const categoryData of categories) {
        try {
          // Check if category exists by name for this user
          const existingCategory = await prisma.category.findFirst({
            where: {
              user_id: userId,
              name: categoryData.name,
            },
          });

          if (existingCategory) {
            // Update existing category
            await prisma.category.update({
              where: { id: existingCategory.id },
              data: {
                color: categoryData.color || existingCategory.color,
                updated_at: new Date(),
              },
            });
            results.updated++;
          } else {
            // Create new category
            await prisma.category.create({
              data: {
                user_id: userId,
                name: categoryData.name,
                color: categoryData.color || "#000000",
              },
            });
            results.created++;
          }
        } catch (error) {
          console.error(
            `❌ [SYNC_CATEGORIES] Error syncing category ${categoryData.name}:`,
            error
          );
          results.errors.push({
            category: categoryData.name,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      const duration = Date.now() - startTime;
      console.log(
        `✅ [SYNC_CATEGORIES] sync completed in ${duration}ms: ${results.created} created, ${results.updated} updated, ${results.errors.length} errors`
      );

      // Log performance metrics
      await this.logPerformanceMetrics(
        userId,
        "category_upsert",
        categories.length,
        duration,
        results.created,
        results.updated,
        results.errors.length
      );

      return results;
    } catch (error) {
      console.error(
        `❌ [SYNC_CATEGORIES] Fatal error for User ${userId}:`,
        error
      );
      throw new Error(
        `Category sync failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Sync transactions using Prisma
   */
  async syncTransactions(
    userId: string,
    transactions: ITransaction[]
  ): Promise<ISyncResult> {
    try {
      console.log(
        `💰 [SYNC_TRANSACTIONS] Starting Prisma sync for ${transactions.length} transactions (User: ${userId})`
      );
      const startTime = Date.now();

      if (transactions.length === 0) {
        return { created: 0, updated: 0, errors: [] };
      }

      const results: ISyncResult = {
        created: 0,
        updated: 0,
        errors: [],
      };

      // Process transactions individually to handle complex category logic
      for (const transactionData of transactions) {
        try {
          // For sync, we'll create new transactions - let the app handle duplicates
          const transaction = await transactionService.createTransaction({
            ...transactionData,
            user_id: userId,
          });

          results.created++;
        } catch (error) {
          console.error(
            `❌ [SYNC_TRANSACTIONS] Error syncing transaction:`,
            error
          );
          results.errors.push({
            transaction: `${transactionData.amount} ${transactionData.type}`,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      const duration = Date.now() - startTime;
      console.log(
        `✅ [SYNC_TRANSACTIONS] sync completed in ${duration}ms: ${results.created} created, ${results.updated} updated, ${results.errors.length} errors`
      );

      // Log performance metrics
      await this.logPerformanceMetrics(
        userId,
        "transaction_upsert",
        transactions.length,
        duration,
        results.created,
        results.updated,
        results.errors.length
      );

      return results;
    } catch (error) {
      console.error(
        `❌ [SYNC_TRANSACTIONS] Fatal error for User ${userId}:`,
        error
      );
      throw new Error(
        `Transaction sync failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Get all user data from Prisma (for downloading to mobile)
   */
  async getUserData(
    userId: string
  ): Promise<{ categories: ICategory[]; transactions: ITransaction[] }> {
    try {
      console.log(`� [GET_USER_DATA] Starting data fetch for user ${userId}`);

      // Get categories using Prisma
      const categories = await categoryService.getUserCategories(userId);

      console.log(
        `� [GET_USER_DATA] Found ${categories.length} categories for user ${userId}`
      );

      // Get transactions with categories using Prisma
      const transactionsWithCategories =
        await transactionService.getUserTransactions(userId);

      // Transform transactions to match the expected interface format
      const transformedTransactions: ITransaction[] =
        transactionsWithCategories.map((transaction) => ({
          id: transaction.id,
          user_id: transaction.user_id,
          amount: Number(transaction.amount),
          description: transaction.description || "",
          date: transaction.date,
          type: transaction.type as "income" | "expense",
          categories: transaction.transaction_categories.map(
            (tc) => tc.category.id
          ),
          created_at: transaction.created_at || new Date(),
          updated_at: transaction.updated_at || new Date(),
        }));

      console.log(
        `� [GET_USER_DATA] Found ${transformedTransactions.length} transactions for user ${userId}`
      );

      const result = {
        categories: categories.map((cat) => ({
          id: cat.id,
          user_id: cat.user_id,
          name: cat.name,
          color: cat.color || "#000000",
          created_at: cat.created_at || new Date(),
          updated_at: cat.updated_at || new Date(),
        })),
        transactions: transformedTransactions,
      };

      console.log(`✅ [GET_USER_DATA] Returning data for user ${userId}:`, {
        categories: result.categories.length,
        transactions: result.transactions.length,
      });

      return result;
    } catch (error) {
      console.error(`❌ [GET_USER_DATA] Error for user ${userId}:`, error);
      throw new Error(
        `Failed to get user data: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Complete sync operation (both upload and download)
   */
  async fullSync(userId: string, localData: unknown): Promise<unknown> {
    try {
      const syncResults = {
        upload: {
          categories: { created: 0, updated: 0, errors: [] as any[] },
          transactions: { created: 0, updated: 0, errors: [] as any[] },
        },
        download: {
          categories: [] as ICategory[],
          transactions: [] as ITransaction[],
        },
        timestamp: new Date().toISOString(),
      };

      // Upload local data using Prisma
      const typedLocalData = localData as {
        categories?: ICategory[];
        transactions?: ITransaction[];
      };

      if (typedLocalData.categories && typedLocalData.categories.length > 0) {
        syncResults.upload.categories = await this.syncCategories(
          userId,
          typedLocalData.categories
        );
      }

      if (
        typedLocalData.transactions &&
        typedLocalData.transactions.length > 0
      ) {
        syncResults.upload.transactions = await this.syncTransactions(
          userId,
          typedLocalData.transactions
        );
      }

      // Download updated data using Prisma
      const userData = await this.getUserData(userId);
      syncResults.download = userData;

      return syncResults;
    } catch (error) {
      throw new Error(
        `Full sync failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }
}

export const syncService = new SyncService();
export default syncService;
