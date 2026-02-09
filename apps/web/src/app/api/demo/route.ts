import { NextResponse } from "next/server";
import { auth } from "~/server/better-auth";
import { seedDemoData } from "~/server/demo/seed-data";

/**
 * POST /api/demo
 *
 * Creates a temporary demo user with pre-seeded data and returns
 * session cookies so the client auto-redirects to the dashboard.
 *
 * Demo users are identified by email pattern: demo-{uuid}@demo.aether.app
 */
export async function POST() {
  try {
    const demoId = crypto.randomUUID();
    const demoEmail = `demo-${demoId}@demo.aether.app`;
    const demoPassword = `Demo!${crypto.randomUUID()}`;

    // Create the demo user via Better Auth's server API
    const signUpResponse = await auth.api.signUpEmail({
      body: {
        name: "Demo User",
        email: demoEmail,
        password: demoPassword,
      },
    });

    if (!signUpResponse?.user) {
      return NextResponse.json(
        { error: "Failed to create demo account" },
        { status: 500 },
      );
    }

    // Seed realistic demo data for this user
    await seedDemoData(signUpResponse.user.id);

    // Sign in to get session cookies
    const signInResponse = await auth.api.signInEmail({
      body: {
        email: demoEmail,
        password: demoPassword,
      },
      // We need to return raw response to get Set-Cookie headers
      asResponse: true,
    });

    // Forward the auth cookies from Better Auth's response to the client
    const response = NextResponse.json({ success: true });

    // Copy all Set-Cookie headers from the sign-in response
    const setCookieHeaders = signInResponse.headers.getSetCookie();
    for (const cookie of setCookieHeaders) {
      response.headers.append("Set-Cookie", cookie);
    }

    return response;
  } catch (error) {
    console.error("[Demo] Failed to create demo session:", error);
    return NextResponse.json(
      { error: "Failed to create demo session" },
      { status: 500 },
    );
  }
}
