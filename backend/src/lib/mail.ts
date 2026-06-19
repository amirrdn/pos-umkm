import nodemailer from 'nodemailer';

export interface MailMessage {
  to: string[];
  subject: string;
  text: string;
}

export function isMailConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_FROM);
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

  const port = Number(process.env.SMTP_PORT ?? 587);
  const secure =
    process.env.SMTP_SECURE === 'true' || (process.env.SMTP_SECURE !== 'false' && port === 465);

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure,
    requireTLS: !secure && port === 587,
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
  });

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
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
