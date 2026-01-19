"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import {
  format,
  addDays,
  startOfWeek,
  addWeeks,
  subWeeks,
  isSameDay,
  isToday,
  setHours,
  setMinutes,
  differenceInMinutes,
} from "date-fns";

import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { ScrollArea } from "~/components/ui/scroll-area";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";
import type { RouterOutputs } from "~/trpc/react";

// Time grid constants
const HOUR_HEIGHT = 60; // pixels per hour
const START_HOUR = 6; // 6 AM
const END_HOUR = 22; // 10 PM
const TOTAL_HOURS = END_HOUR - START_HOUR;

type TimeBlock = RouterOutputs["timeBlock"]["getByDateRange"][number];
type Task = RouterOutputs["task"]["getByDateRange"][number];

interface CalendarViewProps {
  initialTimeBlocks: TimeBlock[];
  initialTasks: Task[];
}

export function CalendarView({
  initialTimeBlocks,
  initialTasks,
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{
    date: Date;
    hour: number;
  } | null>(null);

  const weekStart = useMemo(
    () => startOfWeek(currentDate, { weekStartsOn: 0 }),
    [currentDate],
  );

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );

  const weekEnd = useMemo(() => addDays(weekStart, 7), [weekStart]);

  // Fetch time blocks and tasks for current week
  const { data: timeBlocks = initialTimeBlocks, refetch: refetchBlocks } =
    api.timeBlock.getByDateRange.useQuery(
      {
        startDate: weekStart.toISOString(),
        endDate: weekEnd.toISOString(),
      },
      {
        initialData: initialTimeBlocks,
      },
    );

  const { data: tasks = initialTasks, refetch: refetchTasks } =
    api.task.getByDateRange.useQuery(
      {
        startDate: weekStart.toISOString(),
        endDate: weekEnd.toISOString(),
      },
      {
        initialData: initialTasks,
      },
    );

  const createTimeBlock = api.timeBlock.create.useMutation({
    onSuccess: () => {
      void refetchBlocks();
      void refetchTasks();
      setIsDialogOpen(false);
      setSelectedSlot(null);
    },
  });

  // These mutations are prepared for the edit/delete UI to be added
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _updateTimeBlock = api.timeBlock.update.useMutation({
    onSuccess: () => {
      void refetchBlocks();
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _deleteTimeBlock = api.timeBlock.delete.useMutation({
    onSuccess: () => {
      void refetchBlocks();
      void refetchTasks();
    },
  });

  const handlePreviousWeek = () => setCurrentDate(subWeeks(currentDate, 1));
  const handleNextWeek = () => setCurrentDate(addWeeks(currentDate, 1));
  const handleToday = () => setCurrentDate(new Date());

  const handleSlotClick = (date: Date, hour: number) => {
    setSelectedSlot({ date, hour });
    setIsDialogOpen(true);
  };

  // Get blocks for a specific day
  const getBlocksForDay = (day: Date) => {
    return timeBlocks.filter((block) =>
      isSameDay(new Date(block.startTime), day),
    );
  };

  // Get scheduled tasks for a specific day (that aren't tied to time blocks)
  const getScheduledTasksForDay = (day: Date) => {
    return tasks.filter(
      (task) =>
        task.scheduledStart &&
        isSameDay(new Date(task.scheduledStart), day) &&
        !timeBlocks.some((block) => block.taskId === task.id),
    );
  };

  // Get unscheduled tasks with due dates
  const unscheduledTasks = useMemo(() => {
    return tasks.filter(
      (task) =>
        !task.scheduledStart &&
        task.status !== "completed" &&
        task.status !== "cancelled",
    );
  }, [tasks]);

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Calendar</h1>
          <p className="text-muted-foreground">
            {format(weekStart, "MMMM d")} -{" "}
            {format(addDays(weekStart, 6), "MMMM d, yyyy")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePreviousWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={handleToday}>
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={handleNextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-1 gap-4 overflow-hidden">
        {/* Main calendar grid */}
        <Card className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="min-w-[800px]">
              {/* Day headers */}
              <div className="bg-background sticky top-0 z-10 grid grid-cols-[60px_repeat(7,1fr)] border-b">
                <div className="p-2" /> {/* Time column header */}
                {weekDays.map((day) => (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      "border-l p-2 text-center",
                      isToday(day) && "bg-primary/5",
                    )}
                  >
                    <div className="text-muted-foreground text-xs font-medium">
                      {format(day, "EEE")}
                    </div>
                    <div
                      className={cn(
                        "text-lg font-semibold",
                        isToday(day) &&
                          "bg-primary text-primary-foreground mx-auto flex h-8 w-8 items-center justify-center rounded-full",
                      )}
                    >
                      {format(day, "d")}
                    </div>
                  </div>
                ))}
              </div>

              {/* Time grid */}
              <div className="grid grid-cols-[60px_repeat(7,1fr)]">
                {/* Time labels */}
                <div className="relative">
                  {Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => (
                    <div
                      key={i}
                      className="text-muted-foreground absolute right-2 -translate-y-1/2 text-xs"
                      style={{ top: i * HOUR_HEIGHT }}
                    >
                      {format(
                        setHours(setMinutes(new Date(), 0), START_HOUR + i),
                        "h a",
                      )}
                    </div>
                  ))}
                </div>

                {/* Day columns */}
                {weekDays.map((day) => (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      "relative border-l",
                      isToday(day) && "bg-primary/5",
                    )}
                    style={{ height: TOTAL_HOURS * HOUR_HEIGHT }}
                  >
                    {/* Hour lines */}
                    {Array.from({ length: TOTAL_HOURS }, (_, i) => (
                      <div
                        key={i}
                        className="border-muted hover:bg-muted/50 absolute inset-x-0 cursor-pointer border-b border-dashed transition-colors"
                        style={{
                          top: i * HOUR_HEIGHT,
                          height: HOUR_HEIGHT,
                        }}
                        onClick={() => handleSlotClick(day, START_HOUR + i)}
                      />
                    ))}

                    {/* Time blocks */}
                    {getBlocksForDay(day).map((block) => {
                      const blockStart = new Date(block.startTime);
                      const blockEnd = new Date(block.endTime);
                      const startMinutes =
                        (blockStart.getHours() - START_HOUR) * 60 +
                        blockStart.getMinutes();
                      const durationMinutes = differenceInMinutes(
                        blockEnd,
                        blockStart,
                      );
                      const top = (startMinutes / 60) * HOUR_HEIGHT;
                      const height = (durationMinutes / 60) * HOUR_HEIGHT;

                      return (
                        <div
                          key={block.id}
                          className={cn(
                            "absolute inset-x-1 cursor-pointer overflow-hidden rounded-md p-1 text-xs transition-opacity hover:opacity-90",
                            block.isCompleted && "opacity-60",
                          )}
                          style={{
                            top: Math.max(0, top),
                            height: Math.max(20, height),
                            backgroundColor: block.color ?? "#3b82f6",
                          }}
                          onClick={() => {
                            // Could open edit dialog here
                          }}
                        >
                          <div className="truncate font-medium text-white">
                            {block.title}
                          </div>
                          {height > 30 && (
                            <div className="truncate text-white/80">
                              {format(blockStart, "h:mm a")} -{" "}
                              {format(blockEnd, "h:mm a")}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Scheduled tasks (not in time blocks) */}
                    {getScheduledTasksForDay(day).map((task) => {
                      if (!task.scheduledStart) return null;
                      const taskStart = new Date(task.scheduledStart);
                      const taskEnd = task.scheduledEnd
                        ? new Date(task.scheduledEnd)
                        : new Date(
                            taskStart.getTime() +
                              (task.estimatedMinutes ?? 60) * 60 * 1000,
                          );
                      const startMinutes =
                        (taskStart.getHours() - START_HOUR) * 60 +
                        taskStart.getMinutes();
                      const durationMinutes = differenceInMinutes(
                        taskEnd,
                        taskStart,
                      );
                      const top = (startMinutes / 60) * HOUR_HEIGHT;
                      const height = (durationMinutes / 60) * HOUR_HEIGHT;

                      const priorityColors = {
                        urgent: "#ef4444",
                        high: "#f97316",
                        medium: "#eab308",
                        low: "#3b82f6",
                      };

                      return (
                        <div
                          key={task.id}
                          className="bg-card absolute inset-x-1 overflow-hidden rounded-md border-l-4 p-1 text-xs shadow-sm"
                          style={{
                            top: Math.max(0, top),
                            height: Math.max(20, height),
                            borderLeftColor:
                              priorityColors[task.priority] ?? "#3b82f6",
                          }}
                        >
                          <div className="truncate font-medium">
                            {task.title}
                          </div>
                          {height > 30 && (
                            <div className="text-muted-foreground truncate">
                              {format(taskStart, "h:mm a")}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Current time indicator */}
                    {isToday(day) && <CurrentTimeIndicator />}
                  </div>
                ))}
              </div>
            </div>
          </ScrollArea>
        </Card>

        {/* Sidebar - Unscheduled tasks */}
        <Card className="hidden w-80 lg:flex lg:flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4" />
              Unscheduled Tasks
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              {unscheduledTasks.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  All tasks are scheduled!
                </p>
              ) : (
                <div className="space-y-2">
                  {unscheduledTasks.map((task) => (
                    <div
                      key={task.id}
                      className="hover:bg-muted/50 cursor-grab rounded-lg border p-2 text-sm transition-colors"
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("taskId", task.id);
                        e.dataTransfer.setData("taskTitle", task.title);
                        e.dataTransfer.setData(
                          "estimatedMinutes",
                          String(task.estimatedMinutes ?? 60),
                        );
                      }}
                    >
                      <div className="font-medium">{task.title}</div>
                      <div className="mt-1 flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs",
                            task.priority === "urgent" &&
                              "border-red-500 text-red-500",
                            task.priority === "high" &&
                              "border-orange-500 text-orange-500",
                            task.priority === "medium" &&
                              "border-yellow-500 text-yellow-500",
                            task.priority === "low" &&
                              "border-blue-500 text-blue-500",
                          )}
                        >
                          {task.priority}
                        </Badge>
                        {task.dueDate && (
                          <span className="text-muted-foreground text-xs">
                            Due {format(new Date(task.dueDate), "MMM d")}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Create time block dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Time Block</DialogTitle>
          </DialogHeader>
          <CreateTimeBlockForm
            selectedSlot={selectedSlot}
            onSubmit={(data) => {
              createTimeBlock.mutate(data);
            }}
            isLoading={createTimeBlock.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CurrentTimeIndicator() {
  const now = new Date();
  const minutes = (now.getHours() - START_HOUR) * 60 + now.getMinutes();
  const top = (minutes / 60) * HOUR_HEIGHT;

  if (now.getHours() < START_HOUR || now.getHours() >= END_HOUR) {
    return null;
  }

  return (
    <div className="absolute inset-x-0 z-20 flex items-center" style={{ top }}>
      <div className="-ml-1.5 h-3 w-3 rounded-full bg-red-500" />
      <div className="flex-1 border-t-2 border-red-500" />
    </div>
  );
}

interface CreateTimeBlockFormProps {
  selectedSlot: { date: Date; hour: number } | null;
  onSubmit: (data: {
    title: string;
    startTime: string;
    endTime: string;
    color?: string;
    notes?: string;
  }) => void;
  isLoading: boolean;
}

function CreateTimeBlockForm({
  selectedSlot,
  onSubmit,
  isLoading,
}: CreateTimeBlockFormProps) {
  const defaultStartTime = selectedSlot
    ? setMinutes(setHours(selectedSlot.date, selectedSlot.hour), 0)
    : new Date();
  const defaultEndTime = new Date(defaultStartTime.getTime() + 60 * 60 * 1000);

  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState(
    format(defaultStartTime, "yyyy-MM-dd'T'HH:mm"),
  );
  const [endTime, setEndTime] = useState(
    format(defaultEndTime, "yyyy-MM-dd'T'HH:mm"),
  );
  const [color, setColor] = useState("#3b82f6");
  const [notes, setNotes] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      title,
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
      color,
      notes: notes || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What are you working on?"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startTime">Start Time</Label>
          <Input
            id="startTime"
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endTime">End Time</Label>
          <Input
            id="endTime"
            type="datetime-local"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="color">Color</Label>
        <div className="flex gap-2">
          {[
            "#3b82f6",
            "#ef4444",
            "#22c55e",
            "#f97316",
            "#8b5cf6",
            "#ec4899",
          ].map((c) => (
            <button
              key={c}
              type="button"
              className={cn(
                "h-8 w-8 rounded-full border-2 transition-all",
                color === c
                  ? "border-foreground scale-110"
                  : "border-transparent",
              )}
              style={{ backgroundColor: c }}
              onClick={() => setColor(c)}
            />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes (optional)</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any notes..."
          rows={3}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Creating..." : "Create Time Block"}
      </Button>
    </form>
  );
}
