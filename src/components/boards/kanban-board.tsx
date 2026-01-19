"use client";

import { useState, useMemo } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";

import type { Board } from "~/server/db/schema";
import { api } from "~/trpc/react";
import { KanbanColumn } from "./kanban-column";
import { TaskCard } from "./task-card";

interface KanbanBoardProps {
  board: Board;
}

type TaskStatus = "todo" | "in_progress" | "completed";

const columns: { id: TaskStatus; title: string }[] = [
  { id: "todo", title: "To Do" },
  { id: "in_progress", title: "In Progress" },
  { id: "completed", title: "Completed" },
];

export function KanbanBoard({ board }: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const utils = api.useUtils();

  const { data: tasks = [] } = api.task.getAll.useQuery({
    boardId: board.id,
    includeCompleted: true,
  });

  const updateTaskOrder = api.task.updateOrder.useMutation({
    onMutate: async ({ tasks: updatedTasks }) => {
      await utils.task.getAll.cancel();

      const previousTasks = utils.task.getAll.getData({
        boardId: board.id,
        includeCompleted: true,
      });

      utils.task.getAll.setData(
        { boardId: board.id, includeCompleted: true },
        (old) => {
          if (!old) return old;
          return old.map((task) => {
            const update = updatedTasks.find((u) => u.id === task.id);
            if (update) {
              return {
                ...task,
                sortOrder: update.sortOrder,
                status: update.status ?? task.status,
              };
            }
            return task;
          });
        },
      );

      return { previousTasks };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousTasks) {
        utils.task.getAll.setData(
          { boardId: board.id, includeCompleted: true },
          context.previousTasks,
        );
      }
    },
    onSettled: () => {
      void utils.task.getAll.invalidate();
    },
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const tasksByStatus = useMemo(() => {
    const grouped: Record<TaskStatus, typeof tasks> = {
      todo: [],
      in_progress: [],
      completed: [],
    };

    tasks.forEach((task) => {
      const status = task.status as TaskStatus;
      if (grouped[status]) {
        grouped[status].push(task);
      }
    });

    // Sort by sortOrder
    Object.keys(grouped).forEach((status) => {
      grouped[status as TaskStatus].sort(
        (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
      );
    });

    return grouped;
  }, [tasks]);

  const activeTask = useMemo(
    () => tasks.find((task) => task.id === activeId),
    [activeId, tasks],
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeTaskId = active.id as string;
    const overId = over.id as string;

    const overColumn = columns.find((col) => col.id === overId);
    if (overColumn) {
      const draggedTask = tasks.find((t) => t.id === activeTaskId);
      if (draggedTask && draggedTask.status !== overColumn.id) {
        utils.task.getAll.setData(
          { boardId: board.id, includeCompleted: true },
          (old) => {
            if (!old) return old;
            return old.map((task) => {
              if (task.id === activeTaskId) {
                return { ...task, status: overColumn.id };
              }
              return task;
            });
          },
        );
      }
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeTaskId = active.id as string;
    const overId = over.id as string;

    const draggedTask = tasks.find((t) => t.id === activeTaskId);
    if (!draggedTask) return;

    let targetStatus: TaskStatus = draggedTask.status as TaskStatus;
    const overColumn = columns.find((col) => col.id === overId);

    if (overColumn) {
      targetStatus = overColumn.id;
    } else {
      const overTask = tasks.find((t) => t.id === overId);
      if (overTask) {
        targetStatus = overTask.status as TaskStatus;
      }
    }

    const columnTasks = tasksByStatus[targetStatus].filter(
      (t) => t.id !== activeTaskId,
    );

    let newOrder: typeof tasks;
    if (overColumn || columnTasks.length === 0) {
      newOrder = [...columnTasks, { ...draggedTask, status: targetStatus }];
    } else {
      const overIndex = columnTasks.findIndex((t) => t.id === overId);
      newOrder = [
        ...columnTasks.slice(0, overIndex),
        { ...draggedTask, status: targetStatus },
        ...columnTasks.slice(overIndex),
      ];
    }

    const updates = newOrder.map((task, index) => ({
      id: task.id,
      sortOrder: index,
      status: targetStatus,
    }));

    updateTaskOrder.mutate({ tasks: updates });
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-full gap-4">
        {columns.map((column) => (
          <KanbanColumn
            key={column.id}
            id={column.id}
            title={column.title}
            tasks={tasksByStatus[column.id]}
            boardId={board.id}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask ? <TaskCard task={activeTask} isDragging /> : null}
      </DragOverlay>
    </DndContext>
  );
}
