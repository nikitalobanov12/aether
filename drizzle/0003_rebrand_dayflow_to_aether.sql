-- Rebrand: Rename all dayflow_ tables to aether_
ALTER TABLE "dayflow_board" RENAME TO "aether_board";--> statement-breakpoint
ALTER TABLE "dayflow_goal" RENAME TO "aether_goal";--> statement-breakpoint
ALTER TABLE "dayflow_project" RENAME TO "aether_project";--> statement-breakpoint
ALTER TABLE "dayflow_task" RENAME TO "aether_task";--> statement-breakpoint
ALTER TABLE "dayflow_time_block" RENAME TO "aether_time_block";--> statement-breakpoint
ALTER TABLE "dayflow_completed_task" RENAME TO "aether_completed_task";--> statement-breakpoint
ALTER TABLE "dayflow_habit_streak" RENAME TO "aether_habit_streak";--> statement-breakpoint
ALTER TABLE "dayflow_google_integration" RENAME TO "aether_google_integration";--> statement-breakpoint
ALTER TABLE "dayflow_sync_log" RENAME TO "aether_sync_log";--> statement-breakpoint
ALTER TABLE "dayflow_user_preferences" RENAME TO "aether_user_preferences";--> statement-breakpoint
ALTER TABLE "dayflow_subscription" RENAME TO "aether_subscription";
