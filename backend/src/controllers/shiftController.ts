import { Request, Response } from 'express';
import { openShiftSchema, closeShiftSchema } from '../schemas/shiftSchema';
import * as shiftService from '../services/shiftService';

// ==========================================
// SHIFT CONTROLLER
// ==========================================

/**
 * POST /api/shifts/open
 * Membuka shift kerja kasir dengan mencatat modal awal (uang di laci).
 * Hanya bisa dilakukan jika tidak ada shift OPEN yang sedang aktif.
 */
export async function openShift(req: Request, res: Response): Promise<Response> {
  try {
    const validation = openShiftSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validasi input gagal.',
        errors: validation.error.format(),
      });
    }

    const { cashStart } = validation.data;
    const tenantId = req.tenantId!;
    const userId = req.user!.id;
    const outletId = req.outletId;

    const shift = await shiftService.openShift({ tenantId, userId, cashStart, outletId });

    return res.status(201).json({
      success: true,
      message: 'Shift berhasil dibuka. Selamat bekerja!',
      data: shift,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan internal server.';

    if (message.includes('shift yang sedang aktif')) {
      return res.status(409).json({ success: false, message });
    }

    console.error('[ShiftController.openShift]', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan saat membuka shift.' });
  }
}

/**
 * GET /api/shifts/active
 * Mengambil data shift yang sedang aktif milik kasir yang sedang login.
 * Mengembalikan null jika tidak ada shift aktif.
 */
export async function getActiveShift(req: Request, res: Response): Promise<Response> {
  try {
    const tenantId = req.tenantId!;
    const userId = req.user!.id;

    const shift = await shiftService.getActiveShift(tenantId, userId);

    return res.status(200).json({
      success: true,
      data: shift,
    });
  } catch (error: unknown) {
    console.error('[ShiftController.getActiveShift]', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan saat mengambil data shift aktif.' });
  }
}

/**
 * POST /api/shifts/close
 * Menutup shift kerja kasir dan melakukan rekonsiliasi kas.
 * Sistem menghitung selisih antara kas yang diharapkan dan kas fisik aktual.
 */
export async function closeShift(req: Request, res: Response): Promise<Response> {
  try {
    const validation = closeShiftSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validasi input gagal.',
        errors: validation.error.format(),
      });
    }

    const { shiftId, cashActual } = validation.data;
    const tenantId = req.tenantId!;
    const userId = req.user!.id;

    const closedShift = await shiftService.closeShift({ shiftId, tenantId, userId, cashActual });

    return res.status(200).json({
      success: true,
      message: 'Shift berhasil ditutup. Terima kasih atas kerja kerasnya!',
      data: closedShift,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan internal server.';

    if (message.includes('tidak ditemukan') || message.includes('akses')) {
      return res.status(404).json({ success: false, message });
    }

    console.error('[ShiftController.closeShift]', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan saat menutup shift.' });
  }
}

/**
 * GET /api/shifts/history
 * Mengambil semua riwayat shift untuk tenant aktif.
 * Endpoint ini hanya dapat diakses oleh peran Owner/Admin.
 */
export async function getShiftHistory(req: Request, res: Response): Promise<Response> {
  try {
    const tenantId = req.tenantId!;

    const shifts = await shiftService.getShiftHistory(tenantId);

    return res.status(200).json({
      success: true,
      data: shifts,
    });
  } catch (error: unknown) {
    console.error('[ShiftController.getShiftHistory]', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan saat mengambil riwayat shift.' });
  }
}
