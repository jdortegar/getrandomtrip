import { describe, expect, it } from "vitest";
import {
  getDefaultDashboardPath,
  hasStrictRole,
} from "@/lib/auth/dashboardPaths";
import type { AppRole } from "@/lib/auth/roleAccess";

describe("dashboardPaths", () => {
  describe("hasStrictRole", () => {
    it("allows any known role for traveler segment", () => {
      expect(hasStrictRole(["traveler"], "traveler")).toBe(true);
      expect(hasStrictRole(["tripper"], "traveler")).toBe(true);
      expect(hasStrictRole(["admin"], "traveler")).toBe(true);
    });

    it("requires tripper membership for tripper segment", () => {
      expect(hasStrictRole(["tripper"], "tripper")).toBe(true);
      expect(hasStrictRole(["admin"], "tripper")).toBe(false);
      expect(hasStrictRole(["traveler"], "tripper")).toBe(false);
    });

    it("requires admin membership for admin segment", () => {
      expect(hasStrictRole(["admin"], "admin")).toBe(true);
      expect(hasStrictRole(["tripper"], "admin")).toBe(false);
    });
  });

  describe("getDefaultDashboardPath", () => {
    it("prioritizes admin over tripper over traveler", () => {
      const roles: AppRole[] = ["admin", "tripper", "traveler"];
      expect(getDefaultDashboardPath(roles, "es")).toBe("/dashboard/admin");
      expect(getDefaultDashboardPath(["tripper", "traveler"], "en")).toBe(
        "/en/dashboard/tripper",
      );
      expect(getDefaultDashboardPath(["traveler"], "es")).toBe(
        "/dashboard/traveler",
      );
    });
  });
});
