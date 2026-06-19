-- P0.3: Backup legacy Product.stock lalu hapus kolom (single source: OutletStock)

CREATE TABLE IF NOT EXISTS products_stock_backup_p03 AS
SELECT
  p.id,
  p."tenantId",
  p.stock AS legacy_stock,
  COALESCE(SUM(os.stock), 0)::INTEGER AS computed_stock
FROM products p
LEFT JOIN outlet_stocks os ON os."productId" = p.id
GROUP BY p.id, p."tenantId", p.stock;

ALTER TABLE "products" DROP COLUMN "stock";
