'use server';

import { z } from 'zod';
import {
  selectResumeState,
  updateLeadLastTouch,
  type ResumeState,
} from '@/lib/db/queries/leads';
import { attributionTouchSchema, type AttributionTouchV1 } from '@/lib/attribution/campaign';
import { fieldErrorsOf } from '@/lib/validation/utils';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { logger } from '@/lib/utils/logger';
import { actionOk, actionError, type ActionResult } from '@/types/waitlist';

const resumeSchema = z.object({
  leadId: z.uuid(),
  resumeToken: z.string().min(1),
  currentTouch: attributionTouchSchema.optional(),
});

export interface GetLeadForResumeInput {
  leadId: string;
  resumeToken: string;
  currentTouch?: AttributionTouchV1;
}

/**
 * Resume lookup (plan §12). The token hash + expiry are re-verified server-side on every
 * call. Email stays masked; saved phone data is returned only to the authorized editing
 * session so the visitor can accurately change or withdraw channel choices.
 */
export async function getLeadForResume(
  input: GetLeadForResumeInput,
): Promise<ActionResult<ResumeState>> {
  const parsed = resumeSchema.safeParse(input);
  if (!parsed.success) {
    return actionError('validation_error', 'Invalid session.', fieldErrorsOf(parsed.error));
  }

  const ip = await getClientIp();
  const rate = await checkRateLimit('resume_lookup', ip);
  if (!rate.allowed) {
    return actionError('rate_limited', 'Too many attempts — please wait a moment.');
  }

  try {
    if (parsed.data.currentTouch) {
      const updated = await updateLeadLastTouch({
        leadId: parsed.data.leadId,
        resumeToken: parsed.data.resumeToken,
        touch: parsed.data.currentTouch,
      });
      if (!updated.ok) {
        return actionError('invalid_token', 'This session could not be resumed.');
      }
    }
    const state = await selectResumeState(parsed.data);
    if (!state) {
      return actionError('invalid_token', 'This session could not be resumed.');
    }
    return actionOk(state);
  } catch (err) {
    logger.error({
      event: 'resume_lookup_failed',
      action: 'resume_lookup',
      errorCode: 'server_error',
      message: err instanceof Error ? err.message : String(err),
    });
    return actionError('server_error', 'Something went wrong. Please refresh.');
  }
}
