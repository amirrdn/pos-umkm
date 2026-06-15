import { Request, Response, NextFunction } from 'express';

/**
 * Middleware untuk memvalidasi apakah pengguna yang terautentikasi memiliki permission tertentu.
 * Harus dipasang SETELAH middleware autentikasi (yang menyuntikkan data `req.user`).
 * 
 * @param requiredPermission Nama permission unik yang dibutuhkan (contoh: 'create:products')
 */
export function requirePermission(requiredPermission: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Belum Terautentikasi: Sesi pengguna tidak ditemukan.'
        });
      }

      if (req.tenantId && req.user.tenantId !== req.tenantId) {
        return res.status(403).json({
          success: false,
          message: 'Akses Ditolak: Anda tidak memiliki akses ke lingkungan tenant ini.'
        });
      }

      const hasPermission = req.user.permissions.includes(requiredPermission);

      const isSuperAdmin = req.user.roles.includes('SUPER_ADMIN') || req.user.roles.includes('SYSTEM_ADMIN');

      if (!hasPermission && !isSuperAdmin) {
        return res.status(403).json({
          success: false,
          message: `Akses Ditolak: Anda tidak memiliki hak akses [${requiredPermission}] yang diperlukan.`
        });
      }

      return next();
    } catch (error) {
      console.error('Error pada Role/Permission Middleware:', error);
      return res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan internal server saat memproses otorisasi.'
      });
    }
  };
}

/**
 * Middleware opsional untuk memvalidasi kepemilikan Role tertentu (jika diperlukan validasi berbasis Role langsung).
 * 
 * @param requiredRoles Daftar nama role yang salah satunya harus dimiliki oleh user
 */
export function requireRole(requiredRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Belum Terautentikasi.'
      });
    }

    if (req.tenantId && req.user.tenantId !== req.tenantId) {
      return res.status(403).json({
        success: false,
        message: 'Akses Ditolak: Konflik lingkungan tenant.'
      });
    }

    const hasRole = req.user.roles.some(role => requiredRoles.includes(role));

    if (!hasRole) {
      return res.status(403).json({
        success: false,
        message: `Akses Ditolak: Endpoint ini memerlukan salah satu peran berikut: [${requiredRoles.join(', ')}].`
      });
    }

    return next();
  };
}
