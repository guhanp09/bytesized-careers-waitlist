import { logger } from '@/lib/utils/logger';
import type { EmailProvider } from './types';

/**
 * No-op email provider used whenever EMAIL_DELIVERY_ENABLED is false (the default).
 * It never attempts a send and never throws — so the waitlist is fully functional with no
 * domain and no provider credentials, and the UI must never claim an email was sent.
 */
export const disabledEmailProvider: EmailProvider = {
  async sendTransactionalEmail(input) {
    logger.info({
      event: 'email_send_skipped',
      reason: 'delivery_disabled',
      template: input.template,
    });
    return { status: 'skipped_disabled' };
  },
};
