"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Calendar, Clock, Target, MoreHorizontal } from "lucide-react";

import { cn } from "~/lib/utils";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { api } from "~/trpc/react";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: "low" | "medium" | "high" | "urgent";
  sortOrder: number | null;
  dueDate: Date | null;
  estimatedMinutes: number | null;
  tags: string[] | null;
  goalId: string | null;
}

interface TaskCardProps {
  task: Task;
  isDragging?: boolean;
}

const priorityColors = {
  low: "bg-blue-500/10 text-blue-700 border-blue-500/20",
  medium: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20",
  high: "bg-orange-500/10 text-orange-700 border-orange-500/20",
  urgent: "bg-red-500/10 text-red-700 border-red-500/20",
};

const priorityDots = {
  low: "bg-blue-500",
  medium: "bg-yellow-500",
  high: "bg-orange-500",
  urgent: "bg-red-500",
};

export function TaskCard({ task, isDragging }: TaskCardProps) {
  const utils = api.useUtils();

  const deleteTask = api.task.delete.useMutation({
    onSuccess: () => {
      void utils.task.getAll.invalidate();
    },
  });

  const updateTask = api.task.update.useMutation({
    onSuccess: () => {
      void utils.task.getAll.invalidate();
    },
  });

  const handleComplete = () => {
    updateTask.mutate({
      id: task.id,
      status: task.status === "completed" ? "todo" : "completed",
    });
  };

  const handleDelete = () => {
    deleteTask.mutate({ id: task.id });
  };

  const formattedDueDate = task.dueDate
    ? new Date(task.dueDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : null;

  const isOverdue =
    task.dueDate &&
    task.status !== "completed" &&
    new Date(task.dueDate) < new Date();

  return (
    <div
      className={cn(
        "group rounded-lg border bg-card p-3 shadow-sm transition-all",
        isDragging && "rotate-3 shadow-lg",
        task.status === "completed" && "opacity-60"
      )}
    >
      {/* Priority indicator and title */}
      <div className="flex items-start gap-2">
        <div
          className={cn(
            "mt-1.5 h-2 w-2 flex-shrink-0 rounded-full",
            priorityDots[task.priority]
          )}
        />
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "text-sm font-medium leading-tight",
              task.status === "completed" &&
                "text-muted-foreground line-through"
            )}
          >
            {task.title}
          </p>
          {task.description && (
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
              {task.description}
            </p>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleComplete}>
              {task.status === "completed" ? "Mark incomplete" : "Mark complete"}
            </DropdownMenuItem>
            <DropdownMenuItem>Edit task</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleDelete} className="text-destructive">
              Delete task
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Metadata */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Badge
          variant="outline"
          className={cn("text-xs", priorityColors[task.priority])}
        >
          {task.priority}
        </Badge>

        {formattedDueDate && (
          <div
            className={cn(
              "flex items-center gap-1 text-xs",
              isOverdue ? "text-destructive" : "text-muted-foreground"
            )}
          >
            <Calendar className="h-3 w-3" />
            {formattedDueDate}
          </div>
        )}

        {task.estimatedMinutes && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {task.estimatedMinutes}m
          </div>
        )}

        {task.goalId && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Target className="h-3 w-3" />
          </div>
        )}
      </div>

      {/* Tags */}
      {task.tags && task.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {task.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
          {task.tags.length > 3 && (
            <Badge variant="secondary" className="text-xs">
              +{task.tags.length - 3}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}

export function SortableTaskCard({ task }: { task: Task }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard task={task} />
    </div>
  );
}
