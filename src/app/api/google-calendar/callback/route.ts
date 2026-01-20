import { NextResponse } from "next/server";
import { google } from "googleapis";
import { eq } from "drizzle-orm";

import { env } from "~/env";
import { db } from "~/server/db";
import { googleIntegration } from "~/server/db/schema";
import { auth } from "~/server/better-auth";

function getOAuth2Client() {
  return new google.auth.OAuth2(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    `${env.BETTER_AUTH_URL ?? "http://localhost:3000"}/api/google-calendar/callback`,
  );
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  // Handle OAuth errors
  if (error) {
    console.error("Google Calendar OAuth error:", error);
    return NextResponse.redirect(
      new URL("/settings?error=google_auth_failed", request.url),
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL("/settings?error=missing_code", request.url),
    );
  }

  // Get the current user session
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session?.user?.id) {
    return NextResponse.redirect(
      new URL("/settings?error=not_authenticated", request.url),
    );
  }

  const userId = session.user.id;

  try {
    const oauth2Client = getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);

    // Get the primary calendar ID
    oauth2Client.setCredentials(tokens);
    const calendar = google.calendar({ version: "v3", auth: oauth2Client });
    const calendarList = await calendar.calendarList.list();
    const primaryCalendar = calendarList.data.items?.find((cal) => cal.primary);

    // Get the default tasks list
    const tasks = google.tasks({ version: "v1", auth: oauth2Client });
    const taskLists = await tasks.tasklists.list();
    const defaultTaskList = taskLists.data.items?.[0];

    // Store or update integration
    const existing = await db.query.googleIntegration.findFirst({
      where: eq(googleIntegration.userId, userId),
    });

    const integrationData = {
      accessToken: tokens.access_token!,
      refreshToken: tokens.refresh_token!,
      tokenExpiresAt: new Date(tokens.expiry_date!),
      calendarId: primaryCalendar?.id ?? null,
      tasksListId: defaultTaskList?.id ?? null,
      updatedAt: new Date(),
    };

    if (existing) {
      await db
        .update(googleIntegration)
        .set(integrationData)
        .where(eq(googleIntegration.userId, userId));
    } else {
      await db.insert(googleIntegration).values({
        userId,
        ...integrationData,
        connectedAt: new Date(),
      });
    }

    // Redirect back to settings with success
    return NextResponse.redirect(
      new URL("/settings?tab=integrations&google_connected=true", request.url),
    );
  } catch (error) {
    console.error("Google Calendar OAuth token exchange error:", error);
    return NextResponse.redirect(
      new URL("/settings?error=token_exchange_failed", request.url),
    );
  }
}
