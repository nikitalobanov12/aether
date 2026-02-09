import { redirect } from "next/navigation";
import { api, HydrateClient } from "~/trpc/server";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  const preferences = await api.userPreferences.get();

  if (!preferences) {
    // Should not happen as get() creates defaults, but handle edge case
    redirect("/");
  }

  return (
    <HydrateClient>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Manage your preferences and scheduling settings.
          </p>
        </div>

        <SettingsForm initialPreferences={preferences} />
      </div>
    </HydrateClient>
  );
}
