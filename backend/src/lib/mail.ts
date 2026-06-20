import nodemailer from 'nodemailer';
import { Resend } from 'resend';

export type EmailProvider = 'gmail' | 'resend' | 'none';

export interface ResendTemplatePayload {
  id: string;
  /** Resend template variables must all be strings. */
  variables: Record<string, string>;
}

export interface MailMessage {
  to: string[];
  subject?: string;
  text: string;
  html?: string;
  /** Resend hosted template — mutually exclusive dengan html saat kirim. */
  template?: ResendTemplatePayload;
}

const cleanEnv = (val: string | undefined): string => {
  if (!val) return '';
  return val.replace(/^["']|["']$/g, '').trim();
};

function envFlagEnabled(val: string | undefined): boolean {
  const normalized = cleanEnv(val).toLowerCase();
  return normalized === 'true' || normalized === '1' || normalized === 'yes';
}

/** Provider aktif: EMAIL_PROVIDER, atau fallback *_ENABLED, lalu SMTP legacy. */
export function getEmailProvider(): EmailProvider {
  const explicit = cleanEnv(process.env.EMAIL_PROVIDER).toLowerCase();
  if (explicit === 'resend') return 'resend';
  if (explicit === 'gmail' || explicit === 'smtp') return 'gmail';

  if (envFlagEnabled(process.env.RESEND_ENABLED)) return 'resend';
  if (envFlagEnabled(process.env.GMAIL_ENABLED) || envFlagEnabled(process.env.SMTP_ENABLED)) {
    return 'gmail';
  }

  if (cleanEnv(process.env.SMTP_HOST) && cleanEnv(process.env.SMTP_FROM)) {
    return 'gmail';
  }

  if (cleanEnv(process.env.RESEND_API_KEY) && cleanEnv(process.env.RESEND_FROM)) {
    return 'resend';
  }

  return 'none';
}

export function isMailConfigured(): boolean {
  const provider = getEmailProvider();
  if (provider === 'gmail') {
    return Boolean(cleanEnv(process.env.SMTP_HOST) && cleanEnv(process.env.SMTP_FROM));
  }
  if (provider === 'resend') {
    return Boolean(cleanEnv(process.env.RESEND_API_KEY) && cleanEnv(process.env.RESEND_FROM));
  }
  return false;
}

async function sendViaGmail(message: MailMessage): Promise<void> {
  const rawPort = cleanEnv(process.env.SMTP_PORT);
  const port = rawPort ? Number(rawPort) : 587;
  const rawSecure = cleanEnv(process.env.SMTP_SECURE);
  const secure = rawSecure === 'true' || (rawSecure !== 'false' && port === 465);

  const transporter = nodemailer.createTransport({
    host: cleanEnv(process.env.SMTP_HOST),
    port,
    secure,
    requireTLS: !secure && port === 587,
    auth:
      cleanEnv(process.env.SMTP_USER) && cleanEnv(process.env.SMTP_PASS)
        ? { user: cleanEnv(process.env.SMTP_USER), pass: cleanEnv(process.env.SMTP_PASS) }
        : undefined,
  });

  await transporter.sendMail({
    from: cleanEnv(process.env.SMTP_FROM),
    to: message.to.join(', '),
    subject: message.subject,
    text: message.text,
    html: message.html,
  });
}

async function sendViaResend(message: MailMessage): Promise<void> {
  const resend = new Resend(cleanEnv(process.env.RESEND_API_KEY));

  if (message.template) {
    const { error } = await resend.emails.send({
      from: cleanEnv(process.env.RESEND_FROM),
      to: message.to,
      ...(message.subject ? { subject: message.subject } : {}),
      template: {
        id: message.template.id,
        variables: message.template.variables,
      },
    });

    if (error) {
      throw new Error(error.message);
    }
    return;
  }

  const { error } = await resend.emails.send({
    from: cleanEnv(process.env.RESEND_FROM),
    to: message.to,
    subject: message.subject ?? '(no subject)',
    text: message.text,
    html: message.html ?? `<pre>${message.text}</pre>`,
  });

  if (error) {
    throw new Error(error.message);
  }
}

/** Kirim email sesuai provider aktif; no-op + log jika belum dikonfigurasi. */
export async function sendMail(message: MailMessage): Promise<boolean> {
  const provider = getEmailProvider();

  if (!isMailConfigured()) {
    console.info(
      JSON.stringify({
        level: 'info',
        event: 'mail_skipped_unconfigured',
        provider,
        subject: message.subject,
        recipients: message.to.length,
      })
    );
    return false;
  }

  try {
    if (provider === 'resend') {
      await sendViaResend(message);
    } else {
      await sendViaGmail(message);
    }
    return true;
  } catch (error) {
    console.error(
      JSON.stringify({
        level: 'error',
        event: 'mail_send_failed',
        provider,
        subject: message.subject,
        error: error instanceof Error ? error.message : String(error),
      })
    );
    throw error;
  }
}
