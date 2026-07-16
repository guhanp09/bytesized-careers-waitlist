'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useBrief } from './brief-context';
import { buildBriefEntries } from './brief-model';
import { BriefPanel } from './brief-panel';
import { briefPillLabel } from '@/lib/copy/flow-copy';

/**
 * Mobile home for the brief: a fixed bottom-right pill that opens a bottom sheet. Designed
 * around the keyboard and the form's primacy — the pill hides while any text field has
 * focus or while the visual viewport is keyboard-shrunk, and it never appears until the
 * visitor has something on paper. Non-modal; focus returns to the pill on close.
 */
export function BriefDrawer() {
  const brief = useBrief();
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [typing, setTyping] = useState(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const pillRef = useRef<HTMLButtonElement>(null);

  const step = brief?.step ?? 1;
  const entries = useMemo(() => buildBriefEntries(brief?.snapshot ?? null), [brief?.snapshot]);

  // Hide while the visitor is typing in any text control.
  useEffect(() => {
    const isText = (el: EventTarget | null) =>
      el instanceof HTMLElement &&
      (el.tagName === 'TEXTAREA' ||
        (el.tagName === 'INPUT' &&
          !['checkbox', 'radio', 'button', 'submit'].includes(
            (el as HTMLInputElement).type,
          )));
    const onFocusIn = (e: FocusEvent) => {
      if (isText(e.target)) setTyping(true);
    };
    const onFocusOut = () => setTyping(false);
    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('focusout', onFocusOut);
    return () => {
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('focusout', onFocusOut);
    };
  }, []);

  // Hide when the on-screen keyboard eats the viewport (iOS/Android).
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const base = window.innerHeight;
    const onResize = () => setKeyboardOpen(vv.height < base * 0.75);
    vv.addEventListener('resize', onResize);
    return () => vv.removeEventListener('resize', onResize);
  }, []);

  // Rendering derives from open && visible: if typing/keyboard hides the drawer while it
  // was open, it simply returns when the field blurs — continuity without state syncing.
  const visible = step >= 2 && entries.length > 0 && !typing && !keyboardOpen;

  const wantPillFocus = useRef(false);
  function close() {
    wantPillFocus.current = true;
    setOpen(false);
  }
  // The pill mounts only after `open` flips false — return focus once it exists.
  useEffect(() => {
    if (!open && wantPillFocus.current) {
      wantPillFocus.current = false;
      pillRef.current?.focus();
    }
  }, [open]);

  return (
    <div className="lg:hidden">
      <AnimatePresence>
        {open && visible ? (
          <motion.div
            key="sheet"
            data-brief-sheet
            className="safe-drawer-gutter fixed inset-x-0 bottom-0 z-40 pb-[calc(0.75rem+env(safe-area-inset-bottom))]"
            initial={reduce ? { opacity: 0 } : { y: '100%' }}
            animate={reduce ? { opacity: 1 } : { y: 0 }}
            exit={reduce ? { opacity: 0 } : { y: '100%' }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="mx-auto max-h-[60dvh] max-w-md overflow-y-auto overscroll-contain rounded-t-md shadow-2xl">
              <BriefPanel compact />
            </div>
            <div className="mx-auto flex max-w-md justify-end bg-[color:var(--color-paper)] pb-1 pr-2 rounded-b-md">
              <button
                type="button"
                onClick={close}
                className="min-h-11 px-3 font-mono text-[11px] tracking-[0.12em] uppercase text-[color:var(--color-paper-faint)] hover:text-[color:var(--color-paper-ink)]"
              >
                Close
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {visible && !open ? (
          <motion.button
            key="pill"
            ref={pillRef}
            type="button"
            data-brief-pill
            aria-expanded={open}
            onClick={() => setOpen(true)}
            className="fixed bottom-[calc(0.9rem+env(safe-area-inset-bottom))] right-[calc(0.75rem+env(safe-area-inset-right))] z-40 min-h-11 rounded-sm bg-[color:var(--color-paper)] px-3.5 font-mono text-[11px] font-medium tracking-[0.1em] uppercase text-[color:var(--color-paper-ink)] shadow-[0_10px_30px_-10px_rgba(0,0,0,0.8)]"
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 10 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            {briefPillLabel(entries.length)}
          </motion.button>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
