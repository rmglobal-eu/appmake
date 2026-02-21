/**
 * Cache for identical AI requests to avoid duplicate API calls.
 * TTL: 1 hour. Max size: 100 entries.
 */

export interface CachedResponse {
  hash: string;
  response: string;
  model: string;
  cachedAt: number;
  expiresAt: number;
}

const TTL_MS = 60 * 60 * 1000; // 1 hour
const MAX_CACHE_SIZE = 100;

const cache = new Map<string, CachedResponse>();

/**
 * Create a deterministic hash from messages and model.
 * Uses a simple but effective string hashing approach that works
 * in any JS environment without crypto dependencies.
 */
export function hashRequest(messages: unknown[], model: string): string {
  const raw = JSON.stringify({ messages, model });
  // FNV-1a inspired hash producing a hex string
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < raw.length; i++) {
    const c = raw.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 0x01000193);
    h2 = Math.imul(h2 ^ c, 0x811c9dc5);
  }
  const part1 = (h1 >>> 0).toString(16).padStart(8, "0");
  const part2 = (h2 >>> 0).toString(16).padStart(8, "0");
  return `${part1}${part2}`;
}

/**
 * Retrieve a cached AI response by its hash.
 * Returns null if not found or expired.
 */
export function getCachedResponse(hash: string): CachedResponse | null {
  const entry = cache.get(hash);
  if (!entry) return null;

  if (entry.expiresAt <= Date.now()) {
    cache.delete(hash);
    return null;
  }

  return entry;
}

/**
 * Cache an AI response.
 * Evicts the oldest entry if the cache is full.
 */
export function cacheResponse(
  hash: string,
  response: string,
  model: string
): void {
  // Evict expired entries first
  const now = Date.now();
  for (const [key, entry] of cache) {
    if (entry.expiresAt <= now) {
      cache.delete(key);
    }
  }

  // If still at capacity, evict the oldest entry
  if (cache.size >= MAX_CACHE_SIZE) {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of cache) {
      if (entry.cachedAt < oldestTime) {
        oldestTime = entry.cachedAt;
        oldestKey = key;
      }
    }

    if (oldestKey !== null) {
      cache.delete(oldestKey);
    }
  }

  cache.set(hash, {
    hash,
    response,
    model,
    cachedAt: now,
    expiresAt: now + TTL_MS,
  });
}

/**
 * Get the current number of valid (non-expired) cached entries.
 */
export function getCacheSize(): number {
  const now = Date.now();
  for (const [key, entry] of cache) {
    if (entry.expiresAt <= now) {
      cache.delete(key);
    }
  }
  return cache.size;
}

/**
 * Clear all cached responses.
 */
export function clearAiCache(): void {
  cache.clear();
}
