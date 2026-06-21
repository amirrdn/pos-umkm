import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { midtransRequest, MidtransApiError } from './midtransHttp';

describe('midtransRequest', () => {
  const originalKey = process.env.MIDTRANS_SERVER_KEY;

  beforeEach(() => {
    process.env.MIDTRANS_SERVER_KEY = 'test-server-key';
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    if (originalKey === undefined) {
      delete process.env.MIDTRANS_SERVER_KEY;
    } else {
      process.env.MIDTRANS_SERVER_KEY = originalKey;
    }
  });

  it('returns parsed JSON on success', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ transaction_status: 'settlement' }),
      })
    );

    const result = await midtransRequest<{ transaction_status: string }>(
      'https://api.sandbox.midtrans.com/v2',
      '/INV-001/status',
      { method: 'GET' }
    );

    expect(result.transaction_status).toBe('settlement');
    expect(fetch).toHaveBeenCalledWith(
      'https://api.sandbox.midtrans.com/v2/INV-001/status',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: expect.stringMatching(/^Basic /),
        }),
      })
    );
  });

  it('throws MidtransApiError when response is not ok', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ message: 'Invalid order id' }),
      })
    );

    await expect(
      midtransRequest('https://api.sandbox.midtrans.com/v2', '/bad/status', { method: 'GET' })
    ).rejects.toBeInstanceOf(MidtransApiError);
  });
});
