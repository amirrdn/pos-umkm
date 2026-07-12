import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mainOutletId, tenantId, transferId } from '../helpers/http';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    stockTransfer: { findMany: vi.fn() },
  },
}));

vi.mock('../../lib/prisma', () => ({ prisma: mockPrisma }));

import { listTransfers } from '../../services/transferService';

describe('listTransfers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.stockTransfer.findMany.mockResolvedValue([{ id: transferId, status: 'DRAFT' }]);
  });

  it('filters by status and outlet', async () => {
    const rows = await listTransfers(tenantId, {
      status: 'DRAFT',
      fromOutletId: mainOutletId,
    });

    expect(rows).toHaveLength(1);
    expect(mockPrisma.stockTransfer.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tenantId,
          status: 'DRAFT',
          fromOutletId: mainOutletId,
        }),
      })
    );
  });
});
