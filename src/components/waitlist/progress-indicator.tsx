'use client';

import { motion, useReducedMotion } from 'motion/react';

interface ProgressIndicatorProps {
  /** Current step (1-indexed). */
  step: number;
  /** Total steps in the funnel. */
  total?: number;
}

/**
 * Slim progress bar (plan §8) — gentle "you're nearly there" feedback rather than a heavy
 * numbered stepper. Animates its width as the visitor advances; instant under reduced motion.
 */
export function ProgressIndicator({ step, total = 8 }: ProgressIndicatorProps) {
  const reduce = useReducedMotion();
  const fraction = Math.min(Math.max((step - 1) / Math.max(total - 1, 1), 0), 1);

  return (
    <div
      className="mb-5 h-1 w-full overflow-hidden rounded-full bg-[color:var(--color-line)]"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(fraction * 100)}
      aria-label="Signup progress"
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
  );
}
