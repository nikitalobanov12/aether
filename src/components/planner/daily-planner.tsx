"use client";

import { useState, useMemo, useCallback } from "react";
import { format, isToday, addDays, subDays } from "date-fns";
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
  const { data: tasks = initialTasks, refetch: refetchTasks } =
    api.task.getToday.useQuery(
      { dateString, includeOverdue: true },
      {
        initialData: isViewingToday ? initialTasks : undefined,
      },
    );

  // Fetch backlog tasks
  const { data: backlogTasks = initialBacklog, refetch: refetchBacklog } =
    api.task.getBacklog.useQuery(undefined, {
      initialData: initialBacklog,
    });

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
    onSuccess: (completedTask) => {
      void refetchTasks();
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
  });

  const uncompleteMutation = api.task.uncomplete.useMutation({
    onSuccess: () => {
      void refetchTasks();
      void utils.history.getToday.invalidate();
      toast.info("Task restored");
    },
  });

  const snoozeMutation = api.task.snooze.useMutation({
    onSuccess: () => {
      void refetchTasks();
      toast.info("Task snoozed to tomorrow");
    },
  });

  const deleteMutation = api.task.delete.useMutation({
    onSuccess: () => {
      void refetchTasks();
      void refetchBacklog();
      toast.success("Task deleted");
    },
  });

  const createTaskMutation = api.task.create.useMutation({
    onSuccess: () => {
      void refetchTasks();
      setNewTaskTitle("");
      setIsAddingTask(false);
    },
  });

  const addToDayMutation = api.task.addToDay.useMutation({
    onSuccess: () => {
      void refetchTasks();
      void refetchBacklog();
      toast.success("Task added to today");
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

    // Set due date to end of selected day
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
                  onComplete={handleComplete}
                  onSnooze={handleSnooze}
                  onDelete={handleDelete}
                  onDragStart={(e) => handleDragStart(e, task.id, "today")}
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
  onComplete: (id: string) => void;
  onSnooze: (id: string) => void;
  onDelete: (id: string) => void;
  onDragStart: (e: React.DragEvent) => void;
}

function TaskItem({
  task,
  onComplete,
  onSnooze,
  onDelete,
  onDragStart,
}: TaskItemProps) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const isOverdue =
    task.dueDate &&
    new Date(task.dueDate) < now &&
    !isToday(new Date(task.dueDate));

  return (
    <div
      className={cn(
        "group flex items-start gap-3 rounded-lg border p-3 transition-colors",
        "hover:bg-muted/50",
        isOverdue && "border-red-500/30 bg-red-500/5",
      )}
      draggable
      onDragStart={onDragStart}
    >
      {/* Drag handle */}
      <div className="text-muted-foreground mt-0.5 cursor-grab opacity-0 transition-opacity group-hover:opacity-100">
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
