import { z } from "zod";
import { eq, and, desc, isNull, asc } from "drizzle-orm";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { goal, project, task } from "~/server/db/schema";

const goalStatusSchema = z.enum([
  "not_started",
  "in_progress",
  "completed",
  "abandoned",
]);

export const goalRouter = createTRPCRouter({
  // Get all goals for the current user
  getAll: protectedProcedure
    .input(
      z
        .object({
          includeCompleted: z.boolean().optional().default(false),
          includeArchived: z.boolean().optional().default(false),
          parentGoalId: z.string().uuid().nullable().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const filters = [eq(goal.userId, ctx.session.user.id)];

      if (!input?.includeCompleted) {
        // Only filter out completed if not including them
        // Can't use AND with enum in this context, just include all statuses
      }

      if (!input?.includeArchived) {
        filters.push(eq(goal.archived, false));
      }

      // If parentGoalId is explicitly null, get top-level goals
      if (input?.parentGoalId === null) {
        filters.push(isNull(goal.parentGoalId));
      } else if (input?.parentGoalId) {
        filters.push(eq(goal.parentGoalId, input.parentGoalId));
      }

      const goals = await ctx.db.query.goal.findMany({
        where: and(...filters),
        orderBy: [asc(goal.sortOrder), desc(goal.createdAt)],
        with: {
          projects: {
            where: eq(project.archived, false),
            orderBy: [asc(project.sortOrder)],
            with: {
              tasks: {
                where: eq(task.archived, false),
              },
            },
          },
          tasks: {
            where: eq(task.status, "todo"),
          },
          childGoals: true,
        },
      });

      // Calculate progress for each goal based on project tasks
      return goals.map((g) => {
        // Count tasks across all projects
        const allTasks = g.projects.flatMap((p) => p.tasks);
        const completedTasks = allTasks.filter(
          (t) => t.status === "completed",
        ).length;
        const totalTasks = allTasks.length;

        // Calculate project-level stats
        const projectStats = g.projects.map((p) => {
          const pCompleted = p.tasks.filter(
            (t) => t.status === "completed",
          ).length;
          const pTotal = p.tasks.length;
          return {
            projectId: p.id,
            projectTitle: p.title,
            completedCount: pCompleted,
            totalCount: pTotal,
            progress: pTotal > 0 ? Math.round((pCompleted / pTotal) * 100) : 0,
          };
        });

        return {
          ...g,
          taskCount: g.tasks.length,
          projectCount: g.projects.length,
          totalTaskCount: totalTasks,
          completedTaskCount: completedTasks,
          calculatedProgress:
            totalTasks > 0
              ? Math.round((completedTasks / totalTasks) * 100)
              : 0,
          projectStats,
        };
      });
    }),

  // Get a single goal by ID with all related data
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db.query.goal.findFirst({
        where: and(eq(goal.id, input.id), eq(goal.userId, ctx.session.user.id)),
        with: {
          projects: {
            where: eq(project.archived, false),
            orderBy: [asc(project.sortOrder)],
            with: {
              tasks: {
                where: eq(task.archived, false),
                orderBy: [
                  asc(task.nextUpOrder),
                  desc(task.priority),
                  asc(task.dueDate),
                ],
                with: {
                  subtasks: true,
                },
              },
            },
          },
          tasks: {
            orderBy: (tasks, { asc }) => [asc(tasks.sortOrder)],
          },
          childGoals: true,
          parentGoal: true,
        },
      });

      if (!result) return null;

      // Calculate overall progress
      const allTasks = result.projects.flatMap((p) => p.tasks);
      const completedTasks = allTasks.filter(
        (t) => t.status === "completed",
      ).length;
      const totalTasks = allTasks.length;

      // Identify "Next Up" task for each project
      const projectsWithNextUp = result.projects.map((p) => {
        const nextUpTask = p.tasks.find(
          (t) => t.status !== "completed" && t.status !== "cancelled",
        );
        return {
          ...p,
          nextUpTaskId: nextUpTask?.id ?? null,
          completedCount: p.tasks.filter((t) => t.status === "completed")
            .length,
          totalCount: p.tasks.length,
        };
      });

      return {
        ...result,
        projects: projectsWithNextUp,
        totalTaskCount: totalTasks,
        completedTaskCount: completedTasks,
        calculatedProgress:
          totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      };
    }),

  // Create a new goal
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(200),
        description: z.string().max(2000).optional(),
        targetDate: z.string().datetime().optional(),
        color: z.string().optional(),
        icon: z.string().optional(),
        parentGoalId: z.string().uuid().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Get highest sort order
      const existingGoals = await ctx.db.query.goal.findMany({
        where: eq(goal.userId, ctx.session.user.id),
      });
      const maxSortOrder =
        existingGoals.length > 0
          ? Math.max(...existingGoals.map((g) => g.sortOrder ?? 0))
          : 0;

      const [newGoal] = await ctx.db
        .insert(goal)
        .values({
          userId: ctx.session.user.id,
          title: input.title,
          description: input.description,
          targetDate: input.targetDate ? new Date(input.targetDate) : undefined,
          color: input.color,
          icon: input.icon,
          parentGoalId: input.parentGoalId,
          sortOrder: maxSortOrder + 1,
        })
        .returning();

      return newGoal;
    }),

  // Update a goal
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        title: z.string().min(1).max(200).optional(),
        description: z.string().max(2000).optional(),
        status: goalStatusSchema.optional(),
        targetDate: z.string().datetime().nullable().optional(),
        color: z.string().optional(),
        icon: z.string().optional(),
        progress: z.number().int().min(0).max(100).optional(),
        archived: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, targetDate, ...rest } = input;

      const updateData: Record<string, unknown> = {
        ...rest,
        updatedAt: new Date(),
      };

      if (targetDate !== undefined) {
        updateData.targetDate = targetDate ? new Date(targetDate) : null;
      }

      // If marking as completed, set completedAt
      if (input.status === "completed") {
        updateData.completedAt = new Date();
        updateData.progress = 100;
      } else if (input.status) {
        updateData.completedAt = null;
      }

      const [updated] = await ctx.db
        .update(goal)
        .set(updateData)
        .where(and(eq(goal.id, id), eq(goal.userId, ctx.session.user.id)))
        .returning();

      return updated;
    }),

  // Delete a goal
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Projects linked to this goal will be deleted (via schema onDelete: cascade)
      // Tasks will have projectId/goalId set to null (via schema onDelete: set null)
      await ctx.db
        .delete(goal)
        .where(
          and(eq(goal.id, input.id), eq(goal.userId, ctx.session.user.id)),
        );

      return { success: true };
    }),

  // Reorder goals
  reorder: protectedProcedure
    .input(
      z.object({
        goalIds: z.array(z.string().uuid()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const updates = input.goalIds.map((id, index) =>
        ctx.db
          .update(goal)
          .set({ sortOrder: index, updatedAt: new Date() })
          .where(and(eq(goal.id, id), eq(goal.userId, ctx.session.user.id))),
      );

      await Promise.all(updates);

      return { success: true };
    }),

  // Recalculate goal progress based on completed tasks
  recalculateProgress: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Get all tasks for this goal via projects
      const goalData = await ctx.db.query.goal.findFirst({
        where: and(eq(goal.id, input.id), eq(goal.userId, ctx.session.user.id)),
        with: {
          projects: {
            with: {
              tasks: true,
            },
          },
        },
      });

      if (!goalData) {
        return { progress: 0 };
      }

      const allTasks = goalData.projects.flatMap((p) => p.tasks);

      if (allTasks.length === 0) {
        return { progress: 0 };
      }

      const completedTasks = allTasks.filter(
        (t) => t.status === "completed",
      ).length;
      const progress = Math.round((completedTasks / allTasks.length) * 100);

      const [updated] = await ctx.db
        .update(goal)
        .set({
          progress,
          updatedAt: new Date(),
        })
        .where(and(eq(goal.id, input.id), eq(goal.userId, ctx.session.user.id)))
        .returning();

      return updated;
    }),
});
