# ByteSized Careers — Early Access

A standalone early-access application for a creator-economy hiring marketplace.
People seeking work, hiring talent, or doing both can register their interest;
operators can review structured demand, contactability, and acquisition sources.

[Visit the early-access page](https://bytesizedcareers.com/early-access) ·
[Reviewer guide](docs/REVIEWER_GUIDE.md) · [Architecture](docs/ARCHITECTURE.md) ·
[Local setup](docs/LOCAL_DEVELOPMENT.md)

Built with **Next.js, React, TypeScript, Tailwind CSS, Drizzle, and PostgreSQL**.
Maintained by **Guhan Purushothaman**.

## What this project demonstrates

This is more than a static signup page: it connects a progressive, resumable user
journey to server-side validation, persistent storage, email verification, protected
administration, and structured reporting. It is deliberately narrower than the
[full marketplace](https://github.com/guhanp09/bytesized-careers).

The public site is an early-access registration experience—not live job matching,
an automatic marketplace account, or a promise of an interview or job. Source
publication is not a claim of production certification, traction, or legal approval.
See [current evidence and remaining work](docs/PROJECT_STATUS.md).

## Implemented experience

| Area | What is implemented |
| --- | --- |
| Public entry | Brand landing page at `/`; dedicated journey at `/early-access`; responsive desktop/mobile layout |
| Progressive registration | Name/email, seeker/recruiter/both intent, structured interests, relevant context, optional phone/channel choices, final note |
| Recovery | Saved server-side progress, token-scoped resume, masked-email confirmation, correction of an entered email |
| Verification | Email challenge lifecycle, provider acceptance tracking, expiry, retry limits, local test provider and unavailable-provider fallback |
| Administration | Allowlisted GitHub login, filtered/paginated lead table, detail view, overview charts, filtered CSV export, confirmed single-registration deletion |
| Attribution | Bounded campaign parameters, structured first/last-touch records, source/cohort reporting |
| Privacy boundaries | Separate phone-channel choices, restricted admin data, exports excluding verification secrets, public notices, manual rights-handling runbook |

Phone input is normalized and validated, **not ownership-verified** in the current
public flow. WhatsApp, SMS, and voice choices do not activate outbound messaging.
Email verification and funnel completion are separate states.

## How the flow works

```text
Name + email → Role → Interests → Email verification → Context
              → Optional phone/channel choices → Note → Confirmation
```

The initial contact is saved before success is acknowledged. Option-heavy interests
and context steps stage changes locally and save when Continue is pressed, avoiding
one network write per selection. Leaving a step attempts a best-effort save; abrupt
tab/process termination is not a guarantee that pending changes have persisted.
Returning users resume from the saved checkpoint.

“The Brief” companion panel renders a readable summary of the visitor's choices.
It is deterministic presentation, not a matching engine or prediction of outcomes.

## Architecture

```text
Next.js pages + progressive form
  └─ Server actions → Zod validation + rate limits + token checks
       ├─ Drizzle → PostgreSQL (local driver / hosted Neon HTTP adapter)
       └─ Verification challenge → email-provider interface → Resend or test mode

GitHub OAuth → administrator allowlist → protected queries / CSV / deletion
```

The [architecture guide](docs/ARCHITECTURE.md) explains persistence, ownership,
provider failures, compatibility decisions, and known tradeoffs.

## Repository map

| Path | Responsibility |
| --- | --- |
| [`src/app/`](src/app/) | Public/legal pages, protected admin pages, auth/export routes |
| [`src/components/waitlist/`](src/components/waitlist/) | Progressive flow, individual steps, deferred persistence |
| [`src/components/brief/`](src/components/brief/) | Answer-to-summary model and responsive presentation |
| [`src/lib/actions/`](src/lib/actions/) | Server-side mutation and verification boundaries |
| [`src/lib/db/`](src/lib/db/) | Schema, driver abstraction, token-scoped and admin queries |
| [`src/lib/email/`](src/lib/email/) and [`src/lib/verification/`](src/lib/verification/) | Provider contract, templates, challenges, failure handling |
| [`src/lib/attribution/`](src/lib/attribution/) | Versioned campaign data and safe link propagation |
| [`drizzle/`](drizzle/) | Committed SQL migrations and schema snapshots |
| [`tests/`](tests/) | Unit, PostgreSQL integration, and Chromium browser scenarios |
| [`.github/workflows/`](.github/workflows/) | CI definition; see evidence before assuming it is green |
| [`docs/`](docs/README.md) | Reviewer, setup, subsystem, status, and operational guides |

## Running and testing locally

Use Node.js 24 for the locally checked toolchain and a **disposable local PostgreSQL**
database. The [setup guide](docs/LOCAL_DEVELOPMENT.md) covers safe configuration,
test-provider verification, and the separate test database.

```bash
npm ci
npm run typecheck
npm run lint
npm test -- tests/unit
```

**Known clean-install gate:** the last inspected hosted CI run failed at `npm ci`
with missing optional entries in the lockfile. Local tests using installed dependencies
do not clear that hosted failure. See [exact evidence](docs/PROJECT_STATUS.md)
before treating this as a reproducible, fully green release.

PostgreSQL integration tests and browser journeys additionally require the migrated
test database. Never point those commands at the live waitlist or at the marketplace.

## Product direction

The current goal is to capture and understand early interest without making
unsupported marketplace promises. Next steps include reproducible hosted validation,
verified email/operational evidence, stronger recovery and privacy operations, and a
separately designed invitation handoff. Any future account activation needs user
review and affirmative submission; a waitlist record is not automatic consent to
public profiles, outreach, or matching.

## Boundaries and responsible review

This application has its own repository, deployment, database, and environment
configuration. The full marketplace remains a separate project. No lead exports,
private databases, credentials, installed dependencies, or generated build artifacts
belong in this repository. Review with synthetic data; do not submit test leads to
the live service or probe protected endpoints without permission.

See [contributing](CONTRIBUTING.md), [security reporting](SECURITY.md), and the
[documentation index](docs/README.md). Public source does not imply an open-source
license; no license has been selected in this publication update.
