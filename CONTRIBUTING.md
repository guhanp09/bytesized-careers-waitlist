# Contributing and local review

Read [local development](docs/LOCAL_DEVELOPMENT.md) before making changes. Use synthetic data and a disposable local database.
Keep this project separate from the marketplace and all production resources.

- Keep changes focused and preserve the current form, saved-state and migration contracts.
- Add regression evidence for validation, ownership, verification, consent and data changes.
- Run typecheck, lint and relevant unit tests; run PostgreSQL/browser checks for affected flows.
- Never solve failures by deleting tests, weakening security assertions, or hiding errors.
- Use explicit-file staging and descriptive commits. Do not rewrite accepted history.
- Keep credentials, lead exports, databases, installed dependencies and generated artifacts out of Git.
- Do not test against the public signup or admin service without authorization.

Production pushes may trigger automatic deployment. Coordinate release changes with
the maintainer; do not assume a documentation review authorizes schema or provider changes.
See [project status](docs/PROJECT_STATUS.md) for current test limitations.

No open-source license has been selected. Contact the maintainer before assuming
permission to redistribute application code or brand assets.
