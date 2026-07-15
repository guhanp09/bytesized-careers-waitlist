'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export function FilterSearch({ defaultValue, className }: { defaultValue: string; className: string }) {
  const [value, setValue] = useState(defaultValue);
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const timeout = window.setTimeout(() => {
      const next = new URLSearchParams(params.toString());
      const query = value.trim();
      if ((params.get('q') ?? '') === query) return;
      if (query) next.set('q', query);
      else next.delete('q');
      next.delete('page');
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    }, 450);
    return () => window.clearTimeout(timeout);
  }, [params, pathname, router, value]);

  return (
    <input
      type="search"
      name="q"
      value={value}
      onChange={(event) => setValue(event.target.value)}
      placeholder="Email, phone, need or comment…"
      className={className}
    />
  );
}
