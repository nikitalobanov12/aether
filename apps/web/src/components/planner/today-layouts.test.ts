import { describe, expect, it } from "vitest";

import { groupTasksForCards, resolveTodayLayout } from "~/components/planner/today-layouts";

describe("resolveTodayLayout", () => {
  it("returns checklist for unsupported values", () => {
    expect(resolveTodayLayout("random")).toBe("checklist");
  });

  it("returns the selected layout for supported values", () => {
    expect(resolveTodayLayout("timeline")).toBe("timeline");
    expect(resolveTodayLayout("cards")).toBe("cards");
  });
});

describe("groupTasksForCards", () => {
  it("groups tasks by priority and urgency", () => {
    const now = new Date("2026-02-17T10:00:00.000Z");

    const grouped = groupTasksForCards(
      [
        {
          id: "1",
          title: "Overdue task",
          priority: "medium",
          dueDate: new Date("2026-02-16T10:00:00.000Z"),
          scheduledStart: null,
          isNextUp: false,
        },
        {
          id: "2",
          title: "Next up task",
          priority: "high",
          dueDate: null,
          scheduledStart: null,
          isNextUp: true,
        },
        {
          id: "3",
          title: "Scheduled task",
          priority: "low",
          dueDate: null,
          scheduledStart: new Date("2026-02-17T12:00:00.000Z"),
          isNextUp: false,
        },
        {
          id: "4",
          title: "High priority task",
          priority: "urgent",
          dueDate: null,
          scheduledStart: null,
          isNextUp: false,
        },
        {
          id: "5",
          title: "General task",
          priority: "medium",
          dueDate: null,
          scheduledStart: null,
          isNextUp: false,
        },
      ],
      now,
    );

    expect(grouped.overdue.map((task) => task.id)).toEqual(["1"]);
    expect(grouped.nextUp.map((task) => task.id)).toEqual(["2"]);
    expect(grouped.scheduled.map((task) => task.id)).toEqual(["3"]);
    expect(grouped.highPriority.map((task) => task.id)).toEqual(["4"]);
    expect(grouped.backlog.map((task) => task.id)).toEqual(["5"]);
  });
});
