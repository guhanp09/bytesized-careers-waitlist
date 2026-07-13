'use client';

import { useRef, useState } from 'react';
import { submitPreferencesStep } from '@/lib/actions/submit-preferences';
import { Chip } from '@/components/ui/chip';
import { Button } from '@/components/ui/button';
import { InlineStatus, type StatusState } from '@/components/ui/inline-status';
import {
  CATEGORY_VALUES,
  CATEGORY_LABELS,
  WORK_FORMAT_VALUES,
  WORK_FORMAT_LABELS,
  ORG_TYPE_VALUES,
  ORG_TYPE_LABELS,
} from '@/lib/validation/constants';
import type { Role } from '@/types/waitlist';

export interface PreferencesData {
  jobCategories: string[];
  workFormats: string[];
  talentCategories: string[];
  organisationTypes: string[];
}

type PrefField = keyof PreferencesData;

interface StepPreferencesProps {
  leadId: string;
  resumeToken: string;
  role: Role;
  data: PreferencesData;
  onChange: (partial: Partial<PreferencesData>) => void;
  onComplete: () => void;
}

const SAVE_DEBOUNCE_MS = 500;

function toggle(list: string[], value: string): string[] {
  return list.includes(value)
    ? list.filter((v) => v !== value)
    : [...list, value];
}

/**
 * Step 3 — interests, adapted to role (plan §5, §6, §11).
 *   seeker    → job categories (+ optional work format)
 *   recruiter → talent categories (+ optional organisation type)
 *   both      → 3a "your work" → 3b "who you hire" (two short screens, one DB step 3)
 *
 * Selections autosave on a debounce; "Continue" flushes any pending save and only advances
 * once the server confirms. Continue is always enabled (zero selections allowed).
 */
export function StepPreferences({
  leadId,
  resumeToken,
  role,
  data,
  onChange,
  onComplete,
}: StepPreferencesProps) {
  const [subStep, setSubStep] = useState<'work' | 'hire'>('work');
  const [status, setStatus] = useState<StatusState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = useRef<Partial<PreferencesData>>({});

  async function persist(partial: Partial<PreferencesData>): Promise<boolean> {
    if (Object.keys(partial).length === 0) return true;
    setStatus('saving');
    const result = await submitPreferencesStep({ leadId, resumeToken, ...partial });
    if (result.ok) {
      setStatus('saved');
      return true;
    }
    setStatus('error');
    setError(result.error.message);
    return false;
  }

  function scheduleSave(partial: Partial<PreferencesData>) {
    pending.current = { ...pending.current, ...partial };
    if (timer.current) clearTimeout(timer.current);
    setStatus('saving');
    setError(null);
    timer.current = setTimeout(() => {
      const toSave = pending.current;
      pending.current = {};
      void persist(toSave);
    }, SAVE_DEBOUNCE_MS);
  }

  function handleToggle(field: PrefField, value: string) {
    const next = toggle(data[field], value);
    const partial = { [field]: next } as Partial<PreferencesData>;
    onChange(partial);
    scheduleSave(partial);
  }

  async function handleContinue() {
    if (submitting) return;
    setSubmitting(true);
    if (timer.current) clearTimeout(timer.current);
    const toSave = pending.current;
    pending.current = {};
    const ok = await persist(toSave);
    setSubmitting(false);
    if (!ok) return;
    if (role === 'both' && subStep === 'work') {
      setSubStep('hire');
      setStatus('idle');
    } else {
      onComplete();
    }
  }

  const categoryChips = (field: 'jobCategories' | 'talentCategories') => (
    <div className="flex flex-wrap gap-2" role="group">
      {CATEGORY_VALUES.map((value) => (
        <Chip
          key={value}
          label={CATEGORY_LABELS[value]}
          selected={data[field].includes(value)}
          onToggle={() => handleToggle(field, value)}
        />
      ))}
    </div>
  );

  const workFormatChips = (
    <div className="flex flex-wrap gap-2" role="group">
      {WORK_FORMAT_VALUES.map((value) => (
        <Chip
          key={value}
          label={WORK_FORMAT_LABELS[value]}
          selected={data.workFormats.includes(value)}
          onToggle={() => handleToggle('workFormats', value)}
        />
      ))}
    </div>
  );

  const orgTypeChips = (
    <div className="flex flex-wrap gap-2" role="group">
      {ORG_TYPE_VALUES.map((value) => (
        <Chip
          key={value}
          label={ORG_TYPE_LABELS[value]}
          selected={data.organisationTypes.includes(value)}
          onToggle={() => handleToggle('organisationTypes', value)}
        />
      ))}
    </div>
  );

  // Determine what this screen shows.
  const showWork = role === 'seeker' || (role === 'both' && subStep === 'work');
  const showHire = role === 'recruiter' || (role === 'both' && subStep === 'hire');

  const heading = showWork
    ? role === 'both'
      ? 'First — what kind of work interests you?'
      : 'What kind of opportunities would you like to hear about?'
    : role === 'both'
      ? 'And who are you looking to hire?'
      : 'What kind of talent do you expect to hire?';

  const subcopy =
    role === 'both'
      ? showWork
        ? 'This is about you.'
        : 'Now the other side.'
      : 'Pick as many as apply. You can always change this later.';

  const continueLabel =
    role === 'both' && subStep === 'work' ? 'Next' : 'Continue';

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-ink">{heading}</h2>
        <p className="mt-1 text-sm text-muted">{subcopy}</p>
      </div>

      {showWork && (
        <>
          {categoryChips('jobCategories')}
          <fieldset className="mt-2">
            <legend className="mb-2 text-sm font-medium text-muted">
              Preferred work format{' '}
              <span className="text-faint">(optional)</span>
            </legend>
            {workFormatChips}
          </fieldset>
        </>
      )}

      {showHire && (
        <>
          {categoryChips('talentCategories')}
          <fieldset className="mt-2">
            <legend className="mb-2 text-sm font-medium text-muted">
              Your organisation <span className="text-faint">(optional)</span>
            </legend>
            {orgTypeChips}
          </fieldset>
        </>
      )}

      {error ? (
        <p role="alert" className="text-sm text-error">
          {error}
        </p>
      ) : (
        <InlineStatus state={status} />
      )}

      <div className="flex items-center justify-end">
        <Button type="button" onClick={handleContinue} disabled={submitting}>
          {submitting ? 'Saving…' : continueLabel}
        </Button>
      </div>
    </div>
  );
}
