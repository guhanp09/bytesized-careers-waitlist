import { z } from 'zod';
import {
  CATEGORY_VALUES,
  WORK_FORMAT_VALUES,
  ORG_TYPE_VALUES,
} from './constants';

/**
 * Step 3 preferences validation (plan §10, §13). This is a PARTIAL update — only the
 * fields present in a given save are written. Each array is validated against the
 * source-of-truth vocabulary (defense in depth beyond the UI); anything unknown is
 * rejected rather than silently stored. Arrays are bounded to a sane maximum.
 */
const MAX_SELECTIONS = 32;

export const preferencesStepSchema = z.object({
  leadId: z.uuid({ message: 'Invalid session.' }),
  resumeToken: z.string().min(1, { message: 'Invalid session.' }),
  jobCategories: z.array(z.enum(CATEGORY_VALUES)).max(MAX_SELECTIONS).optional(),
  workFormats: z.array(z.enum(WORK_FORMAT_VALUES)).max(MAX_SELECTIONS).optional(),
  talentCategories: z.array(z.enum(CATEGORY_VALUES)).max(MAX_SELECTIONS).optional(),
  organisationTypes: z.array(z.enum(ORG_TYPE_VALUES)).max(MAX_SELECTIONS).optional(),
});

export type PreferencesStepInput = z.infer<typeof preferencesStepSchema>;
