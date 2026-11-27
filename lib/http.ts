// Small, shared guards for public endpoints. One place, so no route grows its own copy.
import { timingSafeEqual } from "node:crypto";

export class BodyTooLargeError extends Error {
  constructor() {
    super("Request body too large");
  }
}

// Reads a request body but stops as soon as it passes the limit. The Content-Length header is
// only a claim (a chunked upload has none), so the bytes actually received are what is counted.
export async function readLimitedText(req: Request, maxBytes: number): Promise<string> {
  const claimed = Number(req.headers.get("content-length") ?? 0);
  if (Number.isFinite(claimed) && claimed > maxBytes) throw new BodyTooLargeError();
  if (!req.body) return "";
  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel().catch(() => undefined);
      throw new BodyTooLargeError();
    }
    chunks.push(value);
  }
  return new TextDecoder().decode(Buffer.concat(chunks));
}

// Compares two secrets without leaking how many leading characters matched.
export function safeEqual(a: string | null | undefined, b: string | null | undefined): boolean {
  if (typeof a !== "string" || typeof b !== "string" || !a || !b) return false;
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

// The one check for the scheduled jobs (Netlify functions call these routes with a shared key).
export function cronAuthorized(req: Request, secret: string | undefined): boolean {
  return safeEqual(req.headers.get("x-cron-key"), secret);
}

// A best-effort sliding-window limiter, kept in memory. On serverless each instance counts for
// itself, so this slows abuse rather than stopping it; anything that must be exact goes in the database.
export function makeThrottle(limit: number, windowMs: number, now: () => number = Date.now) {
  const hits = new Map<string, number[]>();
  return {
    // True when this call is allowed.
    take(key: string): boolean {
      const t = now();
      const recent = (hits.get(key) ?? []).filter((x) => t - x < windowMs);
      if (recent.length >= limit) {
        hits.set(key, recent);
        return false;
      }
      recent.push(t);
      hits.set(key, recent);
      if (hits.size > 5000) for (const [k, v] of hits) if (!v.some((x) => t - x < windowMs)) hits.delete(k);
      return true;
    },
  };
}
