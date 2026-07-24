import { z } from "zod";

export const poItemSchema = z.object({
  productId: z.string().uuid("ID produk tidak valid"),
  quantity: z.number().int().positive("Kuantitas minimal 1"),
  costPrice: z.number().nonnegative("Harga beli tidak boleh negatif"),
});

export const createPOSchema = z.object({
  supplierId: z.string().uuid("ID supplier tidak valid"),
  outletId: z.string().uuid("ID outlet tidak valid").optional(),
  expectedDate: z.string().optional(),
  items: z.array(poItemSchema).min(1, "Harus ada minimal 1 item produk dalam PO"),
});

export const updatePOSchema = createPOSchema.partial();

export type CreatePOInput = z.infer<typeof createPOSchema>;
export type UpdatePOInput = z.infer<typeof updatePOSchema>;
