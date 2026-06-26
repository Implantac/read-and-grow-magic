// Lightweight in-memory rate limiter for Edge Functions.
// Scope: per-instance best-effort throttling to mitigate abuse/loops.
// For strong guarantees, back this with a Redis/DB store.

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export interface RateLimitOptions {
  /** Unique key, e.g. `${functionName}:${userId}` */
  key: string;
  /** Max requests in the window */
  limit: number;
  /** Window length in milliseconds */
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetInSec: number;
}

export function checkRateLimit(opts: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const b = buckets.get(opts.key);
  if (!b || b.resetAt <= now) {
    buckets.set(opts.key, { count: 1, resetAt: now + opts.windowMs });
    return { allowed: true, remaining: opts.limit - 1, resetInSec: Math.ceil(opts.windowMs / 1000) };
  }
  if (b.count >= opts.limit) {
    return { allowed: false, remaining: 0, resetInSec: Math.ceil((b.resetAt - now) / 1000) };
  }
  b.count += 1;
  return { allowed: true, remaining: opts.limit - b.count, resetInSec: Math.ceil((b.resetAt - now) / 1000) };
}

/** Periodic cleanup to keep memory bounded. */
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of buckets) if (v.resetAt <= now) buckets.delete(k);
}, 60_000);

export function rateLimitResponse(result: RateLimitResult, corsHeaders: Record<string, string>): Response {
  return new Response(
    JSON.stringify({ error: "Muitas requisições. Tente novamente em instantes." }),
    {
      status: 429,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Retry-After": String(result.resetInSec),
        "X-RateLimit-Remaining": "0",
      },
    },
  );
}
