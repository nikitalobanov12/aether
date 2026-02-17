import { describe, expect, it } from "vitest";

import {
  getDropPulseClass,
  getDraggingTaskClass,
  moveTaskInWeekData,
  type WeekBoardColumn,
  type WeekBoardData,
} from "~/components/week/week-board-utils";

describe("moveTaskInWeekData", () => {
  const baseData: WeekBoardData<{ id: string; title: string }> = {
    overdue: [{ id: "task-a", title: "Overdue" }],
    tasksByDay: {
      sunday: [{ id: "task-b", title: "Sunday task" }],
      monday: [{ id: "task-c", title: "Monday task" }],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
    },
  };

  it("moves a task from overdue to a day column", () => {
    const result = moveTaskInWeekData(baseData, "task-a", "overdue", "tuesday");

    expect(result.overdue).toHaveLength(0);
    expect(result.tasksByDay.tuesday.map((task) => task.id)).toEqual(["task-a"]);
  });

  it("moves a task from a day column to overdue", () => {
    const result = moveTaskInWeekData(baseData, "task-b", "sunday", "overdue");

    expect(result.tasksByDay.sunday).toHaveLength(0);
    expect(result.overdue.map((task) => task.id)).toEqual(["task-a", "task-b"]);
  });

  it("returns unchanged data when source and destination match", () => {
    const source: WeekBoardColumn = "monday";
    const result = moveTaskInWeekData(baseData, "task-c", source, source);

    expect(result).toEqual(baseData);
  });
});

describe("getDropPulseClass", () => {
  it("returns pulse class only when this is recently dropped column", () => {
    expect(getDropPulseClass("monday", "monday")).toBe("animate-drop-pulse");
    expect(getDropPulseClass("monday", "tuesday")).toBe("");
    expect(getDropPulseClass("monday", null)).toBe("");
  });
});

describe("getDraggingTaskClass", () => {
  it("returns drag ghost class for actively dragged task", () => {
    expect(getDraggingTaskClass("task-1", "task-1")).toContain("scale-[1.02]");
    expect(getDraggingTaskClass("task-1", "task-2")).toBe("");
    expect(getDraggingTaskClass("task-1", null)).toBe("");
  });
});
