import { z } from "zod";
import { eq, and, desc, asc, gte, lte, or } from "drizzle-orm";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { task } from "~/server/db/schema";

const taskPrioritySchema = z.enum(["low", "medium", "high", "urgent"]);
const taskStatusSchema = z.enum(["todo", "in_progress", "completed", "cancelled"]);

export const taskRouter = createTRPCRouter({
  // Get all tasks for the current user
  getAll: protectedProcedure
    .input(
      z.object({
        boardId: z.string().uuid().optional(),
        goalId: z.string().uuid().optional(),
        status: taskStatusSchema.optional(),
        includeCompleted: z.boolean().optional().default(false),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const filters = [eq(task.userId, ctx.session.user.id)];

      if (input?.boardId) {
        filters.push(eq(task.boardId, input.boardId));
      }

      if (input?.goalId) {
        filters.push(eq(task.goalId, input.goalId));
      }

      if (input?.status) {
        filters.push(eq(task.status, input.status));
      }

      if (!input?.includeCompleted) {
        filters.push(
          or(
            eq(task.status, "todo"),
            eq(task.status, "in_progress")
          )!
        );
      }

      const tasks = await ctx.db.query.task.findMany({
        where: and(...filters),
        orderBy: [asc(task.sortOrder), desc(task.createdAt)],
        with: {
          board: true,
          goal: true,
        },
      });

      return tasks;
    }),

  // Get a single task by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db.query.task.findFirst({
        where: and(eq(task.id, input.id), eq(task.userId, ctx.session.user.id)),
        with: {
          board: true,
          goal: true,
          subtasks: true,
          timeBlocks: true,
        },
      });
      return result ?? null;
    }),

  // Get tasks for a date range (for calendar view)
  getByDateRange: protectedProcedure
    .input(
      z.object({
        startDate: z.string().datetime(),
        endDate: z.string().datetime(),
      })
    )
    .query(async ({ ctx, input }) => {
      const startDate = new Date(input.startDate);
      const endDate = new Date(input.endDate);

      const tasks = await ctx.db.query.task.findMany({
        where: and(
          eq(task.userId, ctx.session.user.id),
          or(
            // Tasks with scheduled time in range
            and(
              gte(task.scheduledStart, startDate),
              lte(task.scheduledStart, endDate)
            ),
            // Tasks with due date in range
            and(gte(task.dueDate, startDate), lte(task.dueDate, endDate))
          )
        ),
        orderBy: [asc(task.scheduledStart), asc(task.dueDate)],
        with: {
          board: true,
          goal: true,
        },
      });

      return tasks;
    }),

  // Create a new task
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(500),
        description: z.string().max(5000).optional(),
        boardId: z.string().uuid().optional(),
        goalId: z.string().uuid().optional(),
        priority: taskPrioritySchema.optional().default("medium"),
        status: taskStatusSchema.optional().default("todo"),
        dueDate: z.string().datetime().optional(),
        scheduledStart: z.string().datetime().optional(),
        scheduledEnd: z.string().datetime().optional(),
        estimatedMinutes: z.number().int().positive().optional(),
        tags: z.array(z.string()).optional(),
        parentTaskId: z.string().uuid().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [newTask] = await ctx.db
        .insert(task)
        .values({
          userId: ctx.session.user.id,
          title: input.title,
          description: input.description,
          boardId: input.boardId,
          goalId: input.goalId,
          priority: input.priority,
          status: input.status,
          dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
          scheduledStart: input.scheduledStart
            ? new Date(input.scheduledStart)
            : undefined,
          scheduledEnd: input.scheduledEnd
            ? new Date(input.scheduledEnd)
            : undefined,
          estimatedMinutes: input.estimatedMinutes,
          tags: input.tags,
          parentTaskId: input.parentTaskId,
        })
        .returning();

      return newTask;
    }),

  // Update a task
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        title: z.string().min(1).max(500).optional(),
        description: z.string().max(5000).optional(),
        boardId: z.string().uuid().nullable().optional(),
        goalId: z.string().uuid().nullable().optional(),
        priority: taskPrioritySchema.optional(),
        status: taskStatusSchema.optional(),
        dueDate: z.string().datetime().nullable().optional(),
        scheduledStart: z.string().datetime().nullable().optional(),
        scheduledEnd: z.string().datetime().nullable().optional(),
        estimatedMinutes: z.number().int().positive().nullable().optional(),
        actualMinutes: z.number().int().positive().nullable().optional(),
        tags: z.array(z.string()).optional(),
        sortOrder: z.number().int().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, dueDate, scheduledStart, scheduledEnd, ...rest } = input;

      const updateData: Record<string, unknown> = {
        ...rest,
        updatedAt: new Date(),
      };

      // Handle date fields
      if (dueDate !== undefined) {
        updateData.dueDate = dueDate ? new Date(dueDate) : null;
      }
      if (scheduledStart !== undefined) {
        updateData.scheduledStart = scheduledStart
          ? new Date(scheduledStart)
          : null;
      }
      if (scheduledEnd !== undefined) {
        updateData.scheduledEnd = scheduledEnd ? new Date(scheduledEnd) : null;
      }

      // If marking as completed, set completedAt
      if (input.status === "completed") {
        updateData.completedAt = new Date();
      } else if (input.status) {
        updateData.completedAt = null;
      }

      const [updated] = await ctx.db
        .update(task)
        .set(updateData)
        .where(and(eq(task.id, id), eq(task.userId, ctx.session.user.id)))
        .returning();

      return updated;
    }),

  // Delete a task
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(task)
        .where(
          and(eq(task.id, input.id), eq(task.userId, ctx.session.user.id))
        );

      return { success: true };
    }),

  // Move task to a different board
  moveToBoard: protectedProcedure
    .input(
      z.object({
        taskId: z.string().uuid(),
        boardId: z.string().uuid().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(task)
        .set({
          boardId: input.boardId,
          updatedAt: new Date(),
        })
        .where(
          and(eq(task.id, input.taskId), eq(task.userId, ctx.session.user.id))
        )
        .returning();

      return updated;
    }),

  // Bulk update task order (for drag-and-drop)
  updateOrder: protectedProcedure
    .input(
      z.object({
        tasks: z.array(
          z.object({
            id: z.string().uuid(),
            sortOrder: z.number().int(),
            status: taskStatusSchema.optional(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Update each task's sort order
      await Promise.all(
        input.tasks.map((t) =>
          ctx.db
            .update(task)
            .set({
              sortOrder: t.sortOrder,
              status: t.status,
              updatedAt: new Date(),
            })
            .where(
              and(eq(task.id, t.id), eq(task.userId, ctx.session.user.id))
            )
        )
      );

      return { success: true };
    }),
});
