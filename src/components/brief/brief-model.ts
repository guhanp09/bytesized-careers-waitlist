/**
 * Pure model for "The Brief" artifact.
 *
 * Maps a token-free snapshot of the funnel's answers into typeset document entries via the
 * same label constants the form itself uses (single source of truth). No React, no side
 * effects — fully unit-testable.
 */

import {
  JOB_CATEGORY_LABELS,
  TALENT_CATEGORY_LABELS,
  WORK_FORMAT_LABELS,
  ORG_TYPE_LABELS,
  PLATFORM_LABELS,
  NICHE_LABELS,
  EXPERIENCE_LEVEL_LABELS,
  AVAILABILITY_LABELS,
  HIRING_TIMELINE_LABELS,
  TEAM_SIZE_LABELS,
  CATEGORY_GROUP_LABELS,
  otherGroupIdOf,
  type CategoryGroupId,
} from '@/lib/validation/constants';
import { BRIEF_TITLES, BRIEF_TITLE_FALLBACK } from '@/lib/copy/flow-copy';
import type { Role } from '@/types/waitlist';

/**
 * Token-free projection of FlowData. Deliberately excludes leadId and resumeToken —
 * only a short derived reference number may ever leave the flow.
 */
export interface BriefSnapshot {
  refNo: string | null;
  fullName: string;
  emailMasked: string | null;
  role: Role | null;
  jobCategories: string[];
  talentCategories: string[];
  jobCategoryOthers: Record<string, string>;
  talentCategoryOthers: Record<string, string>;
  workFormats: string[];
  organisationTypes: string[];
  platforms: string[];
  niches: string[];
  experienceLevel: string | null;
  availabilityToStart: string | null;
  hiringTimeline: string | null;
  teamSize: string | null;
  additionalNotes: string;
  phoneProvided: boolean;
}

export interface BriefEntry {
  id: string;
  label: string;
  value: string;
  /** The flow step whose fields produce this entry — used for honest "saving…" styling. */
  sectionStep: number;
}

const ROLE_VALUE: Record<Role, string> = {
  seeker: 'Seeking work',
  recruiter: 'Hiring talent',
  both: 'Seeking & hiring',
};

const label = (map: Record<string, string>, value: string) => map[value] ?? value;

function joinLabels(values: string[], map: Record<string, string>, max = 4): string {
  const named = values
    .filter((v) => otherGroupIdOf(v) === null)
    .map((v) => label(map, v));
  if (named.length === 0) return '';
  if (named.length <= max) return named.join(', ');
  return `${named.slice(0, max).join(', ')} +${named.length - max} more`;
}

function othersLines(others: Record<string, string>): string[] {
  return Object.entries(others)
    .filter(([, text]) => text.trim().length > 0)
    .map(
      ([gid, text]) =>
        `${CATEGORY_GROUP_LABELS[gid as CategoryGroupId] ?? gid} — ${text.trim()}`,
    );
}

export function briefTitle(role: Role | null): string {
  return role ? BRIEF_TITLES[role] : BRIEF_TITLE_FALLBACK;
}

/** Builds the typeset entries for the current snapshot. Order = document reading order. */
export function buildBriefEntries(snapshot: BriefSnapshot | null): BriefEntry[] {
  if (!snapshot) return [];
  const entries: BriefEntry[] = [];
  const push = (id: string, entryLabel: string, value: string, sectionStep: number) => {
    if (value.trim().length > 0) entries.push({ id, label: entryLabel, value, sectionStep });
  };

  push('name', 'Name', snapshot.fullName.trim(), 1);
  // Deliberately no email on the document: the brief is a summary, not a contact record.
  if (snapshot.role) push('role', 'Intent', ROLE_VALUE[snapshot.role], 2);

  push('work', 'The work', joinLabels(snapshot.jobCategories, JOB_CATEGORY_LABELS), 3);
  for (const [i, line] of othersLines(snapshot.jobCategoryOthers).entries()) {
    push(`work-other-${i}`, 'In their words', line, 3);
  }

  push('talent', 'The talent', joinLabels(snapshot.talentCategories, TALENT_CATEGORY_LABELS), 3);
  for (const [i, line] of othersLines(snapshot.talentCategoryOthers).entries()) {
    push(`talent-other-${i}`, 'In their words', line, 3);
  }

  push('formats', 'Works', joinLabels(snapshot.workFormats, WORK_FORMAT_LABELS), 5);
  push('org', 'Organisation', joinLabels(snapshot.organisationTypes, ORG_TYPE_LABELS), 5);
  push('platforms', 'Platforms', joinLabels(snapshot.platforms, PLATFORM_LABELS), 5);
  push('niches', 'Niches', joinLabels(snapshot.niches, NICHE_LABELS), 5);
  if (snapshot.experienceLevel) {
    push('experience', 'Experience', label(EXPERIENCE_LEVEL_LABELS, snapshot.experienceLevel), 5);
  }
  if (snapshot.availabilityToStart) {
    push('availability', 'Available', label(AVAILABILITY_LABELS, snapshot.availabilityToStart), 5);
  }
  if (snapshot.hiringTimeline) {
    push('timeline', 'Hiring', label(HIRING_TIMELINE_LABELS, snapshot.hiringTimeline), 5);
  }
  if (snapshot.teamSize) {
    push('team', 'Team', label(TEAM_SIZE_LABELS, snapshot.teamSize), 5);
  }
  if (snapshot.phoneProvided) push('phone', 'Reachable', 'WhatsApp', 6);

  const note = snapshot.additionalNotes.trim();
  if (note) {
    push('note', 'Note', note.length > 140 ? `${note.slice(0, 139).trimEnd()}…` : note, 8);
  }

  return entries;
}

/**
 * The next 1–2 dotted "to be completed" rules, so the document always implies a future.
 * A slot retires as soon as its section has ink — the document never shows a blank rule
 * for something already written.
 */
export function pendingSlots(
  step: number,
  role: Role | null,
  entries: BriefEntry[] = [],
): string[] {
  if (step >= 9) return [];
  const has = (sectionStep: number) => entries.some((e) => e.sectionStep === sectionStep);
  const slots: { label: string; sectionStep: number }[] = [];
  if (step <= 1) {
    slots.push({ label: 'Name', sectionStep: 1 }, { label: 'Intent', sectionStep: 2 });
  } else if (step === 2) {
    slots.push({ label: 'Intent', sectionStep: 2 });
  } else if (step === 3) {
    slots.push({
      label: role === 'recruiter' ? 'The talent' : 'The work',
      sectionStep: 3,
    });
  } else if (step <= 5) {
    slots.push({ label: 'Context', sectionStep: 5 });
  } else if (step <= 7) {
    slots.push({ label: 'Reachability', sectionStep: 6 });
  } else {
    slots.push({ label: 'Note', sectionStep: 8 });
  }
  return slots
    .filter((slot) => !has(slot.sectionStep))
    .map((slot) => slot.label)
    .slice(0, 2);
}
