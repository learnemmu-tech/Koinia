import "server-only";

type Bucket = { count: number; resetAt: number };

const memoryBuckets = new Map<string, Bucket>();

function isProductionRuntime(): boolean {
  return (
    process.env.NODE_ENV === "production" || Boolean(process.env.VERCEL)
  );
}

/**
 * Rate limiter.
 * Production / Vercel: Upstash Redis required (fail closed if missing/unavailable).
 * Local development: in-memory fallback for single-instance use.
 */
async function rateLimitByKey(
  key: string,
  prefix: string,
  limit: number,
  windowMs: number
): Promise<{ allowed: boolean; retryAfterMs?: number }> {
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  const production = isProductionRuntime();

  if (production && (!upstashUrl || !upstashToken)) {
    console.error(
      "[rate-limit] UPSTASH_REDIS_REST_URL/TOKEN required in production"
    );
    return { allowed: false, retryAfterMs: 60_000 };
  }

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
    } catch (error) {
      console.error("[rate-limit] Upstash error", error);
      if (production) {
        return { allowed: false, retryAfterMs: 60_000 };
      }
      // Fall through to memory limiter in development only.
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

/** Shepherd AI chat — per user (or IP fallback), ~30 messages / hour. */
export async function rateLimitShepherdRequest(
  identifier: string,
  limit = 30,
  windowMs = 60 * 60 * 1000
): Promise<{ allowed: boolean; retryAfterMs?: number }> {
  return rateLimitByKey(
    `shepherd:${identifier}`,
    "fch-shepherd",
    limit,
    windowMs
  );
}

/** Public donation checkout — abuse / card-testing protection. */
export async function rateLimitDonationCheckout(
  identifier: string,
  limit = 20,
  windowMs = 60 * 60 * 1000
): Promise<{ allowed: boolean; retryAfterMs?: number }> {
  return rateLimitByKey(
    `donation-checkout:${identifier}`,
    "fch-donation-checkout",
    limit,
    windowMs
  );
}

/** Authenticated uploads — blunt force / storage abuse. */
export async function rateLimitUploadRequest(
  identifier: string,
  limit = 60,
  windowMs = 60 * 60 * 1000
): Promise<{ allowed: boolean; retryAfterMs?: number }> {
  return rateLimitByKey(`upload:${identifier}`, "fch-upload", limit, windowMs);
}
