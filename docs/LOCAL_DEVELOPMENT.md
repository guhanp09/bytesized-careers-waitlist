# Safe local development

Use this repository independently of the marketplace. Do not copy its environment
files, connect to its database, or reuse either project's production credentials.
The commands below use synthetic data and a new loopback-bound PostgreSQL container.

## Prerequisites and installation

Use Node.js 24, npm, Git, and a running Docker daemon. The existing hosted CI uses
Node 20; its last inspected clean-install failure is documented in
[project status](PROJECT_STATUS.md). A local install is not a substitute for that gate.

```bash
git clone https://github.com/guhanp09/bytesized-careers-waitlist.git
cd bytesized-careers-waitlist
npm ci
cp -n .env.example .env.local
```

If `npm ci` reports a missing lockfile entry, stop and retain the exact error. Do not
silently replace the lockfile or tell a reviewer that clean-install validation passed.
The publication changes documentation, not dependencies.

## Disposable database

Create a new container; if that name or port already exists, choose another rather
than deleting an existing database. These example credentials are local-only.

```bash
docker run --name bytesized-review-pg \
  -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=bytesized_review \
  -p 127.0.0.1:5433:5432 -d postgres:16-alpine
docker exec bytesized-review-pg pg_isready -U postgres -d bytesized_review
```

Wait for the readiness command to succeed before migrating. Set local values in
`.env.local` without committing the file:

```dotenv
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5433/bytesized_review
DB_DRIVER=node-postgres
EMAIL_DELIVERY_ENABLED=false
EMAIL_VERIFICATION_ENABLED=true
LOCAL_VERIFICATION_ENABLED=true
ADMIN_LOCAL_PREVIEW_ENABLED=false
```

Generate separate local `RESUME_TOKEN_SECRET`, `RATE_LIMIT_IP_PEPPER`, and
`AUTH_SECRET` values, for example with `openssl rand -base64 32`, and place them only
in the ignored file. Leave real provider keys blank. Never paste generated values
into repository documentation or issue reports.

```bash
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5433/bytesized_review \
  npm run db:migrate
npm run dev
```

Open `http://localhost:3000/early-access`. Use a made-up example-domain address;
the configured local code display is not an outbound email. Production explicitly
disables this mode.

For admin review, an authorized local GitHub OAuth app needs its callback at
`http://localhost:3000/api/auth/callback/github` and an allowlisted login.
Alternatively, enable `ADMIN_LOCAL_PREVIEW_ENABLED=true` only for a localhost
development process using this disposable database. Do not expose that server publicly.

## Validation

Pure checks require installed dependencies, but no live provider:

```bash
npm run typecheck
npm run lint
npm test -- tests/unit
```

Use a separate database for integration/browser tests, never production or an
existing development database containing useful registrations:

```bash
docker exec bytesized-review-pg createdb -U postgres bytesized_test
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5433/bytesized_test \
  npm run db:migrate
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5433/bytesized_test \
  DB_DRIVER=node-postgres npm test
npx playwright install chromium
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5433/bytesized_test \
  npm run test:e2e
```

Playwright starts a development server on port3100 with test-only provider flags;
its setup rejects non-local databases. Run browser tests serially and expect synthetic
test rows; do not reuse the test database for real data. Integration tests also need
an explicitly local URL—the unit-only command does not prove database behavior.

`npm run build` validates compilation. Its prebuild check requires genuine safe
configuration when Vercel marks the environment Production; do not fake production
provider values to bypass it. A localhost build is not hosted email verification.

Stop the disposable container when finished with `docker stop bytesized-review-pg`.
This stops it without deleting its data. No destructive cleanup is required here.

## Hosted operations are separate

Real email/provider/DNS activation is covered by [email integration](email-integration.md).
Privacy requests, exports and deletion require the
[operator runbook](privacy-and-communications-runbook.md), authorization, and appropriate
data handling. Do not run hosted migrations, export subscribers, or send messages as
part of a source-code review.
