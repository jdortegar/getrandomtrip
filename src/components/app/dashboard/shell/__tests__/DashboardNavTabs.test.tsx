import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { LayoutDashboard, LayoutList } from "lucide-react";
import { useParams, usePathname } from "next/navigation";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { DashboardNavTabs } from "@/components/app/dashboard/shell/DashboardNavTabs";
import type { DashboardNavTabItem } from "@/components/app/dashboard/config/dashboardNavTypes";

vi.mock("next/navigation", () => ({
  useParams: vi.fn(),
  usePathname: vi.fn(),
}));

const TABS: DashboardNavTabItem[] = [
  {
    exact: true,
    href: "/en/dashboard/traveler",
    icon: LayoutDashboard,
    label: "Home",
  },
  {
    href: "/en/dashboard/traveler/trips",
    icon: LayoutList,
    label: "Trips",
  },
];

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  vi.mocked(useParams).mockReturnValue({ locale: "en" });
  vi.mocked(usePathname).mockReturnValue("/en/design-system/components");
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

it("keeps every tab inactive when the gallery path matches none of them", () => {
  act(() => root.render(<DashboardNavTabs tabs={TABS} />));
  const links = container.querySelectorAll("a");
  expect([...links].some((tab) => tab.className.includes("bg-primary"))).toBe(
    false,
  );
});

it("marks the tab matching activeHref while the page path stays elsewhere", () => {
  act(() =>
    root.render(<DashboardNavTabs activeHref={TABS[0]!.href} tabs={TABS} />),
  );
  const links = container.querySelectorAll("a");
  expect(links[0]!.className).toContain("bg-primary");
  expect(links[1]!.className).not.toContain("bg-primary");
});
