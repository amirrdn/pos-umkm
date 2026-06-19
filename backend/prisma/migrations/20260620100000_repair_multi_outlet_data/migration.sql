-- Repair data after multi-outlet user migration

-- Bug 2: Existing users were defaulted to PENDING and could not log in
UPDATE "users"
SET "approvalStatus" = 'APPROVED'
WHERE "approvalStatus" = 'PENDING'
  AND "deletedAt" IS NULL;

-- Bug 8: users.outletId was dropped without copying assignments to user_outlets
INSERT INTO "user_outlets" ("id", "userId", "outletId")
SELECT gen_random_uuid()::text, u."id", o."id"
FROM "users" u
INNER JOIN "outlets" o
  ON o."tenantId" = u."tenantId"
  AND o."type" = 'MAIN'
  AND o."deletedAt" IS NULL
WHERE u."deletedAt" IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM "user_outlets" uo WHERE uo."userId" = u."id"
  );

-- Bug 10: Ensure at least one MAIN outlet per tenant (seed / legacy rows)
UPDATE "outlets" o
SET "type" = 'MAIN'
WHERE o."deletedAt" IS NULL
  AND o."type" IS DISTINCT FROM 'MAIN'
  AND NOT EXISTS (
    SELECT 1
    FROM "outlets" m
    WHERE m."tenantId" = o."tenantId"
      AND m."type" = 'MAIN'
      AND m."deletedAt" IS NULL
      AND m."id" <> o."id"
  );

-- Align schema default with application: new users default APPROVED; staff register sets PENDING explicitly
ALTER TABLE "users" ALTER COLUMN "approvalStatus" SET DEFAULT 'APPROVED';
