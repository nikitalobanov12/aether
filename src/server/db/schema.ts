import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

// ============================================================================
// ENUMS
// ============================================================================

export const taskPriorityEnum = pgEnum("task_priority", [
  "low",
  "medium",
  "high",
  "urgent",
]);

export const taskStatusEnum = pgEnum("task_status", [
  "todo",
  "in_progress",
  "completed",
  "cancelled",
]);

export const goalStatusEnum = pgEnum("goal_status", [
  "not_started",
  "in_progress",
  "completed",
  "abandoned",
]);

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active",
  "cancelled",
  "past_due",
  "trialing",
  "incomplete",
]);

export const syncStatusEnum = pgEnum("sync_status", [
  "pending",
  "syncing",
  "synced",
  "failed",
]);

export const syncTypeEnum = pgEnum("sync_type", [
  "calendar",
  "tasks",
  "task_to_google",
  "event_to_app",
]);

// ============================================================================
// AUTH TABLES (Better Auth)
// ============================================================================

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified")
    .$defaultFn(() => false)
    .notNull(),
  image: text("image"),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => new Date())
    .notNull(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at").$defaultFn(() => new Date()),
});

// ============================================================================
// APPLICATION TABLES
// ============================================================================

// Boards (Kanban boards)
export const board = pgTable(
  "aether_board",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    color: text("color").default("#3b82f6"),
    icon: text("icon"),
    isDefault: boolean("is_default").default(false),
    sortOrder: integer("sort_order").default(0),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updated_at")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (t) => [index("board_user_id_idx").on(t.userId)],
);

// Goals
export const goal = pgTable(
  "aether_goal",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    status: goalStatusEnum("status").default("not_started").notNull(),
    targetDate: timestamp("target_date"),
    completedAt: timestamp("completed_at"),
    color: text("color").default("#3b82f6"),
    icon: text("icon"),
    progress: integer("progress").default(0),
    parentGoalId: uuid("parent_goal_id"),
    sortOrder: integer("sort_order").default(0),
    archived: boolean("archived").default(false),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updated_at")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (t) => [
    index("goal_user_id_idx").on(t.userId),
    index("goal_status_idx").on(t.status),
  ],
);

// Projects (sits between Goals and Tasks in hierarchy)
export const project = pgTable(
  "aether_project",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    goalId: uuid("goal_id")
      .notNull()
      .references(() => goal.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    color: text("color").default("#3b82f6"),
    icon: text("icon"),
    sortOrder: integer("sort_order").default(0),
    archived: boolean("archived").default(false),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updated_at")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (t) => [
    index("project_user_id_idx").on(t.userId),
    index("project_goal_id_idx").on(t.goalId),
  ],
);

// Tasks
export const task = pgTable(
  "aether_task",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    // Legacy board reference - deprecated, use projectId instead
    boardId: uuid("board_id").references(() => board.id, {
      onDelete: "set null",
    }),
    // New hierarchy: Task belongs to Project (which belongs to Goal)
    projectId: uuid("project_id").references(() => project.id, {
      onDelete: "set null",
    }),
    // Direct goal reference kept for backwards compatibility
    goalId: uuid("goal_id").references(() => goal.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    description: text("description"),
    priority: taskPriorityEnum("priority").default("medium").notNull(),
    status: taskStatusEnum("status").default("todo").notNull(),
    dueDate: timestamp("due_date"),
    scheduledStart: timestamp("scheduled_start"),
    scheduledEnd: timestamp("scheduled_end"),
    estimatedMinutes: integer("estimated_minutes"),
    actualMinutes: integer("actual_minutes"),
    completedAt: timestamp("completed_at"),
    isRecurring: boolean("is_recurring").default(false),
    recurrenceRule: text("recurrence_rule"), // RRULE format
    parentTaskId: uuid("parent_task_id"),
    sortOrder: integer("sort_order").default(0),
    // "Next Up" task sequencing - lower number = higher priority in queue
    nextUpOrder: integer("next_up_order"),
    // Habit tracking - if set, this task is part of a habit
    habitName: text("habit_name"),
    tags: text("tags").array(),
    archived: boolean("archived").default(false),
    // Google Calendar sync
    googleEventId: text("google_event_id"),
    googleCalendarId: text("google_calendar_id"),
    // Google Tasks sync
    googleTasksId: text("google_tasks_id"),
    googleTasksListId: text("google_tasks_list_id"),
    lastSyncedAt: timestamp("last_synced_at"),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updated_at")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (t) => [
    index("task_user_id_idx").on(t.userId),
    index("task_board_id_idx").on(t.boardId),
    index("task_project_id_idx").on(t.projectId),
    index("task_goal_id_idx").on(t.goalId),
    index("task_status_idx").on(t.status),
    index("task_due_date_idx").on(t.dueDate),
    index("task_scheduled_idx").on(t.scheduledStart, t.scheduledEnd),
    index("task_next_up_idx").on(t.projectId, t.nextUpOrder),
  ],
);

// Time Blocks (for calendar view)
export const timeBlock = pgTable(
  "aether_time_block",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    taskId: uuid("task_id").references(() => task.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    startTime: timestamp("start_time").notNull(),
    endTime: timestamp("end_time").notNull(),
    color: text("color"),
    isCompleted: boolean("is_completed").default(false),
    notes: text("notes"),
    // Google Calendar integration
    googleCalendarEventId: text("google_calendar_event_id"),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updated_at")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (t) => [
    index("time_block_user_id_idx").on(t.userId),
    index("time_block_task_id_idx").on(t.taskId),
    index("time_block_time_idx").on(t.startTime, t.endTime),
    index("time_block_google_event_idx").on(t.googleCalendarEventId),
  ],
);

// Completed Task History (preserves record of all completions)
export const completedTask = pgTable(
  "aether_completed_task",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    taskId: uuid("task_id")
      .notNull()
      .references(() => task.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    projectId: uuid("project_id").references(() => project.id, {
      onDelete: "set null",
    }),
    goalId: uuid("goal_id").references(() => goal.id, { onDelete: "set null" }),
    // Snapshot of task data at completion time
    taskTitle: text("task_title").notNull(),
    taskPriority: taskPriorityEnum("task_priority"),
    completedAt: timestamp("completed_at")
      .$defaultFn(() => new Date())
      .notNull(),
    timeSpentMinutes: integer("time_spent_minutes"),
    notes: text("notes"),
  },
  (t) => [
    index("completed_task_user_id_idx").on(t.userId),
    index("completed_task_completed_at_idx").on(t.completedAt),
    index("completed_task_project_id_idx").on(t.projectId),
  ],
);

// Habit Streaks (tracks recurring habits with history preserved even when broken)
export const habitStreak = pgTable(
  "aether_habit_streak",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    habitName: text("habit_name").notNull(),
    currentStreakDays: integer("current_streak_days").default(0).notNull(),
    bestStreakDays: integer("best_streak_days").default(0).notNull(),
    lastCompletedDate: timestamp("last_completed_date"),
    // JSON array of {date: string, completed: boolean} for history visualization
    streakHistory: jsonb("streak_history").default([]),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updated_at")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (t) => [
    index("habit_streak_user_id_idx").on(t.userId),
    index("habit_streak_name_idx").on(t.userId, t.habitName),
  ],
);

// Google Integration (OAuth tokens for Calendar and Tasks API)
export const googleIntegration = pgTable(
  "aether_google_integration",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .unique()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token").notNull(),
    refreshToken: text("refresh_token").notNull(),
    tokenExpiresAt: timestamp("token_expires_at").notNull(),
    // Google Calendar settings
    calendarId: text("calendar_id"), // Primary calendar ID
    calendarEnabled: boolean("calendar_enabled").default(true),
    // Google Tasks settings
    tasksListId: text("tasks_list_id"), // Default tasks list ID
    tasksEnabled: boolean("tasks_enabled").default(true),
    // Sync settings
    lastCalendarSyncAt: timestamp("last_calendar_sync_at"),
    lastTasksSyncAt: timestamp("last_tasks_sync_at"),
    connectedAt: timestamp("connected_at")
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updated_at")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (t) => [index("google_integration_user_id_idx").on(t.userId)],
);

// Sync Log (tracks all sync operations for debugging and status)
export const syncLog = pgTable(
  "aether_sync_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    syncType: syncTypeEnum("sync_type").notNull(),
    googleResourceId: text("google_resource_id"),
    appResourceId: text("app_resource_id"),
    appResourceType: text("app_resource_type"), // 'task', 'event'
    status: syncStatusEnum("status").default("pending").notNull(),
    errorMessage: text("error_message"),
    syncedAt: timestamp("synced_at")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (t) => [
    index("sync_log_user_id_idx").on(t.userId),
    index("sync_log_google_resource_idx").on(t.googleResourceId),
    index("sync_log_app_resource_idx").on(t.appResourceId),
  ],
);

// User Preferences (settings)
export const userPreferences = pgTable("aether_user_preferences", {
  id: text("id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),

  // Display settings
  theme: text("theme").default("system"),
  language: text("language").default("en"),
  dateFormat: text("date_format").default("MM/DD/YYYY"),
  timeFormat: text("time_format").default("12h"),
  weekStartsOn: integer("week_starts_on").default(0), // 0 = Sunday
  showCompletedTasks: boolean("show_completed_tasks").default(false),
  taskSortBy: text("task_sort_by").default("priority"),
  taskSortOrder: text("task_sort_order").default("asc"),
  calendarDefaultView: text("calendar_default_view").default("3-day"),
  boardDefaultView: text("board_default_view").default("compact"),

  // Google Calendar integration
  googleCalendarEnabled: boolean("google_calendar_enabled").default(false),
  googleCalendarSelectedId: text("google_calendar_selected_id"),
  googleCalendarAutoSync: boolean("google_calendar_auto_sync").default(false),

  // AI Scheduling settings
  autoScheduleEnabled: boolean("auto_schedule_enabled").default(true),
  workingHoursStart: text("working_hours_start").default("09:00"),
  workingHoursEnd: text("working_hours_end").default("17:00"),
  workingDays: jsonb("working_days").default([1, 2, 3, 4, 5]), // Mon-Fri
  bufferTimeBetweenTasks: integer("buffer_time_between_tasks").default(15),
  maxTaskChunkSize: integer("max_task_chunk_size").default(120),
  minTaskChunkSize: integer("min_task_chunk_size").default(30),
  schedulingLookaheadDays: integer("scheduling_lookahead_days").default(14),
  maxDailyWorkHours: numeric("max_daily_work_hours").default("8.0"),
  focusTimeMinimumMinutes: integer("focus_time_minimum_minutes").default(90),

  // Onboarding
  hasCompletedOnboarding: boolean("has_completed_onboarding").default(false),
  onboardingData: jsonb("onboarding_data"),

  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => new Date())
    .notNull(),
});

// Subscriptions (Stripe)
export const subscription = pgTable(
  "aether_subscription",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .unique()
      .references(() => user.id, { onDelete: "cascade" }),
    stripeCustomerId: text("stripe_customer_id").notNull().unique(),
    stripeSubscriptionId: text("stripe_subscription_id").unique(),
    stripePriceId: text("stripe_price_id"),
    status: subscriptionStatusEnum("status").default("incomplete").notNull(),
    currentPeriodStart: timestamp("current_period_start"),
    currentPeriodEnd: timestamp("current_period_end"),
    cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updated_at")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (t) => [
    index("subscription_user_id_idx").on(t.userId),
    index("subscription_stripe_customer_idx").on(t.stripeCustomerId),
  ],
);

// ============================================================================
// RELATIONS
// ============================================================================

export const userRelations = relations(user, ({ many, one }) => ({
  accounts: many(account),
  sessions: many(session),
  boards: many(board),
  goals: many(goal),
  projects: many(project),
  tasks: many(task),
  timeBlocks: many(timeBlock),
  completedTasks: many(completedTask),
  habitStreaks: many(habitStreak),
  googleIntegration: one(googleIntegration, {
    fields: [user.id],
    references: [googleIntegration.userId],
  }),
  preferences: one(userPreferences, {
    fields: [user.id],
    references: [userPreferences.id],
  }),
  subscription: one(subscription, {
    fields: [user.id],
    references: [subscription.userId],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, { fields: [account.userId], references: [user.id] }),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, { fields: [session.userId], references: [user.id] }),
}));

export const boardRelations = relations(board, ({ one, many }) => ({
  user: one(user, { fields: [board.userId], references: [user.id] }),
  tasks: many(task),
}));

export const goalRelations = relations(goal, ({ one, many }) => ({
  user: one(user, { fields: [goal.userId], references: [user.id] }),
  projects: many(project),
  tasks: many(task),
  parentGoal: one(goal, {
    fields: [goal.parentGoalId],
    references: [goal.id],
    relationName: "goalHierarchy",
  }),
  childGoals: many(goal, { relationName: "goalHierarchy" }),
}));

export const projectRelations = relations(project, ({ one, many }) => ({
  user: one(user, { fields: [project.userId], references: [user.id] }),
  goal: one(goal, { fields: [project.goalId], references: [goal.id] }),
  tasks: many(task),
  completedTasks: many(completedTask),
}));

export const taskRelations = relations(task, ({ one, many }) => ({
  user: one(user, { fields: [task.userId], references: [user.id] }),
  board: one(board, { fields: [task.boardId], references: [board.id] }),
  project: one(project, { fields: [task.projectId], references: [project.id] }),
  goal: one(goal, { fields: [task.goalId], references: [goal.id] }),
  parentTask: one(task, {
    fields: [task.parentTaskId],
    references: [task.id],
    relationName: "taskHierarchy",
  }),
  subtasks: many(task, { relationName: "taskHierarchy" }),
  timeBlocks: many(timeBlock),
  completedRecords: many(completedTask),
}));

export const timeBlockRelations = relations(timeBlock, ({ one }) => ({
  user: one(user, { fields: [timeBlock.userId], references: [user.id] }),
  task: one(task, { fields: [timeBlock.taskId], references: [task.id] }),
}));

export const completedTaskRelations = relations(completedTask, ({ one }) => ({
  user: one(user, { fields: [completedTask.userId], references: [user.id] }),
  task: one(task, { fields: [completedTask.taskId], references: [task.id] }),
  project: one(project, {
    fields: [completedTask.projectId],
    references: [project.id],
  }),
  goal: one(goal, { fields: [completedTask.goalId], references: [goal.id] }),
}));

export const habitStreakRelations = relations(habitStreak, ({ one }) => ({
  user: one(user, { fields: [habitStreak.userId], references: [user.id] }),
}));

export const googleIntegrationRelations = relations(
  googleIntegration,
  ({ one }) => ({
    user: one(user, {
      fields: [googleIntegration.userId],
      references: [user.id],
    }),
  }),
);

export const subscriptionRelations = relations(subscription, ({ one }) => ({
  user: one(user, { fields: [subscription.userId], references: [user.id] }),
}));

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;

export type Board = typeof board.$inferSelect;
export type NewBoard = typeof board.$inferInsert;

export type Goal = typeof goal.$inferSelect;
export type NewGoal = typeof goal.$inferInsert;

export type Project = typeof project.$inferSelect;
export type NewProject = typeof project.$inferInsert;

export type Task = typeof task.$inferSelect;
export type NewTask = typeof task.$inferInsert;

export type TimeBlock = typeof timeBlock.$inferSelect;
export type NewTimeBlock = typeof timeBlock.$inferInsert;

export type CompletedTask = typeof completedTask.$inferSelect;
export type NewCompletedTask = typeof completedTask.$inferInsert;

export type HabitStreak = typeof habitStreak.$inferSelect;
export type NewHabitStreak = typeof habitStreak.$inferInsert;

export type GoogleIntegration = typeof googleIntegration.$inferSelect;
export type NewGoogleIntegration = typeof googleIntegration.$inferInsert;

export type SyncLog = typeof syncLog.$inferSelect;
export type NewSyncLog = typeof syncLog.$inferInsert;

export type UserPreferences = typeof userPreferences.$inferSelect;
export type NewUserPreferences = typeof userPreferences.$inferInsert;

export type Subscription = typeof subscription.$inferSelect;
export type NewSubscription = typeof subscription.$inferInsert;
