import { format, startOfWeek } from "date-fns";
import { api, HydrateClient } from "~/trpc/server";
import { WeekTaskList } from "~/components/week/week-task-list";

export default async function WeekPage() {
  // Get current week start (Sunday)
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 0 });
  const weekStartDate = format(weekStart, "yyyy-MM-dd");

  // Prefetch week tasks
  const weekData = await api.task.getThisWeek({
    weekStartDate,
    includeOverdue: true,
  });

  return (
    <HydrateClient>
      <WeekTaskList initialData={weekData} />
    </HydrateClient>
  );
}
