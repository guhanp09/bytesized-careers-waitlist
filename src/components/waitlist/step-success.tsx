'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { Role } from '@/types/waitlist';

interface StepSuccessProps {
  role: Role | null;
}

const HEADLINE_BY_ROLE: Record<Role, string> = {
  seeker: "You're on the list. We'll let you know when relevant creator-economy roles open up.",
  recruiter: "You're on the list. We'll reach out as soon as matching talent is ready for you.",
  both: "You're on the list. We'll keep you posted from both sides of the marketplace.",
};

/**
 * Step 5 — success (plan §5, §6). Role-aware confirmation, what-happens-next, and a tasteful
 * share action. No account creation, no further asks. Says "on the list", never "verified".
 */
export function StepSuccess({ role }: StepSuccessProps) {
  const [copied, setCopied] = useState(false);

  const headline = role
    ? HEADLINE_BY_ROLE[role]
    : "You're on the list. We'll let you know when early access opens up.";

  async function handleShare() {
    try {
      const url =
        typeof window !== 'undefined' ? window.location.origin : 'https://bytesizedcareers.com';
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard may be unavailable — no-op.
    }
  }

  return (
    <div className="flex flex-col items-start gap-4 py-2">
      <span
        aria-hidden="true"
        className="flex size-11 items-center justify-center rounded-full bg-accent/15 text-accent"
      >
        <svg viewBox="0 0 24 24" fill="none" className="size-6">
          <path
            d="M5 12.5l4 4 10-10"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>

      <h2 className="text-xl font-semibold tracking-tight text-ink text-balance">
        {headline}
      </h2>

      <p className="text-sm leading-relaxed text-muted">
        We&apos;re building the founding cohort ahead of public launch. No account
        needed — just watch your inbox.
      </p>

      <div className="mt-2 flex w-full flex-col gap-3 border-t border-[color:var(--color-line)] pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted">Know someone who&apos;d want this?</p>
        <Button variant="secondary" onClick={handleShare}>
          {copied ? 'Link copied ✓' : 'Copy link'}
        </Button>
      </div>
    </div>
  );
}
