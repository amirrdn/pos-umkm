import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { isAppError } from '../lib/errors';
import { logError } from '../lib/logger';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

/**
 * Middleware untuk menangani error secara global di Express.
 * Dipasang di akhir chain routing.
 */
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  logError(`Global Error Caught — ${req.method} ${req.path}`, err);

  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: 'Validasi input gagal.',
      errors: err.format(),
    });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const target = (err.meta?.target as string[]) || [];
      return res.status(409).json({
        success: false,
        message: `Konflik data: Nilai untuk field [${target.join(', ')}] sudah digunakan.`,
      });
    }

    if (err.code === 'P2003') {
      return res.status(400).json({
        success: false,
        message: 'Gagal memproses data karena referensi data (foreign key) tidak valid.',
      });
    }

    if (err.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: err.message || 'Data yang diminta tidak ditemukan.',
      });
    }
  }

  const appError = isAppError(err) ? err : null;
  const statusCode = appError?.statusCode ?? 500;
  const responseMessage = appError?.message ?? 'Terjadi kesalahan internal server.';

  return res.status(statusCode).json({
    success: false,
    code: appError?.code,
    message: responseMessage,
  });
}
