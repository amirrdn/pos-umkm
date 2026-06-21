import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CheckoutError } from '../domain/transaction';
import {
  createMockRequest,
  createMockResponse,
  productId,
  tenantId,
  userId,
} from '../test/helpers/http';

vi.mock('../services/transactionCheckoutService', () => ({
  processCheckout: vi.fn(),
}));

import { checkout } from './transactionController';
import { processCheckout } from '../services/transactionCheckoutService';

describe('checkout controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects checkout when x-outlet-id context is missing', async () => {
    vi.mocked(processCheckout).mockRejectedValue(
      new CheckoutError(
        'Aksi ditolak: Transaksi POS wajib dikaitkan dengan Outlet aktif.',
        'OUTLET_REQUIRED',
        400
      )
    );

    const req = createMockRequest({
      tenantId,
      user: {
        id: userId,
        tenantId,
        name: 'Kasir Test',
        email: 'kasir@test.com',
        roles: ['Kasir'],
        permissions: [],
      },
      body: {
        paymentMethod: 'CASH',
        items: [{ productId, quantity: 1 }],
      },
    } as any);
    const res = createMockResponse();

    await checkout(req, res);

    expect(processCheckout).toHaveBeenCalledOnce();
    expect(res.statusCode).toBe(400);
    expect(res.body).toMatchObject({
      success: false,
      message: expect.stringContaining('Outlet aktif'),
    });
  });

  it('returns success payload from checkout service', async () => {
    vi.mocked(processCheckout).mockResolvedValue({
      transaction: {
        id: 'txn-1',
        invoiceNumber: 'INV-001',
        grandTotal: 10000,
        paymentMethod: 'CASH',
        status: 'COMPLETED',
      } as any,
    });

    const req = createMockRequest({
      tenantId,
      outletId: 'outlet-1',
      user: {
        id: userId,
        tenantId,
        name: 'Kasir Test',
        email: 'kasir@test.com',
        roles: ['Kasir'],
        permissions: [],
      },
      body: {
        paymentMethod: 'CASH',
        items: [{ productId, quantity: 1 }],
      },
    } as any);
    const res = createMockResponse();

    await checkout(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({
      success: true,
      data: expect.objectContaining({ invoiceNumber: 'INV-001' }),
    });
  });
});
