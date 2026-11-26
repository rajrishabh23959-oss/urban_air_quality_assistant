interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

/**
 * Bounded in-memory LRU cache with per-entry TTL expiration.
 */
export class TtlLruCache<T> {
  private readonly store = new Map<string, CacheEntry<T>>();
  private readonly maxEntries: number;
  private readonly defaultTtlMs: number;

  constructor(maxEntries = 200, defaultTtlMs = 10 * 60 * 1000) {
    if (maxEntries < 1) {
      throw new Error("maxEntries must be at least 1");
    }
    if (defaultTtlMs < 1) {
      throw new Error("defaultTtlMs must be at least 1");
    }
    this.maxEntries = maxEntries;
    this.defaultTtlMs = defaultTtlMs;
  }

  /**
   * Retrieves a non-expired value and promotes it as most recently used.
   */
  get(key: string, now = Date.now()): T | undefined {
    const entry = this.store.get(key);
    if (!entry) {
      return undefined;
    }

    if (now >= entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }

    // Refresh LRU order by re-inserting at the end
    this.store.delete(key);
    this.store.set(key, entry);
    return entry.value;
  }

  /**
   * Stores a value with an optional custom TTL, evicting the oldest entry if full.
   */
  set(key: string, value: T, ttlMs = this.defaultTtlMs, now = Date.now()): void {
    if (this.store.has(key)) {
      this.store.delete(key);
    } else if (this.store.size >= this.maxEntries) {
      const oldestKey = this.store.keys().next().value;
      if (oldestKey !== undefined) {
        this.store.delete(oldestKey);
      }
    }

    this.store.set(key, {
      value,
      expiresAt: now + ttlMs,
    });
  }

  /**
   * Removes a specific key from the cache.
   */
  delete(key: string): boolean {
    return this.store.delete(key);
  }

  /**
   * Clears all entries from the cache.
   */
  clear(): void {
    this.store.clear();
  }

  /**
   * Current number of entries stored (including any not yet lazily expired).
   */
  get size(): number {
    return this.store.size;
  }
}
