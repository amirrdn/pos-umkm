import { logError } from '../lib/logger';
import { Request, Response } from 'express';
import { OutletService } from '../services/outletService';
import { createBranchSchema, updateOutletSchema } from '../schemas/outletSchema';
import { SubscriptionService } from '../services/subscriptionService';
import { getErrorMessage } from '../lib/errors';

const outletService = new OutletService();

export async function getAllOutlets(req: Request, res: Response) {
  try {
    const tenantId = req.tenantId!;
    const operationalOnly = req.query.operationalOnly === 'true';
    const outlets = await outletService.getAllOutlets(tenantId, operationalOnly);

    return res.status(200).json({
      success: true,
      message: 'Daftar outlet berhasil diambil.',
      data: outlets,
    });
  } catch (error: unknown) {
    logError('GetAllOutlets Controller Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan internal server saat mengambil daftar outlet.',
    });
  }
}

export async function getOutletById(req: Request, res: Response) {
  try {
    const tenantId = req.tenantId!;
    const id = req.params.id;
    const outlet = await outletService.getOutletById(tenantId, id);

    return res.status(200).json({
      success: true,
      message: 'Detail outlet berhasil diambil.',
      data: outlet,
    });
  } catch (error: unknown) {
    logError('GetOutletById Controller Error:', error);
    return res.status(404).json({
      success: false,
      message: getErrorMessage(error, 'Outlet tidak ditemukan.'),
    });
  }
}

export async function getOutletHierarchy(req: Request, res: Response) {
  try {
    const tenantId = req.tenantId!;
    const hierarchy = await outletService.getOutletHierarchy(tenantId);

    return res.status(200).json({
      success: true,
      message: 'Hierarki outlet berhasil diambil.',
      data: hierarchy,
    });
  } catch (error: unknown) {
    logError('GetOutletHierarchy Controller Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan internal server saat mengambil hierarki outlet.',
    });
  }
}

export async function getMainOutlet(req: Request, res: Response) {
  try {
    const tenantId = req.tenantId!;
    const outlet = await outletService.getMainOutlet(tenantId);

    return res.status(200).json({
      success: true,
      message: 'Outlet utama berhasil diambil.',
      data: outlet,
    });
  } catch (error: unknown) {
    logError('GetMainOutlet Controller Error:', error);
    return res.status(404).json({
      success: false,
      message: getErrorMessage(error, 'Outlet utama tidak ditemukan.'),
    });
  }
}

export async function createBranch(req: Request, res: Response) {
  try {
    const tenantId = req.tenantId!;
    const validation = createBranchSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validasi data cabang gagal.',
        errors: validation.error.format(),
      });
    }

    const canCreateOutlet = await SubscriptionService.checkOutletLimit(tenantId, {
      bypassLimits: req.isPlatformAdmin,
    });
    if (!canCreateOutlet) {
      return res.status(403).json({
        success: false,
        error: 'LIMIT_EXCEEDED',
        message:
          'Batas maksimal kapasitas outlet/cabang untuk paket Anda telah tercapai. Silakan lakukan upgrade untuk menambah cabang baru.',
      });
    }

    const outlet = await outletService.createBranch(tenantId, validation.data);

    return res.status(201).json({
      success: true,
      message: 'Cabang baru berhasil didaftarkan.',
      data: outlet,
    });
  } catch (error: unknown) {
    logError('CreateBranch Controller Error:', error);
    return res.status(400).json({
      success: false,
      message: getErrorMessage(error, 'Terjadi kesalahan internal server saat membuat cabang.'),
    });
  }
}

export async function updateMainOutlet(req: Request, res: Response) {
  try {
    const tenantId = req.tenantId!;
    const validation = updateOutletSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validasi pembaruan data outlet utama gagal.',
        errors: validation.error.format(),
      });
    }

    const outlet = await outletService.updateMainOutlet(tenantId, validation.data);

    return res.status(200).json({
      success: true,
      message: 'Informasi outlet utama berhasil diperbarui.',
      data: outlet,
    });
  } catch (error: unknown) {
    logError('UpdateMainOutlet Controller Error:', error);
    return res.status(400).json({
      success: false,
      message: getErrorMessage(error, 'Gagal memperbarui data outlet utama.'),
    });
  }
}

export async function updateOutlet(req: Request, res: Response) {
  try {
    const tenantId = req.tenantId!;
    const id = req.params.id;
    const validation = updateOutletSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validasi pembaruan data outlet gagal.',
        errors: validation.error.format(),
      });
    }

    const outlet = await outletService.updateOutlet(tenantId, id, validation.data);

    return res.status(200).json({
      success: true,
      message: 'Informasi outlet berhasil diperbarui.',
      data: outlet,
    });
  } catch (error: unknown) {
    logError('UpdateOutlet Controller Error:', error);
    return res.status(400).json({
      success: false,
      message: getErrorMessage(error, 'Gagal memperbarui data outlet.'),
    });
  }
}

export async function deleteOutlet(req: Request, res: Response) {
  try {
    const tenantId = req.tenantId!;
    const id = req.params.id;

    await outletService.deleteOutlet(tenantId, id);

    return res.status(200).json({
      success: true,
      message: 'Outlet berhasil dihapus secara halus.',
    });
  } catch (error: unknown) {
    logError('DeleteOutlet Controller Error:', error);
    return res.status(400).json({
      success: false,
      message: getErrorMessage(error, 'Gagal menghapus data outlet.'),
    });
  }
}
