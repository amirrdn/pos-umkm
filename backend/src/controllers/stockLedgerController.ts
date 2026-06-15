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
    const data = await stockLedgerService.getInventorySummary(tenantId);
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

    const data = await stockLedgerService.getStockLedger(tenantId, productId);
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
    });

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
