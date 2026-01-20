"use client";

import { useState, useMemo, useCallback } from "react";
import {
  format,
  setHours,
  setMinutes,
  differenceInMinutes,
  addMinutes,
  isSameDay,
  isToday,
  addDays,
  subDays,
} from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  Circle,
  GripVertical,
  Play,
  MoreHorizontal,
  Calendar,
  Sun,
  ExternalLink,
  Plus,
} from "lucide-react";

import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Checkbox } from "~/components/ui/checkbox";
import { Input } from "~/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { api } from "~/trpc/react";
import type { RouterOutputs } from "~/trpc/react";

// Time grid constants
const HOUR_HEIGHT = 60; // pixels per hour
const START_HOUR = 6; // 6 AM
const END_HOUR = 22; // 10 PM
const TOTAL_HOURS = END_HOUR - START_HOUR;

// Teal accent color from design spec
const TEAL_ACCENT = "#32B8C6";

type TodayTask = RouterOutputs["task"]["getToday"][number];
type TimeBlock = RouterOutputs["timeBlock"]["getByDateRange"][number];
type GoogleCalendarEvent = {
  id: string;
  title: string;
  description: string | null;
  startTime: string;
  endTime: string;
  allDay: boolean;
  location: string | null;
  htmlLink: string | null;
};

interface DailyPlannerProps {
  initialTasks: TodayTask[];
  initialTimeBlocks: TimeBlock[];
  initialCompletedCount: number;
}

export function DailyPlanner({
  initialTasks,
  initialTimeBlocks,
  initialCompletedCount,
}: DailyPlannerProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [isAddingTask, setIsAddingTask] = useState(false);

  const isViewingToday = isToday(selectedDate);

  // Date range for the selected day
  const dayStart = useMemo(() => {
    const d = new Date(selectedDate);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [selectedDate]);

  const dayEnd = useMemo(() => {
    const d = new Date(selectedDate);
    d.setHours(23, 59, 59, 999);
    return d;
  }, [selectedDate]);

  // Fetch tasks for today
  const { data: tasks = initialTasks, refetch: refetchTasks } =
    api.task.getToday.useQuery(
      { includeOverdue: true },
      {
        initialData: initialTasks,
        enabled: isViewingToday,
      },
    );

  // Fetch time blocks
  const { data: timeBlocks = initialTimeBlocks, refetch: refetchTimeBlocks } =
    api.timeBlock.getByDateRange.useQuery(
      {
        startDate: dayStart.toISOString(),
        endDate: dayEnd.toISOString(),
      },
      {
        initialData: initialTimeBlocks,
      },
    );

  // Fetch Google Calendar events
  const { data: googleCalendarStatus } =
    api.googleCalendar.getStatus.useQuery();
  const { data: googleEventsData } = api.googleCalendar.getEvents.useQuery(
    {
      startDate: dayStart.toISOString(),
      endDate: dayEnd.toISOString(),
    },
    {
      enabled:
        googleCalendarStatus?.connected &&
        googleCalendarStatus?.calendarEnabled,
    },
  );

  const googleEvents: GoogleCalendarEvent[] = googleEventsData?.events ?? [];

  // Fetch completed count for today
  const { data: historyData } = api.history.getToday.useQuery(undefined, {
    initialData: {
      tasks: [],
      count: initialCompletedCount,
      totalTimeMinutes: 0,
    },
  });

  const completedCount = historyData?.count ?? initialCompletedCount;

  // Mutations
  const utils = api.useUtils();

  const completeMutation = api.task.complete.useMutation({
    onSuccess: async (completedTask) => {
      void refetchTasks();
      void utils.history.getToday.invalidate();

      // Sync completion status to Google Tasks if enabled
      if (
        googleCalendarStatus?.connected &&
        googleCalendarStatus?.tasksEnabled &&
        completedTask?.id
      ) {
        try {
          await syncToGoogleMutation.mutateAsync({ taskId: completedTask.id });
        } catch (e) {
          console.error("Failed to sync completion to Google Tasks:", e);
        }
      }
    },
  });

  const scheduleMutation = api.task.schedule.useMutation({
    onSuccess: () => {
      void refetchTasks();
      void refetchTimeBlocks();
    },
  });

  const snoozeMutation = api.task.snooze.useMutation({
    onSuccess: () => {
      void refetchTasks();
    },
  });

  // Task creation mutation
  const createTaskMutation = api.task.create.useMutation({
    onSuccess: async (newTask) => {
      void refetchTasks();
      setNewTaskTitle("");
      setIsAddingTask(false);

      // Sync to Google Tasks if enabled
      if (
        googleCalendarStatus?.connected &&
        googleCalendarStatus?.tasksEnabled
      ) {
        try {
          await syncToGoogleMutation.mutateAsync({ taskId: newTask!.id });
        } catch (e) {
          // Silently fail - the task is created locally
          console.error("Failed to sync to Google Tasks:", e);
        }
      }
    },
  });

  // Google Tasks sync mutation
  const syncToGoogleMutation =
    api.googleCalendar.syncTaskToGoogle.useMutation();

  // Separate scheduled and unscheduled tasks
  const { scheduledTasks, unscheduledTasks, nextUpTask } = useMemo(() => {
    const scheduled = tasks.filter((t) => t.scheduledStart);
    const unscheduled = tasks.filter((t) => !t.scheduledStart);
    const nextUp = tasks.find((t) => t.isNextUp);
    return {
      scheduledTasks: scheduled,
      unscheduledTasks: unscheduled,
      nextUpTask: nextUp,
    };
  }, [tasks]);

  // Handle task completion
  const handleComplete = useCallback(
    (taskId: string) => {
      completeMutation.mutate({ id: taskId });
    },
    [completeMutation],
  );

  // Handle snooze to tomorrow
  const handleSnooze = useCallback(
    (taskId: string) => {
      snoozeMutation.mutate({ id: taskId, days: 1 });
    },
    [snoozeMutation],
  );

  // Handle quick task creation
  const handleQuickAdd = useCallback(() => {
    if (!newTaskTitle.trim()) return;

    // Set due date to the selected date
    const dueDate = new Date(selectedDate);
    dueDate.setHours(23, 59, 59, 999);

    createTaskMutation.mutate({
      title: newTaskTitle.trim(),
      dueDate: dueDate.toISOString(),
      priority: "medium",
    });
  }, [newTaskTitle, selectedDate, createTaskMutation]);

  // Handle keyboard submit for quick add
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleQuickAdd();
    }
    if (e.key === "Escape") {
      setIsAddingTask(false);
      setNewTaskTitle("");
    }
  };

  // Handle drag start
  const handleDragStart = (taskId: string) => {
    setDraggedTaskId(taskId);
  };

  // Handle drop on time slot
  const handleDrop = useCallback(
    (hour: number, minute = 0) => {
      if (!draggedTaskId) return;

      const task = tasks.find((t) => t.id === draggedTaskId);
      if (!task) return;

      const scheduledStart = new Date(selectedDate);
      scheduledStart.setHours(hour, minute, 0, 0);

      const duration = task.estimatedMinutes ?? 60;
      const scheduledEnd = addMinutes(scheduledStart, duration);

      scheduleMutation.mutate({
        id: draggedTaskId,
        scheduledStart: scheduledStart.toISOString(),
        scheduledEnd: scheduledEnd.toISOString(),
      });

      setDraggedTaskId(null);
    },
    [draggedTaskId, tasks, selectedDate, scheduleMutation],
  );

  // Navigation
  const goToPreviousDay = () => setSelectedDate((d) => subDays(d, 1));
  const goToNextDay = () => setSelectedDate((d) => addDays(d, 1));
  const goToToday = () => setSelectedDate(new Date());

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Sun className="h-6 w-6 text-amber-500" />
            <div>
              <h1 className="text-2xl font-semibold">
                {isViewingToday ? "Today" : format(selectedDate, "EEEE")}
              </h1>
              <p className="text-muted-foreground text-sm">
                {format(selectedDate, "MMMM d, yyyy")}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Completed count */}
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span>{completedCount} completed today</span>
          </div>

          {/* Date navigation */}
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={goToPreviousDay}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant={isViewingToday ? "default" : "outline"}
              size="sm"
              onClick={goToToday}
            >
              Today
            </Button>
            <Button variant="ghost" size="icon" onClick={goToNextDay}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* All-day Google Calendar events */}
      {googleEvents.filter((e) => e.allDay).length > 0 && (
        <div className="flex items-center gap-2 border-b bg-purple-50 px-6 py-2 dark:bg-purple-950/20">
          <Calendar className="h-4 w-4 text-purple-500" />
          <div className="flex flex-wrap gap-2">
            {googleEvents
              .filter((e) => e.allDay)
              .map((event) => (
                <div
                  key={`allday-${event.id}`}
                  className="flex items-center gap-1 rounded-full border border-purple-300/50 bg-purple-100 px-2 py-0.5 text-xs text-purple-700 dark:border-purple-700/50 dark:bg-purple-900/30 dark:text-purple-300"
                >
                  <span>{event.title}</span>
                  {event.htmlLink && (
                    <a
                      href={event.htmlLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-500 hover:text-purple-700"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Main content - Split view */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Calendar/Time blocks (40%) */}
        <div className="w-[40%] border-r">
          <ScrollArea className="h-full">
            <div
              className="relative"
              style={{ height: TOTAL_HOURS * HOUR_HEIGHT }}
            >
              {/* Hour lines */}
              {Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => (
                <div
                  key={i}
                  className="absolute inset-x-0 flex items-start"
                  style={{ top: i * HOUR_HEIGHT }}
                >
                  <div className="text-muted-foreground w-16 pr-2 text-right text-xs">
                    {format(
                      setHours(setMinutes(new Date(), 0), START_HOUR + i),
                      "h a",
                    )}
                  </div>
                  <div className="border-muted flex-1 border-t" />
                </div>
              ))}

              {/* Droppable hour slots */}
              {Array.from({ length: TOTAL_HOURS }, (_, i) => (
                <div
                  key={`slot-${i}`}
                  className={cn(
                    "absolute right-0 left-16 cursor-pointer transition-colors",
                    draggedTaskId && "hover:bg-primary/10",
                  )}
                  style={{ top: i * HOUR_HEIGHT, height: HOUR_HEIGHT }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "move";
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleDrop(START_HOUR + i);
                  }}
                />
              ))}

              {/* Time blocks */}
              {timeBlocks.map((block) => {
                const blockStart = new Date(block.startTime);
                const blockEnd = new Date(block.endTime);
                if (!isSameDay(blockStart, selectedDate)) return null;

                const startMinutes =
                  (blockStart.getHours() - START_HOUR) * 60 +
                  blockStart.getMinutes();
                const durationMinutes = differenceInMinutes(
                  blockEnd,
                  blockStart,
                );
                const top = (startMinutes / 60) * HOUR_HEIGHT;
                const height = (durationMinutes / 60) * HOUR_HEIGHT;

                return (
                  <div
                    key={block.id}
                    className="absolute right-2 left-18 overflow-hidden rounded-md p-2 text-sm"
                    style={{
                      top: Math.max(0, top),
                      height: Math.max(24, height),
                      backgroundColor: block.color ?? "#3b82f6",
                    }}
                  >
                    <div className="truncate font-medium text-white">
                      {block.title}
                    </div>
                    {height > 36 && (
                      <div className="truncate text-xs text-white/80">
                        {format(blockStart, "h:mm a")} -{" "}
                        {format(blockEnd, "h:mm a")}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Google Calendar events */}
              {googleEvents
                .filter((event) => !event.allDay)
                .map((event) => {
                  const eventStart = new Date(event.startTime);
                  const eventEnd = new Date(event.endTime);
                  if (!isSameDay(eventStart, selectedDate)) return null;

                  const startMinutes =
                    (eventStart.getHours() - START_HOUR) * 60 +
                    eventStart.getMinutes();
                  const durationMinutes = differenceInMinutes(
                    eventEnd,
                    eventStart,
                  );
                  const top = (startMinutes / 60) * HOUR_HEIGHT;
                  const height = (durationMinutes / 60) * HOUR_HEIGHT;

                  return (
                    <div
                      key={`google-${event.id}`}
                      className="absolute right-2 left-18 overflow-hidden rounded-md border border-dashed border-purple-400/50 bg-purple-500/10 p-2 text-sm"
                      style={{
                        top: Math.max(0, top),
                        height: Math.max(24, height),
                      }}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-medium text-purple-700 dark:text-purple-300">
                            {event.title}
                          </div>
                          {height > 36 && (
                            <div className="truncate text-xs text-purple-600/70 dark:text-purple-400/70">
                              {format(eventStart, "h:mm a")} -{" "}
                              {format(eventEnd, "h:mm a")}
                            </div>
                          )}
                          {height > 54 && event.location && (
                            <div className="mt-0.5 truncate text-xs text-purple-600/50 dark:text-purple-400/50">
                              {event.location}
                            </div>
                          )}
                        </div>
                        {event.htmlLink && (
                          <a
                            href={event.htmlLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-500 opacity-50 transition-opacity hover:opacity-100"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}

              {/* Scheduled tasks */}
              {scheduledTasks.map((task) => {
                if (!task.scheduledStart) return null;
                const taskStart = new Date(task.scheduledStart);
                if (!isSameDay(taskStart, selectedDate)) return null;

                const taskEnd = task.scheduledEnd
                  ? new Date(task.scheduledEnd)
                  : addMinutes(taskStart, task.estimatedMinutes ?? 60);

                const startMinutes =
                  (taskStart.getHours() - START_HOUR) * 60 +
                  taskStart.getMinutes();
                const durationMinutes = differenceInMinutes(taskEnd, taskStart);
                const top = (startMinutes / 60) * HOUR_HEIGHT;
                const height = (durationMinutes / 60) * HOUR_HEIGHT;

                const isNextUp = task.isNextUp;

                return (
                  <div
                    key={task.id}
                    className={cn(
                      "absolute right-2 left-18 overflow-hidden rounded-md border p-2 text-sm shadow-sm",
                      isNextUp ? "border-l-4" : "border-l-4",
                    )}
                    style={{
                      top: Math.max(0, top),
                      height: Math.max(32, height),
                      backgroundColor: isNextUp
                        ? `${TEAL_ACCENT}15`
                        : "var(--card)",
                      borderLeftColor: isNextUp
                        ? TEAL_ACCENT
                        : getPriorityColor(task.priority),
                    }}
                  >
                    <div className="flex items-start gap-2">
                      <Checkbox
                        checked={task.status === "completed"}
                        onCheckedChange={() => handleComplete(task.id)}
                        className="mt-0.5"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium">{task.title}</div>
                        {height > 40 && task.project && (
                          <div className="text-muted-foreground truncate text-xs">
                            {task.project.title}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Current time indicator */}
              {isViewingToday && <CurrentTimeIndicator />}
            </div>
          </ScrollArea>
        </div>

        {/* Right: Task list (60%) */}
        <div className="flex w-[60%] flex-col">
          {/* Quick Add Task */}
          <div className="border-b p-4">
            {isAddingTask ? (
              <div className="flex items-center gap-2">
                <Input
                  placeholder="What needs to be done?"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  onKeyDown={handleKeyDown}
                  autoFocus
                  className="flex-1"
                  disabled={createTaskMutation.isPending}
                />
                <Button
                  size="sm"
                  onClick={handleQuickAdd}
                  disabled={
                    !newTaskTitle.trim() || createTaskMutation.isPending
                  }
                >
                  {createTaskMutation.isPending ? "Adding..." : "Add"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setIsAddingTask(false);
                    setNewTaskTitle("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                className="text-muted-foreground w-full justify-start"
                onClick={() => setIsAddingTask(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add a task for{" "}
                {isViewingToday ? "today" : format(selectedDate, "MMM d")}
              </Button>
            )}
          </div>

          {/* Next Up Section */}
          {nextUpTask && (
            <div className="border-b p-4">
              <div className="mb-2 flex items-center gap-2">
                <Play className="h-4 w-4" style={{ color: TEAL_ACCENT }} />
                <span
                  className="text-sm font-medium"
                  style={{ color: TEAL_ACCENT }}
                >
                  Next Up
                </span>
              </div>
              <TaskCard
                task={nextUpTask}
                isNextUp
                onComplete={handleComplete}
                onSnooze={handleSnooze}
                onDragStart={handleDragStart}
              />
            </div>
          )}

          {/* Task List */}
          <ScrollArea className="flex-1">
            <div className="space-y-1 p-4">
              {/* Unscheduled tasks */}
              {unscheduledTasks.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-muted-foreground mb-2 flex items-center gap-2 text-sm font-medium">
                    <Clock className="h-4 w-4" />
                    Unscheduled ({unscheduledTasks.length})
                  </h3>
                  <div className="space-y-1">
                    {unscheduledTasks
                      .filter((t) => !t.isNextUp)
                      .map((task) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          onComplete={handleComplete}
                          onSnooze={handleSnooze}
                          onDragStart={handleDragStart}
                        />
                      ))}
                  </div>
                </div>
              )}

              {/* Scheduled tasks */}
              {scheduledTasks.length > 0 && (
                <div>
                  <h3 className="text-muted-foreground mb-2 flex items-center gap-2 text-sm font-medium">
                    <Calendar className="h-4 w-4" />
                    Scheduled ({scheduledTasks.length})
                  </h3>
                  <div className="space-y-1">
                    {scheduledTasks
                      .filter((t) => !t.isNextUp)
                      .map((task) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          onComplete={handleComplete}
                          onSnooze={handleSnooze}
                          onDragStart={handleDragStart}
                        />
                      ))}
                  </div>
                </div>
              )}

              {/* Empty state */}
              {tasks.length === 0 && (
                <div className="text-muted-foreground py-12 text-center">
                  <Circle className="mx-auto mb-3 h-12 w-12 opacity-20" />
                  <p className="text-lg font-medium">No tasks for today</p>
                  <p className="text-sm">
                    Add tasks or schedule them for today
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}

// Task card component
interface TaskCardProps {
  task: TodayTask;
  isNextUp?: boolean;
  onComplete: (id: string) => void;
  onSnooze: (id: string) => void;
  onDragStart: (id: string) => void;
}

function TaskCard({
  task,
  isNextUp,
  onComplete,
  onSnooze,
  onDragStart,
}: TaskCardProps) {
  const isOverdue =
    task.dueDate &&
    new Date(task.dueDate) < new Date() &&
    !isToday(new Date(task.dueDate));

  return (
    <div
      className={cn(
        "group flex items-start gap-3 rounded-lg border p-3 transition-colors",
        isNextUp && "border-l-4",
        !isNextUp && "hover:bg-muted/50",
      )}
      style={{
        backgroundColor: isNextUp ? `${TEAL_ACCENT}10` : undefined,
        borderLeftColor: isNextUp ? TEAL_ACCENT : undefined,
      }}
      draggable
      onDragStart={() => onDragStart(task.id)}
    >
      {/* Drag handle */}
      <div className="text-muted-foreground cursor-grab opacity-0 transition-opacity group-hover:opacity-100">
        <GripVertical className="h-5 w-5" />
      </div>

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
              {/* Priority */}
              <Badge
                variant="outline"
                className={cn(
                  "text-xs",
                  task.priority === "urgent" && "border-red-500 text-red-500",
                  task.priority === "high" &&
                    "border-orange-500 text-orange-500",
                  task.priority === "medium" &&
                    "border-yellow-500 text-yellow-500",
                  task.priority === "low" && "border-gray-400 text-gray-400",
                )}
              >
                {task.priority}
              </Badge>
              {/* Due date */}
              {task.dueDate && (
                <span
                  className={cn(
                    "text-xs",
                    isOverdue
                      ? "font-medium text-red-500"
                      : "text-muted-foreground",
                  )}
                >
                  {isOverdue ? "Overdue: " : "Due: "}
                  {format(new Date(task.dueDate), "MMM d")}
                </span>
              )}
              {/* Scheduled time */}
              {task.scheduledStart && (
                <span className="text-muted-foreground flex items-center gap-1 text-xs">
                  <Clock className="h-3 w-3" />
                  {format(new Date(task.scheduledStart), "h:mm a")}
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
                <Clock className="mr-2 h-4 w-4" />
                Snooze to tomorrow
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Calendar className="mr-2 h-4 w-4" />
                Schedule...
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}

// Current time indicator
function CurrentTimeIndicator() {
  const now = new Date();
  const minutes = (now.getHours() - START_HOUR) * 60 + now.getMinutes();
  const top = (minutes / 60) * HOUR_HEIGHT;

  if (now.getHours() < START_HOUR || now.getHours() >= END_HOUR) {
    return null;
  }

  return (
    <div
      className="pointer-events-none absolute right-0 left-16 z-20 flex items-center"
      style={{ top }}
    >
      <div className="-ml-1.5 h-3 w-3 rounded-full bg-red-500" />
      <div className="flex-1 border-t-2 border-red-500" />
    </div>
  );
}

// Helper function for priority colors
function getPriorityColor(priority: string): string {
  switch (priority) {
    case "urgent":
      return "#ef4444";
    case "high":
      return "#f97316";
    case "medium":
      return "#eab308";
    case "low":
    default:
      return "#6b7280";
  }
}
