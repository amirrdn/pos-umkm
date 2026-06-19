import { Router } from 'express';
import {
  createTransfer,
  listTransfers,
  approveTransfer,
  completeTransfer,
  cancelTransfer
} from '../controllers/transferController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { tenantMiddleware } from '../middlewares/tenantMiddleware';
import { requireRole } from '../middlewares/roleMiddleware';

const router = Router();

router.use(authMiddleware);
router.use(tenantMiddleware);

/**
 * POST /api/stock-transfers
 * Membuat pengajuan transfer stok baru.
 */
router.post(
  '/',
  requireRole(['Owner', 'TENANT_ADMIN', 'Manager', 'Staf Gudang']),
  createTransfer
);

/**
 * GET /api/stock-transfers
 * Mengambil daftar/riwayat transfer stok.
 */
router.get(
  '/',
  requireRole(['Owner', 'TENANT_ADMIN', 'Manager', 'Staf Gudang', 'Kasir']),
  listTransfers
);

/**
 * PATCH /api/stock-transfers/:id/approve
 * Menyetujui transfer stok berstatus DRAFT.
 */
router.patch(
  '/:id/approve',
  requireRole(['Owner', 'TENANT_ADMIN', 'Manager']),
  approveTransfer
);

/**
 * PATCH /api/stock-transfers/:id/complete
 * Menyelesaikan transfer (konfirmasi penerimaan barang) berstatus IN_TRANSIT.
 */
router.patch(
  '/:id/complete',
  requireRole(['Owner', 'TENANT_ADMIN', 'Manager', 'Staf Gudang', 'Kasir']),
  completeTransfer
);

/**
 * PATCH /api/stock-transfers/:id/cancel
 * Membatalkan transfer stok (DRAFT atau IN_TRANSIT).
 */
router.patch(
  '/:id/cancel',
  requireRole(['Owner', 'TENANT_ADMIN', 'Manager', 'Staf Gudang']),
  cancelTransfer
);

export default router;
