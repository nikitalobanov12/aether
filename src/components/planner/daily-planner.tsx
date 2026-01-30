"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import {
  format,
  isToday,
  addDays,
  subDays,
  startOfDay,
  endOfDay,
  differenceInMinutes,
} from "date-fns";
import { useKeyboardNavigation } from "~/hooks/use-keyboard-navigation";
import { useSwipeGesture } from "~/hooks/use-swipe-gesture";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Circle,
  GripVertical,
  MoreHorizontal,
  Calendar,
  Sun,
  Plus,
  Inbox,
  Clock,
  ExternalLink,
  MapPin,
  Play,
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "~/components/ui/sheet";
import { Separator } from "~/components/ui/separator";
import { api } from "~/trpc/react";
import { toast } from "~/components/ui/sonner";
import { TaskDetailModal } from "~/components/tasks/task-detail-modal";
import type { RouterOutputs } from "~/trpc/react";

type TodayTask = RouterOutputs["task"]["getToday"][number];
type BacklogTask = RouterOutputs["task"]["getBacklog"][number];
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

// Union type for agenda items
type AgendaItem =
  | { type: "task"; data: TodayTask }
  | { type: "timeBlock"; data: TimeBlock }
  | { type: "googleEvent"; data: GoogleCalendarEvent };

interface DailyPlannerProps {
  initialTasks: TodayTask[];
  initialBacklog: BacklogTask[];
  initialCompletedCount: number;
  initialTimeBlocks?: TimeBlock[];
  initialGoogleEvents?: GoogleCalendarEvent[];
}

export function DailyPlanner({
  initialTasks,
  initialBacklog,
  initialCompletedCount,
  initialTimeBlocks = [],
  initialGoogleEvents = [],
}: DailyPlannerProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [backlogOpen, setBacklogOpen] = useState(false);

  // Event detail sheet state
  const [selectedEvent, setSelectedEvent] = useState<AgendaItem | null>(null);
  const [isEventSheetOpen, setIsEventSheetOpen] = useState(false);

  // Task detail modal state
  const [selectedTask, setSelectedTask] = useState<TodayTask | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  const isViewingToday = isToday(selectedDate);

  // Format dateString for API calls (YYYY-MM-DD)
  const dateString = useMemo(() => {
    return format(selectedDate, "yyyy-MM-dd");
  }, [selectedDate]);

  // Date range for time blocks and events
  const dayStart = useMemo(
    () => startOfDay(selectedDate).toISOString(),
    [selectedDate],
  );
  const dayEnd = useMemo(
    () => endOfDay(selectedDate).toISOString(),
    [selectedDate],
  );

  // Fetch tasks for selected day
  const { data: tasks = initialTasks } = api.task.getToday.useQuery(
    { dateString, includeOverdue: true },
    {
      initialData: isViewingToday ? initialTasks : undefined,
    },
  );

  // Fetch backlog tasks
  const { data: backlogTasks = initialBacklog } = api.task.getBacklog.useQuery(
    undefined,
    {
      initialData: initialBacklog,
    },
  );

  // Fetch completed count for today
  const { data: historyData } = api.history.getToday.useQuery(undefined, {
    initialData: {
      tasks: [],
      count: initialCompletedCount,
      totalTimeMinutes: 0,
    },
  });

  // Fetch time blocks for selected day
  const { data: timeBlocks = initialTimeBlocks } =
    api.timeBlock.getByDateRange.useQuery(
      { startDate: dayStart, endDate: dayEnd },
      {
        initialData: isViewingToday ? initialTimeBlocks : undefined,
      },
    );

  // Fetch Google Calendar status and events
  const { data: googleCalendarStatus } =
    api.googleCalendar.getStatus.useQuery();
  const { data: googleEventsData } = api.googleCalendar.getEvents.useQuery(
    { startDate: dayStart, endDate: dayEnd },
    {
      enabled:
        googleCalendarStatus?.connected &&
        googleCalendarStatus?.calendarEnabled,
      initialData: isViewingToday
        ? { events: initialGoogleEvents, connected: true }
        : undefined,
    },
  );

  const googleEvents: GoogleCalendarEvent[] = useMemo(
    () => googleEventsData?.events ?? [],
    [googleEventsData?.events],
  );

  const completedCount = historyData?.count ?? initialCompletedCount;

  // Mutations
  const utils = api.useUtils();

  const completeMutation = api.task.complete.useMutation({
    onMutate: async ({ id }) => {
      // Cancel outgoing refetches
      await utils.task.getToday.cancel();

      // Snapshot the previous value
      const previousTasks = utils.task.getToday.getData({
        dateString,
        includeOverdue: true,
      });

      // Optimistically remove the task from the list (it's completed)
      utils.task.getToday.setData({ dateString, includeOverdue: true }, (old) =>
        old?.filter((t) => t.id !== id),
      );

      return { previousTasks };
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousTasks) {
        utils.task.getToday.setData(
          { dateString, includeOverdue: true },
          context.previousTasks,
        );
      }
      toast.error("Failed to complete task");
    },
    onSuccess: (completedTask) => {
      void utils.history.getToday.invalidate();

      // Show undo toast
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
      // Refetch to ensure consistency
      void utils.task.getToday.invalidate();
    },
  });

  const uncompleteMutation = api.task.uncomplete.useMutation({
    onSuccess: () => {
      void utils.task.getToday.invalidate();
      void utils.history.getToday.invalidate();
      toast.info("Task restored");
    },
  });

  const snoozeMutation = api.task.snooze.useMutation({
    onMutate: async ({ id }) => {
      await utils.task.getToday.cancel();

      const previousTasks = utils.task.getToday.getData({
        dateString,
        includeOverdue: true,
      });

      // Optimistically remove the task (it's snoozed to tomorrow)
      utils.task.getToday.setData({ dateString, includeOverdue: true }, (old) =>
        old?.filter((t) => t.id !== id),
      );

      return { previousTasks };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousTasks) {
        utils.task.getToday.setData(
          { dateString, includeOverdue: true },
          context.previousTasks,
        );
      }
      toast.error("Failed to snooze task");
    },
    onSuccess: () => {
      toast.info("Task snoozed to tomorrow");
    },
    onSettled: () => {
      void utils.task.getToday.invalidate();
    },
  });

  const deleteMutation = api.task.delete.useMutation({
    onMutate: async ({ id }) => {
      await Promise.all([
        utils.task.getToday.cancel(),
        utils.task.getBacklog.cancel(),
      ]);

      const previousTasks = utils.task.getToday.getData({
        dateString,
        includeOverdue: true,
      });
      const previousBacklog = utils.task.getBacklog.getData();

      // Optimistically remove from both lists
      utils.task.getToday.setData({ dateString, includeOverdue: true }, (old) =>
        old?.filter((t) => t.id !== id),
      );
      utils.task.getBacklog.setData(undefined, (old) =>
        old?.filter((t) => t.id !== id),
      );

      return { previousTasks, previousBacklog };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousTasks) {
        utils.task.getToday.setData(
          { dateString, includeOverdue: true },
          context.previousTasks,
        );
      }
      if (context?.previousBacklog) {
        utils.task.getBacklog.setData(undefined, context.previousBacklog);
      }
      toast.error("Failed to delete task");
    },
    onSuccess: () => {
      toast.success("Task deleted");
    },
    onSettled: () => {
      void utils.task.getToday.invalidate();
      void utils.task.getBacklog.invalidate();
    },
  });

  const setNextUpMutation = api.task.setNextUp.useMutation({
    onSuccess: () => {
      toast.success("Task set as Next Up");
    },
    onError: () => {
      toast.error("Failed to set Next Up");
    },
    onSettled: () => {
      void utils.task.getToday.invalidate();
    },
  });

  const createTaskMutation = api.task.create.useMutation({
    onMutate: async (newTaskInput) => {
      await utils.task.getToday.cancel();

      const previousTasks = utils.task.getToday.getData({
        dateString,
        includeOverdue: true,
      });

      // Create an optimistic task with all required fields
      const optimisticTask: TodayTask = {
        id: `temp-${Date.now()}`,
        title: newTaskInput.title,
        description: null,
        status: "todo",
        priority: newTaskInput.priority ?? "medium",
        dueDate: newTaskInput.dueDateString
          ? new Date(newTaskInput.dueDateString + "T23:59:59.999Z")
          : null,
        scheduledStart: null,
        scheduledEnd: null,
        estimatedMinutes: null,
        actualMinutes: null,
        tags: null,
        boardId: null,
        projectId: null,
        goalId: null,
        parentTaskId: null,
        habitName: null,
        sortOrder: 0,
        nextUpOrder: null,
        archived: false,
        completedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: "",
        project: null,
        goal: null,
        subtasks: [],
        isNextUp: false,
        // Google sync fields
        isRecurring: false,
        recurrenceRule: null,
        googleEventId: null,
        googleCalendarId: null,
        googleTasksId: null,
        googleTasksListId: null,
        lastSyncedAt: null,
      };

      // Add to the list
      utils.task.getToday.setData(
        { dateString, includeOverdue: true },
        (old) => (old ? [optimisticTask, ...old] : [optimisticTask]),
      );

      return { previousTasks };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousTasks) {
        utils.task.getToday.setData(
          { dateString, includeOverdue: true },
          context.previousTasks,
        );
      }
      toast.error("Failed to create task");
    },
    onSuccess: () => {
      setNewTaskTitle("");
      setIsAddingTask(false);
      toast.success("Task added");
    },
    onSettled: () => {
      void utils.task.getToday.invalidate();
    },
  });

  const addToDayMutation = api.task.addToDay.useMutation({
    onMutate: async ({ id }) => {
      await Promise.all([
        utils.task.getToday.cancel(),
        utils.task.getBacklog.cancel(),
      ]);

      const previousTasks = utils.task.getToday.getData({
        dateString,
        includeOverdue: true,
      });
      const previousBacklog = utils.task.getBacklog.getData();

      // Find the task in backlog
      const taskToMove = previousBacklog?.find((t) => t.id === id);

      if (taskToMove) {
        // Remove from backlog
        utils.task.getBacklog.setData(undefined, (old) =>
          old?.filter((t) => t.id !== id),
        );

        // Add to today's tasks with updated due date
        const movedTask: TodayTask = {
          ...taskToMove,
          dueDate: new Date(dateString + "T23:59:59.999Z"),
          isNextUp: false,
        };
        utils.task.getToday.setData(
          { dateString, includeOverdue: true },
          (old) => (old ? [...old, movedTask] : [movedTask]),
        );
      }

      return { previousTasks, previousBacklog };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousTasks) {
        utils.task.getToday.setData(
          { dateString, includeOverdue: true },
          context.previousTasks,
        );
      }
      if (context?.previousBacklog) {
        utils.task.getBacklog.setData(undefined, context.previousBacklog);
      }
      toast.error("Failed to add task to today");
    },
    onSuccess: () => {
      toast.success("Task added to today");
    },
    onSettled: () => {
      void utils.task.getToday.invalidate();
      void utils.task.getBacklog.invalidate();
    },
  });

  // Sort tasks: overdue first (red), then by priority
  const sortedTasks = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    return [...tasks].sort((a, b) => {
      // Overdue tasks first
      const aOverdue = a.dueDate && new Date(a.dueDate) < now;
      const bOverdue = b.dueDate && new Date(b.dueDate) < now;
      if (aOverdue && !bOverdue) return -1;
      if (!aOverdue && bOverdue) return 1;

      // Then by priority
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      return (
        (priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2)
      );
    });
  }, [tasks]);

  // Build agenda items: merge scheduled tasks, time blocks, and Google events
  // Sort by start time, keeping unscheduled tasks separate
  const { scheduledItems, unscheduledTasks } = useMemo(() => {
    const scheduled: AgendaItem[] = [];
    const unscheduled: TodayTask[] = [];

    // Categorize tasks
    for (const task of sortedTasks) {
      if (task.scheduledStart) {
        scheduled.push({ type: "task", data: task });
      } else {
        unscheduled.push(task);
      }
    }

    // Add time blocks
    for (const block of timeBlocks) {
      scheduled.push({ type: "timeBlock", data: block });
    }

    // Add Google Calendar events (excluding all-day events for now)
    for (const event of googleEvents) {
      if (!event.allDay) {
        scheduled.push({ type: "googleEvent", data: event });
      }
    }

    // Sort scheduled items by start time
    scheduled.sort((a, b) => {
      const getStartTime = (item: AgendaItem): Date => {
        switch (item.type) {
          case "task":
            return new Date(item.data.scheduledStart!);
          case "timeBlock":
            return new Date(item.data.startTime);
          case "googleEvent":
            return new Date(item.data.startTime);
        }
      };
      return getStartTime(a).getTime() - getStartTime(b).getTime();
    });

    return { scheduledItems: scheduled, unscheduledTasks: unscheduled };
  }, [sortedTasks, timeBlocks, googleEvents]);

  // All-day events (Google Calendar)
  const allDayEvents = useMemo(() => {
    return googleEvents.filter((event) => event.allDay);
  }, [googleEvents]);

  // Handle event click to open detail sheet (for non-task items)
  const handleEventClick = useCallback((item: AgendaItem) => {
    if (item.type === "task") {
      // Open task modal instead of sheet
      setSelectedTask(item.data);
      setIsTaskModalOpen(true);
    } else {
      // Open sheet for time blocks and Google events
      setSelectedEvent(item);
      setIsEventSheetOpen(true);
    }
  }, []);

  // Handle task click to open modal
  const handleTaskClick = useCallback((task: TodayTask) => {
    setSelectedTask(task);
    setIsTaskModalOpen(true);
  }, []);

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

  // Handle delete
  const handleDelete = useCallback(
    (taskId: string) => {
      deleteMutation.mutate({ id: taskId });
    },
    [deleteMutation],
  );

  // Handle set as Next Up
  const handleSetNextUp = useCallback(
    (taskId: string) => {
      setNextUpMutation.mutate({ id: taskId });
    },
    [setNextUpMutation],
  );

  // Handle quick task creation
  const handleQuickAdd = useCallback(() => {
    if (!newTaskTitle.trim()) return;

    // Use dateString directly - server will set dueDate to end of day (UTC)
    // This avoids timezone issues where local end-of-day converts to wrong UTC day
    createTaskMutation.mutate({
      title: newTaskTitle.trim(),
      dueDateString: dateString,
      priority: "medium",
    });
  }, [newTaskTitle, dateString, createTaskMutation]);

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

  // Handle adding backlog task to today
  const handleAddToToday = useCallback(
    (taskId: string) => {
      addToDayMutation.mutate({ id: taskId, dateString });
    },
    [addToDayMutation, dateString],
  );

  // Handle drag and drop from backlog
  const handleDragStart = (
    e: React.DragEvent,
    taskId: string,
    source: "backlog" | "today",
  ) => {
    e.dataTransfer.setData("taskId", taskId);
    e.dataTransfer.setData("source", source);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId");
    const source = e.dataTransfer.getData("source");

    if (taskId && source === "backlog") {
      handleAddToToday(taskId);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  // Navigation
  const goToPreviousDay = () => setSelectedDate((d) => subDays(d, 1));
  const goToNextDay = () => setSelectedDate((d) => addDays(d, 1));
  const goToToday = () => setSelectedDate(new Date());

  // Task IDs for keyboard navigation
  const taskIds = useMemo(() => sortedTasks.map((t) => t.id), [sortedTasks]);

  // Track refs for scrolling selected items into view
  const taskRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Keyboard navigation
  const { selectedId, isSelected, setSelectedId } = useKeyboardNavigation({
    items: taskIds,
    enabled: !isAddingTask,
    onComplete: handleComplete,
    onDelete: handleDelete,
    onAdd: () => setIsAddingTask(true),
  });

  // Scroll selected task into view
  useEffect(() => {
    if (selectedId) {
      const element = taskRefs.current.get(selectedId);
      element?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [selectedId]);

  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-3">
          <Sun className="h-6 w-6 text-amber-500" />
          <div>
            <h1 className="text-xl font-semibold sm:text-2xl">
              {isViewingToday ? "Today" : format(selectedDate, "EEEE")}
            </h1>
            <p className="text-muted-foreground text-sm">
              {format(selectedDate, "MMMM d, yyyy")}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 sm:justify-end">
          {/* Completed count */}
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span>{completedCount} done</span>
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

      {/* Main content */}
      <ScrollArea className="flex-1">
        <div
          className="space-y-4 px-4 py-4 sm:px-6"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          {/* Quick Add Task */}
          <div>
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

          {/* All-day events */}
          {allDayEvents.length > 0 && (
            <div className="space-y-2">
              <p className="text-muted-foreground text-xs font-medium uppercase">
                All Day
              </p>
              {allDayEvents.map((event) => (
                <button
                  key={event.id}
                  type="button"
                  className="bg-muted/50 hover:bg-muted flex w-full items-center gap-2 rounded-lg border border-purple-500/30 p-2 text-left transition-colors"
                  onClick={() =>
                    handleEventClick({ type: "googleEvent", data: event })
                  }
                >
                  <div className="h-2 w-2 rounded-full bg-purple-500" />
                  <span className="text-sm font-medium">{event.title}</span>
                  <Badge variant="secondary" className="ml-auto text-xs">
                    Google
                  </Badge>
                </button>
              ))}
            </div>
          )}

          {/* Scheduled Agenda - Time-based events */}
          {scheduledItems.length > 0 && (
            <div className="space-y-2">
              <p className="text-muted-foreground text-xs font-medium uppercase">
                Schedule
              </p>
              {scheduledItems.map((item) => (
                <AgendaItemCard
                  key={getAgendaItemKey(item)}
                  item={item}
                  onClick={() => handleEventClick(item)}
                  onComplete={
                    item.type === "task"
                      ? () => handleComplete(item.data.id)
                      : undefined
                  }
                />
              ))}
            </div>
          )}

          {/* Unscheduled Tasks */}
          <div className="space-y-2">
            {unscheduledTasks.length > 0 && (
              <p className="text-muted-foreground text-xs font-medium uppercase">
                Tasks
              </p>
            )}
            {unscheduledTasks.length === 0 && scheduledItems.length === 0 ? (
              <div className="text-muted-foreground py-12 text-center">
                <Circle className="mx-auto mb-3 h-12 w-12 opacity-20" />
                <p className="text-lg font-medium">
                  No tasks for {isViewingToday ? "today" : "this day"}
                </p>
                <p className="text-sm">
                  Add tasks above or drag from backlog below
                </p>
              </div>
            ) : (
              unscheduledTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  isSelected={isSelected(task.id)}
                  onComplete={handleComplete}
                  onSnooze={handleSnooze}
                  onDelete={handleDelete}
                  onSetNextUp={handleSetNextUp}
                  onDragStart={(e) => handleDragStart(e, task.id, "today")}
                  onSelect={() => setSelectedId(task.id)}
                  onClick={() => handleTaskClick(task)}
                  refCallback={(el) => {
                    if (el) {
                      taskRefs.current.set(task.id, el);
                    } else {
                      taskRefs.current.delete(task.id);
                    }
                  }}
                />
              ))
            )}
          </div>

          {/* Backlog Section */}
          <Collapsible open={backlogOpen} onOpenChange={setBacklogOpen}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="text-muted-foreground hover:text-foreground w-full justify-between"
              >
                <div className="flex items-center gap-2">
                  <Inbox className="h-4 w-4" />
                  <span>Backlog ({backlogTasks.length})</span>
                </div>
                {backlogOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 space-y-2">
              {backlogTasks.length === 0 ? (
                <div className="text-muted-foreground py-4 text-center text-sm">
                  No tasks in backlog
                </div>
              ) : (
                backlogTasks.map((task) => (
                  <BacklogItem
                    key={task.id}
                    task={task}
                    onAddToToday={() => handleAddToToday(task.id)}
                    onDelete={handleDelete}
                    onDragStart={(e) => handleDragStart(e, task.id, "backlog")}
                  />
                ))
              )}
            </CollapsibleContent>
          </Collapsible>
        </div>
      </ScrollArea>

      {/* Event Detail Sheet - for time blocks and Google events */}
      <Sheet open={isEventSheetOpen} onOpenChange={setIsEventSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          {selectedEvent && (
            <EventDetailContent
              event={selectedEvent}
              onComplete={
                selectedEvent.type === "task"
                  ? () => {
                      handleComplete(selectedEvent.data.id);
                      setIsEventSheetOpen(false);
                    }
                  : undefined
              }
            />
          )}
        </SheetContent>
      </Sheet>

      {/* Task Detail Modal */}
      <TaskDetailModal
        task={selectedTask}
        open={isTaskModalOpen}
        onOpenChange={setIsTaskModalOpen}
        onComplete={handleComplete}
        onSnooze={handleSnooze}
        onDelete={handleDelete}
      />
    </div>
  );
}

// Helper to generate unique keys for agenda items
function getAgendaItemKey(item: AgendaItem): string {
  switch (item.type) {
    case "task":
      return `task-${item.data.id}`;
    case "timeBlock":
      return `block-${item.data.id}`;
    case "googleEvent":
      return `google-${item.data.id}`;
  }
}

// Agenda item card component
interface AgendaItemCardProps {
  item: AgendaItem;
  onClick: () => void;
  onComplete?: () => void;
}

function AgendaItemCard({ item, onClick, onComplete }: AgendaItemCardProps) {
  const getTimeRange = (): { start: Date; end: Date } => {
    switch (item.type) {
      case "task":
        return {
          start: new Date(item.data.scheduledStart!),
          end: item.data.scheduledEnd
            ? new Date(item.data.scheduledEnd)
            : new Date(item.data.scheduledStart!),
        };
      case "timeBlock":
        return {
          start: new Date(item.data.startTime),
          end: new Date(item.data.endTime),
        };
      case "googleEvent":
        return {
          start: new Date(item.data.startTime),
          end: new Date(item.data.endTime),
        };
    }
  };

  const { start, end } = getTimeRange();
  const duration = differenceInMinutes(end, start);

  // Get color based on item type
  const getColor = (): string => {
    switch (item.type) {
      case "task":
        return "#10b981"; // green for tasks
      case "timeBlock":
        return item.data.color ?? "#3b82f6"; // use block color or blue
      case "googleEvent":
        return "#8b5cf6"; // purple for Google events
    }
  };

  const color = getColor();

  return (
    <button
      type="button"
      className={cn(
        "group flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors",
        "hover:bg-muted/50",
      )}
      style={{ borderLeftColor: color, borderLeftWidth: "3px" }}
      onClick={onClick}
    >
      {/* Time column */}
      <div className="text-muted-foreground w-16 shrink-0 text-sm">
        <div>{format(start, "h:mm a")}</div>
        {duration > 0 && (
          <div className="text-xs opacity-60">{duration}min</div>
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <p className="font-medium">
            {item.type === "task"
              ? item.data.title
              : item.type === "timeBlock"
                ? item.data.title
                : item.data.title}
          </p>
          {item.type === "googleEvent" && (
            <Badge
              variant="secondary"
              className="shrink-0 text-xs"
              style={{ backgroundColor: `${color}20`, color }}
            >
              Google
            </Badge>
          )}
          {item.type === "timeBlock" && (
            <Badge
              variant="secondary"
              className="shrink-0 text-xs"
              style={{ backgroundColor: `${color}20`, color }}
            >
              Block
            </Badge>
          )}
        </div>

        {/* Additional info */}
        {item.type === "task" && item.data.project && (
          <Badge variant="outline" className="mt-1 text-xs">
            {item.data.project.title}
          </Badge>
        )}
        {item.type === "googleEvent" && item.data.location && (
          <div className="text-muted-foreground mt-1 flex items-center gap-1 text-xs">
            <MapPin className="h-3 w-3" />
            <span className="truncate">{item.data.location}</span>
          </div>
        )}
      </div>

      {/* Complete button for tasks */}
      {item.type === "task" && onComplete && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
          onClick={(e) => {
            e.stopPropagation();
            onComplete();
          }}
        >
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        </Button>
      )}
    </button>
  );
}

// Event detail content for the sheet
interface EventDetailContentProps {
  event: AgendaItem;
  onComplete?: () => void;
}

function EventDetailContent({ event, onComplete }: EventDetailContentProps) {
  if (event.type === "timeBlock") {
    const block = event.data;
    const startTime = new Date(block.startTime);
    const endTime = new Date(block.endTime);
    const duration = differenceInMinutes(endTime, startTime);

    return (
      <>
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: block.color ?? "#3b82f6" }}
            />
            {block.title}
          </SheetTitle>
          <SheetDescription>Time Block</SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          <div className="flex items-center gap-2 text-sm">
            <Clock className="text-muted-foreground h-4 w-4" />
            <span>
              {format(startTime, "h:mm a")} - {format(endTime, "h:mm a")}
            </span>
            <span className="text-muted-foreground">({duration} min)</span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Calendar className="text-muted-foreground h-4 w-4" />
            <span>{format(startTime, "EEEE, MMMM d, yyyy")}</span>
          </div>

          {block.notes && (
            <>
              <Separator />
              <div>
                <p className="text-muted-foreground mb-1 text-xs font-medium uppercase">
                  Notes
                </p>
                <p className="text-sm whitespace-pre-wrap">{block.notes}</p>
              </div>
            </>
          )}
        </div>
      </>
    );
  }

  if (event.type === "task") {
    const task = event.data;
    const taskStart = task.scheduledStart
      ? new Date(task.scheduledStart)
      : null;
    const taskEnd = task.scheduledEnd ? new Date(task.scheduledEnd) : null;

    const priorityColors = {
      urgent: "text-red-500 border-red-500",
      high: "text-orange-500 border-orange-500",
      medium: "text-yellow-500 border-yellow-500",
      low: "text-blue-500 border-blue-500",
    };

    return (
      <>
        <SheetHeader>
          <SheetTitle>{task.title}</SheetTitle>
          <SheetDescription>Scheduled Task</SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge
              variant="outline"
              className={cn("capitalize", priorityColors[task.priority])}
            >
              {task.priority}
            </Badge>
            <Badge variant="secondary" className="capitalize">
              {task.status}
            </Badge>
          </div>

          {taskStart && (
            <div className="flex items-center gap-2 text-sm">
              <Clock className="text-muted-foreground h-4 w-4" />
              <span>
                {format(taskStart, "h:mm a")}
                {taskEnd && ` - ${format(taskEnd, "h:mm a")}`}
              </span>
            </div>
          )}

          {task.dueDate && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="text-muted-foreground h-4 w-4" />
              <span>Due {format(new Date(task.dueDate), "MMMM d, yyyy")}</span>
            </div>
          )}

          {task.estimatedMinutes && (
            <div className="text-muted-foreground text-sm">
              Estimated: {task.estimatedMinutes} minutes
            </div>
          )}

          {task.description && (
            <>
              <Separator />
              <div>
                <p className="text-muted-foreground mb-1 text-xs font-medium uppercase">
                  Description
                </p>
                <p className="text-sm whitespace-pre-wrap">
                  {task.description}
                </p>
              </div>
            </>
          )}

          {onComplete && (
            <>
              <Separator />
              <Button className="w-full" onClick={onComplete}>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Mark Complete
              </Button>
            </>
          )}
        </div>
      </>
    );
  }

  if (event.type === "googleEvent") {
    const gEvent = event.data;
    const eventStart = new Date(gEvent.startTime);
    const eventEnd = new Date(gEvent.endTime);

    return (
      <>
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-purple-500" />
            {gEvent.title}
          </SheetTitle>
          <SheetDescription>
            Google Calendar Event
            {gEvent.allDay && " (All day)"}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          {!gEvent.allDay && (
            <div className="flex items-center gap-2 text-sm">
              <Clock className="text-muted-foreground h-4 w-4" />
              <span>
                {format(eventStart, "h:mm a")} - {format(eventEnd, "h:mm a")}
              </span>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm">
            <Calendar className="text-muted-foreground h-4 w-4" />
            <span>{format(eventStart, "EEEE, MMMM d, yyyy")}</span>
          </div>

          {gEvent.location && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="text-muted-foreground h-4 w-4" />
              <span>{gEvent.location}</span>
            </div>
          )}

          {gEvent.description && (
            <>
              <Separator />
              <div>
                <p className="text-muted-foreground mb-1 text-xs font-medium uppercase">
                  Description
                </p>
                <p className="text-sm whitespace-pre-wrap">
                  {gEvent.description}
                </p>
              </div>
            </>
          )}

          {gEvent.htmlLink && (
            <>
              <Separator />
              <Button asChild variant="outline" className="w-full">
                <a
                  href={gEvent.htmlLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open in Google Calendar
                </a>
              </Button>
            </>
          )}
        </div>
      </>
    );
  }

  return null;
}

// Task item component for today's tasks
interface TaskItemProps {
  task: TodayTask;
  isSelected?: boolean;
  onComplete: (id: string) => void;
  onSnooze: (id: string) => void;
  onDelete: (id: string) => void;
  onSetNextUp?: (id: string) => void;
  onDragStart: (e: React.DragEvent) => void;
  onSelect?: () => void;
  onClick?: () => void;
  refCallback?: (el: HTMLDivElement | null) => void;
}

// Teal accent color for Next Up
const TEAL_ACCENT = "#32B8C6";

function TaskItem({
  task,
  isSelected,
  onComplete,
  onSnooze,
  onDelete,
  onSetNextUp,
  onDragStart,
  onSelect,
  onClick,
  refCallback,
}: TaskItemProps) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const isOverdue =
    task.dueDate &&
    new Date(task.dueDate) < now &&
    !isToday(new Date(task.dueDate));

  const isNextUp = task.isNextUp;

  // Swipe gesture for mobile
  const { offset, isSwiping, handlers } = useSwipeGesture({
    onSwipeRight: () => onComplete(task.id), // Swipe right to complete
    onSwipeLeft: () => onSnooze(task.id), // Swipe left to snooze
    threshold: 60,
  });

  return (
    <div
      ref={refCallback}
      className={cn(
        "relative overflow-hidden rounded-lg",
        isSelected && "ring-primary ring-2",
      )}
    >
      {/* Background action indicators (visible during swipe) */}
      <div className="absolute inset-0 flex items-stretch">
        <div
          className={cn(
            "flex flex-1 items-center justify-start bg-green-500 pl-4",
            "text-white transition-opacity",
            offset > 20 ? "opacity-100" : "opacity-0",
          )}
        >
          <CheckCircle2 className="h-5 w-5" />
          <span className="ml-2 text-sm font-medium">Complete</span>
        </div>
        <div
          className={cn(
            "flex flex-1 items-center justify-end bg-amber-500 pr-4",
            "text-white transition-opacity",
            offset < -20 ? "opacity-100" : "opacity-0",
          )}
        >
          <span className="mr-2 text-sm font-medium">Snooze</span>
          <Calendar className="h-5 w-5" />
        </div>
      </div>

      {/* Main task content */}
      <div
        className={cn(
          "group bg-background relative flex min-h-[56px] items-start gap-3 border p-3 transition-colors",
          "cursor-pointer touch-pan-y", // Allow vertical scroll but capture horizontal
          !isSwiping && "rounded-lg", // Only round when not swiping
          !isSwiping && !isNextUp && "hover:bg-muted/50",
          isOverdue && !isNextUp && "border-red-500/30 bg-red-500/5",
          isNextUp && "border-l-4 bg-[#32B8C6]/5",
        )}
        style={{
          transform: isSwiping ? `translateX(${offset}px)` : undefined,
          transition: isSwiping ? "none" : "transform 0.2s ease-out",
          ...(isNextUp && { borderLeftColor: TEAL_ACCENT }),
        }}
        draggable
        onDragStart={onDragStart}
        onClick={(e) => {
          // Open task modal on click (unless clicking interactive elements)
          const target = e.target as HTMLElement;
          if (
            target.closest("button") ||
            target.closest('[role="checkbox"]') ||
            target.closest("[data-no-click]")
          ) {
            return;
          }
          onClick?.();
          onSelect?.();
        }}
        {...handlers}
      >
        {/* Drag handle - hidden on mobile */}
        <div className="text-muted-foreground mt-0.5 hidden cursor-grab opacity-0 transition-opacity group-hover:opacity-100 sm:block">
          <GripVertical className="h-5 w-5" />
        </div>

        {/* Checkbox - larger touch target */}
        <div className="flex min-h-[28px] min-w-[28px] items-center justify-center">
          <Checkbox
            checked={task.status === "completed"}
            onCheckedChange={() => onComplete(task.id)}
            className="h-5 w-5"
          />
        </div>

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
                {/* Next Up badge */}
                {isNextUp && (
                  <Badge
                    className="text-xs"
                    style={{
                      backgroundColor: `${TEAL_ACCENT}20`,
                      color: TEAL_ACCENT,
                      borderColor: TEAL_ACCENT,
                    }}
                  >
                    <Play className="mr-1 h-3 w-3" />
                    Next Up
                  </Badge>
                )}
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
                      task.priority === "urgent" &&
                        "border-red-500 text-red-500",
                      task.priority === "high" &&
                        "border-orange-500 text-orange-500",
                      task.priority === "low" &&
                        "border-gray-400 text-gray-400",
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
                {/* Set as Next Up - only show for tasks with projects that aren't already Next Up */}
                {task.projectId && !isNextUp && onSetNextUp && (
                  <DropdownMenuItem onClick={() => onSetNextUp(task.id)}>
                    <Play
                      className="mr-2 h-4 w-4"
                      style={{ color: TEAL_ACCENT }}
                    />
                    Set as Next Up
                  </DropdownMenuItem>
                )}
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
    </div>
  );
}

// Backlog item component
interface BacklogItemProps {
  task: BacklogTask;
  onAddToToday: () => void;
  onDelete: (id: string) => void;
  onDragStart: (e: React.DragEvent) => void;
}

function BacklogItem({
  task,
  onAddToToday,
  onDelete,
  onDragStart,
}: BacklogItemProps) {
  return (
    <div
      className={cn(
        "group flex items-start gap-3 rounded-lg border border-dashed p-3 transition-colors",
        "hover:bg-muted/50 hover:border-solid",
      )}
      draggable
      onDragStart={onDragStart}
    >
      {/* Drag handle */}
      <div className="text-muted-foreground mt-0.5 cursor-grab">
        <GripVertical className="h-5 w-5" />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p className="font-medium">{task.title}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          {/* Project */}
          {task.project && (
            <Badge variant="secondary" className="text-xs">
              {task.project.title}
            </Badge>
          )}
          {/* Priority */}
          {task.priority !== "medium" && (
            <Badge
              variant="outline"
              className={cn(
                "text-xs",
                task.priority === "urgent" && "border-red-500 text-red-500",
                task.priority === "high" && "border-orange-500 text-orange-500",
                task.priority === "low" && "border-gray-400 text-gray-400",
              )}
            >
              {task.priority}
            </Badge>
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
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={onAddToToday}
          className="text-xs"
        >
          <Plus className="mr-1 h-3 w-3" />
          Today
        </Button>
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
            <DropdownMenuItem onClick={onAddToToday}>
              <Plus className="mr-2 h-4 w-4" />
              Add to today
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
  );
}
