import { z } from 'zod';

export const salesReturnItemSchema = z.object({
  productId: z.string().uuid('ID produk tidak valid'),
  quantity: z.number().int().positive('Kuantitas retur minimal 1'),
  refundPrice: z.number().nonnegative('Harga refund tidak boleh negatif'),
});

export const createSalesReturnSchema = z.object({
  transactionId: z.string().uuid('ID transaksi tidak valid'),
  reason: z.string().min(3, 'Alasan pengembalian minimal 3 karakter'),
  items: z.array(salesReturnItemSchema).min(1, 'Harus ada minimal 1 produk yang dikembalikan'),
});

export type CreateSalesReturnInput = z.infer<typeof createSalesReturnSchema>;
