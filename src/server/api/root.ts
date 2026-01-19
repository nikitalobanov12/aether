import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { postRouter } from "~/server/api/routers/post";
import { boardRouter } from "~/server/api/routers/board";
import { taskRouter } from "~/server/api/routers/task";
import { goalRouter } from "~/server/api/routers/goal";
import { timeBlockRouter } from "~/server/api/routers/time-block";
import { userPreferencesRouter } from "~/server/api/routers/user-preferences";
import { aiRouter } from "~/server/api/routers/ai";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  post: postRouter,
  board: boardRouter,
  task: taskRouter,
  goal: goalRouter,
  timeBlock: timeBlockRouter,
  userPreferences: userPreferencesRouter,
  ai: aiRouter,
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
