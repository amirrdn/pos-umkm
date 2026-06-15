import { z } from 'zod';

/**
 * Skema Validasi untuk Pembuatan Produk Baru.
 */
export const createProductSchema = z.object({
  categoryId: z.string().min(1, 'ID Kategori wajib diisi').uuid('ID Kategori harus berupa format UUID yang valid'),
  name: z.string().min(1, 'Nama produk wajib diisi'),
  sku: z.string().min(1, 'SKU produk wajib diisi'),
  purchasePrice: z.number().positive('Harga beli harus lebih besar dari 0'),
  sellingPrice: z.number().positive('Harga jual harus lebih besar dari 0'),
  stock: z.number().int('Stok harus berupa bilangan bulat').nonnegative('Stok tidak boleh bernilai negatif')
});

/**
 * Skema Validasi untuk Pembaruan Produk (semua field opsional).
 */
export const updateProductSchema = createProductSchema.partial();
