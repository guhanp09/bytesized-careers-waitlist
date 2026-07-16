'use client';

import { motion, useReducedMotion } from 'motion/react';
import { progressFraction, progressPhase } from '@/lib/copy/flow-copy';

interface ProgressIndicatorProps {
  /** Current flow step (1-indexed). */
  step: number;
}

/**
 * Qualitative progression — a thin editorial rule that fills as the brief takes shape,
 * captioned with phase language ("Your brief is taking shape"), never a numeric count.
 * The bar itself is decorative; screen readers get the phase text, and the flow's status
 * region announces each chapter by name.
 */
export function ProgressIndicator({ step }: ProgressIndicatorProps) {
  const reduce = useReducedMotion();
  const fraction = progressFraction(step);
  const phase = progressPhase(step);

  return (
    <div className="mb-5">
      <p
        aria-hidden="true"
        className="mb-1.5 text-right font-mono text-[10px] tracking-[0.14em] uppercase text-faint"
      >
        {phase}
      </p>
      <p className="sr-only">{phase}</p>
      <div
        aria-hidden="true"
        className="h-1 w-full overflow-hidden rounded-full bg-[color:var(--color-line)]"
      >
        <motion.div
          className="h-full rounded-full bg-accent"
          initial={false}
          animate={{ width: `${fraction * 100}%` }}
          transition={
            reduce ? { duration: 0 } : { duration: 0.5, ease: [0.16, 1, 0.3, 1] }
          }
        />
      </div>
    </div>
  );
}
