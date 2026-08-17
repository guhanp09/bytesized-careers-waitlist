'use client';

import { useCallback, useState } from 'react';
import { submitPreferencesStep } from '@/lib/actions/submit-preferences';
import { Chip } from '@/components/ui/chip';
import { Button } from '@/components/ui/button';
import { InlineStatus } from '@/components/ui/inline-status';
import { CollapsibleGroup } from '@/components/ui/collapsible-group';
import { OtherField } from '@/components/ui/other-field';
import { CompassIcon, UserPlusIcon, ArrowRightIcon, GROUP_ICON } from '@/components/ui/icons';
import { useDeferredSave, type DeferredSaveResult } from './use-deferred-save';
import { missingCustomAnswers, sanitizeNeedSelection } from '@/lib/leads/needs';
import { MISSING_CUSTOM_ANSWER_MESSAGE } from '@/lib/validation/preferences';
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
  const [submitting, setSubmitting] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  /** Group ids whose required "Other" answer is missing, surfaced after a blocked Continue. */
  const [invalidGroups, setInvalidGroups] = useState<string[]>([]);

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
  const fieldId = (groupId: string) =>
    `other-${showWork ? 'job' : 'talent'}-${groupId}`;

  // A whole step is one write. Anything the visitor picks is staged locally and sent when
  // they continue, so picking forty chips costs one request instead of forty.
  const persist = useCallback(
    async (payload: SavePayload): Promise<DeferredSaveResult> => {
      const result = await submitPreferencesStep({ leadId, resumeToken, ...payload });
      return result.ok ? { ok: true } : { ok: false, message: result.error.message };
    },
    [leadId, resumeToken],
  );
  const { status, error: saveError, staged, stage, flush } = useDeferredSave(persist);

  /**
   * Stage the complete side snapshot so the server can atomically rebuild the versioned
   * profile. "Other" markers without an answer are dropped here: the Continue path has
   * already validated them, and the leave-the-step safety net must never write a blank one.
   */
  function stageSide(nextSelected: string[], nextOthers: Record<string, string>) {
    const clean = sanitizeNeedSelection(nextSelected, nextOthers);
    stage({
      [catField]: clean.selections,
      [othersField]: clean.customResponses,
    } as SavePayload);
  }

  function toggleCategory(value: string) {
    const next = toggle(selected, value);
    const otherGid = otherGroupIdOf(value);
    let nextOthers = othersMap;
    if (otherGid && !next.includes(value)) {
      nextOthers = { ...othersMap };
      delete nextOthers[otherGid];
      setInvalidGroups((prev) => prev.filter((id) => id !== otherGid));
    }
    onChange({ [catField]: next, [othersField]: nextOthers } as Partial<PreferencesData>);
    stageSide(next, nextOthers);
  }

  function setGroupOther(groupId: string, text: string) {
    const nextOthers = { ...othersMap, [groupId]: text };
    onChange({ [othersField]: nextOthers } as Partial<PreferencesData>);
    if (text.trim()) setInvalidGroups((prev) => prev.filter((id) => id !== groupId));
    stageSide(selected, nextOthers);
  }

  async function handleContinue() {
    if (submitting) return;

    // Selecting "Other" commits to telling us what we missed — block until it is answered.
    const missing = missingCustomAnswers(selected, othersMap);
    if (missing.length > 0) {
      setInvalidGroups(missing);
      const first = missing[0]!;
      setOpenGroups((prev) => ({ ...prev, [`${side}:${first}`]: true }));
      requestAnimationFrame(() => {
        document.getElementById(fieldId(first))?.focus({ preventScroll: false });
      });
      return;
    }

    setSubmitting(true);
    const ok = await flush();
    setSubmitting(false);
    if (!ok) return;
    if (role === 'both' && subStep === 'work') {
      setSubStep('hire');
      setInvalidGroups([]);
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
  const blockedByOther = invalidGroups.length > 0;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg border border-accent/30 bg-accent/10 text-accent">
          {showWork ? <CompassIcon className="size-5" /> : <UserPlusIcon className="size-5" />}
        </span>
        <div>
          <h2 data-step-heading tabIndex={-1} className="font-serif text-2xl tracking-tight text-ink">{heading}</h2>
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
          const groupKey = `${side}:${group.id}`;
          return (
            <CollapsibleGroup
              key={group.id}
              label={group.label}
              count={count}
              icon={Icon ? <Icon className="size-4" /> : undefined}
              open={openGroups[groupKey] ?? index === 0}
              onOpenChange={(next) =>
                setOpenGroups((prev) => ({ ...prev, [groupKey]: next }))
              }
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
                id={fieldId(group.id)}
                show={otherSelected}
                value={othersMap[group.id] ?? ''}
                prompt={prompt}
                onChange={(v) => setGroupOther(group.id, v)}
                error={
                  invalidGroups.includes(group.id) ? MISSING_CUSTOM_ANSWER_MESSAGE : null
                }
              />
            </CollapsibleGroup>
          );
        })}
      </div>

      {saveError ? (
        <p role="alert" className="text-sm text-error">
          {saveError}
        </p>
      ) : blockedByOther ? (
        <p role="alert" className="text-sm text-error">
          {MISSING_CUSTOM_ANSWER_MESSAGE}
        </p>
      ) : status === 'idle' && staged ? (
        <p className="text-sm text-faint">
          Your choices are saved when you continue.
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
