import type { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { runInSystemContext } from '../lib/tenantContext';

export interface PlatformAuditRecordInput {
  actorUserId: string;
  tenantId?: string | null;
  action: string;
  metadata?: Prisma.InputJsonValue;
}

export interface TenantInspectionContext {
  tenantId: string;
  tenantName: string;
  switchedAt: string;
}

export async function recordPlatformAudit(input: PlatformAuditRecordInput): Promise<void> {
  return runInSystemContext('platform', async () => {
  await prisma.platformAuditLog.create({
    data: {
      actorUserId: input.actorUserId,
      tenantId: input.tenantId ?? null,
      action: input.action,
      metadata: input.metadata,
    },
  });
  });
}

export async function startTenantInspection(input: {
  actorUserId: string;
  tenantId: string;
  ipAddress?: string;
  userAgent?: string;
}): Promise<TenantInspectionContext> {
  return runInSystemContext('platform', async () => {
  const tenant = await prisma.tenant.findFirst({
    where: { id: input.tenantId, deletedAt: null },
    select: { id: true, name: true },
  });

  if (!tenant) {
    throw new Error('Tenant tidak ditemukan.');
  }

  const session = await prisma.$transaction(async (tx) => {
    await tx.platformAdminSession.deleteMany({
      where: { platformUserId: input.actorUserId },
    });

    const createdSession = await tx.platformAdminSession.create({
      data: {
        platformUserId: input.actorUserId,
        activeTenantId: tenant.id,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      },
    });

    await tx.platformAuditLog.create({
      data: {
        actorUserId: input.actorUserId,
        tenantId: tenant.id,
        action: 'IMPERSONATE_START',
        metadata: {
          tenantName: tenant.name,
          ipAddress: input.ipAddress ?? null,
          userAgent: input.userAgent ?? null,
        },
      },
    });

    return createdSession;
  });

  return {
    tenantId: tenant.id,
    tenantName: tenant.name,
    switchedAt: session.switchedAt.toISOString(),
  };
  });
}

export async function stopTenantInspection(actorUserId: string): Promise<{ stopped: boolean }> {
  return runInSystemContext('platform', async () => {
  const activeSession = await prisma.platformAdminSession.findFirst({
    where: { platformUserId: actorUserId },
    orderBy: { switchedAt: 'desc' },
    include: {
      activeTenant: {
        select: { id: true, name: true },
      },
    },
  });

  if (!activeSession) {
    return { stopped: false };
  }

  await prisma.$transaction(async (tx) => {
    await tx.platformAdminSession.deleteMany({
      where: { platformUserId: actorUserId },
    });

    await tx.platformAuditLog.create({
      data: {
        actorUserId,
        tenantId: activeSession.activeTenantId,
        action: 'IMPERSONATE_END',
        metadata: {
          tenantName: activeSession.activeTenant.name,
        },
      },
    });
  });

  return { stopped: true };
  });
}

export async function getActiveTenantInspection(
  actorUserId: string
): Promise<TenantInspectionContext | null> {
  return runInSystemContext('platform', async () => {
  const activeSession = await prisma.platformAdminSession.findFirst({
    where: { platformUserId: actorUserId },
    orderBy: { switchedAt: 'desc' },
    include: {
      activeTenant: {
        select: { id: true, name: true },
      },
    },
  });

  if (!activeSession) {
    return null;
  }

  return {
    tenantId: activeSession.activeTenant.id,
    tenantName: activeSession.activeTenant.name,
    switchedAt: activeSession.switchedAt.toISOString(),
  };
  });
}

export async function listPlatformAuditLogs(input: {
  page?: number;
  limit?: number;
  tenantId?: string;
  actorUserId?: string;
}) {
  return runInSystemContext('platform', async () => {
  const page = Math.max(1, input.page ?? 1);
  const limit = Math.min(100, Math.max(1, input.limit ?? 25));
  const skip = (page - 1) * limit;

  const where: Prisma.PlatformAuditLogWhereInput = {};
  if (input.tenantId) {
    where.tenantId = input.tenantId;
  }
  if (input.actorUserId) {
    where.actorUserId = input.actorUserId;
  }

  const [items, total] = await Promise.all([
    prisma.platformAuditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.platformAuditLog.count({ where }),
  ]);

  return {
    items,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
  });
}

export async function recordTenantScopedWriteAudit(req: {
  isPlatformAdmin?: boolean;
  user?: { id: string };
  tenantId?: string;
  method: string;
  originalUrl: string;
}): Promise<void> {
  if (!req.isPlatformAdmin || !req.user?.id || !req.tenantId) {
    return;
  }

  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    return;
  }

  await recordPlatformAudit({
    actorUserId: req.user.id,
    tenantId: req.tenantId,
    action: 'TENANT_SCOPED_WRITE',
    metadata: {
      method: req.method,
      path: req.originalUrl,
    },
  });
}
