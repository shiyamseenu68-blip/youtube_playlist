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

// Trust reverse proxy headers from 1 hop (Render/Cloudflare load balancer)
app.set('trust proxy', 1);

app.use(helmet());
app.use(
  cors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      if (!origin || config.corsOrigins.includes('*') || config.nodeEnv === 'development') {
        return callback(null, true);
      }
      const cleanOrigin = origin.replace(/\/+$/, '');
      const isExplicitlyAllowed = config.corsOrigins.some((allowed) => {
        if (allowed === cleanOrigin) return true;
        if (allowed.startsWith('*.')) {
          return cleanOrigin.endsWith(allowed.slice(2));
        }
        return false;
      });

      if (isExplicitlyAllowed || cleanOrigin.endsWith('.vercel.app')) {
        return callback(null, true);
      }

      callback(null, false);
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
  const gitCommit = process.env.RENDER_GIT_COMMIT || process.env.GIT_COMMIT || '0cc8ef7';
  const poTokenConfigured = Boolean(config.poToken && config.poToken.trim().length > 0);

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: config.nodeEnv,
    commit: gitCommit,
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
      configured: cookieStatus.configured,
      exists: cookieStatus.exists,
      readable: cookieStatus.readable,
      sizeBytes: cookieStatus.size,
      lineCount: cookieStatus.lineCount,
      filePath: cookieStatus.filePath ? path.basename(cookieStatus.filePath) : null,
    },
    poToken: {
      configured: poTokenConfigured,
      length: config.poToken ? config.poToken.trim().length : 0,
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
