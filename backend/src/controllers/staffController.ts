import { Request, Response } from 'express';
import { createStaffSchema, updateStaffSchema } from '../schemas/staffSchema';
import * as staffService from '../services/staffService';

// ==========================================
// STAFF CONTROLLER
// ==========================================

/**
 * GET /api/staff
 * Mengambil semua daftar karyawan dalam tenant aktif.
 * Hanya bisa diakses oleh Owner/Admin.
 */
export async function listStaff(req: Request, res: Response): Promise<Response> {
  try {
    const tenantId = req.tenantId!;
    const staff = await staffService.getStaffList(tenantId);
    return res.status(200).json({ success: true, data: staff });
  } catch (error: unknown) {
    console.error('[StaffController.listStaff]', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan saat mengambil daftar karyawan.' });
  }
}

/**
 * GET /api/staff/roles
 * Mengambil semua role yang tersedia untuk dropdown form.
 */
export async function listRoles(req: Request, res: Response): Promise<Response> {
  try {
    const tenantId = req.tenantId!;
    const roles = await staffService.getRoles(tenantId);
    return res.status(200).json({ success: true, data: roles });
  } catch (error: unknown) {
    console.error('[StaffController.listRoles]', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan saat mengambil data role.' });
  }
}

/**
 * POST /api/staff
 * Menambahkan karyawan baru dengan role yang dipilih Owner.
 */
export async function createStaff(req: Request, res: Response): Promise<Response> {
  try {
    const validation = createStaffSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validasi input gagal.',
        errors: validation.error.format(),
      });
    }

    const { name, email, password, roleId, outletIds } = validation.data;
    const tenantId = req.tenantId!;

    const newStaff = await staffService.createStaff({ tenantId, name, email, password, roleId, outletIds });
    return res.status(201).json({
      success: true,
      message: `Karyawan [${name}] berhasil ditambahkan.`,
      data: newStaff,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan internal server.';
    if (message.includes('email')) {
      return res.status(409).json({ success: false, message });
    }
    console.error('[StaffController.createStaff]', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan saat menambahkan karyawan.' });
  }
}

/**
 * PATCH /api/staff/:id
 * Memperbarui data karyawan: nama, status aktif, atau role.
 */
export async function updateStaff(req: Request, res: Response): Promise<Response> {
  try {
    const validation = updateStaffSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validasi input gagal.',
        errors: validation.error.format(),
      });
    }

    const tenantId = req.tenantId!;
    const { id } = req.params;

    const updated = await staffService.updateStaff(id, tenantId, validation.data);
    return res.status(200).json({
      success: true,
      message: 'Data karyawan berhasil diperbarui.',
      data: updated,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan internal server.';
    if (message.includes('tidak ditemukan')) {
      return res.status(404).json({ success: false, message });
    }
    console.error('[StaffController.updateStaff]', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan saat memperbarui karyawan.' });
  }
}

/**
 * DELETE /api/staff/:id
 * Melakukan soft delete pada akun karyawan.
 * Proteksi: tidak bisa menghapus diri sendiri.
 */
export async function deleteStaff(req: Request, res: Response): Promise<Response> {
  try {
    const tenantId = req.tenantId!;
    const requesterId = req.user!.id;
    const { id } = req.params;

    const result = await staffService.deleteStaff(id, tenantId, requesterId);
    return res.status(200).json({ success: true, message: result.message });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan internal server.';
    if (message.includes('sendiri') || message.includes('tidak ditemukan')) {
      return res.status(400).json({ success: false, message });
    }
    console.error('[StaffController.deleteStaff]', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan saat menghapus karyawan.' });
  }
}

/**
 * PATCH /api/staff/:id/approve
 * Admin menyetujui pendaftaran staf baru.
 */
export async function approveStaff(req: Request, res: Response): Promise<Response> {
  try {
    const tenantId = req.tenantId!;
    const { id } = req.params;

    const result = await staffService.approveStaff(id, tenantId);
    return res.status(200).json({ success: true, message: 'Pendaftaran staf berhasil disetujui.', data: result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan internal server.';
    if (message.includes('tidak ditemukan')) {
      return res.status(404).json({ success: false, message });
    }
    console.error('[StaffController.approveStaff]', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan saat menyetujui karyawan.' });
  }
}

/**
 * PATCH /api/staff/:id/reject
 * Admin menolak pendaftaran staf baru.
 */
export async function rejectStaff(req: Request, res: Response): Promise<Response> {
  try {
    const tenantId = req.tenantId!;
    const { id } = req.params;

    const result = await staffService.rejectStaff(id, tenantId);
    return res.status(200).json({ success: true, message: 'Pendaftaran staf berhasil ditolak.', data: result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan internal server.';
    if (message.includes('tidak ditemukan')) {
      return res.status(404).json({ success: false, message });
    }
    console.error('[StaffController.rejectStaff]', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan saat menolak karyawan.' });
  }
}
