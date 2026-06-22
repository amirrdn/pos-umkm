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
    .min(1, 'ID Role tidak valid'),
  outletIds: z.array(z.string()).optional(),
});

/**
 * Skema untuk memperbarui data karyawan.
 * Semua field bersifat opsional — hanya field yang dikirim yang akan diperbarui.
 */
export const updateStaffSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter').max(50, 'Nama maksimal 50 karakter').optional(),
  isActive: z.boolean().optional(),
  roleId: z.string().min(1, 'ID Role tidak valid').optional(),
  outletIds: z.array(z.string()).optional(),
});

export const listStaffQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),
  roleName: z.string().trim().max(50).optional(),
  approvalStatus: z.enum(['APPROVED', 'PENDING']).optional(),
});

export const bulkApproveStaffSchema = z.object({
  staffIds: z
    .array(z.string().uuid('ID staf tidak valid'))
    .min(1, 'Pilih minimal satu staf untuk disetujui')
    .max(50, 'Maksimal 50 staf per permintaan'),
});
