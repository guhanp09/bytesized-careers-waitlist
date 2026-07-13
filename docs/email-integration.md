# Email delivery & verification — future integration guide

The waitlist is intentionally shipped **without** email delivery. This document explains how it behaves today and exactly how to enable branded email verification later — as a focused configuration + integration step, **not** a rebuild.

---

## How the waitlist operates before domain purchase

Today, with `EMAIL_DELIVERY_ENABLED=false` and `EMAIL_VERIFICATION_ENABLED=false` (the defaults):

- Emails are still **validated for format** and **normalized**, and every lead is **reliably persisted**.
- New leads are stored with `email_verification_status = 'unverified'`. They are immediately, successfully "on the list."
- **No email is ever sent**, and the UI never claims a verification email was sent. Joining is never gated on clicking a link.
- Missing email-provider credentials **cannot crash** anything — provider variables are not even read until delivery is enabled.
- The admin dashboard and CSV export already distinguish `verified` vs `unverified` leads.

We can validate that an address is *correctly formatted* without owning a domain. What we cannot yet do is *prove the visitor controls that address* — that requires a branded verification email, which needs a domain + provider.

---

## Four concepts kept deliberately separate

These are distinct and are **never** collapsed into one boolean:

1. **Contact collection** — having an email on file.
2. **Email ownership verification** — `email_verification_status` (`unverified` / `pending` / `verified` / `bounced`), `email_verification_sent_at`, `email_verified_at`.
3. **Transactional delivery status** — `last_transactional_email_status`, `last_transactional_email_at`.
4. **Promotional consent** — WhatsApp (`whatsapp_consent` + timestamp + copy version) and future email (`unsubscribe_status` + timestamp).

Promotional consent is independent of verification. A verified email is **not** consent to market to it.

---

## The provider abstraction

Email sending goes through a single small interface (`src/lib/email/types.ts`):

```ts
interface EmailProvider {
  sendTransactionalEmail(input): Promise<SendTransactionalEmailResult>;
}
```

- Today `getEmailProvider()` returns a **no-op** provider (`disabledEmailProvider`) that logs and returns `skipped_disabled`.
- To add real delivery, implement one file (e.g. `src/lib/email/resend-provider.ts`) and return it from `getEmailProvider()` when `EMAIL_DELIVERY_ENABLED` is true. No other code changes.

---

## Activation checklist (after `bytesizedcareers.com` is purchased)

1. **Domain → Vercel.** Add the domain to the Vercel project; verify ownership.
2. **Provider account.** Create a transactional-email provider (Resend recommended for Vercel DX). Add `RESEND_API_KEY` to Vercel env (Production + Preview).
3. **DNS authentication.** Add the provider's SPF / DKIM / DMARC records and wait for verification. Typical records:
   - **SPF** — `TXT @ "v=spf1 include:<provider> ~all"`
   - **DKIM** — provider-supplied `CNAME`/`TXT` records
   - **DMARC** — `TXT _dmarc "v=DMARC1; p=none; rua=mailto:postmaster@bytesizedcareers.com"`
4. **Implement the provider.** Add `src/lib/email/resend-provider.ts` and wire it into `getEmailProvider()`.
5. **Migration.** Add nullable columns `email_verification_token_hash` and `email_verification_token_expires_at` (deliberately not created before this point). Reuse the same hash+expiry pattern as resume tokens.
6. **Verification endpoint.** Add `src/app/api/verify-email/route.ts` (single-use, expiring token) and a rate-limited resend-verification action.
7. **Enable flags.** Set `EMAIL_DELIVERY_ENABLED=true` and `EMAIL_VERIFICATION_ENABLED=true`. New Step-1 completions send a verification email and set status to `pending`.
8. **Status only via token.** `email_verification_status` becomes `verified` **only** when a valid, unexpired, single-use token is consumed — never client-asserted.
9. **Bounce/complaint webhook.** Add a signature-verified webhook endpoint that sets `bounced` / `unsubscribe_status`.
10. **Test deliverability.** Send test verification emails to Gmail/Outlook/Yahoo and confirm inbox (not spam) placement **before** enabling any promotional campaign.

---

## Environment variables (future)

| Variable | Purpose |
|---|---|
| `RESEND_API_KEY` (or provider equivalent) | Provider API credential. |
| `EMAIL_FROM_ADDRESS` | e.g. `hello@bytesizedcareers.com`. |
| `EMAIL_VERIFICATION_TOKEN_SECRET` | Pepper for hashing verification tokens. |
| `EMAIL_DELIVERY_ENABLED` | Flip to `true` to enable sending. |
| `EMAIL_VERIFICATION_ENABLED` | Flip to `true` to enable verification. |

---

## Handling existing unverified leads

When verification is enabled, everyone collected beforehand remains a **valid** waitlist member:

- Do **not** delete or invalidate them.
- Run a **controlled** verification campaign to existing `unverified` leads (respecting rate limits), if desired.
- The upsert is keyed on normalized email, so re-touching an existing lead **updates** it — enabling verification never creates duplicates.
- Keep promotional sending disabled until verification + deliverability are confirmed.

---

## Tests to add when verification ships

- Verification tokens expire and cannot be reused.
- Enabling verification does not create duplicate leads.
- Promotional consent remains independent of verification status.
