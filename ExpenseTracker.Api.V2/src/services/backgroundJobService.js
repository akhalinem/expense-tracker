const { createClient } = require('@supabase/supabase-js');

class BackgroundJobService {
  constructor() {
    // Use service role key for backend operations, fallback to regular key
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
    
    if (!supabaseKey) {
      throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_KEY environment variable');
    }
    
    console.log('🔑 Using Supabase key type:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SERVICE_ROLE' : 'ANON');
    
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      supabaseKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
    this.isProcessing = false;
    this.processingInterval = null;
  }

  /**
   * Start the background job processor (OPTIMIZED)
   */
  startProcessor() {
    if (this.processingInterval) {
      console.log('🔄 Background job processor already running');
      return;
    }

    console.log('🚀 Starting OPTIMIZED background job processor...');
    this.processingInterval = setInterval(async () => {
      if (!this.isProcessing) {
        await this.processNextJob();
      }
    }, 5000); // OPTIMIZATION: Reduced frequency to every 5 seconds

    // Also process immediately
    this.processNextJob();
  }

  /**
   * Stop the background job processor
   */
  stopProcessor() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
      console.log('⏹️  Background job processor stopped');
    }
  }

  /**
   * Create a new sync job
   */
  async createSyncJob(userId, jobType, payload) {
    try {
      console.log(`📝 Creating sync job for user ${userId}, type: ${jobType}`);
      
      // Calculate total items for progress tracking
      let totalItems = 0;
      if (payload.categories) totalItems += payload.categories.length;
      if (payload.transactions) totalItems += payload.transactions.length;

      const { data, error } = await this.supabase
        .from('sync_jobs')
        .insert({
          user_id: userId,
          job_type: jobType,
          status: 'pending',
          payload: payload,
          total_items: totalItems,
          processed_items: 0,
          progress: 0
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating sync job:', error);
        throw error;
      }

      console.log(`✅ Created sync job ${data.id} for user ${userId}`);
      return data;
    } catch (error) {
      console.error('❌ Failed to create sync job:', error);
      throw error;
    }
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId, userId) {
    try {
      const { data, error } = await this.supabase
        .from('sync_jobs')
        .select('*')
        .eq('id', jobId)
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('❌ Error getting job status:', error);
        throw error;
      }

      return data; // Will be null if no job found
    } catch (error) {
      console.error('❌ Failed to get job status:', error);
      throw error;
    }
  }

  /**
   * Get user's recent jobs
   */
  async getUserJobs(userId, limit = 10) {
    try {
      const { data, error } = await this.supabase
        .from('sync_jobs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('❌ Error getting user jobs:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('❌ Failed to get user jobs:', error);
      throw error;
    }
  }

  /**
   * Process the next pending job
   */
  async processNextJob() {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;
    
    try {
      // Get the oldest pending job
      const { data: job, error } = await this.supabase
        .from('sync_jobs')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('❌ Error fetching pending jobs:', error);
        return;
      }

      if (!job) {
        // No pending jobs
        return;
      }

      console.log(`🔧 Processing job ${job.id} for user ${job.user_id}`);
      await this.processJob(job);

    } catch (error) {
      console.error('❌ Error in processNextJob:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process a specific job
   */
  async processJob(job) {
    try {
      // Mark job as processing
      await this.updateJobStatus(job.id, 'processing', {
        started_at: new Date().toISOString()
      });

      const syncService = require('./syncService');
      let results = {};

      // Create user client for this job
      // Note: For background jobs, we need to use the service role
      // since we don't have user session context
      const userClient = this.supabase;

      switch (job.job_type) {
        case 'upload':
          results = await this.processUploadJob(job, userClient, syncService);
          break;
        case 'download':
          results = await this.processDownloadJob(job, userClient, syncService);
          break;
        case 'full_sync':
          results = await this.processFullSyncJob(job, userClient, syncService);
          break;
        default:
          throw new Error(`Unknown job type: ${job.job_type}`);
      }

      // Mark job as completed
      await this.updateJobStatus(job.id, 'completed', {
        results: results,
        progress: 100,
        processed_items: job.total_items,
        completed_at: new Date().toISOString()
      });

      console.log(`✅ Job ${job.id} completed successfully`);

    } catch (error) {
      console.error(`❌ Job ${job.id} failed:`, error);
      
      // Mark job as failed
      await this.updateJobStatus(job.id, 'failed', {
        error_message: error.message,
        completed_at: new Date().toISOString()
      });
    }
  }

  /**
   * Process upload job (OPTIMIZED)
   */
  async processUploadJob(job, userClient, syncService) {
    const { categories = [], transactions = [] } = job.payload;
    const results = {
      categories: { created: 0, updated: 0, errors: [] },
      transactions: { created: 0, updated: 0, errors: [] }
    };

    let processedItems = 0;
    const startTime = Date.now();

    console.log(`🚀 [UPLOAD_JOB] Processing job ${job.id} for user ${job.user_id}`);
    console.log(`📊 [UPLOAD_JOB] Payload: ${categories.length} categories, ${transactions.length} transactions`);

    // Process categories FIRST and SEPARATELY
    if (categories.length > 0) {
      console.log(`📁 [UPLOAD_JOB] Processing ${categories.length} categories for job ${job.id}`);
      const catStartTime = Date.now();
      
      try {
        results.categories = await syncService.syncCategories(job.user_id, categories, userClient);
        processedItems += categories.length;
        
        const catDuration = Date.now() - catStartTime;
        console.log(`✅ [UPLOAD_JOB] Categories completed in ${catDuration}ms:`, results.categories);
        
        // Update progress after category batch
        await this.updateJobProgress(job.id, processedItems, job.total_items);
      } catch (error) {
        console.error(`❌ [UPLOAD_JOB] Category sync failed for job ${job.id}:`, error);
        // Add error to results but continue with transactions
        results.categories.errors.push({
          category: 'ALL_CATEGORIES',
          error: error.message
        });
        processedItems += categories.length; // Still count as processed for progress
        await this.updateJobProgress(job.id, processedItems, job.total_items);
      }
    }

    // Process transactions with optimized batching
    if (transactions.length > 0) {
      console.log(`💰 [UPLOAD_JOB] Processing ${transactions.length} transactions for job ${job.id}`);
      const transStartTime = Date.now();
      
      try {
        // OPTIMIZATION: Process with minimal progress updates
        results.transactions = await syncService.syncTransactions(job.user_id, transactions, userClient);
        processedItems += transactions.length;
        
        const transDuration = Date.now() - transStartTime;
        console.log(`✅ [UPLOAD_JOB] Transactions completed in ${transDuration}ms:`, results.transactions);
        
        // Final progress update
        await this.updateJobProgress(job.id, processedItems, job.total_items);
      } catch (error) {
        console.error(`❌ [UPLOAD_JOB] Transaction sync failed for job ${job.id}:`, error);
        results.transactions.errors.push({
          transaction: 'ALL_TRANSACTIONS',
          error: error.message
        });
        processedItems += transactions.length; // Still count as processed for progress
        await this.updateJobProgress(job.id, processedItems, job.total_items);
      }
    }

    const totalDuration = Date.now() - startTime;
    console.log(`🎉 [UPLOAD_JOB] Upload job ${job.id} completed in ${totalDuration}ms`);
    console.log(`📈 [UPLOAD_JOB] Final results:`, JSON.stringify(results, null, 2));
    
    return { upload: results };
  }

  /**
   * Process download job
   */
  async processDownloadJob(job, userClient, syncService) {
    console.log(`📥 Processing download for job ${job.id}`);
    
    const userData = await syncService.getUserData(job.user_id);
    
    await this.updateJobProgress(job.id, job.total_items, job.total_items);
    
    return { download: userData };
  }

  /**
   * Process full sync job
   */
  async processFullSyncJob(job, userClient, syncService) {
    console.log(`🔄 Processing full sync for job ${job.id}`);
    
    // First upload
    const uploadResults = await this.processUploadJob(job, userClient, syncService);
    
    // Then download
    const downloadResults = await this.processDownloadJob(job, userClient, syncService);
    
    return {
      upload: uploadResults.upload,
      download: downloadResults.download
    };
  }

  /**
   * Update job status
   */
  async updateJobStatus(jobId, status, additionalFields = {}) {
    try {
      const updateData = {
        status,
        updated_at: new Date().toISOString(),
        ...additionalFields
      };

      const { error } = await this.supabase
        .from('sync_jobs')
        .update(updateData)
        .eq('id', jobId);

      if (error) {
        console.error(`❌ Error updating job ${jobId} status:`, error);
        throw error;
      }

      console.log(`📊 Job ${jobId} status updated to: ${status}`);
    } catch (error) {
      console.error(`❌ Failed to update job ${jobId} status:`, error);
      throw error;
    }
  }

  /**
   * Update job progress
   */
  async updateJobProgress(jobId, processedItems, totalItems) {
    try {
      const progress = totalItems > 0 ? Math.round((processedItems / totalItems) * 100) : 0;
      
      await this.updateJobStatus(jobId, 'processing', {
        processed_items: processedItems,
        progress: progress
      });

      console.log(`📈 Job ${jobId} progress: ${processedItems}/${totalItems} (${progress}%)`);
    } catch (error) {
      console.error(`❌ Failed to update job ${jobId} progress:`, error);
    }
  }

  /**
   * Clean up old completed jobs (optional maintenance)
   */
  async cleanupOldJobs(daysOld = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const { error } = await this.supabase
        .from('sync_jobs')
        .delete()
        .in('status', ['completed', 'failed'])
        .lt('completed_at', cutoffDate.toISOString());

      if (error) {
        console.error('❌ Error cleaning up old jobs:', error);
        throw error;
      }

      console.log(`🧹 Cleaned up jobs older than ${daysOld} days`);
    } catch (error) {
      console.error('❌ Failed to cleanup old jobs:', error);
    }
  }
}

// Create singleton instance
const backgroundJobService = new BackgroundJobService();

module.exports = backgroundJobService;