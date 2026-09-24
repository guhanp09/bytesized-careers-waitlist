# Reviewer guide

ByteSized Careers Early Access is the registration and demand-discovery companion
to a creator-economy marketplace. This repository lets a reviewer inspect the
implemented experience, source, tests, and evolution without access to subscriber data.

## Choose a reading path

- **Recruiter / hiring manager:** start with the README, follow the contact-save
  implementation below, then inspect the tests and representative fixes.
- **Technical reviewer:** read the architecture and local setup, trace authorization
  through a server action, and compare database integration tests with unit coverage.
- **Investor / product reviewer:** review the public journey and product boundaries.
  The repository demonstrates implementation, not revenue, active-user numbers,
  marketplace liquidity, customer acquisition efficiency, or product-market fit.

## Five-minute public walkthrough

Visit [the early-access page](https://bytesizedcareers.com/early-access) to see the
brand and initial experience. Use a local copy with synthetic data for a complete
walkthrough; do not create fake production leads for a demo.

Locally, review seeker, recruiter, and both-role paths. Select interests, observe
the companion Brief, continue through optional context, and reload after a saved
step to check resumption. Email verification has a development-only test mode.
Phone capture has no ownership-verification step. The final confirmation is a
waitlist result, not a marketplace login or invitation.

Admin review requires authorized GitHub access or explicitly enabled, localhost-only
development preview. There is no shared public administrator password.

## Trace implementation to evidence

| Design question | Source | Representative evidence |
| --- | --- | --- |
| When is a signup considered saved? | [email action](../src/lib/actions/submit-email.ts), [lead queries](../src/lib/db/queries/leads.ts) | [PostgreSQL integration tests](../tests/integration/db.test.ts), [browser flow](../tests/e2e/waitlist.spec.ts) |
| How do dense selection steps avoid excess writes? | [deferred-save hook](../src/components/waitlist/use-deferred-save.ts), [preferences step](../src/components/waitlist/step-preferences.tsx) | [custom-answer scenarios](../tests/e2e/custom-answer.spec.ts) |
| How are verification failures represented? | [provider selection](../src/lib/verification/providers.ts), [challenge actions](../src/lib/actions/verify-email.ts) | [provider tests](../tests/unit/email-provider.test.ts), [availability tests](../tests/unit/verification-provider-availability.test.ts) |
| Can a resume credential mutate someone else's row? | [token contract](../src/lib/tokens/lead-token.ts), [lead queries](../src/lib/db/queries/leads.ts) | [token tests](../tests/unit/tokens.test.ts), [integration suite](../tests/integration/db.test.ts) |
| What may an administrator export or delete? | [CSV route](../src/app/api/admin/waitlist/export/route.ts), [delete action](../src/lib/actions/delete-lead.ts) | [CSV tests](../tests/unit/csv.test.ts), [delete UI tests](../tests/unit/delete-lead-panel.test.tsx) |
| How does attribution survive return visits? | [campaign contract](../src/lib/attribution/campaign.ts) | [unit tests](../tests/unit/attribution.test.ts), [browser scenarios](../tests/e2e/attribution.spec.ts) |
| Is the summary a separate data source? | [Brief model](../src/components/brief/brief-model.ts) | [pure model tests](../tests/unit/brief-model.test.ts) |

These are test locations, not a claim that every suite was rerun. Exact publication
checks and missing proof are in [project status](PROJECT_STATUS.md).

## Representative development decisions

- `c722596`: moved option-heavy selection persistence away from one request per
  click, addressing legitimate users exhausting the rate limiter mid-form.
- `07a9bd5`: added structured campaign attribution rather than treating every
  return visit as a new first touch.
- `0179605`: added confirmation and server-side authorization for deleting one
  registration from the dashboard instead of requiring ad hoc SQL.
- `f017dbc`: separated the brand homepage from the focused early-access journey.

```bash
git log --graph --oneline --decorate -30
git show c722596 --stat
git show 07a9bd5 --stat
git show 0179605 --stat
```

The development history is preserved. No commit dates, authors, or accepted changes
were rewritten for presentation.

## What this does not demonstrate yet

This is not the marketplace itself: job listings, applications, messaging, interviews,
and reviewed job import belong to the [separate marketplace repository](https://github.com/guhanp09/bytesized-careers).
Waitlist metrics describe stored registrations, not verified hires or unique paying
customers. Future optional campaigns, automated matching, self-service privacy
workflows, and account/invitation integration must not be inferred from schema fields.
Legal documents and operational checklists are not legal sign-off or evidence of a
completed restore, inbox-delivery test, security audit, or capacity exercise.
