// Simple in-memory fixed-window rate limiter. Good enough for a single
// instance; on serverless/multi-instance swap for Upstash Redis or similar.
type Bucket = { count: number; reset: number };
const buckets = (globalThis as unknown as { __rl?: Map<string, Bucket> }).__rl ?? new Map<string, Bucket>();
(globalThis as unknown as { __rl?: Map<string, Bucket> }).__rl = buckets;

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.reset < now) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfter: 0 };
  }
  bucket.count += 1;
  if (bucket.count > limit) {
    return { ok: false, remaining: 0, retryAfter: Math.ceil((bucket.reset - now) / 1000) };
  }
  return { ok: true, remaining: limit - bucket.count, retryAfter: 0 };
}

export function resetRateLimit(key: string) {
  buckets.delete(key);
}

export function clientIp(req: Request) {
  const fwd = req.headers.get("x-forwarded-for");
  return (fwd?.split(",")[0] || req.headers.get("x-real-ip") || "local").trim();
}
