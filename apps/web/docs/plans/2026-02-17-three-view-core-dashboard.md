# Three-View Core Dashboard Plan

## Product direction

The dashboard is now centered on three primary views:

1. Today - execute tasks quickly with layout flexibility
2. Week - plan the week visually with a kanban-style board
3. Calendar - schedule and coordinate time blocks/events/tasks

This intentionally reduces navigation complexity and keeps planning/execution mental models separate.

## IA updates

- Primary nav: Today, This Week, Calendar
- Secondary nav: Goals, Insights, Settings
- Today becomes the default execution surface with a layout switcher:
  - Checklist (default)
  - Timeline
  - Cards

## UX goals

- Fast daily completion flow on mobile and desktop
- Visual planning confidence in week board
- Frictionless handoff between week planning and calendar scheduling
- PWA-ready interaction density (thumb-safe controls, clear hierarchy)

## Implementation notes

- Keep existing tRPC contracts unchanged
- Maintain optimistic updates for task mutations
- Add utility tests for Today layout parsing and card grouping logic
