import type { z } from 'zod';

/**
 * Convert a ZodError into a flat `{ field: [messages] }` map for ActionError.fieldErrors.
 * Uses only `error.issues`, which is stable across Zod versions.
 */
export function fieldErrorsOf(error: z.ZodError): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.length > 0 ? issue.path.join('.') : '_';
    (out[key] ??= []).push(issue.message);
  }
  return out;
}
