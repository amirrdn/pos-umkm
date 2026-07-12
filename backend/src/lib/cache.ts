import { getRedis, isredisEnabled } from './redis';
import { logWarn } from './logger';

export function cacheKey(...parts: string[]): string {
    return parts.join(':');   
}

async function ensureReady(): Promise<ReturnType<typeof getRedis>> {
    const redis = getRedis();
    if (!redis) return null;

    try {
        if (redis.status !== 'ready') {
            await redis.connect();
        }
        return redis;
    } catch {
        return null;
    }
}

export async function cacheGet<T>(key: string): Promise<T | null> {
    const redis = await ensureReady();
    if (!redis) return null;

    try {
        const raw = await redis.get(key);
        if (raw === null) return null;
        return JSON.parse(raw) as T;
    } catch {
        logWarn('cache', `get failed for key ${key}`);
        return null;
    }
}

export async function cacheSet(
    key: string,
    value: unknown,
    ttl: number
): Promise<void> {
    const redis = await ensureReady();
    if (!redis) return;

    try {
        const payload = JSON.stringify(value);
        await redis.set(key, payload, 'EX', ttl);
    } catch {
        logWarn('cache', `set failed for key ${key}`);
    }
}

export async function cacheDel(key: string): Promise<void> {
    const redis = await ensureReady();
    if (!redis) return;

    try {
        await redis.del(key);
    } catch {
        logWarn('cache', `del failed for key ${key}`);
    }
}

/**
 * Delete key by pattern - use scan (safety in production), not KEYS.
 * Example: cacheDelByPattern('tenant:abc:outlate:*:pos:catalog:*')
 */

export async function cacheDelByPattern(pattern: string): Promise<void> {
    const redis = await ensureReady();
    if (!redis) return;

    try {
        let cursor = '0';
        do {
            const [nextCursor, keys] = await redis.scan(
                cursor,
                'MATCH',
                pattern,
                'COUNT',
                100
            );
            cursor = nextCursor;
            if (keys.length > 0) {
                await redis.del(...keys);
            }
        } while (cursor !== '0');
    } catch {
        logWarn('cache', `delByPattern failed for pattern ${pattern}`);
    }
}

/**
 * Cache-aside: read Redis → miss → fetcher (DB) → tulis Redis.
 * If redis stop, to fetcher only.
 */

export async function cacheGetOrSet<T>(
    key: string,
    ttlSeconds: number,
    fetcher: () => Promise<T>
): Promise<T> {
    if (!isredisEnabled()) {
        return fetcher();
    }

    const cached = await cacheGet<T>(key);
    if (cached !== null) {
        return cached;
    }

    const fresh = await fetcher();

    // Fire and forget - don't failed response if set error.
    void cacheSet(key, fresh, ttlSeconds);

    return fresh;
}