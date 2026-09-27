import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import en from "@/dictionaries/en.json";
import { CountDown } from "../CountDown";

vi.mock("@/hooks/useDictionary", () => ({
  useDictionary: (select: (dict: typeof en) => unknown) => select(en),
}));
vi.mock("@/components/layout/Section", () => ({
  default: ({ children, title }: { children: ReactNode; title: string }) => (
    <section>
      <h2 dangerouslySetInnerHTML={{ __html: title }} />
      {children}
    </section>
  ),
}));
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  },
}));
vi.mock("../XsedNotifyForm", () => ({
  XsedNotifyForm: () => <div data-testid="notify" />,
}));
vi.mock("@/lib/xsed/window", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/xsed/window")>()),
  detectSupportedTimezone: () => "America/Mexico_City",
}));
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
const props = {
  campaignStartDate: "2026-09-27",
  copy: en.xsedPage.countdown,
  dropSlug: "23",
  initialWeekNumber: 1,
  locale: "en",
  soldCount: 3,
  totalSlots: 10,
};
const label = (week: number) =>
  en.xsedPage.countdown.titleHighlight.replace("{number}", String(week));
let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-04T02:59:59Z"));
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValue({
        ok: true,
        json: async () => ({
          displayedSold: 4,
          totalSlots: 10,
          isSoldOut: false,
        }),
      }),
  );
  container = document.createElement("div");
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("campaign countdown", () => {
  it("initially renders the server-provided week for hydration", () => {
    expect(
      renderToStaticMarkup(<CountDown {...props} initialWeekNumber={7} />),
    ).toContain(label(7));
  });

  it("advances at Buenos Aires midnight without reload despite a Mexican browser timezone", () => {
    act(() => root.render(<CountDown {...props} />));
    expect(container.querySelector("h2")?.textContent).toContain(label(1));
    act(() => vi.advanceTimersByTime(1000));
    expect(container.querySelector("h2")?.textContent).toContain(label(2));
    expect(container.querySelector('[data-testid="notify"]')).not.toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("still uses the country-local purchase window and original slug for sold-count polling", async () => {
    vi.setSystemTime(new Date("2026-09-27T21:00:00Z")); // BA open, Mexico still closed
    act(() => root.render(<CountDown {...props} />));
    expect(fetch).not.toHaveBeenCalled();
    vi.setSystemTime(new Date("2026-09-28T00:00:00Z")); // Mexico Sunday 18:00
    await act(async () => vi.advanceTimersByTime(1000));
    expect(fetch).toHaveBeenCalledWith("/api/xsed/drops/23/sold-count");
    expect(
      container
        .querySelector('[role="progressbar"]')
        ?.getAttribute("aria-valuenow"),
    ).toBe("4");
    expect(container.querySelector('a[href="/en/xsed/book"]')).not.toBeNull();
    expect(container.querySelector("h2")?.textContent).toContain(label(1));
  });
});
