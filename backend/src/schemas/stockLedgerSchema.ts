import { z } from 'zod';

/**
 * Skema untuk mutasi stok manual (restok, penyesuaian, retur).
 * Operasi SALE sudah ditangani otomatis oleh checkout.
 */
export const stockMutationSchema = z.object({
  productId: z.string().uuid('ID produk tidak valid'),
  type: z.enum(['RESTOCK', 'ADJUSTMENT_PLUS', 'ADJUSTMENT_MINUS', 'RETURN'], {
    message: 'Jenis mutasi tidak valid. Pilih: RESTOCK, ADJUSTMENT_PLUS, ADJUSTMENT_MINUS, atau RETURN',
  }),
  quantity: z
    .number({ message: 'Jumlah harus berupa angka dan wajib diisi' })
    .int('Jumlah harus bilangan bulat')
    .positive('Jumlah harus lebih dari 0'),
  note: z.string().max(200, 'Catatan maksimal 200 karakter').optional(),
});
