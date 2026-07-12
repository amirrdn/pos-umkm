import { describe, expect, it } from 'vitest';
import { resolveStockFromRows } from '../../../domain/inventory/stock.repository';
import { mapProductsWithComputedStock } from '../../../domain/inventory/stock.mapper';

describe('stock computed helpers', () => {
  const rows = [
    { outletId: 'main', stock: 25, minStock: 5 },
    { outletId: 'branch', stock: 10, minStock: 2 },
  ];

  it('resolveStockFromRows scopes to outlet', () => {
    expect(resolveStockFromRows(rows, 'branch')).toBe(10);
    expect(resolveStockFromRows(rows, 'missing')).toBe(0);
  });

  it('resolveStockFromRows sums all outlets when no scope', () => {
    expect(resolveStockFromRows(rows)).toBe(35);
  });

  it('mapProductsWithComputedStock attaches stock and minStock', () => {
    const products = [{ id: 'p1', name: 'Kopi', outletStocks: rows }];
    const mapped = mapProductsWithComputedStock(products, 'main');
    expect(mapped[0].stock).toBe(25);
    expect(mapped[0].minStock).toBe(5);
  });
});
