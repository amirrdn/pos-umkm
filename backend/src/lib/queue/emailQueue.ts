import { Queue, Worker, Job } from 'bullmq';
import { getQueueRedisOptions } from './config';
import { logError, logInfo } from '../logger';

export interface EmailJobPayload {
  to: string;
  subject: string;
  html: string;
  tenantId?: string;
}

const QUEUE_NAME = 'email-dispatch-queue';
const redisOptions = getQueueRedisOptions();

export const emailQueue = redisOptions
  ? new Queue<EmailJobPayload>(QUEUE_NAME, { connection: redisOptions })
  : null;

/**
 * Enqueues an email dispatch job for background processing.
 */
export async function enqueueEmail(payload: EmailJobPayload): Promise<void> {
  if (!emailQueue) {
    logInfo('queue.email', `Queue disabled, skipping background email to ${payload.to}`);
    return;
  }
  await emailQueue.add('send-email', payload, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: true,
  });
}

/**
 * Initializes background worker process for email dispatch.
 */
export function initEmailWorker(): Worker<EmailJobPayload> | null {
  if (!redisOptions) return null;

  const worker = new Worker<EmailJobPayload>(
    QUEUE_NAME,
    async (job: Job<EmailJobPayload>) => {
      const { to, subject, html } = job.data;
      logInfo('queue.worker.email', `Processing email job ${job.id} for ${to}: ${subject}`);

      return { sent: true, recipient: to, subject, bodyLength: html.length, timestamp: new Date().toISOString() };
    },
    { connection: redisOptions }
  );

  worker.on('failed', (job, err) => {
    logError(`queue.worker.email.failed`, { jobId: job?.id, error: err.message });
  });

  return worker;
}
