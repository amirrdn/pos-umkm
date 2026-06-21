import { Request, Response } from 'express';
import { CategoryService } from '../services/categoryService';
import { createCategorySchema, updateCategorySchema } from '../schemas/categorySchema';
import { getErrorMessage } from '../lib/errors';

const categoryService = new CategoryService();

export async function getAllCategories(req: Request, res: Response) {
  try {
    const tenantId = req.tenantId!;
    const categories = await categoryService.getAllCategories(tenantId);
    return res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error: unknown) {
    console.error('GetAllCategories error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil daftar kategori.',
    });
  }
}

export async function createCategory(req: Request, res: Response) {
  try {
    const tenantId = req.tenantId!;
    const validation = createCategorySchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validasi kategori gagal.',
        errors: validation.error.format(),
      });
    }

    const category = await categoryService.createCategory(tenantId, validation.data);
    return res.status(201).json({
      success: true,
      message: 'Kategori berhasil dibuat.',
      data: category,
    });
  } catch (error: unknown) {
    console.error('CreateCategory error:', error);
    return res.status(400).json({
      success: false,
      message: getErrorMessage(error, 'Gagal membuat kategori.'),
    });
  }
}

export async function updateCategory(req: Request, res: Response) {
  try {
    const tenantId = req.tenantId!;
    const categoryId = req.params.id;

    const validation = updateCategorySchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validasi pembaruan kategori gagal.',
        errors: validation.error.format(),
      });
    }

    const category = await categoryService.updateCategory(tenantId, categoryId, validation.data);
    return res.status(200).json({
      success: true,
      message: 'Kategori berhasil diperbarui.',
      data: category,
    });
  } catch (error: unknown) {
    console.error('UpdateCategory error:', error);
    return res.status(400).json({
      success: false,
      message: getErrorMessage(error, 'Gagal memperbarui kategori.'),
    });
  }
}

export async function deleteCategory(req: Request, res: Response) {
  try {
    const tenantId = req.tenantId!;
    const categoryId = req.params.id;

    await categoryService.deleteCategory(tenantId, categoryId);
    return res.status(200).json({
      success: true,
      message: 'Kategori berhasil dihapus.',
    });
  } catch (error: unknown) {
    console.error('DeleteCategory error:', error);
    return res.status(400).json({
      success: false,
      message: getErrorMessage(error, 'Gagal menghapus kategori.'),
    });
  }
}

export async function getNextSku(req: Request, res: Response) {
  try {
    const tenantId = req.tenantId!;
    const categoryId = req.params.id;

    const nextSku = await categoryService.getNextSkuForCategory(tenantId, categoryId);
    return res.status(200).json({
      success: true,
      data: { nextSku },
    });
  } catch (error: unknown) {
    console.error('GetNextSku error:', error);
    return res.status(400).json({
      success: false,
      message: getErrorMessage(error, 'Gagal membuat SKU otomatis.'),
    });
  }
}
