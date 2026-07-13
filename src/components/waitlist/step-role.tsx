'use client';

import { useState, useTransition } from 'react';
import { submitRoleStep } from '@/lib/actions/submit-role';
import { TapTargetCard } from '@/components/ui/tap-target-card';
import type { Role } from '@/types/waitlist';

const OPTIONS: { role: Role; label: string; description: string }[] = [
  {
    role: 'seeker',
    label: "I'm looking for work",
    description: 'Get matched to creator-economy roles that fit what you do.',
  },
  {
    role: 'recruiter',
    label: "I'm looking to hire",
    description: 'Reach vetted creator-economy talent.',
  },
  {
    role: 'both',
    label: 'Both',
    description: 'You take on work and you hire.',
  },
];

interface StepRoleProps {
  leadId: string;
  resumeToken: string;
  currentRole: Role | null;
  onComplete: (role: Role) => void;
}

/**
 * Step 2 — role selection (plan §5, §6, §8). Single-choice: tapping a card saves and
 * auto-advances (after the save confirms). A brief selected-state confirmation plays
 * before the transition so the tap feels acknowledged, not swallowed.
 */
export function StepRole({
  leadId,
  resumeToken,
  currentRole,
  onComplete,
}: StepRoleProps) {
  const [selected, setSelected] = useState<Role | null>(currentRole);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function choose(role: Role) {
    if (isPending) return;
    setSelected(role);
    setError(null);
    startTransition(async () => {
      const result = await submitRoleStep({ leadId, resumeToken, role });
      if (result.ok) {
        // Brief confirmation before advancing (plan §8).
        await new Promise((resolve) => setTimeout(resolve, 220));
        onComplete(role);
      } else {
        setSelected(currentRole);
        setError(result.error.message);
      }
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-xl font-semibold tracking-tight text-ink">
        What brings you to ByteSized Careers?
      </h2>

      <div
        role="group"
        aria-label="What brings you to ByteSized Careers?"
        className="flex flex-col gap-3"
      >
        {OPTIONS.map((option) => (
          <TapTargetCard
            key={option.role}
            label={option.label}
            description={option.description}
            selected={selected === option.role}
            disabled={isPending && selected !== option.role}
            onSelect={() => choose(option.role)}
          />
        ))}
      </div>

      {error ? (
        <p role="alert" className="text-sm text-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
