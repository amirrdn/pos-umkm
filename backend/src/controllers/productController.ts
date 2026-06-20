import { Request, Response } from 'express';
import { ProductService } from '../services/productService';
import { createProductSchema, updateProductSchema, setPriceOverrideSchema } from '../schemas/productSchema';
import { SubscriptionService } from '../services/subscriptionService';
import { z } from 'zod';

const productService = new ProductService();

/**
 * Controller Layer untuk Pengelolaan Produk.
 */
export class ProductController {
  /**
   * Mengambil seluruh data produk aktif untuk tenant saat ini.
   */
  async getAllProducts(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      let outletId = req.outletId;

      if (req.hasTenantWideOutletAccess) {
        outletId = (req.query.outletId as string) || req.outletId || null;
      }

      const products = await productService.getAllProducts(tenantId, outletId);

      return res.status(200).json({
        success: true,
        message: 'Daftar produk berhasil diambil.',
        data: products
      });
    } catch (error: any) {
      console.error('GetAllProducts Controller Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan internal server saat mengambil daftar produk.'
      });
    }
  }

  /**
   * Membuat produk baru.
   */
  async createProduct(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;

      const validation = createProductSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: 'Validasi pembuatan produk gagal.',
          errors: validation.error.format()
        });
      }

      // Periksa batas kuota produk
      const canCreateProduct = await SubscriptionService.checkProductLimit(tenantId, {
        bypassLimits: req.isPlatformAdmin,
      });
      if (!canCreateProduct) {
        return res.status(403).json({
          success: false,
          error: 'LIMIT_EXCEEDED',
          message: 'Batas maksimal kapasitas produk untuk paket Anda telah tercapai. Silakan lakukan upgrade untuk menambah lebih banyak produk.'
        });
      }

      const product = await productService.createProduct(tenantId, validation.data);

      return res.status(201).json({
        success: true,
        message: 'Produk baru berhasil dibuat.',
        data: product
      });
    } catch (error: any) {
      console.error('CreateProduct Controller Error:', error);

      const message = error.message || '';
      if (message.includes('Kategori') || message.includes('SKU')) {
        return res.status(400).json({
          success: false,
          message: message
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan internal server saat membuat produk.'
      });
    }
  }

  /**
   * Memperbarui data produk.
   */
  async updateProduct(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const productId = req.params.id;

      const validation = updateProductSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: 'Validasi pembaruan produk gagal.',
          errors: validation.error.format()
        });
      }

      const updatedProduct = await productService.updateProduct(tenantId, productId, validation.data);

      return res.status(200).json({
        success: true,
        message: 'Produk berhasil diperbarui.',
        data: updatedProduct
      });
    } catch (error: any) {
      console.error('UpdateProduct Controller Error:', error);

      const message = error.message || '';
      if (message.includes('tidak ditemukan') || message.includes('Kategori') || message.includes('SKU')) {
        return res.status(400).json({
          success: false,
          message: message
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan internal server saat memperbarui produk.'
      });
    }
  }

  /**
   * Menghapus produk (Soft Delete).
   */
  async deleteProduct(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const productId = req.params.id;

      await productService.deleteProduct(tenantId, productId);

      return res.status(200).json({
        success: true,
        message: 'Produk berhasil dihapus.'
      });
    } catch (error: any) {
      console.error('DeleteProduct Controller Error:', error);

      const message = error.message || '';
      if (message.includes('tidak ditemukan')) {
        return res.status(400).json({
          success: false,
          message: message
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan internal server saat menghapus produk.'
      });
    }
  }

  /**
   * Mengunggah gambar produk.
   */
  async uploadImage(req: Request, res: Response) {
    try {
      const fileUrl = (req as any).fileUrl;
      if (!fileUrl) {
        return res.status(400).json({
          success: false,
          message: 'Tidak ada file yang diunggah.'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Gambar berhasil diunggah.',
        url: fileUrl
      });
    } catch (error: any) {
      console.error('UploadImage Controller Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan internal server saat mengunggah gambar.'
      });
    }
  }

  async setPriceOverride(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const validation = setPriceOverrideSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: 'Validasi harga khusus gagal.',
          errors: validation.error.format()
        });
      }

      const override = await productService.setPriceOverride(tenantId, validation.data);

      return res.status(200).json({
        success: true,
        message: 'Harga khusus cabang berhasil disimpan.',
        data: override
      });
    } catch (error: any) {
      console.error('[ProductController.setPriceOverride]', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Terjadi kesalahan saat mengatur harga khusus cabang.'
      });
    }
  }

  async deletePriceOverride(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const { outletId, productId } = req.body;

      if (!outletId || !productId) {
        return res.status(400).json({
          success: false,
          message: 'ID outlet dan ID produk wajib diisi.'
        });
      }

      await productService.deletePriceOverride(tenantId, outletId, productId);

      return res.status(200).json({
        success: true,
        message: 'Harga khusus cabang berhasil dihapus.'
      });
    } catch (error: any) {
      console.error('[ProductController.deletePriceOverride]', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Terjadi kesalahan saat menghapus harga khusus cabang.'
      });
    }
  }

  async setMinStock(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const schema = z.object({
        outletId: z.string().uuid(),
        productId: z.string().uuid(),
        minStock: z.number().int().nonnegative()
      });

      const validation = schema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: 'Validasi limit stok gagal.'
        });
      }

      const stock = await productService.setMinStock(tenantId, validation.data);

      return res.status(200).json({
        success: true,
        message: 'Limit stok minimum cabang berhasil disimpan.',
        data: stock
      });
    } catch (error: any) {
      console.error('[ProductController.setMinStock]', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Terjadi kesalahan saat mengatur limit stok minimum cabang.'
      });
    }
  }

  async getOutletSettingsForProduct(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const productId = req.params.id;

      const data = await productService.getOutletSettingsForProduct(tenantId, productId);

      return res.status(200).json({
        success: true,
        data
      });
    } catch (error: any) {
      console.error('[ProductController.getOutletSettingsForProduct]', error);
      return res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat mengambil pengaturan cabang produk.'
      });
    }
  }
}

