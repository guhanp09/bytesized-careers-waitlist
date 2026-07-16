/**
 * "The Brief" — centralized editorial copy.
 *
 * Every string that the art direction rewrites lives here so components and Playwright
 * specs import the same source of truth (no copy-drift test brittleness). Step headings
 * that anchor focus management and e2e selectors are intentionally NOT changed and stay
 * in their step components.
 */

import type { Role } from '@/types/waitlist';

/** Act I hero. The first line typesets from scattered to aligned. */
export const HERO = {
  eyebrow: 'The founding cohort is open',
  lineOne: 'Creator-economy hiring is still largely scattered and unstructured.',
  lineTwo: 'We’re building a marketplace to streamline it.',
  subcopy:
    'Whether you’re looking for work or hunting for reliable talent, this is your opportunity to get your foot in the door early.',
} as const;

/** Editorial act labels, keyed by flow step (1–9). Shown as a mono eyebrow above the card. */
export const ACT_LABELS: Record<number, string> = {
  1: 'I — The noise',
  2: 'II — Your signal',
  3: 'II — Your signal',
  4: 'III — The record',
  5: 'III — The record',
  6: 'III — The record',
  7: 'III — The record',
  8: 'III — The record',
  9: 'IV — Filed',
};

/** Plain chapter names for screen-reader announcements — never a numeric step count. */
export const ACT_NAMES: Record<number, string> = {
  1: 'The noise',
  2: 'Your signal',
  3: 'Your signal',
  4: 'The record',
  5: 'The record',
  6: 'The record',
  7: 'The record',
  8: 'The record',
  9: 'Filed',
};

/**
 * Qualitative progression — the visitor should feel movement, never count steps.
 * The visible flow after retiring phone verification: 1 2 3 4 5 6 8, filed at 9.
 */
const PROGRESS_SEQUENCE = [1, 2, 3, 4, 5, 6, 8, 9];

export function progressFraction(step: number): number {
  if (step >= 9) return 1;
  const idx = PROGRESS_SEQUENCE.indexOf(step);
  if (idx === -1) return 1;
  return idx / (PROGRESS_SEQUENCE.length - 1);
}

export function progressPhase(step: number): string {
  if (step <= 1) return 'Opening your brief';
  if (step <= 5) return 'Your brief is taking shape';
  if (step <= 8) return 'Nearly filed';
  return 'Filed';
}

/** Act IV success headlines (step-success data-step-heading). The document itself is
 * stamped "Filed" — the card speaks to the person. */
export const SUCCESS_HEADLINES: Record<Role, string> = {
  seeker: 'You’re in. The moment the right work surfaces, your brief speaks for you.',
  recruiter: 'You’re in. When matching talent arrives, your brief finds them first.',
  both: 'You’re in. Your brief now works both sides of the marketplace.',
};

export const SUCCESS_HEADLINE_FALLBACK =
  'You’re in. Your brief is on file — we’ll be in touch when early access opens.';

export const SUCCESS_BODY =
  'You’re in the founding cohort. We’re building the full marketplace around briefs like yours — and when it opens, you’re first through the door. No account, no noise in the meantime; one email when something genuinely fits.';

export const STAMP_TEXT = 'Filed — Founding cohort';

/** Mobile drawer pill label. */
export function briefPillLabel(count: number): string {
  return count === 1 ? 'Your brief — 1 entry' : `Your brief — ${count} entries`;
}

/** Brief panel titles by role. */
export const BRIEF_TITLES: Record<Role, string> = {
  seeker: 'Talent brief',
  recruiter: 'Hiring brief',
  both: 'Dual brief',
};

export const BRIEF_TITLE_FALLBACK = 'Your brief';

export const BRIEF_EMPTY_TEASER =
  'This page drafts your brief as you answer. Your first entry lands here.';

/** "How a match happens" interlude. */
export const INTERLUDE = {
  eyebrow: 'How a match happens',
  heading: 'Two briefs, one table.',
  subcopy:
    'Every answer becomes structure we can match on. When the marketplace opens and a brief on one side lines up with a brief on the other, we make the introduction — no cold DMs, no comment-section digging.',
} as const;

/** Trust colophon (replaces the trust strip copy; Privacy/Terms links stay). */
export const COLOPHON =
  'We collect only what makes your brief matchable — nothing more. Your data is never sold, messages are always opt-in, and we’ll strike your record whenever you ask.';
