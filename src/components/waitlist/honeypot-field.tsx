'use client';

interface HoneypotFieldProps {
  value: string;
  onChange: (value: string) => void;
}

/**
 * Low-friction spam trap (plan §14). A REAL text input (not display:none) moved
 * off-screen, hidden from assistive tech and the tab order. Humans never fill it;
 * bots that auto-complete every field do. A non-empty value is treated as a bot.
 */
export function HoneypotField({ value, onChange }: HoneypotFieldProps) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        width: 1,
        height: 1,
        padding: 0,
        margin: -1,
        overflow: 'hidden',
        clip: 'rect(0 0 0 0)',
        whiteSpace: 'nowrap',
        border: 0,
      }}
    >
      <label htmlFor="company_website">Company website (leave blank)</label>
      <input
        id="company_website"
        name="company_website"
        type="text"
        tabIndex={-1}
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
