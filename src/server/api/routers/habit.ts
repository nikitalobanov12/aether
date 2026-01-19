import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { habitStreak } from "~/server/db/schema";

// Type for streak history entries
interface StreakHistoryEntry {
  date: string; // ISO date string (YYYY-MM-DD)
  completed: boolean;
}

export const habitRouter = createTRPCRouter({
  // Get all habit streaks for the user
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const streaks = await ctx.db.query.habitStreak.findMany({
      where: eq(habitStreak.userId, ctx.session.user.id),
      orderBy: [desc(habitStreak.currentStreakDays)],
    });

    return streaks.map((s) => ({
      ...s,
      streakHistory: (s.streakHistory ?? []) as StreakHistoryEntry[],
    }));
  }),

  // Get a specific habit streak
  getByName: protectedProcedure
    .input(z.object({ habitName: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const streak = await ctx.db.query.habitStreak.findFirst({
        where: and(
          eq(habitStreak.userId, ctx.session.user.id),
          eq(habitStreak.habitName, input.habitName),
        ),
      });

      if (!streak) return null;

      return {
        ...streak,
        streakHistory: (streak.streakHistory ?? []) as StreakHistoryEntry[],
      };
    }),

  // Create a new habit streak
  create: protectedProcedure
    .input(
      z.object({
        habitName: z.string().min(1).max(100),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if habit already exists
      const existing = await ctx.db.query.habitStreak.findFirst({
        where: and(
          eq(habitStreak.userId, ctx.session.user.id),
          eq(habitStreak.habitName, input.habitName),
        ),
      });

      if (existing) {
        return existing;
      }

      const [newStreak] = await ctx.db
        .insert(habitStreak)
        .values({
          userId: ctx.session.user.id,
          habitName: input.habitName,
          currentStreakDays: 0,
          bestStreakDays: 0,
          streakHistory: [],
        })
        .returning();

      return newStreak;
    }),

  // Log a habit completion for today
  logCompletion: protectedProcedure
    .input(
      z.object({
        habitName: z.string().min(1),
        date: z.string().datetime().optional(), // Defaults to today
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const completionDate = input.date ? new Date(input.date) : new Date();
      const dateStr = completionDate.toISOString().split("T")[0]!;

      // Find or create the habit streak
      let streak = await ctx.db.query.habitStreak.findFirst({
        where: and(
          eq(habitStreak.userId, ctx.session.user.id),
          eq(habitStreak.habitName, input.habitName),
        ),
      });

      if (!streak) {
        // Create the habit if it doesn't exist
        const [newStreak] = await ctx.db
          .insert(habitStreak)
          .values({
            userId: ctx.session.user.id,
            habitName: input.habitName,
            currentStreakDays: 0,
            bestStreakDays: 0,
            streakHistory: [],
          })
          .returning();
        streak = newStreak!;
      }

      const history = (streak.streakHistory ?? []) as StreakHistoryEntry[];

      // Check if already completed today
      const alreadyCompleted = history.some(
        (h) => h.date === dateStr && h.completed,
      );
      if (alreadyCompleted) {
        return streak;
      }

      // Add to history
      const updatedHistory = [...history, { date: dateStr, completed: true }];

      // Sort history by date
      updatedHistory.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      );

      // Calculate streak
      let currentStreak = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Count backwards from today
      for (let i = 0; i < 365; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(checkDate.getDate() - i);
        const checkDateStr = checkDate.toISOString().split("T")[0];

        const entry = updatedHistory.find((h) => h.date === checkDateStr);

        if (entry?.completed) {
          currentStreak++;
        } else if (i === 0) {
          // Today hasn't been completed yet, that's ok
          continue;
        } else {
          // Streak broken
          break;
        }
      }

      const bestStreak = Math.max(streak.bestStreakDays, currentStreak);

      const [updated] = await ctx.db
        .update(habitStreak)
        .set({
          currentStreakDays: currentStreak,
          bestStreakDays: bestStreak,
          lastCompletedDate: completionDate,
          streakHistory: updatedHistory,
          updatedAt: new Date(),
        })
        .where(eq(habitStreak.id, streak.id))
        .returning();

      return {
        ...updated,
        streakHistory: updatedHistory,
      };
    }),

  // Get streak history for visualization
  getHistory: protectedProcedure
    .input(
      z.object({
        habitName: z.string().min(1),
        days: z.number().int().min(7).max(365).optional().default(30),
      }),
    )
    .query(async ({ ctx, input }) => {
      const streak = await ctx.db.query.habitStreak.findFirst({
        where: and(
          eq(habitStreak.userId, ctx.session.user.id),
          eq(habitStreak.habitName, input.habitName),
        ),
      });

      if (!streak) {
        return null;
      }

      const history = (streak.streakHistory ?? []) as StreakHistoryEntry[];

      // Create a map of the last N days
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const days = Array.from({ length: input.days }, (_, i) => {
        const date = new Date(today);
        date.setDate(date.getDate() - (input.days - 1 - i));
        const dateStr = date.toISOString().split("T")[0]!;
        const entry = history.find((h) => h.date === dateStr);

        return {
          date: dateStr,
          completed: entry?.completed ?? false,
        };
      });

      // Find streak breaks in the history
      const streakBreaks: { date: string; previousStreak: number }[] = [];
      let tempStreak = 0;

      for (const day of days) {
        if (day.completed) {
          tempStreak++;
        } else if (tempStreak > 0) {
          streakBreaks.push({
            date: day.date,
            previousStreak: tempStreak,
          });
          tempStreak = 0;
        }
      }

      return {
        habitName: streak.habitName,
        currentStreakDays: streak.currentStreakDays,
        bestStreakDays: streak.bestStreakDays,
        lastCompletedDate: streak.lastCompletedDate,
        days,
        streakBreaks,
      };
    }),

  // Delete a habit
  delete: protectedProcedure
    .input(z.object({ habitName: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(habitStreak)
        .where(
          and(
            eq(habitStreak.userId, ctx.session.user.id),
            eq(habitStreak.habitName, input.habitName),
          ),
        );

      return { success: true };
    }),

  // Rename a habit
  rename: protectedProcedure
    .input(
      z.object({
        oldName: z.string().min(1),
        newName: z.string().min(1).max(100),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(habitStreak)
        .set({
          habitName: input.newName,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(habitStreak.userId, ctx.session.user.id),
            eq(habitStreak.habitName, input.oldName),
          ),
        )
        .returning();

      return updated;
    }),
});
