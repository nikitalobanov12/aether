import { redirect } from "next/navigation";

import { AuthForm } from "~/components/auth/auth-form";
import { getSession } from "~/server/better-auth/server";

export default async function HomePage() {
  const session = await getSession();

  if (session) {
    redirect("/today");
  }

  return <AuthForm />;
}
