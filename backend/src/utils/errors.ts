import { Request, Response, NextFunction } from 'express';

export type ErrorCode =
  | 'INVALID_URL'
  | 'UNSUPPORTED_URL'
  | 'VIDEO_UNAVAILABLE'
  | 'PRIVATE_VIDEO'
  | 'AGE_RESTRICTED'
  | 'BOT_DETECTION'
  | 'AUTHENTICATION_REQUIRED'
  | 'COOKIES_NOT_FOUND'
  | 'FORMAT_UNAVAILABLE'
  | 'FFMPEG_MISSING'
  | 'FFMPEG_FAILED'
  | 'YTDLP_FAILED'
  | 'NETWORK_ERROR'
  | 'DOWNLOAD_TIMEOUT'
  | 'CLIENT_CANCELLED'
  | 'DISK_ERROR'
  | 'RATE_LIMIT_EXCEEDED'
  | 'INTERNAL_ERROR';

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: string;

  constructor(code: ErrorCode, message: string, statusCode: number = 400, details?: string) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        details: process.env.NODE_ENV === 'development' ? err.details : undefined,
      },
    });
    return;
  }

  console.error('[UNHANDLED_ERROR]', err.message || err);
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected internal server error occurred.',
    },
  });
};
