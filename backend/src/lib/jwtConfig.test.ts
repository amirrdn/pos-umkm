import { afterEach, describe, expect, it } from 'vitest';
import { getJwtSecret, getJwtExpiresIn } from './jwtConfig';

describe('getJwtSecret', () => {
  const original = process.env.JWT_SECRET;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = original;
    }
  });

  it('returns JWT_SECRET when set', () => {
    process.env.JWT_SECRET = 'test-secret';
    expect(getJwtSecret()).toBe('test-secret');
  });

  it('throws when JWT_SECRET is missing', () => {
    delete process.env.JWT_SECRET;
    expect(() => getJwtSecret()).toThrow(/JWT_SECRET environment variable is required/);
  });
});

describe('getJwtExpiresIn', () => {
  const original = process.env.JWT_EXPIRES_IN;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.JWT_EXPIRES_IN;
    } else {
      process.env.JWT_EXPIRES_IN = original;
    }
  });

  it('returns custom expiry when set', () => {
    process.env.JWT_EXPIRES_IN = '1h';
    expect(getJwtExpiresIn()).toBe('1h');
  });

  it('returns 15m as fallback default', () => {
    delete process.env.JWT_EXPIRES_IN;
    expect(getJwtExpiresIn()).toBe('15m');
  });
});
