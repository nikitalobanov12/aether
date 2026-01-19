"use client";

import { useState, useMemo } from "react";
import { format, startOfWeek, addWeeks, subWeeks, addDays } from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  Target,
  Flame,
  TrendingUp,
} from "lucide-react";

import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Progress } from "~/components/ui/progress";
import { api } from "~/trpc/react";
import type { RouterOutputs } from "~/trpc/react";

// Teal accent color from design spec
const TEAL_ACCENT = "#32B8C6";

type WeeklySummary = RouterOutputs["history"]["getWeeklySummary"];
type HabitWithStreak = RouterOutputs["habit"]["getAll"][number];

interface WeeklyReviewProps {
  initialSummary: WeeklySummary;
  initialHabits: HabitWithStreak[];
}

export function WeeklyReview({
  initialSummary,
  initialHabits,
}: WeeklyReviewProps) {
  const [weekStart, setWeekStart] = useState(() => {
    const now = new Date();
    return startOfWeek(now, { weekStartsOn: 0 });
  });

  // Fetch weekly summary
  const { data: summary = initialSummary } =
    api.history.getWeeklySummary.useQuery(
      { weekStartDate: weekStart.toISOString() },
      { initialData: initialSummary },
    );

  // Fetch habit streaks
  const { data: habits = initialHabits } = api.habit.getAll.useQuery(
    undefined,
    {
      initialData: initialHabits,
    },
  );

  // Navigation
  const goToPreviousWeek = () => setWeekStart((d) => subWeeks(d, 1));
  const goToNextWeek = () => setWeekStart((d) => addWeeks(d, 1));
  const goToCurrentWeek = () =>
    setWeekStart(startOfWeek(new Date(), { weekStartsOn: 0 }));

  const isCurrentWeek = useMemo(() => {
    const currentWeekStart = startOfWeek(new Date(), { weekStartsOn: 0 });
    return weekStart.getTime() === currentWeekStart.getTime();
  }, [weekStart]);

  const weekEnd = addDays(weekStart, 6);

  // Format time helper
  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div>
          <h1 className="text-2xl font-semibold">Weekly Review</h1>
          <p className="text-muted-foreground text-sm">
            {format(weekStart, "MMMM d")} - {format(weekEnd, "MMMM d, yyyy")}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={goToPreviousWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant={isCurrentWeek ? "default" : "outline"}
            size="sm"
            onClick={goToCurrentWeek}
          >
            This Week
          </Button>
          <Button variant="ghost" size="icon" onClick={goToNextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="space-y-6 p-6">
          {/* Stats Overview */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Tasks Completed
                </CardTitle>
                <CheckCircle2 className="text-muted-foreground h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {summary.totalCompleted}
                </div>
                <p className="text-muted-foreground text-xs">
                  {
                    summary.dailyCompletions.filter((d) => d.hasCompletions)
                      .length
                  }{" "}
                  of 7 days active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Time Tracked
                </CardTitle>
                <Clock className="text-muted-foreground h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatTime(summary.totalTimeMinutes)}
                </div>
                <p className="text-muted-foreground text-xs">
                  Avg {formatTime(Math.round(summary.totalTimeMinutes / 7))} per
                  day
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Projects
                </CardTitle>
                <Target className="text-muted-foreground h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {summary.timeByProject.length}
                </div>
                <p className="text-muted-foreground text-xs">
                  Projects with completed tasks
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Daily Completion Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Daily Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between gap-2">
                {summary.dailyCompletions.map((day) => {
                  const maxCount = Math.max(
                    ...summary.dailyCompletions.map((d) => d.count),
                    1,
                  );
                  const heightPercent = (day.count / maxCount) * 100;

                  return (
                    <div
                      key={day.date}
                      className="flex flex-1 flex-col items-center gap-2"
                    >
                      <div className="relative h-32 w-full">
                        <div
                          className="absolute bottom-0 w-full rounded-t-sm transition-all"
                          style={{
                            height: `${Math.max(heightPercent, 4)}%`,
                            backgroundColor: day.hasCompletions
                              ? TEAL_ACCENT
                              : "#e5e7eb",
                          }}
                        />
                      </div>
                      <div className="text-center">
                        <p className="text-muted-foreground text-xs">
                          {day.dayOfWeek}
                        </p>
                        <p className="text-sm font-medium">{day.count}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Time by Project */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Time by Project
                </CardTitle>
              </CardHeader>
              <CardContent>
                {summary.timeByProject.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    No time tracked this week
                  </p>
                ) : (
                  <div className="space-y-4">
                    {summary.timeByProject.map((project) => {
                      const percent =
                        summary.totalTimeMinutes > 0
                          ? (project.totalMinutes / summary.totalTimeMinutes) *
                            100
                          : 0;

                      return (
                        <div key={project.projectId} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <div
                                className="h-3 w-3 rounded-full"
                                style={{
                                  backgroundColor: project.projectColor,
                                }}
                              />
                              <span className="font-medium">
                                {project.projectTitle}
                              </span>
                            </div>
                            <div className="text-muted-foreground">
                              {formatTime(project.totalMinutes)} (
                              {project.taskCount} tasks)
                            </div>
                          </div>
                          <Progress value={percent} className="h-2" />
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Habit Streaks */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flame className="h-5 w-5" />
                  Habit Streaks
                </CardTitle>
              </CardHeader>
              <CardContent>
                {habits.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    No habits tracked yet. Tag tasks as habits to track streaks.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {habits.map((habit) => (
                      <div
                        key={habit.id}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div>
                          <p className="font-medium">{habit.habitName}</p>
                          <p className="text-muted-foreground text-xs">
                            Best: {habit.bestStreakDays} days
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Flame
                            className={cn(
                              "h-5 w-5",
                              habit.currentStreakDays > 0
                                ? "text-orange-500"
                                : "text-muted-foreground",
                            )}
                          />
                          <span
                            className={cn(
                              "text-lg font-bold",
                              habit.currentStreakDays > 0
                                ? "text-orange-500"
                                : "text-muted-foreground",
                            )}
                          >
                            {habit.currentStreakDays}
                          </span>
                          <span className="text-muted-foreground text-sm">
                            days
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Completed Tasks List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                Completed Tasks
              </CardTitle>
            </CardHeader>
            <CardContent>
              {summary.tasks.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No tasks completed this week
                </p>
              ) : (
                <div className="space-y-2">
                  {summary.tasks.slice(0, 20).map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <div>
                          <p className="font-medium">{task.taskTitle}</p>
                          <div className="flex items-center gap-2">
                            {task.project && (
                              <Badge variant="secondary" className="text-xs">
                                {task.project.title}
                              </Badge>
                            )}
                            <span className="text-muted-foreground text-xs">
                              {format(
                                new Date(task.completedAt),
                                "EEE, MMM d 'at' h:mm a",
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                      {task.timeSpentMinutes && task.timeSpentMinutes > 0 && (
                        <span className="text-muted-foreground text-sm">
                          {formatTime(task.timeSpentMinutes)}
                        </span>
                      )}
                    </div>
                  ))}
                  {summary.tasks.length > 20 && (
                    <p className="text-muted-foreground text-center text-sm">
                      And {summary.tasks.length - 20} more...
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
}
