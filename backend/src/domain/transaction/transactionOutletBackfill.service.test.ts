import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  applyTransactionOutletBackfill,
  auditTransactionOutletBackfill,
  resolveTransactionOutletId,
} from './transactionOutletBackfill.service';

const { mockFindMany, mockPrisma } = vi.hoisted(() => ({
  mockFindMany: vi.fn(),
  mockPrisma: {
    transaction: { findMany: (...args: unknown[]) => mockFindMany(...args) },
    outlet: { findMany: vi.fn().mockResolvedValue([]) },
    userOutlet: { findMany: vi.fn().mockResolvedValue([]) },
    $transaction: vi.fn(),
  },
}));

vi.mock('../../lib/prisma', () => ({ prisma: mockPrisma }));

describe('resolveTransactionOutletId', () => {
  it('prefers shift outlet over user assignment and MAIN', () => {
    expect(
      resolveTransactionOutletId({
        shiftOutletId: 'shift-outlet',
        userOutletIds: ['user-outlet'],
        mainOutletId: 'main-outlet',
      })
    ).toEqual({ outletId: 'shift-outlet', source: 'shift' });
  });

  it('falls back to first user outlet when shift has no outlet', () => {
    expect(
      resolveTransactionOutletId({
        shiftOutletId: null,
        userOutletIds: ['branch-a', 'branch-b'],
        mainOutletId: 'main-outlet',
      })
    ).toEqual({ outletId: 'branch-a', source: 'user_outlet' });
  });

  it('falls back to tenant MAIN when shift and user outlet missing', () => {
    expect(
      resolveTransactionOutletId({
        shiftOutletId: null,
        userOutletIds: [],
        mainOutletId: 'main-outlet',
      })
    ).toEqual({ outletId: 'main-outlet', source: 'main_outlet' });
  });

  it('returns unresolved when no outlet can be determined', () => {
    expect(
      resolveTransactionOutletId({
        shiftOutletId: null,
        userOutletIds: [],
        mainOutletId: null,
      })
    ).toEqual({ outletId: null, source: 'unresolved' });
  });
});

describe('applyTransactionOutletBackfill', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFindMany.mockResolvedValue([]);
    mockPrisma.outlet.findMany.mockResolvedValue([]);
    mockPrisma.userOutlet.findMany.mockResolvedValue([]);
  });

  it('dryRun makes no updates', async () => {
    const result = await applyTransactionOutletBackfill(true);
    expect(result.updatedTransactions).toBe(0);
    expect(result.dryRun).toBe(true);
  });

  it('audit returns empty when no legacy transactions', async () => {
    const report = await auditTransactionOutletBackfill();
    expect(report.stats.totalNullOutlet).toBe(0);
  });
});
