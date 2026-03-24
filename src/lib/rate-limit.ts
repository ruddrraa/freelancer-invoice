import { LRUCache } from "lru-cache";
import { NextRequest } from "next/server";

const cache = new LRUCache<string, { count: number; resetAt: number }>({
  max: 5000,
  ttl: 1000 * 60,
});

export function rateLimit(req: NextRequest, keySuffix: string, limit = 60) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";
  const key = `${ip}:${keySuffix}`;
  const now = Date.now();
  const entry = cache.get(key);

  if (!entry || entry.resetAt <= now) {
    cache.set(key, { count: 1, resetAt: now + 60_000 });
    return { allowed: true, remaining: limit - 1 };
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  entry.count += 1;
  cache.set(key, entry);
  return { allowed: true, remaining: Math.max(0, limit - entry.count) };
}
