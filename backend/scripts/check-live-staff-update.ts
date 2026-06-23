/**
 * Diagnostic: staff update lookup for a specific user id.
 * Usage: npx ts-node scripts/check-live-staff-update.ts [staffId] [tenantId]
 */
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const STAFF_ID = process.argv[2] ?? '3e602a5b-96ad-4c24-9433-ca5198dc0e89';
const TENANT_ID = process.argv[3] ?? 'tenant-uuid-xyz-123';

const ADMIN_URL = process.env.LIVE_ADMIN_DATABASE_URL ?? process.env.DIRECT_URL;
const APP_URL = process.env.LIVE_APP_DATABASE_URL ?? process.env.DATABASE_URL;

async function main() {
  if (!ADMIN_URL || !APP_URL) {
    throw new Error('Set DIRECT_URL/DATABASE_URL or LIVE_* URLs');
  }

  const admin = new PrismaClient({ datasourceUrl: ADMIN_URL });

  const [user] = await admin.$queryRaw<
    Array<{
      id: string;
      name: string;
      email: string;
      tenant_id: string | null;
      deleted_at: Date | null;
      approval_status: string;
      is_active: boolean;
    }>
  >`
    SELECT id, name, email, "tenantId" AS tenant_id, "deletedAt" AS deleted_at,
      "approvalStatus" AS approval_status, "isActive" AS is_active
    FROM users WHERE id = ${STAFF_ID}
  `;
  console.log('ADMIN_USER_ROW', user ?? null);

  const roles = await admin.$queryRaw<
    Array<{ role_id: string; role_name: string; role_tenant_id: string | null }>
  >`
    SELECT r.id AS role_id, r.name AS role_name, r."tenantId" AS role_tenant_id
    FROM user_roles ur
    JOIN roles r ON r.id = ur."roleId"
    WHERE ur."userId" = ${STAFF_ID}
  `;
  console.log('ADMIN_USER_ROLES', roles);

  const outlets = await admin.$queryRaw<
    Array<{ outlet_id: string; outlet_name: string; outlet_tenant_id: string }>
  >`
    SELECT o.id AS outlet_id, o.name AS outlet_name, o."tenantId" AS outlet_tenant_id
    FROM user_outlets uo
    JOIN outlets o ON o.id = uo."outletId"
    WHERE uo."userId" = ${STAFF_ID}
  `;
  console.log('ADMIN_USER_OUTLETS', outlets);

  const [roleCheck] = await admin.$queryRaw<Array<{ found: number }>>`
    SELECT COUNT(*)::int AS found FROM roles
    WHERE id = 'role-kasir-uuid-555' AND "tenantId" = ${TENANT_ID}
  `;
  console.log('ROLE_KASIR_FOR_TENANT', roleCheck);

  const [outletCheck] = await admin.$queryRaw<Array<{ found: number }>>`
    SELECT COUNT(*)::int AS found FROM outlets
    WHERE id = 'outlet-default-uuid-111' AND "tenantId" = ${TENANT_ID} AND "deletedAt" IS NULL
  `;
  console.log('OUTLET_DEFAULT_FOR_TENANT', outletCheck);

  const [byName] = await admin.$queryRaw<
    Array<{ id: string; name: string; email: string; tenant_id: string | null }>
  >`
    SELECT id, name, email, "tenantId" AS tenant_id
    FROM users
    WHERE name ILIKE '%Kasir Toko%' AND "deletedAt" IS NULL
    LIMIT 5
  `;
  console.log('ADMIN_USERS_NAMED_KASIR_TOKO', byName ?? null);

  await admin.$disconnect();

  const app = new PrismaClient({ datasourceUrl: APP_URL });
  const [asApp] = await app.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.current_tenant_id', ${TENANT_ID}, true)`;
    const row = await tx.$queryRaw<
      Array<{ visible: number; name: string | null }>
    >`
      SELECT COUNT(*)::int AS visible, MAX(name) AS name
      FROM users
      WHERE id = ${STAFF_ID} AND "tenantId" = ${TENANT_ID} AND "deletedAt" IS NULL
    `;
    return row;
  });
  console.log('APP_USER_FIND_FIRST_SIMULATION', { tenantId: TENANT_ID, staffId: STAFF_ID, ...asApp });

  await app.$disconnect();
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
