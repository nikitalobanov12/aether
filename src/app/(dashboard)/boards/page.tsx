import { api, HydrateClient } from "~/trpc/server";
import { BoardsList } from "./boards-list";

export default async function BoardsPage() {
  // Prefetch boards
  void api.board.getAll.prefetch();

  return (
    <HydrateClient>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Boards</h1>
            <p className="text-muted-foreground">
              Organize your tasks with Kanban boards
            </p>
          </div>
        </div>

        {/* Boards List */}
        <BoardsList />
      </div>
    </HydrateClient>
  );
}
