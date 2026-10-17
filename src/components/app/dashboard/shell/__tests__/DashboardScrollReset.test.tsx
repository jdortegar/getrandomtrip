import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { usePathname } from "next/navigation";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DashboardScrollReset } from "@/components/app/dashboard/shell/DashboardScrollReset";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
}));

let container: HTMLDivElement;
let root: Root;
let scrollTo: ReturnType<typeof vi.fn>;

function renderAt(pathname: string) {
  vi.mocked(usePathname).mockReturnValue(pathname);
  act(() => root.render(<DashboardScrollReset />));
}

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  scrollTo = vi.fn();
  vi.stubGlobal("scrollTo", scrollTo);
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

describe("DashboardScrollReset", () => {
  it("does not scroll on the initial render", () => {
    renderAt("/en/dashboard/admin");

    expect(scrollTo).not.toHaveBeenCalled();
  });

  it("scrolls to the top when the section changes", () => {
    renderAt("/en/dashboard/admin");
    renderAt("/en/dashboard/admin/payments");

    expect(scrollTo).toHaveBeenCalledTimes(1);
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: "instant" });
  });

  it("keeps the restored position on back/forward navigation", () => {
    renderAt("/en/dashboard/admin");
    renderAt("/en/dashboard/admin/payments");
    scrollTo.mockClear();

    act(() => {
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    renderAt("/en/dashboard/admin");

    expect(scrollTo).not.toHaveBeenCalled();
  });
});
