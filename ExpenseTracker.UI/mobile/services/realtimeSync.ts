import api from './api';
import { JobProgressCallback, SyncJob } from './sync';
import { API_ENDPOINTS, POLLING_CONFIG } from '~/constants/api';

class PollingProgressService {
  private activePolls: Map<
    string,
    { intervalId: NodeJS.Timeout; startTime: number }
  > = new Map();
  private pollInterval: number = POLLING_CONFIG.INTERVAL_MS;
  private adaptivePolling: boolean = true;
  private readonly POLLING_TIMEOUT_MS = 360000; // 6 minutes timeout for polling

  constructor() {
    // No external dependencies needed
  }

  /**
   * Start polling for job updates
   */
  startPolling(
    jobId: string,
    onUpdate: (job: SyncJob) => void,
    onError?: (error: any) => void
  ) {
    console.log(`� Starting polling for job ${jobId}`);

    // Stop any existing polling for this job
    this.stopPolling(jobId);

    const startTime = Date.now();
    let pollCount = 0;

    const poll = async () => {
      try {
        pollCount++;
        const elapsed = Date.now() - startTime;

        // Check for timeout
        if (elapsed > this.POLLING_TIMEOUT_MS) {
          console.error(
            `⏰ Polling timeout for job ${jobId} after ${elapsed}ms (${pollCount} polls)`
          );
          this.stopPolling(jobId);
          if (onError) {
            onError(
              new Error(
                `Job polling timed out after ${Math.round(elapsed / 1000)} seconds`
              )
            );
          }
          return;
        }

        const response = await api.get(API_ENDPOINTS.JOBS_STATUS(jobId));

        if (response.data.success) {
          const job: SyncJob = response.data.job;
          console.log(
            `📊 Job ${jobId} status: ${job.status} (${job.progress}%) - Poll #${pollCount}, Elapsed: ${Math.round(elapsed / 1000)}s`
          );

          onUpdate(job);

          // Stop polling when job is completed or failed
          if (job.status === 'completed' || job.status === 'failed') {
            console.log(
              `✅ Job ${jobId} finished (${job.status}), stopping polling after ${pollCount} polls`
            );
            this.stopPolling(jobId);
          }
        } else {
          console.error(
            `❌ Failed to poll job ${jobId} (poll #${pollCount}):`,
            response.data.message
          );
          if (onError) {
            onError(new Error(response.data.message));
          }
        }
      } catch (error) {
        console.error(
          `❌ Error polling job ${jobId} (poll #${pollCount}):`,
          error
        );

        // If we get repeated errors, stop polling after a while
        if (pollCount > 10) {
          console.error(
            `🛑 Stopping polling for job ${jobId} due to repeated errors`
          );
          this.stopPolling(jobId);
        }

        if (onError) {
          onError(error);
        }
      }
    };

    // Initial poll
    poll();

    // Set up interval polling
    const intervalId = setInterval(poll, this.pollInterval);
    this.activePolls.set(jobId, { intervalId, startTime });
  }

  /**
   * Stop polling for a specific job
   */
  stopPolling(jobId: string) {
    const pollData = this.activePolls.get(jobId);

    if (pollData) {
      console.log(`⏹️ Stopping polling for job ${jobId}`);
      clearInterval(pollData.intervalId);
      this.activePolls.delete(jobId);
    }
  }

  /**
   * Stop all active polling
   */
  stopAllPolling() {
    console.log(`⏹️ Stopping all ${this.activePolls.size} active polls`);

    for (const [jobId, pollData] of this.activePolls) {
      clearInterval(pollData.intervalId);
    }

    this.activePolls.clear();
  }

  /**
   * Create a progress callback that uses polling
   */
  createPollingProgressCallback(
    jobId: string,
    onProgress: JobProgressCallback,
    onError?: (error: any) => void
  ): void {
    this.startPolling(
      jobId,
      (job: SyncJob) => {
        onProgress(job.progress, job.status, this.getStatusMessage(job));
      },
      onError
    );
  }

  /**
   * Set polling interval (in milliseconds)
   */
  setPollInterval(intervalMs: number) {
    this.pollInterval = Math.max(POLLING_CONFIG.MIN_INTERVAL_MS, intervalMs);
    console.log(`🔧 Polling interval set to ${this.pollInterval}ms`);
  }

  /**
   * Get a user-friendly status message
   */
  private getStatusMessage(job: SyncJob): string {
    switch (job.status) {
      case 'pending':
        return 'Waiting to start...';
      case 'processing':
        if (job.total_items > 0) {
          return `Processing ${job.processed_items}/${job.total_items} items...`;
        }
        return 'Processing...';
      case 'completed':
        return 'Completed successfully!';
      case 'failed':
        return job.error_message || 'Failed';
      default:
        return job.status;
    }
  }

  /**
   * Get the current polling status
   */
  getPollingStatus() {
    return {
      activePolls: this.activePolls.size,
      pollIds: Array.from(this.activePolls.keys()),
      pollInterval: this.pollInterval,
    };
  }
}

// Create singleton instance
export const progressService = new PollingProgressService();
