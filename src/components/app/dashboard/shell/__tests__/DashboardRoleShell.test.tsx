import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { useParams, usePathname } from "next/navigation";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DashboardRoleShell } from "@/components/app/dashboard/shell/DashboardRoleShell";

vi.mock("next/navigation", () => ({
  useParams: vi.fn(),
  usePathname: vi.fn(),
}));

vi.mock("@/components/app/dashboard/shell/DashboardUnreadDot", () => ({
  DashboardUnreadDot: () => null,
}));

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  vi.mocked(useParams).mockReturnValue({ locale: "en" });
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("DashboardRoleShell", () => {
  it.each(["admin", "traveler", "tripper"] as const)(
    "keeps the %s navigation inset inside its full-width scroll viewport",
    (role) => {
      vi.mocked(usePathname).mockReturnValue(`/en/dashboard/${role}`);

      act(() => root.render(<DashboardRoleShell role={role} />));

      const shell = container.querySelector(
        '[data-component="DashboardRoleShell"]',
      );
      const scroller = container.querySelector(
        '[data-component="DashboardNavTabs"]',
      );
      const track = scroller?.firstElementChild;

      expect(scroller?.parentElement).toBe(shell);
      expect(scroller?.classList.contains("overflow-x-auto")).toBe(true);
      expect(
        container.querySelector("h1")?.closest(".rt-container"),
      ).not.toBeNull();
      for (const className of [
        "min-w-full",
        "w-max",
        "justify-safe-center",
        "px-4",
        "sm:px-6",
        "lg:px-8",
      ]) {
        expect(track?.classList.contains(className)).toBe(true);
      }
    },
  );
});
