import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

/**
 * Service Layer untuk Autentikasi Pengguna.
 */
export class AuthService {
  /**
   * Melakukan autentikasi email & password dan menghasilkan token JWT jika kredensial benar.
   */
  async login(email: string, password: string) {
    const user = await prisma.user.findFirst({
      where: {
        email,
        deletedAt: null
      },
      include: {
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
      throw new Error('Kredensial login salah atau tidak valid');
    }
    if (!user.isActive) {
      throw new Error('Akun Anda telah dinonaktifkan. Silakan hubungi administrator.');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Kredensial login salah atau tidak valid');
    }

    const roles = user.userRoles.map((ur) => ur.role.name);
    const permissions = Array.from(
      new Set(
        user.userRoles.flatMap((ur) =>
          ur.role.rolePermissions.map((rp) => rp.permission.name)
        )
      )
    );

    const secretKey = process.env.JWT_SECRET || 'fallback_secret_key_2026';
    const token = jwt.sign(
      {
        id: user.id,
        tenantId: user.tenantId,
        name: user.name,
        email: user.email,
        roles,
        permissions
      },
      secretKey,
      { expiresIn: '1d' }
    );

    return {
      token,
      user: {
        id: user.id,
        tenantId: user.tenantId,
        name: user.name,
        email: user.email,
        roles,
        permissions
      }
    };
  }

  /**
   * Melakukan registrasi Tenant (Toko) baru beserta Owner pertama dalam transaksi database yang terpadu.
   */
  async registerTenant(input: { tenantName: string; ownerName: string; email: string; password: string }) {
    const existingUser = await prisma.user.findFirst({
      where: {
        email: input.email,
        deletedAt: null
      }
    });

    if (existingUser) {
      throw new Error('Alamat email tersebut sudah digunakan oleh pengguna lain.');
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

    return prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: input.tenantName,
          slug,
          email: input.email,
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
          email: input.email,
          password: hashedPassword,
          isActive: true
        }
      });

      await tx.userRole.create({
        data: {
          userId: user.id,
          roleId: roleOwner.id
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
    });
  }
}
