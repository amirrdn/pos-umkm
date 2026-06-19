import cron from 'node-cron';
import { runDailyDraftTransferDigest } from '../domain/notification';

/** Jadwalkan digest email transfer DRAFT — default 09:00 setiap hari (TZ server). */
export function startNotificationSchedulers(): void {
  const cronExpr = process.env.DIGEST_CRON ?? '0 9 * * *';
  const enabled = process.env.DIGEST_EMAIL_ENABLED !== 'false';

  if (!enabled) {
    console.info('[notifications] Email digest disabled (DIGEST_EMAIL_ENABLED=false)');
    return;
  }

  cron.schedule(cronExpr, () => {
    void runDailyDraftTransferDigest()
      .then((result: { tenantsNotified: number; totalDrafts: number }) => {
        console.info(
          JSON.stringify({
            level: 'info',
            event: 'draft_transfer_digest_completed',
            ...result,
          })
        );
      })
      .catch((err: unknown) => {
        console.error('[notifications] digest failed', err);
      });
  });

  console.info(`[notifications] Email digest scheduled: ${cronExpr}`);
}
