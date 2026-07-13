/**
 * Transactional email provider abstraction (plan §17).
 *
 * A thin, swappable interface. Today the only implementation is the no-op disabled
 * provider; once a domain + provider (Resend / Postmark / SES) are configured, add an
 * implementation and wire it into `getEmailProvider()` — no other code changes.
 *
 * This intentionally models ONLY transactional delivery. It is distinct from:
 *   - email ownership verification (a status on the lead),
 *   - promotional consent (WhatsApp / email unsubscribe fields),
 *   - promotional campaign sending (out of scope here).
 */
export type EmailTemplate =
  | 'verification'
  | 'welcome'
  | 'unsubscribe_confirmation';

export interface SendTransactionalEmailInput {
  to: string;
  subject: string;
  template: EmailTemplate;
  templateData: Record<string, unknown>;
}

export interface SendTransactionalEmailResult {
  status: 'sent' | 'skipped_disabled' | 'failed';
  providerMessageId?: string;
  error?: string;
}

export interface EmailProvider {
  sendTransactionalEmail(
    input: SendTransactionalEmailInput,
  ): Promise<SendTransactionalEmailResult>;
}
