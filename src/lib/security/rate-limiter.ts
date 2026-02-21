/**
 * Token Bucket Rate Limiter
 *
 * Per-process in-memory rate limiting using the token bucket algorithm.
 * Supports separate limits for authenticated and unauthenticated requests.
 */

interface TokenBucket {
  tokens: number;
  lastRefill: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

interface RateLimitConfig {
  maxTokens: number;
  refillRate: number; // tokens per second
  windowMs: number;
}

const AUTHENTICATED_LIMIT: RateLimitConfig = {
  maxTokens: 60,
  refillRate: 1, // 1 token/sec = 60/min
  windowMs: 60_000,
};

const UNAUTHENTICATED_LIMIT: RateLimitConfig = {
  maxTokens: 20,
  refillRate: 20 / 60, // ~0.333 tokens/sec = 20/min
  windowMs: 60_000,
};

// Separate buckets for user-based and IP-based limiting
const userBuckets = new Map<string, TokenBucket>();
const ipBuckets = new Map<string, TokenBucket>();

// Periodic cleanup interval (every 5 minutes)
const CLEANUP_INTERVAL_MS = 5 * 60_000;
const BUCKET_EXPIRY_MS = 10 * 60_000;

let cleanupTimer: ReturnType<typeof setInterval> | null = null;

function startCleanup() {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of userBuckets) {
      if (now - bucket.lastRefill > BUCKET_EXPIRY_MS) {
        userBuckets.delete(key);
      }
    }
    for (const [key, bucket] of ipBuckets) {
      if (now - bucket.lastRefill > BUCKET_EXPIRY_MS) {
        ipBuckets.delete(key);
      }
    }
  }, CLEANUP_INTERVAL_MS);

  // Allow the process to exit without waiting for the timer
  if (cleanupTimer && typeof cleanupTimer === "object" && "unref" in cleanupTimer) {
    cleanupTimer.unref();
  }
}

function refillBucket(bucket: TokenBucket, config: RateLimitConfig): void {
  const now = Date.now();
  const elapsed = (now - bucket.lastRefill) / 1000;
  const tokensToAdd = elapsed * config.refillRate;

  bucket.tokens = Math.min(config.maxTokens, bucket.tokens + tokensToAdd);
  bucket.lastRefill = now;
}

function getOrCreateBucket(
  map: Map<string, TokenBucket>,
  key: string,
  config: RateLimitConfig
): TokenBucket {
  let bucket = map.get(key);
  if (!bucket) {
    bucket = {
      tokens: config.maxTokens,
      lastRefill: Date.now(),
    };
    map.set(key, bucket);
  }
  return bucket;
}

function consumeToken(
  map: Map<string, TokenBucket>,
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  const bucket = getOrCreateBucket(map, key, config);
  refillBucket(bucket, config);

  const resetAt = new Date(Date.now() + config.windowMs);

  if (bucket.tokens >= 1) {
    bucket.tokens -= 1;
    return {
      allowed: true,
      remaining: Math.floor(bucket.tokens),
      resetAt,
    };
  }

  // Calculate when the next token will be available
  const secondsUntilToken = (1 - bucket.tokens) / config.refillRate;
  const nextTokenAt = new Date(Date.now() + secondsUntilToken * 1000);

  return {
    allowed: false,
    remaining: 0,
    resetAt: nextTokenAt,
  };
}

/**
 * Check rate limit for a given user and IP.
 *
 * - If `userId` is provided (non-empty), the authenticated limit (60/min) is applied per user.
 * - Otherwise, the unauthenticated limit (20/min) is applied per IP.
 *
 * Both checks are independent: an authenticated user is limited by their userId,
 * not their IP, to avoid penalizing users behind shared NATs.
 */
export async function checkRateLimit(
  userId: string,
  ip: string
): Promise<RateLimitResult> {
  startCleanup();

  const isAuthenticated = userId.length > 0;

  if (isAuthenticated) {
    return consumeToken(userBuckets, userId, AUTHENTICATED_LIMIT);
  }

  return consumeToken(ipBuckets, ip, UNAUTHENTICATED_LIMIT);
}

/**
 * Reset rate limit state for a given key. Useful for testing.
 */
export function resetRateLimit(key: string): void {
  userBuckets.delete(key);
  ipBuckets.delete(key);
}

/**
 * Clear all rate limit state. Useful for testing.
 */
export function resetAllRateLimits(): void {
  userBuckets.clear();
  ipBuckets.clear();
}
