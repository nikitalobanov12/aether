# Aether Monorepo

A unified workspace for the Aether project - a task planner that syncs calendar, tasks, and life goals in one unified system.

## Apps

| App | Description | URL |
|-----|-------------|-----|
| [`apps/web`](./apps/web) | Next.js web application | app.aethertask.com |
| [`apps/landing`](./apps/landing) | Vite landing page | aethertask.com |

## Packages

| Package | Description |
|---------|-------------|
| [`packages/ui`](./packages/ui) | Shared shadcn/ui components |
| [`packages/docs`](./packages/docs) | Unified documentation |

## Quick Start

```bash
# Install dependencies for all packages
bun install

# Run web app
bun run web:dev

# Run landing page
bun run landing:dev

# Run both
bun run dev
```

## Development

This monorepo uses Bun workspaces for package management.

### Workspace Commands

```bash
# Run command in all packages
bun run --filter '*' <command>

# Run command in specific package
bun run --filter '@aether/web' <command>
```

### Adding UI Components

UI components are shared in `packages/ui`. To add a new component:

1. Add it to `packages/ui/src/components/`
2. Export it from `packages/ui/src/index.ts`
3. Import in apps via `import { Button } from '@aether/ui'`

## Deployment

### Vercel Configuration

Both apps deploy from this single repo:

- **Web**: Deploy from `apps/web` directory → `app.aethertask.com`
- **Landing**: Deploy from `apps/landing` directory → `aethertask.com`

Configure in Vercel dashboard:
1. Add project
2. Set root directory to `apps/web` or `apps/landing`
3. Framework preset: Next.js (web) or Vite (landing)

---

**Aether** - Organize Your Goals. Execute Your Day.
