import { render } from "@react-email/render";
import { describe, expect, it } from "vitest";
import BookingConfirmed from "../BookingConfirmed";

const renderEmail = (locale: "es" | "en") =>
  render(
    <BookingConfirmed
      client="Ana"
      tripRequestId="trip_123"
      tripType="solo"
      nights={2}
      locale={locale}
    />,
  );

describe("BookingConfirmed", () => {
  it.each(["es", "en"] as const)(
    "links the %s CTA to the booked trip, not the dashboard home",
    async (locale) => {
      const html = await renderEmail(locale);

      expect(html).toContain(
        `href="https://getrandomtrip.com/${locale}/dashboard/trips/trip_123"`,
      );
      expect(html).not.toContain(
        `href="https://getrandomtrip.com/${locale}/dashboard"`,
      );
    },
  );
});
