import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { hasTenantWideOutletAccess, isPlatformAdmin } from '../lib/roles';
import { getJwtSecret } from '../lib/jwtConfig';
import { validateJwtPayload } from '../lib/jwtPayload';
import { logError } from '../lib/logger';
import { extractAuthToken } from '../lib/authCookie';

export function sseAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const queryToken = typeof req.query.token === 'string' ? req.query.token : undefined;
    const token = extractAuthToken(req) ?? queryToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token diperlukan untuk stream notifikasi.',
      });
    }

    const secretKey = getJwtSecret();
    const decoded = jwt.verify(token, secretKey);
    const validated = validateJwtPayload(decoded);

    const tenantWideAccess = hasTenantWideOutletAccess(validated.roles);

    req.user = {
      id: validated.id,
      tenantId: validated.tenantId ?? null,
      name: validated.name,
      email: validated.email,
      roles: validated.roles,
      permissions: validated.permissions,
      outletIds: validated.outletIds,
    };
    req.hasTenantWideOutletAccess = tenantWideAccess;
    req.isPlatformAdmin = isPlatformAdmin(validated.roles);

    const headerOutletId = req.headers['x-outlet-id'] as string;
    if (headerOutletId && (tenantWideAccess || validated.outletIds?.includes(headerOutletId))) {
      req.outletId = headerOutletId;
    } else if (!tenantWideAccess && validated.outletIds?.length) {
      req.outletId = validated.outletIds[0];
    }

    return next();
  } catch (error: unknown) {
    logError('sseAuthMiddleware', error);
    return res.status(401).json({
      success: false,
      message: 'Token stream notifikasi tidak valid.',
    });
  }
}
