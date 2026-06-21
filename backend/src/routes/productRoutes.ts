import { Router, Request, Response, NextFunction } from 'express';
import {
  createProduct,
  deletePriceOverride,
  deleteProduct,
  getAllProducts,
  getOutletSettingsForProduct,
  setMinStock,
  setPriceOverride,
  updateProduct,
  uploadImage,
} from '../controllers/productController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { tenantMiddleware } from '../middlewares/tenantMiddleware';
import { requirePermission } from '../middlewares/roleMiddleware';
import { uploadSingleImage } from '../middlewares/uploadMiddleware';

const router = Router();

const extendTimeout = (req: Request, res: Response, next: NextFunction) => {
  req.setTimeout(300000, () => {
    console.error('Request timeout reached for product submission');
    if (!res.headersSent) {
      res.status(408).json({
        success: false,
        message: 'Request timeout. Proses memakan waktu terlalu lama.',
      });
    }
  });
  next();
};

router.use(authMiddleware);
router.use(tenantMiddleware);

router.post('/upload', requirePermission('create:products'), extendTimeout, uploadSingleImage, uploadImage);
router.get('/', requirePermission('view:products'), getAllProducts);
router.post('/', requirePermission('create:products'), extendTimeout, createProduct);
router.put('/:id', requirePermission('update:products'), updateProduct);
router.delete('/:id', requirePermission('delete:products'), deleteProduct);
router.post('/price-override', requirePermission('update:products'), setPriceOverride);
router.delete('/price-override', requirePermission('update:products'), deletePriceOverride);
router.post('/min-stock', requirePermission('update:products'), setMinStock);
router.get('/:id/outlet-settings', requirePermission('view:products'), getOutletSettingsForProduct);

export default router;
