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

const router = Router();

router.post('/webhook', processMidtransWebhook);
router.get('/active', authMiddleware, tenantMiddleware, getActiveSubscription);
router.get('/invoices', authMiddleware, tenantMiddleware, getInvoices);
router.post('/upgrade', authMiddleware, tenantMiddleware, upgradeSubscription);
router.post('/downgrade', authMiddleware, tenantMiddleware, downgradeSubscription);

export default router;
