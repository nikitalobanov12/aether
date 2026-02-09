import { startOfWeek } from "date-fns";
import { api, HydrateClient } from "~/trpc/server";
import { WeeklyReview } from "~/components/review/weekly-review";

export default async function InsightsPage() {
  // Get current week start (Sunday)
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 0 });

  // Prefetch data in parallel
  const [summary, habits] = await Promise.all([
    api.history.getWeeklySummary({ weekStartDate: weekStart.toISOString() }),
    api.habit.getAll(),
  ]);

  return (
    <HydrateClient>
      <WeeklyReview initialSummary={summary} initialHabits={habits} />
    </HydrateClient>
  );
}
