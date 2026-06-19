import type { Request, Response } from 'express';
import { vi } from 'vitest';

export function createMockResponse(): Response & {
  statusCode: number;
  body: unknown;
  headers: Record<string, string>;
} {
  const res = {
    statusCode: 200,
    body: undefined as unknown,
    headers: {} as Record<string, string>,
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    json(payload: unknown) {
      res.body = payload;
      return res;
    },
    setHeader(name: string, value: string) {
      res.headers[name] = value;
      return res;
    },
  };

  return res as Response & typeof res;
}

export function createMockRequest(overrides: Partial<Request> = {}): Request {
  return {
    body: {},
    params: {},
    headers: {},
    ip: '127.0.0.1',
    ...overrides,
  } as Request;
}

export const productId = '11111111-1111-4111-8111-111111111111';
export const tenantId = 'tenant-test-001';
export const mainOutletId = '22222222-2222-4222-8222-222222222222';
export const branchOutletId = '33333333-3333-4333-8333-333333333333';
export const userId = '44444444-4444-4444-8444-444444444444';
export const transferId = '55555555-5555-4555-8555-555555555555';

export { vi };
