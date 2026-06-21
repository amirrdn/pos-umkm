import { afterEach, describe, expect, it } from 'vitest';
import {
  getMidtransCoreApiBaseUrl,
  getMidtransServerKey,
  getMidtransSnapApiBaseUrl,
  isMidtransProduction,
} from './midtransConfig';

describe('midtransConfig', () => {
  const originalKey = process.env.MIDTRANS_SERVER_KEY;
  const originalProd = process.env.MIDTRANS_IS_PRODUCTION;

  afterEach(() => {
    if (originalKey === undefined) {
      delete process.env.MIDTRANS_SERVER_KEY;
    } else {
      process.env.MIDTRANS_SERVER_KEY = originalKey;
    }
    if (originalProd === undefined) {
      delete process.env.MIDTRANS_IS_PRODUCTION;
    } else {
      process.env.MIDTRANS_IS_PRODUCTION = originalProd;
    }
  });

  it('returns server key when set', () => {
    process.env.MIDTRANS_SERVER_KEY = 'test-key';
    expect(getMidtransServerKey()).toBe('test-key');
  });

  it('throws when server key is missing', () => {
    delete process.env.MIDTRANS_SERVER_KEY;
    expect(() => getMidtransServerKey()).toThrow(/MIDTRANS_SERVER_KEY environment variable is required/);
  });

  it('resolves sandbox URLs by default', () => {
    delete process.env.MIDTRANS_IS_PRODUCTION;
    expect(isMidtransProduction()).toBe(false);
    expect(getMidtransCoreApiBaseUrl()).toBe('https://api.sandbox.midtrans.com/v2');
    expect(getMidtransSnapApiBaseUrl()).toBe('https://app.sandbox.midtrans.com/snap/v1');
  });

  it('resolves production URLs when enabled', () => {
    process.env.MIDTRANS_IS_PRODUCTION = 'true';
    expect(isMidtransProduction()).toBe(true);
    expect(getMidtransCoreApiBaseUrl()).toBe('https://api.midtrans.com/v2');
    expect(getMidtransSnapApiBaseUrl()).toBe('https://app.midtrans.com/snap/v1');
  });
});
