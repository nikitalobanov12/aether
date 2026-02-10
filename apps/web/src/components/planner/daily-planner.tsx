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
  setHours,
  setMinutes,
  isSameDay,
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
  Plus,
  Inbox,
  Clock,
  ExternalLink,
  MapPin,
  Play,
  Sparkles,
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

// Timeline hours configuration
const TIMELINE_START_HOUR = 6; // 6 AM
const TIMELINE_END_HOUR = 22; // 10 PM
const HOUR_HEIGHT = 80; // pixels per hour

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
  const [isSmartAddEnabled, setIsSmartAddEnabled] = useState(false);
  const [backlogOpen, setBacklogOpen] = useState(false);

  // Event detail sheet state
  const [selectedEvent, setSelectedEvent] = useState<AgendaItem | null>(null);
  const [isEventSheetOpen, setIsEventSheetOpen] = useState(false);

  // Task detail modal state
  const [selectedTask, setSelectedTask] = useState<TodayTask | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  // Timeline scroll ref
  const timelineRef = useRef<HTMLDivElement>(null);

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
      await utils.task.getToday.cancel();
      const previousTasks = utils.task.getToday.getData({
        dateString,
        includeOverdue: true,
      });
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
      toast.error("Failed to complete task");
    },
    onSuccess: (completedTask) => {
      void utils.history.getToday.invalidate();
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
        isRecurring: false,
        recurrenceRule: null,
        googleEventId: null,
        googleCalendarId: null,
        googleTasksId: null,
        googleTasksListId: null,
        lastSyncedAt: null,
      };
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

  const createFromTextMutation = api.ai.createTaskFromText.useMutation({
    onSuccess: (result) => {
      setNewTaskTitle("");
      setIsAddingTask(false);
      if (result.aiParsed) {
        toast.success("Task added with AI parsing", {
          description: result.task?.title,
        });
      } else {
        toast.success("Task added");
      }
    },
    onError: () => {
      toast.error("Failed to create task");
    },
    onSettled: () => {
      void utils.task.getToday.invalidate();
      void utils.task.getBacklog.invalidate();
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
      const taskToMove = previousBacklog?.find((t) => t.id === id);
      if (taskToMove) {
        utils.task.getBacklog.setData(undefined, (old) =>
          old?.filter((t) => t.id !== id),
        );
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

  // Sort tasks: overdue first, then by priority
  const sortedTasks = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return [...tasks].sort((a, b) => {
      const aOverdue = a.dueDate && new Date(a.dueDate) < now;
      const bOverdue = b.dueDate && new Date(b.dueDate) < now;
      if (aOverdue && !bOverdue) return -1;
      if (!aOverdue && bOverdue) return 1;
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      return (
        (priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2)
      );
    });
  }, [tasks]);

  // Build timeline items: scheduled tasks, time blocks, and Google events
  const { scheduledItems, unscheduledTasks } = useMemo(() => {
    const scheduled: AgendaItem[] = [];
    const unscheduled: TodayTask[] = [];

    for (const task of sortedTasks) {
      if (task.scheduledStart) {
        scheduled.push({ type: "task", data: task });
      } else {
        unscheduled.push(task);
      }
    }

    for (const block of timeBlocks) {
      scheduled.push({ type: "timeBlock", data: block });
    }

    for (const event of googleEvents) {
      if (!event.allDay) {
        scheduled.push({ type: "googleEvent", data: event });
      }
    }

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

  // All-day events
  const allDayEvents = useMemo(() => {
    return googleEvents.filter((event) => event.allDay);
  }, [googleEvents]);

  // Current time indicator position
  const currentTimePosition = useMemo(() => {
    const now = new Date();
    if (!isSameDay(now, selectedDate)) return null;
    const hours = now.getHours();
    const minutes = now.getMinutes();
    if (hours < TIMELINE_START_HOUR || hours >= TIMELINE_END_HOUR) return null;
    const offsetHours = hours - TIMELINE_START_HOUR + minutes / 60;
    return offsetHours * HOUR_HEIGHT;
  }, [selectedDate]);

  // Scroll to current time on mount
  useEffect(() => {
    if (isViewingToday && timelineRef.current && currentTimePosition) {
      const scrollTarget = Math.max(0, currentTimePosition - 100);
      timelineRef.current.scrollTop = scrollTarget;
    }
  }, [isViewingToday, currentTimePosition]);

  // Event handlers
  const handleEventClick = useCallback((item: AgendaItem) => {
    if (item.type === "task") {
      setSelectedTask(item.data);
      setIsTaskModalOpen(true);
    } else {
      setSelectedEvent(item);
      setIsEventSheetOpen(true);
    }
  }, []);

  const handleTaskClick = useCallback((task: TodayTask) => {
    setSelectedTask(task);
    setIsTaskModalOpen(true);
  }, []);

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

  const handleSetNextUp = useCallback(
    (taskId: string) => {
      setNextUpMutation.mutate({ id: taskId });
    },
    [setNextUpMutation],
  );

  const handleQuickAdd = useCallback(() => {
    if (!newTaskTitle.trim()) return;
    if (isSmartAddEnabled) {
      createFromTextMutation.mutate({ text: newTaskTitle.trim() });
    } else {
      createTaskMutation.mutate({
        title: newTaskTitle.trim(),
        dueDateString: dateString,
        priority: "medium",
      });
    }
  }, [
    newTaskTitle,
    dateString,
    createTaskMutation,
    createFromTextMutation,
    isSmartAddEnabled,
  ]);

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

  const handleAddToToday = useCallback(
    (taskId: string) => {
      addToDayMutation.mutate({ id: taskId, dateString });
    },
    [addToDayMutation, dateString],
  );

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

  // Keyboard navigation
  const taskIds = useMemo(() => sortedTasks.map((t) => t.id), [sortedTasks]);
  const taskRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const { selectedId, isSelected, setSelectedId } = useKeyboardNavigation({
    items: taskIds,
    enabled: !isAddingTask,
    onComplete: handleComplete,
    onDelete: handleDelete,
    onAdd: () => setIsAddingTask(true),
  });

  useEffect(() => {
    if (selectedId) {
      const element = taskRefs.current.get(selectedId);
      element?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [selectedId]);

  // Calculate position for timeline items
  const getTimelinePosition = (startTime: Date, endTime: Date) => {
    const startHour =
      startTime.getHours() + startTime.getMinutes() / 60 - TIMELINE_START_HOUR;
    const endHour =
      endTime.getHours() + endTime.getMinutes() / 60 - TIMELINE_START_HOUR;
    const top = Math.max(0, startHour * HOUR_HEIGHT);
    const height = Math.max(30, (endHour - startHour) * HOUR_HEIGHT);
    return { top, height };
  };

  return (
    <div className="flex h-full flex-col lg:flex-row">
      {/* Left Panel - Editorial Header + Tasks */}
      <div className="flex flex-col border-b lg:w-96 lg:border-b-0 lg:border-r border-border/50">
        {/* Editorial Header */}
        <div className="px-6 pt-8 pb-6 lg:pt-12 lg:pb-8">
          {/* Date Navigation */}
          <div className="flex items-center gap-2 mb-4">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={goToPreviousDay}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant={isViewingToday ? "secondary" : "ghost"}
              size="sm"
              onClick={goToToday}
              className="text-xs"
            >
              Today
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={goToNextDay}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Large Date Display - Editorial Style */}
          <div className="space-y-1">
            <p className="text-eyebrow text-muted-foreground">
              {format(selectedDate, "EEEE")}
            </p>
            <h1 className="text-display font-display tracking-tight">
              {format(selectedDate, "MMMM d")}
            </h1>
          </div>

          {/* Stats */}
          <div className="mt-6 flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/10">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-semibold tabular-nums">
                  {completedCount}
                </p>
                <p className="text-xs text-muted-foreground">completed</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                <Circle className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-semibold tabular-nums">
                  {unscheduledTasks.length}
                </p>
                <p className="text-xs text-muted-foreground">remaining</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Add */}
        <div className="px-6 pb-4">
          {isAddingTask ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-8 w-8 shrink-0",
                    isSmartAddEnabled
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground",
                  )}
                  onClick={() => setIsSmartAddEnabled(!isSmartAddEnabled)}
                  title={
                    isSmartAddEnabled
                      ? "Smart add on"
                      : "Smart add off"
                  }
                >
                  <Sparkles className="h-4 w-4" />
                </Button>
                <Input
                  placeholder={
                    isSmartAddEnabled
                      ? "Try natural language..."
                      : "What needs to be done?"
                  }
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  onKeyDown={handleKeyDown}
                  autoFocus
                  className="flex-1"
                  disabled={
                    createTaskMutation.isPending ||
                    createFromTextMutation.isPending
                  }
                />
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleQuickAdd}
                  disabled={
                    !newTaskTitle.trim() ||
                    createTaskMutation.isPending ||
                    createFromTextMutation.isPending
                  }
                  className="flex-1"
                >
                  Add Task
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
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full justify-start text-muted-foreground hover:text-foreground"
              onClick={() => setIsAddingTask(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add task
            </Button>
          )}
        </div>

        {/* Tasks List */}
        <ScrollArea className="flex-1">
          <div
            className="px-6 pb-6 space-y-2"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            {/* All-day events */}
            {allDayEvents.length > 0 && (
              <div className="space-y-2 mb-4">
                <p className="text-eyebrow text-muted-foreground">All Day</p>
                {allDayEvents.map((event) => (
                  <button
                    key={event.id}
                    type="button"
                    className="flex w-full items-center gap-3 rounded-lg border border-purple-500/30 bg-purple-500/5 p-3 text-left transition-colors hover:bg-purple-500/10"
                    onClick={() =>
                      handleEventClick({ type: "googleEvent", data: event })
                    }
                  >
                    <div className="h-2 w-2 rounded-full bg-purple-500" />
                    <span className="text-sm font-medium">{event.title}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Unscheduled Tasks */}
            {unscheduledTasks.length === 0 && scheduledItems.length === 0 ? (
              <div className="py-12 text-center">
                <Circle className="mx-auto mb-3 h-12 w-12 text-muted-foreground/20" />
                <p className="text-lg font-medium text-muted-foreground">
                  No tasks for {isViewingToday ? "today" : "this day"}
                </p>
                <p className="text-sm text-muted-foreground/60">
                  Add tasks above or drag from backlog
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

            {/* Backlog */}
            <Collapsible open={backlogOpen} onOpenChange={setBacklogOpen}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-between text-muted-foreground hover:text-foreground mt-4"
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
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    No tasks in backlog
                  </p>
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
      </div>

      {/* Right Panel - Timeline */}
      <div className="flex-1 hidden lg:flex flex-col bg-muted/30">
        <div className="px-6 py-4 border-b border-border/50">
          <h2 className="font-medium text-muted-foreground">Timeline</h2>
        </div>
        <div ref={timelineRef} className="flex-1 overflow-auto">
          <div
            className="relative"
            style={{
              height: (TIMELINE_END_HOUR - TIMELINE_START_HOUR) * HOUR_HEIGHT,
            }}
          >
            {/* Hour lines */}
            {Array.from({ length: TIMELINE_END_HOUR - TIMELINE_START_HOUR }).map(
              (_, i) => {
                const hour = TIMELINE_START_HOUR + i;
                const time = setMinutes(setHours(selectedDate, hour), 0);
                return (
                  <div
                    key={hour}
                    className="absolute left-0 right-0 border-t border-border/30"
                    style={{ top: i * HOUR_HEIGHT }}
                  >
                    <span className="absolute left-4 -top-2.5 text-xs text-muted-foreground bg-muted/30 px-1">
                      {format(time, "h a")}
                    </span>
                  </div>
                );
              },
            )}

            {/* Current time indicator */}
            {currentTimePosition !== null && (
              <div
                className="absolute left-0 right-0 z-20 flex items-center"
                style={{ top: currentTimePosition }}
              >
                <div className="h-3 w-3 rounded-full bg-red-500" />
                <div className="flex-1 h-[2px] bg-red-500" />
              </div>
            )}

            {/* Scheduled items */}
            <div className="absolute left-16 right-4 top-0 bottom-0">
              {scheduledItems.map((item) => {
                const { start, end } = getItemTimes(item);
                const { top, height } = getTimelinePosition(start, end);
                const color = getItemColor(item);

                return (
                  <button
                    key={getAgendaItemKey(item)}
                    type="button"
                    className={cn(
                      "absolute left-0 right-0 rounded-lg border-l-4 px-3 py-2 text-left transition-all hover:shadow-md",
                      "bg-card/80 backdrop-blur-sm",
                    )}
                    style={{
                      top,
                      height: Math.max(height, 30),
                      borderLeftColor: color,
                    }}
                    onClick={() => handleEventClick(item)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate text-sm">
                          {getItemTitle(item)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(start, "h:mm a")} – {format(end, "h:mm a")}
                        </p>
                      </div>
                      {item.type === "googleEvent" && (
                        <Badge
                          variant="secondary"
                          className="text-[10px] shrink-0"
                          style={{ backgroundColor: `${color}20`, color }}
                        >
                          Google
                        </Badge>
                      )}
                      {item.type === "timeBlock" && (
                        <Badge
                          variant="secondary"
                          className="text-[10px] shrink-0"
                          style={{ backgroundColor: `${color}20`, color }}
                        >
                          Block
                        </Badge>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Event Detail Sheet */}
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

// Helper functions
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

function getItemTimes(item: AgendaItem): { start: Date; end: Date } {
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
}

function getItemTitle(item: AgendaItem): string {
  switch (item.type) {
    case "task":
      return item.data.title;
    case "timeBlock":
      return item.data.title;
    case "googleEvent":
      return item.data.title;
  }
}

function getItemColor(item: AgendaItem): string {
  switch (item.type) {
    case "task":
      return "#10b981"; // green
    case "timeBlock":
      return item.data.color ?? "#3b82f6"; // blue
    case "googleEvent":
      return "#8b5cf6"; // purple
  }
}

// Event detail content
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
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>
              {format(startTime, "h:mm a")} - {format(endTime, "h:mm a")}
            </span>
            <span className="text-muted-foreground">({duration} min)</span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{format(startTime, "EEEE, MMMM d, yyyy")}</span>
          </div>

          {block.notes && (
            <>
              <Separator />
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground mb-1">
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
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>
                {format(taskStart, "h:mm a")}
                {taskEnd && ` - ${format(taskEnd, "h:mm a")}`}
              </span>
            </div>
          )}

          {task.dueDate && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Due {format(new Date(task.dueDate), "MMMM d, yyyy")}</span>
            </div>
          )}

          {task.estimatedMinutes && (
            <div className="text-sm text-muted-foreground">
              Estimated: {task.estimatedMinutes} minutes
            </div>
          )}

          {task.description && (
            <>
              <Separator />
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground mb-1">
                  Description
                </p>
                <p className="text-sm whitespace-pre-wrap">{task.description}</p>
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
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>
                {format(eventStart, "h:mm a")} - {format(eventEnd, "h:mm a")}
              </span>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{format(eventStart, "EEEE, MMMM d, yyyy")}</span>
          </div>

          {gEvent.location && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{gEvent.location}</span>
            </div>
          )}

          {gEvent.description && (
            <>
              <Separator />
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground mb-1">
                  Description
                </p>
                <p className="text-sm whitespace-pre-wrap">{gEvent.description}</p>
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

// Task item component
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

  const { offset, isSwiping, handlers } = useSwipeGesture({
    onSwipeRight: () => onComplete(task.id),
    onSwipeLeft: () => onSnooze(task.id),
    threshold: 60,
  });

  return (
    <div
      ref={refCallback}
      className={cn(
        "relative overflow-hidden rounded-lg",
        isSelected && "ring-2 ring-primary",
      )}
    >
      {/* Swipe backgrounds */}
      <div className="absolute inset-0 flex items-stretch">
        <div
          className={cn(
            "flex flex-1 items-center justify-start bg-green-500 pl-4 text-white transition-opacity",
            offset > 20 ? "opacity-100" : "opacity-0",
          )}
        >
          <CheckCircle2 className="h-5 w-5" />
          <span className="ml-2 text-sm font-medium">Complete</span>
        </div>
        <div
          className={cn(
            "flex flex-1 items-center justify-end bg-amber-500 pr-4 text-white transition-opacity",
            offset < -20 ? "opacity-100" : "opacity-0",
          )}
        >
          <span className="mr-2 text-sm font-medium">Snooze</span>
          <Calendar className="h-5 w-5" />
        </div>
      </div>

      {/* Task content */}
      <div
        className={cn(
          "group relative flex items-start gap-3 rounded-lg border bg-card p-3 transition-all",
          "cursor-pointer touch-pan-y",
          !isSwiping && !isNextUp && "hover:bg-muted/50",
          isOverdue && !isNextUp && "border-red-500/30 bg-red-500/5",
          isNextUp && "border-l-4 bg-primary/5",
        )}
        style={{
          transform: isSwiping ? `translateX(${offset}px)` : undefined,
          transition: isSwiping ? "none" : "transform 0.2s ease-out",
          ...(isNextUp && { borderLeftColor: TEAL_ACCENT }),
        }}
        draggable
        onDragStart={onDragStart}
        onClick={(e) => {
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
        {/* Drag handle */}
        <div className="hidden sm:block mt-0.5 cursor-grab text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
          <GripVertical className="h-4 w-4" />
        </div>

        {/* Checkbox */}
        <div className="flex min-h-[24px] min-w-[24px] items-center justify-center">
          <Checkbox
            checked={task.status === "completed"}
            onCheckedChange={() => onComplete(task.id)}
            className="h-4 w-4"
          />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "text-sm font-medium leading-tight",
              task.status === "completed" &&
                "text-muted-foreground line-through",
            )}
          >
            {task.title}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {isNextUp && (
              <Badge
                className="text-[10px] px-1.5 py-0"
                style={{
                  backgroundColor: `${TEAL_ACCENT}20`,
                  color: TEAL_ACCENT,
                  borderColor: TEAL_ACCENT,
                }}
              >
                <Play className="mr-0.5 h-2.5 w-2.5" />
                Next
              </Badge>
            )}
            {task.project && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                {task.project.title}
              </Badge>
            )}
            {task.priority !== "medium" && (
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] px-1.5 py-0",
                  task.priority === "urgent" && "border-red-500 text-red-500",
                  task.priority === "high" && "border-orange-500 text-orange-500",
                  task.priority === "low" && "border-gray-400 text-gray-400",
                )}
              >
                {task.priority}
              </Badge>
            )}
            {isOverdue && (
              <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                Overdue
              </Badge>
            )}
            {task.scheduledStart && (
              <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                <Clock className="h-2.5 w-2.5" />
                {format(new Date(task.scheduledStart), "h:mm a")}
              </span>
            )}
            {task.estimatedMinutes && (
              <span className="text-[10px] text-muted-foreground">
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
              className="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
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
            {task.projectId && !isNextUp && onSetNextUp && (
              <DropdownMenuItem onClick={() => onSetNextUp(task.id)}>
                <Play className="mr-2 h-4 w-4" style={{ color: TEAL_ACCENT }} />
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
        "hover:border-solid hover:bg-muted/50",
      )}
      draggable
      onDragStart={onDragStart}
    >
      <div className="mt-0.5 cursor-grab text-muted-foreground">
        <GripVertical className="h-4 w-4" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{task.title}</p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          {task.project && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {task.project.title}
            </Badge>
          )}
          {task.priority !== "medium" && (
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] px-1.5 py-0",
                task.priority === "urgent" && "border-red-500 text-red-500",
                task.priority === "high" && "border-orange-500 text-orange-500",
                task.priority === "low" && "border-gray-400 text-gray-400",
              )}
            >
              {task.priority}
            </Badge>
          )}
          {task.estimatedMinutes && (
            <span className="text-[10px] text-muted-foreground">
              ~{task.estimatedMinutes}m
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={onAddToToday}
          className="h-7 text-xs"
        >
          <Plus className="mr-1 h-3 w-3" />
          Today
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
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
