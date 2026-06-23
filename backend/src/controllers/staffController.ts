import { logError } from '../lib/logger';
import { Request, Response } from 'express';
import { createStaffSchema, bulkApproveStaffSchema, listStaffQuerySchema, updateStaffSchema } from '../schemas/staffSchema';
import * as staffService from '../services/staffService';

export async function listStaff(req: Request, res: Response): Promise<Response> {
  try {
    const validation = listStaffQuerySchema.safeParse(req.query);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Parameter filter tidak valid.',
      });
    }

    const tenantId = req.tenantId!;
    const { search, roleName, approvalStatus } = validation.data;
    const filters: staffService.StaffListFilters = {
      ...(search ? { search } : {}),
      ...(roleName ? { roleName } : {}),
      ...(approvalStatus ? { approvalStatus } : {}),
    };

    const [staff, summary] = await Promise.all([
      staffService.getStaffList(tenantId, filters),
      staffService.getStaffSummary(tenantId),
    ]);

    return res.status(200).json({ success: true, data: staff, summary });
  } catch (error: unknown) {
    logError('[StaffController.listStaff]', error);
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
    logError('[StaffController.listRoles]', error);
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
    logError('[StaffController.createStaff]', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan saat menambahkan karyawan.' });
  }
}

/**
 * PATCH /api/staff/bulk-approve
 * Menyetujui beberapa permintaan staf sekaligus.
 */
export async function bulkApproveStaff(req: Request, res: Response): Promise<Response> {
  try {
    const validation = bulkApproveStaffSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validasi input gagal.',
        errors: validation.error.format(),
      });
    }

    const tenantId = req.tenantId!;
    const result = await staffService.bulkApproveStaff(validation.data.staffIds, tenantId);

    return res.status(200).json({
      success: true,
      message: `${result.approvedCount} permintaan staf berhasil disetujui.`,
      data: result,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan internal server.';
    if (message.includes('tidak ada') || message.includes('valid')) {
      return res.status(400).json({ success: false, message });
    }
    logError('[StaffController.bulkApproveStaff]', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan saat menyetujui staf secara massal.' });
  }
}

/**
 * GET /api/staff/:id
 * Mengambil detail karyawan termasuk statistik shift.
 */
export async function getStaffDetail(req: Request, res: Response): Promise<Response> {
  try {
    const tenantId = req.tenantId!;
    const { id } = req.params;

    const detail = await staffService.getStaffDetail(id, tenantId);
    return res.status(200).json({ success: true, data: detail });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan internal server.';
    if (message.includes('tidak ditemukan')) {
      return res.status(404).json({ success: false, message });
    }
    logError('[StaffController.getStaffDetail]', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan saat mengambil detail karyawan.' });
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
    logError('[StaffController.updateStaff]', error);
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
    logError('[StaffController.deleteStaff]', error);
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
    logError('[StaffController.approveStaff]', error);
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
    logError('[StaffController.rejectStaff]', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan saat menolak karyawan.' });
  }
}
