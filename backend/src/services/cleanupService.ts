import fs from 'fs';
import path from 'path';
import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { AppError } from '../utils/errors.js';

export class CleanupService {
  /**
   * Create an isolated job directory inside TEMP_DIR
   */
  public createJobDirectory(jobId: string): string {
    if (!jobId || !/^[a-zA-Z0-9_-]+$/.test(jobId)) {
      throw new AppError('DISK_ERROR', 'Invalid job ID format.', 400);
    }

    const jobDir = path.join(config.tempDir, jobId);
    
    try {
      if (!fs.existsSync(jobDir)) {
        fs.mkdirSync(jobDir, { recursive: true });
      }
      return jobDir;
    } catch (err: any) {
      logger.error('Failed to create job directory', { jobId, error: err.message });
      throw new AppError('DISK_ERROR', 'Failed to allocate temporary storage.', 500, err.message);
    }
  }

  /**
   * Remove job directory recursively
   */
  public cleanupJobDirectory(jobId: string): void {
    if (!jobId || !/^[a-zA-Z0-9_-]+$/.test(jobId)) return;

    const jobDir = path.join(config.tempDir, jobId);

    try {
      if (fs.existsSync(jobDir)) {
        fs.rmSync(jobDir, { recursive: true, force: true });
        logger.info('Cleaned up job directory', { jobId });
      }
    } catch (err: any) {
      logger.warn('Failed to clean up job directory', { jobId, error: err.message });
    }
  }

  /**
   * Periodic garbage collection of old temporary directories (older than 1 hour)
   */
  public cleanupStaleJobs(maxAgeMs: number = 3600000): void {
    try {
      if (!fs.existsSync(config.tempDir)) return;

      const entries = fs.readdirSync(config.tempDir);
      const now = Date.now();

      for (const entry of entries) {
        const fullPath = path.join(config.tempDir, entry);
        try {
          const stats = fs.statSync(fullPath);
          if (now - stats.mtimeMs > maxAgeMs) {
            fs.rmSync(fullPath, { recursive: true, force: true });
            logger.info('Stale directory purged', { path: entry });
          }
        } catch {
          // Ignore individual entry errors
        }
      }
    } catch (err: any) {
      logger.warn('Failed to execute periodic cleanup', { error: err.message });
    }
  }
}

export const cleanupService = new CleanupService();
