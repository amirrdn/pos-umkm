import { Router } from 'express';
import {
  getBestSellers,
  getBreakdown,
  getCashierReports,
  getShiftReports,
  getSummary,
  getTrend,
} from '../controllers/analyticsController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { tenantMiddleware } from '../middlewares/tenantMiddleware';
import { requireRole } from '../middlewares/roleMiddleware';

const router = Router();

router.use(authMiddleware);
router.use(tenantMiddleware);
router.use(requireRole(['Owner', 'Manager', 'Admin']));

router.get('/summary', getSummary);
router.get('/best-sellers', getBestSellers);
router.get('/trend', getTrend);
router.get('/cashiers', getCashierReports);
router.get('/breakdown', getBreakdown);
router.get('/shifts', getShiftReports);

export default router;
