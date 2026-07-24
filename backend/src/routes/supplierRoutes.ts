import { Router } from 'express';
import {
  getAllSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} from '../controllers/supplierController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { tenantMiddleware } from '../middlewares/tenantMiddleware';
import { requireRole } from '../middlewares/roleMiddleware';

const router = Router();

router.use(authMiddleware);
router.use(tenantMiddleware);

router.get('/', requireRole(['Owner', 'Manager', 'Admin', 'Staf Gudang']), getAllSuppliers);
router.post('/', requireRole(['Owner', 'Manager', 'Admin', 'Staf Gudang']), createSupplier);
router.put('/:id', requireRole(['Owner', 'Manager', 'Admin', 'Staf Gudang']), updateSupplier);
router.delete('/:id', requireRole(['Owner', 'Manager', 'Admin', 'Staf Gudang']), deleteSupplier);

export default router;
