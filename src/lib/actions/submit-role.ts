'use server';

import { roleStepSchema } from '@/lib/validation/role';
import { fieldErrorsOf } from '@/lib/validation/utils';
import { updateLeadRole } from '@/lib/db/queries/leads';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { logger } from '@/lib/utils/logger';
import { actionOk, actionError, type ActionResult } from '@/types/waitlist';
import type { Role } from '@/types/waitlist';

export interface SubmitRoleInput {
  leadId: string;
  resumeToken: string;
  role: Role;
}

/**
 * Step 2 — persist the role (plan §10, §11). Saved on tap; the client auto-advances only
 * after this resolves `ok`, so a visitor is never advanced past an unsaved role.
 */
export async function submitRoleStep(
  input: SubmitRoleInput,
): Promise<ActionResult<{ leadId: string }>> {
  const parsed = roleStepSchema.safeParse(input);
  if (!parsed.success) {
    return actionError(
      'validation_error',
      'Please choose one option.',
      fieldErrorsOf(parsed.error),
    );
  }

  const ip = await getClientIp();
  const rate = await checkRateLimit('submit_role', ip);
  if (!rate.allowed) {
    return actionError(
      'rate_limited',
      'Too many attempts — please wait a few minutes and try again.',
    );
  }

  try {
    const { ok } = await updateLeadRole(parsed.data);
    if (!ok) {
      return actionError(
        'invalid_token',
        'Your session has expired. Please refresh and start again.',
      );
    }
    logger.info({
      event: 'role_saved',
      action: 'submit_role',
      leadId: parsed.data.leadId,
    });
    return actionOk({ leadId: parsed.data.leadId });
  } catch (err) {
    logger.error({
      event: 'role_save_failed',
      action: 'submit_role',
      errorCode: 'server_error',
      message: err instanceof Error ? err.message : String(err),
    });
    return actionError(
      'server_error',
      'Something went wrong saving that. Please try again in a moment.',
    );
  }
}
