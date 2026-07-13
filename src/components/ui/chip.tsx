'use client';

import { cn } from '@/lib/utils/cn';

interface ChipProps {
  label: string;
  selected: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

/**
 * Multi-select chip (plan §7). Uses role="checkbox" + aria-checked so multi-select
 * semantics are exposed to assistive tech.
 */
export function Chip({ label, selected, onToggle, disabled = false }: ChipProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={selected}
      disabled={disabled}
      onClick={onToggle}
      className={cn(
        'rounded-full border px-4 py-2 text-sm transition-all duration-150',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
        'disabled:opacity-50',
        selected
          ? 'border-accent bg-accent/10 text-ink'
          : 'border-[color:var(--color-line)] bg-surface text-muted hover:border-[color:var(--color-line-strong)] hover:text-ink',
      )}
    >
      {label}
    </button>
  );
}
