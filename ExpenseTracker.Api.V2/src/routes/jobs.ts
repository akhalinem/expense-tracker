import express, { Request, Response } from "express";
import { backgroundJobService } from "../services/backgroundJobService";
import { authenticate } from "../middleware/auth";
import { validateSync } from "../middleware/validation";

const router = express.Router();

/**
 * POST /api/jobs/sync
 * Create a background sync job
 */
router.post(
  "/sync",
  authenticate,
  validateSync,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user.id;
      const { type = "upload", ...payload } = req.body;

      console.log(`🚀 [JOB] Creating ${type} job for user ${userId}`);
      console.log(
        `📦 [JOB] Payload: ${JSON.stringify(payload).length} characters`
      );

      // Validate job type
      const validTypes = ["upload", "download", "full_sync"];
      if (!validTypes.includes(type)) {
        res.status(400).json({
          success: false,
          message: `Invalid job type. Must be one of: ${validTypes.join(", ")}`,
        });
        return;
      }

      // Create the background job
      const job = await backgroundJobService.createSyncJob(
        userId,
        type,
        payload
      );

      console.log(`✅ [JOB] Created job ${job.id} for user ${userId}`);

      res.json({
        success: true,
        message: "Sync job created successfully",
        job: {
          id: job.id,
          type: job.job_type,
          status: job.status,
          progress: job.progress,
          created_at: job.created_at,
        },
      });
    } catch (error: unknown) {
      console.error("❌ [JOB] Error creating sync job:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create sync job",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

/**
 * GET /api/jobs/:jobId
 * Get job status and progress
 */
router.get(
  "/:jobId",
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user.id;
      const { jobId } = req.params;

      console.log(`📊 [JOB] Getting status for job ${jobId} (user ${userId})`);

      const job = await backgroundJobService.getJobStatus(jobId, userId);

      if (!job) {
        res.status(404).json({
          success: false,
          message: "Job not found",
        });
        return;
      }

      // Return job information without sensitive payload data
      const jobInfo = {
        id: job.id,
        type: job.job_type,
        status: job.status,
        progress: job.progress,
        total_items: job.total_items,
        processed_items: job.processed_items,
        created_at: job.created_at,
        updated_at: job.updated_at,
        started_at: job.started_at,
        completed_at: job.completed_at,
        error_message: job.error_message,
        results: job.results,
      };

      console.log(
        `✅ [JOB] Retrieved status for job ${jobId}: ${job.status} (${job.progress}%)`
      );

      res.json({
        success: true,
        job: jobInfo,
      });
    } catch (error: unknown) {
      console.error(
        `❌ [JOB] Error getting job ${req.params.jobId} status:`,
        error
      );
      res.status(500).json({
        success: false,
        message: "Failed to get job status",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

/**
 * GET /api/jobs
 * Get user's job history
 */
router.get(
  "/",
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user.id;
      const limit = parseInt(req.query.limit as string) || 10;

      console.log(
        `📋 [JOB] Getting job history for user ${userId} (limit: ${limit})`
      );

      const jobs = await backgroundJobService.getUserJobs(userId, limit);

      // Return jobs without sensitive payload data
      const jobsInfo = jobs.map((job: any) => ({
        id: job.id,
        type: job.job_type,
        status: job.status,
        progress: job.progress,
        total_items: job.total_items,
        processed_items: job.processed_items,
        created_at: job.created_at,
        updated_at: job.updated_at,
        started_at: job.started_at,
        completed_at: job.completed_at,
        error_message: job.error_message,
      }));

      console.log(`✅ [JOB] Retrieved ${jobs.length} jobs for user ${userId}`);

      res.json({
        success: true,
        jobs: jobsInfo,
        total: jobs.length,
      });
    } catch (error: unknown) {
      console.error(
        `❌ [JOB] Error getting jobs for user ${req.user.id}:`,
        error
      );
      res.status(500).json({
        success: false,
        message: "Failed to get job history",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

/**
 * DELETE /api/jobs/:jobId
 * Cancel a pending job (only if not started)
 */
router.delete(
  "/:jobId",
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user.id;
      const { jobId } = req.params;

      console.log(
        `🗑️  [JOB] Attempting to cancel job ${jobId} for user ${userId}`
      );

      const job = await backgroundJobService.getJobStatus(jobId, userId);

      if (!job) {
        res.status(404).json({
          success: false,
          message: "Job not found",
        });
        return;
      }

      if (job.status !== "pending") {
        res.status(400).json({
          success: false,
          message: `Cannot cancel job in ${job.status} status. Only pending jobs can be cancelled.`,
        });
        return;
      }

      // Update job status to cancelled
      await backgroundJobService.updateJobStatus(jobId, "failed", {
        error_message: "Cancelled by user",
        completed_at: new Date().toISOString(),
      });

      console.log(`✅ [JOB] Cancelled job ${jobId} for user ${userId}`);

      res.json({
        success: true,
        message: "Job cancelled successfully",
      });
    } catch (error: unknown) {
      console.error(
        `❌ [JOB] Error cancelling job ${req.params.jobId}:`,
        error
      );
      res.status(500).json({
        success: false,
        message: "Failed to cancel job",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

export default router;
