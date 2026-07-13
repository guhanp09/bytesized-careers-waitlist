'use client';

import { useState } from 'react';
import { submitPhoneStep } from '@/lib/actions/submit-phone';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { CountrySelect } from '@/components/ui/country-select';
import { WHATSAPP_CONSENT_LABEL } from '@/lib/consent';

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
 * Step 4 — phone + WhatsApp consent (plan §5, §6, §16). Benefit is explained before the
 * field. Phone is optional with a prominent "Skip for now". Consent starts unchecked and is
 * never implied by entering a number. Both paths complete the signup.
 */
export function StepPhone({ leadId, resumeToken, onComplete }: StepPhoneProps) {
  const [countryIso, setCountryIso] = useState(detectDefaultCountry);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [whatsappConsent, setWhatsappConsent] = useState(false);
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
            whatsappConsent,
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

  async function handleSkip() {
    if (busy) return;
    setError(null);
    setBusy(true);
    const result = await submitPhoneStep({ leadId, resumeToken, skipped: true });
    setBusy(false);
    if (result.ok) {
      onComplete(false);
    } else {
      setError(result.error.message);
    }
  }

  const hasError = error !== null;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-ink">
          Want priority alerts on WhatsApp?
        </h2>
        <p className="mt-1 text-sm text-muted">
          Get faster alerts when opportunities matching your interests become
          available. This is optional.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <label htmlFor="phone" className="text-sm font-medium text-muted">
          Phone number <span className="text-faint">(optional)</span>
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

        <Checkbox
          id="whatsapp-consent"
          checked={whatsappConsent}
          onChange={setWhatsappConsent}
          disabled={busy}
          label={WHATSAPP_CONSENT_LABEL}
        />

        {hasError ? (
          <p id="phone-error" role="alert" className="text-sm text-error">
            {error}
          </p>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" onClick={handleSkip} disabled={busy}>
          Skip for now
        </Button>
        <Button onClick={handleFinish} disabled={busy}>
          {busy ? 'Finishing…' : 'Finish'}
        </Button>
      </div>
    </div>
  );
}
