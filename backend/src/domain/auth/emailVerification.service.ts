import crypto from 'crypto';
import { prisma } from '../../lib/prisma';
import { runInSystemContext } from '../../lib/tenantContext';
import { getEmailProvider, sendMail } from '../../lib/mail';
import { logInfo } from '../../lib/logger';

const TOKEN_BYTES = 32;
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 jam
const APP_NAME = 'SaaSPOS';
const VERIFICATION_EXPIRES_HOURS = TOKEN_TTL_MS / (60 * 60 * 1000);

function getAccountVerificationTemplateId(): string | null {
  const templateId = process.env.RESEND_TEMPLATE_ACCOUNT_VERIFICATION?.trim();
  return templateId || null;
}

export class EmailAlreadyRegisteredError extends Error {
  readonly code: 'EMAIL_NOT_VERIFIED_RESENT' | 'EMAIL_ALREADY_USED';

  constructor(message: string, code: 'EMAIL_NOT_VERIFIED_RESENT' | 'EMAIL_ALREADY_USED') {
    super(message);
    this.code = code;
  }
}

export class RegistrationEmailError extends Error {
  readonly code = 'REGISTRATION_EMAIL_FAILED' as const;

  constructor(message: string, cause?: unknown) {
    super(message);
    if (cause instanceof Error) {
      this.cause = cause;
    }
  }
}

export function normalizeAuthEmail(email: string): string {
  return email.trim().toLowerCase();
}

function getAppPublicUrl(): string {
  return (
    process.env.APP_PUBLIC_URL?.replace(/\/$/, '') ||
    process.env.FRONTEND_URL?.replace(/\/$/, '') ||
    'http://localhost:5173'
  );
}

function buildVerificationUrl(token: string): string {
  return `${getAppPublicUrl()}/verify-email?token=${encodeURIComponent(token)}`;
}

export async function issueEmailVerificationToken(userId: string): Promise<string> {
  return runInSystemContext('auth', async () => {
  const token = crypto.randomBytes(TOKEN_BYTES).toString('hex');
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

  await prisma.user.update({
    where: { id: userId },
    data: {
      emailVerificationToken: token,
      emailVerificationExpiresAt: expiresAt,
    },
  });

  return token;
  });
}

export async function deliverRegistrationVerificationEmail(input: {
  email: string;
  name: string;
  userId: string;
  rollback: () => Promise<void>;
}): Promise<void> {
  try {
    const token = await issueEmailVerificationToken(input.userId);
    await sendAccountVerificationEmail({
      email: input.email,
      name: input.name,
      token,
    });
  } catch (error) {
    await input.rollback();
    throw error;
  }
}

export async function sendAccountVerificationEmail(input: {
  email: string;
  name: string;
  token: string;
}): Promise<boolean> {
  const verifyUrl = buildVerificationUrl(input.token);
  const useResendTemplate =
    getEmailProvider() === 'resend' && getAccountVerificationTemplateId() !== null;
  const templateId = getAccountVerificationTemplateId();

  const text = [
    `Halo ${input.name},`,
    '',
    `Terima kasih telah mendaftar di ${APP_NAME}.`,
    'Silakan verifikasi alamat email Anda untuk mengaktifkan akun:',
    '',
    verifyUrl,
    '',
    `Tautan berlaku selama ${VERIFICATION_EXPIRES_HOURS} jam. Jika Anda tidak mendaftar, abaikan email ini.`,
    '',
    `— Tim ${APP_NAME}`,
  ].join('\n');

  try {
    const sent = await sendMail({
      to: [input.email],
      subject: `Verifikasi Email — Aktivasi Akun ${APP_NAME}`,
      text,
      ...(useResendTemplate && templateId
        ? {
            template: {
              id: templateId,
              variables: {
                USER_NAME: input.name,
                VERIFY_URL: verifyUrl,
                EXPIRES_IN_HOURS: String(VERIFICATION_EXPIRES_HOURS),
                APP_NAME,
              },
            },
          }
        : {}),
    });

    if (!sent) {
      logInfo('emailVerification', 'Mail tidak terkonfigurasi — email verifikasi tidak terkirim');
    }

    return sent;
  } catch {
    throw new RegistrationEmailError(
      'Gagal mengirim email verifikasi. Periksa konfigurasi email (EMAIL_PROVIDER, Gmail SMTP, atau Resend). Registrasi dibatalkan.'
    );
  }
}

export async function verifyEmailToken(token: string): Promise<{ email: string; name: string }> {
  return runInSystemContext('auth', async () => {
  const user = await prisma.user.findFirst({
    where: {
      emailVerificationToken: token,
      deletedAt: null,
    },
  });

  if (!user) {
    throw new Error('Token verifikasi tidak valid atau sudah digunakan.');
  }

  if (!user.emailVerificationExpiresAt || user.emailVerificationExpiresAt < new Date()) {
    throw new Error('Token verifikasi sudah kedaluwarsa. Silakan minta kirim ulang email verifikasi.');
  }

  if (user.emailVerifiedAt) {
    return { email: user.email, name: user.name };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerifiedAt: new Date(),
      emailVerificationToken: null,
      emailVerificationExpiresAt: null,
    },
  });

  return { email: user.email, name: user.name };
  });
}

export async function resendVerificationEmail(email: string): Promise<void> {
  return runInSystemContext('auth', async () => {
  const normalized = normalizeAuthEmail(email);
  const user = await prisma.user.findFirst({
    where: { email: { equals: normalized, mode: 'insensitive' }, deletedAt: null },
  });

  if (!user) {
    // Jangan bocorkan apakah email terdaftar
    return;
  }

  if (user.emailVerifiedAt) {
    throw new Error('Email sudah diverifikasi. Silakan masuk ke akun Anda.');
  }

  const token = await issueEmailVerificationToken(user.id);
  await sendAccountVerificationEmail({ email: user.email, name: user.name, token });
  });
}

/** Jika email sudah terdaftar tapi belum diverifikasi, kirim ulang tautan aktivasi. */
export async function handleDuplicateRegistrationEmail(existing: {
  id: string;
  email: string;
  name: string;
  emailVerifiedAt: Date | null;
}): Promise<void> {
  if (existing.emailVerifiedAt) {
    throw new EmailAlreadyRegisteredError(
      'Alamat email tersebut sudah digunakan oleh pengguna lain.',
      'EMAIL_ALREADY_USED'
    );
  }

  const token = await issueEmailVerificationToken(existing.id);
  await sendAccountVerificationEmail({
    email: existing.email,
    name: existing.name,
    token,
  });

  throw new EmailAlreadyRegisteredError(
    'Akun dengan email ini sudah terdaftar tetapi belum diverifikasi. Email verifikasi telah dikirim ulang — periksa kotak masuk Anda.',
    'EMAIL_NOT_VERIFIED_RESENT'
  );
}
