import { Request, Response } from 'express';
import { CategoryService } from '../services/categoryService';
import { createCategorySchema, updateCategorySchema } from '../schemas/categorySchema';

const categoryService = new CategoryService();

export class CategoryController {
  async getAllCategories(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const categories = await categoryService.getAllCategories(tenantId);
      return res.status(200).json({
        success: true,
        data: categories
      });
    } catch (error: any) {
      console.error('GetAllCategories error:', error);
      return res.status(500).json({
        success: false,
        message: 'Gagal mengambil daftar kategori.'
      });
    }
  }

  async createCategory(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const validation = createCategorySchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: 'Validasi kategori gagal.',
          errors: validation.error.format()
        });
      }

      const category = await categoryService.createCategory(tenantId, validation.data);
      return res.status(201).json({
        success: true,
        message: 'Kategori berhasil dibuat.',
        data: category
      });
    } catch (error: any) {
      console.error('CreateCategory error:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Gagal membuat kategori.'
      });
    }
  }

  async updateCategory(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const categoryId = req.params.id;
      
      const validation = updateCategorySchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: 'Validasi pembaruan kategori gagal.',
          errors: validation.error.format()
        });
      }

      const category = await categoryService.updateCategory(tenantId, categoryId, validation.data);
      return res.status(200).json({
        success: true,
        message: 'Kategori berhasil diperbarui.',
        data: category
      });
    } catch (error: any) {
      console.error('UpdateCategory error:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Gagal memperbarui kategori.'
      });
    }
  }

  async deleteCategory(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const categoryId = req.params.id;

      await categoryService.deleteCategory(tenantId, categoryId);
      return res.status(200).json({
        success: true,
        message: 'Kategori berhasil dihapus.'
      });
    } catch (error: any) {
      console.error('DeleteCategory error:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Gagal menghapus kategori.'
      });
    }
  }

  async getNextSku(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const categoryId = req.params.id;

      const nextSku = await categoryService.getNextSkuForCategory(tenantId, categoryId);
      return res.status(200).json({
        success: true,
        data: { nextSku }
      });
    } catch (error: any) {
      console.error('GetNextSku error:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Gagal membuat SKU otomatis.'
      });
    }
  }
}
