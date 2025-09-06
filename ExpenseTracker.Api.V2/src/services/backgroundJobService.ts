import {
  IJob,
  ISyncResults,
  ICategory,
  ITransaction,
  ISyncResult,
} from "../types";
import syncService from "./syncService";
import { prisma } from "../config/prisma";

interface IJobUpdateFields {
  started_at?: string;
  results?: unknown;
  progress?: number;
  processed_items?: number;
  completed_at?: string;
  error_message?: string;
}

class BackgroundJobService {
  private isProcessing: boolean;
  private processingInterval: NodeJS.Timeout | null;

  constructor() {
    this.isProcessing = false;
    this.processingInterval = null;
    console.log("🔑 Background job service initialized with Prisma");
  }

  /**
   * Start the background job processor (OPTIMIZED)
   */
  startProcessor() {
    if (this.processingInterval) {
      console.log("🔄 Background job processor already running");
      return;
    }

    console.log("🚀 Starting OPTIMIZED background job processor...");
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
      console.log("⏹️  Background job processor stopped");
    }
  }

  /**
   * Create a new sync job
   */
  async createSyncJob(
    userId: string,
    jobType: string,
    payload: unknown
  ): Promise<IJob> {
    try {
      console.log(`📝 Creating sync job for user ${userId}, type: ${jobType}`);

      // Calculate total items for progress tracking
      const typedPayload = payload as {
        categories?: ICategory[];
        transactions?: ITransaction[];
      };
      let totalItems = 0;
      if (typedPayload.categories) totalItems += typedPayload.categories.length;
      if (typedPayload.transactions)
        totalItems += typedPayload.transactions.length;

      const data = await prisma.sync_jobs.create({
        data: {
          user_id: userId,
          job_type: jobType,
          status: "pending",
          payload: payload as any,
          total_items: totalItems,
          processed_items: 0,
          progress: 0,
        },
      });

      console.log(`✅ Created sync job ${data.id} for user ${userId}`);
      return data as IJob;
    } catch (error) {
      console.error("❌ Failed to create sync job:", error);
      throw error;
    }
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId: string, userId: string): Promise<IJob | null> {
    try {
      const data = await prisma.sync_jobs.findFirst({
        where: {
          id: jobId,
          user_id: userId,
        },
      });

      return data as IJob | null;
    } catch (error) {
      console.error("❌ Failed to get job status:", error);
      throw error;
    }
  }

  /**
   * Get user's recent jobs
   */
  async getUserJobs(userId: string, limit = 10): Promise<IJob[]> {
    try {
      const data = await prisma.sync_jobs.findMany({
        where: { user_id: userId },
        orderBy: { created_at: "desc" },
        take: limit,
      });

      return data as IJob[];
    } catch (error) {
      console.error("❌ Failed to get user jobs:", error);
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
      const job = await prisma.sync_jobs.findFirst({
        where: { status: "pending" },
        orderBy: { created_at: "asc" },
      });

      if (!job) {
        // No pending jobs
        return;
      }

      console.log(`🔧 Processing job ${job.id} for user ${job.user_id}`);
      await this.processJob(job as IJob);
    } catch (error) {
      console.error("❌ Error in processNextJob:", error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process a specific job with timeout handling
   */
  async processJob(job: IJob): Promise<void> {
    const JOB_TIMEOUT_MS = 300000; // 5 minutes timeout

    try {
      console.log(
        `🔧 Processing job ${job.id} for user ${job.user_id} (type: ${job.job_type})`
      );

      // Mark job as processing
      await this.updateJobStatus(job.id, "processing", {
        started_at: new Date().toISOString(),
      });

      // Create a timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(
            new Error(
              `Job ${job.id} timed out after ${JOB_TIMEOUT_MS / 1000} seconds`
            )
          );
        }, JOB_TIMEOUT_MS);
      });

      let jobResults: Record<string, unknown> = {};

      // Race the job processing against timeout
      const jobProcessingPromise = (async () => {
        switch (job.job_type) {
          case "upload":
            return (await this.processUploadJob(job)) as Record<
              string,
              unknown
            >;
          case "download":
            return (await this.processDownloadJob(job)) as Record<
              string,
              unknown
            >;
          case "full_sync":
            return (await this.processFullSyncJob(job)) as Record<
              string,
              unknown
            >;
          default:
            throw new Error(`Unknown job type: ${job.job_type}`);
        }
      })();

      jobResults = await Promise.race([jobProcessingPromise, timeoutPromise]);

      // Mark job as completed
      await this.updateJobStatus(job.id, "completed", {
        results: jobResults,
        progress: 100,
        processed_items: job.total_items || 1, // Ensure at least 1 for empty jobs
        completed_at: new Date().toISOString(),
      });

      console.log(
        `✅ Job ${job.id} completed successfully in ${Date.now() - new Date(job.created_at).getTime()}ms`
      );
    } catch (error) {
      console.error(`❌ Job ${job.id} failed:`, error);

      // Mark job as failed
      await this.updateJobStatus(job.id, "failed", {
        error_message: error instanceof Error ? error.message : "Unknown error",
        completed_at: new Date().toISOString(),
        progress: 0, // Reset progress on failure
      });
    }
  }

  /**
   * Process upload job (OPTIMIZED)
   */
  async processUploadJob(
    job: IJob,
    syncServiceParam: unknown = syncService
  ): Promise<ISyncResults> {
    const typedPayload = job.payload as {
      categories?: ICategory[];
      transactions?: ITransaction[];
    };
    const { categories = [], transactions = [] } = typedPayload;
    const results: ISyncResults = {
      categories: { created: 0, updated: 0, errors: [] },
      transactions: { created: 0, updated: 0, errors: [] },
    };

    let processedItems = 0;
    const startTime = Date.now();

    console.log(
      `🚀 [UPLOAD_JOB] Processing job ${job.id} for user ${job.user_id}`
    );
    console.log(
      `📊 [UPLOAD_JOB] Payload: ${categories.length} categories, ${transactions.length} transactions`
    );

    // Process categories FIRST and SEPARATELY
    if (categories.length > 0) {
      console.log(
        `📁 [UPLOAD_JOB] Processing ${categories.length} categories for job ${job.id}`
      );
      const catStartTime = Date.now();

      try {
        results.categories = await syncService.syncCategories(
          job.user_id,
          categories
        );
        processedItems += categories.length;

        const catDuration = Date.now() - catStartTime;
        console.log(
          `✅ [UPLOAD_JOB] Categories completed in ${catDuration}ms:`,
          results.categories
        );

        // Update progress after category batch
        await this.updateJobProgress(
          job.id,
          processedItems,
          job.total_items || 0
        );
      } catch (error) {
        console.error(
          `❌ [UPLOAD_JOB] Category sync failed for job ${job.id}:`,
          error
        );
        // Add error to results but continue with transactions
        results.categories?.errors.push({
          category: "ALL_CATEGORIES",
          error: error instanceof Error ? error.message : "Unknown error",
        });
        processedItems += categories.length; // Still count as processed for progress
        await this.updateJobProgress(
          job.id,
          processedItems,
          job.total_items || 0
        );
      }
    }

    // Process transactions with optimized batching
    if (transactions.length > 0) {
      console.log(
        `💰 [UPLOAD_JOB] Processing ${transactions.length} transactions for job ${job.id}`
      );
      const transStartTime = Date.now();

      try {
        // OPTIMIZATION: Process with minimal progress updates
        results.transactions = await syncService.syncTransactions(
          job.user_id,
          transactions
        );
        processedItems += transactions.length;

        const transDuration = Date.now() - transStartTime;
        console.log(
          `✅ [UPLOAD_JOB] Transactions completed in ${transDuration}ms:`,
          results.transactions
        );

        // Final progress update
        await this.updateJobProgress(
          job.id,
          processedItems,
          job.total_items || 0
        );
      } catch (error) {
        console.error(
          `❌ [UPLOAD_JOB] Transaction sync failed for job ${job.id}:`,
          error
        );
        results.transactions?.errors.push({
          transaction: "ALL_TRANSACTIONS",
          error: error instanceof Error ? error.message : "Unknown error",
        });
        processedItems += transactions.length; // Still count as processed for progress
        await this.updateJobProgress(
          job.id,
          processedItems,
          job.total_items || 0
        );
      }
    }

    const totalDuration = Date.now() - startTime;
    console.log(
      `🎉 [UPLOAD_JOB] Upload job ${job.id} completed in ${totalDuration}ms`
    );
    console.log(
      `📈 [UPLOAD_JOB] Final results:`,
      JSON.stringify(results, null, 2)
    );

    return { upload: results };
  }

  /**
   * Process download job
   */
  async processDownloadJob(
    job: IJob,
    syncServiceParam: unknown = syncService
  ): Promise<unknown> {
    console.log(`📥 Processing download for job ${job.id}`);

    // For download jobs, we don't know the total items beforehand, so we show progress differently
    await this.updateJobProgress(job.id, 0, 1); // Start with 0/1 (0%)

    const userData = await syncService.getUserData(job.user_id);

    // Complete the download
    await this.updateJobProgress(job.id, 1, 1); // Complete with 1/1 (100%)

    console.log(
      `✅ Download job ${job.id} completed, fetched ${userData.categories?.length || 0} categories and ${userData.transactions?.length || 0} transactions`
    );

    return { download: userData };
  }

  /**
   * Process full sync job
   */
  async processFullSyncJob(
    job: IJob,
    syncServiceParam: unknown = syncService
  ): Promise<unknown> {
    console.log(`🔄 Processing full sync for job ${job.id}`);

    const typedPayload = job.payload as {
      categories?: ICategory[];
      transactions?: ITransaction[];
    };
    const { categories = [], transactions = [] } = typedPayload;

    // Handle case where there are no items to process (e.g., "Check for Updates" when already synced)
    if (categories.length === 0 && transactions.length === 0) {
      console.log(
        `ℹ️ Full sync job ${job.id} has no items to process, performing download only`
      );

      // Update progress to show we're starting
      await this.updateJobProgress(job.id, 0, 1); // Use 1 as total to show progress

      // Just download to check for updates
      const downloadResults = (await this.processDownloadJob(job)) as {
        download?: unknown;
      };

      // Complete the job
      await this.updateJobProgress(job.id, 1, 1); // Show 100% completion

      return {
        upload: {
          categories: { created: 0, updated: 0, errors: [] },
          transactions: { created: 0, updated: 0, errors: [] },
        },
        download: downloadResults.download,
      };
    }

    // First upload (if there are items)
    const uploadResults = (await this.processUploadJob(job)) as {
      upload?: unknown;
    };

    // Then download
    const downloadResults = (await this.processDownloadJob(job)) as {
      download?: unknown;
    };

    return {
      upload: uploadResults.upload,
      download: downloadResults.download,
    };
  }

  /**
   * Update job status
   */
  async updateJobStatus(
    jobId: string,
    status: string,
    additionalFields: Record<string, unknown> = {}
  ): Promise<void> {
    try {
      const updateData = {
        status,
        updated_at: new Date(),
        ...additionalFields,
      };

      await prisma.sync_jobs.update({
        where: { id: jobId },
        data: updateData,
      });

      console.log(`📊 Job ${jobId} status updated to: ${status}`);
    } catch (error) {
      console.error(`❌ Failed to update job ${jobId} status:`, error);
      throw error;
    }
  }

  /**
   * Update job progress
   */
  async updateJobProgress(
    jobId: string,
    processedItems: number,
    totalItems: number
  ): Promise<void> {
    try {
      // Handle edge case where totalItems is 0 (no items to process)
      let progress = 0;
      if (totalItems > 0) {
        progress = Math.round((processedItems / totalItems) * 100);
      } else {
        // If no items to process, consider it 100% complete
        progress = processedItems > 0 || totalItems === 0 ? 100 : 0;
      }

      await this.updateJobStatus(jobId, "processing", {
        processed_items: processedItems,
        progress: progress,
      });

      console.log(
        `📈 Job ${jobId} progress: ${processedItems}/${totalItems} (${progress}%)`
      );
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

      await prisma.sync_jobs.deleteMany({
        where: {
          status: { in: ["completed", "failed"] },
          completed_at: { lt: cutoffDate },
        },
      });

      console.log(`🧹 Cleaned up jobs older than ${daysOld} days`);
    } catch (error) {
      console.error("❌ Failed to cleanup old jobs:", error);
    }
  }
}

// Create singleton instance
export const backgroundJobService = new BackgroundJobService();
export default backgroundJobService;
