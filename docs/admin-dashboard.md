# Waitlist admin dashboard

This document records the current visitor-to-operator data contract. It is intentionally based on the active v2 form and save actions, not the original waitlist schema.

## Current field inventory

| Visitor-facing question or event | Path | Database source | Collection rule | Progressive save | Admin / CSV representation |
| --- | --- | --- | --- | --- | --- |
| “Your name” / “Email address” | Universal | `full_name`, `original_email`, `normalized_email` | Name and email are required for new signups; normalized email is the idempotency key | Step 1 | Name-first contact, search, lead identity, CSV Full Name + Email |
| Email verification request / delivery / completion | Universal, skippable | verification status plus requested, sent and verified timestamps | Ownership check does not gate the saved lead or completion | Independent verification actions | Contact timeline in IST; no token, hash, provider ID or raw response is exposed/exported |
| “What brings you to ByteSized Careers?” | Universal after email | `role` | Required to advance; seeker, recruiter or both | Step 2 | Role badge, distribution, Why they joined, CSV Role |
| “What work would you love to do?” | Seeker / Both | versioned `seeker_needs` JSONB | Structured multi-select; section-specific Other is conditional and optional | Debounced Step 3 | Separate seeker taxonomy, deterministic need summary, demand analytics and CSV |
| “Who are you looking to hire?” | Recruiter / Both | versioned `recruiter_needs` JSONB | Structured multi-select; section-specific Other is conditional and optional | Debounced Step 3 | Separate recruiter taxonomy, deterministic need summary, demand analytics and CSV |
| “How you like to work” | Seeker / Both | `work_formats` | Optional multi-select | Debounced Step 5 | Seeker matching context and CSV |
| “What best describes you?” | Recruiter / Both | `organisation_types` | Optional single-choice stored as an array | Debounced Step 5 | Recruiter matching context and CSV |
| Platforms / creator niches | All role paths | arrays plus `platform_other`, `niche_other` | Optional; Other text is conditional | Debounced Step 5 | Matching context, searchable, CSV |
| Experience, start availability, portfolio | Seeker-only detailed path | scalar seeker context fields | Optional | Debounced / blur Step 5 | Seeker context and CSV |
| Hiring timeline, team size, website/channel | Recruiter-only detailed path | scalar recruiter context fields | Optional | Debounced / blur Step 5 | Recruiter context and CSV |
| Phone number | Universal | E.164 phone and country | Optional and skippable | Step 6 | Contact details, phone filters, contactability analytics and CSV |
| Phone verification events | Phone supplied | verification status plus requested, last-sent and verified timestamps | Optional; local mock architecture in this phase | Independent verification actions | Contact timeline in IST; no challenge secret is exposed/exported |
| Role-aware final open response | Universal | `additional_notes` | Optional; reaching Continue completes the current form | Step 8 | Prominent editorial comment block, comments analytics/search and CSV Additional Comments |
| Completion and progress | Derived | status, numeric compatibility step, meaningful step, completed timestamp | Derived from successful saves | Every meaningful step | List badges, funnel, lead quality and CSV |
| First-touch attribution | Universal | source, UTM source/medium/campaign, referrer | Optional; preserved on repeat email upsert | Step 1 | Attribution detail, filters, source/campaign analytics and CSV |
| Created / updated timestamps | Universal | timezone-aware UTC timestamps | Derived by the database | Every insert/update | Displayed, grouped and filtered in `Asia/Kolkata`; CSV is IST-first with separate UTC ISO columns |

New signups capture a required name before email. Rows created before this field existed retain a nullable `full_name`; the admin UI shows the explicit `Name not captured` fallback and never infers a name from an email address.

## Compatibility and operational fields

- `job_categories`, `talent_categories`, `job_category_others` and `talent_category_others` are historical compatibility inputs. New saves write only the separate versioned need documents; historical rows are normalized at read time.
- `job_interest_other` and `talent_need_other` are obsolete single-value Other fields and receive no current writes.
- `hiring_frequency` and `talent_seniority` are not asked or written by the current interface. If an older row contains them, they appear only as clearly labelled legacy metadata.
- WhatsApp consent fields remain non-destructively in the schema but the current phone form does not ask for or update promotional consent.
- Transactional-email status and unsubscribe state are operational channel metadata, not answers to form questions.
- Resume and verification hashes, expiries, attempts, internal request/provider IDs and failure internals never cross the admin client or CSV boundary.

No destructive cleanup is part of the dashboard work.

## Information architecture

- **Overview** — 15 KPI cards; IST signup cohort trend; role distribution; completion journey; verification/contactability; separate seeker and recruiter demand; source/campaign performance; recent comments; recent signups.
- **Leads** — URL-synchronized server-side filters and debounced search, compact responsive list/cards, matching filtered CSV export.
- **Lead detail** — at-a-glance completeness, why they joined, copyable contacts and verification events, separate need taxonomies, matching context, full final comment, and secondary funnel/attribution metadata.

Canonical timestamps remain UTC. `src/lib/admin/time.ts` is the single formatting and IST-boundary utility. PostgreSQL aggregation explicitly groups with `created_at at time zone 'Asia/Kolkata'`.
