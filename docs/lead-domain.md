# Waitlist lead domain

The current local public form is the source of truth for this model. The original schema
and planning documents are compatibility references only.

## Current field map

| Public question or behavior | Path | Requirement | Client state | Server action | Current source of truth | Admin and CSV |
| --- | --- | --- | --- | --- | --- | --- |
| Name | All new signups | Required; trimmed and internal whitespace collapsed | `fullName` | `submitEmailStep`, `changeEmailStep` | `full_name` (nullable for legacy rows) | Lead identity; case and Unicode preserved |
| Email / change email | All | Required | `email` | `submitEmailStep`, `changeEmailStep` | `original_email`, `normalized_email` | Contact identity |
| First/last-touch attribution | All | Passive; allowlisted campaign/referral data only | versioned local attribution state | `submitEmailStep`, token-scoped resume sync | structured JSONB touch records; legacy columns retained | Separate detail blocks, performance cohorts, filters, and CSV fields |
| What brings you here? | All | Required | `role` | `submitRoleStep` | `role` | Prominent intent badge/filter |
| Work categories and individual work | Seeker, Both | Skippable | `jobCategories` | `submitPreferencesStep` | `seeker_needs` v1 | Grouped seeker section and readable CSV |
| Section-specific seeker Other | Seeker, Both | Conditional | `jobCategoryOthers` | `submitPreferencesStep` | matching `seeker_needs.groups[].customResponse` | Under its source group |
| Talent categories and individual talent types | Recruiter, Both | Skippable | `talentCategories` | `submitPreferencesStep` | `recruiter_needs` v1 | Grouped recruiter section and readable CSV |
| Section-specific recruiter Other | Recruiter, Both | Conditional | `talentCategoryOthers` | `submitPreferencesStep` | matching `recruiter_needs.groups[].customResponse` | Under its source group |
| Email ownership | All | Non-blocking | verification UI state | email verification actions | verification status and timestamps | Contactability, not completion |
| How you like to work | Seeker, Both | Optional | `workFormats` | `submitContextStep` | `work_formats` | Seeker context |
| What best describes you? | Recruiter, Both | Optional | `organisationTypes` | `submitContextStep` | `organisation_types` | Recruiter context |
| Platforms and platform Other | All | Optional / conditional | `platforms`, `platformOther` | `submitContextStep` | platform fields | Shared matching context |
| Creator niches and niche Other | All | Optional / conditional | `niches`, `nicheOther` | `submitContextStep` | niche fields | Shared matching context |
| Experience, availability, portfolio | Seeker only | Optional | corresponding context fields | `submitContextStep` | scalar context columns | Seeker context |
| Hiring timeline, team size, website/channel | Recruiter only | Optional | corresponding context fields | `submitContextStep` | scalar context columns | Recruiter context |
| Phone | All | Optional | country and number | `submitPhoneStep` | E.164 and country | Contact presence |
| Phone ownership | Legacy records only | Not collected by the current public flow | No phone OTP step | Legacy compatibility only | Historical verification status and timestamps | Never imply a newly captured number is verified |
| Phone-channel choices | Phone supplied | Optional, independent choices | `whatsappConsent`, `smsConsent`, `voiceConsent` | `submitPhoneStep` | `phone_*_consent` plus version/time/source | Choices shown separately; no outbound sending activated |
| Final role-aware response | All | Optional | `additionalNotes` | `submitNoteStep` | `additional_notes` | Untruncated editorial block and CSV context |
| Funnel and resume | All | Operational | flow state | all progressive actions | completion, meaningful step, timestamps, hashed resume token | At-a-glance and secondary metadata |

The honeypot is an active anti-bot control but is never stored as lead data. Verification
codes, hashes, challenge IDs, resume tokens, provider responses, and credentials are never
shown in admin or exported.

## Structured need profile v1

Seeker and recruiter intent are stored separately, including for `both` leads:

```json
{
  "version": 1,
  "groups": [
    {
      "id": "writing_research",
      "selections": ["research"],
      "otherSelected": true,
      "customResponse": "Long-form documentary fact-checking"
    }
  ]
}
```

Keys, not display labels, are stored. Group and option order comes from the current taxonomy
constants, so summaries are deterministic and display copy is not duplicated in the DB.

## Active fields

- Identity/contact, verification state and timestamps.
- `role`, `seeker_needs`, `recruiter_needs`, `lead_data_version`.
- Current context fields, including work formats and organisation type because those controls
  are present in the actual UI.
- `additional_notes`, funnel/completion fields, structured first/last-touch attribution, and timestamps.
- Transactional delivery status as secondary operational metadata.
- Independent phone WhatsApp/SMS/voice choices with consent version, time and source;
  a phone number alone is not permission to contact it.

## Compatibility/deprecated fields

- `job_categories`, `talent_categories`, `job_category_others`, and
  `talent_category_others`: deterministically backfilled into the v1 profiles and retained
  temporarily; current saves no longer write them.
- `job_interest_other` and `talent_need_other`: deprecated generic Other fields whose group
  cannot be inferred safely.
- `whatsapp_consent`, its timestamp, and copy version: legacy fields, not the authority
  for current channel choices. Current saves use separate `phone_*_consent` fields.
- `hiring_frequency` and `talent_seniority`: orphaned; no current UI controls, and current
  validation/actions no longer accept them.
- Promotional email unsubscribe fields remain compatibility/future-channel metadata, not
  current public-form answers.
- `source`, `utm_source`, `utm_medium`, `utm_campaign`, and `referrer` are retained as
  compatibility-only first-touch fields. New reporting prefers the structured JSONB records.

No compatibility column is removed by the v2 migration.

## Completion semantics

- Email saved: `email_only`, meaningful step `email`.
- Role or later progressive save: `partial`.
- Email verification is independent of completion; phone verification fields preserve
  historical state but the current flow validates format only, not ownership.
- Phone save/skip does not complete the funnel.
- A successful final-note submission, including an intentionally empty note, marks the lead
  `completed` at current step 8.

## Local migration policy

Migration `0005` is additive. It creates the two JSONB profiles, version and readable step
fields, backfills only mappings that are deterministic, and adds GIN indexes. Legacy generic
Other values are preserved in place rather than guessed. Production migration requires a
separate explicit approval.

Migration `0008` is also additive. It adds nullable `first_touch_attribution` and
`last_touch_attribution` JSONB columns. It does not backfill or guess historical attribution,
drop a column, or modify existing personal information.
