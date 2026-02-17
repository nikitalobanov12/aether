export type TodayLayout = "checklist" | "timeline" | "cards";

const SUPPORTED_LAYOUTS: TodayLayout[] = ["checklist", "timeline", "cards"];

export interface CardLayoutTask {
  id: string;
  title: string;
  priority: string;
  dueDate: Date | string | null;
  scheduledStart: Date | string | null;
  isNextUp: boolean;
}

export interface CardTaskGroups<TTask extends CardLayoutTask> {
  overdue: TTask[];
  nextUp: TTask[];
  scheduled: TTask[];
  highPriority: TTask[];
  backlog: TTask[];
}

export function resolveTodayLayout(value: string | null | undefined): TodayLayout {
  if (!value) {
    return "checklist";
  }

  if (SUPPORTED_LAYOUTS.includes(value as TodayLayout)) {
    return value as TodayLayout;
  }

  return "checklist";
}

export function groupTasksForCards<TTask extends CardLayoutTask>(
  tasks: TTask[],
  now = new Date(),
): CardTaskGroups<TTask> {
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const groups: CardTaskGroups<TTask> = {
    overdue: [],
    nextUp: [],
    scheduled: [],
    highPriority: [],
    backlog: [],
  };

  for (const task of tasks) {
    const dueDate = task.dueDate ? new Date(task.dueDate) : null;
    const isOverdue = Boolean(dueDate && dueDate < todayStart);

    if (isOverdue) {
      groups.overdue.push(task);
      continue;
    }

    if (task.isNextUp) {
      groups.nextUp.push(task);
      continue;
    }

    if (task.scheduledStart) {
      groups.scheduled.push(task);
      continue;
    }

    if (task.priority === "urgent" || task.priority === "high") {
      groups.highPriority.push(task);
      continue;
    }

    groups.backlog.push(task);
  }

  return groups;
}
