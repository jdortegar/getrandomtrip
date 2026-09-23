import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { useParams, usePathname } from "next/navigation";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DashboardPageHeading } from "@/components/app/dashboard/shell/DashboardPageHeading";
import en from "@/dictionaries/en.json";
import es from "@/dictionaries/es.json";

vi.mock("next/navigation", () => ({
  useParams: vi.fn(),
  usePathname: vi.fn(),
}));

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe.each([
  { locale: "en", dict: en, adminOverviewTitle: "Dashboard" },
  { locale: "es", dict: es, adminOverviewTitle: "Panel" },
])("DashboardPageHeading ($locale)", ({ locale, dict, adminOverviewTitle }) => {
  it("keeps the admin role in the eyebrow without repeating it in the overview title", () => {
    vi.mocked(useParams).mockReturnValue({ locale });
    vi.mocked(usePathname).mockReturnValue(`/${locale}/dashboard/admin`);

    act(() => root.render(<DashboardPageHeading role="admin" />));

    const title = container.querySelector("h1");

    expect(title?.previousElementSibling?.textContent).toBe("ADMIN");
    expect(title?.textContent).toBe(adminOverviewTitle);
    expect(title?.nextElementSibling?.textContent).toBe(
      dict.adminDashboard.pageHeadings.home.description,
    );
  });

  const cases = [
    {
      role: "admin" as const,
      label: "ADMIN",
      path: "/dashboard/admin",
      heading: dict.adminDashboard.pageHeadings.home,
    },
    {
      role: "admin" as const,
      label: "ADMIN",
      path: "/dashboard/admin/xsed/new",
      heading: dict.adminDashboard.pageHeadings.xsedNew,
    },
    {
      role: "traveler" as const,
      label: "TRAVELER",
      path: "/dashboard/traveler",
      heading: dict.travelerDashboard.pageHeadings.dashboard,
    },
    {
      role: "traveler" as const,
      label: "TRAVELER",
      path: "/dashboard/traveler/trips/trip-1",
      heading: dict.travelerDashboard.pageHeadings.trips,
    },
    {
      role: "tripper" as const,
      label: "TRIPPER",
      path: "/dashboard/tripper",
      heading: dict.tripperDashboard.pageHeadings.dashboard,
    },
    {
      role: "tripper" as const,
      label: "TRIPPER",
      path: "/dashboard/tripper/experiences/experience-1",
      heading: dict.tripperDashboard.pageHeadings.experiencesEdit,
    },
  ];

  it.each(cases)(
    "shows $label above the unchanged heading at $path",
    ({ role, label, path, heading }) => {
      vi.mocked(useParams).mockReturnValue({ locale });
      vi.mocked(usePathname).mockReturnValue(`/${locale}${path}`);

      act(() => root.render(<DashboardPageHeading role={role} />));

      const title = container.querySelector("h1");
      const roleLabel = title?.previousElementSibling;

      expect(roleLabel?.tagName).toBe("P");
      expect(roleLabel?.textContent).toBe(label);
      expect(title?.textContent).toBe(heading.title);
      expect(title?.nextElementSibling?.textContent).toBe(heading.description);
      expect(title?.parentElement?.classList.contains("text-center")).toBe(
        true,
      );
      expect(title?.parentElement?.children).toHaveLength(3);
      expect(container.querySelectorAll("h1")).toHaveLength(1);
    },
  );
});
