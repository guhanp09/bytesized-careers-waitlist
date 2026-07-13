import { z } from 'zod';
import type { Role } from '@/types/waitlist';

export const ROLE_VALUES = ['seeker', 'recruiter', 'both'] as const satisfies readonly Role[];

export const roleStepSchema = z.object({
  leadId: z.uuid({ message: 'Invalid session.' }),
  resumeToken: z.string().min(1, { message: 'Invalid session.' }),
  role: z.enum(ROLE_VALUES),
});

export type RoleStepInput = z.infer<typeof roleStepSchema>;
