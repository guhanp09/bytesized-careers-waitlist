'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { OTHER_TEXT_MAX } from '@/lib/validation/constants';

interface OtherFieldProps {
  id: string;
  show: boolean;
  value: string;
  prompt: string;
  onChange: (value: string) => void;
  onCommit?: () => void;
}

/**
 * Custom "Other" free-text field (v2). Smoothly reveals when its parent option is selected;
 * value is retained in parent state so it survives back/forward navigation. Accessible label
 * + bounded length; reduced-motion falls back to a plain fade.
 */
export function OtherField({
  id,
  show,
  value,
  prompt,
  onChange,
  onCommit,
}: OtherFieldProps) {
  const reduce = useReducedMotion();
  return (
    <AnimatePresence initial={false}>
      {show ? (
        <motion.div
          key={id}
          initial={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
          animate={reduce ? { opacity: 1 } : { opacity: 1, height: 'auto' }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          style={{ overflow: 'hidden' }}
        >
          <div className="pt-3">
            <label htmlFor={id} className="mb-1.5 block text-sm text-muted">
              {prompt}
            </label>
            <input
              id={id}
              type="text"
              value={value}
              maxLength={OTHER_TEXT_MAX}
              autoComplete="off"
              onChange={(e) => onChange(e.target.value)}
              onBlur={onCommit}
              placeholder="Type your answer…"
              className="h-12 w-full rounded-xl border border-[color:var(--color-line)] bg-surface px-4 text-base text-ink placeholder:text-faint focus:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            />
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
