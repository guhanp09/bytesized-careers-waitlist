'use client';

import { createContext, useContext, useMemo, useState } from 'react';
import type { BriefSnapshot } from './brief-model';
import type { Role } from '@/types/waitlist';

/** Mirror of the active step's inline save status — lets the brief stay honest. */
export type BriefSaveState = 'idle' | 'saving' | 'saved' | 'error';

interface BriefState {
  /** Current flow step (1–9). */
  step: number;
  /** Funnel progress, 0 → 1. Drives how much the margin noise recedes. */
  progress: number;
  role: Role | null;
  /** Token-free projection of the visitor's answers — what the brief typesets. */
  snapshot: BriefSnapshot | null;
  /** Whether the active step currently has in-flight (debounced) persistence. */
  saveState: BriefSaveState;
  setStep: (n: number) => void;
  setProgress: (n: number) => void;
  setRole: (r: Role | null) => void;
  setSnapshot: (s: BriefSnapshot | null) => void;
  setSaveState: (s: BriefSaveState) => void;
}

const BriefContext = createContext<BriefState | null>(null);

/**
 * Shares the funnel's public state (step, progress, role, answer snapshot, save status)
 * between the waitlist flow and the presentation layer: the brief artifact (rail/drawer)
 * and the margin scraps. Never carries leadId or resumeToken.
 */
export function BriefProvider({ children }: { children: React.ReactNode }) {
  const [step, setStep] = useState(1);
  const [progress, setProgress] = useState(0);
  const [role, setRole] = useState<Role | null>(null);
  const [snapshot, setSnapshot] = useState<BriefSnapshot | null>(null);
  const [saveState, setSaveState] = useState<BriefSaveState>('idle');
  const value = useMemo(
    () => ({
      step,
      progress,
      role,
      snapshot,
      saveState,
      setStep,
      setProgress,
      setRole,
      setSnapshot,
      setSaveState,
    }),
    [step, progress, role, snapshot, saveState],
  );
  return <BriefContext.Provider value={value}>{children}</BriefContext.Provider>;
}

export function useBrief(): BriefState | null {
  return useContext(BriefContext);
}
