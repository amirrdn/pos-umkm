import { describe, expect, it } from 'vitest';
import { isSubscriptionExpired } from '../lib/subscription';
import { SubscriptionStatus } from '@prisma/client';

describe('isSubscriptionExpired helper', () => {
  it('returns true if status is EXPIRED', () => {
    const tenant = {
      subscriptionStatus: SubscriptionStatus.EXPIRED,
      subscriptionExpiresAt: null
    };
    expect(isSubscriptionExpired(tenant)).toBe(true);
  });

  it('returns true if subscriptionExpiresAt is in the past', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const tenant = {
      subscriptionStatus: SubscriptionStatus.ACTIVE,
      subscriptionExpiresAt: yesterday
    };
    expect(isSubscriptionExpired(tenant)).toBe(true);
  });

  it('returns false if subscriptionExpiresAt is in the future', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tenant = {
      subscriptionStatus: SubscriptionStatus.ACTIVE,
      subscriptionExpiresAt: tomorrow
    };
    expect(isSubscriptionExpired(tenant)).toBe(false);
  });

  it('returns false if subscriptionExpiresAt is null and status is ACTIVE', () => {
    const tenant = {
      subscriptionStatus: SubscriptionStatus.ACTIVE,
      subscriptionExpiresAt: null
    };
    expect(isSubscriptionExpired(tenant)).toBe(false);
  });
});
