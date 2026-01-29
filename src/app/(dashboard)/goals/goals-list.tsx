"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Plus,
  Target,
  MoreHorizontal,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronRight,
  FolderKanban,
  ListTodo,
} from "lucide-react";

import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";
import { toast } from "~/components/ui/sonner";
import type { RouterOutputs } from "~/trpc/react";

// Teal accent color
const TEAL_ACCENT = "#32B8C6";

type Goal = RouterOutputs["goal"]["getAll"][number];

export function GoalsList() {
  const [createGoalOpen, setCreateGoalOpen] = useState(false);
  const [createProjectOpen, setCreateProjectOpen] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [newGoalDescription, setNewGoalDescription] = useState("");
  const [newProjectTitle, setNewProjectTitle] = useState("");
  const [newProjectDescription, setNewProjectDescription] = useState("");
  const [expandedGoals, setExpandedGoals] = useState<Set<string>>(new Set());

  const utils = api.useUtils();

  const { data: goals = [], isLoading } = api.goal.getAll.useQuery({
    includeCompleted: true,
  });

  const createGoal = api.goal.create.useMutation({
    onMutate: async (newGoal) => {
      await utils.goal.getAll.cancel();
      const previousGoals = utils.goal.getAll.getData({
        includeCompleted: true,
      });

      // Create optimistic goal with minimal required display fields
      const optimisticGoal = {
        id: `temp-${Date.now()}`,
        title: newGoal.title,
        description: newGoal.description ?? null,
        status: "not_started",
        projects: [],
        calculatedProgress: 0,
        projectCount: 0,
        totalTaskCount: 0,
        completedTaskCount: 0,
      } as unknown as Goal;

      utils.goal.getAll.setData({ includeCompleted: true }, (old) =>
        old ? [optimisticGoal, ...old] : [optimisticGoal],
      );

      return { previousGoals };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousGoals) {
        utils.goal.getAll.setData(
          { includeCompleted: true },
          context.previousGoals,
        );
      }
      toast.error("Failed to create goal");
    },
    onSuccess: () => {
      toast.success("Goal created");
      setCreateGoalOpen(false);
      setNewGoalTitle("");
      setNewGoalDescription("");
    },
    onSettled: () => {
      void utils.goal.getAll.invalidate();
    },
  });

  const updateGoal = api.goal.update.useMutation({
    onMutate: async ({ id, status }) => {
      await utils.goal.getAll.cancel();
      const previousGoals = utils.goal.getAll.getData({
        includeCompleted: true,
      });

      // Optimistically update goal status
      utils.goal.getAll.setData({ includeCompleted: true }, (old) =>
        old?.map((g) =>
          g.id === id ? { ...g, status: status ?? g.status } : g,
        ),
      );

      return { previousGoals };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousGoals) {
        utils.goal.getAll.setData(
          { includeCompleted: true },
          context.previousGoals,
        );
      }
      toast.error("Failed to update goal");
    },
    onSuccess: () => {
      toast.success("Goal updated");
    },
    onSettled: () => {
      void utils.goal.getAll.invalidate();
    },
  });

  const deleteGoal = api.goal.delete.useMutation({
    onMutate: async ({ id }) => {
      await utils.goal.getAll.cancel();
      const previousGoals = utils.goal.getAll.getData({
        includeCompleted: true,
      });

      // Optimistically remove goal
      utils.goal.getAll.setData({ includeCompleted: true }, (old) =>
        old?.filter((g) => g.id !== id),
      );

      return { previousGoals };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousGoals) {
        utils.goal.getAll.setData(
          { includeCompleted: true },
          context.previousGoals,
        );
      }
      toast.error("Failed to delete goal");
    },
    onSuccess: () => {
      toast.success("Goal deleted");
    },
    onSettled: () => {
      void utils.goal.getAll.invalidate();
    },
  });

  const createProject = api.project.create.useMutation({
    onMutate: async (newProject) => {
      await utils.goal.getAll.cancel();
      const previousGoals = utils.goal.getAll.getData({
        includeCompleted: true,
      });

      // Create optimistic project with minimal required display fields
      const optimisticProject = {
        id: `temp-${Date.now()}`,
        title: newProject.title,
        description: newProject.description ?? null,
        color: "#6b7280",
        tasks: [],
      } as unknown as Goal["projects"][number];

      // Add project to goal
      utils.goal.getAll.setData({ includeCompleted: true }, (old) =>
        old?.map((g) =>
          g.id === newProject.goalId
            ? {
                ...g,
                projects: [...g.projects, optimisticProject],
                projectCount: g.projectCount + 1,
              }
            : g,
        ),
      );

      return { previousGoals };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousGoals) {
        utils.goal.getAll.setData(
          { includeCompleted: true },
          context.previousGoals,
        );
      }
      toast.error("Failed to create project");
    },
    onSuccess: () => {
      toast.success("Project created");
      setCreateProjectOpen(false);
      setNewProjectTitle("");
      setNewProjectDescription("");
      setSelectedGoalId(null);
    },
    onSettled: () => {
      void utils.goal.getAll.invalidate();
    },
  });

  const handleCreateGoal = () => {
    if (!newGoalTitle.trim()) return;
    createGoal.mutate({
      title: newGoalTitle.trim(),
      description: newGoalDescription.trim() || undefined,
    });
  };

  const handleCreateProject = () => {
    if (!newProjectTitle.trim() || !selectedGoalId) return;
    createProject.mutate({
      goalId: selectedGoalId,
      title: newProjectTitle.trim(),
      description: newProjectDescription.trim() || undefined,
    });
  };

  const handleToggleComplete = (goal: (typeof goals)[0]) => {
    updateGoal.mutate({
      id: goal.id,
      status: goal.status === "completed" ? "in_progress" : "completed",
    });
  };

  const toggleGoalExpanded = (goalId: string) => {
    setExpandedGoals((prev) => {
      const next = new Set(prev);
      if (next.has(goalId)) {
        next.delete(goalId);
      } else {
        next.add(goalId);
      }
      return next;
    });
  };

  const openCreateProject = (goalId: string) => {
    setSelectedGoalId(goalId);
    setCreateProjectOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading goals...</div>
      </div>
    );
  }

  const activeGoals = goals.filter((g) => g.status !== "completed");
  const completedGoals = goals.filter((g) => g.status === "completed");

  return (
    <div className="space-y-6">
      {/* Create Goal Button */}
      <Dialog open={createGoalOpen} onOpenChange={setCreateGoalOpen}>
        <DialogTrigger asChild>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Goal
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Goal</DialogTitle>
            <DialogDescription>
              Define a new objective to work towards
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Goal Title</Label>
              <Input
                id="title"
                placeholder="e.g., Launch MVP"
                value={newGoalTitle}
                onChange={(e) => setNewGoalTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                placeholder="What do you want to achieve?"
                value={newGoalDescription}
                onChange={(e) => setNewGoalDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateGoalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateGoal}
              disabled={!newGoalTitle.trim() || createGoal.isPending}
            >
              {createGoal.isPending ? "Creating..." : "Create Goal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Project Dialog */}
      <Dialog open={createProjectOpen} onOpenChange={setCreateProjectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Add a project under this goal to organize your tasks
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="project-title">Project Title</Label>
              <Input
                id="project-title"
                placeholder="e.g., Design, Development, Marketing"
                value={newProjectTitle}
                onChange={(e) => setNewProjectTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-description">
                Description (optional)
              </Label>
              <Textarea
                id="project-description"
                placeholder="What does this project involve?"
                value={newProjectDescription}
                onChange={(e) => setNewProjectDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateProjectOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateProject}
              disabled={!newProjectTitle.trim() || createProject.isPending}
            >
              {createProject.isPending ? "Creating..." : "Create Project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Active Goals */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">
          Active Goals ({activeGoals.length})
        </h2>
        {activeGoals.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Target className="text-muted-foreground mb-4 h-12 w-12" />
              <h3 className="text-lg font-semibold">No active goals</h3>
              <p className="text-muted-foreground">
                Create a goal to start tracking your progress
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {activeGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                isExpanded={expandedGoals.has(goal.id)}
                onToggleExpand={() => toggleGoalExpanded(goal.id)}
                onToggleComplete={() => handleToggleComplete(goal)}
                onDelete={() => deleteGoal.mutate({ id: goal.id })}
                onCreateProject={() => openCreateProject(goal.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Completed Goals */}
      {completedGoals.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">
            Completed Goals ({completedGoals.length})
          </h2>
          <div className="space-y-4">
            {completedGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                isExpanded={expandedGoals.has(goal.id)}
                onToggleExpand={() => toggleGoalExpanded(goal.id)}
                onToggleComplete={() => handleToggleComplete(goal)}
                onDelete={() => deleteGoal.mutate({ id: goal.id })}
                onCreateProject={() => openCreateProject(goal.id)}
                isCompleted
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Goal Card with collapsible projects
interface GoalCardProps {
  goal: {
    id: string;
    title: string;
    description: string | null;
    status: string;
    projects: Array<{
      id: string;
      title: string;
      description: string | null;
      color: string | null;
      tasks: Array<{ id: string; status: string }>;
    }>;
    calculatedProgress: number;
    projectCount: number;
    totalTaskCount: number;
    completedTaskCount: number;
  };
  isExpanded: boolean;
  isCompleted?: boolean;
  onToggleExpand: () => void;
  onToggleComplete: () => void;
  onDelete: () => void;
  onCreateProject: () => void;
}

function GoalCard({
  goal,
  isExpanded,
  isCompleted,
  onToggleExpand,
  onToggleComplete,
  onDelete,
  onCreateProject,
}: GoalCardProps) {
  return (
    <Card className={cn(isCompleted && "opacity-60")}>
      <Collapsible open={isExpanded} onOpenChange={onToggleExpand}>
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            {/* Expand/Collapse trigger */}
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 flex-shrink-0"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>

            {/* Complete toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 flex-shrink-0"
              onClick={onToggleComplete}
            >
              {isCompleted ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <Circle className="text-muted-foreground h-5 w-5" />
              )}
            </Button>

            {/* Goal info */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4" style={{ color: TEAL_ACCENT }} />
                <CardTitle
                  className={cn("text-base", isCompleted && "line-through")}
                >
                  {goal.title}
                </CardTitle>
              </div>
              {goal.description && (
                <CardDescription className="mt-1 line-clamp-2">
                  {goal.description}
                </CardDescription>
              )}

              {/* Stats row */}
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-muted-foreground">
                    {goal.completedTaskCount}/{goal.totalTaskCount} tasks
                  </span>
                  <span className="font-medium">
                    {goal.calculatedProgress}%
                  </span>
                </div>
                <Progress
                  value={goal.calculatedProgress}
                  className="h-2 w-32"
                />
                <Badge variant="outline">
                  <FolderKanban className="mr-1 h-3 w-3" />
                  {goal.projectCount} projects
                </Badge>
              </div>
            </div>

            {/* Actions menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onCreateProject}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Project
                </DropdownMenuItem>
                <DropdownMenuItem>Edit goal</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={onDelete}
                >
                  Delete goal
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="pt-0">
            {goal.projects.length === 0 ? (
              <div className="text-muted-foreground rounded-lg border border-dashed p-6 text-center">
                <FolderKanban className="mx-auto mb-2 h-8 w-8 opacity-50" />
                <p className="text-sm">No projects yet</p>
                <Button
                  variant="link"
                  size="sm"
                  className="mt-2"
                  onClick={onCreateProject}
                >
                  <Plus className="mr-1 h-3 w-3" />
                  Add your first project
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {goal.projects.map((project) => {
                  const completedCount = project.tasks.filter(
                    (t) => t.status === "completed",
                  ).length;
                  const totalCount = project.tasks.length;
                  const progress =
                    totalCount > 0
                      ? Math.round((completedCount / totalCount) * 100)
                      : 0;

                  return (
                    <Link
                      key={project.id}
                      href={`/projects/${project.id}`}
                      className="hover:bg-muted/50 flex items-center gap-3 rounded-lg border p-3 transition-colors"
                    >
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: project.color ?? "#6b7280" }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{project.title}</span>
                          <span className="text-muted-foreground text-sm">
                            {completedCount}/{totalCount}
                          </span>
                        </div>
                        <Progress value={progress} className="mt-1 h-1.5" />
                      </div>
                      <div className="text-muted-foreground flex items-center gap-1 text-sm">
                        <ListTodo className="h-4 w-4" />
                        {totalCount}
                      </div>
                    </Link>
                  );
                })}

                {/* Add project button at the end */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground w-full justify-start"
                  onClick={onCreateProject}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add project
                </Button>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
