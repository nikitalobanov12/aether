export const SIDEBAR_EXPANDED_STORAGE_KEY = "aether-sidebar-expanded";

export function resolveSidebarExpanded(
  storedValue: string | null | undefined,
): boolean {
  return storedValue === "1";
}

export function serializeSidebarExpanded(isExpanded: boolean): "0" | "1" {
  return isExpanded ? "1" : "0";
}

export function getDesktopSidebarWidthClass(isExpanded: boolean): "w-16" | "w-72" {
  return isExpanded ? "w-72" : "w-16";
}

export function getSidebarLabelAnimationClass(isExpanded: boolean): string {
  return isExpanded
    ? "opacity-100 translate-x-0"
    : "opacity-0 -translate-x-1 pointer-events-none";
}
