import { describe, expect, it } from "vitest";
import { buildAdminNavTabs } from "@/components/app/dashboard/config/adminNav";
import type { AdminDashboardDict } from "@/lib/types/dictionary";

const copy: AdminDashboardDict["nav"] = {
  dashboard: "Dashboard",
  tripRequests: "Trip Requests",
  users: "Users",
  experiences: "Experiences",
  payments: "Payments",
  reviews: "Reviews",
  waitlist: "Waitlist",
  xsed: "TGIS Drops",
  xsedNotifications: "TGIS Notifications",
  notifications: "Notifications",
};

describe("buildAdminNavTabs", () => {
  it("returns 10 tabs in the documented order", () => {
    const tabs = buildAdminNavTabs(copy, "es");
    expect(tabs).toHaveLength(10);
    expect(tabs.map((t) => t.label)).toEqual([
      copy.dashboard,
      copy.tripRequests,
      copy.users,
      copy.experiences,
      copy.payments,
      copy.reviews,
      copy.waitlist,
      copy.xsed,
      copy.xsedNotifications,
      copy.notifications,
    ]);
  });

  it("builds hrefs rooted at /dashboard/admin for the default locale", () => {
    const tabs = buildAdminNavTabs(copy, "es");
    expect(tabs.map((t) => t.href)).toEqual([
      "/dashboard/admin",
      "/dashboard/admin/trip-requests",
      "/dashboard/admin/users",
      "/dashboard/admin/experiences",
      "/dashboard/admin/payments",
      "/dashboard/admin/reviews",
      "/dashboard/admin/waitlist",
      "/dashboard/admin/xsed",
      "/dashboard/admin/xsed-notifications",
      "/dashboard/admin/notifications",
    ]);
  });

  it("prefixes hrefs with the locale for non-default locales", () => {
    const tabs = buildAdminNavTabs(copy, "en");
    expect(tabs[0]?.href).toBe("/en/dashboard/admin");
    expect(tabs[7]?.href).toBe("/en/dashboard/admin/xsed");
  });

  it("marks only the dashboard (root) tab as exact", () => {
    const tabs = buildAdminNavTabs(copy, "es");
    expect(tabs[0]?.exact).toBe(true);
    expect(tabs.slice(1).every((t) => t.exact !== true)).toBe(true);
  });

  it("shows an unread dot for the ADMIN audience on the notifications tab only", () => {
    const tabs = buildAdminNavTabs(copy, "es");
    const notificationsTab = tabs[tabs.length - 1];
    expect(notificationsTab?.showUnreadDot).toBe(true);
    expect(notificationsTab?.audience).toBe("ADMIN");
    expect(tabs.slice(0, -1).every((t) => !t.showUnreadDot)).toBe(true);
  });
});
