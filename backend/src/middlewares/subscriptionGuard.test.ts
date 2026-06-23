import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SubscriptionTier, SubscriptionStatus, TenantStatus } from '@prisma/client';
import { checkSubscriptionStatus, requireTier } from './subscriptionGuard';
import { createMockRequest, createMockResponse, tenantId } from '../test/helpers/http';
import type { ResolvedTenant } from '../lib/tenantTypes';
import { Request } from 'express';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    tenant: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('../lib/prisma', () => ({
  prisma: mockPrisma,
}));

function mockResolvedTenant(overrides: Partial<ResolvedTenant> = {}): ResolvedTenant {
  return {
    id: tenantId,
    name: 'Test Tenant',
    status: TenantStatus.ACTIVE,
    deletedAt: null,
    subscriptionTier: SubscriptionTier.FREE,
    subscriptionStatus: SubscriptionStatus.ACTIVE,
    subscriptionExpiresAt: null,
    lastBillingAt: null,
    requireStockApproval: false,
    ...overrides,
  };
}

function createTestRequest(overrides: Partial<Request> = {}): Request {
  const req = createMockRequest({
    originalUrl: '/',
    ...overrides,
  });
  req.header = vi.fn((name: string) => {
    const key = name.toLowerCase();
    return (req.headers?.[key] || req.headers?.[name]) as string;
  });
  return req;
}

describe('subscriptionGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('checkSubscriptionStatus', () => {
    it('allows GET requests even if tenant is EXPIRED', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue({
        subscriptionStatus: SubscriptionStatus.EXPIRED,
      });

      const req = createTestRequest({
        method: 'GET',
        headers: { 'x-tenant-id': tenantId },
      });
      const res = createMockResponse();
      const next = vi.fn();

      await checkSubscriptionStatus(req, res, next);

      expect(next).toHaveBeenCalledOnce();
      expect(res.statusCode).toBe(200); // untouched default
    });

    it('blocks POST write requests when tenant is EXPIRED', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue({
        subscriptionStatus: SubscriptionStatus.EXPIRED,
      });

      const req = createTestRequest({
        method: 'POST',
        headers: { 'x-tenant-id': tenantId },
        originalUrl: '/api/products',
      });
      const res = createMockResponse();
      const next = vi.fn();

      await checkSubscriptionStatus(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.statusCode).toBe(403);
      expect(res.body).toMatchObject({
        success: false,
        error: 'SUBSCRIPTION_EXPIRED',
      });
    });

    it('allows POST requests to webhook route even if tenant is EXPIRED', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue({
        subscriptionStatus: SubscriptionStatus.EXPIRED,
      });

      const req = createTestRequest({
        method: 'POST',
        headers: { 'x-tenant-id': tenantId },
        originalUrl: '/api/subscriptions/webhook',
      });
      const res = createMockResponse();
      const next = vi.fn();

      await checkSubscriptionStatus(req, res, next);

      expect(next).toHaveBeenCalledOnce();
      expect(res.statusCode).toBe(200);
    });

    it('allows write requests when tenant is ACTIVE', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue({
        subscriptionStatus: SubscriptionStatus.ACTIVE,
      });

      const req = createTestRequest({
        method: 'POST',
        headers: { 'x-tenant-id': tenantId },
        originalUrl: '/api/products',
      });
      const res = createMockResponse();
      const next = vi.fn();

      await checkSubscriptionStatus(req, res, next);

      expect(next).toHaveBeenCalledOnce();
    });

    it('allows write requests for platform admin even if tenant is EXPIRED', async () => {
      const req = createTestRequest({
        method: 'POST',
        headers: { 'x-tenant-id': tenantId },
        originalUrl: '/api/products',
        isPlatformAdmin: true,
      });
      const res = createMockResponse();
      const next = vi.fn();

      await checkSubscriptionStatus(req, res, next);

      expect(next).toHaveBeenCalledOnce();
      expect(mockPrisma.tenant.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('requireTier', () => {
    it('returns 400 if req.tenant is missing in request context', async () => {
      const req = createTestRequest({
        tenantId,
      });
      const res = createMockResponse();
      const next = vi.fn();

      const middleware = requireTier([SubscriptionTier.GROWTH]);
      await middleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.statusCode).toBe(400);
      expect(res.body).toMatchObject({
        success: false,
        message: expect.stringContaining('Konteks tenant tidak ditemukan'),
      });
      expect(mockPrisma.tenant.findUnique).not.toHaveBeenCalled();
    });

    it('returns 403 if tenant subscription is EXPIRED', async () => {
      const req = createTestRequest({
        tenantId,
        tenant: mockResolvedTenant({
          subscriptionTier: SubscriptionTier.GROWTH,
          subscriptionStatus: SubscriptionStatus.EXPIRED,
        }),
      });
      const res = createMockResponse();
      const next = vi.fn();

      const middleware = requireTier([SubscriptionTier.GROWTH]);
      await middleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.statusCode).toBe(403);
      expect(res.body).toMatchObject({
        success: false,
        error: 'SUBSCRIPTION_EXPIRED',
      });
    });

    it('returns 403 if tenant has insufficient tier', async () => {
      const req = createTestRequest({
        tenantId,
        tenant: mockResolvedTenant({
          subscriptionTier: SubscriptionTier.FREE,
          subscriptionStatus: SubscriptionStatus.ACTIVE,
        }),
      });
      const res = createMockResponse();
      const next = vi.fn();

      const middleware = requireTier([SubscriptionTier.GROWTH, SubscriptionTier.ENTERPRISE]);
      await middleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.statusCode).toBe(403);
      expect(res.body).toMatchObject({
        success: false,
        error: 'TIER_INSUFFICIENT',
      });
    });

    it('calls next() if tenant has sufficient tier and is active', async () => {
      const req = createTestRequest({
        tenantId,
        tenant: mockResolvedTenant({
          subscriptionTier: SubscriptionTier.GROWTH,
          subscriptionStatus: SubscriptionStatus.ACTIVE,
        }),
      });
      const res = createMockResponse();
      const next = vi.fn();

      const middleware = requireTier([SubscriptionTier.GROWTH]);
      await middleware(req, res, next);

      expect(next).toHaveBeenCalledOnce();
      expect(mockPrisma.tenant.findUnique).not.toHaveBeenCalled();
    });

    it('calls next() for platform admin regardless of tenant tier', async () => {
      const req = createTestRequest({
        tenantId,
        isPlatformAdmin: true,
      });
      const res = createMockResponse();
      const next = vi.fn();

      const middleware = requireTier([SubscriptionTier.ENTERPRISE]);
      await middleware(req, res, next);

      expect(next).toHaveBeenCalledOnce();
      expect(mockPrisma.tenant.findUnique).not.toHaveBeenCalled();
    });
  });
});
