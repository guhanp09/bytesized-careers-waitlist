# Privacy and communications runbook

Owner: Guhan Purushothaman

Intake channel: `legal@bytesizedcareers.com`

Applies to: ByteSized Careers early-access records
Review date: 17 July 2026

This is a concise manual procedure for the pre-launch service. It does not authorise access outside the ByteSized Careers waitlist systems, replace applicable legal deadlines, or permit personal information to be copied into this repository.

## Core handling rules

- Monitor `legal@bytesizedcareers.com` and restrict access to the operator or an expressly authorised person.
- Keep request details and identity evidence to the minimum necessary.
- Never paste a user's email, phone, resume credential, verification code, or record into repository documentation, tickets, commit messages, or general chat.
- Use the protected admin view and approved database process only when needed for the request.
- Do not send an all-leads CSV to a requester. Prepare only the information associated with that requester.
- Record intake date, request type, verification outcome, actions, response date and completion status in a secure case record.
- Apply the response period and complaint/appeal rights required by the law applicable to the person and request.

## Access or copy request

1. Acknowledge the request without confirming whether an address is registered to an unauthenticated person.
2. Ask the requester to demonstrate reasonable control of the email address associated with the registration. Do not request government ID by default.
3. Locate the record by normalised email using approved administrative access.
4. Review the fields, verification/status metadata, attribution, relevant communications and any known active export copies associated with the person.
5. Prepare an intelligible, minimised copy or summary. Exclude secrets, internal security values, other people's data, privileged material and information lawfully withheld.
6. Send the result through an appropriate secure method and record completion.

## Correction request

1. Verify control of the relevant email address.
2. Identify the exact inaccurate field and the requested correction.
3. Check that the correction is valid and does not replace the record with another person's information.
4. Correct the source record through an approved process and update directly derived active copies where reasonably necessary.
5. Confirm completion and record what was changed without retaining unnecessary before-and-after personal data.

## Deletion request

1. Verify control of the relevant email address.
2. Identify the waitlist record and related verification, attribution, resume-authority and operational metadata.
3. Check whether information must reasonably remain for a disclosed active purpose, an unresolved request or dispute, fraud/security prevention, a legal claim, or a legal obligation.
4. Delete or anonymise information that no longer needs to be retained. If limited information must remain, minimise it and document the purpose and review point.
5. Address known working CSV/export copies and instruct relevant processors where required and available.
6. Recognise that provider backups may age out under provider cycles; do not promise instantaneous removal from every backup. Ensure a later restoration does not silently return deleted information to active use.
7. Invalidate active resume authority where part of the deleted record.
8. Confirm the outcome, explain any lawful retention in general terms, and record completion.

## Optional email opt-out and suppression

An opt-out stops optional launch, invitation and future relevance-related email. It does not, by itself, erase the waitlist registration.

1. Receive the request through `legal@bytesizedcareers.com` or a dependable unsubscribe method included in a future message.
2. Verify the email address concerned. A reply from the same address will ordinarily be sufficient unless circumstances indicate misuse.
3. Before any optional campaign is sent, record the address as suppressed in the approved sending process. The existing `unsubscribeStatus` and `unsubscribedAt` fields may later support this when connected to an authorised process; their default values are not proof of consent.
4. Exclude the suppressed address from launch, invitation and relevance-related campaign lists and test the exclusion before send.
5. Keep only the minimal suppression record reasonably necessary to honour the choice.
6. Continue only necessary service, security, legal or request-response messages.
7. If the person also requests deletion, open and assess that as a separate deletion request.

No optional bulk campaign should begin until this suppression step is dependable, recipients and legal grounds have been reviewed, and the message provides an appropriate unsubscribe method where required.

## Phone-channel withdrawal

WhatsApp, SMS and phone-call choices are independent. A withdrawal for one channel does not withdraw the others or delete the registration.

1. Receive the request through `legal@bytesizedcareers.com` and verify reasonable control of the associated registration.
2. Identify the exact channel or channels the person wants to withdraw.
3. Record each withdrawn channel as false, preserve a proportionate version/time/source audit record, and ensure no active list or working export still treats it as opted in.
4. If the person withdraws every phone channel or asks to remove the number, clear the relevant choices; remove the phone number when requested and appropriate.
5. Confirm the update without restating the full phone number in ordinary email.
6. Treat a separate deletion request under the deletion procedure above.

No phone channel may be activated merely because these choices exist. Before any activation, approve the provider, sender identity, recipient rules, suppression process, message content, frequency and jurisdiction-specific requirements, then test withdrawal end to end.

## Complaint or grievance

1. Acknowledge the grievance and record the issue, date and requested resolution.
2. Verify identity only to the extent necessary for the complaint.
3. Preserve relevant evidence without expanding collection unnecessarily.
4. Review the public notice, Terms, consent/communication facts, record history and applicable legal requirements.
5. Correct the issue, explain the outcome, or escalate for qualified legal advice as appropriate.
6. Provide information about any applicable regulator or further complaint right when required.
7. Record the response and completion.

## Security incident escalation

1. Stop or contain the suspected exposure without deleting necessary evidence.
2. Restrict access, rotate or revoke affected credentials/tokens where appropriate, and preserve sanitised technical facts.
3. Determine what systems, data categories, people, providers and time periods may be involved.
4. Contact Vercel, Neon, Resend or GitHub through their official incident/support routes if their service is implicated.
5. Assess risk, applicable contractual duties, and legal notification requirements promptly; obtain qualified advice where needed.
6. Notify affected people or authorities when required, using accurate facts without exposing additional personal data.
7. Remediate the cause, reconcile any restored/deleted records, and record lessons and follow-up actions.

## Campaign pre-send checklist

- The message fits a disclosed early-access, launch, invitation or future relevance purpose.
- The feature described actually exists or is clearly described as future/conditional.
- Potential relevance is not presented as guaranteed suitability or outcome.
- The recipient source and applicable communication ground have been reviewed.
- Suppressed addresses are excluded and the exclusion has been tested.
- Sender identity and contact information are accurate.
- A dependable unsubscribe method is present where available or required.
- Phone entry is never treated as consent; any phone recipient is included only for the exact channel explicitly recorded as opted in.
- Delivery uses an approved ByteSized Careers provider/account and does not expose recipient lists.
- The send and any resulting opt-outs are recorded proportionately.

## Periodic review

Review this runbook before optional campaigns, before marketplace invitations, after a security incident, and whenever the schema, providers, target audience, communications channels or applicable law materially changes.
