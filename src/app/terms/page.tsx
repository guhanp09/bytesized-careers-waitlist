import Link from 'next/link';

export const metadata = { title: 'Terms · ByteSized Careers' };

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <Link href="/" className="text-sm text-accent hover:underline">
        ← Back
      </Link>
      <h1 className="mt-6 text-3xl font-semibold tracking-tight text-ink">Terms</h1>
      <p className="mt-2 text-sm text-muted">
        The simple conditions of joining the ByteSized Careers waitlist.
      </p>

      <div className="mt-8 flex flex-col gap-8 text-sm leading-relaxed text-muted">
        <section>
          <h2 className="text-base font-medium text-ink">Joining the waitlist</h2>
          <p className="mt-2">
            Joining the waitlist expresses interest in ByteSized Careers ahead of
            public launch. It creates no obligation on your part, requires no account,
            and carries no fees. Early access is not guaranteed and timelines may
            change.
          </p>
        </section>

        <section>
          <h2 className="text-base font-medium text-ink">Communications</h2>
          <p className="mt-2">
            We may email you about launch updates and opportunities relevant to the
            interests you shared. WhatsApp messages are sent only if you explicitly
            opted in. You can unsubscribe or withdraw consent at any time.
          </p>
        </section>

        <section>
          <h2 className="text-base font-medium text-ink">No guarantees</h2>
          <p className="mt-2">
            The platform is under development. Features described here are indicative
            and may change. Nothing on this page is an offer of employment or a
            guarantee of hiring outcomes.
          </p>
        </section>

        <section>
          <h2 className="text-base font-medium text-ink">Contact</h2>
          <p className="mt-2">
            Questions about these terms? Email{' '}
            <a
              href="mailto:guhanp09@gmail.com"
              className="text-accent hover:underline"
            >
              guhanp09@gmail.com
            </a>
            .
          </p>
        </section>
      </div>
    </main>
  );
}
