import Redis from 'ioredis';
import { logError, logInfo } from './logger';

let client: Redis | null = null;

export function isredisEnabled(): boolean {
    return process.env.REDIS_ENABLED === 'true' && Boolean(process.env.REDIS_URL?.trim());
}

export function getRedis(): Redis | null {
    if (!isredisEnabled()) return null;

    if (!client) {
        client = new Redis(process.env.REDIS_URL!, {
            maxRetriesPerRequest: 3,
            lazyConnect: true,
        });

        client.on('error', (err) => {logError('redis', err)});
        client.on('connect', () => logInfo('redis', 'connected'));
    }

    return client;
}

export async function pingRedis(): Promise<boolean> {
    const redis = getRedis();
    if (!redis) return false;
    try {
        if (redis.status !== 'ready') await redis.connect();
        return (await redis.ping()) === 'PONG';
    } catch (err) {
        return false;
    }
}