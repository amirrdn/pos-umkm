import { afterEach, describe, expect, it } from 'vitest';
import { getEmailProvider, isMailConfigured } from './mail';

describe('mail', () => {
  const envBackup = { ...process.env };

  afterEach(() => {
    process.env = { ...envBackup };
  });

  it('isMailConfigured false when no provider configured', () => {
    delete process.env.EMAIL_PROVIDER;
    delete process.env.GMAIL_ENABLED;
    delete process.env.RESEND_ENABLED;
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_FROM;
    delete process.env.RESEND_API_KEY;
    delete process.env.RESEND_FROM;
    expect(isMailConfigured()).toBe(false);
    expect(getEmailProvider()).toBe('none');
  });

  it('uses gmail when EMAIL_PROVIDER=gmail', () => {
    process.env.EMAIL_PROVIDER = 'gmail';
    process.env.SMTP_HOST = 'smtp.gmail.com';
    process.env.SMTP_FROM = 'noreply@test.com';
    expect(getEmailProvider()).toBe('gmail');
    expect(isMailConfigured()).toBe(true);
  });

  it('uses resend when EMAIL_PROVIDER=resend', () => {
    process.env.EMAIL_PROVIDER = 'resend';
    process.env.RESEND_API_KEY = 're_test_key';
    process.env.RESEND_FROM = 'onboarding@resend.dev';
    expect(getEmailProvider()).toBe('resend');
    expect(isMailConfigured()).toBe(true);
  });

  it('prefers resend when RESEND_ENABLED=true', () => {
    process.env.RESEND_ENABLED = 'true';
    process.env.GMAIL_ENABLED = 'false';
    process.env.RESEND_API_KEY = 're_test_key';
    process.env.RESEND_FROM = 'onboarding@resend.dev';
    expect(getEmailProvider()).toBe('resend');
  });
});
