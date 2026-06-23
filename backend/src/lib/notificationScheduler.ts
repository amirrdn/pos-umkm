import cron from 'node-cron';
import { runDailyDraftTransferDigest } from '../domain/notification';
import { logError, logEvent, logInfo } from './logger';

/** Jadwalkan digest email transfer DRAFT — default 09:00 setiap hari (TZ server). */
export function startNotificationSchedulers(): void {
  const cronExpr = process.env.DIGEST_CRON ?? '0 9 * * *';
  const enabled = process.env.DIGEST_EMAIL_ENABLED !== 'false';

  if (!enabled) {
    logInfo('notifications', 'Email digest disabled (DIGEST_EMAIL_ENABLED=false)');
    return;
  }

  cron.schedule(cronExpr, () => {
    void runDailyDraftTransferDigest()
      .then((result: { tenantsNotified: number; totalDrafts: number }) => {
        logEvent('notifications', 'draft_transfer_digest_completed', {
          tenantsNotified: result.tenantsNotified,
          totalDrafts: result.totalDrafts,
        });
      })
      .catch((err: unknown) => {
        logError('notifications.digest', err);
      });
  });

  logInfo('notifications', `Email digest scheduled: ${cronExpr}`);
}
