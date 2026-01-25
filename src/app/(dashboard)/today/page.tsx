import { format } from "date-fns";

import { api, HydrateClient } from "~/trpc/server";
import { DailyPlanner } from "~/components/planner/daily-planner";

export default async function TodayPage() {
  // Get today's date string in YYYY-MM-DD format
  const today = new Date();
  const dateString = format(today, "yyyy-MM-dd");

  // Prefetch data in parallel
  const [tasks, backlog, historyData] = await Promise.all([
    api.task.getToday({ dateString, includeOverdue: true }),
    api.task.getBacklog(),
    api.history.getToday(),
  ]);

  return (
    <HydrateClient>
      <DailyPlanner
        initialTasks={tasks}
        initialBacklog={backlog}
        initialCompletedCount={historyData.count}
      />
    </HydrateClient>
  );
}
