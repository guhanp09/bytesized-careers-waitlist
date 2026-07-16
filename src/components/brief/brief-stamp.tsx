'use client';

import { motion, useReducedMotion } from 'motion/react';
import { STAMP_TEXT } from '@/lib/copy/flow-copy';

/**
 * "FILED — FOUNDING COHORT" hand stamp. One decisive thunk on mount; instant under
 * reduced motion. Decorative — the success heading carries the announcement.
 */
export function BriefStamp({ className = '' }: { className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.span
      aria-hidden="true"
      className={`brief-stamp ${className}`}
      initial={reduce ? false : { opacity: 0, scale: 1.35, rotate: -10 }}
      animate={{ opacity: 1, scale: 1, rotate: -7 }}
      transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
    >
      {STAMP_TEXT}
    </motion.span>
  );
}
