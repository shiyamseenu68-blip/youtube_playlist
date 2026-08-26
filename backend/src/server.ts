import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';
import { config, validateCookieConfig } from './config/env.js';
import { ytdlpService } from './services/ytdlpService.js';
import { ffmpegService } from './services/ffmpegService.js';
import { queueService } from './services/queueService.js';
import { getMetadataHandler, analyzeHandler } from './controllers/infoController.js';
import {
  initiateDownloadHandler,
  getJobStatusHandler,
  downloadFileHandler,
  cancelJobHandler,
  sseProgressHandler,
} from './controllers/downloadController.js';
import { errorHandler } from './utils/errors.js';

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      if (!origin || config.corsOrigins.includes(origin) || config.nodeEnv === 'development') {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

app.use(express.json());

// API Rate Limiting (100 requests per 15 minutes)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests, please try again later.' } },
});
app.use('/api/', apiLimiter);

// Serve static frontend files if built
const frontendDistPath = path.join(process.cwd(), '..', 'frontend', 'dist');
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
}

// Health Endpoint
app.get('/api/health', async (_req: express.Request, res: express.Response) => {
  const ytDlpStatus = await ytdlpService.getVersion();
  const ffmpegStatus = await ffmpegService.getVersion();
  const cookieStatus = validateCookieConfig();
  const queueStats = queueService.getStatus();

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: config.nodeEnv,
    ytDlp: {
      available: ytDlpStatus.available,
      version: ytDlpStatus.version || null,
      error: ytDlpStatus.error || null,
    },
    ffmpeg: {
      available: ffmpegStatus.available,
      version: ffmpegStatus.version || null,
      error: ffmpegStatus.error || null,
    },
    cookies: {
      configured: Boolean(config.cookiesFilePath),
      exists: cookieStatus.exists,
      readable: cookieStatus.readable,
      sizeBytes: cookieStatus.size,
    },
    queue: queueStats,
  });
});

// Analysis & Metadata Routes
app.post('/api/analyze', analyzeHandler);
app.post('/api/info', getMetadataHandler);

// Download Routes
app.post('/api/download', initiateDownloadHandler);
app.get('/api/progress/:jobId', sseProgressHandler);
app.get('/api/download/status/:jobId', getJobStatusHandler);
app.get('/api/download/file/:jobId', downloadFileHandler);
app.post('/api/download/cancel/:jobId', cancelJobHandler);

// Central Error Handler Middleware
app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
  app.listen(config.port, () => {
    console.log(`Backend engine running on port ${config.port} [${config.nodeEnv}]`);
  });
}

export default app;
