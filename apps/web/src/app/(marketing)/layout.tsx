import { redirect } from "next/navigation";
import { getSession } from "~/server/better-auth/server";

interface MarketingLayoutProps {
  children: React.ReactNode;
}

export default async function MarketingLayout({
  children,
}: MarketingLayoutProps) {
  const session = await getSession();

  // Redirect authenticated users to the app
  if (session) {
    redirect("/today");
  }

  return <>{children}</>;
}
