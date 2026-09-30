import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import DestinationAssignmentReminder from "../DestinationAssignmentReminder";

const revealAt = "2026-10-08 12:00 UTC";

describe("reveal-relative assignment reminder copy", () => {
  it.each([72, 48, 24] as const)(
    "uses the %i-hour reveal milestone in both languages",
    (milestoneHours) => {
      const english = renderToStaticMarkup(
        <DestinationAssignmentReminder
          adminName="Alex"
          clientName="Ana"
          locale="en"
          milestoneHours={milestoneHours}
          revealAt={revealAt}
          tripId="trip"
        />,
      );
      const spanish = renderToStaticMarkup(
        <DestinationAssignmentReminder
          adminName="Alex"
          clientName="Ana"
          locale="es"
          milestoneHours={milestoneHours}
          revealAt={revealAt}
          tripId="trip"
        />,
      );
      expect(english).toContain(`within ${milestoneHours} hours`);
      expect(english).toContain("destination reveal");
      expect(spanish).toContain(`en las próximas ${milestoneHours} horas`);
      expect(spanish).toContain("revelación del destino");
      for (const html of [english, spanish]) {
        expect(html).toContain(revealAt);
        expect(html).toContain("Ana");
        expect(html).toContain("/dashboard/admin/trip-requests/trip");
        expect(html).not.toContain("departs in");
        expect(html).not.toContain("sale en menos");
      }
    },
  );
});
