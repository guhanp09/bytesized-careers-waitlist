'use server';

import { z } from 'zod';
import {
  confirmEmailCodeDelivery,
  failEmailCodeDelivery,
  getVerificationSnapshot,
  reserveEmailCode,
  verifyEmailCode,
} from '@/lib/db/queries/verification';
import {
  codeExpiry,
  CODE_TTL_MS,
  generateChallengeId,
  generateCode,
  hashCode,
  RESEND_COOLDOWN_MS,
} from '@/lib/verification/code';
import {
  getVerificationProvider,
  verificationAvailability,
} from '@/lib/verification/providers';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { logger } from '@/lib/utils/logger';
import { maskEmail } from '@/lib/utils/mask';
import { actionError, actionOk, type ActionResult } from '@/types/waitlist';
import type { RequestCodeData, VerifySubmitResult } from './verify-shared';

const idSchema = z.object({ leadId: z.uuid(), resumeToken: z.string().min(1) });
const codeSchema = idSchema.extend({ code: z.string().regex(/^\d{6}$/) });

function deliveryFromSnapshot(
  snapshot: Awaited<ReturnType<typeof getVerificationSnapshot>> & {},
): RequestCodeData['deliveryStatus'] {
  if (snapshot.emailVerificationFailureCode === 'timeout' || snapshot.emailVerificationFailureCode === 'network') {
    return 'uncertain';
  }
  if (snapshot.lastTransactionalEmailStatus === 'sent') return 'accepted';
  if (snapshot.lastTransactionalEmailStatus === 'skipped_disabled') return 'dev_logged';
  return 'sending';
}

/** Request a provider-confirmed email verification code after the lead is already saved. */
export async function requestEmailCode(input: {
  leadId: string;
  resumeToken: string;
}): Promise<ActionResult<RequestCodeData>> {
  const parsed = idSchema.safeParse(input);
  if (!parsed.success) return actionError('validation_error', 'Invalid session.');

  try {
    const snap = await getVerificationSnapshot(parsed.data.leadId, parsed.data.resumeToken);
    if (!snap) return actionError('invalid_token', 'This session has expired.');
    const target = maskEmail(snap.normalizedEmail);

    const rate = await checkRateLimit('verify_request', await getClientIp(), [
      `lead:${parsed.data.leadId}`,
      `email:${snap.normalizedEmail}`,
    ]);
    if (!rate.allowed) {
      return actionError('rate_limited', 'Too many requests — please wait a moment.');
    }

    if (snap.emailVerificationStatus === 'verified') {
      return actionOk({
        available: true,
        channel: 'email',
        cooldownMs: 0,
        expiresInMs: 0,
        alreadyVerified: true,
        target,
        deliveryStatus: 'accepted',
      });
    }

    const availability = verificationAvailability('email');
    if (!availability.available) {
      // This is intentionally configuration-safe telemetry. It makes a fail-closed
      // Production fallback diagnosable without logging a secret, address, or code.
      logger.warn({
        event: 'email_verification_unavailable',
        leadId: parsed.data.leadId,
        reason: availability.reason,
      });
      return actionOk({
        available: false,
        channel: 'email',
        cooldownMs: 0,
        expiresInMs: 0,
        target,
        deliveryStatus: 'unavailable',
      });
    }

    const lastRequest = snap.emailVerificationRequestedAt?.getTime() ?? 0;
    const sinceLast = Date.now() - lastRequest;
    if (lastRequest && sinceLast < RESEND_COOLDOWN_MS) {
      return actionOk({
        available: true,
        channel: 'email',
        cooldownMs: RESEND_COOLDOWN_MS - sinceLast,
        expiresInMs: snap.emailVerificationExpiresAt
          ? Math.max(0, snap.emailVerificationExpiresAt.getTime() - Date.now())
          : CODE_TTL_MS,
        throttled: true,
        target,
        deliveryStatus: deliveryFromSnapshot(snap),
      });
    }

    const code = generateCode();
    const challengeId = generateChallengeId();
    const reserved = await reserveEmailCode({
      leadId: parsed.data.leadId,
      resumeToken: parsed.data.resumeToken,
      challengeId,
      codeHash: hashCode(code, { leadId: parsed.data.leadId, channel: 'email' }),
      expiresAt: codeExpiry(),
    });
    if (!reserved.ok) {
      // A concurrent request may have won the reservation. Never claim it sent.
      return actionOk({
        available: true,
        channel: 'email',
        cooldownMs: RESEND_COOLDOWN_MS,
        expiresInMs: CODE_TTL_MS,
        throttled: true,
        target,
        deliveryStatus: 'sending',
      });
    }

    const result = await getVerificationProvider('email').send({
      to: snap.normalizedEmail,
      code,
      channel: 'email',
      challengeId,
      name: snap.fullName,
    });

    if (result.status === 'accepted') {
      const confirmed = await confirmEmailCodeDelivery({
        leadId: parsed.data.leadId,
        resumeToken: parsed.data.resumeToken,
        challengeId,
        mode: 'accepted',
        providerMessageId: result.providerMessageId,
      });
      if (!confirmed.ok) throw new Error('delivery_confirmation_write_failed');
      logger.info({
        event: 'email_code_requested',
        leadId: parsed.data.leadId,
        status: 'accepted',
      });
      return actionOk({
        available: true,
        channel: 'email',
        cooldownMs: RESEND_COOLDOWN_MS,
        expiresInMs: CODE_TTL_MS,
        target,
        deliveryStatus: 'accepted',
      });
    }

    if (result.status === 'dev_logged') {
      await confirmEmailCodeDelivery({
        leadId: parsed.data.leadId,
        resumeToken: parsed.data.resumeToken,
        challengeId,
        mode: 'dev_logged',
      });
      return actionOk({
        available: true,
        channel: 'email',
        cooldownMs: RESEND_COOLDOWN_MS,
        expiresInMs: CODE_TTL_MS,
        devCode: result.devCode,
        target,
        deliveryStatus: 'dev_logged',
      });
    }

    if (result.status === 'uncertain') {
      await confirmEmailCodeDelivery({
        leadId: parsed.data.leadId,
        resumeToken: parsed.data.resumeToken,
        challengeId,
        mode: 'uncertain',
        failureCode: result.failureReason,
      });
      logger.warn({
        event: 'email_code_delivery_uncertain',
        leadId: parsed.data.leadId,
        errorCode: result.failureReason,
      });
      return actionOk({
        available: true,
        channel: 'email',
        cooldownMs: RESEND_COOLDOWN_MS,
        expiresInMs: CODE_TTL_MS,
        target,
        deliveryStatus: 'uncertain',
      });
    }

    const failureCode =
      result.status === 'failed' ? result.failureReason : 'configuration';
    await failEmailCodeDelivery({
      leadId: parsed.data.leadId,
      resumeToken: parsed.data.resumeToken,
      challengeId,
      failureCode,
    });
    logger.error({
      event: 'email_code_delivery_failed',
      leadId: parsed.data.leadId,
      errorCode: failureCode,
    });
    return actionError(
      'delivery_failed',
      'We couldn’t send a code just now. Your waitlist place is safe — retry or continue for now.',
    );
  } catch (error) {
    logger.error({
      event: 'email_code_request_failed',
      leadId: parsed.data.leadId,
      errorCode: 'server_error',
      failureCategory:
        error instanceof Error && error.message === 'delivery_confirmation_write_failed'
          ? 'confirmation_write'
          : 'request_processing',
    });
    return actionError(
      'server_error',
      'We couldn’t prepare a code just now. Your waitlist place is safe.',
    );
  }
}

/** Verify one lead-bound, expiring, single-use email code. */
export async function submitEmailCode(input: {
  leadId: string;
  resumeToken: string;
  code: string;
}): Promise<VerifySubmitResult> {
  const parsed = codeSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, reason: 'validation_error', message: 'Enter the 6-digit code.' };
  }

  try {
    const snap = await getVerificationSnapshot(parsed.data.leadId, parsed.data.resumeToken);
    if (!snap) {
      return { ok: false, reason: 'invalid_token', message: 'This session has expired.' };
    }
    const rate = await checkRateLimit('verify_submit', await getClientIp(), [
      `lead:${parsed.data.leadId}`,
      `email:${snap.normalizedEmail}`,
    ]);
    if (!rate.allowed) {
      return { ok: false, reason: 'rate_limited', message: 'Too many attempts — please wait.' };
    }

    const result = await verifyEmailCode(
      parsed.data.leadId,
      parsed.data.resumeToken,
      parsed.data.code,
    );
    switch (result) {
      case 'verified':
        return { ok: true };
      case 'expired':
        return { ok: false, reason: 'expired', message: 'That code has expired — request a new one.' };
      case 'too_many_attempts':
        return { ok: false, reason: 'too_many_attempts', message: 'Too many attempts — request a new code.' };
      case 'invalid_token':
        return { ok: false, reason: 'invalid_token', message: 'This session has expired.' };
      case 'not_pending':
        return { ok: false, reason: 'not_pending', message: 'Request a new code to continue.' };
      default:
        return { ok: false, reason: 'invalid_code', message: "That code doesn’t match — try again." };
    }
  } catch {
    return { ok: false, reason: 'invalid_token', message: 'Verification is temporarily unavailable.' };
  }
}
