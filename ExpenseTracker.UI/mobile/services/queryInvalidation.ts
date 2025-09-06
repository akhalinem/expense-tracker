import { QueryClient } from '@tanstack/react-query';

/**
 * Query Invalidation Service
 *
 * Centralized service for invalidating React Query cache after data operations.
 * Used after sync operations and local imports to ensure UI shows fresh data.
 *
 * ⚠️  MAINTENANCE REQUIREMENT:
 * When adding NEW REACT QUERY KEYS to the app, you MUST update the QUERY_KEYS
 * constant below to ensure they are properly invalidated after sync/import operations.
 *
 * This prevents stale data from showing in the UI after major data changes.
 *
 * HOW TO MAINTAIN:
 * 1. When you add a new useQuery hook with a unique queryKey
 * 2. Add that queryKey to the QUERY_KEYS constant below
 * 3. Consider if it needs specific invalidation methods or just the global invalidation
 *
 * CURRENT QUERY KEYS COVERED:
 * - categories: Category lists and details
 * - categoriesWithTransactionsCount: Categories with transaction counts
 * - transactions: All transaction data
 * - recordings: Voice recordings
 * - expenseSuggestions: Expense suggestion data
 */

// Define all query keys used in the app - MUST match actual queryKey values
export const QUERY_KEYS = {
  // Categories
  CATEGORIES: ['categories'],
  CATEGORIES_WITH_TRANSACTION_COUNT: ['categoriesWithTransactionsCount'], // Matches actual usage
  CATEGORY: ['category'], // For individual category queries like ['category', id]

  // Transactions
  TRANSACTIONS: ['transactions'],
  TRANSACTION: ['transaction'], // For individual transaction queries like ['transaction', id]

  // Voice recordings
  VOICE_RECORDINGS: ['voiceRecordings'], // Matches actual usage

  // Suggestions
  EXPENSE_SUGGESTIONS: ['expenseSuggestions'],

  // Add other query keys as they're discovered
  // TODO: When adding new query keys to the app, add them here!
  // Examples: ['budgets'], ['settings'], ['analytics'], etc.
} as const;

export class QueryInvalidationService {
  private queryClient: QueryClient | null = null;

  /**
   * Initialize the service with a QueryClient instance
   */
  setQueryClient(queryClient: QueryClient): void {
    this.queryClient = queryClient;
  }

  /**
   * Get the current QueryClient instance
   */
  getQueryClient(): QueryClient | null {
    return this.queryClient;
  }

  /**
   * Invalidate all queries in the app
   * Use this after major data operations like sync or import
   *
   * ⚠️  IMPORTANT: This method calls queryClient.invalidateQueries() without
   * specific keys, which invalidates ALL queries. This is the safest approach
   * for ensuring data consistency after major operations like sync/import.
   *
   * If you need more granular control, use the specific invalidation methods below.
   */
  async invalidateAllQueries(): Promise<void> {
    if (!this.queryClient) {
      console.warn('QueryClient not initialized. Call setQueryClient first.');
      return;
    }

    console.log('🔄 Invalidating all queries...');
    console.log(
      '📊 Current query cache keys:',
      this.queryClient
        .getQueryCache()
        .getAll()
        .map((query) => query.queryKey)
    );

    try {
      // Force invalidation of ALL queries - this ensures complete data refresh
      await this.queryClient.invalidateQueries();

      console.log('✅ All queries invalidated successfully');
      console.log(
        '🔍 Queries after invalidation:',
        this.queryClient
          .getQueryCache()
          .getAll()
          .map((query) => ({
            key: query.queryKey,
            state: query.state.status,
            isStale: query.isStale(),
          }))
      );
    } catch (error) {
      console.error('❌ Failed to invalidate queries:', error);
    }
  }

  /**
   * Invalidate specific query categories
   */
  async invalidateCategories(): Promise<void> {
    if (!this.queryClient) {
      console.warn('QueryClient not initialized. Call setQueryClient first.');
      return;
    }

    console.log('🔄 Invalidating categories queries...');

    try {
      await Promise.all([
        this.queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CATEGORIES }),
        this.queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.CATEGORIES_WITH_TRANSACTION_COUNT,
        }),
        this.queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CATEGORY }), // Individual category queries
      ]);
      console.log('✅ Categories queries invalidated successfully');
    } catch (error) {
      console.error('❌ Failed to invalidate categories queries:', error);
    }
  }

  /**
   * Invalidate transaction-related queries
   */
  async invalidateTransactions(): Promise<void> {
    if (!this.queryClient) {
      console.warn('QueryClient not initialized. Call setQueryClient first.');
      return;
    }

    console.log('🔄 Invalidating transactions queries...');

    try {
      await Promise.all([
        this.queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.TRANSACTIONS,
        }),
        this.queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.TRANSACTION,
        }), // Individual transaction queries
        this.queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.EXPENSE_SUGGESTIONS,
        }),
        this.queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.CATEGORIES_WITH_TRANSACTION_COUNT,
        }), // Categories count depends on transactions
      ]);
      console.log('✅ Transactions queries invalidated successfully');
    } catch (error) {
      console.error('❌ Failed to invalidate transactions queries:', error);
    }
  }

  /**
   * Invalidate voice recording queries
   */
  async invalidateVoiceRecordings(): Promise<void> {
    if (!this.queryClient) {
      console.warn('QueryClient not initialized. Call setQueryClient first.');
      return;
    }

    console.log('🔄 Invalidating voice recordings queries...');

    try {
      await this.queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.VOICE_RECORDINGS,
      });
      console.log('✅ Voice recordings queries invalidated successfully');
    } catch (error) {
      console.error('❌ Failed to invalidate voice recordings queries:', error);
    }
  }

  /**
   * Invalidate specific queries by key
   */
  async invalidateQuery(queryKey: readonly unknown[]): Promise<void> {
    if (!this.queryClient) {
      console.warn('QueryClient not initialized. Call setQueryClient first.');
      return;
    }

    console.log(`🔄 Invalidating query: ${JSON.stringify(queryKey)}`);

    try {
      await this.queryClient.invalidateQueries({ queryKey });
      console.log(
        `✅ Query ${JSON.stringify(queryKey)} invalidated successfully`
      );
    } catch (error) {
      console.error(
        `❌ Failed to invalidate query ${JSON.stringify(queryKey)}:`,
        error
      );
    }
  }

  /**
   * Clear all queries and refetch
   * Use this for complete data refresh scenarios
   */
  async clearAndRefetch(): Promise<void> {
    if (!this.queryClient) {
      console.warn('QueryClient not initialized. Call setQueryClient first.');
      return;
    }

    console.log('🔄 Clearing and refetching all queries...');

    try {
      await this.queryClient.clear();
      console.log('✅ All queries cleared and will refetch on next use');
    } catch (error) {
      console.error('❌ Failed to clear queries:', error);
    }
  }

  /**
   * Convenience method for post-sync invalidation
   * Invalidates all data-related queries after sync operations
   */
  async invalidateAfterSync(): Promise<void> {
    console.log('🔄 Post-sync query invalidation...');
    await this.invalidateAllQueries();
  }

  /**
   * Convenience method for post-import invalidation
   * Invalidates all data-related queries after local data import
   */
  async invalidateAfterImport(): Promise<void> {
    console.log('🔄 Post-import query invalidation...');

    // Use global invalidation for imports to ensure everything refreshes
    // This is more aggressive but ensures no stale data remains
    await this.invalidateAllQueries();

    console.log('✅ Post-import query invalidation completed');
  }
}

// Create and export singleton instance
export const queryInvalidationService = new QueryInvalidationService();
