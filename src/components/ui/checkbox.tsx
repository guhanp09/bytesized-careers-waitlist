'use client';

import { cn } from '@/lib/utils/cn';

interface CheckboxProps {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: React.ReactNode;
  disabled?: boolean;
}

/**
 * Accessible checkbox using a native input (plan §16). Consent checkboxes must never be
 * preselected — the caller controls `checked` and defaults it to false.
 */
export function Checkbox({ id, checked, onChange, label, disabled }: CheckboxProps) {
  return (
    <label
      htmlFor={id}
      className={cn(
        'flex items-start gap-3 text-sm text-muted',
        disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
      )}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 size-5 shrink-0 rounded border-[color:var(--color-line-strong)] accent-[color:var(--color-accent)]"
      />
      <span>{label}</span>
    </label>
  );
}
