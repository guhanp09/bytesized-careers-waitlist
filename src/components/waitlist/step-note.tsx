'use client';

import { useState } from 'react';
import { submitNoteStep } from '@/lib/actions/submit-note';
import { Button } from '@/components/ui/button';
import { MessageIcon, ArrowRightIcon } from '@/components/ui/icons';
import type { Role } from '@/types/waitlist';

interface StepNoteProps {
  leadId: string;
  resumeToken: string;
  role: Role | null;
  value: string;
  onChange: (value: string) => void;
  onComplete: () => void;
}

const MAX = 600;

const COPY: Record<Role, { heading: string; helper: string; placeholder: string }> = {
  seeker: {
    heading: 'What would make ByteSized genuinely useful to you?',
    helper:
      'The more concrete, the better we can match you — a dream role, a creator you’d love to work with, or the kind of work you do best.',
    placeholder: 'e.g. Long-form editing for finance or tech creators — ideally ongoing, remote.',
  },
  recruiter: {
    heading: 'What kind of hire would be a great fit?',
    helper:
      'Describe the person or role you’re after — skills, style, and the kind of creator or brand you are. Specifics help us surface the right people first.',
    placeholder: 'e.g. A short-form editor who gets gaming and can handle fast turnarounds.',
  },
  both: {
    heading: 'Anything you’d want us to know?',
    helper:
      'Tell us what you’re hoping to find or hire — the more specific, the more useful we can be to you.',
    placeholder: 'e.g. Looking for editing work, and also hiring a thumbnail designer.',
  },
};

/**
 * Final step (v2) — a genuinely useful, role-aware free-text prompt that captures intent,
 * urgency, and edge cases structured inputs miss. Never demanded: leaving it empty and
 * pressing Continue simply finishes. Saved progressively.
 */
export function StepNote({ leadId, resumeToken, role, value, onChange, onComplete }: StepNoteProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const copy = COPY[role ?? 'both'];

  async function save() {
    const result = await submitNoteStep({
      leadId,
      resumeToken,
      additionalNotes: value.trim() || null,
    });
    if (!result.ok) setError(result.error.message);
    return result.ok;
  }

  async function handleContinue() {
    if (busy) return;
    setError(null);
    setBusy(true);
    const saved = await save();
    setBusy(false);
    if (saved) onComplete();
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg border border-accent/30 bg-accent/10 text-accent">
          <MessageIcon className="size-5" />
        </span>
        <div>
          <p className="font-mono text-[11px] font-medium tracking-[0.18em] uppercase text-accent">One last thing</p>
          <h2 data-step-heading tabIndex={-1} className="mt-1 font-serif text-2xl tracking-tight text-ink text-balance">
            {copy.heading}
          </h2>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="note" className="text-sm text-muted">
          {copy.helper}
        </label>
        <textarea
          id="note"
          rows={4}
          maxLength={MAX}
          value={value}
          placeholder={copy.placeholder}
          onChange={(e) => {
            onChange(e.target.value);
            if (error) setError(null);
          }}
          onBlur={() => void save()}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? 'note-guidance note-error' : 'note-guidance'}
          className="w-full resize-y rounded-xl border border-[color:var(--color-line)] bg-surface px-4 py-3 text-base leading-relaxed text-ink placeholder:text-faint focus:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        />
        <div className="flex items-start justify-between gap-3 text-xs text-faint">
          <p id="note-guidance">
            Please don&apos;t include health, financial, government-ID, password, or other sensitive information.
          </p>
          <p className="shrink-0 tabular-nums">{value.length}/{MAX}</p>
        </div>
        {error ? (
          <p id="note-error" role="alert" className="text-sm text-error">
            {error}
          </p>
        ) : null}
      </div>

      <div className="flex items-center justify-end">
        <Button onClick={handleContinue} disabled={busy}>
          {busy ? 'Saving…' : 'Finish'}
          {!busy ? <ArrowRightIcon className="size-4" /> : null}
        </Button>
      </div>
    </div>
  );
}
