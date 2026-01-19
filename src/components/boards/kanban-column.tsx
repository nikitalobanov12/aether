"use client";

import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus } from "lucide-react";

import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import { ScrollArea } from "~/components/ui/scroll-area";
import { SortableTaskCard } from "./task-card";
import { TaskDialog } from "~/components/tasks/task-dialog";

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
  boardId: string | null;
}

interface KanbanColumnProps {
  id: string;
  title: string;
  tasks: Task[];
  boardId: string;
}

export function KanbanColumn({ id, title, tasks, boardId }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const [createOpen, setCreateOpen] = useState(false);

  const taskCount = tasks.length;

  return (
    <>
      <div
        ref={setNodeRef}
        className={cn(
          "bg-muted/50 flex w-80 flex-shrink-0 flex-col rounded-lg",
          isOver && "ring-primary ring-2 ring-offset-2",
        )}
      >
        {/* Column Header */}
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{title}</h3>
            <span className="bg-muted flex h-5 w-5 items-center justify-center rounded-full text-xs font-medium">
              {taskCount}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Task List */}
        <ScrollArea className="flex-1 px-2">
          <SortableContext
            items={tasks.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="flex flex-col gap-2 pb-2">
              {tasks.map((task) => (
                <SortableTaskCard key={task.id} task={task} />
              ))}
              {tasks.length === 0 && (
                <div className="border-muted-foreground/20 flex h-24 items-center justify-center rounded-lg border-2 border-dashed">
                  <p className="text-muted-foreground text-sm">No tasks</p>
                </div>
              )}
            </div>
          </SortableContext>
        </ScrollArea>
      </div>

      <TaskDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        boardId={boardId}
        defaultStatus={id as "todo" | "in_progress" | "completed"}
      />
    </>
  );
}
