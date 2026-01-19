import { api, HydrateClient } from "~/trpc/server";
import { CalendarView } from "./calendar-view";

export default async function CalendarPage() {
  // Get current week range
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);
  endOfWeek.setHours(23, 59, 59, 999);

  // Prefetch data
  const [timeBlocks, tasks] = await Promise.all([
    api.timeBlock.getByDateRange({
      startDate: startOfWeek.toISOString(),
      endDate: endOfWeek.toISOString(),
    }),
    api.task.getByDateRange({
      startDate: startOfWeek.toISOString(),
      endDate: endOfWeek.toISOString(),
    }),
  ]);

  return (
    <HydrateClient>
      <CalendarView
        initialTimeBlocks={timeBlocks}
        initialScheduledTasks={tasks.scheduled}
        initialUnscheduledTasks={tasks.unscheduled}
      />
    </HydrateClient>
  );
}
