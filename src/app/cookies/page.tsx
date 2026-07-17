import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalCallout, LegalPage, LegalSection } from '@/components/legal/legal-page';

export const metadata: Metadata = {
  title: 'Cookie & storage notice · ByteSized Careers',
  description: 'First-party browser storage used by the ByteSized Careers early-access website.',
};

const rows = [
  {
    name: 'bytesized_waitlist_resume (localStorage)',
    category: 'Functional / requested flow',
    purpose: 'Restores a saved early-access brief in the same browser.',
    data: 'Opaque lead ID, raw random resume credential, saved-at time.',
    duration: 'Browser copy persists until cleared; the server rejects the credential after 30 days.',
    timing: 'Set after the visitor submits name and email and asks the site to create a registration.',
  },
  {
    name: '__Secure-authjs.session-token (may be split into numbered cookies)',
    category: 'Strictly necessary · admin only',
    purpose: 'Maintains an authenticated, allowlisted administrator session.',
    data: 'Encrypted/signed session token containing administrator account/session claims.',
    duration: 'Up to 30 days of inactivity by the installed Auth.js default.',
    timing: 'Set only through the restricted admin sign-in flow.',
  },
  {
    name: '__Host-authjs.csrf-token and __Secure-authjs.callback-url',
    category: 'Strictly necessary · admin only',
    purpose: 'Protects sign-in requests and returns the administrator to the intended page.',
    data: 'Security token and same-site callback location.',
    duration: 'Session or flow duration.',
    timing: 'Set when the restricted admin authentication flow is used.',
  },
  {
    name: '__Secure-authjs.pkce.code_verifier, __Secure-authjs.state (and a nonce if required)',
    category: 'Strictly necessary · admin only',
    purpose: 'Prevents OAuth request forgery and binds the GitHub callback to the sign-in attempt.',
    data: 'Short-lived, protected OAuth security values.',
    duration: 'Generally 15 minutes for PKCE/state; removed or expired after the sign-in flow.',
    timing: 'Set only when an administrator starts GitHub sign-in.',
  },
] as const;

export default function CookiesPage() {
  return (
    <LegalPage
      eyebrow="Cookie & storage notice"
      title="A short ledger of what the browser keeps."
      summary="The current public experience has no analytics or advertising storage. It keeps one first-party resume record after registration begins; restricted admin authentication uses security cookies."
    >
      <LegalCallout title="Consent conclusion">
        <p>
          The audited version does not need a general tracking banner: it has no analytics, advertising, or
          cross-site profiling technologies. The resume record supports the registration flow the visitor requests,
          and admin cookies are necessary for security. This conclusion must be revisited before any non-essential
          analytics, advertising, session replay, or similar technology is added.
        </p>
      </LegalCallout>

      <LegalSection number="01" title="What we mean by storage">
        <p>
          Cookies are small values a website asks a browser to send with later requests. localStorage is a similar
          browser feature that keeps a value on the device but does not automatically send it with every request.
          Both can fall under device-storage rules, so this notice describes both rather than calling everything a cookie.
        </p>
      </LegalSection>

      <LegalSection number="02" title="Storage used in the audited version">
        <div className="space-y-5">
          {rows.map((row) => (
            <section key={row.name} className="min-w-0 rounded-xl border border-[color:var(--color-line)] bg-surface/65 p-4 sm:p-5">
              <h3 className="break-words font-mono text-xs leading-5 text-ink">{row.name}</h3>
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-[110px_minmax(0,1fr)]">
                <dt className="text-faint">Category</dt><dd>{row.category}</dd>
                <dt className="text-faint">Purpose</dt><dd>{row.purpose}</dd>
                <dt className="text-faint">Data</dt><dd>{row.data}</dd>
                <dt className="text-faint">Duration</dt><dd>{row.duration}</dd>
                <dt className="text-faint">When active</dt><dd>{row.timing}</dd>
                <dt className="text-faint">Party</dt><dd>First party; the authentication flow also communicates directly with GitHub.</dd>
              </dl>
            </section>
          ))}
        </div>
        <p>
          On localhost, Auth.js uses equivalent cookie names without the HTTPS-only prefixes. The site does not
          intentionally set the WebAuthn challenge cookie available in the library because WebAuthn is not configured.
        </p>
        <p>
          Form answers—including an optional phone number and separate WhatsApp, SMS, or call choices—are saved in
          the server-side waitlist record described in the <Link href="/privacy">Privacy Notice</Link>. Those choices
          do not add another cookie or browser-storage item and do not activate tracking or phone communications.
        </p>
      </LegalSection>

      <LegalSection number="03" title="Your controls">
        <p>
          You can clear site data through browser settings. Choosing “Start over” after a saved registration is found
          also removes the resume record. Blocking localStorage may prevent resume convenience but should not prevent
          a new registration. Blocking the admin security cookies prevents restricted administrators from signing in.
        </p>
        <p>
          Clearing the browser copy does not delete the server-side waitlist record. To request access, correction,
          or deletion, follow the process in the <Link href="/privacy">Privacy Notice</Link>.
        </p>
      </LegalSection>

      <LegalSection number="04" title="No analytics or advertising storage">
        <p>
          Repository inspection found no active analytics, advertising pixels, session replay, behavioural profiling,
          or cross-site ad measurement. If that changes, ByteSized Careers must update this notice and assess whether
          prior consent, equal Accept/Reject controls, and a persistent preference control are required in each target market.
        </p>
      </LegalSection>

      <LegalSection number="05" title="Contact and changes">
        <p>
          Storage questions may be sent to{' '}
          <a href="mailto:legal@bytesizedcareers.com">legal@bytesizedcareers.com</a>. This notice should be reviewed
          when the public flow, admin authentication, providers, or browser technologies change.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
