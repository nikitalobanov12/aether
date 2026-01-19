import { z } from "zod";
import { eq, and, desc, isNull } from "drizzle-orm";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { goal, task } from "~/server/db/schema";

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
      z.object({
        includeCompleted: z.boolean().optional().default(false),
        parentGoalId: z.string().uuid().nullable().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const filters = [eq(goal.userId, ctx.session.user.id)];

      if (!input?.includeCompleted) {
        filters.push(
          and(
            eq(goal.status, "not_started"),
            eq(goal.status, "in_progress")
          )!
        );
      }

      // If parentGoalId is explicitly null, get top-level goals
      if (input?.parentGoalId === null) {
        filters.push(isNull(goal.parentGoalId));
      } else if (input?.parentGoalId) {
        filters.push(eq(goal.parentGoalId, input.parentGoalId));
      }

      const goals = await ctx.db.query.goal.findMany({
        where: and(...filters),
        orderBy: [desc(goal.createdAt)],
        with: {
          tasks: {
            where: eq(task.status, "todo"),
          },
          childGoals: true,
        },
      });

      // Calculate progress for each goal
      return goals.map((g) => ({
        ...g,
        taskCount: g.tasks.length,
      }));
    }),

  // Get a single goal by ID with all related data
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db.query.goal.findFirst({
        where: and(eq(goal.id, input.id), eq(goal.userId, ctx.session.user.id)),
        with: {
          tasks: {
            orderBy: (tasks, { asc }) => [asc(tasks.sortOrder)],
          },
          childGoals: true,
          parentGoal: true,
        },
      });
      return result ?? null;
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
      })
    )
    .mutation(async ({ ctx, input }) => {
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
      })
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
      // Tasks linked to this goal will have goalId set to null (via schema onDelete)
      await ctx.db
        .delete(goal)
        .where(
          and(eq(goal.id, input.id), eq(goal.userId, ctx.session.user.id))
        );

      return { success: true };
    }),

  // Recalculate goal progress based on completed tasks
  recalculateProgress: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Get all tasks for this goal
      const goalTasks = await ctx.db.query.task.findMany({
        where: and(
          eq(task.goalId, input.id),
          eq(task.userId, ctx.session.user.id)
        ),
      });

      if (goalTasks.length === 0) {
        return { progress: 0 };
      }

      const completedTasks = goalTasks.filter(
        (t) => t.status === "completed"
      ).length;
      const progress = Math.round((completedTasks / goalTasks.length) * 100);

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
