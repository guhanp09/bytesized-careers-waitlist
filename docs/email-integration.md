# Email delivery and ownership verification

ByteSized Careers has a production Resend adapter behind the existing transactional-email
interface. It remains disabled by default. Email capture and every later waitlist step work
without Resend credentials, and a provider failure never removes the saved lead.

## Runtime modes

| Configuration | Behaviour |
|---|---|
| Both feature flags off | No send attempt; the UI honestly offers deferred verification. |
| `LOCAL_VERIFICATION_ENABLED=true` plus verification enabled, outside production | A deterministic local provider logs and displays the six-digit dev code. No outbound message. |
| Both feature flags on plus valid Resend configuration | The real provider submits the verification email and the UI says “sent” only after Resend accepts it. |
| Flags on but credentials missing | No crash and no send attempt; verification is shown as unavailable. |

Required production settings:

```dotenv
EMAIL_DELIVERY_ENABLED=true
EMAIL_VERIFICATION_ENABLED=true
RESEND_API_KEY=<enter directly in the environment; never paste into chat or commit>
EMAIL_FROM_ADDRESS=ByteSized Careers <verify@updates.bytesizedcareers.com>
EMAIL_REPLY_TO=<optional support address>
LOCAL_VERIFICATION_ENABLED=false
```

## Architecture and delivery guarantees

- `src/lib/email/types.ts` is the provider-neutral contract.
- `src/lib/email/resend-provider.ts` maps that contract to `POST /emails` with a stable
  idempotency key for each logical challenge.
- `src/lib/verification/providers.ts` selects local mock, real email, or unavailable mode.
- Verification templates may include the captured name as an escaped, optional greeting; legacy rows send the same code email without a greeting.
- A challenge is reserved before sending so concurrent requests cannot generate duplicate
  sends. Provider acceptance then records the Resend message ID and sent timestamp.
- A known rejection clears the unusable challenge and leaves the lead unverified. A timeout
  or network interruption is shown as uncertain; the bound code remains usable if it arrives.
- Codes are random six-digit values. Only a lead/channel-bound HMAC is stored. Comparison is
  constant-time, codes expire after ten minutes, attempts are capped, resends supersede the
  old hash, and consumption clears the hash.
- Rate limits cover pepper-hashed IP, lead, and normalized-email scopes. Raw IPs and email
  addresses are never written to the rate-limit table.

## Verification-email branding

Verification messages include the canonical ByteSized Careers mark at the stable public URL
`https://bytesizedcareers.com/brand/bytesized-careers-mark-email.png`. The HTML version uses
an absolute HTTPS PNG with meaningful alt text; the plain-text version names ByteSized Careers
and remains complete when images are blocked. The public page, favicon, Apple touch icon, social
preview, and email all derive from the same double-ruled serif-B mark.

The image inside the message is email-body branding, not a sender avatar. Inbox avatars are
controlled by each mailbox provider. Cross-provider brand indicators generally require aligned
DMARC enforcement plus BIMI evidence, often a paid Common Mark Certificate (CMC) or Verified
Mark Certificate (VMC), and are not enabled by this repository.

## External Resend and DNS checkpoint

Do not enable real delivery until all steps below are complete:

1. Sign in to Resend and add `updates.bytesizedcareers.com` as a sending domain.
2. In Resend’s domain screen, copy the exact DNS records it generates. Resend normally
   provides SPF/return-path and DKIM records, but record names and values are account/domain
   specific—do not substitute examples from this repository.
3. Add those exact records to the DNS zone that Vercel shows for `bytesizedcareers.com`.
4. Return to Resend and wait until the domain status is `verified`.
5. Create a sending-access API key restricted to this use where the Resend account permits.
6. Enter the key directly into local `.env.local` as `RESEND_API_KEY`. Do not paste it into
   chat, logs, terminal output, screenshots, or source control.
7. Set the two email flags to `true`, keep local verification off, restart the local server,
   and perform a real inbox test.
8. Only after local approval, add the same settings directly to the standalone waitlist
   Vercel project’s Production environment and follow the production rollout checkpoint.

## Local mock testing

For deterministic development without outbound email:

```dotenv
EMAIL_DELIVERY_ENABLED=false
EMAIL_VERIFICATION_ENABLED=true
LOCAL_VERIFICATION_ENABLED=true
```

The development banner is intentionally impossible in production even if the local flag is
accidentally present.

## Production rollout

The migration adding request/provider/failure metadata must be applied to the standalone
`bytesized-careers-waitlist` Neon project before deploying code that enables delivery. Do
not run that migration or modify production flags until local approval and explicit
production authorization. Existing unverified leads remain valid waitlist members.

### Deployment checklist

Complete this checklist before every Production deployment. All variables must be scoped to
the standalone `aforalgo/bytesized-careers-waitlist` Vercel project’s Production environment:

- `EMAIL_VERIFICATION_ENABLED` is enabled (`true` or `1`).
- `EMAIL_DELIVERY_ENABLED` is enabled (`true` or `1`).
- `LOCAL_VERIFICATION_ENABLED` is disabled (normally `false`).
- `RESEND_API_KEY` is present and non-blank.
- `EMAIL_FROM_ADDRESS` is present and non-blank.
- Resend still shows the sending domain as verified.
- The required database migration has been applied to the separate ByteSized Careers Neon
  project; no CreatorJobs resource is in scope.

The Vercel Production build runs the sanitized gate automatically before `next build`. Confirm
that this step passes in the deployment logs. Sensitive Production variables are available to
the build even though their values cannot be retrieved for a local CLI check.

For CI or a build shell that already has the target variables injected, run the strict command:

```bash
npm run smoke:production-email-config
```

The command reports only enabled/disabled or present/missing statuses and exits nonzero for
an unsafe Production configuration. It never prints environment values, credentials, tokens,
or provider responses. Do not download Sensitive Production values into a local environment
file just to run this check.

After deployment, complete one controlled verification: submit a fresh address, confirm the
branded message arrives, enter its code, and confirm the lead becomes verified. Provider
failure must continue to show the honest verification-unavailable fallback; do not bypass it.
