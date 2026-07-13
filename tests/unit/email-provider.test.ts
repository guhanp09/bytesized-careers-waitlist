import { describe, it, expect } from 'vitest';
import { getEmailProvider } from '@/lib/email/provider';
import { disabledEmailProvider } from '@/lib/email/disabled-provider';
import { env } from '@/lib/env';

describe('email delivery disabled by default', () => {
  it('feature flags default to false with no provider env vars set', () => {
    expect(env.emailDeliveryEnabled).toBe(false);
    expect(env.emailVerificationEnabled).toBe(false);
  });

  it('getEmailProvider returns the no-op disabled provider', () => {
    expect(getEmailProvider()).toBe(disabledEmailProvider);
  });

  it('disabled provider never attempts a send and never throws', async () => {
    const result = await disabledEmailProvider.sendTransactionalEmail({
      to: 'user@example.com',
      subject: 'hi',
      template: 'welcome',
      templateData: {},
    });
    expect(result.status).toBe('skipped_disabled');
    expect(result.providerMessageId).toBeUndefined();
  });
});
