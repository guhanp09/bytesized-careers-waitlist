'use client';

import { motion, useReducedMotion } from 'motion/react';

/**
 * The page's only scroll-triggered animation: a single, once-only fade-up when a section
 * enters the viewport (IntersectionObserver under the hood — no scroll listeners).
 */
export function Reveal({ children, className }: { children: React.ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      // Keep the initial shape deterministic during SSR; useReducedMotion resolves after
      // hydration in the browser, so branching the initial prop would cause a mismatch.
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: reduce ? 0 : 0.55, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
