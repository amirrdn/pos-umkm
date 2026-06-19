-- CreateEnum
CREATE TYPE "OutletType" AS ENUM ('MAIN', 'BRANCH');

-- AlterTable
ALTER TABLE "outlets" ADD COLUMN     "code" TEXT,
ADD COLUMN     "parentOutletId" TEXT,
ADD COLUMN     "type" "OutletType" NOT NULL DEFAULT 'BRANCH';

-- Step 1: Promote the oldest active outlet to 'MAIN' for each tenant
UPDATE "outlets"
SET "type" = 'MAIN'
WHERE "id" IN (
  SELECT DISTINCT ON ("tenantId") "id"
  FROM "outlets"
  WHERE "deletedAt" IS NULL
  ORDER BY "tenantId", "createdAt" ASC
);

-- Step 2: Set the parentOutletId of all BRANCH outlets to the MAIN outlet of the same tenant
UPDATE "outlets"
SET "parentOutletId" = m."id"
FROM "outlets" m
WHERE "outlets"."tenantId" = m."tenantId"
  AND m."type" = 'MAIN'
  AND "outlets"."type" = 'BRANCH'
  AND "outlets"."id" <> m."id";

-- CreateIndex
CREATE INDEX "outlets_tenantId_type_idx" ON "outlets"("tenantId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "outlets_tenantId_code_key" ON "outlets"("tenantId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "outlets_one_main_per_tenant" ON "outlets"("tenantId") WHERE "type" = 'MAIN' AND "deletedAt" IS NULL;

-- AddForeignKey
ALTER TABLE "outlets" ADD CONSTRAINT "outlets_parentOutletId_fkey" FOREIGN KEY ("parentOutletId") REFERENCES "outlets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
