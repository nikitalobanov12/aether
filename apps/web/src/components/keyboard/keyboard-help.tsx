"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";

interface KeyboardHelpProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const shortcuts = [
  {
    category: "Navigation",
    items: [
      { keys: ["j"], description: "Move down" },
      { keys: ["k"], description: "Move up" },
      { keys: ["g", "g"], description: "Go to first item" },
      { keys: ["G"], description: "Go to last item" },
      { keys: ["Esc"], description: "Clear selection" },
    ],
  },
  {
    category: "Actions",
    items: [
      { keys: ["Enter", "e"], description: "Edit selected task" },
      { keys: ["x"], description: "Complete selected task" },
      { keys: ["d"], description: "Delete selected task" },
      { keys: ["a"], description: "Add new task" },
    ],
  },
  {
    category: "Global",
    items: [
      { keys: ["g", "t"], description: "Go to Today" },
      { keys: ["g", "w"], description: "Go to This Week" },
      { keys: ["g", "i"], description: "Go to Insights" },
      { keys: ["?"], description: "Show this help" },
    ],
  },
];

export function KeyboardHelp({ open, onOpenChange }: KeyboardHelpProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {shortcuts.map((section) => (
            <div key={section.category}>
              <h3 className="text-muted-foreground mb-2 text-sm font-medium">
                {section.category}
              </h3>
              <div className="space-y-2">
                {section.items.map((item) => (
                  <div
                    key={item.description}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm">{item.description}</span>
                    <div className="flex items-center gap-1">
                      {item.keys.map((key, index) => (
                        <span key={index}>
                          <kbd className="bg-muted text-muted-foreground rounded px-2 py-1 font-mono text-xs">
                            {key}
                          </kbd>
                          {index < item.keys.length - 1 && (
                            <span className="text-muted-foreground mx-1 text-xs">
                              then
                            </span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
