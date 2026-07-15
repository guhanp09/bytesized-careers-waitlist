export const NEED_PROFILE_VERSION = 1 as const;
export const LEAD_DATA_VERSION = 2 as const;

export type NeedProfileVersion = typeof NEED_PROFILE_VERSION;

export interface NeedGroupV1 {
  id: string;
  selections: string[];
  otherSelected: boolean;
  customResponse: string | null;
}

/**
 * Versioned taxonomy payload. Seeker and recruiter profiles live in separate columns so
 * a `both` lead can never collapse two different intents into one ambiguous list.
 */
export interface NeedProfileV1 {
  version: NeedProfileVersion;
  groups: NeedGroupV1[];
}

export type NeedSide = 'seeker' | 'recruiter';

export type MeaningfulStep =
  | 'email'
  | 'role'
  | 'needs'
  | 'email_verification'
  | 'context'
  | 'phone'
  | 'phone_verification'
  | 'completed';
