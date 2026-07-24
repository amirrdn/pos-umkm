import { Router } from 'express';
import {
  getAllPO,
  getPOById,
  createPO,
  receivePO,
  cancelPO,
} from '../controllers/poController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { tenantMiddleware } from '../middlewares/tenantMiddleware';
import { requireRole } from '../middlewares/roleMiddleware';

const router = Router();

router.use(authMiddleware);
router.use(tenantMiddleware);

router.get('/', requireRole(['Owner', 'Manager', 'Admin', 'Staf Gudang']), getAllPO);
router.get('/:id', requireRole(['Owner', 'Manager', 'Admin', 'Staf Gudang']), getPOById);
router.post('/', requireRole(['Owner', 'Manager', 'Admin', 'Staf Gudang']), createPO);
router.patch('/:id/receive', requireRole(['Owner', 'Manager', 'Admin', 'Staf Gudang']), receivePO);
router.patch('/:id/cancel', requireRole(['Owner', 'Manager', 'Admin', 'Staf Gudang']), cancelPO);

export default router;
