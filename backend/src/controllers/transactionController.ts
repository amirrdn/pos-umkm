import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import {
  buildQrisSaleLedgerEntries,
  decrementOutletStock,
  getOutletStockLevel,
} from '../domain/inventory';
import { prisma } from '../lib/prisma';
import { MidtransService } from '../services/midtransService';
import { SubscriptionService } from '../services/subscriptionService';

// ==========================================
// SKEMA VALIDASI INPUT (ZOD) - DIPERBARUI DENGAN DISKON & PAJAK PPN

// ==========================================

export const checkoutSchema = z.object({
  paymentMethod: z.string().min(1, 'Metode pembayaran wajib diisi'),
  discountType: z.enum(['PERCENT', 'NOMINAL']).optional(),
  discountValue: z.number().nonnegative('Nilai diskon tidak boleh negatif').optional(),
  applyTax: z.boolean().optional(),
  customerId: z.string().nullable().optional(),
  shiftId: z.string().uuid('ID Shift harus berupa format UUID yang valid').optional(),
  items: z.array(
    z.object({
      productId: z.string().uuid('ID Produk harus berupa format UUID yang valid'),
      quantity: z.number().int('Kuantitas harus berupa bilangan bulat').positive('Kuantitas harus lebih besar dari 0')
    })
  ).min(1, 'Daftar item belanja tidak boleh kosong')
});

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
        errors: validation.error.format()
      });
    }

    const { items, discountType, discountValue, applyTax, paymentMethod, customerId, shiftId } = validation.data;

    const tenantId = req.tenantId!;
    const userId = req.user!.id;

    const subscriptionAccess = { bypassLimits: req.isPlatformAdmin };

    // Periksa batas kuota transaksi bulanan
    const canCreateTransaction = await SubscriptionService.checkTransactionLimit(
      tenantId,
      subscriptionAccess
    );
    if (!canCreateTransaction) {
      return res.status(403).json({
        success: false,
        error: 'LIMIT_EXCEEDED',
        message: 'Batas maksimal kuota transaksi bulanan untuk paket Anda telah tercapai. Silakan lakukan upgrade untuk melanjutkan penjualan.'
      });
    }

    if (paymentMethod === 'DEBT') {
      if (!customerId) {
        return res.status(400).json({
          success: false,
          message: 'Pelanggan wajib dipilih untuk metode pembayaran HUTANG.',
        });
      }

      try {
        await SubscriptionService.assertDebtPaymentAllowed(tenantId, subscriptionAccess);
      } catch (error: any) {
        return res.status(403).json({
          success: false,
          error: 'TIER_INSUFFICIENT',
          message: error.message,
        });
      }
    }

    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const invoiceNumber = `INV-${today}-${Date.now()}-${randomSuffix}`;

    const result = await prisma.$transaction(async (tx) => {
      let subTotal = new Prisma.Decimal(0);
      const itemsToCreate: {
        productId: string;
        quantity: number;
        priceAtTransaction: Prisma.Decimal;
        costAtTransaction: Prisma.Decimal;
        subtotal: Prisma.Decimal;
      }[] = [];
      const stockLedgerEntries: {
        tenantId: string;
        productId: string;
        userId: string;
        type: 'SALE';
        quantity: number;
        stockBefore: number;
        stockAfter: number;
        outletId?: string | null;
        note: string;
      }[] = [];

      for (const item of items) {
        const product = await tx.product.findFirst({
          where: {
            id: item.productId,
            tenantId: tenantId,
            deletedAt: null
          }
        });

        if (!product) {
          throw new Error(`Produk dengan ID ${item.productId} tidak ditemukan di tenant Anda.`);
        }

        if (!req.outletId) {
          throw new Error('Aksi ditolak: Transaksi POS wajib dikaitkan dengan Outlet aktif.');
        }

        const outletId = req.outletId;

        const priceOverride = await tx.outletProductPrice.findUnique({
          where: {
            outletId_productId: {
              outletId,
              productId: product.id,
            },
          },
        });
        const activeSellingPrice = priceOverride ? priceOverride.price : product.sellingPrice;

        const sellingPrice = new Prisma.Decimal(activeSellingPrice);
        const costPrice = new Prisma.Decimal(product.purchasePrice);
        const itemSubtotal = sellingPrice.mul(item.quantity);
        subTotal = subTotal.add(itemSubtotal);

        itemsToCreate.push({
          productId: product.id,
          quantity: item.quantity,
          priceAtTransaction: sellingPrice,
          costAtTransaction: costPrice,
          subtotal: itemSubtotal,
        });

        const { stockBefore, stockAfter } =
          paymentMethod === 'QRIS'
            ? await (async () => {
                const level = await getOutletStockLevel(outletId, product.id, tx);
                if (level < item.quantity) {
                  throw new Error(
                    `Stok tidak mencukupi untuk ${product.name}. Tersedia: ${level}, diminta: ${item.quantity}.`
                  );
                }
                return { stockBefore: level, stockAfter: level - item.quantity };
              })()
            : await decrementOutletStock(
                tx,
                tenantId,
                outletId,
                product.id,
                item.quantity
              );

        if (paymentMethod !== 'QRIS') {
          stockLedgerEntries.push({
            tenantId,
            productId: product.id,
            userId,
            type: 'SALE' as const,
            quantity: -item.quantity,
            stockBefore,
            stockAfter,
            outletId,
            note: `Penjualan - Invoice`,
          });
        }
      }

      let discountAmount = new Prisma.Decimal(0);
      if (discountType === 'PERCENT' && discountValue && discountValue > 0) {
        const pct = new Prisma.Decimal(discountValue).div(100);
        discountAmount = subTotal.mul(pct);
      } else if (discountType === 'NOMINAL' && discountValue && discountValue > 0) {
        discountAmount = new Prisma.Decimal(discountValue);
      }

      if (discountAmount.gt(subTotal)) {
        discountAmount = subTotal;
      }
      let taxAmount = new Prisma.Decimal(0);
      const taxableAmount = subTotal.sub(discountAmount);
      if (applyTax) {
        taxAmount = taxableAmount.mul(0.11);
      }

      const grandTotal = taxableAmount.add(taxAmount);

      if (paymentMethod === 'DEBT' && !customerId) {
        throw new Error('Pelanggan wajib dipilih untuk metode pembayaran HUTANG.');
      }

      let earnedPoints = 0;
      if (customerId) {
        const customer = await tx.customer.findFirst({
          where: { id: customerId, tenantId }
        });
        if (!customer) {
          throw new Error('Pelanggan tidak ditemukan di tenant Anda.');
        }

        earnedPoints = Math.floor(grandTotal.toNumber() / 10000);

        const updateData: Prisma.CustomerUpdateInput = {};
        if (earnedPoints > 0) {
          updateData.points = { increment: earnedPoints };
        }
        if (paymentMethod === 'DEBT') {
          updateData.debtBalance = { increment: grandTotal };
        }

        if (Object.keys(updateData).length > 0) {
          await tx.customer.update({
            where: { id: customerId },
            data: updateData
          });
        }
      }

      if (shiftId) {
        const openShift = await tx.shift.findFirst({
          where: {
            id: shiftId,
            tenantId,
            userId,
            outletId: req.outletId,
            status: 'OPEN',
          },
          select: { id: true },
        });

        if (!openShift) {
          throw new Error('Shift tidak valid, sudah ditutup, atau tidak terbuka di outlet ini.');
        }
      }

      const transaction = await tx.transaction.create({
        data: {
          tenantId,
          userId,
          outletId: req.outletId || null,
          shiftId: shiftId ?? null,
          customerId: customerId || null,
          paymentMethod: paymentMethod ?? 'CASH',
          invoiceNumber,
          subTotal,
          discount: discountAmount,
          tax: taxAmount,
          grandTotal,
          status: paymentMethod === 'QRIS' ? 'PENDING' : 'COMPLETED',
          items: {
            create: itemsToCreate.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              priceAtTransaction: item.priceAtTransaction,
              costAtTransaction: item.costAtTransaction,
              subtotal: item.subtotal
            }))
          }
        },
        include: {
          items: {
            include: {
              product: { select: { name: true, sku: true } }
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
          },
          outlet: true
        }
      });

      if (paymentMethod !== 'QRIS' && stockLedgerEntries.length > 0) {
        await tx.stockLedger.createMany({
          data: stockLedgerEntries.map(entry => ({
            ...entry,
            transactionId: transaction.id,
            note: `${entry.note} ${invoiceNumber}`,
          })) as any,
        });
      }

      return transaction;
    }, { maxWait: 15000, timeout: 30000 });

    let finalResult = result;
    let qrString = '';
    if (paymentMethod === 'QRIS') {
      try {
        const chargeRes = await MidtransService.createQrisCharge(result.invoiceNumber, Number(result.grandTotal));
        const qrisUrl = chargeRes.qrisUrl;
        qrString = chargeRes.qrString;

        finalResult = await prisma.transaction.update({
          where: { id: result.id },
          data: { qrisUrl },
          include: {
            items: {
              include: {
                product: { select: { name: true, sku: true } }
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
            },
            outlet: true
          }
        });
      } catch (midtransError: any) {
        console.error('Midtrans API Charge Error:', midtransError);
        try {
          await prisma.transaction.delete({ where: { id: result.id } });
        } catch (cleanupError) {
          console.error('Gagal menghapus transaksi QRIS gagal:', cleanupError);
        }
        return res.status(500).json({
          success: false,
          message: `Gagal membuat pembayaran QRIS: ${midtransError.message}`
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: paymentMethod === 'QRIS'
        ? 'Transaksi QRIS berhasil dibuat. Silakan selesaikan pembayaran.'
        : 'Transaksi berhasil diselesaikan.',
      data: {
        ...finalResult,
        qrString: qrString || undefined
      }
    });

  } catch (error: any) {
    console.error('Checkout Error:', error);

    const errorMessage = error.message || '';
    if (
      errorMessage.includes('tidak ditemukan') ||
      errorMessage.includes('stok') ||
      errorMessage.includes('Stok') ||
      errorMessage.includes('Outlet aktif')
    ) {
      return res.status(400).json({
        success: false,
        message: errorMessage
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan internal server saat memproses transaksi checkout.'
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
