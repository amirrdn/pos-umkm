/**
 * Diagnostic: tenant subscription + RLS visibility for checkout.
 * Usage: LIVE_ADMIN_DATABASE_URL=... LIVE_APP_DATABASE_URL=... npx ts-node scripts/check-live-checkout-db.ts
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
    Array<{
      id: string;
      name: string;
      status: string;
      subscription_tier: string;
      subscription_status: string;
      subscription_expires_at: Date | null;
      deleted_at: Date | null;
    }>
  >`
    SELECT id, name, status,
      "subscriptionTier" AS subscription_tier,
      "subscriptionStatus" AS subscription_status,
      "subscriptionExpiresAt" AS subscription_expires_at,
      "deletedAt" AS deleted_at
    FROM tenants
    WHERE "deletedAt" IS NULL
    ORDER BY name
  `;
  console.log('TENANTS', tenants);

  const tenantId = tenants[0]?.id;
  if (!tenantId) {
    console.log('No active tenant');
    await admin.$disconnect();
    return;
  }

  const [txCount] = await admin.$queryRaw<Array<{ monthly_tx: number }>>`
    SELECT COUNT(*)::int AS monthly_tx
    FROM transactions
    WHERE "tenantId" = ${tenantId}
      AND "createdAt" >= date_trunc('month', NOW())
  `;
  console.log('MONTHLY_TRANSACTIONS', { tenantId, ...txCount });

  await admin.$disconnect();

  const app = new PrismaClient({ datasourceUrl: APP_URL });
  const [asApp] = await app.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.current_tenant_id', ${tenantId}, true)`;
    const row = await tx.$queryRaw<
      Array<{
        visible: number;
        subscription_tier: string | null;
        subscription_status: string | null;
      }>
    >`
      SELECT COUNT(*)::int AS visible,
        MAX("subscriptionTier") AS subscription_tier,
        MAX("subscriptionStatus") AS subscription_status
      FROM tenants
      WHERE id = ${tenantId}::text AND "deletedAt" IS NULL
    `;
    return row;
  });
  console.log('APP_USER_TENANT_RLS', { tenantId, ...asApp });

  await app.$disconnect();
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
