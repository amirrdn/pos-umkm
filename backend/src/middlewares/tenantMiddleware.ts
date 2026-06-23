import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { logError } from '../lib/logger';
import type { ResolvedTenant } from '../lib/tenantTypes';
import { tenantStorage } from '../lib/tenantContext';
import { recordTenantScopedWriteAudit } from '../services/platformAuditService';

const tenantSelect = {
  id: true,
  name: true,
  status: true,
  deletedAt: true,
  subscriptionTier: true,
  subscriptionStatus: true,
  subscriptionExpiresAt: true,
  lastBillingAt: true,
  requireStockApproval: true,
} as const;

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

    if (req.user && !req.isPlatformAdmin && tenantId !== req.user.tenantId) {
      return res.status(403).json({
        success: false,
        message: 'Akses Ditolak: Anda tidak memiliki wewenang untuk mengakses lingkungan tenant ini.',
      });
    }

    // app_user + RLS: prisma extension set_config + query pada satu sesi (where.id bootstrap).
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: tenantSelect,
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
    req.tenant = tenant as ResolvedTenant;

    const outletId = req.outletId;

    return tenantStorage.run(tenant.id, async () => {
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

      void recordTenantScopedWriteAudit({
        isPlatformAdmin: req.isPlatformAdmin,
        user: req.user,
        tenantId: tenant.id,
        method: req.method,
        originalUrl: req.originalUrl,
      }).catch((error) => logError('recordTenantScopedWriteAudit', error));

      return next();
    });
  } catch (error) {
    logError('tenantMiddleware', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan internal server saat memproses identifikasi tenant.',
    });
  }
}
