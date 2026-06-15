import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Definisikan struktur payload JWT yang sama dengan yang ditandatangani di AuthService
interface UserPayload {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  roles: string[];
  permissions: string[];
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
    const secretKey = process.env.JWT_SECRET || 'fallback_secret_key_2026';

    const decoded = jwt.verify(token, secretKey) as UserPayload;

    req.user = {
      id: decoded.id,
      tenantId: decoded.tenantId,
      name: decoded.name,
      email: decoded.email,
      roles: decoded.roles,
      permissions: decoded.permissions
    };

    return next();

  } catch (error: any) {
    console.error('JWT Verification Error:', error);

    if (error.name === 'TokenExpiredError') {
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
