import { z } from 'zod';

/**
 * Skema Validasi untuk Pembuatan Produk Baru.
 * categoryId menerima format ID custom (bukan UUID)
 */
export const createProductSchema = z.object({
  categoryId: z.string().min(1, 'ID Kategori wajib diisi'),
  name: z.string().min(1, 'Nama produk wajib diisi'),
  sku: z.string().optional(),
  purchasePrice: z.number().positive('Harga beli harus lebih besar dari 0'),
  sellingPrice: z.number().positive('Harga jual harus lebih besar dari 0'),
  stock: z.number().int('Stok harus berupa bilangan bulat').nonnegative('Stok tidak boleh bernilai negatif'),
  images: z.array(
    z.object({
      url: z.string().min(1, 'URL gambar wajib diisi'),
      isMain: z.boolean().optional()
    })
  ).optional()
});

/**
 * Skema Validasi untuk Pembaruan Produk.
 * Field `stock` sengaja dihilangkan — perubahan stok hanya boleh melalui Mutasi Stok (inventory mutations).
 */
export const updateProductSchema = createProductSchema.omit({ stock: true }).partial();

export const setPriceOverrideSchema = z.object({
  outletId: z.string().uuid('ID outlet tidak valid'),
  productId: z.string().uuid('ID produk tidak valid'),
  price: z.number().positive('Harga override harus lebih besar dari 0')
});
