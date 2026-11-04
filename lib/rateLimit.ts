// A small per-visitor speed limit for endpoints that cost money or can be hammered (the address lookup).
// It lives in the server's memory, so it is best effort: each server instance counts on its own.
// That is enough to stop a script from running up a bill. The form itself has a stricter, database-backed limit.
type Bucket = { count: number; resetAt: number };

export function makeLimiter(max: number, windowMs: number, now: () => number = Date.now) {
  const buckets = new Map<string, Bucket>();
  return function allow(key: string): boolean {
    const t = now();
    if (buckets.size > 5000) for (const [k, b] of buckets) if (b.resetAt <= t) buckets.delete(k);
    const b = buckets.get(key);
    if (!b || b.resetAt <= t) {
      buckets.set(key, { count: 1, resetAt: t + windowMs });
      return true;
    }
    b.count += 1;
    return b.count <= max;
  };
}

export function requestIp(req: Request): string {
  const nf = req.headers.get("x-nf-client-connection-ip");
  if (nf) return nf.trim();
  const fwd = req.headers.get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() || "unknown";
}
