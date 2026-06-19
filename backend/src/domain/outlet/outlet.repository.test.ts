import { describe, expect, it } from 'vitest';
import { attachOutletStats, buildSummary, detectIssues } from './outlet.repository';
import type { ActiveOutletRow } from './outlet.repository';

function row(partial: Partial<ActiveOutletRow> & Pick<ActiveOutletRow, 'id' | 'tenantId' | 'type'>): ActiveOutletRow {
  return {
    name: partial.name ?? 'Outlet',
    parentOutletId: partial.parentOutletId ?? null,
    createdAt: partial.createdAt ?? new Date('2026-01-01'),
    ...partial,
  };
}

describe('outlet.repository pure helpers', () => {
  it('buildSummary counts issue codes', () => {
    const summary = buildSummary([
      { code: 'MULTIPLE_MAIN', tenantId: 't1', detail: '' },
      { code: 'MULTIPLE_MAIN', tenantId: 't1', detail: '' },
      { code: 'ORPHAN_BRANCH', tenantId: 't1', detail: '' },
    ] as never);
    expect(summary.MULTIPLE_MAIN).toBe(2);
    expect(summary.ORPHAN_BRANCH).toBe(1);
  });

  it('attachOutletStats merges staff and stock counts', () => {
    const outlets = [{ id: 'o1' }, { id: 'o2' }];
    const staff = new Map([['o1', 3]]);
    const stock = new Map([['o2', 12]]);

    const result = attachOutletStats(outlets, staff, stock);

    expect(result[0]).toMatchObject({ id: 'o1', activeStaff: 3, totalStockSKUs: 0 });
    expect(result[1]).toMatchObject({ id: 'o2', activeStaff: 0, totalStockSKUs: 12 });
  });

  it('detectIssues flags ORPHAN_BRANCH without parent', () => {
    const issues = detectIssues([
      row({ id: 'b1', tenantId: 't1', type: 'BRANCH', parentOutletId: null }),
      row({ id: 'm1', tenantId: 't1', type: 'MAIN', parentOutletId: null }),
    ]);
    expect(issues.some((i) => i.code === 'ORPHAN_BRANCH')).toBe(true);
  });
});
