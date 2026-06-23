import { Prisma } from '@prisma/client';
import bcrypt from 'bcrypt';
import { prisma, PrismaTx } from '../lib/prisma';

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

export interface StaffListFilters {
  search?: string;
  roleName?: string;
  approvalStatus?: 'APPROVED' | 'PENDING';
}

export interface StaffOverviewMetrics {
  activeStaffCount: number;
  inactiveStaffCount: number;
  pendingApprovalCount: number;
}

const staffUserBaseSelect = {
  id: true,
  name: true,
  email: true,
  isActive: true,
  approvalStatus: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

type StaffUserBase = Prisma.UserGetPayload<{ select: typeof staffUserBaseSelect }>;

type StaffUserWithRelations = StaffUserBase & {
  userOutlets: {
    outlet: {
      id: string;
      name: string;
    };
  }[];
  userRoles: {
    role: {
      id: string;
      name: string;
      description: string | null;
    };
  }[];
};

async function loadStaffRelations(
  tenantId: string,
  users: StaffUserBase[],
  tx?: PrismaTx
): Promise<StaffUserWithRelations[]> {
  if (users.length === 0) {
    return [];
  }

  const load = async (client: PrismaTx) => {
    const userIds = users.map((user) => user.id);

    const [assignments, outletLinks] = await Promise.all([
      client.userRole.findMany({
        where: { userId: { in: userIds } },
        select: { userId: true, roleId: true },
      }),
      client.userOutlet.findMany({
        where: { userId: { in: userIds } },
        select: { userId: true, outletId: true },
      }),
    ]);

    const roleIds = [...new Set(assignments.map((assignment) => assignment.roleId))];
    const outletIds = [...new Set(outletLinks.map((link) => link.outletId))];

    const [tenantRoles, outlets] = await Promise.all([
      roleIds.length > 0
        ? client.role.findMany({
            where: { id: { in: roleIds }, tenantId },
            select: { id: true, name: true, description: true },
          })
        : Promise.resolve([]),
      outletIds.length > 0
        ? client.outlet.findMany({
            where: { id: { in: outletIds }, tenantId, deletedAt: null },
            select: { id: true, name: true },
          })
        : Promise.resolve([]),
    ]);

    const roleMap = new Map(tenantRoles.map((role) => [role.id, role]));
    const outletMap = new Map(outlets.map((outlet) => [outlet.id, outlet]));

    return users
      .map((user) => {
        const userRoles = assignments
          .filter((assignment) => assignment.userId === user.id && roleMap.has(assignment.roleId))
          .map((assignment) => ({ role: roleMap.get(assignment.roleId)! }));

        const userOutlets = outletLinks
          .filter((link) => link.userId === user.id)
          .map((link) => ({ outlet: outletMap.get(link.outletId)! }))
          .filter((entry): entry is { outlet: { id: string; name: string } } => entry.outlet != null);

        return { ...user, userRoles, userOutlets };
      })
      .filter((user) => user.userRoles.length > 0);
  };

  if (tx) {
    return load(tx);
  }

  return prisma.$executeRawWithTenant(tenantId, load);
}

async function getTenantStaffUserIds(tenantId: string): Promise<string[]> {
  return prisma.$executeRawWithTenant(tenantId, async (tx) => {
    const assignments = await tx.userRole.findMany({
      where: { role: { tenantId } },
      select: { userId: true },
      distinct: ['userId'],
    });
    return assignments.map((assignment) => assignment.userId);
  });
}

function buildStaffTenantWhere(tenantId: string, tenantStaffUserIds?: string[]): Prisma.UserWhereInput {
  return {
    tenantId,
    deletedAt: null,
    ...(tenantStaffUserIds ? { id: { in: tenantStaffUserIds } } : {}),
  };
}

function buildStaffListWhere(
  tenantId: string,
  filters?: StaffListFilters,
  tenantStaffUserIds?: string[]
): Prisma.UserWhereInput {
  const where = buildStaffTenantWhere(tenantId, tenantStaffUserIds);

  if (filters?.approvalStatus) {
    where.approvalStatus = filters.approvalStatus;
  }

  if (filters?.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { email: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  if (filters?.roleName) {
    where.userRoles = {
      some: {
        role: {
          name: filters.roleName,
          tenantId,
        },
      },
    };
  }

  return where;
}

export async function getStaffSummary(tenantId: string): Promise<StaffOverviewMetrics> {
  const tenantStaffUserIds = await getTenantStaffUserIds(tenantId);
  const baseWhere = buildStaffTenantWhere(tenantId, tenantStaffUserIds);

  const [activeStaffCount, inactiveStaffCount, pendingApprovalCount] = await Promise.all([
    prisma.user.count({
      where: { ...baseWhere, approvalStatus: 'APPROVED', isActive: true },
    }),
    prisma.user.count({
      where: { ...baseWhere, approvalStatus: 'APPROVED', isActive: false },
    }),
    prisma.user.count({
      where: { ...baseWhere, approvalStatus: 'PENDING' },
    }),
  ]);

  return {
    activeStaffCount,
    inactiveStaffCount,
    pendingApprovalCount,
  };
}

export async function getStaffList(tenantId: string, filters?: StaffListFilters) {
  const tenantStaffUserIds = await getTenantStaffUserIds(tenantId);
  const users = await prisma.user.findMany({
    where: buildStaffListWhere(tenantId, filters, tenantStaffUserIds),
    orderBy: { createdAt: 'asc' },
    select: staffUserBaseSelect,
  });

  return loadStaffRelations(tenantId, users);
}

export interface StaffDetailStats {
  totalShifts: number;
  openShifts: number;
}

export interface StaffDetail {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  approvalStatus: string;
  createdAt: Date;
  updatedAt: Date;
  emailVerifiedAt: Date | null;
  userOutlets: {
    outlet: {
      id: string;
      name: string;
    };
  }[];
  userRoles: {
    role: {
      id: string;
      name: string;
      description: string | null;
    };
  }[];
  stats: StaffDetailStats;
}

export async function getStaffDetail(staffId: string, tenantId: string): Promise<StaffDetail> {
  const tenantStaffUserIds = await getTenantStaffUserIds(tenantId);
  const user = await prisma.user.findFirst({
    where: { id: staffId, ...buildStaffTenantWhere(tenantId, tenantStaffUserIds) },
    select: {
      ...staffUserBaseSelect,
      updatedAt: true,
      emailVerifiedAt: true,
    },
  });

  if (!user) {
    throw new Error('Karyawan tidak ditemukan.');
  }

  const [staffWithRelations] = await loadStaffRelations(tenantId, [user]);
  if (!staffWithRelations) {
    throw new Error('Karyawan tidak ditemukan.');
  }

  const [totalShifts, openShifts] = await Promise.all([
    prisma.shift.count({ where: { userId: staffId, tenantId } }),
    prisma.shift.count({ where: { userId: staffId, tenantId, status: 'OPEN' } }),
  ]);

  return {
    ...staffWithRelations,
    updatedAt: user.updatedAt,
    emailVerifiedAt: user.emailVerifiedAt,
    stats: { totalShifts, openShifts },
  };
}

export async function bulkApproveStaff(staffIds: string[], tenantId: string) {
  const uniqueIds = [...new Set(staffIds)];

  const pendingStaff = await prisma.user.findMany({
    where: {
      id: { in: uniqueIds },
      ...buildStaffTenantWhere(tenantId, await getTenantStaffUserIds(tenantId)),
      approvalStatus: 'PENDING',
    },
    select: staffUserBaseSelect,
  });

  if (pendingStaff.length === 0) {
    throw new Error('Tidak ada permintaan staf yang valid untuk disetujui.');
  }

  const pendingIds = pendingStaff.map((staff) => staff.id);

  await prisma.user.updateMany({
    where: { id: { in: pendingIds }, tenantId, approvalStatus: 'PENDING' },
    data: { approvalStatus: 'APPROVED' },
  });

  const approvedStaff = await loadStaffRelations(
    tenantId,
    pendingStaff.map((staff) => ({
      ...staff,
      approvalStatus: 'APPROVED',
    }))
  );

  return {
    approvedCount: approvedStaff.length,
    skippedCount: uniqueIds.length - approvedStaff.length,
    staff: approvedStaff,
  };
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

    const updated = await tx.user.findUnique({
      where: { id: staffId },
      select: staffUserBaseSelect,
    });

    if (!updated) {
      throw new Error('Karyawan tidak ditemukan.');
    }

    const [staffWithRelations] = await loadStaffRelations(tenantId, [updated], tx);
    return staffWithRelations ?? updated;
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
