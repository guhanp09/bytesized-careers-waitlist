import Link from 'next/link';

export const metadata = { title: 'Privacy · ByteSized Careers' };

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <Link href="/" className="text-sm text-accent hover:underline">
        ← Back
      </Link>
      <h1 className="mt-6 text-3xl font-semibold tracking-tight text-ink">
        Privacy
      </h1>
      <p className="mt-2 text-sm text-muted">
        How we handle the information you share when joining the waitlist.
      </p>

      <div className="mt-8 flex flex-col gap-8 text-sm leading-relaxed text-muted">
        <section>
          <h2 className="text-base font-medium text-ink">What we collect</h2>
          <p className="mt-2">
            Your email address; and, if you choose to provide them, your role
            (looking for work, hiring, or both), your job/talent interests and
            preferred work formats, your organisation type, and your phone number.
            We also record basic attribution metadata (referrer and any UTM
            parameters) and timestamps.
          </p>
        </section>

        <section>
          <h2 className="text-base font-medium text-ink">Why we collect it</h2>
          <p className="mt-2">
            To let you know when relevant creator-economy opportunities and early
            access become available, and to reach you with messages matched to your
            interests rather than generic promotions. Providing anything beyond your
            email is optional.
          </p>
        </section>

        <section>
          <h2 className="text-base font-medium text-ink">Consent</h2>
          <p className="mt-2">
            WhatsApp alerts are strictly opt-in — we only message you there if you
            explicitly tick that box, and never as a side effect of entering your
            phone number. You can withdraw consent at any time by contacting us.
          </p>
        </section>

        <section>
          <h2 className="text-base font-medium text-ink">
            What we don&apos;t do
          </h2>
          <p className="mt-2">
            We do not sell your data. We do not run invasive tracking or third-party
            advertising analytics on this page. We collect only what helps us contact
            you with relevant opportunities.
          </p>
        </section>

        <section>
          <h2 className="text-base font-medium text-ink">
            Access &amp; deletion
          </h2>
          <p className="mt-2">
            You can ask us to delete your information from the waitlist at any time,
            and we will remove it. To make a request, email{' '}
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
