import { ChildProcess } from 'child_process';
import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';

export interface ActiveJob {
  jobId: string;
  childProcess?: ChildProcess;
  cancelRequested?: boolean;
}

export class QueueService {
  private activeJobs: Map<string, ActiveJob> = new Map();
  private queue: Array<() => Promise<void>> = [];
  private runningCount: number = 0;

  /**
   * Register active sub-process for cancellation tracking
   */
  public registerProcess(jobId: string, proc: ChildProcess): void {
    const existing = this.activeJobs.get(jobId) || { jobId };
    existing.childProcess = proc;
    this.activeJobs.set(jobId, existing);
  }

  /**
   * Cancel and terminate a running job
   */
  public cancelJob(jobId: string): boolean {
    const job = this.activeJobs.get(jobId);
    if (!job) return false;

    job.cancelRequested = true;
    if (job.childProcess && !job.childProcess.killed) {
      try {
        job.childProcess.kill('SIGTERM');
        logger.info('Terminated child process for cancelled job', { jobId });
      } catch (err: any) {
        logger.warn('Failed to kill process for job', { jobId, error: err.message });
      }
    }
    this.activeJobs.delete(jobId);
    return true;
  }

  /**
   * Remove job from active registry upon completion
   */
  public finishJob(jobId: string): void {
    this.activeJobs.delete(jobId);
  }

  /**
   * Enqueue download task with concurrency limiting
   */
  public async enqueue<T>(task: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const runner = async () => {
        this.runningCount++;
        try {
          const result = await task();
          resolve(result);
        } catch (err) {
          reject(err);
        } finally {
          this.runningCount--;
          this.processNext();
        }
      };

      if (this.runningCount < config.maxConcurrentDownloads) {
        runner();
      } else {
        this.queue.push(runner);
      }
    });
  }

  private processNext(): void {
    if (this.runningCount < config.maxConcurrentDownloads && this.queue.length > 0) {
      const nextTask = this.queue.shift();
      if (nextTask) {
        nextTask();
      }
    }
  }

  public getStatus(): { running: number; queued: number; maxConcurrent: number } {
    return {
      running: this.runningCount,
      queued: this.queue.length,
      maxConcurrent: config.maxConcurrentDownloads,
    };
  }
}

export const queueService = new QueueService();
