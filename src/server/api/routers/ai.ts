import { z } from "zod";
import { eq, and, gte, lte } from "drizzle-orm";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { task, timeBlock, userPreferences } from "~/server/db/schema";
import {
  suggestTaskSchedule,
  parseTaskFromText,
  suggestTaskBreakdown,
  isAIEnabled,
} from "~/lib/ai/scheduler";

export const aiRouter = createTRPCRouter({
  // Check if AI features are available
  isEnabled: protectedProcedure.query(() => {
    return isAIEnabled();
  }),

  // Get AI-suggested schedule for a task
  suggestSchedule: protectedProcedure
    .input(
      z.object({
        taskId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get the task
      const taskData = await ctx.db.query.task.findFirst({
        where: and(
          eq(task.id, input.taskId),
          eq(task.userId, ctx.session.user.id)
        ),
      });

      if (!taskData) {
        throw new Error("Task not found");
      }

      // Get user preferences
      let prefs = await ctx.db.query.userPreferences.findFirst({
        where: eq(userPreferences.id, ctx.session.user.id),
      });

      if (!prefs) {
        // Create default preferences
        const [newPrefs] = await ctx.db
          .insert(userPreferences)
          .values({ id: ctx.session.user.id })
          .returning();
        prefs = newPrefs;
      }

      // Get existing time blocks for the next 2 weeks
      const now = new Date();
      const twoWeeksLater = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

      const existingBlocks = await ctx.db.query.timeBlock.findMany({
        where: and(
          eq(timeBlock.userId, ctx.session.user.id),
          gte(timeBlock.startTime, now),
          lte(timeBlock.endTime, twoWeeksLater)
        ),
      });

      // Also get scheduled tasks
      const scheduledTasks = await ctx.db.query.task.findMany({
        where: and(
          eq(task.userId, ctx.session.user.id),
          gte(task.scheduledStart, now),
          lte(task.scheduledEnd, twoWeeksLater)
        ),
      });

      // Combine all busy slots
      const busySlots = [
        ...existingBlocks.map((b) => ({
          startTime: b.startTime,
          endTime: b.endTime,
        })),
        ...scheduledTasks
          .filter((t) => t.scheduledStart && t.scheduledEnd)
          .map((t) => ({
            startTime: t.scheduledStart!,
            endTime: t.scheduledEnd!,
          })),
      ];

      const suggestion = await suggestTaskSchedule(
        {
          id: taskData.id,
          title: taskData.title,
          priority: taskData.priority,
          estimatedMinutes: taskData.estimatedMinutes,
          dueDate: taskData.dueDate,
        },
        {
          workingHoursStart: prefs?.workingHoursStart ?? "09:00",
          workingHoursEnd: prefs?.workingHoursEnd ?? "17:00",
          workingDays: (prefs?.workingDays as number[]) ?? [1, 2, 3, 4, 5],
          bufferMinutes: prefs?.bufferTimeBetweenTasks ?? 15,
          maxChunkMinutes: prefs?.maxTaskChunkSize ?? 120,
          existingBlocks: busySlots,
          currentDate: now,
        }
      );

      return suggestion;
    }),

  // Parse natural language into a task
  parseTask: protectedProcedure
    .input(
      z.object({
        text: z.string().min(1).max(1000),
      })
    )
    .mutation(async ({ input }) => {
      const result = await parseTaskFromText(input.text, new Date());
      return result;
    }),

  // Create a task from natural language
  createTaskFromText: protectedProcedure
    .input(
      z.object({
        text: z.string().min(1).max(1000),
        boardId: z.string().uuid().optional(),
        goalId: z.string().uuid().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const parsed = await parseTaskFromText(input.text, new Date());

      if (!parsed) {
        // Fallback to creating a basic task with the text as title
        const [newTask] = await ctx.db
          .insert(task)
          .values({
            userId: ctx.session.user.id,
            title: input.text.slice(0, 500),
            boardId: input.boardId,
            goalId: input.goalId,
          })
          .returning();

        return { task: newTask, aiParsed: false };
      }

      const [newTask] = await ctx.db
        .insert(task)
        .values({
          userId: ctx.session.user.id,
          title: parsed.title,
          priority: parsed.priority,
          estimatedMinutes: parsed.estimatedMinutes,
          dueDate: parsed.dueDate ? new Date(parsed.dueDate) : undefined,
          boardId: input.boardId,
          goalId: input.goalId,
        })
        .returning();

      return { task: newTask, aiParsed: true };
    }),

  // Get suggestions for breaking down a task
  suggestBreakdown: protectedProcedure
    .input(
      z.object({
        taskId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const taskData = await ctx.db.query.task.findFirst({
        where: and(
          eq(task.id, input.taskId),
          eq(task.userId, ctx.session.user.id)
        ),
      });

      if (!taskData) {
        throw new Error("Task not found");
      }

      const suggestions = await suggestTaskBreakdown(
        taskData.title,
        taskData.description
      );

      return suggestions;
    }),

  // Create subtasks from AI suggestions
  createSubtasksFromSuggestions: protectedProcedure
    .input(
      z.object({
        parentTaskId: z.string().uuid(),
        subtaskTitles: z.array(z.string().min(1).max(500)),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify parent task exists and belongs to user
      const parentTask = await ctx.db.query.task.findFirst({
        where: and(
          eq(task.id, input.parentTaskId),
          eq(task.userId, ctx.session.user.id)
        ),
      });

      if (!parentTask) {
        throw new Error("Parent task not found");
      }

      // Create all subtasks
      const subtasks = await ctx.db
        .insert(task)
        .values(
          input.subtaskTitles.map((title, index) => ({
            userId: ctx.session.user.id,
            title,
            parentTaskId: input.parentTaskId,
            boardId: parentTask.boardId,
            goalId: parentTask.goalId,
            sortOrder: index,
          }))
        )
        .returning();

      return subtasks;
    }),
});
