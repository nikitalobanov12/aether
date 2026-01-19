import { api, HydrateClient } from "~/trpc/server";
import { GoalsList } from "./goals-list";

export default async function GoalsPage() {
  void api.goal.getAll.prefetch({ includeCompleted: false });

  return (
    <HydrateClient>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Goals</h1>
            <p className="text-muted-foreground">
              Set and track your objectives
            </p>
          </div>
        </div>

        {/* Goals List */}
        <GoalsList />
      </div>
    </HydrateClient>
  );
}
