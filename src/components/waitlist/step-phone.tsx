'use client';

import { useState } from 'react';
import { submitPhoneStep } from '@/lib/actions/submit-phone';
import { Button } from '@/components/ui/button';
import { CountrySelect } from '@/components/ui/country-select';
import { PhoneIcon, ArrowRightIcon } from '@/components/ui/icons';

interface StepPhoneProps {
  leadId: string;
  resumeToken: string;
  onComplete: (phoneProvided: boolean) => void;
}

function detectDefaultCountry(): string {
  if (typeof navigator !== 'undefined') {
    try {
      const region = new Intl.Locale(navigator.language).maximize().region;
      if (region) return region;
    } catch {
      // ignore
    }
  }
  return 'US';
}

/**
 * Phone step: validate + save only. The number is normalized (E.164) and stored — never
 * challenged with a code, and never implied to be verified. Leaving the field empty simply
 * moves on. No promotional consent is accepted or implied.
 */
export function StepPhone({ leadId, resumeToken, onComplete }: StepPhoneProps) {
  const [countryIso, setCountryIso] = useState(detectDefaultCountry);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleFinish() {
    if (busy) return;
    setError(null);
    setBusy(true);
    const trimmed = phoneNumber.trim();
    const result =
      trimmed === ''
        ? await submitPhoneStep({ leadId, resumeToken, skipped: true })
        : await submitPhoneStep({
            leadId,
            resumeToken,
            skipped: false,
            countryIso,
            phoneNumber: trimmed,
          });
    setBusy(false);
    if (result.ok) {
      onComplete(trimmed !== '');
    } else {
      setError(
        result.error.fieldErrors?.phoneNumber?.[0] ?? result.error.message,
      );
    }
  }

  const hasError = error !== null;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg border border-accent/30 bg-accent/10 text-accent">
          <PhoneIcon className="size-5" />
        </span>
        <div>
          <h2 data-step-heading tabIndex={-1} className="font-serif text-2xl tracking-tight text-ink">
            Get first dibs on WhatsApp
          </h2>
          <p className="mt-1 text-sm text-muted">
            Add your number and you&apos;ll hear first as matching opens —
            before it hits your inbox.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <label htmlFor="phone" className="font-mono text-[10px] font-medium tracking-[0.16em] uppercase text-muted">
          Your number
        </label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <CountrySelect
            value={countryIso}
            onChange={setCountryIso}
            disabled={busy}
          />
          <input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="Phone number"
            value={phoneNumber}
            onChange={(e) => {
              setPhoneNumber(e.target.value);
              if (hasError) setError(null);
            }}
            aria-invalid={hasError}
            aria-describedby={hasError ? 'phone-error' : undefined}
            disabled={busy}
            className="h-13 flex-1 rounded-xl border border-[color:var(--color-line)] bg-surface px-4 text-base text-ink placeholder:text-faint focus:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60"
          />
        </div>

        {hasError ? (
          <p id="phone-error" role="alert" className="text-sm text-error">
            {error}
          </p>
        ) : (
          <p className="text-sm text-faint">
            We&apos;ll only use it for match alerts you ask for — never anything else.
          </p>
        )}
      </div>

      <div className="flex items-center justify-end gap-3">
        <Button onClick={handleFinish} disabled={busy}>
          {busy ? 'Saving…' : 'Continue'}
          {!busy ? <ArrowRightIcon className="size-4" /> : null}
        </Button>
      </div>
    </div>
  );
}
