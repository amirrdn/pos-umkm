import { describe, expect, it, vi } from 'vitest';
import { authMiddleware } from '../../middlewares/authMiddleware';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from '../../lib/jwtConfig';

vi.mock('../../lib/jwtConfig', () => ({
  getJwtSecret: () => 'test-secret'
}));

describe('authMiddleware - Runtime Payload Validation', () => {
  it('allows valid token with correct payload', () => {
    const validPayload = {
      id: 'user-id-001',
      tenantId: 'tenant-id-001',
      name: 'John Doe',
      email: 'john@example.com',
      roles: ['Kasir'],
      permissions: ['create-transaction'],
      outletIds: ['outlet-id-001']
    };
    const token = jwt.sign(validPayload, 'test-secret');

    const req = {
      headers: {
        authorization: `Bearer ${token}`
      }
    } as any;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    } as any;
    const next = vi.fn();

    authMiddleware(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.user).toBeDefined();
    expect(req.user.email).toBe('john@example.com');
  });

  it('allows valid token from httpOnly auth cookie', () => {
    const validPayload = {
      id: 'user-id-001',
      tenantId: 'tenant-id-001',
      name: 'John Doe',
      email: 'john@example.com',
      roles: ['Kasir'],
      permissions: ['create-transaction'],
      outletIds: ['outlet-id-001'],
    };
    const token = jwt.sign(validPayload, 'test-secret');

    const req = {
      headers: {
        cookie: `auth_token=${token}`,
      },
    } as any;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as any;
    const next = vi.fn();

    authMiddleware(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.user.email).toBe('john@example.com');
  });

  it('rejects token with missing required fields in payload (e.g. name, email)', () => {
    const invalidPayload = {
      id: 'user-id-001',
      tenantId: 'tenant-id-001',
      roles: ['Kasir']
    };
    const token = jwt.sign(invalidPayload, 'test-secret');

    const req = {
      headers: {
        authorization: `Bearer ${token}`
      }
    } as any;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    } as any;
    const next = vi.fn();

    authMiddleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      message: expect.stringContaining('Akses Ditolak')
    }));
  });
});
