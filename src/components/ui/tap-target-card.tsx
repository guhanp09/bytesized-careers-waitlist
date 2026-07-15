'use client';

import { cn } from '@/lib/utils/cn';

interface TapTargetCardProps {
  label: string;
  description?: string;
  selected?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  onSelect: () => void;
}

/**
 * Large, inviting single-choice card (plan §7, §8). Rendered as a button with
 * aria-pressed for accessibility; selection shows an accent border + check, never a
 * full colour-fill takeover (keeps the dark surface calm).
 */
export function TapTargetCard({
  label,
  description,
  selected = false,
  disabled = false,
  icon,
  onSelect,
}: TapTargetCardProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        'group flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-all duration-200',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
        'disabled:opacity-50',
        selected
          ? 'border-accent bg-accent/5'
          : 'border-[color:var(--color-line)] bg-surface hover:border-[color:var(--color-line-strong)] hover:bg-elevated',
      )}
    >
      {icon ? (
        <span
          aria-hidden="true"
          className={cn(
            'flex size-10 shrink-0 items-center justify-center rounded-lg border transition-colors duration-200',
            selected
              ? 'border-accent/40 bg-accent/10 text-accent'
              : 'border-[color:var(--color-line)] bg-elevated text-muted',
          )}
        >
          {icon}
        </span>
      ) : null}

      <span className="flex flex-1 flex-col gap-1">
        <span className="text-base font-medium text-ink">{label}</span>
        {description ? (
          <span className="text-sm text-muted">{description}</span>
        ) : null}
      </span>

      <span
        aria-hidden="true"
        className={cn(
          'flex size-6 shrink-0 items-center justify-center rounded-full border transition-colors duration-200',
          selected
            ? 'border-accent bg-accent text-accent-contrast'
            : 'border-[color:var(--color-line-strong)] text-transparent',
        )}
      >
        <svg viewBox="0 0 20 20" fill="none" className="size-3.5">
          <path
            d="M4 10.5l3.5 3.5L16 5.5"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </button>
  );
}
