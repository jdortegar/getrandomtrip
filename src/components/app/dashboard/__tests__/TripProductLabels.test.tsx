import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import en from "@/dictionaries/en.json";
import es from "@/dictionaries/es.json";
import { mapTripFromApi, type Payment } from "@/lib/utils/trips";
import { RecentPaymentsTable } from "../RecentPaymentsTable";
import { TravelerReviewsPageClient } from "../traveler/TravelerReviewsPageClient";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

let root: Root | undefined;
let container: HTMLDivElement | undefined;

afterEach(() => {
  act(() => root?.unmount());
  root = undefined;
  container?.remove();
  vi.unstubAllGlobals();
});

describe.each([
  ["en", en],
  ["es", es],
] as const)("trip product text in %s", (locale, dictionary) => {
  it.each(["trip", "tripRequest"] as const)(
    "capitalizes payment %s labels without changing the source or badge styling",
    (key) => {
      const trip = { type: "xsed", level: "Xsed", startDate: "2026-01-01" };
      const payment: Payment = {
        amount: 250,
        createdAt: "2026-01-01",
        id: "payment-1",
        status: "APPROVED",
        [key]: trip,
      };
      const html = renderToStaticMarkup(
        <RecentPaymentsTable copy={dictionary.dashboard} payments={[payment]} />,
      );
      expect(html).toContain("XSED • XSED");
      expect(html).not.toContain("bg-xsed");
      expect(trip).toMatchObject({ type: "xsed", level: "Xsed" });

      trip.type = "couple";
      trip.level = "essenza";
      expect(
        renderToStaticMarkup(
          <RecentPaymentsTable copy={dictionary.dashboard} payments={[payment]} />,
        ),
      ).toContain("couple • essenza");
    },
  );

  it("capitalizes review type/level text without changing mapped IDs or URLs", async () => {
    const raw = {
      endDate: "2026-01-01",
      id: "trip-1",
      level: "xsed",
      reviewToken: "xsed-review-token",
      status: "COMPLETED",
      type: "xsed",
    };
    const http = vi.fn().mockResolvedValue({ json: async () => ({ trips: [raw] }) });
    vi.stubGlobal("fetch", http);
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    await act(async () => {
      root!.render(
        <TravelerReviewsPageClient
          copy={dictionary.travelerDashboard.reviews}
          locale={locale}
        />,
      );
    });

    expect(container.querySelector("li p")?.textContent).toBe("XSED · XSED");
    expect(container.querySelector(".bg-xsed")).toBeNull();
    expect(container.querySelector("a")?.getAttribute("href")).toBe(
      `/${locale}/review/xsed-review-token`,
    );
    expect(http).toHaveBeenCalledWith("/api/trips");
    expect(mapTripFromApi(raw)).toMatchObject({ level: "xsed", type: "xsed" });
  });
});
