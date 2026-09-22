import { getRedis } from "./redis";

export async function getCache<T>(key: string): Promise<T | null> {
    try {
        const redis = getRedis();
        const cached = await redis.get<{ v: T }>(key);
        if (cached !== null && cached !== undefined && "v" in cached) {
            return cached.v;
        }
        return null;
    } catch (err) {
        console.warn(`[Redis] getCache failed for ${key}:`, err);
        return null;
    }
}

export async function setCache<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    try {
        const redis = getRedis();
        if (ttlSeconds && ttlSeconds > 0) {
            await redis.set(key, { v: value }, { ex: ttlSeconds });
        } else {
            await redis.set(key, { v: value });
        }
    } catch (err) {
        console.warn(`[Redis] setCache failed for ${key}:`, err);
    }
}

export async function msetCache<T>(entries: { key: string; value: T; ttlSeconds?: number }[]): Promise<void> {
    if (!entries.length) return;
    try {
        const redis = getRedis();
        const pipe = redis.pipeline();
        for (const entry of entries) {
            if (entry.ttlSeconds && entry.ttlSeconds > 0) {
                pipe.set(entry.key, { v: entry.value }, { ex: entry.ttlSeconds });
            } else {
                pipe.set(entry.key, { v: entry.value });
            }
        }
        await pipe.exec();
    } catch (err) {
        console.warn("[Redis] msetCache failed:", err);
    }
}

export async function getOrSetCache<T>(
    key: string,
    ttlSeconds: number,
    fetcher: () => Promise<T>
): Promise<T> {
    const cached = await getCache<T>(key);
    if (cached !== null && cached !== undefined) {
        return cached;
    }
    const fresh = await fetcher();
    await setCache(key, fresh, ttlSeconds);
    return fresh;
}

