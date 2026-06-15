import { z } from 'zod';

/**
 * Skema Validasi untuk proses Pembuatan Pelanggan Baru.
 */
export const createCustomerSchema = z.object({
  name: z.string().min(1, 'Nama pelanggan wajib diisi').max(100, 'Nama pelanggan maksimal 100 karakter'),
  phone: z.string().nullable().optional().transform(val => val === '' ? null : val),
  email: z.string().email('Format email tidak valid').nullable().optional().or(z.literal('')).transform(val => val === '' ? null : val)
});

/**
 * Skema Validasi untuk proses Pembaruan Pelanggan.
 */
export const updateCustomerSchema = z.object({
  name: z.string().min(1, 'Nama pelanggan wajib diisi').max(100, 'Nama pelanggan maksimal 100 karakter').optional(),
  phone: z.string().nullable().optional().transform(val => val === '' ? null : val),
  email: z.string().email('Format email tidak valid').nullable().optional().or(z.literal('')).transform(val => val === '' ? null : val)
});
