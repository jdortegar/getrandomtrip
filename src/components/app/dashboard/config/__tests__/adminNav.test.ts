import { describe, expect, it } from "vitest";
import { buildAdminNavTabs } from "@/components/app/dashboard/config/adminNav";
import type { AdminDashboardDict } from "@/lib/types/dictionary";

const copy: AdminDashboardDict["nav"] = {
  dashboard: "Dashboard",
  tripRequests: "Trip Requests",
  settings: "Settings",
  experiences: "Experiences",
  newExperience: "New Experience",
  payments: "Payments",
  reviews: "Reviews",
  xsed: "TGIS Drops",
  blog: "Blog",
  notifications: "Notifications",
};

describe("buildAdminNavTabs", () => {
  it("returns 10 tabs in the documented order", () => {
    const tabs = buildAdminNavTabs(copy, "es");
    expect(tabs).toHaveLength(10);
    expect(tabs.map((t) => t.label)).toEqual([
      copy.dashboard,
      copy.tripRequests,
      copy.experiences,
      copy.newExperience,
      copy.payments,
      copy.reviews,
      copy.xsed,
      copy.blog,
      copy.notifications,
      copy.settings,
    ]);
  });

  it("builds hrefs rooted at /dashboard/admin for the default locale", () => {
    const tabs = buildAdminNavTabs(copy, "es");
    expect(tabs.map((t) => t.href)).toEqual([
      "/dashboard/admin",
      "/dashboard/admin/trip-requests",
      "/dashboard/admin/experiences",
      "/dashboard/admin/experiences/new",
      "/dashboard/admin/payments",
      "/dashboard/admin/reviews",
      "/dashboard/admin/xsed",
      "/dashboard/admin/blog",
      "/dashboard/admin/notifications",
      "/dashboard/admin/settings",
    ]);
  });

  it("prefixes hrefs with the locale for non-default locales", () => {
    const tabs = buildAdminNavTabs(copy, "en");
    expect(tabs[0]?.href).toBe("/en/dashboard/admin");
    expect(tabs[6]?.href).toBe("/en/dashboard/admin/xsed");
    expect(tabs[7]?.href).toBe("/en/dashboard/admin/blog");
  });

  it("places the New Experience tab right after the Experiences list tab; list tab is exact, new tab is not", () => {
    const tabs = buildAdminNavTabs(copy, "es");
    const experiencesIndex = tabs.findIndex((t) => t.label === copy.experiences);
    const newExperienceIndex = tabs.findIndex(
      (t) => t.label === copy.newExperience,
    );
    expect(newExperienceIndex).toBe(experiencesIndex + 1);
    expect(tabs[experiencesIndex]?.exact).toBe(true);
    expect(tabs[newExperienceIndex]?.exact).not.toBe(true);
  });

  it("marks the dashboard (root) and experiences list tabs as exact, no others", () => {
    const tabs = buildAdminNavTabs(copy, "es");
    expect(tabs[0]?.exact).toBe(true);
    const experiencesIndex = tabs.findIndex((t) => t.label === copy.experiences);
    expect(tabs[experiencesIndex]?.exact).toBe(true);
    expect(
      tabs
        .filter((_, i) => i !== 0 && i !== experiencesIndex)
        .every((t) => t.exact !== true),
    ).toBe(true);
  });

  it("shows an unread dot for the ADMIN audience on the notifications tab only", () => {
    const tabs = buildAdminNavTabs(copy, "es");
    const notificationsTab = tabs[tabs.length - 2];
    expect(notificationsTab?.showUnreadDot).toBe(true);
    expect(notificationsTab?.audience).toBe("ADMIN");
    expect(
      tabs.filter((t) => t !== notificationsTab).every((t) => !t.showUnreadDot),
    ).toBe(true);
  });
});
