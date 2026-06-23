/**
 * One-off diagnostic: live DB staff/role linkage (scoped counts only).
 * Usage: LIVE_ADMIN_DATABASE_URL=... LIVE_APP_DATABASE_URL=... npx ts-node scripts/check-live-staff-db.ts
 */
import { PrismaClient } from '@prisma/client';

const ADMIN_URL = process.env.LIVE_ADMIN_DATABASE_URL;
const APP_URL = process.env.LIVE_APP_DATABASE_URL;

async function main() {
  if (!ADMIN_URL || !APP_URL) {
    throw new Error('Set LIVE_ADMIN_DATABASE_URL and LIVE_APP_DATABASE_URL');
  }

  const admin = new PrismaClient({ datasourceUrl: ADMIN_URL });
  const tenants = await admin.$queryRaw<
    Array<{ id: string; name: string; user_count: number }>
  >`
    SELECT t.id, t.name, COUNT(u.id)::int AS user_count
    FROM tenants t
    LEFT JOIN users u ON u."tenantId" = t.id AND u."deletedAt" IS NULL
    WHERE t."deletedAt" IS NULL
    GROUP BY t.id, t.name
    ORDER BY user_count DESC
    LIMIT 5
  `;
  console.log('TOP_TENANTS', tenants);

  const tenantId = tenants[0]?.id;
  if (!tenantId) {
    console.log('No tenant found');
    await admin.$disconnect();
    return;
  }

  const [counts] = await admin.$queryRaw<
    Array<{
      tenant_users: number;
      user_role_links: number;
      tenant_roles: number;
      platform_users: number;
    }>
  >`
    SELECT
      (SELECT COUNT(*)::int FROM users WHERE "tenantId" = ${tenantId} AND "deletedAt" IS NULL) AS tenant_users,
      (SELECT COUNT(*)::int FROM user_roles ur JOIN users u ON u.id = ur."userId" WHERE u."tenantId" = ${tenantId} AND u."deletedAt" IS NULL) AS user_role_links,
      (SELECT COUNT(*)::int FROM roles WHERE "tenantId" = ${tenantId}) AS tenant_roles,
      (SELECT COUNT(*)::int FROM users WHERE "tenantId" IS NULL AND "deletedAt" IS NULL) AS platform_users
  `;
  console.log('COUNTS_FOR_PRIMARY_TENANT', { tenantId, ...counts });

  const [orphan] = await admin.$queryRaw<Array<{ users_without_tenant_role: number }>>`
    SELECT COUNT(*)::int AS users_without_tenant_role
    FROM users u
    WHERE u."tenantId" = ${tenantId} AND u."deletedAt" IS NULL
      AND NOT EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON r.id = ur."roleId"
        WHERE ur."userId" = u.id AND r."tenantId" = ${tenantId}
      )
  `;
  console.log('ORPHAN_USERS_NO_TENANT_ROLE', orphan);

  const amir = await admin.$queryRaw<
    Array<{ id: string; tenantId: string | null; platform_role_count: number }>
  >`
    SELECT u.id, u."tenantId",
      (SELECT COUNT(*)::int FROM user_roles ur
       JOIN roles r ON r.id = ur."roleId"
       WHERE ur."userId" = u.id AND r."tenantId" IS NULL) AS platform_role_count
    FROM users u
    WHERE u.email = '4mir.rdn@gmail.com' AND u."deletedAt" IS NULL
  `;
  console.log('AMIR_ADMIN', amir[0] ?? null);

  const roleSample = await admin.$queryRaw<
    Array<{ role_name: string; user_email_mask: string; role_tenant_id: string | null }>
  >`
    SELECT r.name AS role_name,
      CONCAT(LEFT(u.email, 3), '***') AS user_email_mask,
      r."tenantId" AS role_tenant_id
    FROM user_roles ur
    JOIN users u ON u.id = ur."userId"
    JOIN roles r ON r.id = ur."roleId"
    WHERE u."tenantId" = ${tenantId} AND u."deletedAt" IS NULL
    ORDER BY r."tenantId" NULLS LAST, r.name
    LIMIT 15
  `;
  console.log('ROLE_ASSIGNMENTS_SAMPLE', roleSample);

  await admin.$disconnect();

  const app = new PrismaClient({ datasourceUrl: APP_URL });
  const [rlsRoles, rlsUsers, rlsUr, rlsOutlets] = await app.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.current_tenant_id', ${tenantId}, true)`;
    const roles = await tx.$queryRaw<Array<{ visible_roles: number }>>`
      SELECT COUNT(*)::int AS visible_roles FROM roles WHERE "tenantId" = ${tenantId}
    `;
    const users = await tx.$queryRaw<Array<{ visible_users: number }>>`
      SELECT COUNT(*)::int AS visible_users FROM users WHERE "tenantId" = ${tenantId} AND "deletedAt" IS NULL
    `;
    const userRoles = await tx.$queryRaw<Array<{ visible_user_roles: number }>>`
      SELECT COUNT(*)::int AS visible_user_roles
      FROM user_roles ur JOIN users u ON u.id = ur."userId"
      WHERE u."tenantId" = ${tenantId} AND u."deletedAt" IS NULL
    `;
    const outlets = await tx.$queryRaw<Array<{ visible_outlets: number }>>`
      SELECT COUNT(*)::int AS visible_outlets FROM outlets WHERE "tenantId" = ${tenantId} AND "deletedAt" IS NULL
    `;
    return [roles[0], users[0], userRoles[0], outlets[0]];
  });

  await app.$disconnect();

  console.log('APP_USER_WITH_RLS', {
    tenantId,
    roles: rlsRoles,
    users: rlsUsers,
    user_roles: rlsUr,
    outlets: rlsOutlets,
  });
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
