import { logError } from '../lib/logger';
import { Request, Response } from 'express';
import { ProductService } from '../services/productService';
import { createProductSchema, updateProductSchema, setPriceOverrideSchema } from '../schemas/productSchema';
import { SubscriptionService } from '../services/subscriptionService';
import { z } from 'zod';
import { getErrorMessage } from '../lib/errors';

const productService = new ProductService();

export async function getAllProducts(req: Request, res: Response) {
  try {
    const tenantId = req.tenantId!;
    let outletId = req.outletId;

    if (req.hasTenantWideOutletAccess) {
      outletId = (req.query.outletId as string) || req.outletId || null;
    }

    const { search, categoryId, category } = req.query;

    const usePosCatalog = Boolean(outletId) && req.query.context !== 'master';
    const products = usePosCatalog
      ? await productService.getPosCatalogProducts(tenantId, outletId!)
      : await productService.getAllProducts({
          tenantId,
          outletId,
          search: typeof search === 'string' ? search : undefined,
          categoryId:
            typeof categoryId === 'string'
              ? categoryId
              : typeof category === 'string'
                ? category
                : undefined,
        });

    return res.status(200).json({
      success: true,
      message: 'Daftar produk berhasil diambil.',
      data: products,
    });
  } catch (error: unknown) {
    logError('GetAllProducts Controller Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan internal server saat mengambil daftar produk.',
    });
  }
}

export async function createProduct(req: Request, res: Response) {
  try {
    const tenantId = req.tenantId!;

    const validation = createProductSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validasi pembuatan produk gagal.',
        errors: validation.error.format(),
      });
    }

    const canCreateProduct = await SubscriptionService.checkProductLimit(tenantId, {
      bypassLimits: req.isPlatformAdmin,
    });
    if (!canCreateProduct) {
      return res.status(403).json({
        success: false,
        error: 'LIMIT_EXCEEDED',
        message:
          'Batas maksimal kapasitas produk untuk paket Anda telah tercapai. Silakan lakukan upgrade untuk menambah lebih banyak produk.',
      });
    }

    const product = await productService.createProduct(tenantId, validation.data);

    return res.status(201).json({
      success: true,
      message: 'Produk baru berhasil dibuat.',
      data: product,
    });
  } catch (error: unknown) {
    logError('CreateProduct Controller Error:', error);

    const message = getErrorMessage(error);
    if (message.includes('Kategori') || message.includes('SKU')) {
      return res.status(400).json({
        success: false,
        message,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan internal server saat membuat produk.',
    });
  }
}

export async function updateProduct(req: Request, res: Response) {
  try {
    const tenantId = req.tenantId!;
    const productId = req.params.id;

    const validation = updateProductSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validasi pembaruan produk gagal.',
        errors: validation.error.format(),
      });
    }

    const updatedProduct = await productService.updateProduct(tenantId, productId, validation.data);

    return res.status(200).json({
      success: true,
      message: 'Produk berhasil diperbarui.',
      data: updatedProduct,
    });
  } catch (error: unknown) {
    logError('UpdateProduct Controller Error:', error);

    const message = getErrorMessage(error);
    if (message.includes('tidak ditemukan') || message.includes('Kategori') || message.includes('SKU')) {
      return res.status(400).json({
        success: false,
        message,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan internal server saat memperbarui produk.',
    });
  }
}

export async function deleteProduct(req: Request, res: Response) {
  try {
    const tenantId = req.tenantId!;
    const productId = req.params.id;

    await productService.deleteProduct(tenantId, productId);

    return res.status(200).json({
      success: true,
      message: 'Produk berhasil dihapus.',
    });
  } catch (error: unknown) {
    logError('DeleteProduct Controller Error:', error);

    const message = getErrorMessage(error);
    if (message.includes('tidak ditemukan')) {
      return res.status(400).json({
        success: false,
        message,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan internal server saat menghapus produk.',
    });
  }
}

export async function uploadImage(req: Request, res: Response) {
  try {
    const fileUrl = req.fileUrl;
    if (!fileUrl) {
      return res.status(400).json({
        success: false,
        message: 'Tidak ada file yang diunggah.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Gambar berhasil diunggah.',
      url: fileUrl,
    });
  } catch (error: unknown) {
    logError('UploadImage Controller Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan internal server saat mengunggah gambar.',
    });
  }
}

export async function setPriceOverride(req: Request, res: Response) {
  try {
    const tenantId = req.tenantId!;
    let safeOutletId = req.body.outletId;
    if (!req.hasTenantWideOutletAccess) {
      safeOutletId = req.outletId;
    }
    const validation = setPriceOverrideSchema.safeParse({ ...req.body, outletId: safeOutletId });
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validasi harga khusus gagal.',
        errors: validation.error.format(),
      });
    }

    const override = await productService.setPriceOverride(tenantId, validation.data);

    return res.status(200).json({
      success: true,
      message: 'Harga khusus cabang berhasil disimpan.',
      data: override,
    });
  } catch (error: unknown) {
    logError('[ProductController.setPriceOverride]', error);
    return res.status(400).json({
      success: false,
      message: getErrorMessage(error, 'Terjadi kesalahan saat mengatur harga khusus cabang.'),
    });
  }
}

export async function deletePriceOverride(req: Request, res: Response) {
  try {
    const tenantId = req.tenantId!;
    let safeOutletId = req.body.outletId;
    if (!req.hasTenantWideOutletAccess) {
      safeOutletId = req.outletId;
    }
    const { productId } = req.body;

    if (!safeOutletId || !productId) {
      return res.status(400).json({
        success: false,
        message: 'ID outlet dan ID produk wajib diisi.',
      });
    }

    await productService.deletePriceOverride(tenantId, safeOutletId as string, productId);

    return res.status(200).json({
      success: true,
      message: 'Harga khusus cabang berhasil dihapus.',
    });
  } catch (error: unknown) {
    logError('[ProductController.deletePriceOverride]', error);
    return res.status(400).json({
      success: false,
      message: getErrorMessage(error, 'Terjadi kesalahan saat menghapus harga khusus cabang.'),
    });
  }
}

export async function setMinStock(req: Request, res: Response) {
  try {
    const tenantId = req.tenantId!;
    let safeOutletId = req.body.outletId;
    if (!req.hasTenantWideOutletAccess) {
      safeOutletId = req.outletId;
    }
    const schema = z.object({
      outletId: z.string().uuid(),
      productId: z.string().uuid(),
      minStock: z.number().int().nonnegative(),
    });

    const validation = schema.safeParse({ ...req.body, outletId: safeOutletId });
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validasi limit stok gagal.',
      });
    }

    const stock = await productService.setMinStock(tenantId, validation.data);

    return res.status(200).json({
      success: true,
      message: 'Limit stok minimum cabang berhasil disimpan.',
      data: stock,
    });
  } catch (error: unknown) {
    logError('[ProductController.setMinStock]', error);
    return res.status(400).json({
      success: false,
      message: getErrorMessage(error, 'Terjadi kesalahan saat mengatur limit stok minimum cabang.'),
    });
  }
}

export async function getOutletSettingsForProduct(req: Request, res: Response) {
  try {
    const tenantId = req.tenantId!;
    const productId = req.params.id;

    const data = await productService.getOutletSettingsForProduct(tenantId, productId);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error: unknown) {
    logError('[ProductController.getOutletSettingsForProduct]', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil pengaturan cabang produk.',
    });
  }
}
