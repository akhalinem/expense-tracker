const express = require('express');
const syncService = require('../services/syncService');
const { authenticate } = require('../middleware/auth');
const { validateSync } = require('../middleware/validation');

const router = express.Router();

/**
 * POST /api/sync/upload
 * Upload local data to Supabase
 */
router.post('/upload', authenticate, validateSync, async (req, res) => {
  const startTime = Date.now();
  try {
    const userId = req.user.id;
    const userToken = req.token;
    const { categories = [], transactions = [] } = req.body;

    console.log(`🚀 [UPLOAD] Started for user ${userId}`);
    console.log(`🔑 [UPLOAD] User token present: ${!!userToken}`);
    console.log(`📊 [UPLOAD] Payload: ${categories.length} categories, ${transactions.length} transactions`);
    console.log(`📦 [UPLOAD] Request size: ${JSON.stringify(req.body).length} characters`);

    // Create a user-specific Supabase client with proper auth context
    const userClient = syncService.createUserClient(userToken);
    console.log(`🔑 [UPLOAD] Created user-specific Supabase client`);

    const results = {
      categories: { created: 0, updated: 0, errors: [] },
      transactions: { created: 0, updated: 0, errors: [] }
    };

    // Sync categories
    if (categories.length > 0) {
      console.log(`📁 [UPLOAD] Processing ${categories.length} categories...`);
      const categoryStartTime = Date.now();
      
      results.categories = await syncService.syncCategories(userId, categories, userClient);
      
      const categoryDuration = Date.now() - categoryStartTime;
      console.log(`✅ [UPLOAD] Categories processed in ${categoryDuration}ms:`, results.categories);
    }

    // Sync transactions
    if (transactions.length > 0) {
      console.log(`💰 [UPLOAD] Processing ${transactions.length} transactions...`);
      const transactionStartTime = Date.now();
      
      results.transactions = await syncService.syncTransactions(userId, transactions, userClient);
      
      const transactionDuration = Date.now() - transactionStartTime;
      console.log(`✅ [UPLOAD] Transactions processed in ${transactionDuration}ms:`, results.transactions);
    }

    const totalDuration = Date.now() - startTime;
    console.log(`🎉 [UPLOAD] Completed successfully in ${totalDuration}ms`);

    res.json({
      success: true,
      message: 'Data uploaded successfully',
      results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const totalDuration = Date.now() - startTime;
    console.error(`❌ [UPLOAD] Failed after ${totalDuration}ms:`, error);
    res.status(500).json({
      success: false,
      message: 'Upload sync failed',
      error: error.message
    });
  }
});

/**
 * GET /api/sync/download
 * Download all user data from Supabase
 */
router.get('/download', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const userData = await syncService.getUserData(userId);

    res.json({
      success: true,
      message: 'Data downloaded successfully',
      data: userData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Download sync error:', error);
    res.status(500).json({
      success: false,
      message: 'Download sync failed',
      error: error.message
    });
  }
});

/**
 * POST /api/sync/full
 * Complete sync operation (upload local data, then download updated data)
 */
router.post('/full', authenticate, validateSync, async (req, res) => {
  try {
    const userId = req.user.id;
    const localData = req.body;

    const syncResults = await syncService.fullSync(userId, localData);

    res.json({
      success: true,
      message: 'Full sync completed successfully',
      results: syncResults
    });

  } catch (error) {
    console.error('Full sync error:', error);
    res.status(500).json({
      success: false,
      message: 'Full sync failed',
      error: error.message
    });
  }
});

/**
 * GET /api/sync/status
 * Get sync status and last sync timestamp
 */
router.get('/status', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`📊 [SYNC_STATUS] Getting status for user ${userId}`);

    // Get counts from Supabase using proper count queries
    const { count: categoryCount, error: categoryError } = await syncService.supabase
      .from('categories')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (categoryError) {
      console.error('❌ [SYNC_STATUS] Category count error:', categoryError);
      throw categoryError;
    }

    console.log(`📁 [SYNC_STATUS] Found ${categoryCount || 0} categories for user ${userId}`);

    const { count: transactionCount, error: transactionError } = await syncService.supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (transactionError) {
      console.error('❌ [SYNC_STATUS] Transaction count error:', transactionError);
      throw transactionError;
    }

    console.log(`💰 [SYNC_STATUS] Found ${transactionCount || 0} transactions for user ${userId}`);

    // Get last updated timestamp (handle case where no transactions exist)
    const { data: lastUpdated, error: lastUpdatedError } = await syncService.supabase
      .from('transactions')
      .select('updated_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Don't throw error if no transactions exist, just log warning
    if (lastUpdatedError && lastUpdatedError.code !== 'PGRST116') {
      console.warn('⚠️ [SYNC_STATUS] Last updated query error:', lastUpdatedError);
    }

    const statusResponse = {
      categoriesCount: categoryCount || 0,
      transactionsCount: transactionCount || 0,
      lastSync: lastUpdated?.updated_at || null,
      serverTime: new Date().toISOString()
    };

    console.log(`✅ [SYNC_STATUS] Returning status for user ${userId}:`, statusResponse);

    res.json({
      success: true,
      status: statusResponse
    });

  } catch (error) {
    console.error('❌ [SYNC_STATUS] Error for user', req.user?.id, ':', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get sync status',
      error: error.message
    });
  }
});

module.exports = router;
