import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockCount, mockSendMail } = vi.hoisted(() => ({
  mockCount: vi.fn(),
  mockSendMail: vi.fn(),
}));

vi.mock('../../../lib/prisma', () => ({
  prisma: {
    stockTransfer: { count: (...args: unknown[]) => mockCount(...args) },
    user: { findMany: vi.fn() },
    tenant: { findMany: vi.fn() },
  },
}));

vi.mock('../../../lib/mail', () => ({
  sendMail: (...args: unknown[]) => mockSendMail(...args),
}));

import {
  getDraftTransferSnapshot,
  runDailyDraftTransferDigest,
  sendDraftTransferDigestForTenant,
} from '../../../domain/notification/draftTransfer.service';
import { prisma } from '../../../lib/prisma';

describe('draftTransfer.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getDraftTransferSnapshot returns count', async () => {
    mockCount.mockResolvedValue(2);

    const snapshot = await getDraftTransferSnapshot('tenant-1');

    expect(snapshot).toEqual({ count: 2, transferIds: [] });
  });

  it('sendDraftTransferDigestForTenant skips when no drafts', async () => {
    mockCount.mockResolvedValue(0);

    const result = await sendDraftTransferDigestForTenant('tenant-1', 'Toko A');

    expect(result).toEqual({ sent: false, recipientCount: 0, draftCount: 0 });
    expect(mockSendMail).not.toHaveBeenCalled();
  });

  it('sendDraftTransferDigestForTenant sends mail to Owner/Manager', async () => {
    mockCount.mockResolvedValue(1);
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
    mockCount.mockResolvedValue(0);

    const result = await runDailyDraftTransferDigest();

    expect(result).toEqual({ tenantsNotified: 0, totalDrafts: 0 });
  });
});
