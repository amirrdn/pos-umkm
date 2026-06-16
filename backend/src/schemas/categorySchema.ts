import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Nama kategori wajib diisi'),
  prefix: z.string().min(1, 'Prefix SKU wajib diisi').max(10, 'Prefix SKU maksimal 10 karakter').toUpperCase()
});

export const updateCategorySchema = createCategorySchema.partial();
