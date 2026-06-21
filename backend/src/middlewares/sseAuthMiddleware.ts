import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { hasTenantWideOutletAccess, isPlatformAdmin } from '../lib/roles';
import { getJwtSecret } from '../lib/jwtConfig';

interface UserPayload {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  roles: string[];
  permissions: string[];
  outletIds?: string[];
}

/**
 * Auth untuk SSE — EventSource tidak bisa set Authorization header.
 * Terima Bearer header ATAU query `?token=`.
 */
export function sseAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    const queryToken = typeof req.query.token === 'string' ? req.query.token : undefined;

    let token: string | undefined;
    if (authHeader) {
      const parts = authHeader.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') token = parts[1];
    }
    if (!token && queryToken) token = queryToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token diperlukan untuk stream notifikasi.',
      });
    }

    const secretKey = getJwtSecret();
    const decoded = jwt.verify(token, secretKey) as UserPayload;

    const tenantWideAccess = hasTenantWideOutletAccess(decoded.roles);

    req.user = {
      id: decoded.id,
      tenantId: decoded.tenantId,
      name: decoded.name,
      email: decoded.email,
      roles: decoded.roles,
      permissions: decoded.permissions,
      outletIds: decoded.outletIds,
    };
    req.hasTenantWideOutletAccess = tenantWideAccess;
    req.isPlatformAdmin = isPlatformAdmin(decoded.roles);

    const headerOutletId = req.headers['x-outlet-id'] as string;
    if (headerOutletId && (tenantWideAccess || decoded.outletIds?.includes(headerOutletId))) {
      req.outletId = headerOutletId;
    } else if (!tenantWideAccess && decoded.outletIds?.length) {
      req.outletId = decoded.outletIds[0];
    }

    return next();
  } catch (error: unknown) {
    console.error('[sseAuthMiddleware]', error);
    return res.status(401).json({
      success: false,
      message: 'Token stream notifikasi tidak valid.',
    });
  }
}
