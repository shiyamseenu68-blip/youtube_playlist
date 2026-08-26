import { spawn, ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';
import { config, validateCookieConfig, getActiveCookiesFilePath } from '../config/env.js';
import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export interface YtDlpVersionResult {
  available: boolean;
  version?: string;
  path?: string;
  error?: string;
}

export interface ProgressData {
  percent: number;
  downloadedBytes?: number;
  totalBytes?: number;
  speed?: string;
  eta?: string;
  status: 'downloading' | 'processing';
}

import { ffmpegService } from './ffmpegService.js';

export class YtDlpService {
  private binaryPath: string = 'yt-dlp';

  constructor() {
    this.binaryPath = this.resolveBinaryPath();
  }

  private resolveBinaryPath(): string {
    if (process.env.YTDLP_PATH && fs.existsSync(process.env.YTDLP_PATH)) {
      return process.env.YTDLP_PATH;
    }

    if (process.env.YT_DLP_PATH && fs.existsSync(process.env.YT_DLP_PATH)) {
      return process.env.YT_DLP_PATH;
    }

    const localBin = path.join(process.cwd(), 'bin', process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp');
    if (fs.existsSync(localBin)) {
      return localBin;
    }

    const nodeModulesBin = path.join(process.cwd(), 'node_modules', '.bin', process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp');
    if (fs.existsSync(nodeModulesBin)) {
      return nodeModulesBin;
    }

    if (process.platform === 'win32') {
      const winCandidates = [
        'C:\\Users\\shiya\\AppData\\Local\\Python\\pythoncore-3.14-64\\Scripts\\yt-dlp.exe',
        path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Python', 'Python311', 'Scripts', 'yt-dlp.exe'),
        path.join(process.env.USERPROFILE || '', 'AppData', 'Local', 'Microsoft', 'WindowsApps', 'yt-dlp.exe'),
      ];

      for (const candidate of winCandidates) {
        if (fs.existsSync(candidate)) {
          return candidate;
        }
      }
    } else {
      const linuxCandidates = [
        '/usr/local/bin/yt-dlp',
        '/usr/bin/yt-dlp',
      ];
      for (const candidate of linuxCandidates) {
        if (fs.existsSync(candidate)) {
          return candidate;
        }
      }
    }

    return 'yt-dlp';
  }

  /**
   * Safe getter for default yt-dlp extractor arguments
   */
  private getBaseArgs(): string[] {
    const ffmpegPath = ffmpegService.getBinaryPath();
    const nodeBin = process.execPath || 'node';
    const base = [
      '--js-runtimes',
      `node:${nodeBin}`,
      '--user-agent',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
    ];

    if (ffmpegPath) {
      base.push('--ffmpeg-location', ffmpegPath);
    }

    if (config.poToken && config.poToken.trim()) {
      base.push('--extractor-args', `youtube:po_token=web+${config.poToken.trim()}`);
    }

    const cookiesPath = getActiveCookiesFilePath();
    if (cookiesPath && fs.existsSync(cookiesPath)) {
      base.push('--cookies', cookiesPath);
    }

    return base;
  }

  /**
   * Detect yt-dlp binary presence and version
   */
  public async getVersion(): Promise<YtDlpVersionResult> {
    return new Promise((resolve) => {
      try {
        const proc = spawn(this.binaryPath, ['--version']);
        let stdout = '';
        let stderr = '';

        proc.stdout.on('data', (data) => {
          stdout += data.toString();
        });

        proc.stderr.on('data', (data) => {
          stderr += data.toString();
        });

        proc.on('close', (code) => {
          if (code === 0 && stdout.trim()) {
            resolve({
              available: true,
              version: stdout.trim(),
              path: this.binaryPath,
            });
          } else {
            resolve({
              available: false,
              error: stderr.trim() || `Process exited with code ${code}`,
            });
          }
        });

        proc.on('error', (err) => {
          resolve({
            available: false,
            error: err.message,
          });
        });
      } catch (err: any) {
        resolve({
          available: false,
          error: err.message,
        });
      }
    });
  }

  /**
   * Safe metadata extraction using --dump-json (No media download)
   */
  public async getMetadata(url: string, isPlaylist: boolean = false): Promise<any> {
    const args = [
      '--dump-json',
      isPlaylist ? '--flat-playlist' : '--no-playlist',
      '--no-warnings',
      ...this.getBaseArgs(),
      url,
    ];

    logger.info('Executing yt-dlp metadata extraction', { url, isPlaylist, hasCookies: validateCookieConfig().exists });

    return new Promise((resolve, reject) => {
      const proc = spawn(this.binaryPath, args);
      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('close', (code) => {
        if (code === 0 && stdout.trim()) {
          try {
            const lines = stdout.trim().split('\n').filter(Boolean);
            if (lines.length === 1) {
              resolve(JSON.parse(lines[0]));
            } else {
              resolve(lines.map((line) => JSON.parse(line)));
            }
          } catch (e: any) {
            reject(new AppError('YTDLP_FAILED', 'Failed to parse metadata from YouTube.', 500, e.message));
          }
        } else {
          reject(this.parseYtDlpError(stderr, code));
        }
      });

      proc.on('error', (err) => {
        reject(new AppError('YTDLP_FAILED', `Failed to launch yt-dlp binary: ${err.message}`, 500));
      });
    });
  }

  /**
   * Extract normalized single video metadata
   */
  public async getVideoMetadata(url: string): Promise<any> {
    const raw = await this.getMetadata(url, false);
    const formats = raw.formats || [];

    const availableHeights = new Set<number>();
    const qualities: Array<{ formatId: string; qualityLabel: string; ext: string; filesizeApprox?: number }> = [];

    // Filter video formats with distinct height qualities
    for (const f of formats) {
      if (f.vcodec !== 'none' && f.height && !availableHeights.has(f.height)) {
        availableHeights.add(f.height);
        let label = `${f.height}p`;
        if (f.height >= 2160) label = '2160p (4K Ultra HD)';
        else if (f.height >= 1440) label = '1440p (2K Quad HD)';
        else if (f.height >= 1080) label = '1080p (Full HD)';
        else if (f.height >= 720) label = '720p (HD)';
        else if (f.height >= 480) label = '480p (SD)';
        else if (f.height >= 360) label = '360p (SD)';

        qualities.push({
          formatId: `${f.height}p`,
          qualityLabel: label,
          ext: 'mp4',
          filesizeApprox: f.filesize || f.filesize_approx,
        });
      }
    }

    const defaultPresets = [
      { height: 2160, label: '2160p (4K Ultra HD)' },
      { height: 1440, label: '1440p (2K Quad HD)' },
      { height: 1080, label: '1080p (Full HD)' },
      { height: 720, label: '720p (HD)' },
      { height: 480, label: '480p (SD)' },
      { height: 360, label: '360p (SD)' },
    ];

    for (const preset of defaultPresets) {
      if (!availableHeights.has(preset.height)) {
        qualities.push({
          formatId: `${preset.height}p`,
          qualityLabel: preset.label,
          ext: 'mp4',
        });
      }
    }

    qualities.sort((a, b) => {
      const hA = parseInt(a.qualityLabel) || 0;
      const hB = parseInt(b.qualityLabel) || 0;
      return hB - hA;
    });

    qualities.unshift({
      formatId: 'best',
      qualityLabel: 'Best Available (Max Quality)',
      ext: 'mp4',
    });

    const hasVideo = formats.some((f: any) => f.vcodec !== 'none');
    const hasAudio = formats.some((f: any) => f.acodec !== 'none');

    return {
      id: raw.id,
      title: raw.title || 'YouTube Video',
      uploader: raw.uploader || raw.channel || 'YouTube',
      duration: raw.duration || 0,
      thumbnail: raw.thumbnail || (raw.thumbnails && raw.thumbnails[0]?.url) || '',
      hasVideo,
      hasAudio,
      qualities,
    };
  }

  /**
   * Extract normalized playlist metadata handling unavailable items gracefully
   */
  public async getPlaylistMetadata(url: string): Promise<any> {
    const raw = await this.getMetadata(url, true);

    let entries: any[] = [];
    let title = 'YouTube Playlist';
    let uploader = 'YouTube';
    let id = 'playlist';

    if (Array.isArray(raw)) {
      entries = raw;
      if (raw[0]) {
        title = raw[0].playlist_title || raw[0].title || title;
        uploader = raw[0].playlist_uploader || raw[0].uploader || uploader;
        id = raw[0].playlist_id || id;
      }
    } else if (raw._type === 'playlist' && Array.isArray(raw.entries)) {
      entries = raw.entries;
      title = raw.title || title;
      uploader = raw.uploader || uploader;
      id = raw.id || id;
    } else {
      entries = [raw];
    }

    const items = entries.map((entry: any, index: number) => {
      let availability: 'available' | 'private' | 'deleted' | 'unavailable' = 'available';
      if (entry.title === '[Private video]') availability = 'private';
      else if (entry.title === '[Deleted video]') availability = 'deleted';
      else if (entry.is_unavailable) availability = 'unavailable';

      return {
        id: entry.id || `item_${index + 1}`,
        title: entry.title || `Playlist Item ${index + 1}`,
        duration: entry.duration || 0,
        thumbnail: entry.thumbnail || (entry.thumbnails && entry.thumbnails[0]?.url) || '',
        position: index + 1,
        availability,
      };
    });

    return {
      id,
      title,
      uploader,
      totalItems: items.length,
      items,
    };
  }

  /**
   * Execute real video/audio download process
   */
  public downloadMedia(
    url: string,
    outputTemplate: string,
    formatArgs: string[],
    onProgress?: (data: ProgressData) => void
  ): { childProcess: ChildProcess; promise: Promise<void> } {
    const args = [
      '--newline',
      '--no-playlist',
      '--progress-template',
      'PERCENT:%(progress._percent_str)s|SPEED:%(progress._speed_str)s|ETA:%(progress._eta_str)s',
      ...formatArgs,
      ...this.getBaseArgs(),
      '-o',
      outputTemplate,
      url,
    ];

    logger.info('Executing yt-dlp download process', { outputTemplate });

    const proc = spawn(this.binaryPath, args);

    const promise = new Promise<void>((resolve, reject) => {
      let stderr = '';

      proc.stdout.on('data', (data) => {
        const str = data.toString();
        if (onProgress) {
          const lines = str.split('\n');
          for (const line of lines) {
            if (line.includes('PERCENT:')) {
              const progress = this.parseProgressLine(line);
              if (progress) onProgress(progress);
            }
          }
        }
      });

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(this.parseYtDlpError(stderr, code));
        }
      });

      proc.on('error', (err) => {
        reject(new AppError('YTDLP_FAILED', `Failed to execute download: ${err.message}`, 500));
      });
    });

    return { childProcess: proc, promise };
  }

  /**
   * Safe progress string parser
   */
  private parseProgressLine(line: string): ProgressData | null {
    try {
      const matchPercent = line.match(/PERCENT:\s*([\d\.]+)%/);
      const matchSpeed = line.match(/SPEED:\s*([^\s\|]+)/);
      const matchEta = line.match(/ETA:\s*([^\s\|]+)/);

      if (matchPercent) {
        return {
          percent: parseFloat(matchPercent[1]),
          speed: matchSpeed ? matchSpeed[1] : undefined,
          eta: matchEta ? matchEta[1] : undefined,
          status: 'downloading',
        };
      }
    } catch {
      // Ignore parser glitches
    }
    return null;
  }

  /**
   * Structured error classification from yt-dlp stderr output
   */
  private parseYtDlpError(stderr: string, code: number | null): AppError {
    const raw = stderr.toLowerCase();

    if (raw.includes('sign in to confirm') || raw.includes('not a bot') || raw.includes('bot detection') || raw.includes('429')) {
      return new AppError('BOT_DETECTION', 'YouTube bot detection triggered. Authentication or cookies/PO-token required.', 429, stderr);
    }
    if (raw.includes('private video') || raw.includes('this video is private')) {
      return new AppError('PRIVATE_VIDEO', 'This YouTube video is private.', 403, stderr);
    }
    if (raw.includes('video unavailable') || raw.includes('does not exist')) {
      return new AppError('VIDEO_UNAVAILABLE', 'This video is unavailable or has been deleted.', 404, stderr);
    }
    if (raw.includes('confirm your age') || raw.includes('age-restricted')) {
      return new AppError('AGE_RESTRICTED', 'This video is age-restricted and requires sign-in.', 403, stderr);
    }
    if (raw.includes('requested format is not available')) {
      return new AppError('FORMAT_UNAVAILABLE', 'The requested video/audio format is unavailable.', 400, stderr);
    }

    const cleanLines = stderr
      ? stderr
          .trim()
          .split('\n')
          .filter((l) => l.startsWith('ERROR:') || l.startsWith('WARNING:') || l.includes('Error'))
          .join('; ')
      : '';

    const detailMsg = cleanLines || (stderr ? stderr.trim().slice(-300) : `Exit code ${code}`);

    return new AppError('YTDLP_FAILED', `yt-dlp execution failed: ${detailMsg}`, 500, stderr);
  }
}

export const ytdlpService = new YtDlpService();
