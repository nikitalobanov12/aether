"use client";

import { useState } from "react";
import { Plus, Target, MoreHorizontal, CheckCircle2, Circle } from "lucide-react";

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

// Simple Progress component since shadcn doesn't include it by default
function ProgressBar({ value, className }: { value: number; className?: string }) {
  return (
    <div className={`h-2 w-full overflow-hidden rounded-full bg-secondary ${className}`}>
      <div
        className="h-full bg-primary transition-all"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

export function GoalsList() {
  const [createOpen, setCreateOpen] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [newGoalDescription, setNewGoalDescription] = useState("");

  const utils = api.useUtils();

  const { data: goals = [], isLoading } = api.goal.getAll.useQuery({
    includeCompleted: true,
  });

  const createGoal = api.goal.create.useMutation({
    onSuccess: () => {
      void utils.goal.getAll.invalidate();
      setCreateOpen(false);
      setNewGoalTitle("");
      setNewGoalDescription("");
    },
  });

  const updateGoal = api.goal.update.useMutation({
    onSuccess: () => {
      void utils.goal.getAll.invalidate();
    },
  });

  const deleteGoal = api.goal.delete.useMutation({
    onSuccess: () => {
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

  const handleToggleComplete = (goal: (typeof goals)[0]) => {
    updateGoal.mutate({
      id: goal.id,
      status: goal.status === "completed" ? "in_progress" : "completed",
    });
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
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
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
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
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

      {/* Active Goals */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Active Goals ({activeGoals.length})</h2>
        {activeGoals.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Target className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="text-lg font-semibold">No active goals</h3>
              <p className="text-muted-foreground">
                Create a goal to start tracking your progress
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {activeGoals.map((goal) => (
              <Card key={goal.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 flex-shrink-0"
                      onClick={() => handleToggleComplete(goal)}
                    >
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    </Button>
                    <div className="flex-1 px-2">
                      <CardTitle className="text-base">{goal.title}</CardTitle>
                      {goal.description && (
                        <CardDescription className="mt-1 line-clamp-2">
                          {goal.description}
                        </CardDescription>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Edit goal</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => deleteGoal.mutate({ id: goal.id })}
                        >
                          Delete goal
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{goal.progress ?? 0}%</span>
                    </div>
                    <ProgressBar value={goal.progress ?? 0} />
                    <div className="flex items-center gap-2 pt-2">
                      <Badge variant="outline">
                        {goal.taskCount ?? 0} tasks
                      </Badge>
                      <Badge
                        variant={
                          goal.status === "in_progress" ? "default" : "secondary"
                        }
                      >
                        {goal.status === "in_progress"
                          ? "In Progress"
                          : goal.status === "not_started"
                            ? "Not Started"
                            : goal.status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {completedGoals.map((goal) => (
              <Card key={goal.id} className="opacity-60">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 flex-shrink-0"
                      onClick={() => handleToggleComplete(goal)}
                    >
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    </Button>
                    <div className="flex-1 px-2">
                      <CardTitle className="text-base line-through">
                        {goal.title}
                      </CardTitle>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => deleteGoal.mutate({ id: goal.id })}
                        >
                          Delete goal
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
