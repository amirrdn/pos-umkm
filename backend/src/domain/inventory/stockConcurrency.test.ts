import { describe, expect, it, vi, beforeEach } from 'vitest';
import { decrementOutletStock, incrementOutletStock } from './stock.repository';

const { mockPrisma } = vi.hoisted(() => {
  const tx = {
    outletStock: {
      findUnique: vi.fn(),
      updateMany: vi.fn(),
      upsert: vi.fn(),
    }
  };
  return {
    mockPrisma: tx
  };
});

vi.mock('../../lib/prisma', () => ({
  prisma: mockPrisma
}));

describe('stockConcurrency - stock repository helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('decrementOutletStock calls updateMany with decrement data when stock is sufficient', async () => {
    mockPrisma.outletStock.updateMany.mockResolvedValue({ count: 1 });
    mockPrisma.outletStock.findUnique.mockResolvedValue({ stock: 5 });

    const result = await decrementOutletStock(
      mockPrisma as any,
      'tenant-1',
      'outlet-1',
      'product-1',
      3
    );

    expect(mockPrisma.outletStock.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          outletId: 'outlet-1',
          productId: 'product-1',
          stock: { gte: 3 }
        },
        data: {
          stock: { decrement: 3 }
        }
      })
    );
    expect(result.stockAfter).toBe(5);
    expect(result.stockBefore).toBe(8);
  });

  it('decrementOutletStock throws when stock is insufficient', async () => {
    mockPrisma.outletStock.updateMany.mockResolvedValue({ count: 0 });
    mockPrisma.outletStock.findUnique.mockResolvedValue({ stock: 1 });

    await expect(
      decrementOutletStock(
        mockPrisma as any,
        'tenant-1',
        'outlet-1',
        'product-1',
        3
      )
    ).rejects.toThrow('Stok tidak mencukupi. Tersedia: 1, diminta: 3.');
  });

  it('incrementOutletStock calls upsert with increment data', async () => {
    mockPrisma.outletStock.upsert.mockResolvedValue({ stock: 8 });

    const result = await incrementOutletStock(
      mockPrisma as any,
      'tenant-1',
      'outlet-1',
      'product-1',
      3
    );

    expect(mockPrisma.outletStock.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          outletId_productId: { outletId: 'outlet-1', productId: 'product-1' }
        },
        create: {
          tenantId: 'tenant-1',
          outletId: 'outlet-1',
          productId: 'product-1',
          stock: 3
        },
        update: {
          stock: { increment: 3 }
        }
      })
    );
    expect(result.stockAfter).toBe(8);
    expect(result.stockBefore).toBe(5);
  });
});
