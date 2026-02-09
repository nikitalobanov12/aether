"use client";

import { useCallback, useEffect, useState } from "react";

export interface KeyboardNavigationOptions {
  /** List of item IDs in order */
  items: string[];
  /** Callback when selection changes */
  onSelect?: (id: string | null) => void;
  /** Callback when item is activated (Enter key) */
  onActivate?: (id: string) => void;
  /** Callback to mark item as complete (x key) */
  onComplete?: (id: string) => void;
  /** Callback to delete item (d key) */
  onDelete?: (id: string) => void;
  /** Callback to open add dialog (a key) */
  onAdd?: () => void;
  /** Whether keyboard navigation is enabled */
  enabled?: boolean;
}

export interface KeyboardNavigationState {
  /** Currently selected item ID */
  selectedId: string | null;
  /** Set selected item directly */
  setSelectedId: (id: string | null) => void;
  /** Move selection to next item */
  selectNext: () => void;
  /** Move selection to previous item */
  selectPrevious: () => void;
  /** Move selection to first item */
  selectFirst: () => void;
  /** Move selection to last item */
  selectLast: () => void;
  /** Get index of item in list */
  getIndex: (id: string) => number;
  /** Check if item is selected */
  isSelected: (id: string) => boolean;
}

export function useKeyboardNavigation({
  items,
  onSelect,
  onActivate,
  onComplete,
  onDelete,
  onAdd,
  enabled = true,
}: KeyboardNavigationOptions): KeyboardNavigationState {
  const [selectedId, setSelectedIdState] = useState<string | null>(null);

  // Sync selection with items list
  useEffect(() => {
    if (selectedId && !items.includes(selectedId)) {
      // Selected item was removed, select next available
      const index = items.findIndex((id) => id === selectedId);
      if (index === -1 && items.length > 0) {
        setSelectedIdState(items[0] ?? null);
      }
    }
  }, [items, selectedId]);

  const setSelectedId = useCallback(
    (id: string | null) => {
      setSelectedIdState(id);
      onSelect?.(id);
    },
    [onSelect],
  );

  const getIndex = useCallback((id: string) => items.indexOf(id), [items]);

  const isSelected = useCallback(
    (id: string) => selectedId === id,
    [selectedId],
  );

  const selectNext = useCallback(() => {
    if (items.length === 0) return;

    if (selectedId === null) {
      setSelectedId(items[0] ?? null);
      return;
    }

    const currentIndex = items.indexOf(selectedId);
    const nextIndex = Math.min(currentIndex + 1, items.length - 1);
    setSelectedId(items[nextIndex] ?? null);
  }, [items, selectedId, setSelectedId]);

  const selectPrevious = useCallback(() => {
    if (items.length === 0) return;

    if (selectedId === null) {
      setSelectedId(items[items.length - 1] ?? null);
      return;
    }

    const currentIndex = items.indexOf(selectedId);
    const prevIndex = Math.max(currentIndex - 1, 0);
    setSelectedId(items[prevIndex] ?? null);
  }, [items, selectedId, setSelectedId]);

  const selectFirst = useCallback(() => {
    if (items.length === 0) return;
    setSelectedId(items[0] ?? null);
  }, [items, setSelectedId]);

  const selectLast = useCallback(() => {
    if (items.length === 0) return;
    setSelectedId(items[items.length - 1] ?? null);
  }, [items, setSelectedId]);

  // Handle keyboard events
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture if focus is in an input/textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      // Don't capture if dialog/modal is open
      if (document.querySelector("[role='dialog']")) {
        return;
      }

      switch (e.key) {
        case "j":
          e.preventDefault();
          selectNext();
          break;
        case "k":
          e.preventDefault();
          selectPrevious();
          break;
        case "g":
          // Wait for second key
          break;
        case "G":
          e.preventDefault();
          selectLast();
          break;
        case "Enter":
        case "e":
          if (selectedId && onActivate) {
            e.preventDefault();
            onActivate(selectedId);
          }
          break;
        case "x":
          if (selectedId && onComplete) {
            e.preventDefault();
            onComplete(selectedId);
          }
          break;
        case "d":
          if (selectedId && onDelete) {
            e.preventDefault();
            onDelete(selectedId);
          }
          break;
        case "a":
          if (onAdd) {
            e.preventDefault();
            onAdd();
          }
          break;
        case "Escape":
          setSelectedId(null);
          break;
      }
    };

    // Handle 'gg' for going to first item
    let gPressed = false;
    let gTimeout: NodeJS.Timeout;

    const handleGKey = (e: KeyboardEvent) => {
      if (e.key === "g") {
        if (gPressed) {
          e.preventDefault();
          selectFirst();
          gPressed = false;
          clearTimeout(gTimeout);
        } else {
          gPressed = true;
          gTimeout = setTimeout(() => {
            gPressed = false;
          }, 500);
        }
      } else {
        gPressed = false;
        clearTimeout(gTimeout);
      }
    };

    const combinedHandler = (e: KeyboardEvent) => {
      handleGKey(e);
      handleKeyDown(e);
    };

    window.addEventListener("keydown", combinedHandler);
    return () => {
      window.removeEventListener("keydown", combinedHandler);
      clearTimeout(gTimeout);
    };
  }, [
    enabled,
    selectedId,
    selectNext,
    selectPrevious,
    selectFirst,
    selectLast,
    onActivate,
    onComplete,
    onDelete,
    onAdd,
    setSelectedId,
  ]);

  return {
    selectedId,
    setSelectedId,
    selectNext,
    selectPrevious,
    selectFirst,
    selectLast,
    getIndex,
    isSelected,
  };
}
