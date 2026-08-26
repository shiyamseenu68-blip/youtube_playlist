import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

dotenv.config();

export interface AppConfig {
  port: number;
  nodeEnv: string;
  corsOrigins: string[];
  cookiesFilePath?: string;
  cookiesText?: string;
  poToken?: string;
  youtubeProxyUrl?: string;
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
  cookiesText: process.env.YOUTUBE_COOKIES_TEXT,
  poToken: process.env.YOUTUBE_PO_TOKEN || process.env.PO_TOKEN,
  youtubeProxyUrl: process.env.YOUTUBE_PROXY_URL || process.env.HTTP_PROXY || process.env.HTTPS_PROXY,
  tempDir: process.env.TEMP_DIR || path.join(process.cwd(), 'tmp', 'downloads'),
  maxConcurrentDownloads: parseInt(process.env.MAX_CONCURRENT_DOWNLOADS || '1', 10),
};

export const getActiveCookiesFilePath = (): string | undefined => {
  if (config.cookiesFilePath && fs.existsSync(config.cookiesFilePath)) {
    return config.cookiesFilePath;
  }

  if (config.cookiesText && config.cookiesText.trim()) {
    try {
      const autoCookieDir = path.join(process.cwd(), 'tmp');
      if (!fs.existsSync(autoCookieDir)) {
        fs.mkdirSync(autoCookieDir, { recursive: true });
      }
      const autoCookiePath = path.join(autoCookieDir, 'auto_youtube_cookies.txt');
      
      let rawText = config.cookiesText.trim();
      rawText = rawText.replace(/\\n/g, '\n');
      if (!rawText.startsWith('# Netscape')) {
        rawText = '# Netscape HTTP Cookie File\n# http://www.netscape.com/newsref/std/cookie_spec.html\n# This is a generated file! Do not edit.\n\n' + rawText;
      }

      fs.writeFileSync(autoCookiePath, rawText, 'utf-8');
      return autoCookiePath;
    } catch {
      // Fallthrough
    }
  }

  return undefined;
};

export const validateCookieConfig = (): {
  configured: boolean;
  exists: boolean;
  readable: boolean;
  size: number;
  lineCount: number;
  filePath?: string;
} => {
  const filePath = getActiveCookiesFilePath();
  const isConfigured = Boolean(config.cookiesFilePath || config.cookiesText);
  if (!filePath) {
    return { configured: isConfigured, exists: false, readable: false, size: 0, lineCount: 0 };
  }

  try {
    const stats = fs.statSync(filePath);
    fs.accessSync(filePath, fs.constants.R_OK);
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').filter((l) => l.trim().length > 0).length;
    return {
      configured: isConfigured,
      exists: true,
      readable: true,
      size: stats.size,
      lineCount: lines,
      filePath,
    };
  } catch {
    return { configured: isConfigured, exists: true, readable: false, size: 0, lineCount: 0, filePath };
  }
};

export const getCookieFingerprint = (): string | null => {
  const filePath = getActiveCookiesFilePath();
  if (!filePath || !fs.existsSync(filePath)) return null;
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return crypto.createHash('sha256').update(content.trim()).digest('hex').slice(0, 8);
  } catch {
    return null;
  }
};

export interface SafeProxyInfo {
  configured: boolean;
  protocol: string | null;
  host: string | null;
  hasAuth: boolean;
}

export const getSafeProxyInfo = (): SafeProxyInfo => {
  const proxyRaw = config.youtubeProxyUrl ? config.youtubeProxyUrl.trim() : '';
  if (!proxyRaw) {
    return { configured: false, protocol: null, host: null, hasAuth: false };
  }

  try {
    const parsed = new URL(proxyRaw);
    return {
      configured: true,
      protocol: parsed.protocol ? parsed.protocol.replace(':', '') : null,
      host: parsed.host || null,
      hasAuth: Boolean(parsed.username || parsed.password),
    };
  } catch {
    const hasAuth = proxyRaw.includes('@');
    const parts = proxyRaw.split('@');
    const hostPart = parts.length > 1 ? parts[1] : parts[0];
    return {
      configured: true,
      protocol: proxyRaw.includes('://') ? proxyRaw.split('://')[0] : 'http',
      host: hostPart ? hostPart.split('/')[0] : null,
      hasAuth,
    };
  }
};
