'use client';

import { useEffect, useRef, useState } from 'react';
import type { AdminLeadRow } from '@/lib/db/queries/admin';
import { displayNeedGroups, hasCustomResponse, needCount } from '@/lib/leads/needs';
import { labelFor } from '@/lib/validation/constants';
import { formatIstDateTime, readablePercent } from '@/lib/admin/time';
import { legacyReferrerHostname, type AttributionTouchV1 } from '@/lib/attribution/campaign';

interface LeadDetailDialogProps { lead: AdminLeadRow; onClose: () => void; }

const roleLabels = { seeker: 'Job seeker', recruiter: 'Recruiter', both: 'Both' } as const;
const completionLabels = { email_only: 'Email only', partial: 'Partial profile', completed: 'Completed profile' } as const;

function Labels({ values }: { values: string[] }) {
  return values.length > 0 ? <span>{values.map(labelFor).join(', ')}</span> : <span className="text-faint">Not supplied</span>;
}

function Badge({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: 'neutral' | 'good' | 'accent' | 'warn' }) {
  const tones = {
    neutral: 'border-[color:var(--color-line)] bg-surface text-muted',
    good: 'border-success/25 bg-success/10 text-success',
    accent: 'border-accent/25 bg-accent/10 text-accent',
    warn: 'border-amber-400/25 bg-amber-400/10 text-amber-300',
  };
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${tones[tone]}`}>{children}</span>;
}

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-[color:var(--color-line)] pt-6 first:border-0 first:pt-0">
      <h3 className="text-xs font-semibold tracking-[0.13em] text-faint uppercase">{title}</h3>
      {description ? <p className="mt-1 text-xs text-faint">{description}</p> : null}
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><dt className="text-xs text-faint">{label}</dt><dd className="mt-1 break-words text-sm leading-relaxed text-ink">{children}</dd></div>;
}

function CopyValue({ value, href }: { value: string; href?: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }
  return (
    <span className="inline-flex max-w-full flex-wrap items-center gap-2">
      {href ? <a href={href} className="break-all text-accent hover:underline">{value}</a> : <span className="break-all">{value}</span>}
      <button type="button" onClick={copy} className="rounded-md border border-[color:var(--color-line)] px-2 py-1 text-[11px] text-muted hover:text-ink" aria-label={`Copy ${value}`}>
        {copied ? 'Copied' : 'Copy'}
      </button>
    </span>
  );
}

function NeedSection({ lead, side }: { lead: AdminLeadRow; side: 'seeker' | 'recruiter' }) {
  const profile = side === 'seeker' ? lead.seekerNeeds : lead.recruiterNeeds;
  const groups = displayNeedGroups(profile, side);
  return (
    <Section
      title={side === 'seeker' ? 'What they want to do' : 'Who they want to hire'}
      description={side === 'seeker' ? 'Job-seeker taxonomy, kept separate from hiring needs.' : 'Recruiter taxonomy, kept separate from work they may want.'}
    >
      {groups.length === 0 ? <p className="admin-empty">No structured selections supplied.</p> : (
        <div className="grid gap-3 sm:grid-cols-2">
          {groups.map((group) => (
            <div key={group.id} className="rounded-xl border border-[color:var(--color-line)] bg-black/10 p-3.5">
              <h4 className="text-sm font-medium text-ink">{group.label}</h4>
              {group.selections.length > 0 ? <ul className="mt-2 flex flex-wrap gap-1.5">{group.selections.map((selection) => <li key={selection} className="rounded-md bg-white/[0.045] px-2 py-1 text-xs text-muted">{selection}</li>)}</ul> : null}
              {group.customResponse ? (
                <div className="mt-3 rounded-lg border border-accent/15 bg-accent/[0.07] px-3 py-2.5">
                  <p className="text-[10px] font-semibold tracking-wide text-accent uppercase">Their custom answer</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-ink">{group.customResponse}</p>
                </div>
              ) : group.otherSelected ? <p className="mt-2 text-xs text-faint">Other was selected without added detail.</p> : null}
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}

function noteHeading(role: AdminLeadRow['role']) {
  if (role === 'seeker') return 'What would make ByteSized genuinely useful to you?';
  if (role === 'recruiter') return 'What kind of hire would be a great fit?';
  return 'Anything you’d want us to know?';
}

function displaySource(value: string | null | undefined) {
  if (!value) return 'Not provided';
  return value === 'direct' ? 'Direct' : value;
}

function AttributionDetails({
  title,
  touch,
  legacy,
}: {
  title: 'First touch' | 'Last touch';
  touch: AttributionTouchV1 | null;
  legacy?: Pick<AdminLeadRow, 'source' | 'utmSource' | 'utmMedium' | 'utmCampaign' | 'referrer'>;
}) {
  const hasLegacy = Boolean(
    legacy && (legacy.source || legacy.utmSource || legacy.utmMedium || legacy.utmCampaign || legacy.referrer),
  );
  const source = touch?.source ?? legacy?.utmSource ?? legacy?.source;
  const referrerHost = touch?.referrerHost ?? legacyReferrerHostname(legacy?.referrer);
  const fallback = hasLegacy ? 'Legacy record' : 'Not provided';
  return (
    <div className="rounded-xl border border-[color:var(--color-line)] bg-surface/45 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-sm font-medium text-ink">{title}</h4>
        <span className="text-[10px] font-semibold tracking-wide text-faint uppercase">
          {touch ? touch.kind : hasLegacy ? 'legacy' : 'unknown'}
        </span>
      </div>
      <dl className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="Source">{displaySource(source)}</Field>
        <Field label="Medium">{touch?.medium ?? legacy?.utmMedium ?? fallback}</Field>
        <Field label="Campaign">{touch?.campaign ?? legacy?.utmCampaign ?? fallback}</Field>
        <Field label="Content">{touch?.content ?? fallback}</Field>
        <Field label="Term">{touch?.term ?? fallback}</Field>
        <Field label="Geography">{touch?.geo ?? fallback}</Field>
        <Field label="Placement">{touch?.placement ?? fallback}</Field>
        <Field label="Referral">{touch?.referral ?? fallback}</Field>
        <Field label="Referrer host">{referrerHost ?? fallback}</Field>
        <Field label="Landing page">{touch?.landingPath ?? fallback}</Field>
        <Field label="Captured">{touch ? formatIstDateTime(new Date(touch.capturedAt)) : fallback}</Field>
      </dl>
    </div>
  );
}

export function LeadDetailDialog({ lead, onClose }: LeadDetailDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => { const dialog = dialogRef.current; if (dialog && !dialog.open) dialog.showModal(); }, []);

  const custom = hasCustomResponse(lead.seekerNeeds) || hasCustomResponse(lead.recruiterNeeds) || Boolean(lead.platformOther || lead.nicheOther);
  const needs = needCount(lead.seekerNeeds) + needCount(lead.recruiterNeeds);
  const hasContext = lead.workFormats.length + lead.organisationTypes.length + lead.platforms.length + lead.niches.length > 0 || Boolean(lead.experienceLevel || lead.availabilityToStart || lead.portfolioUrl || lead.hiringTimeline || lead.teamSize || lead.companyUrl);
  const completionSignals = [true, Boolean(lead.role), needs > 0, hasContext, lead.completionStatus === 'completed'];
  const completeness = readablePercent(completionSignals.filter(Boolean).length, completionSignals.length);
  const source = lead.firstTouchAttribution?.source ?? lead.utmSource ?? lead.source ?? 'Legacy / Unknown';
  const why = lead.role === 'seeker' ? 'Looking for creator-economy work' : lead.role === 'recruiter' ? 'Looking to hire creator-economy talent' : lead.role === 'both' ? 'Looking for work and hiring talent' : 'Intent has not been selected yet';

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="lead-detail-title"
      onClose={onClose}
      onClick={(event) => { if (event.target === event.currentTarget) event.currentTarget.close(); }}
      className="m-0 ml-auto h-dvh max-h-none w-full max-w-3xl overflow-y-auto border-l border-[color:var(--color-line-strong)] bg-canvas p-0 text-ink shadow-2xl backdrop:bg-black/75 sm:w-[min(760px,94vw)]"
    >
      <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[color:var(--color-line)] bg-canvas/95 px-5 py-4 backdrop-blur sm:px-7">
        <div className="min-w-0">
          <p className="text-xs font-medium tracking-wide text-accent">Lead detail</p>
          <h2 id="lead-detail-title" className="mt-1 break-words text-xl font-semibold tracking-tight">{lead.fullName || 'Name not captured'}</h2>
          <p className="mt-1 break-all text-sm text-muted">{lead.originalEmail}</p>
          <p className="mt-1 text-xs text-faint">Joined {formatIstDateTime(lead.createdAt)}</p>
        </div>
        <button type="button" onClick={() => dialogRef.current?.close()} className="shrink-0 rounded-lg border border-[color:var(--color-line)] px-3 py-2 text-sm text-muted hover:text-ink">Close</button>
      </div>

      <div className="flex flex-col gap-7 px-5 py-6 sm:px-7">
        <Section title="At a glance">
          <div className="flex flex-wrap gap-2">
            <Badge tone="accent">{lead.role ? roleLabels[lead.role] : 'Intent not selected'}</Badge>
            <Badge tone={lead.completionStatus === 'completed' ? 'good' : 'warn'}>{completionLabels[lead.completionStatus]}</Badge>
            <Badge tone={lead.emailVerificationStatus === 'verified' ? 'good' : 'neutral'}>Email {lead.emailVerificationStatus}</Badge>
            {lead.phoneE164 ? <Badge tone={lead.phoneVerificationStatus === 'verified' ? 'good' : 'neutral'}>Phone {lead.phoneVerificationStatus}</Badge> : null}
            {lead.additionalNotes ? <Badge>Has comments</Badge> : null}
            {custom ? <Badge>Custom requirement</Badge> : null}
          </div>
          <div className="mt-5 rounded-xl border border-[color:var(--color-line)] bg-surface/55 p-4">
            <div className="flex items-end justify-between gap-3"><div><p className="text-xs text-faint">Profile completeness</p><p className="mt-1 text-sm font-medium text-ink">{completeness >= 80 ? 'High-signal lead' : completeness >= 40 ? 'Developing profile' : 'Early-stage lead'}</p></div><span className="text-lg font-semibold tabular-nums text-ink">{completeness}%</span></div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.06]"><div className="h-full rounded-full bg-accent" style={{ width: `${completeness}%` }} /></div>
          </div>
          <dl className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Full name">{lead.fullName || 'Name not captured'}</Field>
            <Field label="Joined">{formatIstDateTime(lead.createdAt)}</Field>
            <Field label="Last updated">{formatIstDateTime(lead.updatedAt)}</Field>
            <Field label="Completed">{formatIstDateTime(lead.completedAt)}</Field>
            <Field label="Source">{displaySource(source)}</Field>
            <Field label="Last meaningful step">{lead.lastMeaningfulStep.replaceAll('_', ' ')}</Field>
            <Field label="Profile signal">{needs} standardized need{needs === 1 ? '' : 's'}{custom ? ' + custom detail' : ''}</Field>
          </dl>
        </Section>

        <Section title="Why they joined">
          <p className="rounded-xl border border-accent/20 bg-accent/[0.07] px-4 py-3 text-base font-medium text-ink">{why}</p>
        </Section>

        <Section
          title="Campaign attribution"
          description="First touch remains fixed; last touch changes only after a new explicit campaign or external referral."
        >
          <div className="grid gap-4">
            <AttributionDetails
              title="First touch"
              touch={lead.firstTouchAttribution}
              legacy={lead}
            />
            <AttributionDetails title="Last touch" touch={lead.lastTouchAttribution} />
          </div>
        </Section>

        <Section title="Contact details" description="Contact values are shown only inside the authenticated admin area.">
          <dl className="grid gap-5 sm:grid-cols-2">
            <Field label="Full name">{lead.fullName ? <CopyValue value={lead.fullName} /> : <span className="text-faint">Name not captured</span>}</Field>
            <Field label="Email"><CopyValue value={lead.originalEmail} href={`mailto:${lead.originalEmail}`} /></Field>
            <Field label="Email ownership">{lead.emailVerificationStatus}</Field>
            <Field label="Email verification requested">{formatIstDateTime(lead.emailVerificationRequestedAt)}</Field>
            <Field label="Email accepted for delivery">{formatIstDateTime(lead.emailVerificationSentAt)}</Field>
            <Field label="Email verified">{formatIstDateTime(lead.emailVerifiedAt)}</Field>
            <Field label="Phone">{lead.phoneE164 ? <CopyValue value={lead.phoneE164} href={`tel:${lead.phoneE164}`} /> : <span className="text-faint">Not supplied</span>}</Field>
            <Field label="Phone ownership">{lead.phoneE164 ? lead.phoneVerificationStatus : 'Not applicable'}</Field>
            <Field label="WhatsApp">{lead.phoneWhatsappConsent ? 'Opted in' : 'Not opted in'}</Field>
            <Field label="SMS">{lead.phoneSmsConsent ? 'Opted in' : 'Not opted in'}</Field>
            <Field label="Phone calls">{lead.phoneVoiceConsent ? 'Opted in' : 'Not opted in'}</Field>
            <Field label="Channel choices recorded">{formatIstDateTime(lead.phoneConsentRecordedAt)}</Field>
            <Field label="Consent copy version">{lead.phoneConsentVersion ?? 'Not recorded'}</Field>
            <Field label="Consent source">{lead.phoneConsentSource ?? 'Not recorded'}</Field>
            <Field label="Phone verification requested">{formatIstDateTime(lead.phoneVerificationRequestedAt)}</Field>
            <Field label="Phone code last sent">{formatIstDateTime(lead.phoneVerificationLastSentAt)}</Field>
            <Field label="Phone verified (legacy)">{formatIstDateTime(lead.phoneVerifiedAt)}</Field>
          </dl>
        </Section>

        {lead.role !== 'recruiter' ? <NeedSection lead={lead} side="seeker" /> : null}
        {lead.role !== 'seeker' ? <NeedSection lead={lead} side="recruiter" /> : null}

        <Section title="Matching context">
          <dl className="grid gap-4 sm:grid-cols-2">
            {lead.role !== 'recruiter' ? <Field label="How they like to work"><Labels values={lead.workFormats} /></Field> : null}
            {lead.role !== 'seeker' ? <Field label="Organisation type"><Labels values={lead.organisationTypes} /></Field> : null}
            <Field label="Platforms"><Labels values={lead.platforms} />{lead.platformOther ? <span> · Other: {lead.platformOther}</span> : null}</Field>
            <Field label="Creator niches"><Labels values={lead.niches} />{lead.nicheOther ? <span> · Other: {lead.nicheOther}</span> : null}</Field>
            {lead.role === 'seeker' ? <Field label="Experience level">{lead.experienceLevel ? labelFor(lead.experienceLevel) : 'Not supplied'}</Field> : null}
            {lead.role === 'seeker' ? <Field label="When they could start">{lead.availabilityToStart ? labelFor(lead.availabilityToStart) : 'Not supplied'}</Field> : null}
            {lead.role === 'recruiter' ? <Field label="Hiring timeline">{lead.hiringTimeline ? labelFor(lead.hiringTimeline) : 'Not supplied'}</Field> : null}
            {lead.role === 'recruiter' ? <Field label="Team / creator size">{lead.teamSize ? labelFor(lead.teamSize) : 'Not supplied'}</Field> : null}
            {lead.portfolioUrl ? <Field label="Portfolio / profile"><a href={lead.portfolioUrl} target="_blank" rel="noreferrer" className="text-accent hover:underline">Open portfolio ↗</a></Field> : null}
            {lead.companyUrl ? <Field label="Website / channel"><a href={lead.companyUrl} target="_blank" rel="noreferrer" className="text-accent hover:underline">Open website ↗</a></Field> : null}
          </dl>
        </Section>

        <Section title="Additional comments" description={noteHeading(lead.role)}>
          {lead.additionalNotes ? <blockquote className="whitespace-pre-wrap rounded-xl border border-[color:var(--color-line-strong)] bg-surface px-4 py-4 text-sm leading-7 text-ink">{lead.additionalNotes}</blockquote> : <p className="admin-empty">They completed this step without adding a comment.</p>}
        </Section>

        <details className="rounded-xl border border-[color:var(--color-line)] bg-surface/40 p-4">
          <summary className="cursor-pointer text-sm font-medium text-muted">Funnel, attribution & operational metadata</summary>
          <dl className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Lead ID"><CopyValue value={lead.id} /></Field>
            <Field label="Data schema">v{lead.leadDataVersion}</Field>
            <Field label="Last completed step">{lead.lastCompletedStep}</Field>
            <Field label="Last meaningful step">{lead.lastMeaningfulStep}</Field>
            <Field label="Created">{formatIstDateTime(lead.createdAt)}</Field>
            <Field label="Updated">{formatIstDateTime(lead.updatedAt)}</Field>
            <Field label="Completed">{formatIstDateTime(lead.completedAt)}</Field>
            <Field label="Last delivery state">{lead.lastTransactionalEmailStatus}</Field>
            <Field label="Last delivery event">{formatIstDateTime(lead.lastTransactionalEmailAt)}</Field>
            <Field label="Legacy source field">{lead.source ?? 'Not recorded'}</Field>
            <Field label="Legacy UTM source">{lead.utmSource ?? 'Not recorded'}</Field>
            <Field label="Legacy UTM medium">{lead.utmMedium ?? 'Not recorded'}</Field>
            <Field label="Legacy UTM campaign">{lead.utmCampaign ?? 'Not recorded'}</Field>
            <Field label="Legacy referrer host">{legacyReferrerHostname(lead.referrer) ?? 'Not recorded'}</Field>
            {lead.hiringFrequency ? <Field label="Legacy hiring frequency">{labelFor(lead.hiringFrequency)}</Field> : null}
            {lead.talentSeniority ? <Field label="Legacy talent seniority">{labelFor(lead.talentSeniority)}</Field> : null}
          </dl>
        </details>
      </div>
    </dialog>
  );
}
