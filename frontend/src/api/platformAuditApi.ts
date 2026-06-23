import { apiClient } from './apiClient';
import type { ApiSuccessResponse } from './types';

export interface TenantInspectionContext {
  tenantId: string;
  tenantName: string;
  switchedAt: string;
}

export interface PlatformAuditLogEntry {
  id: string;
  actorUserId: string;
  tenantId: string | null;
  action: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface PlatformAuditLogPage {
  items: PlatformAuditLogEntry[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export async function startTenantInspectionApi(
  tenantId: string
): Promise<ApiSuccessResponse<TenantInspectionContext>> {
  const response = await apiClient.post<ApiSuccessResponse<TenantInspectionContext>>(
    '/api/platform/inspection/start',
    { tenantId }
  );
  return response.data;
}

export async function stopTenantInspectionApi(): Promise<ApiSuccessResponse<{ stopped: boolean }>> {
  const response = await apiClient.post<ApiSuccessResponse<{ stopped: boolean }>>(
    '/api/platform/inspection/stop'
  );
  return response.data;
}

export async function fetchActiveTenantInspectionApi(): Promise<TenantInspectionContext | null> {
  const response = await apiClient.get<ApiSuccessResponse<TenantInspectionContext | null>>(
    '/api/platform/inspection/active'
  );
  return response.data.data ?? null;
}

export async function fetchPlatformAuditLogsApi(params?: {
  page?: number;
  limit?: number;
  tenantId?: string;
}): Promise<PlatformAuditLogPage> {
  const response = await apiClient.get<ApiSuccessResponse<PlatformAuditLogPage>>('/api/platform/audit-logs', {
    params,
  });
  return response.data.data!;
}
