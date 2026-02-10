import Link from "next/link";
import { 
  Plus, 
  CheckSquare, 
  Target, 
  Calendar, 
  Clock, 
  TrendingUp,
  ArrowRight,
  Sparkles,
  Zap,
} from "lucide-react";

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
import { Progress } from "~/components/ui/progress";

export async function Dashboard() {
  const [tasks, goals] = await Promise.all([
    api.task.getAll({ includeCompleted: false }),
    api.goal.getAll({ includeCompleted: false }),
  ]);

  const today = new Date();
  const todayStr = today.toDateString();

  const todayTasks = tasks.filter((task) => {
    if (!task.dueDate) return false;
    return new Date(task.dueDate).toDateString() === todayStr;
  });

  const overdueTasks = tasks.filter((task) => {
    if (!task.dueDate) return false;
    const dueDate = new Date(task.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    const todayStart = new Date(today);
    todayStart.setHours(0, 0, 0, 0);
    return dueDate < todayStart;
  });

  const upcomingTasks = tasks.filter((task) => {
    if (!task.dueDate) return false;
    const dueDate = new Date(task.dueDate);
    const daysDiff = Math.ceil(
      (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );
    return daysDiff > 0 && daysDiff <= 7;
  });

  const backlogTasks = tasks.filter((task) => !task.dueDate);
  const inProgressTasks = tasks.filter((task) => task.status === "in_progress");

  // Calculate stats
  const totalTasks = tasks.length;
  const completedThisWeek = 0; // Would need history data
  const completionRate = totalTasks > 0 ? Math.round(((totalTasks - tasks.length) / totalTasks) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl lg:text-4xl mb-2">
            Good {getTimeOfDay()}, achiever.
          </h1>
          <p className="text-muted-foreground text-lg">
            You have <span className="text-foreground font-medium">{todayTasks.length}</span> tasks today 
            {overdueTasks.length > 0 && (
              <>, <span className="text-destructive font-medium">{overdueTasks.length}</span> overdue</>
            )}
            . Let&apos;s make progress.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" asChild>
            <Link href="/insights">
              <TrendingUp className="mr-2 h-4 w-4" />
              View Insights
            </Link>
          </Button>
          <Button asChild className="glow-primary">
            <Link href="/today">
              <Plus className="mr-2 h-4 w-4" />
              New Task
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Overview - Horizontal */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={CheckSquare}
          label="Total Tasks"
          value={totalTasks}
          subtext={`${inProgressTasks.length} in progress`}
          color="primary"
        />
        <StatCard
          icon={Clock}
          label="Due Today"
          value={todayTasks.length}
          subtext={overdueTasks.length > 0 ? `${overdueTasks.length} overdue` : "All caught up"}
          color={overdueTasks.length > 0 ? "destructive" : "success"}
          alert={overdueTasks.length > 0}
        />
        <StatCard
          icon={Target}
          label="Active Goals"
          value={goals.length}
          subtext={`${goals.reduce((acc, g) => acc + g.projects.length, 0)} projects`}
          color="accent"
        />
        <StatCard
          icon={Calendar}
          label="This Week"
          value={upcomingTasks.length}
          subtext={`${backlogTasks.length} in backlog`}
          color="info"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Today's Focus */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Tasks */}
          <Card className="card-depth border-border/50">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="font-display text-xl flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" />
                    Today&apos;s Focus
                  </CardTitle>
                  <CardDescription>
                    Tasks due today and overdue items
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/today">
                    View all
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {todayTasks.length === 0 && overdueTasks.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="h-8 w-8 text-primary" />
                  </div>
                  <p className="text-lg font-medium mb-1">All caught up!</p>
                  <p className="text-muted-foreground text-sm">
                    No tasks due today. Time to plan ahead or tackle the backlog.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Overdue tasks first */}
                  {overdueTasks.slice(0, 3).map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      variant="overdue"
                    />
                  ))}
                  
                  {/* Today's tasks */}
                  {todayTasks.slice(0, 5).map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      variant="default"
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Goals Progress */}
          <Card className="card-depth border-border/50">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="font-display text-xl flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Goal Progress
                  </CardTitle>
                  <CardDescription>
                    Track your life goals and projects
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/goals">
                    Manage goals
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {goals.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    No active goals yet. Create your first goal to start tracking progress.
                  </p>
                  <Button asChild variant="outline">
                    <Link href="/goals">
                      <Target className="mr-2 h-4 w-4" />
                      Create Goal
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {goals.slice(0, 3).map((goal) => (
                    <div key={goal.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{goal.title}</span>
                          <Badge variant="secondary" className="text-xs">
                            {goal.projects.length} projects
                          </Badge>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {goal.completedTaskCount}/{goal.totalTaskCount}
                        </span>
                      </div>
                      <Progress 
                        value={goal.totalTaskCount > 0 ? (goal.completedTaskCount / goal.totalTaskCount) * 100 : 0} 
                        className="h-2"
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Quick Actions & Upcoming */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card className="card-depth border-border/50">
            <CardHeader className="pb-4">
              <CardTitle className="font-display text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <QuickActionButton
                  href="/today"
                  icon={CheckSquare}
                  label="Today"
                  description="View daily tasks"
                />
                <QuickActionButton
                  href="/week"
                  icon={Calendar}
                  label="This Week"
                  description="Weekly overview"
                />
                <QuickActionButton
                  href="/goals"
                  icon={Target}
                  label="Goals"
                  description="Manage goals"
                />
                <QuickActionButton
                  href="/calendar"
                  icon={Clock}
                  label="Calendar"
                  description="Schedule view"
                />
              </div>
            </CardContent>
          </Card>

          {/* Upcoming This Week */}
          <Card className="card-depth border-border/50">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="font-display text-lg">Upcoming</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/week">
                    View week
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {upcomingTasks.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-4">
                  No upcoming tasks this week.
                </p>
              ) : (
                <div className="space-y-3">
                  {upcomingTasks.slice(0, 5).map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          task.priority === "urgent" ? "bg-red-500" :
                          task.priority === "high" ? "bg-orange-500" :
                          task.priority === "medium" ? "bg-yellow-500" :
                          "bg-blue-500"
                        }`} />
                        <span className="text-sm font-medium truncate">{task.title}</span>
                      </div>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {task.dueDate && new Date(task.dueDate).toLocaleDateString(undefined, { 
                          month: "short", 
                          day: "numeric" 
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Backlog Preview */}
          <Card className="card-depth border-border/50 border-dashed">
            <CardHeader className="pb-4">
              <CardTitle className="font-display text-lg text-muted-foreground">
                Backlog ({backlogTasks.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {backlogTasks.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-4">
                  No tasks in backlog.
                </p>
              ) : (
                <div className="space-y-2">
                  {backlogTasks.slice(0, 3).map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-3 p-2 rounded-lg border border-dashed border-muted-foreground/30"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50" />
                      <span className="text-sm text-muted-foreground truncate">{task.title}</span>
                    </div>
                  ))}
                  {backlogTasks.length > 3 && (
                    <p className="text-xs text-muted-foreground text-center pt-2">
                      +{backlogTasks.length - 3} more
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Helper components

function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  subtext, 
  color = "primary",
  alert = false,
}: { 
  icon: React.ElementType;
  label: string;
  value: number;
  subtext: string;
  color?: "primary" | "success" | "destructive" | "accent" | "info";
  alert?: boolean;
}) {
  const colorClasses = {
    primary: "bg-primary/10 text-primary",
    success: "bg-green-500/10 text-green-600 dark:text-green-400",
    destructive: "bg-red-500/10 text-red-600 dark:text-red-400",
    accent: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
    info: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  };

  return (
    <Card className={`card-hover ${alert ? "border-destructive/50" : ""}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">{label}</p>
            <p className="font-display text-3xl font-semibold">{value}</p>
            <p className={`text-xs mt-1 ${alert ? "text-destructive font-medium" : "text-muted-foreground"}`}>
              {subtext}
            </p>
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorClasses[color]}`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TaskRow({ 
  task, 
  variant = "default" 
}: { 
  task: { 
    id: string;
    title: string;
    priority: string;
    project?: { title: string } | null;
  };
  variant?: "default" | "overdue";
}) {
  const priorityColors: Record<string, string> = {
    urgent: "bg-red-500",
    high: "bg-orange-500",
    medium: "bg-yellow-500",
    low: "bg-blue-500",
  };

  return (
    <div 
      className={`flex items-center justify-between p-4 rounded-xl transition-colors ${
        variant === "overdue" 
          ? "bg-red-500/5 border border-red-500/20" 
          : "bg-muted/30 hover:bg-muted/50"
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${priorityColors[task.priority] ?? "bg-gray-400"}`} />
        <div className="min-w-0">
          <p className="font-medium truncate">{task.title}</p>
          {task.project && (
            <p className="text-xs text-muted-foreground">{task.project.title}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {variant === "overdue" && (
          <Badge variant="destructive" className="text-xs">Overdue</Badge>
        )}
        {task.priority !== "medium" && variant !== "overdue" && (
          <Badge variant="outline" className="text-xs capitalize">
            {task.priority}
          </Badge>
        )}
      </div>
    </div>
  );
}

function QuickActionButton({ 
  href, 
  icon: Icon, 
  label, 
  description 
}: { 
  href: string;
  icon: React.ElementType;
  label: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center justify-center p-4 rounded-xl bg-muted/30 hover:bg-primary/5 border border-transparent hover:border-primary/20 transition-all group"
    >
      <Icon className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors mb-2" />
      <span className="font-medium text-sm">{label}</span>
      <span className="text-xs text-muted-foreground">{description}</span>
    </Link>
  );
}

function getTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}
