import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { logError } from '../lib/logger';

/**
 * Middleware untuk mengidentifikasi dan memvalidasi Tenant dari request.
 * Informasi tenant dapat dikirim via header custom 'x-tenant-id' atau diekstrak dari payload JWT.
 * Admin platform boleh menginspeksi tenant non-aktif (kedaluwarsa/ditangguhkan).
 */
export async function tenantMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    let tenantId = req.header('x-tenant-id') || req.header('X-Tenant-Id');

    if (!tenantId && req.user) {
      tenantId = req.user.tenantId ?? undefined;
    }

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Akses Ditolak: Header tenant (x-tenant-id) atau konteks tenant tidak ditemukan.',
      });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant || tenant.deletedAt !== null) {
      return res.status(404).json({
        success: false,
        message: 'Tenant tidak terdaftar di sistem kami.',
      });
    }

    if (!req.isPlatformAdmin && tenant.status !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        message: 'Tenant ditangguhkan atau tidak lagi aktif. Silakan hubungi administrator.',
      });
    }

    req.tenantId = tenant.id;

    const outletId = req.outletId;
    if (outletId) {
      const outlet = await prisma.outlet.findFirst({
        where: { id: outletId, tenantId: tenant.id, deletedAt: null, isActive: true },
        select: { id: true },
      });
      if (!outlet) {
        return res.status(403).json({
          success: false,
          message: 'Outlet tidak aktif atau tidak tersedia untuk operasi.',
        });
      }
    }

    return next();
  } catch (error) {
    logError('tenantMiddleware', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan internal server saat memproses identifikasi tenant.',
    });
  }
}
