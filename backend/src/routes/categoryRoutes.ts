import { Router } from 'express';
import {
  createCategory,
  deleteCategory,
  getAllCategories,
  getNextSku,
  updateCategory,
} from '../controllers/categoryController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { tenantMiddleware } from '../middlewares/tenantMiddleware';
import { requireRole } from '../middlewares/roleMiddleware';

const router = Router();

router.use(authMiddleware);
router.use(tenantMiddleware);

router.get('/', requireRole(['Owner', 'Manager', 'Admin', 'Staf Gudang', 'Kasir']), getAllCategories);
router.post('/', requireRole(['Owner', 'Manager', 'Admin', 'Staf Gudang']), createCategory);
router.put('/:id', requireRole(['Owner', 'Manager', 'Admin', 'Staf Gudang']), updateCategory);
router.delete('/:id', requireRole(['Owner', 'Manager', 'Admin', 'Staf Gudang']), deleteCategory);
router.get('/:id/next-sku', requireRole(['Owner', 'Manager', 'Admin', 'Staf Gudang']), getNextSku);

export default router;
