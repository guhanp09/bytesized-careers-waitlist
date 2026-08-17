'use client';

import { useState, useTransition } from 'react';
import { deleteLeadAction } from '@/lib/actions/delete-lead';

interface DeleteLeadPanelProps {
  leadId: string;
  /** Shown in the confirmation so the operator can see exactly whose record this is. */
  email: string;
  /** Called after a successful delete so the dialog can close and the table refresh. */
  onDeleted: () => void;
}

/**
 * Danger zone for one registration: clearing a test signup, or honouring an erasure
 * request. Deliberately two-step — the first click only reveals a confirmation that repeats
 * the email address, so a stray click on a real lead cannot destroy data. The delete itself
 * is permanent, and the action re-checks admin authorization server-side.
 */
export function DeleteLeadPanel({ leadId, email, onDeleted }: DeleteLeadPanelProps) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteLeadAction({ leadId });
      if (result.ok) {
        onDeleted();
      } else {
        setError(result.error.message);
      }
    });
  }

  return (
    <section
      aria-labelledby="danger-zone-title"
      className="rounded-xl border border-[color:var(--color-error)]/30 bg-[color:var(--color-error)]/[0.06] p-4"
    >
      <h3
        id="danger-zone-title"
        className="text-sm font-semibold text-[color:var(--color-error)]"
      >
        Delete this registration
      </h3>
      <p className="mt-1.5 text-xs leading-5 text-muted">
        Permanently removes this person&apos;s entire record — contact details, intent,
        selections, comments and verification history. Use it to clear test signups or to
        action a deletion request. This cannot be undone and is not exported first.
      </p>

      {!confirming ? (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="mt-3 min-h-10 rounded-lg border border-[color:var(--color-error)]/45 px-3.5 text-sm font-medium text-[color:var(--color-error)] transition-colors hover:bg-[color:var(--color-error)]/10"
        >
          Delete registration…
        </button>
      ) : (
        <div className="mt-3 rounded-lg border border-[color:var(--color-error)]/35 bg-canvas/60 p-3.5">
          <p className="text-sm text-ink">
            Delete <span className="font-medium break-all">{email}</span> permanently?
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleDelete}
              disabled={isPending}
              className="min-h-10 rounded-lg bg-[color:var(--color-error)] px-3.5 text-sm font-semibold text-canvas transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {isPending ? 'Deleting…' : 'Yes, delete permanently'}
            </button>
            <button
              type="button"
              onClick={() => {
                setConfirming(false);
                setError(null);
              }}
              disabled={isPending}
              className="min-h-10 rounded-lg border border-[color:var(--color-line)] px-3.5 text-sm text-muted transition-colors hover:text-ink disabled:opacity-60"
            >
              Keep it
            </button>
          </div>
        </div>
      )}

      {error ? (
        <p role="alert" className="mt-2.5 text-sm text-[color:var(--color-error)]">
          {error}
        </p>
      ) : null}
    </section>
  );
}
