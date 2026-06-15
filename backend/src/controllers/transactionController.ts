import { Request, Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// ==========================================
// SKEMA VALIDASI INPUT (ZOD) - DIPERBARUI DENGAN DISKON & PAJAK PPN

// ==========================================

export const checkoutSchema = z.object({
  paymentMethod: z.string().min(1, 'Metode pembayaran wajib diisi'),
  discountType: z.enum(['PERCENT', 'NOMINAL']).optional(),
  discountValue: z.number().nonnegative('Nilai diskon tidak boleh negatif').optional(),
  applyTax: z.boolean().optional(),
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

    const { items, discountType, discountValue, applyTax, paymentMethod } = validation.data;

    const tenantId = req.tenantId!;
    const userId = req.user!.id;

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

        if (product.stock < item.quantity) {
          throw new Error(`Stok produk "${product.name}" tidak mencukupi. Stok saat ini: ${product.stock}, diminta: ${item.quantity}.`);
        }
        const sellingPrice = new Prisma.Decimal(product.sellingPrice);
        const costPrice = new Prisma.Decimal(product.purchasePrice);
        const itemSubtotal = sellingPrice.mul(item.quantity);
        subTotal = subTotal.add(itemSubtotal);

        itemsToCreate.push({
          productId: product.id,
          quantity: item.quantity,
          priceAtTransaction: sellingPrice,
          costAtTransaction: costPrice,
          subtotal: itemSubtotal
        });

        const stockBefore = product.stock;
        const stockAfter = stockBefore - item.quantity;

        await tx.product.update({
          where: { id: product.id },
          data: { stock: { decrement: item.quantity } }
        });

        stockLedgerEntries.push({
          tenantId,
          productId: product.id,
          userId,
          type: 'SALE' as const,
          quantity: -item.quantity,
          stockBefore,
          stockAfter,
          note: `Penjualan - Invoice`,
        });
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

      const transaction = await tx.transaction.create({
        data: {
          tenantId,
          userId,
          shiftId: req.body.shiftId ?? null,
          paymentMethod: paymentMethod ?? 'CASH',
          invoiceNumber,
          subTotal,
          discount: discountAmount,
          tax: taxAmount,
          grandTotal,
          status: 'COMPLETED',
          items: {
            create: itemsToCreate.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              priceAtTransaction: item.priceAtTransaction,
              costAtTransaction: item.costAtTransaction,
              subtotal: item.subtotal
            }))
          }
        } as any,
        include: {
          items: {
            include: {
              product: { select: { name: true, sku: true } }
            }
          }
        }
      });

      if (stockLedgerEntries.length > 0) {
        await tx.stockLedger.createMany({
          data: stockLedgerEntries.map(entry => ({
            ...entry,
            transactionId: transaction.id,
            note: `${entry.note} ${invoiceNumber}`,
          })) as any,
        });
      }

      return transaction;
    });

    return res.status(200).json({
      success: true,
      message: 'Transaksi berhasil diselesaikan.',
      data: result
    });

  } catch (error: any) {
    console.error('Checkout Error:', error);

    const errorMessage = error.message || '';
    if (errorMessage.includes('tidak ditemukan') || errorMessage.includes('stok') || errorMessage.includes('Stok')) {
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

    const transactions = await prisma.transaction.findMany({
      where: {
        tenantId: tenantId
      },
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
        }
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
