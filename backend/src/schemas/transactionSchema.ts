import { z } from 'zod';

/**
 * Skema validasi payload checkout transaksi POS.
 */
export const paymentDetailSchema = z.object({
  paymentMethod: z.string().min(1, 'Metode pembayaran wajib diisi'),
  amount: z.number().positive('Nominal pembayaran harus lebih besar dari 0'),
  referenceNumber: z.string().optional(),
});

export const checkoutSchema = z.object({
  paymentMethod: z.string().optional(),
  payments: z.array(paymentDetailSchema).optional(),
  discountType: z.enum(['PERCENT', 'NOMINAL']).optional(),
  discountValue: z.number().nonnegative('Nilai diskon tidak boleh negatif').optional(),
  applyTax: z.boolean().optional(),
  customerId: z.string().nullable().optional(),
  shiftId: z.string().uuid('ID Shift harus berupa format UUID yang valid').optional(),
  items: z
    .array(
      z.object({
        productId: z.string().uuid('ID Produk harus berupa format UUID yang valid'),
        quantity: z
          .number()
          .int('Kuantitas harus berupa bilangan bulat')
          .positive('Kuantitas harus lebih besar dari 0'),
      })
    )
    .min(1, 'Daftar item belanja tidak boleh kosong'),
});

export type PaymentDetailInput = z.infer<typeof paymentDetailSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
