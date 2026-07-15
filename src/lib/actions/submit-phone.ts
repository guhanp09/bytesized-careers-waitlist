'use server';

import { phoneStepSchema, normalizePhone } from '@/lib/validation/phone';
import { fieldErrorsOf } from '@/lib/validation/utils';
import { updateLeadPhone } from '@/lib/db/queries/leads';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { logger } from '@/lib/utils/logger';
import { actionOk, actionError, type ActionResult } from '@/types/waitlist';

export type SubmitPhoneInput =
  | { leadId: string; resumeToken: string; skipped: true }
  | {
      leadId: string;
      resumeToken: string;
      skipped: false;
      countryIso: string;
      phoneNumber: string;
    };

/**
 * Step 6 — optional phone capture. Promotional WhatsApp consent was removed from the
 * current form, so this action never accepts or updates the legacy consent columns.
 */
export async function submitPhoneStep(
  input: SubmitPhoneInput,
): Promise<ActionResult<{ leadId: string }>> {
  const parsed = phoneStepSchema.safeParse(input);
  if (!parsed.success) {
    return actionError(
      'validation_error',
      'Please check the details and try again.',
      fieldErrorsOf(parsed.error),
    );
  }

  const ip = await getClientIp();
  const rate = await checkRateLimit('submit_phone', ip);
  if (!rate.allowed) {
    return actionError(
      'rate_limited',
      'Too many attempts — please wait a few minutes and try again.',
    );
  }

  try {
    if (parsed.data.skipped) {
      const { ok } = await updateLeadPhone({
        leadId: parsed.data.leadId,
        resumeToken: parsed.data.resumeToken,
        skipped: true,
      });
      if (!ok) {
        return actionError(
          'invalid_token',
          'Your session has expired. Please refresh and start again.',
        );
      }
      logger.info({
        event: 'phone_skipped',
        action: 'submit_phone',
        leadId: parsed.data.leadId,
      });
      return actionOk({ leadId: parsed.data.leadId });
    }

    const normalized = normalizePhone(
      parsed.data.phoneNumber,
      parsed.data.countryIso,
    );
    if (!normalized) {
      return actionError(
        'validation_error',
        "That phone number doesn't look valid.",
        { phoneNumber: ['Please enter a valid phone number.'] },
      );
    }

    const { ok } = await updateLeadPhone({
      leadId: parsed.data.leadId,
      resumeToken: parsed.data.resumeToken,
      skipped: false,
      phoneE164: normalized.e164,
      phoneCountryIso: normalized.countryIso,
    });
    if (!ok) {
      return actionError(
        'invalid_token',
        'Your session has expired. Please refresh and start again.',
      );
    }
    logger.info({
      event: 'phone_saved',
      action: 'submit_phone',
      leadId: parsed.data.leadId,
    });
    return actionOk({ leadId: parsed.data.leadId });
  } catch (err) {
    logger.error({
      event: 'phone_save_failed',
      action: 'submit_phone',
      errorCode: 'server_error',
      message: err instanceof Error ? err.message : String(err),
    });
    return actionError(
      'server_error',
      'Something went wrong saving that. Please try again in a moment.',
    );
  }
}
