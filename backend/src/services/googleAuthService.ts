import { prisma } from '../lib/prisma';
import { runInSystemContext } from '../lib/tenantContext';
import { getJwtSecret, getJwtExpiresIn } from '../lib/jwtConfig';
import { resolveAuthRoles } from '../lib/roles';
import { TenantProvisioningService } from '../domain/tenant/tenantProvisioning.service';
import jwt from 'jsonwebtoken';

/**
 * ============================================================================
 * SERVICE: GOOGLE AUTHENTICATION SERVICE
 * ============================================================================
 * Handles Google OAuth 2.0 ID Token verification, user lookup/provisioning,
 * tenant initialization, and JWT session token generation.
 * ============================================================================
 */

export interface GoogleTokenPayload {
  idToken: string;
  role?: 'owner' | 'staff';
}

type UserWithRelations = NonNullable<Awaited<ReturnType<typeof prisma.user.findFirst<{
  include: {
    tenant: { select: { taxRate: true } };
    userOutlets: { include: { outlet: { select: { id: true; name: true; type: true; code: true; isActive: true } } } };
    userRoles: { include: { role: { include: { rolePermissions: { include: { permission: true } } } } } };
  };
}>>>>;

export interface GoogleAuthResult {
  token: string;
  user: {
    id: string;
    tenantId: string;
    name: string;
    email: string;
    roles: string[];
    permissions: string[];
    outletIds: string[];
    outlets: Array<{ id: string; name: string; type?: string; code?: string | null; isActive?: boolean }>;
    taxRate: number;
  };
}

/**
 * Verifies raw Google OAuth 2.0 ID Token via Google Auth Client Library.
 *
 * @param idToken Raw ID token string from frontend client.
 * @returns Verified user profile from Google.
 */
async function verifyGoogleIdToken(idToken: string): Promise<{
  sub: string;
  email: string;
  email_verified: boolean;
  name: string;
  picture?: string;
}> {
  const { OAuth2Client } = await import('google-auth-library');
  
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error('GOOGLE_CLIENT_ID belum diatur di file .env');
  }

  const client = new OAuth2Client(clientId);
  const ticket = await client.verifyIdToken({
    idToken,
    audience: clientId,
  });

  const payload = ticket.getPayload();
  if (!payload || !payload.email) {
    throw new Error('Google ID token tidak memiliki email.');
  }

  return {
    sub: payload.sub,
    email: payload.email,
    email_verified: payload.email_verified ?? true,
    name: payload.name ?? payload.email.split('@')[0],
    picture: payload.picture,
  };
}

/**
 * Constructs JWT session payload and formats standard authentication response.
 *
 * @param user Full user entity with active role and permission relations.
 * @returns Authentication token & user profile structure.
 */
function buildAuthResult(user: UserWithRelations): GoogleAuthResult {
  const roles = resolveAuthRoles(user.userRoles);
  const permissions = Array.from(
    new Set(
      user.userRoles.flatMap((ur) =>
        ur.role.rolePermissions.map((rp) => rp.permission.name)
      )
    )
  );

  const outletIds = user.userOutlets.map((uo) => uo.outletId);
  const outlets = user.userOutlets.map((uo) => uo.outlet);
  const taxRate = user.tenant?.taxRate ? Number(user.tenant.taxRate) : 0.11;

  const secretKey = getJwtSecret();
  const token = jwt.sign(
    {
      id: user.id,
      tenantId: user.tenantId,
      name: user.name,
      email: user.email,
      roles,
      permissions,
      outletIds,
    },
    secretKey,
    { expiresIn: getJwtExpiresIn() as any }
  );

  return {
    token,
    user: {
      id: user.id,
      tenantId: user.tenantId ?? '',
      name: user.name,
      email: user.email,
      roles,
      permissions,
      outletIds,
      outlets,
      taxRate,
    },
  };
}

/**
 * Authenticates user using Google ID Token. Registers new tenant & owner if account does not exist.
 *
 * @param payload Google authentication payload containing ID token.
 * @returns Authentication token & user details.
 */
export async function loginWithGoogle(payload: GoogleTokenPayload): Promise<GoogleAuthResult> {
  return runInSystemContext('auth', async () => {
    const googleProfile = await verifyGoogleIdToken(payload.idToken);
    const normalizedEmail = googleProfile.email.toLowerCase().trim();

    const existingUser = await prisma.user.findFirst({
      where: {
        email: { equals: normalizedEmail, mode: 'insensitive' },
        deletedAt: null,
      },
      include: {
        tenant: {
          select: { taxRate: true },
        },
        userOutlets: {
          include: {
            outlet: {
              select: { id: true, name: true, type: true, code: true, isActive: true },
            },
          },
        },
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (existingUser) {
      if (!existingUser.emailVerifiedAt) {
        await prisma.user.update({
          where: { id: existingUser.id },
          data: { emailVerifiedAt: new Date() },
        });
      }

      if (existingUser.approvalStatus === 'PENDING') {
        throw new Error('Akun masih menunggu persetujuan admin toko.');
      }
      if (existingUser.approvalStatus === 'REJECTED') {
        throw new Error('Pendaftaran akun ditolak. Hubungi administrator.');
      }
      if (!existingUser.isActive) {
        throw new Error('Akun telah dinonaktifkan. Hubungi administrator.');
      }

      return buildAuthResult(existingUser);
    }

    const role = payload.role ?? 'owner';

    if (role === 'owner') {
      return createNewOwnerUser(googleProfile, normalizedEmail);
    }

    throw new Error('Google login pertama kali tanpa akun. Silakan login sebagai Owner/Toko Baru.');
  });
}

/**
 * Provisions new tenant, owner account, default main outlet, and RBAC roles for new Google sign-ups.
 */
async function createNewOwnerUser(
  googleProfile: { sub: string; email: string; name: string; picture?: string },
  normalizedEmail: string
): Promise<GoogleAuthResult> {
  return runInSystemContext('auth', async () => {
    const baseSlug = googleProfile.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '') || 'toko-baru';

    let slug = baseSlug;
    const count = await prisma.tenant.count({ where: { slug } });
    if (count > 0) {
      slug = `${slug}-${Math.floor(Math.random() * 1000)}`;
    }

    const result = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: googleProfile.name,
          slug,
          email: normalizedEmail,
          phone: '-',
        },
      });

      const roles = await TenantProvisioningService.provisionDefaultRoles(tx, tenant.id);

      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          name: googleProfile.name,
          email: normalizedEmail,
          password: null,
          authProvider: 'GOOGLE',
          isActive: true,
          approvalStatus: 'APPROVED',
          emailVerifiedAt: new Date(),
        },
      });

      await tx.userRole.create({
        data: {
          userId: user.id,
          roleId: roles.Owner,
        },
      });

      const outlet = await tx.outlet.create({
        data: {
          tenantId: tenant.id,
          name: `${tenant.name} — Pusat`,
          type: 'MAIN',
          code: 'PST',
        },
      });

      await tx.userOutlet.create({
        data: {
          userId: user.id,
          outletId: outlet.id,
        },
      });

      return user;
    }, { maxWait: 15000, timeout: 30000 });

    const userWithRelations = await prisma.user.findFirst({
      where: { id: result.id },
      include: {
        tenant: {
          select: { taxRate: true },
        },
        userOutlets: {
          include: {
            outlet: {
              select: { id: true, name: true, type: true, code: true, isActive: true },
            },
          },
        },
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!userWithRelations) {
      throw new Error('User tidak ditemukan setelah dibuat.');
    }

    return buildAuthResult(userWithRelations);
  });
}
