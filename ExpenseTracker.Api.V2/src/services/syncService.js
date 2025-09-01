const { supabaseClient } = require('../config/supabase');

class SyncService {
  constructor() {
    this.supabase = supabaseClient;
  }

  /**
   * Sync categories from mobile app to Supabase
   */
  async syncCategories(userId, categories) {
    try {
      const results = {
        created: 0,
        updated: 0,
        errors: []
      };

      for (const category of categories) {
        try {
          // Check if category already exists
          const { data: existing } = await this.supabase
            .from('categories')
            .select('id, updated_at')
            .eq('user_id', userId)
            .eq('name', category.name)
            .single();

          if (existing) {
            // Update existing category if mobile version is newer
            const mobileUpdatedAt = new Date(category.updated_at || category.created_at);
            const supabaseUpdatedAt = new Date(existing.updated_at);

            if (mobileUpdatedAt > supabaseUpdatedAt) {
              const { error } = await this.supabase
                .from('categories')
                .update({
                  color: category.color || '#000000',
                  updated_at: new Date().toISOString()
                })
                .eq('id', existing.id);

              if (error) throw error;
              results.updated++;
            }
          } else {
            // Create new category
            const { error } = await this.supabase
              .from('categories')
              .insert({
                user_id: userId,
                name: category.name,
                color: category.color || '#000000'
              });

            if (error) throw error;
            results.created++;
          }
        } catch (error) {
          results.errors.push({
            category: category.name,
            error: error.message
          });
        }
      }

      return results;
    } catch (error) {
      throw new Error(`Category sync failed: ${error.message}`);
    }
  }

  /**
   * Sync transactions from mobile app to Supabase
   */
  async syncTransactions(userId, transactions) {
    try {
      const results = {
        created: 0,
        updated: 0,
        errors: []
      };

      for (const transaction of transactions) {
        try {
          // Check if transaction already exists (by mobile ID or unique combination)
          const { data: existing } = await this.supabase
            .from('transactions')
            .select('id, updated_at')
            .eq('user_id', userId)
            .eq('amount', transaction.amount)
            .eq('description', transaction.description || '')
            .eq('date', transaction.date)
            .eq('type', transaction.type)
            .single();

          if (existing) {
            // Update existing transaction if mobile version is newer
            const mobileUpdatedAt = new Date(transaction.updated_at || transaction.created_at);
            const supabaseUpdatedAt = new Date(existing.updated_at);

            if (mobileUpdatedAt > supabaseUpdatedAt) {
              const { error } = await this.supabase
                .from('transactions')
                .update({
                  amount: transaction.amount,
                  description: transaction.description,
                  date: transaction.date,
                  type: transaction.type,
                  updated_at: new Date().toISOString()
                })
                .eq('id', existing.id);

              if (error) throw error;

              // Sync transaction categories
              await this.syncTransactionCategories(existing.id, transaction.categories || []);
              results.updated++;
            }
          } else {
            // Create new transaction
            const { data: newTransaction, error } = await this.supabase
              .from('transactions')
              .insert({
                user_id: userId,
                amount: transaction.amount,
                description: transaction.description,
                date: transaction.date,
                type: transaction.type
              })
              .select('id')
              .single();

            if (error) throw error;

            // Sync transaction categories
            if (transaction.categories && transaction.categories.length > 0) {
              await this.syncTransactionCategories(newTransaction.id, transaction.categories);
            }

            results.created++;
          }
        } catch (error) {
          results.errors.push({
            transaction: `${transaction.description} - ${transaction.amount}`,
            error: error.message
          });
        }
      }

      return results;
    } catch (error) {
      throw new Error(`Transaction sync failed: ${error.message}`);
    }
  }

  /**
   * Sync transaction categories (many-to-many relationship)
   */
  async syncTransactionCategories(transactionId, categoryNames) {
    try {
      // First, get category IDs from names
      if (!categoryNames || categoryNames.length === 0) return;

      const { data: categories, error: categoryError } = await this.supabase
        .from('categories')
        .select('id, name')
        .in('name', categoryNames);

      if (categoryError) throw categoryError;

      // Delete existing associations
      const { error: deleteError } = await this.supabase
        .from('transaction_categories')
        .delete()
        .eq('transaction_id', transactionId);

      if (deleteError) throw deleteError;

      // Create new associations
      if (categories && categories.length > 0) {
        const associations = categories.map(category => ({
          transaction_id: transactionId,
          category_id: category.id
        }));

        const { error: insertError } = await this.supabase
          .from('transaction_categories')
          .insert(associations);

        if (insertError) throw insertError;
      }
    } catch (error) {
      throw new Error(`Transaction categories sync failed: ${error.message}`);
    }
  }

  /**
   * Get all user data from Supabase (for downloading to mobile)
   */
  async getUserData(userId) {
    try {
      // Get categories
      const { data: categories, error: categoriesError } = await this.supabase
        .from('categories')
        .select('*')
        .eq('user_id', userId)
        .order('created_at');

      if (categoriesError) throw categoriesError;

      // Get transactions with categories
      const { data: transactions, error: transactionsError } = await this.supabase
        .from('transactions')
        .select(`
          *,
          transaction_categories (
            categories (
              name,
              color
            )
          )
        `)
        .eq('user_id', userId)
        .order('created_at');

      if (transactionsError) throw transactionsError;

      // Transform transactions to include category names
      const transformedTransactions = transactions.map(transaction => ({
        ...transaction,
        categories: transaction.transaction_categories.map(tc => tc.categories.name)
      }));

      return {
        categories,
        transactions: transformedTransactions
      };
    } catch (error) {
      throw new Error(`Failed to get user data: ${error.message}`);
    }
  }

  /**
   * Complete sync operation (both upload and download)
   */
  async fullSync(userId, localData) {
    try {
      const syncResults = {
        upload: {
          categories: { created: 0, updated: 0, errors: [] },
          transactions: { created: 0, updated: 0, errors: [] }
        },
        download: {
          categories: [],
          transactions: []
        },
        timestamp: new Date().toISOString()
      };

      // Upload local data to Supabase
      if (localData.categories && localData.categories.length > 0) {
        syncResults.upload.categories = await this.syncCategories(userId, localData.categories);
      }

      if (localData.transactions && localData.transactions.length > 0) {
        syncResults.upload.transactions = await this.syncTransactions(userId, localData.transactions);
      }

      // Download updated data from Supabase
      const userData = await this.getUserData(userId);
      syncResults.download = userData;

      return syncResults;
    } catch (error) {
      throw new Error(`Full sync failed: ${error.message}`);
    }
  }
}

module.exports = new SyncService();
