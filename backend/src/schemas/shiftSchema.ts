import { z } from 'zod';

/**
 * Skema Validasi untuk membuka shift kerja kasir.
 * Kasir wajib memasukkan jumlah uang modal awal yang ada di laci kas.
 */
export const openShiftSchema = z.object({
  cashStart: z
    .number({ message: 'Modal awal harus berupa angka dan wajib diisi' })
    .nonnegative('Modal awal tidak boleh bernilai negatif')
    .max(100_000_000, 'Modal awal tidak boleh melebihi Rp 100.000.000'),
});

/**
 * Skema Validasi untuk menutup shift kerja kasir.
 * Kasir wajib memasukkan jumlah uang fisik aktual yang ada di laci kas saat tutup shift.
 */
export const closeShiftSchema = z.object({
  shiftId: z.string().uuid('ID Shift tidak valid'),
  cashActual: z
    .number({ message: 'Jumlah uang aktual harus berupa angka dan wajib diisi' })
    .nonnegative('Jumlah uang aktual tidak boleh bernilai negatif')
    .max(1_000_000_000, 'Jumlah uang aktual tidak boleh melebihi Rp 1.000.000.000'),
});
