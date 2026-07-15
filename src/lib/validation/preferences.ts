import { z } from 'zod';
import {
  JOB_CATEGORY_VALUES,
  TALENT_CATEGORY_VALUES,
  WORK_FORMAT_VALUES,
  ORG_TYPE_VALUES,
  PLATFORM_VALUES,
  NICHE_VALUES,
  EXPERIENCE_LEVEL_VALUES,
  AVAILABILITY_VALUES,
  HIRING_TIMELINE_VALUES,
  TEAM_SIZE_VALUES,
  OTHER_TEXT_MAX,
} from './constants';

const MAX_SELECTIONS = 64;

// Custom "Other" free text: trimmed, length-bounded, no control characters.
// Nullable so it can be explicitly cleared when "Other" is deselected.
const otherText = z
  .string()
  .trim()
  .max(OTHER_TEXT_MAX)
  .regex(/^\P{Cc}*$/u, { message: 'Please remove special characters.' })
  .nullable()
  .optional();

// Optional URL: lenient — normalized server-side; bounded length.
const urlText = z.string().trim().max(300).nullable().optional();

// Optional single-select, clearable to null.
function optionalEnum<T extends string>(values: T[]) {
  return z.enum(values as [T, ...T[]]).nullable().optional();
}

function enumArray<T extends string>(values: T[]) {
  return z.array(z.enum(values as [T, ...T[]])).max(MAX_SELECTIONS).optional();
}

// Section-specific "Other" answers: { [groupId]: text }. Keys + values bounded.
const othersRecord = z
  .record(
    z.string().max(60),
    z
      .string()
      .trim()
      .max(OTHER_TEXT_MAX)
      .regex(/^\P{Cc}*$/u, { message: 'Please remove special characters.' }),
  )
  .optional();

/** Step 3 — core interests (role-adapted) + section-specific "Other". Partial update. */
export const preferencesStepSchema = z.object({
  leadId: z.uuid({ message: 'Invalid session.' }),
  resumeToken: z.string().min(1, { message: 'Invalid session.' }),
  jobCategories: enumArray(JOB_CATEGORY_VALUES),
  talentCategories: enumArray(TALENT_CATEGORY_VALUES),
  jobCategoryOthers: othersRecord,
  talentCategoryOthers: othersRecord,
});
export type PreferencesStepInput = z.infer<typeof preferencesStepSchema>;

/** Step 5 — richer context (role-adapted): work style, platforms, niches, etc. Partial. */
export const contextStepSchema = z.object({
  leadId: z.uuid({ message: 'Invalid session.' }),
  resumeToken: z.string().min(1, { message: 'Invalid session.' }),
  workFormats: enumArray(WORK_FORMAT_VALUES), // seeker: how they like to work
  organisationTypes: enumArray(ORG_TYPE_VALUES), // recruiter: what best describes them
  platforms: enumArray(PLATFORM_VALUES),
  niches: enumArray(NICHE_VALUES),
  platformOther: otherText,
  nicheOther: otherText,
  // seeker
  experienceLevel: optionalEnum(EXPERIENCE_LEVEL_VALUES),
  availabilityToStart: optionalEnum(AVAILABILITY_VALUES),
  portfolioUrl: urlText,
  // recruiter
  hiringTimeline: optionalEnum(HIRING_TIMELINE_VALUES),
  teamSize: optionalEnum(TEAM_SIZE_VALUES),
  companyUrl: urlText,
});
export type ContextStepInput = z.infer<typeof contextStepSchema>;

/** Final step — free-text "anything else". Bounded, nullable, trimmed. */
export const noteStepSchema = z.object({
  leadId: z.uuid({ message: 'Invalid session.' }),
  resumeToken: z.string().min(1, { message: 'Invalid session.' }),
  additionalNotes: z
    .string()
    .trim()
    .max(600)
    .regex(/^\P{Cc}*$/u, { message: 'Please remove special characters.' })
    .nullable()
    .optional(),
});
export type NoteStepInput = z.infer<typeof noteStepSchema>;
