import { Request, Response } from 'express';
import { SalesReturnService } from '../services/salesReturnService';
import { createSalesReturnSchema } from '../schemas/salesReturnSchema';
import { getErrorMessage } from '../lib/errors';
import { logError } from '../lib/logger';

const salesReturnService = new SalesReturnService();

/**
 * Endpoint handler to fetch all sales return records.
 */
export async function getAllSalesReturns(req: Request, res: Response) {
  try {
    const tenantId = req.tenantId!;
    const returns = await salesReturnService.getAllSalesReturns(tenantId);
    return res.status(200).json({
      success: true,
      data: returns,
    });
  } catch (error: unknown) {
    logError('GetAllSalesReturns error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil daftar retur penjualan.',
    });
  }
}

/**
 * Endpoint handler to fetch details of a specific sales return.
 */
export async function getSalesReturnById(req: Request, res: Response) {
  try {
    const tenantId = req.tenantId!;
    const { id } = req.params;
    const salesReturn = await salesReturnService.getSalesReturnById(tenantId, id);
    return res.status(200).json({
      success: true,
      data: salesReturn,
    });
  } catch (error: unknown) {
    logError('GetSalesReturnById error:', error);
    return res.status(400).json({
      success: false,
      message: getErrorMessage(error, 'Gagal mengambil detail retur.'),
    });
  }
}

/**
 * Endpoint handler to process a new sales return and stock restoration.
 */
export async function createSalesReturn(req: Request, res: Response) {
  try {
    const tenantId = req.tenantId!;
    const userId = req.user!.id;

    const validation = createSalesReturnSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validasi pengembalian barang gagal.',
        errors: validation.error.format(),
      });
    }

    const salesReturn = await salesReturnService.createSalesReturn(tenantId, userId, validation.data);
    return res.status(201).json({
      success: true,
      message: 'Pengembalian barang berhasil diproses dan stok telah dikembalikan.',
      data: salesReturn,
    });
  } catch (error: unknown) {
    logError('CreateSalesReturn error:', error);
    return res.status(400).json({
      success: false,
      message: getErrorMessage(error, 'Gagal memproses pengembalian barang.'),
    });
  }
}
