import { initEmailWorker } from './emailQueue';
import { initWebhookWorker } from './webhookQueue';
import { logInfo } from '../logger';

export * from './config';
export * from './emailQueue';
export * from './webhookQueue';

/**
 * Initializes all background job workers.
 * Called on application startup.
 */
export function startQueueWorkers(): void {
  if (process.env.REDIS_ENABLED !== 'true') {
    logInfo('queue', 'Background queue workers disabled (REDIS_ENABLED!=true)');
    return;
  }

  const emailWorker = initEmailWorker();
  const webhookWorker = initWebhookWorker();

  if (emailWorker && webhookWorker) {
    logInfo('queue', 'All background queue workers started successfully');
  }
}
