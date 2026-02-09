"use client";

import { useEffect } from "react";

export function useServiceWorker() {
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      process.env.NODE_ENV === "production"
    ) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          // Check for updates periodically
          setInterval(
            () => {
              registration.update().catch(() => {
                // Silently fail update checks
              });
            },
            60 * 60 * 1000,
          ); // Check every hour
        })
        .catch(() => {
          // Service worker registration failed
        });
    }
  }, []);
}
