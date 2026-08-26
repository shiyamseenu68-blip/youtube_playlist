import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { z } from 'zod';
import { validateYouTubeUrl, classifyYouTubeUrl, sanitizeFilename } from '../utils/sanitize.js';
import { ZipArchive } from 'archiver';
import { ytdlpService } from '../services/ytdlpService.js';
import { ffmpegService } from '../services/ffmpegService.js';
import { cleanupService } from '../services/cleanupService.js';
import { queueService } from '../services/queueService.js';
import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

const downloadInputSchema = z.object({
  url: z.string().min(1, 'URL is required.'),
  mode: z.enum(['video', 'playlist']).optional(),
  format: z.enum(['mp4', 'mp3']).default('mp4'),
  quality: z.string().optional(),
  selectedItemIds: z.array(z.string()).optional(),
});

export interface PlaylistItemProgress {
  itemId: string;
  title: string;
  position: number;
  status: 'queued' | 'downloading' | 'completed' | 'failed';
  percent: number;
  error?: string;
}

export interface JobStore {
  jobId: string;
  url: string;
  mode: 'video' | 'playlist';
  format: 'mp4' | 'mp3';
  quality?: string;
  status: 'queued' | 'analyzing' | 'downloading' | 'processing' | 'completed' | 'failed' | 'cancelled';
  percent: number;
  speed?: string;
  eta?: string;
  currentItemIndex?: number;
  totalItems?: number;
  playlistItemsProgress?: PlaylistItemProgress[];
  outputFiles?: string[];
  finalFilePath?: string;
  finalFileName?: string;
  error?: string;
  sseClients: Set<Response>;
}

const jobs = new Map<string, JobStore>();

const notifySseClients = (job: JobStore) => {
  const payload = JSON.stringify({
    jobId: job.jobId,
    status: job.status,
    percent: job.percent,
    speed: job.speed,
    eta: job.eta,
    currentItemIndex: job.currentItemIndex,
    totalItems: job.totalItems,
    playlistItemsProgress: job.playlistItemsProgress,
    downloadUrl: job.status === 'completed' ? `/api/download/file/${job.jobId}` : undefined,
    error: job.error,
  });

  for (const res of job.sseClients) {
    try {
      res.write(`event: progress\ndata: ${payload}\n\n`);
    } catch {
      job.sseClients.delete(res);
    }
  }
};

export const initiateDownloadHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const parsed = downloadInputSchema.parse(req.body);
    const validatedUrl = validateYouTubeUrl(parsed.url);
    const classification = classifyYouTubeUrl(validatedUrl);

    // Verify FFmpeg availability
    await ffmpegService.verifyOrThrow();

    const jobId = uuidv4();
    const jobDir = cleanupService.createJobDirectory(jobId);

    const mode: 'video' | 'playlist' = parsed.mode || (classification.type === 'playlist' ? 'playlist' : 'video');

    const jobStore: JobStore = {
      jobId,
      url: validatedUrl,
      mode,
      format: parsed.format,
      quality: parsed.quality,
      status: 'queued',
      percent: 0,
      outputFiles: [],
      sseClients: new Set(),
    };
    jobs.set(jobId, jobStore);

    res.json({
      jobId,
      status: 'queued',
      message: 'Download job initiated successfully.',
    });

    // Execute job asynchronously via Queue Manager
    queueService.enqueue(async () => {
      jobStore.status = 'analyzing';
      notifySseClients(jobStore);

      try {
        if (mode === 'video') {
          await processSingleVideoDownload(jobStore, jobDir);
        } else {
          await processPlaylistDownload(jobStore, jobDir, parsed.selectedItemIds);
        }

        jobStore.status = 'completed';
        jobStore.percent = 100;
        notifySseClients(jobStore);
      } catch (err: any) {
        jobStore.status = 'failed';
        jobStore.error = err.message || 'Download execution failed.';
        notifySseClients(jobStore);
        logger.error('Download execution failed', { jobId, error: err.message });
      } finally {
        queueService.finishJob(jobId);
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Process Single Video Download Task
 */
async function processSingleVideoDownload(jobStore: JobStore, jobDir: string): Promise<void> {
  let formatArgs: string[] = [];

  if (jobStore.format === 'mp3') {
    formatArgs = ['-f', 'ba/b', '--extract-audio', '--audio-format', 'mp3', '--audio-quality', '0'];
  } else {
    const quality = jobStore.quality;
    const match = quality?.match(/\d+/);
    const height = match ? parseInt(match[0]) : NaN;

    if (!isNaN(height)) {
      if (height >= 2160) {
        formatArgs = ['-f', '96/95/313+251/401+251/bestvideo+bestaudio/18/best', '--merge-output-format', 'mp4'];
      } else if (height >= 1440) {
        formatArgs = ['-f', '96/95/271+251/400+251/bestvideo+bestaudio/18/best', '--merge-output-format', 'mp4'];
      } else if (height >= 1080) {
        formatArgs = ['-f', '96/95/137+140/399+251/bestvideo[height<=1080]+bestaudio/18/best', '--merge-output-format', 'mp4'];
      } else if (height >= 720) {
        formatArgs = ['-f', '95/96/136+140/398+251/bestvideo[height<=720]+bestaudio/18/best', '--merge-output-format', 'mp4'];
      } else if (height >= 480) {
        formatArgs = ['-f', '94/95/135+140/bestvideo[height<=480]+bestaudio/18/best', '--merge-output-format', 'mp4'];
      } else {
        formatArgs = ['-f', '93/18/134+140/bestvideo[height<=360]+bestaudio/18/best', '--merge-output-format', 'mp4'];
      }
    } else {
      formatArgs = ['-f', '96/95/bestvideo+bestaudio/18/best', '--merge-output-format', 'mp4'];
    }
  }

  const outputTemplate = path.join(jobDir, '%(title)s.%(ext)s');
  jobStore.status = 'downloading';
  notifySseClients(jobStore);

  const { childProcess, promise } = ytdlpService.downloadMedia(
    jobStore.url,
    outputTemplate,
    formatArgs,
    (progress) => {
      jobStore.percent = progress.percent;
      jobStore.speed = progress.speed;
      jobStore.eta = progress.eta;
      notifySseClients(jobStore);
    }
  );

  queueService.registerProcess(jobStore.jobId, childProcess);
  await promise;

  // Validate output file
  const files = fs.readdirSync(jobDir);
  if (files.length === 0) {
    throw new AppError('YTDLP_FAILED', 'Download completed but no file was generated on disk.', 500);
  }

  const generatedFile = files[0];
  const generatedPath = path.join(jobDir, generatedFile);
  const stats = fs.statSync(generatedPath);

  if (stats.size === 0) {
    throw new AppError('YTDLP_FAILED', 'Generated file is 0 bytes.', 500);
  }

  // FFmpeg Media Validation
  jobStore.status = 'processing';
  notifySseClients(jobStore);
  await ffmpegService.validateMediaFile(generatedPath, jobStore.format === 'mp3' ? 'audio' : 'video');

  const safeName = sanitizeFilename(generatedFile, `download.${jobStore.format}`);
  jobStore.finalFilePath = generatedPath;
  jobStore.finalFileName = safeName;
}

/**
 * Process Playlist Download Task with Itemized State Tracking & Queue Control
 */
async function processPlaylistDownload(
  jobStore: JobStore,
  jobDir: string,
  selectedItemIds?: string[]
): Promise<void> {
  const playlistMeta = await ytdlpService.getPlaylistMetadata(jobStore.url);
  
  let targetItems = playlistMeta.items.filter((item: any) => item.availability === 'available');

  if (selectedItemIds && selectedItemIds.length > 0) {
    const selectedSet = new Set(selectedItemIds);
    targetItems = targetItems.filter((item: any) => selectedSet.has(item.id));
  }

  if (targetItems.length === 0) {
    throw new AppError('VIDEO_UNAVAILABLE', 'No available playlist items matched your selection.', 400);
  }

  // Cap max items per job to 50 for Render server protection
  if (targetItems.length > 50) {
    targetItems = targetItems.slice(0, 50);
  }

  jobStore.totalItems = targetItems.length;
  jobStore.playlistItemsProgress = targetItems.map((item: any) => ({
    itemId: item.id,
    title: item.title,
    position: item.position,
    status: 'queued',
    percent: 0,
  }));

  const downloadedPaths: string[] = [];

  for (let i = 0; i < targetItems.length; i++) {
    const item = targetItems[i];
    const itemProgress: PlaylistItemProgress = jobStore.playlistItemsProgress?.[i] || {
      itemId: item.id,
      title: item.title,
      position: item.position,
      status: 'downloading',
      percent: 0,
      error: undefined,
    };
    itemProgress.status = 'downloading';
    jobStore.currentItemIndex = i + 1;
    jobStore.percent = Math.round((i / targetItems.length) * 100);
    notifySseClients(jobStore);

    const itemUrl = `https://www.youtube.com/watch?v=${item.id}`;
    const itemTemplate = path.join(jobDir, `${item.position}_%(title)s.%(ext)s`);

    let formatArgs: string[] = [];
    if (jobStore.format === 'mp3') {
      formatArgs = ['-f', 'ba/b', '--extract-audio', '--audio-format', 'mp3', '--audio-quality', '0'];
    } else {
      formatArgs = ['-f', '96/95/137+140/bestvideo[height<=1080]+bestaudio/18/best', '--merge-output-format', 'mp4'];
    }

    try {
      const { childProcess, promise } = ytdlpService.downloadMedia(
        itemUrl,
        itemTemplate,
        formatArgs,
        (p) => {
          itemProgress.percent = p.percent;
          jobStore.speed = p.speed;
          jobStore.eta = p.eta;
          notifySseClients(jobStore);
        }
      );

      queueService.registerProcess(jobStore.jobId, childProcess);
      await promise;

      const filesOnDisk = fs.readdirSync(jobDir).filter(
        (f) => !f.endsWith('.part') && !f.endsWith('.ytdl') && !f.endsWith('.temp') && !f.endsWith('.json') && !f.endsWith('.zip')
      );
      const uncollectedFiles = filesOnDisk
        .map((f) => path.join(jobDir, f))
        .filter((p) => !downloadedPaths.includes(p));

      if (uncollectedFiles.length > 0) {
        const itemPath = uncollectedFiles[0];
        if (fs.existsSync(itemPath) && fs.statSync(itemPath).size > 0) {
          downloadedPaths.push(itemPath);
          itemProgress.status = 'completed';
          itemProgress.percent = 100;
        } else {
          itemProgress.status = 'failed';
        }
      } else {
        itemProgress.status = 'failed';
      }
    } catch (err: any) {
      itemProgress.status = 'failed';
      itemProgress.error = err.message || 'Download failed';
      logger.error('Individual playlist item download failed', { itemId: item.id, error: err.message, details: err.details });
    }
  }

  if (downloadedPaths.length === 0) {
    throw new AppError('YTDLP_FAILED', 'All items in the playlist failed to download.', 500);
  }

  if (downloadedPaths.length === 1) {
    jobStore.finalFilePath = downloadedPaths[0];
    jobStore.finalFileName = sanitizeFilename(path.basename(downloadedPaths[0]), `playlist_item.${jobStore.format}`);
  } else {
    // Package multiple downloaded items into a ZIP archive on disk
    jobStore.status = 'processing';
    notifySseClients(jobStore);

    const zipFileName = sanitizeFilename(`${playlistMeta.title}.zip`, 'playlist_download.zip');
    const zipPath = path.join(jobDir, zipFileName);

    await createZipArchiveFromFiles(downloadedPaths, zipPath);

    jobStore.finalFilePath = zipPath;
    jobStore.finalFileName = zipFileName;
  }
}

/**
 * Helper to stream files into a ZIP archive stored on disk
 */
function createZipArchiveFromFiles(filePaths: string[], outputZipPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputZipPath);
    let archive: any;
    try {
      archive = new ZipArchive({ zlib: { level: 5 } });
    } catch (e) {
      return reject(e);
    }

    output.on('close', () => resolve());
    archive.on('error', (err: any) => reject(err));

    archive.pipe(output);

    for (const filePath of filePaths) {
      const fileName = path.basename(filePath);
      archive.file(filePath, { name: fileName });
    }

    archive.finalize();
  });
}

/**
 * SSE Progress Endpoint Handlers
 */
export const sseProgressHandler = (req: Request, res: Response): void => {
  const jobId = Array.isArray(req.params.jobId) ? req.params.jobId[0] : req.params.jobId;
  const job = jobs.get(jobId);

  if (!job) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Job ID not found.' } });
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  job.sseClients.add(res);

  notifySseClients(job);

  req.on('close', () => {
    job.sseClients.delete(res);
  });
};

/**
 * Job Status Handler
 */
export const getJobStatusHandler = (req: Request, res: Response): void => {
  const jobId = Array.isArray(req.params.jobId) ? req.params.jobId[0] : req.params.jobId;
  const job = jobs.get(jobId);

  if (!job) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Job ID not found.' } });
    return;
  }

  res.json({
    jobId: job.jobId,
    mode: job.mode,
    format: job.format,
    status: job.status,
    percent: job.percent,
    speed: job.speed,
    eta: job.eta,
    currentItemIndex: job.currentItemIndex,
    totalItems: job.totalItems,
    error: job.error,
    downloadUrl: job.status === 'completed' ? `/api/download/file/${jobId}` : undefined,
  });
};

/**
 * Download File Delivery Handler (Stream file to client and purge temp folder)
 */
export const downloadFileHandler = (req: Request, res: Response): void => {
  const jobId = Array.isArray(req.params.jobId) ? req.params.jobId[0] : req.params.jobId;
  const job = jobs.get(jobId);

  if (!job || job.status !== 'completed' || !job.finalFilePath || !fs.existsSync(job.finalFilePath)) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Requested download file is unavailable or expired.' } });
    return;
  }

  const safeName = job.finalFileName || `download.${job.format}`;
  
  res.download(job.finalFilePath, safeName, (err: any) => {
    if (err) {
      logger.warn('Client stream interrupted during file download', { jobId, error: err.message });
    }
    // Cleanup temporary job directory after file delivery finishes or aborts
    cleanupService.cleanupJobDirectory(jobId);
    jobs.delete(jobId);
  });
};

/**
 * Cancel Running Job Handler
 */
export const cancelJobHandler = (req: Request, res: Response): void => {
  const jobId = Array.isArray(req.params.jobId) ? req.params.jobId[0] : req.params.jobId;
  const job = jobs.get(jobId);

  const cancelled = queueService.cancelJob(jobId);

  if (job) {
    job.status = 'cancelled';
    notifySseClients(job);
    cleanupService.cleanupJobDirectory(jobId);
    jobs.delete(jobId);
    res.json({ jobId, status: 'cancelled', message: 'Job cancelled successfully.' });
  } else if (cancelled) {
    cleanupService.cleanupJobDirectory(jobId);
    res.json({ jobId, status: 'cancelled', message: 'Job cancelled successfully.' });
  } else {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Active job not found.' } });
  }
};
