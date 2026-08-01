import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { logError } from '../lib/logger';
import type { ResolvedTenant } from '../lib/tenantTypes';
import { tenantRlsTxStorage, tenantStorage } from '../lib/tenantContext';
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

function isLongLivedTenantRequest(req: Request): boolean {
  return (
    req.originalUrl.includes('/notifications/stream') ||
    req.headers.accept?.includes('text/event-stream') === true
  );
}

function shouldPinTenantDbConnection(req: Request): boolean {
  return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);
}

/** Validasi outlet di luar tx write — hindari nested $transaction saat POST checkout. */
async function resolveActiveOutletForTenant(tenantId: string, outletId: string) {
  return prisma.$executeRawWithTenant(tenantId, async (tx) =>
    tx.outlet.findFirst({
      where: { id: outletId, tenantId, deletedAt: null, isActive: true },
      select: { id: true },
    })
  );
}

/** Pin koneksi DB hanya untuk write — GET paralel (POS) tidak memblokir pool 7 koneksi. */
async function runTenantRequestScope(
  tenantId: string,
  req: Request,
  res: Response,
  handler: () => void | Promise<void>
): Promise<void> {
  if (
    process.env.NODE_ENV === 'test' ||
    isLongLivedTenantRequest(req) ||
    !shouldPinTenantDbConnection(req)
  ) {
    await tenantStorage.run(tenantId, handler);
    return;
  }

  await tenantStorage.run(tenantId, async () => {
    await prisma.$transaction(
      async (tx) => {
        await tx.$executeRawUnsafe(`SELECT set_config('app.current_tenant_id', $1, true)`, tenantId);

        return new Promise<void>((resolve, reject) => {
          tenantRlsTxStorage.run(tx as object, () => {
            void Promise.resolve(handler()).catch(reject);
            res.once('finish', () => resolve());
            res.once('close', () => resolve());
          });
        });
      },
      { maxWait: 10_000, timeout: 120_000 }
    );
  });
}

export async function tenantMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    let tenantId = req.header('x-tenant-id') || req.header('X-Tenant-Id');

    if (!tenantId && req.user) {
      tenantId = req.user.tenantId ?? undefined;
    }

    if (!tenantId || tenantId === 'undefined' || tenantId === 'null' || tenantId.trim() === '') {
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

    const outletId = req.outletId;

    await tenantStorage.run(tenantId, async () => {
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: tenantSelect,
      });

      if (!tenant || tenant.deletedAt !== null) {
        res.status(404).json({
          success: false,
          message: 'Tenant tidak terdaftar di sistem kami.',
        });
        return;
      }

      if (!req.isPlatformAdmin && tenant.status !== 'ACTIVE') {
        res.status(403).json({
          success: false,
          message: 'Tenant ditangguhkan atau tidak lagi aktif. Silakan hubungi administrator.',
        });
        return;
      }

      req.tenantId = tenant.id;
      req.tenant = tenant as ResolvedTenant;

      if (outletId) {
        const outlet = await resolveActiveOutletForTenant(tenant.id, outletId);
        if (!outlet) {
          res.status(403).json({
            success: false,
            message: 'Outlet tidak aktif atau tidak tersedia untuk operasi.',
          });
          return;
        }
      }

      await runTenantRequestScope(tenant.id, req, res, async () => {
        void recordTenantScopedWriteAudit({
          isPlatformAdmin: req.isPlatformAdmin,
          user: req.user,
          tenantId: tenant.id,
          method: req.method,
          originalUrl: req.originalUrl,
        }).catch((error) => logError('recordTenantScopedWriteAudit', error));

        next();
      });
    });
    return;
  } catch (error) {
    logError('tenantMiddleware', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan internal server saat memproses identifikasi tenant.',
    });
  }
}
