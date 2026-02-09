"use client";

import { useServiceWorker } from "~/hooks/use-service-worker";

export function ServiceWorkerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useServiceWorker();
  return <>{children}</>;
}
