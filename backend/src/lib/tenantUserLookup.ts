import { prisma } from './prisma';

export type TenantUserSummary = {
  id: string;
  name: string;
  email: string;
};

const UNAVAILABLE_USER: TenantUserSummary = {
  id: '',
  name: 'Staf tidak tersedia',
  email: '',
};

/** Muat user tenant secara terpisah — hindari join user yang RLS bisa sembunyikan. */
export async function loadTenantUsersByIds(
  tenantId: string,
  userIds: string[]
): Promise<Map<string, TenantUserSummary>> {
  const uniqueIds = [...new Set(userIds.filter(Boolean))];
  if (uniqueIds.length === 0) {
    return new Map();
  }

  const users = await prisma.user.findMany({
    where: { id: { in: uniqueIds }, tenantId, deletedAt: null },
    select: { id: true, name: true, email: true },
  });

  return new Map(users.map((user) => [user.id, user]));
}

export function resolveTenantUser(
  userMap: Map<string, TenantUserSummary>,
  userId: string
): TenantUserSummary {
  return userMap.get(userId) ?? { ...UNAVAILABLE_USER, id: userId };
}
