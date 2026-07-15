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

export function verificationAvailable(channel: 'email' | 'phone'): boolean {
  if (!env.emailVerificationEnabled) return false;
  if (env.localVerificationEnabled) return true;
  return channel === 'email' && env.emailDeliveryEnabled && env.resendConfigured;
}

export function getVerificationProvider(
  channel: 'email' | 'phone',
): VerificationProvider {
  if (!verificationAvailable(channel)) return unavailableProvider;
  if (env.localVerificationEnabled) return localDevProvider;
  return channel === 'email' ? realEmailProvider : unavailableProvider;
}
