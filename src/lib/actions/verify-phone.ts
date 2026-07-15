'use server';

import { z } from 'zod';
import {
  getVerificationSnapshot,
  storePhoneCode,
  verifyPhoneCode,
} from '@/lib/db/queries/verification';
import {
  generateCode,
  generateChallengeId,
  hashCode,
  codeExpiry,
  RESEND_COOLDOWN_MS,
  CODE_TTL_MS,
} from '@/lib/verification/code';
import { getVerificationProvider, verificationAvailable } from '@/lib/verification/providers';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { logger } from '@/lib/utils/logger';
import { actionOk, actionError, type ActionResult } from '@/types/waitlist';
import type { RequestCodeData, VerifySubmitResult } from './verify-shared';

const idSchema = z.object({ leadId: z.uuid(), resumeToken: z.string().min(1) });
const codeSchema = idSchema.extend({ code: z.string().regex(/^\d{6}$/) });

/** Request a phone OTP (save-first: the E.164 number is already stored, unverified). */
export async function requestPhoneCode(input: {
  leadId: string;
  resumeToken: string;
}): Promise<ActionResult<RequestCodeData>> {
  const parsed = idSchema.safeParse(input);
  if (!parsed.success) return actionError('validation_error', 'Invalid session.');

  const snap = await getVerificationSnapshot(parsed.data.leadId, parsed.data.resumeToken);
  if (!snap) return actionError('invalid_token', 'This session has expired.');
  if (!snap.phoneE164) return actionError('validation_error', 'Add a phone number first.');
  const rate = await checkRateLimit('verify_request', await getClientIp(), [
    `lead:${parsed.data.leadId}`,
    `phone:${snap.phoneE164}`,
  ]);
  if (!rate.allowed) return actionError('rate_limited', 'Too many requests — please wait a moment.');
  const target = `•••• ${snap.phoneE164.slice(-4)}`;
  if (snap.phoneVerificationStatus === 'verified') {
    return actionOk({ available: true, channel: 'phone', cooldownMs: 0, expiresInMs: 0, alreadyVerified: true, target, deliveryStatus: 'dev_logged' });
  }

  const lastSent = snap.phoneVerificationLastSentAt?.getTime() ?? 0;
  const sinceLast = Date.now() - lastSent;
  if (lastSent && sinceLast < RESEND_COOLDOWN_MS) {
    return actionOk({
      available: true, channel: 'phone',
      cooldownMs: RESEND_COOLDOWN_MS - sinceLast, expiresInMs: CODE_TTL_MS, throttled: true, target, deliveryStatus: 'dev_logged',
    });
  }

  if (!verificationAvailable('phone')) {
    return actionOk({ available: false, channel: 'phone', cooldownMs: 0, expiresInMs: 0, target, deliveryStatus: 'unavailable' });
  }

  const code = generateCode();
  const stored = await storePhoneCode(
    parsed.data.leadId, parsed.data.resumeToken,
    hashCode(code, { leadId: parsed.data.leadId, channel: 'phone' }), codeExpiry(),
  );
  if (!stored.ok) return actionError('invalid_token', 'This session has expired.');

  const result = await getVerificationProvider('phone').send({
    to: snap.phoneE164, code, channel: 'sms', challengeId: generateChallengeId(),
  });
  logger.info({ event: 'phone_code_requested', leadId: parsed.data.leadId, status: result.status });

  return actionOk({
    available: true, channel: 'phone',
    cooldownMs: RESEND_COOLDOWN_MS, expiresInMs: CODE_TTL_MS,
    devCode: result.status === 'dev_logged' ? result.devCode : undefined,
    target, deliveryStatus: result.status === 'dev_logged' ? 'dev_logged' : 'unavailable',
  });
}

/** Submit a phone OTP. Never erases the saved number on failure. */
export async function submitPhoneCode(input: {
  leadId: string;
  resumeToken: string;
  code: string;
}): Promise<VerifySubmitResult> {
  const parsed = codeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, reason: 'validation_error', message: 'Enter the 6-digit code.' };

  const snap = await getVerificationSnapshot(parsed.data.leadId, parsed.data.resumeToken);
  if (!snap) return { ok: false, reason: 'invalid_token', message: 'This session has expired.' };
  const rate = await checkRateLimit('verify_submit', await getClientIp(), [
    `lead:${parsed.data.leadId}`,
    `phone:${snap.phoneE164 ?? 'missing'}`,
  ]);
  if (!rate.allowed) return { ok: false, reason: 'rate_limited', message: 'Too many attempts — please wait.' };

  const result = await verifyPhoneCode(parsed.data.leadId, parsed.data.resumeToken, parsed.data.code);
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
      return { ok: false, reason: 'invalid_code', message: "That code doesn't match — try again." };
  }
}
