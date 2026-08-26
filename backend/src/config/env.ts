import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config();

export interface AppConfig {
  port: number;
  nodeEnv: string;
  corsOrigins: string[];
  cookiesFilePath?: string;
  tempDir: string;
  maxConcurrentDownloads: number;
}

const parseOrigins = (raw: string | undefined): string[] => {
  if (!raw || raw.trim() === '' || raw.trim() === '*') return ['*'];
  return raw.split(',').map((origin) => origin.trim().replace(/\/+$/, '')).filter(Boolean);
};

export const config: AppConfig = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigins: parseOrigins(process.env.CORS_ORIGINS),
  cookiesFilePath: process.env.YOUTUBE_COOKIES_FILE,
  tempDir: process.env.TEMP_DIR || path.join(process.cwd(), 'tmp', 'downloads'),
  maxConcurrentDownloads: parseInt(process.env.MAX_CONCURRENT_DOWNLOADS || '1', 10),
};

export const validateCookieConfig = (): { exists: boolean; readable: boolean; size: number } => {
  if (!config.cookiesFilePath) {
    return { exists: false, readable: false, size: 0 };
  }

  try {
    const exists = fs.existsSync(config.cookiesFilePath);
    if (!exists) {
      return { exists: false, readable: false, size: 0 };
    }
    const stats = fs.statSync(config.cookiesFilePath);
    fs.accessSync(config.cookiesFilePath, fs.constants.R_OK);
    return { exists: true, readable: true, size: stats.size };
  } catch {
    return { exists: true, readable: false, size: 0 };
  }
};
