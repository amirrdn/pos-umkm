import { SubscriptionStatus } from '@prisma/client';

export interface TenantSubscriptionInfo {
  subscriptionStatus: SubscriptionStatus;
  subscriptionExpiresAt: Date | null;
}

/**
 * Calculates whether a subscription is effectively expired based on status and expiry date.
 */
export function isSubscriptionExpired(tenant: TenantSubscriptionInfo): boolean {
  if (tenant.subscriptionStatus === SubscriptionStatus.EXPIRED) {
    return true;
  }
  if (tenant.subscriptionExpiresAt && new Date(tenant.subscriptionExpiresAt) < new Date()) {
    return true;
  }
  return false;
}
