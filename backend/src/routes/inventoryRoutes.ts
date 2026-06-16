import { Router } from 'express';
import { 
  getInventorySummary, 
  getStockLedger, 
  createStockMutation,
  getStockRequests,
  approveRequest,
  rejectRequest,
  updateSettings,
  getSettings
} from '../controllers/stockLedgerController';
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
 * Diizinkan untuk Owner, Tenant Admin, Manager, dan Staf Gudang.
 */
router.post('/mutate', requireRole(['Owner', 'TENANT_ADMIN', 'Manager', 'Staf Gudang']), createStockMutation);

/**
 * GET /api/inventory/requests
 * Mengambil semua StockRequest berstatus PENDING.
 * Hanya dapat diakses oleh Owner dan Manager.
 */
router.get('/requests', requireRole(['Owner', 'TENANT_ADMIN', 'Manager']), getStockRequests);

/**
 * POST /api/inventory/requests/:id/approve
 * Menyetujui permintaan mutasi stok.
 * Hanya dapat diakses oleh Owner dan Manager.
 */
router.post('/requests/:id/approve', requireRole(['Owner', 'TENANT_ADMIN', 'Manager']), approveRequest);

/**
 * POST /api/inventory/requests/:id/reject
 * Menolak permintaan mutasi stok.
 * Hanya dapat diakses oleh Owner dan Manager.
 */
router.post('/requests/:id/reject', requireRole(['Owner', 'TENANT_ADMIN', 'Manager']), rejectRequest);

/**
 * GET /api/inventory/settings
 * Mengambil pengaturan requireStockApproval.
 */
router.get('/settings', getSettings);

/**
 * PUT /api/inventory/settings
 * Mengubah pengaturan requireStockApproval.
 * Hanya dapat diakses oleh Owner.
 */
router.put('/settings', requireRole(['Owner', 'TENANT_ADMIN']), updateSettings);

export default router;
