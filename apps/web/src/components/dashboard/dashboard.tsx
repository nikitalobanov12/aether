import Link from "next/link";
import { Plus, CheckSquare, Target, Calendar, Clock } from "lucide-react";

import { api } from "~/trpc/server";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";

export async function Dashboard() {
  const [tasks, goals] = await Promise.all([
    api.task.getAll({ includeCompleted: false }),
    api.goal.getAll({ includeCompleted: false }),
  ]);

  const todayTasks = tasks.filter((task) => {
    if (!task.dueDate) return false;
    const today = new Date();
    const dueDate = new Date(task.dueDate);
    return dueDate.toDateString() === today.toDateString();
  });

  const overdueTasks = tasks.filter((task) => {
    if (!task.dueDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(task.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < today;
  });

  const upcomingTasks = tasks.filter((task) => {
    if (!task.dueDate) return false;
    const today = new Date();
    const dueDate = new Date(task.dueDate);
    const daysDiff = Math.ceil(
      (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );
    return daysDiff > 0 && daysDiff <= 7;
  });

  const backlogTasks = tasks.filter((task) => !task.dueDate);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here&apos;s what&apos;s happening today.
          </p>
        </div>
        <Button asChild>
          <Link href="/today">
            <Plus className="mr-2 h-4 w-4" />
            New Task
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <CheckSquare className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasks.length}</div>
            <p className="text-muted-foreground text-xs">
              {tasks.filter((t) => t.status === "in_progress").length} in
              progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Due Today</CardTitle>
            <Clock className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayTasks.length}</div>
            {overdueTasks.length > 0 && (
              <p className="text-destructive text-xs">
                {overdueTasks.length} overdue
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Goals</CardTitle>
            <Target className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{goals.length}</div>
            <p className="text-muted-foreground text-xs">Tracking progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Backlog</CardTitle>
            <CheckSquare className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{backlogTasks.length}</div>
            <p className="text-muted-foreground text-xs">Unscheduled tasks</p>
          </CardContent>
        </Card>
      </div>

      {/* Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Today's Tasks */}
        <Card>
          <CardHeader>
            <CardTitle>Today&apos;s Tasks</CardTitle>
            <CardDescription>Tasks due today and overdue items</CardDescription>
          </CardHeader>
          <CardContent>
            {todayTasks.length === 0 && overdueTasks.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No tasks due today. Great job!
              </p>
            ) : (
              <div className="space-y-3">
                {overdueTasks.slice(0, 3).map((task) => (
                  <div
                    key={task.id}
                    className="border-destructive/50 bg-destructive/10 flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-destructive h-2 w-2 rounded-full" />
                      <span className="text-sm font-medium">{task.title}</span>
                    </div>
                    <Badge variant="destructive">Overdue</Badge>
                  </div>
                ))}
                {todayTasks.slice(0, 5).map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-2 w-2 rounded-full ${
                          task.priority === "urgent"
                            ? "bg-destructive"
                            : task.priority === "high"
                              ? "bg-orange-500"
                              : task.priority === "medium"
                                ? "bg-yellow-500"
                                : "bg-blue-500"
                        }`}
                      />
                      <span className="text-sm font-medium">{task.title}</span>
                    </div>
                    <Badge variant="outline">{task.priority}</Badge>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4">
              <Button variant="outline" className="w-full" asChild>
                <Link href="/today">View today</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming This Week */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming This Week</CardTitle>
            <CardDescription>Tasks due in the next 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingTasks.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No upcoming tasks this week.
              </p>
            ) : (
              <div className="space-y-3">
                {upcomingTasks.slice(0, 5).map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-2 w-2 rounded-full ${
                          task.priority === "urgent"
                            ? "bg-destructive"
                            : task.priority === "high"
                              ? "bg-orange-500"
                              : task.priority === "medium"
                                ? "bg-yellow-500"
                                : "bg-blue-500"
                        }`}
                      />
                      <span className="text-sm font-medium">{task.title}</span>
                    </div>
                    <span className="text-muted-foreground text-xs">
                      {task.dueDate &&
                        new Date(task.dueDate).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4">
              <Button variant="outline" className="w-full" asChild>
                <Link href="/week">View week</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Button
                variant="outline"
                className="h-auto flex-col gap-2 p-4"
                asChild
              >
                <Link href="/today">
                  <CheckSquare className="h-6 w-6" />
                  <span>Today</span>
                </Link>
              </Button>
              <Button
                variant="outline"
                className="h-auto flex-col gap-2 p-4"
                asChild
              >
                <Link href="/goals">
                  <Target className="h-6 w-6" />
                  <span>Manage Goals</span>
                </Link>
              </Button>
              <Button
                variant="outline"
                className="h-auto flex-col gap-2 p-4"
                asChild
              >
                <Link href="/calendar">
                  <Calendar className="h-6 w-6" />
                  <span>Open Calendar</span>
                </Link>
              </Button>
              <Button
                variant="outline"
                className="h-auto flex-col gap-2 p-4"
                asChild
              >
                <Link href="/week">
                  <Clock className="h-6 w-6" />
                  <span>This Week</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
