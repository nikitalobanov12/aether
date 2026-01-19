import { z } from "zod";
import { eq, and, gte, lte } from "drizzle-orm";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { timeBlock, task } from "~/server/db/schema";

export const timeBlockRouter = createTRPCRouter({
  // Get time blocks for a date range
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

      const blocks = await ctx.db.query.timeBlock.findMany({
        where: and(
          eq(timeBlock.userId, ctx.session.user.id),
          gte(timeBlock.startTime, startDate),
          lte(timeBlock.endTime, endDate)
        ),
        orderBy: (tb, { asc }) => [asc(tb.startTime)],
        with: {
          task: true,
        },
      });

      return blocks;
    }),

  // Create a time block
  create: protectedProcedure
    .input(
      z.object({
        taskId: z.string().uuid().optional(),
        title: z.string().min(1).max(200),
        startTime: z.string().datetime(),
        endTime: z.string().datetime(),
        color: z.string().optional(),
        notes: z.string().max(1000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [newBlock] = await ctx.db
        .insert(timeBlock)
        .values({
          userId: ctx.session.user.id,
          taskId: input.taskId,
          title: input.title,
          startTime: new Date(input.startTime),
          endTime: new Date(input.endTime),
          color: input.color,
          notes: input.notes,
        })
        .returning();

      // If linked to a task, update the task's scheduled time
      if (input.taskId) {
        await ctx.db
          .update(task)
          .set({
            scheduledStart: new Date(input.startTime),
            scheduledEnd: new Date(input.endTime),
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(task.id, input.taskId),
              eq(task.userId, ctx.session.user.id)
            )
          );
      }

      return newBlock;
    }),

  // Update a time block
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        title: z.string().min(1).max(200).optional(),
        startTime: z.string().datetime().optional(),
        endTime: z.string().datetime().optional(),
        color: z.string().optional(),
        notes: z.string().max(1000).optional(),
        isCompleted: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, startTime, endTime, ...rest } = input;

      const updateData: Record<string, unknown> = {
        ...rest,
        updatedAt: new Date(),
      };

      if (startTime) {
        updateData.startTime = new Date(startTime);
      }
      if (endTime) {
        updateData.endTime = new Date(endTime);
      }

      const [updated] = await ctx.db
        .update(timeBlock)
        .set(updateData)
        .where(
          and(
            eq(timeBlock.id, id),
            eq(timeBlock.userId, ctx.session.user.id)
          )
        )
        .returning();

      // If time changed and linked to a task, update the task too
      if ((startTime || endTime) && updated?.taskId) {
        const taskUpdateData: Record<string, unknown> = {
          updatedAt: new Date(),
        };
        if (startTime) {
          taskUpdateData.scheduledStart = new Date(startTime);
        }
        if (endTime) {
          taskUpdateData.scheduledEnd = new Date(endTime);
        }

        await ctx.db
          .update(task)
          .set(taskUpdateData)
          .where(
            and(
              eq(task.id, updated.taskId),
              eq(task.userId, ctx.session.user.id)
            )
          );
      }

      return updated;
    }),

  // Delete a time block
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Get the block first to check for linked task
      const block = await ctx.db.query.timeBlock.findFirst({
        where: and(
          eq(timeBlock.id, input.id),
          eq(timeBlock.userId, ctx.session.user.id)
        ),
      });

      await ctx.db
        .delete(timeBlock)
        .where(
          and(
            eq(timeBlock.id, input.id),
            eq(timeBlock.userId, ctx.session.user.id)
          )
        );

      // Clear scheduled time from linked task if exists
      if (block?.taskId) {
        await ctx.db
          .update(task)
          .set({
            scheduledStart: null,
            scheduledEnd: null,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(task.id, block.taskId),
              eq(task.userId, ctx.session.user.id)
            )
          );
      }

      return { success: true };
    }),
});
