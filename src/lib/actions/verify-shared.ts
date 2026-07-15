/** Shared result types for verification actions (importable by client + server). */

export type RequestCodeData = {
  /** Whether a code could actually be sent (false in production until a real provider ships). */
  available: boolean;
  channel: 'email' | 'phone';
  cooldownMs: number;
  expiresInMs: number;
  /** Present ONLY via the local dev provider — shown in the dev-only UI. */
  devCode?: string;
  alreadyVerified?: boolean;
  /** True when a fresh send was suppressed by the resend cooldown. */
  throttled?: boolean;
  /** Masked destination (e.g. "g***@gmail.com", "•••• 4567") for display. */
  target?: string;
  /** Provider-confirmed UI state. Never infer "sent" from availability alone. */
  deliveryStatus:
    | 'sending'
    | 'accepted'
    | 'dev_logged'
    | 'uncertain'
    | 'unavailable';
};

export type VerifySubmitReason =
  | 'invalid_code'
  | 'expired'
  | 'too_many_attempts'
  | 'invalid_token'
  | 'not_pending'
  | 'rate_limited'
  | 'validation_error';

export type VerifySubmitResult =
  | { ok: true }
  | { ok: false; reason: VerifySubmitReason; message: string };
