import { describe, it, expect } from "vitest";
import { render } from "@react-email/components";
import DestinationRevealed, { subjects } from "../DestinationRevealed";

const DESTINATION = "San Antonio de Areco";

const baseProps = {
  client: "María García",
  destination: DESTINATION,
  departureDate: "13 de agosto de 2026",
  returnDate: "15 de agosto de 2026",
  tripId: "trip-test-001",
} as const;

describe("DestinationRevealed — does not leak the destination", () => {
  it("subjects contain no destination name (es/en)", () => {
    expect(subjects.es).not.toContain(DESTINATION);
    expect(subjects.en).not.toContain(DESTINATION);
    expect(subjects.es).toBeTruthy();
    expect(subjects.en).toBeTruthy();
    expect(subjects.es).not.toBe(subjects.en);
  });

  it("rendered HTML (es) does not contain the destination anywhere, including the preview text", async () => {
    const html = await render(
      <DestinationRevealed {...baseProps} locale="es" />,
    );

    expect(html).not.toContain(DESTINATION);
  });

  it("rendered HTML (en) does not contain the destination anywhere, including the preview text", async () => {
    const html = await render(
      <DestinationRevealed {...baseProps} locale="en" />,
    );

    expect(html).not.toContain(DESTINATION);
  });

  it("still renders the departure/return dates and the reveal CTA link", async () => {
    const html = await render(
      <DestinationRevealed {...baseProps} locale="es" />,
    );

    expect(html).toContain(baseProps.departureDate);
    expect(html).toContain(baseProps.returnDate);
    expect(html).toContain(
      `/es/dashboard/trips/${baseProps.tripId}/reveal`,
    );
  });
});
