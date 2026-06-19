import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// ==========================================
// INTERFACE
// ==========================================

export interface CreateStaffInput {
  tenantId: string;
  name: string;
  email: string;
  password: string;
  roleId: string;
  outletIds?: string[];
}

export interface UpdateStaffInput {
  name?: string;
  isActive?: boolean;
  roleId?: string;
  outletIds?: string[];
}

// ==========================================
// SERVICE FUNCTIONS
// ==========================================

/**
 * Mengambil semua karyawan aktif dan nonaktif untuk sebuah tenant.
 * Mengembalikan data user beserta role yang mereka miliki.
 */
export async function getStaffList(tenantId: string) {
  return prisma.user.findMany({
    where: {
      tenantId,
      deletedAt: null,
    },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      name: true,
      email: true,
      isActive: true,
      approvalStatus: true,
      userOutlets: {
        include: {
          outlet: {
            select: { id: true, name: true }
          }
        }
      },
      createdAt: true,
      userRoles: {
        include: {
          role: {
            select: { id: true, name: true, description: true },
          },
        },
      },
    },
  });
}

/**
 * Menambahkan karyawan baru ke dalam tenant.
 * Owner memilih role langsung saat membuat akun.
 * Email harus unik secara global di seluruh sistem.
 */
export async function createStaff({ tenantId, name, email, password, roleId, outletIds }: CreateStaffInput) {
  const existing = await prisma.user.findFirst({
    where: { email, deletedAt: null },
  });

  if (existing) {
    throw new Error('Alamat email tersebut sudah digunakan oleh pengguna lain.');
  }

  const role = await prisma.role.findFirst({
    where: { id: roleId, tenantId },
  });

  if (!role) {
    throw new Error('Role tidak ditemukan atau bukan milik tenant Anda.');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        tenantId,
        name,
        email,
        password: hashedPassword,
        isActive: true,
        approvalStatus: 'APPROVED',
        emailVerifiedAt: new Date(),
      },
    });

    await tx.userRole.create({
      data: { userId: user.id, roleId },
    });

    if (outletIds && outletIds.length > 0) {
      await tx.userOutlet.createMany({
        data: outletIds.map(oid => ({ userId: user.id, outletId: oid }))
      });
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      isActive: user.isActive,
      approvalStatus: user.approvalStatus,
      role: role.name
    };
  });
}

/**
 * Memperbarui data karyawan: nama, status aktif, atau role.
 * Jika roleId berubah, hapus semua user role lama dan assign yang baru.
 */
export async function updateStaff(staffId: string, tenantId: string, data: UpdateStaffInput) {
  const user = await prisma.user.findFirst({
    where: { id: staffId, tenantId, deletedAt: null },
  });

  if (!user) {
    throw new Error('Karyawan tidak ditemukan.');
  }

  return prisma.$transaction(async (tx) => {
    if (data.name !== undefined || data.isActive !== undefined) {
      await tx.user.update({
        where: { id: staffId },
        data: {
          ...(data.name !== undefined && { name: data.name }),
          ...(data.isActive !== undefined && { isActive: data.isActive }),
        },
      });
    }

    if (data.outletIds !== undefined) {
      // Re-assign user outlets
      await tx.userOutlet.deleteMany({ where: { userId: staffId } });
      if (data.outletIds.length > 0) {
        await tx.userOutlet.createMany({
          data: data.outletIds.map(oid => ({ userId: staffId, outletId: oid }))
        });
      }
    }

    if (data.roleId) {
      const role = await tx.role.findFirst({
        where: { id: data.roleId, tenantId },
      });

      if (!role) {
        throw new Error('Role tidak ditemukan atau bukan milik tenant Anda.');
      }

      await tx.userRole.deleteMany({ where: { userId: staffId } });
      await tx.userRole.create({ data: { userId: staffId, roleId: data.roleId } });
    }
    return tx.user.findUnique({
      where: { id: staffId },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        approvalStatus: true,
        userOutlets: {
          include: {
            outlet: { select: { id: true, name: true } }
          }
        },
        userRoles: {
          include: {
            role: { select: { id: true, name: true } },
          },
        },
      },
    });
  });
}

/**
 * Melakukan soft delete pada karyawan (tidak menghapus dari database).
 * Proteksi: tidak boleh menghapus diri sendiri.
 */
export async function deleteStaff(staffId: string, tenantId: string, requesterId: string) {
  if (staffId === requesterId) {
    throw new Error('Anda tidak bisa menghapus akun Anda sendiri.');
  }

  const user = await prisma.user.findFirst({
    where: { id: staffId, tenantId, deletedAt: null },
  });

  if (!user) {
    throw new Error('Karyawan tidak ditemukan.');
  }

  await prisma.user.update({
    where: { id: staffId },
    data: { deletedAt: new Date(), isActive: false },
  });

  return { message: `Akun karyawan [${user.name}] berhasil dihapus.` };
}

/**
 * Mengambil semua Role yang tersedia untuk tenant.
 * Digunakan untuk mengisi dropdown saat Owner menambah/mengubah karyawan.
 */
export async function getRoles(tenantId: string) {
  return prisma.role.findMany({
    where: { tenantId },
    select: { id: true, name: true, description: true },
    orderBy: { name: 'asc' },
  });
}

/**
 * Menerima pendaftaran staf baru.
 */
export async function approveStaff(staffId: string, tenantId: string) {
  const user = await prisma.user.findFirst({
    where: { id: staffId, tenantId, deletedAt: null },
  });

  if (!user) {
    throw new Error('Karyawan tidak ditemukan.');
  }

  return prisma.user.update({
    where: { id: staffId },
    data: { approvalStatus: 'APPROVED' },
    select: { id: true, name: true, email: true, approvalStatus: true }
  });
}

/**
 * Menolak pendaftaran staf baru (bisa menghapus akun).
 */
export async function rejectStaff(staffId: string, tenantId: string) {
  const user = await prisma.user.findFirst({
    where: { id: staffId, tenantId, deletedAt: null },
  });

  if (!user) {
    throw new Error('Karyawan tidak ditemukan.');
  }

  return prisma.user.update({
    where: { id: staffId },
    data: { approvalStatus: 'REJECTED', deletedAt: new Date(), isActive: false },
    select: { id: true, name: true, email: true, approvalStatus: true }
  });
}
