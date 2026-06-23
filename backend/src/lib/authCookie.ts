import type { CookieOptions, Request, Response } from 'express';
import { getJwtExpiresIn } from './jwtConfig';

export const AUTH_COOKIE_NAME = 'auth_token';

function resolveAuthCookieMaxAgeMs(): number {
  const expiresIn = getJwtExpiresIn();
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match) {
    return 15 * 60 * 1000;
  }

  const value = Number(match[1]);
  const unit = match[2];
  const unitToMs = {
    s: 1_000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
  } as const;

  return value * unitToMs[unit as keyof typeof unitToMs];
}

function resolveAuthCookieSameSite(): CookieOptions['sameSite'] {
  const configured = process.env.COOKIE_SAME_SITE?.toLowerCase();
  if (configured === 'lax' || configured === 'strict' || configured === 'none') {
    return configured;
  }
  // Frontend Vercel + API Render = cross-site; Strict memblokir cookie pada XHR berikutnya
  return process.env.NODE_ENV === 'production' ? 'none' : 'strict';
}

export function getAuthCookieOptions(): CookieOptions {
  const secure = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure,
    sameSite: resolveAuthCookieSameSite(),
    path: '/',
    maxAge: resolveAuthCookieMaxAgeMs(),
  };
}

export function setAuthCookie(res: Response, token: string): void {
  res.cookie(AUTH_COOKIE_NAME, token, getAuthCookieOptions());
}

export function clearAuthCookie(res: Response): void {
  const options = getAuthCookieOptions();
  res.clearCookie(AUTH_COOKIE_NAME, {
    httpOnly: true,
    secure: options.secure,
    sameSite: options.sameSite,
    path: '/',
  });
}

function readAuthTokenFromCookie(req: Request): string | undefined {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) {
    return undefined;
  }

  for (const segment of cookieHeader.split(';')) {
    const [rawName, ...rawValueParts] = segment.trim().split('=');
    if (rawName !== AUTH_COOKIE_NAME) {
      continue;
    }

    const rawValue = rawValueParts.join('=');
    if (!rawValue) {
      return undefined;
    }

    try {
      return decodeURIComponent(rawValue);
    } catch {
      return rawValue;
    }
  }

  return undefined;
}

function readAuthTokenFromAuthorizationHeader(req: Request): string | undefined {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return undefined;
  }

  const [scheme, token] = authHeader.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return undefined;
  }

  return token;
}

export function extractAuthToken(req: Request): string | undefined {
  return readAuthTokenFromCookie(req) ?? readAuthTokenFromAuthorizationHeader(req);
}
