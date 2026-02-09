# Aether

A task planner that syncs calendar, tasks, and life goals in one unified system.

## Structure

This is a consolidated Next.js application with:

- **Landing page** (`/`) - Marketing site with features, pricing, etc.
- **Auth** (`/login`) - Sign in / sign up
- **App** (`/today`, `/week`, `/calendar`, etc.) - The main dashboard
- **Legal** (`/privacy-policy`, `/terms-of-service`)

## Quick Start

```bash
# Install dependencies
bun install

# Run dev server (with DB)
bun run dev

# Run dev server (without DB check)
cd apps/web && bun run dev:next

# Build for production
bun run build
```

## Development

The app is located in `apps/web/` and uses:
- Next.js 15 with App Router
- tRPC for API
- Drizzle ORM with PostgreSQL
- Better Auth for authentication
- Tailwind CSS + shadcn/ui

### Database

```bash
# Start local PostgreSQL
bun run db:start

# Generate migrations
bun run db:generate

# Run migrations
bun run db:migrate

# Open Drizzle Studio
bun run db:studio
```

## Deployment

### Vercel

Deploy from the root of the repository:

1. Connect GitHub repo to Vercel
2. Framework preset: Next.js
3. Root directory: `apps/web` (or leave as default if deploying from root)
4. Build command: `next build`
5. Install command: `bun install`

### Environment Variables

Copy `apps/web/.env.example` to `apps/web/.env` and fill in:

- `DATABASE_URL` - PostgreSQL connection string
- `BETTER_AUTH_SECRET` - Random 32+ character string
- `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET` - Google OAuth
- `STRIPE_SECRET_KEY` - Stripe payments (optional)

---

**Aether** - Organize Your Goals. Execute Your Day.
