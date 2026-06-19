-- P0.1: Repair outlet hierarchy (idempotent)
-- Aman dijalankan ulang pada deploy production.

-- 1. Promote outlet tertua → MAIN untuk tenant tanpa MAIN
UPDATE outlets o
SET
  type = 'MAIN',
  "parentOutletId" = NULL,
  "updatedAt" = NOW()
FROM (
  SELECT DISTINCT ON ("tenantId") id
  FROM outlets
  WHERE "deletedAt" IS NULL
    AND "tenantId" IN (
      SELECT "tenantId"
      FROM outlets
      WHERE "deletedAt" IS NULL
      GROUP BY "tenantId"
      HAVING COUNT(*) FILTER (WHERE type = 'MAIN') = 0
    )
  ORDER BY "tenantId", "createdAt" ASC
) oldest
WHERE o.id = oldest.id;

-- 2. Demote MAIN duplikat → BRANCH (pertahankan MAIN tertua)
UPDATE outlets o
SET
  type = 'BRANCH',
  "parentOutletId" = canonical.main_id,
  "updatedAt" = NOW()
FROM (
  SELECT DISTINCT ON ("tenantId") id AS main_id, "tenantId"
  FROM outlets
  WHERE type = 'MAIN' AND "deletedAt" IS NULL
  ORDER BY "tenantId", "createdAt" ASC
) canonical
WHERE o."tenantId" = canonical."tenantId"
  AND o.type = 'MAIN'
  AND o."deletedAt" IS NULL
  AND o.id <> canonical.main_id;

-- 3. MAIN tidak boleh punya parent
UPDATE outlets
SET "parentOutletId" = NULL, "updatedAt" = NOW()
WHERE type = 'MAIN'
  AND "parentOutletId" IS NOT NULL
  AND "deletedAt" IS NULL;

-- 4. Link semua BRANCH ke MAIN tenant yang sama
UPDATE outlets branch
SET "parentOutletId" = main.id, "updatedAt" = NOW()
FROM outlets main
WHERE branch."tenantId" = main."tenantId"
  AND main.type = 'MAIN'
  AND main."deletedAt" IS NULL
  AND branch.type = 'BRANCH'
  AND branch."deletedAt" IS NULL
  AND branch.id <> main.id
  AND branch."parentOutletId" IS DISTINCT FROM main.id;
