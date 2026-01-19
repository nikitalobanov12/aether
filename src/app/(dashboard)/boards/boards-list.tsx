"use client";

import { useState } from "react";
import { Plus, MoreHorizontal, Kanban, ChevronRight } from "lucide-react";

import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { ScrollArea } from "~/components/ui/scroll-area";
import { KanbanBoard } from "~/components/boards/kanban-board";
import type { Board } from "~/server/db/schema";

export function BoardsList() {
  const [selectedBoard, setSelectedBoard] = useState<Board | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [newBoardName, setNewBoardName] = useState("");
  const [newBoardDescription, setNewBoardDescription] = useState("");

  const utils = api.useUtils();

  const { data: boards = [], isLoading } = api.board.getAll.useQuery();

  const createBoard = api.board.create.useMutation({
    onSuccess: (newBoard) => {
      void utils.board.getAll.invalidate();
      setCreateOpen(false);
      setNewBoardName("");
      setNewBoardDescription("");
      setSelectedBoard(newBoard!);
    },
  });

  const deleteBoard = api.board.delete.useMutation({
    onSuccess: () => {
      void utils.board.getAll.invalidate();
      if (selectedBoard) {
        setSelectedBoard(null);
      }
    },
  });

  const handleCreateBoard = () => {
    if (!newBoardName.trim()) return;
    createBoard.mutate({
      name: newBoardName.trim(),
      description: newBoardDescription.trim() || undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading boards...</div>
      </div>
    );
  }

  // If a board is selected, show the Kanban view
  if (selectedBoard) {
    return (
      <div className="flex h-[calc(100vh-12rem)] flex-col">
        {/* Board Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedBoard(null)}
            >
              Boards
            </Button>
            <ChevronRight className="text-muted-foreground h-4 w-4" />
            <h2 className="text-xl font-semibold">{selectedBoard.name}</h2>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Edit board</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => {
                  deleteBoard.mutate({ id: selectedBoard.id });
                }}
              >
                Delete board
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Kanban Board */}
        <ScrollArea className="flex-1">
          <KanbanBoard board={selectedBoard} />
        </ScrollArea>
      </div>
    );
  }

  // Board list view
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {/* Create Board Card */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogTrigger asChild>
          <Card className="hover:border-primary hover:bg-muted/50 flex cursor-pointer items-center justify-center border-dashed transition-colors">
            <CardContent className="flex flex-col items-center gap-2 py-8">
              <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-full">
                <Plus className="text-primary h-6 w-6" />
              </div>
              <p className="font-medium">Create Board</p>
            </CardContent>
          </Card>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Board</DialogTitle>
            <DialogDescription>
              Create a new board to organize your tasks
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Board Name</Label>
              <Input
                id="name"
                placeholder="e.g., Project Alpha"
                value={newBoardName}
                onChange={(e) => setNewBoardName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                placeholder="Describe this board..."
                value={newBoardDescription}
                onChange={(e) => setNewBoardDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateBoard}
              disabled={!newBoardName.trim() || createBoard.isPending}
            >
              {createBoard.isPending ? "Creating..." : "Create Board"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Existing Boards */}
      {boards.map((board) => (
        <Card
          key={board.id}
          className="hover:bg-muted/50 cursor-pointer transition-colors"
          onClick={() => setSelectedBoard(board)}
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-lg"
                style={{ backgroundColor: board.color ?? "#3b82f6" }}
              >
                <Kanban className="h-5 w-5 text-white" />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger
                  asChild
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                    Edit board
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteBoard.mutate({ id: board.id });
                    }}
                  >
                    Delete board
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <CardTitle className="mt-3">{board.name}</CardTitle>
            {board.description && (
              <CardDescription className="line-clamp-2">
                {board.description}
              </CardDescription>
            )}
          </CardHeader>
        </Card>
      ))}

      {boards.length === 0 && (
        <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
          <Kanban className="text-muted-foreground mb-4 h-12 w-12" />
          <h3 className="text-lg font-semibold">No boards yet</h3>
          <p className="text-muted-foreground">
            Create your first board to start organizing tasks
          </p>
        </div>
      )}
    </div>
  );
}
