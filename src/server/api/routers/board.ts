import { z } from "zod";
import { eq, and, desc, asc } from "drizzle-orm";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { board } from "~/server/db/schema";

export const boardRouter = createTRPCRouter({
  // Get all boards for the current user
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const boards = await ctx.db.query.board.findMany({
      where: eq(board.userId, ctx.session.user.id),
      orderBy: [asc(board.sortOrder), desc(board.createdAt)],
    });
    return boards;
  }),

  // Get a single board by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db.query.board.findFirst({
        where: and(
          eq(board.id, input.id),
          eq(board.userId, ctx.session.user.id),
        ),
        with: {
          tasks: {
            orderBy: (tasks, { asc }) => [asc(tasks.sortOrder)],
          },
        },
      });
      return result ?? null;
    }),

  // Create a new board
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        description: z.string().max(500).optional(),
        color: z.string().optional(),
        icon: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [newBoard] = await ctx.db
        .insert(board)
        .values({
          userId: ctx.session.user.id,
          name: input.name,
          description: input.description,
          color: input.color,
          icon: input.icon,
        })
        .returning();

      return newBoard;
    }),

  // Update a board
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).max(100).optional(),
        description: z.string().max(500).optional(),
        color: z.string().optional(),
        icon: z.string().optional(),
        sortOrder: z.number().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const [updated] = await ctx.db
        .update(board)
        .set({ ...data, updatedAt: new Date() })
        .where(and(eq(board.id, id), eq(board.userId, ctx.session.user.id)))
        .returning();

      return updated;
    }),

  // Delete a board
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(board)
        .where(
          and(eq(board.id, input.id), eq(board.userId, ctx.session.user.id)),
        );

      return { success: true };
    }),

  // Set default board
  setDefault: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // First, unset all defaults for this user
      await ctx.db
        .update(board)
        .set({ isDefault: false })
        .where(eq(board.userId, ctx.session.user.id));

      // Then set the new default
      const [updated] = await ctx.db
        .update(board)
        .set({ isDefault: true, updatedAt: new Date() })
        .where(
          and(eq(board.id, input.id), eq(board.userId, ctx.session.user.id)),
        )
        .returning();

      return updated;
    }),
});
