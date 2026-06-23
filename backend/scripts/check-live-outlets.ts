import { PrismaClient } from '@prisma/client';

const ADMIN_URL = process.env.LIVE_ADMIN_DATABASE_URL;
const APP_URL = process.env.LIVE_APP_DATABASE_URL;
const TENANT_ID = process.env.TENANT_ID ?? 'tenant-uuid-xyz-123';

if (!ADMIN_URL || !APP_URL) {
  throw new Error('Set LIVE_ADMIN_DATABASE_URL and LIVE_APP_DATABASE_URL');
}

async function main() {
  const admin = new PrismaClient({ datasourceUrl: ADMIN_URL });
  const app = new PrismaClient({ datasourceUrl: APP_URL });

  const outlets = await admin.$queryRaw<
    Array<{ id: string; name: string; type: string; isActive: boolean; deleted: boolean }>
  >`
    SELECT id, name, type::text, "isActive", ("deletedAt" IS NOT NULL) AS deleted
    FROM outlets
    WHERE "tenantId" = ${TENANT_ID}
  `;
  console.log('OUTLETS', outlets);

  const products = await admin.$queryRaw<
    Array<{ id: string; name: string; sku: string; tenantId: string | null }>
  >`
    SELECT id, name, sku, "tenantId"
    FROM products
    WHERE id IN (
      'e281bbcf-74d5-451e-9276-2e8df31cf84f',
      '0532a4b5-1db6-4c19-81f1-a208f10d1231'
    )
  `;
  console.log('CHECKOUT_PRODUCTS', products);

  for (const outlet of outlets) {
    const rows = await app.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.current_tenant_id', ${TENANT_ID}, true)`;
      return tx.$queryRaw<Array<{ id: string }>>`
        SELECT id FROM outlets
        WHERE id = ${outlet.id}
          AND "tenantId" = ${TENANT_ID}
          AND "deletedAt" IS NULL
          AND "isActive" = true
      `;
    });
    console.log('APP_USER_MIDDLEWARE_LOOKUP', {
      outletId: outlet.id,
      name: outlet.name,
      found: rows.length > 0,
    });
  }

  await admin.$disconnect();
  await app.$disconnect();
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
