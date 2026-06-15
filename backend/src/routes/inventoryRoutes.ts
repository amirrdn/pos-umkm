import { Router } from 'express';
import { getInventorySummary, getStockLedger, createStockMutation } from '../controllers/stockLedgerController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { tenantMiddleware } from '../middlewares/tenantMiddleware';
import { requireRole } from '../middlewares/roleMiddleware';

const router = Router();

router.use(authMiddleware);
router.use(tenantMiddleware);

/**
 * GET /api/inventory
 * Mengambil ringkasan semua stok produk milik tenant aktif.
 */
router.get('/', getInventorySummary);

/**
 * GET /api/inventory/:productId/ledger
 * Mengambil kartu stok (riwayat mutasi) produk tertentu.
 */
router.get('/:productId/ledger', getStockLedger);

/**
 * POST /api/inventory/mutate
 * Melakukan mutasi stok manual (RESTOCK, ADJUSTMENT, RETURN).
 * Hanya dapat diakses oleh Owner atau Tenant Admin.
 */
router.post('/mutate', requireRole(['Owner', 'TENANT_ADMIN']), createStockMutation);

export default router;
