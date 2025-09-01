import { api } from './api';
import { db } from './db';
import {
  categoriesTable,
  transactionsTable,
  transactionCategoriesTable,
  transactionTypesTable,
} from '~/db/schema';
import { eq, desc } from 'drizzle-orm';
import { Category, Transaction, TransactionTypeEnum } from '~/types';

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

class SyncService {
  private baseUrl: string;

  constructor() {
    // Use a default URL since process.env is not available in React Native
    this.baseUrl = 'http://localhost:3000';
  }

  /**
   * Get all local data from SQLite database
   */
  async getLocalData() {
    try {
      // Get all categories
      const categories = await db.query.categories.findMany();

      // Get all transactions with their related data
      const transactions = await db.query.transactions.findMany({
        with: {
          transactionCategories: {
            with: {
              category: true,
            },
          },
          transactionType: true,
        },
      });

      // Transform data to match API expectations
      const formattedCategories = categories.map((cat: any) => ({
        name: cat.name,
        color: cat.color || '#000000',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      const formattedTransactions = transactions.map((trans: any) => ({
        amount: parseFloat(trans.amount?.toString() || '0'),
        description: trans.description || '',
        date: trans.date || new Date().toISOString().split('T')[0],
        type: trans.transactionType?.name === 'Income' ? 'income' : 'expense',
        categories:
          trans.transactionCategories?.map((tc: any) => tc.category.name) || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      return {
        categories: formattedCategories,
        transactions: formattedTransactions,
      };
    } catch (error) {
      console.error('Error getting local data:', error);
      throw new Error(`Failed to get local data: ${(error as Error).message}`);
    }
  }

  /**
   * Upload local data to Supabase
   */
  async uploadData(): Promise<SyncResults> {
    try {
      const localData = await this.getLocalData();

      const response = await api.post('/api/sync/upload', localData);

      if (response.success) {
        return {
          success: true,
          message: 'Data uploaded successfully',
          results: response.results,
        };
      } else {
        throw new Error(response.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      return {
        success: false,
        message: 'Upload failed',
        error: (error as Error).message,
      };
    }
  }

  /**
   * Download data from Supabase
   */
  async downloadData(): Promise<SyncResults> {
    try {
      const response = await api.get('/api/sync/download');

      if (response.success) {
        return {
          success: true,
          message: 'Data downloaded successfully',
          results: {
            upload: {
              categories: { created: 0, updated: 0, errors: [] },
              transactions: { created: 0, updated: 0, errors: [] },
            },
            download: response.data,
            timestamp: response.timestamp,
          },
        };
      } else {
        throw new Error(response.message || 'Download failed');
      }
    } catch (error) {
      console.error('Download error:', error);
      return {
        success: false,
        message: 'Download failed',
        error: (error as Error).message,
      };
    }
  }

  /**
   * Perform full sync (upload then download)
   */
  async fullSync(): Promise<SyncResults> {
    try {
      const localData = await this.getLocalData();

      const response = await api.post('/api/sync/full', localData);

      if (response.success) {
        // Update local database with downloaded data
        await this.updateLocalDatabase(response.results.download);

        return {
          success: true,
          message: 'Sync completed successfully',
          results: response.results,
        };
      } else {
        throw new Error(response.message || 'Sync failed');
      }
    } catch (error) {
      console.error('Full sync error:', error);
      return {
        success: false,
        message: 'Sync failed',
        error: (error as Error).message,
      };
    }
  }

  /**
   * Get sync status from server
   */
  async getSyncStatus(): Promise<{
    success: boolean;
    status?: SyncStatus;
    error?: string;
  }> {
    try {
      const response = await api.get('/api/sync/status');

      if (response.success) {
        return {
          success: true,
          status: response.status,
        };
      } else {
        throw new Error(response.message || 'Failed to get sync status');
      }
    } catch (error) {
      console.error('Sync status error:', error);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Update local database with downloaded data
   */
  private async updateLocalDatabase(downloadedData: {
    categories: any[];
    transactions: any[];
  }) {
    try {
      const { categories, transactions } = downloadedData;

      // Note: This is a simple implementation. In production, you might want
      // to implement a more sophisticated merge strategy to avoid data loss

      // Clear existing data
      await db.delete(transactionCategoriesTable);
      await db.delete(transactionsTable);
      await db.delete(categoriesTable);

      // Insert categories
      if (categories && categories.length > 0) {
        const categoryInserts = categories.map((cat: any) => ({
          name: cat.name,
          color: cat.color || '#000000',
        }));

        await db.insert(categoriesTable).values(categoryInserts);
      }

      // Get transaction types (assuming they exist)
      const incomeType = await db.query.transactionTypes.findFirst({
        where: eq(transactionTypesTable.name, 'Income'),
      });

      const expenseType = await db.query.transactionTypes.findFirst({
        where: eq(transactionTypesTable.name, 'Expense'),
      });

      // Get updated categories with their IDs
      const localCategories = await db.query.categories.findMany();
      const categoryMap = new Map(
        localCategories.map((cat: any) => [cat.name, cat.id])
      );

      // Insert transactions
      if (transactions && transactions.length > 0) {
        for (const trans of transactions) {
          const typeId =
            trans.type === 'income' ? incomeType?.id : expenseType?.id;

          if (typeId) {
            const [insertedTransaction] = await db
              .insert(transactionsTable)
              .values({
                typeId: typeId,
                amount: trans.amount,
                description: trans.description || '',
                date: trans.date,
              })
              .returning({ id: transactionsTable.id });

            // Link transaction to categories
            if (trans.categories && trans.categories.length > 0) {
              const categoryLinks = trans.categories
                .map((catName: string) => categoryMap.get(catName))
                .filter(Boolean)
                .map((categoryId: number) => ({
                  transactionId: insertedTransaction.id,
                  categoryId: categoryId,
                }));

              if (categoryLinks.length > 0) {
                await db
                  .insert(transactionCategoriesTable)
                  .values(categoryLinks);
              }
            }
          }
        }
      }

      console.log('Local database updated successfully');
    } catch (error) {
      console.error('Error updating local database:', error);
      throw error;
    }
  }

  /**
   * Get local sync statistics
   */
  async getLocalStats() {
    try {
      const categories = await db.query.categories.findMany();
      const transactions = await db.query.transactions.findMany();

      const lastTransaction = await db.query.transactions.findFirst({
        orderBy: desc(transactionsTable.id),
      });

      return {
        categoriesCount: categories.length,
        transactionsCount: transactions.length,
        lastModified: lastTransaction ? new Date().toISOString() : null,
      };
    } catch (error) {
      console.error('Error getting local stats:', error);
      return {
        categoriesCount: 0,
        transactionsCount: 0,
        lastModified: null,
      };
    }
  }
}

export const syncService = new SyncService();
