import { describe, expect, it } from "vitest";
import {
  getDefaultDashboardPath,
  hasStrictRole,
} from "@/lib/auth/dashboardPaths";
import type { AppRole } from "@/lib/auth/roleAccess";

describe("dashboardPaths", () => {
  describe("hasStrictRole", () => {
    it("allows any known role for client segment", () => {
      expect(hasStrictRole(["client"], "client")).toBe(true);
      expect(hasStrictRole(["tripper"], "client")).toBe(true);
      expect(hasStrictRole(["admin"], "client")).toBe(true);
    });

    it("requires tripper membership for tripper segment", () => {
      expect(hasStrictRole(["tripper"], "tripper")).toBe(true);
      expect(hasStrictRole(["admin"], "tripper")).toBe(false);
      expect(hasStrictRole(["client"], "tripper")).toBe(false);
    });

    it("requires admin membership for admin segment", () => {
      expect(hasStrictRole(["admin"], "admin")).toBe(true);
      expect(hasStrictRole(["tripper"], "admin")).toBe(false);
    });
  });

  describe("getDefaultDashboardPath", () => {
    it("prioritizes admin over tripper over client", () => {
      const roles: AppRole[] = ["admin", "tripper", "client"];
      expect(getDefaultDashboardPath(roles, "es")).toBe("/dashboard/admin");
      expect(getDefaultDashboardPath(["tripper", "client"], "en")).toBe(
        "/en/dashboard/tripper",
      );
      expect(getDefaultDashboardPath(["client"], "es")).toBe(
        "/dashboard/client",
      );
    });
  });
});
