import Link from 'next/link';
import { WaitlistFlow } from '@/components/waitlist/waitlist-flow';
import { BriefProvider } from '@/components/brief/brief-context';
import { BriefRail } from '@/components/brief/brief-rail';
import { BriefDrawer } from '@/components/brief/brief-drawer';
import { ScrapsLayer } from '@/components/landing/scraps-layer';
import { HeroStatement } from '@/components/landing/hero-statement';
import { LogoMark } from '@/components/landing/logo-mark';
import { MatchInterlude } from '@/components/landing/match-interlude';
import { Reveal } from '@/components/landing/reveal';
import { LockIcon } from '@/components/ui/icons';
import { COLOPHON } from '@/lib/copy/flow-copy';

/**
 * "The Brief" — the page writes a hiring brief with the visitor. Asymmetric editorial
 * composition on desktop (form column + sticky brief rail); a single centered column with
 * a bottom brief drawer on mobile. The margins carry the "noise" of scattered hiring,
 * which recedes as the visitor's brief takes shape.
 */
export default function Home() {
  return (
    <BriefProvider>
      {/* No overflow-hidden here: it would become the sticky rail's containing scroller
          and defeat position:sticky. The scraps layer clips itself. */}
      <div className="relative isolate min-h-dvh">
        <ScrapsLayer />

        {/* Masthead */}
        <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
          <span className="animate-fade-up flex items-center gap-2.5">
            <LogoMark />
            <span className="font-serif text-base font-semibold tracking-tight text-ink">
              ByteSized Careers
            </span>
          </span>
          <span className="animate-fade-up fade-delay-1 hidden font-mono text-[10px] tracking-[0.18em] uppercase text-faint sm:block">
            Founding cohort · No. 001
          </span>
        </header>

        <main className="mx-auto max-w-6xl px-6 pb-20">
          {/* The companion column spans the entire editorial journey (hero → form →
              interlude → colophon), so the sticky brief accompanies every step instead of
              bottoming out when a later question scrolls into focus. */}
          <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-14 xl:gap-20">
            {/* Primary column: the interview, then the editorial matter */}
            <div className="mx-auto w-full max-w-2xl lg:mx-0">
              <HeroStatement />
              <div className="animate-fade-up fade-delay-3 mt-9">
                <WaitlistFlow />
              </div>

              <MatchInterlude />

              {/* Colophon trust strip */}
              <Reveal className="mt-20">
                <section className="flex items-start gap-3 border-t border-[color:var(--color-line)] pt-8">
                  <span className="mt-0.5 text-accent">
                    <LockIcon className="size-4" />
                  </span>
                  <p className="max-w-2xl text-sm leading-relaxed text-muted">
                    {COLOPHON}{' '}
                    <Link href="/privacy" className="text-accent hover:underline">
                      Privacy
                    </Link>{' '}
                    ·{' '}
                    <Link href="/terms" className="text-accent hover:underline">
                      Terms
                    </Link>
                  </p>
                </section>
              </Reveal>
            </div>

            {/* The living artifact — pinned alongside the whole journey */}
            <div className="relative mt-10 lg:mt-24">
              <BriefRail />
            </div>
          </div>
        </main>

        {/* Footer colophon */}
        <footer className="mx-auto max-w-6xl px-6 py-10 text-sm text-faint">
          <div className="flex flex-col items-start justify-between gap-4 border-t border-[color:var(--color-line)] pt-8 sm:flex-row sm:items-baseline">
            <span className="font-mono text-[11px] tracking-wide">
              © {new Date().getFullYear()} ByteSized Careers — set in Fraunces & Plex
            </span>
            <nav className="flex gap-6">
              <Link href="/privacy" className="hover:text-muted">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-muted">
                Terms
              </Link>
            </nav>
          </div>
        </footer>

        <BriefDrawer />
      </div>
    </BriefProvider>
  );
}
