-- Task Dependencies table
CREATE TABLE IF NOT EXISTS "aether_task_dependency" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"depends_on_task_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "aether_task_dependency" ADD CONSTRAINT "aether_task_dependency_task_id_aether_task_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."aether_task"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "aether_task_dependency" ADD CONSTRAINT "aether_task_dependency_depends_on_task_id_aether_task_id_fk" FOREIGN KEY ("depends_on_task_id") REFERENCES "public"."aether_task"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "task_dep_task_id_idx" ON "aether_task_dependency" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "task_dep_depends_on_idx" ON "aether_task_dependency" USING btree ("depends_on_task_id");
