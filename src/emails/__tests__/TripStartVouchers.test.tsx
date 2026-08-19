import { describe, it, expect } from "vitest";
import { render } from "@react-email/components";
import TripStartVouchers, { subjects } from "../TripStartVouchers";

const baseProps: {
  client: string;
  documents: { label: string; mimeType: string }[];
  skippedCount: number;
  startDate: Date;
  endDate: Date;
  nights: number;
  pax: number;
  tripType: string;
  tripId: string;
} = {
  client: "María García",
  documents: [
    { label: "Hotel Confirmation", mimeType: "application/pdf" },
    { label: "Flight Ticket", mimeType: "application/pdf" },
  ],
  skippedCount: 0,
  startDate: new Date("2026-08-17T00:00:00.000Z"),
  endDate: new Date("2026-08-21T00:00:00.000Z"),
  nights: 4,
  pax: 2,
  tripType: "couple",
  tripId: "trip-test-001",
};

describe("TripStartVouchers", () => {
  it("subjects exist for both locales and differ", () => {
    expect(subjects.es).toBeTruthy();
    expect(subjects.en).toBeTruthy();
    expect(subjects.es).not.toBe(subjects.en);
  });

  it("renders document labels and the dashboard CTA link (es)", async () => {
    const html = await render(<TripStartVouchers {...baseProps} locale="es" />);

    expect(html).toContain("Hotel Confirmation");
    expect(html).toContain("Flight Ticket");
    expect(html).toContain(`/es/dashboard/trips/${baseProps.tripId}/reveal`);
  });

  it("renders the skipped-document notice only when skippedCount > 0", async () => {
    const withoutSkips = await render(
      <TripStartVouchers {...baseProps} locale="en" />,
    );
    expect(withoutSkips).not.toContain("due to its size");

    const withSkips = await render(
      <TripStartVouchers {...baseProps} skippedCount={1} locale="en" />,
    );
    expect(withSkips).toContain("due to its size");
  });

  it("does not render a documents panel when there are zero attached labels", async () => {
    const html = await render(
      <TripStartVouchers {...baseProps} documents={[]} locale="en" />,
    );
    expect(html).not.toContain("Attached documents");
  });
});
