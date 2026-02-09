import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { taskDependency, task } from "~/server/db/schema";

export const taskDependencyRouter = createTRPCRouter({
  // Get dependencies for a task (what this task depends on)
  getForTask: protectedProcedure
    .input(z.object({ taskId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.query.taskDependency.findMany({
        where: eq(taskDependency.taskId, input.taskId),
        with: {
          dependsOnTask: {
            columns: { id: true, title: true, status: true, priority: true },
          },
        },
      });
    }),

  // Get tasks that depend on this task (dependents)
  getDependents: protectedProcedure
    .input(z.object({ taskId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.query.taskDependency.findMany({
        where: eq(taskDependency.dependsOnTaskId, input.taskId),
        with: {
          task: {
            columns: { id: true, title: true, status: true, priority: true },
          },
        },
      });
    }),

  // Add a dependency
  add: protectedProcedure
    .input(
      z.object({
        taskId: z.string().uuid(),
        dependsOnTaskId: z.string().uuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Prevent self-dependency
      if (input.taskId === input.dependsOnTaskId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "A task cannot depend on itself",
        });
      }

      // Verify both tasks belong to this user
      const [taskA, taskB] = await Promise.all([
        ctx.db.query.task.findFirst({
          where: and(
            eq(task.id, input.taskId),
            eq(task.userId, ctx.session.user.id),
          ),
        }),
        ctx.db.query.task.findFirst({
          where: and(
            eq(task.id, input.dependsOnTaskId),
            eq(task.userId, ctx.session.user.id),
          ),
        }),
      ]);

      if (!taskA || !taskB) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Task not found",
        });
      }

      // Check for duplicate
      const existing = await ctx.db.query.taskDependency.findFirst({
        where: and(
          eq(taskDependency.taskId, input.taskId),
          eq(taskDependency.dependsOnTaskId, input.dependsOnTaskId),
        ),
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Dependency already exists",
        });
      }

      // Check for circular dependency (B depends on A, don't let A depend on B)
      const reverse = await ctx.db.query.taskDependency.findFirst({
        where: and(
          eq(taskDependency.taskId, input.dependsOnTaskId),
          eq(taskDependency.dependsOnTaskId, input.taskId),
        ),
      });

      if (reverse) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Circular dependency detected",
        });
      }

      const [dep] = await ctx.db
        .insert(taskDependency)
        .values({
          taskId: input.taskId,
          dependsOnTaskId: input.dependsOnTaskId,
        })
        .returning();

      return dep;
    }),

  // Remove a dependency
  remove: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Verify the dependency belongs to user's tasks
      const dep = await ctx.db.query.taskDependency.findFirst({
        where: eq(taskDependency.id, input.id),
        with: {
          task: { columns: { userId: true } },
        },
      });

      if (dep?.task.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Dependency not found",
        });
      }

      await ctx.db
        .delete(taskDependency)
        .where(eq(taskDependency.id, input.id));

      return { success: true };
    }),
});
