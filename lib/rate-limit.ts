import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import type { NextRequest } from "next/server";

type LimiterName = "checkout" | "ceidg" | "apply" | "message" | "notifications";
type EdgeLimiterName = "auth" | "api";
type AnyLimiterName = LimiterName | EdgeLimiterName;

type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  reason?: string;
};

const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? Redis.fromEnv()
  : null;

const fallbackResult: RateLimitResult = {
  success: true,
  limit: Number.MAX_SAFE_INTEGER,
  remaining: Number.MAX_SAFE_INTEGER,
  reset: Date.now() + 60_000,
  reason: "upstash_not_configured",
};

const limiters: Record<AnyLimiterName, Ratelimit | null> = {
  auth: redis
    ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(10, "60 s"), analytics: true, prefix: "rl:auth" })
    : null,
  api: redis
    ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(30, "60 s"), analytics: true, prefix: "rl:api" })
    : null,
  checkout: redis
    ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(3, "1 m"), analytics: true, prefix: "rl:checkout" })
    : null,
  ceidg: redis
    ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, "1 m"), analytics: true, prefix: "rl:ceidg" })
    : null,
  apply: redis
    ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(20, "1 h"), analytics: true, prefix: "rl:apply" })
    : null,
  message: redis
    ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(30, "1 m"), analytics: true, prefix: "rl:message" })
    : null,
  notifications: redis
    ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(60, "1 m"), analytics: true, prefix: "rl:notifications" })
    : null,
};

export function getRequestIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  return "unknown";
}

export function buildRateLimitKey(parts: Array<string | null | undefined>): string {
  return parts
    .map((part) => String(part ?? "").trim())
    .filter(Boolean)
    .join(":");
}

export async function enforceRateLimit(
  limiterName: AnyLimiterName,
  key: string,
): Promise<RateLimitResult> {
  const limiter = limiters[limiterName];
  if (!limiter) {
    return fallbackResult;
  }

  const result = await limiter.limit(key);
  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
  };
}
