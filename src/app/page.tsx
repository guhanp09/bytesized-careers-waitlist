import Link from 'next/link';
import { WaitlistFlow } from '@/components/waitlist/waitlist-flow';
import { AmbientProvider } from '@/components/waitlist/ambient-context';
import { AmbientBackground } from '@/components/waitlist/ambient-background';
import { LockIcon } from '@/components/ui/icons';

export default function Home() {
  return (
    <AmbientProvider>
      <div className="relative isolate min-h-dvh overflow-hidden">
        <AmbientBackground />

      {/* Header */}
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <span className="animate-fade-up text-sm font-semibold tracking-tight text-ink">
          ByteSized Careers
        </span>
      </header>

      {/* Hero */}
      <main className="mx-auto max-w-2xl px-6 pt-10 pb-20 sm:pt-16">
        <p className="animate-fade-up text-sm font-medium tracking-wide text-accent">
          Early access · before public launch
        </p>
        <h1 className="animate-fade-up fade-delay-1 mt-4 text-4xl font-semibold tracking-tight text-ink text-balance sm:text-5xl">
          Creator-economy careers, without the scattered DMs.
        </h1>
        <p className="animate-fade-up fade-delay-2 mt-5 max-w-xl text-lg leading-relaxed text-muted text-pretty">
          Find creator-economy work and talent without relying on scattered posts,
          DMs and referrals. Join the waitlist to get early access.
        </p>

        <div className="animate-fade-up fade-delay-3 mt-8">
          <WaitlistFlow />
        </div>

        {/* For talent / For hirers */}
        <section className="mt-16 grid gap-8 border-t border-[color:var(--color-line)] pt-12 sm:grid-cols-2">
          <div>
            <h2 className="text-sm font-semibold tracking-wide text-ink">
              For talent
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Editors, designers, writers, strategists and operators — get matched
              to real creator-economy roles that fit what you actually do.
            </p>
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-wide text-ink">
              For hirers
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Creators, agencies and brands — reach vetted talent without digging
              through comment sections and referral chains.
            </p>
          </div>
        </section>

        {/* Trust strip */}
        <section className="mt-12 flex items-start gap-3 rounded-xl border border-[color:var(--color-line)] bg-surface/40 p-5">
          <span className="mt-0.5 text-accent">
            <LockIcon className="size-5" />
          </span>
          <p className="text-sm leading-relaxed text-muted">
            We collect only what helps us match you well — nothing more. Your data is
            never sold, promotional messages are always opt-in, and you can ask us to
            remove your details anytime.{' '}
            <Link href="/privacy" className="text-accent hover:underline">
              Privacy
            </Link>{' '}
            ·{' '}
            <Link href="/terms" className="text-accent hover:underline">
              Terms
            </Link>
          </p>
        </section>
      </main>

      {/* Footer */}
      <footer className="mx-auto max-w-5xl px-6 py-10 text-sm text-faint">
        <div className="flex flex-col items-start justify-between gap-4 border-t border-[color:var(--color-line)] pt-8 sm:flex-row sm:items-center">
          <span>© {new Date().getFullYear()} ByteSized Careers</span>
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
      </div>
    </AmbientProvider>
  );
}
