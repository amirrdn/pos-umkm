import { describe, expect, it } from 'vitest';
import { detectIssues } from '../../../domain/outlet/outlet.repository';
import type { ActiveOutletRow } from '../../../domain/outlet/outlet.repository';

function outlet(partial: Partial<ActiveOutletRow> & Pick<ActiveOutletRow, 'id' | 'tenantId' | 'type'>): ActiveOutletRow {
  return {
    name: partial.name ?? 'Outlet',
    parentOutletId: partial.parentOutletId ?? null,
    createdAt: partial.createdAt ?? new Date('2026-01-01'),
    ...partial,
  };
}

describe('detectIssues — one MAIN per tenant (INV-1)', () => {
  it('flags MULTIPLE_MAIN when tenant has more than one MAIN outlet', () => {
    const issues = detectIssues([
      outlet({
        id: 'main-1',
        tenantId: 'tenant-a',
        type: 'MAIN',
        name: 'Pusat Lama',
        createdAt: new Date('2026-01-01'),
      }),
      outlet({
        id: 'main-2',
        tenantId: 'tenant-a',
        type: 'MAIN',
        name: 'Pusat Duplikat',
        createdAt: new Date('2026-06-01'),
      }),
    ]);

    expect(issues.some((i) => i.code === 'MULTIPLE_MAIN')).toBe(true);
    expect(issues.filter((i) => i.code === 'MULTIPLE_MAIN')).toHaveLength(1);
  });

  it('flags TENANT_WITHOUT_MAIN when active outlets exist but none is MAIN', () => {
    const issues = detectIssues([
      outlet({
        id: 'branch-1',
        tenantId: 'tenant-b',
        type: 'BRANCH',
        parentOutletId: null,
      }),
    ]);

    expect(issues.some((i) => i.code === 'TENANT_WITHOUT_MAIN')).toBe(true);
  });
});
