import { Router } from 'express';
import { OutletController } from '../controllers/outletController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { tenantMiddleware } from '../middlewares/tenantMiddleware';
import { requireRole } from '../middlewares/roleMiddleware';

const router = Router();
const controller = new OutletController();

router.use(authMiddleware);
router.use(tenantMiddleware);

/** GET /api/outlets — daftar outlet aktif tenant */
router.get(
  '/',
  requireRole(['Owner', 'Manager', 'Admin', 'Kasir', 'Staf Gudang']),
  controller.getAllOutlets.bind(controller)
);

/** GET /api/outlets/hierarchy — hierarki MAIN + BRANCH + statistik */
router.get(
  '/hierarchy',
  requireRole(['Owner', 'Manager', 'Admin']),
  controller.getOutletHierarchy.bind(controller)
);

/** POST /api/outlets/branches — buat cabang baru (BRANCH) */
router.post(
  '/branches',
  requireRole(['Owner', 'Admin']),
  controller.createBranch.bind(controller)
);

/** GET /api/outlets/main — outlet utama (MAIN) tenant; alias kontrak plan */
router.get(
  '/main',
  requireRole(['Owner', 'Manager', 'Admin']),
  controller.getMainOutlet.bind(controller)
);

/** PUT /api/outlets/main — perbarui profil outlet utama (MAIN) */
router.put(
  '/main',
  requireRole(['Owner', 'Admin']),
  controller.updateMainOutlet.bind(controller)
);

/** GET /api/outlets/:id — detail outlet */
router.get(
  '/:id',
  requireRole(['Owner', 'Manager', 'Admin']),
  controller.getOutletById.bind(controller)
);

/** PUT /api/outlets/:id — perbarui profil outlet */
router.put(
  '/:id',
  requireRole(['Owner', 'Admin']),
  controller.updateOutlet.bind(controller)
);

/** DELETE /api/outlets/:id — soft-delete cabang (MAIN ditolak) */
router.delete(
  '/:id',
  requireRole(['Owner', 'Admin']),
  controller.deleteOutlet.bind(controller)
);

export default router;
