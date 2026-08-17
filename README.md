# ByteSized Careers — Waitlist

A premium, dark, single-page waitlist for **ByteSized Careers** (creator-economy jobs & talent). It collects and reliably persists a person's name and email through a low-friction progressive flow, with ownership verification, a protected admin dashboard, and CSV export.

> This repository is **standalone** and must stay fully separate from the CreatorJobs project (code, GitHub repo, Vercel project, Neon database, env vars).

- **Stack:** Next.js (App Router) · TypeScript · Tailwind CSS v4 · Drizzle ORM · Neon Postgres · Auth.js (GitHub OAuth) · Zod · Vitest + Playwright · Vercel.
- **Works with or without email delivery.** Real Resend verification is implemented behind disabled-by-default feature flags (see [`docs/email-integration.md`](docs/email-integration.md)).

---

## The flow

```
Name + email → Role → Interests → Email verification → Context → Phone → Phone mock verification → Note → Success
```

Every step persists **before** advancing — there is no final "Submit" gate, so a visitor who leaves partway is still a useful, segmented lead. Returning visitors can resume (masked email, explicit confirmation). The highest-priority guarantee: **no silently lost email submission** — success is shown only after the database confirms the write.

---

## Local setup

**Prerequisites:** Node 20+ (tested on 24), Docker (for a local Postgres), and Git.

```bash
# 1. Install dependencies
npm install

# 2. Start a local Postgres (Docker) on host port 5433
docker run -d --name bytesized-pg \
  -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=bytesized \
  -p 5433:5432 postgres:16-alpine

# 3. Create your local env file
cp .env.example .env.local
# then edit .env.local — for local Docker, set:
#   DATABASE_URL=postgresql://postgres:postgres@localhost:5433/bytesized
#   DB_DRIVER=node-postgres
#   RESUME_TOKEN_SECRET / RATE_LIMIT_IP_PEPPER / AUTH_SECRET  (any random strings for dev)

# 4. Apply migrations
npm run db:migrate

# 5. Run the app
npm run dev            # http://localhost:3000
```

### Environment variables

See [`.env.example`](.env.example) for the full annotated list. Required for the core waitlist:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string (a **separate** Neon project — never the CreatorJobs DB). |
| `DB_DRIVER` | `node-postgres` locally; leave unset in production to use the Neon HTTP driver (auto-detected). |
| `RESUME_TOKEN_SECRET` | Server-only pepper for hashing resume tokens. |
| `RATE_LIMIT_IP_PEPPER` | Server-only pepper for hashing IPs in the rate limiter (raw IPs are never stored). |
| `AUTH_SECRET`, `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET` | Admin login via GitHub OAuth. |
| `ADMIN_ALLOWED_GITHUB_LOGINS` | Comma-separated GitHub usernames allowed into `/admin`. |
| `ADMIN_LOCAL_PREVIEW_ENABLED` | Optional localhost-only development preview; disabled by default and hard-disabled outside development. |
| `EMAIL_DELIVERY_ENABLED`, `EMAIL_VERIFICATION_ENABLED` | Real verification gates. Both are required to be `true` in Production after Resend is configured. |
| `RESEND_API_KEY`, `EMAIL_FROM_ADDRESS`, `EMAIL_REPLY_TO` | Real email delivery configuration; only read when delivery is enabled. |
| `LOCAL_VERIFICATION_ENABLED` | Development/test mock codes only; production hard-disables it. |

Email-provider variables are optional while delivery is disabled. See [`docs/email-integration.md`](docs/email-integration.md) for the secure activation checkpoint.

---

## Common tasks

| Command | Description |
|---|---|
| `npm run dev` | Start the dev server. |
| `npm run build` / `npm start` | Production build / serve. |
| `npm run typecheck` | TypeScript check. |
| `npm run lint` | ESLint. |
| `npm test` | Unit + integration tests (Vitest). |
| `npm run test:e2e` | End-to-end tests (Playwright). |
| `npm run smoke:production-email-config` | Fail unless the current environment has release-safe, sanitized Production email configuration. |
| `npm run db:generate` | Generate a new SQL migration from `src/lib/db/schema.ts`. |
| `npm run db:migrate` | Apply migrations. |
| `npm run db:seed-admin-examples` | Upsert clearly marked dashboard demo leads into local PostgreSQL only. |
| `npm run db:remove-admin-examples` | Remove only marked local demo leads; run only with explicit approval. |
| `npm run db:studio` | Open Drizzle Studio. |

### Testing local submissions & verifying data in the DB

1. Run `npm run dev`, open the site, and submit the flow.
2. Inspect the row:
   ```bash
   docker exec bytesized-pg psql -U postgres -d bytesized \
     -c "select normalized_email, role, completion_status, phone_whatsapp_consent, phone_sms_consent, phone_voice_consent from waitlist_leads order by created_at desc limit 5;"
   ```

---

## Creating the separate Neon project (production DB)

1. In [Neon](https://neon.tech), create a **new project** dedicated to this waitlist (do **not** reuse the CreatorJobs Neon project).
2. Copy its connection string into Vercel as `DATABASE_URL` (see below). Leave `DB_DRIVER` unset in production — the app auto-selects the Neon HTTP driver for `*.neon.tech` URLs.
3. Apply migrations against it once:
   ```bash
   DATABASE_URL="<neon-url>" npx drizzle-kit migrate
   ```
   (Optionally use Neon's branch-per-preview so each Vercel preview deploy gets an isolated database branch.)

---

## Deploying to Vercel

1. Create a **new Vercel project** for this repo (separate from CreatorJobs).
2. Add the environment variables above under **Project → Settings → Environment Variables** (Production + Preview).
   - Create a GitHub OAuth app (`https://github.com/settings/developers`) with callback `https://<your-domain>/api/auth/callback/github`, and set `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET`.
   - Set `AUTH_SECRET` (`openssl rand -base64 32`).
   - Set `ADMIN_ALLOWED_GITHUB_LOGINS` to your GitHub username.
   - Configure the Production email settings in the checklist in [`docs/email-integration.md`](docs/email-integration.md). Production requires both email flags enabled, Resend credentials present, and local verification disabled.
   - The Vercel Production build automatically runs `npm run smoke:production-email-config` semantics before compiling. It prints statuses only, never values, and stops the deployment when configuration is unsafe.
3. Deploy. The app runs on the Vercel-assigned domain until you connect a custom domain.

Vercel Production builds run the same sanitized check automatically before `next build` and
fail before release if the required email configuration is unsafe. The standalone smoke
command is strict for CI/build shells that already have the target variables injected. Do not
pull Sensitive Production values into a local file; local and Preview builds do not enforce
Production settings.

### Connecting `bytesizedcareers.com` (after purchase)

1. Buy the domain and add it under **Vercel → Project → Domains**; follow the DNS instructions.
2. Update the GitHub OAuth app callback URL to the new domain.
3. When you're ready for email, follow [`docs/email-integration.md`](docs/email-integration.md).

---

## Admin dashboard

`/admin/waitlist` — sign in with an allowlisted GitHub account.

- **Summary counts:** total, email-only, partial, completed, seekers, recruiters, both, and verified vs unverified.
- **Breakdowns:** top interests, top sources.
- **Filters:** role, completion, verification, interests, phone presence, source, dates, and contact search — all synced to the URL.
- **Export CSV** reflects the active filters and includes verification status.

### Exporting lead buckets & backing up contacts

- Apply filters, then click **Export CSV** (or hit `/api/admin/waitlist/export?<filters>` while authenticated).
- For a full backup, export with no filters, or dump the table:
  ```bash
  docker exec bytesized-pg pg_dump -U postgres -t waitlist_leads bytesized > backup.sql
  ```

### Deleting a lead / handling a deletion request

Use the dashboard — no SQL required, and the removal is written to the logs:

1. Open **Leads**, find the registration, click **View**.
2. Scroll to **Delete this registration** at the bottom of the panel.
3. Click **Delete registration…**, check the address shown in the confirmation, then
   **Yes, delete permanently**.

This removes the entire row — contact details, intent, selections, comments and verification
history — which is everything the waitlist stores about that person, so nothing is left
orphaned. It is permanent and is not exported first; take an export beforehand if the record
still matters. Every deletion emits a `lead_deleted` log line with the acting admin login and
a masked address; a no-op double-click logs `lead_delete_noop` instead. The action re-checks
admin authorization server-side, so it cannot be driven from an unauthenticated client.

Use it for clearing test signups and for actioning data-subject erasure requests.

Deleting by email in SQL (only if the dashboard is unavailable):
```bash
docker exec bytesized-pg psql -U postgres -d bytesized \
  -c "delete from waitlist_leads where normalized_email = 'person@example.com';"
```
(Against production, run the same statement via the Neon SQL editor.)

### Channel choices do not activate sending

The phone step records independent WhatsApp, SMS, and voice choices with version/time/source metadata. There is no outbound implementation. Do not use a number, the legacy `whatsapp_consent` field, or the default email subscription status as permission. Any future channel must gate on the matching current choice and pass the documented provider, sender, suppression, legal, content, and withdrawal review first.

---

## Troubleshooting failed submissions

- **Structured logs:** the server logs JSON lines to stdout (Vercel log stream). Look for `email_capture_failed`, `role_save_failed`, etc. Logs never contain raw emails/phones/tokens.
- **Rate limiting:** repeated submissions from one IP are throttled (5/10min for email). Inspect `rate_limit_hits` if legitimate users are blocked.
- **"Session expired" on later steps:** the resume token is missing/expired — the visitor can re-enter their email to continue safely (idempotent upsert).

---

## Project structure

```
src/
  app/                     # brand /, early access + legal /early-access/*, /admin/*, /api/*
  components/waitlist/     # progressive steps + flow orchestrator + resume prompt
  components/ui/           # button, chip, checkbox, tap-target-card, country-select, …
  lib/
    db/schema.ts           # Drizzle schema (waitlist_leads, rate_limit_hits)
    db/queries/            # leads.ts (flow), admin.ts (dashboard)
    actions/               # server actions, one per step + resume
    validation/            # Zod schemas + the category/format/org vocabularies
    tokens/ rate-limit/ email/ verification/ auth/ utils/
tests/                     # unit, integration (Postgres), e2e (Playwright)
drizzle/                   # generated SQL migrations
```

See [`docs/email-integration.md`](docs/email-integration.md) for local mock testing, Resend DNS setup, and the gated production rollout.

See [`docs/lead-domain.md`](docs/lead-domain.md) for the current form-to-database field map,
structured seeker/recruiter intent model, compatibility policy, and admin/export contract.

See [`docs/campaign-attribution-guide.md`](docs/campaign-attribution-guide.md) for the supported
campaign-link allowlist, first/last-touch rules, persistence model, reporting, and copyable URLs.
