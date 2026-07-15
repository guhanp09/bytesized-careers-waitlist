ALTER TABLE "waitlist_leads" ADD COLUMN "email_verification_request_id" text;--> statement-breakpoint
ALTER TABLE "waitlist_leads" ADD COLUMN "email_verification_requested_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "waitlist_leads" ADD COLUMN "email_verification_provider_message_id" text;--> statement-breakpoint
ALTER TABLE "waitlist_leads" ADD COLUMN "email_verification_failure_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "waitlist_leads" ADD COLUMN "email_verification_failure_code" text;