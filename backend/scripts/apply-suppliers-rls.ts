import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const directUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!directUrl) {
  console.error('Error: DIRECT_URL atau DATABASE_URL tidak ditemukan.');
  process.exit(1);
}

const adminPrisma = new PrismaClient({
  datasourceUrl: directUrl,
});

async function applyRLS() {
  console.log('Mengaplikasikan RLS policy pada tabel suppliers, purchase_orders, dan sales_returns...');

  const query = `
    DO $$
    DECLARE
      tbl TEXT;
    BEGIN
      FOREACH tbl IN ARRAY ARRAY[
        'suppliers',
        'purchase_orders',
        'sales_returns'
      ]
      LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
        EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', tbl);
        EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE %I TO app_user', tbl);
        EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_policy ON %I', tbl);
        EXECUTE format(
          'CREATE POLICY tenant_isolation_policy ON %I AS PERMISSIVE FOR ALL USING (
            "tenantId" = NULLIF((select current_setting(''app.current_tenant_id'', true)), '''')
          ) WITH CHECK (
            "tenantId" = NULLIF((select current_setting(''app.current_tenant_id'', true)), '''')
          )',
          tbl
        );
      END LOOP;
    END $$;
  `;

  try {
    await adminPrisma.$executeRawUnsafe(query);
    console.log('BERHASIL: RLS tenant_isolation_policy diterapkan pada suppliers, purchase_orders, dan sales_returns.');
  } catch (error) {
    console.error('GAGAL mengaplikasikan RLS:', error);
  } finally {
    await adminPrisma.$disconnect();
  }
}

applyRLS();
