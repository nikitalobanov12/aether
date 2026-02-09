import { addDays, subDays, setHours, setMinutes, startOfDay } from "date-fns";

import { db } from "~/server/db";
import {
  goal,
  project,
  task,
  timeBlock,
  completedTask,
  userPreferences,
} from "~/server/db/schema";

/**
 * Seeds a demo user account with realistic productivity data.
 * All dates are relative to "today" so the demo always looks fresh.
 */
export async function seedDemoData(userId: string) {
  const now = new Date();
  const today = startOfDay(now);

  // ---------------------------------------------------------------------------
  // User Preferences
  // ---------------------------------------------------------------------------
  await db.insert(userPreferences).values({
    id: userId,
    theme: "dark",
    dateFormat: "MM/DD/YYYY",
    timeFormat: "12h",
    weekStartsOn: 1,
    autoScheduleEnabled: true,
    workingHoursStart: "09:00",
    workingHoursEnd: "17:00",
    workingDays: [1, 2, 3, 4, 5],
    hasCompletedOnboarding: true,
  });

  // ---------------------------------------------------------------------------
  // Goal 1: Launch Side Project (65% progress)
  // ---------------------------------------------------------------------------
  const [goalSideProject] = await db
    .insert(goal)
    .values({
      userId,
      title: "Launch Side Project",
      description:
        "Ship an MVP of my full-stack side project to production with landing page, auth, and core features.",
      status: "in_progress",
      progress: 65,
      color: "#3b82f6",
      icon: "Rocket",
      targetDate: addDays(today, 21),
      sortOrder: 0,
    })
    .returning({ id: goal.id });

  // Project: Backend API
  const [projectBackend] = await db
    .insert(project)
    .values({
      userId,
      goalId: goalSideProject!.id,
      title: "Backend API",
      description: "REST API with authentication and core resource endpoints",
      color: "#8b5cf6",
      icon: "Server",
      sortOrder: 0,
    })
    .returning({ id: project.id });

  // Project: Landing Page
  const [projectLanding] = await db
    .insert(project)
    .values({
      userId,
      goalId: goalSideProject!.id,
      title: "Landing Page",
      description:
        "Marketing landing page with hero, features, and contact form",
      color: "#06b6d4",
      icon: "Globe",
      sortOrder: 1,
    })
    .returning({ id: project.id });

  // Backend API tasks
  const backendTasks = await db
    .insert(task)
    .values([
      {
        userId,
        projectId: projectBackend!.id,
        goalId: goalSideProject!.id,
        title: "Set up Express server + TypeScript config",
        description:
          "Initialize Node.js project with Express, TypeScript, and ESLint. Configure tsconfig and build scripts.",
        priority: "high" as const,
        status: "completed" as const,
        completedAt: subDays(now, 12),
        estimatedMinutes: 45,
        actualMinutes: 40,
        sortOrder: 0,
      },
      {
        userId,
        projectId: projectBackend!.id,
        goalId: goalSideProject!.id,
        title: "Design database schema and migrations",
        description:
          "Define PostgreSQL schema with Drizzle ORM. Create tables for users, resources, and relationships. Write migration files.",
        priority: "high" as const,
        status: "completed" as const,
        completedAt: subDays(now, 9),
        estimatedMinutes: 90,
        actualMinutes: 110,
        sortOrder: 1,
      },
      {
        userId,
        projectId: projectBackend!.id,
        goalId: goalSideProject!.id,
        title: "Implement auth with JWT",
        description:
          "Add user registration, login, and JWT token verification middleware. Include refresh token rotation.",
        priority: "high" as const,
        status: "completed" as const,
        completedAt: subDays(now, 5),
        estimatedMinutes: 120,
        actualMinutes: 150,
        sortOrder: 2,
      },
      {
        userId,
        projectId: projectBackend!.id,
        goalId: goalSideProject!.id,
        title: "Build REST endpoints for core resources",
        description:
          "Create CRUD endpoints for projects, tasks, and user settings. Add input validation with Zod and proper error handling.",
        priority: "high" as const,
        status: "in_progress" as const,
        dueDate: addDays(today, 0), // Due today
        scheduledStart: setMinutes(setHours(today, 9), 0),
        scheduledEnd: setMinutes(setHours(today, 10), 30),
        estimatedMinutes: 180,
        sortOrder: 3,
      },
    ])
    .returning({ id: task.id, title: task.title, priority: task.priority });

  // Landing Page tasks
  const landingTasks = await db
    .insert(task)
    .values([
      {
        userId,
        projectId: projectLanding!.id,
        goalId: goalSideProject!.id,
        title: "Design hero section and feature cards",
        description:
          "Create responsive hero with gradient background, animated CTA, and 3 feature cards with icons.",
        priority: "medium" as const,
        status: "completed" as const,
        completedAt: subDays(now, 3),
        estimatedMinutes: 90,
        actualMinutes: 75,
        sortOrder: 0,
      },
      {
        userId,
        projectId: projectLanding!.id,
        goalId: goalSideProject!.id,
        title: "Build responsive layout with Tailwind",
        description:
          "Implement mobile-first layout using Tailwind CSS. Add dark mode support and smooth scroll behavior.",
        priority: "medium" as const,
        status: "todo" as const,
        dueDate: addDays(today, 1),
        estimatedMinutes: 120,
        sortOrder: 1,
      },
      {
        userId,
        projectId: projectLanding!.id,
        goalId: goalSideProject!.id,
        title: "Add contact form with email integration",
        description:
          "Build a form component with validation. Connect to Resend for transactional emails.",
        priority: "low" as const,
        status: "todo" as const,
        dueDate: addDays(today, 3),
        estimatedMinutes: 60,
        sortOrder: 2,
      },
    ])
    .returning({ id: task.id, title: task.title, priority: task.priority });

  // ---------------------------------------------------------------------------
  // Goal 2: Level Up Skills (40% progress)
  // ---------------------------------------------------------------------------
  const [goalSkills] = await db
    .insert(goal)
    .values({
      userId,
      title: "Level Up Skills",
      description:
        "Invest in learning new technologies and deepening system design knowledge to grow as an engineer.",
      status: "in_progress",
      progress: 40,
      color: "#f59e0b",
      icon: "GraduationCap",
      targetDate: addDays(today, 60),
      sortOrder: 1,
    })
    .returning({ id: goal.id });

  // Project: Learn Rust
  const [projectRust] = await db
    .insert(project)
    .values({
      userId,
      goalId: goalSkills!.id,
      title: "Learn Rust",
      description:
        "Go from Rust basics to building real CLI tools and contributing to open source",
      color: "#ef4444",
      icon: "Code",
      sortOrder: 0,
    })
    .returning({ id: project.id });

  // Project: System Design
  const [projectSysDesign] = await db
    .insert(project)
    .values({
      userId,
      goalId: goalSkills!.id,
      title: "System Design",
      description:
        "Study distributed systems fundamentals and practice interview-style problems",
      color: "#10b981",
      icon: "Network",
      sortOrder: 1,
    })
    .returning({ id: project.id });

  // Rust tasks
  const rustTasks = await db
    .insert(task)
    .values([
      {
        userId,
        projectId: projectRust!.id,
        goalId: goalSkills!.id,
        title: "Complete Rustlings exercises",
        description:
          "Work through all Rustlings exercises covering ownership, borrowing, lifetimes, traits, and error handling.",
        priority: "medium" as const,
        status: "completed" as const,
        completedAt: subDays(now, 7),
        estimatedMinutes: 300,
        actualMinutes: 360,
        sortOrder: 0,
      },
      {
        userId,
        projectId: projectRust!.id,
        goalId: goalSkills!.id,
        title: "Build a CLI tool for file processing",
        description:
          "Create a Rust CLI using clap that processes CSV files, filters rows, and outputs JSON. Practice error handling and file I/O.",
        priority: "medium" as const,
        status: "in_progress" as const,
        scheduledStart: setMinutes(setHours(today, 11), 0),
        scheduledEnd: setMinutes(setHours(today, 12), 0),
        estimatedMinutes: 240,
        sortOrder: 1,
      },
      {
        userId,
        projectId: projectRust!.id,
        goalId: goalSkills!.id,
        title: "Contribute to an open source Rust project",
        description:
          'Find a beginner-friendly Rust project on GitHub. Look for "good first issue" labels. Submit at least one PR.',
        priority: "high" as const,
        status: "todo" as const,
        dueDate: addDays(today, 14),
        estimatedMinutes: 180,
        sortOrder: 2,
      },
    ])
    .returning({ id: task.id, title: task.title, priority: task.priority });

  // System Design tasks
  const sysDesignTasks = await db
    .insert(task)
    .values([
      {
        userId,
        projectId: projectSysDesign!.id,
        goalId: goalSkills!.id,
        title: 'Read "Designing Data-Intensive Applications"',
        description:
          "Work through DDIA chapters on data models, storage engines, replication, partitioning, and distributed transactions.",
        priority: "medium" as const,
        status: "completed" as const,
        completedAt: subDays(now, 2),
        estimatedMinutes: 600,
        actualMinutes: 720,
        sortOrder: 0,
      },
      {
        userId,
        projectId: projectSysDesign!.id,
        goalId: goalSkills!.id,
        title: "Practice distributed systems problems",
        description:
          "Work through 5 system design problems: URL shortener, message queue, rate limiter, notification system, and search autocomplete.",
        priority: "medium" as const,
        status: "todo" as const,
        dueDate: addDays(today, 10),
        estimatedMinutes: 300,
        sortOrder: 1,
      },
    ])
    .returning({ id: task.id, title: task.title, priority: task.priority });

  // ---------------------------------------------------------------------------
  // Goal 3: Job Search Prep (not started, 0%)
  // ---------------------------------------------------------------------------
  const [goalJobSearch] = await db
    .insert(goal)
    .values({
      userId,
      title: "Job Search Prep",
      description:
        "Prepare portfolio, resume, and practice for technical interviews.",
      status: "not_started",
      progress: 0,
      color: "#ec4899",
      icon: "Briefcase",
      targetDate: addDays(today, 30),
      sortOrder: 2,
    })
    .returning({ id: goal.id });

  // Project: Portfolio
  const [projectPortfolio] = await db
    .insert(project)
    .values({
      userId,
      goalId: goalJobSearch!.id,
      title: "Portfolio",
      description:
        "Update portfolio site and write compelling project case studies",
      color: "#a855f7",
      icon: "Layout",
      sortOrder: 0,
    })
    .returning({ id: project.id });

  // Portfolio tasks
  await db.insert(task).values([
    {
      userId,
      projectId: projectPortfolio!.id,
      goalId: goalJobSearch!.id,
      title: "Update portfolio site with recent projects",
      description:
        "Add Aether and 2 other recent projects to the portfolio. Include live demos, GitHub links, and tech stack breakdowns.",
      priority: "high" as const,
      status: "todo" as const,
      dueDate: addDays(today, 5),
      estimatedMinutes: 180,
      sortOrder: 0,
    },
    {
      userId,
      projectId: projectPortfolio!.id,
      goalId: goalJobSearch!.id,
      title: "Write case studies for top 3 projects",
      description:
        "For each project: problem statement, technical decisions, architecture diagram, challenges faced, and outcomes/metrics.",
      priority: "medium" as const,
      status: "todo" as const,
      dueDate: addDays(today, 10),
      estimatedMinutes: 240,
      sortOrder: 1,
    },
  ]);

  // ---------------------------------------------------------------------------
  // Time Blocks for today
  // ---------------------------------------------------------------------------
  await db.insert(timeBlock).values([
    {
      userId,
      taskId: backendTasks[3]!.id, // "Build REST endpoints"
      title: "Deep work: API endpoints",
      startTime: setMinutes(setHours(today, 9), 0),
      endTime: setMinutes(setHours(today, 10), 30),
      color: "#8b5cf6",
    },
    {
      userId,
      taskId: rustTasks[1]!.id, // "Build a CLI tool"
      title: "Rust CLI tool",
      startTime: setMinutes(setHours(today, 11), 0),
      endTime: setMinutes(setHours(today, 12), 0),
      color: "#ef4444",
    },
    {
      userId,
      title: "Landing page design",
      startTime: setMinutes(setHours(today, 14), 0),
      endTime: setMinutes(setHours(today, 15), 0),
      color: "#06b6d4",
    },
    {
      userId,
      title: "Lunch break",
      startTime: setMinutes(setHours(today, 12), 30),
      endTime: setMinutes(setHours(today, 13), 30),
      color: "#6b7280",
      isCompleted: false,
    },
  ]);

  // ---------------------------------------------------------------------------
  // Completed Task History (populates insights page)
  // ---------------------------------------------------------------------------
  // Build history entries from the tasks we know are completed
  const completedTaskEntries = [
    // Backend tasks completed
    {
      taskId: backendTasks[0]!.id,
      userId,
      projectId: projectBackend!.id,
      goalId: goalSideProject!.id,
      taskTitle: backendTasks[0]!.title,
      taskPriority: backendTasks[0]!.priority,
      completedAt: subDays(now, 12),
      timeSpentMinutes: 40,
    },
    {
      taskId: backendTasks[1]!.id,
      userId,
      projectId: projectBackend!.id,
      goalId: goalSideProject!.id,
      taskTitle: backendTasks[1]!.title,
      taskPriority: backendTasks[1]!.priority,
      completedAt: subDays(now, 9),
      timeSpentMinutes: 110,
    },
    {
      taskId: backendTasks[2]!.id,
      userId,
      projectId: projectBackend!.id,
      goalId: goalSideProject!.id,
      taskTitle: backendTasks[2]!.title,
      taskPriority: backendTasks[2]!.priority,
      completedAt: subDays(now, 5),
      timeSpentMinutes: 150,
    },
    // Landing page completed
    {
      taskId: landingTasks[0]!.id,
      userId,
      projectId: projectLanding!.id,
      goalId: goalSideProject!.id,
      taskTitle: landingTasks[0]!.title,
      taskPriority: landingTasks[0]!.priority,
      completedAt: subDays(now, 3),
      timeSpentMinutes: 75,
    },
    // Rust completed
    {
      taskId: rustTasks[0]!.id,
      userId,
      projectId: projectRust!.id,
      goalId: goalSkills!.id,
      taskTitle: rustTasks[0]!.title,
      taskPriority: rustTasks[0]!.priority,
      completedAt: subDays(now, 7),
      timeSpentMinutes: 360,
    },
    // System design completed
    {
      taskId: sysDesignTasks[0]!.id,
      userId,
      projectId: projectSysDesign!.id,
      goalId: goalSkills!.id,
      taskTitle: sysDesignTasks[0]!.title,
      taskPriority: sysDesignTasks[0]!.priority,
      completedAt: subDays(now, 2),
      timeSpentMinutes: 720,
    },
  ];

  await db.insert(completedTask).values(completedTaskEntries);
}
