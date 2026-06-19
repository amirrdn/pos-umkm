import { Request, Response } from 'express';
import { getDraftTransferSnapshot, runDailyDraftTransferDigest } from '../domain/notification';

const SSE_INTERVAL_MS = 30_000;

function canReceiveDraftNotifications(roles: string[]): boolean {
  return roles.includes('Owner') || roles.includes('Manager');
}

/**
 * GET /api/notifications/stream
 * Server-Sent Events — push count transfer DRAFT setiap 30s.
 */
export async function notificationStream(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId!;
  const roles = req.user!.roles;

  if (!canReceiveDraftNotifications(roles)) {
    res.status(403).json({
      success: false,
      message: 'Notifikasi transfer DRAFT hanya untuk Owner/Manager.',
    });
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const push = async () => {
    try {
      const snapshot = await getDraftTransferSnapshot(tenantId);
      res.write(
        `event: draft_transfer\ndata: ${JSON.stringify({
          count: snapshot.count,
          at: new Date().toISOString(),
        })}\n\n`
      );
    } catch (err) {
      console.error('[notificationStream] push error', err);
    }
  };

  await push();

  const timer = setInterval(() => void push(), SSE_INTERVAL_MS);

  req.on('close', () => {
    clearInterval(timer);
  });
}

/**
 * POST /api/notifications/digest/run
 * Trigger manual digest email (Owner/Admin platform ops).
 */
export async function runDigestNow(_req: Request, res: Response): Promise<Response> {
  try {
    const result = await runDailyDraftTransferDigest();
    return res.status(200).json({
      success: true,
      message: 'Digest email transfer DRAFT selesai diproses.',
      data: result,
    });
  } catch (error: unknown) {
    console.error('[runDigestNow]', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal menjalankan digest email.',
    });
  }
}

/** GET /api/notifications/draft-count — fallback REST (sama dengan polling lama). */
export async function getDraftCount(req: Request, res: Response): Promise<Response> {
  try {
    const tenantId = req.tenantId!;
    if (!canReceiveDraftNotifications(req.user!.roles)) {
      return res.status(200).json({ success: true, data: { count: 0 } });
    }
    const snapshot = await getDraftTransferSnapshot(tenantId);
    return res.status(200).json({ success: true, data: { count: snapshot.count } });
  } catch (error: unknown) {
    console.error('[getDraftCount]', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil jumlah transfer DRAFT.',
    });
  }
}

export { canReceiveDraftNotifications };
