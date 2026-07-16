import { describe, it, expect, vi } from 'vitest';
import { getEmailProvider } from '@/lib/email/provider';
import { disabledEmailProvider } from '@/lib/email/disabled-provider';
import { createResendEmailProvider } from '@/lib/email/resend-provider';
import { env } from '@/lib/env';

const verificationInput = {
  to: 'user@example.com',
  subject: '123456 is your verification code',
  template: 'verification' as const,
  templateData: { code: '123456', expiresMinutes: 10, name: 'Taylor Morgan' },
  idempotencyKey: 'email-verification/challenge-1',
};

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
      ...verificationInput,
      template: 'welcome',
      templateData: {},
    });
    expect(result.status).toBe('skipped_disabled');
    expect('providerMessageId' in result).toBe(false);
  });
});

describe('Resend adapter', () => {
  it('maps the transactional request and provider acceptance', async () => {
    const fetcher = vi.fn<typeof fetch>(async () =>
      new Response(JSON.stringify({ id: 'resend-message-1' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    const provider = createResendEmailProvider(
      {
        apiKey: 'test-key',
        from: 'ByteSized Careers <verify@updates.bytesizedcareers.com>',
        replyTo: 'support@bytesizedcareers.com',
      },
      fetcher as typeof fetch,
    );

    const result = await provider.sendTransactionalEmail(verificationInput);
    expect(result).toEqual({ status: 'sent', providerMessageId: 'resend-message-1' });
    expect(fetcher).toHaveBeenCalledTimes(1);
    const [url, options] = fetcher.mock.calls[0]!;
    expect(url).toBe('https://api.resend.com/emails');
    expect(options?.method).toBe('POST');
    expect((options?.headers as Record<string, string>)['Idempotency-Key']).toBe(
      verificationInput.idempotencyKey,
    );
    expect((options?.headers as Record<string, string>).Authorization).toBe('Bearer test-key');
    const body = JSON.parse(String(options?.body));
    expect(body).toMatchObject({
      from: 'ByteSized Careers <verify@updates.bytesizedcareers.com>',
      to: ['user@example.com'],
      reply_to: 'support@bytesizedcareers.com',
      subject: verificationInput.subject,
    });
    expect(body.html).toContain('123456');
    expect(body.text).toContain('expires in 10 minutes');
    expect(body.html).toContain('Hi Taylor Morgan');
    expect(body.text).toContain('Hi Taylor Morgan');
    expect(body.html).toContain(
      'https://bytesizedcareers.com/brand/bytesized-careers-mark-email.png',
    );
    expect(body.html).toContain('alt="ByteSized Careers logo"');
    expect(body.text).toContain('ByteSized Careers — confirm your email');
  });

  it('escapes a personalized greeting in both formats', async () => {
    const fetcher = vi.fn<typeof fetch>(async () =>
      new Response(JSON.stringify({ id: 'resend-message-2' }), { status: 200 }),
    );
    const provider = createResendEmailProvider({ apiKey: 'test-key', from: 'Test <test@example.com>' }, fetcher as typeof fetch);
    await provider.sendTransactionalEmail({
      ...verificationInput,
      templateData: { code: '123456', expiresMinutes: 10, name: '<Asha & Co>' },
    });
    const body = JSON.parse(String(fetcher.mock.calls[0]?.[1]?.body));
    expect(body.html).toContain('Hi &lt;Asha &amp; Co&gt;');
    expect(body.html).not.toContain('Hi <Asha');
    expect(body.text).toContain('Hi <Asha & Co>');
  });

  it('maps rate limits and malformed success responses without leaking provider details', async () => {
    const limited = createResendEmailProvider(
      { apiKey: 'test', from: 'Test <test@example.com>' },
      vi.fn(async () => new Response('{}', { status: 429 })) as typeof fetch,
    );
    await expect(limited.sendTransactionalEmail(verificationInput)).resolves.toEqual({
      status: 'failed',
      failureReason: 'rate_limited',
    });

    const malformed = createResendEmailProvider(
      { apiKey: 'test', from: 'Test <test@example.com>' },
      vi.fn(async () => new Response('{}', { status: 200 })) as typeof fetch,
    );
    await expect(malformed.sendTransactionalEmail(verificationInput)).resolves.toEqual({
      status: 'failed',
      failureReason: 'malformed_response',
    });
  });

  it('contains network failures and never throws through the caller', async () => {
    const provider = createResendEmailProvider(
      { apiKey: 'test', from: 'Test <test@example.com>' },
      vi.fn(async () => {
        throw new Error('socket details that must not escape');
      }) as typeof fetch,
    );
    await expect(provider.sendTransactionalEmail(verificationInput)).resolves.toEqual({
      status: 'failed',
      failureReason: 'network',
    });
  });
});
