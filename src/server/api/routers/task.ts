import { z } from "zod";
import { eq, and, desc, asc, gte, lte, or, isNull, inArray } from "drizzle-orm";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { task, completedTask, habitStreak } from "~/server/db/schema";

const taskPrioritySchema = z.enum(["low", "medium", "high", "urgent"]);
const taskStatusSchema = z.enum([
  "todo",
  "in_progress",
  "completed",
  "cancelled",
]);

// Priority weights for Next Up calculation
const priorityWeight: Record<string, number> = {
  urgent: 4,
  high: 3,
  medium: 2,
  low: 1,
};

export const taskRouter = createTRPCRouter({
  // Get all tasks for the current user
  getAll: protectedProcedure
    .input(
      z
        .object({
          boardId: z.string().uuid().optional(),
          projectId: z.string().uuid().optional(),
          goalId: z.string().uuid().optional(),
          status: taskStatusSchema.optional(),
          includeCompleted: z.boolean().optional().default(false),
          includeArchived: z.boolean().optional().default(false),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const filters = [eq(task.userId, ctx.session.user.id)];

      if (input?.boardId) {
        filters.push(eq(task.boardId, input.boardId));
      }

      if (input?.projectId) {
        filters.push(eq(task.projectId, input.projectId));
      }

      if (input?.goalId) {
        filters.push(eq(task.goalId, input.goalId));
      }

      if (input?.status) {
        filters.push(eq(task.status, input.status));
      }

      if (!input?.includeCompleted) {
        filters.push(inArray(task.status, ["todo", "in_progress"]));
      }

      if (!input?.includeArchived) {
        filters.push(eq(task.archived, false));
      }

      const tasks = await ctx.db.query.task.findMany({
        where: and(...filters),
        orderBy: [asc(task.sortOrder), desc(task.createdAt)],
        with: {
          board: true,
          project: true,
          goal: true,
        },
      });

      return tasks;
    }),

  // Get tasks for today (Daily Planner primary view)
  getToday: protectedProcedure
    .input(
      z
        .object({
          // Accept explicit date string (YYYY-MM-DD) to avoid timezone issues
          // Client sends their local date, server uses it directly
          dateString: z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/)
            .optional(),
          includeOverdue: z.boolean().optional().default(true),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      // If client provides a date string (YYYY-MM-DD), use it to define day boundaries
      // This avoids timezone issues where client's "today" differs from server's "today"
      let dayStart: Date;
      let dayEnd: Date;

      if (input?.dateString) {
        // Parse as UTC midnight, then create a 24-hour window
        // The date string represents the user's local calendar day
        dayStart = new Date(input.dateString + "T00:00:00.000Z");
        dayEnd = new Date(input.dateString + "T23:59:59.999Z");
      } else {
        // Fallback: use server time (less accurate for different timezones)
        dayStart = new Date();
        dayStart.setHours(0, 0, 0, 0);
        dayEnd = new Date(dayStart);
        dayEnd.setDate(dayEnd.getDate() + 1);
        dayEnd.setMilliseconds(dayEnd.getMilliseconds() - 1);
      }

      const filters = [
        eq(task.userId, ctx.session.user.id),
        eq(task.archived, false),
        inArray(task.status, ["todo", "in_progress"]),
      ];

      // Get tasks due on this day or scheduled on this day
      const todayFilter = or(
        // Due on this day (using inclusive range)
        and(gte(task.dueDate, dayStart), lte(task.dueDate, dayEnd)),
        // Scheduled on this day
        and(
          gte(task.scheduledStart, dayStart),
          lte(task.scheduledStart, dayEnd),
        ),
      );

      // Optionally include overdue tasks (due before today)
      const dateFilter = input?.includeOverdue
        ? or(todayFilter, lte(task.dueDate, dayStart))
        : todayFilter;

      filters.push(dateFilter!);

      const tasks = await ctx.db.query.task.findMany({
        where: and(...filters),
        orderBy: [
          asc(task.scheduledStart),
          desc(task.priority),
          asc(task.dueDate),
        ],
        with: {
          project: {
            with: {
              goal: true,
            },
          },
          goal: true,
          subtasks: true,
        },
      });

      // Mark the "Next Up" task per project
      const nextUpByProject = new Map<string, string>();
      tasks.forEach((t) => {
        const projectId = t.projectId ?? "no-project";
        if (
          !nextUpByProject.has(projectId) &&
          t.status !== "completed" &&
          t.status !== "cancelled"
        ) {
          nextUpByProject.set(projectId, t.id);
        }
      });

      return tasks.map((t) => ({
        ...t,
        isNextUp: nextUpByProject.get(t.projectId ?? "no-project") === t.id,
      }));
    }),

  // Get backlog tasks (no due date, not scheduled)
  getBacklog: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().int().min(1).max(100).optional().default(50),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const tasks = await ctx.db.query.task.findMany({
        where: and(
          eq(task.userId, ctx.session.user.id),
          eq(task.archived, false),
          inArray(task.status, ["todo", "in_progress"]),
          isNull(task.dueDate),
          isNull(task.scheduledStart),
        ),
        orderBy: [desc(task.priority), asc(task.createdAt)],
        limit: input?.limit ?? 50,
        with: {
          project: {
            with: {
              goal: true,
            },
          },
          goal: true,
          subtasks: true,
        },
      });

      return tasks;
    }),

  // Get tasks for a week (grouped by day)
  getThisWeek: protectedProcedure
    .input(
      z.object({
        // Week start date in YYYY-MM-DD format (typically Monday or Sunday)
        weekStartDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        includeOverdue: z.boolean().optional().default(true),
      }),
    )
    .query(async ({ ctx, input }) => {
      const weekStart = new Date(input.weekStartDate + "T00:00:00.000Z");
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      weekEnd.setMilliseconds(weekEnd.getMilliseconds() - 1);

      const filters = [
        eq(task.userId, ctx.session.user.id),
        eq(task.archived, false),
        inArray(task.status, ["todo", "in_progress"]),
      ];

      // Get tasks due this week or scheduled this week
      const weekFilter = or(
        and(gte(task.dueDate, weekStart), lte(task.dueDate, weekEnd)),
        and(
          gte(task.scheduledStart, weekStart),
          lte(task.scheduledStart, weekEnd),
        ),
      );

      filters.push(weekFilter!);

      const tasks = await ctx.db.query.task.findMany({
        where: and(...filters),
        orderBy: [
          asc(task.dueDate),
          asc(task.scheduledStart),
          desc(task.priority),
        ],
        with: {
          project: {
            with: {
              goal: true,
            },
          },
          goal: true,
          subtasks: true,
        },
      });

      // Get overdue tasks if requested
      let overdueTasks: typeof tasks = [];
      if (input.includeOverdue) {
        overdueTasks = await ctx.db.query.task.findMany({
          where: and(
            eq(task.userId, ctx.session.user.id),
            eq(task.archived, false),
            inArray(task.status, ["todo", "in_progress"]),
            lte(task.dueDate, weekStart),
          ),
          orderBy: [asc(task.dueDate), desc(task.priority)],
          with: {
            project: {
              with: {
                goal: true,
              },
            },
            goal: true,
            subtasks: true,
          },
        });
      }

      // Group tasks by day of week
      const dayNames = [
        "sunday",
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
      ] as const;
      const tasksByDay: Record<string, typeof tasks> = {
        sunday: [],
        monday: [],
        tuesday: [],
        wednesday: [],
        thursday: [],
        friday: [],
        saturday: [],
      };

      tasks.forEach((t) => {
        // Use dueDate or scheduledStart to determine the day
        const taskDate = t.dueDate ?? t.scheduledStart;
        if (taskDate) {
          const dayIndex = taskDate.getUTCDay();
          const dayName = dayNames[dayIndex];
          if (dayName && tasksByDay[dayName]) {
            tasksByDay[dayName].push(t);
          }
        }
      });

      return {
        tasksByDay,
        overdue: overdueTasks,
        weekStart: weekStart.toISOString(),
        weekEnd: weekEnd.toISOString(),
      };
    }),

  // Get the "Next Up" task for each project
  getNextUp: protectedProcedure
    .input(
      z
        .object({
          projectId: z.string().uuid().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const filters = [
        eq(task.userId, ctx.session.user.id),
        eq(task.archived, false),
        inArray(task.status, ["todo", "in_progress"]),
      ];

      if (input?.projectId) {
        filters.push(eq(task.projectId, input.projectId));
      }

      const tasks = await ctx.db.query.task.findMany({
        where: and(...filters),
        orderBy: [
          asc(task.nextUpOrder),
          desc(task.priority),
          asc(task.dueDate),
          asc(task.createdAt),
        ],
        with: {
          project: {
            with: {
              goal: true,
            },
          },
          goal: true,
          subtasks: true,
        },
      });

      // Group by project and get the first (Next Up) task for each
      const nextUpByProject = new Map<string, (typeof tasks)[0]>();

      tasks.forEach((t) => {
        const projectId = t.projectId ?? "no-project";
        if (!nextUpByProject.has(projectId)) {
          nextUpByProject.set(projectId, t);
        }
      });

      return Array.from(nextUpByProject.values());
    }),

  // Get a single task by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db.query.task.findFirst({
        where: and(eq(task.id, input.id), eq(task.userId, ctx.session.user.id)),
        with: {
          board: true,
          project: true,
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
        includeUnscheduled: z.boolean().optional().default(false),
      }),
    )
    .query(async ({ ctx, input }) => {
      const startDate = new Date(input.startDate);
      const endDate = new Date(input.endDate);

      const baseFilters = [
        eq(task.userId, ctx.session.user.id),
        eq(task.archived, false),
      ];

      const dateFilter = or(
        // Tasks with scheduled time in range
        and(
          gte(task.scheduledStart, startDate),
          lte(task.scheduledStart, endDate),
        ),
        // Tasks with due date in range
        and(gte(task.dueDate, startDate), lte(task.dueDate, endDate)),
      );

      const tasks = await ctx.db.query.task.findMany({
        where: and(...baseFilters, dateFilter),
        orderBy: [asc(task.scheduledStart), asc(task.dueDate)],
        with: {
          board: true,
          project: true,
          goal: true,
        },
      });

      // Optionally get unscheduled tasks
      let unscheduledTasks: typeof tasks = [];
      if (input.includeUnscheduled) {
        unscheduledTasks = await ctx.db.query.task.findMany({
          where: and(
            ...baseFilters,
            isNull(task.scheduledStart),
            inArray(task.status, ["todo", "in_progress"]),
          ),
          orderBy: [
            desc(task.priority),
            asc(task.dueDate),
            asc(task.createdAt),
          ],
          with: {
            board: true,
            project: true,
            goal: true,
          },
        });
      }

      return {
        scheduled: tasks,
        unscheduled: unscheduledTasks,
      };
    }),

  // Create a new task
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(500),
        description: z.string().max(5000).optional(),
        boardId: z.string().uuid().optional(),
        projectId: z.string().uuid().optional(),
        goalId: z.string().uuid().optional(),
        priority: taskPrioritySchema.optional().default("medium"),
        status: taskStatusSchema.optional().default("todo"),
        // Prefer dueDateString (YYYY-MM-DD) over dueDate to avoid timezone issues
        // When dueDateString is provided, we set dueDate to end of that day (UTC)
        dueDateString: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .optional(),
        dueDate: z.string().datetime().optional(),
        scheduledStart: z.string().datetime().optional(),
        scheduledEnd: z.string().datetime().optional(),
        estimatedMinutes: z.number().int().positive().optional(),
        tags: z.array(z.string()).optional(),
        parentTaskId: z.string().uuid().optional(),
        habitName: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Calculate next_up_order based on priority
      const nextUpOrder = input.projectId
        ? (priorityWeight[input.priority ?? "medium"] ?? 2) * -1000 +
          (Date.now() % 1000)
        : null;

      // Determine due date: prefer dueDateString (timezone-safe) over dueDate
      let dueDate: Date | undefined;
      if (input.dueDateString) {
        // Set to end of the specified day (UTC) - consistent with addToDay
        dueDate = new Date(input.dueDateString + "T23:59:59.999Z");
      } else if (input.dueDate) {
        dueDate = new Date(input.dueDate);
      }

      const [newTask] = await ctx.db
        .insert(task)
        .values({
          userId: ctx.session.user.id,
          title: input.title,
          description: input.description,
          boardId: input.boardId,
          projectId: input.projectId,
          goalId: input.goalId,
          priority: input.priority,
          status: input.status,
          dueDate,
          scheduledStart: input.scheduledStart
            ? new Date(input.scheduledStart)
            : undefined,
          scheduledEnd: input.scheduledEnd
            ? new Date(input.scheduledEnd)
            : undefined,
          estimatedMinutes: input.estimatedMinutes,
          tags: input.tags,
          parentTaskId: input.parentTaskId,
          habitName: input.habitName,
          nextUpOrder,
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
        projectId: z.string().uuid().nullable().optional(),
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
        nextUpOrder: z.number().int().nullable().optional(),
        archived: z.boolean().optional(),
      }),
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

  // Complete a task (with history tracking)
  complete: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        timeSpentMinutes: z.number().int().positive().optional(),
        notes: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Get the task first
      const existingTask = await ctx.db.query.task.findFirst({
        where: and(eq(task.id, input.id), eq(task.userId, ctx.session.user.id)),
      });

      if (!existingTask) {
        throw new Error("Task not found");
      }

      const completedAt = new Date();

      // Update the task status
      const [updatedTask] = await ctx.db
        .update(task)
        .set({
          status: "completed",
          completedAt,
          actualMinutes: input.timeSpentMinutes ?? existingTask.actualMinutes,
          updatedAt: completedAt,
        })
        .where(and(eq(task.id, input.id), eq(task.userId, ctx.session.user.id)))
        .returning();

      // Create a completion record for history
      await ctx.db.insert(completedTask).values({
        taskId: existingTask.id,
        userId: ctx.session.user.id,
        projectId: existingTask.projectId,
        goalId: existingTask.goalId,
        taskTitle: existingTask.title,
        taskPriority: existingTask.priority,
        completedAt,
        timeSpentMinutes: input.timeSpentMinutes,
        notes: input.notes,
      });

      // If this is a habit task, update the habit streak
      if (existingTask.habitName) {
        const today = new Date();
        const dateStr = today.toISOString().split("T")[0]!;

        let streak = await ctx.db.query.habitStreak.findFirst({
          where: and(
            eq(habitStreak.userId, ctx.session.user.id),
            eq(habitStreak.habitName, existingTask.habitName),
          ),
        });

        if (!streak) {
          // Create the habit streak if it doesn't exist
          const [newStreak] = await ctx.db
            .insert(habitStreak)
            .values({
              userId: ctx.session.user.id,
              habitName: existingTask.habitName,
              currentStreakDays: 1,
              bestStreakDays: 1,
              lastCompletedDate: today,
              streakHistory: [{ date: dateStr, completed: true }],
            })
            .returning();
          streak = newStreak;
        } else {
          // Update existing streak
          const history = (streak.streakHistory ?? []) as Array<{
            date: string;
            completed: boolean;
          }>;

          if (!history.some((h) => h.date === dateStr)) {
            history.push({ date: dateStr, completed: true });
            history.sort(
              (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
            );

            // Recalculate streak
            let currentStreak = 0;
            for (let i = 0; i < 365; i++) {
              const checkDate = new Date(today);
              checkDate.setDate(checkDate.getDate() - i);
              const checkDateStr = checkDate.toISOString().split("T")[0];
              const entry = history.find((h) => h.date === checkDateStr);

              if (entry?.completed) {
                currentStreak++;
              } else if (i === 0) {
                continue;
              } else {
                break;
              }
            }

            await ctx.db
              .update(habitStreak)
              .set({
                currentStreakDays: currentStreak,
                bestStreakDays: Math.max(streak.bestStreakDays, currentStreak),
                lastCompletedDate: today,
                streakHistory: history,
                updatedAt: today,
              })
              .where(eq(habitStreak.id, streak.id));
          }
        }
      }

      return updatedTask;
    }),

  // Uncomplete a task (undo completion)
  uncomplete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Update the task status back to todo
      const [updatedTask] = await ctx.db
        .update(task)
        .set({
          status: "todo",
          completedAt: null,
          updatedAt: new Date(),
        })
        .where(and(eq(task.id, input.id), eq(task.userId, ctx.session.user.id)))
        .returning();

      // Delete the most recent completion record for this task
      // (We don't need to undo habit streaks as that would be complex)
      const recentCompletion = await ctx.db.query.completedTask.findFirst({
        where: and(
          eq(completedTask.taskId, input.id),
          eq(completedTask.userId, ctx.session.user.id),
        ),
        orderBy: [desc(completedTask.completedAt)],
      });

      if (recentCompletion) {
        await ctx.db
          .delete(completedTask)
          .where(eq(completedTask.id, recentCompletion.id));
      }

      return updatedTask;
    }),

  // Schedule a task to a time slot
  schedule: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        scheduledStart: z.string().datetime(),
        scheduledEnd: z.string().datetime().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const start = new Date(input.scheduledStart);
      let end: Date;

      if (input.scheduledEnd) {
        end = new Date(input.scheduledEnd);
      } else {
        // Get the task to check for estimated minutes
        const existingTask = await ctx.db.query.task.findFirst({
          where: and(
            eq(task.id, input.id),
            eq(task.userId, ctx.session.user.id),
          ),
        });

        // Default to estimated minutes or 30 minutes
        const durationMinutes = existingTask?.estimatedMinutes ?? 30;
        end = new Date(start.getTime() + durationMinutes * 60 * 1000);
      }

      const [updated] = await ctx.db
        .update(task)
        .set({
          scheduledStart: start,
          scheduledEnd: end,
          updatedAt: new Date(),
        })
        .where(and(eq(task.id, input.id), eq(task.userId, ctx.session.user.id)))
        .returning();

      return updated;
    }),

  // Unschedule a task
  unschedule: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(task)
        .set({
          scheduledStart: null,
          scheduledEnd: null,
          updatedAt: new Date(),
        })
        .where(and(eq(task.id, input.id), eq(task.userId, ctx.session.user.id)))
        .returning();

      return updated;
    }),

  // Add task to a specific day (for moving from backlog to today/week)
  addToDay: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        // Date in YYYY-MM-DD format
        dateString: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Set due date to end of the specified day (UTC)
      const dueDate = new Date(input.dateString + "T23:59:59.999Z");

      const [updated] = await ctx.db
        .update(task)
        .set({
          dueDate,
          updatedAt: new Date(),
        })
        .where(and(eq(task.id, input.id), eq(task.userId, ctx.session.user.id)))
        .returning();

      return updated;
    }),

  // Snooze a task to tomorrow
  snooze: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        days: z.number().int().min(1).max(365).optional().default(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + input.days);
      tomorrow.setHours(9, 0, 0, 0); // Default to 9 AM

      const [updated] = await ctx.db
        .update(task)
        .set({
          dueDate: tomorrow,
          scheduledStart: null,
          scheduledEnd: null,
          updatedAt: new Date(),
        })
        .where(and(eq(task.id, input.id), eq(task.userId, ctx.session.user.id)))
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
          and(eq(task.id, input.id), eq(task.userId, ctx.session.user.id)),
        );

      return { success: true };
    }),

  // Move task to a different project
  moveToProject: protectedProcedure
    .input(
      z.object({
        taskId: z.string().uuid(),
        projectId: z.string().uuid().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(task)
        .set({
          projectId: input.projectId,
          updatedAt: new Date(),
        })
        .where(
          and(eq(task.id, input.taskId), eq(task.userId, ctx.session.user.id)),
        )
        .returning();

      return updated;
    }),

  // Move task to a different board (legacy)
  moveToBoard: protectedProcedure
    .input(
      z.object({
        taskId: z.string().uuid(),
        boardId: z.string().uuid().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(task)
        .set({
          boardId: input.boardId,
          updatedAt: new Date(),
        })
        .where(
          and(eq(task.id, input.taskId), eq(task.userId, ctx.session.user.id)),
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
            nextUpOrder: z.number().int().optional(),
          }),
        ),
      }),
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
              nextUpOrder: t.nextUpOrder,
              updatedAt: new Date(),
            })
            .where(
              and(eq(task.id, t.id), eq(task.userId, ctx.session.user.id)),
            ),
        ),
      );

      return { success: true };
    }),
});
