import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { hasTenantWideOutletAccess, isPlatformAdmin } from '../lib/roles';
import { getJwtSecret } from '../lib/jwtConfig';
import { validateJwtPayload } from '../lib/jwtPayload';
import { logError } from '../lib/logger';

/**
 * Middleware Autentikasi JWT Riil.
 * Memvalidasi token Bearer dari header Authorization dan menyematkan data pengguna ke req.user.
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Akses Ditolak: Token Authorization tidak ditemukan.'
      });
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({
        success: false,
        message: 'Akses Ditolak: Format token harus berupa Bearer [token].'
      });
    }

    const token = parts[1];
    const secretKey = getJwtSecret();

    const decoded = jwt.verify(token, secretKey);
    const validated = validateJwtPayload(decoded);

    const tenantWideAccess = hasTenantWideOutletAccess(validated.roles);

    req.user = {
      id: validated.id,
      tenantId: validated.tenantId ?? null,
      name: validated.name,
      email: validated.email,
      roles: validated.roles,
      permissions: validated.permissions,
      outletIds: validated.outletIds
    };
    req.hasTenantWideOutletAccess = tenantWideAccess;
    req.isPlatformAdmin = isPlatformAdmin(validated.roles);

    // Ambil outlet aktif dari header jika ada
    const headerOutletId = req.headers['x-outlet-id'] as string;
    if (headerOutletId && (tenantWideAccess || (validated.outletIds && validated.outletIds.includes(headerOutletId)))) {
      req.outletId = headerOutletId;
    } else if (!tenantWideAccess && validated.outletIds && validated.outletIds.length > 0) {
      req.outletId = validated.outletIds[0]; // fallback ke outlet pertama
    }

    return next();

  } catch (error: unknown) {
    logError('authMiddleware', error);

    if (error instanceof Error && error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Akses Ditolak: Token Anda telah kedaluwarsa. Silakan login kembali.'
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Akses Ditolak: Token tidak valid atau tidak sah.'
    });
  }
}
