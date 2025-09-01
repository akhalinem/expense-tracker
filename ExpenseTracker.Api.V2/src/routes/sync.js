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
  try {
    const userId = req.user.id;
    const { categories = [], transactions = [] } = req.body;

    const results = {
      categories: { created: 0, updated: 0, errors: [] },
      transactions: { created: 0, updated: 0, errors: [] }
    };

    // Sync categories
    if (categories.length > 0) {
      results.categories = await syncService.syncCategories(userId, categories);
    }

    // Sync transactions
    if (transactions.length > 0) {
      results.transactions = await syncService.syncTransactions(userId, transactions);
    }

    res.json({
      success: true,
      message: 'Data uploaded successfully',
      results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Upload sync error:', error);
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

    // Get counts from Supabase
    const { data: categoryCount } = await syncService.supabase
      .from('categories')
      .select('id', { count: 'exact' })
      .eq('user_id', userId);

    const { data: transactionCount } = await syncService.supabase
      .from('transactions')
      .select('id', { count: 'exact' })
      .eq('user_id', userId);

    // Get last updated timestamp
    const { data: lastUpdated } = await syncService.supabase
      .from('transactions')
      .select('updated_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    res.json({
      success: true,
      status: {
        categoriesCount: categoryCount?.length || 0,
        transactionsCount: transactionCount?.length || 0,
        lastSync: lastUpdated?.updated_at || null,
        serverTime: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Sync status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get sync status',
      error: error.message
    });
  }
});

module.exports = router;
