ALTER TYPE "public"."sync_type" ADD VALUE 'task_to_google';--> statement-breakpoint
ALTER TYPE "public"."sync_type" ADD VALUE 'event_to_app';--> statement-breakpoint
ALTER TABLE "dayflow_time_block" ADD COLUMN "google_calendar_event_id" text;--> statement-breakpoint
CREATE INDEX "time_block_google_event_idx" ON "dayflow_time_block" USING btree ("google_calendar_event_id");