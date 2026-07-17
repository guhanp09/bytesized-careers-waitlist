import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalCallout, LegalPage, LegalSection } from '@/components/legal/legal-page';

export const metadata: Metadata = {
  title: 'Early Access Terms of Use | ByteSized Careers',
  description: 'Terms for the current ByteSized Careers early-access registration programme before the marketplace launches.',
  alternates: { canonical: '/early-access/terms' },
  openGraph: {
    title: 'Early Access Terms of Use | ByteSized Careers',
    description: 'Terms for the current ByteSized Careers early-access registration programme.',
    url: '/early-access/terms',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Early Access Terms of Use | ByteSized Careers',
    description: 'Terms for the current ByteSized Careers early-access registration programme.',
  },
};

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="ByteSized Careers · Early access"
      title="Early Access Terms of Use"
      summary="These terms govern the current early-access registration experience only. They do not create a job board, recruiting service, talent agency, employment relationship, or guarantee of future access."
    >
      <LegalCallout title="Current scope">
        <p>
          These Terms cover the early-access registration website operated by Guhan Purushothaman. The future
          marketplace has not launched, and these Terms do not govern marketplace accounts, listings or transactions.
        </p>
        <p>
          They apply only to the current registration, verification, administration and early-access communications
          experience. Separate or updated terms will apply before marketplace accounts, profiles, listings,
          applications, messaging, payments or other marketplace features are launched.
        </p>
      </LegalCallout>

      <LegalSection number="01" title="Operator and agreement">
        <p>
          ByteSized Careers is currently operated by <strong className="text-ink">Guhan Purushothaman</strong> from
          Srinagar Colony, Saidapet, Chennai, Tamil Nadu, India. In these Terms, “ByteSized Careers”, “we” and “us”
          refer to Guhan Purushothaman as the operator of this website.
        </p>
        <p>
          By selecting “Get early access” and submitting the registration, you agree to these Terms and acknowledge
          the <Link href="/early-access/privacy">Privacy Notice</Link>. If you do not agree, do not submit the form. Mandatory
          rights under applicable law are not excluded by these Terms.
        </p>
      </LegalSection>

      <LegalSection number="02" title="Eligibility">
        <p>
          You must be at least 18 years old to submit an early-access registration or otherwise use this website,
          have legal capacity to accept these Terms, and use the site only where lawful. If you register for an
          organisation, you confirm that you are authorised to submit its information and accept these Terms for
          the early-access request.
        </p>
      </LegalSection>

      <LegalSection number="03" title="The current early-access service">
        <p>
          The site lets you record interest, describe the type of work or talent relevant to you, verify an email
          address when available, save progress in the same browser, and optionally provide context for product
          research. Registration is currently free and does not create a marketplace account.
        </p>
        <p>
          The creator-economy marketplace is under development and has not launched. We may use aggregate patterns
          and submitted preferences to decide what to build, but we do not currently publish profiles, introduce
          users, rank candidates, conduct screening, act as an employer or recruiter, or complete transactions.
        </p>
        <p>
          Early-access information may later help prepare a marketplace registration invitation with certain fields
          pre-filled. You must be able to review, correct and submit that registration before activation. Nothing is
          automatically made public or visible to recruiters or talent, and no invitation or account is guaranteed.
        </p>
      </LegalSection>

      <LegalSection number="04" title="No promised outcome">
        <p>
          Registration does not guarantee a launch date, admission, priority, an account, visibility, a response,
          a match, work, candidates, interviews, offers, placements, hiring outcomes, revenue, or any other commercial
          result. Product concepts and timing may change. Any future marketplace will have separate or updated terms.
        </p>
      </LegalSection>

      <LegalSection number="05" title="Your registration responsibilities">
        <p>
          Provide information that is accurate to the best of your knowledge, belongs to you or is lawfully supplied,
          and does not mislead others. Keep any browser resume credential confidential; a person with it may be able
          to restore your saved answers. Do not submit another person&apos;s contact details without authority.
        </p>
        <p>
          Optional phone entry alone is not consent to receive calls, SMS, WhatsApp messages, or marketing. Each
          phone channel starts unselected and can be chosen independently. A selected channel covers only the
          occasional early-access and potentially relevant opportunity updates described on the form and in the
          Privacy Notice if and when that channel becomes available. Do not include
          health, financial, government-identity, account credentials, confidential client material, or other
          sensitive information in “Other” fields or notes.
        </p>
      </LegalSection>

      <LegalSection number="06" title="Permitted and prohibited use">
        <p>You may use the website only for genuine early-access registration and ordinary evaluation of the service. You must not:</p>
        <ul>
          <li>break the law, infringe rights, impersonate someone, or submit deceptive, discriminatory, abusive, threatening, obscene, or harmful material;</li>
          <li>probe, bypass, or interfere with authentication, access controls, rate limits, verification, or service availability;</li>
          <li>introduce malicious code, scrape at unreasonable volume, automate false registrations, or use the service to distribute spam;</li>
          <li>reverse engineer the service except where applicable law expressly permits it; or</li>
          <li>use another person&apos;s resume credential or administrator access without permission.</li>
        </ul>
      </LegalSection>

      <LegalSection number="07" title="Your submissions and feedback">
        <p>
          You retain ownership of original material you submit. You give ByteSized Careers a limited, non-exclusive,
          worldwide, royalty-free licence to host, copy, structure, secure, analyse, and otherwise process that
          material only to operate early access, communicate as described in the Privacy Notice, conduct product
          research, and design or improve the future marketplace. This licence lasts only while reasonably necessary
          for those purposes and any required legal retention.
        </p>
        <p>
          If you voluntarily provide product ideas or feedback, we may evaluate and use the idea without promising
          compensation or adoption, but this does not transfer ownership of your pre-existing work or permit us to
          identify you publicly without permission.
        </p>
      </LegalSection>

      <LegalSection number="08" title="ByteSized Careers materials">
        <p>
          The site&apos;s software, design, branding, illustrations, copy, and compilation are owned by or licensed to
          ByteSized Careers and protected by applicable intellectual-property laws. These Terms give you only a
          limited, revocable right to use the current site for its intended purpose. No ByteSized Careers trade mark
          or other right is transferred to you.
        </p>
      </LegalSection>

      <LegalSection number="09" title="Communications and privacy">
        <p>
          Depending on the features available, we may send email verification; registration administration;
          incomplete-registration reminders; material early-access, security, privacy or legal changes; launch
          announcements; marketplace invitations; and, once suitable functionality exists, notices about a
          potentially relevant opportunity, participant, talent requirement, recruiter need or marketplace activity.
          Relevance notices and active matching are not available today and never guarantee suitability, a reply,
          interview, engagement, job, candidate, hire, introduction or commercial outcome.
        </p>
        <p>
          You may opt out of optional launch, invitation and relevance-related emails using an unsubscribe method
          included in a message, where available, or by contacting{' '}
          <a href="mailto:legal@bytesizedcareers.com">legal@bytesizedcareers.com</a>. Opting out does not delete the
          underlying registration; deletion is a separate request. Necessary service, security, legal and
          request-response messages may still be sent. A phone number alone is not consent to calls, SMS, WhatsApp,
          automated calling or marketing. Separately selected phone-channel choices may be withdrawn for future
          contact at any time through <a href="mailto:legal@bytesizedcareers.com">legal@bytesizedcareers.com</a>;
          matching and phone outreach are not active today. See the <Link href="/early-access/privacy">Privacy Notice</Link> and{' '}
          <Link href="/early-access/cookies">Cookie &amp; storage notice</Link>.
        </p>
      </LegalSection>

      <LegalSection number="10" title="Providers and outside services">
        <p>
          The site depends on third-party infrastructure, including Vercel, Neon, Resend, and GitHub for the functions
          described in the Privacy Notice. Their availability can affect ours, and their own terms govern their
          direct relationship with you. Links to third-party sites are provided for context and are not an endorsement.
        </p>
      </LegalSection>

      <LegalSection number="11" title="Suspension, removal, and discontinuation">
        <p>
          We may reject, suspend, or remove a registration where reasonably necessary to address unlawful conduct,
          abuse, security risk, inaccurate information, violation of these Terms, or a legal requirement. Where
          practical and lawful, we will use proportionate measures and allow correction. We may change, delay,
          pause, or discontinue early access or the planned marketplace. If discontinued, personal information will
          be handled under the Privacy Notice and an approved retention schedule.
        </p>
      </LegalSection>

      <LegalSection number="12" title="Disclaimers">
        <p>
          To the extent permitted by law, the pre-launch site is provided on an “as is” and “as available” basis.
          We do not promise uninterrupted or error-free operation, permanent storage, or that future concepts will
          launch as described. Information on the site is general product information, not employment, recruiting,
          legal, tax, financial, or professional advice. Nothing here excludes warranties or remedies that cannot
          lawfully be excluded.
        </p>
      </LegalSection>

      <LegalSection number="13" title="Proportionate liability limits">
        <p>
          Subject to rights and liabilities that cannot lawfully be limited, ByteSized Careers will not be liable
          for indirect, incidental, special, or consequential loss arising solely from use of this free pre-launch
          registration service, including lost opportunities or reliance on a future launch. Nothing in these Terms
          limits liability for fraud, wilful misconduct, or any other liability that applicable law says cannot be limited.
        </p>
      </LegalSection>

      <LegalSection number="14" title="Governing law and disputes">
        <p>
          These Terms are governed by the laws of India. Disputes relating to these Terms or the current early-access
          website are subject to the competent courts in Chennai, Tamil Nadu. Mandatory rights, remedies, laws or
          forums that cannot legally be excluded remain unaffected.
        </p>
      </LegalSection>

      <LegalSection number="15" title="General terms">
        <p>
          If a provision is unenforceable, it should be limited or removed only as far as necessary, and the rest
          remains effective. A delay in enforcement is not a waiver. You may not assign your registration or these
          Terms without our consent; the operator may assign them as part of a genuine reorganisation or transfer of
          the service, subject to applicable notice and privacy obligations. These Terms and the documents they link
          to are the agreement for the current early-access site and do not create a partnership, agency, or employment relationship.
        </p>
      </LegalSection>

      <LegalSection number="16" title="Changes and contact">
        <p>
          We may update these Terms to reflect the service or law. Material changes should be clearly dated and,
          where appropriate, notified before they apply. Changes do not retroactively take away accrued rights.
          New marketplace terms must replace or expand these Terms before accounts, profiles, matching, hiring tools,
          payments, or other marketplace functions launch.
        </p>
        <p>
          Legal notices and questions:{' '}
          <a href="mailto:legal@bytesizedcareers.com">legal@bytesizedcareers.com</a><br />
          Operator location: Srinagar Colony, Saidapet, Chennai, Tamil Nadu, India
        </p>
      </LegalSection>
    </LegalPage>
  );
}
