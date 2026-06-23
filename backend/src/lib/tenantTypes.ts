import type { SubscriptionStatus, SubscriptionTier, TenantStatus } from '@prisma/client';

/** Snapshot tenant yang sudah diotorisasi di tenantMiddleware — hindari re-query ke tabel tenants. */
export type ResolvedTenant = {
  id: string;
  name: string;
  status: TenantStatus;
  deletedAt: Date | null;
  subscriptionTier: SubscriptionTier;
  subscriptionStatus: SubscriptionStatus;
  subscriptionExpiresAt: Date | null;
  lastBillingAt: Date | null;
  requireStockApproval: boolean;
};

export type TenantSubscriptionSnapshot = Pick<
  ResolvedTenant,
  'subscriptionTier' | 'subscriptionStatus' | 'subscriptionExpiresAt' | 'lastBillingAt'
>;
