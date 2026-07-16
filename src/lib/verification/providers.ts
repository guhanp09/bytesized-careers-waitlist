import 'server-only';
import { env } from '@/lib/env';
import { getEmailProvider } from '@/lib/email/provider';
import type { EmailDeliveryFailureReason } from '@/lib/email/types';
import { logger } from '@/lib/utils/logger';

export type VerificationChannel = 'email' | 'sms' | 'whatsapp';

export interface SendVerificationInput {
  to: string;
  code: string;
  channel: VerificationChannel;
  challengeId: string;
  name?: string | null;
}

export type SendVerificationResult =
  | { status: 'accepted'; providerMessageId: string }
  | { status: 'dev_logged'; devCode: string }
  | { status: 'uncertain'; failureReason: 'timeout' | 'network' }
  | { status: 'failed'; failureReason: EmailDeliveryFailureReason }
  | { status: 'unavailable' };

export interface VerificationProvider {
  send(input: SendVerificationInput): Promise<SendVerificationResult>;
}

export type VerificationAvailability =
  | { available: true; mode: 'local' | 'resend' }
  | {
      available: false;
      reason:
        | 'verification_disabled'
        | 'email_delivery_disabled'
        | 'resend_not_configured'
        | 'unsupported_channel';
    };

export interface VerificationAvailabilityConfig {
  emailVerificationEnabled: boolean;
  localVerificationEnabled: boolean;
  emailDeliveryEnabled: boolean;
  resendConfigured: boolean;
}

function maskTo(to: string, channel: VerificationChannel): string {
  if (channel === 'email') {
    const at = to.indexOf('@');
    return at > 0 ? `${to.slice(0, 1)}***${to.slice(at)}` : '***';
  }
  return to.length > 4 ? `***${to.slice(-4)}` : '***';
}

const localDevProvider: VerificationProvider = {
  async send({ to, code, channel }) {
    logger.info({
      event: 'verification_code_dev',
      channel,
      message: `DEV ${channel} verification code for ${maskTo(to, channel)}: ${code}`,
    });
    return { status: 'dev_logged', devCode: code };
  },
};

const unavailableProvider: VerificationProvider = {
  async send() {
    return { status: 'unavailable' };
  },
};

const realEmailProvider: VerificationProvider = {
  async send({ to, code, challengeId, name }) {
    const result = await getEmailProvider().sendTransactionalEmail({
      to,
      subject: `${code} is your ByteSized Careers verification code`,
      template: 'verification',
      templateData: { code, expiresMinutes: 10, name },
      idempotencyKey: `email-verification/${challengeId}`,
    });
    if (result.status === 'sent') {
      return { status: 'accepted', providerMessageId: result.providerMessageId };
    }
    if (result.status === 'skipped_disabled') return { status: 'unavailable' };
    if (result.failureReason === 'timeout' || result.failureReason === 'network') {
      return { status: 'uncertain', failureReason: result.failureReason };
    }
    return { status: 'failed', failureReason: result.failureReason };
  },
};

/**
 * Resolve the verification transport without exposing any configuration values.
 * The reason is deliberately safe for production logs: it identifies a feature
 * gate, never a key, address, token, or provider response.
 */
export function resolveVerificationAvailability(
  channel: 'email' | 'phone',
  config: VerificationAvailabilityConfig,
): VerificationAvailability {
  if (!config.emailVerificationEnabled) {
    return { available: false, reason: 'verification_disabled' };
  }
  if (config.localVerificationEnabled) return { available: true, mode: 'local' };
  if (channel !== 'email') return { available: false, reason: 'unsupported_channel' };
  if (!config.emailDeliveryEnabled) {
    return { available: false, reason: 'email_delivery_disabled' };
  }
  if (!config.resendConfigured) {
    return { available: false, reason: 'resend_not_configured' };
  }
  return { available: true, mode: 'resend' };
}

export function verificationAvailability(
  channel: 'email' | 'phone',
): VerificationAvailability {
  return resolveVerificationAvailability(channel, env);
}

export function verificationAvailable(channel: 'email' | 'phone'): boolean {
  return verificationAvailability(channel).available;
}

export function getVerificationProvider(
  channel: 'email' | 'phone',
): VerificationProvider {
  if (!verificationAvailable(channel)) return unavailableProvider;
  if (env.localVerificationEnabled) return localDevProvider;
  return channel === 'email' ? realEmailProvider : unavailableProvider;
}
