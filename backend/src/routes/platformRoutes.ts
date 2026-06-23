import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import { requirePlatformAdmin } from '../middlewares/platformAdminMiddleware';
import {
  getOverview,
  getTenantById,
  listTenants,
  overrideSubscription,
  updateTenantStatus,
  createTenant,
  updateTenant,
  deleteTenant,
} from '../controllers/platformTenantController';
import {
  getStaffList,
  getPlatformRevenue,
  getTopProducts,
} from '../controllers/platformAnalyticsController';
import {
  getBillingMetrics,
  listInvoices,
  getMidtransDetail,
} from '../controllers/platformBillingController';
import {
  getActiveInspection,
  listAuditLogs,
  startInspection,
  stopInspection,
} from '../controllers/platformAuditController';

const router = Router();

router.use(authMiddleware, requirePlatformAdmin);

router.get('/analytics/revenue', getPlatformRevenue);
router.get('/analytics/top-products', getTopProducts);
router.get('/staff', getStaffList);

router.post('/tenants', createTenant);
router.get('/tenants', listTenants);
router.get('/tenants/:id', getTenantById);
router.put('/tenants/:id', updateTenant);
router.delete('/tenants/:id', deleteTenant);
router.get('/overview', getOverview);
router.patch('/tenants/:id/status', updateTenantStatus);
router.patch('/tenants/:id/subscription', overrideSubscription);

router.get('/billing/metrics', getBillingMetrics);
router.get('/billing/invoices', listInvoices);
router.get('/billing/invoices/:invoiceNumber/midtrans', getMidtransDetail);

router.post('/inspection/start', startInspection);
router.post('/inspection/stop', stopInspection);
router.get('/inspection/active', getActiveInspection);
router.get('/audit-logs', listAuditLogs);

export default router;
