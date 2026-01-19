"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  ArrowLeft,
  Plus,
  MoreHorizontal,
  CheckCircle2,
  Circle,
  Clock,
  Calendar,
  GripVertical,
  Play,
  Target,
} from "lucide-react";

import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { Badge } from "~/components/ui/badge";
import { Progress } from "~/components/ui/progress";
import { Checkbox } from "~/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import type { RouterOutputs } from "~/trpc/react";

// Teal accent color
const TEAL_ACCENT = "#32B8C6";

type Project = NonNullable<RouterOutputs["project"]["getById"]>;
type Task = Project["tasks"][number];

interface ProjectViewProps {
  initialProject: Project;
}

export function ProjectView({ initialProject }: ProjectViewProps) {
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<string>("medium");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");

  const utils = api.useUtils();

  const { data: projectData, refetch } = api.project.getById.useQuery(
    { id: initialProject.id },
    { initialData: initialProject },
  );

  // Use initialProject as fallback (should never be null since page.tsx handles that)
  const project = projectData ?? initialProject;

  const createTask = api.task.create.useMutation({
    onSuccess: () => {
      void refetch();
      void utils.goal.getAll.invalidate();
      setCreateTaskOpen(false);
      setNewTaskTitle("");
      setNewTaskDescription("");
      setNewTaskPriority("medium");
      setNewTaskDueDate("");
    },
  });

  const completeTask = api.task.complete.useMutation({
    onSuccess: () => {
      void refetch();
      void utils.goal.getAll.invalidate();
    },
  });

  const updateTask = api.task.update.useMutation({
    onSuccess: () => {
      void refetch();
    },
  });

  const deleteTask = api.task.delete.useMutation({
    onSuccess: () => {
      void refetch();
      void utils.goal.getAll.invalidate();
    },
  });

  const handleCreateTask = () => {
    if (!newTaskTitle.trim()) return;
    createTask.mutate({
      title: newTaskTitle.trim(),
      description: newTaskDescription.trim() || undefined,
      priority: newTaskPriority as "low" | "medium" | "high" | "urgent",
      projectId: project.id,
      goalId: project.goalId,
      dueDate: newTaskDueDate
        ? new Date(newTaskDueDate).toISOString()
        : undefined,
    });
  };

  const handleComplete = useCallback(
    (taskId: string) => {
      completeTask.mutate({ id: taskId });
    },
    [completeTask],
  );

  const handleUncomplete = useCallback(
    (taskId: string) => {
      updateTask.mutate({ id: taskId, status: "todo" });
    },
    [updateTask],
  );

  // Separate tasks by status
  const incompleteTasks = project.tasks.filter((t) => t.status !== "completed");
  const completedTasks = project.tasks.filter((t) => t.status === "completed");

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b px-6 py-4">
        <div className="flex items-center gap-4">
          <Link href="/goals">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div
                className="h-4 w-4 rounded-full"
                style={{ backgroundColor: project.color ?? "#6b7280" }}
              />
              <h1 className="text-2xl font-semibold">{project.title}</h1>
            </div>
            {project.goal && (
              <div className="text-muted-foreground mt-1 flex items-center gap-2 text-sm">
                <Target className="h-3 w-3" />
                <span>{project.goal.title}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm font-medium">
                {project.completedTaskCount}/{project.totalTaskCount} tasks
              </div>
              <Progress value={project.progress} className="mt-1 h-2 w-24" />
            </div>
            <Badge variant="outline" className="text-lg">
              {project.progress}%
            </Badge>
          </div>
        </div>
        {project.description && (
          <p className="text-muted-foreground mt-2 ml-12">
            {project.description}
          </p>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-3xl space-y-6">
          {/* Add task button */}
          <Button onClick={() => setCreateTaskOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Task
          </Button>

          {/* Next Up task */}
          {project.nextUpTaskId && (
            <Card
              className="border-l-4"
              style={{ borderLeftColor: TEAL_ACCENT }}
            >
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                  <Play className="h-4 w-4" style={{ color: TEAL_ACCENT }} />
                  <span style={{ color: TEAL_ACCENT }}>Next Up</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const nextTask = project.tasks.find(
                    (t) => t.id === project.nextUpTaskId,
                  );
                  if (!nextTask) return null;
                  return (
                    <TaskItem
                      task={nextTask}
                      isNextUp
                      onComplete={handleComplete}
                      onUncomplete={handleUncomplete}
                      onDelete={(id) => deleteTask.mutate({ id })}
                    />
                  );
                })()}
              </CardContent>
            </Card>
          )}

          {/* Incomplete tasks */}
          {incompleteTasks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Tasks ({incompleteTasks.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {incompleteTasks
                  .filter((t) => t.id !== project.nextUpTaskId)
                  .map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onComplete={handleComplete}
                      onUncomplete={handleUncomplete}
                      onDelete={(id) => deleteTask.mutate({ id })}
                    />
                  ))}
              </CardContent>
            </Card>
          )}

          {/* Completed tasks */}
          {completedTasks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-muted-foreground text-base">
                  Completed ({completedTasks.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {completedTasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onComplete={handleComplete}
                    onUncomplete={handleUncomplete}
                    onDelete={(id) => deleteTask.mutate({ id })}
                  />
                ))}
              </CardContent>
            </Card>
          )}

          {/* Empty state */}
          {project.tasks.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle2 className="text-muted-foreground mb-4 h-12 w-12 opacity-50" />
                <h3 className="text-lg font-semibold">No tasks yet</h3>
                <p className="text-muted-foreground">
                  Add tasks to start tracking your progress
                </p>
                <Button
                  className="mt-4"
                  variant="outline"
                  onClick={() => setCreateTaskOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add your first task
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Create Task Dialog */}
      <Dialog open={createTaskOpen} onOpenChange={setCreateTaskOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Task to {project.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="task-title">Task Title</Label>
              <Input
                id="task-title"
                placeholder="What needs to be done?"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newTaskTitle.trim()) {
                    handleCreateTask();
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-description">Description (optional)</Label>
              <Textarea
                id="task-description"
                placeholder="Add more details..."
                value={newTaskDescription}
                onChange={(e) => setNewTaskDescription(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="task-priority">Priority</Label>
                <Select
                  value={newTaskPriority}
                  onValueChange={setNewTaskPriority}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="task-due">Due Date (optional)</Label>
                <Input
                  id="task-due"
                  type="date"
                  value={newTaskDueDate}
                  onChange={(e) => setNewTaskDueDate(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateTaskOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateTask}
              disabled={!newTaskTitle.trim() || createTask.isPending}
            >
              {createTask.isPending ? "Adding..." : "Add Task"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Task item component
interface TaskItemProps {
  task: Task;
  isNextUp?: boolean;
  onComplete: (id: string) => void;
  onUncomplete: (id: string) => void;
  onDelete: (id: string) => void;
}

function TaskItem({
  task,
  isNextUp,
  onComplete,
  onUncomplete,
  onDelete,
}: TaskItemProps) {
  const isCompleted = task.status === "completed";

  return (
    <div
      className={cn(
        "group flex items-start gap-3 rounded-lg p-3 transition-colors",
        isNextUp && "bg-[#32B8C6]/10",
        !isNextUp && !isCompleted && "hover:bg-muted/50",
        isCompleted && "opacity-60",
      )}
    >
      {/* Drag handle */}
      <div className="text-muted-foreground cursor-grab opacity-0 transition-opacity group-hover:opacity-100">
        <GripVertical className="h-5 w-5" />
      </div>

      {/* Checkbox */}
      <Checkbox
        checked={isCompleted}
        onCheckedChange={() => {
          if (isCompleted) {
            onUncomplete(task.id);
          } else {
            onComplete(task.id);
          }
        }}
        className="mt-0.5"
      />

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "font-medium",
            isCompleted && "text-muted-foreground line-through",
          )}
        >
          {task.title}
        </p>
        {task.description && (
          <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
            {task.description}
          </p>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {/* Priority */}
          <Badge
            variant="outline"
            className={cn(
              "text-xs",
              task.priority === "urgent" && "border-red-500 text-red-500",
              task.priority === "high" && "border-orange-500 text-orange-500",
              task.priority === "medium" && "border-yellow-500 text-yellow-500",
              task.priority === "low" && "border-gray-400 text-gray-400",
            )}
          >
            {task.priority}
          </Badge>

          {/* Due date */}
          {task.dueDate && (
            <span
              className={cn(
                "flex items-center gap-1 text-xs",
                new Date(task.dueDate) < new Date() && !isCompleted
                  ? "font-medium text-red-500"
                  : "text-muted-foreground",
              )}
            >
              <Calendar className="h-3 w-3" />
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
          {isCompleted ? (
            <DropdownMenuItem onClick={() => onUncomplete(task.id)}>
              <Circle className="mr-2 h-4 w-4" />
              Mark incomplete
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={() => onComplete(task.id)}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Complete
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive"
            onClick={() => onDelete(task.id)}
          >
            Delete task
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
