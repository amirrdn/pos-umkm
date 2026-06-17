import { z } from 'zod';

export const createOutletSchema = z.object({
  name: z.string().min(2, 'Nama outlet wajib diisi (minimal 2 karakter)'),
  address: z.string().nullable().optional(),
  phone: z.string().nullable().optional()
});

export const updateOutletSchema = z.object({
  name: z.string().min(2, 'Nama outlet wajib diisi (minimal 2 karakter)').optional(),
  address: z.string().nullable().optional(),
  phone: z.string().nullable().optional()
});
