'use client';

import { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { ShareIcon } from '@/components/ui/icons';
import {
  SUCCESS_HEADLINES,
  SUCCESS_HEADLINE_FALLBACK,
  SUCCESS_BODY,
} from '@/lib/copy/flow-copy';
import type { Role } from '@/types/waitlist';

interface StepSuccessProps {
  role: Role | null;
}

/**
 * A drawn check inside a thin ring — the ring fades up, the tick draws itself once,
 * quietly. The "Filed" stamp lives on the brief document where it belongs; this card
 * speaks to the person. Instant under reduced motion.
 */
function SuccessMark() {
  const reduce = useReducedMotion();
  return (
    <motion.svg
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
      className="size-12 text-success"
      initial={reduce ? false : { opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      <circle cx="24" cy="24" r="21.5" stroke="currentColor" strokeOpacity="0.35" />
      <motion.path
        d="M15 24.5l6.2 6L33 18"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={reduce ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5, delay: reduce ? 0 : 0.18, ease: [0.16, 1, 0.3, 1] }}
      />
    </motion.svg>
  );
}

/**
 * Act IV — the brief is filed (stamped on the document itself); here the person gets the
 * confirmation. Role-aware headline, honest framing, and a tasteful share action. No
 * account creation, no further asks.
 */
export function StepSuccess({ role }: StepSuccessProps) {
  const [copied, setCopied] = useState(false);

  const headline = role ? SUCCESS_HEADLINES[role] : SUCCESS_HEADLINE_FALLBACK;

  async function handleShare() {
    const url =
      typeof window !== 'undefined' ? window.location.origin : 'https://bytesizedcareers.com';
    try {
      if (navigator.share) {
        await navigator.share({ title: 'ByteSized Careers', url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Share sheet dismissed or clipboard unavailable — no-op.
    }
  }

  return (
    <div className="flex flex-col items-start gap-4 py-2">
      <SuccessMark />

      <h2
        data-step-heading
        tabIndex={-1}
        className="font-serif text-2xl tracking-tight text-ink text-balance"
      >
        {headline}
      </h2>

      <p className="text-sm leading-relaxed text-muted">{SUCCESS_BODY}</p>

      <div className="mt-2 flex w-full flex-col gap-3 border-t border-[color:var(--color-line)] pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted">Know someone whose brief belongs here?</p>
        <Button variant="secondary" onClick={handleShare}>
          <ShareIcon className="size-4" />
          {copied ? 'Link copied ✓' : 'Share'}
        </Button>
      </div>
    </div>
  );
}
