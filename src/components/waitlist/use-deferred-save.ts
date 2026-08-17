'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { StatusState } from '@/components/ui/inline-status';

export interface DeferredSaveResult {
  ok: boolean;
  message?: string;
}

/**
 * Deferred persistence for the option-dense steps (interests, richer context).
 *
 * Those steps present dozens of choices. Saving on every toggle meant one request per
 * click, which legitimately exhausted the per-IP rate limit for a thorough visitor and
 * surfaced "Too many attempts" mid-selection. Changes are therefore staged in the flow's
 * own state and written once — when the visitor continues — so a whole step costs a single
 * request no matter how many chips are picked.
 *
 * If the visitor leaves the step another way (Back, closing the tab), one best-effort
 * write still preserves the answers, so progressive persistence is kept without spamming.
 */
export function useDeferredSave<T>(persist: (payload: T) => Promise<DeferredSaveResult>) {
  const [status, setStatus] = useState<StatusState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [staged, setStaged] = useState(false);
  const pendingRef = useRef<T | null>(null);
  const persistRef = useRef(persist);

  useEffect(() => {
    persistRef.current = persist;
  }, [persist]);

  /** Record a change locally. Deliberately no network call — that happens on flush. */
  const stage = useCallback((payload: T) => {
    pendingRef.current = payload;
    setStaged(true);
    setStatus('idle');
    setError(null);
  }, []);

  /** Write the staged payload. Returns false only when the write actually failed. */
  const flush = useCallback(async (): Promise<boolean> => {
    const payload = pendingRef.current;
    if (payload === null) return true;
    setStatus('saving');
    setError(null);
    const result = await persistRef.current(payload);
    if (result.ok) {
      pendingRef.current = null;
      setStaged(false);
      setStatus('saved');
      return true;
    }
    setStatus('error');
    setError(result.message ?? 'Something went wrong saving that. Please try again.');
    return false;
  }, []);

  // Safety net: leaving the step without continuing still preserves the answers, in a
  // single request. Fire-and-forget — the component is unmounting, nothing to await.
  useEffect(
    () => () => {
      const payload = pendingRef.current;
      if (payload === null) return;
      pendingRef.current = null;
      void persistRef.current(payload);
    },
    [],
  );

  return { status, error, staged, stage, flush };
}
