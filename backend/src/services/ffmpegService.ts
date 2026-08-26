import { spawn } from 'child_process';
import ffmpegStatic from 'ffmpeg-static';
import { AppError } from '../utils/errors.js';

export interface FFmpegVersionResult {
  available: boolean;
  version?: string;
  path?: string;
  error?: string;
}

export class FFmpegService {
  private binaryPath: string;

  constructor() {
    this.binaryPath = process.env.FFMPEG_PATH || ffmpegStatic || 'ffmpeg';
  }

  public getBinaryPath(): string {
    return this.binaryPath;
  }

  /**
   * Detect FFmpeg presence and version dynamically
   */
  public async getVersion(): Promise<FFmpegVersionResult> {
    return new Promise((resolve) => {
      try {
        const proc = spawn(this.binaryPath, ['-version']);
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
            const firstLine = stdout.split('\n')[0];
            resolve({
              available: true,
              version: firstLine,
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
   * Verify FFmpeg availability or throw typed error
   */
  public async verifyOrThrow(): Promise<void> {
    const status = await this.getVersion();
    if (!status.available) {
      throw new AppError(
        'FFMPEG_MISSING',
        'FFmpeg executable is not available on the server system PATH.',
        500,
        status.error
      );
    }
  }

  /**
   * Inspect and validate generated media file streams via FFmpeg
   */
  public async validateMediaFile(filepath: string, expectedMediaType: 'video' | 'audio'): Promise<{ isValid: boolean; hasVideo: boolean; hasAudio: boolean }> {
    return new Promise((resolve, reject) => {
      const proc = spawn(this.binaryPath, ['-i', filepath]);
      let stderr = '';

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('close', () => {
        const hasVideo = /Stream #.*: Video:/i.test(stderr);
        const hasAudio = /Stream #.*: Audio:/i.test(stderr);

        if (expectedMediaType === 'video') {
          if (hasVideo && hasAudio) {
            resolve({ isValid: true, hasVideo, hasAudio });
          } else if (hasVideo && !hasAudio) {
            // Some video formats may lack audio if source video is silent, but warn
            resolve({ isValid: true, hasVideo, hasAudio: false });
          } else {
            reject(new AppError('FFMPEG_FAILED', 'Generated MP4 file is missing a valid video stream.', 500, stderr));
          }
        } else {
          // Audio expected
          if (hasAudio) {
            resolve({ isValid: true, hasVideo: false, hasAudio: true });
          } else {
            reject(new AppError('FFMPEG_FAILED', 'Generated MP3 file is missing a valid audio stream.', 500, stderr));
          }
        }
      });

      proc.on('error', (err) => {
        reject(new AppError('FFMPEG_FAILED', `FFmpeg stream validation error: ${err.message}`, 500));
      });
    });
  }
}

export const ffmpegService = new FFmpegService();
