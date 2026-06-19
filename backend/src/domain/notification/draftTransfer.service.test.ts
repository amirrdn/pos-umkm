import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockFindMany, mockSendMail } = vi.hoisted(() => ({
  mockFindMany: vi.fn(),
  mockSendMail: vi.fn(),
}));

vi.mock('../../lib/prisma', () => ({
  prisma: {
    stockTransfer: { findMany: (...args: unknown[]) => mockFindMany(...args) },
    user: { findMany: vi.fn() },
    tenant: { findMany: vi.fn() },
  },
}));

vi.mock('../../lib/mail', () => ({
  sendMail: (...args: unknown[]) => mockSendMail(...args),
}));

import {
  getDraftTransferSnapshot,
  runDailyDraftTransferDigest,
  sendDraftTransferDigestForTenant,
} from './draftTransfer.service';
import { prisma } from '../../lib/prisma';

describe('draftTransfer.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getDraftTransferSnapshot returns count and ids', async () => {
    mockFindMany.mockResolvedValue([{ id: 't1' }, { id: 't2' }]);

    const snapshot = await getDraftTransferSnapshot('tenant-1');

    expect(snapshot).toEqual({ count: 2, transferIds: ['t1', 't2'] });
  });

  it('sendDraftTransferDigestForTenant skips when no drafts', async () => {
    mockFindMany.mockResolvedValue([]);

    const result = await sendDraftTransferDigestForTenant('tenant-1', 'Toko A');

    expect(result).toEqual({ sent: false, recipientCount: 0, draftCount: 0 });
    expect(mockSendMail).not.toHaveBeenCalled();
  });

  it('sendDraftTransferDigestForTenant sends mail to Owner/Manager', async () => {
    mockFindMany.mockResolvedValue([{ id: 't1' }]);
    vi.mocked(prisma.user.findMany).mockResolvedValue([
      { email: 'owner@test.com', name: 'Owner' },
    ] as never);
    mockSendMail.mockResolvedValue(true);

    const result = await sendDraftTransferDigestForTenant('tenant-1', 'Toko A');

    expect(result.sent).toBe(true);
    expect(result.recipientCount).toBe(1);
    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: ['owner@test.com'],
        subject: expect.stringContaining('1 transfer'),
      })
    );
  });

  it('runDailyDraftTransferDigest aggregates tenant results', async () => {
    vi.mocked(prisma.tenant.findMany).mockResolvedValue([
      { id: 't1', name: 'Toko 1' },
    ] as never);
    mockFindMany.mockResolvedValue([]);

    const result = await runDailyDraftTransferDigest();

    expect(result).toEqual({ tenantsNotified: 0, totalDrafts: 0 });
  });
});
