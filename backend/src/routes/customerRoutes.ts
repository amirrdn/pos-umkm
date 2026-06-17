import { Router } from 'express';
import { CustomerController } from '../controllers/customerController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { tenantMiddleware } from '../middlewares/tenantMiddleware';
import { requirePermission } from '../middlewares/roleMiddleware';

const router = Router();
const customerController = new CustomerController();

router.use(authMiddleware);
router.use(tenantMiddleware);

/**
 * Route GET /api/customers/
 * Deskripsi: Mengambil semua daftar pelanggan dengan dukungan pencarian.
 */
router.get(
  '/',
  requirePermission('view:customers'),
  customerController.getAllCustomers.bind(customerController)
);

/**
 * Route GET /api/customers/:id
 * Deskripsi: Mengambil detail pelanggan berdasarkan ID.
 */
router.get(
  '/:id',
  requirePermission('view:customers'),
  customerController.getCustomerById.bind(customerController)
);

/**
 * Route POST /api/customers/
 * Deskripsi: Mendaftarkan pelanggan baru.
 */
router.post(
  '/',
  requirePermission('create:customers'),
  customerController.createCustomer.bind(customerController)
);

/**
 * Route PUT /api/customers/:id
 * Deskripsi: Memperbarui data pelanggan berdasarkan ID.
 */
router.put(
  '/:id',
  requirePermission('update:customers'),
  customerController.updateCustomer.bind(customerController)
);

/**
 * Route DELETE /api/customers/:id
 * Deskripsi: Menghapus pelanggan berdasarkan ID.
 */
router.delete(
  '/:id',
  requirePermission('delete:customers'),
  customerController.deleteCustomer.bind(customerController)
);

/**
 * Route POST /api/customers/:id/pay-debt
 * Deskripsi: Mencatat pelunasan/pembayaran hutang pelanggan.
 */
router.post(
  '/:id/pay-debt',
  requirePermission('update:customers'),
  customerController.payDebt.bind(customerController)
);

export default router;
