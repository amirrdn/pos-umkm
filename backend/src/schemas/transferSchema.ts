import { z } from 'zod';

export const createTransferSchema = z.object({
  fromOutletId: z.string().min(1, 'ID outlet asal tidak valid'),
  toOutletId: z.string().min(1, 'ID outlet tujuan tidak valid'),
  note: z.string().max(200, 'Catatan maksimal 200 karakter').optional(),
  items: z
    .array(
      z.object({
        productId: z.string().min(1, 'ID produk tidak valid'),
        quantity: z
          .number({ message: 'Jumlah harus berupa angka' })
          .int('Jumlah harus bilangan bulat')
          .positive('Jumlah harus lebih dari 0'),
      })
    )
    .min(1, 'Transfer harus berisi minimal 1 item'),
}).refine((data) => data.fromOutletId !== data.toOutletId, {
  message: 'Outlet asal dan tujuan tidak boleh sama',
  path: ['toOutletId'],
});
