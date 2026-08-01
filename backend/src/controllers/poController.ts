import { Request, Response } from 'express';
import { POService } from '../services/poService';
import { createPOSchema } from '../schemas/po.schema';
import { getErrorMessage } from '../lib/errors';
import { logError } from '../lib/logger';

const poService = new POService();

export async function getAllPO(req: Request, res: Response) {
  try {
    const tenantId = req.tenantId!;
    const { search, status, supplierId, outletId, page, limit } = req.query;

    const result = await poService.getAllPO({
      tenantId,
      search: typeof search === 'string' ? search : undefined,
      status: typeof status === 'string' ? status : undefined,
      supplierId: typeof supplierId === 'string' ? supplierId : undefined,
      outletId: typeof outletId === 'string' ? outletId : undefined,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
    });

    return res.status(200).json({
      success: true,
      data: result.orders,
      pagination: result.pagination,
    });
  } catch (error: unknown) {
    logError('GetAllPO error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil daftar Purchase Order.',
    });
  }
}

export async function getPOById(req: Request, res: Response) {
  try {
    const tenantId = req.tenantId!;
    const { id } = req.params;
    const order = await poService.getPOById(tenantId, id);
    return res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error: unknown) {
    logError('GetPOById error:', error);
    return res.status(400).json({
      success: false,
      message: getErrorMessage(error, 'Gagal mengambil detail PO.'),
    });
  }
}

export async function createPO(req: Request, res: Response) {
  try {
    const tenantId = req.tenantId!;
    const userId = req.user!.id;

    const validation = createPOSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validasi data PO gagal.',
        errors: validation.error.format(),
      });
    }

    const po = await poService.createPO(tenantId, userId, validation.data);
    return res.status(201).json({
      success: true,
      message: 'Purchase Order berhasil dibuat.',
      data: po,
    });
  } catch (error: unknown) {
    logError('CreatePO error:', error);
    return res.status(400).json({
      success: false,
      message: getErrorMessage(error, 'Gagal membuat Purchase Order.'),
    });
  }
}

export async function receivePO(req: Request, res: Response) {
  try {
    const tenantId = req.tenantId!;
    const userId = req.user!.id;
    const { id } = req.params;

    const po = await poService.receivePO(tenantId, userId, id);
    return res.status(200).json({
      success: true,
      message: 'Barang berhasil diterima dan stok otomatis diperbarui.',
      data: po,
    });
  } catch (error: unknown) {
    logError('ReceivePO error:', error);
    return res.status(400).json({
      success: false,
      message: getErrorMessage(error, 'Gagal memproses penerimaan PO.'),
    });
  }
}

export async function cancelPO(req: Request, res: Response) {
  try {
    const tenantId = req.tenantId!;
    const { id } = req.params;

    const po = await poService.cancelPO(tenantId, id);
    return res.status(200).json({
      success: true,
      message: 'Purchase Order berhasil dibatalkan.',
      data: po,
    });
  } catch (error: unknown) {
    logError('CancelPO error:', error);
    return res.status(400).json({
      success: false,
      message: getErrorMessage(error, 'Gagal membatalkan PO.'),
    });
  }
}
