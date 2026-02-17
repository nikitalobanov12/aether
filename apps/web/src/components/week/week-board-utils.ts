export type WeekBoardColumn =
  | "overdue"
  | "sunday"
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday";

export interface WeekBoardData<TTask> {
  overdue: TTask[];
  tasksByDay: {
    sunday: TTask[];
    monday: TTask[];
    tuesday: TTask[];
    wednesday: TTask[];
    thursday: TTask[];
    friday: TTask[];
    saturday: TTask[];
  };
}

export function moveTaskInWeekData<TTask extends { id: string }>(
  data: WeekBoardData<TTask>,
  taskId: string,
  sourceColumn: WeekBoardColumn,
  destinationColumn: WeekBoardColumn,
): WeekBoardData<TTask> {
  if (sourceColumn === destinationColumn) {
    return data;
  }

  const sourceTasks = getColumnTasks(data, sourceColumn);
  const taskToMove = sourceTasks.find((task) => task.id === taskId);

  if (!taskToMove) {
    return data;
  }

  const sourceWithoutTask = sourceTasks.filter((task) => task.id !== taskId);
  const destinationTasks = getColumnTasks(data, destinationColumn);

  return {
    overdue:
      sourceColumn === "overdue"
        ? sourceWithoutTask
        : destinationColumn === "overdue"
          ? [...destinationTasks, taskToMove]
          : data.overdue,
    tasksByDay: {
      sunday: resolveDayColumn(
        data,
        "sunday",
        sourceColumn,
        destinationColumn,
        sourceWithoutTask,
        destinationTasks,
        taskToMove,
      ),
      monday: resolveDayColumn(
        data,
        "monday",
        sourceColumn,
        destinationColumn,
        sourceWithoutTask,
        destinationTasks,
        taskToMove,
      ),
      tuesday: resolveDayColumn(
        data,
        "tuesday",
        sourceColumn,
        destinationColumn,
        sourceWithoutTask,
        destinationTasks,
        taskToMove,
      ),
      wednesday: resolveDayColumn(
        data,
        "wednesday",
        sourceColumn,
        destinationColumn,
        sourceWithoutTask,
        destinationTasks,
        taskToMove,
      ),
      thursday: resolveDayColumn(
        data,
        "thursday",
        sourceColumn,
        destinationColumn,
        sourceWithoutTask,
        destinationTasks,
        taskToMove,
      ),
      friday: resolveDayColumn(
        data,
        "friday",
        sourceColumn,
        destinationColumn,
        sourceWithoutTask,
        destinationTasks,
        taskToMove,
      ),
      saturday: resolveDayColumn(
        data,
        "saturday",
        sourceColumn,
        destinationColumn,
        sourceWithoutTask,
        destinationTasks,
        taskToMove,
      ),
    },
  };
}

function resolveDayColumn<TTask>(
  data: WeekBoardData<TTask>,
  day: keyof WeekBoardData<TTask>["tasksByDay"],
  sourceColumn: WeekBoardColumn,
  destinationColumn: WeekBoardColumn,
  sourceWithoutTask: TTask[],
  destinationTasks: TTask[],
  taskToMove: TTask,
): TTask[] {
  if (sourceColumn === day) {
    return sourceWithoutTask;
  }

  if (destinationColumn === day) {
    return [...destinationTasks, taskToMove];
  }

  return data.tasksByDay[day];
}

function getColumnTasks<TTask>(
  data: WeekBoardData<TTask>,
  column: WeekBoardColumn,
): TTask[] {
  if (column === "overdue") {
    return data.overdue;
  }

  return data.tasksByDay[column];
}
