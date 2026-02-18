export const SIDEBAR_EXPANDED_STORAGE_KEY = "aether-sidebar-expanded";

export function resolveSidebarExpanded(
  storedValue: string | null | undefined,
): boolean {
  return storedValue === "1";
}

export function serializeSidebarExpanded(isExpanded: boolean): "0" | "1" {
  return isExpanded ? "1" : "0";
}
