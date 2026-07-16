/**
 * Shared single-line form-control foundation for the public waitlist.
 *
 * Layout-specific flex/grid rules deliberately do not live here: a field can opt into
 * horizontal flex growth only at the breakpoint where its parent becomes a row. Keeping
 * the intrinsic minimum height and 16px type here prevents narrow-layout compression and
 * iOS focus zoom across text, email, URL, phone and native-select controls.
 */
export const formControlClassName =
  'box-border min-h-12 w-full border border-[color:var(--color-line)] bg-surface px-4 ' +
  'text-base text-ink placeholder:text-faint transition-colors focus:border-accent ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ' +
  'disabled:opacity-60';
