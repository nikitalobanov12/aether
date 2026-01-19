import { getSession } from "~/server/better-auth/server";
import { AuthForm } from "~/components/auth/auth-form";
import { Dashboard } from "~/components/dashboard/dashboard";
import { Sidebar, TopBar } from "~/components/layout/sidebar";
import { HydrateClient } from "~/trpc/server";

export default async function Home() {
  const session = await getSession();

  if (!session) {
    return <AuthForm />;
  }

  const user = {
    name: session.user.name,
    email: session.user.email,
    image: session.user.image,
  };

  return (
    <HydrateClient>
      <div className="bg-muted/30 flex h-screen overflow-hidden">
        <Sidebar user={user} />
        <div className="flex flex-1 flex-col overflow-hidden">
          <TopBar user={user} />
          <main className="flex-1 overflow-auto p-4 md:p-6">
            <Dashboard />
          </main>
        </div>
      </div>
    </HydrateClient>
  );
}
