import { z } from 'zod';

export const createBranchSchema = z.object({
  name: z.string().min(2, 'Nama outlet wajib diisi (minimal 2 karakter)'),
  code: z.string().max(10, 'Kode outlet maksimal 10 karakter').nullable().optional(),
  address: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
});

export const updateOutletSchema = z.object({
  name: z.string().min(2, 'Nama outlet wajib diisi (minimal 2 karakter)').optional(),
  code: z.string().max(10, 'Kode outlet maksimal 10 karakter').nullable().optional(),
  address: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});
