import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../lib/prisma', () => ({
  prisma: {
    user: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('../../../lib/mail', () => ({
  sendMail: vi.fn().mockResolvedValue(true),
  getEmailProvider: vi.fn().mockReturnValue('none'),
}));

import { prisma } from '../../../lib/prisma';
import { getEmailProvider, sendMail } from '../../../lib/mail';
import {
  verifyEmailToken,
  handleDuplicateRegistrationEmail,
  deliverRegistrationVerificationEmail,
  sendAccountVerificationEmail,
  RegistrationEmailError,
} from '../../../domain/auth/emailVerification.service';

describe('emailVerification.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(sendMail).mockResolvedValue(true);
    delete process.env.RESEND_TEMPLATE_ACCOUNT_VERIFICATION;
    vi.mocked(getEmailProvider).mockReturnValue('none');
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

  it('sendAccountVerificationEmail uses Resend template when configured', async () => {
    process.env.RESEND_TEMPLATE_ACCOUNT_VERIFICATION = 'account-email-verification';
    vi.mocked(getEmailProvider).mockReturnValue('resend');

    await sendAccountVerificationEmail({
      email: 'test@mail.com',
      name: 'Amir',
      token: 'abc123',
    });

    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: ['test@mail.com'],
        template: {
          id: 'account-email-verification',
          variables: expect.objectContaining({
            USER_NAME: 'Amir',
            VERIFY_URL: expect.stringContaining('token=abc123'),
            EXPIRES_IN_HOURS: '24',
            APP_NAME: 'SaaSPOS',
          }),
        },
      })
    );
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
