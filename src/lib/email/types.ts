/**
 * Transactional email provider abstraction (plan §17).
 *
 * A thin, swappable interface implemented by the disabled provider and the Resend adapter.
 * Callers depend only on this contract, so the delivery vendor remains replaceable.
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
  /** Stable per logical email; supported by Resend for 24 hours. */
  idempotencyKey: string;
}

export type EmailDeliveryFailureReason =
  | 'configuration'
  | 'authentication'
  | 'validation'
  | 'rate_limited'
  | 'provider_rejected'
  | 'timeout'
  | 'network'
  | 'malformed_response'
  | 'template_error';

export type SendTransactionalEmailResult =
  | { status: 'sent'; providerMessageId: string }
  | { status: 'skipped_disabled' }
  | { status: 'failed'; failureReason: EmailDeliveryFailureReason };

export interface EmailProvider {
  sendTransactionalEmail(
    input: SendTransactionalEmailInput,
  ): Promise<SendTransactionalEmailResult>;
}
