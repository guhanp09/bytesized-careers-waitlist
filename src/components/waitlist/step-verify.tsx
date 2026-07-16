'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { CheckCircleIcon, ShieldCheckIcon } from '@/components/ui/icons';
import type { ActionResult } from '@/types/waitlist';
import type { RequestCodeData, VerifySubmitResult } from '@/lib/actions/verify-shared';

interface StepVerifyProps {
  leadId: string;
  resumeToken: string;
  channel: 'email' | 'phone';
  title: string;
  benefit: string;
  targetLabel: string;
  requestCode: (input: {
    leadId: string;
    resumeToken: string;
  }) => Promise<ActionResult<RequestCodeData>>;
  submitCode: (input: {
    leadId: string;
    resumeToken: string;
    code: string;
  }) => Promise<VerifySubmitResult>;
  onVerified: () => void;
  onSkip: () => void;
  onChangeContact?: () => void;
  changeLabel?: string;
}

type DeliveryUiState =
  | 'sending'
  | 'sent'
  | 'dev_logged'
  | 'uncertain'
  | 'unavailable'
  | 'failed'
  | 'verified';

/** Provider-confirmed, reusable six-digit verification UI for email and local/mock phone. */
export function StepVerify({
  leadId,
  resumeToken,
  channel,
  title,
  benefit,
  targetLabel,
  requestCode,
  submitCode,
  onVerified,
  onSkip,
  onChangeContact,
  changeLabel,
}: StepVerifyProps) {
  const reduce = useReducedMotion();
  const [delivery, setDelivery] = useState<DeliveryUiState>('sending');
  const [devCode, setDevCode] = useState<string | null>(null);
  const [resolvedTarget, setResolvedTarget] = useState(targetLabel);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [requesting, setRequesting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const requestedRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const completeVerified = useCallback(() => {
    setDelivery('verified');
    setError(null);
    successTimerRef.current = setTimeout(onVerified, reduce ? 80 : 650);
  }, [onVerified, reduce]);

  useEffect(
    () => () => {
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
    },
    [],
  );

  const doRequest = useCallback(async () => {
    setRequesting(true);
    setDelivery('sending');
    setError(null);
    const result = await requestCode({ leadId, resumeToken });
    setRequesting(false);
    if (!result.ok) {
      setError(result.error.message);
      setDelivery('failed');
      return;
    }
    if (result.data.target) setResolvedTarget(result.data.target);
    if (result.data.cooldownMs > 0) {
      setCooldown(Math.ceil(result.data.cooldownMs / 1000));
    }
    if (result.data.alreadyVerified) {
      completeVerified();
      return;
    }
    if (result.data.devCode) setDevCode(result.data.devCode);
    const next: Record<RequestCodeData['deliveryStatus'], DeliveryUiState> = {
      sending: 'sending',
      accepted: 'sent',
      dev_logged: 'dev_logged',
      uncertain: 'uncertain',
      unavailable: 'unavailable',
    };
    setDelivery(next[result.data.deliveryStatus]);
  }, [completeVerified, leadId, requestCode, resumeToken]);

  useEffect(() => {
    if (requestedRef.current) return;
    requestedRef.current = true;
    void doRequest();
  }, [doRequest]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(
      () => setCooldown((current) => (current <= 1 ? 0 : current - 1)),
      1000,
    );
    return () => clearInterval(timer);
  }, [cooldown]);

  const submit = useCallback(
    async (value: string) => {
      if (verifying || value.length !== 6) return;
      setVerifying(true);
      setError(null);
      const result = await submitCode({ leadId, resumeToken, code: value });
      setVerifying(false);
      if (result.ok) {
        completeVerified();
        return;
      }
      setError(result.message);
      setCode('');
      if (
        result.reason === 'expired' ||
        result.reason === 'too_many_attempts' ||
        result.reason === 'not_pending'
      ) {
        setDelivery('failed');
      } else {
        requestAnimationFrame(() => inputRef.current?.focus({ preventScroll: true }));
      }
    },
    [completeVerified, leadId, resumeToken, submitCode, verifying],
  );

  function handleCodeChange(raw: string) {
    const digits = raw.replace(/\D/g, '').slice(0, 6);
    setCode(digits);
    if (error) setError(null);
    if (digits.length === 6) void submit(digits);
  }

  function handleCodePaste(event: React.ClipboardEvent<HTMLInputElement>) {
    const digits = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (digits.length === 0) return;
    event.preventDefault();
    handleCodeChange(digits);
  }

  async function handleResend() {
    if (cooldown > 0 || requesting || verifying) return;
    setDevCode(null);
    setCode('');
    await doRequest();
  }

  const heading = (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg border border-accent/30 bg-accent/10 text-accent">
        <ShieldCheckIcon className="size-5" />
      </span>
      <div>
        <h2
          data-step-heading
          tabIndex={-1}
          className="font-serif text-2xl tracking-tight text-ink"
        >
          {title}
        </h2>
        <p className="mt-1 text-sm text-muted">{benefit}</p>
      </div>
    </div>
  );

  if (delivery === 'verified') {
    return (
      <div className="flex min-h-44 flex-col items-center justify-center gap-3 text-center" role="status" aria-live="polite">
        <span className="flex size-11 items-center justify-center rounded-full bg-success/15 text-success">
          <CheckCircleIcon className="size-6" />
        </span>
        <h2 data-step-heading tabIndex={-1} className="font-serif text-2xl tracking-tight text-ink">
          {channel === 'email' ? 'Email confirmed' : 'Number confirmed'}
        </h2>
        <p className="text-sm text-muted">All set — taking you to the next step.</p>
      </div>
    );
  }

  if (delivery === 'unavailable') {
    return (
      <div className="flex flex-col gap-5">
        {heading}
        <div className="rounded-xl border border-[color:var(--color-line)] bg-surface/60 p-4" role="status">
          <p className="text-sm text-ink">You&apos;re already on the waitlist.</p>
          <p className="mt-1 text-sm text-muted">
            {channel === 'email'
              ? 'Email confirmation is not available right now. You can continue without losing your place.'
              : 'Number confirmation is not available right now. You can continue without losing your place.'}
          </p>
        </div>
        <div className="flex items-center justify-between gap-3">
          {onChangeContact ? (
            <button type="button" onClick={onChangeContact} className="inline-flex min-h-11 items-center text-sm text-muted hover:text-ink">
              {changeLabel ?? 'Change'}
            </button>
          ) : <span />}
          <Button onClick={onSkip}>Continue</Button>
        </div>
      </div>
    );
  }

  if (delivery === 'failed') {
    return (
      <div className="flex flex-col gap-5">
        {heading}
        <div className="rounded-xl border border-error/30 bg-error/5 p-4" role="alert">
          <p className="text-sm font-medium text-ink">The code wasn&apos;t sent.</p>
          <p className="mt-1 text-sm text-muted">
            {error ?? 'Your waitlist place is safe. Try again or continue for now.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <button type="button" onClick={onSkip} className="inline-flex min-h-11 items-center text-sm text-faint hover:text-muted">
              Continue for now
            </button>
            {onChangeContact ? (
              <button type="button" onClick={onChangeContact} className="inline-flex min-h-11 items-center text-sm text-muted hover:text-ink">
                {changeLabel ?? 'Change'}
              </button>
            ) : null}
          </div>
          <Button onClick={handleResend} disabled={requesting || cooldown > 0}>
            {cooldown > 0 ? `Retry in ${cooldown}s` : requesting ? 'Retrying…' : 'Retry send'}
          </Button>
        </div>
      </div>
    );
  }

  const canEnterCode =
    delivery === 'sent' || delivery === 'dev_logged' || delivery === 'uncertain';
  const deliveryMessage =
    delivery === 'sending'
      ? `Sending a code to ${resolvedTarget}…`
      : delivery === 'uncertain'
        ? `We couldn’t confirm delivery to ${resolvedTarget}. If a code arrives, enter it below.`
        : `Code sent to ${resolvedTarget}`;

  return (
    <div className="flex flex-col gap-5">
      {heading}

      <p
        id="verify-delivery-status"
        role="status"
        aria-live="polite"
        className={`${delivery === 'uncertain' ? 'text-sm text-muted' : 'text-sm text-faint'} [overflow-wrap:anywhere]`}
      >
        {deliveryMessage}
      </p>

      {devCode ? (
        <div className="rounded-xl border border-dashed border-accent/50 bg-accent/5 px-4 py-3">
          <p className="text-xs font-semibold tracking-wide text-accent uppercase">
            Dev only · no real {channel === 'email' ? 'email' : 'message'} sent
          </p>
          <p className="mt-1 text-sm text-ink">
            Your test code is{' '}
            <span className="font-mono text-base tracking-widest text-accent">{devCode}</span>
          </p>
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        <label htmlFor="verify-code" className="text-sm font-medium text-muted">
          Enter the 6-digit code
        </label>
        <input
          ref={inputRef}
          id="verify-code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="\d{6}"
          maxLength={6}
          value={code}
          disabled={!canEnterCode || verifying}
          onChange={(event) => handleCodeChange(event.target.value)}
          onPaste={handleCodePaste}
          placeholder="••••••"
          aria-invalid={error !== null}
          aria-describedby={`verify-delivery-status${error ? ' verify-error' : ''}`}
          className="min-h-14 w-full rounded-xl border border-[color:var(--color-line)] bg-surface px-4 text-center font-mono text-2xl tracking-[0.4em] text-ink placeholder:text-faint focus:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60"
        />
        {error ? (
          <p id="verify-error" role="alert" className="text-sm text-error">
            {error}
          </p>
        ) : (
          <p className="min-h-5 text-sm text-faint" aria-live="polite">
            {verifying ? 'Verifying…' : ''}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
        <button
          type="button"
          onClick={handleResend}
          disabled={cooldown > 0 || requesting || verifying}
          className="inline-flex min-h-11 items-center text-accent hover:underline disabled:text-faint disabled:no-underline"
        >
          {cooldown > 0 ? `Resend in ${cooldown}s` : requesting ? 'Sending…' : 'Resend code'}
        </button>
        {onChangeContact ? (
          <button type="button" onClick={onChangeContact} className="inline-flex min-h-11 items-center text-muted hover:text-ink">
            {changeLabel ?? 'Change'}
          </button>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-[color:var(--color-line)] pt-4">
        <button
          type="button"
          onClick={onSkip}
          disabled={verifying}
          className="inline-flex min-h-11 items-center text-sm text-faint transition-colors hover:text-muted disabled:opacity-50"
        >
          Continue for now
        </button>
        <Button onClick={() => submit(code)} disabled={verifying || code.length !== 6}>
          {verifying ? 'Verifying…' : 'Verify'}
        </Button>
      </div>
    </div>
  );
}
