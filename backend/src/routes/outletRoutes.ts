import { Router } from 'express';
import {
  createBranch,
  deleteOutlet,
  getAllOutlets,
  getMainOutlet,
  getOutletById,
  getOutletHierarchy,
  updateMainOutlet,
  updateOutlet,
} from '../controllers/outletController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { tenantMiddleware } from '../middlewares/tenantMiddleware';
import { requireRole } from '../middlewares/roleMiddleware';

const router = Router();

router.use(authMiddleware);
router.use(tenantMiddleware);

router.get('/', requireRole(['Owner', 'Manager', 'Admin', 'Kasir', 'Staf Gudang']), getAllOutlets);
router.get('/hierarchy', requireRole(['Owner', 'Manager', 'Admin']), getOutletHierarchy);
router.post('/branches', requireRole(['Owner', 'Admin']), createBranch);
router.get('/main', requireRole(['Owner', 'Manager', 'Admin']), getMainOutlet);
router.put('/main', requireRole(['Owner', 'Admin']), updateMainOutlet);
router.get('/:id', requireRole(['Owner', 'Manager', 'Admin']), getOutletById);
router.put('/:id', requireRole(['Owner', 'Admin']), updateOutlet);
router.delete('/:id', requireRole(['Owner', 'Admin']), deleteOutlet);

export default router;
