import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

/**
 * Middleware untuk menangani error secara global di Express.
 * Dipasang di akhir chain routing.
 */
export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error('🚨 Global Error Caught:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // 1. Zod Validation Error
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: 'Validasi input gagal.',
      errors: err.format(),
    });
  }

  // 2. Prisma Database Errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // Unique constraint violation (e.g., duplicate SKU or email)
    if (err.code === 'P2002') {
      const target = (err.meta?.target as string[]) || [];
      return res.status(409).json({
        success: false,
        message: `Konflik data: Nilai untuk field [${target.join(', ')}] sudah digunakan.`,
      });
    }

    // Foreign key constraint violation
    if (err.code === 'P2003') {
      return res.status(400).json({
        success: false,
        message: 'Gagal memproses data karena referensi data (foreign key) tidak valid.',
      });
    }

    // Record not found
    if (err.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: err.message || 'Data yang diminta tidak ditemukan.',
      });
    }
  }

  // 3. Custom Application Errors (dengan statusCode)
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Terjadi kesalahan internal server.';
  
  return res.status(statusCode).json({
    success: false,
    code: err.code || undefined,
    message: message,
  });
}
