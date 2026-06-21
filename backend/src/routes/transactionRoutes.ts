import { Router } from 'express';
import { checkout, getHistory, handleMidtransWebhook, getTransactionStatus } from '../controllers/transactionController';
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
  requirePermission('view:transactions'),
  getHistory
);

/**
 * Route POST /api/transactions/midtrans-webhook
 * Deskripsi: Callback notification global dari Midtrans (Public/Tanpa Auth).
 */
router.post(
  '/midtrans-webhook',
  handleMidtransWebhook
);

/**
 * Route GET /api/transactions/status/:invoiceNumber
 * Deskripsi: Pengecekan status lunas/pending untuk polling kasir POS.
 */
router.get(
  '/status/:invoiceNumber',
  authMiddleware,
  tenantMiddleware,
  getTransactionStatus
);

export default router;
