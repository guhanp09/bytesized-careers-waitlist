'use client';

import { Button } from '@/components/ui/button';

interface ResumePromptProps {
  emailMasked: string;
  onContinue: () => void;
  onStartOver: () => void;
}

/**
 * Resume prompt (plan §12). Shown when a valid resume token is found on load. Displays a
 * MASKED email only and requires an explicit choice — never auto-resumes, so a shared
 * device does not expose who was mid-signup.
 */
export function ResumePrompt({
  emailMasked,
  onContinue,
  onStartOver,
}: ResumePromptProps) {
  return (
    <div className="flex flex-col gap-4 py-2">
      <div>
        <h2 data-step-heading tabIndex={-1} className="text-lg font-semibold tracking-tight text-ink">
          Welcome back
        </h2>
        <p className="mt-1 text-sm text-muted">
          Continue where you left off as{' '}
          <span className="text-ink">{emailMasked}</span>?
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button onClick={onContinue}>Continue</Button>
        <Button variant="ghost" onClick={onStartOver}>
          Start over
        </Button>
      </div>
    </div>
  );
}
