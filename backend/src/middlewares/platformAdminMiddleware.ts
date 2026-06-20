import { Request, Response, NextFunction } from 'express';

export function requirePlatformAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.isPlatformAdmin) {
    res.status(403).json({
      success: false,
      error: 'PLATFORM_ADMIN_REQUIRED',
      message: 'Akses ini hanya untuk Admin Platform.',
    });
    return;
  }
  next();
}
