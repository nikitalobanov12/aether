import { api, HydrateClient } from "~/trpc/server";
import { DailyPlanner } from "~/components/planner/daily-planner";

export default async function TodayPage() {
  // Get today's date range
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Prefetch data in parallel
  const [tasks, timeBlocks, historyData] = await Promise.all([
    api.task.getToday({ includeOverdue: true }),
    api.timeBlock.getByDateRange({
      startDate: today.toISOString(),
      endDate: tomorrow.toISOString(),
    }),
    api.history.getToday(),
  ]);

  return (
    <HydrateClient>
      <DailyPlanner
        initialTasks={tasks}
        initialTimeBlocks={timeBlocks}
        initialCompletedCount={historyData.count}
      />
    </HydrateClient>
  );
}
