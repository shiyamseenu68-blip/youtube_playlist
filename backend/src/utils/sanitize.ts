import { AppError } from './errors.js';
import path from 'path';

const YOUTUBE_URL_REGEX = /^(https?:\/\/)?(www\.|m\.)?(youtube\.com|youtu\.be)\/(watch\?v=|playlist\?list=|shorts\/|[a-zA-Z0-9_-]+)/i;

export const isValidYouTubeUrl = (urlStr: string): boolean => {
  if (!urlStr || typeof urlStr !== 'string') return false;
  const trimmed = urlStr.trim();
  
  // Reject non-http(s) protocols
  if (!/^https?:\/\//i.test(trimmed)) return false;

  try {
    const parsed = new URL(trimmed);
    const hostname = parsed.hostname.toLowerCase();

    // Prevent localhost, loopback, private IPs (SSRF Protection)
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname === '::1' ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname) ||
      hostname.endsWith('.internal') ||
      hostname.endsWith('.local')
    ) {
      return false;
    }

    // Must match YouTube hostnames
    if (hostname !== 'youtube.com' && hostname !== 'www.youtube.com' && hostname !== 'm.youtube.com' && hostname !== 'youtu.be') {
      return false;
    }

    return YOUTUBE_URL_REGEX.test(trimmed);
  } catch {
    return false;
  }
};

export const validateYouTubeUrl = (rawUrl: string): string => {
  if (!rawUrl || typeof rawUrl !== 'string') {
    throw new AppError('INVALID_URL', 'A valid YouTube URL must be provided.', 400);
  }

  const trimmed = rawUrl.trim();
  if (!isValidYouTubeUrl(trimmed)) {
    throw new AppError('UNSUPPORTED_URL', 'Provided URL is not a supported YouTube video or playlist link.', 400);
  }

  return trimmed;
};

export type YouTubeUrlType = 'video' | 'playlist' | 'video_playlist' | 'invalid';

export interface UrlClassification {
  type: YouTubeUrlType;
  videoId?: string;
  playlistId?: string;
  cleanUrl: string;
}

export const classifyYouTubeUrl = (rawUrl: string): UrlClassification => {
  const cleanUrl = validateYouTubeUrl(rawUrl);
  const parsed = new URL(cleanUrl);
  const hostname = parsed.hostname.toLowerCase();

  let videoId: string | undefined = undefined;
  let playlistId: string | undefined = undefined;

  if (parsed.searchParams.has('list')) {
    const listVal = parsed.searchParams.get('list');
    if (listVal && listVal.trim()) {
      playlistId = listVal.trim();
    }
  }

  if (parsed.searchParams.has('v')) {
    const vVal = parsed.searchParams.get('v');
    if (vVal && vVal.trim()) {
      videoId = vVal.trim();
    }
  } else if (hostname === 'youtu.be') {
    const pathSeg = parsed.pathname.substring(1).trim();
    if (pathSeg && !pathSeg.includes('/')) {
      videoId = pathSeg;
    }
  } else if (parsed.pathname.startsWith('/shorts/')) {
    const parts = parsed.pathname.split('/shorts/');
    if (parts[1]) {
      videoId = parts[1].split('/')[0].trim();
    }
  } else if (parsed.pathname.startsWith('/watch/')) {
    const parts = parsed.pathname.split('/watch/');
    if (parts[1]) {
      videoId = parts[1].split('/')[0].trim();
    }
  }

  if (videoId && playlistId) {
    return { type: 'video_playlist', videoId, playlistId, cleanUrl };
  }
  if (playlistId) {
    return { type: 'playlist', playlistId, cleanUrl };
  }
  if (videoId) {
    return { type: 'video', videoId, cleanUrl };
  }

  return { type: 'invalid', cleanUrl };
};

export const sanitizeFilename = (filename: string, fallback: string = 'download'): string => {
  if (!filename || typeof filename !== 'string') return fallback;

  // Prevent path traversal and control characters
  let safe = filename
    .replace(/[\/\?<>\\:\*\|":]/g, '_') // Replace invalid OS characters
    .replace(/[\x00-\x1f\x7f]/g, '')     // Remove control characters
    .replace(/^\.+/, '')                // Strip leading dots (hidden files/path traversal)
    .trim();

  // Extract basename to guarantee no path components remain
  safe = path.basename(safe);

  if (!safe || safe.length === 0) {
    return fallback;
  }

  // Cap filename length to prevent OS filesystem errors
  if (safe.length > 200) {
    safe = safe.substring(0, 200);
  }

  return safe;
};
