import {
  CATEGORY_GROUP_LABELS,
  JOB_CATEGORY_GROUPS,
  JOB_CATEGORY_LABELS,
  TALENT_CATEGORY_GROUPS,
  TALENT_CATEGORY_LABELS,
  groupOtherValue,
} from '@/lib/validation/constants';
import {
  NEED_PROFILE_VERSION,
  type NeedGroupV1,
  type NeedProfileV1,
  type NeedSide,
} from '@/types/lead-domain';
import type { Role } from '@/types/waitlist';

export const EMPTY_NEED_PROFILE: NeedProfileV1 = {
  version: NEED_PROFILE_VERSION,
  groups: [],
};

function definitionFor(side: NeedSide) {
  return side === 'seeker'
    ? { groups: JOB_CATEGORY_GROUPS, labels: JOB_CATEGORY_LABELS }
    : { groups: TALENT_CATEGORY_GROUPS, labels: TALENT_CATEGORY_LABELS };
}

/** Build the stable grouped representation from the current form's selection state. */
export function buildNeedProfile(
  side: NeedSide,
  selections: readonly string[] = [],
  customResponses: Record<string, string> = {},
): NeedProfileV1 {
  const selected = new Set(selections);
  const { groups } = definitionFor(side);
  const structured: NeedGroupV1[] = [];

  for (const group of groups) {
    const groupSelections = group.values.filter((value) => selected.has(value));
    const customResponse = customResponses[group.id]?.trim() || null;
    const otherSelected = selected.has(groupOtherValue(group.id)) || customResponse !== null;
    if (groupSelections.length === 0 && !otherSelected) continue;
    structured.push({
      id: group.id,
      selections: groupSelections,
      otherSelected,
      customResponse,
    });
  }

  return { version: NEED_PROFILE_VERSION, groups: structured };
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

/** Treat malformed/future payloads as empty and fall back to compatibility columns. */
export function normalizeNeedProfile(
  value: unknown,
  side: NeedSide,
  legacySelections: readonly string[] = [],
  legacyOthers: Record<string, string> = {},
): NeedProfileV1 {
  if (value && typeof value === 'object') {
    const candidate = value as { version?: unknown; groups?: unknown };
    if (candidate.version === NEED_PROFILE_VERSION && Array.isArray(candidate.groups)) {
      const allowedGroupIds = new Set(definitionFor(side).groups.map((group) => group.id));
      const groups = candidate.groups.flatMap((raw): NeedGroupV1[] => {
        if (!raw || typeof raw !== 'object') return [];
        const group = raw as Record<string, unknown>;
        if (typeof group.id !== 'string' || !allowedGroupIds.has(group.id)) return [];
        if (!isStringArray(group.selections)) return [];
        return [{
          id: group.id,
          selections: group.selections,
          otherSelected: group.otherSelected === true,
          customResponse:
            typeof group.customResponse === 'string' && group.customResponse.trim()
              ? group.customResponse.trim()
              : null,
        }];
      });
      if (groups.length > 0 || legacySelections.length === 0) {
        return { version: NEED_PROFILE_VERSION, groups };
      }
    }
  }
  return buildNeedProfile(side, legacySelections, legacyOthers);
}

/** Compatibility shape used by the existing public form state and resume flow. */
export function needProfileToFormState(profile: NeedProfileV1): {
  selections: string[];
  customResponses: Record<string, string>;
} {
  const selections: string[] = [];
  const customResponses: Record<string, string> = {};
  for (const group of profile.groups) {
    selections.push(...group.selections);
    if (group.otherSelected) selections.push(groupOtherValue(group.id));
    if (group.customResponse) customResponses[group.id] = group.customResponse;
  }
  return { selections, customResponses };
}

export interface DisplayNeedGroup {
  id: string;
  label: string;
  selections: string[];
  otherSelected: boolean;
  customResponse: string | null;
}

export function displayNeedGroups(
  profile: NeedProfileV1,
  side: NeedSide,
): DisplayNeedGroup[] {
  const { labels } = definitionFor(side);
  return profile.groups.map((group) => ({
    id: group.id,
    label: CATEGORY_GROUP_LABELS[group.id as keyof typeof CATEGORY_GROUP_LABELS] ?? group.id,
    selections: group.selections.map((selection) => labels[selection as keyof typeof labels] ?? selection),
    otherSelected: group.otherSelected,
    customResponse: group.customResponse,
  }));
}

export function flatNeedLabels(profile: NeedProfileV1, side: NeedSide): string[] {
  return displayNeedGroups(profile, side).flatMap((group) => [
    ...group.selections,
    ...(group.customResponse
      ? [`Other — ${group.customResponse}`]
      : group.otherSelected
        ? ['Other']
        : []),
  ]);
}

export function formatNeedSelections(profile: NeedProfileV1, side: NeedSide): string {
  return displayNeedGroups(profile, side)
    .flatMap((group) => group.selections)
    .join(' | ');
}

export function formatNeedGroups(profile: NeedProfileV1, side: NeedSide): string {
  return displayNeedGroups(profile, side)
    .map((group) => {
      const values = [
        ...group.selections,
        ...(group.customResponse
          ? [`Other: ${group.customResponse}`]
          : group.otherSelected
            ? ['Other']
            : []),
      ];
      return `${group.label}: ${values.join(', ')}`;
    })
    .join(' | ');
}

export function formatCustomResponses(profile: NeedProfileV1, side: NeedSide): string {
  return displayNeedGroups(profile, side)
    .filter((group) => group.customResponse)
    .map((group) => `${group.label}: ${group.customResponse}`)
    .join(' | ');
}

export function needCount(profile: NeedProfileV1): number {
  return profile.groups.reduce(
    (count, group) => count + group.selections.length + (group.customResponse ? 1 : 0),
    0,
  );
}

export function hasCustomResponse(profile: NeedProfileV1): boolean {
  return profile.groups.some((group) => Boolean(group.customResponse));
}

export interface NeedSummary {
  seeker: string[];
  recruiter: string[];
  total: number;
  visible: string[];
  remaining: number;
}

export function buildNeedSummary(input: {
  role: Role | null;
  seekerNeeds: NeedProfileV1;
  recruiterNeeds: NeedProfileV1;
  limit?: number;
}): NeedSummary {
  const seeker = input.role === 'recruiter' ? [] : flatNeedLabels(input.seekerNeeds, 'seeker');
  const recruiter = input.role === 'seeker' ? [] : flatNeedLabels(input.recruiterNeeds, 'recruiter');
  const combined = [...seeker, ...recruiter];
  const limit = input.limit ?? 3;
  return {
    seeker,
    recruiter,
    total: combined.length,
    visible: combined.slice(0, limit),
    remaining: Math.max(0, combined.length - limit),
  };
}
