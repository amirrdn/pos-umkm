import { Router } from 'express';
import { ProductController } from '../controllers/productController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { tenantMiddleware } from '../middlewares/tenantMiddleware';
import { requirePermission } from '../middlewares/roleMiddleware';
import { uploadSingleImage } from '../middlewares/uploadMiddleware';

const router = Router();
const productController = new ProductController();

router.use(authMiddleware);
router.use(tenantMiddleware);

/**
 * Route POST /api/products/upload
 * Deskripsi: Mengunggah file gambar ke server.
 */
router.post(
  '/upload',
  requirePermission('create:products'),
  uploadSingleImage,
  productController.uploadImage.bind(productController)
);


/**
 * Route GET /api/products/
 * Deskripsi: Mengambil semua daftar produk aktif.
 */
router.get(
  '/',
  requirePermission('view:products'),
  productController.getAllProducts.bind(productController)
);

/**
 * Route POST /api/products/
 * Deskripsi: Membuat produk baru.
 */
router.post(
  '/',
  requirePermission('create:products'),
  productController.createProduct.bind(productController)
);

/**
 * Route PUT /api/products/:id
 * Deskripsi: Memperbarui data produk tertentu berdasarkan ID.
 */
router.put(
  '/:id',
  requirePermission('update:products'),
  productController.updateProduct.bind(productController)
);

/**
 * Route DELETE /api/products/:id
 * Deskripsi: Menghapus produk (Soft Delete) berdasarkan ID.
 */
router.delete(
  '/:id',
  requirePermission('delete:products'),
  productController.deleteProduct.bind(productController)
);

export default router;
