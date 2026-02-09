"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  format,
  isToday,
  isTomorrow,
  isPast,
  isThisWeek,
  isThisYear,
} from "date-fns";
import {
  X,
  Calendar,
  Clock,
  Flag,
  Folder,
  Target,
  Tag,
  CheckCircle2,
  Trash2,
  AlarmClock,
  MoreHorizontal,
  Play,
  Sparkles,
  Loader2,
  Plus,
  Check,
  Link,
  Search,
} from "lucide-react";

import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Dialog, DialogContent, DialogTitle } from "~/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Calendar as CalendarPicker } from "~/components/ui/calendar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Separator } from "~/components/ui/separator";
import { api } from "~/trpc/react";
import { toast } from "~/components/ui/sonner";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";

// Define a minimal task interface that covers both Today and Calendar task types
// This allows the modal to work with tasks from either page
interface Task {
  id: string;
  title: string;
  description: string | null;
  status: "todo" | "in_progress" | "completed" | "cancelled";
  priority: "low" | "medium" | "high" | "urgent";
  dueDate: Date | null;
  scheduledStart: Date | null;
  scheduledEnd: Date | null;
  estimatedMinutes: number | null;
  tags: string[] | null;
  projectId: string | null;
  project?: { id: string; title: string } | null;
  goal?: { id: string; title: string } | null;
  goalId: string | null;
  // Optional fields that only exist on Today page tasks
  isNextUp?: boolean;
  subtasks?: Array<{ id: string; title: string; status: string }>;
}

// Props for the modal
interface TaskDetailModalProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: (taskId: string) => void;
  onSnooze?: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
}

// Teal accent color for Next Up (matching DailyPlanner)
const TEAL_ACCENT = "#32B8C6";

// Priority configuration
const priorityConfig = {
  urgent: {
    label: "Urgent",
    color: "text-red-500",
    borderColor: "border-red-500",
    bgColor: "bg-red-500/10",
    icon: "text-red-500",
  },
  high: {
    label: "High",
    color: "text-orange-500",
    borderColor: "border-orange-500",
    bgColor: "bg-orange-500/10",
    icon: "text-orange-500",
  },
  medium: {
    label: "Medium",
    color: "text-yellow-500",
    borderColor: "border-yellow-500",
    bgColor: "bg-yellow-500/10",
    icon: "text-yellow-500",
  },
  low: {
    label: "Low",
    color: "text-blue-500",
    borderColor: "border-blue-500",
    bgColor: "bg-blue-500/10",
    icon: "text-blue-500",
  },
};

// Format due date in a human-readable way
function formatDueDate(date: Date): string {
  if (isToday(date)) return "Today";
  if (isTomorrow(date)) return "Tomorrow";
  if (isThisWeek(date)) return format(date, "EEEE"); // "Monday"
  if (isThisYear(date)) return format(date, "MMM d"); // "Jan 15"
  return format(date, "MMM d, yyyy"); // "Jan 15, 2025"
}

export function TaskDetailModal({
  task,
  open,
  onOpenChange,
  onComplete,
  onSnooze,
  onDelete,
}: TaskDetailModalProps) {
  // Local state for inline editing
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [isDueDateOpen, setIsDueDateOpen] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<string>>(
    new Set(),
  );
  const [dependencySearchOpen, setDependencySearchOpen] = useState(false);
  const [dependencySearchQuery, setDependencySearchQuery] = useState("");

  const titleInputRef = useRef<HTMLInputElement>(null);
  const descriptionTextareaRef = useRef<HTMLTextAreaElement>(null);

  const utils = api.useUtils();

  // Update mutation
  const updateMutation = api.task.update.useMutation({
    onError: () => {
      toast.error("Failed to update task");
    },
    onSuccess: () => {
      toast.success("Task updated");
    },
    onSettled: () => {
      void utils.task.getToday.invalidate();
      void utils.task.getBacklog.invalidate();
      void utils.task.getByDateRange.invalidate();
      void utils.task.getAll.invalidate();
    },
  });

  // Delete mutation (if not provided externally)
  const deleteMutation = api.task.delete.useMutation({
    onError: () => {
      toast.error("Failed to delete task");
    },
    onSuccess: () => {
      toast.success("Task deleted");
      onOpenChange(false);
    },
    onSettled: () => {
      void utils.task.getToday.invalidate();
      void utils.task.getBacklog.invalidate();
      void utils.task.getByDateRange.invalidate();
    },
  });

  // Complete mutation (if not provided externally)
  const completeMutation = api.task.complete.useMutation({
    onSuccess: (completedTask) => {
      if (completedTask) {
        toast.success("Task completed!", {
          description: completedTask.title,
        });
      }
      onOpenChange(false);
    },
    onError: () => {
      toast.error("Failed to complete task");
    },
    onSettled: () => {
      void utils.task.getToday.invalidate();
      void utils.task.getBacklog.invalidate();
      void utils.task.getByDateRange.invalidate();
      void utils.history.getToday.invalidate();
    },
  });

  // Snooze mutation (if not provided externally)
  const snoozeMutation = api.task.snooze.useMutation({
    onSuccess: () => {
      toast.info("Task snoozed to tomorrow");
      onOpenChange(false);
    },
    onError: () => {
      toast.error("Failed to snooze task");
    },
    onSettled: () => {
      void utils.task.getToday.invalidate();
      void utils.task.getBacklog.invalidate();
      void utils.task.getByDateRange.invalidate();
    },
  });

  // AI subtask suggestion mutation
  const suggestBreakdownMutation = api.ai.suggestBreakdown.useMutation({
    onSuccess: (suggestions) => {
      if (suggestions && suggestions.length > 0) {
        setAiSuggestions(suggestions);
        setSelectedSuggestions(new Set(suggestions));
      } else {
        toast.info("No subtask suggestions generated");
      }
    },
    onError: () => {
      toast.error("Failed to generate subtask suggestions");
    },
  });

  // Create subtasks from AI suggestions
  const createSubtasksMutation =
    api.ai.createSubtasksFromSuggestions.useMutation({
      onSuccess: (created) => {
        toast.success(`Created ${created.length} subtasks`);
        setAiSuggestions([]);
        setSelectedSuggestions(new Set());
      },
      onError: () => {
        toast.error("Failed to create subtasks");
      },
      onSettled: () => {
        void utils.task.getToday.invalidate();
        void utils.task.getBacklog.invalidate();
        void utils.task.getByDateRange.invalidate();
        void utils.task.getAll.invalidate();
      },
    });

  // Task dependency queries and mutations
  const dependenciesQuery = api.taskDependency.getForTask.useQuery(
    { taskId: task?.id ?? "" },
    { enabled: !!task?.id },
  );

  const allTasksQuery = api.task.getAll.useQuery(undefined, {
    enabled: dependencySearchOpen,
  });

  const addDependencyMutation = api.taskDependency.add.useMutation({
    onSuccess: () => {
      toast.success("Dependency added");
      setDependencySearchOpen(false);
      setDependencySearchQuery("");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add dependency");
    },
    onSettled: () => {
      void utils.taskDependency.getForTask.invalidate();
    },
  });

  const removeDependencyMutation = api.taskDependency.remove.useMutation({
    onSuccess: () => {
      toast.success("Dependency removed");
    },
    onError: () => {
      toast.error("Failed to remove dependency");
    },
    onSettled: () => {
      void utils.taskDependency.getForTask.invalidate();
    },
  });

  // Sync local state when task changes
  useEffect(() => {
    if (task) {
      setEditTitle(task.title);
      setEditDescription(task.description ?? "");
      setAiSuggestions([]);
      setSelectedSuggestions(new Set());
      setDependencySearchOpen(false);
      setDependencySearchQuery("");
    }
  }, [task]);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  useEffect(() => {
    if (isEditingDescription && descriptionTextareaRef.current) {
      descriptionTextareaRef.current.focus();
    }
  }, [isEditingDescription]);

  // Handlers
  const handleTitleSave = useCallback(() => {
    if (!task || !editTitle.trim()) return;
    if (editTitle.trim() !== task.title) {
      updateMutation.mutate({ id: task.id, title: editTitle.trim() });
    }
    setIsEditingTitle(false);
  }, [task, editTitle, updateMutation]);

  const handleDescriptionSave = useCallback(() => {
    if (!task) return;
    const newDescription = editDescription.trim() || undefined;
    if (editDescription.trim() !== (task.description ?? "")) {
      updateMutation.mutate({
        id: task.id,
        description: newDescription ?? null,
      } as Parameters<typeof updateMutation.mutate>[0]);
    }
    setIsEditingDescription(false);
  }, [task, editDescription, updateMutation]);

  const handlePriorityChange = useCallback(
    (priority: "low" | "medium" | "high" | "urgent") => {
      if (!task) return;
      updateMutation.mutate({ id: task.id, priority });
    },
    [task, updateMutation],
  );

  const handleDueDateChange = useCallback(
    (date: Date | undefined) => {
      if (!task) return;
      updateMutation.mutate({
        id: task.id,
        dueDate: date?.toISOString() ?? null,
      });
      setIsDueDateOpen(false);
    },
    [task, updateMutation],
  );

  const handleEstimatedMinutesChange = useCallback(
    (minutes: string) => {
      if (!task) return;
      const value = minutes ? parseInt(minutes, 10) : null;
      if (value === null || (value > 0 && !isNaN(value))) {
        updateMutation.mutate({
          id: task.id,
          estimatedMinutes: value,
        });
      }
    },
    [task, updateMutation],
  );

  const handleComplete = useCallback(() => {
    if (!task) return;
    if (onComplete) {
      onComplete(task.id);
      onOpenChange(false);
    } else {
      completeMutation.mutate({ id: task.id });
    }
  }, [task, onComplete, onOpenChange, completeMutation]);

  const handleSnooze = useCallback(() => {
    if (!task) return;
    if (onSnooze) {
      onSnooze(task.id);
      onOpenChange(false);
    } else {
      snoozeMutation.mutate({ id: task.id, days: 1 });
    }
  }, [task, onSnooze, onOpenChange, snoozeMutation]);

  const handleDelete = useCallback(() => {
    if (!task) return;
    if (onDelete) {
      onDelete(task.id);
      onOpenChange(false);
    } else {
      deleteMutation.mutate({ id: task.id });
    }
  }, [task, onDelete, onOpenChange, deleteMutation]);

  const handleSuggestSubtasks = useCallback(() => {
    if (!task) return;
    suggestBreakdownMutation.mutate({ taskId: task.id });
  }, [task, suggestBreakdownMutation]);

  const handleToggleSuggestion = useCallback((title: string) => {
    setSelectedSuggestions((prev) => {
      const next = new Set(prev);
      if (next.has(title)) {
        next.delete(title);
      } else {
        next.add(title);
      }
      return next;
    });
  }, []);

  const handleCreateSelectedSubtasks = useCallback(() => {
    if (!task || selectedSuggestions.size === 0) return;
    createSubtasksMutation.mutate({
      parentTaskId: task.id,
      subtaskTitles: Array.from(selectedSuggestions),
    });
  }, [task, selectedSuggestions, createSubtasksMutation]);

  const handleAddDependency = useCallback(
    (dependsOnTaskId: string) => {
      if (!task) return;
      addDependencyMutation.mutate({
        taskId: task.id,
        dependsOnTaskId,
      });
    },
    [task, addDependencyMutation],
  );

  const handleRemoveDependency = useCallback(
    (dependencyId: string) => {
      removeDependencyMutation.mutate({ id: dependencyId });
    },
    [removeDependencyMutation],
  );

  // Filter tasks for dependency picker (exclude self and existing dependencies)
  const availableTasksForDependency = allTasksQuery.data?.filter((t) => {
    if (!task) return false;
    if (t.id === task.id) return false;
    // Exclude tasks that are already dependencies
    const existingDeps = dependenciesQuery.data ?? [];
    if (existingDeps.some((d) => d.dependsOnTaskId === t.id)) return false;
    // Filter by search query
    if (dependencySearchQuery) {
      return t.title
        .toLowerCase()
        .includes(dependencySearchQuery.toLowerCase());
    }
    return true;
  });

  // Check if task is blocked (has incomplete dependencies)
  const hasIncompleteDependencies = (dependenciesQuery.data ?? []).some(
    (d) => d.dependsOnTask.status !== "completed",
  );

  if (!task) return null;

  const isOverdue =
    task.dueDate &&
    isPast(new Date(task.dueDate)) &&
    !isToday(new Date(task.dueDate));
  const priorityInfo = priorityConfig[task.priority];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[90vh] overflow-hidden p-0 sm:max-w-lg"
        showCloseButton={false}
      >
        <VisuallyHidden.Root>
          <DialogTitle>Task Details: {task.title}</DialogTitle>
        </VisuallyHidden.Root>

        {/* Header with close and actions */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            {/* Complete button */}
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-green-500"
              onClick={handleComplete}
              disabled={completeMutation.isPending}
            >
              <CheckCircle2 className="mr-1.5 h-4 w-4" />
              Complete
            </Button>
          </div>

          <div className="flex items-center gap-1">
            {/* More actions dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleSnooze}>
                  <AlarmClock className="mr-2 h-4 w-4" />
                  Snooze to tomorrow
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete task
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto px-4 py-4">
          {/* Next Up badge */}
          {task.isNextUp && (
            <Badge
              className="mb-3 text-xs"
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

          {/* Title - inline editable */}
          <div className="mb-4">
            {isEditingTitle ? (
              <Input
                ref={titleInputRef}
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleTitleSave();
                  }
                  if (e.key === "Escape") {
                    setEditTitle(task.title);
                    setIsEditingTitle(false);
                  }
                }}
                className="text-xl font-semibold"
              />
            ) : (
              <h2
                className="hover:text-foreground/80 cursor-text text-xl font-semibold transition-colors"
                onClick={() => setIsEditingTitle(true)}
              >
                {task.title}
              </h2>
            )}
          </div>

          {/* Metadata row */}
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {/* Priority selector */}
            <Select
              value={task.priority}
              onValueChange={(value) =>
                handlePriorityChange(
                  value as "low" | "medium" | "high" | "urgent",
                )
              }
            >
              <SelectTrigger
                className={cn(
                  "h-8 w-auto gap-1.5 border px-2",
                  priorityInfo.borderColor,
                  priorityInfo.bgColor,
                )}
              >
                <Flag className={cn("h-3.5 w-3.5", priorityInfo.icon)} />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="urgent">
                  <span className="flex items-center gap-2">
                    <Flag className="h-3.5 w-3.5 text-red-500" />
                    Urgent
                  </span>
                </SelectItem>
                <SelectItem value="high">
                  <span className="flex items-center gap-2">
                    <Flag className="h-3.5 w-3.5 text-orange-500" />
                    High
                  </span>
                </SelectItem>
                <SelectItem value="medium">
                  <span className="flex items-center gap-2">
                    <Flag className="h-3.5 w-3.5 text-yellow-500" />
                    Medium
                  </span>
                </SelectItem>
                <SelectItem value="low">
                  <span className="flex items-center gap-2">
                    <Flag className="h-3.5 w-3.5 text-blue-500" />
                    Low
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Due date picker */}
            <Popover open={isDueDateOpen} onOpenChange={setIsDueDateOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "h-8 gap-1.5",
                    isOverdue && "border-red-500 text-red-500",
                    !task.dueDate && "text-muted-foreground",
                  )}
                >
                  <Calendar className="h-3.5 w-3.5" />
                  {task.dueDate
                    ? formatDueDate(new Date(task.dueDate))
                    : "Set due date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarPicker
                  mode="single"
                  selected={task.dueDate ? new Date(task.dueDate) : undefined}
                  onSelect={handleDueDateChange}
                  initialFocus
                />
                {task.dueDate && (
                  <div className="border-t p-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground w-full"
                      onClick={() => handleDueDateChange(undefined)}
                    >
                      Clear due date
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>

            {/* Estimated time */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "h-8 gap-1.5",
                    !task.estimatedMinutes && "text-muted-foreground",
                  )}
                >
                  <Clock className="h-3.5 w-3.5" />
                  {task.estimatedMinutes
                    ? `${task.estimatedMinutes}m`
                    : "Estimate"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48" align="start">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Estimated time</p>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      min={1}
                      placeholder="Minutes"
                      defaultValue={task.estimatedMinutes ?? ""}
                      onChange={(e) => {
                        // Debounce-like: only update after user stops typing
                        const target = e.target;
                        const timeoutId = setTimeout(() => {
                          handleEstimatedMinutesChange(target.value);
                        }, 500);
                        return () => clearTimeout(timeoutId);
                      }}
                      className="h-8"
                    />
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {[15, 30, 60, 90, 120].map((min) => (
                      <Button
                        key={min}
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() =>
                          handleEstimatedMinutesChange(String(min))
                        }
                      >
                        {min >= 60 ? `${min / 60}h` : `${min}m`}
                      </Button>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Project and Goal */}
          {(task.project ?? task.goal) && (
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {task.project && (
                <Badge variant="secondary" className="gap-1.5">
                  <Folder className="h-3 w-3" />
                  {task.project.title}
                </Badge>
              )}
              {task.goal && (
                <Badge variant="outline" className="gap-1.5">
                  <Target className="h-3 w-3" />
                  {task.goal.title}
                </Badge>
              )}
            </div>
          )}

          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <div className="mb-4 flex flex-wrap items-center gap-1.5">
              <Tag className="text-muted-foreground h-3.5 w-3.5" />
              {task.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          <Separator className="my-4" />

          {/* Description - inline editable */}
          <div>
            <p className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
              Description
            </p>
            {isEditingDescription ? (
              <Textarea
                ref={descriptionTextareaRef}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                onBlur={handleDescriptionSave}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setEditDescription(task.description ?? "");
                    setIsEditingDescription(false);
                  }
                  // Allow Cmd/Ctrl + Enter to save
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    handleDescriptionSave();
                  }
                }}
                placeholder="Add a description..."
                className="min-h-[100px] resize-none"
                rows={4}
              />
            ) : (
              <div
                className={cn(
                  "hover:border-border hover:bg-muted/50 min-h-[60px] cursor-text rounded-md border border-transparent p-2 transition-colors",
                  !task.description && "text-muted-foreground",
                )}
                onClick={() => setIsEditingDescription(true)}
              >
                {task.description ? (
                  <p className="text-sm whitespace-pre-wrap">
                    {task.description}
                  </p>
                ) : (
                  <p className="text-sm italic">
                    Click to add a description...
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Scheduled time info */}
          {task.scheduledStart && (
            <>
              <Separator className="my-4" />
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4" />
                <span>
                  Scheduled for{" "}
                  {format(new Date(task.scheduledStart), "h:mm a")}
                  {task.scheduledEnd && (
                    <> - {format(new Date(task.scheduledEnd), "h:mm a")}</>
                  )}
                </span>
              </div>
            </>
          )}

          {/* Dependencies section */}
          <Separator className="my-4" />
          <div>
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  Dependencies
                </p>
                {hasIncompleteDependencies && (
                  <Badge
                    variant="destructive"
                    className="h-5 px-1.5 text-[10px]"
                  >
                    Blocked
                  </Badge>
                )}
              </div>
              <Popover
                open={dependencySearchOpen}
                onOpenChange={setDependencySearchOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1.5 text-xs"
                  >
                    <Plus className="h-3 w-3" />
                    Add
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72 p-2" align="end">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 px-1">
                      <Search className="text-muted-foreground h-4 w-4" />
                      <Input
                        placeholder="Search tasks..."
                        value={dependencySearchQuery}
                        onChange={(e) =>
                          setDependencySearchQuery(e.target.value)
                        }
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      {allTasksQuery.isLoading ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
                        </div>
                      ) : availableTasksForDependency &&
                        availableTasksForDependency.length > 0 ? (
                        <div className="space-y-1">
                          {availableTasksForDependency.slice(0, 10).map((t) => (
                            <button
                              key={t.id}
                              type="button"
                              className="hover:bg-muted flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm transition-colors"
                              onClick={() => handleAddDependency(t.id)}
                              disabled={addDependencyMutation.isPending}
                            >
                              <div
                                className={cn(
                                  "h-2 w-2 shrink-0 rounded-full",
                                  t.status === "completed"
                                    ? "bg-green-500"
                                    : "bg-muted-foreground",
                                )}
                              />
                              <span className="truncate">{t.title}</span>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground py-4 text-center text-xs">
                          {dependencySearchQuery
                            ? "No matching tasks"
                            : "No tasks available"}
                        </p>
                      )}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Existing dependencies */}
            {dependenciesQuery.isLoading ? (
              <div className="flex items-center gap-2 py-2">
                <Loader2 className="text-muted-foreground h-3 w-3 animate-spin" />
                <span className="text-muted-foreground text-xs">
                  Loading...
                </span>
              </div>
            ) : dependenciesQuery.data && dependenciesQuery.data.length > 0 ? (
              <div className="space-y-1.5">
                {dependenciesQuery.data.map((dep) => (
                  <div
                    key={dep.id}
                    className="bg-muted/50 flex items-center justify-between gap-2 rounded-md px-2 py-1.5"
                  >
                    <div className="flex items-center gap-2">
                      <Link className="text-muted-foreground h-3 w-3 shrink-0" />
                      <div
                        className={cn(
                          "h-2 w-2 shrink-0 rounded-full",
                          dep.dependsOnTask.status === "completed"
                            ? "bg-green-500"
                            : "bg-amber-500",
                        )}
                      />
                      <span
                        className={cn(
                          "truncate text-sm",
                          dep.dependsOnTask.status === "completed" &&
                            "text-muted-foreground line-through",
                        )}
                      >
                        {dep.dependsOnTask.title}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive h-6 w-6 shrink-0"
                      onClick={() => handleRemoveDependency(dep.id)}
                      disabled={removeDependencyMutation.isPending}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-xs italic">
                No dependencies. This task can be started anytime.
              </p>
            )}
          </div>

          {/* Subtasks section */}
          <Separator className="my-4" />
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                Subtasks
                {task.subtasks &&
                  task.subtasks.length > 0 &&
                  ` (${task.subtasks.length})`}
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1.5 text-xs"
                onClick={handleSuggestSubtasks}
                disabled={suggestBreakdownMutation.isPending}
              >
                {suggestBreakdownMutation.isPending ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Thinking...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3 w-3" />
                    AI Suggest
                  </>
                )}
              </Button>
            </div>

            {/* Existing subtasks */}
            {task.subtasks && task.subtasks.length > 0 && (
              <div className="mb-2 space-y-1">
                {task.subtasks.slice(0, 5).map((subtask) => (
                  <div
                    key={subtask.id}
                    className="flex items-center gap-2 text-sm"
                  >
                    <div
                      className={cn(
                        "h-3 w-3 rounded-full border-2",
                        subtask.status === "completed"
                          ? "border-green-500 bg-green-500"
                          : "border-muted-foreground",
                      )}
                    />
                    <span
                      className={cn(
                        subtask.status === "completed" &&
                          "text-muted-foreground line-through",
                      )}
                    >
                      {subtask.title}
                    </span>
                  </div>
                ))}
                {task.subtasks.length > 5 && (
                  <p className="text-muted-foreground text-xs">
                    +{task.subtasks.length - 5} more
                  </p>
                )}
              </div>
            )}

            {/* AI Suggestions */}
            {aiSuggestions.length > 0 && (
              <div className="border-border bg-muted/30 rounded-md border p-3">
                <p className="mb-2 text-xs font-medium">
                  Suggested subtasks — select the ones to add:
                </p>
                <div className="space-y-1.5">
                  {aiSuggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      className={cn(
                        "flex w-full items-center gap-2 rounded px-2 py-1 text-left text-sm transition-colors",
                        selectedSuggestions.has(suggestion)
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted",
                      )}
                      onClick={() => handleToggleSuggestion(suggestion)}
                    >
                      <div
                        className={cn(
                          "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                          selectedSuggestions.has(suggestion)
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-muted-foreground",
                        )}
                      >
                        {selectedSuggestions.has(suggestion) && (
                          <Check className="h-3 w-3" />
                        )}
                      </div>
                      {suggestion}
                    </button>
                  ))}
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Button
                    size="sm"
                    className="h-7 gap-1.5 text-xs"
                    onClick={handleCreateSelectedSubtasks}
                    disabled={
                      selectedSuggestions.size === 0 ||
                      createSubtasksMutation.isPending
                    }
                  >
                    {createSubtasksMutation.isPending ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Plus className="h-3 w-3" />
                    )}
                    Add {selectedSuggestions.size} subtask
                    {selectedSuggestions.size !== 1 ? "s" : ""}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => {
                      setAiSuggestions([]);
                      setSelectedSuggestions(new Set());
                    }}
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
            )}

            {/* Empty state */}
            {(!task.subtasks || task.subtasks.length === 0) &&
              aiSuggestions.length === 0 && (
                <p className="text-muted-foreground text-xs italic">
                  No subtasks yet. Use AI Suggest to break this task down.
                </p>
              )}
          </div>
        </div>

        {/* Footer with keyboard hint */}
        <div className="text-muted-foreground border-t px-4 py-2 text-xs">
          <kbd className="bg-muted rounded px-1">Esc</kbd> to close
          {" · "}
          Click fields to edit
        </div>
      </DialogContent>
    </Dialog>
  );
}
