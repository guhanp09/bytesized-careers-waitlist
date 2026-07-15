'use server';

import { noteStepSchema } from '@/lib/validation/preferences';
import { fieldErrorsOf } from '@/lib/validation/utils';
import { updateLeadNote } from '@/lib/db/queries/leads';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { logger } from '@/lib/utils/logger';
import { actionOk, actionError, type ActionResult } from '@/types/waitlist';

export interface SubmitNoteInput {
  leadId: string;
  resumeToken: string;
  additionalNotes?: string | null;
}

/** Final step — persist the free-text note (never gates completion). */
export async function submitNoteStep(
  input: SubmitNoteInput,
): Promise<ActionResult<{ leadId: string }>> {
  const parsed = noteStepSchema.safeParse(input);
  if (!parsed.success) {
    return actionError('validation_error', 'Please shorten that a little.', fieldErrorsOf(parsed.error));
  }

  const rate = await checkRateLimit('submit_preferences', await getClientIp());
  if (!rate.allowed) {
    return actionError('rate_limited', 'Too many attempts — please wait a moment.');
  }

  try {
    const notes = parsed.data.additionalNotes;
    const { ok } = await updateLeadNote({
      leadId: parsed.data.leadId,
      resumeToken: parsed.data.resumeToken,
      additionalNotes: notes && notes.length > 0 ? notes : null,
    });
    if (!ok) return actionError('invalid_token', 'Your session has expired. Please refresh.');
    logger.info({ event: 'note_saved', action: 'submit_note', leadId: parsed.data.leadId });
    return actionOk({ leadId: parsed.data.leadId });
  } catch (err) {
    logger.error({
      event: 'note_save_failed',
      action: 'submit_note',
      errorCode: 'server_error',
      message: err instanceof Error ? err.message : String(err),
    });
    return actionError('server_error', 'Something went wrong saving that. Please try again.');
  }
}
