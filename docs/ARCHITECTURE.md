# Architecture and tradeoffs

## System boundary

This is one Next.js application with PostgreSQL persistence, an email-provider
boundary, and protected operator views. It does not share accounts, tables,
credentials, deployments, or migrations with the marketplace.

```text
Public pages → progressive client state → server actions
                                         ├─ validation / rate limits
                                         ├─ token-scoped Drizzle writes → PostgreSQL
                                         └─ verification challenge → provider

GitHub OAuth → admin allowlist → server queries → safe view models / filtered CSV
```

## Contact and progressive persistence

[`submitEmailStep`](../src/lib/actions/submit-email.ts) validates name/email,
checks the honeypot and rate limit, normalizes email, and creates a resume credential.
The [database query](../src/lib/db/queries/leads.ts) upserts by normalized email;
the response acknowledges success only after persistence. Repeat submission is not
intended to create a second lead for the same normalized address.

Later mutations use the lead ID plus resume credential. Credentials are hashed for
storage; conditional writes check scope and expiry. The browser retains resume state
for the requested flow. That convenience is a security tradeoff: client-side storage
still needs protection against script injection and shared-device exposure.

Interests and richer context use [deferred saves](../src/components/waitlist/use-deferred-save.ts):
local selections are written on Continue, with a best-effort write when the component
unmounts. This reduces request volume but does not promise durable per-keystroke writes
or survival of every abrupt tab/process termination.

## Data model and compatibility

The [schema](../src/lib/db/schema.ts) separates the registration from rate-limit
buckets. Lead records include versioned seeker/recruiter need documents, including
both-role records, and operational progress/verification/attribution metadata.
The [field contract](lead-domain.md) explains active and legacy columns.

Committed migrations `0000`–`0008` evolve the schema additively. The local driver is
`node-postgres`; the hosted adapter is Neon HTTP. Mutations use atomic statements
rather than assuming a long-lived database transaction around external provider I/O.
Migration files are implementation artifacts, not proof they were applied to a host.

## Verification and communication

The [verification lifecycle](email-integration.md) reserves a challenge before a
provider call, then records provider acceptance or failure. A logical challenge has
an idempotency key. Codes expire, attempts are bounded, and stored code material is
hashed. Provider acceptance is not proof of mailbox delivery or reading.

Email delivery, verification, and local test mode have separate controls. The build
gate rejects unsafe Vercel Production email configuration. Unavailable verification
does not erase a captured lead. This is not a durable general-purpose campaign/outbox
worker, and channel-choice fields do not activate WhatsApp, SMS, or voice services.

## Administrator boundary

GitHub OAuth is restricted by an allowlist. Middleware, server-rendered admin views,
the export route, and deletion actions enforce access at their respective boundaries.
Local preview is opt-in, development-only, and host-restricted; it is not production
authentication. Admin data must never be used as an unauthenticated product demo.

CSV output is explicit and excludes resume/challenge secrets. Spreadsheet-formula
prefixes are escaped. The deletion action confirms a specific registration, rechecks
authorization, and emits an operator event. This is not a tamper-proof audit archive or
a guarantee that copies disappear instantly from external exports, logs, or backups.

## Attribution and presentation

The [campaign contract](campaign-attribution-guide.md) admits bounded first-party
parameters, keeps structured first touch, and updates last touch for appropriate
explicit attribution. These records inform operator cohorts; they do not establish
paid conversion, hiring success, or permission to contact a person.

The Brief panel is a deterministic projection of the form answers, not another
database or a matching engine. Form tokens do not belong in its presentation model.

## Known operational tradeoffs

- Proxy headers are used for client-IP attribution. A deployment must define its
  trusted proxy boundary; a generic self-hosted installation cannot simply assume it.
- Rate-limit buckets require retention/cleanup planning; raw IPs are not stored there.
- Error-log redaction, provider settings, backup/restore, admin offboarding, and manual
  privacy handling need operational review beyond passing unit tests.
- Current browser configuration covers Chromium. Broader browser/accessibility and
  sustained-load certification are not implied.
- [Current validation](PROJECT_STATUS.md) distinguishes fresh checks, historical
  evidence, and missing hosted proof.
