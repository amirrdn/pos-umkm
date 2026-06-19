import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../lib/prisma', () => ({
  prisma: {
    user: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('../../lib/mail', () => ({
  sendMail: vi.fn().mockResolvedValue(true),
}));

import { prisma } from '../../lib/prisma';
import { sendMail } from '../../lib/mail';
import {
  verifyEmailToken,
  handleDuplicateRegistrationEmail,
  deliverRegistrationVerificationEmail,
  RegistrationEmailError,
} from './emailVerification.service';

describe('emailVerification.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('verifyEmailToken activates unverified user', async () => {
    vi.mocked(prisma.user.findFirst).mockResolvedValue({
      id: 'u1',
      email: 'test@mail.com',
      name: 'Test',
      emailVerifiedAt: null,
      emailVerificationExpiresAt: new Date(Date.now() + 60_000),
    } as any);
    vi.mocked(prisma.user.update).mockResolvedValue({} as any);

    const result = await verifyEmailToken('valid-token');

    expect(result.email).toBe('test@mail.com');
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'u1' },
        data: expect.objectContaining({
          emailVerificationToken: null,
        }),
      })
    );
  });

  it('handleDuplicateRegistrationEmail resends for unverified user', async () => {
    vi.mocked(prisma.user.update).mockResolvedValue({} as any);

    await expect(
      handleDuplicateRegistrationEmail({
        id: 'u1',
        email: 'test@mail.com',
        name: 'Test',
        emailVerifiedAt: null,
      })
    ).rejects.toMatchObject({ code: 'EMAIL_NOT_VERIFIED_RESENT' });

    expect(prisma.user.update).toHaveBeenCalled();
  });

  it('deliverRegistrationVerificationEmail rolls back when mail fails', async () => {
    vi.mocked(prisma.user.update).mockResolvedValue({} as any);
    vi.mocked(sendMail).mockRejectedValueOnce(new Error('SSL wrong version number'));
    const rollback = vi.fn().mockResolvedValue(undefined);

    await expect(
      deliverRegistrationVerificationEmail({
        email: 'test@mail.com',
        name: 'Test',
        userId: 'u1',
        rollback,
      })
    ).rejects.toBeInstanceOf(RegistrationEmailError);

    expect(rollback).toHaveBeenCalledOnce();
  });
});
