'use server';

import {
  changeEmailStepSchema,
  emailStepSchema,
  normalizeEmail,
} from '@/lib/validation/email';
import { fieldErrorsOf } from '@/lib/validation/utils';
import { upsertLeadByEmail, updateLeadEmail } from '@/lib/db/queries/leads';
import {
  generateResumeToken,
  hashResumeToken,
  resumeTokenExpiry,
} from '@/lib/tokens/lead-token';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { logger } from '@/lib/utils/logger';
import { maskEmail } from '@/lib/utils/mask';
import { actionOk, actionError, type ActionResult } from '@/types/waitlist';

export interface SubmitEmailInput {
  fullName: string;
  email: string;
  honeypot?: string;
  attribution?: import('@/lib/attribution/campaign').AttributionSubmission;
}

export type SubmitEmailData = {
  leadId: string;
  resumeToken: string;
  emailMasked: string;
  fullName: string | null;
  attribution?: import('@/lib/attribution/campaign').AttributionStateV1;
};

export interface ChangeEmailInput extends Omit<SubmitEmailInput, 'fullName'> {
  fullName?: string;
  leadId: string;
  resumeToken: string;
}

/**
 * Step 1 — capture and persist the email immediately (plan §10, §11, §13).
 *
 * Reliability contract: success is returned ONLY after the database confirms the row was
 * persisted. Any failure returns a typed error so the client can keep the entered value
 * and offer a retry — never a false success.
 */
export async function submitEmailStep(
  input: SubmitEmailInput,
): Promise<ActionResult<SubmitEmailData>> {
  const parsed = emailStepSchema.safeParse(input);
  if (!parsed.success) {
    const fields = fieldErrorsOf(parsed.error);
    return actionError(
      'validation_error',
      fields.fullName?.[0] ?? fields.email?.[0] ?? 'Please enter a valid email address.',
      fields,
    );
  }

  const { fullName, email, honeypot, attribution } = parsed.data;

  // Honeypot: a real hidden field that humans never fill. Non-empty => bot.
  if (honeypot && honeypot.trim() !== '') {
    logger.warn({ event: 'honeypot_triggered', action: 'submit_email' });
    // Generic rejection — give the bot no signal it was detected.
    return actionError('validation_error', 'Please enter a valid email address.');
  }

  const ip = await getClientIp();
  const rate = await checkRateLimit('submit_email', ip);
  if (!rate.allowed) {
    return actionError(
      'rate_limited',
      'Too many attempts — please wait a few minutes and try again.',
    );
  }

  const normalizedEmail = normalizeEmail(email);
  const resumeToken = generateResumeToken();

  try {
    const { id, firstTouchAttribution, lastTouchAttribution } = await upsertLeadByEmail({
      fullName,
      originalEmail: email.trim(),
      normalizedEmail,
      resumeTokenHash: hashResumeToken(resumeToken),
      resumeTokenExpiresAt: resumeTokenExpiry(),
      attribution,
    });

    logger.info({
      event: 'email_captured',
      action: 'submit_email',
      leadId: id,
      email: maskEmail(normalizedEmail),
    });

    return actionOk({
      leadId: id,
      resumeToken,
      emailMasked: maskEmail(normalizedEmail),
      fullName,
      ...(firstTouchAttribution && lastTouchAttribution
        ? {
            attribution: {
              version: 1 as const,
              firstTouch: firstTouchAttribution,
              lastTouch: lastTouchAttribution,
            },
          }
        : {}),
    });
  } catch (err) {
    logger.error({
      event: 'email_capture_failed',
      action: 'submit_email',
      errorCode: 'server_error',
      message: err instanceof Error ? err.message : String(err),
    });
    return actionError(
      'server_error',
      'Something went wrong saving that. Your entry is safe — please try again in a moment.',
    );
  }
}

/** Change an address without creating an abandoned duplicate lead. */
export async function changeEmailStep(
  input: ChangeEmailInput,
): Promise<ActionResult<SubmitEmailData>> {
  const parsed = changeEmailStepSchema.safeParse(input);
  if (!parsed.success) {
    const fields = fieldErrorsOf(parsed.error);
    return actionError(
      'validation_error',
      fields.fullName?.[0] ?? fields.email?.[0] ?? 'Please enter a valid email address.',
      fields,
    );
  }
  if (parsed.data.honeypot?.trim()) {
    return actionError('validation_error', 'Please enter a valid email address.');
  }

  const rate = await checkRateLimit('submit_email', await getClientIp(), [
    `lead:${input.leadId}`,
  ]);
  if (!rate.allowed) {
    return actionError('rate_limited', 'Too many attempts — please wait and try again.');
  }

  const normalizedEmail = normalizeEmail(parsed.data.email);
  try {
    const result = await updateLeadEmail({
      leadId: input.leadId,
      resumeToken: input.resumeToken,
      fullName: parsed.data.fullName || undefined,
      originalEmail: parsed.data.email.trim(),
      normalizedEmail,
    });
    if (!result.ok) return actionError('invalid_token', 'This session has expired.');
    logger.info({
      event: 'email_changed',
      action: 'change_email',
      leadId: input.leadId,
      email: maskEmail(normalizedEmail),
    });
    return actionOk({
      leadId: input.leadId,
      resumeToken: input.resumeToken,
      emailMasked: maskEmail(normalizedEmail),
      fullName: parsed.data.fullName || null,
    });
  } catch {
    return actionError(
      'validation_error',
      'We couldn’t update that address. Try another email or continue with the current one.',
    );
  }
}
