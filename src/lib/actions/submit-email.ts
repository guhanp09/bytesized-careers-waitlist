'use server';

import { emailStepSchema, normalizeEmail } from '@/lib/validation/email';
import { fieldErrorsOf } from '@/lib/validation/utils';
import { upsertLeadByEmail } from '@/lib/db/queries/leads';
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
  email: string;
  honeypot?: string;
  source?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  referrer?: string;
}

export type SubmitEmailData = { leadId: string; resumeToken: string };

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
    return actionError(
      'validation_error',
      'Please enter a valid email address.',
      fieldErrorsOf(parsed.error),
    );
  }

  const { email, honeypot, source, utmSource, utmMedium, utmCampaign, referrer } =
    parsed.data;

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
    const { id } = await upsertLeadByEmail({
      originalEmail: email.trim(),
      normalizedEmail,
      resumeTokenHash: hashResumeToken(resumeToken),
      resumeTokenExpiresAt: resumeTokenExpiry(),
      source,
      utmSource,
      utmMedium,
      utmCampaign,
      referrer,
    });

    logger.info({
      event: 'email_captured',
      action: 'submit_email',
      leadId: id,
      email: maskEmail(normalizedEmail),
    });

    return actionOk({ leadId: id, resumeToken });
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
