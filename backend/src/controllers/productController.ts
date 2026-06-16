import { Request, Response } from 'express';
import { ProductService } from '../services/productService';
import { createProductSchema, updateProductSchema } from '../schemas/productSchema';

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
      const products = await productService.getAllProducts(tenantId);

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
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Tidak ada file yang diunggah.'
        });
      }

      const fileUrl = `/uploads/${req.file.filename}`;

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
}

