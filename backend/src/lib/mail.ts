import nodemailer from 'nodemailer';

export interface MailMessage {
  to: string[];
  subject: string;
  text: string;
}

const cleanEnv = (val: string | undefined): string => {
  if (!val) return '';
  return val.replace(/^["']|["']$/g, '').trim();
};

export function isMailConfigured(): boolean {
  return Boolean(cleanEnv(process.env.SMTP_HOST) && cleanEnv(process.env.SMTP_FROM));
}

/** Kirim email jika SMTP dikonfigurasi; no-op + log jika belum. */
export async function sendMail(message: MailMessage): Promise<boolean> {
  if (!isMailConfigured()) {
    console.info(
      JSON.stringify({
        level: 'info',
        event: 'mail_skipped_unconfigured',
        subject: message.subject,
        recipients: message.to.length,
      })
    );
    return false;
  }

  const rawPort = cleanEnv(process.env.SMTP_PORT);
  const port = rawPort ? Number(rawPort) : 587;
  const rawSecure = cleanEnv(process.env.SMTP_SECURE);
  const secure =
    rawSecure === 'true' || (rawSecure !== 'false' && port === 465);

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

  try {
    await transporter.sendMail({
      from: cleanEnv(process.env.SMTP_FROM),
      to: message.to.join(', '),
      subject: message.subject,
      text: message.text,
    });
    return true;
  } catch (error) {
    console.error(
      JSON.stringify({
        level: 'error',
        event: 'mail_send_failed',
        subject: message.subject,
        error: error instanceof Error ? error.message : String(error),
      })
    );
    throw error;
  }
}
