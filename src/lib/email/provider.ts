import { env } from '@/lib/env';
import { disabledEmailProvider } from './disabled-provider';
import { createResendEmailProvider } from './resend-provider';
import type { EmailProvider } from './types';

/**
 * Provider factory. Delivery stays fail-closed: disabled flags never instantiate a real
 * provider, and missing credentials return a typed configuration failure instead of
 * throwing through the waitlist capture flow.
 */
export function getEmailProvider(): EmailProvider {
  if (!env.emailDeliveryEnabled) {
    return disabledEmailProvider;
  }
  if (!env.resendConfigured) {
    return {
      async sendTransactionalEmail() {
        return { status: 'failed', failureReason: 'configuration' };
      },
    };
  }
  return createResendEmailProvider({
    apiKey: env.RESEND_API_KEY!.trim(),
    from: env.EMAIL_FROM_ADDRESS!.trim(),
    replyTo: env.EMAIL_REPLY_TO?.trim() || undefined,
  });
}
