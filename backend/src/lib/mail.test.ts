import { describe, expect, it } from 'vitest';
import { isMailConfigured } from './mail';

describe('mail', () => {
  it('isMailConfigured false when SMTP missing', () => {
    const origHost = process.env.SMTP_HOST;
    const origFrom = process.env.SMTP_FROM;
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_FROM;
    expect(isMailConfigured()).toBe(false);
    process.env.SMTP_HOST = origHost;
    process.env.SMTP_FROM = origFrom;
  });

  it('isMailConfigured true when host and from set', () => {
    process.env.SMTP_HOST = 'smtp.test.com';
    process.env.SMTP_FROM = 'noreply@test.com';
    expect(isMailConfigured()).toBe(true);
  });
});
