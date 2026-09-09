import "server-only";

type Bucket = { count: number; resetAt: number };

const memoryBuckets = new Map<string, Bucket>();

/**
 * Simple rate limiter.
 * Uses Upstash when configured; otherwise in-memory (single-instance dev).
 */
async function rateLimitByKey(
  key: string,
  prefix: string,
  limit: number,
  windowMs: number
): Promise<{ allowed: boolean; retryAfterMs?: number }> {
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (upstashUrl && upstashToken) {
    try {
      const { Ratelimit } = await import("@upstash/ratelimit");
      const { Redis } = await import("@upstash/redis");
      const ratelimit = new Ratelimit({
        redis: new Redis({ url: upstashUrl, token: upstashToken }),
        limiter: Ratelimit.slidingWindow(limit, "1 h"),
        prefix,
      });
      const result = await ratelimit.limit(key);
      return {
        allowed: result.success,
        retryAfterMs: result.success ? undefined : result.reset - Date.now(),
      };
    } catch {
      // Fall through to memory limiter
    }
  }

  const now = Date.now();
  const bucket = memoryBuckets.get(key);
  if (!bucket || now >= bucket.resetAt) {
    memoryBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  if (bucket.count >= limit) {
    return { allowed: false, retryAfterMs: bucket.resetAt - now };
  }

  bucket.count += 1;
  return { allowed: true };
}

export async function rateLimitContactRequest(
  identifier: string,
  limit = 5,
  windowMs = 60 * 60 * 1000
): Promise<{ allowed: boolean; retryAfterMs?: number }> {
  return rateLimitByKey(`contact:${identifier}`, "fch-contact", limit, windowMs);
}

export async function rateLimitJoinRequest(
  identifier: string,
  limit = 10,
  windowMs = 60 * 60 * 1000
): Promise<{ allowed: boolean; retryAfterMs?: number }> {
  return rateLimitByKey(`join:${identifier}`, "fch-join", limit, windowMs);
}
