-- P0.4: backfill outletId transaksi legacy dari shift / MAIN outlet

-- Step 1: dari shift kasir
UPDATE "transactions" t
SET "outletId" = s."outletId"
FROM "shifts" s
WHERE t."shiftId" = s.id
  AND t."outletId" IS NULL
  AND s."outletId" IS NOT NULL;

-- Step 2: sisa tanpa shift → outlet MAIN tenant
UPDATE "transactions" t
SET "outletId" = o.id
FROM "outlets" o
WHERE t."outletId" IS NULL
  AND o."tenantId" = t."tenantId"
  AND o.type = 'MAIN'
  AND o."deletedAt" IS NULL;

-- Step 3: sinkronkan stock_ledgers terkait transaksi
UPDATE "stock_ledgers" sl
SET "outletId" = t."outletId"
FROM "transactions" t
WHERE sl."transactionId" = t.id
  AND sl."outletId" IS NULL
  AND t."outletId" IS NOT NULL;
