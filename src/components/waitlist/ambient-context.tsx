'use client';

import { createContext, useContext, useMemo, useState } from 'react';
import type { Role } from '@/types/waitlist';

interface AmbientState {
  /** Funnel progress, 0 → 1. Drives how connected the constellation becomes. */
  progress: number;
  role: Role | null;
  setProgress: (n: number) => void;
  setRole: (r: Role | null) => void;
}

const AmbientContext = createContext<AmbientState | null>(null);

/**
 * Shares lightweight funnel state (progress + role) between the waitlist flow and the
 * ambient background, so the background can respond subtly to the user's journey.
 */
export function AmbientProvider({ children }: { children: React.ReactNode }) {
  const [progress, setProgress] = useState(0);
  const [role, setRole] = useState<Role | null>(null);
  const value = useMemo(
    () => ({ progress, role, setProgress, setRole }),
    [progress, role],
  );
  return <AmbientContext.Provider value={value}>{children}</AmbientContext.Provider>;
}

export function useAmbient(): AmbientState | null {
  return useContext(AmbientContext);
}
