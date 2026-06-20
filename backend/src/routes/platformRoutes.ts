import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import { requirePlatformAdmin } from '../middlewares/platformAdminMiddleware';
import { platformTenantController } from '../controllers/platformTenantController';

const router = Router();

router.use(authMiddleware, requirePlatformAdmin);

router.get('/tenants', platformTenantController.listTenants.bind(platformTenantController));
router.get('/tenants/:id', platformTenantController.getTenantById.bind(platformTenantController));
router.get('/overview', platformTenantController.getOverview.bind(platformTenantController));

export default router;
