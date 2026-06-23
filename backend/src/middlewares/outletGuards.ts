import { Request, Response, NextFunction } from 'express';
import { OutletType } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { logError } from '../lib/logger';

export interface ActiveOutletContext {
  id: string;
  name: string;
  type: OutletType;
  isActive: boolean;
}

/** Muat outlet aktif dari `x-outlet-id` ke `req.activeOutlet`. */
export async function attachActiveOutlet(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void | Response> {
  try {
    if (!req.outletId || !req.tenantId) {
      req.activeOutlet = null;
      return next();
    }

    const outlet = await prisma.outlet.findFirst({
      where: {
        id: req.outletId,
        tenantId: req.tenantId,
        deletedAt: null,
      },
      select: { id: true, name: true, type: true, isActive: true },
    });

    if (!outlet) {
      return res.status(403).json({
        success: false,
        code: 'OUTLET_NOT_FOUND',
        message: 'Outlet aktif tidak ditemukan atau tidak tersedia.',
      });
    }

    if (!outlet.isActive) {
      return res.status(403).json({
        success: false,
        code: 'OUTLET_INACTIVE',
        message: 'Outlet tidak aktif. Pilih cabang lain atau hubungi admin.',
      });
    }

    req.activeOutlet = outlet;
    return next();
  } catch (error) {
    logError('attachActiveOutlet', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat memvalidasi outlet aktif.',
    });
  }
}

/** Operasi hanya valid di Outlet Utama (MAIN). */
export function requireMainOutlet(req: Request, res: Response, next: NextFunction): void | Response {
  if (req.activeOutlet?.type !== OutletType.MAIN) {
    return res.status(403).json({
      success: false,
      code: 'MAIN_OUTLET_REQUIRED',
      message: 'Operasi ini hanya valid di Outlet Utama.',
    });
  }
  return next();
}

/** RESTOCK supplier/gudang pusat — tolak jika konteks cabang; tanpa header → service fallback MAIN. */
export function requireMainOutletForRestock(
  req: Request,
  res: Response,
  next: NextFunction
): void | Response {
  if (req.body?.type !== 'RESTOCK') {
    return next();
  }
  if (req.activeOutlet && req.activeOutlet.type !== OutletType.MAIN) {
    return res.status(403).json({
      success: false,
      code: 'MAIN_OUTLET_REQUIRED',
      message: 'Restock stok supplier hanya valid di Outlet Utama.',
    });
  }
  return next();
}
