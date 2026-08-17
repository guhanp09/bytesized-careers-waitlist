'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { OTHER_TEXT_MAX } from '@/lib/validation/constants';
import { formControlClassName } from './form-control';
import { cn } from '@/lib/utils/cn';

interface OtherFieldProps {
  id: string;
  show: boolean;
  value: string;
  prompt: string;
  onChange: (value: string) => void;
  onCommit?: () => void;
  /** Set when the visitor selected "Other" but has not yet said what we missed. */
  error?: string | null;
}

/**
 * Custom "Other" free-text field (v2). Smoothly reveals when its parent option is selected;
 * value is retained in parent state so it survives back/forward navigation. Selecting
 * "Other" makes this answer required — an unexplained "Other" tells us nothing about what
 * the taxonomy is missing — so the control is marked required and reports its own error.
 * Accessible label + bounded length; reduced-motion falls back to a plain fade.
 */
export function OtherField({
  id,
  show,
  value,
  prompt,
  onChange,
  onCommit,
  error = null,
}: OtherFieldProps) {
  const reduce = useReducedMotion();
  const errorId = `${id}-error`;
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
              required
              maxLength={OTHER_TEXT_MAX}
              autoComplete="off"
              onChange={(e) => onChange(e.target.value)}
              onBlur={onCommit}
              aria-invalid={error ? true : undefined}
              aria-describedby={
                error ? `${errorId} ${id}-guidance` : `${id}-guidance`
              }
              placeholder="Type your answer…"
              className={cn(
                formControlClassName,
                'rounded-xl',
                error && 'border-[color:var(--color-error)] focus:border-[color:var(--color-error)]',
              )}
            />
            {error ? (
              <p id={errorId} role="alert" className="mt-1.5 text-sm text-error">
                {error}
              </p>
            ) : null}
            <p id={`${id}-guidance`} className="mt-1.5 text-xs leading-5 text-faint">
              Keep this work-related; don&apos;t include sensitive personal information.
            </p>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
