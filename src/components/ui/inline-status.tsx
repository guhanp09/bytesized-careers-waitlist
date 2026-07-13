'use client';

import { cn } from '@/lib/utils/cn';

export type StatusState = 'idle' | 'saving' | 'saved' | 'error';

interface InlineStatusProps {
  state: StatusState;
  message?: string;
  className?: string;
}

/**
 * Small inline progressive-save confirmation (plan §8, §11). Announced to screen
 * readers via aria-live so the "Saving… / Saved" moments are perceivable non-visually.
 */
export function InlineStatus({ state, message, className }: InlineStatusProps) {
  const text =
    message ??
    (state === 'saving'
      ? 'Saving…'
      : state === 'saved'
        ? 'Saved'
        : state === 'error'
          ? 'Something went wrong'
          : '');

  return (
    <p
      aria-live="polite"
      role={state === 'error' ? 'alert' : 'status'}
      className={cn(
        'min-h-5 text-sm transition-opacity duration-200',
        state === 'idle' && 'opacity-0',
        state === 'saving' && 'text-muted',
        state === 'saved' && 'text-success',
        state === 'error' && 'text-error',
        className,
      )}
    >
      {text}
    </p>
  );
}
