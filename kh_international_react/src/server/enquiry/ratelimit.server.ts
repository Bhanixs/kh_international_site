/**
 * BEST-EFFORT per-IP rate limiter, in memory.
 *
 * Limitation (documented, intentional): serverless platforms may run several instances that do not
 * share memory, so this catches bursts that reach one instance but is not a guarantee. Turnstile is the
 * primary bot control; a platform rule (e.g. a Vercel Firewall rate limit on /api/enquiry) is the
 * recommended follow-up.
 *
 * Retries of a submission already counted (same valid submissionId) do not consume another slot.
 * Requests without a valid submissionId (including bots and honeypot traffic) always count.
 */
export const RATE_LIMIT = { max: 6, windowMs: 10 * 60 * 1000 };
const MAX_TRACKED_IPS = 5000;

interface Bucket {
  windowStart: number;
  count: number;
  ids: Set<string>;
}

const buckets = new Map<string, Bucket>();

export function checkRateLimit(
  ip: string,
  submissionId: string | null,
  now = Date.now(),
): { ok: true } | { ok: false; retryAfterSeconds: number } {
  if (buckets.size > MAX_TRACKED_IPS) {
    for (const [key, b] of buckets)
      if (now - b.windowStart >= RATE_LIMIT.windowMs) buckets.delete(key);
    if (buckets.size > MAX_TRACKED_IPS) buckets.clear();
  }

  let bucket = buckets.get(ip);
  if (!bucket || now - bucket.windowStart >= RATE_LIMIT.windowMs) {
    bucket = { windowStart: now, count: 0, ids: new Set() };
    buckets.set(ip, bucket);
  }
  if (submissionId && bucket.ids.has(submissionId)) return { ok: true };
  if (bucket.count >= RATE_LIMIT.max) {
    return {
      ok: false,
      retryAfterSeconds: Math.max(
        1,
        Math.ceil((bucket.windowStart + RATE_LIMIT.windowMs - now) / 1000),
      ),
    };
  }
  bucket.count += 1;
  if (submissionId) bucket.ids.add(submissionId);
  return { ok: true };
}
