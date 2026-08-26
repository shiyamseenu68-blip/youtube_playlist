import { Request, Response, NextFunction } from 'express';
import { classifyYouTubeUrl } from '../utils/sanitize.js';
import { ytdlpService } from '../services/ytdlpService.js';
import { metadataCache } from '../services/cacheService.js';
import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export const analyzeHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { url } = req.body;
    if (!url) {
      throw new AppError('INVALID_URL', 'YouTube URL is required.', 400);
    }

    const classification = classifyYouTubeUrl(url);
    if (classification.type === 'invalid') {
      throw new AppError('UNSUPPORTED_URL', 'The provided URL is not a recognized YouTube video or playlist link.', 400);
    }

    const cacheKey = `analyze_${classification.cleanUrl}`;
    const cachedResult = metadataCache.get(cacheKey);
    if (cachedResult) {
      logger.info('Returning cached metadata analysis', { url: classification.cleanUrl });
      res.json(cachedResult);
      return;
    }

    let responsePayload: any = {
      type: classification.type,
    };

    if (classification.type === 'video') {
      const videoMeta = await ytdlpService.getVideoMetadata(classification.cleanUrl);
      responsePayload.videoContext = videoMeta;
    } else if (classification.type === 'playlist') {
      const playlistMeta = await ytdlpService.getPlaylistMetadata(classification.cleanUrl);
      responsePayload.playlistContext = playlistMeta;
    } else if (classification.type === 'video_playlist') {
      // Fetch both video and playlist contexts concurrently
      const videoUrl = `https://www.youtube.com/watch?v=${classification.videoId}`;
      const playlistUrl = `https://www.youtube.com/playlist?list=${classification.playlistId}`;

      const [videoMeta, playlistMeta] = await Promise.all([
        ytdlpService.getVideoMetadata(videoUrl).catch(() => null),
        ytdlpService.getPlaylistMetadata(playlistUrl).catch(() => null),
      ]);

      if (!videoMeta && !playlistMeta) {
        throw new AppError('VIDEO_UNAVAILABLE', 'Unable to extract video or playlist metadata.', 404);
      }

      responsePayload.videoContext = videoMeta || undefined;
      responsePayload.playlistContext = playlistMeta || undefined;
    }

    metadataCache.set(cacheKey, responsePayload);
    res.json(responsePayload);
  } catch (err) {
    next(err);
  }
};

// Backwards compatibility handler for /api/info
export const getMetadataHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  return analyzeHandler(req, res, next);
};
