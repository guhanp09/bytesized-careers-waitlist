'use client';

import { useMemo } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useBrief } from './brief-context';
import { buildBriefEntries, briefTitle, pendingSlots } from './brief-model';
import { BriefStamp } from './brief-stamp';
import { BRIEF_EMPTY_TEASER } from '@/lib/copy/flow-copy';

/**
 * The paper artifact — a living document that typesets the visitor's actual answers.
 * Entries are keyed by id so an edit updates text in place without re-animating; only a
 * brand-new line "typesets" in. Rendered inside the desktop rail and the mobile drawer.
 * No live region: the flow's status region already announces step changes.
 */
export function BriefPanel({ compact = false }: { compact?: boolean }) {
  const brief = useBrief();
  const reduce = useReducedMotion();
  const snapshot = brief?.snapshot ?? null;
  const step = brief?.step ?? 1;
  const role = brief?.role ?? null;
  const saveState = brief?.saveState ?? 'idle';

  const entries = useMemo(() => buildBriefEntries(snapshot), [snapshot]);
  const pending = useMemo(() => pendingSlots(step, role, entries), [step, role, entries]);
  const filed = step >= 9;

  // Honest ink: entries the active step is still persisting render "pencilled" until the
  // save resolves; everything else is settled ink. Failures are named in the footer.
  const isPencilled = (entrySectionStep: number) =>
    entrySectionStep === step && (saveState === 'saving' || saveState === 'error');

  const footerStatus =
    saveState === 'saving'
      ? 'Saving…'
      : saveState === 'error'
        ? 'Couldn’t save — your entries are kept.'
        : 'Drafted from your answers. Saved as you go.';

  const today = useMemo(
    () =>
      new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
        .format(new Date())
        .toUpperCase(),
    [],
  );

  return (
    <div className={`brief-paper ${compact ? 'p-4' : 'p-5'}`} data-brief-panel>
      {/* Document header */}
      <div className="flex items-baseline justify-between gap-3 font-mono text-[10px] tracking-[0.14em] uppercase text-[color:var(--color-paper-faint)]">
        <span>ByteSized Careers</span>
        <span>{today}</span>
      </div>
      <div className="mt-2 flex items-baseline justify-between gap-3">
        <h2 className="font-serif text-xl tracking-tight text-[color:var(--color-paper-ink)]">
          {briefTitle(role)}
        </h2>
        {snapshot?.refNo ? (
          <span className="font-mono text-[10px] tracking-[0.14em] text-[color:var(--color-paper-faint)]">
            REF {snapshot.refNo}
          </span>
        ) : null}
      </div>

      <div className="brief-rule mt-3" />

      {/* Entries */}
      {entries.length === 0 ? (
        <p className="py-4 font-mono text-[11px] leading-relaxed text-[color:var(--color-paper-faint)]">
          {BRIEF_EMPTY_TEASER}
        </p>
      ) : (
        <dl className="divide-y divide-[color:var(--color-paper-line)]">
          <AnimatePresence initial={false}>
            {entries.map((entry) => (
              <motion.div
                key={entry.id}
                className="grid grid-cols-[5.5rem_1fr] gap-3 py-2"
                initial={reduce ? false : { opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              >
                <dt className="pt-px font-mono text-[10px] leading-relaxed tracking-[0.12em] uppercase text-[color:var(--color-paper-faint)]">
                  {entry.label}
                </dt>
                <dd
                  className={`[overflow-wrap:anywhere] ${
                    isPencilled(entry.sectionStep)
                      ? 'text-[13px] leading-relaxed text-[color:var(--color-paper-faint)] italic'
                      : 'text-[13px] leading-relaxed text-[color:var(--color-paper-ink)]'
                  }`}
                >
                  {entry.value}
                  {isPencilled(entry.sectionStep) ? (
                    <span className="ml-1.5 font-mono text-[9px] not-italic tracking-[0.1em] uppercase">
                      · pencilled
                    </span>
                  ) : null}
                </dd>
              </motion.div>
            ))}
          </AnimatePresence>
        </dl>
      )}

      {/* Pending dotted rules — the document always implies its future. */}
      {pending.length > 0 ? (
        <div className={entries.length > 0 ? 'brief-rule' : ''}>
          {pending.map((slot) => (
            <div key={slot} className="grid grid-cols-[5.5rem_1fr] gap-3 py-2">
              <span className="font-mono text-[10px] leading-relaxed tracking-[0.12em] uppercase text-[color:var(--color-paper-faint)] opacity-70">
                {slot}
              </span>
              <span className="brief-pending mb-1 self-end" aria-hidden="true" />
            </div>
          ))}
        </div>
      ) : null}

      {/* Filed stamp */}
      {filed ? (
        <div className="brief-rule mt-1 flex justify-end pt-4 pb-1">
          <BriefStamp />
        </div>
      ) : null}

      {/* Honest footer status — mirrors the active step's persistence. */}
      {!filed ? (
        <p
          className={`brief-rule mt-1 pt-2.5 font-mono text-[9px] leading-relaxed tracking-[0.12em] uppercase ${
            saveState === 'error'
              ? 'text-[color:var(--color-stamp)]'
              : 'text-[color:var(--color-paper-faint)]'
          }`}
        >
          {footerStatus}
        </p>
      ) : null}
    </div>
  );
}
