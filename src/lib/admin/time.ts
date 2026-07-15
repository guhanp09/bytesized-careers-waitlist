export const IST_TIME_ZONE = 'Asia/Kolkata';
export const IST_LABEL = 'IST';

const DATE_FORMATTER = new Intl.DateTimeFormat('en-IN', {
  timeZone: IST_TIME_ZONE,
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat('en-IN', {
  timeZone: IST_TIME_ZONE,
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});

const SHORT_DATE_FORMATTER = new Intl.DateTimeFormat('en-IN', {
  timeZone: IST_TIME_ZONE,
  day: '2-digit',
  month: 'short',
});

function asDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

export function formatIstDate(value: Date | string | null): string {
  return value ? `${DATE_FORMATTER.format(asDate(value))} ${IST_LABEL}` : 'Not recorded';
}

export function formatIstDateTime(value: Date | string | null): string {
  return value
    ? `${DATE_TIME_FORMATTER.format(asDate(value)).replace('am', 'AM').replace('pm', 'PM')} ${IST_LABEL}`
    : 'Not recorded';
}

export function formatIstShortDate(value: Date | string): string {
  return SHORT_DATE_FORMATTER.format(asDate(value));
}

/** A YYYY-MM-DD operator date always means midnight in Asia/Kolkata. */
export function istStartOfDay(value: string): Date {
  return new Date(`${value}T00:00:00+05:30`);
}

/** Exclusive end boundary for a YYYY-MM-DD operator date in Asia/Kolkata. */
export function istEndOfDayExclusive(value: string): Date {
  const start = istStartOfDay(value);
  return new Date(start.getTime() + 24 * 60 * 60 * 1000);
}

export function istDateKey(value: Date | string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: IST_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(asDate(value));
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

export function shiftIstDateKey(value: string, days: number): string {
  const date = istStartOfDay(value);
  return istDateKey(new Date(date.getTime() + days * 24 * 60 * 60 * 1000));
}

export function readablePercent(value: number, total: number): number {
  return total > 0 ? Math.round((value / total) * 100) : 0;
}
