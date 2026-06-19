-- P2.4: soft-disable cabang + timestamp penyelesaian transfer
ALTER TABLE "outlets" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "stock_transfers" ADD COLUMN "completedAt" TIMESTAMP(3);
