/**
 * Apply pivot RLS fix + platform admin tenant cleanup on live DB (admin URL only).
 * Usage: LIVE_ADMIN_DATABASE_URL=postgresql://postgres:... npx ts-node scripts/apply-live-pivot-rls-fix.ts
 */
import { PrismaClient } from '@prisma/client';

const ADMIN_URL = process.env.LIVE_ADMIN_DATABASE_URL;
if (!ADMIN_URL) {
  throw new Error('Set LIVE_ADMIN_DATABASE_URL');
}

async function main() {
  const admin = new PrismaClient({ datasourceUrl: ADMIN_URL });

  await admin.$executeRawUnsafe('ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY');
  await admin.$executeRawUnsafe('ALTER TABLE public.user_outlets DISABLE ROW LEVEL SECURITY');
  await admin.$executeRawUnsafe(
    'GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_roles TO app_user'
  );
  await admin.$executeRawUnsafe(
    'GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_outlets TO app_user'
  );

  const amir = await admin.$executeRaw`
    UPDATE users
    SET "tenantId" = NULL
    WHERE email = '4mir.rdn@gmail.com' AND "deletedAt" IS NULL
  `;

  console.log('Applied pivot RLS fix. Amir tenantId cleared:', amir);
  await admin.$disconnect();
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
