'use client';

import { useMemo } from 'react';
import { getCountries, getCountryCallingCode } from 'libphonenumber-js';

interface CountrySelectProps {
  value: string;
  onChange: (iso: string) => void;
  disabled?: boolean;
  id?: string;
}

/**
 * Country selector for the phone step. Country names come from Intl.DisplayNames; calling
 * codes from libphonenumber-js. A native <select> keeps it accessible and lightweight.
 */
export function CountrySelect({
  value,
  onChange,
  disabled,
  id = 'country',
}: CountrySelectProps) {
  const options = useMemo(() => {
    const displayNames = new Intl.DisplayNames(['en'], { type: 'region' });
    return getCountries()
      .map((iso) => ({
        iso,
        name: displayNames.of(iso) ?? iso,
        code: getCountryCallingCode(iso),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      aria-label="Country calling code"
      className="h-13 rounded-xl border border-[color:var(--color-line)] bg-surface px-3 text-sm text-ink focus:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60"
    >
      {options.map((option) => (
        <option key={option.iso} value={option.iso}>
          {option.name} (+{option.code})
        </option>
      ))}
    </select>
  );
}
