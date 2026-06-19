import { Router } from 'express';
import { CategoryController } from '../controllers/categoryController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { tenantMiddleware } from '../middlewares/tenantMiddleware';
import { requireRole } from '../middlewares/roleMiddleware';

const router = Router();
const controller = new CategoryController();

router.use(authMiddleware);
router.use(tenantMiddleware);

// GET /api/categories - Ambil semua kategori (Owner, Manager, Staf Gudang, Kasir)
router.get('/', requireRole(['Owner', 'Manager', 'Admin', 'Staf Gudang', 'Kasir']), (req, res) => controller.getAllCategories(req, res));

// POST /api/categories - Tambah kategori baru (Owner, Manager, Staf Gudang)
router.post('/', requireRole(['Owner', 'Manager', 'Admin', 'Staf Gudang']), (req, res) => controller.createCategory(req, res));

// PUT /api/categories/:id - Perbarui data kategori (Owner, Manager, Staf Gudang)
router.put('/:id', requireRole(['Owner', 'Manager', 'Admin', 'Staf Gudang']), (req, res) => controller.updateCategory(req, res));

// DELETE /api/categories/:id - Hapus kategori (Owner, Manager, Staf Gudang)
router.delete('/:id', requireRole(['Owner', 'Manager', 'Admin', 'Staf Gudang']), (req, res) => controller.deleteCategory(req, res));

// GET /api/categories/:id/next-sku - Hitung SKU otomatis berikutnya berdasarkan kategori (Owner, Manager, Staf Gudang)
router.get('/:id/next-sku', requireRole(['Owner', 'Manager', 'Admin', 'Staf Gudang']), (req, res) => controller.getNextSku(req, res));

export default router;
