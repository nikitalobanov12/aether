CREATE TYPE "public"."sync_status" AS ENUM('pending', 'syncing', 'synced', 'failed');--> statement-breakpoint
CREATE TYPE "public"."sync_type" AS ENUM('calendar', 'tasks');--> statement-breakpoint
CREATE TABLE "dayflow_completed_task" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"project_id" uuid,
	"goal_id" uuid,
	"task_title" text NOT NULL,
	"task_priority" "task_priority",
	"completed_at" timestamp NOT NULL,
	"time_spent_minutes" integer,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "dayflow_google_integration" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text NOT NULL,
	"refresh_token" text NOT NULL,
	"token_expires_at" timestamp NOT NULL,
	"calendar_id" text,
	"calendar_enabled" boolean DEFAULT true,
	"tasks_list_id" text,
	"tasks_enabled" boolean DEFAULT true,
	"last_calendar_sync_at" timestamp,
	"last_tasks_sync_at" timestamp,
	"connected_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "dayflow_google_integration_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "dayflow_habit_streak" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"habit_name" text NOT NULL,
	"current_streak_days" integer DEFAULT 0 NOT NULL,
	"best_streak_days" integer DEFAULT 0 NOT NULL,
	"last_completed_date" timestamp,
	"streak_history" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dayflow_project" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"goal_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"color" text DEFAULT '#3b82f6',
	"icon" text,
	"sort_order" integer DEFAULT 0,
	"archived" boolean DEFAULT false,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dayflow_sync_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"sync_type" "sync_type" NOT NULL,
	"google_resource_id" text,
	"app_resource_id" text,
	"app_resource_type" text,
	"status" "sync_status" DEFAULT 'pending' NOT NULL,
	"error_message" text,
	"synced_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "dayflow_goal" ADD COLUMN "sort_order" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "dayflow_goal" ADD COLUMN "archived" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "dayflow_task" ADD COLUMN "project_id" uuid;--> statement-breakpoint
ALTER TABLE "dayflow_task" ADD COLUMN "next_up_order" integer;--> statement-breakpoint
ALTER TABLE "dayflow_task" ADD COLUMN "habit_name" text;--> statement-breakpoint
ALTER TABLE "dayflow_task" ADD COLUMN "archived" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "dayflow_task" ADD COLUMN "google_tasks_id" text;--> statement-breakpoint
ALTER TABLE "dayflow_task" ADD COLUMN "google_tasks_list_id" text;--> statement-breakpoint
ALTER TABLE "dayflow_completed_task" ADD CONSTRAINT "dayflow_completed_task_task_id_dayflow_task_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."dayflow_task"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dayflow_completed_task" ADD CONSTRAINT "dayflow_completed_task_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dayflow_completed_task" ADD CONSTRAINT "dayflow_completed_task_project_id_dayflow_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."dayflow_project"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dayflow_completed_task" ADD CONSTRAINT "dayflow_completed_task_goal_id_dayflow_goal_id_fk" FOREIGN KEY ("goal_id") REFERENCES "public"."dayflow_goal"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dayflow_google_integration" ADD CONSTRAINT "dayflow_google_integration_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dayflow_habit_streak" ADD CONSTRAINT "dayflow_habit_streak_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dayflow_project" ADD CONSTRAINT "dayflow_project_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dayflow_project" ADD CONSTRAINT "dayflow_project_goal_id_dayflow_goal_id_fk" FOREIGN KEY ("goal_id") REFERENCES "public"."dayflow_goal"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dayflow_sync_log" ADD CONSTRAINT "dayflow_sync_log_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "completed_task_user_id_idx" ON "dayflow_completed_task" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "completed_task_completed_at_idx" ON "dayflow_completed_task" USING btree ("completed_at");--> statement-breakpoint
CREATE INDEX "completed_task_project_id_idx" ON "dayflow_completed_task" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "google_integration_user_id_idx" ON "dayflow_google_integration" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "habit_streak_user_id_idx" ON "dayflow_habit_streak" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "habit_streak_name_idx" ON "dayflow_habit_streak" USING btree ("user_id","habit_name");--> statement-breakpoint
CREATE INDEX "project_user_id_idx" ON "dayflow_project" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "project_goal_id_idx" ON "dayflow_project" USING btree ("goal_id");--> statement-breakpoint
CREATE INDEX "sync_log_user_id_idx" ON "dayflow_sync_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sync_log_google_resource_idx" ON "dayflow_sync_log" USING btree ("google_resource_id");--> statement-breakpoint
CREATE INDEX "sync_log_app_resource_idx" ON "dayflow_sync_log" USING btree ("app_resource_id");--> statement-breakpoint
ALTER TABLE "dayflow_task" ADD CONSTRAINT "dayflow_task_project_id_dayflow_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."dayflow_project"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "task_project_id_idx" ON "dayflow_task" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "task_next_up_idx" ON "dayflow_task" USING btree ("project_id","next_up_order");