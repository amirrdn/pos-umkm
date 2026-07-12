import 'dotenv/config';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Prisma, PrismaClient } from '@prisma/client';

const TENANT_SCOPED_TABLES = [
  'users',
  'roles',
  'categories',
  'products',
  'transactions',
  'shifts',
  'stock_ledgers',
  'customers',
  'stock_requests',
  'outlets',
  'outlet_stocks',
  'stock_transfers',
  'outlet_product_prices',
  'subscription_invoices',
  'subscription_histories',
] as const;

const databaseUrl = process.env.DATABASE_URL;
const rlsTestRole = process.env.RLS_TEST_ROLE;
const describeWithDatabase = databaseUrl ? describe : describe.skip;

describeWithDatabase('PostgreSQL Row-Level Security', () => {
  const prisma = new PrismaClient();

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('enables forced row level security on all tenant-scoped tables', async () => {
    const rows = await prisma.$queryRaw<
      Array<{ table_name: string; rowsecurity: boolean; forcerowsecurity: boolean }>
    >`
      SELECT
        c.relname AS table_name,
        c.relrowsecurity AS rowsecurity,
        c.relforcerowsecurity AS forcerowsecurity
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
        AND c.relname IN (${Prisma.join(TENANT_SCOPED_TABLES)})
    `;

    expect(rows).toHaveLength(TENANT_SCOPED_TABLES.length);

    for (const tableName of TENANT_SCOPED_TABLES) {
      const tablePolicy = rows.find((row) => row.table_name === tableName);
      expect(tablePolicy?.rowsecurity).toBe(true);
      expect(tablePolicy?.forcerowsecurity).toBe(true);
    }
  });

  it('creates tenant_isolation_policy on all tenant-scoped tables', async () => {
    const policies = await prisma.$queryRaw<Array<{ tablename: string; policyname: string }>>`
      SELECT tablename, policyname
      FROM pg_policies
      WHERE schemaname = 'public'
        AND policyname = 'tenant_isolation_policy'
        AND tablename IN (${Prisma.join(TENANT_SCOPED_TABLES)})
    `;

    expect(policies).toHaveLength(TENANT_SCOPED_TABLES.length);
  });

  it('binds app.current_tenant_id inside tenant RLS transactions', async () => {
    const { prisma: extendedPrisma } = await import('../../lib/prisma');

    const tenantId = crypto.randomUUID();
    const observedTenantId = await extendedPrisma.$executeRawWithTenant(tenantId, async (tx) => {
      const result = await tx.$queryRaw<Array<{ tenant_id: string | null }>>`
        SELECT current_setting('app.current_tenant_id', true) AS tenant_id
      `;
      return result[0]?.tenant_id ?? null;
    });

    expect(observedTenantId).toBe(tenantId);
  });

  it.skipIf(!rlsTestRole)(
    'scopes product reads to the active tenant session when RLS_TEST_ROLE is configured',
    async () => {
      const tenantAId = crypto.randomUUID();
      const tenantBId = crypto.randomUUID();
      const categoryAId = crypto.randomUUID();
      const categoryBId = crypto.randomUUID();
      const productAId = crypto.randomUUID();
      const productBId = crypto.randomUUID();

      await prisma.$executeRaw`
        INSERT INTO tenants (id, name, slug, email, phone, status, "createdAt", "updatedAt")
        VALUES
          (${tenantAId}::uuid, 'RLS Tenant A', ${`rls-a-${tenantAId.slice(0, 8)}`}, 'rls-a@example.com', '0800000001', 'ACTIVE', NOW(), NOW()),
          (${tenantBId}::uuid, 'RLS Tenant B', ${`rls-b-${tenantBId.slice(0, 8)}`}, 'rls-b@example.com', '0800000002', 'ACTIVE', NOW(), NOW())
      `;

      await prisma.$executeRaw`
        INSERT INTO categories (id, "tenantId", name, slug, prefix)
        VALUES
          (${categoryAId}::uuid, ${tenantAId}::uuid, 'Category A', 'category-a', 'CAT'),
          (${categoryBId}::uuid, ${tenantBId}::uuid, 'Category B', 'category-b', 'CAT')
      `;

      await prisma.$executeRaw`
        INSERT INTO products (id, "tenantId", "categoryId", name, sku, "purchasePrice", "sellingPrice", "createdAt", "updatedAt")
        VALUES
          (${productAId}::uuid, ${tenantAId}::uuid, ${categoryAId}::uuid, 'Product A', ${`SKU-A-${productAId.slice(0, 8)}`}, 1000, 1500, NOW(), NOW()),
          (${productBId}::uuid, ${tenantBId}::uuid, ${categoryBId}::uuid, 'Product B', ${`SKU-B-${productBId.slice(0, 8)}`}, 2000, 2500, NOW(), NOW())
      `;

      const visibleProductIds = await prisma.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT set_config('app.current_tenant_id', ${tenantAId}, true)`;
        await tx.$executeRawUnsafe(`SET LOCAL ROLE ${rlsTestRole}`);
        const rows = await tx.$queryRaw<Array<{ id: string }>>`
          SELECT id FROM products ORDER BY name ASC
        `;
        await tx.$executeRaw`RESET ROLE`;
        return rows.map((row) => row.id);
      });

      expect(visibleProductIds).toEqual([productAId]);
      expect(visibleProductIds).not.toContain(productBId);

      await prisma.$executeRaw`DELETE FROM products WHERE id IN (${productAId}::uuid, ${productBId}::uuid)`;
      await prisma.$executeRaw`DELETE FROM categories WHERE id IN (${categoryAId}::uuid, ${categoryBId}::uuid)`;
      await prisma.$executeRaw`DELETE FROM tenants WHERE id IN (${tenantAId}::uuid, ${tenantBId}::uuid)`;
    }
  );
});
