'use client';

import { useId, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/utils/cn';

interface CollapsibleGroupProps {
  label: string;
  count?: number;
  defaultOpen?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Collapsible category group (v2). Keeps the long, grouped taxonomy scannable on mobile —
 * a labelled header with a live selected-count that expands to reveal its chips. Accessible
 * (button + aria-expanded/controls); animated height with reduced-motion fallback.
 */
export function CollapsibleGroup({
  label,
  count = 0,
  defaultOpen = false,
  icon,
  children,
}: CollapsibleGroupProps) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();
  const reduce = useReducedMotion();

  return (
    <div className="rounded-xl border border-[color:var(--color-line)] bg-surface/40">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="flex min-h-11 w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <span className="flex items-center gap-2.5 text-sm font-medium text-ink">
          {icon ? <span className="text-muted">{icon}</span> : null}
          {label}
          {count > 0 ? (
            <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent tabular-nums">
              {count}
            </span>
          ) : null}
        </span>
        <svg
          viewBox="0 0 20 20"
          fill="none"
          aria-hidden="true"
          className={cn(
            'size-4 shrink-0 text-muted transition-transform duration-200',
            open && 'rotate-180',
          )}
        >
          <path
            d="M5 7.5l5 5 5-5"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            id={panelId}
            initial={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, height: 'auto' }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
            transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div className="px-4 pt-1 pb-4">{children}</div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
