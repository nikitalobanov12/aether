"use client";

import { useEffect, useCallback, useState } from "react";
import { api } from "~/trpc/react";

type Theme = "light" | "dark" | "system";

const THEME_STORAGE_KEY = "aether-theme";

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function applyTheme(theme: Theme) {
  const resolvedTheme = theme === "system" ? getSystemTheme() : theme;
  const root = document.documentElement;

  if (resolvedTheme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }

  // Persist to localStorage for instant load on next visit
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // localStorage may be unavailable
  }
}

function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") {
      return stored;
    }
  } catch {
    // localStorage may be unavailable
  }
  return "dark";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  
  // Only run tRPC query after mounting to avoid SSR issues
  const { data: preferences } = api.userPreferences.get.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
    enabled: mounted, // Only run query after mount
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const theme: Theme = (preferences?.theme as Theme) ?? getStoredTheme();

  const handleSystemThemeChange = useCallback(() => {
    // Only re-apply if current theme is "system"
    const currentTheme = (preferences?.theme as Theme) ?? getStoredTheme();
    if (currentTheme === "system") {
      applyTheme("system");
    }
  }, [preferences?.theme]);

  // Apply theme whenever it changes
  useEffect(() => {
    if (mounted) {
      applyTheme(theme);
    }
  }, [theme, mounted]);

  // Listen for system theme changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    mediaQuery.addEventListener("change", handleSystemThemeChange);
    return () => {
      mediaQuery.removeEventListener("change", handleSystemThemeChange);
    };
  }, [handleSystemThemeChange]);

  return <>{children}</>;
}
