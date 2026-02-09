# Aether

**Organize your goals. Execute your day.**

A full-stack productivity platform that connects high-level goals to daily execution through projects, tasks, time blocking, and calendar integration -- with AI-powered scheduling assistance.

[![Next.js](https://img.shields.io/badge/Next.js_15-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript_5.8-3178C6?logo=typescript&logoColor=white)](https://typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)](https://postgresql.org)
[![tRPC](https://img.shields.io/badge/tRPC_v11-2596BE?logo=trpc&logoColor=white)](https://trpc.io)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_v4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)

---

## Try It

> **[Live Demo](https://aether.example.com)** -- Click "Try Demo" on the login page. No sign-up required.

A temporary account is created with realistic sample data (goals, projects, tasks, time blocks, and completed history) so you can explore every feature immediately. Demo accounts are automatically cleaned up after 24 hours.

---

## What Problem Does This Solve?

Most productivity tools force a choice: simple task lists that lack structure, or heavyweight project managers that don't help with daily planning. Aether bridges that gap by letting you define goals, break them into projects and tasks, then plan your day with time blocking -- all in one place.

## Key Features

- **Goal > Project > Task hierarchy** -- Define goals, organize them into projects, and track tasks within each project. Progress rolls up automatically.
- **Daily planner with time blocking** -- Schedule tasks into time blocks on a visual daily timeline. See your backlog alongside your calendar.
- **Weekly view** -- Plan your week ahead with task distribution and deadline visibility.
- **Calendar integration** -- Connect Google Calendar to see events alongside time blocks. Import events as time blocks or sync tasks to Google Tasks.
- **Completed history and insights** -- Every completed task is preserved with time tracking. Review productivity trends over time.
- **AI-powered scheduling** -- Optional Hugging Face integration suggests task scheduling based on priorities, deadlines, and working hours.
- **Drag and drop** -- Reorder tasks, move between projects, and organize your workflow with dnd-kit.
- **Full authentication** -- Email/password and Google OAuth via Better Auth. Session-based with secure cookies.

## Tech Stack

| Layer     | Technology                                                                                     |
| --------- | ---------------------------------------------------------------------------------------------- |
| Framework | [Next.js 15](https://nextjs.org) (App Router, React Server Components, Turbopack)              |
| Language  | [TypeScript 5.8](https://typescriptlang.org) (strict mode, `noUncheckedIndexedAccess`)         |
| Database  | [PostgreSQL](https://postgresql.org) (Neon in production, Docker locally)                      |
| ORM       | [Drizzle ORM](https://orm.drizzle.team) with typed schema and SQL migrations                   |
| API       | [tRPC v11](https://trpc.io) with React Query for type-safe client-server communication         |
| Auth      | [Better Auth](https://better-auth.com) with Google OAuth and email/password                    |
| Styling   | [Tailwind CSS v4](https://tailwindcss.com) with [shadcn/ui](https://ui.shadcn.com) components  |
| AI        | [Hugging Face Inference](https://huggingface.co/inference-api) for task scheduling suggestions |
| Payments  | [Stripe](https://stripe.com) subscription management                                           |
| Testing   | [Vitest](https://vitest.dev) with React Testing Library                                        |
| Runtime   | [Bun](https://bun.sh)                                                                          |

## Architecture

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth routes (login at /)
│   ├── (dashboard)/       # Protected routes
│   │   ├── today/         # Daily planner
│   │   ├── week/          # Weekly view
│   │   ├── calendar/      # Calendar view
│   │   ├── goals/         # Goals management
│   │   ├── insights/      # Completed history
│   │   ├── projects/[id]/ # Project detail
│   │   └── settings/      # User preferences
│   └── api/               # API routes (tRPC, auth, webhooks, demo)
├── components/
│   ├── ui/                # shadcn/ui primitives
│   ├── auth/              # Login/signup forms
│   ├── dashboard/         # Dashboard overview
│   ├── planner/           # Daily planner components
│   ├── layout/            # Sidebar, navigation
│   └── tasks/             # Task cards, lists
├── server/
│   ├── api/routers/       # tRPC routers (task, goal, project, timeBlock, etc.)
│   ├── db/                # Drizzle schema, client, migrations
│   ├── better-auth/       # Auth configuration
│   └── demo/              # Demo mode seed data
├── lib/                   # Utilities
├── hooks/                 # Custom React hooks
└── trpc/                  # tRPC client setup
```

**Data flow:** Client components call tRPC mutations/queries via React Query. Server components use tRPC server callers directly. All tRPC routers use `protectedProcedure` which validates the Better Auth session and injects `ctx.session.user`. Database operations go through Drizzle ORM with full type safety from schema to UI.

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) (or Node.js 20+)
- [Docker](https://docker.com) (for local PostgreSQL)
- Google OAuth credentials (for auth and calendar integration)

### Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/aether.git
cd aether

# Install dependencies
bun install

# Copy environment variables
cp .env.example .env
```

### Configure Environment

Edit `.env` with your values:

```bash
# Required
DATABASE_URL="postgresql://postgres:password@localhost:5432/aether"
BETTER_AUTH_SECRET="your-secret-min-32-chars"
BETTER_AUTH_URL="http://localhost:3000"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Optional
HUGGINGFACE_API_KEY=""     # AI scheduling features
STRIPE_SECRET_KEY=""       # Payment features
CRON_SECRET=""             # Demo cleanup endpoint auth
```

### Run

```bash
# Start local database (Docker) + run migrations + start dev server
bun run dev

# Or step by step:
bun run db:start          # Start PostgreSQL container
bun run db:migrate        # Run migrations
bun run dev:next          # Start Next.js dev server
```

The app will be available at [http://localhost:3000](http://localhost:3000).

### Commands

| Command               | Description                            |
| --------------------- | -------------------------------------- |
| `bun run dev`         | Start dev server with DB auto-start    |
| `bun run build`       | Production build                       |
| `bun run check`       | Lint + typecheck                       |
| `bun run test:run`    | Run tests                              |
| `bun run db:generate` | Generate migration from schema changes |
| `bun run db:migrate`  | Apply pending migrations               |
| `bun run db:studio`   | Open Drizzle Studio (DB GUI)           |

## Demo Mode

Aether includes a built-in demo mode for showcasing the app without requiring sign-up:

1. Click **"Try Demo"** on the login page
2. A temporary account is created with realistic sample data
3. Explore the full app -- goals, projects, tasks, time blocks, and insights
4. Demo accounts are automatically cleaned up after 24 hours

The demo seeds a "developer portfolio" scenario with goals like "Launch Side Project" and "Level Up Skills", complete with tasks at various stages, time blocks for today, and completed history for the insights page.

---

Built with the [T3 Stack](https://create.t3.gg/).
