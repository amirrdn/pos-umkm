import { Router } from 'express';
import { openShift, getActiveShift, closeShift, getShiftHistory } from '../controllers/shiftController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { tenantMiddleware } from '../middlewares/tenantMiddleware';

const router = Router();

router.use(authMiddleware);
router.use(tenantMiddleware);

/**
 * POST /api/shifts/open
 * Membuka shift kerja baru. Kasir memasukkan modal awal sebelum mulai melayani.
 */
router.post('/open', openShift);

/**
 * GET /api/shifts/active
 * Mengambil data shift yang sedang aktif milik kasir yang sedang login.
 */
router.get('/active', getActiveShift);

/**
 * POST /api/shifts/close
 * Menutup shift dan merekonsiliasi kas antara ekspektasi sistem vs uang fisik.
 */
router.post('/close', closeShift);

/**
 * GET /api/shifts/history
 * Melihat seluruh riwayat shift untuk keperluan audit oleh Owner/Admin.
 */
router.get('/history', getShiftHistory);

export default router;
