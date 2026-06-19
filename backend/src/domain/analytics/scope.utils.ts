import type { Request } from 'express';

type AnalyticsRequest = Request & {
  outletId?: string | null;
  hasTenantWideOutletAccess?: boolean;
};

/**
 * Resolusi outlet scope untuk endpoint analitik.
 * Owner/Manager/Admin: query `outletId` atau header `x-outlet-id`; kosong = semua outlet.
 */
export function resolveAnalyticsOutletId(req: AnalyticsRequest): string | null {
  if (req.hasTenantWideOutletAccess) {
    const queryOutlet = req.query.outletId as string | undefined;
    if (queryOutlet === 'ALL' || queryOutlet === '') return null;
    if (queryOutlet) return queryOutlet;
    return req.outletId ?? null;
  }

  return req.outletId ?? null;
}
