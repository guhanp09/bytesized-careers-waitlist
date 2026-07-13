import { env } from '@/lib/env';
import { disabledEmailProvider } from './disabled-provider';
import type { EmailProvider } from './types';

/**
 * Provider factory (plan §17). Returns the no-op disabled provider unless email delivery is
 * enabled. When it IS enabled, a real provider must have been wired in — until then this
 * throws a clear, actionable error rather than silently doing nothing.
 *
 * Future (post domain purchase): import and return a real provider, e.g.
 *   if (env.emailDeliveryEnabled) return resendProvider;
 * See docs/email-integration.md for the full activation checklist.
 */
export function getEmailProvider(): EmailProvider {
  if (!env.emailDeliveryEnabled) {
    return disabledEmailProvider;
  }
  throw new Error(
    'EMAIL_DELIVERY_ENABLED=true but no email provider is wired yet. ' +
      'Implement src/lib/email/resend-provider.ts and return it here ' +
      '(see docs/email-integration.md).',
  );
}
