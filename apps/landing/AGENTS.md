# AGENTS.md - Aether Landing Page

## Commands
- `bun dev` - Start dev server
- `bun run build` - Type-check and build (`tsc -b && vite build`)
- `bun run lint` - Run ESLint
- No test framework configured

## Tech Stack
React 19 + TypeScript + Vite + Tailwind CSS v4 + Radix UI + Motion (Framer Motion)

## Code Style
- **Imports**: Use `@/*` path alias for `src/*` (e.g., `import { cn } from "@/lib/utils"`)
- **Components**: Function components with named exports. UI components in `src/components/ui/`
- **Styling**: Tailwind CSS with `cn()` utility for class merging. CSS variables for theming
- **Types**: TypeScript strict mode. Use `type` imports when importing only types
- **Naming**: PascalCase for components, camelCase for functions/variables

## Brand: Aether - Organize Your Goals. Execute Your Day.
- **Design**: Monochromatic + single teal accent, minimal, white space > clutter
- **Colors**: Light bg (#F5F7FA), Dark bg (#0B0C10), Primary teal (#32B8C6), Text (#111827), Success (#10B981)
- **Typography**: Geist (sans) with Inter fallback, JetBrains Mono (code)
- **Voice**: Direct, specific, pain-point-first. Name competitors. Respect user autonomy.
- **Target**: Solo users — ambitious individuals managing personal + professional goals
- **Tagline**: "Organize Your Goals. Execute Your Day."
- **One-liner**: "Calendar + tasks + goals in one place, designed for solo users."
- **USP**: "The task planner that syncs calendar, tasks, and life goals in one unified system. AI that helps — not decides for you."
- **Domain**: aethertask.com (landing), app.aethertask.com (app)
- **Pricing**: Free (50 tasks, 2 goals) / Pro $8/mo or $80/yr (unlimited)

## Copy Principles
1. Be specific — "Calendar sync is broken" beats "better integration"
2. Name competitors — Todoist, Motion, Sunsama. Specificity builds trust.
3. Lead with pain — Problems first, solutions second
4. Show progress — Completed task visibility is motivational
5. Undercut on price — $8 < $18 is powerful
6. Respect autonomy — "You decide" beats "AI decides"
