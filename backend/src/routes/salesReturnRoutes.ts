import { Router } from 'express';
import {
  getAllSalesReturns,
  getSalesReturnById,
  createSalesReturn,
} from '../controllers/salesReturnController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { tenantMiddleware } from '../middlewares/tenantMiddleware';
import { requireRole } from '../middlewares/roleMiddleware';

const router = Router();

router.use(authMiddleware);
router.use(tenantMiddleware);

router.get('/', requireRole(['Owner', 'Manager', 'Admin', 'Kasir']), getAllSalesReturns);
router.get('/:id', requireRole(['Owner', 'Manager', 'Admin', 'Kasir']), getSalesReturnById);
router.post('/', requireRole(['Owner', 'Manager', 'Admin', 'Kasir']), createSalesReturn);

export default router;
