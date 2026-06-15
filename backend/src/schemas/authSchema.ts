import { z } from 'zod';

/**
 * Skema Validasi untuk proses Login Autentikasi Pengguna.
 */
export const loginSchema = z.object({
  email: z.string().min(1, 'Email wajib diisi').email('Format email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi').min(6, 'Password minimal harus terdiri dari 6 karakter')
});

/**
 * Skema Validasi untuk proses Registrasi Tenant/UMKM Baru.
 */
export const registerSchema = z.object({
  tenantName: z.string().min(3, 'Nama toko minimal harus 3 karakter').max(50, 'Nama toko maksimal 50 karakter'),
  ownerName: z.string().min(3, 'Nama pemilik minimal harus 3 karakter').max(50, 'Nama pemilik maksimal 50 karakter'),
  email: z.string().min(1, 'Email wajib diisi').email('Format email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi').min(6, 'Password minimal harus terdiri dari 6 karakter')
});
