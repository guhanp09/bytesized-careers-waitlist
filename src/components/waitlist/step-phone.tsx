'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { submitPhoneStep } from '@/lib/actions/submit-phone';
import { Button } from '@/components/ui/button';
import { CountrySelect } from '@/components/ui/country-select';
import { formControlClassName } from '@/components/ui/form-control';
import { ArrowRightIcon, MessageIcon, PhoneIcon } from '@/components/ui/icons';
import {
  EMPTY_PHONE_CHANNEL_CHOICES,
  type PhoneChannelChoices,
} from '@/lib/consent/phone';
import {
  normalizePhoneInput,
  phoneNormalizationErrorMessage,
  type PhoneNormalizationResult,
} from '@/lib/validation/phone';
import { cn } from '@/lib/utils/cn';

export interface PhoneStepValue extends PhoneChannelChoices {
  phoneProvided: boolean;
  phoneE164: string;
  phoneCountryIso: string;
}

interface StepPhoneProps {
  leadId: string;
  resumeToken: string;
  initialValue: PhoneStepValue;
  onComplete: (value: PhoneStepValue) => void;
}

const CHANNELS = [
  {
    key: 'whatsappConsent',
    label: 'WhatsApp',
    detail: 'Occasional early-access and relevant opportunity updates on WhatsApp.',
    icon: MessageIcon,
  },
  {
    key: 'smsConsent',
    label: 'SMS',
    detail: 'Occasional text updates about early access and relevant opportunities.',
    icon: MessageIcon,
  },
  {
    key: 'voiceConsent',
    label: 'Phone calls',
    detail: 'Occasional calls about early access or a potentially relevant opportunity.',
    icon: PhoneIcon,
  },
] as const;

function detectDefaultCountry(): string {
  if (typeof navigator !== 'undefined') {
    try {
      const region = new Intl.Locale(navigator.language).maximize().region;
      if (region) return region;
    } catch {
      // Browser locale is only a convenience; the visitor can choose a country.
    }
  }
  return 'US';
}

/** Save an optional phone plus explicit, independently selectable channel choices. */
export function StepPhone({ leadId, resumeToken, initialValue, onComplete }: StepPhoneProps) {
  const reduce = useReducedMotion();
  const initialCountryIso = initialValue.phoneCountryIso || detectDefaultCountry();
  const [countryIso, setCountryIso] = useState(
    initialCountryIso,
  );
  const [phoneNumber, setPhoneNumber] = useState(() => {
    if (!initialValue.phoneE164) return '';
    const normalized = normalizePhoneInput(initialValue.phoneE164, initialCountryIso);
    return normalized.ok ? normalized.nationalNumber : initialValue.phoneE164;
  });
  const [choices, setChoices] = useState<PhoneChannelChoices>({
    whatsappConsent: initialValue.whatsappConsent,
    smsConsent: initialValue.smsConsent,
    voiceConsent: initialValue.voiceConsent,
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const phoneResult = useMemo(
    () => normalizePhoneInput(phoneNumber, countryIso),
    [countryIso, phoneNumber],
  );
  const normalizedPhone = phoneResult.ok ? phoneResult : null;
  const phoneIsValid = phoneResult.ok;

  function immediateInputError(result: PhoneNormalizationResult): string | null {
    if (result.ok) return null;
    if (
      result.reason === 'invalid_characters' ||
      result.reason === 'country_mismatch' ||
      result.reason === 'unsupported_country'
    ) {
      return phoneNormalizationErrorMessage(result.reason);
    }
    return null;
  }

  function clearChoicesWhenInvalid(result: PhoneNormalizationResult) {
    if (!result.ok) setChoices(EMPTY_PHONE_CHANNEL_CHOICES);
  }

  function updateChoice(key: keyof PhoneChannelChoices, checked: boolean) {
    if (!phoneIsValid || busy) return;
    setChoices((current) => ({ ...current, [key]: checked }));
  }

  async function handleFinish() {
    if (busy) return;
    const trimmed = phoneNumber.trim();
    if (trimmed !== '' && !phoneResult.ok) {
      setError(phoneNormalizationErrorMessage(phoneResult.reason));
      setChoices(EMPTY_PHONE_CHANNEL_CHOICES);
      return;
    }

    setError(null);
    setBusy(true);
    const result =
      trimmed === ''
        ? await submitPhoneStep({ leadId, resumeToken, skipped: true })
        : await submitPhoneStep({
            leadId,
            resumeToken,
            skipped: false,
            countryIso,
            phoneNumber: trimmed,
            ...choices,
          });
    setBusy(false);
    if (result.ok) {
      onComplete({
        phoneProvided: trimmed !== '',
        phoneE164: normalizedPhone?.e164 ?? '',
        phoneCountryIso: normalizedPhone?.countryIso ?? countryIso,
        ...(trimmed === '' ? EMPTY_PHONE_CHANNEL_CHOICES : choices),
      });
    } else {
      setError(result.error.fieldErrors?.phoneNumber?.[0] ?? result.error.message);
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
            Add a phone contact
          </h2>
          <p className="mt-1 text-sm text-muted">
            Add your number for early access updates and relevant work or hiring leads
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
            onChange={(nextCountry) => {
              setCountryIso(nextCountry);
              const nextResult = normalizePhoneInput(phoneNumber, nextCountry);
              clearChoicesWhenInvalid(nextResult);
              setError(phoneNumber.trim() ? immediateInputError(nextResult) : null);
            }}
            disabled={busy}
          />
          <input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="Phone number"
            maxLength={40}
            value={phoneNumber}
            onChange={(event) => {
              const nextNumber = event.target.value;
              setPhoneNumber(nextNumber);
              const nextResult = normalizePhoneInput(nextNumber, countryIso);
              clearChoicesWhenInvalid(nextResult);
              setError(nextNumber.trim() ? immediateInputError(nextResult) : null);
            }}
            onPaste={(event) => {
              const pasted = event.clipboardData.getData('text');
              if (!pasted) return;
              event.preventDefault();
              const nextResult = normalizePhoneInput(pasted, countryIso);
              clearChoicesWhenInvalid(nextResult);
              if (nextResult.ok) {
                setPhoneNumber(nextResult.nationalNumber);
                setError(null);
              } else {
                setPhoneNumber(pasted.trim());
                setError(phoneNormalizationErrorMessage(nextResult.reason));
              }
            }}
            onBlur={() => {
              if (!phoneNumber.trim()) {
                setError(null);
                return;
              }
              if (phoneResult.ok) {
                setPhoneNumber(phoneResult.nationalNumber);
                setError(null);
              } else {
                setError(phoneNormalizationErrorMessage(phoneResult.reason));
              }
            }}
            aria-invalid={hasError}
            aria-describedby={hasError ? 'phone-error' : undefined}
            disabled={busy}
            className={cn(formControlClassName, 'min-h-13 shrink-0 rounded-xl sm:min-w-0 sm:flex-1')}
          />
        </div>

        {hasError ? <p id="phone-error" role="alert" className="text-sm text-error">{error}</p> : null}
      </div>

      <AnimatePresence initial={false}>
        {phoneIsValid ? (
          <motion.fieldset
            key="phone-channels"
            initial={{ opacity: 0, height: reduce ? 'auto' : 0, y: reduce ? 0 : 6 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: reduce ? 'auto' : 0, y: 0 }}
            transition={{ duration: reduce ? 0 : 0.24, ease: [0.16, 1, 0.3, 1] }}
            className="min-w-0 overflow-hidden"
          >
            <legend className="font-serif text-lg tracking-tight text-ink">How may we reach you?</legend>
            <div className="mt-3 grid gap-2.5">
              {CHANNELS.map(({ key, label, detail, icon: Icon }) => (
                <label
                  key={key}
                  className="group flex min-h-16 cursor-pointer items-start gap-3 rounded-xl border border-[color:var(--color-line)] bg-black/10 p-3.5 transition-colors has-[:checked]:border-accent/55 has-[:checked]:bg-accent/[0.08] focus-within:ring-2 focus-within:ring-accent/70 focus-within:ring-offset-2 focus-within:ring-offset-surface hover:border-[color:var(--color-line-strong)]"
                >
                  <span className="relative mt-0.5 size-5 shrink-0">
                    <input
                      id={`phone-${key}`}
                      type="checkbox"
                      checked={choices[key]}
                      onChange={(event) => updateChoice(key, event.target.checked)}
                      disabled={!phoneIsValid || busy}
                      className="peer absolute inset-0 size-5 appearance-none rounded-[0.35rem] border border-[color:var(--color-line-strong)] bg-black/20 transition-colors checked:border-accent checked:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed"
                    />
                    <span aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center justify-center text-[13px] font-bold text-canvas opacity-0 peer-checked:opacity-100">✓</span>
                  </span>
                  <Icon className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden="true" />
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-medium text-ink">
                      {label}
                      {choices[key] ? <span className="text-[10px] font-semibold tracking-[0.12em] text-accent uppercase">Selected</span> : null}
                    </span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-muted">{detail}</span>
                  </span>
                </label>
              ))}
            </div>
            <p className="mt-3 text-xs leading-relaxed text-faint">
              You can withdraw any choice at any time by emailing{' '}
              <a href="mailto:legal@bytesizedcareers.com" className="text-accent underline-offset-4 hover:underline">
                legal@bytesizedcareers.com
              </a>. Standard carrier charges may apply if a channel is activated later.
            </p>
          </motion.fieldset>
        ) : phoneNumber.trim() !== '' ? (
          <motion.p
            key="phone-channels-prompt"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="rounded-xl border border-[color:var(--color-line)] bg-black/10 px-3.5 py-3 text-sm text-faint"
          >
            Finish entering a valid number to choose contact channels.
          </motion.p>
        ) : null}
      </AnimatePresence>

      <div className="flex items-center justify-end gap-3">
        <Button onClick={handleFinish} disabled={busy}>
          {busy ? 'Saving…' : 'Continue'}
          {!busy ? <ArrowRightIcon className="size-4" /> : null}
        </Button>
      </div>
    </div>
  );
}
