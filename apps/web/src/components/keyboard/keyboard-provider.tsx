"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { KeyboardHelp } from "./keyboard-help";

interface KeyboardContextValue {
  /** Show keyboard help dialog */
  showHelp: () => void;
  /** Hide keyboard help dialog */
  hideHelp: () => void;
  /** Whether help dialog is open */
  isHelpOpen: boolean;
}

const KeyboardContext = createContext<KeyboardContextValue | null>(null);

export function useKeyboard() {
  const context = useContext(KeyboardContext);
  if (!context) {
    throw new Error("useKeyboard must be used within a KeyboardProvider");
  }
  return context;
}

interface KeyboardProviderProps {
  children: ReactNode;
}

export function KeyboardProvider({ children }: KeyboardProviderProps) {
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const router = useRouter();

  const showHelp = useCallback(() => setIsHelpOpen(true), []);
  const hideHelp = useCallback(() => setIsHelpOpen(false), []);

  // Handle global keyboard shortcuts
  useEffect(() => {
    let gPressed = false;
    let gTimeout: NodeJS.Timeout;

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

      // Don't capture if dialog is open (except for Escape)
      const dialogOpen = document.querySelector("[role='dialog']");
      if (dialogOpen && e.key !== "Escape") {
        return;
      }

      // Handle ? for help
      if (e.key === "?" && e.shiftKey) {
        e.preventDefault();
        setIsHelpOpen((prev) => !prev);
        return;
      }

      // Handle g+key navigation
      if (e.key === "g" && !e.ctrlKey && !e.metaKey) {
        if (gPressed) {
          // gg - already handled in useKeyboardNavigation
          gPressed = false;
          clearTimeout(gTimeout);
        } else {
          gPressed = true;
          gTimeout = setTimeout(() => {
            gPressed = false;
          }, 500);
        }
        return;
      }

      // Handle second key after g
      if (gPressed) {
        gPressed = false;
        clearTimeout(gTimeout);

        switch (e.key) {
          case "t":
            e.preventDefault();
            router.push("/today");
            break;
          case "w":
            e.preventDefault();
            router.push("/week");
            break;
          case "i":
            e.preventDefault();
            router.push("/insights");
            break;
          case "c":
            e.preventDefault();
            router.push("/calendar");
            break;
          case "s":
            e.preventDefault();
            router.push("/settings");
            break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      clearTimeout(gTimeout);
    };
  }, [router]);

  return (
    <KeyboardContext.Provider value={{ showHelp, hideHelp, isHelpOpen }}>
      {children}
      <KeyboardHelp open={isHelpOpen} onOpenChange={setIsHelpOpen} />
    </KeyboardContext.Provider>
  );
}
