'use client';

import { useRef, useState } from 'react';
import { submitContextStep } from '@/lib/actions/submit-context';
import { Chip } from '@/components/ui/chip';
import { Button } from '@/components/ui/button';
import { InlineStatus, type StatusState } from '@/components/ui/inline-status';
import { OtherField } from '@/components/ui/other-field';
import { formControlClassName } from '@/components/ui/form-control';
import { cn } from '@/lib/utils/cn';
import {
  LayersIcon, BriefcaseIcon, UserPlusIcon, FilmIcon, SparklesIcon,
  TrendingUpIcon, UsersIcon, ArrowRightIcon,
} from '@/components/ui/icons';
import {
  WORK_FORMAT_VALUES, WORK_FORMAT_LABELS,
  ORG_TYPE_VALUES, ORG_TYPE_LABELS,
  PLATFORM_VALUES, PLATFORM_LABELS,
  NICHE_VALUES, NICHE_LABELS,
  EXPERIENCE_LEVEL_VALUES, EXPERIENCE_LEVEL_LABELS,
  AVAILABILITY_VALUES, AVAILABILITY_LABELS,
  HIRING_TIMELINE_VALUES, HIRING_TIMELINE_LABELS,
  TEAM_SIZE_VALUES, TEAM_SIZE_LABELS,
} from '@/lib/validation/constants';
import type { Role } from '@/types/waitlist';

export interface ContextData {
  workFormats: string[];
  organisationTypes: string[];
  platforms: string[];
  niches: string[];
  platformOther: string;
  nicheOther: string;
  experienceLevel: string | null;
  availabilityToStart: string | null;
  portfolioUrl: string;
  hiringTimeline: string | null;
  teamSize: string | null;
  companyUrl: string;
}

interface StepContextProps {
  leadId: string;
  resumeToken: string;
  role: Role;
  data: ContextData;
  onChange: (partial: Partial<ContextData>) => void;
  onComplete: () => void;
}

const SAVE_DEBOUNCE_MS = 500;
const toggle = (list: string[], v: string) =>
  list.includes(v) ? list.filter((x) => x !== v) : [...list, v];

function SectionLabel({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-2 text-sm font-medium text-muted">
      <span className="text-faint">{icon}</span>
      {children}
    </p>
  );
}

export function StepContext({ leadId, resumeToken, role, data, onChange, onComplete }: StepContextProps) {
  const [status, setStatus] = useState<StatusState>('idle');
  const [submitting, setSubmitting] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = useRef<Record<string, unknown>>({});

  async function persist(payload: Record<string, unknown>): Promise<boolean> {
    if (Object.keys(payload).length === 0) return true;
    setStatus('saving');
    const result = await submitContextStep({ leadId, resumeToken, ...payload });
    setStatus(result.ok ? 'saved' : 'error');
    return result.ok;
  }
  function scheduleSave(payload: Record<string, unknown>) {
    pending.current = { ...pending.current, ...payload };
    if (timer.current) clearTimeout(timer.current);
    setStatus('saving');
    timer.current = setTimeout(() => {
      const toSave = pending.current;
      pending.current = {};
      void persist(toSave);
    }, SAVE_DEBOUNCE_MS);
  }

  function toggleMulti(field: 'platforms' | 'niches' | 'workFormats', value: string) {
    const next = toggle(data[field], value);
    const patch: Record<string, unknown> = { [field]: next };
    if (field === 'platforms') patch.platformOther = next.includes('other') ? data.platformOther : null;
    if (field === 'niches') patch.nicheOther = next.includes('other') ? data.nicheOther : null;
    onChange({ [field]: next } as Partial<ContextData>);
    scheduleSave(patch);
  }
  function setSingle(field: 'experienceLevel' | 'availabilityToStart' | 'hiringTimeline' | 'teamSize', value: string) {
    const next = data[field] === value ? null : value;
    onChange({ [field]: next } as Partial<ContextData>);
    scheduleSave({ [field]: next });
  }
  function setOrg(value: string) {
    const next = data.organisationTypes[0] === value ? [] : [value];
    onChange({ organisationTypes: next });
    scheduleSave({ organisationTypes: next });
  }

  async function handleContinue() {
    if (submitting) return;
    setSubmitting(true);
    if (timer.current) clearTimeout(timer.current);
    const toSave = pending.current;
    pending.current = {};
    const ok = await persist(toSave);
    setSubmitting(false);
    if (ok) onComplete();
  }

  const multiChips = (values: readonly string[], labels: Record<string, string>, sel: string[], field: 'platforms' | 'niches' | 'workFormats') => (
    <div className="flex flex-wrap gap-2" role="group">
      {values.map((v) => (
        <Chip key={v} label={labels[v] ?? v} selected={sel.includes(v)} onToggle={() => toggleMulti(field, v)} />
      ))}
    </div>
  );
  const singleChips = (values: readonly string[], labels: Record<string, string>, sel: string | null, field: 'experienceLevel' | 'availabilityToStart' | 'hiringTimeline' | 'teamSize') => (
    <div className="flex flex-wrap gap-2" role="group">
      {values.map((v) => (
        <Chip key={v} label={labels[v] ?? v} selected={sel === v} onToggle={() => setSingle(field, v)} />
      ))}
    </div>
  );
  const urlInput = (id: string, label: string, value: string, field: 'portfolioUrl' | 'companyUrl') => (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-muted">{label}</label>
      <input
        id={id} type="url" inputMode="url" autoComplete="off" placeholder="https://…"
        value={value}
        onChange={(e) => onChange({ [field]: e.target.value } as Partial<ContextData>)}
        onBlur={() => scheduleSave({ [field]: data[field] })}
        className={cn(formControlClassName, 'rounded-xl')}
      />
    </div>
  );

  const isSeeker = role !== 'recruiter';
  const isRecruiter = role !== 'seeker';

  const heading =
    role === 'seeker' ? 'A little about how you work'
    : role === 'recruiter' ? 'A little about your hiring'
    : 'A little more context';

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg border border-accent/30 bg-accent/10 text-accent">
          <LayersIcon className="size-5" />
        </span>
        <div>
          <h2 data-step-heading tabIndex={-1} className="font-serif text-2xl tracking-tight text-ink">{heading}</h2>
          <p className="mt-1 text-sm text-muted">
            The more we know, the sharper your first matches. Add whatever feels right.
          </p>
        </div>
      </div>

      {isSeeker && (
        <section className="flex flex-col gap-2">
          <SectionLabel icon={<BriefcaseIcon className="size-4" />}>How you like to work</SectionLabel>
          {multiChips(WORK_FORMAT_VALUES, WORK_FORMAT_LABELS, data.workFormats, 'workFormats')}
        </section>
      )}

      {isRecruiter && (
        <section className="flex flex-col gap-2">
          <SectionLabel icon={<UserPlusIcon className="size-4" />}>What best describes you?</SectionLabel>
          <div className="flex flex-wrap gap-2" role="group" aria-label="What best describes you">
            {ORG_TYPE_VALUES.map((v) => (
              <Chip key={v} label={ORG_TYPE_LABELS[v]} selected={data.organisationTypes[0] === v} onToggle={() => setOrg(v)} />
            ))}
          </div>
        </section>
      )}

      <section className="flex flex-col gap-2">
        <SectionLabel icon={<FilmIcon className="size-4" />}>
          {isRecruiter && !isSeeker ? 'Platforms you hire for' : 'Platforms you focus on'}
        </SectionLabel>
        {multiChips(PLATFORM_VALUES, PLATFORM_LABELS, data.platforms, 'platforms')}
        <OtherField id="platform-other" show={data.platforms.includes('other')} value={data.platformOther}
          prompt="What platform did we miss?" onChange={(v) => onChange({ platformOther: v })} onCommit={() => scheduleSave({ platformOther: data.platformOther })} />
      </section>

      <section className="flex flex-col gap-2">
        <SectionLabel icon={<SparklesIcon className="size-4" />}>Creator niches</SectionLabel>
        {multiChips(NICHE_VALUES, NICHE_LABELS, data.niches, 'niches')}
        <OtherField id="niche-other" show={data.niches.includes('other')} value={data.nicheOther}
          prompt="What niche did we miss?" onChange={(v) => onChange({ nicheOther: v })} onCommit={() => scheduleSave({ nicheOther: data.nicheOther })} />
      </section>

      {role === 'seeker' && (
        <>
          <section className="flex flex-col gap-2">
            <SectionLabel icon={<TrendingUpIcon className="size-4" />}>Experience level</SectionLabel>
            {singleChips(EXPERIENCE_LEVEL_VALUES, EXPERIENCE_LEVEL_LABELS, data.experienceLevel, 'experienceLevel')}
          </section>
          <section className="flex flex-col gap-2">
            <SectionLabel icon={<BriefcaseIcon className="size-4" />}>When you could start</SectionLabel>
            {singleChips(AVAILABILITY_VALUES, AVAILABILITY_LABELS, data.availabilityToStart, 'availabilityToStart')}
          </section>
          {urlInput('portfolio-url', 'Portfolio or profile link', data.portfolioUrl, 'portfolioUrl')}
        </>
      )}

      {role === 'recruiter' && (
        <>
          <section className="flex flex-col gap-2">
            <SectionLabel icon={<TrendingUpIcon className="size-4" />}>Hiring timeline</SectionLabel>
            {singleChips(HIRING_TIMELINE_VALUES, HIRING_TIMELINE_LABELS, data.hiringTimeline, 'hiringTimeline')}
          </section>
          <section className="flex flex-col gap-2">
            <SectionLabel icon={<UsersIcon className="size-4" />}>Team / creator size</SectionLabel>
            {singleChips(TEAM_SIZE_VALUES, TEAM_SIZE_LABELS, data.teamSize, 'teamSize')}
          </section>
          {urlInput('company-url', 'Website or channel link', data.companyUrl, 'companyUrl')}
        </>
      )}

      <div className="flex items-center justify-between gap-3">
        <InlineStatus state={status} />
        <Button type="button" onClick={handleContinue} disabled={submitting}>
          {submitting ? 'Saving…' : 'Continue'}
          {!submitting ? <ArrowRightIcon className="size-4" /> : null}
        </Button>
      </div>
    </div>
  );
}
