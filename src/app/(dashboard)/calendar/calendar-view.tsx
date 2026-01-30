"use client";

import { useState, useMemo, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
  ExternalLink,
  Calendar,
  Trash2,
  Pencil,
  MapPin,
  ListTodo,
} from "lucide-react";
import {
  format,
  addDays,
  subDays,
  startOfWeek,
  addWeeks,
  subWeeks,
  isSameDay,
  isToday,
  setHours,
  setMinutes,
  differenceInMinutes,
  addMinutes,
} from "date-fns";

import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "~/components/ui/sheet";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Separator } from "~/components/ui/separator";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";
import { toast } from "~/components/ui/sonner";
import { useSwipeGesture } from "~/hooks/use-swipe-gesture";
import { TaskDetailModal } from "~/components/tasks/task-detail-modal";
import type { RouterOutputs } from "~/trpc/react";

// Time grid constants
const HOUR_HEIGHT = 60; // pixels per hour
const HOUR_HEIGHT_MOBILE = 50; // smaller on mobile
const START_HOUR = 6; // 6 AM
const END_HOUR = 22; // 10 PM
const TOTAL_HOURS = END_HOUR - START_HOUR;

type TimeBlock = RouterOutputs["timeBlock"]["getByDateRange"][number];
type Task = RouterOutputs["task"]["getByDateRange"]["scheduled"][number];
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

// Types for event detail sheet
type SelectedEvent =
  | { type: "timeBlock"; data: TimeBlock }
  | { type: "task"; data: Task }
  | { type: "googleEvent"; data: GoogleCalendarEvent };

interface CalendarViewProps {
  initialTimeBlocks: TimeBlock[];
  initialScheduledTasks: Task[];
  initialUnscheduledTasks: Task[];
}

export function CalendarView({
  initialTimeBlocks,
  initialScheduledTasks,
  initialUnscheduledTasks,
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{
    date: Date;
    hour: number;
  } | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  // Event detail sheet state
  const [selectedEvent, setSelectedEvent] = useState<SelectedEvent | null>(
    null,
  );
  const [isEventSheetOpen, setIsEventSheetOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // Task detail modal state (for tasks, we use the modal instead of the sheet)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  // Mobile state - track center date for 3-day view
  const [mobileCenterDate, setMobileCenterDate] = useState(new Date());

  // Mobile unscheduled tasks sheet
  const [isUnscheduledSheetOpen, setIsUnscheduledSheetOpen] = useState(false);

  const weekStart = useMemo(
    () => startOfWeek(currentDate, { weekStartsOn: 0 }),
    [currentDate],
  );

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );

  const weekEnd = useMemo(() => addDays(weekStart, 7), [weekStart]);

  // Fetch time blocks and tasks for current week
  const { data: timeBlocks = initialTimeBlocks } =
    api.timeBlock.getByDateRange.useQuery(
      {
        startDate: weekStart.toISOString(),
        endDate: weekEnd.toISOString(),
      },
      {
        initialData: initialTimeBlocks,
      },
    );

  const {
    data: tasksData = {
      scheduled: initialScheduledTasks,
      unscheduled: initialUnscheduledTasks,
    },
  } = api.task.getByDateRange.useQuery(
    {
      startDate: weekStart.toISOString(),
      endDate: weekEnd.toISOString(),
      includeUnscheduled: true,
    },
    {
      initialData: {
        scheduled: initialScheduledTasks,
        unscheduled: initialUnscheduledTasks,
      },
    },
  );

  // Fetch Google Calendar status and events
  const { data: googleCalendarStatus } =
    api.googleCalendar.getStatus.useQuery();
  const { data: googleEventsData } = api.googleCalendar.getEvents.useQuery(
    {
      startDate: weekStart.toISOString(),
      endDate: weekEnd.toISOString(),
    },
    {
      enabled:
        googleCalendarStatus?.connected &&
        googleCalendarStatus?.calendarEnabled,
    },
  );

  const googleEvents: GoogleCalendarEvent[] = useMemo(
    () => googleEventsData?.events ?? [],
    [googleEventsData?.events],
  );

  const utils = api.useUtils();

  const createTimeBlock = api.timeBlock.create.useMutation({
    onMutate: async (newBlock) => {
      await utils.timeBlock.getByDateRange.cancel();
      const previousBlocks = utils.timeBlock.getByDateRange.getData({
        startDate: weekStart.toISOString(),
        endDate: weekEnd.toISOString(),
      });

      // Create optimistic time block
      const optimisticBlock: TimeBlock = {
        id: `temp-${Date.now()}`,
        title: newBlock.title,
        startTime: new Date(newBlock.startTime),
        endTime: new Date(newBlock.endTime),
        color: newBlock.color ?? "#3b82f6",
        notes: newBlock.notes ?? null,
        isCompleted: false,
        userId: "",
        taskId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        googleCalendarEventId: null,
        task: null,
      };

      utils.timeBlock.getByDateRange.setData(
        {
          startDate: weekStart.toISOString(),
          endDate: weekEnd.toISOString(),
        },
        (old) => (old ? [...old, optimisticBlock] : [optimisticBlock]),
      );

      return { previousBlocks };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousBlocks) {
        utils.timeBlock.getByDateRange.setData(
          {
            startDate: weekStart.toISOString(),
            endDate: weekEnd.toISOString(),
          },
          context.previousBlocks,
        );
      }
      toast.error("Failed to create time block");
    },
    onSuccess: () => {
      toast.success("Time block created");
      setIsDialogOpen(false);
      setSelectedSlot(null);
    },
    onSettled: () => {
      void utils.timeBlock.getByDateRange.invalidate();
      void utils.task.getByDateRange.invalidate();
    },
  });

  // Task creation mutation
  const createTaskMutation = api.task.create.useMutation({
    onMutate: async (newTask) => {
      await utils.task.getByDateRange.cancel();
      const previousTasks = utils.task.getByDateRange.getData({
        startDate: weekStart.toISOString(),
        endDate: weekEnd.toISOString(),
        includeUnscheduled: true,
      });

      // Create optimistic task for unscheduled list
      // We type-cast to Task since we have all required display fields
      const optimisticTask = {
        id: `temp-${Date.now()}`,
        title: newTask.title,
        description: newTask.description ?? null,
        status: "todo" as const,
        priority: newTask.priority ?? ("medium" as const),
        dueDate: newTask.dueDate ? new Date(newTask.dueDate) : null,
        scheduledStart: null,
        scheduledEnd: null,
        estimatedMinutes: newTask.estimatedMinutes ?? null,
        projectId: newTask.projectId ?? null,
        goalId: newTask.goalId ?? null,
        userId: "",
        createdAt: new Date(),
        updatedAt: new Date(),
        completedAt: null,
        sortOrder: 0,
        project: null,
        goal: null,
        board: null,
      } as Task;

      utils.task.getByDateRange.setData(
        {
          startDate: weekStart.toISOString(),
          endDate: weekEnd.toISOString(),
          includeUnscheduled: true,
        },
        (old) =>
          old
            ? {
                ...old,
                unscheduled: [...old.unscheduled, optimisticTask],
              }
            : { scheduled: [], unscheduled: [optimisticTask] },
      );

      return { previousTasks };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousTasks) {
        utils.task.getByDateRange.setData(
          {
            startDate: weekStart.toISOString(),
            endDate: weekEnd.toISOString(),
            includeUnscheduled: true,
          },
          context.previousTasks,
        );
      }
      toast.error("Failed to create task");
    },
    onSuccess: async (newTask) => {
      toast.success("Task created");
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
          console.error("Failed to sync to Google Tasks:", e);
        }
      }
    },
    onSettled: () => {
      void utils.task.getByDateRange.invalidate();
    },
  });

  // Task schedule mutation
  const scheduleMutation = api.task.schedule.useMutation({
    onMutate: async ({ id, scheduledStart, scheduledEnd }) => {
      await utils.task.getByDateRange.cancel();
      const previousTasks = utils.task.getByDateRange.getData({
        startDate: weekStart.toISOString(),
        endDate: weekEnd.toISOString(),
        includeUnscheduled: true,
      });

      // Optimistically move task from unscheduled to scheduled
      utils.task.getByDateRange.setData(
        {
          startDate: weekStart.toISOString(),
          endDate: weekEnd.toISOString(),
          includeUnscheduled: true,
        },
        (old) => {
          if (!old) return old;
          const taskToSchedule = old.unscheduled.find((t) => t.id === id);
          if (!taskToSchedule) return old;

          const scheduledTask = {
            ...taskToSchedule,
            scheduledStart: new Date(scheduledStart),
            scheduledEnd: scheduledEnd ? new Date(scheduledEnd) : null,
          } as Task;

          return {
            scheduled: [...old.scheduled, scheduledTask],
            unscheduled: old.unscheduled.filter((t) => t.id !== id),
          };
        },
      );

      return { previousTasks };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousTasks) {
        utils.task.getByDateRange.setData(
          {
            startDate: weekStart.toISOString(),
            endDate: weekEnd.toISOString(),
            includeUnscheduled: true,
          },
          context.previousTasks,
        );
      }
      toast.error("Failed to schedule task");
    },
    onSuccess: () => {
      toast.success("Task scheduled");
      setDraggedTaskId(null);
    },
    onSettled: () => {
      void utils.task.getByDateRange.invalidate();
      void utils.timeBlock.getByDateRange.invalidate();
    },
  });

  // Google Tasks sync mutation
  const syncToGoogleMutation =
    api.googleCalendar.syncTaskToGoogle.useMutation();

  // Time block update mutation
  const updateTimeBlock = api.timeBlock.update.useMutation({
    onMutate: async ({ id, ...updates }) => {
      await utils.timeBlock.getByDateRange.cancel();
      const previousBlocks = utils.timeBlock.getByDateRange.getData({
        startDate: weekStart.toISOString(),
        endDate: weekEnd.toISOString(),
      });

      // Optimistically update the time block
      utils.timeBlock.getByDateRange.setData(
        {
          startDate: weekStart.toISOString(),
          endDate: weekEnd.toISOString(),
        },
        (old) =>
          old?.map((block) =>
            block.id === id
              ? {
                  ...block,
                  ...updates,
                  startTime: updates.startTime
                    ? new Date(updates.startTime)
                    : block.startTime,
                  endTime: updates.endTime
                    ? new Date(updates.endTime)
                    : block.endTime,
                  updatedAt: new Date(),
                }
              : block,
          ),
      );

      return { previousBlocks };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousBlocks) {
        utils.timeBlock.getByDateRange.setData(
          {
            startDate: weekStart.toISOString(),
            endDate: weekEnd.toISOString(),
          },
          context.previousBlocks,
        );
      }
      toast.error("Failed to update time block");
    },
    onSuccess: () => {
      toast.success("Time block updated");
      setIsEditMode(false);
    },
    onSettled: () => {
      void utils.timeBlock.getByDateRange.invalidate();
    },
  });

  // Time block delete mutation
  const deleteTimeBlock = api.timeBlock.delete.useMutation({
    onMutate: async ({ id }) => {
      await utils.timeBlock.getByDateRange.cancel();
      const previousBlocks = utils.timeBlock.getByDateRange.getData({
        startDate: weekStart.toISOString(),
        endDate: weekEnd.toISOString(),
      });

      // Optimistically remove the time block
      utils.timeBlock.getByDateRange.setData(
        {
          startDate: weekStart.toISOString(),
          endDate: weekEnd.toISOString(),
        },
        (old) => old?.filter((block) => block.id !== id),
      );

      return { previousBlocks };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousBlocks) {
        utils.timeBlock.getByDateRange.setData(
          {
            startDate: weekStart.toISOString(),
            endDate: weekEnd.toISOString(),
          },
          context.previousBlocks,
        );
      }
      toast.error("Failed to delete time block");
    },
    onSuccess: () => {
      toast.success("Time block deleted");
      setIsEventSheetOpen(false);
      setSelectedEvent(null);
    },
    onSettled: () => {
      void utils.timeBlock.getByDateRange.invalidate();
      void utils.task.getByDateRange.invalidate();
    },
  });

  const handlePreviousWeek = () => setCurrentDate(subWeeks(currentDate, 1));
  const handleNextWeek = () => setCurrentDate(addWeeks(currentDate, 1));
  const handleToday = () => setCurrentDate(new Date());

  // Mobile navigation
  const handlePreviousDays = () =>
    setMobileCenterDate(subDays(mobileCenterDate, 3));
  const handleNextDays = () =>
    setMobileCenterDate(addDays(mobileCenterDate, 3));
  const handleMobileToday = () => setMobileCenterDate(new Date());

  // Swipe gesture for mobile calendar navigation
  const { handlers: swipeHandlers } = useSwipeGesture({
    onSwipeLeft: handleNextDays,
    onSwipeRight: handlePreviousDays,
    threshold: 50,
  });

  const handleSlotClick = (date: Date, hour: number) => {
    setSelectedSlot({ date, hour });
    setIsDialogOpen(true);
  };

  // Event click handlers
  const handleTimeBlockClick = (block: TimeBlock) => {
    setSelectedEvent({ type: "timeBlock", data: block });
    setIsEditMode(false);
    setIsEventSheetOpen(true);
  };

  const handleTaskClick = (task: Task) => {
    // Open task modal instead of sheet for better UX
    setSelectedTask(task);
    setIsTaskModalOpen(true);
  };

  const handleGoogleEventClick = (event: GoogleCalendarEvent) => {
    setSelectedEvent({ type: "googleEvent", data: event });
    setIsEditMode(false);
    setIsEventSheetOpen(true);
  };

  const handleCloseEventSheet = useCallback(() => {
    setIsEventSheetOpen(false);
    setIsEditMode(false);
    // Delay clearing selectedEvent to allow animation
    setTimeout(() => setSelectedEvent(null), 300);
  }, []);

  // Handle quick task creation
  const handleQuickAdd = useCallback(() => {
    if (!newTaskTitle.trim()) return;

    // Set due date to end of today
    const dueDate = new Date();
    dueDate.setHours(23, 59, 59, 999);

    createTaskMutation.mutate({
      title: newTaskTitle.trim(),
      dueDate: dueDate.toISOString(),
      priority: "medium",
    });
  }, [newTaskTitle, createTaskMutation]);

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

  // Handle drop on time slot (for unscheduled tasks)
  const handleDrop = useCallback(
    (day: Date, hour: number) => {
      if (!draggedTaskId) return;

      const task = tasksData.unscheduled.find((t) => t.id === draggedTaskId);
      if (!task) return;

      const scheduledStart = setMinutes(setHours(day, hour), 0);
      const duration = task.estimatedMinutes ?? 60;
      const scheduledEnd = addMinutes(scheduledStart, duration);

      scheduleMutation.mutate({
        id: draggedTaskId,
        scheduledStart: scheduledStart.toISOString(),
        scheduledEnd: scheduledEnd.toISOString(),
      });
    },
    [draggedTaskId, tasksData.unscheduled, scheduleMutation],
  );

  // Get blocks for a specific day
  const getBlocksForDay = (day: Date) => {
    return timeBlocks.filter((block) =>
      isSameDay(new Date(block.startTime), day),
    );
  };

  // Get scheduled tasks for a specific day (that aren't tied to time blocks)
  const getScheduledTasksForDay = (day: Date) => {
    return tasksData.scheduled.filter(
      (task: Task) =>
        task.scheduledStart &&
        isSameDay(new Date(task.scheduledStart), day) &&
        !timeBlocks.some((block) => block.taskId === task.id),
    );
  };

  // Get Google Calendar events for a specific day
  const getGoogleEventsForDay = (day: Date) => {
    return googleEvents.filter(
      (event) => !event.allDay && isSameDay(new Date(event.startTime), day),
    );
  };

  // Get all-day Google events for the week
  const allDayGoogleEvents = useMemo(() => {
    return googleEvents.filter((e) => e.allDay);
  }, [googleEvents]);

  // Get unscheduled tasks with due dates
  const unscheduledTasks = useMemo(() => {
    return tasksData.unscheduled.filter(
      (task: Task) =>
        task.status !== "completed" && task.status !== "cancelled",
    );
  }, [tasksData.unscheduled]);

  // Mobile 3-day view days
  const mobileDays = useMemo(
    () => [
      subDays(mobileCenterDate, 1),
      mobileCenterDate,
      addDays(mobileCenterDate, 1),
    ],
    [mobileCenterDate],
  );

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Header - Desktop */}
      <div className="hidden items-center justify-between md:flex">
        <div>
          <h1 className="text-3xl font-bold">Calendar</h1>
          <p className="text-muted-foreground">
            {format(weekStart, "MMMM d")} -{" "}
            {format(addDays(weekStart, 6), "MMMM d, yyyy")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePreviousWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={handleToday}>
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={handleNextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Header - Mobile */}
      <div className="flex items-center justify-between md:hidden">
        <div>
          <h1 className="text-xl font-bold">Calendar</h1>
          <p className="text-muted-foreground text-sm">
            {format(mobileDays[0]!, "MMM d")} -{" "}
            {format(mobileDays[2]!, "MMM d")}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={handlePreviousDays}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2 text-xs"
            onClick={handleMobileToday}
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={handleNextDays}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-1 gap-4 overflow-hidden">
        {/* Main calendar grid - Desktop (7-day week view) */}
        <Card className="hidden flex-1 overflow-hidden md:block">
          <ScrollArea className="h-full">
            <div className="min-w-[800px]">
              {/* Day headers */}
              <div className="bg-background sticky top-0 z-10 grid grid-cols-[60px_repeat(7,1fr)] border-b">
                <div className="p-2" /> {/* Time column header */}
                {weekDays.map((day) => (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      "border-l p-2 text-center",
                      isToday(day) && "bg-primary/5",
                    )}
                  >
                    <div className="text-muted-foreground text-xs font-medium">
                      {format(day, "EEE")}
                    </div>
                    <div
                      className={cn(
                        "text-lg font-semibold",
                        isToday(day) &&
                          "bg-primary text-primary-foreground mx-auto flex h-8 w-8 items-center justify-center rounded-full",
                      )}
                    >
                      {format(day, "d")}
                    </div>
                  </div>
                ))}
              </div>

              {/* All-day Google Calendar events */}
              {allDayGoogleEvents.length > 0 && (
                <div className="bg-background sticky top-[72px] z-10 grid grid-cols-[60px_repeat(7,1fr)] border-b bg-purple-50 dark:bg-purple-950/20">
                  <div className="flex items-center justify-center p-2">
                    <Calendar className="h-4 w-4 text-purple-500" />
                  </div>
                  {weekDays.map((day) => {
                    const dayEvents = allDayGoogleEvents.filter((event) =>
                      isSameDay(new Date(event.startTime), day),
                    );
                    return (
                      <div
                        key={`allday-${day.toISOString()}`}
                        className="flex flex-wrap gap-1 border-l p-1"
                      >
                        {dayEvents.map((event) => (
                          <button
                            key={`allday-${event.id}`}
                            className="flex items-center gap-1 rounded-full border border-purple-300/50 bg-purple-100 px-2 py-0.5 text-xs text-purple-700 transition-colors hover:bg-purple-200 dark:border-purple-700/50 dark:bg-purple-900/30 dark:text-purple-300 dark:hover:bg-purple-900/50"
                            onClick={() => handleGoogleEventClick(event)}
                          >
                            <span className="max-w-[80px] truncate">
                              {event.title}
                            </span>
                          </button>
                        ))}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Time grid */}
              <div className="grid grid-cols-[60px_repeat(7,1fr)]">
                {/* Time labels */}
                <div className="relative">
                  {Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => (
                    <div
                      key={i}
                      className="text-muted-foreground absolute right-2 -translate-y-1/2 text-xs"
                      style={{ top: i * HOUR_HEIGHT }}
                    >
                      {format(
                        setHours(setMinutes(new Date(), 0), START_HOUR + i),
                        "h a",
                      )}
                    </div>
                  ))}
                </div>

                {/* Day columns */}
                {weekDays.map((day) => (
                  <DayColumn
                    key={day.toISOString()}
                    day={day}
                    hourHeight={HOUR_HEIGHT}
                    blocks={getBlocksForDay(day)}
                    scheduledTasks={getScheduledTasksForDay(day)}
                    googleEvents={getGoogleEventsForDay(day)}
                    draggedTaskId={draggedTaskId}
                    onSlotClick={handleSlotClick}
                    onDrop={handleDrop}
                    onTimeBlockClick={handleTimeBlockClick}
                    onTaskClick={handleTaskClick}
                    onGoogleEventClick={handleGoogleEventClick}
                  />
                ))}
              </div>
            </div>
          </ScrollArea>
        </Card>

        {/* Main calendar grid - Mobile (3-day view) */}
        <Card className="flex-1 overflow-hidden md:hidden" {...swipeHandlers}>
          <ScrollArea className="h-full">
            <div>
              {/* Day headers */}
              <div className="bg-background sticky top-0 z-10 grid grid-cols-[40px_repeat(3,1fr)] border-b">
                <div className="p-1" /> {/* Time column header */}
                {mobileDays.map((day) => (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      "border-l p-1.5 text-center",
                      isToday(day) && "bg-primary/5",
                    )}
                  >
                    <div className="text-muted-foreground text-xs font-medium">
                      {format(day, "EEE")}
                    </div>
                    <div
                      className={cn(
                        "text-base font-semibold",
                        isToday(day) &&
                          "bg-primary text-primary-foreground mx-auto flex h-7 w-7 items-center justify-center rounded-full text-sm",
                      )}
                    >
                      {format(day, "d")}
                    </div>
                  </div>
                ))}
              </div>

              {/* All-day Google Calendar events - Mobile */}
              {allDayGoogleEvents.filter((e) =>
                mobileDays.some((d) => isSameDay(new Date(e.startTime), d)),
              ).length > 0 && (
                <div className="bg-background sticky top-[56px] z-10 grid grid-cols-[40px_repeat(3,1fr)] border-b bg-purple-50 dark:bg-purple-950/20">
                  <div className="flex items-center justify-center p-1">
                    <Calendar className="h-3 w-3 text-purple-500" />
                  </div>
                  {mobileDays.map((day) => {
                    const dayEvents = allDayGoogleEvents.filter((event) =>
                      isSameDay(new Date(event.startTime), day),
                    );
                    return (
                      <div
                        key={`allday-mobile-${day.toISOString()}`}
                        className="flex flex-wrap gap-0.5 border-l p-0.5"
                      >
                        {dayEvents.map((event) => (
                          <button
                            key={`allday-mobile-${event.id}`}
                            className="w-full truncate rounded border border-purple-300/50 bg-purple-100 px-1 py-0.5 text-left text-[10px] text-purple-700 dark:border-purple-700/50 dark:bg-purple-900/30 dark:text-purple-300"
                            onClick={() => handleGoogleEventClick(event)}
                          >
                            {event.title}
                          </button>
                        ))}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Time grid - Mobile */}
              <div className="grid grid-cols-[40px_repeat(3,1fr)]">
                {/* Time labels */}
                <div className="relative">
                  {Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => (
                    <div
                      key={i}
                      className="text-muted-foreground absolute right-1 -translate-y-1/2 text-[10px]"
                      style={{ top: i * HOUR_HEIGHT_MOBILE }}
                    >
                      {format(
                        setHours(setMinutes(new Date(), 0), START_HOUR + i),
                        "ha",
                      ).toLowerCase()}
                    </div>
                  ))}
                </div>

                {/* Day columns - Mobile */}
                {mobileDays.map((day) => (
                  <DayColumn
                    key={`mobile-${day.toISOString()}`}
                    day={day}
                    hourHeight={HOUR_HEIGHT_MOBILE}
                    blocks={getBlocksForDay(day)}
                    scheduledTasks={getScheduledTasksForDay(day)}
                    googleEvents={getGoogleEventsForDay(day)}
                    draggedTaskId={draggedTaskId}
                    onSlotClick={handleSlotClick}
                    onDrop={handleDrop}
                    onTimeBlockClick={handleTimeBlockClick}
                    onTaskClick={handleTaskClick}
                    onGoogleEventClick={handleGoogleEventClick}
                    isMobile
                  />
                ))}
              </div>
            </div>
          </ScrollArea>
        </Card>

        {/* Sidebar - Unscheduled tasks */}
        <Card className="hidden w-80 lg:flex lg:flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4" />
              Unscheduled Tasks
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden">
            {/* Quick Add Task */}
            <div className="mb-4">
              {isAddingTask ? (
                <div className="flex flex-col gap-2">
                  <Input
                    placeholder="What needs to be done?"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    onKeyDown={handleKeyDown}
                    autoFocus
                    disabled={createTaskMutation.isPending}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={handleQuickAdd}
                      disabled={
                        !newTaskTitle.trim() || createTaskMutation.isPending
                      }
                    >
                      {createTaskMutation.isPending ? "Adding..." : "Add Task"}
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
                  className="text-muted-foreground w-full justify-start"
                  onClick={() => setIsAddingTask(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add a task
                </Button>
              )}
            </div>

            <ScrollArea className="h-[calc(100%-60px)]">
              {unscheduledTasks.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  All tasks are scheduled!
                </p>
              ) : (
                <div className="space-y-2">
                  <p className="text-muted-foreground mb-2 text-xs">
                    Drag tasks to calendar to schedule
                  </p>
                  {unscheduledTasks.map((task) => (
                    <div
                      key={task.id}
                      className={cn(
                        "hover:bg-muted/50 cursor-grab rounded-lg border p-2 text-sm transition-colors",
                        draggedTaskId === task.id && "opacity-50",
                      )}
                      draggable
                      onDragStart={() => setDraggedTaskId(task.id)}
                      onDragEnd={() => setDraggedTaskId(null)}
                    >
                      <div className="font-medium">{task.title}</div>
                      <div className="mt-1 flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs",
                            task.priority === "urgent" &&
                              "border-red-500 text-red-500",
                            task.priority === "high" &&
                              "border-orange-500 text-orange-500",
                            task.priority === "medium" &&
                              "border-yellow-500 text-yellow-500",
                            task.priority === "low" &&
                              "border-blue-500 text-blue-500",
                          )}
                        >
                          {task.priority}
                        </Badge>
                        {task.dueDate && (
                          <span className="text-muted-foreground text-xs">
                            Due {format(new Date(task.dueDate), "MMM d")}
                          </span>
                        )}
                        {task.estimatedMinutes && (
                          <span className="text-muted-foreground text-xs">
                            ~{task.estimatedMinutes}m
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Create time block dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Time Block</DialogTitle>
          </DialogHeader>
          <CreateTimeBlockForm
            selectedSlot={selectedSlot}
            onSubmit={(data) => {
              createTimeBlock.mutate(data);
            }}
            isLoading={createTimeBlock.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Event Detail Sheet */}
      <Sheet
        open={isEventSheetOpen}
        onOpenChange={(open) => {
          if (!open) handleCloseEventSheet();
          else setIsEventSheetOpen(true);
        }}
      >
        <SheetContent side="right" className="w-full sm:max-w-md">
          {selectedEvent && (
            <EventDetailContent
              event={selectedEvent}
              isEditMode={isEditMode}
              onEdit={() => setIsEditMode(true)}
              onCancelEdit={() => setIsEditMode(false)}
              onUpdate={(data) => {
                if (selectedEvent.type === "timeBlock") {
                  updateTimeBlock.mutate({
                    id: selectedEvent.data.id,
                    ...data,
                  });
                }
              }}
              onDelete={() => {
                if (selectedEvent.type === "timeBlock") {
                  deleteTimeBlock.mutate({ id: selectedEvent.data.id });
                }
              }}
              isUpdating={updateTimeBlock.isPending}
              isDeleting={deleteTimeBlock.isPending}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* Mobile: Floating Action Button for unscheduled tasks */}
      <Button
        className="fixed right-6 bottom-6 h-14 w-14 rounded-full shadow-lg md:hidden"
        size="icon"
        onClick={() => setIsUnscheduledSheetOpen(true)}
      >
        <ListTodo className="h-6 w-6" />
      </Button>

      {/* Mobile: Unscheduled Tasks Bottom Sheet */}
      <Sheet
        open={isUnscheduledSheetOpen}
        onOpenChange={setIsUnscheduledSheetOpen}
      >
        <SheetContent side="bottom" className="h-[70vh] rounded-t-xl">
          <SheetHeader className="pb-2">
            <SheetTitle className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Unscheduled Tasks ({unscheduledTasks.length})
            </SheetTitle>
            <SheetDescription>
              Drag tasks to the calendar to schedule them
            </SheetDescription>
          </SheetHeader>
          <div className="mt-2">
            {/* Quick Add Task */}
            <div className="mb-4">
              {isAddingTask ? (
                <div className="flex flex-col gap-2">
                  <Input
                    placeholder="What needs to be done?"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    onKeyDown={handleKeyDown}
                    autoFocus
                    disabled={createTaskMutation.isPending}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={handleQuickAdd}
                      disabled={
                        !newTaskTitle.trim() || createTaskMutation.isPending
                      }
                    >
                      {createTaskMutation.isPending ? "Adding..." : "Add Task"}
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
                  className="text-muted-foreground w-full justify-start"
                  onClick={() => setIsAddingTask(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add a task
                </Button>
              )}
            </div>
          </div>
          <ScrollArea className="h-[calc(100%-120px)]">
            {unscheduledTasks.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center text-sm">
                All tasks are scheduled!
              </p>
            ) : (
              <div className="space-y-2 pr-4">
                {unscheduledTasks.map((task) => (
                  <div
                    key={task.id}
                    className="hover:bg-muted/50 rounded-lg border p-3 transition-colors"
                  >
                    <div className="font-medium">{task.title}</div>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs",
                          task.priority === "urgent" &&
                            "border-red-500 text-red-500",
                          task.priority === "high" &&
                            "border-orange-500 text-orange-500",
                          task.priority === "medium" &&
                            "border-yellow-500 text-yellow-500",
                          task.priority === "low" &&
                            "border-blue-500 text-blue-500",
                        )}
                      >
                        {task.priority}
                      </Badge>
                      {task.dueDate && (
                        <span className="text-muted-foreground text-xs">
                          Due {format(new Date(task.dueDate), "MMM d")}
                        </span>
                      )}
                      {task.estimatedMinutes && (
                        <span className="text-muted-foreground text-xs">
                          ~{task.estimatedMinutes}m
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Task Detail Modal */}
      <TaskDetailModal
        task={selectedTask}
        open={isTaskModalOpen}
        onOpenChange={setIsTaskModalOpen}
      />
    </div>
  );
}

function CurrentTimeIndicator({
  hourHeight = HOUR_HEIGHT,
}: {
  hourHeight?: number;
}) {
  const now = new Date();
  const minutes = (now.getHours() - START_HOUR) * 60 + now.getMinutes();
  const top = (minutes / 60) * hourHeight;

  if (now.getHours() < START_HOUR || now.getHours() >= END_HOUR) {
    return null;
  }

  return (
    <div className="absolute inset-x-0 z-20 flex items-center" style={{ top }}>
      <div className="-ml-1.5 h-3 w-3 rounded-full bg-red-500" />
      <div className="flex-1 border-t-2 border-red-500" />
    </div>
  );
}

// DayColumn component for rendering a single day's events
interface DayColumnProps {
  day: Date;
  hourHeight: number;
  blocks: TimeBlock[];
  scheduledTasks: Task[];
  googleEvents: GoogleCalendarEvent[];
  draggedTaskId: string | null;
  onSlotClick: (date: Date, hour: number) => void;
  onDrop: (day: Date, hour: number) => void;
  onTimeBlockClick: (block: TimeBlock) => void;
  onTaskClick: (task: Task) => void;
  onGoogleEventClick: (event: GoogleCalendarEvent) => void;
  isMobile?: boolean;
}

function DayColumn({
  day,
  hourHeight,
  blocks,
  scheduledTasks,
  googleEvents,
  draggedTaskId,
  onSlotClick,
  onDrop,
  onTimeBlockClick,
  onTaskClick,
  onGoogleEventClick,
  isMobile = false,
}: DayColumnProps) {
  return (
    <div
      className={cn("relative border-l", isToday(day) && "bg-primary/5")}
      style={{ height: TOTAL_HOURS * hourHeight }}
    >
      {/* Hour lines with drag-drop support */}
      {Array.from({ length: TOTAL_HOURS }, (_, i) => (
        <div
          key={i}
          className={cn(
            "border-muted absolute inset-x-0 cursor-pointer border-b border-dashed transition-colors",
            draggedTaskId && "hover:bg-primary/10",
          )}
          style={{
            top: i * hourHeight,
            height: hourHeight,
          }}
          onClick={() => onSlotClick(day, START_HOUR + i)}
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
          }}
          onDrop={(e) => {
            e.preventDefault();
            onDrop(day, START_HOUR + i);
          }}
        />
      ))}

      {/* Time blocks */}
      {blocks.map((block) => {
        const blockStart = new Date(block.startTime);
        const blockEnd = new Date(block.endTime);
        const startMinutes =
          (blockStart.getHours() - START_HOUR) * 60 + blockStart.getMinutes();
        const durationMinutes = differenceInMinutes(blockEnd, blockStart);
        const top = (startMinutes / 60) * hourHeight;
        const height = (durationMinutes / 60) * hourHeight;

        return (
          <button
            key={block.id}
            className={cn(
              "absolute inset-x-0.5 cursor-pointer overflow-hidden rounded-md p-1 text-left transition-opacity hover:opacity-90",
              isMobile ? "text-[10px]" : "text-xs",
              block.isCompleted && "opacity-60",
            )}
            style={{
              top: Math.max(0, top),
              height: Math.max(isMobile ? 18 : 20, height),
              backgroundColor: block.color ?? "#3b82f6",
            }}
            onClick={(e) => {
              e.stopPropagation();
              onTimeBlockClick(block);
            }}
          >
            <div className="truncate font-medium text-white">{block.title}</div>
            {height > (isMobile ? 25 : 30) && (
              <div className="truncate text-white/80">
                {format(blockStart, "h:mm a")}
              </div>
            )}
          </button>
        );
      })}

      {/* Google Calendar events */}
      {googleEvents.map((event) => {
        const eventStart = new Date(event.startTime);
        const eventEnd = new Date(event.endTime);
        const startMinutes =
          (eventStart.getHours() - START_HOUR) * 60 + eventStart.getMinutes();
        const durationMinutes = differenceInMinutes(eventEnd, eventStart);
        const top = (startMinutes / 60) * hourHeight;
        const height = (durationMinutes / 60) * hourHeight;

        return (
          <button
            key={`google-${event.id}`}
            className={cn(
              "absolute inset-x-0.5 cursor-pointer overflow-hidden rounded-md border border-dashed border-purple-400/50 bg-purple-500/10 p-1 text-left transition-colors hover:bg-purple-500/20",
              isMobile ? "text-[10px]" : "text-xs",
            )}
            style={{
              top: Math.max(0, top),
              height: Math.max(isMobile ? 18 : 20, height),
            }}
            onClick={(e) => {
              e.stopPropagation();
              onGoogleEventClick(event);
            }}
          >
            <div className="truncate font-medium text-purple-700 dark:text-purple-300">
              {event.title}
            </div>
            {height > (isMobile ? 25 : 30) && (
              <div className="truncate text-purple-600/70 dark:text-purple-400/70">
                {format(eventStart, "h:mm a")}
              </div>
            )}
          </button>
        );
      })}

      {/* Scheduled tasks (not in time blocks) */}
      {scheduledTasks.map((task) => {
        if (!task.scheduledStart) return null;
        const taskStart = new Date(task.scheduledStart);
        const taskEnd = task.scheduledEnd
          ? new Date(task.scheduledEnd)
          : new Date(
              taskStart.getTime() + (task.estimatedMinutes ?? 60) * 60 * 1000,
            );
        const startMinutes =
          (taskStart.getHours() - START_HOUR) * 60 + taskStart.getMinutes();
        const durationMinutes = differenceInMinutes(taskEnd, taskStart);
        const top = (startMinutes / 60) * hourHeight;
        const height = (durationMinutes / 60) * hourHeight;

        const priorityColors = {
          urgent: "#ef4444",
          high: "#f97316",
          medium: "#eab308",
          low: "#3b82f6",
        };

        return (
          <button
            key={task.id}
            className={cn(
              "bg-card hover:bg-muted/50 absolute inset-x-0.5 cursor-pointer overflow-hidden rounded-md border-l-4 p-1 text-left shadow-sm transition-colors",
              isMobile ? "text-[10px]" : "text-xs",
            )}
            style={{
              top: Math.max(0, top),
              height: Math.max(isMobile ? 18 : 20, height),
              borderLeftColor: priorityColors[task.priority] ?? "#3b82f6",
            }}
            onClick={(e) => {
              e.stopPropagation();
              onTaskClick(task);
            }}
          >
            <div className="truncate font-medium">{task.title}</div>
            {height > (isMobile ? 25 : 30) && (
              <div className="text-muted-foreground truncate">
                {format(taskStart, "h:mm a")}
              </div>
            )}
          </button>
        );
      })}

      {/* Current time indicator */}
      {isToday(day) && <CurrentTimeIndicator hourHeight={hourHeight} />}
    </div>
  );
}

// Event Detail Content component
interface EventDetailContentProps {
  event: SelectedEvent;
  isEditMode: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onUpdate: (data: {
    title?: string;
    startTime?: string;
    endTime?: string;
    color?: string;
    notes?: string;
  }) => void;
  onDelete: () => void;
  isUpdating: boolean;
  isDeleting: boolean;
}

function EventDetailContent({
  event,
  isEditMode,
  onEdit,
  onCancelEdit,
  onUpdate,
  onDelete,
  isUpdating,
  isDeleting,
}: EventDetailContentProps) {
  // Edit form state for time blocks
  const [editTitle, setEditTitle] = useState(
    event.type === "timeBlock" ? event.data.title : "",
  );
  const [editStartTime, setEditStartTime] = useState(
    event.type === "timeBlock"
      ? format(new Date(event.data.startTime), "yyyy-MM-dd'T'HH:mm")
      : "",
  );
  const [editEndTime, setEditEndTime] = useState(
    event.type === "timeBlock"
      ? format(new Date(event.data.endTime), "yyyy-MM-dd'T'HH:mm")
      : "",
  );
  const [editColor, setEditColor] = useState(
    event.type === "timeBlock" ? (event.data.color ?? "#3b82f6") : "#3b82f6",
  );
  const [editNotes, setEditNotes] = useState(
    event.type === "timeBlock" ? (event.data.notes ?? "") : "",
  );

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSave = () => {
    onUpdate({
      title: editTitle,
      startTime: new Date(editStartTime).toISOString(),
      endTime: new Date(editEndTime).toISOString(),
      color: editColor,
      notes: editNotes || undefined,
    });
  };

  if (event.type === "timeBlock") {
    const block = event.data;
    const startTime = new Date(block.startTime);
    const endTime = new Date(block.endTime);

    return (
      <>
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: block.color ?? "#3b82f6" }}
            />
            {isEditMode ? "Edit Time Block" : block.title}
          </SheetTitle>
          <SheetDescription>
            {format(startTime, "EEEE, MMMM d, yyyy")}
          </SheetDescription>
        </SheetHeader>

        {isEditMode ? (
          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-start">Start</Label>
                <Input
                  id="edit-start"
                  type="datetime-local"
                  value={editStartTime}
                  onChange={(e) => setEditStartTime(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-end">End</Label>
                <Input
                  id="edit-end"
                  type="datetime-local"
                  value={editEndTime}
                  onChange={(e) => setEditEndTime(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2">
                {[
                  "#3b82f6",
                  "#ef4444",
                  "#22c55e",
                  "#f97316",
                  "#8b5cf6",
                  "#ec4899",
                ].map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={cn(
                      "h-8 w-8 rounded-full border-2 transition-all",
                      editColor === c
                        ? "border-foreground scale-110"
                        : "border-transparent",
                    )}
                    style={{ backgroundColor: c }}
                    onClick={() => setEditColor(c)}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={handleSave}
                disabled={isUpdating}
              >
                {isUpdating ? "Saving..." : "Save Changes"}
              </Button>
              <Button variant="outline" onClick={onCancelEdit}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="text-muted-foreground h-4 w-4" />
              <span>
                {format(startTime, "h:mm a")} - {format(endTime, "h:mm a")}
              </span>
              <span className="text-muted-foreground">
                ({differenceInMinutes(endTime, startTime)} min)
              </span>
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

            <Separator />

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={onEdit}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Button>
              {showDeleteConfirm ? (
                <div className="flex flex-1 gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    className="flex-1"
                    onClick={onDelete}
                    disabled={isDeleting}
                  >
                    {isDeleting ? "..." : "Confirm"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              )}
            </div>
          </div>
        )}
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

interface CreateTimeBlockFormProps {
  selectedSlot: { date: Date; hour: number } | null;
  onSubmit: (data: {
    title: string;
    startTime: string;
    endTime: string;
    color?: string;
    notes?: string;
  }) => void;
  isLoading: boolean;
}

function CreateTimeBlockForm({
  selectedSlot,
  onSubmit,
  isLoading,
}: CreateTimeBlockFormProps) {
  const defaultStartTime = selectedSlot
    ? setMinutes(setHours(selectedSlot.date, selectedSlot.hour), 0)
    : new Date();
  const defaultEndTime = new Date(defaultStartTime.getTime() + 60 * 60 * 1000);

  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState(
    format(defaultStartTime, "yyyy-MM-dd'T'HH:mm"),
  );
  const [endTime, setEndTime] = useState(
    format(defaultEndTime, "yyyy-MM-dd'T'HH:mm"),
  );
  const [color, setColor] = useState("#3b82f6");
  const [notes, setNotes] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      title,
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
      color,
      notes: notes || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What are you working on?"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startTime">Start Time</Label>
          <Input
            id="startTime"
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endTime">End Time</Label>
          <Input
            id="endTime"
            type="datetime-local"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="color">Color</Label>
        <div className="flex gap-2">
          {[
            "#3b82f6",
            "#ef4444",
            "#22c55e",
            "#f97316",
            "#8b5cf6",
            "#ec4899",
          ].map((c) => (
            <button
              key={c}
              type="button"
              className={cn(
                "h-8 w-8 rounded-full border-2 transition-all",
                color === c
                  ? "border-foreground scale-110"
                  : "border-transparent",
              )}
              style={{ backgroundColor: c }}
              onClick={() => setColor(c)}
            />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes (optional)</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any notes..."
          rows={3}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Creating..." : "Create Time Block"}
      </Button>
    </form>
  );
}
