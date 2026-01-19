CREATE TYPE "public"."goal_status" AS ENUM('not_started', 'in_progress', 'completed', 'abandoned');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('active', 'cancelled', 'past_due', 'trialing', 'incomplete');--> statement-breakpoint
CREATE TYPE "public"."task_priority" AS ENUM('low', 'medium', 'high', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."task_status" AS ENUM('todo', 'in_progress', 'completed', 'cancelled');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dayflow_board" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"color" text DEFAULT '#3b82f6',
	"icon" text,
	"is_default" boolean DEFAULT false,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dayflow_goal" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status" "goal_status" DEFAULT 'not_started' NOT NULL,
	"target_date" timestamp,
	"completed_at" timestamp,
	"color" text DEFAULT '#3b82f6',
	"icon" text,
	"progress" integer DEFAULT 0,
	"parent_goal_id" uuid,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "dayflow_subscription" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"stripe_customer_id" text NOT NULL,
	"stripe_subscription_id" text,
	"stripe_price_id" text,
	"status" "subscription_status" DEFAULT 'incomplete' NOT NULL,
	"current_period_start" timestamp,
	"current_period_end" timestamp,
	"cancel_at_period_end" boolean DEFAULT false,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "dayflow_subscription_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "dayflow_subscription_stripe_customer_id_unique" UNIQUE("stripe_customer_id"),
	CONSTRAINT "dayflow_subscription_stripe_subscription_id_unique" UNIQUE("stripe_subscription_id")
);
--> statement-breakpoint
CREATE TABLE "dayflow_task" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"board_id" uuid,
	"goal_id" uuid,
	"title" text NOT NULL,
	"description" text,
	"priority" "task_priority" DEFAULT 'medium' NOT NULL,
	"status" "task_status" DEFAULT 'todo' NOT NULL,
	"due_date" timestamp,
	"scheduled_start" timestamp,
	"scheduled_end" timestamp,
	"estimated_minutes" integer,
	"actual_minutes" integer,
	"completed_at" timestamp,
	"is_recurring" boolean DEFAULT false,
	"recurrence_rule" text,
	"parent_task_id" uuid,
	"sort_order" integer DEFAULT 0,
	"tags" text[],
	"google_event_id" text,
	"google_calendar_id" text,
	"last_synced_at" timestamp,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dayflow_time_block" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"task_id" uuid,
	"title" text NOT NULL,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp NOT NULL,
	"color" text,
	"is_completed" boolean DEFAULT false,
	"notes" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean NOT NULL,
	"image" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "dayflow_user_preferences" (
	"id" text PRIMARY KEY NOT NULL,
	"theme" text DEFAULT 'system',
	"language" text DEFAULT 'en',
	"date_format" text DEFAULT 'MM/DD/YYYY',
	"time_format" text DEFAULT '12h',
	"week_starts_on" integer DEFAULT 0,
	"show_completed_tasks" boolean DEFAULT false,
	"task_sort_by" text DEFAULT 'priority',
	"task_sort_order" text DEFAULT 'asc',
	"calendar_default_view" text DEFAULT '3-day',
	"board_default_view" text DEFAULT 'compact',
	"google_calendar_enabled" boolean DEFAULT false,
	"google_calendar_selected_id" text,
	"google_calendar_auto_sync" boolean DEFAULT false,
	"auto_schedule_enabled" boolean DEFAULT true,
	"working_hours_start" text DEFAULT '09:00',
	"working_hours_end" text DEFAULT '17:00',
	"working_days" jsonb DEFAULT '[1,2,3,4,5]'::jsonb,
	"buffer_time_between_tasks" integer DEFAULT 15,
	"max_task_chunk_size" integer DEFAULT 120,
	"min_task_chunk_size" integer DEFAULT 30,
	"scheduling_lookahead_days" integer DEFAULT 14,
	"max_daily_work_hours" numeric DEFAULT '8.0',
	"focus_time_minimum_minutes" integer DEFAULT 90,
	"has_completed_onboarding" boolean DEFAULT false,
	"onboarding_data" jsonb,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dayflow_board" ADD CONSTRAINT "dayflow_board_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dayflow_goal" ADD CONSTRAINT "dayflow_goal_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dayflow_subscription" ADD CONSTRAINT "dayflow_subscription_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dayflow_task" ADD CONSTRAINT "dayflow_task_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dayflow_task" ADD CONSTRAINT "dayflow_task_board_id_dayflow_board_id_fk" FOREIGN KEY ("board_id") REFERENCES "public"."dayflow_board"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dayflow_task" ADD CONSTRAINT "dayflow_task_goal_id_dayflow_goal_id_fk" FOREIGN KEY ("goal_id") REFERENCES "public"."dayflow_goal"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dayflow_time_block" ADD CONSTRAINT "dayflow_time_block_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dayflow_time_block" ADD CONSTRAINT "dayflow_time_block_task_id_dayflow_task_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."dayflow_task"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dayflow_user_preferences" ADD CONSTRAINT "dayflow_user_preferences_id_user_id_fk" FOREIGN KEY ("id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "board_user_id_idx" ON "dayflow_board" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "goal_user_id_idx" ON "dayflow_goal" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "goal_status_idx" ON "dayflow_goal" USING btree ("status");--> statement-breakpoint
CREATE INDEX "subscription_user_id_idx" ON "dayflow_subscription" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "subscription_stripe_customer_idx" ON "dayflow_subscription" USING btree ("stripe_customer_id");--> statement-breakpoint
CREATE INDEX "task_user_id_idx" ON "dayflow_task" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "task_board_id_idx" ON "dayflow_task" USING btree ("board_id");--> statement-breakpoint
CREATE INDEX "task_goal_id_idx" ON "dayflow_task" USING btree ("goal_id");--> statement-breakpoint
CREATE INDEX "task_status_idx" ON "dayflow_task" USING btree ("status");--> statement-breakpoint
CREATE INDEX "task_due_date_idx" ON "dayflow_task" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "task_scheduled_idx" ON "dayflow_task" USING btree ("scheduled_start","scheduled_end");--> statement-breakpoint
CREATE INDEX "time_block_user_id_idx" ON "dayflow_time_block" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "time_block_task_id_idx" ON "dayflow_time_block" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "time_block_time_idx" ON "dayflow_time_block" USING btree ("start_time","end_time");