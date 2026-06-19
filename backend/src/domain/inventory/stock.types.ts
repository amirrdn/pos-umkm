/** View stok produk — selalu computed dari OutletStock, bukan kolom DB. */
export interface ProductStockView {
  id: string;
  name: string;
  sku: string;
  stock: number;
}

export interface StockLevelChange {
  stockBefore: number;
  stockAfter: number;
}

export interface SeedOutletStockInput {
  tenantId: string;
  productId: string;
  mainStock: number;
}

/** Produk di bawah ambang minStock per outlet (minStock > 0). */
export interface LowStockItem {
  productId: string;
  productName: string;
  sku: string;
  outletId: string;
  outletName: string;
  stock: number;
  minStock: number;
}
