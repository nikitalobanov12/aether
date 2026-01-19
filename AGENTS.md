# Agent Guidelines for Dayflow Codebase

## Build/Lint/Test Commands

- **Dev Server**: `bun run dev`
- **Build**: `bun run build`
- **Lint**: `bun run lint` (check) or `bun run lint:fix` (auto-fix)
- **Format**: `bun run format:check` or `bun run format:write`
- **TypeCheck**: `bun run typecheck`
- **Database**: `bun run db:push` (push schema) or `bun run db:studio` (GUI)

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript (strict mode)
- **Database**: PostgreSQL (Neon in prod, Docker locally)
- **ORM**: Drizzle ORM
- **Auth**: Better Auth with Google OAuth
- **API**: tRPC with React Query
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **AI**: Hugging Face Inference API
- **Payments**: Stripe

## Code Style Guidelines

### Imports & Organization

- Use `~/` path alias for src imports: `import { db } from "~/server/db"`
- Group imports: external libraries, then internal modules, then types
- No relative imports outside current directory - use absolute paths

### TypeScript & Types

- Strict TypeScript enabled - all code must be properly typed
- Use interface over type for object definitions
- Prefer explicit return types for functions
- Schema types exported from `~/server/db/schema.ts`

### React & Component Conventions

- Function components with TypeScript interfaces for props
- Use React 19 patterns (no React.FC, destructured props)
- Components in PascalCase, files in kebab-case.tsx
- Custom hooks prefix with `use` and camelCase
- Server Components by default, `"use client"` only when needed

### Database & API Patterns

- Database fields use snake_case in schema, Drizzle handles conversion
- Use tRPC routers for all API endpoints
- Optimistic updates via React Query mutations
- Error handling: try/catch with proper error boundaries

### Styling & UI

- Tailwind CSS v4 with custom design system
- Use `cn()` utility for conditional classes (from `~/lib/utils`)
- Radix UI components for complex interactions
- shadcn/ui components: https://ui.shadcn.com/

### File Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Auth-related routes
│   ├── (dashboard)/       # Protected app routes
│   └── api/               # API routes (tRPC, webhooks)
├── components/            # React components
│   └── ui/                # shadcn/ui components
├── server/
│   ├── api/               # tRPC routers
│   ├── db/                # Drizzle schema and client
│   └── better-auth/       # Auth configuration
├── lib/                   # Utilities and integrations
├── hooks/                 # React hooks
└── trpc/                  # tRPC client setup
```

### Error Handling

- Use tRPC error codes for API errors
- React Error Boundaries for client-side errors
- Graceful fallbacks for failed operations
- Revert optimistic updates on mutation errors
