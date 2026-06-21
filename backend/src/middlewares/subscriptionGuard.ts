import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { SubscriptionTier, SubscriptionStatus } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { isPlatformAdmin } from '../lib/roles';
import { getJwtSecret } from '../lib/jwtConfig';

/**
 * Middleware untuk mengecek apakah langganan tenant saat ini kedaluwarsa.
 * Dipasang secara global untuk memblokir aksi menulis (POST, PUT, PATCH, DELETE) jika expired.
 */
export async function checkSubscriptionStatus(req: Request, res: Response, next: NextFunction) {
  try {
    let tenantId = (req.header('x-tenant-id') || req.header('X-Tenant-Id')) ?? undefined;
    let platformAdminBypass = req.isPlatformAdmin === true;

    // Jika tidak ada header tenantId, coba ekstrak dari Bearer token JWT jika ada
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const parts = authHeader.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
        const token = parts[1];
        const secretKey = getJwtSecret();
        try {
          const decoded = jwt.verify(token, secretKey) as { tenantId?: string; roles?: string[] };
          if (!tenantId && decoded.tenantId) {
            tenantId = decoded.tenantId;
          }
          if (!platformAdminBypass && Array.isArray(decoded.roles)) {
            platformAdminBypass = isPlatformAdmin(decoded.roles);
          }
        } catch (jwtErr) {
          // Abaikan error di sini, validasi token utama dilakukan oleh authMiddleware
        }
      }
    }

    if (platformAdminBypass) {
      return next();
    }

    // Jika tidak ada context tenantId, lewati saja
    if (!tenantId) {
      return next();
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { subscriptionStatus: true }
    });

    if (tenant && tenant.subscriptionStatus === SubscriptionStatus.EXPIRED) {
      const isWriteOperation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);
      const isWebhookRoute = req.originalUrl.includes('/api/subscriptions/webhook');

      if (isWriteOperation && !isWebhookRoute) {
        return res.status(403).json({
          success: false,
          error: 'SUBSCRIPTION_EXPIRED',
          message: 'Masa langganan Anda telah habis. Akses menulis data diblokir. Harap lakukan pembayaran untuk melanjutkan.'
        });
      }
    }

    return next();
  } catch (error) {
    console.error('Error pada checkSubscriptionStatus middleware:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan internal server saat memvalidasi status langganan.'
    });
  }
}

/**
 * Middleware untuk membatasi fitur premium berdasarkan tingkatan paket langganan (Tier).
 * Dipasang pada route-specific yang membutuhkan paket tertentu.
 */
export function requireTier(allowedTiers: SubscriptionTier[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (req.isPlatformAdmin) {
        return next();
      }

      const tenantId = req.tenantId;
      if (!tenantId) {
        return res.status(400).json({
          success: false,
          message: 'Akses Ditolak: Konteks tenant tidak ditemukan.'
        });
      }

      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { subscriptionTier: true, subscriptionStatus: true }
      });

      if (!tenant) {
        return res.status(404).json({
          success: false,
          message: 'Tenant tidak terdaftar di sistem.'
        });
      }

      if (tenant.subscriptionStatus === SubscriptionStatus.EXPIRED) {
        return res.status(403).json({
          success: false,
          error: 'SUBSCRIPTION_EXPIRED',
          message: 'Masa langganan Anda telah habis. Harap selesaikan pembayaran untuk mengakses fitur ini.'
        });
      }

      if (!allowedTiers.includes(tenant.subscriptionTier)) {
        return res.status(403).json({
          success: false,
          error: 'TIER_INSUFFICIENT',
          message: 'Fitur premium ini tidak tersedia pada tingkat paket Anda saat ini. Silakan lakukan upgrade.'
        });
      }

      return next();
    } catch (error) {
      console.error('Error pada requireTier middleware:', error);
      return res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan internal server saat memverifikasi tingkat akses fitur.'
      });
    }
  };
}
