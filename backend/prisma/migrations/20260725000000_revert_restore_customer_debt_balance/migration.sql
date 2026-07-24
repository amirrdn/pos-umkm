-- ============================================================
-- REVERT MIGRATION: Restore debtBalance column on customers
-- 
-- Kolom ini hilang karena `prisma db push --accept-data-loss`
-- dijalankan di production pada 2026-07-24. Kolom ini sebelumnya
-- dibuat oleh migration: 20260617050821_add_customer_debt
-- ============================================================

-- Tambahkan kembali kolom debtBalance dengan nilai default 0
-- sehingga tidak merusak data yang ada
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "debtBalance" DECIMAL(12,2) NOT NULL DEFAULT 0;
