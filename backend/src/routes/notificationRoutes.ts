import { Router } from 'express';
import {
  getDraftCount,
  notificationStream,
  runDigestNow,
} from '../controllers/notificationController';
import { sseAuthMiddleware } from '../middlewares/sseAuthMiddleware';
import { tenantMiddleware } from '../middlewares/tenantMiddleware';
import { requireRole } from '../middlewares/roleMiddleware';

const router = Router();

router.use(sseAuthMiddleware);
router.use(tenantMiddleware);

/** SSE stream — token via ?token= (EventSource) atau Authorization header */
router.get('/stream', requireRole(['Owner', 'Manager']), notificationStream);

/** REST fallback count */
router.get('/draft-count', requireRole(['Owner', 'Manager']), getDraftCount);

/** Manual trigger digest email (ops / cron external) */
router.post('/digest/run', requireRole(['Owner', 'Admin']), runDigestNow);

export default router;
