"use client";

import { useState, useMemo, useCallback } from "react";
import {
  format,
  startOfWeek,
  addWeeks,
  subWeeks,
  addDays,
  isToday,
} from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Circle,
  Clock,
  MoreHorizontal,
  Calendar,
  AlertCircle,
} from "lucide-react";

import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Checkbox } from "~/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";
import { api } from "~/trpc/react";
import { toast } from "~/components/ui/sonner";
import type { RouterOutputs } from "~/trpc/react";

type WeekTasks = RouterOutputs["task"]["getThisWeek"];
type DayTask = WeekTasks["tasksByDay"]["monday"][number];

interface WeekTaskListProps {
  initialData: WeekTasks;
}

const DAY_NAMES = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

export function WeekTaskList({ initialData }: WeekTaskListProps) {
  const [weekStart, setWeekStart] = useState(() => {
    const now = new Date();
    return startOfWeek(now, { weekStartsOn: 0 }); // Sunday start
  });

  // Format weekStartDate for API
  const weekStartDate = useMemo(() => {
    return format(weekStart, "yyyy-MM-dd");
  }, [weekStart]);

  // Fetch week tasks
  const { data: weekData = initialData } = api.task.getThisWeek.useQuery(
    { weekStartDate, includeOverdue: true },
    { initialData },
  );

  // Mutations
  const utils = api.useUtils();

  // Helper to remove task from week data optimistically
  const removeTaskFromWeekData = (
    taskId: string,
    data: WeekTasks | undefined,
  ): WeekTasks | undefined => {
    if (!data) return data;
    return {
      ...data,
      overdue: data.overdue.filter((t) => t.id !== taskId),
      tasksByDay: {
        sunday: (data.tasksByDay.sunday ?? []).filter((t) => t.id !== taskId),
        monday: (data.tasksByDay.monday ?? []).filter((t) => t.id !== taskId),
        tuesday: (data.tasksByDay.tuesday ?? []).filter((t) => t.id !== taskId),
        wednesday: (data.tasksByDay.wednesday ?? []).filter(
          (t) => t.id !== taskId,
        ),
        thursday: (data.tasksByDay.thursday ?? []).filter(
          (t) => t.id !== taskId,
        ),
        friday: (data.tasksByDay.friday ?? []).filter((t) => t.id !== taskId),
        saturday: (data.tasksByDay.saturday ?? []).filter(
          (t) => t.id !== taskId,
        ),
      },
    };
  };

  const completeMutation = api.task.complete.useMutation({
    onMutate: async ({ id }) => {
      await utils.task.getThisWeek.cancel();

      const previousData = utils.task.getThisWeek.getData({
        weekStartDate,
        includeOverdue: true,
      });

      // Optimistically remove the task
      utils.task.getThisWeek.setData(
        { weekStartDate, includeOverdue: true },
        (old) => removeTaskFromWeekData(id, old),
      );

      return { previousData };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousData) {
        utils.task.getThisWeek.setData(
          { weekStartDate, includeOverdue: true },
          context.previousData,
        );
      }
      toast.error("Failed to complete task");
    },
    onSuccess: (completedTask) => {
      void utils.task.getToday.invalidate();

      if (completedTask) {
        toast.success("Task completed!", {
          description: completedTask.title,
          action: {
            label: "Undo",
            onClick: () => uncompleteMutation.mutate({ id: completedTask.id }),
          },
          duration: 5000,
        });
      }
    },
    onSettled: () => {
      void utils.task.getThisWeek.invalidate();
    },
  });

  const uncompleteMutation = api.task.uncomplete.useMutation({
    onSuccess: () => {
      void utils.task.getThisWeek.invalidate();
      void utils.task.getToday.invalidate();
      toast.info("Task restored");
    },
  });

  const snoozeMutation = api.task.snooze.useMutation({
    onMutate: async ({ id }) => {
      await utils.task.getThisWeek.cancel();

      const previousData = utils.task.getThisWeek.getData({
        weekStartDate,
        includeOverdue: true,
      });

      // Optimistically remove the task (it moves to tomorrow)
      utils.task.getThisWeek.setData(
        { weekStartDate, includeOverdue: true },
        (old) => removeTaskFromWeekData(id, old),
      );

      return { previousData };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousData) {
        utils.task.getThisWeek.setData(
          { weekStartDate, includeOverdue: true },
          context.previousData,
        );
      }
      toast.error("Failed to snooze task");
    },
    onSuccess: () => {
      toast.info("Task snoozed");
    },
    onSettled: () => {
      void utils.task.getThisWeek.invalidate();
    },
  });

  const deleteMutation = api.task.delete.useMutation({
    onMutate: async ({ id }) => {
      await utils.task.getThisWeek.cancel();

      const previousData = utils.task.getThisWeek.getData({
        weekStartDate,
        includeOverdue: true,
      });

      // Optimistically remove the task
      utils.task.getThisWeek.setData(
        { weekStartDate, includeOverdue: true },
        (old) => removeTaskFromWeekData(id, old),
      );

      return { previousData };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousData) {
        utils.task.getThisWeek.setData(
          { weekStartDate, includeOverdue: true },
          context.previousData,
        );
      }
      toast.error("Failed to delete task");
    },
    onSuccess: () => {
      toast.success("Task deleted");
    },
    onSettled: () => {
      void utils.task.getThisWeek.invalidate();
    },
  });

  // Navigation
  const goToPreviousWeek = () => setWeekStart((d) => subWeeks(d, 1));
  const goToNextWeek = () => setWeekStart((d) => addWeeks(d, 1));
  const goToCurrentWeek = () =>
    setWeekStart(startOfWeek(new Date(), { weekStartsOn: 0 }));

  const isCurrentWeek = useMemo(() => {
    const currentWeekStart = startOfWeek(new Date(), { weekStartsOn: 0 });
    return weekStart.getTime() === currentWeekStart.getTime();
  }, [weekStart]);

  const weekEnd = addDays(weekStart, 6);

  // Handlers
  const handleComplete = useCallback(
    (taskId: string) => {
      completeMutation.mutate({ id: taskId });
    },
    [completeMutation],
  );

  const handleSnooze = useCallback(
    (taskId: string) => {
      snoozeMutation.mutate({ id: taskId, days: 1 });
    },
    [snoozeMutation],
  );

  const handleDelete = useCallback(
    (taskId: string) => {
      deleteMutation.mutate({ id: taskId });
    },
    [deleteMutation],
  );

  // Calculate total tasks for the week
  const totalTasks = useMemo(() => {
    return DAY_NAMES.reduce(
      (sum, day) => sum + (weekData.tasksByDay[day]?.length ?? 0),
      0,
    );
  }, [weekData.tasksByDay]);

  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-3">
          <Calendar className="h-6 w-6 text-blue-500" />
          <div>
            <h1 className="text-xl font-semibold sm:text-2xl">This Week</h1>
            <p className="text-muted-foreground text-sm">
              {format(weekStart, "MMMM d")} - {format(weekEnd, "MMMM d, yyyy")}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 sm:justify-end">
          {/* Task count */}
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <CheckCircle2 className="h-4 w-4" />
            <span>{totalTasks} tasks</span>
          </div>

          {/* Week navigation */}
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={goToPreviousWeek}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant={isCurrentWeek ? "default" : "outline"}
              size="sm"
              onClick={goToCurrentWeek}
            >
              This Week
            </Button>
            <Button variant="ghost" size="icon" onClick={goToNextWeek}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <ScrollArea className="flex-1">
        <div className="space-y-4 px-4 py-4 sm:px-6">
          {/* Overdue Section */}
          {weekData.overdue.length > 0 && (
            <Collapsible defaultOpen>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="text-destructive hover:text-destructive w-full justify-start gap-2 font-medium"
                >
                  <AlertCircle className="h-4 w-4" />
                  Overdue ({weekData.overdue.length})
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 space-y-2">
                {weekData.overdue.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    isOverdue
                    onComplete={handleComplete}
                    onSnooze={handleSnooze}
                    onDelete={handleDelete}
                  />
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Day sections */}
          {DAY_NAMES.map((dayName, index) => {
            const date = addDays(weekStart, index);
            const tasks = weekData.tasksByDay[dayName] ?? [];
            const isTodayDate = isToday(date);
            const isPast = date < new Date() && !isTodayDate;

            return (
              <DaySection
                key={dayName}
                dayName={dayName}
                date={date}
                tasks={tasks}
                isToday={isTodayDate}
                isPast={isPast}
                onComplete={handleComplete}
                onSnooze={handleSnooze}
                onDelete={handleDelete}
              />
            );
          })}

          {/* Empty state */}
          {totalTasks === 0 && weekData.overdue.length === 0 && (
            <div className="text-muted-foreground py-12 text-center">
              <Circle className="mx-auto mb-3 h-12 w-12 opacity-20" />
              <p className="text-lg font-medium">No tasks this week</p>
              <p className="text-sm">Tasks with due dates will appear here</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

// Day section component
interface DaySectionProps {
  dayName: string;
  date: Date;
  tasks: DayTask[];
  isToday: boolean;
  isPast: boolean;
  onComplete: (id: string) => void;
  onSnooze: (id: string) => void;
  onDelete: (id: string) => void;
}

function DaySection({
  dayName,
  date,
  tasks,
  isToday: isTodayDate,
  isPast,
  onComplete,
  onSnooze,
  onDelete,
}: DaySectionProps) {
  const [isOpen, setIsOpen] = useState(true);

  // Don't render past days with no tasks
  if (isPast && tasks.length === 0) {
    return null;
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start gap-2 font-medium",
            isTodayDate && "text-primary",
            isPast && "text-muted-foreground",
          )}
        >
          <span className="capitalize">{isTodayDate ? "Today" : dayName}</span>
          <span className="text-muted-foreground font-normal">
            {format(date, "MMM d")}
          </span>
          {tasks.length > 0 && (
            <Badge
              variant={isTodayDate ? "default" : "secondary"}
              className="ml-auto"
            >
              {tasks.length}
            </Badge>
          )}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2 space-y-2">
        {tasks.length === 0 ? (
          <div className="text-muted-foreground py-2 pl-4 text-sm">
            No tasks
          </div>
        ) : (
          tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onComplete={onComplete}
              onSnooze={onSnooze}
              onDelete={onDelete}
            />
          ))
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

// Task item component
interface TaskItemProps {
  task: DayTask;
  isOverdue?: boolean;
  onComplete: (id: string) => void;
  onSnooze: (id: string) => void;
  onDelete: (id: string) => void;
}

function TaskItem({
  task,
  isOverdue,
  onComplete,
  onSnooze,
  onDelete,
}: TaskItemProps) {
  return (
    <div
      className={cn(
        "group flex items-start gap-3 rounded-lg border p-3 transition-colors",
        "hover:bg-muted/50",
        isOverdue && "border-red-500/30 bg-red-500/5",
      )}
    >
      {/* Checkbox */}
      <Checkbox
        checked={task.status === "completed"}
        onCheckedChange={() => onComplete(task.id)}
        className="mt-0.5"
      />

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p
              className={cn(
                "font-medium",
                task.status === "completed" &&
                  "text-muted-foreground line-through",
              )}
            >
              {task.title}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              {/* Project */}
              {task.project && (
                <Badge variant="secondary" className="text-xs">
                  {task.project.title}
                </Badge>
              )}
              {/* Priority - only show if not medium */}
              {task.priority !== "medium" && (
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs",
                    task.priority === "urgent" && "border-red-500 text-red-500",
                    task.priority === "high" &&
                      "border-orange-500 text-orange-500",
                    task.priority === "low" && "border-gray-400 text-gray-400",
                  )}
                >
                  {task.priority}
                </Badge>
              )}
              {/* Overdue badge */}
              {isOverdue && (
                <Badge variant="destructive" className="text-xs">
                  Overdue
                </Badge>
              )}
              {/* Scheduled time */}
              {task.scheduledStart && (
                <span className="text-muted-foreground flex items-center gap-1 text-xs">
                  <Clock className="h-3 w-3" />
                  {format(new Date(task.scheduledStart), "h:mm a")}
                </span>
              )}
              {/* Due date for overdue tasks */}
              {isOverdue && task.dueDate && (
                <span className="text-destructive text-xs">
                  Due {format(new Date(task.dueDate), "MMM d")}
                </span>
              )}
              {/* Estimated time */}
              {task.estimatedMinutes && (
                <span className="text-muted-foreground text-xs">
                  ~{task.estimatedMinutes}m
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onComplete(task.id)}>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Complete
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSnooze(task.id)}>
                <Calendar className="mr-2 h-4 w-4" />
                Snooze to tomorrow
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(task.id)}
                className="text-destructive"
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
