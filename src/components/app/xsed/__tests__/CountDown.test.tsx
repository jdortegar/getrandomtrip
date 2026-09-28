import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import en from "@/dictionaries/en.json";
import { formatTargetDate } from "@/lib/xsed/countdownTime";
import { detectSupportedTimezone } from "@/lib/xsed/window";
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
  detectSupportedTimezone: vi.fn(() => "America/Mexico_City"),
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
  vi.setSystemTime(new Date("2026-09-28T15:00:00Z"));
  vi.mocked(detectSupportedTimezone).mockReturnValue("America/Mexico_City");
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        country: "MX",
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

  it("shows edition 2 on the Monday after launch", () => {
    act(() => root.render(<CountDown {...props} />));
    expect(container.querySelector("h2")?.textContent).toContain(label(1));
    act(() => vi.advanceTimersByTime(0));
    expect(container.querySelector("h2")?.textContent).toContain(label(2));
    expect(container.querySelector('[data-testid="notify"]')).not.toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each([
    [
      "America/Argentina/Buenos_Aires",
      "2026-09-28T00:59:59Z",
      "2026-10-04T21:00:00Z",
      1,
    ],
    ["America/Mexico_City", "2026-09-28T03:59:59Z", "2026-10-05T00:00:00Z", 1],
    [
      "America/Argentina/Buenos_Aires",
      "2026-10-05T00:59:59Z",
      "2026-10-11T21:00:00Z",
      2,
    ],
  ])(
    "advances with the countdown at local close without reload in %s",
    async (tz, instant, nextTarget, edition) => {
      vi.mocked(detectSupportedTimezone).mockReturnValue(tz);
      vi.setSystemTime(new Date(instant));
      act(() =>
        root.render(<CountDown {...props} initialWeekNumber={edition} />),
      );
      await act(async () => vi.advanceTimersByTime(0));
      expect(container.querySelector("h2")?.textContent).toContain(
        label(edition),
      );
      expect(container.querySelector('a[href="/en/xsed/book"]')).not.toBeNull();

      act(() => vi.advanceTimersByTime(1000));
      expect(container.querySelector("h2")?.textContent).toContain(
        label(edition + 1),
      );
      expect(container.textContent).toContain(
        formatTargetDate(new Date(nextTarget), "en"),
      );
      expect(container.querySelector('[data-testid="notify"]')).not.toBeNull();
    },
  );

  it("keeps the current edition while Mexico is open after Buenos Aires has closed", async () => {
    vi.setSystemTime(new Date("2026-09-28T01:00:00Z"));
    act(() => root.render(<CountDown {...props} initialWeekNumber={2} />));
    expect(container.querySelector("h2")?.textContent).toContain(label(2));
    await act(async () => vi.advanceTimersByTime(0));
    expect(container.querySelector("h2")?.textContent).toContain(label(1));
    expect(container.querySelector('a[href="/en/xsed/book"]')).not.toBeNull();
  });

  it("refreshes both edition and target when an inactive tab misses the entire window", () => {
    vi.setSystemTime(new Date("2026-09-27T15:00:00Z"));
    act(() => root.render(<CountDown {...props} />));
    act(() => vi.advanceTimersByTime(0));
    expect(container.querySelector("h2")?.textContent).toContain(label(1));

    vi.setSystemTime(new Date("2026-09-28T15:00:00Z"));
    act(() => vi.advanceTimersByTime(1000));
    expect(container.querySelector("h2")?.textContent).toContain(label(2));
    expect(container.textContent).toContain(
      formatTargetDate(new Date("2026-10-05T00:00:00Z"), "en"),
    );
  });

  it("still uses the country-local purchase window and original slug for sold-count polling", async () => {
    vi.setSystemTime(new Date("2026-09-27T21:00:00Z")); // BA open, Mexico still closed
    act(() => root.render(<CountDown {...props} />));
    expect(fetch).not.toHaveBeenCalled();
    vi.setSystemTime(new Date("2026-09-28T00:00:00Z")); // Mexico Sunday 18:00
    await act(async () => vi.advanceTimersByTime(1000));
    expect(fetch).toHaveBeenCalledWith(
      "/api/xsed/drops/23/sold-count?country=MX",
      expect.objectContaining({ cache: "no-store" }),
    );
    expect(
      container
        .querySelector('[role="progressbar"]')
        ?.getAttribute("aria-valuenow"),
    ).toBe("4");
    expect(container.querySelector('a[href="/en/xsed/book"]')).not.toBeNull();
    expect(container.querySelector("h2")?.textContent).toContain(label(1));
  });
});

const response = (displayedSold = 4, country = "MX") => ({
  ok: true,
  json: async () => ({
    country,
    displayedSold,
    totalSlots: 10,
    isSoldOut: displayedSold === 10,
  }),
});
const progress = () =>
  container
    .querySelector('[role="progressbar"]')
    ?.getAttribute("aria-valuenow");

describe("country counter polling", () => {
  beforeEach(() => vi.setSystemTime(new Date("2026-09-28T01:00:00Z")));

  it.each(["America/Mexico_City", "America/Tijuana"])(
    "requests Mexico's counter from %s",
    async (tz) => {
      vi.mocked(detectSupportedTimezone).mockReturnValue(tz);
      act(() => root.render(<CountDown {...props} />));
      await act(async () => vi.advanceTimersByTime(0));
      expect(fetch).toHaveBeenCalledWith(
        "/api/xsed/drops/23/sold-count?country=MX",
        expect.anything(),
      );
      expect(progress()).toBe("4");
    },
  );

  it("does not poll Baja's shared counter before Baja's local opening", async () => {
    vi.setSystemTime(new Date("2026-09-28T00:00:00Z"));
    vi.mocked(detectSupportedTimezone).mockReturnValue("America/Tijuana");
    act(() => root.render(<CountDown {...props} />));
    await act(async () => vi.advanceTimersByTime(0));
    expect(fetch).not.toHaveBeenCalled();
    expect(progress()).toBeUndefined();
  });

  it("never substitutes Argentina inventory for an unknown timezone", async () => {
    vi.setSystemTime(new Date("2026-09-27T22:00:00Z"));
    vi.mocked(detectSupportedTimezone).mockReturnValue(null);
    act(() => root.render(<CountDown {...props} />));
    await act(async () => vi.advanceTimersByTime(0));
    expect(fetch).not.toHaveBeenCalled();
    expect(progress()).toBeUndefined();
  });

  it("hides global SSR inventory and prevents overlapping polls while loading", async () => {
    let resolve!: (value: Response) => void;
    vi.mocked(fetch).mockReturnValue(
      new Promise((done) => {
        resolve = done;
      }) as Promise<Response>,
    );
    act(() => root.render(<CountDown {...props} soldCount={10} />));
    await act(async () => vi.advanceTimersByTime(0));
    expect(progress()).toBeUndefined();
    await act(async () => vi.advanceTimersByTime(30_000));
    expect(fetch).toHaveBeenCalledTimes(1);
    await act(async () => resolve(response(2) as Response));
    expect(progress()).toBe("2");
  });

  it.each(["network", "http", "country", "shape"])(
    "retries a %s failure without exposing the global count",
    async (failure) => {
      const mock = vi.mocked(fetch);
      if (failure === "network")
        mock.mockRejectedValueOnce(new Error("offline"));
      else
        mock.mockResolvedValueOnce(
          (failure === "http"
            ? { ok: false }
            : failure === "country"
              ? response(10, "AR")
              : response(-1)) as Response,
        );
      act(() => root.render(<CountDown {...props} soldCount={10} />));
      await act(async () => vi.advanceTimersByTime(0));
      expect(progress()).toBeUndefined();
      await act(async () => vi.advanceTimersByTime(30_000));
      expect(progress()).toBe("4");
    },
  );

  it("ignores old response bodies after switching drops", async () => {
    let resolveBody!: (
      value: Awaited<ReturnType<ReturnType<typeof response>["json"]>>,
    ) => void;
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () =>
        new Promise((done) => {
          resolveBody = done;
        }),
    } as Response);
    act(() => root.render(<CountDown {...props} />));
    await act(async () => vi.advanceTimersByTime(0));
    const signal = vi.mocked(fetch).mock.calls[0][1]?.signal;
    await act(async () => root.render(<CountDown {...props} dropSlug="24" />));
    expect(signal?.aborted).toBe(true);
    expect(progress()).toBe("4");
    await act(async () => resolveBody(await response(10).json()));
    expect(progress()).toBe("4");
  });

  it("restarts after a sold-out week even when a suspended tab misses the closed phase", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(response(10) as Response);
    act(() => root.render(<CountDown {...props} />));
    await act(async () => vi.advanceTimersByTime(0));
    expect(progress()).toBe("10");
    vi.setSystemTime(new Date("2026-10-05T01:00:00Z"));
    await act(async () => vi.advanceTimersByTime(1000));
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(progress()).toBe("4");
    expect(container.querySelector("h2")?.textContent).toContain(label(2));
  });
});
