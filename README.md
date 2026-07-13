# ByteSized Careers — Waitlist

A premium, dark, single-page waitlist for **ByteSized Careers** (creator-economy jobs & talent). It collects and reliably persists leads through a low-friction, progressive 5-step flow, with a protected admin dashboard and CSV export.

> This repository is **standalone** and must stay fully separate from the CreatorJobs project (code, GitHub repo, Vercel project, Neon database, env vars).

- **Stack:** Next.js (App Router) · TypeScript · Tailwind CSS v4 · Drizzle ORM · Neon Postgres · Auth.js (GitHub OAuth) · Zod · Vitest + Playwright · Vercel.
- **Works today with no domain and no email provider.** Email delivery/verification is a flag-gated, swappable integration to add later (see [`docs/email-integration.md`](docs/email-integration.md)).

---

## The flow

```
Email  →  Role (work / hire / both)  →  Interests (role-adapted)  →  Phone + WhatsApp (optional)  →  Success
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
| `EMAIL_DELIVERY_ENABLED`, `EMAIL_VERIFICATION_ENABLED` | Keep `false` until a domain + email provider are configured. |

Email-provider variables (`RESEND_API_KEY`, `EMAIL_FROM_ADDRESS`, …) are **not required now** — see [`docs/email-integration.md`](docs/email-integration.md).

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
| `npm run db:generate` | Generate a new SQL migration from `src/lib/db/schema.ts`. |
| `npm run db:migrate` | Apply migrations. |
| `npm run db:studio` | Open Drizzle Studio. |

### Testing local submissions & verifying data in the DB

1. Run `npm run dev`, open the site, and submit the flow.
2. Inspect the row:
   ```bash
   docker exec bytesized-pg psql -U postgres -d bytesized \
     -c "select normalized_email, role, completion_status, whatsapp_consent from waitlist_leads order by created_at desc limit 5;"
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
   - Keep `EMAIL_DELIVERY_ENABLED=false` and `EMAIL_VERIFICATION_ENABLED=false` for now.
3. Deploy. The app runs on the Vercel-assigned domain until you connect a custom domain.

### Connecting `bytesizedcareers.com` (after purchase)

1. Buy the domain and add it under **Vercel → Project → Domains**; follow the DNS instructions.
2. Update the GitHub OAuth app callback URL to the new domain.
3. When you're ready for email, follow [`docs/email-integration.md`](docs/email-integration.md).

---

## Admin dashboard

`/admin/waitlist` — sign in with an allowlisted GitHub account.

- **Summary counts:** total, email-only, partial, completed, seekers, recruiters, both, WhatsApp-consented, verified vs unverified.
- **Breakdowns:** top interests, top sources.
- **Filters:** role, completion, verification, WhatsApp consent, interest, date range, email search — all synced to the URL.
- **Export CSV** reflects the active filters and includes verification status.

### Exporting lead buckets & backing up contacts

- Apply filters, then click **Export CSV** (or hit `/api/admin/waitlist/export?<filters>` while authenticated).
- For a full backup, export with no filters, or dump the table:
  ```bash
  docker exec bytesized-pg pg_dump -U postgres -t waitlist_leads bytesized > backup.sql
  ```

### Deleting a lead / handling a deletion request

Delete by normalized email (data-deletion requests):
```bash
docker exec bytesized-pg psql -U postgres -d bytesized \
  -c "delete from waitlist_leads where normalized_email = 'person@example.com';"
```
(Against production, run the same statement via the Neon SQL editor.)

### Sending only to consented groups

Any promotional send **must** be gated on consent. WhatsApp: `whatsapp_consent = true`. Future email campaigns: `unsubscribe_status = 'subscribed'` **and** (once verification ships) `email_verification_status = 'verified'`. Never send promotional messages to leads who did not explicitly opt in.

---

## Troubleshooting failed submissions

- **Structured logs:** the server logs JSON lines to stdout (Vercel log stream). Look for `email_capture_failed`, `role_save_failed`, etc. Logs never contain raw emails/phones/tokens.
- **Rate limiting:** repeated submissions from one IP are throttled (5/10min for email). Inspect `rate_limit_hits` if legitimate users are blocked.
- **"Session expired" on later steps:** the resume token is missing/expired — the visitor can re-enter their email to continue safely (idempotent upsert).

---

## Project structure

```
src/
  app/                     # routes: /, /privacy, /terms, /admin/*, /api/*
  components/waitlist/     # the 5 steps + flow orchestrator + resume prompt
  components/ui/           # button, chip, checkbox, tap-target-card, country-select, …
  lib/
    db/schema.ts           # Drizzle schema (waitlist_leads, rate_limit_hits)
    db/queries/            # leads.ts (flow), admin.ts (dashboard)
    actions/               # server actions, one per step + resume
    validation/            # Zod schemas + the category/format/org vocabularies
    tokens/ rate-limit/ email/ auth/ utils/
tests/                     # unit, integration (Postgres), e2e (Playwright)
drizzle/                   # generated SQL migrations
```

See [`docs/email-integration.md`](docs/email-integration.md) for the future email/verification rollout.
