import type { ReactNode } from 'react';
import Link from 'next/link';
import { LogoMark } from '@/components/landing/logo-mark';

const legalLinks = [
  { href: '/early-access/privacy', label: 'Early Access Privacy Notice' },
  { href: '/early-access/terms', label: 'Early Access Terms of Use' },
  { href: '/early-access/cookies', label: 'Early Access Storage Notice' },
] as const;

interface LegalPageProps {
  eyebrow: string;
  title: string;
  summary: string;
  children: ReactNode;
}

export function LegalPage({ eyebrow, title, summary, children }: LegalPageProps) {
  return (
    <div className="relative isolate min-h-dvh overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_22%_5%,rgba(91,140,255,0.12),transparent_31%),linear-gradient(rgba(255,255,255,0.018)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.018)_1px,transparent_1px)] bg-[size:auto,64px_64px,64px_64px]"
      />

      <header className="safe-page-gutter safe-masthead mx-auto flex max-w-6xl items-center justify-between pb-8">
        <Link href="/" className="flex items-center gap-2.5" aria-label="ByteSized Careers home">
          <LogoMark />
          <span className="font-serif text-base font-semibold tracking-tight text-ink">
            ByteSized Careers
          </span>
        </Link>
        <span className="hidden font-mono text-[10px] tracking-[0.18em] uppercase text-faint sm:block">
          Early-access record
        </span>
      </header>

      <main className="safe-page-gutter mx-auto max-w-6xl pb-20">
        <div className="border-y border-[color:var(--color-line)] py-10 sm:py-14">
          <p className="font-mono text-[11px] font-medium tracking-[0.18em] uppercase text-accent">
            {eyebrow}
          </p>
          <h1 className="mt-4 max-w-4xl font-serif text-[clamp(2.5rem,7vw,5.5rem)] leading-[0.94] tracking-[-0.045em] text-ink text-balance">
            {title}
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-muted sm:text-lg">
            {summary}
          </p>
          <p className="mt-5 font-mono text-[10px] tracking-[0.15em] uppercase text-faint">
            Effective 17 July 2026 · Last updated 17 July 2026
          </p>
        </div>

        <div className="mt-10 grid min-w-0 gap-12 lg:grid-cols-[210px_minmax(0,720px)] lg:gap-16">
          <aside className="min-w-0 lg:sticky lg:top-8 lg:self-start">
            <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-faint">
              Legal record
            </p>
            <nav aria-label="Legal pages" className="mt-4 flex flex-col items-start gap-3 text-sm">
              {legalLinks.map((link) => (
                <Link key={link.href} href={link.href} className="text-muted hover:text-ink hover:underline">
                  {link.label}
                </Link>
              ))}
            </nav>
          </aside>

          <article className="min-w-0 space-y-12 text-[0.95rem] leading-7 text-muted sm:text-base">
            {children}
          </article>
        </div>
      </main>

      <footer className="safe-page-gutter safe-footer mx-auto max-w-6xl text-sm text-faint">
        <div className="flex flex-col gap-4 border-t border-[color:var(--color-line)] pt-8 sm:flex-row sm:items-baseline sm:justify-between">
          <span className="font-mono text-[11px] tracking-wide">
            © {new Date().getFullYear()} ByteSized Careers
          </span>
          <Link href="/early-access" className="hover:text-muted hover:underline">
            Return to early access
          </Link>
        </div>
      </footer>
    </div>
  );
}

interface LegalSectionProps {
  number: string;
  title: string;
  children: ReactNode;
}

export function LegalSection({ number, title, children }: LegalSectionProps) {
  return (
    <section aria-labelledby={`section-${number}`} className="min-w-0 border-t border-[color:var(--color-line)] pt-6">
      <div className="grid gap-3 sm:grid-cols-[44px_minmax(0,1fr)]">
        <span aria-hidden="true" className="font-mono text-[10px] tracking-[0.16em] text-accent">
          {number}
        </span>
        <div className="min-w-0">
          <h2 id={`section-${number}`} className="font-serif text-2xl leading-tight tracking-tight text-ink sm:text-3xl">
            {title}
          </h2>
          <div className="mt-4 min-w-0 space-y-4 break-words [&_a]:text-accent [&_a]:underline-offset-4 [&_a:hover]:underline [&_li]:pl-1 [&_ul]:ml-5 [&_ul]:list-disc [&_ul]:space-y-2">
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}

export function LegalCallout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <aside className="rounded-xl border border-accent/30 bg-accent/8 p-5 text-sm leading-6 text-muted">
      <h2 className="font-mono text-[10px] font-medium tracking-[0.16em] uppercase text-accent">
        {title}
      </h2>
      <div className="mt-2 space-y-3">{children}</div>
    </aside>
  );
}
