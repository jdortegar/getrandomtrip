import { render } from "@react-email/render";
import { describe, expect, it } from "vitest";
import AdminNewBooking from "../AdminNewBooking";

const renderEmail = () =>
  render(
    <AdminNewBooking
      clientName="Ana"
      clientEmail="ana@example.test"
      tripRequestId="trip_123"
      tripType="solo"
      nights={2}
      originCity="Bogotá"
      originCountry="Colombia"
      level="essenza"
      amount={315}
      currency="USD"
    />,
  );

describe("AdminNewBooking", () => {
  it("links the CTA to the booked trip request, not the list", async () => {
    const html = await renderEmail();

    expect(html).toContain(
      'href="https://getrandomtrip.com/es/dashboard/admin/trip-requests/trip_123"',
    );
    expect(html).not.toContain(
      'href="https://getrandomtrip.com/es/dashboard/admin/trip-requests"',
    );
  });

  it("renders the client email as a teal mailto link", async () => {
    const html = (await renderEmail()).toLowerCase();

    expect(html).toMatch(
      /<a[^>]*href="mailto:ana@example.test"[^>]*color:#0f5c60/,
    );
  });
});
