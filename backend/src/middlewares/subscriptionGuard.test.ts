import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SubscriptionTier, SubscriptionStatus } from '@prisma/client';
import { checkSubscriptionStatus, requireTier } from './subscriptionGuard';
import { createMockRequest, createMockResponse, tenantId } from '../test/helpers/http';
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
  });

  describe('requireTier', () => {
    it('returns 400 if tenantId is missing in request context', async () => {
      const req = createTestRequest({
        tenantId: undefined,
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
    });

    it('returns 404 if tenant does not exist', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue(null);

      const req = createTestRequest({
        tenantId,
      });
      const res = createMockResponse();
      const next = vi.fn();

      const middleware = requireTier([SubscriptionTier.GROWTH]);
      await middleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.statusCode).toBe(404);
    });

    it('returns 403 if tenant subscription is EXPIRED', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue({
        subscriptionTier: SubscriptionTier.GROWTH,
        subscriptionStatus: SubscriptionStatus.EXPIRED,
      });

      const req = createTestRequest({
        tenantId,
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
      mockPrisma.tenant.findUnique.mockResolvedValue({
        subscriptionTier: SubscriptionTier.FREE,
        subscriptionStatus: SubscriptionStatus.ACTIVE,
      });

      const req = createTestRequest({
        tenantId,
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
      mockPrisma.tenant.findUnique.mockResolvedValue({
        subscriptionTier: SubscriptionTier.GROWTH,
        subscriptionStatus: SubscriptionStatus.ACTIVE,
      });

      const req = createTestRequest({
        tenantId,
      });
      const res = createMockResponse();
      const next = vi.fn();

      const middleware = requireTier([SubscriptionTier.GROWTH]);
      await middleware(req, res, next);

      expect(next).toHaveBeenCalledOnce();
    });
  });
});
