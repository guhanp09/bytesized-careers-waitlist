'use server';

import { contextStepSchema } from '@/lib/validation/preferences';
import { fieldErrorsOf } from '@/lib/validation/utils';
import { updateLeadContext } from '@/lib/db/queries/leads';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { logger } from '@/lib/utils/logger';
import { actionOk, actionError, type ActionResult } from '@/types/waitlist';

export interface SubmitContextInput {
  leadId: string;
  resumeToken: string;
  workFormats?: string[];
  organisationTypes?: string[];
  platforms?: string[];
  niches?: string[];
  platformOther?: string | null;
  nicheOther?: string | null;
  experienceLevel?: string | null;
  availabilityToStart?: string | null;
  portfolioUrl?: string | null;
  hiringTimeline?: string | null;
  teamSize?: string | null;
  companyUrl?: string | null;
}

/** Step 5 — persist optional richer context progressively (partial update, debounced). */
export async function submitContextStep(
  input: SubmitContextInput,
): Promise<ActionResult<{ leadId: string }>> {
  const parsed = contextStepSchema.safeParse(input);
  if (!parsed.success) {
    return actionError('validation_error', 'That value is not valid.', fieldErrorsOf(parsed.error));
  }

  const rate = await checkRateLimit('submit_preferences', await getClientIp());
  if (!rate.allowed) {
    return actionError('rate_limited', 'Too many attempts — please wait a moment.');
  }

  try {
    // Normalize optional URLs (prepend https:// when a scheme is missing).
    const data = { ...parsed.data };
    for (const key of ['portfolioUrl', 'companyUrl'] as const) {
      const v = data[key];
      if (v && v.length > 0 && !/^https?:\/\//i.test(v)) {
        data[key] = `https://${v}`;
      }
    }
    const { ok } = await updateLeadContext(data);
    if (!ok) return actionError('invalid_token', 'Your session has expired. Please refresh.');
    logger.info({ event: 'context_saved', action: 'submit_context', leadId: parsed.data.leadId });
    return actionOk({ leadId: parsed.data.leadId });
  } catch (err) {
    logger.error({
      event: 'context_save_failed',
      action: 'submit_context',
      errorCode: 'server_error',
      message: err instanceof Error ? err.message : String(err),
    });
    return actionError('server_error', 'Something went wrong saving that. Please try again.');
  }
}
