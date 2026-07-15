CREATE TYPE "public"."phone_verification_status" AS ENUM('unverified', 'pending', 'verified');--> statement-breakpoint
ALTER TABLE "waitlist_leads" ADD COLUMN "job_interest_other" text;--> statement-breakpoint
ALTER TABLE "waitlist_leads" ADD COLUMN "talent_need_other" text;--> statement-breakpoint
ALTER TABLE "waitlist_leads" ADD COLUMN "platform_other" text;--> statement-breakpoint
ALTER TABLE "waitlist_leads" ADD COLUMN "niche_other" text;--> statement-breakpoint
ALTER TABLE "waitlist_leads" ADD COLUMN "platforms" text[] DEFAULT '{}'::text[] NOT NULL;--> statement-breakpoint
ALTER TABLE "waitlist_leads" ADD COLUMN "niches" text[] DEFAULT '{}'::text[] NOT NULL;--> statement-breakpoint
ALTER TABLE "waitlist_leads" ADD COLUMN "experience_level" text;--> statement-breakpoint
ALTER TABLE "waitlist_leads" ADD COLUMN "availability_to_start" text;--> statement-breakpoint
ALTER TABLE "waitlist_leads" ADD COLUMN "portfolio_url" text;--> statement-breakpoint
ALTER TABLE "waitlist_leads" ADD COLUMN "hiring_frequency" text;--> statement-breakpoint
ALTER TABLE "waitlist_leads" ADD COLUMN "talent_seniority" text;--> statement-breakpoint
ALTER TABLE "waitlist_leads" ADD COLUMN "hiring_timeline" text;--> statement-breakpoint
ALTER TABLE "waitlist_leads" ADD COLUMN "team_size" text;--> statement-breakpoint
ALTER TABLE "waitlist_leads" ADD COLUMN "company_url" text;--> statement-breakpoint
ALTER TABLE "waitlist_leads" ADD COLUMN "email_verification_token_hash" text;--> statement-breakpoint
ALTER TABLE "waitlist_leads" ADD COLUMN "email_verification_expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "waitlist_leads" ADD COLUMN "email_verification_attempts" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "waitlist_leads" ADD COLUMN "email_verification_last_sent_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "waitlist_leads" ADD COLUMN "phone_verification_status" "phone_verification_status" DEFAULT 'unverified' NOT NULL;--> statement-breakpoint
ALTER TABLE "waitlist_leads" ADD COLUMN "phone_verification_token_hash" text;--> statement-breakpoint
ALTER TABLE "waitlist_leads" ADD COLUMN "phone_verification_requested_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "waitlist_leads" ADD COLUMN "phone_verification_expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "waitlist_leads" ADD COLUMN "phone_verified_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "waitlist_leads" ADD COLUMN "phone_verification_attempts" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "waitlist_leads" ADD COLUMN "phone_verification_last_sent_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "waitlist_leads_phone_verification_status_idx" ON "waitlist_leads" USING btree ("phone_verification_status");--> statement-breakpoint
CREATE INDEX "waitlist_leads_platforms_gin_idx" ON "waitlist_leads" USING gin ("platforms");--> statement-breakpoint
CREATE INDEX "waitlist_leads_niches_gin_idx" ON "waitlist_leads" USING gin ("niches");