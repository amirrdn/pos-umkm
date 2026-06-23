import { Request, Response } from 'express';
import { z } from 'zod';
import {
  getActiveTenantInspection,
  listPlatformAuditLogs,
  startTenantInspection,
  stopTenantInspection,
} from '../services/platformAuditService';

const startInspectionSchema = z.object({
  tenantId: z.string().min(1),
});

const listAuditLogsSchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  tenantId: z.string().min(1).optional(),
  actorUserId: z.string().min(1).optional(),
});

export async function startInspection(req: Request, res: Response) {
  const validation = startInspectionSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({
      success: false,
      message: 'Validasi tenant inspeksi gagal.',
      errors: validation.error.format(),
    });
  }

  try {
    const actorUserId = req.user!.id;
    const inspection = await startTenantInspection({
      actorUserId,
      tenantId: validation.data.tenantId,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.status(200).json({
      success: true,
      message: 'Sesi inspeksi tenant dimulai.',
      data: inspection,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal memulai inspeksi tenant.';
    return res.status(400).json({
      success: false,
      message,
    });
  }
}

export async function stopInspection(req: Request, res: Response) {
  const result = await stopTenantInspection(req.user!.id);

  return res.status(200).json({
    success: true,
    message: result.stopped ? 'Sesi inspeksi tenant diakhiri.' : 'Tidak ada sesi inspeksi aktif.',
    data: result,
  });
}

export async function getActiveInspection(req: Request, res: Response) {
  const inspection = await getActiveTenantInspection(req.user!.id);

  return res.status(200).json({
    success: true,
    data: inspection,
  });
}

export async function listAuditLogs(req: Request, res: Response) {
  const validation = listAuditLogsSchema.safeParse(req.query);
  if (!validation.success) {
    return res.status(400).json({
      success: false,
      message: 'Parameter audit log tidak valid.',
      errors: validation.error.format(),
    });
  }

  const data = await listPlatformAuditLogs(validation.data);

  return res.status(200).json({
    success: true,
    data,
  });
}
