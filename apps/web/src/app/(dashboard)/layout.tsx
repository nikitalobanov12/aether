import { redirect } from "next/navigation";

import { getSession } from "~/server/better-auth/server";
import { Sidebar, TopBar } from "~/components/layout/sidebar";
import { KeyboardProvider } from "~/components/keyboard/keyboard-provider";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const user = {
    name: session.user.name,
    email: session.user.email,
    image: session.user.image,
  };

  return (
    <KeyboardProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar user={user} />
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* TopBar only shown on mobile */}
          <div className="md:hidden">
            <TopBar user={user} />
          </div>
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </div>
    </KeyboardProvider>
  );
}
