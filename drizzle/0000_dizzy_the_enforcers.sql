CREATE TYPE "public"."completion_status" AS ENUM('email_only', 'partial', 'completed');--> statement-breakpoint
CREATE TYPE "public"."email_verification_status" AS ENUM('unverified', 'pending', 'verified', 'bounced');--> statement-breakpoint
CREATE TYPE "public"."lead_role" AS ENUM('seeker', 'recruiter', 'both');--> statement-breakpoint
CREATE TYPE "public"."transactional_email_status" AS ENUM('not_attempted', 'sent', 'failed', 'skipped_disabled');--> statement-breakpoint
CREATE TYPE "public"."unsubscribe_status" AS ENUM('subscribed', 'unsubscribed');--> statement-breakpoint
CREATE TABLE "rate_limit_hits" (
	"id" text PRIMARY KEY NOT NULL,
	"bucket_key" text NOT NULL,
	"window_start" timestamp with time zone NOT NULL,
	"count" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "waitlist_leads" (
	"id" text PRIMARY KEY NOT NULL,
	"original_email" text NOT NULL,
	"normalized_email" text NOT NULL,
	"role" "lead_role",
	"job_categories" text[] DEFAULT '{}'::text[] NOT NULL,
	"talent_categories" text[] DEFAULT '{}'::text[] NOT NULL,
	"work_formats" text[] DEFAULT '{}'::text[] NOT NULL,
	"organisation_types" text[] DEFAULT '{}'::text[] NOT NULL,
	"phone_e164" text,
	"phone_country_iso" text,
	"whatsapp_consent" boolean DEFAULT false NOT NULL,
	"whatsapp_consent_at" timestamp with time zone,
	"whatsapp_consent_copy_version" text,
	"email_verification_status" "email_verification_status" DEFAULT 'unverified' NOT NULL,
	"email_verification_sent_at" timestamp with time zone,
	"email_verified_at" timestamp with time zone,
	"last_transactional_email_status" "transactional_email_status" DEFAULT 'not_attempted' NOT NULL,
	"last_transactional_email_at" timestamp with time zone,
	"unsubscribe_status" "unsubscribe_status" DEFAULT 'subscribed' NOT NULL,
	"unsubscribed_at" timestamp with time zone,
	"completion_status" "completion_status" DEFAULT 'email_only' NOT NULL,
	"last_completed_step" integer DEFAULT 1 NOT NULL,
	"source" text,
	"utm_source" text,
	"utm_medium" text,
	"utm_campaign" text,
	"referrer" text,
	"resume_token_hash" text,
	"resume_token_expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE UNIQUE INDEX "rate_limit_bucket_window_idx" ON "rate_limit_hits" USING btree ("bucket_key","window_start");--> statement-breakpoint
CREATE UNIQUE INDEX "waitlist_leads_normalized_email_key" ON "waitlist_leads" USING btree ("normalized_email");--> statement-breakpoint
CREATE UNIQUE INDEX "waitlist_leads_resume_token_hash_key" ON "waitlist_leads" USING btree ("resume_token_hash");--> statement-breakpoint
CREATE INDEX "waitlist_leads_role_idx" ON "waitlist_leads" USING btree ("role");--> statement-breakpoint
CREATE INDEX "waitlist_leads_completion_status_idx" ON "waitlist_leads" USING btree ("completion_status");--> statement-breakpoint
CREATE INDEX "waitlist_leads_created_at_idx" ON "waitlist_leads" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "waitlist_leads_email_verification_status_idx" ON "waitlist_leads" USING btree ("email_verification_status");--> statement-breakpoint
CREATE INDEX "waitlist_leads_job_categories_gin_idx" ON "waitlist_leads" USING gin ("job_categories");--> statement-breakpoint
CREATE INDEX "waitlist_leads_talent_categories_gin_idx" ON "waitlist_leads" USING gin ("talent_categories");