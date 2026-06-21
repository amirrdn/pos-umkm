import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import { requirePlatformAdmin } from '../middlewares/platformAdminMiddleware';
import {
  getOverview,
  getTenantById,
  listTenants,
  overrideSubscription,
  updateTenantStatus,
} from '../controllers/platformTenantController';

const router = Router();

router.use(authMiddleware, requirePlatformAdmin);

router.get('/tenants', listTenants);
router.get('/tenants/:id', getTenantById);
router.get('/overview', getOverview);
router.patch('/tenants/:id/status', updateTenantStatus);
router.patch('/tenants/:id/subscription', overrideSubscription);

export default router;
