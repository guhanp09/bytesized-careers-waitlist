'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, useTransition } from 'react';
import {
  changeEmailStep,
  submitEmailStep,
  type SubmitEmailData,
} from '@/lib/actions/submit-email';
import { readAttribution } from '@/lib/utils/utm';
import { Button } from '@/components/ui/button';
import { formControlClassName } from '@/components/ui/form-control';
import { cn } from '@/lib/utils/cn';
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
  const [errorField, setErrorField] = useState<'fullName' | 'email' | 'form' | null>(null);
  const [isPending, startTransition] = useTransition();
  const fullNameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isPending || !errorField || errorField === 'form') return;
    (errorField === 'fullName' ? fullNameRef.current : emailRef.current)?.focus({
      preventScroll: true,
    });
  }, [errorField, isPending]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setErrorField(null);
    const attribution = readAttribution();
    startTransition(async () => {
      const result = changeSession
        ? await changeEmailStep({
            fullName,
            email,
            honeypot,
            attribution,
            ...changeSession,
          })
        : await submitEmailStep({ fullName, email, honeypot, attribution });
      if (result.ok) {
        onComplete(result.data);
      } else {
        setError(result.error.message);
        const field = result.error.fieldErrors?.fullName
          ? 'fullName'
          : result.error.fieldErrors?.email
            ? 'email'
            : 'form';
        setErrorField(field);
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
        ref={fullNameRef}
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
          if (hasError) {
            setError(null);
            setErrorField(null);
          }
        }}
        aria-invalid={errorField === 'fullName'}
        aria-describedby={hasError ? 'email-error' : 'email-trust'}
        disabled={isPending}
        className={cn(formControlClassName, 'min-h-13 rounded-md')}
      />

      <label htmlFor="email" className="font-mono text-[10px] font-medium tracking-[0.16em] uppercase text-muted">
        Email address
      </label>

      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          ref={emailRef}
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
            if (hasError) {
              setError(null);
              setErrorField(null);
            }
          }}
          aria-invalid={errorField === 'email'}
          aria-describedby={hasError ? 'email-error' : 'email-trust'}
          disabled={isPending}
          className={cn(
            formControlClassName,
            'min-h-13 shrink-0 rounded-md sm:min-w-0 sm:flex-1',
          )}
        />

        <Button
          type="submit"
          size="lg"
          disabled={isPending}
          className="w-full shrink-0 sm:w-auto"
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
        <p id="email-trust" className="text-xs leading-5 text-faint sm:text-sm">
          We use your email for verification and early-access, launch and invitation updates.
          By selecting Get early access, you confirm you are 18 or older, agree to the{' '}
          <Link href="/early-access/terms" className="text-muted underline underline-offset-4 hover:text-ink">
            Early-Access Terms
          </Link>{' '}
          and acknowledge the{' '}
          <Link href="/early-access/privacy" className="text-muted underline underline-offset-4 hover:text-ink">
            Privacy Notice
          </Link>
          . Optional launch, invitation and relevance emails can be stopped separately from deleting your registration.
        </p>
      )}
    </form>
  );
}
