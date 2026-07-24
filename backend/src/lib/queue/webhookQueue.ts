import { Queue, Worker, Job } from 'bullmq';
import { getQueueRedisOptions } from './config';
import { logError, logInfo } from '../logger';
import { prisma } from '../prisma';

export interface WebhookJobPayload {
  orderId: string;
  transactionStatus: string;
  paymentType?: string;
  grossAmount?: string;
  fraudStatus?: string;
  rawPayload: Record<string, unknown>;
}

const QUEUE_NAME = 'midtrans-webhook-queue';
const redisOptions = getQueueRedisOptions();

export const webhookQueue = redisOptions
  ? new Queue<WebhookJobPayload>(QUEUE_NAME, { connection: redisOptions })
  : null;

/**
 * Enqueues a Midtrans payment webhook payload for async background processing.
 */
export async function enqueueWebhook(payload: WebhookJobPayload): Promise<void> {
  if (!webhookQueue) {
    logInfo('queue.webhook', `Queue disabled, skipping async processing for order ${payload.orderId}`);
    return;
  }
  await webhookQueue.add('process-midtrans-webhook', payload, {
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: 100,
    removeOnFail: 500,
  });
}

/**
 * Initializes worker process for handling Midtrans payment webhooks without blocking API.
 */
export function initWebhookWorker(): Worker<WebhookJobPayload> | null {
  if (!redisOptions) return null;

  const worker = new Worker<WebhookJobPayload>(
    QUEUE_NAME,
    async (job: Job<WebhookJobPayload>) => {
      const { orderId, transactionStatus } = job.data;
      logInfo('queue.worker.webhook', `Processing webhook job ${job.id} for order ${orderId}`);

      /** Batch query: Fetch transaction and tenant in a single include query (prevents N+1) */
      const transaction = await prisma.transaction.findFirst({
        where: { invoiceNumber: orderId },
        include: {
          tenant: true,
          items: true,
        },
      });

      if (!transaction) {
        logError('queue.worker.webhook', `Transaction invoice ${orderId} not found`);
        return;
      }

      /** Process status update based on transactionStatus */
      if (transactionStatus === 'settlement' || transactionStatus === 'capture') {
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: { status: 'COMPLETED' },
        });
      } else if (['cancel', 'deny', 'expire'].includes(transactionStatus)) {
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: { status: 'VOID' },
        });
      }
    },
    { connection: redisOptions }
  );

  worker.on('failed', (job, err) => {
    logError('queue.worker.webhook.failed', { jobId: job?.id, error: err.message });
  });

  return worker;
}
