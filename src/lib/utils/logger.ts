/**
 * Structured JSON logging to stdout (plan §14). Captured by Vercel's log stream —
 * no external logging infra. NEVER log raw email / phone / tokens; only leadId and
 * already-masked values.
 */
type LogLevel = 'info' | 'warn' | 'error';

interface LogFields {
  event: string;
  action?: string;
  leadId?: string;
  errorCode?: string;
  message?: string;
  [key: string]: unknown;
}

function emit(level: LogLevel, fields: LogFields): void {
  const line = JSON.stringify({
    level,
    ts: new Date().toISOString(),
    ...fields,
  });
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}

export const logger = {
  info: (fields: LogFields) => emit('info', fields),
  warn: (fields: LogFields) => emit('warn', fields),
  error: (fields: LogFields) => emit('error', fields),
};
