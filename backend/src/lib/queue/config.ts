import { ConnectionOptions } from 'bullmq';

/**
 * Returns connection options for BullMQ Redis queues and workers.
 * BullMQ requires maxRetriesPerRequest to be set to null.
 */
export function getQueueRedisOptions(): ConnectionOptions | null {
  const redisUrl = process.env.REDIS_URL?.trim();
  if (process.env.REDIS_ENABLED !== 'true' || !redisUrl) {
    return null;
  }

  try {
    const url = new URL(redisUrl);
    return {
      host: url.hostname,
      port: Number(url.port) || 6379,
      username: url.username || undefined,
      password: url.password || undefined,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    };
  } catch {
    return {
      host: '127.0.0.1',
      port: 6379,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    };
  }
}
