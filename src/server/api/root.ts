import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { postRouter } from "~/server/api/routers/post";
import { taskRouter } from "~/server/api/routers/task";
import { goalRouter } from "~/server/api/routers/goal";
import { projectRouter } from "~/server/api/routers/project";
import { timeBlockRouter } from "~/server/api/routers/time-block";
import { userPreferencesRouter } from "~/server/api/routers/user-preferences";
import { aiRouter } from "~/server/api/routers/ai";
import { historyRouter } from "~/server/api/routers/history";
import { habitRouter } from "~/server/api/routers/habit";
import { googleCalendarRouter } from "~/server/api/routers/google-calendar";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  post: postRouter,
  task: taskRouter,
  goal: goalRouter,
  project: projectRouter,
  timeBlock: timeBlockRouter,
  userPreferences: userPreferencesRouter,
  ai: aiRouter,
  history: historyRouter,
  habit: habitRouter,
  googleCalendar: googleCalendarRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.task.getAll();
 */
export const createCaller = createCallerFactory(appRouter);
