'use server';

import { preferencesStepSchema } from '@/lib/validation/preferences';
import { fieldErrorsOf } from '@/lib/validation/utils';
import { updateLeadPreferences } from '@/lib/db/queries/leads';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { logger } from '@/lib/utils/logger';
import { actionOk, actionError, type ActionResult } from '@/types/waitlist';

export interface SubmitPreferencesInput {
  leadId: string;
  resumeToken: string;
  jobCategories?: string[];
  workFormats?: string[];
  talentCategories?: string[];
  organisationTypes?: string[];
}

/**
 * Step 3 — persist interest selections progressively (plan §10, §11). Called on a debounce
 * as selections change; each call is a partial update of only the provided fields.
 */
export async function submitPreferencesStep(
  input: SubmitPreferencesInput,
): Promise<ActionResult<{ leadId: string }>> {
  const parsed = preferencesStepSchema.safeParse(input);
  if (!parsed.success) {
    return actionError(
      'validation_error',
      'That selection is not valid.',
      fieldErrorsOf(parsed.error),
    );
  }

  const ip = await getClientIp();
  const rate = await checkRateLimit('submit_preferences', ip);
  if (!rate.allowed) {
    return actionError(
      'rate_limited',
      'Too many attempts — please wait a few minutes and try again.',
    );
  }

  try {
    const { ok } = await updateLeadPreferences(parsed.data);
    if (!ok) {
      return actionError(
        'invalid_token',
        'Your session has expired. Please refresh and start again.',
      );
    }
    logger.info({
      event: 'preferences_saved',
      action: 'submit_preferences',
      leadId: parsed.data.leadId,
    });
    return actionOk({ leadId: parsed.data.leadId });
  } catch (err) {
    logger.error({
      event: 'preferences_save_failed',
      action: 'submit_preferences',
      errorCode: 'server_error',
      message: err instanceof Error ? err.message : String(err),
    });
    return actionError(
      'server_error',
      'Something went wrong saving that. Please try again in a moment.',
    );
  }
}
