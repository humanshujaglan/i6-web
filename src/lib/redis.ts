import { Redis } from "@upstash/redis";
import { requireEnv } from "./env";

const globalForRedis = globalThis as unknown as { redis?: Redis };

export function getRedis(): Redis {
    if (!globalForRedis.redis) {
        globalForRedis.redis = new Redis({
            url: requireEnv("UPSTASH_REDIS_REST_URL"),
            token: requireEnv("UPSTASH_REDIS_REST_TOKEN"),
            retry: { retries: 2, backoff: (i) => Math.min(2 ** i * 100, 400) },
        });
    }
    return globalForRedis.redis;
}
