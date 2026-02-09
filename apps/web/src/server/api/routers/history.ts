import { z } from "zod";
import { eq, and, gte, lte, desc } from "drizzle-orm";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { completedTask } from "~/server/db/schema";

export const historyRouter = createTRPCRouter({
  // Get completed tasks for today
  getToday: protectedProcedure.query(async ({ ctx }) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const completed = await ctx.db.query.completedTask.findMany({
      where: and(
        eq(completedTask.userId, ctx.session.user.id),
        gte(completedTask.completedAt, today),
        lte(completedTask.completedAt, tomorrow),
      ),
      orderBy: [desc(completedTask.completedAt)],
      with: {
        project: true,
        goal: true,
      },
    });

    return {
      tasks: completed,
      count: completed.length,
      totalTimeMinutes: completed.reduce(
        (sum, t) => sum + (t.timeSpentMinutes ?? 0),
        0,
      ),
    };
  }),

  // Get completed tasks for a date range (weekly review)
  getByDateRange: protectedProcedure
    .input(
      z.object({
        startDate: z.string().datetime(),
        endDate: z.string().datetime(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const start = new Date(input.startDate);
      const end = new Date(input.endDate);

      const completed = await ctx.db.query.completedTask.findMany({
        where: and(
          eq(completedTask.userId, ctx.session.user.id),
          gte(completedTask.completedAt, start),
          lte(completedTask.completedAt, end),
        ),
        orderBy: [desc(completedTask.completedAt)],
        with: {
          project: true,
          goal: true,
        },
      });

      // Group by day
      const byDay = completed.reduce(
        (acc, task) => {
          const day = task.completedAt.toISOString().split("T")[0]!;
          acc[day] ??= [];
          acc[day].push(task);
          return acc;
        },
        {} as Record<string, typeof completed>,
      );

      // Group by project
      const byProject = completed.reduce(
        (acc, task) => {
          const projectId = task.projectId ?? "no-project";
          acc[projectId] ??= {
            project: task.project,
            tasks: [],
            totalTimeMinutes: 0,
          };
          acc[projectId].tasks.push(task);
          acc[projectId].totalTimeMinutes += task.timeSpentMinutes ?? 0;
          return acc;
        },
        {} as Record<
          string,
          {
            project: (typeof completed)[0]["project"];
            tasks: typeof completed;
            totalTimeMinutes: number;
          }
        >,
      );

      // Group by goal
      const byGoal = completed.reduce(
        (acc, task) => {
          const goalId = task.goalId ?? "no-goal";
          acc[goalId] ??= {
            goal: task.goal,
            tasks: [],
            totalTimeMinutes: 0,
          };
          acc[goalId].tasks.push(task);
          acc[goalId].totalTimeMinutes += task.timeSpentMinutes ?? 0;
          return acc;
        },
        {} as Record<
          string,
          {
            goal: (typeof completed)[0]["goal"];
            tasks: typeof completed;
            totalTimeMinutes: number;
          }
        >,
      );

      return {
        tasks: completed,
        count: completed.length,
        totalTimeMinutes: completed.reduce(
          (sum, t) => sum + (t.timeSpentMinutes ?? 0),
          0,
        ),
        byDay,
        byProject: Object.values(byProject),
        byGoal: Object.values(byGoal),
      };
    }),

  // Get weekly summary (for the weekly review view)
  getWeeklySummary: protectedProcedure
    .input(
      z
        .object({
          weekStartDate: z.string().datetime().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      // Default to current week (Sunday to Saturday)
      const now = new Date();
      let weekStart: Date;

      if (input?.weekStartDate) {
        weekStart = new Date(input.weekStartDate);
      } else {
        weekStart = new Date(now);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Go to Sunday
      }
      weekStart.setHours(0, 0, 0, 0);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);

      const completed = await ctx.db.query.completedTask.findMany({
        where: and(
          eq(completedTask.userId, ctx.session.user.id),
          gte(completedTask.completedAt, weekStart),
          lte(completedTask.completedAt, weekEnd),
        ),
        orderBy: [desc(completedTask.completedAt)],
        with: {
          project: {
            with: {
              goal: true,
            },
          },
          goal: true,
        },
      });

      // Create a 7-day array with completion counts
      const dailyCompletions = Array.from({ length: 7 }, (_, i) => {
        const day = new Date(weekStart);
        day.setDate(day.getDate() + i);
        const dayStr = day.toISOString().split("T")[0];
        const dayTasks = completed.filter(
          (t) => t.completedAt.toISOString().split("T")[0] === dayStr,
        );
        return {
          date: dayStr,
          dayOfWeek: day.toLocaleDateString("en-US", { weekday: "short" }),
          count: dayTasks.length,
          hasCompletions: dayTasks.length > 0,
        };
      });

      // Calculate time by project
      const timeByProject = completed.reduce(
        (acc, task) => {
          const projectId = task.projectId ?? "no-project";
          const projectTitle = task.project?.title ?? "Unassigned";
          acc[projectId] ??= {
            projectId,
            projectTitle,
            projectColor: task.project?.color ?? "#6b7280",
            totalMinutes: 0,
            taskCount: 0,
          };
          acc[projectId].totalMinutes += task.timeSpentMinutes ?? 0;
          acc[projectId].taskCount += 1;
          return acc;
        },
        {} as Record<
          string,
          {
            projectId: string;
            projectTitle: string;
            projectColor: string;
            totalMinutes: number;
            taskCount: number;
          }
        >,
      );

      return {
        weekStartDate: weekStart.toISOString(),
        weekEndDate: weekEnd.toISOString(),
        totalCompleted: completed.length,
        totalTimeMinutes: completed.reduce(
          (sum, t) => sum + (t.timeSpentMinutes ?? 0),
          0,
        ),
        dailyCompletions,
        timeByProject: Object.values(timeByProject).sort(
          (a, b) => b.totalMinutes - a.totalMinutes,
        ),
        tasks: completed,
      };
    }),

  // Get monthly completion heatmap data (GitHub-style)
  getMonthlyHeatmap: protectedProcedure
    .input(
      z
        .object({
          year: z.number().int().min(2020).max(2100).optional(),
          month: z.number().int().min(1).max(12).optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const now = new Date();
      const year = input?.year ?? now.getFullYear();
      const month = input?.month ?? now.getMonth() + 1;

      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59, 999);

      const completed = await ctx.db.query.completedTask.findMany({
        where: and(
          eq(completedTask.userId, ctx.session.user.id),
          gte(completedTask.completedAt, startDate),
          lte(completedTask.completedAt, endDate),
        ),
      });

      // Create a map of date -> count
      const countByDate = completed.reduce(
        (acc, task) => {
          const dateStr = task.completedAt.toISOString().split("T")[0]!;
          acc[dateStr] = (acc[dateStr] ?? 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      // Generate all days in the month with their counts
      const daysInMonth = new Date(year, month, 0).getDate();
      const days = Array.from({ length: daysInMonth }, (_, i) => {
        const date = new Date(year, month - 1, i + 1);
        const dateStr = date.toISOString().split("T")[0]!;
        const count = countByDate[dateStr] ?? 0;
        return {
          date: dateStr,
          count,
          level:
            count === 0
              ? 0
              : count <= 2
                ? 1
                : count <= 5
                  ? 2
                  : count <= 10
                    ? 3
                    : 4,
        };
      });

      return {
        year,
        month,
        days,
        totalCompleted: completed.length,
      };
    }),
});
