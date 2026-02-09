import { format, startOfDay, endOfDay } from "date-fns";

import { api, HydrateClient } from "~/trpc/server";
import { DailyPlanner } from "~/components/planner/daily-planner";

export default async function TodayPage() {
  // Get today's date string in YYYY-MM-DD format
  const today = new Date();
  const dateString = format(today, "yyyy-MM-dd");

  // Get date range for time blocks and events (start of day to end of day)
  const dayStart = startOfDay(today).toISOString();
  const dayEnd = endOfDay(today).toISOString();

  // Prefetch data in parallel
  const [tasks, backlog, historyData, timeBlocks, googleCalendarStatus] =
    await Promise.all([
      api.task.getToday({ dateString, includeOverdue: true }),
      api.task.getBacklog(),
      api.history.getToday(),
      api.timeBlock.getByDateRange({ startDate: dayStart, endDate: dayEnd }),
      api.googleCalendar.getStatus(),
    ]);

  // Conditionally fetch Google Calendar events if connected
  const googleEvents =
    googleCalendarStatus?.connected && googleCalendarStatus?.calendarEnabled
      ? await api.googleCalendar.getEvents({
          startDate: dayStart,
          endDate: dayEnd,
        })
      : { events: [] };

  return (
    <HydrateClient>
      <DailyPlanner
        initialTasks={tasks}
        initialBacklog={backlog}
        initialCompletedCount={historyData.count}
        initialTimeBlocks={timeBlocks}
        initialGoogleEvents={googleEvents.events}
      />
    </HydrateClient>
  );
}
