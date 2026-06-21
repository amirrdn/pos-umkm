import { Request, Response } from 'express';
import { isCheckoutError } from '../domain/transaction';
import { processCheckout } from '../services/transactionCheckoutService';
import { getTransactionHistory } from '../services/transactionHistoryService';
import { getTransactionForStatusPolling } from '../services/transactionStatusService';
import { processMidtransPosWebhook } from '../services/transactionWebhookService';
import { checkoutSchema } from '../schemas/transactionSchema';
import { logError } from '../lib/logger';

// ==========================================
// CONTROLLER TRANSAKSI
// ==========================================

/**
 * Meng-handle proses checkout kasir secara ACID menggunakan Prisma Interactive Transaction.
 */
export async function checkout(req: Request, res: Response) {
  try {
    const validation = checkoutSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validasi input gagal.',
        errors: validation.error.format(),
      });
    }

    const { paymentMethod } = validation.data;
    const result = await processCheckout({
      ...validation.data,
      tenantId: req.tenantId!,
      userId: req.user!.id,
      outletId: req.outletId ?? null,
      bypassSubscriptionLimits: req.isPlatformAdmin === true,
    });

    return res.status(200).json({
      success: true,
      message:
        paymentMethod === 'QRIS'
          ? 'Transaksi QRIS berhasil dibuat. Silakan selesaikan pembayaran.'
          : 'Transaksi berhasil diselesaikan.',
      data: {
        ...result.transaction,
        qrString: result.qrString || undefined,
      },
    });
  } catch (error: unknown) {
    console.error('Checkout Error:', error);

    if (isCheckoutError(error)) {
      const body: Record<string, unknown> = {
        success: false,
        message: error.message,
      };
      if (error.code === 'LIMIT_EXCEEDED' || error.code === 'TIER_INSUFFICIENT') {
        body.error = error.code;
      }
      return res.status(error.httpStatus).json(body);
    }

    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan internal server saat memproses transaksi checkout.',
    });
  }
}

/**
 * Mengambil riwayat transaksi untuk tenant yang sedang aktif.
 */
export async function getHistory(req: Request, res: Response) {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Akses Ditolak: Konteks tenant tidak ditemukan.',
      });
    }

    const transactions = await getTransactionHistory({
      tenantId,
      outletId: req.outletId,
    });

    return res.status(200).json({
      success: true,
      data: transactions,
    });
  } catch (error: unknown) {
    logError('getHistory', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan internal server saat mengambil riwayat transaksi.',
    });
  }
}

/**
 * Menangani callback webhook notifikasi global dari Midtrans.
 */
export async function handleMidtransWebhook(req: Request, res: Response) {
  try {
    const result = await processMidtransPosWebhook(req.body);
    return res.status(result.httpStatus).json({
      success: result.httpStatus < 400,
      message: result.message,
    });
  } catch (error: unknown) {
    logError('handleMidtransWebhook', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan sistem saat memproses webhook.',
    });
  }
}

/**
 * Pengecekan status transaksi untuk polling frontend.
 */
export async function getTransactionStatus(req: Request, res: Response) {
  try {
    const { invoiceNumber } = req.params;
    const tenantId = req.tenantId;

    if (!tenantId) {
      return res.status(400).json({ success: false, message: 'Konteks tenant tidak ditemukan.' });
    }

    const transaction = await getTransactionForStatusPolling({
      tenantId,
      invoiceNumber,
    });

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan.' });
    }

    const isPlatformAdminUser = req.isPlatformAdmin;
    const tenantWideAccess = req.hasTenantWideOutletAccess;
    const userOutletIds = req.user?.outletIds || [];

    if (transaction.outletId && !isPlatformAdminUser && !tenantWideAccess && !userOutletIds.includes(transaction.outletId)) {
      return res.status(403).json({
        success: false,
        message: 'Akses Ditolak: Anda tidak memiliki akses ke transaksi di outlet ini.'
      });
    }

    return res.status(200).json({
      success: true,
      data: transaction,
    });
  } catch (error: unknown) {
    logError('getTransactionStatus', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan sistem saat mengecek status transaksi.',
    });
  }
}
