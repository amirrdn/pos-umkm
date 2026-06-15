import { Router } from 'express';
import { AnalyticsController } from '../controllers/analyticsController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { tenantMiddleware } from '../middlewares/tenantMiddleware';

const router = Router();
const analyticsController = new AnalyticsController();

router.use(authMiddleware);
router.use(tenantMiddleware);

/**
 * Route GET /api/analytics/summary
 * Deskripsi: Mengambil rangkuman metrik penjualan harian dan bulanan.
 */
router.get('/summary', analyticsController.getSummary.bind(analyticsController));

/**
 * Route GET /api/analytics/best-sellers
 * Deskripsi: Mengambil daftar 5 produk terlaris.
 */
router.get('/best-sellers', analyticsController.getBestSellers.bind(analyticsController));

/**
 * Route GET /api/analytics/trend
 * Deskripsi: Mengambil tren pendapatan dan laba bersih 30 hari terakhir.
 */
router.get('/trend', analyticsController.getTrend.bind(analyticsController));

export default router;

