import { Request, Response } from 'express';
import { PlatformTenantService } from '../services/platformTenantService';
import { getErrorMessage } from '../lib/errors';
import { z } from 'zod';

const createTenantSchema = z.object({
  tenantName: z.string().min(3, 'Nama toko minimal 3 karakter'),
  ownerName: z.string().min(3, 'Nama pemilik minimal 3 karakter'),
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  phone: z.string().optional(),
  taxRate: z.number().min(0).max(1).optional(),
});

const updateTenantSchema = z.object({
  name: z.string().min(3, 'Nama toko minimal 3 karakter').optional(),
  phone: z.string().optional(),
  taxRate: z.number().min(0).max(1).optional(),
});

export async function listTenants(_req: Request, res: Response) {
  try {
    const tenants = await PlatformTenantService.listTenants();
    return res.status(200).json({
      success: true,
      message: 'Daftar tenant berhasil diambil.',
      data: tenants,
    });
  } catch (error: unknown) {
    console.error('Platform listTenants Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil daftar tenant.',
    });
  }
}

export async function getOverview(_req: Request, res: Response) {
  try {
    const overview = await PlatformTenantService.getOverview();
    return res.status(200).json({
      success: true,
      message: 'Ringkasan platform berhasil diambil.',
      data: overview,
    });
  } catch (error: unknown) {
    console.error('Platform getOverview Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil ringkasan platform.',
    });
  }
}

export async function getTenantById(req: Request, res: Response) {
  try {
    const tenant = await PlatformTenantService.getTenantById(req.params.id);
    return res.status(200).json({
      success: true,
      message: 'Detail tenant berhasil diambil.',
      data: tenant,
    });
  } catch (error: unknown) {
    console.error('Platform getTenantById Error:', error);
    return res.status(404).json({
      success: false,
      message: getErrorMessage(error, 'Tenant tidak ditemukan.'),
    });
  }
}

export async function updateTenantStatus(req: Request, res: Response) {
  try {
    const { status } = req.body;
    const actorUserId = req.user?.id || 'system-admin';

    if (!status || !['ACTIVE', 'SUSPENDED'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status tidak valid. Gunakan ACTIVE atau SUSPENDED.',
      });
    }

    const result = await PlatformTenantService.updateTenantStatus(
      req.params.id,
      status,
      actorUserId
    );

    return res.status(200).json({
      success: true,
      message: 'Status tenant berhasil diperbarui.',
      data: result,
    });
  } catch (error: unknown) {
    console.error('Platform updateTenantStatus Error:', error);
    return res.status(400).json({
      success: false,
      message: getErrorMessage(error, 'Gagal memperbarui status tenant.'),
    });
  }
}

export async function overrideSubscription(req: Request, res: Response) {
  try {
    const { tier, expiresAt, note } = req.body;
    const actorUserId = req.user?.id || 'system-admin';

    if (!tier || !['FREE', 'GROWTH', 'ENTERPRISE'].includes(tier)) {
      return res.status(400).json({
        success: false,
        message: 'Tier tidak valid. Gunakan FREE, GROWTH, atau ENTERPRISE.',
      });
    }

    let parsedExpiresAt: Date | null = null;
    if (expiresAt) {
      parsedExpiresAt = new Date(expiresAt);
      if (isNaN(parsedExpiresAt.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Format expiresAt tidak valid.',
        });
      }
    }

    const result = await PlatformTenantService.overrideSubscription(
      req.params.id,
      tier,
      parsedExpiresAt,
      actorUserId,
      note
    );

    return res.status(200).json({
      success: true,
      message: 'Langganan tenant berhasil di-override.',
      data: result,
    });
  } catch (error: unknown) {
    console.error('Platform overrideSubscription Error:', error);
    return res.status(400).json({
      success: false,
      message: getErrorMessage(error, 'Gagal meng-override langganan tenant.'),
    });
  }
}

export async function createTenant(req: Request, res: Response) {
  try {
    const validation = createTenantSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validasi input gagal.',
        errors: validation.error.format(),
      });
    }

    const actorUserId = req.user?.id || 'system-admin';
    const result = await PlatformTenantService.createTenant(validation.data, actorUserId);

    return res.status(201).json({
      success: true,
      message: 'Tenant berhasil dibuat dan owner diaktifkan.',
      data: result,
    });
  } catch (error: unknown) {
    console.error('Platform createTenant Error:', error);
    const message = getErrorMessage(error);
    if (message.includes('sudah digunakan')) {
      return res.status(400).json({ success: false, message });
    }
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan internal saat membuat tenant.',
    });
  }
}

export async function updateTenant(req: Request, res: Response) {
  try {
    const validation = updateTenantSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validasi input gagal.',
        errors: validation.error.format(),
      });
    }

    const actorUserId = req.user?.id || 'system-admin';
    const result = await PlatformTenantService.updateTenant(req.params.id, validation.data, actorUserId);

    return res.status(200).json({
      success: true,
      message: 'Detail tenant berhasil diperbarui.',
      data: result,
    });
  } catch (error: unknown) {
    console.error('Platform updateTenant Error:', error);
    return res.status(400).json({
      success: false,
      message: getErrorMessage(error, 'Gagal memperbarui tenant.'),
    });
  }
}

export async function deleteTenant(req: Request, res: Response) {
  try {
    const actorUserId = req.user?.id || 'system-admin';
    const result = await PlatformTenantService.deleteTenant(req.params.id, actorUserId);

    return res.status(200).json({
      success: true,
      message: 'Tenant berhasil dihapus (soft delete).',
      data: result,
    });
  } catch (error: unknown) {
    console.error('Platform deleteTenant Error:', error);
    return res.status(400).json({
      success: false,
      message: getErrorMessage(error, 'Gagal menghapus tenant.'),
    });
  }
}
