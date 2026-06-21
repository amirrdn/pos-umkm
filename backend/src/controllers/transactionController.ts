import { Request, Response } from 'express';
import {
  buildQrisSaleLedgerEntries,
} from '../domain/inventory';
import { isCheckoutError } from '../domain/transaction';
import { prisma } from '../lib/prisma';
import { MidtransService } from '../services/midtransService';
import { SubscriptionService } from '../services/subscriptionService';
import { processCheckout } from '../services/transactionCheckoutService';
import { checkoutSchema } from '../schemas/transactionSchema';

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
        message: 'Akses Ditolak: Konteks tenant tidak ditemukan.'
      });
    }

    const whereClause: any = {
      tenantId: tenantId
    };

    if (req.outletId) {
      whereClause.outletId = req.outletId;
    }

    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true
              }
            }
          }
        },
        customer: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        },
        outlet: true
      }
    });

    return res.status(200).json({
      success: true,
      data: transactions
    });
  } catch (error: any) {
    console.error('Error Get History:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan internal server saat mengambil riwayat transaksi.'
    });
  }
}

/**
 * Menangani callback webhook notifikasi global dari Midtrans.
 */
export async function handleMidtransWebhook(req: Request, res: Response) {
  try {
    const { order_id, status_code, gross_amount, signature_key, transaction_status } = req.body;

    if (!order_id || !status_code || !gross_amount || !signature_key) {
      console.warn('⚠️ Webhook Payload Tidak Lengkap:', req.body);
      return res.status(400).json({ success: false, message: 'Payload webhook tidak lengkap.' });
    }

    const isSignatureValid = MidtransService.verifySignature(order_id, status_code, gross_amount, signature_key);
    if (!isSignatureValid) {
      console.warn(`🚨 Signature Key Webhook TIDAK VALID untuk order: ${order_id}`);
      return res.status(403).json({ success: false, message: 'Verifikasi tanda tangan digital gagal.' });
    }

    if (order_id.startsWith('INV-SUB-')) {
      await SubscriptionService.processWebhook(req.body);
      return res.status(200).json({
        success: true,
        message: 'Notifikasi pembayaran langganan berhasil diproses via delegasi webhook.'
      });
    }

    const transaction = await prisma.transaction.findFirst({
      where: { invoiceNumber: order_id },
      include: { items: true }
    });

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan di sistem POS.' });
    }

    if (transaction.status !== 'PENDING') {
      return res.status(200).json({ success: true, message: 'Status transaksi sudah diproses sebelumnya.' });
    }

    if (transaction_status === 'settlement') {
      await prisma.$transaction(async (tx) => {
        await tx.transaction.update({
          where: { id: transaction.id },
          data: { status: 'COMPLETED' },
        });

        const stockLedgerEntries = await buildQrisSaleLedgerEntries(
          tx,
          { ...transaction, items: transaction.items },
          `Penjualan (QRIS Lunas) - Invoice ${order_id}`
        );

        if (stockLedgerEntries.length > 0) {
          await tx.stockLedger.createMany({ data: stockLedgerEntries });
        }
      }, { maxWait: 15000, timeout: 30000 });

      return res.status(200).json({ success: true, message: 'Pembayaran settlement berhasil diproses.' });
    }

    if (['expire', 'cancel', 'deny'].includes(transaction_status)) {
      await prisma.$transaction(async (tx) => {
        await tx.transaction.update({
          where: { id: transaction.id },
          data: { status: 'VOID' },
        });
      }, { maxWait: 15000, timeout: 30000 });

      return res.status(200).json({ success: true, message: 'Pembayaran dibatalkan.' });
    }

    return res.status(200).json({ success: true, message: `Status pending/lainnya: ${transaction_status}` });

  } catch (error: any) {
    console.error('Webhook Error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan sistem saat memproses webhook.' });
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

    const transaction = await prisma.transaction.findFirst({
      where: { invoiceNumber, tenantId },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            points: true
          }
        },
        outlet: true
      }
    });

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan.' });
    }

    let currentStatus = transaction.status;
    if (currentStatus === 'PENDING') {
      try {
        const midtransStatus = await MidtransService.getTransactionStatus(invoiceNumber);

        if (midtransStatus === 'settlement') {
          await prisma.$transaction(async (tx) => {
            await tx.transaction.update({
              where: { id: transaction.id },
              data: { status: 'COMPLETED' },
            });

            const transactionWithItems = await tx.transaction.findUnique({
              where: { id: transaction.id },
              include: { items: true },
            });

            if (transactionWithItems) {
              const stockLedgerEntries = await buildQrisSaleLedgerEntries(
                tx,
                transactionWithItems,
                `Penjualan (QRIS Lunas - Polling) - Invoice ${invoiceNumber}`
              );

              if (stockLedgerEntries.length > 0) {
                await tx.stockLedger.createMany({ data: stockLedgerEntries });
              }
            }
          }, { maxWait: 15000, timeout: 30000 });
          currentStatus = 'COMPLETED';
        } else if (['expire', 'cancel', 'deny'].includes(midtransStatus)) {
          await prisma.transaction.update({
            where: { id: transaction.id },
            data: { status: 'VOID' },
          });
          currentStatus = 'VOID';
        }
      } catch (midtransError: any) {
        console.warn(`[Status Polling] ⚠️ Gagal sinkronisasi status dari Midtrans untuk ${invoiceNumber}:`, midtransError.message);
      }
    }

    const updatedTransaction = await prisma.transaction.findFirst({
      where: { id: transaction.id },
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
                sku: true
              }
            }
          }
        },
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            points: true,
            debtBalance: true
          }
        }
      }
    });

    return res.status(200).json({
      success: true,
      data: updatedTransaction || {
        ...transaction,
        status: currentStatus
      }
    });
  } catch (error: any) {
    console.error('GetTransactionStatus Error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan sistem saat mengecek status transaksi.' });
  }
}
