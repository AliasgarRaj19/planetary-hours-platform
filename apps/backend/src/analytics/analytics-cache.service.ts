import { Injectable } from '@nestjs/common';

type CacheEntry<T> = {
  expiresAt: number;
  staleUntil: number;
  value: T;
};

@Injectable()
export class AnalyticsCacheService {
  private readonly entries = new Map<string, CacheEntry<unknown>>();

  get<T>(key: string): T | null {
    const entry = this.entries.get(key);

    if (!entry || entry.expiresAt <= Date.now()) {
      return null;
    }

    return entry.value as T;
  }

  getStale<T>(key: string): T | null {
    const entry = this.entries.get(key);

    if (!entry || entry.staleUntil <= Date.now()) {
      return null;
    }

    return entry.value as T;
  }

  set<T>(key: string, value: T, ttlSeconds: number) {
    const now = Date.now();
    this.entries.set(key, {
      expiresAt: now + ttlSeconds * 1000,
      staleUntil: now + ttlSeconds * 1000 * 4,
      value,
    });
  }

  clear() {
    this.entries.clear();
  }
}
