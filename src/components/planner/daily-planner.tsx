"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { format, isToday, addDays, subDays } from "date-fns";
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
import { api } from "~/trpc/react";
import { toast } from "~/components/ui/sonner";
import type { RouterOutputs } from "~/trpc/react";

type TodayTask = RouterOutputs["task"]["getToday"][number];
type BacklogTask = RouterOutputs["task"]["getBacklog"][number];

interface DailyPlannerProps {
  initialTasks: TodayTask[];
  initialBacklog: BacklogTask[];
  initialCompletedCount: number;
}

export function DailyPlanner({
  initialTasks,
  initialBacklog,
  initialCompletedCount,
}: DailyPlannerProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [backlogOpen, setBacklogOpen] = useState(false);

  const isViewingToday = isToday(selectedDate);

  // Format dateString for API calls (YYYY-MM-DD)
  const dateString = useMemo(() => {
    return format(selectedDate, "yyyy-MM-dd");
  }, [selectedDate]);

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

          {/* Task List */}
          <div className="space-y-2">
            {sortedTasks.length === 0 ? (
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
              sortedTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  isSelected={isSelected(task.id)}
                  onComplete={handleComplete}
                  onSnooze={handleSnooze}
                  onDelete={handleDelete}
                  onDragStart={(e) => handleDragStart(e, task.id, "today")}
                  onSelect={() => setSelectedId(task.id)}
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
    </div>
  );
}

// Task item component for today's tasks
interface TaskItemProps {
  task: TodayTask;
  isSelected?: boolean;
  onComplete: (id: string) => void;
  onSnooze: (id: string) => void;
  onDelete: (id: string) => void;
  onDragStart: (e: React.DragEvent) => void;
  onSelect?: () => void;
  refCallback?: (el: HTMLDivElement | null) => void;
}

function TaskItem({
  task,
  isSelected,
  onComplete,
  onSnooze,
  onDelete,
  onDragStart,
  onSelect,
  refCallback,
}: TaskItemProps) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const isOverdue =
    task.dueDate &&
    new Date(task.dueDate) < now &&
    !isToday(new Date(task.dueDate));

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
          "touch-pan-y", // Allow vertical scroll but capture horizontal
          !isSwiping && "rounded-lg", // Only round when not swiping
          !isSwiping && "hover:bg-muted/50",
          isOverdue && "border-red-500/30 bg-red-500/5",
        )}
        style={{
          transform: isSwiping ? `translateX(${offset}px)` : undefined,
          transition: isSwiping ? "none" : "transform 0.2s ease-out",
        }}
        draggable
        onDragStart={onDragStart}
        onClick={onSelect}
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
