# Agent Guidelines for Dayflow Codebase

## Build/Lint/Test Commands

```bash
# Development
bun run dev              # Start dev server (auto-starts Docker DB)
bun run dev:next         # Start dev server without DB check
bun run build            # Production build
bun run preview          # Build and start production server

# Code Quality
bun run lint             # Check for linting errors
bun run lint:fix         # Auto-fix linting errors
bun run typecheck        # Run TypeScript type checking
bun run format:check     # Check Prettier formatting
bun run format:write     # Auto-format all files
bun run check            # Run lint + typecheck together

# Database
bun run db:push          # Push schema changes to database
bun run db:generate      # Generate migration files
bun run db:migrate       # Run migrations
bun run db:studio        # Open Drizzle Studio GUI
bun run db:start         # Start Docker PostgreSQL container
bun run db:stop          # Stop Docker PostgreSQL container
```

## Tech Stack

| Layer     | Technology                         |
| --------- | ---------------------------------- |
| Framework | Next.js 15 (App Router, Turbopack) |
| Language  | TypeScript 5.8 (strict mode)       |
| Database  | PostgreSQL (Neon prod, Docker dev) |
| ORM       | Drizzle ORM                        |
| Auth      | Better Auth + Google OAuth         |
| API       | tRPC v11 + React Query             |
| Styling   | Tailwind CSS v4 + shadcn/ui        |
| AI        | Hugging Face Inference API         |
| Payments  | Stripe                             |
| Runtime   | Bun                                |

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth routes (login page at /)
│   ├── (dashboard)/       # Protected routes (boards, goals, calendar, settings)
│   └── api/               # API routes (tRPC, auth, webhooks)
├── components/
│   ├── ui/                # shadcn/ui primitives (button, card, dialog, etc.)
│   ├── auth/              # Auth-related components
│   ├── boards/            # Kanban board components
│   ├── dashboard/         # Dashboard components
│   ├── layout/            # Sidebar, navigation
│   └── tasks/             # Task-related components
├── server/
│   ├── api/               # tRPC routers and procedures
│   │   └── routers/       # Feature-specific routers (task, board, goal, etc.)
│   ├── db/                # Drizzle schema, client, migrations
│   └── better-auth/       # Auth configuration
├── lib/                   # Utilities (cn, date helpers, etc.)
├── hooks/                 # Custom React hooks
└── trpc/                  # tRPC client setup (react.tsx, server.ts)
```

## Code Style Guidelines

### Imports

```typescript
// 1. External libraries (React, Next.js, etc.)
import { useState } from "react";
import Link from "next/link";

// 2. Internal modules using ~/  alias
import { api } from "~/trpc/server";
import { Button } from "~/components/ui/button";
import { task } from "~/server/db/schema";

// 3. Types (use inline type imports)
import { type AppRouter } from "~/server/api/root";
```

- Always use `~/` path alias for src imports
- Use inline type imports: `import { type Foo }` not `import type { Foo }`
- No relative imports outside current directory

### TypeScript

- Strict mode enabled with `noUncheckedIndexedAccess`
- Use Zod for runtime validation (especially in tRPC inputs)
- Infer types from schema: `type Task = typeof task.$inferSelect`
- Prefix unused variables with underscore: `_unusedVar`
- Explicit return types for public functions

### React Components

```typescript
// Server Component (default) - no directive needed
export async function Dashboard() {
  const data = await api.task.getAll();
  return <div>{/* ... */}</div>;
}

// Client Component - add directive
"use client";

interface TaskCardProps {
  task: Task;
  onUpdate: (id: string) => void;
}

export function TaskCard({ task, onUpdate }: TaskCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  // ...
}
```

- Server Components by default, `"use client"` only when needed
- Props interfaces, not inline types
- Destructure props in function signature
- PascalCase for components, kebab-case for files

### Database & tRPC

```typescript
// Schema: snake_case for DB columns
export const task = pgTable("dayflow_task", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()),
});

// tRPC Router
export const taskRouter = createTRPCRouter({
  getAll: protectedProcedure
    .input(z.object({ boardId: z.string().uuid().optional() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.query.task.findMany({
        where: eq(task.userId, ctx.session.user.id),
      });
    }),
});
```

- Table names: `dayflow_` prefix for app tables
- Always filter by `userId` for user-owned data
- Use Drizzle's relational queries with `with:` for joins
- Validate all inputs with Zod schemas

### Styling

```typescript
import { cn } from "~/lib/utils";

// Conditional classes with cn()
<div className={cn(
  "rounded-lg border p-4",
  isActive && "bg-primary text-primary-foreground",
  variant === "destructive" && "border-destructive"
)} />
```

- Use `cn()` utility for conditional classes
- Tailwind CSS v4 with design system tokens
- shadcn/ui components from `~/components/ui/`
- Reference: https://ui.shadcn.com/

### Error Handling

```typescript
// tRPC mutations with optimistic updates
const utils = api.useUtils();
const mutation = api.task.update.useMutation({
  onMutate: async (newData) => {
    await utils.task.getAll.cancel();
    const previous = utils.task.getAll.getData();
    utils.task.getAll.setData(undefined, (old) => /* optimistic update */);
    return { previous };
  },
  onError: (err, newData, context) => {
    utils.task.getAll.setData(undefined, context?.previous);
  },
  onSettled: () => {
    utils.task.getAll.invalidate();
  },
});
```

- Use tRPC error codes for API errors
- Implement optimistic updates for mutations
- Revert on error with previous data
- Invalidate queries on settlement

### Drizzle Safety Rules

The ESLint config enforces:

- `drizzle/enforce-delete-with-where` - All deletes must have WHERE clause
- `drizzle/enforce-update-with-where` - All updates must have WHERE clause

```typescript
// Correct
await db.delete(task).where(eq(task.id, id));

// Will error - no WHERE clause
await db.delete(task);
```

## Environment Variables

Required in `.env`:

```bash
DATABASE_URL="postgresql://..."     # PostgreSQL connection string
BETTER_AUTH_SECRET="..."            # Auth secret (min 32 chars)
GOOGLE_CLIENT_ID="..."              # Google OAuth
GOOGLE_CLIENT_SECRET="..."          # Google OAuth
```

Optional:

```bash
BETTER_AUTH_URL="http://localhost:3000"
HUGGINGFACE_API_KEY="..."           # AI features
STRIPE_SECRET_KEY="..."             # Payments
```

## Common Patterns

### Adding a New Feature

1. **Schema**: Add table in `src/server/db/schema.ts`
2. **Router**: Create router in `src/server/api/routers/`
3. **Register**: Add to `src/server/api/root.ts`
4. **Components**: Build UI in `src/components/`
5. **Page**: Add route in `src/app/(dashboard)/`

### Auth Check

```typescript
// Server Component
import { getSession } from "~/server/better-auth/server";
const session = await getSession();
if (!session) redirect("/");

// tRPC - use protectedProcedure (auto-checks auth)
export const myRouter = createTRPCRouter({
  myProcedure: protectedProcedure.query(({ ctx }) => {
    // ctx.session.user is available
  }),
});
```
