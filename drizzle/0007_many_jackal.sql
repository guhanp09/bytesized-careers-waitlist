ALTER TABLE "waitlist_leads" ADD COLUMN "phone_whatsapp_consent" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "waitlist_leads" ADD COLUMN "phone_sms_consent" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "waitlist_leads" ADD COLUMN "phone_voice_consent" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "waitlist_leads" ADD COLUMN "phone_consent_version" text;--> statement-breakpoint
ALTER TABLE "waitlist_leads" ADD COLUMN "phone_consent_recorded_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "waitlist_leads" ADD COLUMN "phone_consent_source" text;