import type { Metadata } from 'next';
import Link from 'next/link';
import { LogoMark } from '@/components/landing/logo-mark';
import {
  withSupportedAttribution,
  type PublicSearchParams,
} from '@/lib/attribution/early-access-link';

export const metadata: Metadata = {
  title: 'ByteSized Careers — Creator-Economy Hiring Marketplace',
  description:
    'ByteSized Careers is building a focused marketplace for creator-economy work and reliable talent.',
  alternates: { canonical: 'https://bytesizedcareers.com/' },
  openGraph: {
    title: 'ByteSized Careers — Creator-Economy Hiring Marketplace',
    description:
      'ByteSized Careers is building a focused marketplace for creator-economy work and reliable talent.',
    url: 'https://bytesizedcareers.com/',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ByteSized Careers — Creator-Economy Hiring Marketplace',
    description:
      'ByteSized Careers is building a focused marketplace for creator-economy work and reliable talent.',
  },
};

interface HomeProps {
  searchParams: Promise<PublicSearchParams>;
}

export default async function Home({ searchParams }: HomeProps) {
  const earlyAccessHref = withSupportedAttribution('/early-access', await searchParams);

  return (
    <div className="relative isolate flex min-h-dvh flex-col overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(circle_at_78%_22%,rgba(91,140,255,0.12),transparent_28%),radial-gradient(circle_at_12%_92%,rgba(163,74,50,0.08),transparent_28%)]" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-[15%] -z-10 hidden w-px bg-gradient-to-b from-transparent via-white/[0.07] to-transparent lg:block" />
      <div aria-hidden="true" className="pointer-events-none absolute top-[18%] right-[8%] -z-10 size-40 rounded-full border border-white/[0.055] sm:size-64 lg:size-80" />

      <header className="safe-page-gutter safe-masthead mx-auto flex w-full max-w-6xl items-center justify-between pb-8">
        <span className="animate-fade-up flex items-center gap-2.5">
          <LogoMark />
          <span className="font-serif text-base font-semibold tracking-tight text-ink">
            ByteSized Careers
          </span>
        </span>
        <span className="animate-fade-up fade-delay-1 hidden font-mono text-[10px] tracking-[0.18em] uppercase text-faint sm:block">
          Marketplace in development
        </span>
      </header>

      <main className="safe-page-gutter mx-auto flex w-full max-w-6xl flex-1 items-center py-12 sm:py-16 lg:py-24">
        <section className="max-w-4xl">
          <p className="animate-fade-up font-mono text-[11px] font-medium tracking-[0.2em] uppercase text-accent">
            Byte-Sized Careers
          </p>
          <h1 className="animate-fade-up fade-delay-1 mt-6 max-w-4xl font-serif text-[clamp(3rem,8.2vw,7rem)] leading-[0.91] tracking-[-0.052em] text-ink text-balance">
            Creator-economy hiring, brought into focus.
          </h1>
          <p className="animate-fade-up fade-delay-2 mt-7 max-w-2xl text-base leading-7 text-muted sm:text-lg sm:leading-8">
            ByteSized Careers is building a focused marketplace for people looking for creator-economy work and the teams looking for reliable talent.
          </p>

          <div className="animate-fade-up fade-delay-3 mt-9 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <Link
              href={earlyAccessHref}
              className="inline-flex min-h-12 items-center justify-center rounded-md bg-accent px-6 py-3 text-sm font-semibold text-accent-contrast transition-colors hover:bg-accent-strong"
            >
              Join early access
              <span aria-hidden="true" className="ml-2">→</span>
            </Link>
            <p className="text-sm text-faint">Early access is now open.</p>
          </div>

          <div className="mt-14 flex items-center gap-3 border-t border-[color:var(--color-line)] pt-6 sm:mt-20">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-accent" />
            <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-muted">
              The marketplace is currently being built.
            </p>
          </div>
        </section>
      </main>

      <footer className="safe-page-gutter safe-footer mx-auto w-full max-w-6xl pt-8 text-sm text-faint">
        <div className="flex flex-col gap-5 border-t border-[color:var(--color-line)] pt-7 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-[11px] tracking-wide">© {new Date().getFullYear()} ByteSized Careers</p>
            <p className="mt-1.5 text-xs">Early-access documents apply to the current early-access programme.</p>
          </div>
          <nav aria-label="Early-access legal" className="flex flex-wrap gap-x-5 gap-y-3">
            <Link href="/early-access/privacy" className="min-h-11 py-3 hover:text-muted">Early Access Privacy</Link>
            <Link href="/early-access/terms" className="min-h-11 py-3 hover:text-muted">Early Access Terms</Link>
            <Link href="/early-access/cookies" className="min-h-11 py-3 hover:text-muted">Early Access Storage</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
