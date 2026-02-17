"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { addDays, addWeeks, format, isToday, startOfWeek, subWeeks } from "date-fns";
import {
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  Clock,
  GripVertical,
  MoreHorizontal,
} from "lucide-react";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { ScrollArea } from "~/components/ui/scroll-area";
import { toast } from "~/components/ui/sonner";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";
import type { RouterOutputs } from "~/trpc/react";
import { moveTaskInWeekData, type WeekBoardColumn } from "~/components/week/week-board-utils";

type WeekTasks = RouterOutputs["task"]["getThisWeek"];
type DayTask = WeekTasks["tasksByDay"]["monday"][number];

interface WeekTaskListProps {
  initialData: WeekTasks;
}

interface BoardColumn {
  id: WeekBoardColumn;
  title: string;
  subtitle: string;
  tasks: DayTask[];
  highlight?: boolean;
  isAlert?: boolean;
}

const DAY_NAMES = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

const DAY_LABELS: Record<(typeof DAY_NAMES)[number], string> = {
  sunday: "Sun",
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
};

export function WeekTaskList({ initialData }: WeekTaskListProps) {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 0 }));
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [activeDropColumn, setActiveDropColumn] = useState<WeekBoardColumn | null>(null);
  const [mobileColumn, setMobileColumn] = useState<WeekBoardColumn>(() => {
    const day = new Date().getUTCDay();
    return DAY_NAMES[day] ?? "monday";
  });

  const pendingMoveRef = useRef<{
    taskId: string;
    sourceColumn: WeekBoardColumn;
    destinationColumn: WeekBoardColumn;
  } | null>(null);

  const weekStartDate = useMemo(() => format(weekStart, "yyyy-MM-dd"), [weekStart]);

  const { data: weekData = initialData } = api.task.getThisWeek.useQuery(
    { weekStartDate, includeOverdue: true },
    { initialData },
  );

  const utils = api.useUtils();

  const removeTaskFromWeekData = (
    taskId: string,
    data: WeekTasks | undefined,
  ): WeekTasks | undefined => {
    if (!data) return data;

    const tasksByDay = normalizeTasksByDay(data.tasksByDay);

    return {
      ...data,
      overdue: data.overdue.filter((task) => task.id !== taskId),
      tasksByDay: {
        sunday: tasksByDay.sunday.filter((task) => task.id !== taskId),
        monday: tasksByDay.monday.filter((task) => task.id !== taskId),
        tuesday: tasksByDay.tuesday.filter((task) => task.id !== taskId),
        wednesday: tasksByDay.wednesday.filter((task) => task.id !== taskId),
        thursday: tasksByDay.thursday.filter((task) => task.id !== taskId),
        friday: tasksByDay.friday.filter((task) => task.id !== taskId),
        saturday: tasksByDay.saturday.filter((task) => task.id !== taskId),
      },
    };
  };

  const moveTaskMutation = api.task.update.useMutation({
    onMutate: async (variables) => {
      await utils.task.getThisWeek.cancel();
      const previousData = utils.task.getThisWeek.getData({ weekStartDate, includeOverdue: true });

      const pendingMove = pendingMoveRef.current;
      if (pendingMove?.taskId === variables.id) {
        utils.task.getThisWeek.setData({ weekStartDate, includeOverdue: true }, (old) => {
          if (!old) return old;
          const tasksByDay = normalizeTasksByDay(old.tasksByDay);
          const moved = moveTaskInWeekData(
            {
              overdue: old.overdue,
              tasksByDay,
            },
            pendingMove.taskId,
            pendingMove.sourceColumn,
            pendingMove.destinationColumn,
          );

          return {
            ...old,
            overdue: moved.overdue,
            tasksByDay: moved.tasksByDay,
          };
        });
      }

      return { previousData };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousData) {
        utils.task.getThisWeek.setData({ weekStartDate, includeOverdue: true }, context.previousData);
      }
      toast.error("Failed to move task");
    },
    onSuccess: () => {
      toast.success("Task moved");
    },
    onSettled: () => {
      pendingMoveRef.current = null;
      setDraggingTaskId(null);
      setActiveDropColumn(null);
      void utils.task.getThisWeek.invalidate();
      void utils.task.getToday.invalidate();
      void utils.task.getByDateRange.invalidate();
    },
  });

  const completeMutation = api.task.complete.useMutation({
    onMutate: async ({ id }) => {
      await utils.task.getThisWeek.cancel();
      const previousData = utils.task.getThisWeek.getData({ weekStartDate, includeOverdue: true });
      utils.task.getThisWeek.setData(
        { weekStartDate, includeOverdue: true },
        (old) => removeTaskFromWeekData(id, old),
      );
      return { previousData };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousData) {
        utils.task.getThisWeek.setData({ weekStartDate, includeOverdue: true }, context.previousData);
      }
      toast.error("Failed to complete task");
    },
    onSuccess: (completedTask) => {
      void utils.task.getToday.invalidate();
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
      void utils.task.getThisWeek.invalidate();
    },
  });

  const uncompleteMutation = api.task.uncomplete.useMutation({
    onSuccess: () => {
      void utils.task.getThisWeek.invalidate();
      void utils.task.getToday.invalidate();
      toast.info("Task restored");
    },
  });

  const snoozeMutation = api.task.snooze.useMutation({
    onMutate: async ({ id }) => {
      await utils.task.getThisWeek.cancel();
      const previousData = utils.task.getThisWeek.getData({ weekStartDate, includeOverdue: true });
      utils.task.getThisWeek.setData(
        { weekStartDate, includeOverdue: true },
        (old) => removeTaskFromWeekData(id, old),
      );
      return { previousData };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousData) {
        utils.task.getThisWeek.setData({ weekStartDate, includeOverdue: true }, context.previousData);
      }
      toast.error("Failed to snooze task");
    },
    onSuccess: () => {
      toast.info("Task snoozed");
    },
    onSettled: () => {
      void utils.task.getThisWeek.invalidate();
    },
  });

  const deleteMutation = api.task.delete.useMutation({
    onMutate: async ({ id }) => {
      await utils.task.getThisWeek.cancel();
      const previousData = utils.task.getThisWeek.getData({ weekStartDate, includeOverdue: true });
      utils.task.getThisWeek.setData(
        { weekStartDate, includeOverdue: true },
        (old) => removeTaskFromWeekData(id, old),
      );
      return { previousData };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousData) {
        utils.task.getThisWeek.setData({ weekStartDate, includeOverdue: true }, context.previousData);
      }
      toast.error("Failed to delete task");
    },
    onSuccess: () => {
      toast.success("Task deleted");
    },
    onSettled: () => {
      void utils.task.getThisWeek.invalidate();
    },
  });

  const goToPreviousWeek = () => setWeekStart((date) => subWeeks(date, 1));
  const goToNextWeek = () => setWeekStart((date) => addWeeks(date, 1));
  const goToCurrentWeek = () => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 0 }));

  const isCurrentWeek = useMemo(() => {
    const currentWeekStart = startOfWeek(new Date(), { weekStartsOn: 0 });
    return weekStart.getTime() === currentWeekStart.getTime();
  }, [weekStart]);

  const weekEnd = addDays(weekStart, 6);

  const columns = useMemo(() => {
    const dayColumns = DAY_NAMES.map((dayName, index) => {
      const date = addDays(weekStart, index);
      return {
        id: dayName as WeekBoardColumn,
        title: isToday(date) ? "Today" : DAY_LABELS[dayName],
        subtitle: format(date, "MMM d"),
        tasks: weekData.tasksByDay[dayName] ?? [],
        highlight: isToday(date),
      };
    });

    const allColumns: BoardColumn[] = [
      {
        id: "overdue" as WeekBoardColumn,
        title: "Overdue",
        subtitle: "Needs attention",
        tasks: weekData.overdue,
        isAlert: true,
      },
      ...dayColumns,
    ];

    return allColumns;
  }, [weekData.overdue, weekData.tasksByDay, weekStart]);

  const mobileActiveColumn = useMemo(() => {
    return columns.find((column) => column.id === mobileColumn) ?? columns[0];
  }, [columns, mobileColumn]);

  const totalTasks = useMemo(() => {
    return (
      weekData.overdue.length +
      DAY_NAMES.reduce((sum, day) => sum + (weekData.tasksByDay[day]?.length ?? 0), 0)
    );
  }, [weekData.overdue.length, weekData.tasksByDay]);

  const handleComplete = useCallback((taskId: string) => {
    completeMutation.mutate({ id: taskId });
  }, [completeMutation]);

  const handleSnooze = useCallback((taskId: string) => {
    snoozeMutation.mutate({ id: taskId, days: 1 });
  }, [snoozeMutation]);

  const handleDelete = useCallback((taskId: string) => {
    deleteMutation.mutate({ id: taskId });
  }, [deleteMutation]);

  const handleMoveTask = useCallback(
    (taskId: string, sourceColumn: WeekBoardColumn, destinationColumn: WeekBoardColumn) => {
      if (sourceColumn === destinationColumn || moveTaskMutation.isPending) {
        return;
      }

      const destinationDate = resolveColumnDueDate(destinationColumn, weekStart);

      pendingMoveRef.current = {
        taskId,
        sourceColumn,
        destinationColumn,
      };

      moveTaskMutation.mutate({
        id: taskId,
        dueDate: destinationDate.toISOString(),
        scheduledStart: null,
        scheduledEnd: null,
      });
    },
    [moveTaskMutation, weekStart],
  );

  const onTaskDragStart = (taskId: string, sourceColumn: WeekBoardColumn) => {
    setDraggingTaskId(taskId);
    setActiveDropColumn(sourceColumn);
    pendingMoveRef.current = {
      taskId,
      sourceColumn,
      destinationColumn: sourceColumn,
    };
  };

  const onTaskDragEnd = () => {
    if (!moveTaskMutation.isPending) {
      setDraggingTaskId(null);
      setActiveDropColumn(null);
      pendingMoveRef.current = null;
    }
  };

  const onColumnDrop = (destinationColumn: WeekBoardColumn) => {
    const pendingMove = pendingMoveRef.current;
    if (!pendingMove || !draggingTaskId) return;

    handleMoveTask(draggingTaskId, pendingMove.sourceColumn, destinationColumn);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-col gap-4 border-b px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-3">
          <Calendar className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-xl font-semibold sm:text-2xl">Week Board</h1>
            <p className="text-muted-foreground text-sm">
              {format(weekStart, "MMMM d")} - {format(weekEnd, "MMMM d, yyyy")}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 sm:justify-end">
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <CheckCircle2 className="h-4 w-4" />
            <span>{totalTasks} tasks</span>
          </div>

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={goToPreviousWeek}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant={isCurrentWeek ? "default" : "outline"} size="sm" onClick={goToCurrentWeek}>
              This Week
            </Button>
            <Button variant="ghost" size="icon" onClick={goToNextWeek}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="border-b px-4 py-2 md:hidden">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {columns.map((column) => (
            <Button
              key={column.id}
              variant={mobileColumn === column.id ? "default" : "outline"}
              size="sm"
              className="shrink-0 rounded-full"
              onClick={() => setMobileColumn(column.id)}
            >
              {column.title}
              <span className="ml-1 text-xs opacity-80">{column.tasks.length}</span>
            </Button>
          ))}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="hidden px-4 py-4 md:block sm:px-6">
          <div className="grid min-w-[960px] grid-cols-8 gap-3">
            {columns.map((column) => (
              <WeekColumn
                key={column.id}
                columnId={column.id}
                title={column.title}
                subtitle={column.subtitle}
                tasks={column.tasks}
                highlight={column.highlight}
                isAlert={column.isAlert}
                draggingTaskId={draggingTaskId}
                activeDropColumn={activeDropColumn}
                onTaskDragStart={onTaskDragStart}
                onTaskDragEnd={onTaskDragEnd}
                onColumnDragEnter={setActiveDropColumn}
                onColumnDrop={onColumnDrop}
                onMoveTask={handleMoveTask}
                onComplete={handleComplete}
                onSnooze={handleSnooze}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </div>

        <div className="px-4 py-4 md:hidden">
          {mobileActiveColumn ? (
            <WeekColumn
              columnId={mobileActiveColumn.id}
              title={mobileActiveColumn.title}
              subtitle={mobileActiveColumn.subtitle}
              tasks={mobileActiveColumn.tasks}
              highlight={mobileActiveColumn.highlight}
              isAlert={mobileActiveColumn.isAlert}
              draggingTaskId={draggingTaskId}
              activeDropColumn={activeDropColumn}
              onTaskDragStart={onTaskDragStart}
              onTaskDragEnd={onTaskDragEnd}
              onColumnDragEnter={setActiveDropColumn}
              onColumnDrop={onColumnDrop}
              onMoveTask={handleMoveTask}
              onComplete={handleComplete}
              onSnooze={handleSnooze}
              onDelete={handleDelete}
              compact
            />
          ) : null}
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Tip: hold and drag tasks on desktop, or use the task menu on mobile.
          </p>
        </div>

        {totalTasks === 0 && (
          <div className="text-muted-foreground py-12 text-center">
            <Circle className="mx-auto mb-3 h-12 w-12 opacity-20" />
            <p className="text-lg font-medium">No tasks on this board</p>
            <p className="text-sm">Add due dates in Today or Calendar to plan the week.</p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

interface WeekColumnProps {
  columnId: WeekBoardColumn;
  title: string;
  subtitle: string;
  tasks: DayTask[];
  highlight?: boolean;
  isAlert?: boolean;
  draggingTaskId: string | null;
  activeDropColumn: WeekBoardColumn | null;
  onTaskDragStart: (taskId: string, sourceColumn: WeekBoardColumn) => void;
  onTaskDragEnd: () => void;
  onColumnDragEnter: (column: WeekBoardColumn) => void;
  onColumnDrop: (column: WeekBoardColumn) => void;
  onMoveTask: (taskId: string, sourceColumn: WeekBoardColumn, destinationColumn: WeekBoardColumn) => void;
  onComplete: (id: string) => void;
  onSnooze: (id: string) => void;
  onDelete: (id: string) => void;
  compact?: boolean;
}

function WeekColumn({
  columnId,
  title,
  subtitle,
  tasks,
  highlight,
  isAlert,
  draggingTaskId,
  activeDropColumn,
  onTaskDragStart,
  onTaskDragEnd,
  onColumnDragEnter,
  onColumnDrop,
  onMoveTask,
  onComplete,
  onSnooze,
  onDelete,
  compact,
}: WeekColumnProps) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-border/60 bg-card p-3 transition",
        highlight && "border-primary/40 bg-primary/5",
        isAlert && "border-red-500/40 bg-red-500/5",
        activeDropColumn === columnId && draggingTaskId && "border-primary bg-primary/10 ring-1 ring-primary/50",
      )}
      onDragOver={(event) => {
        event.preventDefault();
      }}
      onDragEnter={() => onColumnDragEnter(columnId)}
      onDrop={(event) => {
        event.preventDefault();
        onColumnDrop(columnId);
      }}
    >
      <div className="mb-3">
        <p className="text-sm font-semibold tracking-tight">{title}</p>
        <div className="mt-1 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">{subtitle}</p>
          <Badge variant={highlight ? "default" : "secondary"}>{tasks.length}</Badge>
        </div>
      </div>

      <div className={cn("space-y-2", compact && "space-y-2.5")}>
        {tasks.length === 0 ? (
          <p className="text-xs text-muted-foreground">No tasks</p>
        ) : (
          tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              columnId={columnId}
              isOverdue={isAlert}
              onTaskDragStart={onTaskDragStart}
              onTaskDragEnd={onTaskDragEnd}
              onMoveTask={onMoveTask}
              onComplete={onComplete}
              onSnooze={onSnooze}
              onDelete={onDelete}
            />
          ))
        )}
      </div>
    </section>
  );
}

interface TaskItemProps {
  task: DayTask;
  columnId: WeekBoardColumn;
  isOverdue?: boolean;
  onTaskDragStart: (taskId: string, sourceColumn: WeekBoardColumn) => void;
  onTaskDragEnd: () => void;
  onMoveTask: (taskId: string, sourceColumn: WeekBoardColumn, destinationColumn: WeekBoardColumn) => void;
  onComplete: (id: string) => void;
  onSnooze: (id: string) => void;
  onDelete: (id: string) => void;
}

function TaskItem({
  task,
  columnId,
  isOverdue,
  onTaskDragStart,
  onTaskDragEnd,
  onMoveTask,
  onComplete,
  onSnooze,
  onDelete,
}: TaskItemProps) {
  const todayColumn = DAY_NAMES[new Date().getUTCDay()] ?? "monday";
  const tomorrowColumn = DAY_NAMES[(new Date().getUTCDay() + 1) % 7] ?? "tuesday";

  return (
    <div
      className={cn(
        "group rounded-xl border border-border/60 bg-background/90 p-2.5 transition-colors hover:bg-muted/50",
        isOverdue && "border-red-500/40 bg-red-500/5",
      )}
      draggable
      onDragStart={() => onTaskDragStart(task.id, columnId)}
      onDragEnd={onTaskDragEnd}
    >
      <div className="mb-2 flex items-start gap-2">
        <GripVertical className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <Checkbox
          checked={task.status === "completed"}
          onCheckedChange={() => onComplete(task.id)}
          className="mt-0.5"
        />
        <p
          className={cn(
            "line-clamp-2 text-sm font-medium",
            task.status === "completed" && "text-muted-foreground line-through",
          )}
        >
          {task.title}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {task.project && (
          <Badge variant="secondary" className="text-[10px]">
            {task.project.title}
          </Badge>
        )}

        {task.priority !== "medium" && (
          <Badge
            variant="outline"
            className={cn(
              "text-[10px]",
              task.priority === "urgent" && "border-red-500 text-red-500",
              task.priority === "high" && "border-orange-500 text-orange-500",
              task.priority === "low" && "border-gray-400 text-gray-400",
            )}
          >
            {task.priority}
          </Badge>
        )}

        {task.scheduledStart && (
          <span className="text-muted-foreground flex items-center gap-1 text-[10px]">
            <Clock className="h-3 w-3" />
            {format(new Date(task.scheduledStart), "h:mm a")}
          </span>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="ml-auto h-7 w-7">
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onMoveTask(task.id, columnId, todayColumn)}>
              Move to Today
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onMoveTask(task.id, columnId, tomorrowColumn)}>
              Move to Tomorrow
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onComplete(task.id)}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Complete
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSnooze(task.id)}>
              <Calendar className="mr-2 h-4 w-4" />
              Snooze to tomorrow
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onDelete(task.id)} className="text-destructive">
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

function resolveColumnDueDate(destinationColumn: WeekBoardColumn, weekStart: Date): Date {
  if (destinationColumn === "overdue") {
    const overdueDate = new Date(weekStart);
    overdueDate.setUTCDate(overdueDate.getUTCDate() - 1);
    overdueDate.setUTCHours(23, 59, 59, 999);
    return overdueDate;
  }

  const dayIndex = DAY_NAMES.findIndex((day) => day === destinationColumn);
  const dueDate = addDays(weekStart, dayIndex);
  dueDate.setUTCHours(23, 59, 59, 999);
  return dueDate;
}

function normalizeTasksByDay(tasksByDay: WeekTasks["tasksByDay"]): {
  sunday: DayTask[];
  monday: DayTask[];
  tuesday: DayTask[];
  wednesday: DayTask[];
  thursday: DayTask[];
  friday: DayTask[];
  saturday: DayTask[];
} {
  return {
    sunday: tasksByDay.sunday ?? [],
    monday: tasksByDay.monday ?? [],
    tuesday: tasksByDay.tuesday ?? [],
    wednesday: tasksByDay.wednesday ?? [],
    thursday: tasksByDay.thursday ?? [],
    friday: tasksByDay.friday ?? [],
    saturday: tasksByDay.saturday ?? [],
  };
}
