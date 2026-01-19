import { z } from "zod";
import { eq } from "drizzle-orm";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { userPreferences } from "~/server/db/schema";

export const userPreferencesRouter = createTRPCRouter({
  // Get user preferences (create default if doesn't exist)
  get: protectedProcedure.query(async ({ ctx }) => {
    let prefs = await ctx.db.query.userPreferences.findFirst({
      where: eq(userPreferences.id, ctx.session.user.id),
    });

    // Create default preferences if they don't exist
    if (!prefs) {
      const [newPrefs] = await ctx.db
        .insert(userPreferences)
        .values({
          id: ctx.session.user.id,
        })
        .returning();
      prefs = newPrefs;
    }

    return prefs;
  }),

  // Update user preferences
  update: protectedProcedure
    .input(
      z.object({
        // Display settings
        theme: z.enum(["light", "dark", "system"]).optional(),
        language: z.string().optional(),
        dateFormat: z.string().optional(),
        timeFormat: z.enum(["12h", "24h"]).optional(),
        weekStartsOn: z.number().int().min(0).max(6).optional(),
        showCompletedTasks: z.boolean().optional(),
        taskSortBy: z.string().optional(),
        taskSortOrder: z.enum(["asc", "desc"]).optional(),
        calendarDefaultView: z.string().optional(),
        boardDefaultView: z.string().optional(),

        // Google Calendar
        googleCalendarEnabled: z.boolean().optional(),
        googleCalendarSelectedId: z.string().nullable().optional(),
        googleCalendarAutoSync: z.boolean().optional(),

        // AI Scheduling
        autoScheduleEnabled: z.boolean().optional(),
        workingHoursStart: z.string().optional(),
        workingHoursEnd: z.string().optional(),
        workingDays: z.array(z.number().int().min(0).max(6)).optional(),
        bufferTimeBetweenTasks: z.number().int().min(0).max(60).optional(),
        maxTaskChunkSize: z.number().int().min(15).max(480).optional(),
        minTaskChunkSize: z.number().int().min(5).max(120).optional(),
        schedulingLookaheadDays: z.number().int().min(1).max(90).optional(),
        maxDailyWorkHours: z.string().optional(),
        focusTimeMinimumMinutes: z.number().int().min(15).max(240).optional(),

        // Onboarding
        hasCompletedOnboarding: z.boolean().optional(),
        onboardingData: z.record(z.unknown()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Ensure preferences exist
      const existing = await ctx.db.query.userPreferences.findFirst({
        where: eq(userPreferences.id, ctx.session.user.id),
      });

      if (!existing) {
        // Create with the input values
        const [newPrefs] = await ctx.db
          .insert(userPreferences)
          .values({
            id: ctx.session.user.id,
            ...input,
          })
          .returning();
        return newPrefs;
      }

      // Update existing
      const [updated] = await ctx.db
        .update(userPreferences)
        .set({
          ...input,
          updatedAt: new Date(),
        })
        .where(eq(userPreferences.id, ctx.session.user.id))
        .returning();

      return updated;
    }),

  // Complete onboarding
  completeOnboarding: protectedProcedure
    .input(
      z.object({
        onboardingData: z.record(z.unknown()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(userPreferences)
        .set({
          hasCompletedOnboarding: true,
          onboardingData: input.onboardingData,
          updatedAt: new Date(),
        })
        .where(eq(userPreferences.id, ctx.session.user.id))
        .returning();

      return updated;
    }),
});
