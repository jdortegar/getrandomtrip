import { describe, expect, it } from "vitest";
import en from "@/dictionaries/en.json";
import es from "@/dictionaries/es.json";
import { dashboardPageMetadata } from "../pageMetadata";

const params = (locale: string) => ({ params: Promise.resolve({ locale }) });

describe("dashboardPageMetadata", () => {
  it("uses the tripper heading for the route as the page title", async () => {
    const metadata = await dashboardPageMetadata("/dashboard/tripper/blog")(params("en"));
    expect(metadata).toEqual({
      title: en.tripperDashboard.pageHeadings.blogs.title,
      description: en.tripperDashboard.pageHeadings.blogs.description,
    });
  });

  it("resolves admin and traveler routes with their own headings", async () => {
    const admin = await dashboardPageMetadata("/dashboard/admin/payments")(params("es"));
    const traveler = await dashboardPageMetadata("/dashboard/traveler/trips")(params("es"));
    expect(admin.title).toBe(es.adminDashboard.pageHeadings.payments.title);
    expect(traveler.title).toBe(es.travelerDashboard.pageHeadings.trips.title);
  });

  it("gives different routes different titles", async () => {
    const a = await dashboardPageMetadata("/dashboard/tripper/blog")(params("en"));
    const b = await dashboardPageMetadata("/dashboard/tripper/experiences")(params("en"));
    expect(a.title).not.toBe(b.title);
  });

  it("falls back to the default locale for an unknown locale", async () => {
    const metadata = await dashboardPageMetadata("/dashboard/tripper/blog")(params("xx"));
    expect(metadata.title).toBe(es.tripperDashboard.pageHeadings.blogs.title);
  });
});
