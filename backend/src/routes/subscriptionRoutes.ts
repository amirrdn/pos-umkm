import { Router } from 'express';
import { subscriptionController } from '../controllers/subscriptionController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { tenantMiddleware } from '../middlewares/tenantMiddleware';

const router = Router();

// Rute Publik (Webhook)
router.post('/webhook', subscriptionController.processMidtransWebhook);

// Rute Terproteksi Sesi & Tenant Context
router.get('/active', authMiddleware, tenantMiddleware, subscriptionController.getActiveSubscription);
router.get('/invoices', authMiddleware, tenantMiddleware, subscriptionController.getInvoices);
router.post('/upgrade', authMiddleware, tenantMiddleware, subscriptionController.upgradeSubscription);
router.post('/downgrade', authMiddleware, tenantMiddleware, subscriptionController.downgradeSubscription);

export default router;
