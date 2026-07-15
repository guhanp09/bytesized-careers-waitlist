/** Shared types for the waitlist flow (plan §10). */

export type Role = 'seeker' | 'recruiter' | 'both';

export type CompletionStatus = 'email_only' | 'partial' | 'completed';

export type ActionErrorCode =
  | 'validation_error'
  | 'rate_limited'
  | 'invalid_token'
  | 'delivery_failed'
  | 'server_error';

export type ActionError = {
  code: ActionErrorCode;
  message: string;
  fieldErrors?: Record<string, string[]>;
};

/** Discriminated result returned by every server action. */
export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ActionError };

export function actionOk<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}

export function actionError<T>(
  code: ActionErrorCode,
  message: string,
  fieldErrors?: Record<string, string[]>,
): ActionResult<T> {
  return { ok: false, error: { code, message, ...(fieldErrors ? { fieldErrors } : {}) } };
}
