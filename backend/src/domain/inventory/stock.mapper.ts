import { resolveStockFromRows } from './stock.repository';

type ProductWithOutletStocks = {
  outletStocks: { outletId: string; stock: number; minStock?: number }[];
  [key: string]: unknown;
};

/** Lampirkan field `stock` (computed) ke daftar produk dari relasi outletStocks. */
export function mapProductsWithComputedStock<T extends ProductWithOutletStocks>(
  products: T[],
  outletId?: string | null
): Array<T & { stock: number; minStock?: number }> {
  return products.map((product) => {
    const stock = resolveStockFromRows(product.outletStocks, outletId);
    const minStock = outletId
      ? (product.outletStocks.find((os) => os.outletId === outletId)?.minStock ?? 0)
      : undefined;

    return {
      ...product,
      stock,
      ...(minStock !== undefined ? { minStock } : {}),
    };
  });
}
