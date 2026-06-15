import { z } from 'zod';

/**
 * Skema untuk menambahkan karyawan baru ke dalam tenant.
 * Owner wajib mengisi nama, email, password, dan role karyawan.
 */
export const createStaffSchema = z.object({
  name: z
    .string({ message: 'Nama wajib diisi' })
    .min(2, 'Nama minimal 2 karakter')
    .max(50, 'Nama maksimal 50 karakter'),
  email: z
    .string({ message: 'Email wajib diisi' })
    .email('Format email tidak valid'),
  password: z
    .string({ message: 'Password wajib diisi' })
    .min(6, 'Password minimal 6 karakter'),
  roleId: z
    .string({ message: 'Role wajib dipilih' })
    .uuid('ID Role tidak valid'),
});

/**
 * Skema untuk memperbarui data karyawan.
 * Semua field bersifat opsional — hanya field yang dikirim yang akan diperbarui.
 */
export const updateStaffSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter').max(50, 'Nama maksimal 50 karakter').optional(),
  isActive: z.boolean().optional(),
  roleId: z.string().uuid('ID Role tidak valid').optional(),
});
