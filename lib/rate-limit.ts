type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();
let lastCleanupAt = 0;

function cleanupExpiredBuckets(now: number) {
  if (now - lastCleanupAt < 30_000) {
    return;
  }

  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }

  lastCleanupAt = now;
}

export function consumeRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { ok: boolean; retryAfterMs: number } {
  const now = Date.now();
  cleanupExpiredBuckets(now);

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterMs: 0 };
  }

  bucket.count += 1;
  if (bucket.count > limit) {
    return { ok: false, retryAfterMs: Math.max(0, bucket.resetAt - now) };
  }

  return { ok: true, retryAfterMs: 0 };
}
