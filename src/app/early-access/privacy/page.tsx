import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalCallout, LegalPage, LegalSection } from '@/components/legal/legal-page';

export const metadata: Metadata = {
  title: 'Early Access Privacy Notice | ByteSized Careers',
  description: 'How the ByteSized Careers early-access registration programme handles personal information before the marketplace launches.',
  alternates: { canonical: '/early-access/privacy' },
  openGraph: {
    title: 'Early Access Privacy Notice | ByteSized Careers',
    description: 'Privacy information for the current ByteSized Careers early-access registration programme.',
    url: '/early-access/privacy',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Early Access Privacy Notice | ByteSized Careers',
    description: 'Privacy information for the current ByteSized Careers early-access registration programme.',
  },
};

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="ByteSized Careers · Early access"
      title="Early Access Privacy Notice"
      summary="This notice explains what the ByteSized Careers early-access website collects today, why it is used, where it goes, and what choices you have. The hiring marketplace itself has not launched."
    >
      <LegalCallout title="The current service">
        <p>
          ByteSized Careers is an early-access registration website operated from India. It is preparing for a
          future creator-economy hiring marketplace; it does not currently list jobs, publish profiles, accept
          applications, introduce participants, or make matches.
        </p>
        <p>
          This notice applies only to the current early-access registration programme and its associated
          verification, administration and communications. A separate or updated privacy notice will apply before
          marketplace accounts, public profiles, listings, applications, messaging or other marketplace features launch.
        </p>
      </LegalCallout>

      <LegalSection number="01" title="Who is responsible for this website">
        <p>
          ByteSized Careers is currently operated by <strong className="text-ink">Guhan Purushothaman</strong> from
          Srinagar Colony, Saidapet, Chennai, Tamil Nadu, India. Depending on the law that applies, Guhan
          Purushothaman is the data fiduciary or controller for the processing described here.
        </p>
        <p>
          Privacy, legal and grievance contact:{' '}
          <a href="mailto:legal@bytesizedcareers.com">legal@bytesizedcareers.com</a>.
        </p>
      </LegalSection>

      <LegalSection number="02" title="What ByteSized Careers is today">
        <p>
          This is a pre-launch registration experience for a future creator-economy hiring marketplace.
          It records interest from people seeking work, people seeking talent, and people on both sides. It does
          not currently provide accounts, publish profiles, introduce users, rank candidates, make matches, or
          make employment decisions. Joining does not guarantee admission, a launch date, work, applicants,
          interviews, offers, placements, or any other outcome.
        </p>
      </LegalSection>

      <LegalSection number="03" title="Information you deliberately provide">
        <p>Depending on the answers you choose to give, the site stores:</p>
        <ul>
          <li>your full name and email address (required to start a new registration);</li>
          <li>whether you are looking for work, hiring, or both;</li>
          <li>job or talent categories and section-specific “Other” answers;</li>
          <li>work-format, organisation-type, platform, niche, experience, availability, hiring-timeline, and team-size selections;</li>
          <li>an optional portfolio or company URL;</li>
          <li>an optional phone number and selected country, stored in a standard international format;</li>
          <li>separate, optional choices for future WhatsApp messages, SMS, and phone calls, together with the consent-copy version, recording time, and form source; and</li>
          <li>an optional final note and other open-text responses.</li>
        </ul>
        <p>
          Most questions after name and email can be skipped. A phone number is not verified, does not trigger an
          OTP, and by itself is not consent to receive calls, SMS, WhatsApp, or marketing. Every phone channel starts
          unselected and may be chosen independently only after a valid number is entered. Please do not put health,
          financial, government-identity, account credentials, or other sensitive information in free-text fields.
        </p>
      </LegalSection>

      <LegalSection number="04" title="Information collected during use">
        <p>The site also records or processes:</p>
        <ul>
          <li>registration, completion, verification, and update timestamps and status;</li>
          <li>first-touch source, referral, UTM campaign parameters, and browser referrer when available;</li>
          <li>a request IP address transiently for abuse prevention; the application stores a peppered hash in a ten-minute rate-limit bucket rather than the raw IP address;</li>
          <li>request and error information in hosting logs, which may include ordinary network and device metadata handled by the hosting provider;</li>
          <li>an opaque lead identifier and a cryptographically random resume credential in local browser storage; and</li>
          <li>admin sign-in information received through GitHub OAuth for the restricted operator dashboard.</li>
        </ul>
        <p>
          The site has no advertising pixels, behavioural advertising SDKs, or general audience analytics in the
          inspected implementation. Browser language is used on the device to suggest a phone country and is not
          separately stored by the application.
        </p>
      </LegalSection>

      <LegalSection number="05" title="Email verification and communications">
        <p>
          When verification is available, ByteSized Careers sends a six-digit code to the address you entered.
          The database stores a keyed hash of the code—not the code itself—together with expiry, attempt, request,
          delivery, and provider-message metadata. A code expires after ten minutes and verification attempts are limited.
        </p>
        <p>
          Depending on which features are available, people on the early-access list may receive email verification;
          registration confirmation or administration; reminders reasonably connected to an incomplete registration;
          important early-access, security, privacy or legal changes; launch announcements; invitations to access or
          register for the marketplace; and, after suitable marketplace functionality exists, notices that a
          potentially relevant opportunity, participant, talent requirement or recruiter need may exist.
        </p>
        <p>
          Relevance notices and active matching are not available today. A future notice would be an indication of
          potential relevance only—not a promise of suitability, a reply, interview, engagement, job, candidate,
          hire, introduction or commercial outcome. Unrelated promotional advertising is separate from these
          early-access and marketplace-related messages. If you separately choose WhatsApp, SMS, or phone calls,
          that choice permits occasional early-access and potentially relevant opportunity updates through only the
          selected channel if and when that channel becomes available. Matching and phone outreach are not active today.
        </p>
        <p>
          You may opt out of optional launch, invitation and relevance-related emails using an unsubscribe method
          included in the message, where available, or by contacting{' '}
          <a href="mailto:legal@bytesizedcareers.com">legal@bytesizedcareers.com</a>. An opt-out does not by itself
          delete the waitlist record. Necessary service, security, legal or request-response messages may still be
          sent. Deletion is a separate request. No optional bulk campaign should begin until a dependable
          suppression or unsubscribe process is operating.
        </p>
        <p>
          You can withdraw one or more phone-channel choices at any time by contacting{' '}
          <a href="mailto:legal@bytesizedcareers.com">legal@bytesizedcareers.com</a>. Withdrawal applies to future
          contact through that channel and does not affect processing already carried out lawfully. Removing the
          saved phone number in the resumable form clears all three channel choices. Standard carrier charges may apply.
        </p>
      </LegalSection>

      <LegalSection number="06" title="Why information is used">
        <ul>
          <li>to create, save, restore, and administer your early-access registration;</li>
          <li>to verify control of an email address and deliver related service messages;</li>
          <li>to understand demand, research product needs, and design the future marketplace using submitted preferences and aggregate summaries;</li>
          <li>to organise early-access participants by the roles, skills, work and talent they are interested in;</li>
          <li>to notify you when ByteSized Careers launches or begins opening access and invite you to register;</li>
          <li>if you separately select a phone channel, to preserve that choice and use only that channel for the disclosed occasional updates if and when it is activated;</li>
          <li>to prepare an invitation with some supplied fields pre-filled, where technically available, for you to review and submit;</li>
          <li>after suitable functionality exists, to identify and notify you about potentially relevant talent, recruiter requirements, opportunities or marketplace activity;</li>
          <li>to respond to requests and maintain accurate records;</li>
          <li>to secure the service, rate-limit abuse, diagnose failures, and protect users and infrastructure; and</li>
          <li>to understand which campaign or referral first brought a registration to the site.</li>
        </ul>
        <p>
          No current feature uses the information to make a solely automated decision with legal or similarly
          significant effects. The admin dashboard presents descriptive totals and filters; it does not score or rank people.
        </p>
      </LegalSection>

      <LegalSection number="07" title="Processing grounds">
        <p>
          ByteSized Careers is operated from India. Depending on the law and purpose, processing may be justified by
          your request to join and use early access; consent where it is requested and legally necessary; legitimate
          interests in operating, securing, researching and improving a proportionate pre-launch service where those
          interests are not overridden by your rights; or compliance with a legal obligation. Consent can be
          withdrawn for future processing that relies on it, without affecting processing already carried out lawfully.
        </p>
        <p>
          This notice does not claim that every foreign privacy law applies to every visitor. People in some
          locations may have additional rights under applicable law and may direct requests to the contact above.
        </p>
      </LegalSection>

      <LegalSection number="08" title="Browser storage and cookies">
        <p>
          The public flow uses one first-party localStorage record,{' '}
          <code className="break-all text-ink">bytesized_waitlist_resume</code>, containing an opaque lead ID, a raw
          resume credential, and a saved-at time. It lets the same browser restore saved answers. The server stores
          only a one-way hash of that credential and rejects it after 30 days; an invalid record is cleared when the
          site next checks it. The browser copy otherwise remains until it is cleared by the flow, the user, or browser controls.
        </p>
        <p>
          Restricted admin pages use first-party Auth.js session, CSRF, callback, and short-lived OAuth security
          cookies. There are no analytics or advertising cookies in the audited version. See the{' '}
          <Link href="/early-access/cookies">Cookie &amp; storage notice</Link> for the detailed table and browser controls.
        </p>
      </LegalSection>

      <LegalSection number="09" title="Service providers and disclosures">
        <p>Information is processed only as needed by the following confirmed providers:</p>
        <ul>
          <li><strong className="text-ink">Vercel</strong> hosts and delivers the application and processes request, deployment, and runtime log data.</li>
          <li><strong className="text-ink">Neon</strong> hosts the production PostgreSQL database and its managed infrastructure and backups.</li>
          <li><strong className="text-ink">Resend</strong> receives the destination email address, sender details, verification content (including name and code), and delivery metadata to send transactional verification email.</li>
          <li><strong className="text-ink">GitHub</strong> provides OAuth sign-in for allowlisted administrators and returns profile/account information within the requested <code className="text-ink">read:user</code> and <code className="text-ink">user:email</code> scopes.</li>
        </ul>
        <p>
          Information may also be disclosed to professional advisers where reasonably necessary; to legal or public
          authorities where required; to protect rights, safety and the service; to investigate abuse; or to a
          successor if ownership or structure changes, subject to applicable notice, purpose and safeguard requirements.
          Early-access information is not currently visible to recruiters, talent or the public.
        </p>
        <p>
          ByteSized Careers does not sell personal information or share it for cross-context behavioural advertising
          in the inspected version.
        </p>
      </LegalSection>

      <LegalSection number="10" title="International processing">
        <p>
          ByteSized Careers is operated from India. Service providers may process information in India and in other
          countries in which they or their subprocessors operate, subject to their contractual, technical and legal
          safeguards. The protections and rights available in another country may differ from those in your location.
        </p>
      </LegalSection>

      <LegalSection number="11" title="Retention">
        <p>
          We retain early-access information for as long as reasonably necessary to operate and develop ByteSized
          Careers, maintain the early-access list, communicate about launch and access, prepare future marketplace
          invitations, identify potentially relevant marketplace needs, protect the service, resolve disputes and
          comply with legal obligations.
        </p>
        <p>
          Verification codes expire after ten minutes and server-side resume authority expires after 30 days.
          Security and rate-limiting data may be kept for a shorter period appropriate to its purpose. Provider
          copies and backups may remain temporarily under provider retention cycles. Information may be retained
          where reasonably necessary for legal claims, fraud prevention, security or legal compliance. We do not
          promise immediate removal from every backup. Deletion requests are assessed under the disclosed purposes
          and applicable law.
        </p>
      </LegalSection>

      <LegalSection number="12" title="Security">
        <p>
          Current controls include encrypted HTTPS transport, restricted GitHub-authenticated admin access,
          independent allowlist checks, hashed resume credentials and verification codes, pepper-hashed rate-limit
          subjects, bounded validation, expiry and attempt limits, and an authenticated CSV export. Providers also
          apply their own infrastructure controls. No online system can be guaranteed completely secure. Users
          should not share resume links or credentials and should notify the privacy contact of suspected misuse.
        </p>
      </LegalSection>

      <LegalSection number="13" title="Your choices and privacy requests">
        <p>
          Subject to the law that applies, you may ask for a copy of your information, correction, deletion,
          restriction or objection, withdrawal of consent, or information about processing. You may also complain
          to the relevant regulator. Send requests to{' '}
          <a href="mailto:legal@bytesizedcareers.com">legal@bytesizedcareers.com</a>. There is no automated
          privacy-request portal today.
        </p>
        <p>
          To protect the record, the operator will verify a request using reasonable information linked to the
          registration—normally control of the submitted email address—and may ask for limited additional evidence
          if necessary. We should not request more identity information than needed. We will review the associated
          information and, as appropriate, provide a reasonable copy or summary, correct it, delete or anonymise it,
          or explain why some information must be retained. Completion of the request is recorded. Grievances may
          also be sent to <a href="mailto:legal@bytesizedcareers.com">legal@bytesizedcareers.com</a>.
        </p>
      </LegalSection>

      <LegalSection number="14" title="Children and age eligibility">
        <p>
          ByteSized Careers is intended only for people aged 18 or older. You must be at least 18 years old to
          submit an early-access registration or otherwise use this website. We do not intentionally collect
          personal information from people under 18. If we learn that an under-18 user submitted information, we
          will assess and delete it unless continued retention is required by applicable law.
        </p>
      </LegalSection>

      <LegalSection number="15" title="The future marketplace">
        <p>
          Early-access information may later be used to prepare a marketplace registration invitation with certain
          fields pre-filled where technically available. No submission automatically becomes a marketplace account
          or public profile, and no information automatically becomes visible to recruiters, talent or the public.
          You must be able to review, correct and submit the marketplace registration before activation. An account
          or invitation is not guaranteed, and the features and onboarding process may change before launch.
        </p>
        <p>
          After suitable marketplace or matching functionality becomes available, supplied preferences may help
          identify potentially relevant talent, recruiter requirements, opportunities or participants. Registration
          does not mean active matching is taking place now, and potential relevance never guarantees suitability or an outcome.
        </p>
      </LegalSection>

      <LegalSection number="16" title="Changes and contact">
        <p>
          This notice may change as the pre-launch service develops or the law changes. Material changes should be
          highlighted before they take effect and, where appropriate, sent to the contact address on file. A new
          notice and marketplace terms will be needed before accounts, profile visibility, matching, recruiting,
          paid features, or broader communications launch.
        </p>
        <p>
          Privacy, legal notices, rights requests, opt-outs and grievances:{' '}
          <a href="mailto:legal@bytesizedcareers.com">legal@bytesizedcareers.com</a><br />
          Operator location: Srinagar Colony, Saidapet, Chennai, Tamil Nadu, India
        </p>
      </LegalSection>
    </LegalPage>
  );
}
