import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { hasTenantWideOutletAccess, isPlatformAdmin } from '../lib/roles';
import { getJwtSecret } from '../lib/jwtConfig';

// Definisikan struktur payload JWT yang sama dengan yang ditandatangani di AuthService
interface UserPayload {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  roles: string[];
  permissions: string[];
  outletIds?: string[];
}

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

    const decoded = jwt.verify(token, secretKey) as UserPayload;

    const tenantWideAccess = hasTenantWideOutletAccess(decoded.roles);

    req.user = {
      id: decoded.id,
      tenantId: decoded.tenantId,
      name: decoded.name,
      email: decoded.email,
      roles: decoded.roles,
      permissions: decoded.permissions,
      outletIds: decoded.outletIds
    };
    req.hasTenantWideOutletAccess = tenantWideAccess;
    req.isPlatformAdmin = isPlatformAdmin(decoded.roles);

    // Ambil outlet aktif dari header jika ada
    const headerOutletId = req.headers['x-outlet-id'] as string;
    if (headerOutletId && (tenantWideAccess || (decoded.outletIds && decoded.outletIds.includes(headerOutletId)))) {
      req.outletId = headerOutletId;
    } else if (!tenantWideAccess && decoded.outletIds && decoded.outletIds.length > 0) {
      req.outletId = decoded.outletIds[0]; // fallback ke outlet pertama
    }

    return next();

  } catch (error: unknown) {
    console.error('JWT Verification Error:', error);

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
