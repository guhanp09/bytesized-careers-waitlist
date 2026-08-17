'use server';

import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { z } from 'zod';
import { deleteLeadById } from '@/lib/db/queries/admin';
import { logger } from '@/lib/utils/logger';
import { maskEmail } from '@/lib/utils/mask';
import { actionOk, actionError, type ActionResult } from '@/types/waitlist';

const deleteLeadSchema = z.object({
  leadId: z.uuid({ message: 'That is not a valid registration id.' }),
});

/**
 * Permanently delete one registration from the admin dashboard.
 *
 * Replaces the manual `psql delete from waitlist_leads …` step the README used to document,
 * which is both risky (hand-written SQL against production) and unauditable. Used for
 * clearing test signups and for honouring data-subject erasure requests.
 *
 * Authorization is re-checked here rather than trusted from the page that rendered the
 * button: a server action is a public endpoint, so it must stand on its own — the same
 * defence-in-depth rule the CSV export route follows.
 */
export async function deleteLeadAction(
  input: { leadId: string },
): Promise<ActionResult<{ leadId: string }>> {
  const parsed = deleteLeadSchema.safeParse(input);
  if (!parsed.success) {
    return actionError('validation_error', 'That is not a valid registration id.');
  }

  // Auth is imported lazily so that client components referencing this action do not drag
  // next-auth into their module graph (the same reason `local-preview-shared` exists). The
  // check itself still runs server-side on every single call.
  const [{ auth, isAllowedAdmin }, { localAdminPreviewAllowed }] = await Promise.all([
    import('@/lib/auth/config'),
    import('@/lib/auth/local-preview'),
  ]);

  const session = await auth();
  const preview = localAdminPreviewAllowed((await headers()).get('host'));
  if (!isAllowedAdmin(session) && !preview) {
    logger.warn({
      event: 'lead_delete_denied',
      action: 'delete_lead',
      leadId: parsed.data.leadId,
    });
    return actionError('invalid_token', 'You are not signed in as an administrator.');
  }

  const actor = (session?.user as { login?: string } | undefined)?.login ?? 'local-preview';

  try {
    const { deleted, normalizedEmail } = await deleteLeadById(parsed.data.leadId);
    if (!deleted) {
      // Already gone — treat as success so a double-click cannot strand the operator.
      logger.info({
        event: 'lead_delete_noop',
        action: 'delete_lead',
        leadId: parsed.data.leadId,
      });
      return actionOk({ leadId: parsed.data.leadId });
    }

    // Audit line: who removed what, with the address masked (never logged in the clear).
    logger.info({
      event: 'lead_deleted',
      action: 'delete_lead',
      leadId: parsed.data.leadId,
      actor,
      email: normalizedEmail ? maskEmail(normalizedEmail) : undefined,
    });

    revalidatePath('/admin/waitlist');
    return actionOk({ leadId: parsed.data.leadId });
  } catch (err) {
    logger.error({
      event: 'lead_delete_failed',
      action: 'delete_lead',
      leadId: parsed.data.leadId,
      errorCode: 'server_error',
      message: err instanceof Error ? err.message : String(err),
    });
    return actionError(
      'server_error',
      'Could not delete that registration. Nothing was removed — please try again.',
    );
  }
}
