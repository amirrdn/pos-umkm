import { Router } from 'express';
import { OutletController } from '../controllers/outletController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { tenantMiddleware } from '../middlewares/tenantMiddleware';
import { requireRole } from '../middlewares/roleMiddleware';

const router = Router();
const controller = new OutletController();

router.use(authMiddleware);
router.use(tenantMiddleware);

/**
 * Route GET /api/outlets
 * Deskripsi: Mengambil semua daftar outlet aktif untuk tenant saat ini.
 */
router.get('/', requireRole(['Owner', 'TENANT_ADMIN', 'Manager', 'Kasir', 'Staf Gudang']), controller.getAllOutlets.bind(controller));

/**
 * Route GET /api/outlets/:id
 * Deskripsi: Mengambil informasi detail outlet.
 */
router.get('/:id', requireRole(['Owner', 'TENANT_ADMIN', 'Manager']), controller.getOutletById.bind(controller));

/**
 * Route POST /api/outlets
 * Deskripsi: Membuat/mendaftarkan outlet baru.
 */
router.post('/', requireRole(['Owner', 'TENANT_ADMIN']), controller.createOutlet.bind(controller));

/**
 * Route PUT /api/outlets/:id
 * Deskripsi: Memperbarui data outlet.
 */
router.put('/:id', requireRole(['Owner', 'TENANT_ADMIN']), controller.updateOutlet.bind(controller));

/**
 * Route DELETE /api/outlets/:id
 * Deskripsi: Menghapus outlet (Soft Delete).
 */
router.delete('/:id', requireRole(['Owner', 'TENANT_ADMIN']), controller.deleteOutlet.bind(controller));

export default router;
