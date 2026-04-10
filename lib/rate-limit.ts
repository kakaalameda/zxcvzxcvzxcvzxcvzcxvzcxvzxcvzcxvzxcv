import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
};

const ORDER_RATE_LIMIT = {
  requests: 5,
  window: "10 m" as const,
} as const;

const TRACK_ORDER_RATE_LIMIT = {
  requests: 8,
  window: "10 m" as const,
} as const;

const CHECKOUT_ADDRESS_RATE_LIMIT = {
  requests: 12,
  window: "10 m" as const,
} as const;

const globalRateLimitStore = globalThis as typeof globalThis & {
  __brandWebUpstashRedis__?: Redis;
  __brandWebOrderRateLimit__?: Ratelimit;
  __brandWebTrackOrderRateLimit__?: Ratelimit;
  __brandWebCheckoutAddressRateLimit__?: Ratelimit;
  __brandWebUpstashRateLimitWarningShown__?: boolean;
};

function getUpstashEnv() {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

  if (!url || !token) {
    return null;
  }

  return { url, token };
}

function logMissingRateLimitConfigOnce() {
  if (globalRateLimitStore.__brandWebUpstashRateLimitWarningShown__) {
    return;
  }

  globalRateLimitStore.__brandWebUpstashRateLimitWarningShown__ = true;
  console.error(
    "[Rate Limit]: Missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN. Rate limiting is temporarily disabled.",
  );
}

function getRedisClient() {
  if (globalRateLimitStore.__brandWebUpstashRedis__) {
    return globalRateLimitStore.__brandWebUpstashRedis__;
  }

  const env = getUpstashEnv();
  if (!env) {
    return null;
  }

  const redis = new Redis({
    url: env.url,
    token: env.token,
  });

  globalRateLimitStore.__brandWebUpstashRedis__ = redis;
  return redis;
}

function getOrCreateRateLimiter(args: {
  cacheKey:
    | "__brandWebOrderRateLimit__"
    | "__brandWebTrackOrderRateLimit__"
    | "__brandWebCheckoutAddressRateLimit__";
  config: { requests: number; window: "10 m" };
  prefix: string;
}) {
  if (globalRateLimitStore[args.cacheKey]) {
    return globalRateLimitStore[args.cacheKey] ?? null;
  }

  const redis = getRedisClient();
  if (!redis) {
    logMissingRateLimitConfigOnce();
    return null;
  }

  const ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(args.config.requests, args.config.window),
    analytics: true,
    prefix: args.prefix,
  });

  globalRateLimitStore[args.cacheKey] = ratelimit;
  return ratelimit;
}

async function applyRateLimit(
  ratelimit: Ratelimit | null,
  identifier: string,
): Promise<RateLimitResult | null> {
  if (!ratelimit) {
    return null;
  }

  try {
    const result = await ratelimit.limit(identifier);

    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      resetAt: result.reset,
      retryAfterSeconds: Math.max(
        1,
        Math.ceil((result.reset - Date.now()) / 1000),
      ),
    };
  } catch (error) {
    console.error("[Rate Limit]: Failed to query Upstash rate limit.", error);
    return null;
  }
}

export function getRequestIp(headers: Headers): string {
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  return (
    headers.get("x-real-ip") ??
    headers.get("cf-connecting-ip") ??
    headers.get("x-vercel-forwarded-for") ??
    "unknown"
  );
}

export async function applyOrderRateLimit(
  identifier: string,
): Promise<RateLimitResult | null> {
  return applyRateLimit(
    getOrCreateRateLimiter({
      cacheKey: "__brandWebOrderRateLimit__",
      config: ORDER_RATE_LIMIT,
      prefix: "brand-web:orders",
    }),
    identifier,
  );
}

export async function applyTrackOrderRateLimit(
  identifier: string,
): Promise<RateLimitResult | null> {
  return applyRateLimit(
    getOrCreateRateLimiter({
      cacheKey: "__brandWebTrackOrderRateLimit__",
      config: TRACK_ORDER_RATE_LIMIT,
      prefix: "brand-web:track-orders",
    }),
    identifier,
  );
}

export async function applyCheckoutAddressRateLimit(
  identifier: string,
): Promise<RateLimitResult | null> {
  return applyRateLimit(
    getOrCreateRateLimiter({
      cacheKey: "__brandWebCheckoutAddressRateLimit__",
      config: CHECKOUT_ADDRESS_RATE_LIMIT,
      prefix: "brand-web:checkout-address",
    }),
    identifier,
  );
}
