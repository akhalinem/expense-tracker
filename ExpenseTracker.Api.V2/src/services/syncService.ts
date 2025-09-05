import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { ISyncResult, ICategory, ITransaction } from "../types";
import { supabaseClient } from "../config/supabase";

class SyncService {
  public supabase: SupabaseClient;

  constructor() {
    this.supabase = supabaseClient;
  }

  /**
   * Log performance metrics for monitoring
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
      // Use service role client for performance logging
      const serviceClient = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY!,
        {
          auth: { autoRefreshToken: false, persistSession: false },
        }
      );

      await serviceClient.from("sync_performance_stats").insert({
        user_id: userId,
        operation_type: operationType,
        item_count: itemCount,
        duration_ms: durationMs,
        created_items: created,
        updated_items: updated,
        error_count: errorCount,
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
   * Sync categories using Supabase's built-in upsert
   */
  async syncCategories(
    userId: string,
    categories: ICategory[],
    userClient: SupabaseClient | null = null
  ): Promise<ISyncResult> {
    const client = userClient || this.supabase;

    try {
      console.log(
        `📁 [SYNC_CATEGORIES] Starting upsert sync for ${categories.length} categories (User: ${userId})`
      );
      const startTime = Date.now();

      if (categories.length === 0) {
        return { created: 0, updated: 0, errors: [] };
      }

      // Prepare data for upsert
      const categoriesToSync = categories.map((cat) => ({
        user_id: userId,
        name: cat.name,
        color: cat.color || "#000000",
      }));

      console.log(
        `📁 [SYNC_CATEGORIES] Upserting ${categoriesToSync.length} categories...`
      );

      // Let Supabase handle duplicates automatically with upsert!
      const { data, error } = await client
        .from("categories")
        .upsert(categoriesToSync, {
          onConflict: "user_id,name", // Use existing unique constraint
          ignoreDuplicates: false, // Update existing records
        })
        .select("id, created_at, updated_at");

      if (error) {
        console.error(`❌ [SYNC_CATEGORIES] Upsert error:`, error);
        throw error;
      }

      // Simple way to distinguish created vs updated
      const now = new Date();
      const createdCount =
        data?.filter((item) => {
          const createdAt = new Date(item.created_at);
          const updatedAt = new Date(item.updated_at);
          // If created and updated timestamps are very close, it's a new record
          return Math.abs(createdAt.getTime() - updatedAt.getTime()) < 1000;
        }).length || 0;

      const results = {
        created: createdCount,
        updated: (data?.length || 0) - createdCount,
        errors: [],
      };

      const duration = Date.now() - startTime;
      console.log(
        `✅ [SYNC_CATEGORIES] sync completed in ${duration}ms: ${results.created} created, ${results.updated} updated`
      );

      // Log performance metrics
      await this.logPerformanceMetrics(
        userId,
        "category_upsert",
        categories.length,
        duration,
        results.created,
        results.updated,
        0
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
   * Sync transactions using Supabase's built-in upsert
   */
  async syncTransactions(
    userId: string,
    transactions: ITransaction[],
    userClient: SupabaseClient | null = null
  ): Promise<ISyncResult> {
    const client = userClient || this.supabase;

    try {
      console.log(
        `💰 [SYNC_TRANSACTIONS] Starting upsert sync for ${transactions.length} transactions (User: ${userId})`
      );
      const startTime = Date.now();

      if (transactions.length === 0) {
        return { created: 0, updated: 0, errors: [] };
      }

      // Prepare data for upsert
      const transactionsToSync = transactions.map((trans) => ({
        user_id: userId,
        amount: trans.amount,
        description: trans.description || "",
        date: trans.date,
        type: trans.type,
      }));

      console.log(
        `💰 [SYNC_TRANSACTIONS] Inserting ${transactionsToSync.length} transactions...`
      );

      // Use regular insert - let database handle constraint violations
      const { data, error } = await client
        .from("transactions")
        .insert(transactionsToSync)
        .select("id, created_at, updated_at");

      if (error) {
        console.error(`❌ [SYNC_TRANSACTIONS] Upsert error:`, error);
        throw error;
      }

      // Handle category associations for all transactions using BATCH processing (OPTIMIZED)
      console.log(
        `💰 [SYNC_TRANSACTIONS] Processing categories for ${data?.length || 0} transactions in batch...`
      );
      if (data?.length > 0) {
        // Prepare batch data for category processing
        const transactionCategoryData = [];
        for (let i = 0; i < transactions.length && i < data.length; i++) {
          if (
            transactions[i]?.categories?.length &&
            transactions[i]?.categories!.length > 0
          ) {
            transactionCategoryData.push({
              transactionId: data[i].id,
              categoryNames: transactions[i].categories,
            });
          }
        }

        // Process all transaction categories in one batch
        if (transactionCategoryData.length > 0) {
          try {
            await this.syncTransactionCategoriesBatch(
              transactionCategoryData,
              client
            );
            console.log(
              `✅ [SYNC_TRANSACTIONS] Batch category processing completed for ${transactionCategoryData.length} transactions`
            );
          } catch (error) {
            console.warn(
              `⚠️ [SYNC_TRANSACTIONS] Batch category sync failed:`,
              error
            );
            // Don't fail the whole sync for category issues, but log the error
          }
        }
      }

      // Simple way to distinguish created vs updated
      const now = new Date();
      const createdCount =
        data?.filter((item) => {
          const createdAt = new Date(item.created_at);
          const updatedAt = new Date(item.updated_at);
          // If created and updated timestamps are very close, it's a new record
          return Math.abs(createdAt.getTime() - updatedAt.getTime()) < 1000;
        }).length || 0;

      const results = {
        created: createdCount,
        updated: (data?.length || 0) - createdCount,
        errors: [],
      };

      const duration = Date.now() - startTime;
      console.log(
        `✅ [SYNC_TRANSACTIONS] sync completed in ${duration}ms: ${results.created} created, ${results.updated} updated`
      );

      // Log performance metrics
      await this.logPerformanceMetrics(
        userId,
        "transaction_upsert",
        transactions.length,
        duration,
        results.created,
        results.updated,
        0
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
   * Sync transaction categories in batch (OPTIMIZED)
   */
  async syncTransactionCategoriesBatch(
    transactionData: unknown[],
    userClient: SupabaseClient | null = null
  ): Promise<void> {
    const client = userClient || this.supabase;

    try {
      console.log(
        `🔗 [SYNC_TRANSACTION_CATEGORIES_BATCH] Processing categories for ${transactionData.length} transactions...`
      );
      const startTime = Date.now();

      // Type guard for transaction data
      const typedTransactionData = transactionData as Array<{
        transactionId: string;
        categoryNames?: string[];
      }>;

      // Collect all unique category names from all transactions
      const allCategoryNames = new Set();
      typedTransactionData.forEach(({ categoryNames }) => {
        if (categoryNames && categoryNames.length > 0) {
          categoryNames.forEach((name: string) => allCategoryNames.add(name));
        }
      });

      if (allCategoryNames.size === 0) {
        console.log(
          `🔗 [SYNC_TRANSACTION_CATEGORIES_BATCH] No categories to process`
        );
        return;
      }

      console.log(
        `🔗 [SYNC_TRANSACTION_CATEGORIES_BATCH] Found ${allCategoryNames.size} unique categories`
      );

      // Get all category IDs in one query
      const { data: categories, error: categoryError } = await client
        .from("categories")
        .select("id, name")
        .in("name", Array.from(allCategoryNames));

      if (categoryError) throw categoryError;

      // Create name-to-id mapping
      const categoryNameToIdMap = new Map();
      categories?.forEach((cat) => {
        categoryNameToIdMap.set(cat.name, cat.id);
      });

      console.log(
        `🔗 [SYNC_TRANSACTION_CATEGORIES_BATCH] Mapped ${categoryNameToIdMap.size} categories`
      );

      // Collect all transaction IDs for deletion
      const transactionIds = typedTransactionData.map(
        ({ transactionId }) => transactionId
      );

      // Delete all existing associations for these transactions in one query
      if (transactionIds.length > 0) {
        const { error: deleteError } = await client
          .from("transaction_categories")
          .delete()
          .in("transaction_id", transactionIds);

        if (deleteError) throw deleteError;
        console.log(
          `🔗 [SYNC_TRANSACTION_CATEGORIES_BATCH] Deleted existing associations for ${transactionIds.length} transactions`
        );
      }

      // Prepare all associations for batch insert
      const allAssociations: unknown[] = [];
      typedTransactionData.forEach(({ transactionId, categoryNames }) => {
        if (categoryNames && categoryNames.length > 0) {
          categoryNames.forEach((categoryName: string) => {
            const categoryId = categoryNameToIdMap.get(categoryName);
            if (categoryId) {
              allAssociations.push({
                transaction_id: transactionId,
                category_id: categoryId,
              });
            } else {
              console.warn(
                `⚠️ [SYNC_TRANSACTION_CATEGORIES_BATCH] Category not found: ${categoryName}`
              );
            }
          });
        }
      });

      // Insert all associations in one batch
      if (allAssociations.length > 0) {
        const { error: insertError } = await client
          .from("transaction_categories")
          .insert(allAssociations);

        if (insertError) throw insertError;

        const duration = Date.now() - startTime;
        console.log(
          `✅ [SYNC_TRANSACTION_CATEGORIES_BATCH] Inserted ${allAssociations.length} category associations in ${duration}ms`
        );
      } else {
        console.log(
          `🔗 [SYNC_TRANSACTION_CATEGORIES_BATCH] No valid category associations to insert`
        );
      }
    } catch (error) {
      console.error(`❌ [SYNC_TRANSACTION_CATEGORIES_BATCH] Error:`, error);
      throw new Error(
        `Batch transaction categories sync failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Get all user data from Supabase (for downloading to mobile)
   */
  async getUserData(
    userId: string
  ): Promise<{ categories: ICategory[]; transactions: ITransaction[] }> {
    try {
      console.log(`📥 [GET_USER_DATA] Starting data fetch for user ${userId}`);

      // Get categories
      const { data: categories, error: categoriesError } = await this.supabase
        .from("categories")
        .select("*")
        .eq("user_id", userId)
        .order("created_at");

      if (categoriesError) {
        console.error(`❌ [GET_USER_DATA] Categories error:`, categoriesError);
        throw categoriesError;
      }

      console.log(
        `📁 [GET_USER_DATA] Found ${categories?.length || 0} categories for user ${userId}`
      );

      // Get transactions with categories
      const { data: transactions, error: transactionsError } =
        await this.supabase
          .from("transactions")
          .select(
            `
          *,
          transaction_categories (
            categories (
              name,
              color
            )
          )
        `
          )
          .eq("user_id", userId)
          .order("created_at");

      if (transactionsError) {
        console.error(
          `❌ [GET_USER_DATA] Transactions error:`,
          transactionsError
        );
        throw transactionsError;
      }

      console.log(
        `💰 [GET_USER_DATA] Found ${transactions?.length || 0} transactions for user ${userId}`
      );

      // Transform transactions to include category names
      const transformedTransactions =
        transactions?.map((transaction) => ({
          ...transaction,
          categories:
            transaction.transaction_categories?.map(
              (tc: any) => tc.categories?.name
            ) || [],
        })) || [];

      const result = {
        categories: categories || [],
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

      // Upload local data to Supabase
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

      // Download updated data from Supabase
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
