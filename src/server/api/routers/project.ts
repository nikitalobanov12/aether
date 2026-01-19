import { z } from "zod";
import { eq, and, asc } from "drizzle-orm";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { project, task } from "~/server/db/schema";

export const projectRouter = createTRPCRouter({
  // Get all projects for a specific goal
  getByGoalId: protectedProcedure
    .input(
      z.object({
        goalId: z.string().uuid(),
        includeArchived: z.boolean().optional().default(false),
      }),
    )
    .query(async ({ ctx, input }) => {
      const filters = [
        eq(project.userId, ctx.session.user.id),
        eq(project.goalId, input.goalId),
      ];

      if (!input.includeArchived) {
        filters.push(eq(project.archived, false));
      }

      const projects = await ctx.db.query.project.findMany({
        where: and(...filters),
        orderBy: [asc(project.sortOrder), asc(project.createdAt)],
        with: {
          tasks: {
            where: eq(task.archived, false),
          },
        },
      });

      // Calculate task counts for each project
      return projects.map((p) => {
        const completedTasks = p.tasks.filter(
          (t) => t.status === "completed",
        ).length;
        const totalTasks = p.tasks.length;

        return {
          ...p,
          completedTaskCount: completedTasks,
          totalTaskCount: totalTasks,
          progress:
            totalTasks > 0
              ? Math.round((completedTasks / totalTasks) * 100)
              : 0,
        };
      });
    }),

  // Get all projects for the current user (across all goals)
  getAll: protectedProcedure
    .input(
      z
        .object({
          includeArchived: z.boolean().optional().default(false),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const filters = [eq(project.userId, ctx.session.user.id)];

      if (!input?.includeArchived) {
        filters.push(eq(project.archived, false));
      }

      const projects = await ctx.db.query.project.findMany({
        where: and(...filters),
        orderBy: [asc(project.sortOrder), asc(project.createdAt)],
        with: {
          goal: true,
          tasks: {
            where: eq(task.archived, false),
          },
        },
      });

      return projects.map((p) => {
        const completedTasks = p.tasks.filter(
          (t) => t.status === "completed",
        ).length;
        const totalTasks = p.tasks.length;

        return {
          ...p,
          completedTaskCount: completedTasks,
          totalTaskCount: totalTasks,
          progress:
            totalTasks > 0
              ? Math.round((completedTasks / totalTasks) * 100)
              : 0,
        };
      });
    }),

  // Get a single project by ID with all tasks
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db.query.project.findFirst({
        where: and(
          eq(project.id, input.id),
          eq(project.userId, ctx.session.user.id),
        ),
        with: {
          goal: true,
          tasks: {
            where: eq(task.archived, false),
            orderBy: (tasks, { asc, desc }) => [
              asc(tasks.nextUpOrder),
              desc(tasks.priority),
              asc(tasks.dueDate),
              asc(tasks.createdAt),
            ],
            with: {
              subtasks: true,
            },
          },
        },
      });

      if (!result) return null;

      const completedTasks = result.tasks.filter(
        (t) => t.status === "completed",
      ).length;
      const totalTasks = result.tasks.length;

      // Identify the "Next Up" task (first incomplete task by order)
      const nextUpTask = result.tasks.find((t) => t.status !== "completed");

      return {
        ...result,
        completedTaskCount: completedTasks,
        totalTaskCount: totalTasks,
        progress:
          totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
        nextUpTaskId: nextUpTask?.id ?? null,
      };
    }),

  // Create a new project under a goal
  create: protectedProcedure
    .input(
      z.object({
        goalId: z.string().uuid(),
        title: z.string().min(1).max(200),
        description: z.string().max(2000).optional(),
        color: z.string().optional(),
        icon: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Get the highest sort order for projects in this goal
      const existingProjects = await ctx.db.query.project.findMany({
        where: and(
          eq(project.goalId, input.goalId),
          eq(project.userId, ctx.session.user.id),
        ),
        orderBy: [asc(project.sortOrder)],
      });

      const maxSortOrder =
        existingProjects.length > 0
          ? Math.max(...existingProjects.map((p) => p.sortOrder ?? 0))
          : 0;

      const [newProject] = await ctx.db
        .insert(project)
        .values({
          userId: ctx.session.user.id,
          goalId: input.goalId,
          title: input.title,
          description: input.description,
          color: input.color,
          icon: input.icon,
          sortOrder: maxSortOrder + 1,
        })
        .returning();

      return newProject;
    }),

  // Update a project
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        title: z.string().min(1).max(200).optional(),
        description: z.string().max(2000).nullable().optional(),
        color: z.string().optional(),
        icon: z.string().nullable().optional(),
        archived: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...rest } = input;

      const [updated] = await ctx.db
        .update(project)
        .set({
          ...rest,
          updatedAt: new Date(),
        })
        .where(and(eq(project.id, id), eq(project.userId, ctx.session.user.id)))
        .returning();

      return updated;
    }),

  // Delete a project (tasks will have projectId set to null)
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(project)
        .where(
          and(
            eq(project.id, input.id),
            eq(project.userId, ctx.session.user.id),
          ),
        );

      return { success: true };
    }),

  // Reorder projects within a goal
  reorder: protectedProcedure
    .input(
      z.object({
        goalId: z.string().uuid(),
        projectIds: z.array(z.string().uuid()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Update sort order for each project
      const updates = input.projectIds.map((id, index) =>
        ctx.db
          .update(project)
          .set({ sortOrder: index, updatedAt: new Date() })
          .where(
            and(eq(project.id, id), eq(project.userId, ctx.session.user.id)),
          ),
      );

      await Promise.all(updates);

      return { success: true };
    }),

  // Move a project to a different goal
  moveToGoal: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        goalId: z.string().uuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Get highest sort order in the target goal
      const existingProjects = await ctx.db.query.project.findMany({
        where: and(
          eq(project.goalId, input.goalId),
          eq(project.userId, ctx.session.user.id),
        ),
      });

      const maxSortOrder =
        existingProjects.length > 0
          ? Math.max(...existingProjects.map((p) => p.sortOrder ?? 0))
          : 0;

      const [updated] = await ctx.db
        .update(project)
        .set({
          goalId: input.goalId,
          sortOrder: maxSortOrder + 1,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(project.id, input.id),
            eq(project.userId, ctx.session.user.id),
          ),
        )
        .returning();

      return updated;
    }),
});
