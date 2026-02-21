/**
 * In-memory cache with TTL for database queries.
 * Implements LRU eviction when max entries (1000) is reached.
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  lastAccessed: number;
}

export interface QueryCache<T> {
  get(key: string): T | undefined;
  set(key: string, value: T): void;
  invalidate(key: string): void;
  clear(): void;
  size(): number;
  destroy(): void;
}

const MAX_ENTRIES = 1000;
const CLEANUP_INTERVAL_MS = 60_000; // Run cleanup every 60 seconds

export function createQueryCache<T>(ttlMs: number): QueryCache<T> {
  const store = new Map<string, CacheEntry<T>>();

  // Auto-cleanup of expired entries
  const cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (entry.expiresAt <= now) {
        store.delete(key);
      }
    }
  }, CLEANUP_INTERVAL_MS);

  // Prevent the timer from keeping the process alive
  if (typeof cleanupTimer === "object" && "unref" in cleanupTimer) {
    cleanupTimer.unref();
  }

  function evictLRU(): void {
    if (store.size < MAX_ENTRIES) return;

    let oldestKey: string | null = null;
    let oldestAccess = Infinity;

    for (const [key, entry] of store) {
      if (entry.lastAccessed < oldestAccess) {
        oldestAccess = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey !== null) {
      store.delete(oldestKey);
    }
  }

  return {
    get(key: string): T | undefined {
      const entry = store.get(key);
      if (!entry) return undefined;

      // Check expiry
      if (entry.expiresAt <= Date.now()) {
        store.delete(key);
        return undefined;
      }

      // Update last accessed for LRU tracking
      entry.lastAccessed = Date.now();
      return entry.value;
    },

    set(key: string, value: T): void {
      // If key already exists, just update it
      if (store.has(key)) {
        store.set(key, {
          value,
          expiresAt: Date.now() + ttlMs,
          lastAccessed: Date.now(),
        });
        return;
      }

      // Evict if at capacity
      if (store.size >= MAX_ENTRIES) {
        evictLRU();
      }

      store.set(key, {
        value,
        expiresAt: Date.now() + ttlMs,
        lastAccessed: Date.now(),
      });
    },

    invalidate(key: string): void {
      store.delete(key);
    },

    clear(): void {
      store.clear();
    },

    size(): number {
      // Return count of non-expired entries
      const now = Date.now();
      let count = 0;
      for (const [key, entry] of store) {
        if (entry.expiresAt <= now) {
          store.delete(key);
        } else {
          count++;
        }
      }
      return count;
    },

    destroy(): void {
      clearInterval(cleanupTimer);
      store.clear();
    },
  };
}
