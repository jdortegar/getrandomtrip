import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { RecentBookingsList } from "../RecentBookingsList";
import type { RecentBooking } from "@/types/tripper";

const copy = {
  title: "Recent Bookings",
  viewAll: "View all",
  empty: "None",
  excuseLabel: "Excuse",
  confirmed: "Confirmed",
} as unknown as Parameters<typeof RecentBookingsList>[0]["copy"];

function booking(overrides: Partial<RecentBooking>): RecentBooking {
  return {
    id: "b1",
    clientName: "Ana",
    clientEmail: "ana@example.com",
    experienceName: "Beach trip",
    date: "2026-01-02T00:00:00.000Z",
    amount: 100,
    status: "confirmed",
    paymentStatus: "APPROVED",
    excuseKey: null,
    refineDetails: [],
    travelerType: "couple",
    ...overrides,
  };
}

function render(b: RecentBooking) {
  return renderToStaticMarkup(
    <RecentBookingsList
      bookings={[b]}
      copy={copy}
      localizedExcuses={[{ key: "relax-arena", title: "Relax & Sand" }]}
    />,
  );
}

describe("RecentBookingsList excuse line", () => {
  it("shows the excuse in both mobile and desktop layouts", () => {
    const html = render(booking({ excuseKey: "relax-arena" }));
    expect(html.match(/Excuse: Relax &amp; Sand/g)).toHaveLength(2);
  });

  it("shows nothing for legacy trips without an excuse", () => {
    expect(render(booking({}))).not.toContain("Excuse:");
  });
});
