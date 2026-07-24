import { Request, Response } from 'express';
import { SupplierService } from '../services/supplierService';
import { createSupplierSchema, updateSupplierSchema } from '../schemas/supplier.schema';
import { getErrorMessage } from '../lib/errors';
import { logError } from '../lib/logger';

const supplierService = new SupplierService();

export async function getAllSuppliers(req: Request, res: Response) {
  try {
    const tenantId = req.tenantId!;
    const suppliers = await supplierService.getAllSuppliers(tenantId);
    return res.status(200).json({
      success: true,
      data: suppliers,
    });
  } catch (error: unknown) {
    logError('GetAllSuppliers error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil daftar supplier.',
    });
  }
}

export async function createSupplier(req: Request, res: Response) {
  try {
    const tenantId = req.tenantId!;
    const validation = createSupplierSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validasi data supplier gagal.',
        errors: validation.error.format(),
      });
    }

    const supplier = await supplierService.createSupplier(tenantId, validation.data);
    return res.status(201).json({
      success: true,
      message: 'Supplier berhasil ditambahkan.',
      data: supplier,
    });
  } catch (error: unknown) {
    logError('CreateSupplier error:', error);
    return res.status(400).json({
      success: false,
      message: getErrorMessage(error, 'Gagal menambahkan supplier.'),
    });
  }
}

export async function updateSupplier(req: Request, res: Response) {
  try {
    const tenantId = req.tenantId!;
    const { id } = req.params;
    const validation = updateSupplierSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validasi data supplier gagal.',
        errors: validation.error.format(),
      });
    }

    const supplier = await supplierService.updateSupplier(tenantId, id, validation.data);
    return res.status(200).json({
      success: true,
      message: 'Supplier berhasil diperbarui.',
      data: supplier,
    });
  } catch (error: unknown) {
    logError('UpdateSupplier error:', error);
    return res.status(400).json({
      success: false,
      message: getErrorMessage(error, 'Gagal memperbarui supplier.'),
    });
  }
}

export async function deleteSupplier(req: Request, res: Response) {
  try {
    const tenantId = req.tenantId!;
    const { id } = req.params;
    await supplierService.deleteSupplier(tenantId, id);
    return res.status(200).json({
      success: true,
      message: 'Supplier berhasil dihapus.',
    });
  } catch (error: unknown) {
    logError('DeleteSupplier error:', error);
    return res.status(400).json({
      success: false,
      message: getErrorMessage(error, 'Gagal menghapus supplier.'),
    });
  }
}
