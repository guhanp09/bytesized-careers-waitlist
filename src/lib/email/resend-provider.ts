import { renderTransactionalEmail } from './verification-template';
import type {
  EmailDeliveryFailureReason,
  EmailProvider,
  SendTransactionalEmailResult,
} from './types';

const RESEND_EMAILS_ENDPOINT = 'https://api.resend.com/emails';
const DEFAULT_TIMEOUT_MS = 10_000;

export interface ResendProviderConfig {
  apiKey: string;
  from: string;
  replyTo?: string;
  timeoutMs?: number;
}

type Fetcher = typeof fetch;

function failureForStatus(status: number): EmailDeliveryFailureReason {
  if (status === 401 || status === 403) return 'authentication';
  if (status === 429) return 'rate_limited';
  if (status === 400 || status === 422) return 'validation';
  return 'provider_rejected';
}

/**
 * Resend adapter behind the generic EmailProvider interface. The fetch dependency is
 * injectable so tests can prove the exact request mapping without any outbound email.
 */
export function createResendEmailProvider(
  config: ResendProviderConfig,
  fetcher: Fetcher = fetch,
): EmailProvider {
  return {
    async sendTransactionalEmail(input): Promise<SendTransactionalEmailResult> {
      const rendered = renderTransactionalEmail(input);
      if (!rendered) return { status: 'failed', failureReason: 'template_error' };

      const controller = new AbortController();
      const timeout = setTimeout(
        () => controller.abort(),
        config.timeoutMs ?? DEFAULT_TIMEOUT_MS,
      );
      try {
        const response = await fetcher(RESEND_EMAILS_ENDPOINT, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json',
            'Idempotency-Key': input.idempotencyKey,
          },
          body: JSON.stringify({
            from: config.from,
            to: [input.to],
            subject: input.subject,
            html: rendered.html,
            text: rendered.text,
            ...(config.replyTo ? { reply_to: config.replyTo } : {}),
            tags: [{ name: 'category', value: input.template }],
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          return { status: 'failed', failureReason: failureForStatus(response.status) };
        }
        const payload = (await response.json().catch(() => null)) as { id?: unknown } | null;
        if (!payload || typeof payload.id !== 'string' || payload.id.length === 0) {
          return { status: 'failed', failureReason: 'malformed_response' };
        }
        return { status: 'sent', providerMessageId: payload.id };
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          return { status: 'failed', failureReason: 'timeout' };
        }
        return { status: 'failed', failureReason: 'network' };
      } finally {
        clearTimeout(timeout);
      }
    },
  };
}
