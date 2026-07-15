'use client';

import { useRef, useState } from 'react';
import { submitPreferencesStep } from '@/lib/actions/submit-preferences';
import { Chip } from '@/components/ui/chip';
import { Button } from '@/components/ui/button';
import { InlineStatus, type StatusState } from '@/components/ui/inline-status';
import { CollapsibleGroup } from '@/components/ui/collapsible-group';
import { OtherField } from '@/components/ui/other-field';
import { CompassIcon, UserPlusIcon, ArrowRightIcon, GROUP_ICON } from '@/components/ui/icons';
import {
  JOB_CATEGORY_GROUPS,
  JOB_CATEGORY_LABELS,
  TALENT_CATEGORY_GROUPS,
  TALENT_CATEGORY_LABELS,
  OTHER_PROMPTS,
  groupOtherValue,
  otherGroupIdOf,
  type CategoryGroupId,
} from '@/lib/validation/constants';
import type { Role } from '@/types/waitlist';

export interface PreferencesData {
  jobCategories: string[];
  talentCategories: string[];
  jobCategoryOthers: Record<string, string>;
  talentCategoryOthers: Record<string, string>;
}

type SavePayload = {
  jobCategories?: string[];
  talentCategories?: string[];
  jobCategoryOthers?: Record<string, string>;
  talentCategoryOthers?: Record<string, string>;
};

interface StepPreferencesProps {
  leadId: string;
  resumeToken: string;
  role: Role;
  data: PreferencesData;
  onChange: (partial: Partial<PreferencesData>) => void;
  onComplete: () => void;
}

const SAVE_DEBOUNCE_MS = 500;
const toggle = (list: string[], v: string) =>
  list.includes(v) ? list.filter((x) => x !== v) : [...list, v];

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
  const pending = useRef<SavePayload>({});

  async function persist(payload: SavePayload): Promise<boolean> {
    if (Object.keys(payload).length === 0) return true;
    setStatus('saving');
    const result = await submitPreferencesStep({ leadId, resumeToken, ...payload });
    if (result.ok) {
      setStatus('saved');
      return true;
    }
    setStatus('error');
    setError(result.error.message);
    return false;
  }

  function scheduleSave(payload: SavePayload) {
    pending.current = { ...pending.current, ...payload };
    if (timer.current) clearTimeout(timer.current);
    setStatus('saving');
    setError(null);
    timer.current = setTimeout(() => {
      const toSave = pending.current;
      pending.current = {};
      void persist(toSave);
    }, SAVE_DEBOUNCE_MS);
  }

  const showWork = role === 'seeker' || (role === 'both' && subStep === 'work');
  const groups = showWork ? JOB_CATEGORY_GROUPS : TALENT_CATEGORY_GROUPS;
  const labels: Record<string, string> = showWork
    ? JOB_CATEGORY_LABELS
    : TALENT_CATEGORY_LABELS;
  const catField = showWork ? 'jobCategories' : 'talentCategories';
  const othersField = showWork ? 'jobCategoryOthers' : 'talentCategoryOthers';
  const selected = showWork ? data.jobCategories : data.talentCategories;
  const othersMap = showWork ? data.jobCategoryOthers : data.talentCategoryOthers;
  const side: 'seeker' | 'recruiter' = showWork ? 'seeker' : 'recruiter';

  function toggleCategory(value: string) {
    const next = toggle(selected, value);
    const otherGid = otherGroupIdOf(value);
    let nextOthers = othersMap;
    if (otherGid && !next.includes(value)) {
      nextOthers = { ...othersMap };
      delete nextOthers[otherGid];
    }
    onChange({ [catField]: next, [othersField]: nextOthers } as Partial<PreferencesData>);
    scheduleSave({ [catField]: next, [othersField]: nextOthers });
  }

  function setGroupOther(groupId: string, text: string) {
    const nextOthers = { ...othersMap, [groupId]: text };
    onChange({ [othersField]: nextOthers } as Partial<PreferencesData>);
    // Send a complete side snapshot so the server can atomically rebuild the versioned
    // structured profile without reading or writing compatibility arrays.
    scheduleSave({ [catField]: selected, [othersField]: nextOthers });
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

  const heading = showWork
    ? role === 'both'
      ? 'First — the work you love'
      : 'What kind of work are you looking for?'
    : role === 'both'
      ? 'And the talent you want'
      : 'What kind of talent do you need?';

  const subcopy = showWork
    ? 'Pick everything that fits — grouped so it stays quick. The more you tell us, the sharper your matches.'
    : "Choose the roles you hire for most. We'll surface people who fit first.";

  const continueLabel = role === 'both' && subStep === 'work' ? 'Next' : 'Continue';

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg border border-accent/30 bg-accent/10 text-accent">
          {showWork ? <CompassIcon className="size-5" /> : <UserPlusIcon className="size-5" />}
        </span>
        <div>
          <h2 data-step-heading tabIndex={-1} className="text-xl font-semibold tracking-tight text-ink">{heading}</h2>
          <p className="mt-1 text-sm text-muted">{subcopy}</p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {groups.map((group, index) => {
          const Icon = GROUP_ICON[group.id];
          const otherValue = groupOtherValue(group.id);
          const otherSelected = selected.includes(otherValue);
          const count =
            group.values.filter((v) => selected.includes(v)).length +
            (otherSelected ? 1 : 0);
          const prompt = OTHER_PROMPTS[group.id as CategoryGroupId]?.[side] ?? 'Tell us more';
          return (
            <CollapsibleGroup
              key={group.id}
              label={group.label}
              count={count}
              defaultOpen={index === 0}
              icon={Icon ? <Icon className="size-4" /> : undefined}
            >
              <div className="flex flex-wrap gap-2" role="group" aria-label={group.label}>
                {group.values.map((value) => (
                  <Chip
                    key={value}
                    label={labels[value] ?? value}
                    selected={selected.includes(value)}
                    onToggle={() => toggleCategory(value)}
                  />
                ))}
                <Chip
                  label="Other"
                  selected={otherSelected}
                  onToggle={() => toggleCategory(otherValue)}
                />
              </div>
              <OtherField
                id={`other-${showWork ? 'job' : 'talent'}-${group.id}`}
                show={otherSelected}
                value={othersMap[group.id] ?? ''}
                prompt={prompt}
                onChange={(v) => setGroupOther(group.id, v)}
              />
            </CollapsibleGroup>
          );
        })}
      </div>

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
          {!submitting ? <ArrowRightIcon className="size-4" /> : null}
        </Button>
      </div>
    </div>
  );
}
