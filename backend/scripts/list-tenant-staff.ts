import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const TENANT_ID = process.argv[2] ?? 'tenant-uuid-xyz-123';
const admin = new PrismaClient({
  datasourceUrl: process.env.LIVE_ADMIN_DATABASE_URL ?? process.env.DIRECT_URL,
});

async function main() {
  const users = await admin.$queryRaw<
    Array<{ id: string; name: string; email: string; approval_status: string }>
  >`
    SELECT id, name, email, "approvalStatus" AS approval_status
    FROM users
    WHERE "tenantId" = ${TENANT_ID} AND "deletedAt" IS NULL
    ORDER BY name
  `;
  console.log('TENANT_STAFF', { tenantId: TENANT_ID, count: users.length, users });
  await admin.$disconnect();
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
