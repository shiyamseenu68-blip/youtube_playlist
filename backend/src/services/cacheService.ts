import { logger } from '../utils/logger.js';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class CacheService<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private ttlMs: number;

  constructor(ttlMinutes: number = 5) {
    this.ttlMs = ttlMinutes * 60 * 1000;
  }

  public get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      logger.info('Purged expired metadata cache entry', { key });
      return null;
    }

    return entry.value;
  }

  public set(key: string, value: T): void {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + this.ttlMs,
    });
  }

  public clear(): void {
    this.cache.clear();
  }
}

export const metadataCache = new CacheService<any>(5);
