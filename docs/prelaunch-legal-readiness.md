# ByteSized Careers pre-launch legal readiness

Review date: 17 July 2026

Status: local public-review draft; not deployed
Scope: early-access registration website only

This review aligns the public legal pages with the inspected product and the operator's confirmed decisions. It does not guarantee compliance, certify the service, or replace advice from qualified counsel.

## Final drafting decisions

| Topic | Public position |
|---|---|
| Operator | ByteSized Careers is currently operated by Guhan Purushothaman |
| Location | Srinagar Colony, Saidapet, Chennai, Tamil Nadu, India; described as the operator/contact location, not a registered office |
| Contact | `legal@bytesizedcareers.com` for privacy, legal notices, rights requests, opt-outs and grievances |
| Eligibility | Only people aged 18 or older may register or otherwise use the website; no date-of-birth collection |
| Current service | Early-access registration for a future creator-economy hiring marketplace; no current listings, public profiles, applications, discovery, hiring or matching |
| Future invitation | Some supplied information may be pre-filled in an invitation, but the person must review, correct and submit before activation; no automatic profile, visibility, account or invitation |
| Future relevance | Preferences may support relevance notices only after suitable functionality exists; no current active matching and no outcome guarantee |
| Communications | Verification, administration, incomplete-registration reminders, material changes, launch/access invitations, future relevance notices, and necessary security/privacy/legal messages as disclosed |
| Phone | Optional; entry alone is not consent. WhatsApp, SMS and voice choices are separate, unchecked, versioned, withdrawable, and inactive until a corresponding channel is approved and activated |
| Optional email opt-out | Unsubscribe method in a message where available, or `legal@bytesizedcareers.com`; suppression is distinct from deletion |
| Retention | Purpose-based; no fixed automatic lead-deletion promise. Ten-minute verification expiry and 30-day resume-authority expiry remain disclosed |
| Law and venue | Laws of India; competent courts in Chennai, Tamil Nadu; mandatory non-excludable rights remain unaffected |
| Device storage | Requested-flow localStorage and necessary admin cookies only; no general tracking banner for the audited build |

## Public-document status

- `/privacy`, `/terms` and `/cookies` contain no drafting placeholders.
- The operator, location, contact, age rule, communications, retention, future invitations and governing-law decisions are consistent across the pages.
- The collection notice confirms 18+ eligibility and links the Early-Access Terms and Privacy Notice.
- The phone step accurately states there is no current phone outreach, never infers consent from a number, and records each optional channel separately.
- The pages distinguish optional email suppression from deletion of the underlying registration.
- No current matching, account, profile visibility, invitation, access, interview, job, candidate, hire or commercial outcome is promised.

## Operational step before optional email campaigns

No outbound optional campaign list has been prepared. Before sending optional launch, invitation or relevance-related email at scale:

1. Ensure `legal@bytesizedcareers.com` is actively monitored.
2. Review any existing opt-out requests and verify the address concerned.
3. Record a minimal suppression status before preparing the recipient list. The existing `unsubscribeStatus` and `unsubscribedAt` fields may support this after an approved operating process is connected to the sender; their current defaults are not consent.
4. Exclude suppressed addresses from every optional campaign and test the exclusion before send.
5. Include a dependable unsubscribe method where available and identify Guhan Purushothaman/ByteSized Careers accurately in the message.
6. Keep only the minimal suppression record needed to prevent future optional mail.
7. Do not interpret suppression as deletion. Handle deletion through the separate privacy-request assessment.
8. Review the message, recipients, legal basis/consent requirements, physical-address requirements and sender obligations for the locations actually reached.

This is an operational prerequisite for optional bulk email. Phone-channel choices use a separate additive consent record and do not activate sending.

## Current manual privacy-request capability

The service has no public self-service privacy portal. A proportionate manual process is documented in `docs/privacy-and-communications-runbook.md`:

- receive at `legal@bytesizedcareers.com`;
- verify reasonable control of the relevant email address;
- identify and review the associated record;
- correct inaccurate information or provide a reasonable copy/summary where applicable;
- assess deletion against disclosed purposes, legal duties, fraud/security and claims needs;
- delete, anonymise or retain as appropriate;
- account for provider/backups without promising instant removal from every copy; and
- record completion without storing excessive identity evidence.

Manual handling must be consistent and timely under the law applicable to the request.

## Recommended professional review

Qualified Indian counsel should review before publication or public promotion:

- operator/controller/data-fiduciary wording and the legal grounds used for each purpose;
- the Digital Personal Data Protection Act/Rules staged commencement and transition from applicable IT Act/SPDI obligations;
- the 18+ rule and response when information from an under-18 person is discovered;
- early-access, launch, invitation and future relevance communications under Indian and recipient-country rules;
- purpose-based retention, verified deletion decisions, legal holds and backup handling;
- international provider processing and processor contract/settings review;
- the submission licence, disclaimers and limitation of liability;
- governing law and competent-court clause; and
- whether promotion or users in another country create additional notice, rights, representative or transfer requirements.

Professional review is recommended; it is not represented as legal approval or certification.

## Security and operational improvements

These are meaningful but do not require a code change merely to finalise the present public text:

- periodically remove stale pseudonymous rate-limit rows when an operational scheduler is introduced;
- review whether the localStorage resume record should be cleared or reduced after completion while preserving promised resume behavior;
- normalise unexpected exception logging to safe categories and test redaction;
- document administrator offboarding, session revocation and minimum GitHub OAuth scopes;
- govern admin CSV exports on approved devices and delete working copies after their purpose ends;
- periodically review provider log, backup, deletion and subprocessor settings; and
- maintain a security-incident escalation record through the manual runbook.

## Future marketplace requirement

Before the marketplace launches, replace or materially extend the current Early-Access Terms and Privacy Notice for:

- account creation, activation, recovery and deletion;
- review and submission of any pre-filled invitation;
- profile visibility, recruiter/talent access, public indexing and privacy controls;
- matching, relevance scoring, ranking, profiling, explainability, human review and discrimination safeguards;
- listings, applications, messaging, introductions, moderation, reports and enforcement appeals;
- recruiter/employer verification, scam prevention and prohibited opportunities;
- CVs, portfolios, references, screening and sensitive information;
- employment/recruiting responsibilities and user-to-user contracts;
- payments, subscriptions, refunds, taxes or commissions if introduced;
- marketplace content/IP licences and AI-assisted content;
- international expansion, local representatives, transfer assessments and impact assessments where applicable; and
- marketplace-specific suspension, termination, warranties, liability and disputes.

No early-access submission automatically becomes a public profile or active account. The invitation/onboarding flow must preserve review, correction and affirmative submission before activation.

## Deliberately deferred infrastructure

- No cookie banner: no analytics, advertising, session replay or cross-site behavioural tracking was found.
- No preference centre: the present volume and channel plan support a documented manual suppression process.
- No privacy dashboard: verified manual rights handling is proportionate at this stage.
- No automated deletion job for this drafting task: public retention is purpose-based, with manual review/deletion and technical expiry accurately described.
- No phone OTP or outbound phone workflow: the new choices record permission only; no WhatsApp, SMS, call provider, campaign, automation or sender is activated.
- No production, provider, DNS or infrastructure changes are part of this local review.

## Release boundary

The local pages are coherent for public and professional review. Before publication, perform a final owner proofread, confirm the legal inbox is monitored, obtain the recommended legal review, rerun the quality gates, and ensure the deployed revision exactly matches the reviewed text. Optional bulk email remains gated by the suppression procedure above.
