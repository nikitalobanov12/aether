import { NextResponse } from "next/server";
import { lt, like, and } from "drizzle-orm";

import { db } from "~/server/db";
import { user } from "~/server/db/schema";

const DEMO_EMAIL_PATTERN = "demo-%@demo.aether.app";
const MAX_AGE_HOURS = 24;

/**
 * POST /api/demo/cleanup
 *
 * Deletes demo user accounts older than 24 hours.
 * All related data (goals, projects, tasks, etc.) is cascade-deleted
 * because the schema uses onDelete: "cascade" on the userId foreign keys.
 *
 * Secured via a CRON_SECRET header or can be called from a cron job service
 * (e.g., Vercel Cron, GitHub Actions).
 */
export async function POST(request: Request) {
  // Simple auth: check for a shared secret
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const cutoff = new Date(Date.now() - MAX_AGE_HOURS * 60 * 60 * 1000);

    const deletedUsers = await db
      .delete(user)
      .where(
        and(like(user.email, DEMO_EMAIL_PATTERN), lt(user.createdAt, cutoff)),
      )
      .returning({ id: user.id, email: user.email });

    return NextResponse.json({
      deleted: deletedUsers.length,
      users: deletedUsers,
    });
  } catch (error) {
    console.error("[Demo Cleanup] Failed:", error);
    return NextResponse.json({ error: "Cleanup failed" }, { status: 500 });
  }
}
