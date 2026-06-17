import { Request, Response } from 'express';
import { stockMutationSchema } from '../schemas/stockLedgerSchema';
import * as stockLedgerService from '../services/stockLedgerService';
import { MutationType } from '@prisma/client';

// ==========================================
// STOCK LEDGER CONTROLLER
// ==========================================

/**
 * GET /api/inventory
 * Mengambil ringkasan stok semua produk untuk tenant aktif.
 */
export async function getInventorySummary(req: Request, res: Response): Promise<Response> {
  try {
    const tenantId = req.tenantId!;
    const data = await stockLedgerService.getInventorySummary(tenantId, req.user?.outletId);
    return res.status(200).json({ success: true, data });
  } catch (error: unknown) {
    console.error('[StockLedgerController.getInventorySummary]', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan saat mengambil ringkasan inventaris.' });
  }
}

/**
 * GET /api/inventory/:productId/ledger
 * Mengambil kartu stok (riwayat mutasi) untuk sebuah produk.
 */
export async function getStockLedger(req: Request, res: Response): Promise<Response> {
  try {
    const tenantId = req.tenantId!;
    const { productId } = req.params;

    const data = await stockLedgerService.getStockLedger(tenantId, productId, req.user?.outletId);
    return res.status(200).json({ success: true, data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan internal server.';
    if (message.includes('tidak ditemukan')) {
      return res.status(404).json({ success: false, message });
    }
    console.error('[StockLedgerController.getStockLedger]', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan saat mengambil kartu stok.' });
  }
}

/**
 * POST /api/inventory/mutate
 * Melakukan mutasi stok manual: restok, penyesuaian, atau retur.
 */
export async function createStockMutation(req: Request, res: Response): Promise<Response> {
  try {
    const validation = stockMutationSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validasi input gagal.',
        errors: validation.error.format(),
      });
    }

    const tenantId = req.tenantId!;
    const userId = req.user!.id;
    const { productId, type, quantity, note } = validation.data;

    const result = await stockLedgerService.createStockMutation(tenantId, userId, {
      productId,
      type: type as MutationType,
      quantity,
      note,
    }, req.user?.outletId);

    if (result.isPendingApproval) {
      return res.status(201).json({
        success: true,
        message: `Permintaan mutasi stok berhasil diajukan dan menunggu persetujuan Owner/Manager.`,
        data: result,
      });
    }

    return res.status(201).json({
      success: true,
      message: `Mutasi stok berhasil dicatat. Stok baru: ${result.product.stock} unit.`,
      data: result,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan internal server.';
    if (message.includes('tidak ditemukan') || message.includes('tidak mencukupi')) {
      return res.status(400).json({ success: false, message });
    }
    console.error('[StockLedgerController.createStockMutation]', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan saat melakukan mutasi stok.' });
  }
}

/**
 * GET /api/inventory/requests
 * Mengambil semua StockRequest berstatus PENDING.
 */
export async function getStockRequests(req: Request, res: Response): Promise<Response> {
  try {
    const tenantId = req.tenantId!;
    const data = await stockLedgerService.listStockRequests(tenantId, req.user?.outletId);
    return res.status(200).json({ success: true, data });
  } catch (error: unknown) {
    console.error('[StockLedgerController.getStockRequests]', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan saat mengambil daftar permintaan persetujuan stok.' });
  }
}

/**
 * POST /api/inventory/requests/:id/approve
 * Menyetujui StockRequest.
 */
export async function approveRequest(req: Request, res: Response): Promise<Response> {
  try {
    const tenantId = req.tenantId!;
    const approvedById = req.user!.id;
    const { id } = req.params;

    const data = await stockLedgerService.approveStockRequest(tenantId, id, approvedById);
    return res.status(200).json({
      success: true,
      message: `Permintaan stok disetujui. Stok baru: ${data.product.stock} unit.`,
      data
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan internal server.';
    console.error('[StockLedgerController.approveRequest]', error);
    return res.status(400).json({ success: false, message });
  }
}

/**
 * POST /api/inventory/requests/:id/reject
 * Menolak StockRequest.
 */
export async function rejectRequest(req: Request, res: Response): Promise<Response> {
  try {
    const tenantId = req.tenantId!;
    const approvedById = req.user!.id;
    const { id } = req.params;

    const data = await stockLedgerService.rejectStockRequest(tenantId, id, approvedById);
    return res.status(200).json({
      success: true,
      message: 'Permintaan mutasi stok berhasil ditolak.',
      data
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan internal server.';
    console.error('[StockLedgerController.rejectRequest]', error);
    return res.status(400).json({ success: false, message });
  }
}

/**
 * PUT /api/inventory/settings
 * Mengubah pengaturan requireStockApproval milik tenant.
 */
export async function updateSettings(req: Request, res: Response): Promise<Response> {
  try {
    const tenantId = req.tenantId!;
    const { requireStockApproval } = req.body;

    if (typeof requireStockApproval !== 'boolean') {
      return res.status(400).json({ success: false, message: 'Nilai requireStockApproval harus boolean.' });
    }

    const data = await stockLedgerService.updateTenantSettings(tenantId, requireStockApproval);
    return res.status(200).json({
      success: true,
      message: `Pengaturan persetujuan stok berhasil diperbarui menjadi ${requireStockApproval ? 'aktif' : 'nonaktif'}.`,
      data
    });
  } catch (error: unknown) {
    console.error('[StockLedgerController.updateSettings]', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan saat memperbarui pengaturan.' });
  }
}

/**
 * GET /api/inventory/settings
 * Mengambil pengaturan requireStockApproval milik tenant.
 */
export async function getSettings(req: Request, res: Response): Promise<Response> {
  try {
    const tenantId = req.tenantId!;
    const data = await stockLedgerService.getTenantSettings(tenantId);
    if (!data) {
      return res.status(404).json({ success: false, message: 'Tenant tidak ditemukan.' });
    }
    return res.status(200).json({ success: true, data });
  } catch (error: unknown) {
    console.error('[StockLedgerController.getSettings]', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan saat mengambil pengaturan.' });
  }
}
