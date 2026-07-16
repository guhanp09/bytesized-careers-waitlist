'use client';

import { useState, useTransition } from 'react';
import { submitRoleStep } from '@/lib/actions/submit-role';
import { TapTargetCard } from '@/components/ui/tap-target-card';
import { BriefcaseIcon, UserPlusIcon, SparklesIcon } from '@/components/ui/icons';
import type { Role } from '@/types/waitlist';

const OPTIONS: {
  role: Role;
  label: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    role: 'seeker',
    label: "I'm looking for work",
    description: 'Get matched to creator-economy roles that fit your craft.',
    icon: <BriefcaseIcon />,
  },
  {
    role: 'recruiter',
    label: "I'm looking to hire",
    description: 'Reach vetted creator-economy talent, fast.',
    icon: <UserPlusIcon />,
  },
  {
    role: 'both',
    label: 'A bit of both',
    description: 'You take on work and you build a team.',
    icon: <SparklesIcon />,
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
      <div>
        <h2 data-step-heading tabIndex={-1} className="font-serif text-2xl tracking-tight text-ink">
          First — what brings you here?
        </h2>
        <p className="mt-1 text-sm text-muted">
          One tap. It shapes everything we show you next.
        </p>
      </div>

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
            icon={option.icon}
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
