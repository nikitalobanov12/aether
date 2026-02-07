# Demo Mode & README Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add an interactive demo mode with pre-seeded data and a portfolio-grade README to make Aether accessible to recruiters.

**Architecture:** A "Try Demo" button on the login page calls `POST /api/demo` which creates a temporary user via Better Auth's programmatic API, seeds realistic goals/projects/tasks/time blocks/completed history, creates a session, and returns session cookies. Demo users are identified by email pattern `demo-*@demo.aether.app` and auto-cleaned after 24h via a cleanup API endpoint. The README replaces the T3 scaffold with product-specific content.

**Tech Stack:** Next.js API routes, Better Auth programmatic API, Drizzle ORM direct inserts, date-fns for relative dates.

---

### Task 1: Create demo seed data module

**Files:**

- Create: `src/server/demo/seed-data.ts`

The seed data function accepts a userId and inserts goals, projects, tasks, time blocks, completed tasks, and user preferences. All dates are relative to "today" so the demo always looks fresh.

### Task 2: Create demo API route

**Files:**

- Create: `src/app/api/demo/route.ts`

POST handler that:

1. Creates a user in the `user` table with email `demo-{uuid}@demo.aether.app`
2. Creates an `account` record for credential auth
3. Calls the seed function from Task 1
4. Uses Better Auth's `auth.api.signInEmail` or direct session creation to log the user in
5. Returns the session cookie so the client auto-redirects

### Task 3: Add "Try Demo" button to AuthForm

**Files:**

- Modify: `src/components/auth/auth-form.tsx`

Add a prominent "Try Demo" button above the Google sign-in that calls `POST /api/demo` and redirects on success.

### Task 4: Create demo cleanup API route

**Files:**

- Create: `src/app/api/demo/cleanup/route.ts`

GET/POST handler (secured with a secret or cron token) that deletes all users matching `demo-%@demo.aether.app` whose `createdAt` is older than 24 hours. Cascade deletes handle all related data.

### Task 5: Write the README

**Files:**

- Modify: `README.md`

Replace T3 scaffold with portfolio-grade README covering: product description, features, tech stack, architecture, getting started, and demo link.

### Task 6: Verify build and tests pass

Run `bun run check` and `bun run test:run` to ensure nothing is broken.
