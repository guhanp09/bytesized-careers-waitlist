'use client';

import { useState, useTransition } from 'react';
import {
  changeEmailStep,
  submitEmailStep,
  type SubmitEmailData,
} from '@/lib/actions/submit-email';
import { readAttribution } from '@/lib/utils/utm';
import { Button } from '@/components/ui/button';
import { HoneypotField } from './honeypot-field';

interface StepEmailProps {
  onComplete: (data: SubmitEmailData) => void;
  changeSession?: { leadId: string; resumeToken: string };
  initialFullName?: string;
}

/**
 * Step 1 — name + email capture (plan §5, §6, §11). One strong action, concise
 * trust copy. Success is shown only after the server confirms persistence; on failure
 * the entered value is preserved and a retry is offered (never a false success).
 */
export function StepEmail({ onComplete, changeSession, initialFullName = '' }: StepEmailProps) {
  const [fullName, setFullName] = useState(initialFullName);
  const [email, setEmail] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const attribution = readAttribution();
    startTransition(async () => {
      const result = changeSession
        ? await changeEmailStep({
            fullName,
            email,
            honeypot,
            ...attribution,
            ...changeSession,
          })
        : await submitEmailStep({ fullName, email, honeypot, ...attribution });
      if (result.ok) {
        onComplete(result.data);
      } else {
        setError(result.error.message);
      }
    });
  }

  const hasError = error !== null;

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
      <h2 data-step-heading tabIndex={-1} className="sr-only">
        {changeSession ? 'Change your email' : 'Join the ByteSized Careers waitlist'}
      </h2>
      <label htmlFor="full-name" className="font-mono text-[10px] font-medium tracking-[0.16em] uppercase text-muted">
        Your name
      </label>

      <input
        id="full-name"
        name="fullName"
        type="text"
        autoComplete="name"
        required={!changeSession}
        maxLength={120}
        placeholder="How should we address you?"
        value={fullName}
        onChange={(e) => {
          setFullName(e.target.value);
          if (hasError) setError(null);
        }}
        aria-invalid={hasError}
        aria-describedby={hasError ? 'email-error' : 'email-trust'}
        disabled={isPending}
        className="h-13 w-full rounded-md border border-[color:var(--color-line)] bg-surface px-4 text-base text-ink placeholder:text-faint transition-colors focus:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60"
      />

      <label htmlFor="email" className="font-mono text-[10px] font-medium tracking-[0.16em] uppercase text-muted">
        Email address
      </label>

      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          placeholder="you@email.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (hasError) setError(null);
          }}
          aria-invalid={hasError}
          aria-describedby={hasError ? 'email-error' : 'email-trust'}
          disabled={isPending}
          className="h-13 flex-1 rounded-md border border-[color:var(--color-line)] bg-surface px-4 text-base text-ink placeholder:text-faint transition-colors focus:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60"
        />

        <Button
          type="submit"
          size="lg"
          disabled={isPending}
          className="shrink-0"
        >
          {isPending
            ? changeSession
              ? 'Updating…'
              : 'Joining…'
            : changeSession
              ? 'Update details'
              : 'Get early access'}
        </Button>
      </div>

      <HoneypotField value={honeypot} onChange={setHoneypot} />

      {hasError ? (
        <p id="email-error" role="alert" className="text-sm text-error">
          {error}
        </p>
      ) : (
        <p id="email-trust" className="text-sm text-faint">
          No spam. Unsubscribe anytime. We&apos;ll only reach out when it&apos;s
          relevant to you.
        </p>
      )}
    </form>
  );
}
