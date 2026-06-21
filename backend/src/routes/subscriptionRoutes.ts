import { Router } from 'express';
import {
  downgradeSubscription,
  getActiveSubscription,
  getInvoices,
  processMidtransWebhook,
  upgradeSubscription,
} from '../controllers/subscriptionController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { tenantMiddleware } from '../middlewares/tenantMiddleware';
import { requireRole } from '../middlewares/roleMiddleware';

const router = Router();

router.post('/webhook', processMidtransWebhook);
router.get('/active', authMiddleware, tenantMiddleware, getActiveSubscription);
router.get('/invoices', authMiddleware, tenantMiddleware, getInvoices);
router.post('/upgrade', authMiddleware, tenantMiddleware, requireRole(['Owner', 'Admin']), upgradeSubscription);
router.post('/downgrade', authMiddleware, tenantMiddleware, requireRole(['Owner', 'Admin']), downgradeSubscription);

export default router;
