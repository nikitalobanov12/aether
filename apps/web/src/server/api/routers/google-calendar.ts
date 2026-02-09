import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { google } from "googleapis";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import {
  googleIntegration,
  syncLog,
  task,
  timeBlock,
} from "~/server/db/schema";
import { env } from "~/env";
import { type db as dbType } from "~/server/db";

// OAuth2 client setup - uses a separate callback URL from Better Auth
function getOAuth2Client() {
  return new google.auth.OAuth2(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    `${env.BETTER_AUTH_URL ?? "http://localhost:3000"}/api/google-calendar/callback`,
  );
}

// Get authenticated client for a user
async function getAuthenticatedClient(db: typeof dbType, userId: string) {
  const integration = await db.query.googleIntegration.findFirst({
    where: eq(googleIntegration.userId, userId),
  });

  if (!integration) {
    return null;
  }

  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({
    access_token: integration.accessToken,
    refresh_token: integration.refreshToken,
    expiry_date: integration.tokenExpiresAt.getTime(),
  });

  // Check if token is expired and refresh if needed
  if (integration.tokenExpiresAt < new Date()) {
    try {
      const { credentials } = await oauth2Client.refreshAccessToken();

      // Update tokens in database
      await db
        .update(googleIntegration)
        .set({
          accessToken: credentials.access_token!,
          refreshToken: credentials.refresh_token ?? integration.refreshToken,
          tokenExpiresAt: new Date(credentials.expiry_date!),
          updatedAt: new Date(),
        })
        .where(eq(googleIntegration.userId, userId));

      oauth2Client.setCredentials(credentials);
    } catch {
      // Token refresh failed, user needs to re-authenticate
      return null;
    }
  }

  return { oauth2Client, integration };
}

export const googleCalendarRouter = createTRPCRouter({
  // Get connection status
  getStatus: protectedProcedure.query(async ({ ctx }) => {
    const integration = await ctx.db.query.googleIntegration.findFirst({
      where: eq(googleIntegration.userId, ctx.session.user.id),
    });

    if (!integration) {
      return {
        connected: false,
        calendarEnabled: false,
        tasksEnabled: false,
        lastCalendarSync: null,
        lastTasksSync: null,
      };
    }

    return {
      connected: true,
      calendarEnabled: integration.calendarEnabled ?? true,
      tasksEnabled: integration.tasksEnabled ?? true,
      calendarId: integration.calendarId,
      tasksListId: integration.tasksListId,
      lastCalendarSync: integration.lastCalendarSyncAt,
      lastTasksSync: integration.lastTasksSyncAt,
      connectedAt: integration.connectedAt,
    };
  }),

  // Get authorization URL for Google OAuth
  getAuthUrl: protectedProcedure.query(() => {
    const oauth2Client = getOAuth2Client();

    const scopes = [
      "https://www.googleapis.com/auth/calendar.readonly",
      "https://www.googleapis.com/auth/calendar.events",
      "https://www.googleapis.com/auth/tasks",
      "https://www.googleapis.com/auth/tasks.readonly",
    ];

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: scopes,
      prompt: "consent", // Force consent to get refresh token
    });

    return { authUrl };
  }),

  // Exchange authorization code for tokens
  connect: protectedProcedure
    .input(z.object({ code: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const oauth2Client = getOAuth2Client();

      try {
        const { tokens } = await oauth2Client.getToken(input.code);

        // Get the primary calendar ID
        oauth2Client.setCredentials(tokens);
        const calendar = google.calendar({ version: "v3", auth: oauth2Client });
        const calendarList = await calendar.calendarList.list();
        const primaryCalendar = calendarList.data.items?.find(
          (cal) => cal.primary,
        );

        // Get the default tasks list
        const tasks = google.tasks({ version: "v1", auth: oauth2Client });
        const taskLists = await tasks.tasklists.list();
        const defaultTaskList = taskLists.data.items?.[0];

        // Store or update integration
        const existing = await ctx.db.query.googleIntegration.findFirst({
          where: eq(googleIntegration.userId, ctx.session.user.id),
        });

        const integrationData = {
          accessToken: tokens.access_token!,
          refreshToken: tokens.refresh_token!,
          tokenExpiresAt: new Date(tokens.expiry_date!),
          calendarId: primaryCalendar?.id ?? null,
          tasksListId: defaultTaskList?.id ?? null,
          updatedAt: new Date(),
        };

        if (existing) {
          await ctx.db
            .update(googleIntegration)
            .set(integrationData)
            .where(eq(googleIntegration.userId, ctx.session.user.id));
        } else {
          await ctx.db.insert(googleIntegration).values({
            userId: ctx.session.user.id,
            ...integrationData,
            connectedAt: new Date(),
          });
        }

        return { success: true };
      } catch (error) {
        console.error("Google OAuth error:", error);
        throw new Error("Failed to connect Google account");
      }
    }),

  // Disconnect Google account
  disconnect: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.db
      .delete(googleIntegration)
      .where(eq(googleIntegration.userId, ctx.session.user.id));

    return { success: true };
  }),

  // Fetch calendar events for a date range
  getEvents: protectedProcedure
    .input(
      z.object({
        startDate: z.string().datetime(),
        endDate: z.string().datetime(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const auth = await getAuthenticatedClient(ctx.db, ctx.session.user.id);
      if (!auth) {
        return { events: [], connected: false };
      }

      const calendar = google.calendar({
        version: "v3",
        auth: auth.oauth2Client,
      });

      try {
        const response = await calendar.events.list({
          calendarId: auth.integration.calendarId ?? "primary",
          timeMin: input.startDate,
          timeMax: input.endDate,
          singleEvents: true,
          orderBy: "startTime",
        });

        const events = (response.data.items ?? []).map((event) => ({
          id: event.id!,
          title: event.summary ?? "Untitled",
          description: event.description ?? null,
          startTime: event.start?.dateTime ?? event.start?.date ?? "",
          endTime: event.end?.dateTime ?? event.end?.date ?? "",
          allDay: !event.start?.dateTime,
          location: event.location ?? null,
          htmlLink: event.htmlLink ?? null,
        }));

        return { events, connected: true };
      } catch (error) {
        console.error("Failed to fetch calendar events:", error);
        return { events: [], connected: true, error: "Failed to fetch events" };
      }
    }),

  // Sync tasks to Google Tasks
  syncTaskToGoogle: protectedProcedure
    .input(z.object({ taskId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const auth = await getAuthenticatedClient(ctx.db, ctx.session.user.id);
      if (!auth) {
        throw new Error("Google account not connected");
      }

      const appTask = await ctx.db.query.task.findFirst({
        where: and(
          eq(task.id, input.taskId),
          eq(task.userId, ctx.session.user.id),
        ),
      });

      if (!appTask) {
        throw new Error("Task not found");
      }

      const tasksApi = google.tasks({ version: "v1", auth: auth.oauth2Client });
      const taskListId = auth.integration.tasksListId ?? "@default";

      try {
        let googleTask;

        if (appTask.googleTasksId) {
          // Update existing task
          googleTask = await tasksApi.tasks.update({
            tasklist: taskListId,
            task: appTask.googleTasksId,
            requestBody: {
              title: appTask.title,
              notes: appTask.description ?? undefined,
              due: appTask.dueDate?.toISOString(),
              status:
                appTask.status === "completed" ? "completed" : "needsAction",
            },
          });
        } else {
          // Create new task
          googleTask = await tasksApi.tasks.insert({
            tasklist: taskListId,
            requestBody: {
              title: appTask.title,
              notes: appTask.description ?? undefined,
              due: appTask.dueDate?.toISOString(),
            },
          });

          // Store the Google Task ID
          await ctx.db
            .update(task)
            .set({
              googleTasksId: googleTask.data.id,
              googleTasksListId: taskListId,
              updatedAt: new Date(),
            })
            .where(eq(task.id, input.taskId));
        }

        // Log the sync
        await ctx.db.insert(syncLog).values({
          userId: ctx.session.user.id,
          syncType: "task_to_google",
          googleResourceId: googleTask.data.id,
          appResourceId: appTask.id,
          appResourceType: "task",
          status: "synced",
        });

        return { success: true, googleTaskId: googleTask.data.id };
      } catch (error) {
        // Log the error
        await ctx.db.insert(syncLog).values({
          userId: ctx.session.user.id,
          syncType: "task_to_google",
          appResourceId: appTask.id,
          appResourceType: "task",
          status: "failed",
          errorMessage:
            error instanceof Error ? error.message : "Unknown error",
        });

        throw new Error("Failed to sync task to Google");
      }
    }),

  // Create a time block from a Google Calendar event
  importEventAsTimeBlock: protectedProcedure
    .input(
      z.object({
        eventId: z.string(),
        title: z.string(),
        startTime: z.string().datetime(),
        endTime: z.string().datetime(),
        color: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if time block already exists for this event
      const existingBlock = await ctx.db.query.timeBlock.findFirst({
        where: and(
          eq(timeBlock.userId, ctx.session.user.id),
          eq(timeBlock.googleCalendarEventId, input.eventId),
        ),
      });

      if (existingBlock) {
        return { success: true, timeBlockId: existingBlock.id, existing: true };
      }

      // Create new time block
      const [newBlock] = await ctx.db
        .insert(timeBlock)
        .values({
          userId: ctx.session.user.id,
          title: input.title,
          startTime: new Date(input.startTime),
          endTime: new Date(input.endTime),
          color: input.color ?? "#3b82f6",
          googleCalendarEventId: input.eventId,
        })
        .returning();

      return { success: true, timeBlockId: newBlock?.id, existing: false };
    }),

  // Update sync settings
  updateSettings: protectedProcedure
    .input(
      z.object({
        calendarEnabled: z.boolean().optional(),
        tasksEnabled: z.boolean().optional(),
        calendarId: z.string().optional(),
        tasksListId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(googleIntegration)
        .set({
          ...input,
          updatedAt: new Date(),
        })
        .where(eq(googleIntegration.userId, ctx.session.user.id));

      return { success: true };
    }),

  // Get available calendars
  getCalendarList: protectedProcedure.query(async ({ ctx }) => {
    const auth = await getAuthenticatedClient(ctx.db, ctx.session.user.id);
    if (!auth) {
      return { calendars: [] };
    }

    const calendar = google.calendar({
      version: "v3",
      auth: auth.oauth2Client,
    });

    try {
      const response = await calendar.calendarList.list();
      const calendars = (response.data.items ?? []).map((cal) => ({
        id: cal.id!,
        name: cal.summary ?? "Untitled",
        primary: cal.primary ?? false,
        backgroundColor: cal.backgroundColor ?? null,
      }));

      return { calendars };
    } catch {
      return { calendars: [] };
    }
  }),

  // Get available task lists
  getTaskLists: protectedProcedure.query(async ({ ctx }) => {
    const auth = await getAuthenticatedClient(ctx.db, ctx.session.user.id);
    if (!auth) {
      return { taskLists: [] };
    }

    const tasksApi = google.tasks({ version: "v1", auth: auth.oauth2Client });

    try {
      const response = await tasksApi.tasklists.list();
      const taskLists = (response.data.items ?? []).map((list) => ({
        id: list.id!,
        name: list.title ?? "Untitled",
      }));

      return { taskLists };
    } catch {
      return { taskLists: [] };
    }
  }),
});
