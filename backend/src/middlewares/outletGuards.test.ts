import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OutletType } from '@prisma/client';
import type { Request, Response } from 'express';
import {
  attachActiveOutlet,
  requireMainOutlet,
  requireMainOutletForRestock,
} from './outletGuards';

const { mockFindFirst } = vi.hoisted(() => ({
  mockFindFirst: vi.fn(),
}));

vi.mock('../lib/prisma', () => ({
  prisma: {
    outlet: { findFirst: (...args: unknown[]) => mockFindFirst(...args) },
  },
}));

function mockRes() {
  const res = {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
  };
  return res as Response & { statusCode: number; body: unknown };
}

describe('outletGuards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('attachActiveOutlet', () => {
    it('sets activeOutlet null when no outletId header', async () => {
      const req = { tenantId: 't1' } as Request;
      const res = mockRes();
      const next = vi.fn();

      await attachActiveOutlet(req, res, next);

      expect(req.activeOutlet).toBeNull();
      expect(next).toHaveBeenCalledOnce();
      expect(mockFindFirst).not.toHaveBeenCalled();
    });

    it('loads outlet onto req.activeOutlet', async () => {
      mockFindFirst.mockResolvedValue({
        id: 'main-1',
        name: 'Pusat',
        type: OutletType.MAIN,
        isActive: true,
      });

      const req = { tenantId: 't1', outletId: 'main-1' } as Request;
      const res = mockRes();
      const next = vi.fn();

      await attachActiveOutlet(req, res, next);

      expect(req.activeOutlet).toMatchObject({ id: 'main-1', type: 'MAIN' });
      expect(next).toHaveBeenCalledOnce();
    });

    it('returns 403 when outletId unknown for tenant', async () => {
      mockFindFirst.mockResolvedValue(null);

      const req = { tenantId: 't1', outletId: 'bad' } as Request;
      const res = mockRes();
      const next = vi.fn();

      await attachActiveOutlet(req, res, next);

      expect(res.statusCode).toBe(403);
      expect(res.body).toMatchObject({ code: 'OUTLET_NOT_FOUND' });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 403 when outlet is inactive', async () => {
      mockFindFirst.mockResolvedValue({
        id: 'branch-1',
        name: 'Cabang Tutup',
        type: OutletType.BRANCH,
        isActive: false,
      });

      const req = { tenantId: 't1', outletId: 'branch-1' } as Request;
      const res = mockRes();
      const next = vi.fn();

      await attachActiveOutlet(req, res, next);

      expect(res.statusCode).toBe(403);
      expect(res.body).toMatchObject({ code: 'OUTLET_INACTIVE' });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('requireMainOutlet', () => {
    it('allows MAIN outlet context', () => {
      const req = {
        activeOutlet: { id: 'm', name: 'Pusat', type: OutletType.MAIN, isActive: true },
      } as Request;
      const res = mockRes();
      const next = vi.fn();

      requireMainOutlet(req, res, next);

      expect(next).toHaveBeenCalledOnce();
    });

    it('blocks non-MAIN outlet with MAIN_OUTLET_REQUIRED', () => {
      const req = {
        activeOutlet: { id: 'b', name: 'Cabang', type: OutletType.BRANCH, isActive: true },
      } as Request;
      const res = mockRes();
      const next = vi.fn();

      requireMainOutlet(req, res, next);

      expect(res.statusCode).toBe(403);
      expect(res.body).toMatchObject({ code: 'MAIN_OUTLET_REQUIRED' });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('requireMainOutletForRestock', () => {
    it('skips guard for ADJUSTMENT_PLUS', () => {
      const req = {
        body: { type: 'ADJUSTMENT_PLUS' },
        activeOutlet: { id: 'b', name: 'Cabang', type: OutletType.BRANCH, isActive: true },
      } as Request;
      const res = mockRes();
      const next = vi.fn();

      requireMainOutletForRestock(req, res, next);

      expect(next).toHaveBeenCalledOnce();
    });

    it('blocks RESTOCK at BRANCH context', () => {
      const req = {
        body: { type: 'RESTOCK' },
        activeOutlet: { id: 'b', name: 'Cabang', type: OutletType.BRANCH, isActive: true },
      } as Request;
      const res = mockRes();
      const next = vi.fn();

      requireMainOutletForRestock(req, res, next);

      expect(res.statusCode).toBe(403);
      expect(next).not.toHaveBeenCalled();
    });

    it('allows RESTOCK without active outlet (service fallback MAIN)', () => {
      const req = { body: { type: 'RESTOCK' }, activeOutlet: null } as Request;
      const res = mockRes();
      const next = vi.fn();

      requireMainOutletForRestock(req, res, next);

      expect(next).toHaveBeenCalledOnce();
    });
  });
});
