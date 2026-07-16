'use client';

import { useEffect } from 'react';
import { cn } from '@/lib/utils/cn';
import { useBrief } from '@/components/brief/brief-context';

export type StatusState = 'idle' | 'saving' | 'saved' | 'error';

interface InlineStatusProps {
  state: StatusState;
  message?: string;
  className?: string;
}

/**
 * Small inline progressive-save confirmation (plan §8, §11). Announced to screen
 * readers via aria-live so the "Saving… / Saved" moments are perceivable non-visually.
 *
 * Every debounced step renders exactly one of these, so it doubles as the single
 * integration point that mirrors the active step's save status into the brief — keeping
 * the document honest about pencilled-in vs saved entries without touching each step.
 */
export function InlineStatus({ state, message, className }: InlineStatusProps) {
  const setSaveState = useBrief()?.setSaveState;
  useEffect(() => {
    setSaveState?.(state);
    return () => setSaveState?.('idle');
  }, [state, setSaveState]);
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
