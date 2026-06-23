import bcrypt from 'bcrypt';
import { prisma } from '../lib/prisma';
import { runInSystemContext } from '../lib/tenantContext';
import jwt from 'jsonwebtoken';
import {
  normalizeAuthEmail,
  handleDuplicateRegistrationEmail,
  deliverRegistrationVerificationEmail,
} from '../domain/auth/emailVerification.service';
import { LoginError, LOGIN_ERROR_MESSAGES } from '../domain/auth/login.errors';
import { resolveAuthRoles } from '../lib/roles';
import { getJwtSecret, getJwtExpiresIn } from '../lib/jwtConfig';

/**
 * Service Layer untuk Autentikasi Pengguna.
 */
export class AuthService {
  /**
   * Melakukan autentikasi email & password dan menghasilkan token JWT jika kredensial benar.
   */
  async login(email: string, password: string) {
    return runInSystemContext('auth', async () => {
    const normalizedEmail = normalizeAuthEmail(email);
    const user = await prisma.user.findFirst({
      where: {
        email: { equals: normalizedEmail, mode: 'insensitive' },
        deletedAt: null
      },
      include: {
        tenant: {
          select: { taxRate: true }
        },
        userOutlets: {
          include: {
            outlet: {
              select: { id: true, name: true, type: true, code: true, isActive: true }
            }
          }
        },
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!user) {
      throw new LoginError('INVALID_CREDENTIALS', LOGIN_ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    if (!user.emailVerifiedAt) {
      throw new LoginError('EMAIL_NOT_VERIFIED', LOGIN_ERROR_MESSAGES.EMAIL_NOT_VERIFIED);
    }
    if (user.approvalStatus === 'PENDING') {
      throw new LoginError('APPROVAL_PENDING', LOGIN_ERROR_MESSAGES.APPROVAL_PENDING);
    }
    if (user.approvalStatus === 'REJECTED') {
      throw new LoginError('ACCOUNT_REJECTED', LOGIN_ERROR_MESSAGES.ACCOUNT_REJECTED);
    }
    if (!user.isActive) {
      throw new LoginError('ACCOUNT_DISABLED', LOGIN_ERROR_MESSAGES.ACCOUNT_DISABLED);
    }

    if (!user.password) {
      throw new LoginError('INVALID_CREDENTIALS', LOGIN_ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new LoginError('INVALID_CREDENTIALS', LOGIN_ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

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

    const secretKey = getJwtSecret();
    const token = jwt.sign(
      {
        id: user.id,
        tenantId: user.tenantId,
        name: user.name,
        email: user.email,
        roles,
        permissions,
        outletIds
      },
      secretKey,
      { expiresIn: getJwtExpiresIn() as any }
    );

    const taxRate = user.tenant?.taxRate ? Number(user.tenant.taxRate) : 0.11;

    return {
      token,
      user: {
        id: user.id,
        tenantId: user.tenantId,
        name: user.name,
        email: user.email,
        roles,
        permissions,
        outletIds,
        outlets,
        taxRate
      }
    };
    });
  }

  /**
   * Melakukan registrasi Tenant (Toko) baru beserta Owner pertama dalam transaksi database yang terpadu.
   */
  async registerTenant(input: { tenantName: string; ownerName: string; email: string; password: string }) {
    return runInSystemContext('auth', async () => {
    const normalizedEmail = normalizeAuthEmail(input.email);
    const existingUser = await prisma.user.findFirst({
      where: {
        email: { equals: normalizedEmail, mode: 'insensitive' },
        deletedAt: null
      }
    });

    if (existingUser) {
      await handleDuplicateRegistrationEmail(existingUser);
    }

    const hashedPassword = await bcrypt.hash(input.password, 10);

    const baseSlug = input.tenantName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    let slug = baseSlug || 'toko-baru';

    const count = await prisma.tenant.count({
      where: { slug }
    });

    if (count > 0) {
      slug = `${slug}-${Math.floor(Math.random() * 1000)}`;
    }

    const result = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: input.tenantName,
          slug,
          email: normalizedEmail,
          phone: '-'
        }
      });

      const permissions = await tx.permission.findMany();

      const roleOwner = await tx.role.create({
        data: {
          tenantId: tenant.id,
          name: 'Owner',
          description: 'Pemilik Toko dengan kontrol dan izin akses penuh'
        }
      });
      const ownerPermissionsData = permissions.map((perm) => ({
        roleId: roleOwner.id,
        permissionId: perm.id
      }));
      await tx.rolePermission.createMany({ data: ownerPermissionsData });

      const roleManager = await tx.role.create({
        data: {
          tenantId: tenant.id,
          name: 'Manager',
          description: 'Pengelola operasional toko dengan hak penuh atas transaksi, produk, pelanggan, staf, dan laporan keuangan'
        }
      });
      const managerPermissionsData = permissions.map((perm) => ({
        roleId: roleManager.id,
        permissionId: perm.id
      }));
      await tx.rolePermission.createMany({ data: managerPermissionsData });

      const roleStafGudang = await tx.role.create({
        data: {
          tenantId: tenant.id,
          name: 'Staf Gudang',
          description: 'Pengelola logistik, melihat/menambah/mengubah data produk serta mutasi stok'
        }
      });
      const gudangPermissions = ['view:products', 'create:products', 'update:products'];
      const gudangPermissionsData = permissions
        .filter(p => gudangPermissions.includes(p.name))
        .map((perm) => ({
          roleId: roleStafGudang.id,
          permissionId: perm.id
        }));
      await tx.rolePermission.createMany({ data: gudangPermissionsData });

      const roleKasir = await tx.role.create({
        data: {
          tenantId: tenant.id,
          name: 'Kasir',
          description: 'Kasir toko dengan izin membuat transaksi dan melihat katalog produk'
        }
      });
      const kasirPermissions = ['create-transaction', 'view:products', 'view:customers', 'create:customers'];
      const kasirPermissionsData = permissions
        .filter(p => kasirPermissions.includes(p.name))
        .map((perm) => ({
          roleId: roleKasir.id,
          permissionId: perm.id
        }));
      await tx.rolePermission.createMany({ data: kasirPermissionsData });

      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          name: input.ownerName,
          email: normalizedEmail,
          password: hashedPassword,
          isActive: true,
          approvalStatus: 'APPROVED',
        }
      });

      await tx.userRole.create({
        data: {
          userId: user.id,
          roleId: roleOwner.id
        }
      });

      const mainOutlet = await tx.outlet.create({
        data: {
          tenantId: tenant.id,
          name: `${tenant.name} — Pusat`,
          type: 'MAIN',
          code: 'PST'
        }
      });

      await tx.userOutlet.create({
        data: {
          userId: user.id,
          outletId: mainOutlet.id
        }
      });

      return {
        tenant,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: 'Owner'
        }
      };
    }, { maxWait: 15000, timeout: 30000 });

    await deliverRegistrationVerificationEmail({
      email: result.user.email,
      name: result.user.name,
      userId: result.user.id,
      rollback: async () => {
        await prisma.tenant.delete({ where: { id: result.tenant.id } });
      },
    });

    return {
      ...result,
      emailVerificationSent: true,
    };
    });
  }

  /**
   * Melakukan registrasi Staf ke dalam Tenant yang sudah ada.
   * Status staf secara default akan menjadi PENDING.
   */
  async registerStaff(input: { tenantId: string; name: string; email: string; password: string; outletIds: string[] }) {
    return runInSystemContext('auth', async () => {
    const normalizedEmail = normalizeAuthEmail(input.email);
    const existingUser = await prisma.user.findFirst({
      where: {
        email: { equals: normalizedEmail, mode: 'insensitive' },
        deletedAt: null
      }
    });

    if (existingUser) {
      await handleDuplicateRegistrationEmail(existingUser);
    }

    const hashedPassword = await bcrypt.hash(input.password, 10);

    const result = await prisma.$transaction(async (tx) => {
      // Pastikan tenant ada
      const tenant = await tx.tenant.findUnique({ where: { id: input.tenantId } });
      if (!tenant) throw new Error('Tenant tidak ditemukan.');

      // Default role untuk staf yang mendaftar secara publik adalah Kasir
      const roleKasir = await tx.role.findFirst({
        where: { tenantId: tenant.id, name: 'Kasir' }
      });

      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          name: input.name,
          email: normalizedEmail,
          password: hashedPassword,
          isActive: true,
          approvalStatus: 'PENDING'
        }
      });

      if (roleKasir) {
        await tx.userRole.create({
          data: {
            userId: user.id,
            roleId: roleKasir.id
          }
        });
      }

      if (input.outletIds.length === 0) {
        throw new Error('Minimal satu outlet harus dipilih.');
      }

      const validOutlets = await tx.outlet.findMany({
        where: {
          id: { in: input.outletIds },
          tenantId: tenant.id,
          deletedAt: null,
          isActive: true,
        },
        select: { id: true },
      });

      if (validOutlets.length !== input.outletIds.length) {
        throw new Error('Salah satu outlet tidak valid untuk toko ini.');
      }

      const userOutlets = validOutlets.map((outlet) => ({
        userId: user.id,
        outletId: outlet.id,
      }));

      await tx.userOutlet.createMany({
        data: userOutlets
      });

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        approvalStatus: user.approvalStatus
      };
    }, { maxWait: 15000, timeout: 30000 });

    await deliverRegistrationVerificationEmail({
      email: result.email,
      name: result.name,
      userId: result.id,
      rollback: async () => {
        await prisma.user.delete({ where: { id: result.id } });
      },
    });

    return {
      ...result,
      emailVerificationSent: true,
    };
    });
  }
}
