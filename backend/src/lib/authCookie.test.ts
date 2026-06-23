import { describe, expect, it } from 'vitest';
import type { Request, Response } from 'express';
import {
  AUTH_COOKIE_NAME,
  clearAuthCookie,
  extractAuthToken,
  setAuthCookie,
} from './authCookie';

describe('authCookie', () => {
  it('extracts auth token from httpOnly cookie', () => {
    const req = {
      headers: {
        cookie: `${AUTH_COOKIE_NAME}=signed-token-value`,
      },
    } as Request;

    expect(extractAuthToken(req)).toBe('signed-token-value');
  });

  it('falls back to Authorization bearer token', () => {
    const req = {
      headers: {
        authorization: 'Bearer header-token-value',
      },
    } as Request;

    expect(extractAuthToken(req)).toBe('header-token-value');
  });

  it('prefers cookie token over Authorization header', () => {
    const req = {
      headers: {
        cookie: `${AUTH_COOKIE_NAME}=cookie-token`,
        authorization: 'Bearer header-token',
      },
    } as Request;

    expect(extractAuthToken(req)).toBe('cookie-token');
  });

  it('sets and clears auth cookie with secure defaults', () => {
    const cookies: string[] = [];
    const cleared: string[] = [];
    const res = {
      cookie: (name: string, value: string, options: Record<string, unknown>) => {
        cookies.push(`${name}=${value}:${JSON.stringify(options)}`);
      },
      clearCookie: (name: string, options: Record<string, unknown>) => {
        cleared.push(`${name}:${JSON.stringify(options)}`);
      },
    } as unknown as Response;

    setAuthCookie(res, 'jwt-token');
    clearAuthCookie(res);

    expect(cookies[0]).toContain(`${AUTH_COOKIE_NAME}=jwt-token`);
    expect(cookies[0]).toContain('"httpOnly":true');
    expect(cleared[0]).toContain(`${AUTH_COOKIE_NAME}:`);
  });
});
