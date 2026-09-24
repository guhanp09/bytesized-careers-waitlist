# Project status and publication checkpoint

Reviewed: **2026-09-24**. Application baseline:
`0179605ceb2ce1465bd5edea39ec32586dece4a1` on `main`.
The publication commit changes documentation only; it does not change application
code, dependencies, migrations, provider settings, or databases.

## Evidence from this review

| Check | Result | Scope / limitation |
| --- | --- | --- |
| `npm run typecheck` | PASS, exit0 | Existing local dependencies, Node24.13.0/npm11.6.2 |
| `npm run lint` | PASS, exit0 | No reported lint errors or warnings |
| `npm test -- tests/unit` | 21 files / 139 tests passed; 0 failed/skipped | Baseline16.29s, final16.90s; explicitly local dummy configuration, no provider calls |
| Documentation links / diff | PASS | 76 local links across16 documents resolve; whitespace check passed |
| Clean-install dry run | FAIL, exit1 / `EUSAGE` | Fresh source archive; `@emnapi/core@1.11.3` and `@emnapi/wasi-threads@1.2.3` missing from lockfile |
| Gitleaks source / all-ref history / commit messages | No leaks found | Baseline27 reachable commits; scanner success is not a guarantee of absence |
| Git integrity | PASS | Dangling recovery objects exist locally; no corruption or history rewrite |
| PostgreSQL integration / migration / browser suites | NOT RUN in this task | Docker daemon unavailable locally; no hosted fallback used |
| Production build / dependency audit | NOT RUN in this task | Documentation publication is not release certification |
| Live signup, email, restore and legal approval | NOT VERIFIED | No production signup, mailbox test, subscriber inspection or provider change |

The latest inspected baseline [hosted CI run](https://github.com/guhanp09/bytesized-careers-waitlist/actions/runs/32022682563)
failed at `npm ci`. It reported missing `@emnapi/runtime@1.11.3`,
`@emnapi/core@1.11.3`, and `@emnapi/wasi-threads@1.2.3` lockfile entries. The current
local clean-install dry run independently reproduces the incomplete-lockfile failure.
Existing installed dependencies passing tests **do not clear this blocker**.

The check commands and isolated setup are in [local development](LOCAL_DEVELOPMENT.md).
Logs for this review are outside Git at `/tmp/bytesized-waitlist-publication.LnpjCy`
on the maintainer's machine, not part of the public source. Hosted runs must be
matched to their exact commit; no green aggregate pipeline is claimed here.

## Priorities after publication

1. **Reproducible installation:** repair the lockfile in a separate, controlled
   dependency change; validate clean installs on local and CI platforms. Do not use
   `npm install` as an undocumented way to conceal failed `npm ci`.
2. **Fresh database/browser proof:** run all migrations and integration/browser tests
   against disposable PostgreSQL, then record exact totals and failure reproduction.
3. **Hosted verification:** confirm the deployed revision and safe email settings,
   real delivery, provider failure behavior, and sender configuration with approval.
4. **Operations and privacy:** prove backup/restore, admin offboarding, incident
   ownership, log redaction, export handling, suppression and manual rights processes.
   Obtain appropriate policy review; repository legal text is not sign-off.
5. **Broader quality evidence:** multi-browser and manual accessibility review,
   workload measurements, dependency/security scans and operational monitoring.
6. **Optional future integration:** design consent-aware marketplace invitations with
   review/correction and explicit activation. Do not bulk-convert waitlist records
   into accounts or treat stored preferences as permission for every channel.

## Public-source scope and recovery

All reachable branches/tags, tracked-path inventory, and source/commit-message scans
were reviewed before changing repository visibility. No issues, releases, wiki or
discussions containing private records were found in the GitHub inventory. Source
history contains templates and synthetic examples, not exported lead databases.
Private env files, installed dependencies, caches and generated artifacts remain
outside publication. Existing commit metadata and branch history are preserved.

The owner explicitly authorized making the repository public and the normal automatic
Vercel redeployment caused by the documentation-only push. That does not authorize
new settings, provider operations, production migrations or subscriber access.
The full marketplace and its original `skizh` repository are not deployment targets.

Verify the public checkpoint with:

```bash
git log -1 --oneline
git status --short --branch
git ls-remote origin refs/heads/main
gh repo view guhanp09/bytesized-careers-waitlist --json visibility,url,defaultBranchRef
```

Find this documentation commit by its subject:
`docs(portfolio): document waitlist product and reviewer paths`.
Documentation corrections should use follow-up commits, not rewritten history.
Changing visibility back cannot recall public clones; exposed credentials would
require rotation, not merely deleting a file. No production-readiness certificate
is issued by making the source public.
