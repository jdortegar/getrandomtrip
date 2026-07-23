import { describe, expect, it } from "vitest";
import { resolveAdminPageHeading } from "@/components/app/dashboard/config/adminHeadings";
import type { AdminDashboardDict } from "@/lib/types/dictionary";

const headings: AdminDashboardDict["pageHeadings"] = {
  home: { title: "Home", description: "Home desc" },
  tripRequests: { title: "Trip Requests", description: "TR desc" },
  settings: { title: "Settings", description: "Settings desc" },
  experiences: { title: "Experiences", description: "Exp desc" },
  experiencesNew: { title: "New Experience", description: "New exp desc" },
  experiencesDetail: { title: "Experience Detail", description: "Detail desc" },
  payments: { title: "Payments", description: "Payments desc" },
  reviews: { title: "Reviews", description: "Reviews desc" },
  xsedNew: { title: "New Drop", description: "New drop desc" },
  notifications: { title: "Notifications", description: "Notifications desc" },
  blog: { title: "Blog", description: "Blog desc" },
  blogDetail: { title: "Post Review", description: "Post review desc" },
};

describe("resolveAdminPageHeading", () => {
  it("resolves the home heading at the root path", () => {
    expect(resolveAdminPageHeading("/dashboard/admin", headings)).toEqual(
      headings.home,
    );
  });

  it("resolves trip-requests", () => {
    expect(
      resolveAdminPageHeading("/dashboard/admin/trip-requests", headings),
    ).toEqual(headings.tripRequests);
  });

  it("resolves settings", () => {
    expect(
      resolveAdminPageHeading("/dashboard/admin/settings", headings),
    ).toEqual(headings.settings);
  });

  it("resolves the experiences list but not the review detail", () => {
    expect(
      resolveAdminPageHeading("/dashboard/admin/experiences", headings),
    ).toEqual(headings.experiences);
  });

  it("resolves the experience review detail heading for a nested id", () => {
    expect(
      resolveAdminPageHeading("/dashboard/admin/experiences/abc123", headings),
    ).toEqual(headings.experiencesDetail);
  });

  it("resolves the New Experience heading, distinct from the review detail heading", () => {
    expect(
      resolveAdminPageHeading("/dashboard/admin/experiences/new", headings),
    ).toEqual(headings.experiencesNew);
  });

  it("resolves payments and reviews", () => {
    expect(resolveAdminPageHeading("/dashboard/admin/payments", headings)).toEqual(
      headings.payments,
    );
    expect(resolveAdminPageHeading("/dashboard/admin/reviews", headings)).toEqual(
      headings.reviews,
    );
  });

  it("resolves the xsed wizard routes to xsedNew", () => {
    expect(
      resolveAdminPageHeading("/dashboard/admin/xsed/new", headings),
    ).toEqual(headings.xsedNew);
    expect(
      resolveAdminPageHeading("/dashboard/admin/xsed/abc123/edit", headings),
    ).toEqual(headings.xsedNew);
  });

  it("resolves the personal notifications inbox, distinct from xsed-notifications", () => {
    expect(
      resolveAdminPageHeading("/dashboard/admin/notifications", headings),
    ).toEqual(headings.notifications);
  });

  it("falls back to home for unknown paths", () => {
    expect(
      resolveAdminPageHeading("/dashboard/admin/packages", headings),
    ).toEqual(headings.home);
  });

  it("resolves the blog list but not the review detail", () => {
    expect(
      resolveAdminPageHeading("/dashboard/admin/blog", headings),
    ).toEqual(headings.blog);
  });

  it("resolves the blog review detail heading for a nested id", () => {
    expect(
      resolveAdminPageHeading("/dashboard/admin/blog/abc123", headings),
    ).toEqual(headings.blogDetail);
  });
});
