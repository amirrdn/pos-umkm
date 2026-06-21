import { Router } from 'express';
import {
  createCustomer,
  deleteCustomer,
  getAllCustomers,
  getCustomerById,
  payDebt,
  updateCustomer,
} from '../controllers/customerController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { tenantMiddleware } from '../middlewares/tenantMiddleware';
import { requirePermission } from '../middlewares/roleMiddleware';

const router = Router();

router.use(authMiddleware);
router.use(tenantMiddleware);

router.get('/', requirePermission('view:customers'), getAllCustomers);
router.get('/:id', requirePermission('view:customers'), getCustomerById);
router.post('/', requirePermission('create:customers'), createCustomer);
router.put('/:id', requirePermission('update:customers'), updateCustomer);
router.delete('/:id', requirePermission('delete:customers'), deleteCustomer);
router.post('/:id/pay-debt', requirePermission('update:customers'), payDebt);

export default router;
