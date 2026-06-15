import { Router } from 'express';
import { checkout, getHistory } from '../controllers/transactionController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { tenantMiddleware } from '../middlewares/tenantMiddleware';
import { requirePermission } from '../middlewares/roleMiddleware';

const router = Router();

/**
 * Route POST /api/transactions/checkout
 * Deskripsi: Endpoint untuk melakukan transaksi checkout barang.
 */
router.post(
  '/checkout',
  authMiddleware,
  tenantMiddleware,
  requirePermission('create-transaction'),
  checkout
);

/**
 * Route GET /api/transactions/history
 * Deskripsi: Mengambil riwayat transaksi penjualan untuk tenant aktif.
 */
router.get(
  '/history',
  authMiddleware,
  tenantMiddleware,
  getHistory
);

export default router;
