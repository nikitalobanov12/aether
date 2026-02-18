import { describe, expect, it } from "vitest";

import {
  resolveSidebarExpanded,
  serializeSidebarExpanded,
} from "~/components/layout/sidebar-state";

describe("resolveSidebarExpanded", () => {
  it("returns true only for persisted expanded value", () => {
    expect(resolveSidebarExpanded("1")).toBe(true);
    expect(resolveSidebarExpanded("0")).toBe(false);
    expect(resolveSidebarExpanded("anything-else")).toBe(false);
    expect(resolveSidebarExpanded(null)).toBe(false);
  });
});

describe("serializeSidebarExpanded", () => {
  it("stores expanded state as 1 or 0", () => {
    expect(serializeSidebarExpanded(true)).toBe("1");
    expect(serializeSidebarExpanded(false)).toBe("0");
  });
});
